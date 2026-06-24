import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

// Initialize Firebase Admin lazily
let db: any = null;

function getDb() {
  if (!db) {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));

    if (!admin.apps.length) {
      admin.initializeApp({
        projectId: firebaseConfig.projectId,
      });
    }
    const app = admin.apps[0];
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
  return db;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Push Notification Endpoint
  app.post("/api/send-push", async (req, res) => {
    try {
      const { toUserId, title, body, data } = req.body;
      
      if (!toUserId) {
        return res.status(400).json({ error: "toUserId is required" });
      }

      let fcmToken = req.body.fcmToken;

      if (!fcmToken) {
        try {
          const firestore = getDb();
          // 1. Get User's FCM tokens from Firestore profile
          const userDoc = await firestore.collection("profiles").doc(toUserId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            fcmToken = userData?.fcmToken;
          }
        } catch (dbErr: any) {
          console.warn(`Could not retrieve fcmToken from Firestore, bypassing Firestore lookup: ${dbErr?.message || dbErr}`);
        }
      }

      if (!fcmToken) {
        console.log(`No FCM token found for user ${toUserId}`);
        return res.status(200).json({ status: "ignored", reason: "no_token" });
      }

      // 2. Send the message
      const message = {
        notification: {
          title: title || "New Notification",
          body: body || "You have a new notification",
        },
        data: data || {},
        token: fcmToken,
        android: {
          priority: 'high' as const,
          notification: {
            channelId: 'high_priority',
            sound: 'default'
          }
        },
        webpush: {
          headers: {
            Urgency: 'high'
          },
          fcmOptions: {
            link: data?.link || "/"
          },
          notification: {
            body: body || "You have a new notification",
            icon: '/logo.png',
            badge: '/logo.png',
            tag: 'new-notification',
            renotify: true,
            requireInteraction: true,
          }
        }
      };

      const response = await admin.messaging().send(message);
      console.log("Push sent successfully:", response);

      res.status(200).json({ status: "success", messageId: response });
    } catch (error) {
      console.error("Error sending push notification:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Universal S2S Postback & CPA Conversion Tracking Endpoint (Clickdilla, Adsterra, CPAGrip, etc.)
  const handlePostback = async (req: any, res: any) => {
    try {
      const query = { ...req.query, ...req.body };
      const uid = query.uid || query.subid || query.user_id || query.s1 || query.aff_sub || query.pub_sub;
      const payoutRaw = query.payout || query.amount || query.reward || query.commission || query.price || "0.10";
      const status = query.status || "1";
      const txid = query.txid || query.click_id || query.conversion_id || query.id || `pb_${Date.now()}`;

      console.log("Received Postback Conversion Notification:", query);

      if (!uid || uid.includes("{") || uid === "undefined" || uid === "null") {
        return res.status(400).send("INVALID_USER_ID");
      }

      // Check if status indicates rejection or chargeback
      if (status.toString() === "0" || status.toString() === "2" || status.toLowerCase() === "rejected" || status.toLowerCase() === "declined") {
        console.log(`Postback ignored due to non-approved status: ${status} for user: ${uid}`);
        return res.status(200).send("IGNORED_STATUS");
      }

      const rewardAmount = parseFloat(payoutRaw) || 0.10;

      try {
        const firestore = getDb();
        const userRef = firestore.collection("profiles").doc(uid);
        const userSnap = await userRef.get();

        if (userSnap.exists) {
          await userRef.update({
            earningsBalance: admin.firestore.FieldValue.increment(rewardAmount),
            totalEarned: admin.firestore.FieldValue.increment(rewardAmount),
          });
          console.log(`Credited ${rewardAmount} BDT to uid ${uid} via Postback [txid: ${txid}]`);
        } else {
          console.warn(`User profile doc not found for uid ${uid}.`);
        }

        // Record in postback_logs collection
        await firestore.collection("postback_logs").doc(txid.toString()).set({
          uid,
          amount: rewardAmount,
          rawParams: query,
          createdAt: new Date().toISOString(),
          status: "credited"
        }, { merge: true });

      } catch (dbErr: any) {
        console.warn("Database error during postback handling:", dbErr);
      }

      // Ad networks typically require a plain 'OK' or '1' response
      return res.status(200).send("OK");
    } catch (err: any) {
      console.error("Postback handler fatal error:", err);
      return res.status(500).send("ERROR");
    }
  };

  app.get("/api/postback", handlePostback);
  app.post("/api/postback", handlePostback);

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Dynamic AdSense ads.txt serving
  app.get("/ads.txt", async (req, res) => {
    try {
      const firestore = getDb();
      const adsenseDoc = await firestore.collection("settings").doc("adsense").get();
      let pubId = "pub-0000000000000000";
      
      if (adsenseDoc.exists) {
        const data = adsenseDoc.data();
        if (data?.pubId && data.pubId.trim() !== "") {
          let cleanId = data.pubId.trim();
          // Extract numbers if they pasted full 'ca-pub-...' or 'pub-...'
          if (cleanId.startsWith("ca-pub-")) {
            cleanId = cleanId.replace("ca-pub-", "pub-");
          } else if (!cleanId.startsWith("pub-")) {
            if (/^\d+$/.test(cleanId)) {
              cleanId = "pub-" + cleanId;
            } else {
              cleanId = cleanId; // keep as-is if already formatted
            }
          }
          pubId = cleanId;
        }
      }
      
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.send(`# ==========================================================================\n# Google AdSense authorized digital sellers association declaration (ads.txt)\n# Dynamically generated based on admin configurations\n# ==========================================================================\n\ngoogle.com, ${pubId}, DIRECT, f08c47fec0942fa0\n`);
    } catch (error) {
      console.error("Error generating ads.txt dynamically:", error);
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.send("google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0\n");
    }
  });

  // Vite middleware for development
  const isProduction = process.env.NODE_ENV === "production" || process.env.VITE_PROD === "true";

  if (!isProduction) {
    console.log("Starting in development mode with Vite middleware");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in production mode serving static files from dist/");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      // In Express 4, '*' is correct. In Express 5, use '*all'
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
