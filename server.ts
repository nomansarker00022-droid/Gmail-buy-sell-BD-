import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import admin from "firebase-admin";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin lazily
let db: admin.firestore.Firestore | null = null;

function getDb() {
  if (!db) {
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    db = admin.firestore();
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

      const firestore = getDb();
      // 1. Get User's FCM tokens from Firestore profile
      const userDoc = await firestore.collection("profiles").doc(toUserId).get();
      if (!userDoc.exists) {
        return res.status(404).json({ error: "User profile not found" });
      }

      const userData = userDoc.data();
      const fcmToken = userData?.fcmToken;

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

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
