/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, Lock, Eye, EyeOff, ArrowRight, UserPlus, 
  ShoppingBag, LogOut, Search, Plus, TrendingUp,
  ShieldCheck, Smartphone, CheckCircle2, AlertCircle, Phone,
  Store, Wallet, Send, Menu, X, ChevronDown, ChevronUp,
  History, Headphones, Star, User as UserIcon, Home, CreditCard,
  BadgeCheck, MessageSquare, Gift, Bell, ArrowLeft, RefreshCw, Edit,
  MessageCircle, Crown, Filter, Layers, Clock, Calendar, Trophy, Users, Zap, Activity,
  ShoppingCart, Shield, Trash2, CheckCircle, Check, CheckSquare, Copy, Globe, Info, Tag,
  PlusSquare, Megaphone, Save, Share2, Camera
} from 'lucide-react';
import emailjs from '@emailjs/browser';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc, 
  query, 
  where,
  onSnapshot,
  orderBy,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  increment,
  limit,
  writeBatch,
  getCountFromServer
} from 'firebase/firestore';
import { db, auth, messaging, handleFirestoreError, OperationType } from './lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';

// System Admins
const SYSTEM_ADMINS = ['ashrafulislambhuiyan8@gmail.com'];

const DEFAULT_GMAIL_PRICES: Record<string, { seller: string, buyer: string }> = {
  "Full Fresh New": { seller: "10", buyer: "16" },
  "Full Fresh old Gmail": { seller: "15", buyer: "21" },
  "used(ফেসবুক খুলা নেই)": { seller: "10", buyer: "15" },
  "Used Gmail (ব্যবহৃত মেইল)": { seller: "8", buyer: "10" },
  "Aged 2018 (পুরাতন ২০১৮)": { seller: "15", buyer: "20" },
  "Facebook mail (ফেসবুক মেইল)": { seller: "10", buyer: "18" },
  "2fa old Gmail (2FA যুক্ত পুরাতন)": { seller: "18", buyer: "25" },
  "old Gmail (পুরাতন মেইল)": { seller: "16", buyer: "22" },
  "৩-৪ মাস old (৩-৪ মাসের পুরাতন)": { seller: "12", buyer: "18" }
};

export default function App() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewForm, setReviewForm] = useState({ text: '', photo: '' });
  const reviewFileInputRef = useRef<HTMLInputElement>(null);

  const handleReviewPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image size should be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 600;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        setReviewForm(prev => ({ ...prev, photo: canvas.toDataURL('image/jpeg', 0.7) }));
      };
      img.src = base64String;
    };
    reader.readAsDataURL(file);
  };

  const handleReviewSubmit = async () => {
    if (!user) {
      alert("Please login to post a review");
      return;
    }
    if (!reviewForm.text.trim() && !reviewForm.photo) {
      alert("Please add text or a photo!");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        userId: user.uid,
        userName: userProfile?.displayName || user.displayName || user.email?.split('@')[0] || 'User',
        userPhoto: userProfile?.photoURL || user.photoURL || '',
        text: reviewForm.text,
        photo: reviewForm.photo,
        createdAt: serverTimestamp()
      });
      setReviewForm({ text: '', photo: '' });
      if (reviewFileInputRef.current) reviewFileInputRef.current.value = '';
    } catch (err: any) {
      console.error(err);
      alert("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribeReviews = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      console.warn('Reviews listener failed:', err);
    });
    return () => unsubscribeReviews();
  }, []);

  const [view, setView] = useState<'login' | 'register' | 'forgot' | 'marketplace' | 'seller-center' | 'gmail-market' | 'admin' | 'profile' | 'transactions'>('login');
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // New states for Profile & Reports
  const [showProfileUpdate, setShowProfileUpdate] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    age: '',
    address: '',
    displayName: '',
    phone: '',
    bkashNumber: '',
    nagadNumber: '',
    photoURL: ''
  });
  const [showReportModal, setShowReportModal] = useState<{show: boolean, listingId: string, purchaseId: string, sellerId: string} | null>(null);
  const [reportMessage, setReportMessage] = useState('');
  const [myReports, setMyReports] = useState<any[]>([]);
  const [sellerReports, setSellerReports] = useState<any[]>([]);
  
  // Gmail Listings State
  const [sellerListings, setSellerListings] = useState<any[]>([]);
  const [allListings, setAllListings] = useState<any[]>([]);
  const [allPurchases, setAllPurchases] = useState<any[]>([]);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [allWithdrawals, setAllWithdrawals] = useState<any[]>([]);
  const [headline, setHeadline] = useState({ text: '★ স্বাগতম Gmail Buy & Sell BD-এ! ★ বিশ্বের সেরা এবং দ্রুততম জিমেইল মার্কেটপ্লেস ★', speed: 25 });
  const [pendingHeadline, setPendingHeadline] = useState('');
  const [pendingSpeed, setPendingSpeed] = useState(25);
  const [showSellModal, setShowSellModal] = useState(false);
  const [sellListingToEdit, setSellListingToEdit] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<{show: boolean, price: number, listingId?: string}>({ show: false, price: 0 });
  const [paymentForm, setPaymentForm] = useState({ senderNumber: '', trxId: '', method: 'bkash' as 'bkash' | 'nagad' });
  const [isVerifying, setIsVerifying] = useState(false);
  const [purchasedCreds, setPurchasedCreds] = useState<{gmail: string, pass: string, recovery?: string, twoFactor?: string} | null>(null);
  const [isBulkConfirmModalOpen, setIsBulkConfirmModalOpen] = useState(false);
  const [bulkPurchasedCreds, setBulkPurchasedCreds] = useState<{id?: string, gmail: string, pass: string, recovery?: string, twoFactor?: string}[] | null>(null);
  const [sellForm, setSellForm] = useState({
    email: '',
    password: '',
    recoveryEmail: '',
    twoFactor: '',
    bkashNumber: '',
    nagadNumber: '',
    type: 'Full Fresh New',
    price: '10',
    description: ''
  });
  const [selectedListings, setSelectedListings] = useState<string[]>([]);
  const [adminSelectedListings, setAdminSelectedListings] = useState<string[]>([]);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkEditForm, setBulkEditForm] = useState({
    price: '',
    description: '',
    status: '',
    type: 'Full Fresh New'
  });
  const [isBulkBuyMode, setIsBulkBuyMode] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, any>>({});
  const [sellerSearchQuery, setSellerSearchQuery] = useState('');
  const [marketSearchQuery, setMarketSearchQuery] = useState('');
  const [globalSoldCount, setGlobalSoldCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [liveSales, setLiveSales] = useState<any[]>([]);
  const [todaySold, setTodaySold] = useState<any[]>([]);
  const [todaySoldCount, setTodaySoldCount] = useState(0);
  const [topSellers, setTopSellers] = useState<any[]>([]);
  const [topBuyers, setTopBuyers] = useState<any[]>([]);
  const [showRankModal, setShowRankModal] = useState<{ show: boolean; type: 'seller' | 'buyer' }>({ show: false, type: 'seller' });
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [noticeText, setNoticeText] = useState("Securely manage, buy, and sell verified Gmail accounts with Bangladesh's most trusted and fastest marketplace.");
  const [pendingNotice, setPendingNotice] = useState("");
  const [isAdminOnlineState, setIsAdminOnlineState] = useState(false);
  const [showReferModal, setShowReferModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [welcomeForm, setWelcomeForm] = useState({
    firstName: '',
    lastName: '',
    age: '',
    address: '',
    photoURL: ''
  });
  const profileFileInputRef = useRef<HTMLInputElement>(null);
  const welcomeFileInputRef = useRef<HTMLInputElement>(null);

  const handleWelcomePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Source image size should be less than 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        const compressedBase64 = await new Promise<string>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const MAX_SIZE = 400;
            if (width > height) {
              if (width > MAX_SIZE) {
                height *= MAX_SIZE / width;
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width *= MAX_SIZE / height;
                height = MAX_SIZE;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.6));
          };
          img.onerror = reject;
          img.src = base64String;
        });
        setWelcomeForm(prev => ({ ...prev, photoURL: compressedBase64 }));
      } catch (err: any) {
        console.error("Compression error:", err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleWelcomeSubmit = async () => {
    if (!user) return;
    if (!welcomeForm.firstName) {
      alert("Please enter your first name");
      return;
    }
    setIsSubmitting(true);
    try {
      const profileRef = doc(db, 'profiles', user.uid);
      const updateData = {
        firstName: welcomeForm.firstName,
        lastName: welcomeForm.lastName || '',
        age: welcomeForm.age ? Number(welcomeForm.age) : null,
        address: welcomeForm.address || null,
        photoURL: welcomeForm.photoURL || userProfile?.photoURL || '',
        displayName: (welcomeForm.firstName + ' ' + (welcomeForm.lastName || '')).trim(),
        hasSeenWelcome: true,
        updatedAt: serverTimestamp()
      };
      await updateDoc(profileRef, updateData);
      setUserProfile((prev: any) => ({ ...prev, ...updateData }));
      setShowWelcomePopup(false);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `profiles/${user.uid}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseWelcome = async () => {
    setShowWelcomePopup(false);
    if (user && userProfile && !userProfile.hasSeenWelcome) {
      try {
        await updateDoc(doc(db, 'profiles', user.uid), {
          hasSeenWelcome: true,
          updatedAt: serverTimestamp()
        });
        setUserProfile((prev: any) => ({ ...prev, hasSeenWelcome: true }));
      } catch (err) {
        console.error("Error updating welcome flag:", err);
      }
    }
  };

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check pre-compression size (5MB limit for source file)
    if (file.size > 5 * 1024 * 1024) {
      alert("Source image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setIsSubmitting(true);
      
      try {
        // Compress the image before uploading to Firestore
        const compressedBase64 = await new Promise<string>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const MAX_SIZE = 400;

            if (width > height) {
              if (width > MAX_SIZE) {
                height *= MAX_SIZE / width;
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width *= MAX_SIZE / height;
                height = MAX_SIZE;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8)); // 0.8 quality JPEG is usually < 100KB
          };
          img.onerror = () => reject(new Error("Failed to load image for compression"));
          img.src = base64String;
        });

        if (user) {
          const delayPromise = new Promise(resolve => setTimeout(resolve, 1000));
          const uploadPromise = updateDoc(doc(db, 'profiles', user.uid), {
            photoURL: compressedBase64
          });

          await Promise.all([uploadPromise, delayPromise]);

          setUserProfile((prev: any) => ({ ...prev, photoURL: compressedBase64 }));
          setProfileForm((prev: any) => ({ ...prev, photoURL: compressedBase64 }));
          alert("Profile photo updated successfully!");
        }
      } catch (err: any) {
        console.error(err);
        // Check for size error specifically
        if (err.message && err.message.includes('exceeds the maximum allowed size')) {
          alert("The compressed image is still too large. Please try a different photo.");
        } else {
          alert("Error: " + (err.message || "Failed to update profile photo."));
        }
      } finally {
        setIsSubmitting(false);
      }
    };
    reader.readAsDataURL(file);
  };
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const checkOnline = () => {
      const now = new Date();
      const hour = now.getHours();
      setIsAdminOnlineState(hour >= 9 && hour < 23);
      setCurrentTime(now);
    };
    checkOnline();
    const timer = setInterval(checkOnline, 60000);

    // Capture referral ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const refId = urlParams.get('ref');
    if (refId) {
      localStorage.setItem('referredBy', refId);
      // Remove query param from URL without refreshing for better UX
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (showAllReviews || reviews.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentReviewIndex(prev => (prev + 1) % reviews.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [showAllReviews, reviews.length]);

  useEffect(() => {
    // Real-time Global Sold Count (for Real Time Live box) - Optimized to fetch once to save quota
    const fetchGlobalStats = async () => {
      try {
        const qGlobalSold = query(collection(db, 'listings'), where('status', 'in', ['Sold', 'Approved']));
        const soldSnap = await getCountFromServer(qGlobalSold);
        setGlobalSoldCount(soldSnap.data().count);

        const qProfilesCount = collection(db, 'profiles');
        const profilesSnap = await getCountFromServer(qProfilesCount);
        setTotalUsersCount(profilesSnap.data().count);
      } catch (err) {
        console.warn('Failed to fetch global stats:', err);
      }
    };
    fetchGlobalStats();

    // Today's Sold Count - Optimized
    const fetchTodayStats = async () => {
      try {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const qTodayCount = query(
          collection(db, 'listings'),
          where('status', 'in', ['Sold', 'Approved']),
          where('createdAt', '>=', startOfToday)
        );
        const todaySnap = await getCountFromServer(qTodayCount);
        setTodaySoldCount(todaySnap.data().count);
      } catch (err) {
        console.warn('Failed to fetch today stats:', err);
      }
    };
    fetchTodayStats();

    // Real-time Leaderboards & Activity Feed
    const qSellers = query(collection(db, 'profiles'), where('totalSales', '>', 0), orderBy('totalSales', 'desc'), limit(10));
    const unsubscribeSellers = onSnapshot(qSellers, (snap) => {
      const sellers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTopSellers(sellers);
      localStorage.setItem('cache_top_sellers', JSON.stringify(sellers));
    }, (err) => console.warn('Sellers listener failed:', err));

    const qBuyers = query(collection(db, 'profiles'), where('totalSpent', '>', 0), orderBy('totalSpent', 'desc'), limit(10));
    const unsubscribeBuyers = onSnapshot(qBuyers, (snap) => {
      const buyers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTopBuyers(buyers);
      localStorage.setItem('cache_top_buyers', JSON.stringify(buyers));
    }, (err) => console.warn('Buyers listener failed:', err));
    
    const qSold = query(collection(db, 'listings'), where('status', 'in', ['Sold', 'Pending', 'Approved']), orderBy('createdAt', 'desc'), limit(10));
    const unsubscribeSold = onSnapshot(qSold, (snap) => {
      const soldItems = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTodaySold(soldItems);
      localStorage.setItem('cache_today_sold', JSON.stringify(soldItems));
    }, (err) => console.warn('Sold listener failed:', err));

    const qSellerActivity = query(collection(db, 'listings'), where('status', 'in', ['SellRequest', 'Pending', 'Approved', 'Available', 'Dispute', 'Sold']), orderBy('createdAt', 'desc'), limit(10));
    const unsubscribeActivity = onSnapshot(qSellerActivity, (snap) => {
      const activeItems = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLiveSales(activeItems);
      localStorage.setItem('cache_live_sales', JSON.stringify(activeItems));
    }, (err) => console.warn('Activity listener failed:', err));

    return () => {
      unsubscribeSellers();
      unsubscribeBuyers();
      unsubscribeSold();
      unsubscribeActivity();
    };
  }, []);

  const isAdmin = user?.email && SYSTEM_ADMINS.includes(user.email);

  const syncBuyerRankings = async () => {
    if (!isAdmin) return;
    setIsVerifying(true);
    try {
      const q = query(collection(db, "payments"), where("status", "==", "verified"));
      const snap = await getDocs(q);
      
      const spendingMap: Record<string, number> = {};
      snap.docs.forEach(docSnap => {
        const data = docSnap.data();
        const uid = data.userId;
        const amount = Number(data.amount || 0);
        if (uid) {
          spendingMap[uid] = (spendingMap[uid] || 0) + amount;
        }
      });

      const batch = writeBatch(db);
      const userIds = Object.keys(spendingMap);
      
      for (const uid of userIds) {
        const pRef = doc(db, "profiles", uid);
        batch.update(pRef, { totalSpent: spendingMap[uid] });
      }
      
      await batch.commit();
      alert("Ranking Sync Complete! Total users updated: " + userIds.length);
    } catch (err) {
      console.error(err);
      alert("Sync Failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (!user || !messaging) return;

    const requestPermission = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // Get token - VAPID key is usually required. 
          // If you have one, put it here: getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY' })
          const token = await getToken(messaging);
          if (token) {
            console.log('FCM Token generated:', token);
            await updateDoc(doc(db, 'profiles', user.uid), {
              fcmToken: token,
              pushEnabled: true
            });
          }
        }
      } catch (err) {
        console.error('FCM Registration failed:', err);
      }
    };

    requestPermission();

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      // You can show a custom toast here if needed
    });

    return () => unsubscribe();
  }, [user]);

  const sendWhatsApp = async (text: string) => {
    const adminPhone = "+8801410731308"; 
    const apiKey = "jSq722CSG1oe"; 
    
    if (adminPhone && apiKey) {
      const phoneEncoded = window.encodeURIComponent(adminPhone);
      const textEncoded = window.encodeURIComponent(text);
      try {
        fetch(`https://api.callmebot.com/whatsapp.php?phone=${phoneEncoded}&text=${textEncoded}&apikey=${apiKey}`, { mode: 'no-cors' });
      } catch (err) {
        console.error("WhatsApp failed:", err);
      }
    }
  };

  useEffect(() => {
    if (!isAdmin || view !== 'admin') return;

    // Real-time Withdrawals Listener for Admin
    const qWithdrawals = query(collection(db, 'withdrawals'), orderBy('createdAt', 'desc'), limit(100));
    const unsubscribeWithdrawals = onSnapshot(qWithdrawals, (snapshot) => {
      setAllWithdrawals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      console.warn('Withdrawals listener failed:', err);
    });

    return () => unsubscribeWithdrawals();
  }, [isAdmin, view]);

  const formattedDate = currentTime.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const [otpStep, setOtpStep] = useState(false);
  const [sentOtp, setSentOtp] = useState('');
  const [userOtp, setUserOtp] = useState('');
  const [marketListings, setMarketListings] = useState<any[]>([]);

  const filteredMarketListings = marketListings.filter(l => 
    (l.gmailAccount.toLowerCase().includes(marketSearchQuery.toLowerCase()) || 
     (l.type && l.type.toLowerCase().includes(marketSearchQuery.toLowerCase())) ||
     (l.description && l.description.toLowerCase().includes(marketSearchQuery.toLowerCase()))) &&
    l.sellerId !== user?.uid
  );

  const [myPurchases, setMyPurchases] = useState<any[]>([]);
  const [marketTab, setMarketTab] = useState<'Market' | 'Bought'>('Market');
  const [userPayments, setUserPayments] = useState<any[]>([]);
  const [listingFilter, setListingFilter] = useState('All');
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [editingListing, setEditingListing] = useState<any>(null);
  const [editListingForm, setEditListingForm] = useState({
    gmailAccount: '',
    type: 'Full Fresh New',
    price: '',
    email: '',
    password: '',
    recoveryEmail: '',
    twoFactor: '',
    bkashNumber: '',
    description: '',
    isBulk: false,
    bulkData: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Helper to format error messages
  const getDisplayError = (errorStr: string | null): string | null => {
    if (!errorStr) return null;
    try {
      // Handle the JSON stringified error from handleFirestoreError
      const parsed = JSON.parse(errorStr);
      const mainError = parsed.error || errorStr;
      
      if (mainError.toLowerCase().includes('quota limit exceeded') || 
          mainError.toLowerCase().includes('resource-exhausted') ||
          mainError.toLowerCase().includes('quota exceeded')) {
        setQuotaExceeded(true);
        return "আজ জিমেইল মার্কেটপ্লেসের ফ্রি লিমিট শেষ হয়ে গেছে। দয়া করে আগামীকাল পুনরায় চেষ্টা করুন। (Firestore Quota Limit Reach.)";
      }
      if (mainError.toLowerCase().includes('unavailable') || mainError.toLowerCase().includes('failed to connect')) {
        return "আপনার ইন্টারনেট কানেকশন চেক করুন। সার্ভারের সাথে সংযোগ বিচ্ছিন্ন হয়ে গেছে। (Firestore Connectivity Issue.)";
      }
      if (mainError.toLowerCase().includes('unauthorized domain') || mainError.toLowerCase().includes('unauthorized-domain')) {
        return "Unauthorized Domain! দয়া করে আপনার Netlify ডোমেইনটি (gmailbuysellbd.netlify.app) Firebase Console-এর Authorized Domains সেকশনে যুক্ত করুন।";
      }
      return mainError;
    } catch (e) {
      // Fallback for regular error strings
      if (errorStr.toLowerCase().includes('quota limit exceeded') || 
          errorStr.toLowerCase().includes('resource-exhausted') ||
          errorStr.toLowerCase().includes('quota exceeded')) {
        return "দুঃখিত, আজ জিমেইল মার্কেটপ্লেসের ফ্রি লিমিট শেষ হয়ে গেছে। দয়া করে আগামীকাল পুনরায় চেষ্টা করুন। (Firestore Quota Limit Reached. Reset occurs daily.) More info: https://firebase.google.com/pricing#cloud-firestore";
      }
      if (errorStr.toLowerCase().includes('unavailable') || errorStr.toLowerCase().includes('failed to connect')) {
        return "ইন্টারনেট কানেকশন চেক করুন। সার্ভারের সাথে সংযোগ বিচ্ছিন্ন। (Firestore Offline/Connectivity Error.)";
      }
      if (errorStr.toLowerCase().includes('unauthorized domain') || errorStr.toLowerCase().includes('unauthorized-domain')) {
        return "Unauthorized Domain! আপনার Netlify ডোমেইনটি (gmailbuysellbd.netlify.app) Firebase Console-এ Authorized Domains হিসেবে যুক্ত করুন।";
      }
      return errorStr;
    }
  };
  
  // Navigation states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSellEarnOpen, setIsSellEarnOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    // Check if we should open notifications based on URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('open') === 'notifications') {
      setIsNotificationsOpen(true);
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [adminReports, setAdminReports] = useState<any[]>([]);
  const [adminNotifyForm, setAdminNotifyForm] = useState({
    targetUserId: '',
    message: '',
    gmailAccount: '',
    type: 'info' as 'info' | 'warning' | 'success' | 'error'
  });
  const [gmailPrices, setGmailPrices] = useState<Record<string, { seller: string, buyer: string }>>(DEFAULT_GMAIL_PRICES);

  useEffect(() => {
    setError(null);
    setOtpStep(false);
    setUserOtp('');
    setSentOtp('');
    setShowSellModal(false);
    setShowPaymentModal({ show: false, price: 0 });
    setEditingListing(null);
  }, [view]);

  // Back Button / Browser History Navigation Support
  const isInternalNav = React.useRef(false);
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
        isInternalNav.current = true;
        if (event.state.view) setView(event.state.view);
        setIsSidebarOpen(!!event.state.isSidebarOpen);
        setShowSellModal(!!event.state.showSellModal);
        setShowPaymentModal(event.state.showPaymentModal || { show: false, price: 0 });
        setShowProfileUpdate(!!event.state.showProfileUpdate);
        setIsSellEarnOpen(!!event.state.isSellEarnOpen);
        setIsNotificationsOpen(!!event.state.isNotificationsOpen);
        setShowReportModal(event.state.showReportModal || null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    // Set initial state
    window.history.replaceState({ 
      view, isSidebarOpen, showSellModal, showPaymentModal, 
      showProfileUpdate, isSellEarnOpen, 
      isNotificationsOpen, showReportModal 
    }, '', '');

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (isInternalNav.current) {
      isInternalNav.current = false;
      return;
    }

    const state = { 
      view, isSidebarOpen, showSellModal, showPaymentModal, 
      showProfileUpdate, isSellEarnOpen, 
      isNotificationsOpen, showReportModal 
    };
    
    // We only push to history if the state has actually changed to something that feels like navigation
    window.history.pushState(state, '', '');
  }, [
    view, isSidebarOpen, showSellModal, showPaymentModal.show, 
    showProfileUpdate, isSellEarnOpen, 
    isNotificationsOpen, showReportModal?.show
  ]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        console.log('Auth state changed:', currentUser?.email);
        setUser(currentUser);
        
        if (currentUser) {
          // 1. Load Profile from Cache immediately for UI snappiness
          const cacheKey = `cache_profile_${currentUser.uid}`;
          const cachedProfile = localStorage.getItem(cacheKey);
          if (cachedProfile) {
            try {
              const data = JSON.parse(cachedProfile);
              setUserProfile(data);
              setProfileForm({
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                age: data.age?.toString() || '',
                address: data.address || '',
                displayName: data.displayName || '',
                phone: data.phone || '',
                bkashNumber: data.bkashNumber || '',
                nagadNumber: data.nagadNumber || '',
                photoURL: data.photoURL || ''
              });
            } catch(e) {}
          }

          // Real-time Profile Listener
          const profileRef = doc(db, 'profiles', currentUser.uid);
          const unsubscribeProfile = onSnapshot(profileRef, async (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              setUserProfile(data);
              localStorage.setItem(cacheKey, JSON.stringify(data));
              
              // Trigger welcome popup if not seen yet
              if (!data.hasSeenWelcome) {
                setShowWelcomePopup(true);
              }
              
              // Only update form if it was empty or first time
              if (!profileForm.displayName && data.displayName) {
                setProfileForm(prev => ({
                  ...prev,
                  displayName: data.displayName || '',
                  phone: data.phone || '',
                  bkashNumber: data.bkashNumber || '',
                  nagadNumber: data.nagadNumber || '',
                  photoURL: data.photoURL || ''
                }));
              }
            } else {
              // New user registration flow
              const numericId = Math.floor(10000 + Math.random() * 90000).toString();
              const isAdminEmail = currentUser.email && SYSTEM_ADMINS.includes(currentUser.email);
              const referredBy = localStorage.getItem('referredBy');
              
              const newProfile = {
                email: currentUser.email,
                balance: 0,
                totalSales: 0,
                totalOrders: 0,
                uid: currentUser.uid,
                numericId: numericId,
                role: isAdminEmail ? 'admin' : 'user',
                referredBy: referredBy || null,
                successfulReferrals: 0,
                hasTransacted: false,
                hasSeenWelcome: false, // Explicitly set for welcome popup logic
                photoURL: currentUser.photoURL || null,
                displayName: currentUser.displayName || null,
                createdAt: serverTimestamp()
              };
              
              await setDoc(profileRef, newProfile);
              setUserProfile(newProfile);
              setShowWelcomePopup(true);

              if (referredBy) {
                sendNotification(referredBy, `অভিনন্দন! আপনার রেফারেল লিংক থেকে একজন নতুন ইউজার জয়েন করেছে।`, 'info');
                localStorage.removeItem('referredBy');
              }
            }
          }, (err) => {
            console.error('Profile listener error:', err);
            handleFirestoreError(err, OperationType.GET, `profiles/${currentUser.uid}`);
          });

          return () => unsubscribeProfile();
        } else {
          setUserProfile(null);
        }
      } catch (err: any) {
        console.error('Auth handler error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Separate effect for routing/redirection based on auth state
  useEffect(() => {
    if (loading) return;
    
    if (user) {
      if (view === 'login' || view === 'register' || view === 'forgot') {
        setView('marketplace');
      }
    } else {
      if (view !== 'login' && view !== 'register' && view !== 'forgot') {
        setView('login');
      }
    }
  }, [user, loading, view]);

  useEffect(() => {
    if (!user) return;
    const profileFormUpdate = {
      displayName: userProfile?.displayName || '',
      phone: userProfile?.phone || '',
      bkashNumber: userProfile?.bkashNumber || '',
      photoURL: userProfile?.photoURL || ''
    };
    setProfileForm(profileFormUpdate);

    // Real-time Notifications Listener
    const qNotifs = query(collection(db, 'notifications'), where('toUserId', '==', user.uid), orderBy('createdAt', 'desc'), limit(30));
    const unsubscribeNotifs = onSnapshot(qNotifs, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as any);
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n: any) => !n.read).length);
    }, (err) => {
      console.warn('Notifications listener failed:', err);
    });

    return () => unsubscribeNotifs();
  }, [user]);

  const sendNotification = async (toUserId: string, message: string, type: 'info' | 'warning' | 'success' | 'error' | 'system' = 'info', details: any = {}) => {
    try {
      let finalToUserId = toUserId;
      // If it looks like a numeric ID, try to resolve it (Numeric ID is typically 5 digits)
      if (toUserId && /^\d+$/.test(toUserId) && toUserId.length < 15) {
        const q = query(collection(db, 'profiles'), where('numericId', '==', toUserId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          finalToUserId = snap.docs[0].id;
          console.log(`Resolved numeric ID ${toUserId} to UID ${finalToUserId}`);
        } else {
          // Check if the provided ID is actually a UID already
          const profileDoc = await getDoc(doc(db, 'profiles', toUserId));
          if (!profileDoc.exists()) {
            console.warn(`User with ID ${toUserId} not found in profiles`);
            if (isAdmin) alert(`User with ID ${toUserId} not found!`);
            return;
          }
        }
      }

      await addDoc(collection(db, 'notifications'), {
        toUserId: finalToUserId,
        fromUserId: user?.uid || 'system',
        fromName: isAdmin ? 'Admin' : (userProfile?.displayName || 'User'),
        message,
        type,
        details,
        read: false,
        createdAt: serverTimestamp()
      });

      // Send Push Notification via our Backend
      try {
        fetch('/api/send-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toUserId: finalToUserId,
            title: isAdmin ? 'New Admin Message' : 'New Notification',
            body: message,
            data: { 
              link: window.location.origin + '?open=notifications',
              type: type
            }
          })
        });
      } catch (pushErr) {
        console.error('Background push error:', pushErr);
      }
      
      if (isAdmin && view === 'admin') {
        alert('Notification sent successfully!');
      }
    } catch (err) {
      console.error('Error sending notification:', err);
      if (isAdmin) alert('Failed to send notification: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      for (const n of unread) {
        await updateDoc(doc(db, 'notifications', n.id), { read: true });
      }
    } catch (err) {
      console.error('Error marking all read:', err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Optimistic UI Update
    const derivedDisplayName = (profileForm.firstName + ' ' + (profileForm.lastName || '')).trim();
    const updatedData = {
      ...profileForm,
      age: profileForm.age ? Number(profileForm.age) : null,
      displayName: derivedDisplayName || profileForm.displayName,
      updatedAt: serverTimestamp()
    };
    
    const previousProfile = { ...userProfile };
    setUserProfile((prev: any) => ({ ...prev, ...updatedData }));
    setShowProfileUpdate(false);
    
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'profiles', user.uid), updatedData);
      alert('Profile updated successfully!');
    } catch (err: any) {
      // Revert on error
      setUserProfile(previousProfile);
      alert('Update Error: ' + err.message);
      setShowProfileUpdate(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !showReportModal) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'reports'), {
        buyerId: user.uid,
        buyerEmail: user.email,
        sellerId: showReportModal.sellerId,
        listingId: showReportModal.listingId,
        purchaseId: showReportModal.purchaseId,
        message: reportMessage,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // Notify Seller
      await sendNotification(
        showReportModal.sellerId,
        `New Dispute Created: A buyer has created a dispute for Listing #${showReportModal.listingId.substring(0,6)}`,
        'warning',
        { listingId: showReportModal.listingId, reportId: 'new' }
      );

      alert('Report submitted! Seller and Admin will notify you soon.');
      setShowReportModal(null);
      setReportMessage('');
    } catch (err: any) {
      alert('Report Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Check if we need to verify OTP for a new account (Auto-Registration)
    if (otpStep) {
      if (userOtp !== sentOtp) {
        setError(`ভেরিফিকেশন কোড মেলেনি। স্ক্রিনে ${sentOtp} লিখুন।`);
        return;
      }
      
      setLoading(true);
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;
        
        // Generate a random 5-digit numeric ID (e.g., 16574)
        const numericId = Math.floor(10000 + Math.random() * 90000).toString();

        const isAdminEmail = newUser.email && SYSTEM_ADMINS.includes(newUser.email);

        await setDoc(doc(db, 'profiles', newUser.uid), {
          uid: newUser.uid,
          numericId: numericId,
          email: newUser.email,
          displayName: email.split('@')[0],
          balance: 0,
          totalSales: 0,
          totalOrders: 0,
          role: isAdminEmail ? 'admin' : 'user',
          createdAt: serverTimestamp()
        });
        setOtpStep(false);
        setUserOtp('');
      } catch (regErr: any) {
        console.error('Registration failed:', regErr);
        if (regErr.code === 'auth/email-already-in-use' || regErr.message?.includes('email-already-in-use')) {
          setError('এই ইমেইলটি ইতিমধ্যে নিবন্ধিত। সঠিক পাসওয়ার্ড দিয়ে লগইন করুন।');
          setOtpStep(false);
        } else if (regErr.code === 'auth/weak-password' || regErr.message?.includes('weak-password')) {
          setError('পাসওয়ার্ডটি অন্তত ৬ অক্ষরের হতে হবে।');
        } else {
          setError(`সমস্যা হয়েছে: ${regErr.message || 'Error'}`);
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    if (password.length < 6) {
      setError('পাসওয়ার্ডটি অন্তত ৬ অক্ষরের হতে হবে।');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.log('Login failed, code:', err.code);
      if (err.code === 'auth/network-request-failed') {
        setError('নেটওয়ার্ক সমস্যা! আপনার ইন্টারনেট কানেকশন চেক করুন এবং পুনরায় চেষ্টা করুন। (Firebase Auth reached network limit or was blocked)');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('ইমেইল/পাসওয়ার্ড লগইন মেথডটি Firebase কন্সোলে বন্ধ করা আছে। দয়া করে Authentication > Sign-in method থেকে Email/Password চালু করুন।');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.message?.includes('invalid-credential')) {
        // This might be a new user, show OTP step
        const loginCheckAuth = auth;
        // Generate OTP
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        setSentOtp(code);
        setOtpStep(true);
        setLoading(false);
        return;
      } else {
        setError(`লগইন ত্রুটি: ${err.message || 'Unknown error'}`);
      }
    } finally {
      if (!otpStep) setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      console.log('Initiating Google Login...');
      const provider = new GoogleAuthProvider();
      // Set parameters if needed, e.g. force account selection
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      console.log('Google Login Success:', result.user.email);
    } catch (err: any) {
      console.error('Google Login Error:', err);
      if (err.code === 'auth/network-request-failed') {
        setError('গুগল লগইন নেটওয়ার্ক সমস্যার কারণে ব্যর্থ হয়েছে। আপনার ইন্টারনেট চেক করুন এবং পুনরায় চেষ্টা করুন।');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('গুগল লগইন মেথডটি Firebase কন্সোলে বন্ধ করা আছে। দয়া করে Authentication > Sign-in method থেকে Google চালু করুন।');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup blocked! Please allow popups for this site in your browser settings.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Unauthorized Domain: আপনার Netlify ডোমেইনটি (gmailbuysellbd.netlify.app) Firebase Console > Authentication > Settings > Authorized Domains এ যুক্ত করুন।');
      } else if (err.code === 'auth/cancelled-popup-request') {
        // User closed the popup, ignore
      } else if (err.code === 'auth/popup-closed-by-user') {
        // Popup closed by user, ignore
      } else {
        setError(`Login failed: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('পাসওয়ার্ডটি অন্তত ৬ অক্ষরের হতে হবে।');
      return;
    }

    if (!otpStep) {
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setSentOtp(code);
      setOtpStep(true);
      return;
    }

    if (userOtp !== sentOtp) {
      setError(`ভেরিফিকেশন কোড মেলেনি। স্ক্রিনে ${sentOtp} লিখুন।`);
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      // Generate a random 5-digit numeric ID (e.g., 16574)
      const numericId = Math.floor(10000 + Math.random() * 90000).toString();

      const isAdminEmail = newUser.email && SYSTEM_ADMINS.includes(newUser.email);

      await setDoc(doc(db, 'profiles', newUser.uid), {
        uid: newUser.uid,
        numericId: numericId,
        email: newUser.email,
        displayName: email.split('@')[0],
        balance: 0,
        totalSales: 0,
        totalOrders: 0,
        role: isAdminEmail ? 'admin' : 'user',
        createdAt: serverTimestamp()
      });
      setOtpStep(false);
      setUserOtp('');
    } catch (err: any) {
      console.error('Register error:', err);
      if (err.code === 'auth/email-already-in-use' || err.message?.includes('email-already-in-use')) {
        setError('এই ইমেইলটি ইতিমধ্যে ব্যবহার করা হয়েছে। লগইন করুন।');
      } else if (err.code === 'auth/weak-password' || err.message?.includes('weak-password')) {
        setError('পাসওয়ার্ডটি অন্তত ৬ অক্ষরের হতে হবে।');
      } else {
        setError('রেজিস্ট্রেশন করতে সমস্যা হচ্ছে। পরে চেষ্টা করুন।');
      }
      setOtpStep(false);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      alert('Password reset email sent!');
      setView('login');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUserProfile(null);
    setWelcomeForm({
      firstName: '',
      lastName: '',
      age: '',
      address: '',
      photoURL: ''
    });
    setProfileForm({
      firstName: '',
      lastName: '',
      age: '',
      address: '',
      displayName: '',
      phone: '',
      bkashNumber: '',
      nagadNumber: '',
      photoURL: ''
    });
    setView('login');
  };

  // Gmail Handling Functions
  const handleReferralReward = async () => {
    if (!user || userProfile?.hasTransacted) return;

    try {
      const profileRef = doc(db, 'profiles', user.uid);
      await updateDoc(profileRef, { hasTransacted: true });
      setUserProfile((prev: any) => ({ ...prev, hasTransacted: true }));

      if (userProfile?.referredBy) {
        const referrerId = userProfile.referredBy;
        const referrerRef = doc(db, 'profiles', referrerId);
        
        await updateDoc(referrerRef, {
          balance: increment(5),
          successfulReferrals: increment(1)
        });

        await sendNotification(referrerId, `অভিনন্দন! আপনার রেফারেল করা একজন ইউজার ১ম ট্রানজেকশন সম্পন্ন করেছে। আপনি ৫ টাকা বোনাস পেয়েছেন।`, 'success');
        console.log(`Referral reward of 5 TK awarded to ${referrerId} for transaction by ${user.uid}`);
      }
    } catch (err) {
      console.error('Error in referral reward logic:', err);
    }
  };

  const handleSellGmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!sellForm.email || !sellForm.password) {
      alert('Email and Password are required');
      return;
    }

    // Close modal immediately
    setShowSellModal(false);
    setIsSubmitting(true);
    setError(null);

    const listingPath = 'listings';
    try {
      // 1. Create masked email for public view
      const emailParts = sellForm.email.split('@');
      const maskedEmail = `${emailParts[0].substring(0, 3)}*******@${emailParts[1]}`;

      // 0. Check for duplicates (Search by masked account for basic prevention)
      if (!sellListingToEdit) {
        const q2 = query(collection(db, listingPath), where('gmailAccount', '==', maskedEmail));
        const snap2 = await getDocs(q2);
        const allDupes = snap2.docs;
        
        const activeDuplicates = allDupes.filter(d => ['Available', 'Pending', 'Approved', 'Sold', 'SellRequest'].includes(d.data().status));
        
        if (activeDuplicates.length > 0) {
          alert('আপনি আগেই এই জিমেইল সেল করেছেন (বা একই রকম জিমেইল লিস্টিং আছে)');
          setIsSubmitting(false);
          return;
        }
      }

      // Admin posts go live instantly, users go to review
      // If editing a dispute, it goes back to review (SellRequest)
      const finalStatus = isAdmin ? 'Available' : 'SellRequest';

      let listingId = sellListingToEdit;

      if (!sellListingToEdit) {
        // 2. Create Public Listing
        const listingRef = await addDoc(collection(db, listingPath), {
          sellerId: user.uid,
          sellerNumericId: userProfile?.numericId || '...',
          gmailAccount: maskedEmail, // Keep as masked for UI
          type: sellForm.type,
          price: parseFloat(sellForm.price),
          bkashNumber: sellForm.bkashNumber,
          description: sellForm.description || '',
          status: finalStatus,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        listingId = listingRef.id;
      } else {
        // 2. Update existing listing
        await updateDoc(doc(db, listingPath, sellListingToEdit), {
          gmailAccount: maskedEmail,
          type: sellForm.type,
          price: parseFloat(sellForm.price),
          bkashNumber: sellForm.bkashNumber,
          description: sellForm.description || '',
          status: finalStatus,
          updatedAt: serverTimestamp(),
        });
      }

      // 3. Update Private Credentials
      const credPath = `listings/${listingId}/private/credentials`;
      try {
        await setDoc(doc(db, `listings/${listingId}/private`, 'credentials'), {
          email: sellForm.email,
          password: sellForm.password,
          recoveryEmail: sellForm.recoveryEmail || '',
          twoFactor: sellForm.twoFactor || ''
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, credPath);
      }

      alert(sellListingToEdit ? 'Listing updated and resubmitted for review!' : 'Account submitted for review!');

      if (finalStatus === 'SellRequest') {
        cleanupOldListings('SellRequest');
      }

      // Notify Admins
      try {
        const adminsSnapshot = await getDocs(query(collection(db, 'profiles'), where('role', '==', 'admin')));
        const adminIds = adminsSnapshot.docs.map(doc => doc.id);
        
        for (const adminId of adminIds) {
          await sendNotification(
            adminId, 
            `${sellListingToEdit ? 'Updated' : 'New'} Sell Request: ${maskedEmail} (৳${sellForm.price})`, 
            'warning', 
            { type: 'sell_request', listingId: listingId }
          );
        }

        // WhatsApp Notification
        sendWhatsApp(`🔥 ${sellListingToEdit ? 'Updated' : 'New'} Sell Request! \nEmail: ${maskedEmail} \nPrice: ৳${sellForm.price} \nSeller: ${userProfile?.numericId}`);
      } catch (err) {
        console.error("Notification error:", err);
      }

      if (!sellListingToEdit) handleReferralReward(); // Award referral bonus on first sale request or sale
      
      setSellForm({ 
        email: '', 
        password: '', 
        recoveryEmail: '', 
        twoFactor: '', 
        bkashNumber: '', 
        nagadNumber: '',
        type: 'Full Fresh New', 
        price: gmailPrices['Full Fresh New']?.seller || '16', 
        description: ''
      });
      setSellListingToEdit(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openSellerEditModal = async (listingId: string) => {
    setIsSubmitting(true);
    try {
      const listingSnap = await getDoc(doc(db, 'listings', listingId));
      if (!listingSnap.exists()) {
        alert('Listing not found');
        return;
      }
      const listingData = listingSnap.data();
      
      const isAdminUser = user?.email === 'ashrafulislambhuiyan8@gmail.com';
      if (listingData.sellerId !== user?.uid && !isAdminUser) {
        alert('You are not authorized to edit this listing.');
        return;
      }
      
      const credSnap = await getDoc(doc(db, `listings/${listingId}/private`, 'credentials'));
      const credData = credSnap.exists() ? credSnap.data() : {};

      setSellForm({
        email: listingData.realGmail || listingData.gmailAccount,
        password: credData.password || '',
        recoveryEmail: credData.recoveryEmail || credData.recovery || '',
        twoFactor: credData.twoFactor || '',
        bkashNumber: listingData.bkashNumber || '',
        nagadNumber: listingData.nagadNumber || '',
        type: listingData.type,
        price: listingData.price.toString(),
        description: listingData.description || ''
      });
      setSellListingToEdit(listingId);
      setShowSellModal(true);
    } catch (err: any) {
      alert('Error loading listing: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const revealPassword = async (listingId: string, sellerId?: string) => {
    // Check if user is owner or admin
    const isAdminUser = user?.email && SYSTEM_ADMINS.includes(user.email);
    
    if (user?.uid !== sellerId && !isAdminUser) {
      alert("Only the account owner or admin can view these credentials.");
      return;
    }

    if (revealedPasswords[listingId]) {
      const newReveals = { ...revealedPasswords };
      delete newReveals[listingId];
      setRevealedPasswords(newReveals);
      return;
    }

    const credPath = `listings/${listingId}/private/credentials`;
    try {
      const credDoc = await getDoc(doc(db, `listings/${listingId}/private`, 'credentials'));
      if (credDoc.exists()) {
        setRevealedPasswords(prev => ({ ...prev, [listingId]: credDoc.data() }));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, credPath);
    }
  };

  useEffect(() => {
    if (!isAdmin || view !== 'admin') return;

    // Real-time Admin Listeners
    const qListings = query(collection(db, 'listings'), orderBy('createdAt', 'desc'), limit(200));
    const unsubscribeListings = onSnapshot(qListings, (snap) => {
      setAllListings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as any));
    });

    const qPurchases = query(collection(db, 'purchases'), orderBy('purchasedAt', 'desc'), limit(100));
    const unsubscribePurchases = onSnapshot(qPurchases, (snap) => {
      setAllPurchases(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as any));
    });

    const qPayments = query(collection(db, 'payments'), orderBy('createdAt', 'desc'), limit(100));
    const unsubscribePayments = onSnapshot(qPayments, (snap) => {
      setAllPayments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as any));
    });

    const qReports = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(100));
    const unsubscribeReports = onSnapshot(qReports, (snap) => {
      setAdminReports(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as any));
    });

    return () => {
      unsubscribeListings();
      unsubscribePurchases();
      unsubscribePayments();
      unsubscribeReports();
    };
  }, [isAdmin, view]);

  useEffect(() => {
    if (!user || (view !== 'seller-center' && view !== 'gmail-market' && view !== 'marketplace')) return;

    // Real-time Seller Listings Listener
    const sellerQ = query(collection(db, 'listings'), where('sellerId', '==', user.uid), limit(200));
    const unsubscribeSeller = onSnapshot(sellerQ, (snap) => {
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setSellerListings(items);
      localStorage.setItem(`cache_seller_listings_${user.uid}`, JSON.stringify(items));
    }, (err) => {
      console.warn("Seller listings listener failed:", err);
    });

    return () => unsubscribeSeller();
  }, [user, view]);

  useEffect(() => {
    if (view !== 'gmail-market' && view !== 'marketplace') return;

    // Real-time Market Listings Listener
    const qMarket = query(
      collection(db, 'listings'),
      where('status', '==', 'Available'),
      limit(100)
    );
    
    const unsubscribeMarket = onSnapshot(qMarket, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setMarketListings(items);
      localStorage.setItem('cache_market_listings', JSON.stringify(items));
    }, (err) => {
      console.warn('Market listener failed:', err);
    });

    let unsubscribePurchases: () => void = () => {};
    let unsubscribePayments: () => void = () => {};

    if (user) {
      const qPurchases = query(collection(db, 'purchases'), where('userId', '==', user.uid), orderBy('purchasedAt', 'desc'), limit(50));
      unsubscribePurchases = onSnapshot(qPurchases, (snapshot) => {
        const purchases = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMyPurchases(purchases);
        localStorage.setItem(`cache_my_purchases_${user.uid}`, JSON.stringify(purchases));
      });

      const qPayments = query(collection(db, 'payments'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(50));
      unsubscribePayments = onSnapshot(qPayments, (snapshot) => {
        const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUserPayments(payments);
        localStorage.setItem(`cache_user_payments_${user.uid}`, JSON.stringify(payments));
      });
    }

    return () => {
      unsubscribeMarket();
      unsubscribePurchases();
      unsubscribePayments();
    };
  }, [user, view, quotaExceeded]);

  const handleBulkBuyFromBalance = async () => {
    if (!user || !userProfile || selectedListings.length === 0) return;
    
    // Calculate total price using real-time market rates
    const selectedItems = marketListings.filter(l => selectedListings.includes(l.id));
    const totalPrice = selectedItems.reduce((sum, item) => {
      const priceObj = gmailPrices[item.type] as { seller: string, buyer: string };
      const currentPrice = priceObj?.buyer ? parseFloat(priceObj.buyer) : item.price;
      return sum + currentPrice;
    }, 0);

    if (userProfile.balance < totalPrice) {
      setShowPaymentModal({ show: true, price: totalPrice });
      return;
    }

    // Open confirmation modal instead of immediate buy
    setIsBulkConfirmModalOpen(true);
  };

  const proceedToBulkPayment = () => {
    const selectedItems = marketListings.filter(l => selectedListings.includes(l.id));
    const totalPrice = selectedItems.reduce((sum, item) => {
      const priceObj = gmailPrices[item.type] as { seller: string, buyer: string };
      const currentPrice = priceObj?.buyer ? parseFloat(priceObj.buyer) : item.price;
      return sum + currentPrice;
    }, 0);
    
    setIsBulkConfirmModalOpen(false);
    setShowPaymentModal({ show: true, price: totalPrice, listingId: 'bulk' });
  };

  const executeBulkBuy = async () => {
    if (!user || !userProfile || selectedListings.length === 0) return;
    
    const selectedItems = marketListings.filter(l => selectedListings.includes(l.id));
    const totalPrice = selectedItems.reduce((sum, item) => {
      const priceObj = gmailPrices[item.type] as { seller: string, buyer: string };
      const currentPrice = priceObj?.buyer ? parseFloat(priceObj.buyer) : item.price;
      return sum + currentPrice;
    }, 0);

    setIsSubmitting(true);
    setError(null);
    try {
      const results: any[] = [];
      const { runTransaction } = await import('firebase/firestore');

      await runTransaction(db, async (transaction) => {
        // 1. Initial balance check
        const userProfileRef = doc(db, 'profiles', user.uid);
        const userProfileSnap = await transaction.get(userProfileRef);
        if (!userProfileSnap.exists()) throw new Error("Profile not found");
        let currentBalance = userProfileSnap.data().balance;

        if (currentBalance < totalPrice) {
          throw new Error("অপর্যাপ্ত ব্যালেন্স!");
        }

        // 1. READ PHASE: Gather all data first
        const itemsToProcess = [];
        for (const targetId of selectedListings) {
          const listingRef = doc(db, 'listings', targetId);
          const listingSnap = await transaction.get(listingRef);
          
          if (!listingSnap.exists()) continue;
          const listingData = listingSnap.data();

          if (listingData.status !== 'Available') {
            throw new Error(`Listing ${targetId} is no longer available`);
          }

          const priceObj = gmailPrices[listingData.type] as { seller: string, buyer: string };
          const dynamicPrice = priceObj?.buyer ? parseFloat(priceObj.buyer) : listingData.price;

          itemsToProcess.push({
            id: targetId,
            ref: listingRef,
            data: listingData,
            dynamicPrice
          });
        }

        // 2. WRITE PHASE: Perform all updates and sets
        for (const item of itemsToProcess) {
          const { id: targetId, ref: listingRef, data: listingData, dynamicPrice } = item;

          // Mark Listing as Sold
          transaction.update(listingRef, { 
            status: 'Sold', 
            soldTo: user.uid,
            soldPrice: dynamicPrice,
            updatedAt: serverTimestamp() 
          });

          // Create Purchase Record
          const purchaseId = `${user.uid}_${targetId}`;
          const purchaseRef = doc(db, 'purchases', purchaseId);
          transaction.set(purchaseRef, {
            userId: user.uid,
            userEmail: user.email,
            listingId: targetId,
            gmailAccount: listingData.gmailAccount,
            sellerId: listingData.sellerId || 'admin',
            sellerBkash: listingData.bkashNumber || '',
            price: dynamicPrice,
            purchasedAt: serverTimestamp(),
            status: 'Success'
          });

          // Update Seller Stats (Still based on their requested price)
          if (listingData.sellerId && listingData.sellerId !== 'admin') {
            const sellerRef = doc(db, 'profiles', listingData.sellerId);
            transaction.update(sellerRef, {
              balance: increment(Number(listingData.price)),
              totalSales: increment(1),
              totalEarned: increment(Number(listingData.price)),
              updatedAt: serverTimestamp()
            });
          }
        }

        // Update Buyer Balance (at the end)
        transaction.update(userProfileRef, {
          balance: increment(-Number(totalPrice)),
          totalOrders: increment(selectedListings.length),
          totalSpent: increment(Number(totalPrice)),
          hasTransacted: true,
          updatedAt: serverTimestamp()
        });
      });

      // 3. FETCH CREDENTIALS PHASE (AFTER TRANSACTION - allowed because user is now soldTo)
      // Initial wait to let rules propagate
      await new Promise(resolve => setTimeout(resolve, 1500)); 

      for (const targetId of selectedListings) {
        try {
          const credRef = doc(db, `listings/${targetId}/private`, 'credentials');
          // Retry logic within bulk buy for each item
          let credSnap = null;
          for (let i = 0; i < 4; i++) {
            try {
              if (i > 0) await new Promise(resolve => setTimeout(resolve, 800 * i));
              credSnap = await getDoc(credRef);
              if (credSnap.exists()) break;
            } catch (e) {
              if (i === 3) console.error(`Perm update lag for ${targetId}`);
            }
          }

          if (credSnap && credSnap.exists()) {
            const c = credSnap.data();
            const listing = marketListings.find(l => l.id === targetId);
            results.push({
              id: targetId,
              gmail: listing?.gmailAccount || '...',
              pass: c.password || c.pass || 'Contact Admin',
              recovery: c.recoveryEmail || c.recovery || '',
              twoFactor: c.twoFactor || ''
            });

            // Update purchase record with credentials for permanent storage
            const purchaseId = `${user.uid}_${targetId}`;
            await updateDoc(doc(db, 'purchases', purchaseId), {
              credentials: {
                email: c.email || c.gmail || '',
                password: c.password || c.pass || '',
                recovery: c.recoveryEmail || c.recovery || '',
                twoFactor: c.twoFactor || ''
              }
            });
          }
        } catch (e) {
          console.error(`Bulk fetch cred error for ${targetId}:`, e);
        }
      }

      if (results.length > 1) {
        setBulkPurchasedCreds(results);
        setShowPaymentModal({ show: true, price: totalPrice }); 
      } else if (results.length === 1) {
        setPurchasedCreds(results[0]);
        setShowPaymentModal({ show: true, price: totalPrice, listingId: selectedListings[0] });
      } else {
        alert(`সফলভাবে কেনা হয়েছে! আপনার Purchased ট্যাবে চেক করুন।`);
        setShowPaymentModal({ show: false, price: 0 });
      }
      
      setSelectedListings([]);
      setIsBulkBuyMode(false);
      // Cleanup old sold listings
      cleanupOldListings('Sold');
    } catch (err: any) {
      console.error('Bulk buy transaction failed:', err);
      setError(err.message || 'Transaction failed');
      alert('Error: ' + (err.message || 'Transaction failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const buyListing = async (listing: any) => {
    if (!user || !userProfile) return;
    setPurchasedCreds(null);
    
    // Use current market price if available
    const priceObj = gmailPrices[listing.type] as { seller: string, buyer: string };
    const currentPrice = priceObj?.buyer ? parseFloat(priceObj.buyer) : listing.price;

    if (userProfile.balance < currentPrice) {
      setShowPaymentModal({ show: true, price: currentPrice, listingId: listing.id });
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const { runTransaction } = await import('firebase/firestore');

      await runTransaction(db, async (transaction) => {
        const userProfileRef = doc(db, 'profiles', user.uid);
        const userProfileSnap = await transaction.get(userProfileRef);
        if (!userProfileSnap.exists()) throw new Error("Profile not found");
        
        const currentBalance = userProfileSnap.data().balance;
        if (currentBalance < currentPrice) throw new Error("অপর্যাপ্ত ব্যালেন্স!");

        const listingRef = doc(db, 'listings', listing.id);
        const listingSnap = await transaction.get(listingRef);
        if (!listingSnap.exists()) throw new Error("আইটেমটি পাওয়া যায়নি!");
        if (listingSnap.data().status !== 'Available') throw new Error("আইটেমটি ইতিমধ্যে বিক্রি হয়ে গেছে!");

        // 1. Mark Listing as Sold
        transaction.update(listingRef, {
          status: 'Sold',
          soldTo: user.uid,
          soldPrice: currentPrice,
          updatedAt: serverTimestamp()
        });

        // 2. Create Purchase Record (initial without creds to avoid rule issues)
        const purchaseId = `${user.uid}_${listing.id}`;
        transaction.set(doc(db, 'purchases', purchaseId), {
          userId: user.uid,
          userEmail: user.email,
          listingId: listing.id,
          gmailAccount: listing.gmailAccount,
          sellerId: listing.sellerId || 'admin',
          sellerBkash: listing.bkashNumber || '',
          price: currentPrice,
          description: listing.description || '',
          status: 'SUCCESS',
          purchasedAt: serverTimestamp()
        });

        // 3. Update Seller Stats
        if (listing.sellerId && listing.sellerId !== 'admin') {
          const sellerRef = doc(db, 'profiles', listing.sellerId);
          transaction.update(sellerRef, {
            balance: increment(Number(listing.price)),
            totalSales: increment(1),
            totalEarned: increment(Number(listing.price)),
            updatedAt: serverTimestamp()
          });
        }

        // 4. Update Buyer Balance
        transaction.update(userProfileRef, {
          balance: increment(-Number(currentPrice)),
          totalOrders: increment(1),
          totalSpent: increment(Number(currentPrice)),
          hasTransacted: true,
          updatedAt: serverTimestamp()
        });
      });

      // 2. Fetch credentials (now allowed because transaction succeeded and user is soldTo)
      const credRef = doc(db, `listings/${listing.id}/private`, 'credentials');
      let credSnap = null;
      
      // Retry up to 3 times with increasing delay to account for rules propagation
      for (let i = 0; i < 3; i++) {
        try {
          await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
          credSnap = await getDoc(credRef);
          if (credSnap.exists()) break;
        } catch (e) {
          if (i === 2) throw e;
          console.warn(`Attempt ${i+1} to fetch credentials failed, retrying...`);
        }
      }
      
      if (credSnap && credSnap.exists()) {
        const credentials = credSnap.data();
        
        // Sync credentials to purchase record for permanent storage
        const purchaseId = `${user.uid}_${listing.id}`;
        await updateDoc(doc(db, 'purchases', purchaseId), {
          credentials: {
            email: credentials.email || credentials.gmail || '',
            password: credentials.password || credentials.pass || 'Contact Admin',
            recovery: credentials.recoveryEmail || credentials.recovery || '',
            twoFactor: credentials.twoFactor || ''
          }
        });

        setPurchasedCreds({
          gmail: credentials.email || credentials.gmail || listing.gmailAccount || '',
          pass: credentials.password || credentials.pass || 'Contact Admin',
          recovery: credentials.recoveryEmail || credentials.recovery || '',
          twoFactor: credentials.twoFactor || ''
        });

        setShowPaymentModal({ show: true, price: currentPrice, listingId: listing.id });
        await sendNotification(user.uid, `ক্রয় সফল হয়েছে! ৳${currentPrice.toFixed(0)} ব্যালেন্স থেকে কাটা হয়েছে।`, 'success');
      } else {
        throw new Error("কেনা সফল হয়েছে কিন্তু পাসওয়ার্ড লোড করা যায়নি। দয়া করে Purchased ট্যাব চেক করুন।");
      }
      // Cleanup old sold listings
      cleanupOldListings('Sold');
    } catch (err: any) {
      console.error('Purchase failed:', err);
      const errorMessage = err.message || '';
      if (errorMessage.includes('permission') || errorMessage.includes('insufficient')) {
        alert('ক্রয় সম্পন্ন করা যায়নি: আপনার কোনো পারমিশন সমস্যা আছে অথবা ব্যালেন্স আপডেট হতে দেরি হচ্ছে। দয়া করে আবার চেষ্টা করুন।');
      } else {
        alert('ক্রয় সম্পন্ন করা যায়নি: ' + (errorMessage || 'সার্ভার সমস্যা'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isPaymentSent, setIsPaymentSent] = useState(false);
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);

  // Listener for the current pending payment
  useEffect(() => {
    if (!currentPaymentId || !isPaymentSent || !user) return;

    const unsub = onSnapshot(doc(db, 'payments', currentPaymentId), async (docSnap) => {
      if (docSnap.exists() && docSnap.data().status === 'verified') {
        const data = docSnap.data();
        // If it's a purchase (not a deposit), fetch listing info from the 'purchases' records
        if ((data.listingId !== 'deposit' || data.itemIds) && data.itemIds && data.itemIds.length > 0) {
          try {
            const results: any[] = [];
            for (const itemId of data.itemIds) {
              const purchaseId = `${user.uid}_${itemId}`;
              const purchaseSnap = await getDoc(doc(db, 'purchases', purchaseId));
              if (purchaseSnap.exists()) {
                const pData = purchaseSnap.data();
                results.push({
                  id: itemId,
                  gmail: pData.credentials?.email || pData.gmailAccount || '',
                  pass: pData.credentials?.password || 'See Bought Tab',
                  recovery: pData.credentials?.recovery || pData.credentials?.recoveryEmail || '',
                  twoFactor: pData.credentials?.twoFactor || ''
                });
              }
            }

            if (results.length > 1) {
              setBulkPurchasedCreds(results);
              setPurchasedCreds(null);
            } else if (results.length === 1) {
              setPurchasedCreds(results[0]);
              setBulkPurchasedCreds(null);
            }
            
            setIsPaymentSent(false); // Transition to success view
          } catch (err) {
            console.error('Error fetching purchase details:', err);
          }
        } else if (data.listingId === 'deposit') {
          // For deposit, just close or show success message
          alert('Deposit successful! Your balance has been updated.');
          setShowPaymentModal({ show: false, price: 0 });
          setIsPaymentSent(false);
          setCurrentPaymentId(null);
        }
      } else if (docSnap.exists() && docSnap.data().status === 'rejected') {
         alert('আপনার পেমেন্টটি রিজেক্ট করা হয়েছে। সঠিক তথ্য দিয়ে আবার চেষ্টা করুন।');
         setIsPaymentSent(false);
         setCurrentPaymentId(null);
      }
    }, (err) => {
      console.error('Payment listener error:', err);
    });

    return () => unsub();
  }, [currentPaymentId, isPaymentSent, user]);

  const verifyPayment = async () => {
    if (!paymentForm.senderNumber || !paymentForm.trxId) {
      setPaymentError('Sender Number and TrxID are required');
      setTimeout(() => setPaymentError(null), 3000);
      return;
    }
    
    setIsVerifying(true);
    setPaymentError(null);
    try {
      // 0. Check for duplicate TrxID in our database (Fixing Permission Error)
      const trxIdClean = paymentForm.trxId.trim().toUpperCase();
      const trxRef = doc(db, 'used_trx_ids', trxIdClean);
      const trxSnap = await getDoc(trxRef);
      
      if (trxSnap.exists()) {
        throw new Error('এই Transaction ID আগে ব্যবহার করা হয়েছে! দয়া করে সঠিক ID দিন।');
      }

      // Check if user email is verified (Recommended for security)
      if (!user?.emailVerified && !isAdmin) {
        // throw new Error('দয়া করে আপনার জিমেইল ভেরিফাই করুন (Check your email for verification link)');
        // For now, only log warning as per template choice, but enforce if needed
      }

      const idsToProcess = selectedListings.length > 0 ? selectedListings : [showPaymentModal.listingId].filter(Boolean) as string[];
      
      if (idsToProcess.length === 0 && showPaymentModal.listingId !== 'deposit') {
        throw new Error('No items selected for purchase');
      }

      // Register TRX ID to prevent reuse immediately
      await setDoc(trxRef, {
        userId: user?.uid,
        createdAt: serverTimestamp()
      });

      // 1. Log the payment attempt for Admin review
      const paymentDoc = await addDoc(collection(db, 'payments'), {
        userId: user?.uid,
        userEmail: user?.email,
        senderNumber: paymentForm.senderNumber,
        trxId: trxIdClean,
        method: paymentForm.method,
        amount: showPaymentModal.price,
        listingId: idsToProcess.length > 1 ? `bulk_${idsToProcess.length}` : (showPaymentModal.listingId || 'deposit'),
        itemIds: idsToProcess,
        itemCount: idsToProcess.length,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // ...
      if (showPaymentModal.listingId !== 'deposit') {
        for (const id of idsToProcess) {
          await updateDoc(doc(db, 'listings', id), {
            status: 'Pending',
            updatedAt: serverTimestamp()
          });
        }
      }

      setCurrentPaymentId(paymentDoc.id);
      setIsPaymentSent(true);

      // Notify Admins
      try {
        const adminsSnapshot = await getDocs(query(collection(db, 'profiles'), where('role', '==', 'admin')));
        const adminIds = adminsSnapshot.docs.map(doc => doc.id);
        for (const adminId of adminIds) {
          await sendNotification(adminId, `New Payment: ৳${showPaymentModal.price} by ${user?.email}`, 'warning', { type: 'payment_review', paymentId: paymentDoc.id });
        }
        
        // WhatsApp Notification
        const trxIdClean = paymentForm.trxId.toUpperCase().trim();
        sendWhatsApp(`💳 NEW Payment Record! \nMethod: ${paymentForm.method.toUpperCase()} \nAmount: ৳${showPaymentModal.price} \nTrxID: ${trxIdClean} \nSender: ${paymentForm.senderNumber} \nUser: ${user?.email}`);
      } catch (err) {
        console.error("Notification error:", err);
      }

      setPaymentForm(prev => ({ ...prev, senderNumber: '', trxId: '' }));
      setSelectedListings([]);
      setIsBulkBuyMode(false);
    } catch (err: any) {
      setPaymentError(err.message);
      // Auto-hide error after 3 seconds
      setTimeout(() => setPaymentError(null), 3000);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAdminBulkAction = async (action: 'Available' | 'Approved' | 'Dispute' | 'Sold' | 'SellRequest' | 'Delete') => {
    if (!isAdmin || adminSelectedListings.length === 0) return;
    
    const confirmMsg = action === 'Delete' 
      ? `আপনি কি নিশ্চিত যে ${adminSelectedListings.length}টি লিস্টিং ডিলিট করতে চান?` 
      : `${adminSelectedListings.length}টি লিস্টিং ${action} করতে চান?`;
      
    if (!confirm(confirmMsg)) return;
    
    setIsSubmitting(true);
    let successCount = 0;
    try {
      for (const id of adminSelectedListings) {
        try {
          if (action === 'Delete') {
            const listingRef = doc(db, 'listings', id);
            await deleteDoc(listingRef);
          } else {
            const updatePayload: any = {
              status: action,
              updatedAt: serverTimestamp()
            };
            
            // Auto-set market price when going Live
            if (action === 'Available') {
              const currentListing = allListings.find(l => l.id === id);
              if (currentListing) {
                const priceObj = gmailPrices[currentListing.type] as { seller: string, buyer: string };
                if (priceObj?.buyer) {
                  updatePayload.price = parseFloat(priceObj.buyer);
                }
              }
            }

            await updateDoc(doc(db, 'listings', id), updatePayload);
            
            const listing = allListings.find(l => l.id === id);
            if (listing && listing.sellerId && listing.sellerId !== 'admin') {
              let msg = '';
              let nType: 'info' | 'success' | 'warning' | 'error' = 'info';
              
              if (action === 'Available') {
                const displayGmail = listing.realGmail || listing.gmailAccount || '...';
                msg = `আপনার ${displayGmail} এখন Available!`;
                nType = 'success';
              } else if (action === 'Approved') {
                const displayGmail = listing.realGmail || listing.gmailAccount || '...';
                msg = `আপনার ${displayGmail} এপ্রুভ হয়েছে!`;
                nType = 'success';
              } else if (action === 'Dispute') {
                const displayGmail = listing.realGmail || listing.gmailAccount || '...';
                msg = `⚠️আপনার এই জিমেইল-এ (${displayGmail}) লগইন সংক্রান্ত সমস্যা আছে Reject❌চেক করে আবার sell করুন।😊`;
                nType = 'warning';
              }

              if (msg) await sendNotification(listing.sellerId, msg, nType, { listingId: id, gmail: listing.gmailAccount });
            }
          }
          successCount++;
        } catch (itemErr) {
          console.error(`Error processing listing ${id}:`, itemErr);
        }
      }
      alert(`${successCount}টি লিস্টিং সফলভাবে ${action === 'Delete' ? 'ডিলিট' : 'আপডেট'} করা হয়েছে!`);
      
      if (action === 'Approved' || action === 'Dispute' || action === 'Sold' || action === 'SellRequest') {
        cleanupOldListings(action);
      }
      
      setAdminSelectedListings([]);
    } catch (err: any) {
      alert('Bulk action error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentVerification = async (payment: any) => {
    if (!isAdmin) return;
    if (!confirm(`Are you sure you want to verify this payment of ৳${payment.amount}?`)) return;

    setIsSubmitting(true);
    try {
      const { runTransaction } = await import('firebase/firestore');

      const result = await runTransaction(db, async (transaction) => {
        const paymentRef = doc(db, 'payments', payment.id);
        const pSnap = await transaction.get(paymentRef);
        if (!pSnap.exists()) throw new Error("Payment not found");
        if (pSnap.data().status === 'verified') return;

        const userId = payment.userId;
        const itemIds = payment.itemIds || [];
        const listingId = payment.listingId;

        // 1. READ PHASE: Gather all info first
        const listingsToProcess = [];
        if (listingId !== 'deposit' && itemIds && itemIds.length > 0) {
          for (const id of itemIds) {
            const listingRef = doc(db, 'listings', id);
            const listingSnap = await transaction.get(listingRef);
            if (!listingSnap.exists()) continue;
            const lData = listingSnap.data();

            // Ignore if already sold (maybe parallel?)
            if (lData.status === 'Sold') continue;

            const credRef = doc(db, `listings/${id}/private`, 'credentials');
            const credSnap = await transaction.get(credRef);
            const creds = credSnap.exists() ? credSnap.data() : null;

            listingsToProcess.push({ id, ref: listingRef, data: lData, credentials: creds });
          }
        }

        // 2. WRITE PHASE: Perform all updates
        const profileRef = doc(db, 'profiles', userId);

        if (listingId === 'deposit') {
          transaction.update(profileRef, {
            balance: increment(Number(payment.amount)),
            totalSpent: increment(Number(payment.amount)),
            updatedAt: serverTimestamp()
          });
          transaction.delete(paymentRef);
        } 
        else if (listingsToProcess.length > 0) {
          let totalDirectSpent = 0;
          for (const item of listingsToProcess) {
            const { id, ref: listingRef, data: lData, credentials: creds } = item;
            totalDirectSpent += Number(lData.price);

            // Release to Buyer
            transaction.update(listingRef, {
              status: 'Sold',
              soldTo: userId,
              updatedAt: serverTimestamp()
            });

            // Create Purchase Record
            const purchaseId = `${userId}_${id}`;
            transaction.set(doc(db, 'purchases', purchaseId), {
              userId,
              userEmail: payment.userEmail,
              listingId: id,
              gmailAccount: lData.gmailAccount,
              sellerId: lData.sellerId || 'admin',
              price: lData.price,
              credentials: creds ? {
                email: creds.email,
                password: creds.password,
                recovery: creds.recoveryEmail || creds.recovery || '',
                twoFactor: creds.twoFactor || ''
              } : null,
              purchasedAt: serverTimestamp(),
              status: 'Success'
            });

            // Update Seller Stats if not admin
            if (lData.sellerId && lData.sellerId !== 'admin') {
              const sellerRef = doc(db, 'profiles', lData.sellerId);
              transaction.update(sellerRef, {
                balance: increment(Number(lData.price)),
                totalSales: increment(1),
                totalEarned: increment(Number(lData.price)),
                updatedAt: serverTimestamp()
              });
            }
          }

          // Update Buyer Profile for direct purchase
          transaction.update(profileRef, {
            totalOrders: increment(listingsToProcess.length),
            totalSpent: increment(totalDirectSpent),
            updatedAt: serverTimestamp()
          });

          transaction.delete(paymentRef);
        } else {
          transaction.delete(paymentRef);
        }

        return listingsToProcess.map(l => l.data.gmailAccount).join(', ');
      });

      const soldGmails = result as string;
      await sendNotification(payment.userId, `আপনার পেমেন্ট (৳${payment.amount}) সফলভাবে ভেরিফাই করা হয়েছে! ${soldGmails ? `জিমেইল: ${soldGmails}` : ''}`, 'success');
      alert('Payment fulfilled successfully!');
    } catch (err: any) {
      console.error('Verification failed:', err);
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentRejection = async (payment: any) => {
    if (!isAdmin) return;
    const reason = prompt('Reason for rejection? (Optional)');
    if (confirm('Are you sure you want to REJECT this payment?')) {
      setIsSubmitting(true);
      try {
        await updateDoc(doc(db, 'payments', payment.id), {
          status: 'rejected',
          rejectionReason: reason || '',
          updatedAt: serverTimestamp()
        });

        // Unlock listings
        if (payment.itemIds) {
          for (const id of payment.itemIds) {
            await updateDoc(doc(db, 'listings', id), {
              status: 'Available',
              updatedAt: serverTimestamp()
            });
          }
        }

        await sendNotification(payment.userId, `আপনার পেমেন্ট (৳${payment.amount}) রিজেক্ট করা হয়েছে। কারণ: ${reason || 'তথ্য অমিল'}`, 'error');
        alert('Payment rejected.');
      } catch (err: any) {
        alert('Error: ' + err.message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const cleanupOldListings = async (status: string) => {
    try {
      const q = query(
        collection(db, 'listings'),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      if (snap.size > 10) {
        const toDelete = snap.docs.slice(10);
        for (const d of toDelete) {
          await deleteDoc(doc(db, 'listings', d.id));
        }
        console.log(`Cleanup: Deleted ${toDelete.length} old ${status} listings.`);
      }
    } catch (e) {
      console.error('Cleanup error:', e);
    }
  };

  const updateListingStatus = async (listingId: string, status: string, extraData: any = {}) => {
    if (!isAdmin) {
      console.error('Not an admin. Email:', user?.email);
      alert('Only administrators can perform this action.');
      return;
    }
    setIsSubmitting(true);
    try {
      console.log(`Updating listing ${listingId} to status ${status}`, extraData);
      
      const updatePayload: any = {
        status,
        ...extraData,
        updatedAt: serverTimestamp()
      };

      // Auto-set market price when going Live
      if (status === 'Available') {
        const snap = await getDoc(doc(db, 'listings', listingId));
        if (snap.exists()) {
          const lData = snap.data();
          const priceObj = gmailPrices[lData.type] as { seller: string, buyer: string };
          if (priceObj?.buyer) {
            updatePayload.price = parseFloat(priceObj.buyer);
          }
        }
      }

      await updateDoc(doc(db, 'listings', listingId), updatePayload);

      // Trigger cleanup for server optimization
      if (status === 'Approved' || status === 'Dispute' || status === 'Sold' || status === 'SellRequest') {
        cleanupOldListings(status);
      }

      // Notification for seller
      if (status === 'Available' || status === 'Dispute') {
        const snap = await getDoc(doc(db, 'listings', listingId));
        if (snap.exists()) {
          const lData = snap.data();
          if (lData.sellerId && lData.sellerId !== 'admin') {
            if (status === 'Available') {
              const displayGmail = lData.realGmail || lData.gmailAccount || '...';
              await sendNotification(
                lData.sellerId,
                `আপনার জিমেইল (${displayGmail}) সফলভাবে Approved হয়েছে এবং Marketplace-এ লিস্টিং করা হয়েছে।`,
                'success',
                { listingId, gmail: displayGmail }
              );
            } else if (status === 'Dispute') {
              const displayGmail = lData.realGmail || lData.gmailAccount || '...';
              await sendNotification(
                lData.sellerId,
                `⚠️আপনার এই জিমেইল-এ (${displayGmail}) লগইন সংক্রান্ত সমস্যা আছে Reject❌চেক করে আবার sell করুন।😊`,
                'warning',
                { listingId, gmail: displayGmail }
              );
            }
          }
        }
      }
      alert(`Status updated to ${status}!`);
    } catch (err: any) {
      console.error('Update failed:', err);
      if (err.message?.includes('permission')) {
        alert('Permission Denied: Access rules blocked this change.');
      } else {
        alert('Error: ' + err.message);
      }
      handleFirestoreError(err, OperationType.UPDATE, `listings/${listingId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddListingModal = () => {
    const defaultType = 'Full Fresh New';
    const defaultPrice = gmailPrices[defaultType]?.buyer || '16';
    setEditListingForm({
      gmailAccount: '',
      type: defaultType,
      price: defaultPrice,
      email: '',
      password: '',
      recoveryEmail: '',
      twoFactor: '',
      bkashNumber: '',
      status: 'Available',
      description: ''
    });
    setEditingListing({ id: 'new' });
  };

  const updateFullListing = async (listingId: string, forcedStatus?: string) => {
    if (!isAdmin) return;
    setIsSubmitting(true);
    try {
      const finalStatus = forcedStatus || editListingForm.status;

      if (listingId === 'new') {
        const listingRef = await addDoc(collection(db, 'listings'), {
          sellerId: 'admin',
          sellerNumericId: 'ADMIN',
          gmailAccount: editListingForm.gmailAccount,
          type: editListingForm.type,
          price: parseFloat(editListingForm.price),
          status: finalStatus,
          bkashNumber: editListingForm.bkashNumber || '',
          description: editListingForm.description || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        await setDoc(doc(db, `listings/${listingRef.id}/private`, 'credentials'), {
          email: editListingForm.email,
          password: editListingForm.password,
          recoveryEmail: editListingForm.recoveryEmail || '',
          twoFactor: editListingForm.twoFactor || ''
        });
        alert('Listing added successfully!');
      } else {
        // 1. Update Public Listing
        await updateDoc(doc(db, 'listings', listingId), {
          gmailAccount: editListingForm.gmailAccount,
          type: editListingForm.type,
          price: parseFloat(editListingForm.price),
          status: finalStatus,
          bkashNumber: editListingForm.bkashNumber || '',
          description: editListingForm.description || '',
          updatedAt: serverTimestamp()
        });

        // Notification for seller if approved or dispute
        if (finalStatus === 'Available' || finalStatus === 'Dispute') {
          const snap = await getDoc(doc(db, 'listings', listingId));
          if (snap.exists()) {
            const lData = snap.data();
            if (lData.sellerId && lData.sellerId !== 'admin') {
              if (finalStatus === 'Available') {
                const displayGmail = lData.realGmail || lData.gmailAccount || '...';
                await sendNotification(
                  lData.sellerId,
                  `আপনার জিমেইল (${displayGmail}) সফলভাবে Approved হয়েছে এবং Marketplace-এ লিস্টিং করা হয়েছে।`,
                  'success',
                  { listingId, gmail: displayGmail }
                );
              } else if (finalStatus === 'Dispute') {
                const displayGmail = lData.realGmail || lData.gmailAccount || '...';
                await sendNotification(
                  lData.sellerId,
                  `⚠️আপনার এই জিমেইল-এ (${displayGmail}) লগইন সংক্রান্ত সমস্যা আছে Reject❌চেক করে আবার sell করুন।😊`,
                  'warning',
                  { listingId, gmail: displayGmail }
                );
              }
            }
          }
        }

        // 2. Update Private Credentials
        await setDoc(doc(db, `listings/${listingId}/private`, 'credentials'), {
          email: editListingForm.email,
          password: editListingForm.password,
          recoveryEmail: editListingForm.recoveryEmail || '',
          twoFactor: editListingForm.twoFactor || ''
        });
        alert('Listing updated successfully!');
      }

      setEditingListing(null);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteListing = async (listingId: string) => {
    if (!isAdmin) return;
    if (!confirm('আপনি কি নিশ্চিত যে এই লিস্টিংটি ডিলিট করতে চান? এটি সার্ভার থেকে চিরতরে মুছে যাবে।')) return;
    try {
      // Delete the listing document itself
      await deleteDoc(doc(db, 'listings', listingId));
      console.log(`Listing ${listingId} permanently deleted.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `listings/${listingId}`);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      // 1. Try to load from Cache first to avoid empty screen
      const cachedHeadline = localStorage.getItem('cache_headline');
      const cachedNotice = localStorage.getItem('cache_notice');
      const cachedPrices = localStorage.getItem('cache_prices');

      if (cachedHeadline) {
        try { const h = JSON.parse(cachedHeadline); setHeadline(h); setPendingHeadline(h.text); setPendingSpeed(h.speed); } catch(e){}
      }
      if (cachedNotice) setNoticeText(cachedNotice); setPendingNotice(cachedNotice || "");
      if (cachedPrices) {
        try { setGmailPrices(JSON.parse(cachedPrices)); } catch(e){}
      }

      try {
        // Fetch Headline
        const headDocRef = doc(db, 'settings', 'headline');
        const headSnap = await getDoc(headDocRef);
        if (headSnap.exists()) {
          const data = headSnap.data() as any;
          setHeadline(data);
          setPendingHeadline(data.text);
          setPendingSpeed(data.speed);
          localStorage.setItem('cache_headline', JSON.stringify(data));
        }

        // Fetch Pricing
        const priceDocRef = doc(db, 'settings', 'pricing');
        const priceSnap = await getDoc(priceDocRef);
        if (priceSnap.exists()) {
          const data = priceSnap.data();
          const updatedPrices: Record<string, { seller: string, buyer: string }> = {};
          Object.keys(DEFAULT_GMAIL_PRICES).forEach(key => {
            if (data[key]) {
              if (typeof data[key] === 'string') {
                updatedPrices[key] = { seller: data[key], buyer: data[key] };
              } else {
                updatedPrices[key] = data[key] as { seller: string, buyer: string };
              }
            } else {
              updatedPrices[key] = DEFAULT_GMAIL_PRICES[key];
            }
          });
          setGmailPrices(updatedPrices);
          localStorage.setItem('cache_prices', JSON.stringify(updatedPrices));
        }

        // Fetch Notice
        const noticeDocRef = doc(db, 'settings', 'notice');
        const noticeSnap = await getDoc(noticeDocRef);
        if (noticeSnap.exists()) {
          const data = noticeSnap.data();
          setNoticeText(data.text);
          setPendingNotice(data.text);
          localStorage.setItem('cache_notice', data.text);
        }
        setQuotaExceeded(false);
      } catch (err: any) {
        console.warn("Settings fetch failed:", err);
        if (err.message && (err.message.includes('quota') || err.message.includes('exhausted'))) {
          setQuotaExceeded(true);
        }
      }
    };
    fetchSettings();
  }, [isAdmin]);

  // Real-time synchronization of selling prices for Sell Form
  useEffect(() => {
    if (gmailPrices[sellForm.type]) {
      const livePrice = gmailPrices[sellForm.type].seller;
      if (sellForm.price !== livePrice) {
        setSellForm(prev => ({ ...prev, price: livePrice }));
      }
    }
  }, [gmailPrices, sellForm.type]);

  const updateHeadline = async (text: string, speed: number) => {
    if (!isAdmin) return;
    try {
      await setDoc(doc(db, 'settings', 'headline'), { text, speed: Number(speed) });
      alert('Headline updated!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/headline');
    }
  };

  const updateNotice = async (text: string) => {
    if (!isAdmin) return;
    try {
      await setDoc(doc(db, 'settings', 'notice'), { text });
      alert('Notice Board updated!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/notice');
    }
  };

  const updateUserBalance = async (identifier: string, amount: number) => {
    if (!isAdmin) return;
    try {
      let targetUid = '';
      
      // Try numeric ID first
      if (/^\d+$/.test(identifier) && identifier.length < 15) {
        const q = query(collection(db, 'profiles'), where('numericId', '==', identifier));
        const snap = await getDocs(q);
        if (!snap.empty) {
          targetUid = snap.docs[0].id;
        }
      }

      // Try email if Numeric ID didn't resolve
      if (!targetUid) {
        const q = query(collection(db, 'profiles'), where('email', '==', identifier));
        const snap = await getDocs(q);
        if (!snap.empty) {
          targetUid = snap.docs[0].id;
        } else {
          // Check if it's already a UID
          const profileDoc = await getDoc(doc(db, 'profiles', identifier));
          if (profileDoc.exists()) {
            targetUid = identifier;
          }
        }
      }

      if (!targetUid) {
        alert('User ID or Email not found!');
        return;
      }

      await updateDoc(doc(db, 'profiles', targetUid), {
        balance: Number(amount),
        updatedAt: serverTimestamp()
      });
      alert('Balance updated for ' + identifier);
      
      // Send notification about balance update
      await sendNotification(targetUid, `Admin has updated your balance to ৳${amount}`, 'success');
    } catch (err: any) {
      alert('Error updating balance: ' + err.message);
    }
  };

    if (loading) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      );
    }

  if (user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex justify-center font-sans selection:bg-indigo-600/10 text-slate-900">
        <div className="w-full max-w-[480px] bg-white min-h-screen relative flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.04)]">
          {/* Sidebar Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60]"
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                className="fixed top-0 left-0 bottom-0 w-[310px] bg-white z-[70] shadow-2xl flex flex-col border-r border-slate-100"
              >
                {/* Drawer Header */}
                <div className="bg-indigo-600 p-10 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/10 rounded-full blur-2xl -ml-16 -mb-16" />
                  
                  <div className="relative z-10 space-y-8">
                    <div className="flex justify-between items-start">
                      <div className="w-20 h-20 bg-white p-1 rounded-[2.35rem] shadow-2xl ring-4 ring-white/20 overflow-hidden">
                        <div className="w-full h-full bg-slate-50 rounded-[2.2rem] flex items-center justify-center overflow-hidden">
                          {userProfile?.photoURL ? (
                            <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <UserIcon className="text-indigo-600" size={32} />
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={() => setIsSidebarOpen(false)}
                        className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-2xl transition-all active:scale-90"
                      >
                        <X size={24} />
                      </button>
                    </div>
                    <div 
                      onClick={() => { setView('profile'); setIsSidebarOpen(false); }}
                      className="space-y-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <h3 className="font-display font-black text-2xl tracking-tight leading-none">{userProfile?.displayName || user.displayName || 'G.BuySell User'}</h3>
                      <div className="flex items-center gap-2 pt-1 opacity-90">
                        <div className="px-3 py-1 bg-white/20 rounded-full flex items-center gap-2">
                          <Wallet size={14} className="text-white" />
                          <span className="text-[12px] font-black tracking-wide">৳{userProfile?.balance?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-white/30" />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Verified Account</span>
                      </div>
                    </div>
                  </div>
                </div>                {/* Sidebar Navigation */}
                <div className="flex-1 overflow-y-auto px-2 py-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-4">Main Menu</p>
                  <nav className="space-y-1.5">
                    {[
                      { icon: Home, label: 'Dashboard', action: () => { setView('marketplace'); setIsSidebarOpen(false); } },
                      { icon: Share2, label: 'Refer & Earn', action: () => { setShowReferModal(true); setIsSidebarOpen(false); } },
                      { icon: ShoppingBag, label: 'Gmail Market', action: () => { setView('gmail-market'); setIsSidebarOpen(false); } },
                      { icon: Mail, label: 'জিমেইল বিক্রি করুন', action: () => { setView('seller-center'); setIsSidebarOpen(false); } },
                      { icon: UserIcon, label: 'Account Profile', action: () => { setView('profile'); setIsSidebarOpen(false); } },
                      isAdmin && { icon: Shield, label: 'Administration', action: () => { setView('admin'); setIsSidebarOpen(false); }, special: true },
                    ].filter(Boolean).map((item: any, i) => (
                      <button
                        key={i}
                        onClick={item.action}
                        className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm group ${item.special ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}`}
                      >
                        <item.icon size={20} strokeWidth={item.special ? 2.5 : 2} className={item.special ? '' : 'text-slate-400 group-hover:text-indigo-500 transition-colors'} />
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.special && <Crown size={14} className="animate-pulse" />}
                      </button>
                    ))}

                    {/* Sell & Earn Expansion Menu */}
                    <div className={`space-y-1 ${isSellEarnOpen ? 'bg-indigo-600/5 rounded-2xl' : ''}`}>
                      <button
                        onClick={() => setIsSellEarnOpen(!isSellEarnOpen)}
                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-colors font-bold text-sm ${isSellEarnOpen ? 'text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${isSellEarnOpen ? 'bg-indigo-600/10' : 'bg-slate-100 group-hover:bg-indigo-600/10'} transition-colors`}>
                            <Plus size={18} className={isSellEarnOpen ? 'text-indigo-600' : 'text-slate-500'} />
                          </div>
                          <span>বিক্রি এবং আয়</span>
                        </div>
                        {isSellEarnOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                      <AnimatePresence>
                        {isSellEarnOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden pl-12 pb-2 space-y-0.5"
                          >
                            <button 
                              onClick={() => { setView('seller-center'); setIsSidebarOpen(false); }}
                              className="w-full flex items-center gap-3 py-2 text-sm text-slate-700 hover:text-indigo-600 font-medium transition-colors group"
                            >
                              <Mail size={18} className="text-slate-400 group-hover:text-indigo-600" />
                              জিমেইল বিক্রি করুন
                            </button>
                            <button className="w-full flex items-center gap-3 py-2 text-sm text-slate-700 hover:text-blue-500 font-medium transition-colors group">
                              <Send size={18} className="text-blue-500" />
                              টেলিগ্রাম ওটিপি বিক্রি
                            </button>
                            <button className="w-full flex items-center gap-3 py-2 text-sm text-slate-700 hover:text-green-500 font-medium transition-colors group">
                              <MessageSquare size={18} className="text-green-500" />
                              হোয়াটসঅ্যাপ ওটিপি বিক্রি
                            </button>
                            <button className="w-full flex items-center gap-3 py-2 text-sm text-slate-700 hover:text-teal-500 font-medium transition-colors group">
                              <Gift size={18} className="text-teal-500" />
                              Task & Earn
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {[
                      { icon: Headphones, label: 'Support Center', action: () => {
                        window.open('https://wa.me/8801410731308', '_blank');
                        setIsSidebarOpen(false);
                      }},
                    ].map((item, i) => (
                      <button
                        key={i}
                        onClick={item.action}
                        className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors font-bold text-sm"
                      >
                        <item.icon size={20} />
                        {item.label}
                      </button>
                    ))}

                    <div className="h-px bg-slate-100 my-4 mx-4" />

                    <button
                      onClick={() => {
                        handleLogout();
                        setIsSidebarOpen(false);
                      }}
                      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors font-bold text-sm"
                    >
                      <LogOut size={20} />
                      Logout
                    </button>
                  </nav>
                </div>

                {/* Footer Credits */}
                <div className="p-6 border-t border-slate-50">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] text-center">Version 2.4.0</p>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-3 sm:px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 active:scale-90 transition-all border border-slate-100"
            >
              <Menu size={16} strokeWidth={2.5} />
            </button>
            <div 
              onClick={() => {
                setView('marketplace');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group flex items-center gap-2 hover:opacity-90 transition-all cursor-pointer select-none"
            >
              <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-lg shadow-indigo-100 ring-1 ring-slate-100 group-hover:scale-110 transition-transform relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-50 to-white opacity-50" />
                <Mail size={16} strokeWidth={2.5} className="relative z-10" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-display text-xs xs:text-sm font-black tracking-tight text-slate-900">
                  Gmail Buy & Sell <span className="text-indigo-600">BD</span>
                </span>
                <span className="text-[6px] font-bold text-slate-400 uppercase tracking-widest -mt-0.5 whitespace-nowrap">Trusted Marketplace</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 xs:gap-2">
            <button className="w-8 h-8 flex items-center justify-center text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all active:scale-90 border border-indigo-100">
              <Star size={14} fill="currentColor" strokeWidth={2.5} />
            </button>
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="w-9 h-9 flex items-center justify-center text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all relative group active:scale-90 border border-slate-100"
              >
                <Bell size={18} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-indigo-600 border-2 border-white rounded-full text-[7px] text-white flex items-center justify-center font-black animate-bounce shadow-md">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
              
              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-[280px] bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 origin-top-right flex flex-col max-h-[60vh]"
                    >
                      <div className="p-4 border-b border-slate-50 bg-white sticky top-0 z-10 flex justify-between items-center">
                        <h3 className="font-display text-base font-black text-slate-800 tracking-tight">Notifications</h3>
                        <button 
                          onClick={markAllNotificationsRead}
                          className="flex items-center gap-1.5 text-[9px] font-black text-blue-600 uppercase tracking-widest hover:bg-blue-50 px-2 py-1 rounded-lg transition-all"
                        >
                          Clear
                        </button>
                      </div>
                      
                      <div className="overflow-y-auto bg-slate-50/30">
                        {notifications.length === 0 ? (
                          <div className="p-10 text-center space-y-3">
                            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                              <Bell size={24} />
                            </div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div 
                              key={notif.id}
                              onClick={() => markNotificationRead(notif.id)}
                              className={`p-4 border-b border-slate-100 transition-all cursor-pointer relative group ${notif.read ? 'bg-white opacity-60' : 'bg-white hover:bg-slate-50'}`}
                            >
                              {!notif.read && <div className="absolute top-4 left-4 w-2 h-2 bg-blue-500 rounded-full" />}
                              <div className="pl-5 space-y-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {notif.type === 'warning' && <AlertCircle size={14} className="text-orange-500" />}
                                    {notif.type === 'success' && <CheckCircle size={14} className="text-green-500" />}
                                    {notif.type === 'error' && <Trash2 size={14} className="text-red-500" />}
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${notif.read ? 'text-slate-400' : 'text-slate-800'}`}>
                                      {notif.message.split(':')[0]}
                                    </span>
                                  </div>
                                  {!notif.read && <CheckCircle size={14} className="text-slate-200 group-hover:text-blue-500 transition-colors" />}
                                </div>
                                <p className={`text-xs leading-relaxed ${notif.read ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                                  {notif.message.includes(':') ? notif.message.split(':').slice(1).join(':').trim() : notif.message}
                                </p>
                                {(notif.details?.gmailAccount || notif.details?.gmail) && (
                                  <div className="flex items-center justify-between mt-1.5 p-2 bg-slate-100/50 rounded-xl border border-slate-200/50">
                                    <div className="flex items-center gap-2">
                                      <Mail size={12} className="text-slate-500" />
                                      <span className="text-[10px] font-black text-slate-700 font-mono tracking-tight">{notif.details.gmailAccount || notif.details.gmail}</span>
                                    </div>
                                    {notif.details?.listingId && (notif.type === 'warning' || notif.type === 'error' || notif.message.toLowerCase().includes('reject') || notif.message.toLowerCase().includes('problem') || notif.message.includes('সমস্যা')) && (
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setView('seller-center');
                                          openSellerEditModal(notif.details.listingId);
                                          setIsNotificationsOpen(false);
                                        }}
                                        className="text-[10px] font-black text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 transition-all active:scale-95 shadow-sm shadow-blue-500/10"
                                      >
                                        Check Now
                                      </button>
                                    )}
                                  </div>
                                )}
                                <div className="flex items-center justify-between pt-1">
                                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                                    {notif.fromName} • {notif.createdAt?.toDate ? new Date(notif.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                  </span>
                                  <span className="text-[9px] text-slate-300 font-mono">ID: {notif.toUserId?.substring(0, 5)}</span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      
                      {notifications.length > 0 && (
                        <div className="p-3 bg-white border-t border-slate-50 text-center">
                          <button className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-600 transition-colors">See all activity</button>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </nav>
        
        {/* Scrolling Headline Banner */}
        <div className="bg-slate-900 py-2.5 overflow-hidden whitespace-nowrap relative border-b border-white/10 shadow-2xl">
          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-slate-900 to-transparent z-10" />
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-slate-900 to-transparent z-10" />
          
          <motion.div 
            animate={{ x: ["0%", "-100%"] }}
            transition={{ repeat: Infinity, duration: headline.speed || 30, ease: "linear" }}
            className="inline-block"
          >
            <div className="flex items-center gap-12 px-12">
              <span className="flex items-center gap-3 text-[#FFE500] text-xs font-black uppercase tracking-[0.2em] whitespace-nowrap drop-shadow-[0_0_8px_rgba(255,229,0,0.4)]">
                <Bell size={14} className="animate-bounce" />
                {headline.text}
              </span>
              <span className="flex items-center gap-3 text-white text-xs font-black uppercase tracking-[0.2em] whitespace-nowrap opacity-40">
                <Shield size={14} />
                Bangladesh Trusted Marketplace
              </span>
              <span className="flex items-center gap-3 text-[#FFE500] text-xs font-black uppercase tracking-[0.2em] whitespace-nowrap drop-shadow-[0_0_8px_rgba(255,229,0,0.4)]">
                <Bell size={14} className="animate-bounce" />
                {headline.text}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-3 md:px-6 py-4">
          <AnimatePresence mode="wait">
            {view === 'marketplace' ? (
              <motion.div
                key="marketplace"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Hero section */}
                <section className="bg-indigo-600 rounded-lg aspect-[16/9] md:aspect-video overflow-hidden pt-4 pb-1.5 px-3.5 md:pt-5 md:pb-2 md:px-6 text-center shadow-xl relative mb-6 flex flex-col justify-between items-center border border-white/10">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-300/10 rounded-full blur-2xl -ml-12 -mb-12" />
                  
                  {/* Top Status Pills */}
                  <div className="relative z-10 flex flex-wrap justify-center gap-1.5 md:gap-2">
                    <div className="flex items-center gap-1.5 bg-[#4B44D4] border border-white/15 px-3 py-1 rounded-full shadow-sm">
                      <div className="w-3.5 h-3.5 rounded-full overflow-hidden border border-white/40">
                         <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="admin" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[7.5px] md:text-[9.5px] font-black text-white uppercase tracking-wider flex items-center gap-1">
                        ADMIN <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div> <span className="text-green-400 text-[6.5px] md:text-[8px] font-bold">Online</span>
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 bg-[#4B44D4] border border-white/15 px-3 py-1 rounded-full shadow-sm text-[7.5px] md:text-[9.5px] font-black text-white uppercase tracking-wider">
                      <Clock size={10} className="text-[#FFEB3B]" />
                      <span>9 AM - 11 PM</span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-[#4B44D4] border border-white/15 px-3 py-1 rounded-full shadow-sm text-[7.5px] md:text-[9.5px] font-black text-white uppercase tracking-wider">
                      <Calendar size={10} className="text-[#BBDEFB]" />
                      <span>{formattedDate}</span>
                    </div>
                  </div>

                  {/* Main Title */}
                  <div className="relative z-10 w-full animate-in zoom-in-95 duration-500">
                    <h2 className="font-display text-[30px] md:text-[48px] font-black italic tracking-tighter text-white leading-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.3)] select-none">
                      Gmail Buy & Sell <span className="text-[#FFEB3B] drop-shadow-md">BD</span>
                    </h2>
                  </div>

                  {/* Reference Design Notice Box */}
                  <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3.5 pt-1.5 pb-4 md:px-5 md:pt-2 md:pb-6 w-full max-w-[95%] shadow-2xl overflow-hidden group hover:bg-white/15 transition-all">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#FFD600]" />
                    <div className="flex gap-3 md:gap-4">
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="bg-[#FFD600] w-4 h-4 rounded-full flex items-center justify-center">
                            <Info size={9} className="text-slate-900" strokeWidth={4} />
                          </div>
                          <span className="text-[#FFD600] font-black uppercase tracking-[0.1em] text-[10px] md:text-[11px]">NOTICE বোর্ড</span>
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                        </div>
                        <p className="text-white text-[10px] md:text-[13px] font-bold leading-snug tracking-tight drop-shadow-sm">
                          {noticeText}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Navigation Buttons */}
                  <div className="relative z-10 flex gap-2 md:gap-3 w-full justify-center mt-2">
                    <button 
                      onClick={() => setView('gmail-market')}
                      className="px-3.5 py-1 bg-white text-[#4F46E5] rounded-lg text-[7px] md:text-[9px] font-black uppercase tracking-[0.1em] flex items-center justify-center gap-1.5 shadow-lg hover:bg-indigo-50 active:scale-95 transition-all"
                    >
                      <Store size={10} />
                      MARKET
                    </button>
                    <button 
                      onClick={() => setView('profile')}
                      className="px-3.5 py-1 bg-[#5E58E1] border border-white/20 text-white rounded-lg text-[7px] md:text-[9px] font-black uppercase tracking-[0.1em] flex items-center justify-center gap-1.5 shadow-xl hover:bg-indigo-500 transition-all active:scale-95"
                    >
                      <UserIcon size={10} />
                      ACCOUNT
                    </button>
                  </div>
                </section>

                {/* Quick Action Grid Menu */}
                <section className="grid grid-cols-2 md:grid-cols-4 gap-1.5 mb-5">
                  {[
                    { title: "জিমেইল বিক্রি", icon: Send, color: "text-emerald-600", bgColor: "bg-emerald-50", label: "Sell", action: () => setView('seller-center') },
                    { title: "জিমেইল কিনুন", icon: ShoppingBag, color: "text-blue-600", bgColor: "bg-blue-50", label: "Buy", action: () => setView('gmail-market') },
                    { title: "Refer Link", icon: Share2, color: "text-indigo-600", bgColor: "bg-indigo-50", label: "Bonus", action: () => setShowReferModal(true) },
                    { title: "Deposit", icon: Wallet, color: "text-orange-600", bgColor: "bg-orange-50", label: "Add", action: () => setShowPaymentModal({ show: true, price: 0 }) },
                  ].map((item, i) => (
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      key={i}
                      onClick={item.action}
                      className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-white border border-slate-50 shadow-sm transition-all text-center relative overflow-hidden active:bg-slate-50"
                    >
                      <div className={`w-7 h-7 md:w-10 md:h-10 ${item.bgColor} ${item.color} rounded-md flex items-center justify-center`}>
                        <item.icon size={14} className="md:w-5 md:h-5" strokeWidth={2.5} />
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-slate-800 text-[10px] md:text-sm tracking-tight">{item.title}</span>
                        <span className="text-[5px] md:text-[7px] text-slate-400 font-bold uppercase tracking-widest opacity-70 leading-none">{item.label}</span>
                      </div>
                    </motion.button>
                  ))}
                </section>

                {/* Featured Listings Section */}
                <div className="flex items-center justify-between mb-2">
                  <div className="space-y-0.5">
                    <h3 className="font-display text-xs font-black tracking-tight text-slate-900">Featured</h3>
                    <p className="text-[6px] font-bold text-slate-400 uppercase tracking-widest leading-none">Best deals</p>
                  </div>
                  <button 
                    onClick={() => setView('gmail-market')} 
                    className="bg-white border border-slate-200 px-2 py-1 rounded-md text-[7px] font-black text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-widest leading-none shadow-sm"
                  >
                    All
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-1 mb-5">
                  {filteredMarketListings.slice(0, 5).length > 0 ? (
                    filteredMarketListings.slice(0, 5).map((item, i) => (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * i }}
                        key={item.id}
                        onClick={() => setView('gmail-market')}
                        className="bg-white rounded-lg border border-slate-50 shadow-sm hover:shadow-md transition-all p-2 flex items-center justify-between gap-2 group cursor-pointer active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-7 h-7 bg-slate-50 rounded flex items-center justify-center shrink-0 border border-slate-50 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <Mail size={12} className="group-hover:text-white text-indigo-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 mb-0.5">
                               <h4 className="font-display text-[9px] md:text-sm font-black text-slate-800 truncate">
                                  {item.maskedEmail || item.gmailAccount}
                               </h4>
                               <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-50 rounded-full border border-green-100 shrink-0">
                                 <div className="w-1 h-1 bg-green-500 rounded-full" />
                                 <span className="text-[6px] md:text-[8px] font-black text-green-600 uppercase tracking-widest leading-none">Available</span>
                               </div>
                            </div>
                            <p className="text-[6px] md:text-[8px] font-black text-blue-600 uppercase tracking-tight">
                              {item.type || 'FRESH'}
                            </p>
                            {item.description && (
                              <p className="text-[7px] md:text-[10px] text-slate-500 font-medium leading-tight mt-0.5 line-clamp-none">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>

                            <div className="flex items-center gap-2 shrink-0">
                                {(() => {
                                  const priceObj = gmailPrices[item.type];
                                  const displayPrice = priceObj?.buyer ? parseFloat(priceObj.buyer) : item.price;
                                  return (
                                    <p className="text-[10px] md:text-base font-black text-slate-900">৳{displayPrice.toFixed(0)}</p>
                                  );
                                })()}
                                <button 
                            className="bg-indigo-600 hover:bg-slate-900 text-white font-black px-2.5 py-1 rounded-md text-[8px] md:text-xs uppercase tracking-widest transition-all active:scale-90 shadow-sm shadow-indigo-100"
                          >
                            BUY
                          </button>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="py-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[8px]">No active listings available</p>
                    </div>
                  )}
                </div>

                {/* Live Seller Activity Feed */}
                <section className="mb-4 space-y-2">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#FF5252] rounded-full animate-pulse shadow-[0_0_8px_rgba(255,82,82,0.6)]" />
                      <h3 className="font-display text-[10px] font-black tracking-[0.05em] text-slate-900 uppercase text-xs">Live Sell Activity</h3>
                    </div>
                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-[0.1em] bg-slate-100/80 px-2 py-0.5 rounded-full border border-slate-100">Realtime</span>
                  </div>

                  <div className="space-y-1 px-1">
                    <AnimatePresence initial={false}>
                      {[...liveSales]
                        .sort((a, b) => {
                          const isConfirmedA = a.status === 'Sold' || a.status === 'Approved';
                          const isConfirmedB = b.status === 'Sold' || b.status === 'Approved';
                          if (isConfirmedA !== isConfirmedB) return isConfirmedA ? 1 : -1;
                          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
                        })
                        .map((sale) => {
                          const email = sale.gmailAccount || sale.realGmail || 'gmail@gmail.com';
                        const prefix = email.split('@')[0];
                        const maskedEmail = prefix.length > 3 
                          ? prefix.substring(0, 3) + '*'.repeat(Math.min(prefix.length - 3, 7)) + '@' + email.split('@')[1]
                          : prefix + '***@' + email.split('@')[1];
                        
                        const isConfirmed = sale.status === 'Approved' || sale.status === 'Sold';
                        const isRejected = sale.status === 'Dispute';
                        
                        return (
                          <motion.div 
                            key={sale.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white border border-slate-50 rounded-lg p-1.5 shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isConfirmed ? 'bg-[#4CAF50]' : isRejected ? 'bg-red-500' : 'bg-[#FFC107] animate-pulse'}`} />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <p className="text-[10px] font-black text-[#1E293B] truncate leading-none tracking-tight">{maskedEmail}</p>
                                  {sale.sellerNumericId && (
                                    <span className="text-[7px] font-black bg-indigo-50 text-indigo-600 px-1 py-0.5 rounded leading-none border border-indigo-100/50">ID: {sale.sellerNumericId}</span>
                                  )}
                                </div>
                                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tight leading-none">
                                  {sale.type || 'Full Fresh New'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 shrink-0">
                               <div className="text-right">
                                 {(() => {
                                   const type = sale.type || 'Full Fresh New';
                                   const priceObj = gmailPrices[type] || Object.values(gmailPrices).find((_, i) => Object.keys(gmailPrices)[i].startsWith(type)) || gmailPrices['Full Fresh New'];
                                   const sellerPrice = priceObj?.seller ? parseFloat(priceObj.seller) : null;
                                   const displayPrice = sellerPrice || sale.price || 0;
                                   return (
                                     <p className="text-[11px] font-black text-[#5E35B1] leading-none mb-0.5">৳{typeof displayPrice === 'number' ? displayPrice.toFixed(0) : displayPrice}</p>
                                   );
                                 })()}
                               </div>

                              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#fdfdfd] border border-slate-50">
                                <div className={`w-1 h-1 rounded-full ${isConfirmed ? 'bg-[#4CAF50]' : isRejected ? 'bg-red-500' : 'bg-[#FFC107] animate-pulse'}`} />
                                <span className={`text-[7px] font-black uppercase tracking-widest leading-none ${isConfirmed ? 'text-green-600' : isRejected ? 'text-red-600' : 'text-yellow-600'}`}>
                                  {isConfirmed ? 'Payment confirm' : isRejected ? 'Rejected' : 'Payment pending'}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                    
                    {liveSales.length === 0 && (
                      <div className="w-full py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/10">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] animate-pulse">Syncing Network...</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Today's Gmail Sold Section */}
                <section className="mb-6 space-y-2">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#4CAF50] rounded-full shadow-[0_0_8px_rgba(76,175,80,0.6)]" />
                      <h3 className="font-display text-[10px] font-black tracking-[0.05em] text-slate-900 uppercase">Today's Gmail Sold</h3>
                    </div>
                    <div className="bg-green-50 border border-green-50 px-2 py-0.5 rounded-full">
                      <span className="text-[7px] font-black text-green-600 uppercase tracking-[0.1em]">
                        {todaySoldCount} Sold Today
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 px-1">
                    <AnimatePresence initial={false}>
                      {[...todaySold]
                        .sort((a, b) => {
                          const isConfirmedA = a.status === 'Sold' || a.status === 'Approved';
                          const isConfirmedB = b.status === 'Sold' || b.status === 'Approved';
                          if (isConfirmedA !== isConfirmedB) return isConfirmedA ? 1 : -1;
                          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
                        })
                        .map((sale) => {
                          const email = sale.gmailAccount || sale.realGmail || 'gmail@gmail.com';
                        const prefix = email.split('@')[0];
                        const maskedEmail = prefix.length > 3 
                          ? prefix.substring(0, 3) + '*'.repeat(Math.min(prefix.length - 3, 7)) + '@' + email.split('@')[1]
                          : prefix + '***@' + email.split('@')[1];
                        
                        const isConfirmed = sale.status === 'Sold' || sale.status === 'Approved';
                        const isPending = !isConfirmed && sale.status !== 'Dispute' && sale.status !== 'Rejected';
                        
                        return (
                          <motion.div 
                            key={sale.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white border border-slate-50 rounded-lg p-1.5 shadow-sm flex items-center justify-between group hover:border-slate-200 transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-1.5 h-1.5 rounded-full ${isConfirmed ? 'bg-[#4CAF50] shadow-[0_0_4px_rgba(76,175,80,0.4)]' : 'bg-[#FFC107] animate-pulse'}`} />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <p className="text-[10px] font-black text-[#1E293B] truncate leading-none tracking-tight">{maskedEmail}</p>
                                  {sale.sellerNumericId && (
                                    <span className="text-[7px] font-black bg-indigo-50 text-indigo-600 px-1 py-0.5 rounded leading-none border border-indigo-100/50">ID: {sale.sellerNumericId}</span>
                                  )}
                                </div>
                                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tight leading-none">
                                  {sale.type || 'Full Fresh New'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 shrink-0">
                               <div className="text-right">
                                 {(() => {
                                   const type = sale.type || 'Full Fresh New';
                                   const priceObj = gmailPrices[type] || Object.values(gmailPrices).find((_, i) => Object.keys(gmailPrices)[i].startsWith(type)) || gmailPrices['Full Fresh New'];
                                   const marketPrice = priceObj?.buyer ? parseFloat(priceObj.buyer) : null;
                                   const displayPrice = marketPrice || sale.price || 0;
                                   return (
                                     <p className="text-[11px] font-black text-[#5E35B1] leading-none mb-0.5">৳{typeof displayPrice === 'number' ? displayPrice.toFixed(0) : displayPrice}</p>
                                   );
                                 })()}
                               </div>

                              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${isConfirmed ? 'bg-green-50 border-green-50' : 'bg-yellow-50 border-yellow-50'}`}>
                                <div className={`w-1 h-1 rounded-full ${isConfirmed ? 'bg-[#4CAF50]' : 'bg-[#FFC107] animate-pulse'}`} />
                                <span className={`text-[7px] font-black uppercase tracking-widest leading-none ${isConfirmed ? 'text-green-600' : 'text-yellow-600'}`}>
                                  {isConfirmed ? 'Order Confirm' : 'Order pending'}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                    
                    {todaySold.length === 0 && (
                      <div className="w-full py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/10">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">No Sales Activity Yet Today</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Quick Stats Grid */}
                <section className="mb-6 grid grid-cols-2 gap-2 px-1">
                  {[
                    { label: "Top Seller", value: "Win", subValue: (topSellers[0]?.displayName || topSellers[0]?.name || topSellers[0]?.email?.split('@')[0] || "Ranked").toUpperCase(), icon: Trophy, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", action: () => setShowRankModal({ show: true, type: 'seller' }) },
                    { label: "Top Buyer", value: "Buy", subValue: (topBuyers[0]?.displayName || topBuyers[0]?.name || topBuyers[0]?.email?.split('@')[0] || "Ranked").toUpperCase(), icon: Crown, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100", action: () => setShowRankModal({ show: true, type: 'buyer' }) },
                    { label: "Total User", value: totalUsersCount.toLocaleString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
                    { label: "Real Time Live", value: globalSoldCount.toLocaleString() + " Sold", icon: Activity, color: "text-red-600", bg: "bg-red-50", border: "border-red-100" }
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      whileTap={{ scale: 0.95 }}
                      onClick={stat.action}
                      className={`${stat.bg} ${stat.border} ${stat.action ? 'cursor-pointer' : ''} rounded-xl p-2 md:p-3 border shadow-sm transition-all flex flex-col items-center justify-center text-center relative overflow-hidden`}
                    >
                      {/* Live Indicator */}
                      <div className="absolute top-1 right-1.5 flex items-center gap-0.5">
                        <div className={`w-1 h-1 rounded-full ${stat.color === 'text-white' ? 'bg-white' : stat.color.replace('text-', 'bg-')} animate-pulse`} />
                        <span className="text-[5px] font-black uppercase text-slate-400">Live</span>
                      </div>

                      <stat.icon size={16} className={`${stat.color} mb-1`} />
                      <p className="text-[7px] font-black uppercase tracking-wider text-slate-500 mb-0.5">{stat.label}</p>
                      <div className="flex flex-col items-center">
                        <p className={`text-[10px] md:text-sm font-black ${stat.color} leading-none mb-0.5`}>
                          {stat.value === "Win" || stat.value === "Buy" ? (
                            <span className="flex items-center gap-0.5">
                              {stat.value === "Win" ? "🏆" : "🛍️"} {stat.value}
                            </span>
                          ) : stat.value}
                        </p>
                        {stat.subValue && (
                          <p className="text-[6px] font-bold text-slate-400 truncate max-w-[80px]">{stat.subValue}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </section>

                {/* User Reviews Section */}
                <section className="mb-5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h3 className="font-display text-xs font-black tracking-tight text-slate-800">Reviews</h3>
                      <p className="text-[6px] font-bold text-slate-400 uppercase tracking-widest leading-none">Feedback</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-2.5">
                      {user ? (
                        <div className="flex gap-2">
                          <div className="w-7 h-7 rounded bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                             <UserIcon className="text-indigo-400" size={14} />
                          </div>
                          <div className="flex-1 space-y-1.5">
                            <textarea 
                              placeholder="আপনার মতামত লিখুন..."
                              value={reviewForm.text}
                              onChange={(e) => setReviewForm(prev => ({ ...prev, text: e.target.value }))}
                              className="w-full min-h-[50px] bg-slate-50 rounded p-2 text-[9px] font-medium focus:outline-none border border-slate-100"
                            />
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <input 
                                  type="file"
                                  ref={reviewFileInputRef}
                                  onChange={handleReviewPhotoUpload}
                                  accept="image/*"
                                  className="hidden"
                                />
                                <button 
                                  onClick={() => reviewFileInputRef.current?.click()}
                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${reviewForm.photo ? 'bg-green-100 text-green-600 border border-green-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}
                                >
                                  <Camera size={10} />
                                  {reviewForm.photo ? 'ছবি যুক্ত হয়েছে' : 'ছবি আপলোড'}
                                </button>
                              </div>
                              <button 
                                onClick={handleReviewSubmit}
                                disabled={isSubmitting}
                                className="bg-indigo-600 hover:bg-slate-900 text-white font-black px-3 py-1 rounded text-[8px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                              >
                                {isSubmitting ? <RefreshCw className="animate-spin" size={8} /> : 'Post'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="py-3 text-center">
                          <p className="text-[9px] font-bold text-slate-400">Login to review</p>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-50 bg-slate-50/30 p-2.5">
                      <div className="flex flex-col gap-2">
                        <div className={`relative overflow-hidden ${showAllReviews ? 'flex flex-col gap-2' : 'h-[180px]'}`}>
                          <AnimatePresence mode="wait">
                            {showAllReviews ? (
                              reviews.map((review) => (
                                <div key={review.id} className="w-full bg-white rounded-lg border border-slate-100 p-3 shadow-sm space-y-2 flex-shrink-0 transition-all">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                                      {review.userPhoto ? (
                                        <img src={review.userPhoto} alt={review.userName} className="w-full h-full object-cover" />
                                      ) : (
                                        <UserIcon className="text-slate-400" size={12} />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[12px] font-black text-slate-900 truncate">{review.userName}</p>
                                      <div className="flex text-yellow-500">
                                        {[1,2,3,4,5].map(star => <Star key={star} size={8} fill="currentColor" />)}
                                      </div>
                                    </div>
                                  </div>
                                  <p className="text-[11px] font-black text-slate-700 leading-tight italic">"{review.text}"</p>
                                  {review.photo && (
                                    <div className="mt-1.5 rounded-lg overflow-hidden border border-slate-100">
                                      <img src={review.photo} alt="Review" className="w-full h-auto object-cover max-h-[100px]" />
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : (
                              reviews.length > 0 && (
                                <motion.div 
                                  key={reviews[currentReviewIndex]?.id}
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -20 }}
                                  transition={{ duration: 0.5 }}
                                  className="absolute inset-0 w-full bg-white rounded-lg border border-slate-100 p-3 shadow-sm space-y-2"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                                      {reviews[currentReviewIndex].userPhoto ? (
                                        <img src={reviews[currentReviewIndex].userPhoto} alt={reviews[currentReviewIndex].userName} className="w-full h-full object-cover" />
                                      ) : (
                                        <UserIcon className="text-slate-400" size={12} />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[11px] font-black text-slate-800 truncate">{reviews[currentReviewIndex].userName}</p>
                                      <div className="flex text-yellow-400">
                                        {[1,2,3,4,5].map(star => <Star key={star} size={7} fill="currentColor" />)}
                                      </div>
                                    </div>
                                  </div>
                                  <p className="text-[10px] text-slate-600 leading-tight italic">"{reviews[currentReviewIndex].text}"</p>
                                  {reviews[currentReviewIndex].photo && (
                                    <div className="mt-1.5 rounded-lg overflow-hidden border border-slate-100">
                                      <img src={reviews[currentReviewIndex].photo} alt="Review" className="w-full h-auto object-cover max-h-[100px]" />
                                    </div>
                                  )}
                                </motion.div>
                              )
                            )}
                          </AnimatePresence>
                           
                           {reviews.length === 0 && (
                             <div className="w-full py-2 text-center text-slate-300">
                               <p className="text-[8px] font-black uppercase tracking-widest">No reviews yet</p>
                             </div>
                           )}
                        </div>

                        {reviews.length > 1 && (
                          <div className="flex justify-center mt-1">
                            <button 
                              onClick={() => setShowAllReviews(!showAllReviews)}
                              className="text-[7px] font-black text-indigo-600 uppercase tracking-widest hover:text-slate-900 transition-colors flex items-center gap-1 py-1"
                            >
                              {showAllReviews ? 'Show Less' : `See More (${reviews.length})`}
                              {showAllReviews ? <ChevronUp size={8} /> : <ChevronDown size={8} />}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Referral Card - Shrunken */}
                <section className="mb-8">
                   <div className="bg-indigo-600 rounded-xl p-4 text-white relative overflow-hidden shadow-sm">
                     <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl" />
                     <div className="relative z-10 flex flex-col md:flex-row items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-xl rounded-lg flex items-center justify-center shrink-0">
                           <Share2 size={20} className="text-white" />
                        </div>
                        <div className="flex-1 text-center md:text-left space-y-1">
                           <h3 className="text-lg font-black tracking-tight">Refer & Earn ৳5.00</h3>
                           <p className="text-white/80 font-medium text-[10px] leading-relaxed max-w-lg">
                              আপনার লিংক থেকে কেউ নতুন একাউন্ট করলে এবং ১টা জিমেইল কেনা বা বেচা হলে পাবেন ৫ টাকা।
                           </p>
                        </div>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/?ref=${user?.uid}`);
                            alert('Link Copied!');
                          }}
                          className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-[#FFEB3B] hover:text-slate-900 transition-all active:scale-95 shrink-0"
                        >
                          Copy Link
                        </button>
                     </div>
                   </div>
                </section>
              </motion.div>
            ) : view === 'gmail-market' ? (
              <motion.div
                key="gmail-market"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-8 pb-20"
              >
                {/* Header */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white shrink-0 rotate-3">
                      <Mail size={20} strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="font-display text-xl font-black text-slate-900 tracking-tight">Marketplace</h2>
                        <button 
                          onClick={() => {
                            // Clear local state to force fetchMarketData to run full logic
                            localStorage.removeItem('cache_market_listings');
                            localStorage.removeItem('cache_market_listings_timestamp');
                            setMarketListings([]);
                            // Trigger the effect by changing a dummy state if needed, but here simple clear works 
                            // because [] dependency in setMarketListings check will trigger fetch
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-all active:rotate-180 duration-500"
                        >
                          <RefreshCw size={14} />
                        </button>
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-green-50 rounded-full border border-green-100">
                          <div className="w-1 h-1 bg-green-500 rounded-full" />
                          <span className="text-[8px] font-black text-green-600 uppercase tracking-widest leading-none">Live</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Available: <span className="text-emerald-600">{marketListings.length}</span></span>
                        <div className="w-0.5 h-0.5 rounded-full bg-slate-300" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sold: <span className="text-red-500">{globalSoldCount}</span></span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Tabs */}
                  <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                    <button 
                      onClick={() => setMarketTab('Market')}
                      className={`flex-1 py-2 px-4 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${marketTab === 'Market' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      জিমেইল-store
                    </button>
                    <button 
                      onClick={() => setMarketTab('Bought')}
                      className={`flex-1 py-2 px-4 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${marketTab === 'Bought' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      কেনা জিমেইল
                    </button>
                  </div>
                </div>

                {/* Search & Actions */}
                <div className="flex flex-col gap-2">
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search..."
                      value={marketSearchQuery}
                      onChange={(e) => setMarketSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white border border-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-50 transition-all font-bold text-slate-800 placeholder:text-slate-300 text-[10px]"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2 overflow-x-auto pb-1 no-scrollbar">
                    {["All", "Full Fresh New", "Full Fresh old Gmail", "Used Gmail", "Aged"].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setMarketSearchQuery(cat === 'All' ? '' : cat)}
                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${
                          (cat === 'All' && !marketSearchQuery) || marketSearchQuery === cat 
                          ? 'bg-indigo-600 text-white shadow-md' 
                          : 'bg-white border border-slate-100 text-slate-400 hover:text-indigo-600'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => {
                        const availableIds = filteredMarketListings.map(l => l.id);
                        const allSelected = availableIds.every(id => selectedListings.includes(id));
                        if (allSelected) {
                          setSelectedListings(selectedListings.filter(id => !availableIds.includes(id)));
                        } else {
                          setSelectedListings([...new Set([...selectedListings, ...availableIds])]);
                        }
                      }}
                      className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-100 text-slate-700 font-black text-[8px] uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-all active:scale-95"
                    >
                      <CheckSquare size={12} strokeWidth={2.5} className="text-indigo-600" />
                      {filteredMarketListings.every(l => selectedListings.includes(l.id)) ? 'Deselect' : 'Select All'}
                    </button>
                    <button 
                      onClick={() => {
                        setIsBulkBuyMode(!isBulkBuyMode);
                        setSelectedListings([]);
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg font-black text-[8px] uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 ${isBulkBuyMode ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'}`}
                    >
                      <Layers size={12} strokeWidth={2.5} className={isBulkBuyMode ? 'text-white' : 'text-green-400'} />
                      {isBulkBuyMode ? 'Cancel' : 'Bulk'}
                    </button>
                  </div>
                  {selectedListings.length > 0 && (
                    <div className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <button 
                        onClick={handleBulkBuyFromBalance}
                        className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 active:scale-95"
                      >
                        <Wallet size={14} />
                        Balance ({selectedListings.length})
                      </button>
                      <button 
                        onClick={() => {
                          const totalPrice = marketListings
                            .filter(l => selectedListings.includes(l.id))
                            .reduce((sum, l) => sum + l.price, 0);
                          setShowPaymentModal({ show: true, price: totalPrice });
                        }}
                        className="flex-1 px-4 py-3 rounded-xl bg-slate-900 text-white font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-slate-100 active:scale-95"
                      >
                        <CreditCard size={14} />
                        Direct
                      </button>
                    </div>
                  )}
                </div>

                {/* Compact Market Listings */}
                <div className="grid grid-cols-1 gap-3">
                  {marketTab === 'Market' ? (
                    filteredMarketListings.length === 0 ? (
                      <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200">
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest leading-relaxed">বর্তমানে কোনো Gmail লিস্টিং নেই।</p>
                      </div>
                    ) : (
                      filteredMarketListings.map((item, i) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.02 }}
                          className={`bg-white rounded-xl border p-2.5 md:p-4 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex items-center justify-between gap-2.5 cursor-pointer active:scale-[0.99] ${selectedListings.includes(item.id) ? 'border-indigo-600 ring-2 ring-indigo-500/10' : 'border-slate-100'}`}
                          onClick={() => {
                            if (isBulkBuyMode) {
                              if (selectedListings.includes(item.id)) {
                                setSelectedListings(selectedListings.filter(id => id !== item.id));
                              } else {
                                setSelectedListings([...selectedListings, item.id]);
                              }
                            }
                          }}
                        >
                          <div className="flex items-center gap-2.5 flex-1 min-w-0 relative z-10">
                            {isBulkBuyMode ? (
                              <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${selectedListings.includes(item.id) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-200'}`}>
                                {selectedListings.includes(item.id) && <Check size={14} className="text-white" strokeWidth={3} />}
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 border border-slate-50 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                                <Mail size={14} className="group-hover:text-white text-indigo-600" />
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 mb-0.5">
                        <h4 className="font-display text-[9px] md:text-sm font-black text-slate-800 truncate">
                          {item.maskedEmail || item.gmailAccount}
                        </h4>
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-50 rounded-full border border-green-100 shrink-0">
                          <div className="w-1 h-1 bg-green-500 rounded-full" />
                          <span className="text-[6px] md:text-[8px] font-black text-green-600 uppercase tracking-widest leading-none">Available</span>
                        </div>
                      </div>
                      <p className="text-[7px] md:text-[9px] font-black text-blue-600 uppercase tracking-tight">
                        {item.type || 'FRESH'}
                       </p>
                       {item.description && (
                        <p className="text-[8px] md:text-[11px] text-slate-500 font-medium leading-tight mt-1 line-clamp-none">
                          {item.description}
                        </p>
                       )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 relative z-10">
                            {(() => {
                              const priceObj = gmailPrices[item.type];
                              const displayPrice = priceObj?.buyer ? parseFloat(priceObj.buyer) : item.price;
                              return (
                                <p className="text-[11px] md:text-lg font-black text-slate-900">৳{displayPrice.toFixed(0)}</p>
                              );
                            })()}

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isBulkBuyMode) {
                            const priceObj = gmailPrices[item.type];
                            const displayPrice = priceObj?.buyer ? parseFloat(priceObj.buyer) : item.price;
                            setShowPaymentModal({ show: true, price: displayPrice, listingId: item.id });
                          }
                        }}
                        disabled={isSubmitting || (isBulkBuyMode && !selectedListings.includes(item.id))}
                        className={`h-8 px-4 md:px-6 rounded-lg font-black text-[9px] md:text-xs uppercase tracking-widest transition-all active:scale-90 flex items-center justify-center gap-2 ${isBulkBuyMode ? (selectedListings.includes(item.id) ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400') : 'bg-indigo-600 hover:bg-slate-900 text-white shadow-sm shadow-indigo-100'}`}
                      >
                        {isSubmitting ? <RefreshCw className="animate-spin" size={10} /> : (isBulkBuyMode ? (selectedListings.includes(item.id) ? 'Selected' : 'Select') : 'BUY')}
                      </button>
                          </div>
                        </motion.div>
                      ))
                    )
                  ) : (
                    myPurchases.length === 0 ? (
                      <div className="col-span-full bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200">
                        <p className="text-slate-400 font-bold">আপনি এখনো কোনো Gmail কিনেননি।</p>
                      </div>
                    ) : (
                      myPurchases.map((order, i) => (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="bg-slate-900 rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-8 space-y-4 md:space-y-6 shadow-2xl group relative overflow-hidden"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex gap-3 md:gap-4 items-center">
                              <div className="w-10 h-10 md:w-14 md:h-14 bg-white/10 rounded-xl md:rounded-2xl flex items-center justify-center text-white shrink-0">
                                <ShieldCheck size={20} className="md:w-7 md:h-7" />
                              </div>
                              <div className="space-y-0.5 md:space-y-1">
                                <h4 className="font-display text-base md:text-xl font-black text-white group-hover:text-[#FFEB3B] transition-colors leading-none truncate max-w-[200px]">
                                   {order.credentials?.email || order.gmailAccount}
                                </h4>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-[8px] md:text-[10px] text-white/40 font-bold uppercase tracking-widest">{new Date(order.purchasedAt?.toDate()).toLocaleString()}</p>
                                  <div className="flex items-center gap-1 text-[8px] font-mono text-white/20 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                                    Seller: {order.sellerId}
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(order.sellerId || '');
                                      }}
                                      className="text-white/40 hover:text-white transition-all ml-1"
                                    >
                                      <Copy size={8} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 text-green-400 rounded-lg text-[8px] md:text-[10px] font-black border border-green-500/20 shrink-0">
                              <CheckCircle size={10} className="md:w-[14px] md:h-[14px]" />
                              SUCCESSFUL
                            </div>
                          </div>

                          {order.description && (
                            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                              <span className="text-[7px] md:text-[8px] text-white/40 uppercase font-black tracking-widest block mb-1">Description</span>
                              <p className="text-[9px] md:text-xs text-white/90 leading-relaxed italic line-clamp-none">
                                {order.description}
                              </p>
                            </div>
                          )}

                          <div className="p-4 md:p-6 bg-white/5 rounded-2xl md:rounded-3xl border border-white/10 space-y-3 md:space-y-4">
                            <div className="space-y-0.5">
                              <span className="text-[8px] md:text-[9px] text-white/40 uppercase font-black tracking-widest block leading-none mb-1">Email Address</span>
                              <p className="font-mono text-white text-xs md:text-sm font-bold flex items-center justify-between bg-white/5 p-2 rounded-lg">
                                <span className="truncate mr-2">{order.credentials?.email}</span>
                                <button onClick={() => { navigator.clipboard.writeText(order.credentials?.email); alert('Email Copied!'); }} className="p-1.5 hover:bg-white/10 rounded-lg text-indigo-400"><Copy size={12} /></button>
                              </p>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[8px] md:text-[9px] text-white/40 uppercase font-black tracking-widest block leading-none mb-1">Password</span>
                              <p className="font-mono text-[#FFEB3B] text-xs md:text-sm font-bold flex items-center justify-between bg-white/5 p-2 rounded-lg">
                                <span className="truncate mr-2">{order.credentials?.password}</span>
                                <button onClick={() => { navigator.clipboard.writeText(order.credentials?.password); alert('Password Copied!'); }} className="p-1.5 hover:bg-white/10 rounded-lg text-white"><Copy size={12} /></button>
                              </p>
                            </div>
                            {(order.credentials?.recovery || order.credentials?.recoveryEmail) && (
                              <div className="space-y-0.5">
                                <span className="text-[8px] md:text-[9px] text-white/40 uppercase font-black tracking-widest block leading-none mb-1">Recovery Details</span>
                                <p className="font-mono text-blue-300 text-xs md:text-sm font-bold flex items-center justify-between bg-white/5 p-2 rounded-lg">
                                  <span className="truncate mr-2">{order.credentials?.recovery || order.credentials?.recoveryEmail}</span>
                                  <button onClick={() => { navigator.clipboard.writeText(order.credentials?.recovery || order.credentials?.recoveryEmail); alert('Recovery Copied!'); }} className="p-1.5 hover:bg-white/10 rounded-lg text-white"><Copy size={12} /></button>
                                </p>
                              </div>
                            )}
                            {order.credentials?.twoFactor && (
                              <div className="space-y-0.5">
                                <span className="text-[8px] md:text-[9px] text-white/40 uppercase font-black tracking-widest block leading-none mb-1">2FA / Backup Code</span>
                                <p className="font-mono text-green-400 text-xs md:text-sm font-bold flex items-center justify-between bg-white/5 p-2 rounded-lg">
                                  <span className="truncate mr-2">{order.credentials?.twoFactor}</span>
                                  <button onClick={() => { navigator.clipboard.writeText(order.credentials?.twoFactor); alert('2FA Copied!'); }} className="p-1.5 hover:bg-white/10 rounded-lg text-white"><Copy size={12} /></button>
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-white/40 text-[9px] md:text-[10px] pt-1 md:pt-2">
                             <div className="flex items-center gap-2">
                               <Mail size={10} />
                               <span>ID: {order.id.substring(0, 8)}...</span>
                             </div>
                             <span className="font-black text-white/20">৳{order.price}</span>
                          </div>

                          <div className="pt-2 md:pt-4 flex gap-2">
                             <button 
                                onClick={() => setShowReportModal({ show: true, listingId: order.listingId, purchaseId: order.id, sellerId: order.sellerId || 'admin' })}
                                className="flex-1 py-2.5 md:py-3 rounded-lg md:rounded-xl bg-red-500/10 text-red-400 font-bold text-[9px] md:text-[10px] uppercase tracking-widest border border-red-500/20 hover:bg-red-500/20 transition-all"
                             >
                                Report Issue
                             </button>
                             <button className="flex-1 py-2.5 md:py-3 rounded-lg md:rounded-xl bg-white/10 text-white/60 font-bold text-[9px] md:text-[10px] uppercase tracking-widest border border-white/10 opacity-50">
                                Verify Now
                             </button>
                          </div>
                        </motion.div>
                      ))
                    )
                  )}
                </div>
              </motion.div>
            ) : view === 'profile' ? (
              <motion.div
                key="profile"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-8 pb-24"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 shadow-sm border border-blue-100">
                    <UserIcon size={24} />
                  </div>
                  <h2 className="font-display text-3xl font-black text-[#0D1B3E] tracking-tight">Your Profile</h2>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-2xl shadow-slate-200/20 space-y-8">
                  <div className="flex flex-col items-center gap-4 py-4">
                    <div className="w-24 h-24 bg-slate-100 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-slate-300 relative overflow-hidden group">
                       {userProfile?.photoURL ? (
                         <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                       ) : (
                         <UserIcon size={48} />
                       )}
                       <button 
                         onClick={() => profileFileInputRef.current?.click()}
                         className={`absolute inset-0 bg-black/40 transition-all flex items-center justify-center text-white ${isSubmitting ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                         disabled={isSubmitting}
                       >
                         {isSubmitting ? <RefreshCw className="animate-spin text-white" size={32} strokeWidth={2.5} /> : <Plus size={20} />}
                       </button>
                       <input 
                         type="file" 
                         ref={profileFileInputRef} 
                         onChange={handleProfilePhotoUpload} 
                         className="hidden" 
                         accept="image/*" 
                       />
                    </div>
                    <div className="text-center">
                       <h3 className="text-xl font-black text-slate-800">{userProfile?.displayName || 'User Profile'}</h3>
                       <p className="text-sm font-bold text-slate-400">{user?.email}</p>
                       <div className="mt-2 flex items-center justify-center gap-2">
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">User ID: {userProfile?.numericId || '...'}</span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(user?.uid || '');
                              alert('User ID Copied!');
                            }}
                            className="text-blue-500 hover:text-blue-600 transition-colors"
                          >
                            <Copy size={12} />
                          </button>
                       </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-5 bg-green-50 rounded-3xl border border-green-100 text-center">
                        <span className="block text-[10px] font-black text-green-400 uppercase tracking-widest mb-1">Total Balance</span>
                        <span className="text-2xl font-black text-[#2E7D32]">৳{userProfile?.balance?.toFixed(2)}</span>
                     </div>
                     <div className="p-5 bg-orange-50 rounded-3xl border border-orange-100 text-center">
                        <span className="block text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Total Spent</span>
                        <span className="text-2xl font-black text-orange-600">৳{userProfile?.totalSpent?.toFixed(2) || '0.00'}</span>
                     </div>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">First Name</label>
                          <input 
                             value={profileForm.firstName}
                             onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})}
                             placeholder="Enter first name"
                             className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:outline-none focus:border-blue-500 transition-all text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Last Name</label>
                          <input 
                             value={profileForm.lastName}
                             onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})}
                             placeholder="Enter last name"
                             className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:outline-none focus:border-blue-500 transition-all text-xs"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Age</label>
                          <input 
                             type="number"
                             value={profileForm.age}
                             onChange={(e) => setProfileForm({...profileForm, age: e.target.value})}
                             placeholder="22"
                             className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:outline-none focus:border-blue-500 transition-all text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Address</label>
                          <input 
                             value={profileForm.address}
                             onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
                             placeholder="Dhaka, BD"
                             className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:outline-none focus:border-blue-500 transition-all text-xs"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Phone Number</label>
                        <input 
                           value={profileForm.phone}
                           onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                           placeholder="01XXXXXXXXX"
                           className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:outline-none focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-1.5">
                          <div className="w-5 h-5 bg-white rounded-md flex items-center justify-center p-0.5 shadow-sm border border-slate-100">
                            <img src="https://www.logo.wine/a/logo/BKash/BKash-Logo.wine.svg" alt="" className="w-full h-full object-contain" />
                          </div>
                          bKash Number
                        </label>
                        <input 
                           value={profileForm.bkashNumber}
                           onChange={(e) => setProfileForm({...profileForm, bkashNumber: e.target.value})}
                           placeholder="For bKash withdrawals"
                           className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:outline-none focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-1.5">
                          <div className="w-5 h-5 bg-white rounded-md flex items-center justify-center p-0.5 shadow-sm border border-slate-100">
                            <img src="https://www.logo.wine/a/logo/Nagad/Nagad-Logo.wine.svg" alt="" className="w-full h-full object-contain" />
                          </div>
                          Nagad Number
                        </label>
                        <input 
                           value={profileForm.nagadNumber}
                           onChange={(e) => setProfileForm({...profileForm, nagadNumber: e.target.value})}
                           placeholder="For Nagad withdrawals"
                           className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:outline-none focus:border-red-500 transition-all"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-5 rounded-2xl bg-black text-white font-black text-sm hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? <RefreshCw className="animate-spin" size={18} /> : <BadgeCheck size={18} />}
                      Update Account Details
                    </button>
                  </form>
                </div>
              </motion.div>
            ) : view === 'admin' ? (
              <motion.div
                key="admin"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8 pb-20"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
                      <Shield size={24} />
                    </div>
                    <div>
                      <h2 className="font-display text-3xl font-black text-slate-900 tracking-tight">Admin Dashboard</h2>
                      <p className="text-slate-500 text-sm font-bold">Manage all marketplace activities</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Total Users</span>
                      <span className="text-xl font-black text-indigo-600">{totalUsersCount}</span>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Total Listings</span>
                      <span className="text-xl font-black text-[#2E7D32]">{marketListings.length}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Headline Control */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-[#2E7D32]">
                        <Bell size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">Headline Control</h3>
                        <p className="text-xs text-slate-400 font-bold">Manage the scrolling announcement bar</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Headline Text</label>
                        <input 
                          value={pendingHeadline}
                          onChange={(e) => setPendingHeadline(e.target.value)}
                          placeholder="Enter announcement text..."
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:outline-none focus:border-[#2E7D32]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Speed</label>
                        <div className="flex gap-2">
                          <input 
                            type="number"
                            value={pendingSpeed}
                            onChange={(e) => setPendingSpeed(Number(e.target.value))}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:outline-none focus:border-[#2E7D32]"
                          />
                          <button 
                            onClick={() => updateHeadline(pendingHeadline, pendingSpeed)}
                            className="px-6 py-3 bg-[#2E7D32] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-green-200 hover:bg-[#1B5E20] transition-all whitespace-nowrap"
                          >
                            Update
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notice Board Control */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                        <Megaphone size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">Notice Board Control</h3>
                        <p className="text-xs text-slate-400 font-bold">Manage the main banner notice text</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Notice Content</label>
                        <textarea 
                          value={pendingNotice}
                          onChange={(e) => setPendingNotice(e.target.value)}
                          placeholder="What would you like to show in the main banner?"
                          rows={3}
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:outline-none focus:border-orange-500 transition-all shadow-inner resize-none text-xs"
                        />
                      </div>
                      <button 
                        onClick={() => updateNotice(pendingNotice)}
                        className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Save size={16} />
                        Update Notice Board
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* User Balance Management */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <Wallet size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">User Wallet Control</h3>
                        <p className="text-xs text-slate-400 font-bold">Adjust any user's balance</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Target User Email</label>
                        <input 
                          id="balance-email"
                          placeholder="user@example.com"
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:outline-none focus:border-blue-500 transition-all shadow-inner"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">New Balance (৳)</label>
                        <div className="flex gap-3">
                          <input 
                            id="balance-amount"
                            type="number"
                            placeholder="0.00"
                            className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:outline-none focus:border-blue-500 transition-all shadow-inner"
                          />
                          <button 
                            onClick={() => {
                              const email = (document.getElementById('balance-email') as HTMLInputElement).value;
                              const amount = (document.getElementById('balance-amount') as HTMLInputElement).value;
                              if (email && amount) updateUserBalance(email, parseFloat(amount));
                            }}
                            className="px-6 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                          >
                            Update
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                   {/* Danger Zone / Maintenance */}
                    <div className="bg-red-50/50 rounded-[2.5rem] border border-red-100 p-8 space-y-6 mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                           <Activity size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-red-900">Platform Maintenance</h3>
                          <p className="text-xs text-red-400 font-bold">Sync data & health checks</p>
                        </div>
                      </div>

                      <button
                        onClick={syncBuyerRankings}
                        disabled={isVerifying}
                        className="w-full py-4 bg-white border-2 border-red-200 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                      >
                        {isVerifying ? <RefreshCw className="animate-spin" size={12} /> : <Trophy size={12} />}
                        Sync Buyer Rankings
                      </button>
                    </div>

                  {/* Notification Center */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <Send size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">Notification Center</h3>
                        <p className="text-xs text-slate-400 font-bold">Send message to specific User ID</p>
                      </div>
                    </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Target UID/Numeric</label>
                            <input 
                              value={adminNotifyForm.targetUserId}
                              onChange={(e) => setAdminNotifyForm({ ...adminNotifyForm, targetUserId: e.target.value })}
                              placeholder="Example: 16574"
                              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:outline-none focus:border-indigo-500 transition-all shadow-inner text-xs"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Target Gmail (Optional)</label>
                            <input 
                              value={adminNotifyForm.gmailAccount}
                              onChange={(e) => setAdminNotifyForm({ ...adminNotifyForm, gmailAccount: e.target.value })}
                              placeholder="example@gmail.com"
                              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:outline-none focus:border-indigo-500 transition-all shadow-inner text-xs"
                            />
                          </div>
                        </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Notification Message</label>
                        <div className="flex gap-2">
                          <select 
                            value={adminNotifyForm.type}
                            onChange={(e) => setAdminNotifyForm({ ...adminNotifyForm, type: e.target.value as any })}
                            className="px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold appearance-none outline-none focus:border-indigo-500 transition-all"
                          >
                            <option value="info">Info</option>
                            <option value="warning">Warn</option>
                            <option value="success">OK</option>
                          </select>
                          <textarea 
                            value={adminNotifyForm.message}
                            onChange={(e) => setAdminNotifyForm({ ...adminNotifyForm, message: e.target.value })}
                            placeholder="Write your message..."
                            rows={1}
                            className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:outline-none focus:border-indigo-500 transition-all shadow-inner resize-none"
                          />
                        </div>
                      </div>
                      
                      <button 
                        onClick={async () => {
                          if (!adminNotifyForm.targetUserId || !adminNotifyForm.message) {
                             alert('Fill all fields');
                             return;
                          }
                          await sendNotification(
                            adminNotifyForm.targetUserId,
                            adminNotifyForm.message,
                            adminNotifyForm.type,
                            { gmailAccount: adminNotifyForm.gmailAccount }
                          );
                          alert('Notification sent!');
                          setAdminNotifyForm({ targetUserId: '', message: '', gmailAccount: '', type: 'info' });
                        }}
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
                      >
                        Send Notification
                      </button>
                    </div>
                  </div>

                  {/* Pricing Configuration */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-[#2E7D32]">
                        <Tag size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">Pricing Settings</h3>
                        <p className="text-xs text-slate-400 font-bold">Fix selling price per type</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {Object.entries(gmailPrices).map(([type, priceInfo]) => {
                        const priceObj = priceInfo as { seller: string, buyer: string };
                        return (
                          <div key={type} className="flex flex-col gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight truncate">{type}</span>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[7px] font-black text-slate-400 uppercase">Seller Get (৳)</label>
                                <input 
                                  type="number"
                                  value={priceObj.seller}
                                  onChange={async (e) => {
                                    const newPrices = { ...gmailPrices, [type]: { ...priceObj, seller: e.target.value } };
                                    setGmailPrices(newPrices);
                                    await setDoc(doc(db, 'settings', 'pricing'), newPrices);
                                  }}
                                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-center font-bold text-xs focus:ring-2 focus:ring-[#2E7D32]/20 outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[7px] font-black text-slate-400 uppercase">Market Price (৳)</label>
                                <input 
                                  type="number"
                                  value={priceObj.buyer}
                                  onChange={async (e) => {
                                    const newPrices = { ...gmailPrices, [type]: { ...priceObj, buyer: e.target.value } };
                                    setGmailPrices(newPrices);
                                    await setDoc(doc(db, 'settings', 'pricing'), newPrices);
                                  }}
                                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-center font-bold text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                  placeholder="Market Price"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Site Configuration */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                        <Layers size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">Site Configuration</h3>
                        <p className="text-xs text-slate-400 font-bold">Global feature toggles</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div>
                          <span className="block font-bold text-slate-800 text-sm">Marketplace Status</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Toggle visibility of market</span>
                        </div>
                        <div className="w-12 h-6 bg-green-500 rounded-full p-1 flex justify-end cursor-pointer">
                          <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div>
                          <span className="block font-bold text-slate-800 text-sm">Seller Center</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Enable sell requests</span>
                        </div>
                        <div className="w-12 h-6 bg-green-500 rounded-full p-1 flex justify-end cursor-pointer">
                          <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                        </div>
                      </div>
                      <button className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all">
                        Save System State
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pending Payments to Verify */}
                <div id="admin-payments" className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm mb-12">
                  <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-pink-50/30">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-pink-100 text-[#e2136e] rounded-2xl">
                        <Wallet size={24} />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800 text-lg tracking-tight">Payment Verification Queue</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{allPayments.length} Payments (bKash & Nagad)</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
                    {allPayments.map((payment) => (
                      <div key={payment.id} className="p-8 hover:bg-slate-50/80 transition-all group">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4 flex-1">
                                <div className={`w-14 h-14 ${payment.status === 'verified' ? 'bg-green-50 text-green-600' : payment.method === 'nagad' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-pink-50 text-[#e2136e] border-pink-100'} rounded-2xl flex items-center justify-center shrink-0 shadow-sm border`}>
                                    <Smartphone size={24} />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-black text-slate-900 text-sm tracking-tight">{payment.trxId}</p>
                                        <button onClick={() => { navigator.clipboard.writeText(payment.trxId); alert('TRX copied!'); }} className="text-slate-300 hover:text-pink-600 transition-colors"><Copy size={12}/></button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-1 rounded-md uppercase tracking-widest">
                                          {payment.method === 'nagad' ? 'Nagad' : 'bKash'}: {payment.senderNumber}
                                        </span>
                                        <span className={`text-[9px] font-black ${payment.method === 'nagad' ? 'bg-red-50 text-red-600' : 'bg-pink-50 text-[#e2136e]'} px-2 py-1 rounded-md uppercase tracking-widest`}>৳{payment.amount}</span>
                                        <span className="text-[9px] font-bold text-slate-400 capitalize">{payment.createdAt?.toDate ? new Date(payment.createdAt.toDate()).toLocaleString() : 'Recent'}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-600 font-bold">User: {payment.userEmail}</p>
                                    {(payment.listingId || payment.itemIds) && (
                                      <div className="flex items-center gap-1.5 mt-1">
                                        <span className="text-[8px] font-black bg-slate-900 text-white px-1.5 py-0.5 rounded uppercase tracking-tighter">Target:</span>
                                        <span className="text-[9px] font-bold text-slate-500 truncate max-w-[200px]">
                                          {payment.listingId === 'deposit' ? 'Wallet Deposit' : (payment.itemIds ? `Listings: ${payment.itemIds.join(', ')}` : `Listing: ${payment.listingId}`)}
                                        </span>
                                      </div>
                                    )}
                                </div>
                            </div>
                          
                          <div className="flex items-center gap-3">
                            {payment.status === 'pending' ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handlePaymentVerification(payment)}
                                  className="flex-1 md:flex-none px-6 py-3.5 bg-green-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-100 active:scale-95"
                                >
                                  Verify & Approve
                                </button>
                                <button
                                  onClick={() => handlePaymentRejection(payment)}
                                  className="p-3.5 bg-slate-100 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all active:scale-95"
                                >
                                  <X size={20} />
                                </button>
                              </div>
                            ) : payment.status === 'verified' ? (
                              <div className="px-6 py-3.5 bg-green-50 text-green-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-green-100 shadow-sm shadow-green-100/20">
                                <CheckCircle size={16} />
                                OK / APPROVED
                              </div>
                            ) : (
                              <div className="px-6 py-3.5 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-red-100 shadow-sm">
                                <X size={16} />
                                REJECTED
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {allPayments.length === 0 && (
                      <div className="p-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                          <Wallet size={40} className="text-slate-200" />
                        </div>
                        <h4 className="font-black text-slate-800 text-base mb-1">No payment history</h4>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Transactions will appear here</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pending Products (Requests) */}
                <div id="admin-listings" className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                  <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
                        <Clock size={24} />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800 text-lg tracking-tight">Pending Sell Requests</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{allListings.filter(l => l.status === 'SellRequest').length} Items Awaiting Review</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
                    {allListings.filter(l => l.status === 'SellRequest').map((listing) => (
                      <div key={listing.id} className="p-8 hover:bg-slate-50/80 transition-all group">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 shadow-sm border border-indigo-100">
                              <Mail size={24} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm mb-1">{listing.gmailAccount}</p>
                              <div className="flex flex-wrap gap-2">
                                <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md uppercase tracking-widest">{listing.type}</span>
                                <span className="text-[9px] font-black bg-orange-50 text-orange-600 px-2 py-1 rounded-md uppercase tracking-widest border border-orange-100">Reviewing</span>
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest self-center">Seller: {listing.sellerNumericId}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="text-right mr-4 hidden md:block">
                              <p className="text-xl font-black text-indigo-600 tracking-tighter">৳{listing.price}</p>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Listing Price</p>
                            </div>
                            <button
                              onClick={async () => {
                                if (confirm('এই লিস্টিংটি কি মার্কেটপ্লেসে লাইভ করতে চান?')) {
                                  await updateDoc(doc(db, 'listings', listing.id), { status: 'Available', updatedAt: serverTimestamp() });
                                  await sendNotification(listing.sellerId, `আপনার ${listing.gmailAccount} লিস্টিংটি অ্যাপ্রুভ হয়েছে এবং মার্কেটপ্লেসে লাইভ করা হয়েছে!`, 'success');
                                }
                              }}
                              className="flex-1 md:flex-none px-6 py-3.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                            >
                              Approve & Live
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm('লিস্টিংটি কি রিজেক্ট করতে চান?')) {
                                  await updateDoc(doc(db, 'listings', listing.id), { status: 'Rejected', updatedAt: serverTimestamp() });
                                  await sendNotification(listing.sellerId, `আপনার ${listing.gmailAccount} লিস্টিংটি কিছু সমস্যার জন্য রিজেক্ট করা হয়েছে।`, 'error');
                                }
                              }}
                              className="p-3.5 bg-slate-100 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all active:scale-95"
                            >
                              <X size={20} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {allListings.filter(l => l.status === 'SellRequest').length === 0 && (
                      <div className="p-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                          <BadgeCheck size={40} className="text-slate-200" />
                        </div>
                        <h4 className="font-black text-slate-800 text-base mb-1">সব পরিষ্কার!</h4>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">সব রিকুয়েস্ট চেক করা হয়ে গেছে</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-sm overflow-x-auto gap-1">
                  {["All", "Available", "Pending", "Approved", "Dispute", "SellRequest", "Sold", "Orders", "Payments", "Withdrawals"].map((tab) => (
                    <button 
                      key={tab} 
                      onClick={() => {
                        setListingFilter(tab);
                        setAdminSelectedListings([]);
                      }}
                      className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                        listingFilter === tab ? 'bg-[#2E7D32] text-white' : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Admin Bulk Actions Bar */}
                {['All', 'Available', 'Pending', 'Approved', 'Dispute', 'SellRequest', 'Sold'].includes(listingFilter) && (
                  <div className={`bg-slate-900 sticky top-20 z-20 p-4 rounded-3xl border border-white/10 shadow-2xl flex flex-wrap items-center justify-between gap-4 transition-all ${adminSelectedListings.length > 0 ? 'opacity-100 translate-y-0' : 'opacity-80 translate-y-1'}`}>
                    <div className="flex items-center gap-3 ml-2">
                      <button 
                        onClick={() => {
                          const filtered = allListings.filter(item => 
                            listingFilter === 'All' 
                              ? !['Approved', 'Dispute'].includes(item.status) 
                              : item.status === listingFilter
                          );
                          if (adminSelectedListings.length === filtered.length) {
                            setAdminSelectedListings([]);
                          } else {
                            setAdminSelectedListings(filtered.map(l => l.id));
                          }
                        }}
                        className="bg-white/10 p-2 rounded-xl hover:bg-white/20 transition-colors"
                      >
                         <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${adminSelectedListings.length > 0 ? 'bg-[#2E7D32] border-[#2E7D32]' : 'border-white/30'}`}>
                            {adminSelectedListings.length > 0 && <CheckCircle size={14} className="text-white" />}
                         </div>
                      </button>
                      <div>
                        <p className="text-white font-black text-xs uppercase tracking-widest">Select All ({adminSelectedListings.length})</p>
                        <p className="text-white/40 text-[9px] font-bold uppercase">Showing: {
                          allListings.filter(item => 
                            listingFilter === 'All' 
                              ? !['Approved', 'Dispute'].includes(item.status) 
                              : item.status === listingFilter
                          ).length
                        }</p>
                      </div>
                    </div>

                    {adminSelectedListings.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <button 
                          onClick={() => {
                            setBulkEditForm({
                              price: '',
                              description: '',
                              status: listingFilter === 'All' ? 'Available' : listingFilter,
                              type: 'Full Fresh New'
                            });
                            setShowBulkEditModal(true);
                          }}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                        >
                          Edit Selected
                        </button>
                        <button 
                          onClick={() => handleAdminBulkAction('Available')}
                          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                        >
                          Available Selected
                        </button>
                        <button 
                          onClick={() => handleAdminBulkAction('Approved')}
                          className="px-4 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                        >
                          Approve Selected
                        </button>
                        <button 
                          onClick={() => handleAdminBulkAction('Dispute')}
                          className="px-4 py-2 bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                        >
                          Dispute Selected
                        </button>
                        <button 
                          onClick={() => handleAdminBulkAction('Delete')}
                          className="px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                        >
                          Delete Selected
                        </button>
                        <button 
                          onClick={() => setAdminSelectedListings([])}
                          className="px-3 py-2 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  {listingFilter === 'Withdrawals' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {allWithdrawals.map((withdraw) => (
                        <div key={withdraw.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4 relative overflow-hidden group">
                          {withdraw.status === 'pending' && <div className="absolute top-0 right-0 w-2 h-full bg-orange-400" />}
                          {withdraw.status === 'completed' && <div className="absolute top-0 right-0 w-2 h-full bg-green-500" />}
                          
                          <div className="flex items-center justify-between">
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600">
                              <Wallet size={20} />
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${withdraw.status === 'pending' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                              {withdraw.status}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Withdrawal Amount</p>
                            <h4 className="text-2xl font-black text-slate-900">৳{withdraw.amount.toFixed(2)}</h4>
                          </div>

                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                               <span className="text-[9px] font-bold text-slate-400 uppercase">{withdraw.method || 'bKash'} Number:</span>
                               <span className="text-[11px] font-black text-slate-700 select-all">{withdraw.number || withdraw.bkashNumber}</span>
                            </div>
                            <div className="flex items-center justify-between">
                               <span className="text-[9px] font-bold text-slate-400 uppercase">User:</span>
                               <span className="text-[9px] font-black text-blue-600 truncate max-w-[120px]">{withdraw.userEmail}</span>
                            </div>
                          </div>

                          {withdraw.status === 'pending' && (
                            <button 
                              onClick={async () => {
                                if (!confirm(`Confirm withdrawal payment? Ensure you have sent ৳${withdraw.amount} via ${withdraw.method || 'bKash'} to ${withdraw.number || withdraw.bkashNumber}.`)) return;
                                try {
                                  // Send notification first while document still exists
                                  await sendNotification(withdraw.userId, `আপনার উইথড্র রিকুয়েস্ট (৳${withdraw.amount}) এপ্রুভ হয়েছে। আপনার ${withdraw.method || 'বিকাশ'} চেক করুন।`, 'success');
                                  
                                  // Delete the withdrawal request record permanently
                                  await deleteDoc(doc(db, 'withdrawals', withdraw.id));
                                  alert('Withdrawal approved and record removed from server!');
                                } catch (err: any) {
                                  alert('Error: ' + err.message);
                                }
                              }}
                              className="w-full py-3 bg-green-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                            >
                              <BadgeCheck size={14} />
                              Approve & Paid
                            </button>
                          )}
                        </div>
                      ))}
                      {allWithdrawals.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                          <p className="text-slate-400 font-bold">No withdrawal requests found.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {listingFilter === 'Payments' ? (
                    allPayments.map((payment, i) => (
                      <motion.div
                        key={payment.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm overflow-hidden relative"
                      >
                        {payment.status === 'pending' && <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />}
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`w-12 h-12 ${payment.status === 'verified' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'} rounded-2xl flex items-center justify-center shrink-0`}>
                            <CreditCard size={24} />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-bold text-slate-800">{payment.userEmail}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                              TRX ID: <span className="text-slate-900 font-black">{payment.trxId}</span> • {payment.method === 'nagad' ? 'Nagad' : 'bKash'}: <span className="text-slate-900 font-black">{payment.senderNumber}</span>
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                              Amount: <span className="text-[#2E7D32] font-black">৳{payment.amount}</span> • Reference: <span className="text-blue-600 font-black">{payment.listingId}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {payment.status === 'pending' ? (
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handlePaymentVerification(payment)}
                                className="px-4 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all flex items-center gap-2"
                              >
                                <CheckCircle size={14} />
                                Verify
                              </button>
                              <button 
                                onClick={() => handlePaymentRejection(payment)}
                                className="px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all flex items-center gap-2"
                              >
                                <X size={14} />
                                Reject
                              </button>
                            </div>
                          ) : payment.status === 'verified' ? (
                            <div className="px-4 py-2 bg-green-50 text-green-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-green-100 shadow-sm">
                              <CheckCircle size={14} />
                              OK / APPROVED
                            </div>
                          ) : (
                            <div className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-red-100 shadow-sm">
                              <X size={14} />
                              REJECTED
                            </div>
                          )}
                          <div className="text-right">
                             <p className="text-[9px] text-slate-400 font-bold uppercase">
                               {payment.createdAt?.toDate ? new Date(payment.createdAt.toDate()).toLocaleString() : 'Recent'}
                             </p>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : listingFilter === 'Orders' ? (
                    allPurchases.map((order, i) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                            <ShoppingCart size={24} />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-bold text-slate-800">Order by {order.userEmail}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                              Item: <span className="text-slate-900 font-black">{order.gmailAccount}</span> • Price: <span className="text-[#2E7D32] font-black">৳{order.price}</span>
                            </p>
                            {order.sellerBkash && (
                              <p className="text-[10px] text-orange-600 font-black uppercase tracking-widest mt-1">
                                Seller bKash: <span className="underline decoration-orange-200">{order.sellerBkash}</span>
                              </p>
                            )}
                            {/* Admin view for credentials in orders */}
                            <div className="mt-3 p-3 bg-slate-900 rounded-xl text-white font-mono text-[10px] space-y-1">
                               <p><span className="text-white/40">GMAIL:</span> {order.credentials?.email}</p>
                               <p><span className="text-[#FFEB3B]">PASS:</span> {order.credentials?.password}</p>
                               {order.credentials?.twoFactor && <p><span className="text-green-400">2FA:</span> {order.credentials?.twoFactor}</p>}
                               {order.credentials?.recoveryEmail && <p><span className="text-blue-300">RECOVERY:</span> {order.credentials?.recoveryEmail}</p>}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(order.purchasedAt?.toDate()).toLocaleString()}</p>
                          <div className="mt-2 flex items-center gap-2 justify-end">
                            <div className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black border border-green-100 shadow-sm">
                              <CheckCircle size={14} />
                              APPROVED
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    allListings
                      .filter(item => 
                        listingFilter === 'All' 
                          ? !['Approved', 'Dispute'].includes(item.status) 
                          : item.status === listingFilter
                      )
                      .map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`bg-white rounded-3xl border p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:shadow-md transition-all ${adminSelectedListings.includes(item.id) ? 'border-indigo-600 ring-2 ring-indigo-500/10 bg-indigo-50/5' : 'border-slate-100'}`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <button 
                          onClick={() => {
                            if (adminSelectedListings.includes(item.id)) {
                              setAdminSelectedListings(prev => prev.filter(id => id !== item.id));
                            } else {
                              setAdminSelectedListings(prev => [...prev, item.id]);
                            }
                          }}
                          className="shrink-0 group/check"
                        >
                           <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${adminSelectedListings.includes(item.id) ? 'bg-[#2E7D32] border-[#2E7D32] scale-110 shadow-lg shadow-green-100' : 'bg-white border-slate-200 group-hover/check:border-indigo-300'}`}>
                              {adminSelectedListings.includes(item.id) && <CheckCircle size={18} className="text-white" />}
                           </div>
                        </button>
                        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 shrink-0">
                          <Mail size={24} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-800">
                              {revealedPasswords[item.id] ? (item.realGmail || item.gmailAccount) : '********************'}
                            </h4>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter ${
                              item.status === 'Available' ? 'bg-green-100 text-green-700' : 
                              item.status === 'SellRequest' ? 'bg-blue-50 text-blue-600' :
                              item.status === 'Approved' ? 'bg-green-500 text-white' :
                              'bg-slate-100 text-slate-500'
                            }`}>{item.status}</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                              Price: <span className="text-[#2E7D32] font-black">৳{item.price}</span>
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                              Seller ID: <span className="text-slate-600 font-mono">{item.sellerNumericId || item.sellerId.substring(0, 5)}</span>
                            </p>
                            {item.bkashNumber && (
                              <p className="text-[10px] text-orange-600 font-black tracking-widest uppercase">
                                bKash: <span className="underline decoration-orange-200 decoration-2">{item.bkashNumber}</span>
                              </p>
                            )}
                            {item.description && (
                              <p className="text-[10px] text-indigo-500 font-bold tracking-widest uppercase">
                                Desc: <span className="text-slate-600 italic normal-case">{item.description}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button 
                          onClick={async () => {
                            const credPath = `listings/${item.id}/private/credentials`;
                            const credDoc = await getDoc(doc(db, `listings/${item.id}/private`, 'credentials'));
                            const creds = credDoc.exists() ? credDoc.data() : { email: '', password: '', recoveryEmail: '', twoFactor: '' };
                            
                            setEditListingForm({
                              gmailAccount: item.gmailAccount,
                              type: item.type,
                              price: item.price.toString(),
                              email: creds.email,
                              password: creds.password,
                              recoveryEmail: creds.recoveryEmail || '',
                              twoFactor: creds.twoFactor || '',
                              bkashNumber: item.bkashNumber || '',
                              status: item.status,
                              description: item.description || '',
                              isBulk: false,
                              bulkData: ''
                            });
                            setEditingListing(item);
                          }}
                          className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-blue-50 text-blue-600 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-blue-100 hover:bg-blue-100"
                        >
                          <RefreshCw size={14} />
                          Edit Info
                        </button>
                        <button 
                          onClick={() => revealPassword(item.id, item.sellerId)}
                          className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-slate-50 text-slate-600 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-slate-100 hover:bg-slate-100"
                        >
                          {revealedPasswords[item.id] ? <Eye size={14} /> : <EyeOff size={14} />}
                          Creds
                        </button>
                        <button 
                          onClick={() => updateListingStatus(item.id, 'Available')}
                          className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-blue-50 text-blue-600 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-blue-100 hover:bg-blue-100 transition-all"
                        >
                          <CheckCircle size={14} />
                          Available
                        </button>
                        <button 
                          onClick={() => updateListingStatus(item.id, 'Approved')}
                          className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-green-50 text-green-600 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-green-100 hover:bg-green-100 transition-all shadow-sm"
                        >
                          <CheckCircle size={14} />
                          Approve
                        </button>
                        <button 
                          onClick={() => updateListingStatus(item.id, 'Dispute')}
                          className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-orange-50 text-orange-600 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-orange-100 hover:bg-orange-100"
                        >
                          <Shield size={14} />
                          Dispute
                        </button>
                        <button 
                          onClick={() => deleteListing(item.id)}
                          className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-red-50 text-red-600 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-red-100 hover:bg-red-100"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>

                      {revealedPasswords[item.id] && (
                        <div className="w-full md:w-auto bg-slate-900 text-white p-4 rounded-2xl font-mono text-xs flex flex-col gap-3">
                          <div>
                            <span className="text-[9px] text-white/40 uppercase font-sans font-black block mb-1">Gmail Address</span>
                            <span className="text-white selection:bg-white/20">{revealedPasswords[item.id].email}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-white/40 uppercase font-sans font-black block mb-1">Password</span>
                            <span className="text-[#FFEB3B] selection:bg-white/20">{revealedPasswords[item.id].password}</span>
                          </div>
                          {revealedPasswords[item.id].recoveryEmail && (
                            <div>
                              <span className="text-[9px] text-white/40 uppercase font-sans font-black block mb-1">Recovery Email</span>
                              <span className="text-blue-300 selection:bg-white/20">{revealedPasswords[item.id].recoveryEmail}</span>
                            </div>
                          )}
                          {revealedPasswords[item.id].twoFactor && (
                            <div>
                              <span className="text-[9px] text-white/40 uppercase font-sans font-black block mb-1">2FA Authenticator</span>
                              <span className="text-green-400 selection:bg-white/20 font-bold">{revealedPasswords[item.id].twoFactor}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )))}
                </div>

                {/* Bulk Edit Modal */}
                <AnimatePresence>
                  {showBulkEditModal && (
                    <>
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowBulkEditModal(false)}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100]"
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-auto md:left-1/2 md:-translate-x-1/2 md:w-[500px] bg-white rounded-[3rem] z-[110] shadow-2xl p-8 flex flex-col gap-6"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-black text-2xl text-slate-900 tracking-tight">Bulk Edit</h3>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Editing {adminSelectedListings.length} Items</p>
                          </div>
                          <button onClick={() => setShowBulkEditModal(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                            <X size={24} />
                          </button>
                        </div>

                        <div className="space-y-4">
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">New Price (৳)</label>
                                <input 
                                  type="number"
                                  value={bulkEditForm.price}
                                  onChange={(e) => setBulkEditForm({...bulkEditForm, price: e.target.value})}
                                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:outline-none focus:border-indigo-600"
                                  placeholder="Leave empty for no change"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Status</label>
                                <select 
                                  value={bulkEditForm.status}
                                  onChange={(e) => setBulkEditForm({...bulkEditForm, status: e.target.value})}
                                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:outline-none"
                                >
                                  <option value="">No Change</option>
                                  {["Available", "Pending", "Approved", "Dispute", "SellRequest", "Sold"].map(s => <option key={s}>{s}</option>)}
                                </select>
                              </div>
                           </div>

                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Gmail Type</label>
                              <select 
                                value={bulkEditForm.type}
                                onChange={(e) => setBulkEditForm({...bulkEditForm, type: e.target.value})}
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:outline-none focus:border-indigo-600"
                              >
                                <option value="">No Change</option>
                                {Object.keys(gmailPrices).map(type => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                              </select>
                           </div>

                           <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Description</label>
                            <textarea 
                              value={bulkEditForm.description}
                              onChange={(e) => setBulkEditForm({...bulkEditForm, description: e.target.value})}
                              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:outline-none min-h-[100px] resize-none"
                              placeholder="Leave empty for no change"
                            />
                           </div>
                        </div>

                        <button 
                          onClick={async () => {
                            if (!confirm(`${adminSelectedListings.length}টি লিস্টিং এক সাথে আপডেট করতে চান?`)) return;
                            setIsSubmitting(true);
                            try {
                              const updateData: any = {};
                              if (bulkEditForm.price) updateData.price = parseFloat(bulkEditForm.price);
                              if (bulkEditForm.status) updateData.status = bulkEditForm.status;
                              if (bulkEditForm.type) updateData.type = bulkEditForm.type;
                              if (bulkEditForm.description) updateData.description = bulkEditForm.description;
                              
                              if (Object.keys(updateData).length === 0) {
                                alert('No changes specified!');
                                return;
                              }

                              for (const id of adminSelectedListings) {
                                await updateDoc(doc(db, 'listings', id), {
                                  ...updateData,
                                  updatedAt: serverTimestamp()
                                });
                              }
                              alert('Bulk update successful!');
                              setShowBulkEditModal(false);
                              setAdminSelectedListings([]);
                            } catch (err: any) {
                              alert('Error: ' + err.message);
                            } finally {
                              setIsSubmitting(false);
                            }
                          }}
                          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2"
                        >
                          <Save size={18} />
                          Apply Changes to {adminSelectedListings.length} Items
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

                {/* Edit Listing Modal */}
                <AnimatePresence>
                  {editingListing && (
                    <>
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setEditingListing(null)}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100]"
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.9 }}
                        className="fixed inset-x-4 top-10 bottom-10 md:inset-auto md:left-1/2 md:-translate-x-1/2 md:w-[600px] md:max-h-[90vh] bg-white rounded-[3rem] z-[110] shadow-2xl flex flex-col overflow-hidden"
                      >
                        <div className="p-8 pb-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
                          <div>
                            <h3 className="font-display text-2xl font-black text-slate-900 tracking-tight">
                              {editingListing.id === 'new' ? 'Add Listing' : 'Edit Listing'}
                            </h3>
                            <p className="text-slate-500 text-sm font-bold">Admin Full Control Mode</p>
                          </div>
                          <button 
                            onClick={() => setEditingListing(null)}
                            className="w-12 h-12 rounded-2xl hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-colors"
                          >
                            <X size={24} />
                          </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 pt-6 space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Public Display (Masked)</label>
                              <input 
                                value={editListingForm.gmailAccount}
                                onChange={(e) => setEditListingForm({...editListingForm, gmailAccount: e.target.value})}
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:outline-none focus:border-[#2E7D32] transition-all"
                                placeholder="e.g. joh*******@gmail.com"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Type</label>
                              <select 
                                value={editListingForm.type}
                                onChange={(e) => {
                                  const newType = e.target.value;
                                  const newPrice = gmailPrices[newType]?.buyer || editListingForm.price;
                                  setEditListingForm({...editListingForm, type: newType, price: newPrice});
                                }}
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:outline-none focus:border-[#2E7D32] appearance-none"
                              >
                                {Object.keys(gmailPrices).map(type => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Selling Price (৳)</label>
                              <input 
                                type="number"
                                value={editListingForm.price}
                                onChange={(e) => setEditListingForm({...editListingForm, price: e.target.value})}
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:outline-none focus:border-[#2E7D32] transition-all"
                                placeholder="0.00"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Status</label>
                              <select 
                                value={editListingForm.status}
                                onChange={(e) => setEditListingForm({...editListingForm, status: e.target.value})}
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:outline-none focus:border-[#2E7D32] appearance-none"
                              >
                                {["Available", "Pending", "Approved", "Dispute", "SellRequest", "Sold"].map(s => <option key={s}>{s}</option>)}
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Description (জিমেইল সম্পর্কে বিস্তারিত)</label>
                            <textarea 
                              value={editListingForm.description}
                              onChange={(e) => setEditListingForm({...editListingForm, description: e.target.value})}
                              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:outline-none focus:border-[#2E7D32] transition-all min-h-[100px] resize-none"
                              placeholder="Describe the gmail details..."
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">bKash Number (Seller)</label>
                            <input 
                              value={editListingForm.bkashNumber}
                              onChange={(e) => setEditListingForm({...editListingForm, bkashNumber: e.target.value})}
                              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:outline-none focus:border-[#2E7D32] transition-all"
                              placeholder="01XXXXXXXXX"
                            />
                          </div>

                          <div className="h-px bg-slate-100 my-2" />
                          <h4 className="text-[11px] font-black text-[#2E7D32] uppercase tracking-[0.2em]">Private Credentials (Highly Secure)</h4>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Full Gmail Address</label>
                            <input 
                              value={editListingForm.email}
                              onChange={(e) => setEditListingForm({...editListingForm, email: e.target.value})}
                              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:outline-none focus:border-[#2E7D32] transition-all"
                              placeholder="john.doe@gmail.com"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Password</label>
                            <input 
                              value={editListingForm.password}
                              onChange={(e) => setEditListingForm({...editListingForm, password: e.target.value})}
                              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:outline-none focus:border-[#2E7D32] transition-all font-mono"
                              placeholder="••••••••"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Recovery Email</label>
                            <input 
                              value={editListingForm.recoveryEmail}
                              onChange={(e) => setEditListingForm({...editListingForm, recoveryEmail: e.target.value})}
                              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:outline-none focus:border-[#2E7D32] transition-all"
                              placeholder="recovery@example.com"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">2FA / Authenticator</label>
                            <input 
                              value={editListingForm.twoFactor}
                              onChange={(e) => setEditListingForm({...editListingForm, twoFactor: e.target.value})}
                              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:outline-none focus:border-[#2E7D32] transition-all"
                              placeholder="2FA code or secret"
                            />
                          </div>
                        </div>

                        <div className="p-8 bg-slate-50 flex gap-4">
                          <button 
                            onClick={() => setEditingListing(null)}
                            className="flex-1 px-8 py-4 rounded-2xl bg-white border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={() => updateFullListing(editingListing.id, 'Available')}
                            disabled={isSubmitting}
                            className="flex-[2] bg-blue-600 text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-blue-900/10 hover:bg-blue-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] disabled:opacity-50"
                          >
                            {isSubmitting ? <RefreshCw className="animate-spin" size={16} /> : <Send size={16} />}
                            Save & Market
                          </button>
                          <button 
                            onClick={() => updateFullListing(editingListing.id)}
                            disabled={isSubmitting}
                            className="flex-1 bg-[#2E7D32] text-white font-black px-4 py-4 rounded-2xl shadow-xl shadow-green-900/10 hover:bg-[#1B5E20] transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] disabled:opacity-50 whitespace-nowrap"
                          >
                            {isSubmitting ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                            Save
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                key="seller-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6 pb-24"
              >
                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: "Approved", status: 'Approved', count: sellerListings.filter(l => l.status === 'Approved').length, color: "text-green-600", bg: "bg-green-50" },
                    { label: "Dispute", status: 'Dispute', count: sellerListings.filter(l => l.status === 'Dispute').length, color: "text-red-500", bg: "bg-red-50" },
                  ].map((stat, i) => (
                    <button 
                      key={i} 
                      onClick={() => setListingFilter(listingFilter === stat.status ? 'All' : stat.status)}
                      className={`${stat.bg} p-1.5 rounded-lg border transition-all active:scale-95 flex flex-col items-center justify-center text-center ${listingFilter === stat.status ? 'border-indigo-400 shadow-sm ring-1 ring-indigo-50' : 'border-white shadow-sm hover:border-slate-100'}`}
                    >
                      <span className={`text-[11px] font-black ${stat.color}`}>{stat.count}</span>
                      <span className="text-[5px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">{stat.label}</span>
                    </button>
                  ))}
                </div>

                {/* Seller Center Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-1 p-1.5 bg-white rounded-lg border border-slate-50 shadow-sm relative">
                  <div className="flex items-center gap-1">
                    <div className="p-0.5 bg-red-50 rounded-md">
                      <Mail className="text-red-500" size={8} />
                    </div>
                    <div>
                      <h2 className="font-display text-[9px] font-black text-slate-800 tracking-tight">Seller Center</h2>
                      <div className="flex items-center gap-1 mt-0">
                        <div className="flex items-center gap-0.5 bg-slate-50 px-0.5 py-0.5 rounded border border-slate-50">
                          <span className="w-0.5 h-0.5 bg-blue-500 rounded-full" />
                          <span className="text-[4px] font-bold text-slate-400 uppercase tracking-wider">Live:</span>
                          <span className="text-[6px] font-black text-blue-600">{sellerListings.filter(l => l.status === 'Available').length}</span>
                        </div>
                        <div className="flex items-center gap-0.5 bg-slate-50 px-0.5 py-0.5 rounded border border-slate-50">
                          <span className="w-0.5 h-0.5 bg-orange-400 rounded-full" />
                          <span className="text-[4px] font-bold text-slate-400 uppercase tracking-wider">Pending:</span>
                          <span className="text-[6px] font-black text-orange-600">{sellerListings.filter(l => l.status === 'Pending').length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-1">
                  <button 
                    onClick={() => {}}
                    className="flex-1 py-1 bg-white border border-slate-100 text-slate-600 font-black rounded-lg shadow-sm flex items-center justify-center gap-0.5 text-[6px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-[0.98]"
                  >
                    <History size={8} />
                    History
                  </button>
                  <button 
                    onClick={() => {
                      setSellForm({
                        email: '',
                        password: '',
                        recoveryEmail: '',
                        twoFactor: '',
                        bkashNumber: '',
                        nagadNumber: '',
                        type: 'Full Fresh New',
                        price: gmailPrices['Full Fresh New']?.seller || '16',
                        description: ''
                      });
                      setSellListingToEdit(null);
                      setShowSellModal(true);
                    }}
                    className="flex-1 bg-[#2E7D32] text-white font-black py-1 rounded-lg shadow-md shadow-green-900/5 flex items-center justify-center gap-0.5 text-[6px] uppercase tracking-widest hover:bg-[#1B5E20] transition-all active:scale-[0.98]"
                  >
                    <Plus size={8} />
                    Sell Gmail
                  </button>
                </div>

                <AnimatePresence>
                  {showSellModal && (
                    <>
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => {
                          setShowSellModal(false);
                          setSellListingToEdit(null);
                          setSellForm({
                            email: '',
                            password: '',
                            recoveryEmail: '',
                            twoFactor: '',
                            bkashNumber: '',
                            nagadNumber: '',
                            type: 'Full Fresh New',
                            price: gmailPrices['Full Fresh New']?.seller || '16',
                            description: ''
                          });
                        }}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100]"
                      />
                        <motion.div
                          initial={{ opacity: 0, y: 100, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 100, scale: 0.9 }}
                          className="fixed inset-x-2 md:inset-x-auto bottom-2 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:left-1/2 md:-translate-x-1/2 md:w-[440px] bg-white rounded-2xl md:rounded-[2rem] shadow-2xl z-[110] overflow-hidden flex flex-col max-h-[90vh]"
                        >
                          <div className="bg-gradient-to-br from-[#1B5E20] to-[#2E7D32] p-5 md:p-8 text-white relative">
                            <div className="flex justify-between items-center mb-1">
                              <h3 className="font-display text-xl md:text-2xl font-black tracking-tight">{sellListingToEdit ? 'Edit & Resell' : 'Sell Gmail'}</h3>
                              <button onClick={() => { 
                                setShowSellModal(false); 
                                setSellListingToEdit(null); 
                                setSellForm({
                                  email: '',
                                  password: '',
                                  recoveryEmail: '',
                                  twoFactor: '',
                                  bkashNumber: '',
                                  nagadNumber: '',
                                  type: 'Full Fresh New',
                                  price: gmailPrices['Full Fresh New']?.seller || '16',
                                  description: ''
                                });
                              }} className="p-1.5 hover:bg-white/20 rounded-full transition-all active:scale-95">
                                <X size={20} />
                              </button>
                            </div>
                            <p className="text-white/80 text-[10px] md:text-xs font-medium">{sellListingToEdit ? 'Update your Gmail details to resolve dispute.' : 'Please provide accurate details.'}</p>
                          </div>

                          <form onSubmit={handleSellGmail} className="p-5 md:p-8 space-y-4 overflow-y-auto flex-1 bg-slate-50/50">
                            <div className="space-y-3">
                              {/* Gmail Email */}
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                  <Mail size={10} className="text-[#2E7D32]" />
                                  Gmail Address
                                </label>
                                <div className="relative group">
                                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2E7D32] transition-colors" size={16} />
                                  <input 
                                    type="email" 
                                    autoComplete="off"
                                    name={`gmail-sell-${Math.random()}`}
                                    placeholder="Enter Gmail"
                                    value={sellForm.email}
                                    onChange={(e) => setSellForm({ ...sellForm, email: e.target.value })}
                                    className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/10 focus:border-[#2E7D32] transition-all font-bold text-xs"
                                  />
                                </div>
                              </div>

                              {/* Password */}
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                  <Lock size={10} className="text-indigo-600" />
                                  Password
                                </label>
                                <div className="relative group">
                                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2E7D32] transition-colors" size={16} />
                                  <input 
                                    type="text" 
                                    autoComplete="off"
                                    name={`gmail-pass-${Math.random()}`}
                                    placeholder="Correct Password"
                                    value={sellForm.password}
                                    onChange={(e) => setSellForm({ ...sellForm, password: e.target.value })}
                                    className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/10 focus:border-[#2E7D32] transition-all font-bold text-xs"
                                  />
                                </div>
                              </div>

                              {/* 2FA Authenticator */}
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                  <ShieldCheck size={10} className="text-indigo-600" />
                                  2FA / Backup Code
                                </label>
                                <div className="relative group">
                                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2E7D32] transition-colors" size={16} />
                                  <input 
                                    type="text" 
                                    autoComplete="off"
                                    placeholder="8-digit backup codes"
                                    value={sellForm.twoFactor}
                                    onChange={(e) => setSellForm({ ...sellForm, twoFactor: e.target.value })}
                                    className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/10 focus:border-[#2E7D32] transition-all font-bold text-xs"
                                  />
                                </div>
                              </div>

                              {/* bKash Number */}
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                  <Phone size={10} className="text-[#2E7D32]" />
                                  bKash Number
                                </label>
                                <div className="relative group">
                                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2E7D32] transition-colors" size={16} />
                                  <input 
                                    type="text" 
                                    required
                                    autoComplete="off"
                                    placeholder="01XXXXXXXXX"
                                    value={sellForm.bkashNumber}
                                    onChange={(e) => setSellForm({ ...sellForm, bkashNumber: e.target.value })}
                                    className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/10 focus:border-[#2E7D32] transition-all font-bold text-xs"
                                  />
                                </div>
                              </div>

                              {/* Type & Price Row */}
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Type</label>
                                  <select 
                                    value={sellForm.type}
                                    onChange={(e) => {
                                      const newType = e.target.value;
                                      const newPrice = gmailPrices[newType]?.seller || '0';
                                      setSellForm({ ...sellForm, type: newType, price: newPrice });
                                    }}
                                    className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#2E7D32] transition-all font-bold text-[11px] appearance-none"
                                  >
                                    {Object.keys(gmailPrices).map(t => <option key={t} value={t}>{t}</option>)}
                                  </select>
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Price (৳)</label>
                                  <input 
                                    type="number" 
                                    required
                                    value={sellForm.price}
                                    readOnly={Object.keys(gmailPrices).includes(sellForm.type)}
                                    className={`w-full px-3 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#2E7D32] transition-all font-bold text-[11px] ${Object.keys(gmailPrices).includes(sellForm.type) ? 'bg-slate-100 text-slate-500' : 'bg-white'}`}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="pt-2">
                              <button 
                                disabled={isSubmitting}
                                type="submit"
                                className="w-full bg-[#2E7D32] text-white font-black py-3.5 rounded-xl shadow-lg shadow-green-900/10 hover:shadow-green-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest disabled:opacity-50"
                              >
                                {isSubmitting ? (
                                  <RefreshCw size={16} className="animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle size={16} />
                                    {sellListingToEdit ? 'Update & Re-sell' : 'Submit Listing'}
                                  </>
                                )}
                              </button>
                            </div>
                          </form>
                        </motion.div>
                    </>
                  )}
                </AnimatePresence>

                {/* Search Bar */}
                <div className="relative group shadow-sm bg-white rounded-lg">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2E7D32] transition-colors" size={12} />
                  <input 
                    type="text" 
                    placeholder="Gmail দিয়ে খুঁজুন..."
                    onChange={(e) => setSellerSearchQuery(e.target.value)}
                    value={sellerSearchQuery}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-slate-100 focus:outline-none focus:border-[#2E7D32] transition-all text-[10px] font-bold"
                  />
                </div>

                <div className="flex gap-1 overflow-x-auto pb-1.5 scrollbar-hide">
                  <button 
                    onClick={() => setListingFilter('All')}
                    className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all border ${listingFilter === 'All' ? 'bg-[#1B5E20] text-white border-[#1B5E20]' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 shadow-sm'}`}
                  >
                    All
                  </button>
                  <button 
                    onClick={() => setListingFilter('Approved')}
                    className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all border ${listingFilter === 'Approved' ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 shadow-sm'}`}
                  >
                    Approved
                  </button>
                  <button 
                    onClick={() => setListingFilter('Reports')}
                    className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all border ${listingFilter === 'Reports' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 shadow-sm'}`}
                  >
                    Reports ({sellerReports.length})
                  </button>
                </div>

                {/* List Cards */}
                <div className="space-y-4">
                  {listingFilter === 'Reports' ? (
                    sellerReports.length === 0 ? (
                      <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200">
                        <MessageSquare className="mx-auto mb-4 text-slate-300" size={32} />
                        <p className="text-slate-400 font-bold">No reports yet.</p>
                      </div>
                    ) : (
                      sellerReports.map((report) => (
                        <motion.div
                          key={report.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-red-50 border border-red-100 rounded-3xl p-6 space-y-3"
                        >
                          <div className="flex justify-between items-start text-[10px] font-black uppercase tracking-widest text-red-400">
                             <span>Report from {report.buyerEmail}</span>
                             <span>{new Date(report.createdAt?.toDate()).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm font-bold text-slate-800 bg-white/50 p-4 rounded-xl border border-white">
                             "{report.message}"
                          </p>
                          <div className="text-[9px] font-black text-slate-400 uppercase">
                             Listing ID: {report.listingId}
                          </div>
                        </motion.div>
                      ))
                    )
                  ) : sellerListings.filter(l => {
                    const matchesSearch = l.gmailAccount.toLowerCase().includes(sellerSearchQuery.toLowerCase());
                    const matchesFilter = listingFilter === 'All' || l.status === listingFilter;
                    return matchesSearch && matchesFilter;
                  }).length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <Mail size={32} />
                      </div>
                      <p className="text-slate-400 font-bold">
                        {sellerSearchQuery ? 'এই ইমেইল দিয়ে কোনো লিস্টিং পাওয়া যায়নি।' : (listingFilter !== 'All' ? `${listingFilter} ক্যাটাগরিতে কোনো জিমেইল পাওয়া যায়নি।` : 'আপনি এখনো কোনো Gmail লিস্টিং করেননি।')}
                      </p>
                    </div>
                  ) : (
                    sellerListings
                      .filter(l => {
                        const matchesSearch = l.gmailAccount.toLowerCase().includes(sellerSearchQuery.toLowerCase());
                        const matchesFilter = listingFilter === 'All' || l.status === listingFilter;
                        return matchesSearch && matchesFilter;
                      })
                      .map((item, i) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-[2rem] border border-slate-100 p-8 space-y-6 shadow-sm shadow-slate-200/40 relative"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-display text-lg font-bold text-slate-800">{item.gmailAccount}</h4>
                          <div className="flex flex-col items-end">
                            <span className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold uppercase tracking-wider ${
                              item.status === 'Approved' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                              item.status === 'Available' ? 'bg-green-50 border-green-100 text-green-600' :
                              item.status === 'Dispute' ? 'bg-red-50 border-red-100 text-red-600' :
                              'bg-slate-50 border-slate-100 text-slate-500'
                            }`}>
                              {item.status === 'Approved' ? 'Approved' : item.status}
                            </span>
                            <p className="text-[10px] font-black text-indigo-600 mt-1">৳{item.price}</p>
                          </div>
                        </div>

                        <div className="inline-block px-4 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          {item.type}
                        </div>

                        <div className="space-y-4">
                          <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.1em]">ACCOUNT DETAILS</p>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <div className="flex flex-col gap-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase">Account Credentials</span>
                                <div className="space-y-2 mt-1">
                                  <div className="flex flex-col">
                                    <span className="text-[8px] text-slate-500">Email:</span>
                                    <span className="font-mono text-slate-900 text-sm">
                                      {revealedPasswords[item.id] ? revealedPasswords[item.id].email : '**********'}
                                    </span>
                                  </div>
                                  {revealedPasswords[item.id] && (
                                    <>
                                      <div className="flex flex-col">
                                        <span className="text-[8px] text-slate-500">Password:</span>
                                        <span className="font-mono text-slate-900 text-sm font-bold">
                                          {revealedPasswords[item.id].password}
                                        </span>
                                      </div>
                                      {(revealedPasswords[item.id].recoveryEmail || revealedPasswords[item.id].recovery) && (
                                        <div className="flex flex-col">
                                          <span className="text-[8px] text-slate-500">Recovery:</span>
                                          <span className="font-mono text-slate-900 text-sm">
                                            {revealedPasswords[item.id].recoveryEmail || revealedPasswords[item.id].recovery}
                                          </span>
                                        </div>
                                      )}
                                      {revealedPasswords[item.id].twoFactor && (
                                        <div className="flex flex-col">
                                          <span className="text-[8px] text-slate-500">2FA / Security Code:</span>
                                          <span className="font-mono text-slate-900 text-sm">
                                            {revealedPasswords[item.id].twoFactor}
                                          </span>
                                        </div>
                                      )}
                                    </>
                                  )}
                                  {!revealedPasswords[item.id] && (
                                    <div className="flex flex-col">
                                      <span className="text-[8px] text-slate-500">Password:</span>
                                      <span className="font-mono text-slate-900 text-sm italic opacity-30">
                                        Hidden
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <button 
                                onClick={() => revealPassword(item.id, item.sellerId)}
                                className="p-2 hover:bg-white rounded-lg transition-colors shadow-sm self-start"
                              >
                                {revealedPasswords[item.id] ? <Eye className="text-[#2E7D32]" size={16} /> : <EyeOff className="text-slate-400" size={16} />}
                              </button>
                            </div>
                          </div>
                        </div>

                        {item.status === 'Dispute' && (
                          <div className="border-t border-slate-50 pt-6">
                            <button 
                              onClick={() => openSellerEditModal(item.id)}
                              className="w-full py-5 rounded-2xl bg-blue-600 text-white text-sm font-black flex items-center justify-center gap-3 hover:bg-blue-700 transition-all active:scale-[0.98] shadow-lg shadow-blue-900/10"
                            >
                              <Edit size={20} strokeWidth={3} />
                              Check Now / Edit করুন
                            </button>
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

          {/* Ranking Modal */}
          <AnimatePresence>
            {showRankModal.show && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowRankModal({ ...showRankModal, show: false })}
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative w-full max-w-sm bg-white rounded-[3rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] border border-slate-50 flex flex-col max-h-[85vh]"
                >
                  <div className="flex flex-col items-center text-center pt-8 pb-5 px-8 flex-shrink-0">
                    <div className={`w-16 h-16 rounded-[2.2rem] flex items-center justify-center mb-4 shadow-inner ${showRankModal.type === 'seller' ? 'bg-orange-50' : 'bg-purple-50'}`}>
                      {showRankModal.type === 'seller' ? (
                        <Trophy size={32} className="text-orange-500 drop-shadow-sm" />
                      ) : (
                        <ShoppingBag size={32} className="text-purple-500 drop-shadow-sm" />
                      )}
                    </div>

                    <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1.5">
                      Top 10 {showRankModal.type === 'seller' ? 'Sellers' : 'Buyers'}
                    </h2>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.25em]">
                      {showRankModal.type === 'seller' ? 'MOST ACTIVE SELLERS ON PLATFORM' : 'MOST ACTIVE INVESTORS ON PLATFORM'}
                    </p>
                  </div>

                  <div className="flex-grow overflow-y-auto px-5 custom-scrollbar scroll-smooth">
                    <div className="space-y-2 pb-6">
                      {(showRankModal.type === 'seller' ? topSellers : topBuyers).map((item, idx) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex items-center justify-between p-2.5 rounded-[1.5rem] border ${
                            showRankModal.type === 'seller' 
                              ? 'bg-orange-50/30 border-orange-100/20' 
                              : 'bg-purple-50/30 border-purple-100/20'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              {item.photoURL ? (
                                <img src={item.photoURL} alt="" className="w-11 h-11 rounded-xl object-cover shadow-sm border-2 border-white bg-white" />
                              ) : (
                                <div className="w-11 h-11 rounded-xl flex items-center justify-center border-2 border-white shadow-sm bg-white text-slate-300">
                                  <UserIcon size={20} />
                                </div>
                              )}
                              
                              <div className={`absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border border-white shadow-md z-10
                                ${idx === 0 ? 'bg-orange-500 text-white' : 
                                  idx === 1 ? 'bg-slate-400 text-white' :
                                  idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-400 text-white'}`}
                              >
                                {idx + 1}
                              </div>
                            </div>
                            <div className="text-left">
                              <div className="flex items-center gap-1 mb-0.5">
                                <p className="text-[13px] font-black text-slate-800 truncate max-w-[90px] leading-tight">
                                  {item.displayName || item.name || item.username || item.email?.split('@')[0] || 'User'}
                                </p>
                                {idx < 3 && (
                                  <Crown 
                                    size={10} 
                                    className={`${idx === 0 ? 'text-orange-500' : idx === 1 ? 'text-slate-400' : 'text-amber-700'} fill-current`} 
                                  />
                                )}
                              </div>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest opacity-80">
                                {showRankModal.type === 'seller' ? 'TOTAL SELL' : 'TOTAL INVESTMENTS'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-black italic tracking-tighter leading-none mb-0.5 ${showRankModal.type === 'seller' ? 'text-slate-900' : 'text-purple-600'}`}>
                              {showRankModal.type === 'seller' ? (item.totalSales || 0) : `৳${(item.totalSpent || 0).toLocaleString()}`}
                            </p>
                            <p className={`text-[7px] font-black uppercase tracking-widest ${showRankModal.type === 'seller' ? 'text-orange-500' : 'text-purple-400'}`}>
                              {showRankModal.type === 'seller' ? 'GMAILS' : 'SPENT'}
                            </p>
                          </div>
                        </motion.div>
                      ))}

                      {(showRankModal.type === 'seller' ? topSellers : topBuyers).length === 0 && (
                        <div className="py-12 text-center bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">No data found yet</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-8 pt-2 flex-shrink-0">
                    <button
                      onClick={() => setShowRankModal({ ...showRankModal, show: false })}
                      className="w-full py-5 bg-[#0f172a] text-white rounded-[1.8rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-slate-200 active:scale-95 transition-all hover:bg-slate-900"
                    >
                      CLOSE
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        {/* bKash Payment Modal */}
        <AnimatePresence>
          {isBulkConfirmModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl flex flex-col"
              >
                <div className="p-8 text-center bg-indigo-50/50">
                   <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <Layers size={32} className="text-indigo-600" />
                   </div>
                   <h2 className="text-xl font-black text-slate-800 mb-2 font-display uppercase tracking-tight">Bulk Confirmation</h2>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selected: {selectedListings.length} Gmail Accounts</p>
                </div>
                <div className="p-8">
                   <div className="bg-slate-50 rounded-2xl p-6 mb-6 text-center border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Payable</p>
                      <h3 className="text-4xl font-black text-slate-900">৳{
                        marketListings
                          .filter(l => selectedListings.includes(l.id))
                          .reduce((sum, item) => {
                            const priceObj = (gmailPrices as any)[item.type];
                            const currentPrice = priceObj?.buyer ? parseFloat(priceObj.buyer) : item.price;
                            return sum + currentPrice;
                          }, 0).toFixed(2)
                      }</h3>
                   </div>
                   <div className="flex flex-col gap-3">
                      <button 
                        onClick={proceedToBulkPayment}
                        disabled={isSubmitting}
                        id="bulk-confirm-btn"
                        className="w-full py-4 rounded-xl bg-indigo-600 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-100 hover:bg-slate-900 transition-all flex items-center justify-center gap-2 active:scale-95"
                      >
                        {isSubmitting ? <RefreshCw size={14} className="animate-spin" /> : 'Confirm Order'}
                      </button>
                      <button 
                        onClick={() => setIsBulkConfirmModalOpen(false)}
                        className="w-full py-4 rounded-xl bg-slate-100 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-slate-600 transition-all active:scale-95"
                      >
                        Cancel
                      </button>
                   </div>
                </div>
              </motion.div>
            </div>
          )}

          {showPaymentModal.show && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowPaymentModal({ show: false, price: 0 })}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100]"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-[380px] ${paymentForm.method === 'bkash' ? 'bg-[#e2136e]' : 'bg-[#ed1c24]'} rounded-[2rem] shadow-2xl z-[101] overflow-hidden border ${paymentForm.method === 'bkash' ? 'border-[#d11264]' : 'border-[#d11218]'} transition-colors duration-500`}
              >
                <div className="py-1 px-4 text-white relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex gap-2.5 p-0.5 flex-1 max-w-[280px]">
                      <button 
                        onClick={() => setPaymentForm(prev => ({...prev, method: 'bkash'}))}
                        className={`flex-1 h-10 rounded-xl flex items-center justify-center p-1 shadow-md transition-all relative ${paymentForm.method === 'bkash' ? 'bg-white scale-105 ring-2 ring-white/30' : 'bg-white/40 hover:bg-white/60 opacity-70 hover:opacity-100'}`}
                      >
                        <img src="https://www.logo.wine/a/logo/BKash/BKash-Logo.wine.svg" alt="bKash" className="w-full h-full object-contain scale-125" referrerPolicy="no-referrer" />
                        {paymentForm.method === 'bkash' && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-pink-600 rounded-full border border-white"></div>}
                      </button>
                      <button 
                        onClick={() => setPaymentForm(prev => ({...prev, method: 'nagad'}))}
                        className={`flex-1 h-10 rounded-xl flex items-center justify-center p-1 shadow-md transition-all relative ${paymentForm.method === 'nagad' ? 'bg-white scale-105 ring-2 ring-white/30' : 'bg-white/40 hover:bg-white/60 opacity-70 hover:opacity-100'}`}
                      >
                        <img src="https://www.logo.wine/a/logo/Nagad/Nagad-Logo.wine.svg" alt="Nagad" className="w-full h-full object-contain scale-125" referrerPolicy="no-referrer" />
                        {paymentForm.method === 'nagad' && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-600 rounded-full border border-white"></div>}
                      </button>
                    </div>
                    <button 
                      onClick={() => setShowPaymentModal({ show: false, price: 0 })}
                      className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors ml-2"
                    >
                      <X size={14} />
                    </button>
                  </div>

                <div className="flex items-end justify-between px-2 pb-0.5">
                    <div className="space-y-0">
                      <p className="text-white/80 text-[7px] font-black uppercase tracking-[0.2em]">Pay Amount</p>
                      <h3 className="text-2xl font-black italic tracking-tighter">৳{showPaymentModal.price.toFixed(2)}</h3>
                    </div>
                    <div className="mb-0.5">
                       <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest border border-white/10">Personal</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-t-[1.5rem] px-5 py-3.5 space-y-3.5 max-h-[75vh] overflow-y-auto custom-scrollbar shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                  <div className="space-y-4">
                    <AnimatePresence mode="wait">
                      {isPaymentSent ? (
                        <motion.div 
                          key="pending"
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          className="space-y-6 py-4 px-2"
                        >
                          <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center animate-pulse border-4 border-white shadow-lg">
                              <History size={40} />
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-xl font-black text-slate-800 tracking-tight">পেমেন্ট পেন্ডিং (Pending Approval)</h3>
                              <p className="text-slate-500 text-xs font-bold leading-relaxed px-4">
                                আপনার পেমেন্ট রিকুয়েস্ট পাঠানো হয়েছে। অ্যাডমিন ভেরিফাই করলে আপনার ক্রয় সম্পন্ন হবে। (সাধারণত ১-৫ মিনিট সময় লাগে)
                              </p>
                            </div>
                          </div>

                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                             <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                <History size={16} />
                             </div>
                             <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">কিভাবে চেক করবেন?</p>
                                <p className="text-[11px] text-slate-600 font-bold">"লেনদেন ইতিহাস" ট্যাব থেকে আপডেট দেখতে পাবেন।</p>
                             </div>
                          </div>

                          <button 
                            onClick={() => {
                              setShowPaymentModal({ show: false, price: 0 });
                              setIsPaymentSent(false);
                              setView('gmail-market');
                              setMarketTab('Bought');
                            }}
                            className="w-full py-4 rounded-xl bg-[#2E7D32] text-white font-black text-[10px] uppercase tracking-widest hover:bg-[#1B5E20] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                          >
                            <CheckCircle size={16} />
                            ওকে (সরাসরি Purchased যান)
                          </button>
                        </motion.div>
                      ) : purchasedCreds ? (
                        <motion.div 
                          key="success"
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          className="space-y-6 pt-2"
                        >
                          <div className="text-center py-4 bg-[#E8F5E9] rounded-2xl border-2 border-[#C8E6C9] mb-4 shadow-sm">
                             <p className="text-[#2E7D32] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                               <CheckCircle size={20} />
                               PAYMENT VERIFIED
                             </p>
                          </div>
                          
                          <div className="p-6 bg-[#0F172A] rounded-[2rem] space-y-6 shadow-2xl relative overflow-hidden border border-slate-800">
                             <div className="absolute top-0 right-0 p-6 opacity-5">
                                <ShieldCheck size={80} className="text-white" />
                             </div>
                             
                             <div className="space-y-3 relative z-10">
                              <div className="space-y-1">
                                <span className="text-[8px] text-white/30 uppercase font-black tracking-widest block">Purchased Gmail</span>
                                <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                                  <p className="font-mono font-bold text-white text-xs truncate mr-2 select-all">{purchasedCreds.gmail}</p>
                                  <button onClick={() => { navigator.clipboard.writeText(purchasedCreds.gmail); alert('Gmail Copied!'); }} className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-[#FFEB3B] hover:scale-110 transition-all"><Copy size={12}/></button>
                                </div>
                              </div>
  
                              <div className="space-y-1">
                                <span className="text-[8px] text-white/30 uppercase font-black tracking-widest block">Account Password</span>
                                <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                                  <p className="font-mono font-bold text-[#FFEB3B] text-xs truncate mr-2 select-all">{purchasedCreds.pass}</p>
                                  <button onClick={() => { navigator.clipboard.writeText(purchasedCreds.pass); alert('Password Copied!'); }} className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white hover:scale-110 transition-all"><Copy size={12}/></button>
                                </div>
                              </div>

                              {purchasedCreds.recovery && (
                                <div className="space-y-1">
                                  <span className="text-[8px] text-white/30 uppercase font-black tracking-widest block">Recovery Email</span>
                                  <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                                    <p className="font-mono font-bold text-green-300 text-xs truncate mr-2 select-all">{purchasedCreds.recovery}</p>
                                    <button onClick={() => { navigator.clipboard.writeText(purchasedCreds.recovery!); alert('Recovery Copied!'); }} className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white hover:scale-110 transition-all"><Copy size={12}/></button>
                                  </div>
                                </div>
                              )}

                              {purchasedCreds.twoFactor && (
                                <div className="space-y-1">
                                  <span className="text-[8px] text-white/30 uppercase font-black tracking-widest block">2FA / Authenticator</span>
                                  <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                                    <p className="font-mono font-bold text-blue-300 text-xs truncate mr-2 select-all">{purchasedCreds.twoFactor}</p>
                                    <button onClick={() => { navigator.clipboard.writeText(purchasedCreds.twoFactor!); alert('2FA Copied!'); }} className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white hover:scale-110 transition-all"><Copy size={12}/></button>
                                  </div>
                                </div>
                              )}
                             </div>
  
                             <div className="bg-white/5 p-3 rounded-xl flex items-center gap-2.5 border border-white/5">
                                <AlertCircle size={14} className="text-yellow-300/80 shrink-0" />
                                <p className="text-[9px] text-white/50 font-medium leading-tight">
                                  তথ্যগুলো সেভ করে রাখুন। এগুলো "Bought" ট্যাব থেকেও দেখতে পারবেন।
                                </p>
                             </div>
                          </div>
  
                          <button 
                            onClick={() => {
                              setShowPaymentModal({ show: false, price: 0 });
                              setPurchasedCreds(null);
                              setIsPaymentSent(false);
                              setCurrentPaymentId(null);
                              setView('gmail-market');
                              setMarketTab('Bought');
                            }}
                            className="w-full py-5 rounded-[1.5rem] bg-[#2E7D32] text-white font-black text-xs uppercase tracking-[0.15em] hover:bg-[#1B5E20] transition-all shadow-[0_10px_30px_rgba(46,125,50,0.3)] active:scale-95 flex items-center justify-center gap-3"
                          >
                            FINISH & VIEW ACCOUNT
                          </button>
                        </motion.div>
                      ) : bulkPurchasedCreds ? (
                        <motion.div 
                          key="bulk-success"
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          className="space-y-4 pt-1"
                        >
                          <div className="text-center py-3 bg-green-500/10 rounded-2xl border border-green-500/20 mb-2">
                             <p className="text-[#2E7D32] font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2">
                               <CheckCircle size={16} />
                               Bulk Order Complete ({bulkPurchasedCreds.length})
                             </p>
                          </div>

                          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                            {bulkPurchasedCreds.map((cred, idx) => (
                              <div key={idx} className="p-4 bg-slate-900 rounded-2xl space-y-3 shadow-lg border border-white/10">
                                <div className="flex items-center justify-between">
                                  <span className="text-[8px] text-white/30 uppercase font-black tracking-widest">Item #{idx + 1}</span>
                                  <button onClick={() => { 
                                    navigator.clipboard.writeText(`${cred.gmail}:${cred.pass}:${cred.recovery || ''}:${cred.twoFactor || ''}`);
                                    alert('Item Copied!'); 
                                  }} className="text-[#FFEB3B] hover:text-white transition-all"><Copy size={12}/></button>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                  <div className="flex items-center justify-between bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                    <span className="text-[7px] text-white/40 uppercase font-black tracking-tight">Email:</span>
                                    <span className="font-mono text-[10px] font-bold text-white truncate max-w-[150px]">{cred.gmail}</span>
                                  </div>
                                  <div className="flex items-center justify-between bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                    <span className="text-[7px] text-white/40 uppercase font-black tracking-tight">Pass:</span>
                                    <span className="font-mono text-[10px] font-bold text-green-400">{cred.pass}</span>
                                  </div>
                                  {cred.recovery && (
                                    <div className="flex items-center justify-between bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                      <span className="text-[7px] text-white/40 uppercase font-black tracking-tight">Recov:</span>
                                      <span className="font-mono text-[10px] font-bold text-emerald-300 truncate max-w-[150px]">{cred.recovery}</span>
                                    </div>
                                  )}
                                  {cred.twoFactor && (
                                    <div className="flex items-center justify-between bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                      <span className="text-[7px] text-white/40 uppercase font-black tracking-tight">2FA:</span>
                                      <span className="font-mono text-[10px] font-bold text-blue-300">{cred.twoFactor}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                const fullText = bulkPurchasedCreds.map(c => `${c.gmail}:${c.pass}:${c.recovery || ''}:${c.twoFactor || ''}`).join('\n');
                                navigator.clipboard.writeText(fullText);
                                alert('All Copy Success!');
                              }}
                              className="flex-1 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-800 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                            >
                              <Copy size={14} />
                              Copy All
                            </button>
                            <button 
                              onClick={() => {
                                setShowPaymentModal({ show: false, price: 0 });
                                setBulkPurchasedCreds(null);
                                setView('gmail-market');
                                setMarketTab('Bought');
                              }}
                              className="flex-[2] py-3.5 rounded-xl bg-green-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg"
                            >
                              Finish Transaction
                            </button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="payment"
                          initial={{ opacity: 1 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          className="space-y-4"
                        >
                        <div className={`p-3 rounded-2xl border relative overflow-hidden group transition-colors ${paymentForm.method === 'bkash' ? 'bg-pink-50 border-pink-100' : 'bg-red-50 border-red-100'}`}>
                          <div className={`absolute top-0 right-0 w-20 h-20 ${paymentForm.method === 'bkash' ? 'bg-pink-100/50' : 'bg-red-100/50'} rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform`}></div>
                          <div className="relative z-10 flex items-center justify-between">
                            <div className="space-y-0.5">
                              <p className={`text-[8px] ${paymentForm.method === 'bkash' ? 'text-pink-600' : 'text-red-600'} font-black uppercase tracking-widest flex items-center gap-1.5`}>
                                <div className="w-5 h-5 bg-white rounded-md flex items-center justify-center p-0.5 shadow-sm">
                                  <img 
                                    src={paymentForm.method === 'bkash' ? "https://www.logo.wine/a/logo/BKash/BKash-Logo.wine.svg" : "https://www.logo.wine/a/logo/Nagad/Nagad-Logo.wine.svg"} 
                                    alt=""
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                                SEND MONEY (Personal - {paymentForm.method.toUpperCase()})
                              </p>
                              <p className="text-xl font-black text-slate-800 tracking-tight select-all">
                                {paymentForm.method === 'bkash' ? '01857902383' : '01410731308'}
                              </p>
                            </div>
                            <button 
                              onClick={() => {
                                const num = paymentForm.method === 'bkash' ? '01857902383' : '01410731308';
                                navigator.clipboard.writeText(num);
                                alert("Number copied!");
                              }}
                              className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center ${paymentForm.method === 'bkash' ? 'text-pink-600 border-pink-100' : 'text-red-600 border-red-100'} shadow-sm border hover:scale-110 transition-all active:scale-95`}
                            >
                              <Copy size={16} />
                            </button>
                          </div>
                        </div>
                        
                        <div className={`p-3 rounded-2xl border space-y-2.5 transition-colors ${paymentForm.method === 'bkash' ? 'bg-pink-50/50 border-pink-100/50' : 'bg-red-50/50 border-red-100/50'}`}>
                          <div className={`${paymentForm.method === 'bkash' ? 'bg-rose-600' : 'bg-red-600'} text-white p-2.5 rounded-xl shadow-lg`}>
                             <div className="flex items-center gap-2 mb-1">
                               <AlertCircle size={14} className="animate-pulse" />
                               <p className="text-[10px] font-black uppercase tracking-widest">জরুরী নোটিশ</p>
                             </div>
                             <p className="text-[9px] font-bold leading-relaxed">
                               সঠিক TrxID দিন। ভুল আইডি দিলে আপনার পেমেন্ট রিজেক্ট হয়ে যাবে। পেমেন্টে কোনো সমস্যা হলে আমাদের সাথে সরাসরি চ্যাট বা সাপোর্ট বক্স এ যোগাযোগ করুন।
                             </p>
                          </div>
                          <div className={`flex items-center gap-2 ${paymentForm.method === 'bkash' ? 'text-[#e2136e]' : 'text-[#ed1c24]'} pt-1`}>
                            <Info size={14} />
                            <p className="text-[10px] font-black uppercase tracking-widest">কীভাবে পেমেন্ট করবেন?</p>
                          </div>
                          <div className="space-y-1 pl-1">
                            <p className="text-[9px] text-slate-600 font-medium leading-relaxed">
                              ১. নাম্বারটি কপি করে আপনার {paymentForm.method === 'bkash' ? 'বিকাশ' : 'নগদ'} অ্যাপ থেকে <span className="font-bold text-slate-900">Send Money</span> করুন।
                            </p>
                            <p className="text-[9px] text-slate-600 font-medium leading-relaxed">
                              ২. পেমেন্ট শেষে প্রাপ্ত <span className="font-bold text-slate-900">TrxID</span> টি কপি করে নিচের বক্সে দিন।
                            </p>
                            <p className="text-[9px] text-slate-600 font-medium leading-relaxed">
                              ৩. সঠিক তথ্য দিলে আপনি স্বয়ংক্রিয়ভাবে জিমেইল একাউন্টটি পেয়ে যাবেন।
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          <div className="space-y-1 group">
                            <label className={`text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 transition-colors ${paymentForm.method === 'bkash' ? 'group-focus-within:text-[#e2136e]' : 'group-focus-within:text-[#ed1c24]'}`}>Your {paymentForm.method === 'bkash' ? 'bKash' : 'Nagad'} Number</label>
                            <div className="relative">
                              <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 transition-colors ${paymentForm.method === 'bkash' ? 'group-focus-within:text-[#e2136e]' : 'group-focus-within:text-[#ed1c24]'}`}>
                                <Phone size={14} />
                              </div>
                              <input 
                                type="text" 
                                placeholder="01XXXXXXXXX"
                                value={paymentForm.senderNumber}
                                onChange={(e) => setPaymentForm({...paymentForm, senderNumber: e.target.value})}
                                className={`w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs font-bold focus:outline-none focus:ring-4 transition-all ${paymentForm.method === 'bkash' ? 'focus:ring-[#e2136e]/10 focus:border-[#e2136e]' : 'focus:ring-[#ed1c24]/10 focus:border-[#ed1c24]'}`}
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5 group">
                            <label className={`text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 transition-colors ${paymentForm.method === 'bkash' ? 'group-focus-within:text-[#e2136e]' : 'group-focus-within:text-[#ed1c24]'}`}>Transaction ID (TrxID)</label>
                            <div className="relative">
                              <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 transition-colors ${paymentForm.method === 'bkash' ? 'group-focus-within:text-[#e2136e]' : 'group-focus-within:text-[#ed1c24]'}`}>
                                <BadgeCheck size={14} />
                              </div>
                              <input 
                                type="text" 
                                placeholder="Type Transaction ID"
                                value={paymentForm.trxId}
                                onChange={(e) => setPaymentForm({...paymentForm, trxId: e.target.value})}
                                className={`w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs font-bold focus:outline-none focus:ring-4 transition-all ${paymentForm.method === 'bkash' ? 'focus:ring-[#e2136e]/10 focus:border-[#e2136e]' : 'focus:ring-[#ed1c24]/10 focus:border-[#ed1c24]'}`}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="pt-1 relative">
                          <AnimatePresence>
                             {paymentError && (
                               <motion.div 
                                 initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                 animate={{ opacity: 1, scale: 1, y: 0 }}
                                 exit={{ opacity: 0, scale: 0.8, y: 10 }}
                                 className="absolute -top-16 left-0 right-0 z-50 flex justify-center pointer-events-none"
                               >
                                 <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-3 border border-white/10 backdrop-blur-md">
                                   <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center">
                                      <X size={12} className="text-white" />
                                   </div>
                                   {paymentError}
                                 </div>
                                </motion.div>
                             )}
                          </AnimatePresence>

                          <button 
                            onClick={verifyPayment}
                            disabled={isVerifying}
                            className={`w-full py-3.5 rounded-xl text-white font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-lg disabled:opacity-70 ${paymentForm.method === 'bkash' ? 'bg-[#e2136e] hover:bg-[#d11264] shadow-[#e2136e]/20' : 'bg-[#ed1c24] hover:bg-[#d11218] shadow-[#ed1c24]/20'}`}
                          >
                            {isVerifying ? (
                              <RefreshCw size={16} className="animate-spin" />
                            ) : (
                              'Verify Payment'
                            )}
                          </button>
                        </div>

                        <div className="flex items-center justify-center gap-4 py-0.5">
                           <div className="flex items-center gap-1 text-slate-400">
                              <Shield size={10} />
                              <span className="text-[8px] font-black uppercase tracking-widest">Secure</span>
                           </div>
                           <div className="w-px h-2 bg-slate-200" />
                           <div className="flex items-center gap-1 text-slate-400">
                              <Star size={10} fill="currentColor" />
                              <span className="text-[8px] font-black uppercase tracking-widest">Rapid</span>
                           </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

                <AnimatePresence>
                  {showReportModal?.show && (
                    <>
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowReportModal(null)}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200]"
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed inset-x-6 top-[20%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[400px] bg-white rounded-[2rem] shadow-2xl z-[210] p-8 space-y-6"
                      >
                         <div className="space-y-2">
                            <h3 className="text-xl font-black text-slate-800">Report an Issue</h3>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">If there's something wrong with this Gmail account, let the seller know.</p>
                         </div>
                         <textarea 
                            value={reportMessage}
                            onChange={(e) => setReportMessage(e.target.value)}
                            placeholder="Describe the issue (e.g. wrong password, disabled account)..."
                            className="w-full h-32 p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-red-500 font-medium text-sm"
                         />
                         <div className="flex gap-3">
                            <button onClick={() => setShowReportModal(null)} className="flex-1 py-4 rounded-xl bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-widest">Cancel</button>
                            <button 
                               onClick={handleFileReport}
                               disabled={isSubmitting || !reportMessage.trim()}
                               className="flex-1 py-4 rounded-xl bg-red-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-red-200 disabled:opacity-50"
                            >
                               Submit Report
                            </button>
                         </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {showReferModal && (
                    <>
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowReferModal(false)}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200]"
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed inset-x-6 top-[20%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[400px] bg-white rounded-[2.5rem] shadow-2xl z-[210] p-8 space-y-6 overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -mr-16 -mt-16 blur-2xl" />
                        <div className="relative space-y-6 text-center">
                          <div className="w-20 h-20 bg-purple-50 text-purple-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-sm">
                            <Share2 size={36} />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Refer & Earn</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Share this link with your friends</p>
                          </div>
        
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-2xl space-y-1">
                              <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Referrals</p>
                              <p className="text-xl font-black text-slate-800 tracking-tight">{userProfile?.successfulReferrals || 0}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl space-y-1">
                              <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Bonus Earned</p>
                              <p className="text-xl font-black text-[#2E7D32] tracking-tight">৳{(userProfile?.successfulReferrals || 0) * 5}</p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="p-4 bg-slate-900 rounded-2xl space-y-1 select-all relative overflow-hidden group">
                              <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full -mr-8 -mt-8" />
                              <p className="text-[7px] font-black text-white/40 tracking-widest uppercase">Your Referral URL</p>
                              <p className="text-[10px] font-mono text-white/90 truncate pr-8 leading-relaxed">
                                {window.location.origin}/?ref={userProfile?.numericId}
                              </p>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(`${window.location.origin}/?ref=${userProfile?.numericId}`);
                                  alert('Referral link copied!');
                                }}
                                className="absolute top-1/2 -translate-y-1/2 right-4 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-95"
                              >
                                <Copy size={14} />
                              </button>
                            </div>
                          </div>

                          <div className="pt-2">
                             <button 
                               onClick={() => {
                                 setShowReferModal(false);
                                 setShowWithdrawModal(true);
                               }}
                               disabled={(userProfile?.successfulReferrals || 0) === 0}
                               className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                             >
                               <Wallet size={16} />
                               Withdraw Bonus
                             </button>
                          </div>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {showWithdrawModal && (
                    <>
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowWithdrawModal(false)}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200]"
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed inset-x-6 top-[20%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[400px] bg-white rounded-[2.5rem] shadow-2xl z-[210] p-8 space-y-6 overflow-hidden"
                      >
                         <div className="space-y-2 text-center">
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Withdraw Referral Bonus</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Amount: ৳{(userProfile?.successfulReferrals || 0) * 5}</p>
                         </div>

                         <div className="space-y-4 text-left">
                            <div className="space-y-1.5 group">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Method</label>
                              <select 
                                id="withdraw-method"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-green-50 focus:border-green-500 transition-all"
                                defaultValue="bKash"
                                onChange={(e) => {
                                  const numInput = document.getElementById('withdraw-number') as HTMLInputElement;
                                  if (e.target.value === 'bKash') {
                                    numInput.placeholder = "bKash: 01XXXXXXXXX";
                                    numInput.value = userProfile?.bkashNumber || '';
                                  } else {
                                    numInput.placeholder = "Nagad: 01XXXXXXXXX";
                                    numInput.value = userProfile?.nagadNumber || '';
                                  }
                                }}
                              >
                                <option value="bKash">bKash</option>
                                <option value="Nagad">Nagad</option>
                              </select>
                            </div>
                            <div className="space-y-1.5 group">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Number</label>
                              <input 
                                type="text" 
                                placeholder="01XXXXXXXXX"
                                defaultValue={userProfile?.bkashNumber || ''}
                                id="withdraw-number"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-green-50 focus:border-green-500 transition-all"
                              />
                            </div>
                         </div>

                         <button 
                           onClick={async () => {
                             const method = (document.getElementById('withdraw-method') as HTMLSelectElement).value;
                             const number = (document.getElementById('withdraw-number') as HTMLInputElement).value;
                             if (!number || number.length < 11) {
                               alert(`${method} নাম্বার সঠিক নয়!`);
                               return;
                             }
                             
                             setIsSubmitting(true);
                             try {
                               const amount = (userProfile?.successfulReferrals || 0) * 5;
                               
                               if ((userProfile?.balance || 0) < amount) {
                                 alert('আপনার মেইন ব্যালেন্স পর্যাপ্ত নয় (সম্ভবত আপনি রেফার বোনাস খরচ করেছেন)');
                                 return;
                               }

                               await addDoc(collection(db, 'withdrawals'), {
                                 userId: user?.uid,
                                 userEmail: user?.email,
                                 amount: amount,
                                 number: number,
                                 method: method,
                                 status: 'pending',
                                 type: 'referral_bonus',
                                 createdAt: serverTimestamp()
                               });

                               await updateDoc(doc(db, 'profiles', user!.uid), {
                                 successfulReferrals: 0,
                                 balance: increment(-amount)
                               });
                               
                               setUserProfile((prev: any) => ({ 
                                 ...prev, 
                                 successfulReferrals: 0,
                                 balance: (prev.balance || 0) - amount
                               }));

                               alert('উইথড্র রিকুয়েস্ট সফলভাবে পাঠানো হয়েছে! ২৪ ঘণ্টার মধ্যে পেমেন্ট পাবেন ইনশাআল্লাহ।');
                               setShowWithdrawModal(false);
                             } catch (err: any) {
                               alert('Error: ' + err.message);
                             } finally {
                               setIsSubmitting(false);
                             }
                           }}
                           disabled={isSubmitting}
                           className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
                         >
                           {isSubmitting ? <RefreshCw className="animate-spin mx-auto" size={16} /> : 'Submit Withdrawal'}
                         </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
 
        {/* Welcome Popup Modal */}
        <AnimatePresence>
          {showWelcomePopup && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60]"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-md bg-white rounded-3xl shadow-2xl p-6 z-[70] overflow-hidden"
              >
                <button 
                  onClick={handleCloseWelcome}
                  className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors z-10"
                >
                  <X size={18} className="text-slate-400" />
                </button>
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                
                <div className="text-center space-y-2 mb-6">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Welcome to Gmail Buy & Sell BD</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">সম্পূর্ণ ভেরিফাইড মার্কেটপ্লেস এ আপনাকে স্বাগতম। অনুগ্রহ করে প্রোফাইলটি সম্পূর্ণ করুন।</p>
                </div>

                <div className="space-y-4">
                  {/* Photo Upload */}
                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div 
                      onClick={() => welcomeFileInputRef.current?.click()}
                      className="w-16 h-16 rounded-2xl bg-white border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-indigo-400 transition-all shadow-sm"
                    >
                      {welcomeForm.photoURL || userProfile?.photoURL ? (
                        <img src={welcomeForm.photoURL || userProfile?.photoURL} className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="text-slate-300 group-hover:text-indigo-400" size={24} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black text-slate-800 mb-0.5">প্রোফাইল ছবি দিন</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">গুগল থেকে নিতে পারেন অথবা আপলোড করুন</p>
                      <input 
                        type="file"
                        ref={welcomeFileInputRef}
                        onChange={handleWelcomePhotoUpload}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                    <div className="text-right shrink-0">
                       <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">User ID</p>
                       <span className="text-[10px] font-mono font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">#{userProfile?.numericId || '...'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                      <input 
                        type="text"
                        value={welcomeForm.firstName}
                        onChange={(e) => setWelcomeForm(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="Enter first name"
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name <span className="text-[8px] opacity-60">Optional</span></label>
                      <input 
                        type="text"
                        value={welcomeForm.lastName}
                        onChange={(e) => setWelcomeForm(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Enter last name"
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Age (বয়স) <span className="text-[8px] opacity-60">Optional</span></label>
                    <input 
                      type="number"
                      value={welcomeForm.age}
                      onChange={(e) => setWelcomeForm(prev => ({ ...prev, age: e.target.value }))}
                      placeholder="Enter age"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Address (ঠিকানা) <span className="text-[8px] opacity-60">Optional</span></label>
                    <textarea 
                      value={welcomeForm.address}
                      onChange={(e) => setWelcomeForm(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Enter address"
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-xs font-bold resize-none"
                    />
                  </div>

                  <button 
                    onClick={handleWelcomeSubmit}
                    disabled={isSubmitting}
                    className="w-full py-4 mt-2 bg-slate-900 text-white rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-lg shadow-slate-200 hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-2 group"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="animate-spin" size={16} />
                    ) : (
                      <>
                        Submit Profile
                        <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Global Floating Chat Button */}
        <a 
          href="https://wa.me/8801410731308"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-24 right-6 w-14 h-14 bg-[#4CAF50] text-white rounded-full shadow-[0_16px_48px_-12px_rgba(76,175,80,0.5)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 group"
        >
          <MessageCircle size={28} strokeWidth={2.5} />
        </a>

        {/* Mobile Footer Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-40 px-2 lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe">
          <div className="flex items-center justify-around h-16 max-w-md mx-auto">
            {[
              { icon: Home, label: 'Home', action: () => setView('marketplace'), active: view === 'marketplace' },
              { icon: ShoppingBag, label: 'Buy', action: () => setView('gmail-market'), active: view === 'gmail-market' },
              { icon: Mail, label: 'Sell', action: () => setView('seller-center'), active: view === 'seller-center' },
              { icon: History, label: 'Txn', action: () => setView('transactions'), active: view === 'transactions' },
              { icon: UserIcon, label: 'Profile', action: () => setView('profile'), active: view === 'profile' },
            ].map((item, i) => (
              <button
                key={i}
                onClick={item.action}
                className={`flex flex-col items-center gap-1 min-w-[56px] transition-all relative ${item.active ? 'text-indigo-600' : 'text-slate-400'}`}
              >
                {item.active && (
                  <motion.div 
                    layoutId="activeNav"
                    className="absolute -top-3 w-1 h-1 bg-indigo-600 rounded-full"
                  />
                )}
                <item.icon size={item.active ? 22 : 20} strokeWidth={item.active ? 2.5 : 2} className="transition-all" />
                <span className={`text-[8px] font-black uppercase tracking-widest ${item.active ? 'opacity-100' : 'opacity-60'}`}>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Quota Exhausted Overlay */}
        <AnimatePresence>
          {quotaExceeded && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            >
              <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl space-y-6">
                <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto ring-8 ring-amber-50/50">
                  <AlertCircle size={48} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">কোটা লিমিট শেষ!</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    দুঃখিত, আজ জিমেইল মার্কেটপ্লেসের ফ্রি লিমিট শেষ হয়ে গেছে। দয়া করে আগামীকাল পুনরায় চেষ্টা করুন। এই সমস্যাটি সার্ভারের সীমাবদ্ধতার কারণে হয়েছে।
                  </p>
                </div>
                <button 
                  onClick={() => setQuotaExceeded(false)}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                >
                  ঠিক আছে
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="bg-white border-t border-slate-100 mt-20 py-16 pb-32">
          <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="space-y-6">
              <div 
                onClick={() => {
                  setView('marketplace');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <span className="font-display font-black text-2xl tracking-tighter text-[#0D1B3E]">Gmail Buy & Sell<span className="text-[#0D1B3E]/80"> BD</span></span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                Empowering the digital marketplace in Bangladesh with secure account handling and verified transactions.
              </p>
            </div>
            {[
              { 
                title: 'Marketplace', 
                links: [
                  { label: 'Gmail Market', action: () => setView('gmail-market') },
                  { label: 'Sell Gmail', action: () => setView('seller-center') },
                  { label: 'Refer & Earn', action: () => setShowReferModal(true) }
                ] 
              },
              { 
                title: 'Support', 
                links: [
                  { label: '+8801410731308', href: 'https://wa.me/8801410731308' },
                  { label: 'Live Support', href: 'https://wa.me/8801410731308' },
                  { label: 'Contact Us', href: 'tel:01857902383' }
                ] 
              },
              { 
                title: 'Company', 
                links: [
                  { label: 'About Us', href: '#' },
                  { label: 'Privacy Policy', href: '#' },
                  { label: 'Terms & Conditions', href: '#' }
                ] 
              }
            ].map((section) => (
              <div key={section.title} className="space-y-6">
                <h5 className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">{section.title}</h5>
                <ul className="space-y-3">
                  {section.links.map((link, idx) => (
                    <li key={idx}>
                      {link.action ? (
                        <button 
                          onClick={() => { link.action(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                          className="text-sm text-slate-600 hover:text-[#2E7D32] transition-colors font-medium text-left block w-full"
                        >
                          {link.label}
                        </button>
                      ) : (
                        <a 
                          href={link.href} 
                          target={link.href?.startsWith('http') ? '_blank' : undefined}
                          rel={link.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                          className="text-sm text-slate-600 hover:text-[#2E7D32] transition-colors font-medium block"
                        >
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="max-w-7xl mx-auto px-4 md:px-8 mt-16 pt-8 border-t border-slate-50 flex justify-center">
            <div className="flex items-center gap-6 text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em]">
              <span className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                Service Online
              </span>
              <span>&bull;</span>
              <span>Secure 256-bit AES</span>
              <span>&bull;</span>
              <span>v2.4.0</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans selection:bg-[#2E7D32]/20">
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] p-8 md:p-12 border border-slate-100 relative overflow-hidden"
        >
          {/* Decorative gradients */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#2E7D32]/5 rounded-full blur-3xl -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#2E7D32]/5 rounded-full blur-3xl -ml-16 -mb-16" />

          {view === 'login' && (
            <div className="space-y-10 relative z-10">
              <div className="text-center space-y-3">
                <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-slate-200 border-4 border-slate-50 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-50 to-white opacity-50" />
                  <Mail size={42} strokeWidth={2.5} className="text-indigo-600 relative z-10 group-hover:scale-110 transition-transform" />
                </div>
                <h1 className="font-display text-4xl font-black tracking-tight text-[#0D1B3E] leading-tight">
                  Gmail Buy & Sell<span className="text-[#0D1B3E]/80"> BD</span>
                </h1>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest opacity-60">Verified Gmail Marketplace</p>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-red-50 border border-red-100 rounded-2xl p-4 flex flex-col gap-2 relative"
                >
                  <button 
                    onClick={() => setError(null)}
                    className="absolute top-3 right-3 text-red-300 hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                  <div className="flex items-start gap-3 pr-6">
                    <AlertCircle className="text-red-500 shrink-0" size={18} />
                    <p className="text-xs text-red-600 leading-relaxed overflow-hidden text-ellipsis">{getDisplayError(error)}</p>
                  </div>
                  {(error.includes('নেটওয়্ক') || error.includes('network')) && (
                    <div className="pl-7 space-y-2">
                       <div className="text-[10px] text-red-500/70 italic">
                          টিপস: যদি বারবার নেটওয়ার্ক সমস্যা হয়, তবে নতুন ট্যাবে অ্যাপটি ওপেন করুন অথবা ব্রাউজার রিফ্রেশ করুন।
                       </div>
                       <button 
                         onClick={() => window.location.reload()}
                         className="flex items-center gap-1.5 text-[10px] font-black text-red-600 bg-red-100/50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                       >
                         <RefreshCw size={10} className="animate-pulse" />
                         রিফ্রেশ করুন (Refresh)
                       </button>
                    </div>
                  )}
                </motion.div>
              )}

              <form onSubmit={handleLogin} className="space-y-6">
                {!otpStep ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Email Address</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#2E7D32] transition-colors" size={18} />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@company.com"
                          required
                          className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-[#2E7D32] transition-all text-slate-800 placeholder:text-slate-300"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center ml-1">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Password</label>
                        <button 
                          type="button"
                          onClick={() => setView('forgot')}
                          className="text-[10px] font-bold text-[#2E7D32] hover:underline transition-colors tracking-wider"
                        >
                          FORGOT?
                        </button>
                      </div>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#2E7D32] transition-colors" size={18} />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="w-full pl-12 pr-12 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-[#2E7D32] transition-all text-slate-800 placeholder:text-slate-300"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#2E7D32] transition-colors p-1"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-green-50 p-5 rounded-3xl border border-green-100 text-center space-y-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2E7D32]">New Account Security</p>
                      <div className="flex flex-col items-center gap-1">
                        <p className="text-xs text-slate-600 font-medium">Please enter this code to create account:</p>
                        <div className="bg-white px-6 py-2 rounded-xl text-3xl font-black text-[#2E7D32] tracking-widest border border-green-100">
                          {sentOtp}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Enter code here</label>
                       <div className="relative group">
                          <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#2E7D32] transition-colors" size={18} />
                          <input 
                             type="text"
                             value={userOtp}
                             onChange={(e) => setUserOtp(e.target.value)}
                             placeholder="0000"
                             maxLength={4}
                             className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-[#2E7D32] transition-all text-slate-800 font-bold tracking-[1em] text-center"
                          />
                       </div>
                    </div>

                    <button 
                      type="button"
                      onClick={() => setOtpStep(false)}
                      className="text-[10px] font-bold text-[#2E7D32] hover:underline mx-auto block"
                    >
                      Change Details
                    </button>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={loading || isSubmitting}
                  className="w-full bg-[#2E7D32] hover:bg-[#256628] text-white font-bold py-4 rounded-2xl shadow-xl shadow-green-900/10 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading || isSubmitting ? (
                    <RefreshCw className="animate-spin" size={20} />
                  ) : (
                    <>
                      {otpStep ? 'Verify & Create Account' : 'Login Securely'}
                      <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
                  <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest"><span className="bg-white px-4 text-slate-300">Or continue with</span></div>
                </div>

                <button 
                  onClick={handleGoogleLogin}
                  className="w-full py-4 rounded-2xl bg-white border border-slate-100 text-slate-600 font-bold text-sm flex items-center justify-center gap-3 hover:bg-slate-50 hover:border-slate-200 transition-all active:scale-[0.98]"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </button>

                <div className="text-center pt-2">
                  <p className="text-sm text-slate-500 font-medium">
                    New user? Just enter your email and password above to start.
                  </p>
                </div>
              </div>

              {/* System Footer */}
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] pt-4">
                <span className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  Service Online
                </span>
                <span className="hidden sm:inline opacity-30">&bull;</span>
                <span>Secure 256-bit AES</span>
                <span className="hidden sm:inline opacity-30">&bull;</span>
                <span>v2.4.0</span>
              </div>
            </div>
          )}

          {view === 'register' && (
            <div className="space-y-10 relative z-10">
              <div className="text-center space-y-3">
                <div className="w-20 h-20 bg-gradient-to-tr from-[#2E7D32] to-[#4CAF50] rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-900/10 -rotate-3">
                  <UserPlus className="text-white" size={36} />
                </div>
                <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-800 leading-tight">Create Account</h1>
                <p className="text-slate-500 text-sm font-medium">Join the marketplace in seconds.</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
                  <AlertCircle className="text-red-500 shrink-0" size={18} />
                  <p className="text-xs text-red-600 leading-relaxed overflow-hidden text-ellipsis">{getDisplayError(error)}</p>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-6">
                {!otpStep ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Email Address</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#2E7D32] transition-colors" size={18} />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@company.com"
                          required
                          className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-[#2E7D32] transition-all text-slate-800 placeholder:text-slate-300"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#2E7D32] transition-colors" size={18} />
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="w-full pl-12 pr-12 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-[#2E7D32] transition-all text-slate-800 placeholder:text-slate-300"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-green-50 p-6 rounded-3xl border border-green-100 text-center space-y-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2E7D32]">Security Verification</p>
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-sm text-slate-600 font-medium italic">Please enter the code shown below:</p>
                        <div className="bg-white px-8 py-4 rounded-2xl text-4xl font-black text-[#2E7D32] tracking-[0.2em] shadow-sm animate-pulse border border-green-100">
                          {sentOtp}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Enter Verification Code</label>
                      <div className="relative group">
                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#2E7D32] transition-colors" size={18} />
                        <input
                          type="text"
                          value={userOtp}
                          onChange={(e) => setUserOtp(e.target.value)}
                          placeholder="Enter code here"
                          maxLength={sentOtp.length}
                          className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-[#2E7D32] transition-all text-slate-800 font-bold tracking-[1em] text-center"
                        />
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={() => setOtpStep(false)}
                      className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors mx-auto block"
                    >
                      Change Registration Details
                    </button>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={loading || isSubmitting}
                  className="w-full bg-[#2E7D32] hover:bg-[#256628] text-white font-bold py-4 rounded-2xl shadow-xl shadow-green-900/10 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading || isSubmitting ? (
                     <RefreshCw className="animate-spin" size={20} />
                  ) : (
                     <>
                        {otpStep ? 'Complete Registration' : 'Register Securely'}
                        <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" />
                     </>
                  )}
                </button>
              </form>

              <div className="text-center pt-2">
                <button 
                  onClick={() => setView('login')}
                  className="text-sm font-bold text-[#2E7D32] hover:underline"
                >
                  Already have an account? Login
                </button>
              </div>
            </div>
          )}

          {view === 'forgot' && (
            <div className="space-y-10 relative z-10">
              <div className="text-center space-y-3">
                <div className="w-20 h-20 bg-gradient-to-tr from-[#2E7D32] to-[#4CAF50] rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-900/10">
                  <Lock className="text-white" size={36} />
                </div>
                <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-800 leading-tight">Reset Password</h1>
                <p className="text-slate-500 text-sm font-medium">We'll help you get back into your account.</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
                  <AlertCircle className="text-red-500 shrink-0" size={18} />
                  <p className="text-xs text-red-600 leading-relaxed overflow-hidden text-ellipsis">{getDisplayError(error)}</p>
                </div>
              )}

              <form onSubmit={handleForgot} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#2E7D32] transition-colors" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      required
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-[#2E7D32] transition-all text-slate-800 placeholder:text-slate-300"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-[#2E7D32] hover:bg-[#256628] text-white font-bold py-4 rounded-2xl shadow-xl shadow-green-900/10 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  Send Reset Link
                </button>
              </form>

              <div className="text-center">
                <button 
                  onClick={() => setView('login')}
                  className="text-sm font-bold text-[#2E7D32] hover:underline"
                >
                  Return to login
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
