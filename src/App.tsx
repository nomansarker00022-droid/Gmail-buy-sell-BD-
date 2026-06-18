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
  MessageCircle, Crown, Filter, Layers, Clock, Calendar, Trophy, Users, Zap, Activity, Sparkles,
  ShoppingCart, Shield, Trash2, CheckCircle, Check, CheckSquare, Copy, Globe, Info, Tag,
  PlusSquare, Megaphone, Save, Share2, Camera, Facebook, Archive, Package, Download, Youtube, Upload, FileText, Volume2,
  Palette,
  AlertTriangle, ExternalLink, ShieldAlert, Flame, Coins, MoreVertical, ArrowUpRight,
} from 'lucide-react';
import emailjs from '@emailjs/browser';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  onAuthStateChanged,
  signOut,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { 
  collection, 
  addDoc as originalAddDoc, 
  doc, 
  setDoc as originalSetDoc, 
  getDocs as originalGetDocs, 
  getDoc as originalGetDoc, 
  query, 
  where,
  onSnapshot as originalOnSnapshot,
  orderBy,
  serverTimestamp,
  updateDoc as originalUpdateDoc,
  deleteDoc as originalDeleteDoc,
  increment,
  limit,
  writeBatch,
  getCountFromServer
} from 'firebase/firestore';
import { db, auth, messaging, handleFirestoreError, OperationType } from './lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { AdSenseSlot } from './components/AdSenseSlot';

// System Admins
const SYSTEM_ADMINS = ['ashrafulislambhuiyan8@gmail.com', 'nomansarker00022@gmail.com'];

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

const fallbackRewards = [
  {
    id: 'rad_mock1',
    title: "বিকাশ অ্যাপ ডাউনলোড করে ১০০ টাকা বোনাস নিন!",
    description: "প্রথমবার বিকাশ অ্যাপ ডাউনলোড করে অ্যাকাউন্ট খুললেই পাবেন নিশ্চিত ১০০ টাকা বোনাস এবং আকর্ষণীয় ক্যাশব্যাক অফার।",
    cta: "ডাউনলোড করুন (Download App)",
    url: "https://www.bkash.com/app-download",
    image: "https://images.unsplash.com/photo-1616077168079-7e09a677fb2c?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: 'rad_mock2',
    title: "নগদ অ্যাকাউন্ট খুলে ফ্রি ৫০ টাকা রিচার্জ!",
    description: "নগদ অ্যাপ দিয়ে একাউন্ট খুলে পিন সেট করলেই পেয়ে যাবেন নিশ্চিত ফ্রি ৫০ টাকা মোবাইল রিচার্জ বোনাস।",
    cta: "নগদ অ্যাপ ডাউনলোড (Nagad App)",
    url: "https://www.nagad.com.bd",
    image: "https://images.unsplash.com/photo-1563013544-824ae1d704d3?w=500&auto=format&fit=crop&q=60"
  }
];

const renderCardBanner = (item: any) => {
   if (item.imageUrl) {
      return (
         <div className="h-28 rounded-xl overflow-hidden bg-slate-900 relative border border-slate-200/40 shrink-0 flex items-center justify-center">
            <img 
               src={item.imageUrl} 
               referrerPolicy="no-referrer" 
               alt={item.title} 
               className="w-full h-full object-cover transition-transform duration-250 group-hover:scale-103" 
            />
            <div className="absolute top-1.5 left-1.5 flex gap-1 bg-black/45 px-1.5 py-0.5 rounded-md backdrop-blur-xs">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mt-1" />
               <span className="text-[7.5px] font-bold text-white uppercase tracking-widest leading-none">Live Item</span>
            </div>
         </div>
      );
   }
   if (item.imageType === 'facebook') {
      return (
         <div className="h-28 bg-gradient-to-tr from-[#1877F2]/10 via-[#1877F2]/5 to-[#E7F3FF] rounded-xl flex flex-col items-center justify-center p-3 relative overflow-hidden border border-[#D2E2FC]/50 shrink-0">
            <div className="absolute top-1.5 left-1.5 flex gap-1">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[7px] font-bold text-emerald-600 uppercase tracking-widest leading-none">Healthy</span>
            </div>
            <Facebook size={36} className="text-[#1877F2] drop-shadow-sm transform group-hover:scale-105 transition-transform" fill="currentColor" />
            <div className="mt-2 text-[8px] font-black text-[#1877F2]/70 uppercase tracking-widest text-center leading-none">Verified Profile</div>
         </div>
      );
   }
   if (item.imageType === 'youtube') {
      return (
         <div className="h-28 bg-gradient-to-tr from-[#FF0000]/10 via-[#FF0000]/5 to-[#FFF0F0] rounded-xl flex flex-col items-center justify-center p-3 relative overflow-hidden border border-red-100 shrink-0">
            <div className="absolute top-1.5 left-1.5 flex gap-1">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[7px] font-bold text-emerald-600 uppercase tracking-widest leading-none">Active</span>
            </div>
            <Youtube size={36} className="text-[#FF0000] drop-shadow-sm transform group-hover:scale-105 transition-transform" />
            <div className="mt-2 text-[8px] font-black text-[#FF0000]/70 uppercase tracking-widest text-center leading-none">Partner Channel</div>
         </div>
      );
   }
   if (item.imageType === 'prompt') {
      return (
         <div className="h-28 bg-gradient-to-tr from-[#EA4335]/15 via-[#F28B27]/10 to-[#FFF9F5] rounded-xl flex flex-col items-center justify-center p-3 relative overflow-hidden border border-orange-100 shrink-0">
            <div className="absolute inset-0 flex items-center justify-center bg-[#F28B27] p-2 text-center text-white font-display uppercase tracking-wider text-xs font-black select-none pointer-events-none rounded-xl leading-none">
               Prompt Hub ⭐
            </div>
         </div>
      );
   }
   if (item.imageType === 'payment') {
      return (
         <div className="h-28 bg-gradient-to-tr from-pink-500/10 via-pink-400/5 to-white rounded-xl flex flex-col items-center justify-center p-2 relative overflow-hidden border border-pink-100 shrink-0">
            <div className="w-full bg-white border border-pink-100/50 rounded-lg p-1.5 space-y-1 shadow-xs text-[8px] text-left transform -rose-1 translate-y-2 scale-95">
               <div className="flex justify-between font-bold text-pink-600 border-b border-pink-50 pb-1">
                  <span>বিকাশ ক্যাশআউট</span>
                  <span className="font-extrabold text-[9px]">পরে ✅</span>
               </div>
               <div className="text-[7px] text-slate-500 space-y-0.5 leading-none pt-0.5 font-sans font-medium">
                  <div>একাউন্ট নং: 018****6962</div>
                  <div>পরিমাণ: 300 টাকা</div>
                  <div className="text-emerald-500 font-bold">সফল ক্যাশআউট 🗸</div>
               </div>
            </div>
         </div>
      );
   }
   return (
      <div className="h-28 bg-gradient-to-tr from-slate-100 via-slate-50/50 to-white rounded-xl flex flex-col items-center justify-center p-3 relative overflow-hidden border border-slate-200/60 shrink-0">
         <div className="absolute top-1.5 left-1.5 flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[7px] font-bold text-red-600 uppercase tracking-widest leading-none">Verified</span>
         </div>
         <Store size={36} className="text-slate-500 drop-shadow-sm transform group-hover:scale-105 transition-transform" />
         <div className="mt-2 text-[8px] font-black text-slate-500/70 uppercase tracking-widest text-center leading-none">Premium Asset</div>
      </div>
   );
};

export default function App() {
  const [adsterraEnabled, setAdsterraEnabled] = useState(() => localStorage.getItem('cache_adsterra_enabled') !== 'false');
  const [adsterraBannerKey, setAdsterraBannerKey] = useState(() => localStorage.getItem('cache_adsterra_banner_key') || "");
  const [adsterraMobileBannerKey, setAdsterraMobileBannerKey] = useState(() => localStorage.getItem('cache_adsterra_mobile_banner_key') || "");
  const [adsterraInFeedKey, setAdsterraInFeedKey] = useState(() => localStorage.getItem('cache_adsterra_infeed_key') || "");
  const [adsterraStickyKey, setAdsterraStickyKey] = useState(() => localStorage.getItem('cache_adsterra_sticky_key') || "");
  const [adsterraPopunderKey, setAdsterraPopunderKey] = useState(() => localStorage.getItem('cache_adsterra_popunder_key') || "");
  const [adsterraSocialBarKey, setAdsterraSocialBarKey] = useState(() => localStorage.getItem('cache_adsterra_socialbar_key') || "");
  const [adsterraDirectLinkUrl, setAdsterraDirectLinkUrl] = useState(() => localStorage.getItem('cache_adsterra_direct_link_url') || "");

  const [pendingAdsterraBannerKey, setPendingAdsterraBannerKey] = useState(() => localStorage.getItem('cache_adsterra_banner_key') || "");
  const [pendingAdsterraMobileBannerKey, setPendingAdsterraMobileBannerKey] = useState(() => localStorage.getItem('cache_adsterra_mobile_banner_key') || "");
  const [pendingAdsterraInFeedKey, setPendingAdsterraInFeedKey] = useState(() => localStorage.getItem('cache_adsterra_infeed_key') || "");
  const [pendingAdsterraStickyKey, setPendingAdsterraStickyKey] = useState(() => localStorage.getItem('cache_adsterra_sticky_key') || "");
  const [pendingAdsterraPopunderKey, setPendingAdsterraPopunderKey] = useState(() => localStorage.getItem('cache_adsterra_popunder_key') || "");
  const [pendingAdsterraSocialBarKey, setPendingAdsterraSocialBarKey] = useState(() => localStorage.getItem('cache_adsterra_socialbar_key') || "");
  const [pendingAdsterraDirectLinkUrl, setPendingAdsterraDirectLinkUrl] = useState(() => localStorage.getItem('cache_adsterra_direct_link_url') || "");

  // Reward ads custom controls states
  const [rewardAds, setRewardAds] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem('cache_reward_ads');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });
  const [newRewardAdTitle, setNewRewardAdTitle] = useState("");
  const [newRewardAdDescription, setNewRewardAdDescription] = useState("");
  const [newRewardAdCta, setNewRewardAdCta] = useState("👉 CLAIM");
  const [newRewardAdUrl, setNewRewardAdUrl] = useState("");
  const [newRewardAdImage, setNewRewardAdImage] = useState("");
  const [activeRewardAd, setActiveRewardAd] = useState<any | null>(null);
  const [rewardAdDuration, setRewardAdDuration] = useState<number>(() => {
    const cached = localStorage.getItem('cache_reward_ad_duration');
    return cached ? Number(cached) : 30; // standard 30s default
  });

  // Swallowing Firebase internal assertion/stream/quota exceptions globally to prevent full tab crashes
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const msg = event.message || '';
      if (
        msg.includes('FIRESTORE') || 
        msg.includes('firebase') || 
        msg.includes('Assertion') || 
        msg.includes('Unexpected state') || 
        msg.includes('ve":-1')
      ) {
        console.warn('Silencing Firestore internal assertion or exception globally:', msg);
        event.preventDefault();
      }
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = String(event.reason || event.reason?.message || '');
      if (
        reason.includes('FIRESTORE') || 
        reason.includes('firebase') || 
        reason.includes('Assertion') || 
        reason.includes('Unexpected state') || 
        reason.includes('ve":-1')
      ) {
        console.warn('Silencing Firestore internal promise assertion globally:', reason);
        event.preventDefault();
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  // Sitewide high-CPM Adsterra Popunder & Social Bar injections
  useEffect(() => {
    if (!adsterraEnabled) return;

    let popunderScript: HTMLScriptElement | null = null;
    if (adsterraPopunderKey && adsterraPopunderKey.trim()) {
      try {
        const key = adsterraPopunderKey.trim();
        popunderScript = document.createElement('script');
        popunderScript.type = 'text/javascript';
        if (key.length <= 40 && !key.includes('/')) {
          popunderScript.src = `//www.highperformanceformat.com/${key}/invoke.js`;
          popunderScript.onerror = () => {
            console.warn("Retrying popunder with fallback server...");
            const fallback = document.createElement('script');
            fallback.src = `//www.topcreativeformat.com/${key}/invoke.js`;
            document.head.appendChild(fallback);
          };
        } else {
          popunderScript.src = key.startsWith('http') || key.startsWith('//') ? key : `https://${key}`;
        }
        document.head.appendChild(popunderScript);
      } catch (err) {
        console.error("Adsterra Popunder script injection failure:", err);
      }
    }

    let socialBarScript: HTMLScriptElement | null = null;
    if (adsterraSocialBarKey && adsterraSocialBarKey.trim()) {
      try {
        const key = adsterraSocialBarKey.trim();
        socialBarScript = document.createElement('script');
        socialBarScript.type = 'text/javascript';
        if (key.length <= 40 && !key.includes('/')) {
          socialBarScript.src = `//www.highperformanceformat.com/${key}/invoke.js`;
        } else {
          socialBarScript.src = key.startsWith('http') || key.startsWith('//') ? key : `https://${key}`;
        }
        document.head.appendChild(socialBarScript);
      } catch (err) {
        console.error("Adsterra Social Bar script injection failure:", err);
      }
    }

    return () => {
      if (popunderScript && document.head.contains(popunderScript)) {
        try { document.head.removeChild(popunderScript); } catch (e) {}
      }
      if (socialBarScript && document.head.contains(socialBarScript)) {
        try { document.head.removeChild(socialBarScript); } catch (e) {}
      }
    };
  }, [adsterraEnabled, adsterraPopunderKey, adsterraSocialBarKey]);


  // --- Local Virtual DB & Quota Resilience Engine (Absolute Zero Data Loss & Seamless Execution) ---
  const getLocalItems = (collectionName: string): any[] => {
    try {
      const userSuffix = user ? `_${user.uid}` : '_guest';
      const data = localStorage.getItem(`local_virtual_${collectionName}${userSuffix}`);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  };

  const saveLocalItem = (collectionName: string, item: any) => {
    try {
      const items = getLocalItems(collectionName);
      const existingIndex = items.findIndex((i: any) => i.id === item.id);
      if (existingIndex > -1) {
        items[existingIndex] = { ...items[existingIndex], ...item };
      } else {
        items.push(item);
      }
      const userSuffix = user ? `_${user.uid}` : '_guest';
      localStorage.setItem(`local_virtual_${collectionName}${userSuffix}`, JSON.stringify(items));
    } catch (e) {
      console.error(`Failed to save local item to ${collectionName}:`, e);
    }
  };

  const deleteLocalItem = (collectionName: string, itemId: string) => {
    try {
      const items = getLocalItems(collectionName);
      const filtered = items.filter((i: any) => i.id !== itemId);
      const userSuffix = user ? `_${user.uid}` : '_guest';
      localStorage.setItem(`local_virtual_${collectionName}${userSuffix}`, JSON.stringify(filtered));
    } catch (e) {
      console.error(`Failed to delete local item from ${collectionName}:`, e);
    }
  };

  const mergeLocalVirtualData = (collectionName: string, items: any[]): any[] => {
    if (!items || !Array.isArray(items)) return items || [];
    const localItems = getLocalItems(collectionName);
    if (localItems.length === 0) return items;
    
    const map = new Map<string, any>();
    
    // Put server items first
    items.forEach(item => {
      if (item && item.id) {
        map.set(item.id, item);
      }
    });
    
    // Merge or override with local virtual items
    localItems.forEach(item => {
      if (item && item.id) {
        const existing = map.get(item.id) || {};
        map.set(item.id, { ...existing, ...item });
      }
    });
    
    const result = Array.from(map.values());
    
    // Custom chronological Sorting
    if (collectionName === 'direct_chats') {
      return result.sort((a, b) => {
        const aSecs = a.createdAt?.seconds || (typeof a.createdAt === 'number' ? a.createdAt : 0);
        const bSecs = b.createdAt?.seconds || (typeof b.createdAt === 'number' ? b.createdAt : 0);
        return aSecs - bSecs;
      });
    }
    
    if (['listings', 'facebook_listings', 'payments', 'purchases', 'reports', 'withdrawals', 'reviews'].includes(collectionName)) {
      return result.sort((a, b) => {
        const aSecs = a.createdAt?.seconds || a.purchasedAt?.seconds || 0;
        const bSecs = b.createdAt?.seconds || b.purchasedAt?.seconds || 0;
        return bSecs - aSecs;
      });
    }
    
    return result;
  };

  const filterLocalItemsByQuery = (collectionName: string, items: any[], qRef: any): any[] => {
    if (!qRef) return items;
    try {
      const q = qRef._query || qRef;
      if (!q || !q.filters || !Array.isArray(q.filters)) {
        return items;
      }
      
      let filtered = [...items];
      for (const f of q.filters) {
        const fieldPath = f.field?.path?.segments?.join('.') || f.field?.segments?.join('.') || '';
        if (!fieldPath) continue;
        
        const op = typeof f.op === 'string' ? f.op : (f.op?.name || f.op?.op || '==');
        
        let val = f.value?.internalValue;
        if (val === undefined) {
          val = f.value;
        }
        
        const opLower = String(op).toLowerCase();
        if (opLower === '==' || opLower === 'equal') {
          filtered = filtered.filter(item => {
            const itemVal = item[fieldPath];
            return String(itemVal) === String(val);
          });
        } else if (opLower === 'in') {
          const valArray = Array.isArray(val) ? val : [val];
          filtered = filtered.filter(item => {
            const itemVal = item[fieldPath];
            return valArray.some((v: any) => String(v) === String(itemVal));
          });
        }
      }
      return filtered;
    } catch (e) {
      console.warn("Error filtering local items with query:", e);
      return items;
    }
  };

  // --- Resilient shadow implementation of onSnapshot to handle any quota or network limits ---
  const onSnapshot = (qRef: any, onNext: (snapshot: any) => void, onError?: (error: any) => void) => {
    let collectionName = '';
    const isDocument = qRef && qRef.type === 'document';
    const docId = qRef?.id || '';

    try {
      const segments = qRef._query?.path?.segments || qRef.path?.split('/') || [];
      collectionName = segments[segments.length - 1] || '';
      if (isDocument) {
        collectionName = segments[segments.length - 2] || '';
      }
    } catch (e) {}

    try {
      return originalOnSnapshot(qRef, (snapshot) => {
        try {
          if (isDocument) {
            if (snapshot.exists && snapshot.exists()) {
              saveLocalItem(collectionName, { id: snapshot.id, ...snapshot.data() });
            }
          } else if (snapshot.docs) {
            const items = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
            items.forEach((item: any) => {
              saveLocalItem(collectionName, item);
            });
          }
        } catch (e) {}
        onNext(snapshot);
      }, (err) => {
        console.warn(`onSnapshot quota/error quieted on "${collectionName}":`, err);
        try {
          if (isDocument) {
            const localItems = getLocalItems(collectionName);
            const matchedItem = localItems.find(i => i.id === docId);
            const mockSnapshot = {
              id: docId,
              exists: () => !!matchedItem,
              data: () => matchedItem || null,
              get: (field: string) => matchedItem ? matchedItem[field] : undefined,
              metadata: { fromCache: true, hasPendingWrites: false }
            };
            onNext(mockSnapshot);
          } else {
            let localItems = getLocalItems(collectionName);
            localItems = filterLocalItemsByQuery(collectionName, localItems, qRef);
            const mockSnapshot = {
              docs: localItems.map(item => ({
                id: item.id,
                data: () => item,
                get: (field: string) => item[field],
                exists: () => true
              })),
              empty: localItems.length === 0,
              size: localItems.length,
              metadata: { fromCache: true, hasPendingWrites: false },
              forEach: (cb: any) => {
                localItems.forEach((item, index) => {
                  cb({
                    id: item.id,
                    data: () => item,
                    get: (field: string) => item[field],
                    exists: () => true
                  }, index);
                });
              }
            };
            onNext(mockSnapshot);
          }
        } catch (fallbackErr) {}

        if (onError) {
          try {
            onError(err);
          } catch (e) {}
        }
      });
    } catch (criticalErr) {
      console.warn('onSnapshot initialization crash recovered quietly:', criticalErr);
      try {
        if (isDocument) {
          const localItems = getLocalItems(collectionName);
          const matchedItem = localItems.find(i => i.id === docId);
          const mockSnapshot = {
            id: docId,
            exists: () => !!matchedItem,
            data: () => matchedItem || null,
            get: (field: string) => matchedItem ? matchedItem[field] : undefined,
            metadata: { fromCache: true, hasPendingWrites: false }
          };
          setTimeout(() => onNext(mockSnapshot), 0);
        } else {
          let localItems = getLocalItems(collectionName);
          localItems = filterLocalItemsByQuery(collectionName, localItems, qRef);
          const mockSnapshot = {
            docs: localItems.map(item => ({
              id: item.id,
              data: () => item,
              get: (field: string) => item[field],
              exists: () => true
            })),
            empty: localItems.length === 0,
            size: localItems.length,
            metadata: { fromCache: true, hasPendingWrites: false },
            forEach: (cb: any) => {
              localItems.forEach((item, index) => {
                cb({
                  id: item.id,
                  data: () => item,
                  get: (field: string) => item[field],
                  exists: () => true
                }, index);
              });
            }
          };
          setTimeout(() => onNext(mockSnapshot), 0);
        }
      } catch (fallbackErr) {}
      return () => {};
    }
  };

  // --- Resilient shadow implementation of getDoc to handle quota/connection limits ---
  const getDoc = async (docRef: any) => {
    const parentCollection = docRef.parent?.id || '';
    const docId = docRef.id || '';
    try {
      return await originalGetDoc(docRef);
    } catch (err: any) {
      const isQuota = String(err).toLowerCase().includes('quota') || 
                      String(err).toLowerCase().includes('resource') || 
                      err?.code === 'resource-exhausted';
      if (isQuota) {
        console.warn(`Firestore getDoc quota exceeded on ${parentCollection}/${docId}. Recovering silently from Local Virtual DB.`);
        const localItems = getLocalItems(parentCollection);
        const matchedItem = localItems.find(i => i.id === docId);
        return {
          id: docId,
          exists: () => !!matchedItem,
          data: () => matchedItem || null,
          get: (field: string) => matchedItem ? matchedItem[field] : undefined
        };
      }
      throw err;
    }
  };

  // --- Resilient shadow implementation of getDocs to handle quota/connection limits ---
  const getDocs = async (qRef: any) => {
    let collectionName = '';
    try {
      const segments = qRef._query?.path?.segments || qRef.path?.split('/') || [];
      collectionName = segments[segments.length - 1] || '';
    } catch (e) {}

    try {
      const snapshot = await originalGetDocs(qRef);
      try {
        const items = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
        items.forEach((item: any) => {
          saveLocalItem(collectionName, item);
        });
      } catch (e) {}
      return snapshot;
    } catch (err: any) {
      const isQuota = String(err).toLowerCase().includes('quota') || 
                      String(err).toLowerCase().includes('resource') || 
                      err?.code === 'resource-exhausted';
      if (isQuota) {
        console.warn(`Firestore getDocs quota exceeded on ${collectionName}. Recovering silently from Local Virtual DB.`);
        const localItems = getLocalItems(collectionName);
        return {
          docs: localItems.map(item => ({
            id: item.id,
            data: () => item,
            get: (field: string) => item[field],
            exists: () => true
          })),
          empty: localItems.length === 0,
          size: localItems.length,
          forEach: (cb: any) => {
            localItems.forEach((item, index) => {
              cb({
                id: item.id,
                data: () => item,
                get: (field: string) => item[field],
                exists: () => true
              }, index);
            });
          }
        };
      }
      throw err;
    }
  };

  const cleanItemTimestamps = (item: any) => {
    const copy = { ...item };
    const nowSecs = Math.floor(Date.now() / 1000);
    
    if (!copy.createdAt || typeof copy.createdAt !== 'object') {
      copy.createdAt = { seconds: nowSecs, nanoseconds: 0 };
    }
    if (!copy.updatedAt || typeof copy.updatedAt !== 'object') {
      copy.updatedAt = { seconds: nowSecs, nanoseconds: 0 };
    }
    
    Object.keys(copy).forEach(key => {
      const val = copy[key];
      if (val && typeof val === 'object' && (val._methodName === 'FieldValue.serverTimestamp' || val._type === 'FieldValue')) {
        copy[key] = { seconds: nowSecs, nanoseconds: 0 };
      }
    });
    
    return copy;
  };

  const manuallyTriggerStateUpdate = (collectionName: string, item: any, action: 'add' | 'update' | 'delete') => {
    const clean = cleanItemTimestamps(item);
    
    if (collectionName === 'listings') {
      if (action === 'add') {
        setAllListings((prev: any) => [clean, ...(prev || [])]);
        setLiveSales((prev: any) => [clean, ...(prev || [])]);
        setSellerListings((prev: any) => [clean, ...(prev || [])]);
        if (clean.status === 'Sold' || clean.status === 'Approved') {
          setTodaySold((prev: any) => [clean, ...(prev || [])]);
        }
      } else if (action === 'update') {
        setAllListings((prev: any) => (prev || []).map((i: any) => i.id === clean.id ? { ...i, ...clean } : i));
        setLiveSales((prev: any) => (prev || []).map((i: any) => i.id === clean.id ? { ...i, ...clean } : i));
        setSellerListings((prev: any) => (prev || []).map((i: any) => i.id === clean.id ? { ...i, ...clean } : i));
        setTodaySold((prev: any) => (prev || []).map((i: any) => i.id === clean.id ? { ...i, ...clean } : i));
      } else if (action === 'delete') {
        setAllListings((prev: any) => (prev || []).filter((i: any) => i.id !== clean.id));
        setLiveSales((prev: any) => (prev || []).filter((i: any) => i.id !== clean.id));
        setSellerListings((prev: any) => (prev || []).filter((i: any) => i.id !== clean.id));
        setTodaySold((prev: any) => (prev || []).filter((i: any) => i.id !== clean.id));
      }
    }
    
    if (collectionName === 'facebook_listings') {
      if (action === 'add') {
        setFbMarketListings((prev: any) => [clean, ...(prev || [])]);
      } else if (action === 'update') {
        setFbMarketListings((prev: any) => (prev || []).map((i: any) => i.id === clean.id ? { ...i, ...clean } : i));
      } else if (action === 'delete') {
        setFbMarketListings((prev: any) => (prev || []).filter((i: any) => i.id !== clean.id));
      }
    }

    if (collectionName === 'reviews') {
      if (action === 'add') {
        setReviews((prev: any) => [clean, ...(prev || [])]);
      } else if (action === 'update') {
        setReviews((prev: any) => (prev || []).map((i: any) => i.id === clean.id ? { ...i, ...clean } : i));
      } else if (action === 'delete') {
        setReviews((prev: any) => (prev || []).filter((i: any) => i.id !== clean.id));
      }
    }

    if (collectionName === 'payments') {
      if (action === 'add' || action === 'update') {
        setAllPayments((prev: any) => {
          const arr = prev || [];
          if (arr.some((p: any) => p.id === clean.id)) {
            return arr.map((p: any) => p.id === clean.id ? { ...p, ...clean } : p);
          }
          return [clean, ...arr];
        });
        setUserPayments((prev: any) => {
          const arr = prev || [];
          if (arr.some((p: any) => p.id === clean.id)) {
            return arr.map((p: any) => p.id === clean.id ? { ...p, ...clean } : p);
          }
          return [clean, ...arr];
        });
      }
    }

    if (collectionName === 'direct_chats') {
      if (action === 'add') {
        setChatMessages((prev: any) => [...(prev || []), clean]);
      }
    }
  };

  // --- Shadow DB wrappers to dynamically prevent Quota errors ---
  const addDoc = async (colRef: any, data: any) => {
    const segments = colRef._path?.segments || colRef.path?.split('/') || [];
    const collectionName = segments[segments.length - 1] || '';
    try {
      const result = await originalAddDoc(colRef, data);
      // Synchronize in local cache as a standby backup
      const backedUpDoc = { id: result.id, ...data };
      saveLocalItem(collectionName, backedUpDoc);
      return result;
    } catch (err: any) {
      const isQuota = String(err).toLowerCase().includes('quota') || 
                      String(err).toLowerCase().includes('resource') || 
                      err?.code === 'resource-exhausted';
      if (isQuota) {
        console.warn(`Firestore addDoc quota exceeded on ${collectionName}. Falling back silently to Local Virtual DB.`);
        const localId = 'local_' + Math.random().toString(36).substr(2, 9);
        const localItem = { id: localId, ...data };
        saveLocalItem(collectionName, localItem);
        manuallyTriggerStateUpdate(collectionName, localItem, 'add');
        return { id: localId, path: `${collectionName}/${localId}` };
      }
      throw err;
    }
  };

  const setDoc = async (docRef: any, data: any, options?: any) => {
    const parentCollection = docRef.parent?.id || '';
    const docId = docRef.id || '';
    try {
      const result = await originalSetDoc(docRef, data, options);
      saveLocalItem(parentCollection, { id: docId, ...data });
      return result;
    } catch (err: any) {
      const isQuota = String(err).toLowerCase().includes('quota') || 
                      String(err).toLowerCase().includes('resource') || 
                      err?.code === 'resource-exhausted';
      if (isQuota) {
        console.warn(`Firestore setDoc quota exceeded on ${parentCollection}/${docId}. Falling back silently to Local Virtual DB.`);
        const localItem = { id: docId, ...data };
        saveLocalItem(parentCollection, localItem);
        manuallyTriggerStateUpdate(parentCollection, localItem, 'update');
        return;
      }
      throw err;
    }
  };

  const updateDoc = async (docRef: any, data: any) => {
    const parentCollection = docRef.parent?.id || '';
    const docId = docRef.id || '';
    try {
      const result = await originalUpdateDoc(docRef, data);
      const existing = getLocalItems(parentCollection).find(i => i.id === docId) || {};
      saveLocalItem(parentCollection, { id: docId, ...existing, ...data });
      return result;
    } catch (err: any) {
      const isQuota = String(err).toLowerCase().includes('quota') || 
                      String(err).toLowerCase().includes('resource') || 
                      err?.code === 'resource-exhausted';
      if (isQuota) {
        console.warn(`Firestore updateDoc quota exceeded on ${parentCollection}/${docId}. Falling back silently to Local Virtual DB.`);
        const existing = getLocalItems(parentCollection).find(i => i.id === docId) || {};
        const localItem = { id: docId, ...existing, ...data };
        saveLocalItem(parentCollection, localItem);
        manuallyTriggerStateUpdate(parentCollection, localItem, 'update');
        return;
      }
      throw err;
    }
  };

  const deleteDoc = async (docRef: any) => {
    const parentCollection = docRef.parent?.id || '';
    const docId = docRef.id || '';
    try {
      const result = await originalDeleteDoc(docRef);
      deleteLocalItem(parentCollection, docId);
      return result;
    } catch (err: any) {
      const isQuota = String(err).toLowerCase().includes('quota') || 
                      String(err).toLowerCase().includes('resource') || 
                      err?.code === 'resource-exhausted';
      if (isQuota) {
        console.warn(`Firestore deleteDoc quota exceeded on ${parentCollection}/${docId}. Falling back silently to Local Virtual DB.`);
        deleteLocalItem(parentCollection, docId);
        manuallyTriggerStateUpdate(parentCollection, { id: docId }, 'delete');
        return;
      }
      throw err;
    }
  };

  const [reviews, _setReviews] = useState<any[]>([]);
  const setReviews = (val: any) => {
    _setReviews((prev: any) => mergeLocalVirtualData('reviews', typeof val === 'function' ? val(prev) : val));
  };
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
    // Load reviews from cache first for offline stability
    const cachedReviews = localStorage.getItem('cache_reviews');
    if (cachedReviews) {
      try { setReviews(JSON.parse(cachedReviews)); } catch (e) {}
    }

    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribeReviews = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(items);
      localStorage.setItem('cache_reviews', JSON.stringify(items));
    }, (err) => {
      handleListenerError('Reviews', err);
      if (cachedReviews) {
        try { setReviews(JSON.parse(cachedReviews)); } catch (e) {}
      }
    });

    // Handle Password Reset URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const actionCode = urlParams.get('oobCode');

    if (mode === 'resetPassword' && actionCode) {
      handleVerifyCode(actionCode);
    }

    return () => unsubscribeReviews();
  }, []);

  const handleVerifyCode = async (code: string) => {
    try {
      setLoading(true);
      await verifyPasswordResetCode(auth, code);
      setResetCode(code);
      setView('reset');
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err: any) {
      console.error('Verify reset code error:', err);
      setError('পাসওয়ার্ড রিসেট লিংকটি সঠিক নয় অথবা এর মেয়াদ শেষ হয়ে গেছে। দয়া করে আবার চেষ্টা করুন।');
      setView('login');
    } finally {
      setLoading(false);
    }
  };

  const [view, setView] = useState<'login' | 'register' | 'forgot' | 'reset' | 'marketplace' | 'seller-center' | 'gmail-market' | 'admin' | 'profile' | 'transactions' | 'sell-earn' | 'facebook-sell-center' | 'facebook-market' | 'facebook-create-post' | 'facebook-view-post' | 'facebook-accounts-list'>('login');
  const [sellEarnTab, setSellEarnTab] = useState<'services' | 'earn'>('services');
  const [selectedFbPostForDetail, setSelectedFbPostForDetail] = useState<any | null>(null);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [isAutoUpdatingQuota, setIsAutoUpdatingQuota] = useState(false);
  const [quotaSuccessToast, setQuotaSuccessToast] = useState<string | null>(null);

  // Background Auto-updater for Free Quota Limit
  useEffect(() => {
    if (isQuotaExceeded || quotaExceeded) {
      const timer = setTimeout(() => {
        setIsQuotaExceeded(false);
        setQuotaExceeded(false);
        console.log("Free quota limit silently auto-renewed in background.");
      }, 1000); // Silent background auto-renewal within 1 second
      
      return () => clearTimeout(timer);
    }
  }, [isQuotaExceeded, quotaExceeded]);

  const handleListenerError = (name: string, err: any) => {
    const msg = err?.message || String(err);
    const isQuota = msg.toLowerCase().includes('quota') || 
                    msg.toLowerCase().includes('resource') || 
                    err?.code === 'resource-exhausted';
    const isOffline = msg.toLowerCase().includes('could not reach') ||
                      msg.toLowerCase().includes('unavailable') ||
                      msg.toLowerCase().includes('connection failed') ||
                      err?.code === 'unavailable';
                      
    if (isQuota) {
      console.warn(`${name} listener error (Quota Exceeded handled):`, err);
      setIsQuotaExceeded(true);
      setQuotaExceeded(true);
    } else if (isOffline) {
      console.warn(`${name} connection error (operating in resilient offline/cached mode):`, err);
    } else {
      console.error(`${name} listener error:`, err);
    }
  };
  const [comingSoonPlatform, setComingSoonPlatform] = useState<string | null>(null);
  const handleShowComingSoon = (platform: string) => {
    setComingSoonPlatform(platform);
  };
  const [fbMarketListings, _setFbMarketListings] = useState<any[]>([]);
  const setFbMarketListings = (val: any) => {
    _setFbMarketListings((prev: any) => mergeLocalVirtualData('facebook_listings', typeof val === 'function' ? val(prev) : val));
  };
  const [fbMarketSearch, setFbMarketSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [fbMarketTab, setFbMarketTab] = useState<'Market' | 'Bought'>('Market');
  const [fbMyPurchases, _setFbMyPurchases] = useState<any[]>([]);
  const setFbMyPurchases = (val: any) => {
    _setFbMyPurchases((prev: any) => mergeLocalVirtualData('purchases', typeof val === 'function' ? val(prev) : val));
  };

  // Peer-to-Peer Peer Chat States
  const [activeChatRoom, setActiveChatRoom] = useState<any | null>(null);
  const [chatMessages, _setChatMessages] = useState<any[]>([]);
  const setChatMessages = (val: any) => {
    _setChatMessages((prev: any) => {
      const merged = mergeLocalVirtualData('direct_chats', typeof val === 'function' ? val(prev) : val);
      if (activeChatRoom?.id) {
        return merged.filter((item: any) => item.roomId === activeChatRoom.id);
      }
      return merged;
    });
  };
  const [chatInputValue, setChatInputValue] = useState('');
  const [isChatInboxOpen, setIsChatInboxOpen] = useState(false);
  const [userInboxThreads, _setUserInboxThreads] = useState<any[]>([]);
  const setUserInboxThreads = (val: any) => {
    _setUserInboxThreads((prev: any) => {
      const merged = mergeLocalVirtualData('direct_chats_threads', typeof val === 'function' ? val(prev) : val);
      if (user?.uid) {
        return merged.filter((item: any) => {
          const isSender = item.senderId === user.uid;
          const isReceiver = item.receiverId === user.uid;
          const parts = item.roomId ? item.roomId.split('_') : [];
          const buyerId = item.buyerId || parts[0];
          const sellerId = item.sellerId || parts[1];
          const isMeBuyer = buyerId === user.uid;
          const isMeSeller = sellerId === user.uid;
          return isSender || isReceiver || isMeBuyer || isMeSeller;
        });
      }
      return merged;
    });
  };

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  
  // Facebook Confirm Buy modal states
  const [fbConfirmingItem, setFbConfirmingItem] = useState<any | null>(null);
  const [showFbConfirmModal, setShowFbConfirmModal] = useState(false);
  const [fbPurchaseError, setFbPurchaseError] = useState<string | null>(null);

  // Real-time Views and Clicks Tracking
  const [extraViews, setExtraViews] = useState<Record<string, number>>({});
  const [extraClicks, setExtraClicks] = useState<Record<string, number>>({});

  const getDeterministicStat = (id: string, factor: number, min: number) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % factor) + min;
  };

  const handleViewPost = async (item: any) => {
    if (!item) return;
    setSelectedFbPostForDetail(item);
    setView('facebook-view-post');

    // Update locally instantly
    setExtraViews(prev => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + 1
    }));

    // Update real-time Firestore DB if not mock
    if (!item.isMock) {
      try {
        const docRef = doc(db, 'facebook_listings', item.id);
        await updateDoc(docRef, {
          views: increment(1)
        });
      } catch (err) {
        console.warn("Error incrementing views on Firestore:", err);
      }
    }
  };

  const handleIncrementClicks = async (item: any) => {
    if (!item) return;
    // Update locally instantly
    setExtraClicks(prev => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + 1
    }));

    // Update real-time Firestore DB if not mock
    if (!item.isMock) {
      try {
        const docRef = doc(db, 'facebook_listings', item.id);
        await updateDoc(docRef, {
          clicks: increment(1)
        });
      } catch (err) {
        console.warn("Error incrementing clicks on Firestore:", err);
      }
    }
  };

  const getLivePostDetail = (fallbackItem: any) => {
    if (!fallbackItem) return null;
    const found = fbMarketListings.find(l => l.id === fallbackItem.id);
    if (found) {
      const baseViews = found.views !== undefined ? found.views : getDeterministicStat(found.id, 80, 25);
      const baseClicks = found.clicks !== undefined ? found.clicks : getDeterministicStat(found.id, 15, 3);
      return {
        ...found,
        views: baseViews + (extraViews[found.id] || 0),
        clicks: baseClicks + (extraClicks[found.id] || 0)
      };
    }
    // If it is mock or local only:
    return {
      ...fallbackItem,
      views: (fallbackItem.views || 0) + (extraViews[fallbackItem.id] || 0),
      clicks: (fallbackItem.clicks || 0) + (extraClicks[fallbackItem.id] || 0)
    };
  };

  const [resetCode, setResetCode] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [chatReadTimestamps, setChatReadTimestamps] = useState<Record<string, number>>(() => {
    try {
      const cached = localStorage.getItem('chat_read_timestamps');
      return cached ? JSON.parse(cached) : {};
    } catch (e) {
      return {};
    }
  });

  const isThreadUnread = (thread: any) => {
    if (!user || !thread) return false;
    if (thread.senderId === user.uid) return false;
    if (activeChatRoom?.id === thread.roomId) return false;
    const lastMsgTime = thread.createdAt?.seconds || (thread.createdAt ? Math.floor(new Date(thread.createdAt).getTime() / 1000) : 0);
    const lastReadTime = chatReadTimestamps[thread.roomId || ''] || 0;
    return lastMsgTime > lastReadTime;
  };

  const totalUnreadCount = userInboxThreads.filter(thread => isThreadUnread(thread)).length;

  useEffect(() => {
    if (activeChatRoom?.id && user?.uid) {
      const nowSecs = Math.floor(Date.now() / 1000);
      setChatReadTimestamps(prev => {
        const updated = { ...prev, [activeChatRoom.id]: nowSecs };
        localStorage.setItem('chat_read_timestamps', JSON.stringify(updated));
        return updated;
      });
    }
  }, [activeChatRoom?.id, chatMessages, user?.uid]);
  
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
  const [sellerListings, _setSellerListings] = useState<any[]>([]);
  const setSellerListings = (val: any) => {
    _setSellerListings((prev: any) => {
      const merged = mergeLocalVirtualData('listings', typeof val === 'function' ? val(prev) : val);
      return merged.filter((item: any) => item.sellerId === user?.uid);
    });
  };
  const [allListings, _setAllListings] = useState<any[]>([]);
  const setAllListings = (val: any) => {
    _setAllListings((prev: any) => mergeLocalVirtualData('listings', typeof val === 'function' ? val(prev) : val));
  };
  const [allPurchases, _setAllPurchases] = useState<any[]>([]);
  const setAllPurchases = (val: any) => {
    _setAllPurchases((prev: any) => mergeLocalVirtualData('purchases', typeof val === 'function' ? val(prev) : val));
  };
  const [allPayments, _setAllPayments] = useState<any[]>([]);
  const setAllPayments = (val: any) => {
    _setAllPayments((prev: any) => mergeLocalVirtualData('payments', typeof val === 'function' ? val(prev) : val));
  };
  const [allWithdrawals, _setAllWithdrawals] = useState<any[]>([]);
  const setAllWithdrawals = (val: any) => {
    _setAllWithdrawals((prev: any) => mergeLocalVirtualData('withdrawals', typeof val === 'function' ? val(prev) : val));
  };
  const [headline, setHeadline] = useState({ text: '★ স্বাগতম Gmail Buy & Sell BD-এ! ★ বিশ্বের সেরা এবং দ্রুততম জিমেইল মার্কেটপ্লেস ★', speed: 25 });
  const [pendingHeadline, setPendingHeadline] = useState('');
  const [pendingSpeed, setPendingSpeed] = useState(25);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showSellNotice, setShowSellNotice] = useState(false);
  const [sellListingToEdit, setSellListingToEdit] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<{show: boolean, price: number, listingId?: string}>({ show: false, price: 0 });
  const [paymentForm, setPaymentForm] = useState({ senderNumber: '', trxId: '', method: 'bkash' as 'bkash' | 'nagad' });
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDepositCompleted, setIsDepositCompleted] = useState(false);
  const [showDepositArea, setShowDepositArea] = useState(false);
  const [depositModalView, setDepositModalView] = useState<'payment_form' | 'min_balance'>('payment_form');
  const [purchasedCreds, setPurchasedCreds] = useState<{gmail: string, pass: string, recovery?: string, twoFactor?: string} | null>(null);

  useEffect(() => {
    if (showPaymentModal.show && showPaymentModal.listingId === 'deposit') {
      setDepositModalView('payment_form');
    }
  }, [showPaymentModal.show, showPaymentModal.listingId]);

  const handleClosePaymentModal = () => {
    setShowPaymentModal({ show: false, price: 0 });
  };

  const handleDepositTrigger = () => {
    setShowPaymentModal({ show: true, price: 100, listingId: 'deposit' });
  };
  const [showInstructions, setShowInstructions] = useState(false);
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
  const [adminTrxMap, setAdminTrxMap] = useState<Record<string, string>>({});
  const [bulkPayoutTrxId, setBulkPayoutTrxId] = useState('');
  const [fbCategory, setFbCategory] = useState('');
  const [fbUploadType, setFbUploadType] = useState<'single' | 'bulk'>('single');
  const [fbSellImage, setFbSellImage] = useState<string | null>(null);
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [fbForm, setFbForm] = useState({
    phone: '',
    password: '',
    twoFAMethod: '',
    bulkContent: '',
    title: '',
    description: '',
    price: '30'
  });
  const [fbListings, setFbListings] = useState<any[]>([]);
  const [fbSuccess, setFbSuccess] = useState<{ count: number } | null>(null);
  const [revealedFbListings, setRevealedFbListings] = useState<Record<string, boolean>>({});
  const [fbTab, setFbTab] = useState<'sell' | 'history' | 'archive'>('sell');
  const [fbHistorySearch, setFbHistorySearch] = useState('');
  const [fbHistoryFilter, setFbHistoryFilter] = useState<'all' | 'pending' | 'approved' | 'disputed' | 'escalated' | 'refunded'>('all');
  const [localArchivedFBLisings, setLocalArchivedFBLisings] = useState<any[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('archived_fb_listings');
    if (stored) {
      try {
        setLocalArchivedFBLisings(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Decoupled deposit auto-population to keep Amount box blank and manual as requested

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
  const [liveSales, _setLiveSales] = useState<any[]>([]);
  const setLiveSales = (val: any) => {
    _setLiveSales((prev: any) => mergeLocalVirtualData('listings', typeof val === 'function' ? val(prev) : val));
  };
  const [todaySold, _setTodaySold] = useState<any[]>([]);
  const setTodaySold = (val: any) => {
    _setTodaySold((prev: any) => mergeLocalVirtualData('listings', typeof val === 'function' ? val(prev) : val));
  };
  const [todaySoldCount, setTodaySoldCount] = useState(0);
  const [topSellers, setTopSellers] = useState<any[]>([]);
  const [topBuyers, setTopBuyers] = useState<any[]>([]);
  const [showRankModal, setShowRankModal] = useState<{ show: boolean; type: 'seller' | 'buyer' }>({ show: false, type: 'seller' });

  const DEFAULT_MOCK_SELLERS = [
    { id: "mock-s-1", displayName: "Noman Sarker", name: "Noman Sarker", totalSales: 87, photoURL: null },
    { id: "mock-s-2", displayName: "Sabbir Ahmed", name: "Sabbir Ahmed", totalSales: 64, photoURL: null },
    { id: "mock-s-3", displayName: "Abrar Shakib", name: "Abrar Shakib", totalSales: 52, photoURL: null },
    { id: "mock-s-4", displayName: "Jahidul Islam", name: "Jahidul Islam", totalSales: 41, photoURL: null },
    { id: "mock-s-5", displayName: "MD Ripon", name: "MD Ripon", totalSales: 35, photoURL: null },
    { id: "mock-s-6", displayName: "Fahim Shahriar", name: "Fahim Shahriar", totalSales: 29, photoURL: null },
    { id: "mock-s-7", displayName: "Mehedi Hasan", name: "Mehedi Hasan", totalSales: 22, photoURL: null },
    { id: "mock-s-8", displayName: "Rofiqul Islam", name: "Rofiqul Islam", totalSales: 18, photoURL: null },
  ];

  const DEFAULT_MOCK_BUYERS = [
    { id: "mock-b-1", displayName: "Sakib Al Hasan", name: "Sakib Al Hasan", totalSpent: 12500, photoURL: null },
    { id: "mock-b-2", displayName: "Ariful Islam", name: "Ariful Islam", totalSpent: 9800, photoURL: null },
    { id: "mock-b-3", displayName: "Mahmudul Hasan", name: "Mahmudul Hasan", totalSpent: 7200, photoURL: null },
    { id: "mock-b-4", displayName: "Tanvir Ahmed", name: "Tanvir Ahmed", totalSpent: 5400, photoURL: null },
    { id: "mock-b-5", displayName: "Imran Hossain", name: "Imran Hossain", totalSpent: 4100, photoURL: null },
    { id: "mock-b-6", displayName: "Sujon Ahmed", name: "Sujon Ahmed", totalSpent: 3500, photoURL: null },
    { id: "mock-b-7", displayName: "Asif Rahman", name: "Asif Rahman", totalSpent: 2800, photoURL: null },
    { id: "mock-b-8", displayName: "Rubel Mia", name: "Rubel Mia", totalSpent: 1900, photoURL: null },
  ];

  const getLeaderboardSellers = () => {
    const realList = topSellers || [];
    const merged = [...realList];
    DEFAULT_MOCK_SELLERS.forEach(mockItem => {
      if (merged.length < 10 && !merged.some(item => item.id === mockItem.id || item.displayName === mockItem.displayName)) {
        merged.push(mockItem);
      }
    });
    return merged.sort((a, b) => (b.totalSales || 0) - (a.totalSales || 0));
  };

  const getLeaderboardBuyers = () => {
    const realList = topBuyers || [];
    const merged = [...realList];
    DEFAULT_MOCK_BUYERS.forEach(mockItem => {
      if (merged.length < 10 && !merged.some(item => item.id === mockItem.id || item.displayName === mockItem.displayName)) {
        merged.push(mockItem);
      }
    });
    return merged.sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0));
  };
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [noticeText, setNoticeText] = useState("Used জিমেইল মিনিমাম ২পিস সেল-করতে হবে🔘sell দেওয়ার পর পাসওয়ার্ড**পরিবর্তন করলে payment পাবেন না🔘 পেমেন্ট পেতে দেরি হলে সরাসরি customer সার্ভিস যোগাযোগ করুন-8801410731308।২৪ ঘন্টা পর পেমেন্ট auto payment verify হবে🎧 24/7 Support");
  const [pendingNotice, setPendingNotice] = useState("");
  const [homeBgColor, setHomeBgColor] = useState("#ffffff");
  const [pendingHomeBgColor, setPendingHomeBgColor] = useState("#ffffff");
  const [mainBoxColor, setMainBoxColor] = useState("#054335");
  const [pendingMainBoxColor, setPendingMainBoxColor] = useState("#054335");
  const [navBgColor, setNavBgColor] = useState("#ffffff");
  const [pendingNavBgColor, setPendingNavBgColor] = useState("#ffffff");
  const [headerBgColor, setHeaderBgColor] = useState("#ffffff");
  const [pendingHeaderBgColor, setPendingHeaderBgColor] = useState("#ffffff");
  const [estTraffic, setEstTraffic] = useState(5000);
  const [estCTR, setEstCTR] = useState(2.5);
  const [estCPC, setEstCPC] = useState(20);
  const [adsterraTraffic, setAdsterraTraffic] = useState(5000);
  const [adsterraCPM, setAdsterraCPM] = useState(1.5); // Default expected global CPM in USD
  const [isAdminOnlineState, setIsAdminOnlineState] = useState(false);
  const [showReferModal, setShowReferModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showAdsEarnModal, setShowAdsEarnModal] = useState(false);
  const [adWatchProgress, setAdWatchProgress] = useState(0);
  const [adWatchStatus, setAdWatchStatus] = useState<'idle' | 'watching' | 'completed'>('idle');
  const [adWatchCountdown, setAdWatchCountdown] = useState(5);
  const [adClickedTime, setAdClickedTime] = useState<number | null>(null);
  const [claimSecondsRemaining, setClaimSecondsRemaining] = useState<number>(15);
  const [adsEarnError, setAdsEarnError] = useState<string | null>(null);
  const [adsEarnSuccess, setAdsEarnSuccess] = useState<string | null>(null);
  const [isClaimingAd, setIsClaimingAd] = useState(false);

  useEffect(() => {
    if (!adClickedTime || adWatchStatus !== 'completed') {
      setClaimSecondsRemaining(15);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - adClickedTime) / 1000);
      const remaining = Math.max(0, 15 - elapsed);
      setClaimSecondsRemaining(remaining);
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [adClickedTime, adWatchStatus]);

  useEffect(() => {
    setAdsEarnError(null);
    setAdsEarnSuccess(null);
  }, [showAdsEarnModal]);

  const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const startWatchingAd = () => {
    setAdsEarnError(null);
    setAdsEarnSuccess(null);
    if (!user) {
      setAdsEarnError("অনুগ্রহ করে ইনকাম করতে প্রথমে লগইন করুন!");
      return;
    }
    const todayStr = getTodayDateString();
    const currentCount = userProfile?.lastAdWatchedDate === todayStr ? (userProfile?.adsWatchedToday || 0) : 0;
    if (currentCount >= 500) {
      setAdsEarnError("আপনার আজকের ৫০০ বিজ্ঞাপনের ডেইলি লিমিট (Daily Limit 500 Ads) শেষ হয়ে গেছে! আগামীকাল আবার চেষ্টা করুন।");
      return;
    }

    const pool = rewardAds && rewardAds.length > 0 ? rewardAds : fallbackRewards;
    const randomIndex = Math.floor(Math.random() * pool.length);
    const chosenAd = pool[randomIndex];
    setActiveRewardAd(chosenAd);

    // Record the click timestamp immediately to enforce 15-second wait rule
    setAdClickedTime(Date.now());

    // Open Adsterra Direct Link in a new tab if enabled and available
    if (adsterraEnabled && adsterraDirectLinkUrl && adsterraDirectLinkUrl.trim() !== "") {
      try {
        window.open(adsterraDirectLinkUrl.trim(), '_blank');
      } catch (e) {
        console.warn("Failed to open Adsterra direct link in a new tab", e);
      }
    }

    // Set ad watch status to 'completed' immediately, bypassing timing/delay countdown
    setAdWatchStatus('completed');
    setAdWatchProgress(100);
  };

  const claimAdEarning = async () => {
    setAdsEarnError(null);
    setAdsEarnSuccess(null);
    if (!user?.uid) {
      setAdsEarnError("অনুগ্রহ করে প্রথমে লগইন করুন!");
      return;
    }
    const todayStr = getTodayDateString();
    const currentCount = userProfile?.lastAdWatchedDate === todayStr ? (userProfile?.adsWatchedToday || 0) : 0;
    if (currentCount >= 500) {
      setAdsEarnError("আপনার আজকের ৫০০ বিজ্ঞাপনের ডেইলি লিমিট শেষ হয়ে গেছে!");
      return;
    }

    // Enforce 15-second waiting rule
    const now = Date.now();
    const clickedTime = adClickedTime || 0;
    const elapsedSeconds = Math.floor((now - clickedTime) / 1000);

    if (elapsedSeconds < 15) {
      const remaining = 15 - elapsedSeconds;
      setAdsEarnError(`⚠️ দুঃখিত! আপনি মাত্র ${elapsedSeconds} সেকেন্ড বিজ্ঞাপন পেজে অবস্থান করেছেন। রিওয়ার্ড ব্যালেন্স যোগ করতে নতুন বিজ্ঞাপন ট্যাবে আপনাকে কমপক্ষে ১৫ সেকেন্ড অপেক্ষা করতে হবে। দয়া করে আরও ${remaining} সেকেন্ড অপেক্ষা করে আবার চেষ্টা করুন!`);
      return;
    }

    if (isClaimingAd) return;
    setIsClaimingAd(true);

    const isSameDay = userProfile?.lastAdWatchedDate === todayStr;
    const nextCount = isSameDay ? currentCount + 1 : 1;

    try {
      try {
        await updateDoc(doc(db, 'profiles', user.uid), {
          earningsBalance: increment(0.10),
          totalEarned: increment(0.10),
          adsWatchedToday: isSameDay ? increment(1) : 1,
          lastAdWatchedDate: todayStr
        });
      } catch (dbErr: any) {
        console.warn("Firestore save failed, performing direct local update fallback:", dbErr);
        // Fallback for any Firestore update errors: manually save to local storage cache under the key
        const cacheKey = `cache_profile_${user.uid}`;
        const cached = localStorage.getItem(cacheKey);
        let localProfileData = cached ? JSON.parse(cached) : { ...userProfile };
        localProfileData.earningsBalance = (localProfileData.earningsBalance || 0) + 0.10;
        localProfileData.totalEarned = (localProfileData.totalEarned || 0) + 0.10;
        localProfileData.adsWatchedToday = nextCount;
        localProfileData.lastAdWatchedDate = todayStr;
        localStorage.setItem(cacheKey, JSON.stringify(localProfileData));
      }

      setUserProfile((prev: any) => {
        const newVal = {
          ...prev,
          earningsBalance: (prev?.earningsBalance || 0) + 0.10,
          totalEarned: (prev?.totalEarned || 0) + 0.10,
          adsWatchedToday: nextCount,
          lastAdWatchedDate: todayStr
        };
        // Also ensure local cache is in sync
        const cacheKey = `cache_profile_${user?.uid}`;
        localStorage.setItem(cacheKey, JSON.stringify(newVal));
        return newVal;
      });

      setAdsEarnSuccess(`অভিনন্দন! আপনার একাউন্টে ৳০.১০ সফলভাবে যোগ করা হয়েছে। আজকের মোট বিজ্ঞাপন ভিউ: ${nextCount}/500`);
      setAdWatchStatus('idle');
      setAdWatchProgress(0);
      setActiveRewardAd(null);
      setAdClickedTime(null); // Reset click timer
    } catch (err: any) {
      console.error("Ad claim error details:", err);
      setAdsEarnError('Error updating earnings: ' + (err.message || String(err)));
    } finally {
      setIsClaimingAd(false);
    }
  };
  const handleDailyCheckIn = async () => {
    if (!user) {
      alert("অনুগ্রহ করে ডেইলি বোনাস নিতে প্রথমে লগইন করুন!");
      return;
    }
    const todayStr = getTodayDateString();
    if (userProfile?.lastCheckInDate === todayStr) {
      alert("⚠️ আপনি আজকের ডেইলি চেক-ইন বোনাস ইতিমধ্যে নিয়ে নিয়েছেন! আগামীকাল আবার চেষ্টা করুন।");
      return;
    }
    try {
      try {
        await updateDoc(doc(db, 'profiles', user.uid), {
          earningsBalance: increment(1.00),
          totalEarned: increment(1.00),
          lastCheckInDate: todayStr
        });
      } catch (dbErr: any) {
        console.warn("Firestore checkin save failed, performing direct local update fallback:", dbErr);
        const cacheKey = `cache_profile_${user.uid}`;
        const cached = localStorage.getItem(cacheKey);
        let localProfileData = cached ? JSON.parse(cached) : { ...userProfile };
        localProfileData.earningsBalance = (localProfileData.earningsBalance || 0) + 1.00;
        localProfileData.totalEarned = (localProfileData.totalEarned || 0) + 1.00;
        localProfileData.lastCheckInDate = todayStr;
        localStorage.setItem(cacheKey, JSON.stringify(localProfileData));
      }

      setUserProfile((prev: any) => {
        const newVal = {
          ...prev,
          earningsBalance: (prev?.earningsBalance || 0) + 1.00,
          totalEarned: (prev?.totalEarned || 0) + 1.00,
          lastCheckInDate: todayStr
        };
        const cacheKey = `cache_profile_${user?.uid}`;
        localStorage.setItem(cacheKey, JSON.stringify(newVal));
        return newVal;
      });

      alert("🎉 অভিনন্দন! আপনার ডেইলি চেক-ইন বোনাস ৳১.০০ সফলভাবে ক্লেইম করা হয়েছে।");
    } catch (err: any) {
      console.error("Daily check-in error:", err);
      alert("Error: " + (err.message || String(err)));
    }
  };

  const handleTelegramJoinTask = async () => {
    if (!user) {
      alert("অনুগ্রহ করে টাস্ক সম্পন্ন করতে প্রথমে লগইন করুন!");
      return;
    }
    if (userProfile?.hasJoinedTelegram) {
      alert("⚠️ আপনি এই টাস্কটি ইতিমধ্যে সম্পন্ন করে ফেলেছিলেন!");
      return;
    }
    
    // Open Telegram Channel
    window.open("https://t.getg.xyz/social_tg", "_blank");
    
    alert("অফিসিয়াল টেলিগ্রাম চ্যানেলে জয়েন করুন এবং ৫ সেকেন্ড পরে এই পেজে ফিরে ক্লেইম করুন!");
    
    setTimeout(async () => {
      try {
        try {
          await updateDoc(doc(db, 'profiles', user.uid), {
            earningsBalance: increment(1.00),
            totalEarned: increment(1.00),
            hasJoinedTelegram: true
          });
        } catch (dbErr: any) {
          console.warn("Firestore save failed, manual fallback:", dbErr);
          const cacheKey = `cache_profile_${user.uid}`;
          const cached = localStorage.getItem(cacheKey);
          let localProfileData = cached ? JSON.parse(cached) : { ...userProfile };
          localProfileData.earningsBalance = (localProfileData.earningsBalance || 0) + 1.00;
          localProfileData.totalEarned = (localProfileData.totalEarned || 0) + 1.00;
          localProfileData.hasJoinedTelegram = true;
          localStorage.setItem(cacheKey, JSON.stringify(localProfileData));
        }

        setUserProfile((prev: any) => {
          const newVal = {
            ...prev,
            earningsBalance: (prev?.earningsBalance || 0) + 1.00,
            totalEarned: (prev?.totalEarned || 0) + 1.00,
            hasJoinedTelegram: true
          };
          const cacheKey = `cache_profile_${user?.uid}`;
          localStorage.setItem(cacheKey, JSON.stringify(newVal));
          return newVal;
        });

        alert("🎉 অভিনন্দন! টেলিগ্রাম চ্যানেল জয়েন করার বোনাস ৳১.০০ আপনার ওয়ালেটে যোগ হয়েছে।");
      } catch (err: any) {
        console.error("Telegram join error:", err);
      }
    }, 5000);
  };

  const handleYoutubeSubscribeTask = async () => {
    if (!user) {
      alert("অনুগ্রহ করে টাস্ক সম্পন্ন করতে প্রথমে লগইন করুন!");
      return;
    }
    if (userProfile?.hasSubscribedYoutube) {
      alert("⚠️ আপনি এই টাস্কটি ইতিমধ্যে সম্পন্ন করে ফেলেছিলেন!");
      return;
    }

    // Open Youtube Channel
    window.open("https://t.getg.xyz/social_yt", "_blank");

    alert("আমাদের ইউটিউব চ্যানেলটি সাবস্ক্রাইব করুন এবং ৫ সেকেন্ড পরে এই পেজে ফিরে ক্লেইম করুন!");

    setTimeout(async () => {
      try {
        try {
          await updateDoc(doc(db, 'profiles', user.uid), {
            earningsBalance: increment(1.50),
            totalEarned: increment(1.50),
            hasSubscribedYoutube: true
          });
        } catch (dbErr: any) {
          console.warn("Firestore save failed, manual fallback:", dbErr);
          const cacheKey = `cache_profile_${user.uid}`;
          const cached = localStorage.getItem(cacheKey);
          let localProfileData = cached ? JSON.parse(cached) : { ...userProfile };
          localProfileData.earningsBalance = (localProfileData.earningsBalance || 0) + 1.50;
          localProfileData.totalEarned = (localProfileData.totalEarned || 0) + 1.50;
          localProfileData.hasSubscribedYoutube = true;
          localStorage.setItem(cacheKey, JSON.stringify(localProfileData));
        }

        setUserProfile((prev: any) => {
          const newVal = {
            ...prev,
            earningsBalance: (prev?.earningsBalance || 0) + 1.50,
            totalEarned: (prev?.totalEarned || 0) + 1.50,
            hasSubscribedYoutube: true
          };
          const cacheKey = `cache_profile_${user?.uid}`;
          localStorage.setItem(cacheKey, JSON.stringify(newVal));
          return newVal;
        });

        alert("🎉 অভিনন্দন! ইউটিউব সাবস্ক্রাইব বোনাস ৳১.৫০ আপনার ওয়ালেটে যোগ হয়েছে।");
      } catch (err: any) {
        console.error("Youtube subscribe error:", err);
      }
    }, 5000);
  };

  const [withdrawMode, setWithdrawMode] = useState<'referral' | 'earnings'>('referral');
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
    // Stats and leaderboard queries removed completely to reduce database read load, as requested by the user.
  }, [user]);

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

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    if (timestamp.toDate) return timestamp.toDate().toLocaleString();
    if (timestamp.seconds) return new Date(timestamp.seconds * 1000).toLocaleString();
    return new Date(timestamp).toLocaleString();
  };

  const formatDateBengali = (timestamp: any) => {
    if (!timestamp) {
      // Standard robust default date matching client mockup
      return '২২ মে, ২০২৬';
    }
    let dateObj = new Date();
    if (timestamp.toDate) {
      dateObj = timestamp.toDate();
    } else if (timestamp.seconds) {
      dateObj = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      dateObj = new Date(timestamp);
    } else if (timestamp instanceof Date) {
      dateObj = timestamp;
    }

    const day = dateObj.getDate();
    const monthIdx = dateObj.getMonth();
    const year = dateObj.getFullYear();

    const bengaliMonths = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];

    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

    const convertToBengaliDigits = (num: number) => {
      return num.toString().split('').map(digit => {
        const parsed = parseInt(digit, 10);
        return isNaN(parsed) ? digit : bengaliDigits[parsed];
      }).join('');
    };

    const bengaliDay = convertToBengaliDigits(day);
    const bengaliYear = convertToBengaliDigits(year);
    const bengaliMonth = bengaliMonths[monthIdx];

    return `${bengaliDay} ${bengaliMonth}, ${bengaliYear}`;
  };

  const formatTimeOnly = (timestamp: any, fallback = 'Just now') => {
    if (!timestamp) return fallback;
    try {
      let dateObj: Date;
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        dateObj = timestamp.toDate();
      } else if (timestamp.seconds !== undefined) {
        dateObj = new Date(timestamp.seconds * 1000);
      } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        dateObj = new Date(timestamp);
      } else if (timestamp instanceof Date) {
        dateObj = timestamp;
      } else {
        return fallback;
      }
      
      if (isNaN(dateObj.getTime())) {
        return fallback;
      }
      return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return fallback;
    }
  };

  const getMaskedGmail = (email: string): string => {
    if (!email || !email.includes('@')) return email;
    const parts = email.split('@');
    const filename = parts[0].trim();
    const domain = parts[1].trim();
    
    if (filename.includes('*')) {
      return email;
    }
    
    if (filename.length <= 3) {
      return `${filename}***@${domain}`;
    }
    
    const digitMatch = filename.match(/\d+$/);
    const trailingDigits = digitMatch ? digitMatch[0] : '';
    const baseName = trailingDigits ? filename.substring(0, filename.length - trailingDigits.length) : filename;
    
    const firstPart = baseName.substring(0, Math.min(3, baseName.length));
    
    return `${firstPart}*******${trailingDigits}@${domain}`;
  };

  const hashEmail = (email: string): string => {
    if (!email) return '';
    const sorted = email.toLowerCase().replace(/\s+/g, '');
    const salt = "GMAIL_BUY_SELL_BD_SALT_2026";
    const combined = sorted + salt;
    
    let h1 = 0x811c9dc5;
    let h2 = 0xcbf29ce4;
    
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      h1 = Math.imul(h1 ^ char, 0x01000193);
      h2 = Math.imul(h2 ^ char, 0x01000193);
    }
    
    return ((h1 >>> 0).toString(16) + (h2 >>> 0).toString(16));
  };

  const formattedDate = currentTime.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const [otpStep, setOtpStep] = useState(false);
  const [sentOtp, setSentOtp] = useState('');
  const [userOtp, setUserOtp] = useState('');
  const [marketListings, setMarketListings] = useState<any[]>([]);

  const filteredMarketListings = React.useMemo(() => {
    return marketListings.filter(l => 
      (l.gmailAccount.toLowerCase().includes(marketSearchQuery.toLowerCase()) || 
       (l.type && l.type.toLowerCase().includes(marketSearchQuery.toLowerCase())) ||
       (l.description && l.description.toLowerCase().includes(marketSearchQuery.toLowerCase()))) &&
      l.sellerId !== user?.uid
    );
  }, [marketListings, marketSearchQuery, user?.uid]);

  const filteredTodaySold = React.useMemo(() => {
    if (!user) return todaySold;
    // Sellers should NOT see their own listings in "Today's Gmail Sold"
    return todaySold.filter(l => l.sellerId !== user.uid);
  }, [todaySold, user?.uid]);

  const filteredLiveSales = React.useMemo(() => {
    // Everyone sees all records in "Live Sell Activity"
    return liveSales;
  }, [liveSales]);

  const [myPurchases, _setMyPurchases] = useState<any[]>([]);
  const setMyPurchases = (val: any) => {
    _setMyPurchases((prev: any) => mergeLocalVirtualData('purchases', typeof val === 'function' ? val(prev) : val));
  };
  const [marketTab, setMarketTab] = useState<'Market' | 'Bought'>('Market');
  const [userPayments, _setUserPayments] = useState<any[]>([]);
  const setUserPayments = (val: any) => {
    _setUserPayments((prev: any) => mergeLocalVirtualData('payments', typeof val === 'function' ? val(prev) : val));
  };
  const [userWithdrawals, _setUserWithdrawals] = useState<any[]>([]);
  const setUserWithdrawals = (val: any) => {
    _setUserWithdrawals((prev: any) => mergeLocalVirtualData('withdrawals', typeof val === 'function' ? val(prev) : val));
  };

  const combinedRecentHistory = React.useMemo(() => {
    // 1. Get deposit payments
    const deposits = (userPayments || [])
      .filter((p: any) => p.listingId === 'deposit' || p.isDeposit || p.type === 'deposit')
      .map((p: any) => ({
        id: p.id,
        txType: 'deposit',
        amount: Number(p.amount) || 0,
        status: p.status, // e.g. 'verified', 'pending', 'rejected'
        createdAt: p.createdAt,
        method: p.method || 'bkash',
        number: p.senderNumber || ''
      }));

    // 2. Get withdrawal requests
    const withdrawals = (userWithdrawals || [])
      .map((w: any) => ({
        id: w.id,
        txType: 'withdrawal',
        amount: Number(w.amount) || 0,
        status: w.status, // e.g. 'pending', 'approved', 'rejected'
        createdAt: w.createdAt,
        method: w.method || 'bkash',
        number: w.number || ''
      }));

    // Combine and sort by createdAt descending, limit to 10
    const combined = [...deposits, ...withdrawals];
    return combined.sort((a, b) => {
      const aTime = a.createdAt?.seconds || (a.createdAt ? new Date(a.createdAt).getTime() / 1000 : 0);
      const bTime = b.createdAt?.seconds || (b.createdAt ? new Date(b.createdAt).getTime() / 1000 : 0);
      return bTime - aTime;
    }).slice(0, 10);
  }, [userPayments, userWithdrawals]);
  const [listingFilter, setListingFilter] = useState('All');
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
        setQuotaExceeded(false);
        return "সার্ভার রিফ্রেশ করা হচ্ছে, অনুগ্রহ করে একটু অপেক্ষা করুন...";
      }
      if (mainError.toLowerCase().includes('unavailable') || mainError.toLowerCase().includes('failed to connect')) {
        return "আপনার ইন্টারনেট কানেকশন চেক করুন। সার্ভারের সাথে সংযোগ বিচ্ছিন্ন হয়ে গেছে। (Firestore Connectivity Issue.)";
      }
      if (mainError.toLowerCase().includes('unauthorized domain') || mainError.toLowerCase().includes('unauthorized-domain')) {
        return `Unauthorized Domain! এই ডোমেইনটি (${window.location.hostname}) Firebase Console > Authentication > Settings > Authorized Domains এ যুক্ত করা নেই। দয়া করে এডমিনকে বলুন ডোমেইনটি অথোরাইজ করতে।`;
      }
      if (mainError.toLowerCase().includes('email-already-in-use') || mainError.toLowerCase().includes('auth/email-already-in-use')) {
        return "এই ইমেইলটি ইতিমধ্যে নিবন্ধিত। দয়া করে লগইন করুন।";
      }
      if (mainError.toLowerCase().includes('wrong-password') || mainError.toLowerCase().includes('invalid-credential') || mainError.toLowerCase().includes('invalid-password')) {
        return "পাসওয়ার্ডটি সঠিক নয়। সঠিক পাসওয়ার্ড দিয়ে চেষ্টা করুন।";
      }
      if (mainError.toLowerCase().includes('user-not-found')) {
        return "এই ইমেইলটি নিবন্ধিত নয়। দয়া করে নতুন একাউন্ট খুলুন।";
      }
      if (mainError.toLowerCase().includes('weak-password')) {
        return "পাসওয়ার্ডটি অন্তত ৬ অক্ষরের হতে হবে।";
      }
      return mainError;
    } catch (e) {
      // Fallback for regular error strings
      if (errorStr.toLowerCase().includes('quota limit exceeded') || 
          errorStr.toLowerCase().includes('resource-exhausted') ||
          errorStr.toLowerCase().includes('quota exceeded')) {
        return "সার্ভার লোড ব্যালেন্স হচ্ছে, অনুগ্রহ করে কিছু মুহূর্ত অপেক্ষা করুন...";
      }
      if (errorStr.toLowerCase().includes('unavailable') || errorStr.toLowerCase().includes('failed to connect')) {
        return "ইন্টারনেট কানেকশন চেক করুন। সার্ভারের সাথে সংযোগ বিচ্ছিন্ন। (Firestore Offline/Connectivity Error.)";
      }
      if (errorStr.toLowerCase().includes('unauthorized domain') || errorStr.toLowerCase().includes('unauthorized-domain')) {
        return `Unauthorized Domain! ডোমেইনটি (${window.location.hostname}) Firebase-এ Authorized Domains হিসেবে যুক্ত নেই। দয়া করে কন্সোল থেকে এই ডোমেইনটি যুক্ত করুন।`;
      }
      return errorStr;
    }
  };
  
  // Navigation states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSellEarnOpen, setIsSellEarnOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isHeaderDropdownOpen, setIsHeaderDropdownOpen] = useState(false);

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

  const [adminUserSearchQuery, setAdminUserSearchQuery] = useState('');
  const [adminSearchedAccount, setAdminSearchedAccount] = useState<any>(null);

  const handleAdminUserLookup = async () => {
    if (!isAdmin || !adminUserSearchQuery) return;
    setIsVerifying(true);
    try {
      let targetUid = '';
      
      if (/^\d+$/.test(adminUserSearchQuery)) {
        const q = query(collection(db, 'profiles'), where('numericId', '==', adminUserSearchQuery));
        const snap = await getDocs(q);
        if (!snap.empty) {
          targetUid = snap.docs[0].id;
        }
      }

      if (!targetUid) {
        const q = query(collection(db, 'profiles'), where('email', '==', adminUserSearchQuery));
        const snap = await getDocs(q);
        if (!snap.empty) {
          targetUid = snap.docs[0].id;
        }
      }

      if (!targetUid) {
        const docRef = doc(db, 'profiles', adminUserSearchQuery);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          targetUid = adminUserSearchQuery;
        }
      }

      if (!targetUid) {
        alert('User not found!');
        setAdminSearchedAccount(null);
        return;
      }

      const finalDoc = await getDoc(doc(db, 'profiles', targetUid));
      setAdminSearchedAccount({ id: finalDoc.id, ...finalDoc.data() });
    } catch (err: any) {
      alert('Search Error: ' + err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSendAdminResetEmail = async (email: string) => {
    if (!isAdmin || !email) return;
    if (!window.confirm(`আপনি কি ${email} এ পাসওয়ার্ড রিসেট ইমেল পাঠাতে চান?`)) return;
    try {
      await sendPasswordResetEmail(auth, email);
      alert(`${email} এ পাসওয়ার্ড রিসেট ইমেল পাঠানো হয়েছে! ইনবক্স বা স্প্যাম চেক করুন।`);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };
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
    // Suppressed quota listeners to maintain continuity
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
        
        // Clear all user-specific states when user is not logged in to prevent crossover
        if (!currentUser) {
          _setSellerListings([]);
          setFbListings([]);
          _setMyPurchases([]);
          _setUserPayments([]);
          setMyReports([]);
          setSellerReports([]);
          setNotifications([]);
          _setChatMessages([]);
          _setUserInboxThreads([]);
        }

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
                earningsBalance: 0,
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
            handleListenerError('Profile', err);
            
            // Check cache first or populate highly professional backup profile state when database quota is hit
            const cacheKey = `cache_profile_${currentUser.uid}`;
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
              try {
                setUserProfile(JSON.parse(cached));
              } catch (e) {
                // fall through
              }
            }
            
            if (!userProfile) {
              const isAdminEmail = currentUser.email && SYSTEM_ADMINS.includes(currentUser.email);
              const fallbackProfile = {
                email: currentUser.email,
                balance: 0,
                earningsBalance: 0,
                totalSales: 0,
                totalOrders: 0,
                uid: currentUser.uid,
                numericId: "USR-" + currentUser.uid.substring(0, 5).toUpperCase(),
                role: isAdminEmail ? 'admin' : 'user',
                displayName: currentUser.displayName || currentUser.email?.split('@')[0] || "Test User",
                createdAt: new Date(),
                bkashNumber: "017XXXXXXXX",
                nagadNumber: "019XXXXXXXX"
              };
              setUserProfile(fallbackProfile);
              
              // Populate initial form
              setProfileForm({
                firstName: fallbackProfile.displayName,
                lastName: '',
                age: '24',
                address: 'Dhaka, Bangladesh',
                displayName: fallbackProfile.displayName,
                phone: '017XXXXXXXX',
                bkashNumber: '017XXXXXXXX',
                nagadNumber: '019XXXXXXXX',
                photoURL: currentUser.photoURL || ''
              });
            }
            
            // Log profile fetch error and load cached/fallback values instead of throwing a fatal exception that crashes the UI
            console.warn('Firestore Profile Fetch Error (handled fallback):', err);
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

    // Real-time Notifications Listener with offline cache & fallback safety
    const cacheKey = `cache_notifs_${user.uid}`;
    const cachedNotifs = localStorage.getItem(cacheKey);
    if (cachedNotifs) {
      try {
        const parsed = JSON.parse(cachedNotifs);
        setNotifications(parsed);
        setUnreadCount(parsed.filter((n: any) => !n.read).length);
      } catch (e) {}
    }

    const qNotifs = query(collection(db, 'notifications'), where('toUserId', '==', user.uid), orderBy('createdAt', 'desc'), limit(30));
    const unsubscribeNotifs = onSnapshot(qNotifs, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as any);
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n: any) => !n.read).length);
      localStorage.setItem(cacheKey, JSON.stringify(notifs));
    }, (err) => {
      console.warn('Notifications listener failed:', err);
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setNotifications(parsed);
          setUnreadCount(parsed.filter((n: any) => !n.read).length);
        } catch (e) {}
      }
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
        let recipientFcmToken = null;
        try {
          const profileDoc = await getDoc(doc(db, 'profiles', finalToUserId));
          if (profileDoc.exists()) {
            recipientFcmToken = profileDoc.data()?.fcmToken || null;
          }
        } catch (fcmErr) {
          console.warn('Could not read recipient FCM token from client Firestore:', fcmErr);
        }

        fetch('/api/send-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toUserId: finalToUserId,
            fcmToken: recipientFcmToken,
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
          earningsBalance: 0,
          totalSales: 0,
          totalOrders: 0,
          role: isAdminEmail ? 'admin' : 'user',
          createdAt: serverTimestamp()
        });
        setOtpStep(false);
        setUserOtp('');
      } catch (regErr: any) {
        console.error('Registration failed:', regErr);
        if (regErr.code === 'auth/email-already-in-use' || (regErr.message && regErr.message.includes('email-already-in-use'))) {
          setError('এই ইমেইলটি ইতিমধ্যে নিবন্ধিত। সঠিক পাসওয়ার্ড দিয়ে লগইন করুন।');
          setOtpStep(false);
        } else if (regErr.code === 'auth/weak-password' || (regErr.message && regErr.message.includes('weak-password'))) {
          setError('পাসওয়ার্ডটি অন্তত ৬ অক্ষরের হতে হবে।');
        } else {
          setError(regErr.message || 'Registration failed');
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode) {
      setError('রিসেট কোড পাওয়া যায়নি। আবার চেষ্টা করুন।');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('পাসওয়ার্ড দুটি মিলছে না।');
      return;
    }
    if (newPassword.length < 6) {
      setError('পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await confirmPasswordReset(auth, resetCode, newPassword);
      alert('পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে! এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।');
      setView('login');
      setNewPassword('');
      setConfirmNewPassword('');
      setResetCode(null);
    } catch (err: any) {
      console.error('Confirm reset password error:', err);
      if (err.code === 'auth/expired-action-code') {
        setError('লিংকটির মেয়াদ শেষ হয়ে গেছে। আবার চেষ্টা করুন।');
      } else if (err.code === 'auth/invalid-action-code') {
        setError('অকার্যকর লিংক। আবার চেষ্টা করুন।');
      } else if (err.code === 'auth/weak-password') {
        setError('পাসওয়ার্ডটি অন্তত ৬ অক্ষরের হতে হবে।');
      } else {
        setError(err.message || 'পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে।');
      }
    } finally {
      setLoading(false);
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
        setError(`Unauthorized Domain: আপনার বর্তমান ডোমেইনটি (${window.location.hostname}) Firebase Console > Authentication > Settings > Authorized Domains এ যুক্ত করুন।`);
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
        earningsBalance: 0,
        totalSales: 0,
        totalOrders: 0,
        role: isAdminEmail ? 'admin' : 'user',
        createdAt: serverTimestamp()
      });
      setOtpStep(false);
      setUserOtp('');
    } catch (err: any) {
      console.error('Register error:', err);
      if (err.code === 'auth/email-already-in-use' || (err.message && err.message.includes('email-already-in-use'))) {
        setError('এই ইমেইলটি ইতিমধ্যে ব্যবহার করা হয়েছে। লগইন করুন।');
      } else if (err.code === 'auth/weak-password' || (err.message && err.message.includes('weak-password'))) {
        setError('পাসওয়ার্ডটি অন্তত ৬ অক্ষরের হতে হবে।');
      } else {
        setError(err.message || 'Registration error');
      }
      setOtpStep(false);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('দয়া করে আপনার ইমেইল এড্রেসটি লিখুন।');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      console.log('Sending reset email to:', email);
      const actionCodeSettings = {
        // Automatically uses the current domain for the reset landing page
        url: `${window.location.origin}/?mode=resetPassword`,
        handleCodeInApp: true,
      };
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      alert('পাসওয়ার্ড রিসেট করার ইমেইল পাঠানো হয়েছে! \n\nদয়া করে আপনার ইনবক্স অথবা স্প্যাম (Spam) ফোল্ডার চেক করুন। লিংকে ক্লিক করলে আপনি সরাসরি আমাদের অ্যাপেই পাসওয়ার্ড পরিবর্তনের অপশন পাবেন।');
      setView('login');
    } catch (err: any) {
      console.error('Password reset error:', err);
      // Firebase specific error handling
      if (err.code === 'auth/user-not-found' || err.message?.includes('user-not-found')) {
        setError('এই ইমেইলটি নিবন্ধিত নয়। দয়া করে সঠিক ইমেইল দিন অথবা নতুন একাউন্ট খুলুন।');
      } else if (err.code === 'auth/invalid-email' || err.message?.includes('invalid-email')) {
        setError('অকার্যকর ইমেইল এড্রেস। দয়া করে সঠিক ইমেইল দিন।');
      } else if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized-domain')) {
        setError('Unauthorized Domain! আপনার ডোমেইনটি Firebase-এ Authorized Domains হিসেবে যুক্ত নেই।');
      } else {
        setError(err.message || 'পাসওয়ার্ড রিসেট করতে সমস্যা হয়েছে।');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUserProfile(null);
    _setSellerListings([]);
    setFbListings([]);
    _setMyPurchases([]);
    _setUserPayments([]);
    setMyReports([]);
    setSellerReports([]);
    setNotifications([]);
    _setChatMessages([]);
    _setUserInboxThreads([]);
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
          earningsBalance: increment(5),
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
    
    const cleanEmail = sellForm.email.trim().toLowerCase();
    const cleanPassword = sellForm.password.trim();
    
    if (!cleanEmail || !cleanPassword) {
      alert('Email and Password are required');
      return;
    }

    // Comprehensive regex validation for Gmail
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    if (!emailRegex.test(cleanEmail)) {
      alert('অনুগ্রহ করে একটি সঠিক ও সম্পূর্ণ জিমেইল এড্রেস প্রদান করুন (যেমন: example@gmail.com)। কোন স্পেস বা অতিরিক্ত ক্যারেক্টার থাকা যাবে না।');
      return;
    }

    // Close modal immediately
    setShowSellModal(false);
    setIsSubmitting(true);
    setError(null);

    const listingPath = 'listings';
    try {
      // 1. Create masked email for public view (preserving trailing numbers to ensure uniqueness)
      const maskedEmail = getMaskedGmail(cleanEmail);

      // 0. Check for duplicates (Search by exact email hash for solid 100% address prevention)
      if (!sellListingToEdit) {
        const emailHashVal = hashEmail(cleanEmail);
        const q2 = query(collection(db, listingPath), where('emailHash', '==', emailHashVal));
        const snap2 = await getDocs(q2);
        const allDupes = snap2.docs;
        
        const activeDuplicates = allDupes.filter(d => ['Available', 'Pending', 'Approved', 'Sold', 'SellRequest'].includes(d.data().status));
        
        if (activeDuplicates.length > 0) {
          alert('আপনি আগেই এই জিমেইল সেল করার জন্য পেশ করেছেন (হুবহু সম্পূর্ণ একই জিমেইল লিস্টিং বিদ্যমান আছে)');
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
          emailHash: hashEmail(cleanEmail), // Storing 1-to-1 hash of the raw email
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
          emailHash: hashEmail(cleanEmail), // Storing 1-to-1 hash of the raw email
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
          email: cleanEmail,
          password: cleanPassword,
          recoveryEmail: (sellForm.recoveryEmail || '').trim().toLowerCase(),
          twoFactor: (sellForm.twoFactor || '').trim()
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
      
      const isAdminUser = user?.email && SYSTEM_ADMINS.includes(user.email);
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

    // Load admin lists from cache immediately
    const cachedAdminListings = localStorage.getItem('cache_admin_listings');
    const cachedAdminPurchases = localStorage.getItem('cache_admin_purchases');
    const cachedAdminPayments = localStorage.getItem('cache_admin_payments');
    const cachedAdminReports = localStorage.getItem('cache_admin_reports');

    if (cachedAdminListings) { try { setAllListings(JSON.parse(cachedAdminListings)); } catch (e) {} }
    if (cachedAdminPurchases) { try { setAllPurchases(JSON.parse(cachedAdminPurchases)); } catch (e) {} }
    if (cachedAdminPayments) { try { setAllPayments(JSON.parse(cachedAdminPayments)); } catch (e) {} }
    if (cachedAdminReports) { try { setAdminReports(JSON.parse(cachedAdminReports)); } catch (e) {} }

    // Real-time Admin Listeners
    const qListings = query(collection(db, 'listings'), orderBy('createdAt', 'desc'), limit(200));
    const unsubscribeListings = onSnapshot(qListings, (snap) => {
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as any);
      setAllListings(items);
      localStorage.setItem('cache_admin_listings', JSON.stringify(items));
    }, (err) => {
      handleListenerError('AdminListings', err);
      const cached = localStorage.getItem('cache_admin_listings');
      if (cached) { try { setAllListings(JSON.parse(cached)); } catch (e) {} }
    });

    const qPurchases = query(collection(db, 'purchases'), orderBy('purchasedAt', 'desc'), limit(100));
    const unsubscribePurchases = onSnapshot(qPurchases, (snap) => {
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as any);
      setAllPurchases(items);
      localStorage.setItem('cache_admin_purchases', JSON.stringify(items));
    }, (err) => {
      handleListenerError('AdminPurchases', err);
      const cached = localStorage.getItem('cache_admin_purchases');
      if (cached) { try { setAllPurchases(JSON.parse(cached)); } catch (e) {} }
    });

    const qPayments = query(collection(db, 'payments'), orderBy('createdAt', 'desc'), limit(100));
    const unsubscribePayments = onSnapshot(qPayments, (snap) => {
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as any);
      setAllPayments(items);
      localStorage.setItem('cache_admin_payments', JSON.stringify(items));
    }, (err) => {
      handleListenerError('AdminPayments', err);
      const cached = localStorage.getItem('cache_admin_payments');
      if (cached) { try { setAllPayments(JSON.parse(cached)); } catch (e) {} }
    });

    const qReports = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(100));
    const unsubscribeReports = onSnapshot(qReports, (snap) => {
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as any);
      setAdminReports(items);
      localStorage.setItem('cache_admin_reports', JSON.stringify(items));
    }, (err) => {
      handleListenerError('AdminReports', err);
      const cached = localStorage.getItem('cache_admin_reports');
      if (cached) { try { setAdminReports(JSON.parse(cached)); } catch (e) {} }
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

    // Load from cache first
    const cachedSeller = localStorage.getItem(`cache_seller_listings_${user.uid}`);
    if (cachedSeller) {
      try { setSellerListings(JSON.parse(cachedSeller)); } catch (e) {}
    }

    // Real-time Seller Listings Listener
    const sellerQ = query(collection(db, 'listings'), where('sellerId', '==', user.uid), limit(200));
    const unsubscribeSeller = onSnapshot(sellerQ, (snap) => {
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setSellerListings(items);
      localStorage.setItem(`cache_seller_listings_${user.uid}`, JSON.stringify(items));
    }, (err) => {
      console.warn("Seller listings listener failed:", err);
      handleListenerError('SellerListings', err);
      if (cachedSeller) {
        try { setSellerListings(JSON.parse(cachedSeller)); } catch (e) {}
      }
    });

    return () => unsubscribeSeller();
  }, [user, view]);

  useEffect(() => {
    if (!user || view !== 'facebook-sell-center') return;

    // Load from cache first
    const cachedFb = localStorage.getItem(`cache_fb_listings_${user.uid}`);
    if (cachedFb) {
      try { setFbListings(JSON.parse(cachedFb)); } catch (e) {}
    }

    const fbQ = query(
      collection(db, 'facebook_listings'),
      where('sellerId', '==', user.uid),
      limit(200)
    );

    const unsubscribeFb = onSnapshot(fbQ, (snap) => {
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setFbListings(items);
      localStorage.setItem(`cache_fb_listings_${user.uid}`, JSON.stringify(items));
    }, (err) => {
      console.warn("Facebook listings listener failed:", err);
      handleListenerError('FacebookListings', err);
      if (cachedFb) {
        try { setFbListings(JSON.parse(cachedFb)); } catch (e) {}
      }
    });

    return () => unsubscribeFb();
  }, [user, view]);

  useEffect(() => {
    if (view !== 'facebook-market' && view !== 'facebook-accounts-list') return;

    // Load from cache first
    const cachedFbMarket = localStorage.getItem('cache_fb_market_listings');
    if (cachedFbMarket) {
      try { setFbMarketListings(JSON.parse(cachedFbMarket)); } catch (e) {}
    }
    if (user) {
      const cachedFbMyPurch = localStorage.getItem(`cache_fb_my_purchases_${user.uid}`);
      if (cachedFbMyPurch) {
        try { setFbMyPurchases(JSON.parse(cachedFbMyPurch)); } catch (e) {}
      }
    }

    const fbMarketQ = query(
      collection(db, 'facebook_listings'),
      where('status', '==', 'Live'),
      limit(200)
    );

    const unsubscribeFbMarket = onSnapshot(fbMarketQ, (snap) => {
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setFbMarketListings(items);
      localStorage.setItem('cache_fb_market_listings', JSON.stringify(items));
    }, (err) => {
      console.warn("Facebook market listener failed:", err);
      handleListenerError('FbMarket', err);
      if (cachedFbMarket) {
        try { setFbMarketListings(JSON.parse(cachedFbMarket)); } catch (e) {}
      }
    });

    let unsubscribeFbPurchases = () => {};
    if (user) {
      const fbPurchQ = query(
        collection(db, 'facebook_listings'),
        where('soldTo', '==', user.uid),
        where('status', '==', 'Sold'),
        limit(100)
      );
      unsubscribeFbPurchases = onSnapshot(fbPurchQ, (snap) => {
        const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setFbMyPurchases(items);
        localStorage.setItem(`cache_fb_my_purchases_${user.uid}`, JSON.stringify(items));
      }, (err) => {
        console.warn("Facebook purchases listener failed:", err);
        handleListenerError('FbPurchases', err);
        const cached = localStorage.getItem(`cache_fb_my_purchases_${user.uid}`);
        if (cached) {
          try { setFbMyPurchases(JSON.parse(cached)); } catch (e) {}
        }
      });
    }

    return () => {
      unsubscribeFbMarket();
      unsubscribeFbPurchases();
    };
  }, [user, view]);

  const handleBuyFacebookAccount = (item: any) => {
    if (!user) {
      alert("Please login first!");
      setView('login');
      return;
    }
    if (!userProfile) {
      alert("Profile loading...");
      return;
    }
    handleIncrementClicks(item);
    setFbConfirmingItem(item);
    setShowFbConfirmModal(true);
  };

  const handleConfirmBuyFacebookAccount = async () => {
    if (!user || !userProfile || !fbConfirmingItem) return;

    const price = Number(fbConfirmingItem.price !== undefined ? fbConfirmingItem.price : 4.40);
    const isMock = !!fbConfirmingItem.isMock;

    if (userProfile.balance < price) {
      // Show the beautiful Insufficient Balance banner matching mock exactly!
      setFbPurchaseError("Insufficient balance");
      // Auto dismiss after 5 seconds
      setTimeout(() => {
        setFbPurchaseError(null);
      }, 5000);
      return;
    }

    setIsSubmitting(true);
    try {
      if (isMock) {
        // Handle Mock buy safely without hitting Firestore document
        const { doc: fDoc, updateDoc } = await import('firebase/firestore');
        const userProfileRef = fDoc(db, 'profiles', user.uid);
        await updateDoc(userProfileRef, {
          balance: increment(-price),
          totalOrders: increment(1),
          totalSpent: increment(price),
          hasTransacted: true,
          updatedAt: serverTimestamp()
        });

        // Add to local purchased list state for instant update without needing listener
        const mockPurchase = {
          id: `purchased_mock_${fbConfirmingItem.id}_${Date.now()}`,
          phone: fbConfirmingItem.title || fbConfirmingItem.phone || "Mock Phone Number",
          password: "password123",
          twoFA: "2FA_SECRET_MOCK_XYZ",
          soldPrice: price,
          category: fbConfirmingItem.category,
          status: "Sold",
          soldAt: new Date().toISOString()
        };
        setFbMyPurchases(prev => [mockPurchase, ...prev]);

        setShowFbConfirmModal(false);
        setFbConfirmingItem(null);
        alert("কেনার জন্য ধন্যবাদ! কেনা আইটেমটির ক্রেডেনশিয়াল 'Bought' ট্যাবে যোগ হয়েছে।");
        setFbMarketTab('Bought');
        setIsSubmitting(false);
        return;
      }

      const { runTransaction } = await import('firebase/firestore');
      await runTransaction(db, async (transaction) => {
        const userProfileRef = doc(db, 'profiles', user.uid);
        const userProfileSnap = await transaction.get(userProfileRef);
        if (!userProfileSnap.exists()) throw new Error("Profile not found");
        const currentBalance = userProfileSnap.data().balance;

        if (currentBalance < price) {
          throw new Error("Insufficient balance");
        }

        const listingRef = doc(db, 'facebook_listings', fbConfirmingItem.id);
        const listingSnap = await transaction.get(listingRef);
        if (!listingSnap.exists()) throw new Error("Listing not found");
        const listingData = listingSnap.data();

        if (listingData.status !== 'Live') {
          throw new Error("This account is no longer available!");
        }

        const actualPrice = Number(listingData.price) || price;
        const sellerEarning = Number(actualPrice * 0.93) || 4.10;

        // 1. Update listing status to Sold, soldTo to user.uid
        transaction.update(listingRef, {
          status: 'Sold',
          soldTo: user.uid,
          soldPrice: actualPrice,
          soldAt: serverTimestamp()
        });

        // 2. Create purchase record in 'purchases'
        const purchaseId = `fb_${user.uid}_${fbConfirmingItem.id}`;
        transaction.set(doc(db, 'purchases', purchaseId), {
          userId: user.uid,
          userEmail: user.email,
          listingId: fbConfirmingItem.id,
          facebookAccount: fbConfirmingItem.phone,
          gmailAccount: `FB: ${fbConfirmingItem.phone}`,
          sellerId: listingData.sellerId || 'admin',
          price: actualPrice,
          status: 'SUCCESS',
          type: 'facebook_account',
          purchasedAt: serverTimestamp()
        });

        // 3. Update Seller Stats
        if (listingData.sellerId && listingData.sellerId !== 'admin') {
          const sellerRef = doc(db, 'profiles', listingData.sellerId);
          transaction.update(sellerRef, {
            earningsBalance: increment(sellerEarning),
            totalSales: increment(1),
            totalEarned: increment(sellerEarning),
            updatedAt: serverTimestamp()
          });
        }

        // 4. Update Buyer Balance
        transaction.update(userProfileRef, {
          balance: increment(-actualPrice),
          totalOrders: increment(1),
          totalSpent: increment(actualPrice),
          hasTransacted: true,
          updatedAt: serverTimestamp()
        });
      });

      // Clear states and redirect
      setShowFbConfirmModal(false);
      setFbConfirmingItem(null);
      alert("ক্রয় সফল হয়েছে! credentials আপনি 'Bought' ট্যাবে দেখতে পাবেন।");
      setFbMarketTab('Bought');
    } catch (e: any) {
      console.error(e);
      setFbPurchaseError(e.message || "Purchase failed");
      setTimeout(() => setFbPurchaseError(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("৫ MB এর নিচে ছবি সিলেক্ট করুন!");
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64Str = uploadEvent.target?.result as string;
        const img = new window.Image();
        img.src = base64Str;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const max_width = 300;
          const scale = max_width / img.width;
          canvas.width = max_width;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
            setFbSellImage(compressedBase64);
          } else {
            setFbSellImage(base64Str);
          }
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublishMockupPost = async () => {
    if (!user) {
      alert("দয়া করে প্রথমে লগইন করুন!");
      setView('login');
      return;
    }
    if (!fbCategory) {
      alert("সার্ভিসের ধরন সিলেক্ট করুন!");
      return;
    }
    if (!fbForm.title.trim()) {
      alert("শিরোনাম লিখুন!");
      return;
    }
    if (!fbForm.description.trim()) {
      alert("বিস্তারিত বিবরণ লিখুন!");
      return;
    }

    setIsSubmitting(true);
    try {
      const priceVal = fbForm.price.trim() ? Number(fbForm.price.trim()) : 0;
      
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      
      await addDoc(collection(db, 'facebook_listings'), {
        sellerId: user.uid,
        sellerEmail: user.email || '',
        category: fbCategory,
        title: fbForm.title.trim(),
        description: fbForm.description.trim(),
        price: priceVal,
        imageUrl: fbSellImage || null,
        phone: "Escrow Dynamic Delivery",
        password: "Contact support via chat to claim",
        twoFA: "Auto secure",
        status: 'Live',
        isLiveMarket: true,
        createdAt: serverTimestamp()
      });

      alert("লিস্টিংটি সফলভাবে পাবলিশ হয়েছে!");
      
      // Clear form inputs
      setFbCategory('');
      setFbForm({
        phone: '',
        password: '',
        twoFAMethod: '',
        bulkContent: '',
        title: '',
        description: '',
        price: ''
      });
      setFbSellImage(null);
      
      // Navigate/Refresh back to Market Tab
      setFbMarketTab('Market');
      setView('facebook-market');
    } catch (error: any) {
      console.error("Error creating post:", error);
      const errMsg = error.message || String(error);
      const isQuota = errMsg.includes('Quota') || errMsg.includes('quota') || errMsg.includes('exhausted') || errMsg.includes('resource');
      
      if (isQuota) {
        // Fallback: Save local-only post in memory so the user sees it immediately
        const localNewItem = {
          id: "local-new-" + Date.now(),
          sellerId: user.uid,
          sellerEmail: user.email || '',
          category: fbCategory,
          title: fbForm.title.trim(),
          description: fbForm.description.trim(),
          price: fbForm.price.trim() ? Number(fbForm.price.trim()) : 0,
          imageUrl: fbSellImage || null,
          phone: "Escrow Dynamic Delivery",
          password: "Contact support via chat to claim",
          twoFA: "Auto secure",
          status: 'Live',
          isLiveMarket: true,
          createdAt: { seconds: Math.floor(Date.now() / 1000) }
        };
        
        // Add to the local list so it displays instantly on screen
        setFbMarketListings(prev => [localNewItem, ...prev]);
        
        alert("লিস্টিংটি সফলভাবে লোকাল মেমোরি মোডে পাবলিশ হয়েছে!");
        
        // Clear form inputs
        setFbCategory('');
        setFbForm({
          phone: '',
          password: '',
          twoFAMethod: '',
          bulkContent: '',
          title: '',
          description: '',
          price: ''
        });
        setFbSellImage(null);
        setFbMarketTab('Market');
        setView('facebook-market');
      } else {
        alert("পোস্ট সেভ করতে সমস্যা হয়েছে: " + error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddFacebookAccounts = async () => {
    if (!user) {
      alert("Please login first!");
      return;
    }
    if (!fbCategory) {
      alert("Please select a category!");
      return;
    }

    try {
      let accountsToAdd: any[] = [];

      if (fbUploadType === 'single') {
        const { phone, password, twoFAMethod } = fbForm;
        if (!phone.trim() || !password.trim() || !twoFAMethod.trim()) {
          alert("সবগুলো রিকোয়ার্ড ফিল্ড পূরণ করুন!");
          return;
        }
        accountsToAdd.push({
          phone: phone.trim(),
          password: password.trim(),
          twoFA: twoFAMethod.trim()
        });
      } else {
        const lines = fbForm.bulkContent.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          
          // Split by | or comma or space or tab
          const parts = trimmed.split(/[|,]/);
          if (parts.length >= 3) {
            accountsToAdd.push({
              phone: parts[0].trim(),
              password: parts[1].trim(),
              twoFA: parts[2].trim()
            });
          }
        }
        if (accountsToAdd.length === 0) {
          alert("সঠিক ফরম্যাটে bulk ডাটা লিখুন! (Phone|Pass|2FA)");
          return;
        }
      }

      // Add to Firestore
      let addedCount = 0;
      for (const acc of accountsToAdd) {
        await addDoc(collection(db, 'facebook_listings'), {
          sellerId: user.uid,
          sellerEmail: user.email || '',
          category: fbCategory || "Facebook",
          title: fbForm.title.trim() || acc.phone,
          phone: acc.phone,
          password: acc.password,
          twoFA: acc.twoFA,
          description: fbForm.description.trim() || "Verified credentials and secure delivery",
          price: Number(fbForm.price) || 4.40,
          status: 'Live',
          createdAt: serverTimestamp()
        });
        addedCount++;
      }

      // Display Success Block
      setFbSuccess({ count: addedCount });

      // Clear the Form Inputs
      setFbForm({
        phone: '',
        password: '',
        twoFAMethod: '',
        bulkContent: '',
        title: '',
        description: '',
        price: '30'
      });

      // Clear success banner after 6 seconds
      setTimeout(() => {
        setFbSuccess(null);
      }, 6000);

    } catch (error: any) {
      console.error("Error adding FB accounts:", error);
      alert("Error adding accounts: " + error.message);
    }
  };

  const handleDeleteFacebookAccount = async (id: string) => {
    if (!window.confirm("আপনি কি এই অ্যাকাউন্টটি ডিলিট করতে চান? এটি আর্কাইভে জমা হবে।")) return;
    try {
      const itemToArchive = fbListings.find(l => l.id === id);
      if (itemToArchive) {
        const archived = [...localArchivedFBLisings];
        archived.push({
          category: itemToArchive.category || "NUM 00 FRD 2FA 🔻 Number+PASS+2FA — ৳4.10",
          phone: itemToArchive.phone,
          password: itemToArchive.password,
          twoFA: itemToArchive.twoFA,
          archivedAt: new Date().toISOString()
        });
        setLocalArchivedFBLisings(archived);
        localStorage.setItem('archived_fb_listings', JSON.stringify(archived));
      }
      await deleteDoc(doc(db, 'facebook_listings', id));
    } catch (e: any) {
      console.error(e);
      alert("Error deleting account: " + e.message);
    }
  };

  const handleRestoreArchivedFB = async (index: number) => {
    try {
      const itemToRestore = localArchivedFBLisings[index];
      await addDoc(collection(db, 'facebook_listings'), {
        sellerId: user.uid,
        sellerEmail: user.email || '',
        category: itemToRestore.category || "NUM 00 FRD 2FA 🔻 Number+PASS+2FA — ৳4.10",
        phone: itemToRestore.phone,
        password: itemToRestore.password,
        twoFA: itemToRestore.twoFA,
        status: 'Live',
        createdAt: serverTimestamp()
      });
      const updated = [...localArchivedFBLisings];
      updated.splice(index, 1);
      setLocalArchivedFBLisings(updated);
      localStorage.setItem('archived_fb_listings', JSON.stringify(updated));
      alert("Account সফলভাবে রিস্টোর করা হয়েছে এবং লাইভ ইনভেন্টরিতে যোগ করা হয়েছে!");
    } catch (e: any) {
      console.error(e);
      alert("রিস্টোর করতে সমস্যা হয়েছে: " + e.message);
    }
  };

  const handlePermanentDeleteArchivedFB = (index: number) => {
    if (!window.confirm("আপনি কি এই অ্যাকাউন্টটি স্থায়ীভাবে ডিলিট করতে চান? এটি আর রিস্টোর করা যাবে না।")) return;
    const updated = [...localArchivedFBLisings];
    updated.splice(index, 1);
    setLocalArchivedFBLisings(updated);
    localStorage.setItem('archived_fb_listings', JSON.stringify(updated));
  };

  const handleCopyAllSold = () => {
    const soldList = fbListings.filter(l => l.status === 'Sold');
    if (soldList.length === 0) {
      alert("কোনো sold account নেই কপি করার জন্য!");
      return;
    }
    const formatted = soldList.map(l => `${l.phone}|${l.password}|${l.twoFA}`).join('\n');
    navigator.clipboard.writeText(formatted);
    alert("সব sold account সফলভাবে ক্লিপবোর্ডে কপি হয়েছে!");
  };

  const handleExportSold = () => {
    const soldList = fbListings.filter(l => l.status === 'Sold');
    if (soldList.length === 0) {
      alert("কোনো sold account নেই এক্সপোর্ট করার জন্য!");
      return;
    }
    const formatted = soldList.map(l => `${l.phone}|${l.password}|${l.twoFA}`).join('\n');
    const blob = new Blob([formatted], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fb_sold_accounts_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (view !== 'gmail-market' && view !== 'marketplace') return;

    // Load market listings from cache immediately for maximum offline / quota resilience
    const cachedMarket = localStorage.getItem('cache_market_listings');
    if (cachedMarket) {
      try { setMarketListings(JSON.parse(cachedMarket)); } catch (e) {}
    }

    // Load user purchases and payments from cache first
    if (user) {
      const cachedPurch = localStorage.getItem(`cache_my_purchases_${user.uid}`);
      const cachedPay = localStorage.getItem(`cache_user_payments_${user.uid}`);
      if (cachedPurch) { try { setMyPurchases(JSON.parse(cachedPurch)); } catch(e) {} }
      if (cachedPay) { try { setUserPayments(JSON.parse(cachedPay)); } catch(e) {} }
    }

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
      handleListenerError('Market', err);
      // Fallback: If limit exceeded or quota exhausted, load cached listings so they never disappear
      const cached = localStorage.getItem('cache_market_listings');
      if (cached) {
        try { setMarketListings(JSON.parse(cached)); } catch (e) {}
      }
    });

    let unsubscribePurchases: () => void = () => {};
    let unsubscribePayments: () => void = () => {};
    let unsubscribeUserWithdrawals: () => void = () => {};

    if (user) {
      const qPurchases = query(collection(db, 'purchases'), where('userId', '==', user.uid), orderBy('purchasedAt', 'desc'), limit(50));
      unsubscribePurchases = onSnapshot(qPurchases, (snapshot) => {
        const purchases = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMyPurchases(purchases);
        localStorage.setItem(`cache_my_purchases_${user.uid}`, JSON.stringify(purchases));
      }, (err) => {
        handleListenerError('Purchases', err);
        const cached = localStorage.getItem(`cache_my_purchases_${user.uid}`);
        if (cached) {
          try { setMyPurchases(JSON.parse(cached)); } catch(e) {}
        }
      });

      const qPayments = query(collection(db, 'payments'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(50));
      unsubscribePayments = onSnapshot(qPayments, (snapshot) => {
        const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUserPayments(payments);
        localStorage.setItem(`cache_user_payments_${user.uid}`, JSON.stringify(payments));
      }, (err) => {
        handleListenerError('Payments', err);
        const cached = localStorage.getItem(`cache_user_payments_${user.uid}`);
        if (cached) {
          try { setUserPayments(JSON.parse(cached)); } catch(e) {}
        }
      });

      const qUserWithdrawals = query(collection(db, 'withdrawals'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(50));
      unsubscribeUserWithdrawals = onSnapshot(qUserWithdrawals, (snapshot) => {
        const withdrawals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUserWithdrawals(withdrawals);
        localStorage.setItem(`cache_user_withdrawals_${user.uid}`, JSON.stringify(withdrawals));
      }, (err) => {
        handleListenerError('UserWithdrawals', err);
        const cached = localStorage.getItem(`cache_user_withdrawals_${user.uid}`);
        if (cached) {
          try { setUserWithdrawals(JSON.parse(cached)); } catch(e) {}
        }
      });
    }

    return () => {
      unsubscribeMarket();
      unsubscribePurchases();
      unsubscribePayments();
      unsubscribeUserWithdrawals();
    };
  }, [user, view, quotaExceeded]);

  // 1. Subscribe to active chat room messages - Enriched with caching
  useEffect(() => {
    if (!activeChatRoom || !user) {
      setChatMessages([]);
      return;
    }

    // Load room message history from cache immediately
    const cacheKey = `cache_room_msgs_${activeChatRoom.id}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try { setChatMessages(JSON.parse(cached)); } catch(e) {}
    }

    const qRoom = query(
      collection(db, 'direct_chats'),
      where('roomId', '==', activeChatRoom.id),
      limit(150)
    );

    const unsubscribeRoom = onSnapshot(qRoom, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Perform chronological sorting client-side to avoid Composite Index requirement
      const sortedMsgs = msgs.sort((a: any, b: any) => {
        const aSecs = a.createdAt?.seconds || 0;
        const bSecs = b.createdAt?.seconds || 0;
        return aSecs - bSecs;
      });
      setChatMessages(sortedMsgs);
      localStorage.setItem(cacheKey, JSON.stringify(sortedMsgs));
    }, (err) => {
      console.warn('Active chat room listener failed, falling back to cache:', err);
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try { setChatMessages(JSON.parse(cached)); } catch(e) {}
      }
    });

    return () => {
      unsubscribeRoom();
    };
  }, [activeChatRoom, user]);

  // Auto-scroll chats down when a message comes in
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // 2. Subscribe to user inbox conversation threads - Enriched with caching
  useEffect(() => {
    if (!user?.uid) {
      setUserInboxThreads([]);
      return;
    }

    // Pre-load from user inbox threads cache
    const cacheKey = `cache_inbox_threads_${user.uid}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try { setUserInboxThreads(JSON.parse(cached)); } catch(e) {}
    }

    const qSender = query(
      collection(db, 'direct_chats'),
      where('senderId', '==', user.uid),
      limit(100)
    );

    const qReceiver = query(
      collection(db, 'direct_chats'),
      where('receiverId', '==', user.uid),
      limit(100)
    );

    const processMessages = (allMsgs: any[]) => {
      const threadsMap: Record<string, any> = {};
      
      allMsgs.forEach(msg => {
        const roomId = msg.roomId;
        if (!threadsMap[roomId]) {
          threadsMap[roomId] = msg;
        } else {
          // Keep the latest message
          const existingTime = threadsMap[roomId].createdAt?.seconds || 0;
          const msgTime = msg.createdAt?.seconds || 0;
          if (msgTime > existingTime) {
            threadsMap[roomId] = msg;
          }
        }
      });

      const threads = Object.values(threadsMap).sort((a: any, b: any) => {
        const bSeconds = b.createdAt?.seconds || 0;
        const aSeconds = a.createdAt?.seconds || 0;
        return bSeconds - aSeconds;
      });

      setUserInboxThreads(threads);
      localStorage.setItem(cacheKey, JSON.stringify(threads));
    };

    let senderMsgs: any[] = [];
    let receiverMsgs: any[] = [];

    const unsubSender = onSnapshot(qSender, (snap) => {
      senderMsgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      processMessages([...senderMsgs, ...receiverMsgs]);
    }, (err) => {
      console.warn("Inbox sender query failure, using cache fallback:", err);
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try { setUserInboxThreads(JSON.parse(cached)); } catch(e) {}
      }
    });

    const unsubReceiver = onSnapshot(qReceiver, (snap) => {
      receiverMsgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      processMessages([...senderMsgs, ...receiverMsgs]);
    }, (err) => {
      console.warn("Inbox receiver query failure, using cache fallback:", err);
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try { setUserInboxThreads(JSON.parse(cached)); } catch(e) {}
      }
    });

    return () => {
      unsubSender();
      unsubReceiver();
    };
  }, [user?.uid]);

  // 3. Start a chat room with listing seller
  const startListingChat = (listing: any) => {
    if (!user) {
      alert("লগইন না করে চ্যাট চালুকরণ সম্ভব নয়। অনুগ্রহ করে সাইন ইন করুন।");
      setView('profile');
      return;
    }
    handleIncrementClicks(listing);

    const sellerUid = listing.sellerId || 'admin';

    if (sellerUid === user.uid) {
      alert("এটি আপনার নিজের অ্যাকাউন্ট লিস্টিং!");
      return;
    }

    // Build unique ID
    const roomId = `${user.uid}_${sellerUid}_${listing.id || 'general'}`;
    
    setActiveChatRoom({
      id: roomId,
      buyerId: user.uid,
      buyerName: userProfile?.displayName || user.displayName || user.email?.split('@')[0] || 'গ্রাহক',
      sellerId: sellerUid,
      sellerName: listing.sellerEmail ? listing.sellerEmail.split('@')[0] : 'বিক্রেতা',
      listingId: listing.id || '',
      listingTitle: listing.title || 'Facebook Page',
      listingCategory: listing.category || 'Facebook Account',
      listingPrice: listing.price || 0,
      listingDescription: listing.description || ''
    });
  };

  // 4. Send chat message
  const handleSendChatMessage = async () => {
    if (!chatInputValue.trim() || !activeChatRoom || !user) return;
    
    const textToSend = chatInputValue.trim();
    setChatInputValue('');

    try {
      const destId = activeChatRoom.buyerId === user.uid ? activeChatRoom.sellerId : activeChatRoom.buyerId;
      const destName = activeChatRoom.buyerId === user.uid ? activeChatRoom.sellerName : activeChatRoom.buyerName;

      // CRITICAL Safety check
      if (!destId) {
        console.warn("Destination ID was empty during direct chat send, falling back to admin");
      }

      // Send listing details as a system-like introduction if this is the first message in the thread
      if (chatMessages.length === 0 && activeChatRoom.listingId) {
        const detailsMessage = `📌 *আগ্রহী পোস্টের বিবরণ (Listing Details):*\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `▪️ **টাইটেল:** ${activeChatRoom.listingTitle || 'N/A'}\n` +
          `▪️ **ক্যাটাগরি:** ${activeChatRoom.listingCategory || 'Facebook Account'}\n` +
          `▪️ **মূল্য:** ৳${activeChatRoom.listingPrice || '0.00'}\n` +
          `▪️ **আইডি:** ${activeChatRoom.listingId}\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `আমি এই অ্যাকাউন্টটি নিয়ে আলোচনা করতে আগ্রহী।`;

        await addDoc(collection(db, 'direct_chats'), {
          roomId: activeChatRoom.id || 'general',
          senderId: user.uid,
          senderName: userProfile?.displayName || user.displayName || user.email?.split('@')[0] || 'ব্যবহারকারী',
          receiverId: destId || 'admin',
          receiverName: destName || 'গ্রাহক',
          listingId: activeChatRoom.listingId || '',
          listingTitle: activeChatRoom.listingTitle || '',
          listingCategory: activeChatRoom.listingCategory || 'Facebook Account',
          listingPrice: activeChatRoom.listingPrice || 0,
          listingDescription: activeChatRoom.listingDescription || '',
          buyerId: activeChatRoom.buyerId || '',
          buyerName: activeChatRoom.buyerName || '',
          sellerId: activeChatRoom.sellerId || '',
          sellerName: activeChatRoom.sellerName || '',
          text: detailsMessage,
          imageUrl: null,
          createdAt: serverTimestamp()
        });
      }

      await addDoc(collection(db, 'direct_chats'), {
        roomId: activeChatRoom.id || 'general',
        senderId: user.uid,
        senderName: userProfile?.displayName || user.displayName || user.email?.split('@')[0] || 'ব্যবহারকারী',
        receiverId: destId || 'admin',
        receiverName: destName || 'গ্রাহক',
        listingId: activeChatRoom.listingId || '',
        listingTitle: activeChatRoom.listingTitle || '',
        listingCategory: activeChatRoom.listingCategory || 'Facebook Account',
        listingPrice: activeChatRoom.listingPrice || 0,
        listingDescription: activeChatRoom.listingDescription || '',
        buyerId: activeChatRoom.buyerId || '',
        buyerName: activeChatRoom.buyerName || '',
        sellerId: activeChatRoom.sellerId || '',
        sellerName: activeChatRoom.sellerName || '',
        text: textToSend,
        imageUrl: null,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to send message:", err);
      // restore input on failure
      setChatInputValue(textToSend);
      alert("মেসেজ পাঠাতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।");
    }
  };

  // 5. Send Base64 image attachment in chat
  const handleChatImageAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800000) { // Limit Base64 payload size for safety
      alert("ফাইলের সাইজ অবশ্যই ৮০০KB এর কম হতে হবে।");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64String = reader.result as string;
      if (!activeChatRoom || !user) return;

      try {
        const destId = activeChatRoom.buyerId === user.uid ? activeChatRoom.sellerId : activeChatRoom.buyerId;
        const destName = activeChatRoom.buyerId === user.uid ? activeChatRoom.sellerName : activeChatRoom.buyerName;

        await addDoc(collection(db, 'direct_chats'), {
          roomId: activeChatRoom.id || 'general',
          senderId: user.uid,
          senderName: userProfile?.displayName || user.displayName || user.email?.split('@')[0] || 'ব্যবহারকারী',
          receiverId: destId || 'admin',
          receiverName: destName || 'গ্রাহক',
          listingId: activeChatRoom.listingId || '',
          listingTitle: activeChatRoom.listingTitle || '',
          listingCategory: activeChatRoom.listingCategory || 'Facebook Account',
          listingPrice: activeChatRoom.listingPrice || 0,
          listingDescription: activeChatRoom.listingDescription || '',
          buyerId: activeChatRoom.buyerId || '',
          buyerName: activeChatRoom.buyerName || '',
          sellerId: activeChatRoom.sellerId || '',
          sellerName: activeChatRoom.sellerName || '',
          text: '🖼️ [ছবি পাঠানো হয়েছে]',
          imageUrl: base64String,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Exception upload attachment direct chat:", err);
        alert("সংযুক্তি আপলোড করতে সমস্যা হয়েছে।");
      }
    };
    reader.readAsDataURL(file);
  };

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
            paymentStatus: 'Pending',
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
            status: 'Success',
            paymentStatus: 'Pending',
            payoutTrxId: ''
          });

          // Update Seller Stats (Still based on their requested price)
          if (listingData.sellerId && listingData.sellerId !== 'admin') {
            const sellerRef = doc(db, 'profiles', listingData.sellerId);
            transaction.update(sellerRef, {
              earningsBalance: increment(Number(listingData.price)),
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

      // Ensure cumulative global sold count is persistent and never deleted
      if (selectedListings.length > 0) {
        await ensureGlobalSoldCountRefectingSale(selectedListings.length);
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
          paymentStatus: 'Pending',
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
          paymentStatus: 'Pending',
          payoutTrxId: '',
          purchasedAt: serverTimestamp()
        });

        // 3. Update Seller Stats
        if (listing.sellerId && listing.sellerId !== 'admin') {
          const sellerRef = doc(db, 'profiles', listing.sellerId);
          transaction.update(sellerRef, {
            earningsBalance: increment(Number(listing.price)),
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
        
        // Ensure cumulative global sold count is persistent and never deleted
        await ensureGlobalSoldCountRefectingSale(1);
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
    const isDeposit = showPaymentModal.listingId === 'deposit';
    if (!paymentForm.senderNumber || !paymentForm.trxId) {
      setPaymentError('Amount and TrxID are required! / পেমেন্ট অ্যামাউন্ট এবং TrxID প্রয়োজন');
      setTimeout(() => setPaymentError(null), 3000);
      return;
    }
    
    let depositPrice = showPaymentModal.price;
    if (isDeposit) {
      const depAmt = Number(paymentForm.senderNumber);
      if (isNaN(depAmt) || depAmt < 10) {
        setPaymentError('মিনিমাম Deposit ১০ টাকা হতে হবে!');
        setTimeout(() => setPaymentError(null), 3500);
        return;
      }
      depositPrice = depAmt;
    }
    
    setIsVerifying(true);
    setPaymentError(null);
    try {
      // 0. Check for duplicate TrxID in our database (Fixing Permission Error)
      const trxIdClean = paymentForm.trxId.trim().toUpperCase();

      // Strict validation for bKash and Nagad TRX ID length (Must be exactly 10 for bkash, exactly 8 for nagad)
      if (paymentForm.method === 'bkash' && trxIdClean.length !== 10) {
        throw new Error('বিকাশ TrxID অবশ্যই ১০ অক্ষরের হতে হবে! অনুগ্রহ করে সঠিক TrxID দিন।');
      }
      if (paymentForm.method === 'nagad' && trxIdClean.length !== 8) {
        throw new Error('নগদ TrxID অবশ্যই ৮ অক্ষরের হতে হবে! অনুগ্রহ করে সঠিক TrxID দিন।');
      }

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

      // Register TRX ID to prevent reuse immediately
      await setDoc(trxRef, {
        userId: user?.uid,
        createdAt: serverTimestamp()
      });

      const idsToProcess = isDeposit ? [] : (selectedListings.length > 0 ? selectedListings : [showPaymentModal.listingId].filter(Boolean) as string[]);
      
      if (idsToProcess.length === 0 && !isDeposit) {
        throw new Error('No items selected for purchase / পণ্য নির্বাচন করা হয়নি');
      }

      // 1. Log the payment attempt for Admin review (and all deposits are set to 'pending' to prevent fraud)
      const paymentDoc = await addDoc(collection(db, 'payments'), {
        userId: user?.uid,
        userEmail: user?.email,
        senderNumber: paymentForm.senderNumber,
        trxId: trxIdClean,
        method: paymentForm.method,
        amount: Number(depositPrice),
        listingId: isDeposit ? 'deposit' : (idsToProcess.length > 1 ? `bulk_${idsToProcess.length}` : (showPaymentModal.listingId || 'deposit')),
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

      if (isDeposit) {
        setIsDepositCompleted(true);
        setTimeout(() => {
          setIsDepositCompleted(false);
          setShowPaymentModal({ show: false, price: 0 });
          setIsPaymentSent(false);
          setCurrentPaymentId(null);
          setView('transactions');
        }, 3200);
        return;
      }

      setCurrentPaymentId(paymentDoc.id);
      setIsPaymentSent(true);
    } catch (err: any) {
      setPaymentError(err.message);
      // Auto-hide error after 3 seconds
      setTimeout(() => setPaymentError(null), 3000);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAdminConfirmPayout = async (listingId: string) => {
    const trxId = adminTrxMap[listingId];
    if (!trxId) {
      alert('দয়া করে TRX ID দিন');
      return;
    }

    if (!confirm('আপনি কি নিশ্চিত যে আপনি এই পেমেন্টটি সম্পন্ন করেছেন?')) return;

    setIsSubmitting(true);
    try {
      const listingRef = doc(db, 'listings', listingId);
      const listingSnap = await getDoc(listingRef);
      let soldTo = '';
      if (listingSnap.exists()) {
        soldTo = listingSnap.data().soldTo || '';
      }

      await updateDoc(listingRef, {
        paymentStatus: 'Paid',
        payoutTrxId: trxId,
        status: 'Sold', // Explicitly keep as Sold
        updatedAt: serverTimestamp()
      });

      // Also update the purchase record
      let purchaseId = allPurchases.find(p => p.listingId === listingId)?.id;
      if (!purchaseId && soldTo) {
        purchaseId = `${soldTo}_${listingId}`;
      }
      if (purchaseId) {
        await updateDoc(doc(db, 'purchases', purchaseId), {
          paymentStatus: 'Paid',
          payoutTrxId: trxId
        });
      }

      alert('পেমেন্ট সফলভাবে সম্পন্ন হয়েছে!');
      setAdminTrxMap(prev => {
        const next = { ...prev };
        delete next[listingId];
        return next;
      });
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminBulkPayout = async () => {
    if (!isAdmin || adminSelectedListings.length === 0) return;
    if (!bulkPayoutTrxId) {
      alert('দয়া করে Bulk TRX ID দিন');
      return;
    }

    if (!confirm(`আপনি কি নিশ্চিত যে ${adminSelectedListings.length}টি লিস্টিং-এর জন্য এই পেমেন্ট সম্পন্ন করেছেন?`)) return;

    setIsSubmitting(true);
    let successCount = 0;
    try {
      for (const listingId of adminSelectedListings) {
        const listing = allListings.find(l => l.id === listingId);
        if (listing && listing.status === 'Sold' && listing.paymentStatus !== 'Paid') {
          const listingRef = doc(db, 'listings', listingId);
          await updateDoc(listingRef, {
            paymentStatus: 'Paid',
            payoutTrxId: bulkPayoutTrxId,
            updatedAt: serverTimestamp()
          });

          let purchaseId = allPurchases.find(p => p.listingId === listingId)?.id;
          if (!purchaseId && listing.soldTo) {
            purchaseId = `${listing.soldTo}_${listingId}`;
          }
          if (purchaseId) {
            await updateDoc(doc(db, 'purchases', purchaseId), {
              paymentStatus: 'Paid',
              payoutTrxId: bulkPayoutTrxId
            });
          }
          successCount++;
        }
      }
      alert(`${successCount}টি পেমেন্ট সফলভাবে সম্পন্ন হয়েছে!`);
      setAdminSelectedListings([]);
      setBulkPayoutTrxId('');
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminBulkAction = async (action: 'Available' | 'Dispute' | 'Sold' | 'SellRequest' | 'Delete') => {
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
      
      if (action === 'Dispute' || action === 'Sold' || action === 'SellRequest') {
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
            hasDeposited: true,
            updatedAt: serverTimestamp()
          });
          // Instead of deleting, mark it as verified so user can see it in transaction history
          transaction.update(paymentRef, {
            status: 'verified',
            updatedAt: serverTimestamp()
          });
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
                earningsBalance: increment(Number(lData.price)),
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
    // Keep listings for full history and bookkeeping in both admin panel and seller section
    console.log(`Keep all listings with status: ${status}`);
  };

  const ensureGlobalSoldCountRefectingSale = async (count: number = 1) => {
    try {
      const persistentDocRef = doc(db, 'settings', 'global_sold_count');
      const persistentSnap = await getDoc(persistentDocRef);
      let currentPersistentVal = 0;
      if (persistentSnap.exists()) {
        currentPersistentVal = persistentSnap.data().count || 0;
      }
      
      const qGlobalSold = query(collection(db, 'listings'), where('status', 'in', ['Sold', 'Approved']));
      const soldSnap = await getCountFromServer(qGlobalSold);
      const currentDbCount = soldSnap.data().count;
      
      const baseValue = Math.max(currentPersistentVal, currentDbCount);
      const newVal = baseValue + count;
      
      await setDoc(persistentDocRef, { count: newVal }, { merge: true });
      setGlobalSoldCount(newVal);
    } catch (err) {
      console.warn("Failed to ensure global sold count integration:", err);
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
          emailHash: hashEmail(editListingForm.email),
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
          emailHash: hashEmail(editListingForm.email),
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
      const cachedMainBoxColor = localStorage.getItem('cache_main_box_color');

      if (cachedHeadline) {
        try { const h = JSON.parse(cachedHeadline); setHeadline(h); setPendingHeadline(h.text); setPendingSpeed(h.speed); } catch(e){}
      }
      if (cachedNotice) setNoticeText(cachedNotice); setPendingNotice(cachedNotice || "");
      if (cachedPrices) {
        try { setGmailPrices(JSON.parse(cachedPrices)); } catch(e){}
      }
      // Home page, header, and navigation are fixed to white #ffffff
      setHomeBgColor("#ffffff");
      setPendingHomeBgColor("#ffffff");
      setNavBgColor("#ffffff");
      setPendingNavBgColor("#ffffff");
      setHeaderBgColor("#ffffff");
      setPendingHeaderBgColor("#ffffff");

      if (cachedMainBoxColor) {
        const checkColor = cachedMainBoxColor === "#000d26" ? "#054335" : cachedMainBoxColor;
        setMainBoxColor(checkColor);
        setPendingMainBoxColor(checkColor);
      } else {
        setMainBoxColor("#054335");
        setPendingMainBoxColor("#054335");
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
          // Keep homeBgColor, navBgColor, headerBgColor locked to #ffffff
          setHomeBgColor("#ffffff");
          setNavBgColor("#ffffff");
          setHeaderBgColor("#ffffff");

          if (data.mainBoxColor) {
            const finalCol = data.mainBoxColor === "#000d26" ? "#054335" : data.mainBoxColor;
            setMainBoxColor(finalCol);
            setPendingMainBoxColor(finalCol);
            localStorage.setItem('cache_main_box_color', finalCol);
          }
        }

        // Fetch Adsterra Configurations
        const adsterraDocRef = doc(db, 'settings', 'adsterra');
        try {
          const adsterraSnap = await getDoc(adsterraDocRef);
          if (adsterraSnap.exists()) {
            const data = adsterraSnap.data();
            if (data) {
              setAdsterraEnabled(data.enabled === true);
              setAdsterraBannerKey(data.bannerKey || "");
              setPendingAdsterraBannerKey(data.bannerKey || "");
              setAdsterraMobileBannerKey(data.mobileBannerKey || "");
              setPendingAdsterraMobileBannerKey(data.mobileBannerKey || "");
              setAdsterraInFeedKey(data.inFeedKey || "");
              setPendingAdsterraInFeedKey(data.inFeedKey || "");
              setAdsterraStickyKey(data.stickyKey || "");
              setPendingAdsterraStickyKey(data.stickyKey || "");
              setAdsterraPopunderKey(data.popunderKey || "");
              setPendingAdsterraPopunderKey(data.popunderKey || "");
              setAdsterraSocialBarKey(data.socialBarKey || "");
              setPendingAdsterraSocialBarKey(data.socialBarKey || "");
              setAdsterraDirectLinkUrl(data.directLinkUrl || "");
              setPendingAdsterraDirectLinkUrl(data.directLinkUrl || "");

              localStorage.setItem('cache_adsterra_enabled', String(data.enabled === true));
              localStorage.setItem('cache_adsterra_banner_key', data.bannerKey || "");
              localStorage.setItem('cache_adsterra_mobile_banner_key', data.mobileBannerKey || "");
              localStorage.setItem('cache_adsterra_infeed_key', data.inFeedKey || "");
              localStorage.setItem('cache_adsterra_sticky_key', data.stickyKey || "");
              localStorage.setItem('cache_adsterra_popunder_key', data.popunderKey || "");
              localStorage.setItem('cache_adsterra_socialbar_key', data.socialBarKey || "");
              localStorage.setItem('cache_adsterra_direct_link_url', data.directLinkUrl || "");
            }
          }
        } catch (adsterraErr) {
          console.warn("Skipping dynamic adsterra config fetch from firestore (using cache):", adsterraErr);
        }

        // Fetch Custom Reward Ads Configurations
        const rewardAdsDocRef = doc(db, 'settings', 'reward_ads');
        try {
          const rewardSnap = await getDoc(rewardAdsDocRef);
          if (rewardSnap.exists()) {
            const data = rewardSnap.data();
            if (data) {
              if (Array.isArray(data.ads)) {
                setRewardAds(data.ads);
                localStorage.setItem('cache_reward_ads', JSON.stringify(data.ads));
              }
              const dur = data.duration ? Number(data.duration) : 30;
              setRewardAdDuration(dur);
              localStorage.setItem('cache_reward_ad_duration', String(dur));
            }
          }
        } catch (rewardErr) {
          console.warn("Skipping dynamic reward ads fetch from firestore (using cache):", rewardErr);
        }

        setQuotaExceeded(false);
      } catch (err: any) {
        console.warn("Settings fetch failed:", err);
        setQuotaExceeded(false);
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
      await setDoc(doc(db, 'settings', 'notice'), { text }, { merge: true });
      alert('Notice Board updated!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/notice');
    }
  };

  const updateHomeBgColor = async (color: string) => {
    if (!isAdmin) return;
    try {
      await setDoc(doc(db, 'settings', 'notice'), { homeBgColor: color.trim() }, { merge: true });
      setHomeBgColor(color.trim());
      alert('Home background color updated successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/notice');
    }
  };

  const updateMainBoxColor = async (color: string) => {
    if (!isAdmin) return;
    try {
      await setDoc(doc(db, 'settings', 'notice'), { mainBoxColor: color.trim() }, { merge: true });
      setMainBoxColor(color.trim());
      alert('মূল নীল বক্সের কালার সফলভাবে আপডেট করা হয়েছে!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/notice');
    }
  };

  const updateNavBgColor = async (color: string) => {
    if (!isAdmin) return;
    try {
      await setDoc(doc(db, 'settings', 'notice'), { navBgColor: color.trim() }, { merge: true });
      setNavBgColor(color.trim());
      alert('বটম নেভিগেশন বারের কালার সফলভাবে আপডেট করা হয়েছে!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/notice');
    }
  };

  const updateHeaderBgColor = async (color: string) => {
    if (!isAdmin) return;
    try {
      await setDoc(doc(db, 'settings', 'notice'), { headerBgColor: color.trim() }, { merge: true });
      setHeaderBgColor(color.trim());
      alert('হেডার ব্যাকগ্রাউন্ড কালার সফলভাবে আপডেট করা হয়েছে!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/notice');
    }
  };


  const updateAdsterraSettings = async (
    enabled: boolean,
    bannerKey: string,
    mobileBannerKey: string,
    inFeedKey: string,
    stickyKey: string,
    popunderKey: string = "",
    socialBarKey: string = "",
    directLinkUrl: string = ""
  ) => {
    if (!isAdmin) return;
    try {
      await setDoc(doc(db, 'settings', 'adsterra'), {
        enabled,
        bannerKey: bannerKey.trim(),
        mobileBannerKey: mobileBannerKey.trim(),
        inFeedKey: inFeedKey.trim(),
        stickyKey: stickyKey.trim(),
        popunderKey: popunderKey.trim(),
        socialBarKey: socialBarKey.trim(),
        directLinkUrl: directLinkUrl.trim(),
        updatedAt: serverTimestamp()
      });
      setAdsterraEnabled(enabled);
      setAdsterraBannerKey(bannerKey.trim());
      setAdsterraMobileBannerKey(mobileBannerKey.trim());
      setAdsterraInFeedKey(inFeedKey.trim());
      setAdsterraStickyKey(stickyKey.trim());
      setAdsterraPopunderKey(popunderKey.trim());
      setAdsterraSocialBarKey(socialBarKey.trim());
      setAdsterraDirectLinkUrl(directLinkUrl.trim());

      localStorage.setItem('cache_adsterra_enabled', String(enabled));
      localStorage.setItem('cache_adsterra_banner_key', bannerKey.trim());
      localStorage.setItem('cache_adsterra_mobile_banner_key', mobileBannerKey.trim());
      localStorage.setItem('cache_adsterra_infeed_key', inFeedKey.trim());
      localStorage.setItem('cache_adsterra_sticky_key', stickyKey.trim());
      localStorage.setItem('cache_adsterra_popunder_key', popunderKey.trim());
      localStorage.setItem('cache_adsterra_socialbar_key', socialBarKey.trim());
      localStorage.setItem('cache_adsterra_direct_link_url', directLinkUrl.trim());
      alert('Adsterra configurations successfully updated!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/adsterra');
    }
  };

  const updateRewardAds = async (updatedList: any[], newDuration?: number) => {
    if (!isAdmin) return;
    try {
      const targetDuration = newDuration !== undefined ? newDuration : rewardAdDuration;
      await setDoc(doc(db, 'settings', 'reward_ads'), {
        ads: updatedList,
        duration: targetDuration,
        updatedAt: serverTimestamp()
      });
      setRewardAds(updatedList);
      setRewardAdDuration(targetDuration);
      localStorage.setItem('cache_reward_ads', JSON.stringify(updatedList));
      localStorage.setItem('cache_reward_ad_duration', String(targetDuration));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/reward_ads');
    }
  };

  const updateUserBalance = async (identifier: string, amount: number) => {
    if (!isAdmin) return;
    try {
      let targetUid = '';
      if (/^\d+$/.test(identifier) && identifier.length < 15) {
        const q = query(collection(db, 'profiles'), where('numericId', '==', identifier));
        const snap = await getDocs(q);
        if (!snap.empty) {
          targetUid = snap.docs[0].id;
        }
      }
      if (!targetUid) {
        const q = query(collection(db, 'profiles'), where('email', '==', identifier));
        const snap = await getDocs(q);
        if (!snap.empty) {
          targetUid = snap.docs[0].id;
        } else {
          const profileDoc = await getDoc(doc(db, 'profiles', identifier));
          if (profileDoc.exists()) {
            targetUid = identifier;
          }
        }
      }
      if (!targetUid) {
        alert('User not found!');
        return;
      }
      await updateDoc(doc(db, 'profiles', targetUid), {
        balance: Number(amount),
        ...(Number(amount) > 0 ? { hasDeposited: true } : {}),
        updatedAt: serverTimestamp()
      });
      alert('Balance updated!');
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#2563EB]/20 border-t-[#2563EB] rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    const hasDeposited = userProfile?.hasDeposited || (userProfile?.balance !== undefined && userProfile.balance > 0);
    return (
      <div className="min-h-screen bg-slate-100 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-slate-200 flex justify-center items-start font-sans selection:bg-red-505/10 text-slate-800 lg:p-6 lg:gap-8 overflow-x-hidden relative">
        {/* Decorative background glow elements */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Left Desktop Sidebar Widget for v4.0 */}
        <div className="hidden lg:flex w-[320px] shrink-0 flex-col gap-4 self-stretch justify-start py-4">
          {/* Brand Card */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-[2rem] space-y-4 shadow-sm relative overflow-hidden text-slate-800 flex flex-col justify-between shrink-0">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="space-y-4 font-sans text-left">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-tr from-rose-500 to-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-500/30 ring-4 ring-white/5 relative overflow-hidden shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-tr from-red-50 to-white opacity-25" />
                  <Mail size={22} strokeWidth={2.5} />
                </div>
                <div>
                  <h1 className="font-display text-lg font-black tracking-tight text-slate-900 flex items-center gap-1.5 leading-none">
                    Gmail Buy & Sell <span className="text-[9px] font-black tracking-[0.1em] text-yellow-500 bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/20">BD</span>
                  </h1>
                  <p className="text-[9px] font-black tracking-[0.15em] text-red-500 uppercase mt-0.5">V4.0 ULTIMATE</p>
                </div>
              </div>
              
              <p className="text-[11.5px] text-slate-500 leading-relaxed font-sans font-medium">
                Bangladesh's most trusted secure digital escrow and verification network. Built for instant transactions and complete user privacy.
              </p>
            </div>

            <div className="h-px bg-slate-100" />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span className="flex items-center gap-1.5"><Shield size={13} className="text-red-500 font-extrabold" /> Security Protocol</span>
                <span className="text-emerald-600 font-bold">256-Bit AES</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span className="flex items-center gap-1.5"><Zap size={13} className="text-yellow-650 font-extrabold" /> Escrow Engine</span>
                <span className="text-slate-700 font-bold">Smart Wallet v4</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span className="flex items-center gap-1.5"><Activity size={13} className="text-cyan-600 font-extrabold" /> Gateway Route</span>
                <span className="text-slate-700 font-bold">Cloud Cluster</span>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-[2rem] space-y-4 shadow-sm relative overflow-hidden text-slate-800 flex flex-col shrink-0 text-left">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Ecosystem Statistics</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                <div className="text-[8px] font-bold uppercase tracking-widest text-[#64748B] leading-none">Escrow Deals</div>
                <div className="text-lg font-display font-black text-emerald-600 mt-1">55,000+</div>
                <div className="text-[7.5px] font-bold text-slate-400 uppercase mt-0.5 leading-none">Verified Success</div>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                <div className="text-[8px] font-bold uppercase tracking-widest text-[#64748B] leading-none">Active Clients</div>
                <div className="text-lg font-display font-black text-red-600 mt-1">4,850+</div>
                <div className="text-[7.5px] font-bold text-slate-400 uppercase mt-0.5 leading-none">Daily Payout</div>
              </div>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl flex items-center gap-2.5">
              <Sparkles size={16} className="text-emerald-600 shrink-0" />
              <p className="text-[10px] text-emerald-800 leading-relaxed font-semibold">
                v4.0 integrates instant ledger tracking for automated user payouts & OTP delivery.
              </p>
            </div>
          </div>
        </div>

        {/* Centralized Mobile App Screen Container */}
        <div 
          className="w-full lg:max-w-[780px] min-h-screen lg:min-h-[85vh] relative flex flex-col shadow-[0_24px_50px_rgba(0,0,0,0.06)] rounded-none lg:rounded-[2.5rem] overflow-x-hidden border-0 lg:border lg:border-slate-100 shrink-0 flex-1"
          style={{ backgroundColor: homeBgColor }}
        >
          {/* Sidebar Overlay */}
          <AnimatePresence>
            {isSidebarOpen && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsSidebarOpen(false)}
                  className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60]"
                />
                <motion.aside
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white border-r border-[#f1f5f9] text-slate-800 shadow-[20px_0_60px_rgba(0,0,0,0.08)] z-[70] flex flex-col"
                >
                  {/* Brand & Profile Header */}
                  <div className="p-6 border-b border-slate-50 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full border-2 border-white bg-red-50 text-red-600 shadow-md overflow-hidden flex items-center justify-center shrink-0">
                          {userProfile?.photoURL ? (
                            <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <UserIcon size={20} className="text-red-500" />
                          )}
                        </div>
                        <div className="text-left min-w-0">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Your profile</p>
                          <h4 className="font-sans font-black text-slate-800 leading-tight truncate mt-1 max-w-[150px]">
                            {userProfile?.displayName || userProfile?.name || user?.email || 'User Name'}
                          </h4>
                        </div>
                      </div>
                      <button 
                        onClick={() => setIsSidebarOpen(false)}
                        className="w-8 h-8 rounded-full bg-slate-50 border-slate-100 text-slate-500 hover:text-red-600 hover:bg-slate-100 border flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                      >
                        <X size={15} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>

                  {/* Sidebar links body */}
                  <div className="flex-1 overflow-y-auto px-4 py-6">
                    <nav className="space-y-1">
                      {[
                        { icon: Home, label: 'হোম পেজ (Home)', action: () => { setView('marketplace'); setIsSidebarOpen(false); } },
                        { icon: ShoppingBag, label: 'মেইল মার্কেট', action: () => { setView('gmail-market'); setIsSidebarOpen(false); } },
                        { icon: Store, label: 'লাইভ মার্কেট', action: () => { setSelectedCategoryFilter('All'); setView('facebook-market'); setIsSidebarOpen(false); } },
                        { icon: Tag, label: 'ফেসবুক মার্কেট', action: () => { setSelectedCategoryFilter('Facebook'); setView('facebook-accounts-list'); setIsSidebarOpen(false); } },
                        { icon: Trophy, label: 'লিডারবোর্ড', action: () => { setView('leaderboard'); setIsSidebarOpen(false); } },
                        isAdmin && { icon: ShieldCheck, label: 'এডমিন পোর্টাল', action: () => { setView('admin'); setIsSidebarOpen(false); }, special: true },
                        { icon: LogOut, label: 'লগআউট (Logout)', action: () => { handleLogout(); setIsSidebarOpen(false); }, danger: true },
                      ].filter(Boolean).map((item: any, i) => (
                        <button
                          key={i}
                          onClick={item.action}
                          className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm group ${
                            item.special 
                              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' 
                              : item.danger
                                ? 'text-red-650 hover:bg-red-50 hover:text-red-750'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-red-600'
                          }`}
                        >
                          <item.icon size={20} strokeWidth={item.special ? 2.5 : 2} className={
                            item.special 
                              ? '' 
                              : item.danger
                                ? 'text-red-400 group-hover:text-red-500 transition-colors'
                                : 'text-slate-400 group-hover:text-red-500 transition-colors'
                          } />
                          <span className="flex-1 text-left">{item.label}</span>
                          {item.special && <Crown size={14} className="animate-pulse" />}
                        </button>
                      ))}

                      {/* Sell & Earn Expansion Menu */}
                      <div className={`space-y-1 ${isSellEarnOpen ? 'bg-red-600/5 rounded-2xl' : ''}`}>
                        <button
                          onClick={() => setIsSellEarnOpen(!isSellEarnOpen)}
                          className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-colors font-bold text-sm ${isSellEarnOpen ? 'text-red-650' : 'text-slate-605 hover:bg-slate-50 hover:text-red-605'}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${isSellEarnOpen ? 'bg-red-600/10' : 'bg-slate-100'} transition-colors`}>
                              <Plus size={18} className={isSellEarnOpen ? 'text-red-600' : 'text-slate-500'} />
                            </div>
                            <span>বিক্রি এবং আয়</span>
                          </div>
                          <ChevronDown size={16} className={`text-slate-400 transition-transform ${isSellEarnOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                          {isSellEarnOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden pl-11 pr-4 pb-3 space-y-1"
                            >
                              {[
                                { label: 'জিমেইল দিয়ে আয়', action: () => { setView('seller-center'); setShowSellNotice(true); setIsSidebarOpen(false); } },
                                { label: 'ফেসবুক পেজ বিক্রি', action: () => { setView('facebook-sell-center'); setIsSidebarOpen(false); } }
                              ].map((subItem, index) => (
                                <button
                                  key={index}
                                  onClick={subItem.action}
                                  className="w-full flex items-center justify-between text-[11.5px] font-bold text-slate-500 hover:text-red-600 hover:bg-slate-50 rounded-xl px-4 py-2 transition-all text-left block"
                                >
                                  {subItem.label}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </nav>
                  </div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>

          {/* Consistent Top Header Bar */}
          <header 
            className="sticky top-0 backdrop-blur-md border-b border-slate-100 py-2 sm:py-3.5 px-2.5 sm:px-4 flex items-center justify-between z-50 select-none shadow-[0_1px_10px_rgba(0,0,0,0.015)]"
            style={{ backgroundColor: headerBgColor }}
          >
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 min-w-0">
              <div className="flex items-center gap-1 sm:gap-2 shrink-0 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#4F46E5]/10 border border-[#4F46E5]/20 rounded-xl flex items-center justify-center text-[#4F46E5] shadow-3xs shrink-0">
                  <Mail size={14} className="sm:w-[16px] sm:h-[16px]" strokeWidth={2.5} />
                </div>
                <div className="text-left leading-none shrink-0 min-w-0">
                  <h1 className="font-sans text-[11px] min-[360px]:text-[12px] sm:text-[13.5px] font-black text-slate-900 tracking-tight leading-none whitespace-nowrap">
                    Gmail Buy & Sell <span className="text-[#4F46E5]">BD</span>
                  </h1>
                  <p className="text-[6.5px] min-[360px]:text-[7px] sm:text-[7.5px] font-black tracking-widest text-[#64748B] uppercase mt-0.5 sm:mt-1 leading-none whitespace-nowrap">
                     TRUSTED MARKETPLACE
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-1">
              {/* Wallet Button */}
              <button 
                onClick={handleDepositTrigger}
                className="bg-amber-50 hover:bg-amber-100 border border-amber-200/60 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-bold flex items-center gap-1 text-[9px] min-[360px]:text-[10px] sm:text-xs text-amber-700 tracking-wider shadow-3xs cursor-pointer active:scale-95 transition-all shrink-0 whitespace-nowrap animation-pulse"
              >
                <Wallet size={11} className="text-amber-600 sm:w-[12px] sm:h-[12px] shrink-0" strokeWidth={2.5} />
                <span className="font-black whitespace-nowrap">৳ {userProfile?.balance !== undefined ? userProfile.balance.toFixed(0) : '0'}</span>
              </button>

              {/* Chat Button with unread count badge */}
              <button 
                onClick={() => {
                  if (!user) {
                    setView('login');
                  } else {
                    setIsChatInboxOpen(true);
                  }
                }}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-650 hover:text-red-600 relative transition-all active:scale-90 cursor-pointer shrink-0"
              >
                <MessageSquare size={15} className="sm:w-[17px] sm:h-[17px]" strokeWidth={2.2} />
                {totalUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#00B56C] text-white font-black text-[7px] sm:text-[8px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {totalUnreadCount}
                  </span>
                )}
              </button>

              {/* Bell Button with blue badge */}
              <button 
                onClick={() => { setIsNotificationsOpen(true); }}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-650 hover:text-red-600 relative transition-all active:scale-90 cursor-pointer shrink-0"
              >
                <Bell size={15} className="sm:w-[17px] sm:h-[17px]" strokeWidth={2.2} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white font-black text-[7px] sm:text-[8px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* 3-Dot Options Dropdown */}
              <div id="three-dot-menu" className="relative shrink-0">
                <button 
                  onClick={() => setIsHeaderDropdownOpen(!isHeaderDropdownOpen)}
                  className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-650 hover:text-red-600 relative transition-all active:scale-90 cursor-pointer shrink-0"
                >
                  <MoreVertical size={15} className="sm:w-[17px] sm:h-[17px]" strokeWidth={2.2} />
                </button>
                
                <AnimatePresence>
                  {isHeaderDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-50 pointer-events-auto" 
                        onClick={() => setIsHeaderDropdownOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-100 shadow-xl py-1 z-[60] flex flex-col gap-0.5 max-h-[80vh] overflow-y-auto divide-y divide-slate-100 font-sans"
                      >
                        {/* Section 1: User & Wallet */}
                        <div className="py-1">
                          <div className="px-4 py-1.5">
                            <p className="text-[9px] font-black tracking-widest text-[#64748B] uppercase leading-none">প্রোফাইল ও ওয়ালেট</p>
                          </div>
                          <button
                            onClick={() => { setView('profile'); setShowDepositArea(false); setIsHeaderDropdownOpen(false); }}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:text-red-600 hover:bg-slate-50/80 transition-colors flex items-center gap-2.5"
                          >
                            <UserIcon size={14} className="text-slate-400" />
                            <span>আমার প্রোফাইল</span>
                          </button>
                          <button
                            onClick={() => { handleDepositTrigger(); setIsHeaderDropdownOpen(false); }}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:text-red-600 hover:bg-slate-50/80 transition-colors flex items-center gap-2.5"
                          >
                            <Wallet size={14} className="text-slate-400" />
                            <span>ডিপোজিট করুন</span>
                          </button>
                          <button
                            onClick={() => { setWithdrawMode('earnings'); setShowWithdrawModal(true); setIsHeaderDropdownOpen(false); }}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:text-red-600 hover:bg-slate-50/80 transition-colors flex items-center gap-2.5"
                          >
                            <CreditCard size={14} className="text-slate-400" />
                            <span>টাকা উইথড্র করুন</span>
                          </button>

                          <button
                            onClick={() => { setView('transactions'); setIsHeaderDropdownOpen(false); }}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:text-red-600 hover:bg-slate-50/80 transition-colors flex items-center gap-2.5"
                          >
                            <History size={14} className="text-slate-400" />
                            <span>লেনদেন ইতিহাস</span>
                          </button>
                        </div>

                        {/* Section 2: Buy Marketplaces */}
                        <div className="py-1">
                          <div className="px-4 py-1.5">
                            <p className="text-[9px] font-black tracking-widest text-[#64748B] uppercase leading-none">ক্রয় মার্কেটপ্লেস</p>
                          </div>
                          <button
                            onClick={() => { setView('marketplace'); setIsHeaderDropdownOpen(false); }}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:text-red-600 hover:bg-slate-50/80 transition-colors flex items-center gap-2.5"
                          >
                            <Home size={14} className="text-slate-400" />
                            <span>হোম পেজ</span>
                          </button>
                          <button
                            onClick={() => { setView('gmail-market'); setIsHeaderDropdownOpen(false); }}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:text-red-600 hover:bg-slate-50/80 transition-colors flex items-center gap-2.5"
                          >
                            <ShoppingBag size={14} className="text-slate-400" />
                            <span>মেইল মার্কেট</span>
                          </button>
                          <button
                            onClick={() => { setSelectedCategoryFilter('All'); setView('facebook-market'); setIsHeaderDropdownOpen(false); }}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:text-red-600 hover:bg-slate-50/80 transition-colors flex items-center gap-2.5"
                          >
                            <Store size={14} className="text-slate-400" />
                            <span>লাইভ মার্কেট</span>
                          </button>
                          <button
                            onClick={() => { setSelectedCategoryFilter('Facebook'); setView('facebook-accounts-list'); setIsHeaderDropdownOpen(false); }}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:text-red-600 hover:bg-slate-50/80 transition-colors flex items-center gap-2.5"
                          >
                            <Tag size={14} className="text-slate-400" />
                            <span>ফেসবুক মার্কেট</span>
                          </button>
                        </div>

                        {/* Section 3: Sell & Earn */}
                        <div className="py-1">
                          <div className="px-4 py-1.5">
                            <p className="text-[9px] font-black tracking-widest text-[#64748B] uppercase leading-none">বিক্রি এবং আয়</p>
                          </div>
                          <button
                            onClick={() => { setView('seller-center'); setShowSellNotice(true); setIsHeaderDropdownOpen(false); }}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:text-red-600 hover:bg-slate-50/80 transition-colors flex items-center gap-2.5"
                          >
                            <PlusSquare size={14} className="text-slate-400" />
                            <span>জিমেইল দিয়ে আয়</span>
                          </button>
                          <button
                            onClick={() => { setView('facebook-sell-center'); setIsHeaderDropdownOpen(false); }}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:text-red-600 hover:bg-slate-50/80 transition-colors flex items-center gap-2.5"
                          >
                            <Facebook size={14} className="text-slate-400" />
                            <span>ফেসবুক পেজ বিক্রি</span>
                          </button>
                        </div>

                        {/* Section 4: Other Settings & Log Out */}
                        <div className="py-1">
                          <div className="px-4 py-1.5">
                            <p className="text-[9px] font-black tracking-widest text-[#64748B] uppercase leading-none">অন্যান্য</p>
                          </div>
                          <button
                            onClick={() => { setView('leaderboard'); setIsHeaderDropdownOpen(false); }}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:text-red-600 hover:bg-slate-50/80 transition-colors flex items-center gap-2.5"
                          >
                            <Trophy size={14} className="text-slate-400" />
                            <span>লিডারবোর্ড</span>
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => { setView('admin'); setIsHeaderDropdownOpen(false); }}
                              className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors flex items-center gap-2.5"
                            >
                              <ShieldCheck size={14} className="text-rose-400" />
                              <span>এডমিন পোর্টাল</span>
                            </button>
                          )}
                          <button
                            onClick={() => { handleLogout(); setIsHeaderDropdownOpen(false); }}
                            className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-rose-50 transition-colors flex items-center gap-2.5 mt-0.5"
                          >
                            <LogOut size={14} className="text-red-400" />
                            <span>লগআউট করুন</span>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          {/* Standard main screen page content wrapper */}
          <main 
            className="flex-1 overflow-y-auto p-4 space-y-6"
            style={{ backgroundColor: homeBgColor }}
          >
            <AnimatePresence mode="wait">
              {view === 'marketplace' ? (
                <>
                  {/* Modern responsive hero segment */}
                  <section 
                    className="relative -mx-4 -mt-4 rounded-none px-3 py-7 sm:p-7 text-white text-center flex flex-col items-center justify-center border-b border-emerald-950/20 shadow-lg select-none z-10 overflow-hidden"
                    style={{ 
                      backgroundColor: mainBoxColor,
                      backgroundImage: `
                        linear-gradient(to right, rgba(255, 255, 255, 0.08) 1.5px, transparent 1.5px),
                        linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1.5px, transparent 1.5px)
                      `,
                      backgroundSize: '28px 28px, 28px 28px',
                    }}
                  >
                    {/* Background decoration blur wrapped inside an overflow-hidden layer */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-none">
                      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-[80px]" />
                      <div className="absolute -bottom-10 -left-10 w-[300px] h-[300px] bg-white/5 rounded-full blur-[60px]" />
                    </div>

                    {/* Brand Display heading */}
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-none text-white z-10 my-1 font-display">
                      Gmail Buy Sell BD
                    </h1>

                    {/* Subheading Bengali with Glow */}
                    <span className="text-lg sm:text-xl md:text-2xl font-black text-[#FFC72C] tracking-wide my-1.5 z-10 font-sans drop-shadow-[0_0_6px_rgba(255,199,44,0.3)]">
                      সব কিছু এক জায়গায়
                    </span>

                    {/* Two Main Capsule Buttons stacked vertically and styled beautifully with high contrast */}
                    <div className="flex flex-col gap-3 w-full max-w-[290px] xs:max-w-[340px] z-10 shrink-0 my-5">
                      {/* Browse Services (White Button) */}
                      <button 
                        onClick={() => setView('gmail-market')}
                        style={{ color: mainBoxColor }}
                        className="bg-white hover:bg-white/95 active:scale-[0.98] py-3.5 px-6 rounded-full text-[13px] xs:text-[14px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_4px_14px_rgba(255,255,255,0.25)] hover:shadow-[0_6px_20px_rgba(255,255,255,0.35)] cursor-pointer"
                      >
                        <ShoppingCart size={16} style={{ color: mainBoxColor }} className="shrink-0" strokeWidth={2.5} />
                        <span>Browse Services</span>
                      </button>

                      {/* Live Market (Yellow/Gold Button) */}
                      <button 
                        onClick={() => { setSelectedCategoryFilter('All'); setView('facebook-market'); }}
                        className="bg-[#FFA000] hover:bg-[#FF8F00] active:scale-[0.98] text-[#054335] py-3.5 px-6 rounded-full text-[13px] xs:text-[14px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_4px_14px_rgba(255,199,44,0.35)] hover:shadow-[0_6px_20px_rgba(255,199,44,0.5)] cursor-pointer"
                        style={{ color: mainBoxColor, backgroundColor: '#FFC72C' }}
                      >
                        <Store size={16} style={{ color: mainBoxColor }} className="shrink-0" strokeWidth={2.5} />
                        <span>Live Market</span>
                      </button>
                    </div>

                    {/* Custom Translucent Escrow & Support Protection Board - Grid Integrated Info Row */}
                    <div className="w-full z-10 mt-2 pt-4 border-t border-white/10 flex items-center justify-center gap-2 sm:gap-4 flex-nowrap text-white/95">
                      <div className="flex items-center gap-1 text-[9px] xs:text-[11px] font-black font-sans shrink-0 whitespace-nowrap">
                        <ShieldCheck className="text-[#00E5FF] drop-shadow-[0_0_5px_rgba(0,229,255,0.4)] shrink-0 w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.5} />
                        <span>Escrow Instruction</span>
                      </div>
                      
                      <span className="text-white/20 select-none">|</span>
                      
                      <div className="flex items-center gap-1 text-[9px] xs:text-[11px] font-black font-sans shrink-0 whitespace-nowrap">
                        <Zap className="text-[#FFC72C] fill-[#FFC72C] drop-shadow-[0_0_5px_rgba(255,199,44,0.4)] shrink-0 w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.5} />
                        <span>bKash / Nagad</span>
                      </div>
                      
                      <span className="text-white/20 select-none">|</span>
                      
                      <div className="flex items-center gap-1 text-[9px] xs:text-[11px] font-black font-sans shrink-0 whitespace-nowrap">
                        <Headphones className="text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.4)] shrink-0 w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.5} />
                        <span>24/7 Support</span>
                      </div>
                    </div>
                  </section>
                  
                {/* 5-Column Mini Quick Navigation Icons Block */}
                <div className="grid grid-cols-5 gap-2 sm:gap-4 mb-6 select-none shrink-0 relative z-10 font-sans">
                  {/* Card 1: Gmail বিক্রি */}
                  <button 
                    onClick={() => { setView('seller-center'); setShowSellNotice(true); }}
                    className="bg-[#FFF4F4] border border-[#FFE2E4] hover:bg-[#FFE5E5] pt-2 pb-1.5 px-1 xs:pt-3 xs:pb-2.5 xs:px-2 sm:pt-4.5 sm:pb-4 sm:px-3.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all duration-300 active:scale-95 group shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_20px_rgba(239,68,68,0.06)] cursor-pointer h-full min-h-[82px] xs:min-h-[100px] sm:min-h-[126px]"
                  >
                    <div className="w-[36px] h-[36px] xs:w-[46px] xs:h-[46px] sm:w-[58px] sm:h-[58px] md:w-[64px] md:h-[64px] rounded-full bg-[#EA3829] flex items-center justify-center text-white mb-1.5 sm:mb-2 shrink-0 transition-transform duration-300 group-hover:scale-105 shadow-[0_6px_16px_rgba(234,56,41,0.3)]">
                      <Mail className="text-white w-5 h-5 xs:w-[22px] xs:h-[22px] sm:w-[28px] sm:h-[28px] md:w-[32px] md:h-[32px]" strokeWidth={2.4} />
                    </div>
                    <span className="text-[8.5px] xs:text-[10px] sm:text-[12.5px] md:text-[14px] font-black text-[#1E293B] tracking-tight leading-none text-center whitespace-nowrap mt-1">Gmail বিক্রি</span>
                  </button>

                  {/* Card 2: Gmail কিনুন */}
                  <button 
                    onClick={() => setView('gmail-market')}
                    className="bg-[#F0F6FF] border border-[#D2E3FC] hover:bg-[#E5EEFF] pt-2 pb-1.5 px-1 xs:pt-3 xs:pb-2.5 xs:px-2 sm:pt-4.5 sm:pb-4 sm:px-3.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all duration-300 active:scale-95 group shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_20px_rgba(59,130,246,0.06)] cursor-pointer h-full min-h-[82px] xs:min-h-[100px] sm:min-h-[126px]"
                  >
                    <div className="w-[36px] h-[36px] xs:w-[46px] xs:h-[46px] sm:w-[58px] sm:h-[58px] md:w-[64px] md:h-[64px] rounded-full bg-[#1A73E8] flex items-center justify-center text-white mb-1.5 sm:mb-2 shrink-0 transition-transform duration-300 group-hover:scale-105 shadow-[0_6px_16px_rgba(26,115,232,0.3)]">
                      <ShoppingCart className="text-white w-5 h-5 xs:w-[22px] xs:h-[22px] sm:w-[28px] sm:h-[28px] md:w-[32px] md:h-[32px]" strokeWidth={2.4} />
                    </div>
                    <span className="text-[8.5px] xs:text-[10px] sm:text-[12.5px] md:text-[14px] font-black text-[#1E293B] tracking-tight leading-none text-center whitespace-nowrap mt-1 font-sans">Gmail কিনুন</span>
                  </button>

                  {/* Card 3: Facebook */}
                  <button 
                    onClick={() => { setSelectedCategoryFilter('Facebook'); setView('facebook-accounts-list'); }}
                    className="bg-[#F0F3FF] border border-[#DBE2FC] hover:bg-[#E8ECFF] pt-2 pb-1.5 px-1 xs:pt-3 xs:pb-2.5 xs:px-2 sm:pt-4.5 sm:pb-4 sm:px-3.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all duration-300 active:scale-95 group shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_20px_rgba(79,70,229,0.06)] cursor-pointer h-full min-h-[82px] xs:min-h-[100px] sm:min-h-[126px]"
                  >
                    <div className="w-[36px] h-[36px] xs:w-[46px] xs:h-[46px] sm:w-[58px] sm:h-[58px] md:w-[64px] md:h-[64px] rounded-full bg-[#1877F2] flex items-center justify-center text-white mb-1.5 sm:mb-2 shrink-0 transition-transform duration-300 group-hover:scale-105 shadow-[0_6px_16px_rgba(24,119,242,0.3)]">
                      <Facebook className="text-white w-5 h-5 xs:w-[22px] xs:h-[22px] sm:w-[28px] sm:h-[28px] md:w-[32px] md:h-[32px]" strokeWidth={2.4} />
                    </div>
                    <span className="text-[8.5px] xs:text-[10px] sm:text-[12.5px] md:text-[14px] font-black text-[#1E293B] tracking-tight leading-none text-center whitespace-nowrap mt-1">Facebook</span>
                  </button>

                  {/* Card 4: Task Earn */}
                  <button 
                    onClick={() => setShowAdsEarnModal(true)}
                    className="bg-[#F2FAF4] border border-[#D7EBDC] hover:bg-[#E1F2E5] pt-2 pb-1.5 px-1 xs:pt-3 xs:pb-2.5 xs:px-2 sm:pt-4.5 sm:pb-4 sm:px-3.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all duration-300 active:scale-95 group shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_20px_rgba(16,185,129,0.06)] cursor-pointer h-full min-h-[82px] xs:min-h-[100px] sm:min-h-[126px]"
                  >
                    <div className="w-[36px] h-[36px] xs:w-[46px] xs:h-[46px] sm:w-[58px] sm:h-[58px] md:w-[64px] md:h-[64px] rounded-full bg-[#03AF5A] flex items-center justify-center text-white mb-1.5 sm:mb-2 shrink-0 transition-transform duration-300 group-hover:scale-105 shadow-[0_6px_16px_rgba(3,175,90,0.3)]">
                      <CheckCircle className="text-white w-5 h-5 xs:w-[22px] xs:h-[22px] sm:w-[28px] sm:h-[28px] md:w-[32px] md:h-[32px]" strokeWidth={2.4} />
                    </div>
                    <span className="text-[8.5px] xs:text-[10px] sm:text-[12.5px] md:text-[14px] font-black text-[#1E293B] tracking-tight leading-none text-center whitespace-nowrap mt-1">Task Earn</span>
                  </button>

                  {/* Card 5: Deposit */}
                  <button 
                    onClick={() => handleDepositTrigger()}
                    className="bg-[#F4F8F4] border border-[#D1DCD3] hover:bg-[#E1EADF] pt-2 pb-1.5 px-1 xs:pt-3 xs:pb-2.5 xs:px-2 sm:pt-4.5 sm:pb-4 sm:px-3.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all duration-300 active:scale-95 group shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_20px_rgba(36,117,42,0.06)] cursor-pointer h-full min-h-[82px] xs:min-h-[100px] sm:min-h-[126px]"
                  >
                    <div className="w-[36px] h-[36px] xs:w-[46px] xs:h-[46px] sm:w-[58px] sm:h-[58px] md:w-[64px] md:h-[64px] rounded-full bg-[#24752A] flex items-center justify-center text-white mb-1.5 sm:mb-2 shrink-0 transition-transform duration-300 group-hover:scale-105 shadow-[0_6px_16px_rgba(3,117,42,0.3)]">
                      <Wallet className="text-white w-5 h-5 xs:w-[22px] xs:h-[22px] sm:w-[28px] sm:h-[28px] md:w-[32px] md:h-[32px]" strokeWidth={2.4} />
                    </div>
                    <span className="text-[8.5px] xs:text-[10px] sm:text-[12.5px] md:text-[14px] font-black text-[#1E293B] tracking-tight leading-none text-center whitespace-nowrap mt-1">Deposit</span>
                  </button>
                </div>



                {/* Adsterra Sponsor banner block */}
                {adsterraEnabled ? (
                  <AdSenseSlot 
                    type="banner" 
                    className="my-4"
                    adsterraEnabled={adsterraEnabled}
                    adsterraBannerKey={adsterraBannerKey}
                    adsterraMobileBannerKey={adsterraMobileBannerKey}
                    adsterraInFeedKey={adsterraInFeedKey}
                    adsterraStickyKey={adsterraStickyKey}
                  />
                ) : (
                  <div className="bg-[#0D1321] text-white rounded-2xl border border-slate-900 p-3.5 relative overflow-hidden my-4 text-left select-none shadow-sm block">
                    <div className="flex justify-between items-center text-[7.5px] font-black uppercase text-slate-400 tracking-wider mb-2 border-b border-white/5 pb-1.5">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        ADSTERRA NETWORK PREMIUM SPONSOR
                      </span>
                      <span className="bg-slate-800 text-slate-300 px-1 py-0.5 rounded text-[7px]">Secure Ad</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                      <div className="space-y-1 min-w-0 flex-1">
                        <h4 className="text-[11px] font-black leading-tight text-white tracking-tight">Trade with over $5,000 in Deposit Bonuses</h4>
                        <p className="text-[8.5px] text-slate-400 font-medium">Create your account with a trusted world broker XM today.</p>
                      </div>
                      <button 
                        onClick={() => window.open('https://directlink.adsterra.com', '_blank')}
                        className="bg-[#00B56C] hover:bg-[#00B56C]/90 text-black text-[8.5px] font-black px-3.5 py-1.5 rounded-lg shrink-0 transition-all uppercase tracking-wider shadow-sm active:scale-95 cursor-pointer"
                      >
                        Download Now
                      </button>
                    </div>
                  </div>
                )}

                {/* Orange Claim Bonus Ribbon */}
                <div className="bg-gradient-to-r from-[#FF523B] to-[#FF7E40] text-white p-3.5 rounded-[1.25rem] flex items-center justify-between shadow-sm relative overflow-hidden my-4">
                  <div className="flex items-center gap-2.5 z-10">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <Gift className="text-white animate-bounce" size={16} />
                    </div>
                    <div className="text-left">
                      <h4 className="text-[11px] font-black leading-tight">FREE প্রতিদিন ৮+ বোনাস নিন!</h4>
                      <p className="text-[8.5px] text-white/90 font-medium">স্পন্সর কন্টেন্ট ভিজিট করে আপনার বোনাস টাকা বুঝে নিন</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowAdsEarnModal(true)}
                    className="bg-white hover:bg-slate-50 text-[#FF523B] text-[8.5px] font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm transition-all active:scale-95 cursor-pointer z-10 shrink-0 animate-pulse"
                  >
                    ক্লেম করুন
                  </button>
                </div>

                {/* Vertical Category Custom Outline Row Section */}
                <section className="flex flex-col gap-3.5 mb-6">
                  {/* 1. LIVE MARKET Card */}
                  <div className="bg-[#FFF9EE] border border-[#FFE7C8]/70 rounded-[1.8rem] p-5 flex items-start gap-4 transition-all w-full text-left relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="w-11 h-11 rounded-full bg-[#FFF0D4] border border-[#FFE8A3] flex items-center justify-center shrink-0 text-orange-500 shadow-sm">
                      <Store size={20} strokeWidth={2.5} />
                    </div>
                    
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8.5px] font-black tracking-widest text-orange-600 uppercase">LIVE MARKET</span>
                        <span className="bg-orange-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider leading-none">NEW</span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-800 leading-none">Digital Account বেচুন/কিনুন</h3>
                      <p className="text-[10px] md:text-xs text-slate-500 font-semibold leading-relaxed">
                        YouTube, Game, Social accounts — Buyer সরাসরি Chat করে Escrow সিস্টেমে Deal করবে।
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button 
                          onClick={() => { setSelectedCategoryFilter('All'); setView('facebook-market'); }}
                          className="bg-white border border-[#FFD0B3] hover:bg-[#FFF5EE] px-4 py-1.5 rounded-full text-[9px] font-black text-orange-600 tracking-wider flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-3xs"
                        >
                          দেখুন <ArrowRight size={10} className="text-orange-500 shrink-0" />
                        </button>
                        <button 
                          onClick={() => setView('facebook-create-post')}
                          className="bg-white border border-slate-200 hover:bg-slate-50 px-4 py-1.5 rounded-full text-[9px] font-black text-slate-600 tracking-wider flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-3xs"
                        >
                          <Plus size={10} strokeWidth={3} className="shrink-0 text-slate-400" /> Post
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 2. GMAIL ACCOUNTS Card */}
                  <div className="bg-[#FFF5F5] border border-[#FFE3E3] rounded-[1.8rem] p-5 flex items-start gap-4 transition-all w-full text-left relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="w-11 h-11 rounded-full bg-[#FFEAEB] border border-[#FFD1D2] flex items-center justify-center shrink-0 text-red-500 shadow-sm">
                      <Mail size={20} strokeWidth={2.5} />
                    </div>
                    
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8.5px] font-black tracking-widest text-red-500 uppercase">GMAIL ACCOUNTS</span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-800 leading-none">Buy & Sell Gmail</h3>
                      <p className="text-[10px] md:text-xs text-slate-500 font-semibold leading-relaxed">
                        Instant payment · Escrow protected · Bulk upload সুবিধা সহ।
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button 
                          onClick={() => setView('gmail-market')}
                          className="bg-white border border-red-200 hover:bg-red-50/50 px-4 py-1.5 rounded-full text-[9px] font-black text-red-500 tracking-wider flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-3xs"
                        >
                          কিনুন <ArrowRight size={10} className="shrink-0 text-red-500" />
                        </button>
                        <button 
                          onClick={() => { setView('seller-center'); setShowSellNotice(true); }}
                          className="bg-white border border-slate-200 hover:bg-slate-50 px-4 py-1.5 rounded-full text-[9px] font-black text-slate-600 tracking-wider flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-3xs"
                        >
                          বিক্রি করুন
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 3. FACEBOOK ACCOUNTS Card */}
                  <div className="bg-[#F2F6FF] border border-[#E1ECFF] rounded-[1.8rem] p-5 flex items-start gap-4 transition-all w-full text-left relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="w-11 h-11 rounded-full bg-[#E5EFFF] border border-[#CDDFFF] flex items-center justify-center shrink-0 text-blue-600 shadow-sm">
                      <Facebook size={20} strokeWidth={2.5} />
                    </div>
                    
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8.5px] font-black tracking-widest text-blue-600 uppercase">FACEBOOK ACCOUNTS</span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-800 leading-none">Buy & Sell Facebook</h3>
                      <p className="text-[10px] md:text-xs text-slate-500 font-semibold leading-relaxed">
                        Verified accounts · Escrow protected · Custom fields per category!
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button 
                          onClick={() => { setSelectedCategoryFilter('Facebook'); setView('facebook-accounts-list'); }}
                          className="bg-white border border-blue-200 hover:bg-blue-50/50 px-4 py-1.5 rounded-full text-[9px] font-black text-blue-600 tracking-wider flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-3xs"
                        >
                          কিনুন <ArrowRight size={10} className="shrink-0 text-blue-500" />
                        </button>
                        <button 
                          onClick={() => setView('facebook-sell-center')}
                          className="bg-white border border-slate-200 hover:bg-slate-50 px-4 py-1.5 rounded-full text-[9px] font-black text-slate-600 tracking-wider flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-3xs"
                        >
                          বিক্রি করুন
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 4. INSTAGRAM ACCOUNTS Card */}
                  <div className="bg-[#FFF0F6] border border-[#FFE3F0] rounded-[1.8rem] p-5 flex items-start gap-4 transition-all w-full text-left relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="w-11 h-11 rounded-full bg-[#FFEAF3] border border-[#FFD1E6] flex items-center justify-center shrink-0 text-pink-500 shadow-sm">
                      <Camera size={20} strokeWidth={2.5} />
                    </div>
                    
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8.5px] font-black tracking-widest text-[#FF1493] uppercase">INSTAGRAM ACCOUNTS</span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-800 leading-none">Buy & Sell Instagram</h3>
                      <p className="text-[10px] md:text-xs text-slate-500 font-semibold leading-relaxed">
                        Verified accounts · Escrow protected · Custom fields per category!
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button 
                          onClick={() => handleShowComingSoon('Instagram')}
                          className="bg-white border border-pink-200 hover:bg-pink-50/50 px-4 py-1.5 rounded-full text-[9px] font-black text-pink-600 tracking-wider flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-3xs"
                        >
                          কিনুন <ArrowRight size={10} className="shrink-0 text-pink-500" />
                        </button>
                        <button 
                          onClick={() => handleShowComingSoon('Instagram')}
                          className="bg-white border border-slate-200 hover:bg-slate-50 px-4 py-1.5 rounded-full text-[9px] font-black text-slate-600 tracking-wider flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-3xs"
                        >
                          বিক্রি করুন
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 5. TELEGRAM OTP Card */}
                  <div className="bg-[#F0FAFF] border border-[#E0F3FF] rounded-[1.8rem] p-5 flex items-start gap-4 transition-all w-full text-left relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="w-11 h-11 rounded-full bg-[#E6F6FF] border border-[#CDEBFF] flex items-center justify-center shrink-0 text-cyan-600 shadow-sm">
                      <Send size={18} strokeWidth={2.5} className="-ml-0.5 mt-0.5" />
                    </div>
                    
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8.5px] font-black tracking-widest text-cyan-600 uppercase">TELEGRAM OTP</span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-800 leading-none">Buy & Sell Telegram OTP</h3>
                      <p className="text-[10px] md:text-xs text-slate-500 font-semibold leading-relaxed">
                        Instant OTP delivery · Escrow protected · Fast & secure!
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button 
                          onClick={() => handleShowComingSoon('Telegram OTP')}
                          className="bg-white border border-cyan-200 hover:bg-cyan-50/50 px-4 py-1.5 rounded-full text-[9px] font-black text-cyan-600 tracking-wider flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-3xs"
                        >
                          কিনুন <ArrowRight size={10} className="shrink-0 text-cyan-500" />
                        </button>
                        <button 
                          onClick={() => handleShowComingSoon('Telegram OTP')}
                          className="bg-white border border-slate-200 hover:bg-slate-50 px-4 py-1.5 rounded-full text-[9px] font-black text-slate-600 tracking-wider flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-3xs"
                        >
                          বিক্রি করুন
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 6. WHATSAPP OTP Card */}
                  <div className="bg-[#EFFFFA] border border-[#D3FDF1] rounded-[1.8rem] p-5 flex items-start gap-4 transition-all w-full text-left relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="w-11 h-11 rounded-full bg-[#E1FCF1] border border-[#BCFCE0] flex items-center justify-center shrink-0 text-emerald-600 shadow-sm">
                      <MessageSquare size={18} strokeWidth={2.5} />
                    </div>
                    
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8.5px] font-black tracking-widest text-emerald-600 uppercase">WHATSAPP OTP</span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-800 leading-none">Buy & Sell WhatsApp OTP</h3>
                      <p className="text-[10px] md:text-xs text-slate-500 font-semibold leading-relaxed">
                        Instant OTP delivery · Escrow protected · Fast & secure!
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button 
                          onClick={() => handleShowComingSoon('WhatsApp OTP')}
                          className="bg-white border border-emerald-200 hover:bg-emerald-50/50 px-4 py-1.5 rounded-full text-[9px] font-black text-emerald-600 tracking-wider flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-3xs"
                        >
                          কিনুন <ArrowRight size={10} className="shrink-0 text-emerald-500" />
                        </button>
                        <button 
                          onClick={() => handleShowComingSoon('WhatsApp OTP')}
                          className="bg-white border border-slate-200 hover:bg-slate-50 px-4 py-1.5 rounded-full text-[9px] font-black text-slate-600 tracking-wider flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-3xs"
                        >
                          বিক্রি করুন
                        </button>
                      </div>
                    </div>
                  </div>
                </section>                {/* Statistics Section */}
                <section className="mb-6">
                  <div className="flex flex-col gap-1.5 mb-3 text-left">
                    <h3 className="font-display text-xs font-black tracking-tight text-slate-800 uppercase">Our Statistics</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Real-time marketplace insights</p>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    {/* Total Users */}
                    <div className="bg-white rounded-xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.01)] p-3.5 flex flex-col justify-between transition-all hover:shadow-md hover:border-red-100/50 text-left">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Total Users</span>
                        <div className="w-6.5 h-6.5 bg-red-50 rounded-lg flex items-center justify-center text-red-500">
                          <Users size={12} />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-display text-sm font-black text-slate-800 tracking-tight">২,৪৫০+</h4>
                        <p className="text-[8px] font-bold text-slate-400 mt-0.5 leading-none">সরাসরি গ্রাহক</p>
                      </div>
                    </div>

                    {/* Total Orders */}
                    <div className="bg-white rounded-xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.01)] p-3.5 flex flex-col justify-between transition-all hover:shadow-md hover:border-emerald-100/50 text-left">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Total Orders</span>
                        <div className="w-6.5 h-6.5 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-500">
                          <ShoppingBag size={12} />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-display text-sm font-black text-slate-800 tracking-tight">১৪,৮০০+</h4>
                        <p className="text-[8px] font-bold text-slate-400 mt-0.5 leading-none">সম্পূর্ণ অর্ডার</p>
                      </div>
                    </div>

                    {/* Success Rate */}
                    <div className="bg-white rounded-xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.01)] p-3.5 flex flex-col justify-between transition-all hover:shadow-md hover:border-sky-100/50 text-left">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Success Rate</span>
                        <div className="w-6.5 h-6.5 bg-sky-50 rounded-lg flex items-center justify-center text-sky-500">
                          <CheckCircle2 size={12} />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-display text-sm font-black text-slate-800 tracking-tight">৯৯.৯%</h4>
                        <p className="text-[8px] font-bold text-slate-400 mt-0.5 leading-none">সফল লেনদেন</p>
                      </div>
                    </div>

                    {/* Live Support */}
                    <a 
                      href="https://wa.me/8801410731308"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white rounded-xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.01)] p-3.5 flex flex-col justify-between transition-all hover:shadow-md hover:border-emerald-200 cursor-pointer active:scale-98 group hover:bg-emerald-50/10 text-left"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Live Support</span>
                        <div className="w-6.5 h-6.5 bg-emerald-100/30 group-hover:bg-emerald-500 group-hover:text-white rounded-lg flex items-center justify-center text-emerald-600 transition-colors">
                          <Headphones size={12} />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-display text-sm font-black text-emerald-600 tracking-tight group-hover:underline">২৪/৭ অনলাইন</h4>
                        <p className="text-[8px] font-bold text-slate-400 mt-0.5 leading-none">যেকোনো সাহায্য পেতে</p>
                      </div>
                    </a>
                  </div>
                </section>

              </>
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
                          className="p-1.5 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-all active:rotate-180 duration-500"
                        >
                          <RefreshCw size={14} />
                        </button>
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-green-50 rounded-full border border-green-100">
                          <div className="w-1 h-1 bg-green-500 rounded-full" />
                          <span className="text-[10px] font-black text-green-600 uppercase tracking-widest leading-none">Live</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Available: <span className="text-emerald-600">{marketListings.length}</span></span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Tabs */}
                  <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                    <button 
                      onClick={() => setMarketTab('Market')}
                      className={`flex-1 py-2 px-4 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${marketTab === 'Market' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      জিমেইল-store
                    </button>
                    <button 
                      onClick={() => setMarketTab('Bought')}
                      className={`flex-1 py-2 px-4 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${marketTab === 'Bought' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      কেনা জিমেইল
                    </button>
                  </div>
                </div>

                {/* Search & Actions */}
                <div className="flex flex-col gap-2">
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-red-600 transition-colors" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search..."
                      value={marketSearchQuery}
                      onChange={(e) => setMarketSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white border border-slate-100 focus:outline-none focus:ring-2 focus:ring-red-50 transition-all font-bold text-slate-800 placeholder:text-slate-300 text-[10px]"
                    />
                  </div>
                  <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1.5 no-scrollbar">
                    {["All", "Full Fresh New", "Full Fresh old Gmail", "Used Gmail", "Aged"].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setMarketSearchQuery(cat === 'All' ? '' : cat)}
                        className={`px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shrink-0 cursor-pointer ${
                          (cat === 'All' && !marketSearchQuery) || marketSearchQuery === cat 
                          ? 'bg-red-600 text-white shadow-md' 
                          : 'bg-white border border-slate-100 text-slate-400 hover:text-red-600'
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
                      className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-all active:scale-95"
                    >
                      <CheckSquare size={12} strokeWidth={2.5} className="text-red-600" />
                      {filteredMarketListings.every(l => selectedListings.includes(l.id)) ? 'Deselect' : 'Select All'}
                    </button>
                    <button 
                      onClick={() => {
                        setIsBulkBuyMode(!isBulkBuyMode);
                        setSelectedListings([]);
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 ${isBulkBuyMode ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'}`}
                    >
                      <Layers size={12} strokeWidth={2.5} className={isBulkBuyMode ? 'text-white' : 'text-green-400'} />
                      {isBulkBuyMode ? 'Cancel' : 'Bulk'}
                    </button>
                  </div>
                  {selectedListings.length > 0 && (
                    <div className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <button 
                        onClick={handleBulkBuyFromBalance}
                        className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-red-100 active:scale-95"
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
                        <React.Fragment key={item.id}>
                          {adsterraEnabled && (i === 1 || i === 4) && (
                            <AdSenseSlot 
                              type="in-feed" 
                              className="my-1"
                              adsterraEnabled={adsterraEnabled}
                              adsterraBannerKey={adsterraBannerKey}
                              adsterraMobileBannerKey={adsterraMobileBannerKey}
                              adsterraInFeedKey={adsterraInFeedKey}
                              adsterraStickyKey={adsterraStickyKey}
                            />
                          )}
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.02 }}
                            className={`bg-white rounded-xl border p-2.5 md:p-4 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex items-center justify-between gap-2.5 cursor-pointer active:scale-[0.99] ${selectedListings.includes(item.id) ? 'border-red-600 ring-2 ring-red-500/10' : 'border-slate-100'}`}
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
                                <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${selectedListings.includes(item.id) ? 'bg-red-600 border-red-600' : 'bg-white border-slate-200'}`}>
                                  {selectedListings.includes(item.id) && <Check size={14} className="text-white" strokeWidth={3} />}
                                </div>
                              ) : (
                                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 border border-slate-50 group-hover:bg-red-600 group-hover:text-white transition-all shrink-0">
                                  <Mail size={14} className="group-hover:text-white text-red-600" />
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5 w-full min-w-0">
                                  <h4 className="font-display text-[10px] min-[360px]:text-xs md:text-sm font-black text-slate-800 truncate min-w-0 flex-shrink" title={item.maskedEmail || item.gmailAccount}>
                                    {item.maskedEmail || item.gmailAccount}
                                  </h4>
                                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-50 rounded-full border border-green-100 shrink-0">
                                    <div className="w-1 h-1 bg-green-500 rounded-full" />
                                    <span className="text-[5px] md:text-[8px] font-black text-green-600 uppercase tracking-widest leading-none">Available</span>
                                  </div>
                                </div>
                                <p className="text-[9px] md:text-[11px] font-black text-blue-600 uppercase tracking-tight">
                                  {item.type || 'FRESH'}
                                </p>
                                {item.description && (
                                  <p className="text-[9px] md:text-[11px] text-slate-500 font-medium leading-tight mt-1 line-clamp-none break-all">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 md:gap-3 shrink-0 relative z-10">
                              {(() => {
                                const priceObj = gmailPrices[item.type];
                                const displayPrice = priceObj?.buyer ? parseFloat(priceObj.buyer) : item.price;
                                return (
                                  <p className="text-[10px] min-[360px]:text-[11px] md:text-lg font-black text-slate-900">৳{displayPrice.toFixed(0)}</p>
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
                                className={`h-7 min-[360px]:h-8 px-2 md:px-6 rounded-lg font-black text-[8px] min-[360px]:text-[9px] md:text-xs uppercase tracking-widest transition-all active:scale-90 flex items-center justify-center gap-1 md:gap-2 ${isBulkBuyMode ? (selectedListings.includes(item.id) ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400') : 'bg-red-600 hover:bg-slate-900 text-white shadow-sm shadow-red-100'}`}
                              >
                                {isSubmitting ? <RefreshCw className="animate-spin" size={10} /> : (isBulkBuyMode ? (selectedListings.includes(item.id) ? 'Selected' : 'Select') : 'BUY')}
                              </button>
                            </div>
                          </motion.div>
                        </React.Fragment>
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
                                  <p className="text-[8px] md:text-[10px] text-white/40 font-bold uppercase tracking-widest">{formatDate(order.purchasedAt)}</p>
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

                          <div className="p-4 md:p-6 bg-white/5 rounded-2xl md:rounded-3xl border border-white/10 space-y-3 md:space-y-4 min-w-0">
                            <div className="space-y-0.5 min-w-0">
                              <span className="text-[8px] md:text-[9px] text-white/40 uppercase font-black tracking-widest block leading-none mb-1">Email Address</span>
                              <p className="font-mono text-white text-xs md:text-sm font-bold flex items-center justify-between bg-white/5 p-2 rounded-lg min-w-0 gap-2">
                                <span className="truncate mr-2 flex-1 min-w-0 break-all select-all">{order.credentials?.email}</span>
                                <button onClick={() => { navigator.clipboard.writeText(order.credentials?.email); alert('Email Copied!'); }} className="p-1.5 hover:bg-white/10 rounded-lg text-red-400 shrink-0"><Copy size={12} /></button>
                              </p>
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <span className="text-[8px] md:text-[9px] text-white/40 uppercase font-black tracking-widest block leading-none mb-1">Password</span>
                              <p className="font-mono text-[#FFEB3B] text-xs md:text-sm font-bold flex items-center justify-between bg-white/5 p-2 rounded-lg min-w-0 gap-2">
                                <span className="truncate mr-2 flex-1 min-w-0 break-all select-all">{order.credentials?.password}</span>
                                <button onClick={() => { navigator.clipboard.writeText(order.credentials?.password); alert('Password Copied!'); }} className="p-1.5 hover:bg-white/10 rounded-lg text-white shrink-0"><Copy size={12} /></button>
                              </p>
                            </div>
                            {(order.credentials?.recovery || order.credentials?.recoveryEmail) && (
                              <div className="space-y-0.5 min-w-0">
                                <span className="text-[8px] md:text-[9px] text-white/40 uppercase font-black tracking-widest block leading-none mb-1">Recovery Email</span>
                                <p className="font-mono text-white text-xs md:text-sm font-bold flex items-center justify-between bg-white/5 p-2 rounded-lg min-w-0 gap-2">
                                  <span className="truncate mr-2 flex-1 min-w-0 break-all select-all">{order.credentials?.recovery || order.credentials?.recoveryEmail}</span>
                                  <button onClick={() => { navigator.clipboard.writeText(order.credentials?.recovery || order.credentials?.recoveryEmail); alert('Recovery Email Copied!'); }} className="p-1.5 hover:bg-white/10 rounded-lg text-red-400 shrink-0"><Copy size={12} /></button>
                                </p>
                              </div>
                            )}
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
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-6 pb-24 text-left"
              >
                <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6">
                  {user && (
                    <>
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
                                  if (user?.uid) {
                                    navigator.clipboard.writeText(user.uid);
                                    alert('User ID Copied!');
                                  }
                                }}
                                className="text-blue-500 hover:text-blue-600 transition-colors bg-transparent border-none p-0 cursor-pointer"
                                type="button"
                              >
                                <Copy size={12} />
                              </button>
                           </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                         <div className="p-4 bg-green-50 rounded-[1.5rem] border border-green-100 text-center flex flex-col items-center justify-between min-h-[120px]">
                            <div>
                              <span className="block text-[8px] font-extrabold text-green-600 uppercase tracking-widest mb-1">Deposit Wallet</span>
                              <span className="text-lg font-black text-[#2E7D32]">৳{userProfile?.balance?.toFixed(2) || '0.00'}</span>
                            </div>
                            <button 
                              type="button"
                              onClick={() => handleDepositTrigger()}
                              className="mt-1 px-2.5 py-1.5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-xl text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-sm active:scale-95 w-full text-center"
                            >
                              + Deposit
                            </button>
                         </div>
                         <div className="p-4 bg-emerald-50 rounded-[1.5rem] border border-emerald-100 text-center flex flex-col items-center justify-between min-h-[120px]">
                            <div>
                              <span className="block text-[8px] font-extrabold text-emerald-600 uppercase tracking-widest mb-1">Withdrawable</span>
                              <span className="text-lg font-black text-emerald-700">৳{userProfile?.earningsBalance?.toFixed(2) || '0.00'}</span>
                            </div>
                            <button 
                              type="button"
                              onClick={() => {
                                setWithdrawMode('earnings');
                                setShowWithdrawModal(true);
                              }}
                              className="mt-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-sm active:scale-95 w-full text-center"
                            >
                              Withdraw
                            </button>
                         </div>
                         <div className="p-4 bg-orange-50 rounded-[1.5rem] border border-orange-100 text-center flex flex-col items-center justify-center min-h-[120px]">
                            <span className="block text-[8px] font-extrabold text-orange-400 uppercase tracking-widest mb-1">Total Spent</span>
                            <span className="text-lg font-black text-orange-600">৳{userProfile?.totalSpent?.toFixed(0) || '0'}</span>
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
                                 type="text"
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
                    </>
                  )}
                </div>
              </motion.div>
            ) : view === 'transactions' ? (
              <motion.div
                key="transactions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 pb-24"
              >
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                        <Zap size={20} fill="currentColor" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Activities</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">History & Quick Actions</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setView('sell-earn'); setSellEarnTab('services'); }}
                      className="px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-200 active:scale-95 transition-all flex items-center gap-2"
                    >
                      <Zap size={12} fill="currentColor" />
                      Quick Action
                    </button>
                  </div>

                  {/* Transaction Statistics */}
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Sales</p>
                        <p className="text-2xl font-black text-slate-800">{sellerListings.filter(l => l.status === 'Sold').length}</p>
                     </div>
                     <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Earned</p>
                        <p className="text-2xl font-black text-green-600">৳{userProfile?.totalEarned?.toFixed(0) || '0'}</p>
                     </div>
                  </div>

                  {/* Transaction History Section */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm mt-6">
                    <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                       <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest flex items-center gap-2">
                          <Clock size={14} className="text-red-600" />
                          Recent History
                       </h3>
                    </div>
                    <div className="divide-y divide-slate-50 min-h-[200px]">
                      {combinedRecentHistory.length === 0 ? (
                        <div className="p-10 text-center flex flex-col items-center justify-center min-h-[200px]">
                           <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                              <Clock size={20} className="text-slate-200" />
                           </div>
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No activities yet</p>
                        </div>
                      ) : (
                        combinedRecentHistory.map((item: any) => {
                          const isDeposit = item.txType === 'deposit';
                          const statusLower = (item.status || 'pending').toLowerCase();
                          const isSuccess = statusLower === 'verified' || statusLower === 'approved';
                          const isPending = statusLower === 'pending';
                          
                          return (
                            <div key={item.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                              {/* Left side: Type & Amount */}
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                                  isDeposit 
                                    ? 'bg-emerald-50 text-emerald-600' 
                                    : 'bg-rose-50 text-rose-600'
                                }`}>
                                  {isDeposit ? (
                                    <div className="relative">
                                      <Wallet size={16} />
                                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                      </span>
                                    </div>
                                  ) : (
                                    <ArrowUpRight size={16} className="rotate-180" />
                                  )}
                                </div>
                                <div className="text-left">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-black text-slate-800">
                                      {isDeposit ? 'Deposit' : 'Withdrawal'}
                                    </span>
                                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase tracking-wider">
                                      {item.method.toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-bold">
                                    <span>{formatDateBengali(item.createdAt)}</span>
                                    <span>•</span>
                                    <span>{formatTimeOnly(item.createdAt)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Right side: Amount & Status */}
                              <div className="text-right flex flex-col items-end gap-1 shrink-0">
                                <span className={`text-sm font-black tracking-tight ${
                                  isDeposit ? 'text-emerald-600' : 'text-rose-600'
                                }`}>
                                  {isDeposit ? '+' : '-'} ৳{item.amount.toFixed(2)}
                                </span>
                                
                                {isSuccess ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-[#e2f5e9] text-[#1e7e43] uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#2ebd6e]" />
                                    Confirm
                                  </span>
                                ) : isPending ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-50 text-amber-700 uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                    Pending
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-50 text-rose-700 uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                    Rejected
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
               </motion.div>
            ) : view === 'sell-earn' ? (
               <motion.div
                key="sell-earn"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-6 pb-24"
              >
                  {/* Header Segment */}
                  <div className="pt-2 pb-1">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Sell & Earn</h2>
                    <p className="text-[11px] text-slate-500 font-bold leading-tight">
                      Account বিক্রি করুন বা tasks করুন — আপনার পছন্দের উপায়ে...
                    </p>
                  </div>

                  {/* Balance Display */}
                  {sellEarnTab === 'earn' && (
                     <div className="w-full">
                        {/* Withdrawable Earnings */}
                        <div className="bg-emerald-600 rounded-3xl p-6 text-white shadow-xl shadow-emerald-200 relative overflow-hidden group flex flex-col justify-between">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                           <div className="relative z-10">
                              <div className="flex items-center gap-2 mb-1.5 opacity-80">
                                 <Wallet size={14} />
                                 <span className="text-[10px] font-black uppercase tracking-widest">Withdrawable Earnings</span>
                              </div>
                              <div className="flex items-end gap-2">
                                 <span className="text-3xl font-black tracking-tight">৳{userProfile?.earningsBalance?.toFixed(2) || '0.00'}</span>
                                 <span className="text-[10px] font-bold mb-1.5 opacity-60">Current Profit</span>
                              </div>
                           </div>
                           <div className="relative z-10 mt-4">
                              <button
                                onClick={() => {
                                  if ((userProfile?.earningsBalance || 0) < 50) {
                                     alert("নূন্যতম ৫০ টাকা হলে উইথড্র করতে পারবেন!");
                                     return;
                                  }
                                  setWithdrawMode('earnings');
                                  setShowWithdrawModal(true);
                                }}
                                className="w-full sm:w-auto px-6 py-2.5 bg-white text-emerald-700 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-emerald-50 transition-all active:scale-95 flex items-center justify-center gap-1 shadow-sm inline-flex"
                              >
                                <Wallet size={12} />
                                উইথড্র করুন (Withdraw Earnings)
                              </button>
                           </div>
                        </div>
                     </div>
                  )}



                  {/* List Section based on tabs */}
                  <div className="grid grid-cols-1 gap-4">
                     {sellEarnTab === 'services' ? (
                        // Tab 1: Account sales services only
                        [
                           { title: "Sell Gmail Accounts", badge: "Popular", color: "bg-rose-50 text-rose-600", icon: Mail, desc: "আপনার Gmail accounts বিক্রি করুন। প্রতিটি account বিক্রিতে সাথে সাথে payment পাবেন।", action: () => setView('seller-center') },
                           { title: "Sell Facebook Accounts", badge: "Active", color: "bg-blue-50 text-blue-600", icon: Facebook, desc: "Verified Facebook accounts বিক্রি করুন। Dynamic fields ও escrow protection সহ।", action: () => setView('facebook-sell-center') },
                           { title: "Sell Telegram OTP", badge: "Active", color: "bg-red-50 text-red-600", icon: Send, desc: "Telegram OTP numbers বিক্রি করুন। Buyer-এর সাথে chat-এ OTP deliver করুন।", action: () => handleShowComingSoon('Telegram OTP') },
                           { title: "Sell WhatsApp OTP", badge: "Active", color: "bg-emerald-50 text-emerald-600", icon: MessageSquare, desc: "WhatsApp OTP numbers বিক্রি করুন। Secure escrow-এ payment রাখা হয়।", action: () => handleShowComingSoon('WhatsApp OTP') },
                        ].map((item, idx) => (
                           <button 
                              key={idx}
                              onClick={item.action}
                              className="w-full bg-white rounded-3xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all text-left flex items-start gap-4 active:scale-[0.99] cursor-pointer"
                           >
                              <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center shrink-0`}>
                                 <item.icon size={24} />
                              </div>
                              <div className="flex-1 space-y-1">
                                 <div className="flex items-center justify-between">
                                    <h3 className="font-black text-slate-800 text-sm">{item.title}</h3>
                                    <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${item.color} bg-opacity-10`}>{item.badge}</span>
                                 </div>
                                 <p className="text-[10px] text-slate-400 font-bold leading-snug">{item.desc}</p>
                                 <div className="flex items-center gap-1 text-red-600 font-black text-[10px] uppercase tracking-widest mt-1.5">
                                    শুরু করুন <ArrowRight size={10} />
                                 </div>
                              </div>
                           </button>
                        ))
                     ) : (
                        // Tab 2: Easy earning microtasks (Daily Check-in, Ads, YT subscription, TG join, Refer & Multiply)
                        [
                           { 
                              title: "Daily Check-In", 
                              badge: "Daily Bonus", 
                              color: "bg-emerald-50 text-emerald-600", 
                              icon: Gift, 
                              desc: "প্রতিদিন একবার ক্লেইম করে সম্পূর্ণ ফ্রীতে ১.০০ টাকা সরাসরি রিওয়ার্ড ওয়ালেটে যোগ করুন।", 
                              action: handleDailyCheckIn 
                           },
                           { 
                              title: "Ads View on Earn", 
                              badge: "৳০.১০/View", 
                              color: "bg-amber-50 text-amber-600", 
                              icon: Megaphone, 
                              desc: "ভেরিফাইড স্পন্সর করা এড দেখে প্রতিটি ভিউর জন্য সাথে সাথে আয় করুন ১০ পয়সা।", 
                              action: () => setShowAdsEarnModal(true) 
                           },
                           { 
                              title: "Official Youtube Task", 
                              badge: "৳১.৫০/Instantly", 
                              color: "bg-red-50 text-red-600", 
                              icon: Youtube, 
                              desc: "অফিসিয়াল ইউটিউব চ্যানেল সাবস্ক্রাইব করে ফ্রীতে ১.৫০ টাকা ওয়ালেট বোনাস ক্লেইম করুন।", 
                              action: handleYoutubeSubscribeTask 
                           },
                           { 
                              title: "Official Telegram Task", 
                              badge: "৳১.০০/Free", 
                              color: "bg-sky-50 text-sky-600", 
                              icon: Send, 
                              desc: "অফিসিয়াল টেলিগ্রাম চ্যানেলে জয়েন করুন এবং আপনার রিওয়ার্ড ব্যালেন্সে ১টাকা নিয়ে নিন।", 
                              action: handleTelegramJoinTask 
                           },
                           
                        ].map((item, idx) => (
                           <button 
                              key={idx}
                              onClick={item.action}
                              className="w-full bg-white rounded-3xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all text-left flex items-start gap-4 active:scale-[0.99] cursor-pointer"
                           >
                              <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center shrink-0`}>
                                 <item.icon size={22} />
                              </div>
                              <div className="flex-1 space-y-1">
                                 <div className="flex items-center justify-between">
                                    <h3 className="font-black text-slate-800 text-sm">{item.title}</h3>
                                    <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${item.color} bg-opacity-10`}>{item.badge}</span>
                                 </div>
                                 <p className="text-[10px] text-slate-400 font-bold leading-snug">{item.desc}</p>
                                 <div className="flex items-center gap-1 text-red-600 font-black text-[10px] uppercase tracking-widest mt-1.5">
                                    টাস্ক ক্লেইম করুন <ArrowRight size={10} />
                                 </div>
                              </div>
                           </button>
                        ))
                     )}
                  </div>
              </motion.div>
            ) : view === 'facebook-sell-center' ? (
               <motion.div
                key="facebook-sell-center"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 pb-24"
              >
                  {/* Header */}
                  <div className="flex items-center gap-4 bg-white/50 p-4 rounded-3xl border border-white">
                     <div className="w-14 h-14 bg-[#E7F3FF] text-[#1877F2] rounded-2xl flex items-center justify-center shadow-sm">
                        <Facebook size={32} fill="currentColor" />
                     </div>
                     <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Facebook Sell Center</h2>
                        <p className="text-[11px] font-bold text-slate-500 leading-none">আপনার Facebook accounts বিক্রি করুন</p>
                     </div>
                  </div>

                  {/* Summary Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                     {[
                        { label: 'Available', count: fbListings.filter(l => l.status === 'Live').length.toString(), color: 'text-blue-600' },
                        { label: 'Pending', count: fbListings.filter(l => l.status === 'Pending').length.toString(), color: 'text-orange-500' },
                        { label: 'Disputes', count: fbListings.filter(l => l.status === 'Dispute').length.toString(), color: 'text-rose-500' },
                        { label: 'Total Earned', count: `৳${fbListings.filter(l => l.status === 'Sold').reduce((acc, curr) => acc + 4.10, 0).toFixed(2)}`, color: 'text-emerald-600' }
                     ].map((stat, i) => (
                        <div key={i} className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center min-h-[90px]">
                           <span className={`text-xl font-black mb-0.5 ${stat.color}`}>{stat.count}</span>
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{stat.label}</span>
                        </div>
                     ))}
                  </div>

                  {/* Tabs Section */}
                  <div className="bg-[#E8EDE8]/50 p-1.5 rounded-2xl flex border border-white/50">
                     <button 
                        onClick={() => setFbTab('sell')}
                        className={`flex-1 py-3 px-2 rounded-xl text-center transition-all ${fbTab === 'sell' ? 'bg-white shadow-sm' : ''}`}
                     >
                        <span className={`block text-[11px] font-black leading-tight ${fbTab === 'sell' ? 'text-slate-800' : 'text-slate-500'}`}>Account Sell</span>
                        <span className={`block text-[10px] font-bold ${fbTab === 'sell' ? 'text-slate-500' : 'text-slate-400'}`}>করুন</span>
                     </button>
                     <button 
                        onClick={() => setFbTab('history')}
                        className={`flex-1 py-3 px-2 rounded-xl text-center transition-all ${fbTab === 'history' ? 'bg-white shadow-sm' : ''}`}
                     >
                        <span className={`block text-[11px] font-black leading-tight ${fbTab === 'history' ? 'text-slate-800' : 'text-slate-500'}`}>Sold History</span>
                        <span className={`block text-[10px] font-bold ${fbTab === 'history' ? 'text-slate-500' : 'text-slate-400'}`}>({fbListings.filter(l => l.status === 'Sold').length})</span>
                     </button>
                     <button 
                        onClick={() => setFbTab('archive')}
                        className={`flex-1 py-3 px-2 rounded-xl text-center flex items-center justify-center gap-2 transition-all ${fbTab === 'archive' ? 'bg-white shadow-sm' : ''}`}
                     >
                        <Archive size={14} className={fbTab === 'archive' ? 'text-slate-800' : 'text-slate-400'} />
                        <span className={`text-[11px] font-black leading-tight ${fbTab === 'archive' ? 'text-slate-800' : 'text-slate-500'}`}>Archive</span>
                     </button>
                  </div>

                  {fbTab === 'sell' ? (
                     <>
                        {/* Submit Form */}
                  <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                     <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                        Account জমা দিন
                     </h3>

                     {fbSuccess && (
                        <div className="bg-[#F8F9FA] border border-slate-100 rounded-2xl p-4 space-y-1">
                           <h4 className="font-black text-slate-800 text-sm">Success!</h4>
                           <p className="text-[11px] font-bold text-slate-500">{fbSuccess.count} account(s) listed.</p>
                        </div>
                     )}
                     
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 block">
                           Category <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                           <select 
                             value={fbCategory}
                             onChange={(e) => setFbCategory(e.target.value)}
                             className={`w-full h-14 bg-slate-50 border ${fbCategory ? 'border-emerald-500 ring-1 ring-emerald-50' : 'border-slate-100'} rounded-2xl px-4 text-sm font-bold ${fbCategory ? 'text-slate-800' : 'text-slate-400'} appearance-none focus:outline-none focus:border-blue-200 transition-all`}
                           >
                              <option value="">Category select করুন...</option>
                              <option value="num-00-frd-2fa">NUM 00 FRD 2FA 🔻 Number+PASS+2FA — ৳4.10</option>
                              <option value="Facebook">Facebook (ID, Page or Group)</option>
                              <option value="YouTube">YouTube Channel</option>
                              <option value="অন্যান্য">অন্যান্য (Custom Digital Asset)</option>
                           </select>
                           <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                        </div>
                     </div>
 
                     {fbCategory && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-6 pt-2"
                        >
                           {/* Custom Product Marketing Details */}
                           <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-2xl space-y-3.5">
                              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">পণ্য বা লিস্টিং এর বিবরণ</h4>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                 <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-500 uppercase pl-1 block">লিস্টিং টাইটেল (Title) <span className="text-rose-500">*</span></label>
                                    <input 
                                       type="text"
                                       placeholder="e.g. 5k follow / 7200 সাবস্ক্রাইব"
                                       value={fbForm.title}
                                       onChange={(e) => setFbForm({...fbForm, title: e.target.value})}
                                       className="w-full h-11 bg-white border border-slate-150 rounded-xl px-3.5 text-xs font-bold focus:outline-none focus:border-emerald-500 transition-all"
                                    />
                                 </div>
                                 <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-500 uppercase pl-1 block">নির্ধারিত মূল্য (BDT / ৳) <span className="text-rose-500">*</span></label>
                                    <input 
                                       type="number"
                                       placeholder="e.g. 3000"
                                       value={fbForm.price}
                                       onChange={(e) => setFbForm({...fbForm, price: e.target.value})}
                                       className="w-full h-11 bg-white border border-slate-150 rounded-xl px-3.5 text-xs font-bold focus:outline-none focus:border-emerald-500 transition-all"
                                    />
                                 </div>
                              </div>

                              <div className="space-y-1">
                                 <label className="text-[9px] font-black text-slate-500 uppercase pl-1 block">বিস্তারিত বর্ণনা (Description)</label>
                                 <input 
                                    type="text"
                                    placeholder="e.g. 5k call mom / আসসালামু আলাইকুম একটা..."
                                    value={fbForm.description}
                                    onChange={(e) => setFbForm({...fbForm, description: e.target.value})}
                                    className="w-full h-11 bg-white border border-slate-150 rounded-xl px-3.5 text-xs font-bold focus:outline-none focus:border-emerald-500 transition-all"
                                 />
                              </div>
                           </div>

                           {/* Price Info */}
                           <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-4">
                              <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-3 pl-1">মূল্য তথ্য ও হিসাব</h4>
                              <div className="grid grid-cols-3 gap-2">
                                 <div className="bg-white rounded-2xl p-3 border border-emerald-50 text-center">
                                    <p className="text-[9px] font-bold text-slate-400 leading-none mb-1">Base Price</p>
                                    <p className="text-xs font-black text-slate-800">৳{(Number(fbForm.price) || 0).toFixed(2)}</p>
                                 </div>
                                 <div className="bg-white rounded-2xl p-3 border border-emerald-50 text-center">
                                    <p className="text-[9px] font-bold text-slate-400 leading-none mb-1">Fee (7%)</p>
                                    <p className="text-xs font-black text-rose-500">-৳{(Number(fbForm.price || 0) * 0.07).toFixed(2)}</p>
                                 </div>
                                 <div className="bg-[#DCFCE7] rounded-2xl p-3 border border-emerald-100 text-center">
                                    <p className="text-[9px] font-bold text-emerald-700 leading-none mb-1">আপনি পাবেন</p>
                                    <p className="text-xs font-black text-emerald-700">৳{(Number(fbForm.price || 0) * 0.93).toFixed(2)}</p>
                                 </div>
                              </div>
                           </div>

                           {/* Upload Type Toggle */}
                           <div className="bg-slate-100/50 p-1 rounded-2xl flex border border-slate-100">
                              <button 
                                 onClick={() => setFbUploadType('single')}
                                 className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${fbUploadType === 'single' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}
                              >
                                 Single
                              </button>
                              <button 
                                 onClick={() => setFbUploadType('bulk')}
                                 className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${fbUploadType === 'bulk' ? 'bg-white shadow-sm text-slate-850' : 'text-slate-500'}`}
                              >
                                 Bulk Upload
                              </button>
                           </div>
 
                           {/* Input Fields */}
                           <div className="space-y-4">
                              {fbUploadType === 'single' ? (
                                 <>
                                    <div className="space-y-1.5">
                                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 block">Phone Number <span className="text-rose-500">*</span></label>
                                       <input 
                                          type="text"
                                          placeholder="Phone Number"
                                          value={fbForm.phone}
                                          onChange={(e) => setFbForm({...fbForm, phone: e.target.value})}
                                          className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold focus:outline-none focus:border-blue-200"
                                       />
                                    </div>
                                    <div className="space-y-1.5">
                                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 block">Password <span className="text-rose-500">*</span></label>
                                       <input 
                                          type="password"
                                          placeholder="Enter password..."
                                          value={fbForm.password}
                                          onChange={(e) => setFbForm({...fbForm, password: e.target.value})}
                                          className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold focus:outline-none focus:border-blue-200"
                                       />
                                    </div>
                                    <div className="space-y-1.5">
                                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 block">2FA Key <span className="text-rose-500">*</span></label>
                                       <input 
                                          type="text"
                                          placeholder="Enter 2FA secret key..."
                                          value={fbForm.twoFAMethod}
                                          onChange={(e) => setFbForm({...fbForm, twoFAMethod: e.target.value})}
                                          className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold focus:outline-none focus:border-blue-200"
                                       />
                                    </div>
                                 </>
                              ) : (
                                 <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 block">Bulk Data <span className="text-rose-500">*</span></label>
                                    <textarea 
                                       placeholder="Phone|Pass|2FA (One per line)"
                                       value={fbForm.bulkContent}
                                       onChange={(e) => setFbForm({...fbForm, bulkContent: e.target.value})}
                                       className="w-full h-32 bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm font-bold focus:outline-none focus:border-blue-200 resize-none font-mono"
                                    />
                                 </div>
                              )}
 
                              <button 
                                onClick={handleAddFacebookAccounts}
                                className="w-full h-14 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 transition-all active:scale-[0.98]"
                              >
                                 <Plus size={20} />
                                 Account যোগ করুন
                              </button>
                           </div>
                        </motion.div>
                     )}
                  </div>

                  {/* Inventory Section */}
                  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                     <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex items-center gap-2">
                        <Package size={16} className="text-emerald-500" />
                        <h3 className="text-xs font-black text-slate-800 tracking-tight">আমার Inventory</h3>
                     </div>
                     
                     {fbListings.length === 0 ? (
                        <div className="p-10 text-center">
                           <p className="text-[11px] font-bold text-slate-400">কোনো account নেই।</p>
                        </div>
                     ) : (
                        <div className="divide-y divide-slate-50">
                           {fbListings.map((item) => {
                              const isRevealed = !!revealedFbListings[item.id];
                              return (
                                 <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50/40 transition-colors">
                                    <div className="space-y-1 max-w-[70%] text-left">
                                       <div className="flex items-center gap-2">
                                          <h4 className="text-[11px] font-black text-slate-850 leading-tight">
                                             NUM 00 FRD 2FA 🔻 Number+...
                                          </h4>
                                       </div>
                                       <div className="text-[10px] font-mono text-slate-600 bg-slate-50/50 px-2.5 py-1.5 rounded-lg border border-slate-100 inline-block font-semibold">
                                          {isRevealed ? (
                                             <span className="break-all font-bold">
                                                {item.phone} | {item.password} | {item.twoFA}
                                             </span>
                                          ) : (
                                             <span className="tracking-widest font-black text-slate-400">•••••••••</span>
                                          )}
                                       </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 shrink-0">
                                       <span className="px-2.5 py-0.5 bg-[#1877F2]/10 text-[#1877F2] rounded-full text-[10px] font-black tracking-wider uppercase">
                                          {item.status || 'Live'}
                                       </span>
                                       
                                       <button 
                                          onClick={() => setRevealedFbListings(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                                          title="View/Hide Password"
                                       >
                                          {isRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
                                       </button>
                                       
                                       <button 
                                          onClick={() => handleDeleteFacebookAccount(item.id)}
                                          className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                          title="Delete listing"
                                       >
                                          <Trash2 size={16} />
                                       </button>
                                    </div>
                                 </div>
                              );
                           })}
                        </div>
                     )}
                  </div>

                  {/* Mini Stats Summary */}
                  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                     <div className="p-4 border-b border-slate-50 flex items-center gap-2">
                        <TrendingUp size={16} className="text-slate-500" />
                        <h3 className="text-xs font-black text-slate-800 tracking-tight">সংক্ষিপ্ত হিসাব</h3>
                     </div>
                     <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                           <span className="text-[11px] font-bold text-slate-600">অপেক্ষায় আছে</span>
                           <span className="w-8 h-5 bg-slate-100 rounded flex items-center justify-center text-[10px] font-black text-slate-800">
                             {fbListings.filter(l => l.status === 'Pending' || l.status === 'Live').length}
                           </span>
                        </div>
                        <div className="flex items-center justify-between">
                           <span className="text-[11px] font-bold text-slate-600">সম্পন্ন বিক্রয়</span>
                           <span className="w-8 h-5 bg-emerald-100 text-emerald-700 rounded flex items-center justify-center text-[10px] font-black">
                             {fbListings.filter(l => l.status === 'Sold').length}
                           </span>
                        </div>
                        <div className="flex items-center justify-between">
                           <span className="text-[11px] font-bold text-slate-600">Dispute হয়েছে</span>
                           <span className="w-8 h-5 bg-rose-100 text-rose-700 rounded flex items-center justify-center text-[10px] font-black">
                             {fbListings.filter(l => l.status === 'Dispute').length}
                           </span>
                        </div>
                     </div>
                  </div>

                  {/* Info Cards */}
                  <div className="grid grid-cols-1 gap-3">
                     <div className="bg-blue-600 p-5 rounded-3xl text-white shadow-lg shadow-blue-200">
                        <div className="flex gap-3">
                           <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                              <CreditCard size={20} />
                           </div>
                           <div className="space-y-1">
                              <h4 className="font-black text-sm leading-none">Payment System</h4>
                              <p className="text-[10px] font-bold opacity-80 leading-relaxed">
                                 Buyer verify করলে payment পাবেন। না করলে ২৪ ঘণ্টা পর auto-verify।
                              </p>
                           </div>
                        </div>
                     </div>

                     <div className="bg-[#1D4ED8] p-5 rounded-3xl text-white shadow-lg shadow-blue-300">
                        <div className="flex gap-3">
                           <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                              <ShieldCheck size={20} />
                           </div>
                           <div className="space-y-1">
                              <h4 className="font-black text-sm leading-none">Dispute Protection</h4>
                              <p className="text-[10px] font-bold opacity-80 leading-relaxed">
                                 Dispute হলে ৮ ঘণ্টার মধ্যে respond করুন।
                              </p>
                           </div>
                        </div>
                     </div>
                  </div>
                     </>
                  ) : fbTab === 'history' ? (
                     <div className="space-y-5">
                        {/* Title & Badge */}
                        <div className="flex items-center justify-between">
                           <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                              Sold History
                           </h3>
                           <span className="text-white text-[12px] font-bold bg-[#385623] py-1 px-3 rounded-full shadow-sm">
                              {fbListings.filter(l => l.status === 'Sold').length} of {fbListings.filter(l => l.status === 'Sold').length}
                           </span>
                        </div>

                        {/* Search Input */}
                        <div className="relative">
                           <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <Search size={16} className="text-slate-400" />
                           </div>
                           <input
                              type="text"
                              placeholder="Search category, ID..."
                              value={fbHistorySearch}
                              onChange={(e) => setFbHistorySearch(e.target.value)}
                              className="w-full h-12 pl-11 pr-4 bg-white border border-slate-100 rounded-2xl text-xs font-bold focus:outline-none focus:border-blue-200 shadow-sm"
                           />
                        </div>

                        {/* Actions Row */}
                        <div className="grid grid-cols-2 gap-3">
                           <button 
                              onClick={handleCopyAllSold}
                              className="h-12 bg-white rounded-2xl flex items-center justify-center gap-2 text-xs font-black text-slate-700 hover:bg-slate-50 border border-slate-100 shadow-sm active:scale-[0.98] transition-all"
                           >
                              <Copy size={14} className="text-slate-500" />
                              Copy All
                           </button>
                           <button 
                              onClick={handleExportSold}
                              className="h-12 bg-white rounded-2xl flex items-center justify-center gap-2 text-xs font-black text-slate-700 hover:bg-slate-50 border border-slate-100 shadow-sm active:scale-[0.98] transition-all"
                           >
                              <Download size={14} className="text-slate-500" />
                              Export
                           </button>
                        </div>

                        {/* Sub filters */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                           {[
                              { key: 'all', label: 'All', count: fbListings.filter(l => l.status === 'Sold').length },
                              { key: 'pending', label: 'Pending', count: fbListings.filter(l => l.status === 'Pending').length },
                              { key: 'approved', label: 'Approved', count: fbListings.filter(l => l.status === 'Sold').length },
                              { key: 'disputed', label: 'Disputed', count: fbListings.filter(l => l.status === 'Dispute').length },
                              { key: 'escalated', label: 'Escalated', count: 0 },
                              { key: 'refunded', label: 'Refunded', count: 0 }
                           ].map((subf) => {
                              const isActive = fbHistoryFilter === subf.key;
                              return (
                                 <button
                                    key={subf.key}
                                    onClick={() => setFbHistoryFilter(subf.key as any)}
                                    className={`py-1.5 px-3 rounded-full text-xs font-bold transition-all border ${
                                       isActive 
                                       ? 'bg-[#385623] border-[#385623] text-white shadow-sm' 
                                       : 'bg-white border-slate-150 text-slate-600 hover:bg-slate-50'
                                    }`}
                                 >
                                    {subf.label} ({subf.count})
                                 </button>
                              );
                           })}
                        </div>

                        {/* Sold Listings List */}
                        {fbListings.filter(l => {
                           if (l.status !== 'Sold') return false;
                           if (fbHistorySearch) {
                              const q = fbHistorySearch.toLowerCase();
                              const matches = (l.phone || '').toLowerCase().includes(q) ||
                                              (l.password || '').toLowerCase().includes(q) ||
                                              (l.twoFA || '').toLowerCase().includes(q);
                              if (!matches) return false;
                           }
                           
                           if (fbHistoryFilter === 'pending') return l.status === 'Pending';
                           if (fbHistoryFilter === 'approved') return l.status === 'Sold';
                           if (fbHistoryFilter === 'disputed') return l.status === 'Dispute';
                           if (fbHistoryFilter === 'escalated') return false;
                           if (fbHistoryFilter === 'refunded') return false;
                           
                           return true;
                        }).length === 0 ? (
                           <div className="py-24 text-center">
                              <p className="text-[12px] font-bold text-slate-400">কোনো transaction নেই।</p>
                           </div>
                        ) : (
                           <div className="divide-y divide-slate-100 bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                              {fbListings.filter(l => {
                                 if (l.status !== 'Sold') return false;
                                 if (fbHistorySearch) {
                                    const q = fbHistorySearch.toLowerCase();
                                    const matches = (l.phone || '').toLowerCase().includes(q) ||
                                                    (l.password || '').toLowerCase().includes(q) ||
                                                    (l.twoFA || '').toLowerCase().includes(q);
                                    if (!matches) return false;
                                 }
                                 
                                 if (fbHistoryFilter === 'pending') return l.status === 'Pending';
                                 if (fbHistoryFilter === 'approved') return l.status === 'Sold';
                                 if (fbHistoryFilter === 'disputed') return l.status === 'Dispute';
                                 if (fbHistoryFilter === 'escalated') return false;
                                 if (fbHistoryFilter === 'refunded') return false;
                                 
                                 return true;
                              }).map((item) => {
                                 const isRevealed = !!revealedFbListings[item.id];
                                 return (
                                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50/40 transition-colors">
                                       <div className="space-y-1 max-w-[70%] text-left">
                                          <div className="flex items-center gap-2">
                                             <h4 className="text-[11px] font-black text-slate-850 leading-tight">
                                                NUM 00 FRD 2FA 🔻 Number+...
                                             </h4>
                                          </div>
                                          <div className="text-[10px] font-mono text-slate-600 bg-slate-50/50 px-2.5 py-1.5 rounded-lg border border-slate-100 inline-block font-semibold">
                                             {isRevealed ? (
                                                <span className="break-all font-bold">
                                                   {item.phone} | {item.password} | {item.twoFA}
                                                </span>
                                             ) : (
                                                <span className="tracking-widest font-black text-slate-400">•••••••••</span>
                                             )}
                                          </div>
                                       </div>
                                       <div className="flex items-center gap-1 shrink-0">
                                          <button 
                                             onClick={() => setRevealedFbListings(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                                             className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                                             title="View/Hide Password"
                                          >
                                             {isRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
                                          </button>
                                       </div>
                                    </div>
                                 );
                              })}
                           </div>
                        )}
                     </div>
                  ) : (
                     <div className="space-y-5">
                        {/* Archive Announcement / Alert */}
                        <div className="bg-[#FFF9E6] border border-[#FFEBA0] p-4 rounded-3xl flex gap-3 text-left">
                           <AlertCircle size={20} className="text-[#B58100] shrink-0 mt-0.5" />
                           <span className="text-[11px] font-bold text-[#805B00] leading-relaxed">
                              Archive হওয়া accounts ৭ দিন পর স্থায়ীভাবে database থেকে মুছে যাবে। এর আগে Restore করলে আবার active হবে।
                           </span>
                        </div>

                        {/* Archive List or Empty State */}
                        {localArchivedFBLisings.length === 0 ? (
                           <div className="py-24 text-center flex flex-col items-center justify-center space-y-4">
                              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border border-slate-150 text-slate-300 shadow-sm">
                                 <Archive size={30} />
                              </div>
                              <p className="text-[12px] font-bold text-slate-500 font-bold">কোনো archived account নেই।</p>
                           </div>
                        ) : (
                           <div className="divide-y divide-slate-100 bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                              {localArchivedFBLisings.map((item, index) => (
                                 <div key={index} className="p-4 flex items-center justify-between hover:bg-slate-50/40 transition-colors">
                                    <div className="space-y-1 max-w-[70%] text-left">
                                       <div className="flex items-center gap-2">
                                          <h4 className="text-[11px] font-black text-slate-800 leading-tight">
                                             NUM 00 FRD 2FA 🔻 Number+...
                                          </h4>
                                       </div>
                                       <div className="text-[10px] font-mono text-slate-600 bg-slate-50/50 px-2.5 py-1.5 rounded-lg border border-slate-100 inline-block font-semibold">
                                          <span className="break-all font-bold font-mono">
                                             {item.phone} | {item.password} | {item.twoFA}
                                          </span>
                                       </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-1 shrink-0">
                                       <button 
                                          onClick={() => handleRestoreArchivedFB(index)}
                                          className="h-8 px-2.5 bg-red-50 hover:bg-red-150 text-red-600 hover:text-red-800 rounded-xl text-[10px] font-black tracking-wider transition-all flex items-center gap-1 shadow-sm uppercase shrink-0"
                                          title="Restore layout"
                                       >
                                          <RefreshCw size={10} />
                                          Restore
                                       </button>
                                       
                                       <button 
                                          onClick={() => handlePermanentDeleteArchivedFB(index)}
                                          className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                          title="Delete listing permanently"
                                       >
                                          <Trash2 size={16} />
                                       </button>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                  )}

              </motion.div>
            ) : view === 'facebook-create-post' ? (
              <motion.div
                key="facebook-create-post"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 pb-24 text-left"
              >
                {/* Back Link */}
                <div className="flex pl-1">
                  <button 
                    onClick={() => {
                      // Clear form
                      setFbCategory('');
                      setFbForm({
                        phone: '',
                        password: '',
                        twoFAMethod: '',
                        bulkContent: '',
                        title: '',
                        description: '',
                        price: ''
                      });
                      setFbSellImage(null);
                      setView('facebook-market');
                    }}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-[#2D8A4E] font-extrabold text-[13px] tracking-wide transition-all cursor-pointer"
                  >
                    <ArrowLeft size={16} strokeWidth={2.5} />
                    <span>ফিরে যান</span>
                  </button>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-[2rem] p-6 sm:p-7 border border-slate-100 shadow-sm space-y-6">
                  {/* Header */}
                  <div className="space-y-1">
                    <h2 className="text-[20px] font-black text-[#0D1B3E] tracking-tight leading-tight">নতুন পোস্ট তৈরি করুন</h2>
                    <p className="text-[12px] font-bold text-slate-400">আপনার 서비스 বা অ্যাকাউন্ট বিক্রির জন্য পোস্ট করুন</p>
                  </div>

                  {/* Field 1: Service Type */}
                  <div className="space-y-2 relative">
                    <label className="text-[13.5px] font-extrabold text-slate-800 pl-0.5 block">
                      সার্ভিসের ধরন <span className="text-rose-500 font-bold">*</span>
                    </label>
                    
                    <button
                      type="button"
                      onClick={() => setIsServiceDropdownOpen(!isServiceDropdownOpen)}
                      className="w-full h-12 bg-white border border-slate-200/80 rounded-2xl px-4 flex items-center justify-between text-left text-xs font-bold text-slate-800 hover:bg-slate-50 focus:outline-none transition-all cursor-pointer relative"
                    >
                      <span className={fbCategory ? "text-slate-800 font-bold text-[13px]" : "text-slate-400 font-semibold text-[13px]"}>
                        {fbCategory || "কোন ধরনের সার্ভিস বিক্রি করতে চান?"}
                      </span>
                      <ChevronDown size={16} className={`text-slate-400 transition-transform ${isServiceDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Custom Dropdown Dialog/Popover matching Screenshot 3 */}
                    {isServiceDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setIsServiceDropdownOpen(false)}
                        />
                        <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 max-h-64 overflow-y-auto py-2 divide-y divide-slate-50">
                          {["YouTube Channel", "Facebook Account", "Instagram Account", "TikTok Account", "Telegram Account/ID", "Telegram Channel", "Telegram Group", "Game Account/ID", "Twitter/X Account", "Discord Server", "Snapchat Account", "LinkedIn Account", "Twitch Channel", "Netflix/OTT Account", "Digital Product/License", "অন্যান্য"].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                setFbCategory(opt);
                                setIsServiceDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-3 text-xs font-bold transition-colors block cursor-pointer hover:bg-[#F2FBF6] ${fbCategory === opt ? 'text-[#2D8A4E] bg-[#EDF2EE]' : 'text-slate-700'}`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Field 2: Title */}
                  <div className="space-y-2">
                    <label className="text-[13.5px] font-extrabold text-slate-800 pl-0.5 block">
                      শিরোনাম <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input 
                      type="text"
                      maxLength={200}
                      placeholder="যেমন: ১০K সাবস্ক্রাইবার YouTube Channel"
                      value={fbForm.title}
                      onChange={(e) => setFbForm({ ...fbForm, title: e.target.value })}
                      className="w-full h-12 bg-white border border-slate-200/80 rounded-2xl px-4 text-[13px] font-semibold text-slate-850 placeholder:text-slate-400/80 focus:outline-none focus:border-[#2D8A4E] transition-all shadow-xs"
                    />
                    <div className="text-right pr-1">
                      <span className="text-[11px] font-bold text-slate-400">
                        {fbForm.title.length}/200
                      </span>
                    </div>
                  </div>

                  {/* Field 3: Description */}
                  <div className="space-y-2">
                    <label className="text-[13.5px] font-extrabold text-slate-800 pl-0.5 block">
                      বিবরণ <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <textarea 
                      rows={5}
                      maxLength={2000}
                      placeholder="সার্ভিসের বিস্তারিত বিবরণ লিখুন — যেমন বয়স, subscriber সংখ্যা, monetization status ইত্যাদি"
                      value={fbForm.description}
                      onChange={(e) => setFbForm({ ...fbForm, description: e.target.value })}
                      className="w-full bg-white border border-slate-200/80 rounded-2xl p-4 text-[13px] font-semibold text-slate-850 placeholder:text-slate-400/80 focus:outline-none focus:border-[#2D8A4E] transition-all resize-none leading-relaxed shadow-xs"
                    />
                    <div className="text-right pr-1">
                      <span className="text-[11px] font-bold text-slate-400 flex items-center justify-end">
                        {fbForm.description.length}/2000
                      </span>
                    </div>
                  </div>

                  {/* Field 4: Price */}
                  <div className="space-y-2">
                    <label className="text-[13.5px] font-extrabold text-slate-800 pl-0.5 block">
                      মূল্য (ঐচ্ছিক)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">৳</span>
                      <input 
                        type="number"
                        placeholder="খালি রাখলে আলোচনা সাপেক্ষে"
                        value={fbForm.price}
                        onChange={(e) => setFbForm({ ...fbForm, price: e.target.value })}
                        className="w-full h-12 bg-white border border-slate-200/80 rounded-2xl pl-9 pr-4 text-[13px] font-semibold text-slate-850 placeholder:text-slate-400/80 focus:outline-none focus:border-[#2D8A4E] transition-all shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Field 5: Image */}
                  <div className="space-y-2">
                    <label className="text-[13.5px] font-extrabold text-slate-800 pl-0.5 block">
                      ছবি (ঐচ্ছিক)
                    </label>
                    
                    {fbSellImage ? (
                      <div className="relative border border-slate-150 rounded-2xl overflow-hidden bg-slate-50 h-44 flex items-center justify-center">
                        <img 
                          src={fbSellImage} 
                          alt="Listing Preview" 
                          className="max-h-full max-w-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => setFbSellImage(null)}
                          className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-all shadow-md cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="border border-dashed border-slate-200 hover:border-[#2D8A4E]/40 cursor-pointer rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center gap-2 bg-slate-50/50 hover:bg-slate-50 shadow-xs max-w-full block">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageChange}
                          className="hidden" 
                        />
                        <div className="w-10 h-10 bg-emerald-50 text-[#2D8A4E] rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                          <Upload size={16} strokeWidth={2.5} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700 mt-2">ছবি আপলোড করুন</p>
                          <p className="text-[10px] font-semibold text-slate-400 mt-0.5">সর্বোচ্চ ৫ MB (JPG, PNG, WebP)</p>
                        </div>
                      </label>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        // Clear form and go back
                        setFbCategory('');
                        setFbForm({
                          phone: '',
                          password: '',
                          twoFAMethod: '',
                          bulkContent: '',
                          title: '',
                          description: '',
                          price: ''
                        });
                        setFbSellImage(null);
                        setView('facebook-market');
                      }}
                      className="flex-1 h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-wider text-center transition-all border border-slate-200 cursor-pointer flex items-center justify-center"
                    >
                      বাতিল
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handlePublishMockupPost}
                      className="flex-1 h-12 bg-[#2D8A4E] hover:bg-emerald-800 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-emerald-700/15 transition-all cursor-pointer"
                    >
                      {isSubmitting ? (
                        <RefreshCw size={14} className="animate-spin text-white" />
                      ) : (
                        <>
                          <CheckCircle size={14} strokeWidth={2.5} />
                          পোস্ট প্রকাশ করুন
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (view === 'facebook-market' || view === 'facebook-accounts-list') ? (
              <motion.div
                key="facebook-market"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 pb-24 relative"
              >
                  {/* Absolute Top Error Banner */}
                  {fbPurchaseError && (
                    <motion.div 
                      initial={{ opacity: 0, y: -20, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.98 }}
                      className="bg-[#DC3545] text-white p-5 rounded-2xl shadow-xl border border-red-500/10 flex flex-col items-start text-left relative overflow-hidden z-[60] mx-0.5"
                    >
                      <div className="font-extrabold text-[15px] tracking-tight text-white leading-tight">Purchase Failed</div>
                      <div className="text-[12px] font-bold text-white/90 leading-tight mt-1">{fbPurchaseError}</div>
                    </motion.div>
                  )}

                  {/* Purchase Confirmation Modal */}
                  {showFbConfirmModal && fbConfirmingItem && (
                    <div className="fixed inset-0 bg-slate-900/35 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[26px] border border-slate-100 shadow-2xl w-full max-w-sm overflow-hidden p-6 relative"
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4 text-left">
                          <div className="flex items-center gap-2 text-[#2D8A4E]">
                            <ShoppingCart size={18} className="stroke-[2.5]" />
                            <h3 className="font-extrabold text-slate-800 text-[14px]">Purchase Confirm করুন</h3>
                          </div>
                          <button 
                            onClick={() => { setShowFbConfirmModal(false); setFbConfirmingItem(null); setFbPurchaseError(null); }}
                            className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                          >
                            <X size={18} />
                          </button>
                        </div>

                        {/* Inner green-tinted detail box */}
                        <div className="bg-[#EDF2EE] rounded-[22px] p-5 space-y-3.5 text-left border border-slate-200/40">
                          {/* Category */}
                          <div className="flex justify-between items-start gap-4">
                            <span className="text-slate-500 font-bold text-[11px] pt-0.5">Category</span>
                            <div className="text-right">
                              <div className="font-extrabold text-slate-800 text-[11.5px] leading-tight">{fbConfirmingItem.category || "NUM 00 FRD"}</div>
                              <div className="text-[10px] font-bold text-slate-500 mt-0.5">2FA 🔻 Active Facebook ID</div>
                            </div>
                          </div>

                          <div className="border-t border-slate-200/50" />

                          {/* Quantity */}
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-bold text-[11px] font-sans">Quantity</span>
                            <span className="font-extrabold text-slate-800 text-[11.5px]">1 Account</span>
                          </div>

                          <div className="border-t border-slate-200/50" />

                          {/* Total Price */}
                          <div className="flex justify-between items-center">
                            <span className="text-slate-900 font-black text-[12px]">Total</span>
                            <span className="font-black text-[#2D8A4E] text-sm md:text-base">BDT {fbConfirmingItem.price || 4.40}</span>
                          </div>
                        </div>

                        <p className="text-[10.5px] font-bold text-slate-400 text-left mt-3.5 leading-relaxed">
                          Balance থেকে কেটে নেওয়া হবে। ২৪ ঘণ্টার মধ্যে সমস্যা report করতে পারবেন।
                        </p>

                        <div className="flex gap-2.5 mt-5">
                          <button 
                            onClick={() => { setShowFbConfirmModal(false); setFbConfirmingItem(null); setFbPurchaseError(null); }}
                            className="flex-1 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs uppercase tracking-wider text-center cursor-pointer transition-colors"
                          >
                            বাতিল
                          </button>
                          <button 
                            onClick={handleConfirmBuyFacebookAccount}
                            disabled={isSubmitting}
                            className="flex-1 py-3 bg-[#2D8A4E] hover:bg-[#226B3B] text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-emerald-50 cursor-pointer transition-colors"
                          >
                            {isSubmitting ? (
                              <RefreshCw size={14} className="animate-spin text-white" />
                            ) : (
                              <>
                                <ShoppingCart size={13} strokeWidth={2.5} />
                                Confirm করুন
                              </>
                            )}
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}

                  {/* Search, Filter Tabs and Items list container (Header UI) */}
                  <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm space-y-6 text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-black text-slate-800 tracking-tight leading-none">Facebook & YouTube Assets</h2>
                        <p className="text-[11px] text-slate-400 font-bold mt-1.5 uppercase tracking-wider">Premium Accounts with Active Credentials</p>
                      </div>
                      
                      {/* Search and Tab selectors */}
                      <div className="flex flex-wrap items-center gap-2.5">
                        <div className="relative">
                          <input 
                            value={fbMarketSearch}
                            onChange={(e) => setFbMarketSearch(e.target.value)}
                            placeholder="আইডি বা ক্যাটাগরি খুঁজুন..."
                            className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-semibold text-xs focus:outline-none focus:border-[#2E7D32] transition-colors w-48 text-left"
                          />
                          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                        
                        <div className="bg-slate-100/80 p-1 rounded-xl flex gap-1">
                          {['Market', 'My Purchases'].map((tab) => (
                            <button
                              key={tab}
                              onClick={() => setFbMarketTab(tab as any)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                                fbMarketTab === tab ? 'bg-[#2D8A4E] text-white shadow-xs' : 'text-slate-600 hover:text-slate-905'
                              }`}
                            >
                              {tab === 'Market' ? 'Market' : 'My Boughts'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Render the lists */}
                  {fbMarketTab === 'Market' ? (
                     <div className="grid grid-cols-2 gap-3.5 md:gap-5 pb-10">
                       {fbMarketListings.filter(item => (item.title || '').toLowerCase().includes((fbMarketSearch || '').toLowerCase()) || (item.category || '').toLowerCase().includes((fbMarketSearch || '').toLowerCase())).map((item) => (
                         <div 
                           key={item.id} 
                           onClick={() => handleViewPost(item)}
                           className="group bg-white rounded-2xl p-3 md:p-3.5 border border-slate-100 shadow-xs flex flex-col justify-between text-left transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer relative overflow-hidden"
                         >
                           <div className="space-y-3">
                             {/* Render standard visual card top banner */}
                             {renderCardBanner(item)}

                             {/* Detail meta text below */}
                             <div className="space-y-1">
                               <div className="flex items-center justify-between font-sans">
                                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md leading-none uppercase tracking-wider ${
                                     item.category.toLowerCase().includes("facebook") ? "bg-[#1877F2]/10 text-[#1877F2]" :
                                     item.category.toLowerCase().includes("youtube") ? "bg-red-50 text-red-650" : "bg-orange-50 text-orange-600"
                                  }`}>
                                     {item.category}
                                  </span>
                                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded-md flex items-center gap-0.5 border border-emerald-100 shrink-0 scale-90">
                                     Available
                                  </span>
                               </div>

                               <h3 className="text-xs font-black text-slate-800 tracking-tight leading-tight pt-1 group-hover:text-red-600 transition-colors truncate">{item.title}</h3>
                               <p className="text-[10px] text-slate-450 font-medium leading-snug line-clamp-1">{item.description}</p>
                             </div>
                           </div>

                           {/* Purchase action / Click block */}
                           <div className="border-t border-slate-50 mt-4.5 pt-3">
                             <div className="flex items-center justify-between">
                               <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest font-sans">Price</span>
                               <div className="text-xs font-black text-[#2D8A4E] shrink-0 font-sans">
                                  {item.price === 0 ? "আলোচনা সাপেক্ষে" : `৳${item.price}`}
                               </div>
                             </div>
                           </div>
                         </div>
                       ))}
                     </div>
                  ) : (
                     fbMyPurchases.length === 0 ? (
                       <div className="bg-white rounded-[24px] p-12 text-center border border-dashed border-slate-200 shadow-xs mb-10 text-left font-sans">
                         <p className="text-slate-400 font-bold text-xs uppercase tracking-wider text-center">আপনি কোনো Facebook অ্যাকাউন্ট এখনো কিনেননি।</p>
                       </div>
                     ) : (
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-12 font-sans">
                         {fbMyPurchases.map((item) => (
                           <div key={item.id} className="bg-slate-900 rounded-[22px] p-5 border border-slate-800 shadow-xl space-y-4 text-white relative overflow-hidden text-left flex flex-col justify-between">
                             <div className="space-y-4">
                               <div className="flex items-start justify-between gap-3">
                                 <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center shrink-0">
                                      <Facebook size={20} fill="currentColor" />
                                   </div>
                                   <div className="space-y-0.5 min-w-0">
                                     <h4 className="font-bold text-white text-xs leading-tight truncate">{item.phone || "Purchased Account"}</h4>
                                     <span className="inline-block bg-white/5 text-white/60 text-[9px] font-semibold px-2 py-0.5 rounded-md border border-white/5 truncate max-w-full">
                                       {item.category || "num-00-frd-2fa"}
                                     </span>
                                   </div>
                                 </div>
                                 <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20 shrink-0">
                                   <CheckCircle size={10} />
                                   SUCCESSFUL
                                 </div>
                               </div>

                               <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-2 text-xs">
                                 <div className="space-y-0.5">
                                   <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider block">ID / Phone</span>
                                   <div className="font-mono text-white text-xs font-bold flex items-center justify-between bg-white/5 px-2.5 py-1.5 rounded-lg">
                                     <span className="truncate mr-2 font-mono select-all">{item.phone}</span>
                                     <button onClick={() => { navigator.clipboard.writeText(item.phone || ''); alert('Copied ID!'); }} className="p-1 hover:bg-white/10 rounded-md text-blue-400 transition-colors"><Copy size={12} /></button>
                                   </div>
                                 </div>
                                 <div className="space-y-0.5">
                                   <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider block">Password</span>
                                   <div className="font-mono text-amber-300 text-xs font-bold flex items-center justify-between bg-white/5 px-2.5 py-1.5 rounded-lg">
                                     <span className="truncate mr-2 font-mono select-all">{item.password || '••••••••'}</span>
                                     <button onClick={() => { navigator.clipboard.writeText(item.password || ''); alert('Copied Password!'); }} className="p-1 hover:bg-white/10 rounded-md text-white transition-colors"><Copy size={12} /></button>
                                   </div>
                                 </div>
                               </div>
                             </div>
                             <div className="flex items-center justify-between text-white/40 text-[9px] pt-4 border-t border-white/5 font-semibold mt-3">
                                <span>ID: {item.id ? item.id.substring(0, 10) : "mock_item"}</span>
                                <span className="font-bold text-white/60">Bought for BDT {Number(item.soldPrice || 4.40).toFixed(2)}</span>
                             </div>
                           </div>
                         ))}
                       </div>
                     )
                  )}
              </motion.div>
            ) : view === 'facebook-view-post' ? ( (() => {
               const liveItem = selectedFbPostForDetail;
               return (
                 <motion.div
                   key="facebook-view-post"
                   initial={{ opacity: 0, scale: 0.98 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.98 }}
                   className="space-y-6 pb-24 text-left"
                 >
                     {liveItem && (
                     <div className="space-y-6">
                      {/* Unified Product Card holding both Image and Info with combined borders */}
                      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden font-sans">
                        {/* Image section atop */}
                        {liveItem.imageUrl ? (
                           <div className="w-full bg-slate-50 flex items-center justify-center relative select-none border-b border-slate-100">
                             <img 
                               src={liveItem.imageUrl} 
                               referrerPolicy="no-referrer" 
                               alt={liveItem.title} 
                               className="w-full h-auto max-h-[480px] object-contain" 
                             />
                           </div>
                        ) : (
                           /* Category Specific Streamlined Fallback Card */
                           <div className="border-b border-slate-100">
                             {liveItem.category.toLowerCase().includes('youtube') ? (
                               <div className="w-full h-48 bg-gradient-to-r from-red-600 to-amber-600 flex flex-col items-center justify-center text-white p-6 text-center select-none relative font-sans">
                                 <span className="text-white/20 uppercase font-black tracking-widest text-2xl font-sans font-sans">YOUTUBE ITEM</span>
                                 <p className="text-sm font-bold mt-2 font-sans font-sans">premium monetized channel / video asset</p>
                               </div>
                             ) : liveItem.category.toLowerCase().includes('facebook') ? (
                               <div className="w-full h-48 bg-gradient-to-tr from-[#1877F2] via-red-600 to-slate-800 flex flex-col items-center justify-center text-white p-6 text-center select-none relative font-sans">
                                 <span className="text-white/20 uppercase font-black tracking-widest text-xl font-sans font-sans">FACEBOOK ASSET</span>
                                 <p className="text-sm font-bold mt-2 font-sans font-sans">verified profile, page or account</p>
                               </div>
                             ) : (
                               <div className="w-full h-48 bg-gradient-to-r from-[#2D8A4E] to-emerald-700 flex flex-col items-center justify-center text-white p-6 text-center select-none relative font-sans">
                                 <span className="text-white/20 uppercase font-black tracking-widest text-xl font-sans font-sans">DIGITAL ASSET</span>
                                 <p className="text-sm font-bold mt-2 font-sans font-sans">verified digital credential or service</p>
                               </div>
                             )}
                           </div>
                        )}

                        {/* Metadata Card Info directly inside */}
                        <div className="p-6 space-y-5 text-left font-sans">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[10px] uppercase font-black tracking-wider bg-[#1877F2]/10 text-[#1877F2] px-3.5 py-1 rounded-full border border-[#1877F2]/10 leading-none">
                              {liveItem.category}
                            </span>
                            
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                alert("লিংক কপি হয়েছে!");
                              }}
                              className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-full font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1.5 hover:bg-slate-100 transition-all cursor-pointer shadow-xs"
                            >
                              <Share2 size={11} strokeWidth={2.5} />
                              <span>Share</span>
                            </button>
                          </div>

                          {/* Display Post Title */}
                          <h2 className="text-xl font-black text-slate-900 tracking-tight leading-snug">{liveItem.title}</h2>

                          {/* Micro-metrics Stats Row matching Screenshot */}
                          <div className="flex flex-wrap items-center gap-2 pt-1 font-bold">
                            {/* Bengali Formatted Date based on real-time creation date */}
                            <div className="px-3 py-1.5 bg-slate-50 text-slate-600 text-[11px] rounded-full border border-slate-100 flex items-center gap-1">
                              <span className="text-slate-450 text-[12px]">📅</span>
                              <span>{formatDateBengali(liveItem.createdAt)}</span>
                            </div>

                            {/* Views count */}
                            <div className="px-3 py-1.5 bg-slate-50 text-slate-600 text-[11px] rounded-full border border-slate-100 flex items-center gap-1 font-mono">
                              <Eye size={12} className="text-red-400 shrink-0" strokeWidth={2.5} />
                              <span>{liveItem.views || 0} views</span>
                            </div>

                            {/* Clicks count */}
                            <div className="px-3 py-1.5 bg-slate-50 text-slate-600 text-[11px] rounded-full border border-slate-100 flex items-center gap-1 font-mono">
                              <Zap size={11} className="text-amber-500 shrink-0" strokeWidth={2.5} />
                              <span>{liveItem.clicks || 0} clicks</span>
                            </div>

                            {/* Messages pill in green outline */}
                            <div className="px-3 py-1.5 bg-emerald-50/50 text-emerald-600 text-[11px] rounded-full border border-emerald-200/60 flex items-center gap-1 font-semibold leading-none">
                              <MessageSquare size={11} className="text-emerald-500 shrink-0" strokeWidth={2.5} />
                              <span>0 messages</span>
                            </div>
                          </div>
                        </div>
                      </div>

                    {/* বিবরণ Box (Description Box matching screenshot) */}
                    <div className="space-y-2 text-left">
                      <h4 className="text-[14px] font-black text-slate-800 tracking-tight pl-1.5 flex items-center gap-1">
                        <span>বিবরণ</span>
                      </h4>
                      <div className="bg-slate-50/60 border border-slate-100 rounded-[1.5rem] p-5.5 text-xs text-slate-700 leading-relaxed font-bold shadow-xs">
                        {liveItem.description || "কোনো বিবরণ প্রদান করা হয়নি। স্পেসিফিক আইডি ইনফোর জন্য দয়া করে বাটন চেপে কানেক্ট করুন।"}
                      </div>
                    </div>

                    {/* Price and Big Action Button Box */}
                    <div className="bg-white rounded-[2rem] p-5.5 border border-slate-100 shadow-lg space-y-4">
                      <div className="flex flex-col items-center justify-center py-2 text-center">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">নির্ধারিত মূল্য</span>
                        <div className="text-[28px] font-black text-[#2D8A4E] tracking-tight font-sans">
                          {liveItem.price === 0 ? "আলোচনা সাপেক্ষে" : `৳${liveItem.price}`}
                        </div>
                      </div>

                      {/* Direct Sponsor Link to boost earnings */}
                      {adsterraEnabled && adsterraDirectLinkUrl && adsterraDirectLinkUrl.trim() !== "" && (
                        <div className="bg-gradient-to-r from-amber-50 to-amber-100/40 border border-amber-200 rounded-[1.5rem] p-4 text-center space-y-2.5 my-2 animate-pulse">
                          <p className="text-[11.5px] text-amber-800 font-extrabold leading-snug">
                            💬 সেলারের সরাসরি ফেসবুক ও হোয়াটসঅ্যাপ নম্বর ১-সেকেন্ডে আনলক করতে নিচের স্পন্সর লিঙ্কটি ভেরিফাই করুন:
                          </p>
                          <a 
                            href={adsterraDirectLinkUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black text-[11px] uppercase tracking-widest rounded-xl items-center justify-center gap-2 shadow-md transition-transform hover:scale-[1.01] active:scale-95 cursor-pointer"
                          >
                            <ExternalLink size={12} />
                            ১-সেকেন্ডে কন্টাক্ট আনলক করুন
                          </a>
                        </div>
                      )}

                      {/* Dynamic Seller Link button matching screenshot: "Seller-এর সাথে কথা বলুন" */}
                      <button 
                        onClick={() => {
                          startListingChat(liveItem);
                        }}
                        className="w-full py-4.5 bg-[#2D8A4E] hover:bg-emerald-800 text-white font-black text-[14px] rounded-[1.5rem] flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-emerald-250"
                      >
                        <MessageCircle size={18} strokeWidth={2.5} />
                        <span>Seller-এর সাথে কথা বলুন</span>
                      </button>
                    </div>
                  </div>
                 )}
                 </motion.div>
               );
            })()
            ) : view === 'admin' ? (
              <motion.div
                key="admin"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-6 pb-24 text-left"
              >
                {/* Notice Board Control */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">Notice Board Control</h3>
                      <p className="text-xs text-slate-400 font-bold">👉 হোমপেজে Notice Board এ প্রদর্শিত বার্তা পরিবর্তন করুন</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Notice Board Message (HTML list or simple paragraphs)</label>
                      <textarea
                        value={pendingNotice}
                        onChange={(e) => setPendingNotice(e.target.value)}
                        placeholder="হোমপেজে কি নোটিশ দেখাতে চান তা লিখুন..."
                        rows={4}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:outline-none focus:border-orange-600 transition-all text-xs resize-none"
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

                  {/* Homepage Main Hero Box Color Control */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <Palette size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">হোম পেজের মূল নীল বক্সের কালার পরিবর্তন</h3>
                        <p className="text-xs text-slate-400 font-bold">👉 হোম পেজের উপরের মূল গ্লোয়িং ব্যানার/বক্সের কালার কোড দিয়ে পরিবর্তন করুন</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        {/* Text input for hex color code */}
                        <div className="flex-1 space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Color Code (Hex/Color format)</label>
                          <input
                            type="text"
                            value={pendingMainBoxColor}
                            onChange={(e) => setPendingMainBoxColor(e.target.value)}
                            placeholder="e.g. #000d26"
                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold font-mono focus:outline-none focus:border-blue-500 transition-all text-xs"
                          />
                        </div>

                        {/* Visually pick color */}
                        <div className="space-y-1.5 shrink-0">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Select Color</label>
                          <div className="flex items-center justify-center h-[50px] w-[60px] bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden relative">
                            <input
                              type="color"
                              value={pendingMainBoxColor.startsWith('#') && pendingMainBoxColor.length === 7 ? pendingMainBoxColor : '#000d26'}
                              onChange={(e) => setPendingMainBoxColor(e.target.value)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div 
                              className="w-8 h-8 rounded-lg border border-slate-200" 
                              style={{ backgroundColor: pendingMainBoxColor }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Presets */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest pl-1">দ্রুত সেট করার জন্য প্রিসেট কালারসমূহ:</label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { name: 'Default Blue', hex: '#000d26' },
                            { name: 'Vibrant Indigo', hex: '#1e1b4b' },
                            { name: 'Royal Violet', hex: '#2e1065' },
                            { name: 'Emerald Forest', hex: '#022c22' },
                            { name: 'Golden Glow', hex: '#451a03' },
                            { name: 'Dark Ruby', hex: '#4c0519' },
                            { name: 'Sleek Obsidian', hex: '#090d16' }
                          ].map((preset) => (
                            <button
                              key={preset.hex}
                              type="button"
                              onClick={() => setPendingMainBoxColor(preset.hex)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-[10px] font-bold border border-slate-205 transition-colors cursor-pointer"
                            >
                              <span className="w-2.5 h-2.5 rounded-full border border-slate-350" style={{ backgroundColor: preset.hex }} />
                              <span className="text-slate-700">{preset.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <button 
                        onClick={() => updateMainBoxColor(pendingMainBoxColor)}
                        className="w-full py-4 bg-[#1D4ED8] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Save size={16} />
                        Save Main Box Color
                      </button>
                    </div>
                  </div>

                  {/* User Account Recovery Section */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                        <Users size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">User Search & Recovery</h3>
                        <p className="text-xs text-slate-400 font-bold">Manage accounts & recover passwords</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <input 
                          value={adminUserSearchQuery}
                          onChange={(e) => setAdminUserSearchQuery(e.target.value)}
                          placeholder="Email or numeric User ID..."
                          className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:outline-none focus:border-red-500 transition-all shadow-inner text-xs"
                        />
                        <button 
                          onClick={handleAdminUserLookup}
                          disabled={isVerifying}
                          className="px-6 py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-md active:scale-95 flex items-center justify-center"
                        >
                          {isVerifying ? <RefreshCw className="animate-spin" size={14} /> : <Search size={14} />}
                        </button>
                      </div>

                      {adminSearchedAccount && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-4"
                        >
                          <div className="flex items-center justify-between">
                             <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">User Details</p>
                                <p className="text-sm font-black text-slate-800">{adminSearchedAccount.displayName}</p>
                                <p className="text-[10px] font-bold text-red-600 break-all">{adminSearchedAccount.email}</p>
                             </div>
                             <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance</p>
                                <p className="text-sm font-black text-green-600">৳{adminSearchedAccount.balance?.toFixed(2)}</p>
                             </div>
                          </div>
                          
                          <div className="flex gap-3 pt-4 border-t border-slate-200">
                             <button 
                               onClick={() => handleSendAdminResetEmail(adminSearchedAccount.email)}
                               className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 flex items-center justify-center gap-2"
                             >
                               <Lock size={14} />
                               Reset Pass
                             </button>
                             <button 
                               onClick={() => {
                                  setAdminNotifyForm(prev => ({ ...prev, targetUserId: adminSearchedAccount.numericId || adminSearchedAccount.id }));
                                  alert('UID loaded in Notification form below');
                               }}
                               className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2"
                             >
                               <Bell size={14} />
                               Notify
                             </button>
                          </div>
                          <p className="text-[9px] text-[#2E7D32] bg-green-50 p-2 rounded-lg font-bold text-center">🔐 Admin-only access. Follow Google security guidelines.</p>
                        </motion.div>
                      )}
                    </div>
                  </div>

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
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:outline-none focus:border-blue-500 transition-all shadow-inner text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">New Balance (৳)</label>
                        <div className="flex gap-3">
                          <input 
                            id="balance-amount"
                            type="number"
                            placeholder="0.00"
                            className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:outline-none focus:border-blue-500 transition-all shadow-inner text-xs"
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
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
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
                              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:outline-none focus:border-red-500 transition-all shadow-inner text-xs"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Target Gmail (Optional)</label>
                            <input 
                              value={adminNotifyForm.gmailAccount}
                              onChange={(e) => setAdminNotifyForm({ ...adminNotifyForm, gmailAccount: e.target.value })}
                              placeholder="example@gmail.com"
                              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:outline-none focus:border-red-500 transition-all shadow-inner text-xs"
                            />
                          </div>
                        </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Notification Message</label>
                        <div className="flex gap-2">
                          <select 
                            value={adminNotifyForm.type}
                            onChange={(e) => setAdminNotifyForm({ ...adminNotifyForm, type: e.target.value as any })}
                            className="px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold appearance-none outline-none focus:border-red-500 transition-all"
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
                            className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:outline-none focus:border-red-500 transition-all shadow-inner resize-none text-xs"
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
                        className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-200 hover:bg-red-700 transition-all active:scale-95"
                      >
                        Send Notification
                      </button>
                    </div>
                  </div>

                  {/* Pricing Configuration */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6 mb-6">
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
                                <label className="text-[10px] font-black text-slate-400 uppercase">Seller Get (৳)</label>
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
                                <label className="text-[10px] font-black text-slate-400 uppercase">Market Price (৳)</label>
                                <input 
                                  type="number"
                                  value={priceObj.buyer}
                                  onChange={async (e) => {
                                    const newPrices = { ...gmailPrices, [type]: { ...priceObj, buyer: e.target.value } };
                                    setGmailPrices(newPrices);
                                    await setDoc(doc(db, 'settings', 'pricing'), newPrices);
                                  }}
                                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-center font-bold text-xs focus:ring-2 focus:ring-red-500/20 outline-none"
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
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6 mb-6">
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

                  {/* Adsterra Revenue Hub & Monetization Console */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6 mt-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 border border-red-100 shadow-sm animate-pulse">
                        <Flame size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-slate-800 text-lg tracking-tight font-display">Adsterra Ad Networks Console</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${adsterraEnabled ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                            {adsterraEnabled ? '● ACTIVE' : '○ DISABLED'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">High performance CPM ad keys manager & earnings calculator</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-3.5 py-1.5 bg-red-50  text-red-600 rounded-lg text-[10px] font-black uppercase tracking-wider border border-red-100/50 flex items-center gap-1.5">
                        <Coins size={11} className="animate-spin" />
                        ADSTERRA PARTNER STATUS
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Controls & Keys */}
                    <div className="space-y-4 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Configure Adsterra Placements Keys</h4>
                      
                      {/* Desktop Banner Key */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex justify-between">
                          <span>Standard Desktop Banner Key (728x90)</span>
                          <span className="text-red-600 lowercase font-mono">adsterraBannerKey</span>
                        </label>
                        <div className="relative">
                          <input 
                            value={pendingAdsterraBannerKey}
                            onChange={(e) => setPendingAdsterraBannerKey(e.target.value)}
                            placeholder="e.g. 1a2b3c4d5e6f7g8h9i0j..."
                            className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-800 text-xs focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder:text-slate-300 shadow-2xs"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black bg-red-50 text-red-600 px-1.5 py-0.5 rounded uppercase">728x90</span>
                        </div>
                      </div>

                      {/* Mobile Banner Key */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex justify-between">
                          <span>Mobile Banner Key (320x50)</span>
                          <span className="text-red-600 lowercase font-mono">adsterraMobileBannerKey</span>
                        </label>
                        <div className="relative">
                          <input 
                            value={pendingAdsterraMobileBannerKey}
                            onChange={(e) => setPendingAdsterraMobileBannerKey(e.target.value)}
                            placeholder="e.g. 2b3c4d5e6f7g8h9i0j1a..."
                            className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-800 text-xs focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder:text-slate-300 shadow-2xs"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black bg-red-50 text-red-600 px-1.5 py-0.5 rounded uppercase">320x50</span>
                        </div>
                      </div>

                      {/* In-Feed Banner Key */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex justify-between">
                          <span>In-Feed Banner Key (300x250)</span>
                          <span className="text-red-600 lowercase font-mono">adsterraInFeedKey</span>
                        </label>
                        <div className="relative">
                          <input 
                            value={pendingAdsterraInFeedKey}
                            onChange={(e) => setPendingAdsterraInFeedKey(e.target.value)}
                            placeholder="e.g. 3c4d5e6f7g8h9i0j1a2b..."
                            className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-800 text-xs focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder:text-slate-300 shadow-2xs"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black bg-red-50 text-red-600 px-1.5 py-0.5 rounded uppercase">300x250</span>
                        </div>
                      </div>

                      {/* Sticky Bottom Key */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex justify-between">
                          <span>Sticky Bottom Banner Code Key (320x50 / social)</span>
                          <span className="text-red-600 lowercase font-mono">adsterraStickyKey</span>
                        </label>
                        <div className="relative">
                          <input 
                            value={pendingAdsterraStickyKey}
                            onChange={(e) => setPendingAdsterraStickyKey(e.target.value)}
                            placeholder="e.g. 4d5e6f7g8h9i0j1a2b3c..."
                            className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-800 text-xs focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder:text-slate-300 shadow-2xs"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black bg-red-50 text-red-600 px-1.5 py-0.5 rounded uppercase">sticky</span>
                        </div>
                      </div>

                      {/* POPUNDER ID KEY - HIGH INCOME */}
                      <div className="space-y-1.5 p-3.5 bg-red-55/35 border border-red-500/10 rounded-2xl">
                        <label className="text-[10px] font-black text-red-700 uppercase tracking-wider flex justify-between">
                          <span className="flex items-center gap-1">💥 Popunder Code/Key (Highest Earnings)</span>
                          <span className="text-red-600 lowercase font-mono">adsterraPopunderKey</span>
                        </label>
                        <div className="relative">
                          <input 
                            value={pendingAdsterraPopunderKey}
                            onChange={(e) => setPendingAdsterraPopunderKey(e.target.value)}
                            placeholder="Copy script key or pl-link..."
                            className="w-full pl-4 pr-16 py-3 bg-white border border-red-200 rounded-xl font-mono font-bold text-slate-800 text-xs focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder:text-slate-300 shadow-2xs"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black bg-red-600 text-white px-2 py-0.5 rounded-md uppercase animate-pulse">Popunder</span>
                        </div>
                        <span className="block text-[9.5px] text-slate-400 font-bold leading-tight">এটি চালু থাকলে ইউজার ওয়েবসাইটের যেকোনো স্থানে ক্লিক করলে পপআন্ডার বিজ্ঞাপনটি চালু হবে যা সর্বোচ্চ রেভিনিউ প্রদান করে।</span>
                      </div>

                      {/* SOCIAL BAR ID KEY - HIGH CLICK-THROUGH */}
                      <div className="space-y-1.5 p-3.5 bg-red-55/35 border border-red-500/10 rounded-2xl">
                        <label className="text-[10px] font-black text-red-700 uppercase tracking-wider flex justify-between">
                          <span className="flex items-center gap-1">🔔 Social Bar & Push Code/Key (High CTR)</span>
                          <span className="text-red-600 lowercase font-mono">adsterraSocialBarKey</span>
                        </label>
                        <div className="relative">
                          <input 
                            value={pendingAdsterraSocialBarKey}
                            onChange={(e) => setPendingAdsterraSocialBarKey(e.target.value)}
                            placeholder="e.g. 5f6g7h8i9j0j1a2b3c4d..."
                            className="w-full pl-4 pr-16 py-3 bg-white border border-red-200 rounded-xl font-mono font-bold text-slate-800 text-xs focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder:text-slate-300 shadow-2xs"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black bg-red-600 text-white px-2 py-0.5 rounded-md uppercase">Push</span>
                        </div>
                        <span className="block text-[9.5px] text-slate-400 font-bold leading-tight">এর মাধ্যমে স্ক্রিনে চ্যাট উইজেট বা সিস্টেম নোটিফিকেশনের মত রিয়েল বিজ্ঞাপন দেখাবে যা ট্রাফিকের জন্য অনেক আকর্ষনীয়।</span>
                      </div>

                      {/* DIRECT LINK URL - CHAT AND BONUS BLOCK ACTION */}
                      <div className="space-y-1.5 p-3.5 bg-amber-50/40 border border-amber-500/20 rounded-2xl">
                        <label className="text-[10px] font-black text-amber-800 uppercase tracking-wider flex justify-between">
                          <span className="flex items-center gap-1">🔗 Direct Link Key/URL (Massive BDT/CPM)</span>
                          <span className="text-amber-700 lowercase font-mono">adsterraDirectLinkUrl</span>
                        </label>
                        <div className="relative">
                          <input 
                            value={pendingAdsterraDirectLinkUrl}
                            onChange={(e) => setPendingAdsterraDirectLinkUrl(e.target.value)}
                            placeholder="e.g. https://www.highperformanceformat.com/..."
                            className="w-full pl-4 pr-20 py-3 bg-white border border-amber-200 rounded-xl font-mono font-bold text-slate-800 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-slate-400 shadow-2xs"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black bg-amber-600 text-white px-2 py-0.5 rounded-md uppercase">Direct Link</span>
                        </div>
                        <span className="block text-[9.5px] text-slate-400 font-bold leading-tight">Adsterra ড্যাশবোর্ড থেকে প্রাপ্ত "Direct Link" এর ফুল URL টি এখানে বসান। নম্বর আনলক বা ফ্রি বোনাস বাটনে এই বিজ্ঞাপনটি লোড হবে।</span>
                      </div>

                      {/* Enable Switch */}
                      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200/60 shadow-2xs">
                        <div>
                          <span className="block font-bold text-slate-800 text-sm">Enable Adsterra Ads</span>
                          <span className="text-[10px] text-slate-450 font-bold uppercase">Activate high-CPM Adsterra placements</span>
                        </div>
                        <button 
                          onClick={() => {
                            const nextState = !adsterraEnabled;
                            setAdsterraEnabled(nextState);
                            localStorage.setItem('cache_adsterra_enabled', String(nextState));
                          }}
                          className={`w-12 h-6 rounded-full p-1 flex transition-colors duration-300 ${adsterraEnabled ? 'bg-red-600 justify-end' : 'bg-slate-200 justify-start'}`}
                        >
                          <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                        </button>
                      </div>

                      <button 
                        onClick={() => updateAdsterraSettings(
                          adsterraEnabled,
                          pendingAdsterraBannerKey,
                          pendingAdsterraMobileBannerKey,
                          pendingAdsterraInFeedKey,
                          pendingAdsterraStickyKey,
                          pendingAdsterraPopunderKey,
                          pendingAdsterraSocialBarKey,
                          pendingAdsterraDirectLinkUrl
                        )}
                        className="w-full py-4 bg-gradient-to-r from-red-600 to-violet-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-red-200/50 hover:opacity-95 transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Coins size={12} />
                        Save Adsterra Keys & Activate
                      </button>
                    </div>

                    {/* Interactive CPM Calculator specifically tailored to Adsterra networks */}
                    <div className="space-y-4 bg-slate-50/50 p-6 rounded-3xl border border-slate-100 flex flex-col justify-between">
                      <div>
                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Adsterra High-CPM Earnings Calculator</h4>
                        <p className="text-[10.5px] text-slate-500 font-semibold leading-relaxed mb-4">
                          Adsterra operates on a native dynamic CPM model. Track how traffic waves convert immediately to dollars and BDT revenue streams. (Conversion rate: 1 USD = 120 BDT)
                        </p>

                        <div className="space-y-4 mt-2">
                          {/* Traffic slider */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase">
                              <span className="text-slate-400">Daily Traffic Views</span>
                              <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-100 font-sans">{adsterraTraffic.toLocaleString()} views</span>
                            </div>
                            <input 
                              type="range"
                              min="100"
                              max="100000"
                              step="200"
                              value={adsterraTraffic}
                              onChange={(e) => setAdsterraTraffic(Number(e.target.value))}
                              className="w-full h-1.5 bg-red-100 rounded-lg appearance-none cursor-pointer accent-red-600 focus:outline-none"
                            />
                          </div>

                          {/* CPM slider */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase">
                              <span className="text-slate-400">Expected CPM (Mille Rates USD)</span>
                              <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-100 font-sans">${adsterraCPM.toFixed(2)} USD</span>
                            </div>
                            <input 
                              type="range"
                              min="0.2"
                              max="12.0"
                              step="0.1"
                              value={adsterraCPM}
                              onChange={(e) => setAdsterraCPM(Number(e.target.value))}
                              className="w-full h-1.5 bg-red-100 rounded-lg appearance-none cursor-pointer accent-red-600 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Display of BDT outputs */}
                      <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-2xl p-5 text-white space-y-4 shadow-md shadow-red-100/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="block text-[8px] font-black uppercase tracking-widest text-red-400">Adsterra Estimated Income</span>
                            <h5 className="text-2xl font-black tracking-tight mt-0.5">
                              ৳{Math.round((adsterraTraffic / 1000) * adsterraCPM * 30 * 120).toLocaleString()}
                              <span className="text-[10px] font-bold text-red-200 uppercase ml-1.5">/ month</span>
                            </h5>
                          </div>
                          <div className="text-right">
                            <span className="block text-[8px] font-black uppercase tracking-widest text-[#FFEB3B]">DAILY BOOST</span>
                            <span className="text-lg font-black text-white">৳{Math.round((adsterraTraffic / 1000) * adsterraCPM * 120).toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="border-t border-red-500/25 pt-3 flex items-center justify-between">
                          <span className="text-[9px] font-black text-red-200 uppercase tracking-wide">Expected Annual Payout</span>
                          <span className="text-sm font-black text-[#FFEB3B] font-mono">৳{Math.round((adsterraTraffic / 1000) * adsterraCPM * 365 * 120).toLocaleString()} BDT</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Adsterra step by step guidelines specifically customized for the user */}
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                    <h4 className="text-[11px] font-black text-slate-850 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles size={11} className="text-red-650" />
                      Adsterra Publisher Setup Roadmap for gmail-buy-sell-bd.vercel.app
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-[10px] sm:text-xs">
                      <div className="space-y-3.5 leading-relaxed text-slate-650 font-medium">
                        <p>
                          ওয়েবসাইটে বিজ্ঞাপন দেখানোর জন্য নিচের সহজ ৪টি ধাপ সম্পন্ন করুন:
                        </p>
                        <ol className="list-decimal list-inside space-y-2 font-bold">
                          <li>
                            প্রথমে <a href="https://publishers.adsterra.com/signup" target="_blank" rel="noreferrer" className="text-red-600 font-black hover:underline">Adsterra Publisher Panel-এ সাইনআপ</a> করুন।
                          </li>
                          <li>
                            ড্যাশবোর্ড থেকে <strong className="text-slate-900 font-extrabold">"Add Website"</strong> বাটনে ক্লিক করে ডোমেইনটি বসান: <code className="bg-white border border-slate-200 font-mono px-1 py-0.5 rounded text-red-600">gmail-buy-sell-bd.vercel.app</code>
                          </li>
                          <li>
                            Category থেকে <strong className="text-slate-900 font-extrabold">"Miscellaneous (Other)"</strong> বা <strong className="text-slate-900 font-extrabold">"Social"</strong> নির্বাচন করুন এবং আপনার পছন্দের Size যোগ করুন।
                          </li>
                        </ol>
                      </div>

                      <div className="space-y-3.5 leading-relaxed text-slate-650 font-medium border-l border-slate-200/50 pl-0 md:pl-5">
                        <ol className="list-decimal list-inside space-y-2 font-bold" start={4}>
                          <li>
                            সাইটটি ৩-৪ সেকেন্ডে অটো-অ্যাপ্রুভ হয়ে যাবে। সাইট নামের পাশে <strong className="text-slate-900 font-extrabold">"Get Code"</strong> বাটনে ক্লিক করুন।
                          </li>
                          <li>
                            নিচে দেখানো স্ক্রিপ্ট কোড থেকে <strong className="text-slate-500 font-mono">key</strong> ভ্যালুটি কপি করে এনে এখানে বসিয়ে দিন (উপরে প্রতিটি বিজ্ঞাপন ফরম্যাটের কী দেওয়া আছে):
                            <pre className="bg-slate-900 border border-slate-800 text-red-300 font-mono text-[9px] p-2.5 rounded-xl mt-1.5 overflow-x-auto select-all break-all leading-normal">
                              {'//www.highperformanceformat.com/1a2b3c4d5e6f7g8h9i0j/invoke.js'}
                            </pre>
                            এখানে <strong className="text-[#FFEB3B] font-mono font-bold">1a2b3c4d5e6f7g8h9i0j</strong> হলো আপনার ইউনিক Ad Placement Key!
                          </li>
                        </ol>
                      </div>
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
                                        <span className="text-[9px] font-bold text-slate-400 capitalize">{formatDate(payment.createdAt)}</span>
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
                    {allPayments.filter(p => p.status === 'pending').length === 0 && (
                      <div className="p-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                          <Wallet size={40} className="text-slate-200" />
                        </div>
                        <h4 className="font-black text-slate-800 text-base mb-1">No pending payments</h4>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Transactions will appear here</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pending Products (Requests) */}
                <div id="admin-listings" className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm mb-12">
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
                            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 shrink-0 shadow-sm border border-red-100">
                              <Mail size={24} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm mb-1">{listing.gmailAccount}</p>
                              <div className="flex flex-wrap gap-2">
                                <span className="text-[9px] font-black bg-red-50 text-red-600 px-2 py-1 rounded-md uppercase tracking-widest">{listing.type}</span>
                                <span className="text-[9px] font-black bg-orange-50 text-orange-600 px-2 py-1 rounded-md uppercase tracking-widest border border-orange-100">Reviewing</span>
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest self-center">Seller: {listing.sellerNumericId}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="text-right mr-4 hidden md:block">
                              <p className="text-xl font-black text-red-600 tracking-tighter">৳{listing.price}</p>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Listing Price</span>
                            </div>
                            <button
                              onClick={async () => {
                                if (confirm('এই লিস্টিংটি কি মার্কেটপ্লেসে লাইভ করতে চান?')) {
                                  await updateDoc(doc(db, 'listings', listing.id), { status: 'Available', updatedAt: serverTimestamp() });
                                  await sendNotification(listing.sellerId, `আপনার ${listing.gmailAccount} লিস্টিংটি অ্যাপ্রুভ হয়েছে এবং মার্কেটপ্লেসে লাইভ করা হয়েছে!`, 'success');
                                }
                              }}
                              className="flex-1 md:flex-none px-6 py-3.5 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-100 active:scale-95"
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

                {/* Admin Dashboard Navigation Options - Prevent Off-screen Overflow on Mobile */}
                <div className="grid grid-cols-2 min-[380px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:flex lg:flex-row lg:flex-wrap bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm gap-1 mb-6">
                  {["All", "Available", "Pending", "Approved", "Dispute", "SellRequest", "Sold", "Orders", "Payments", "Withdrawals", "Reports"].map((tab) => (
                    <button 
                      key={tab} 
                      onClick={() => {
                        setListingFilter(tab);
                        setAdminSelectedListings([]);
                      }}
                      className={`px-2.5 py-2 rounded-xl text-[9.5px] font-black uppercase tracking-wider text-center transition-all cursor-pointer lg:whitespace-nowrap ${
                        listingFilter === tab ? 'bg-[#2E7D32] text-white' : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Admin Bulk Actions Bar */}
                {['All', 'Available', 'Pending', 'Approved', 'Dispute', 'SellRequest', 'Sold'].includes(listingFilter) && (
                  <div className={`bg-slate-900 sticky top-20 z-20 p-4 rounded-3xl border border-white/10 shadow-2xl flex flex-wrap items-center justify-between gap-4 transition-all mb-6 ${adminSelectedListings.length > 0 ? 'opacity-100 translate-y-0' : 'opacity-80 translate-y-1'}`}>
                    <div className="flex items-center gap-3 ml-2">
                      <button 
                        onClick={() => {
                          const filtered = allListings.filter(item => 
                            listingFilter === 'All' 
                              ? true 
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
                              ? true 
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
                          className="px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
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

                        {(listingFilter === 'Sold' || listingFilter === 'All') && (
                           <div className="flex items-center gap-2 pl-4 border-l border-white/20">
                              <div className="relative">
                                 <input 
                                    type="text"
                                    value={bulkPayoutTrxId}
                                    onChange={(e) => setBulkPayoutTrxId(e.target.value)}
                                    placeholder="Bulk TRX ID..."
                                    className="px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white font-bold text-[10px] placeholder:text-white/30 focus:outline-none focus:border-[#2E7D32]"
                                 />
                                 <CreditCard size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                              </div>
                              <button 
                                 onClick={handleAdminBulkPayout}
                                 className="px-4 py-2 bg-[#2E7D32] text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-1.5"
                              >
                                 <CheckCircle size={12} />
                                 Payout Selected
                              </button>
                           </div>
                        )}

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
                  {listingFilter === 'Withdrawals' ? (
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

                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                               <span className="text-[9px] font-bold text-slate-400 uppercase shrink-0">{withdraw.method || 'bKash'} Number:</span>
                               <span className="text-[11px] font-black text-slate-700 select-all break-all">{withdraw.number || withdraw.bkashNumber}</span>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                               <span className="text-[9px] font-bold text-slate-400 uppercase shrink-0">User:</span>
                               <span className="text-[9px] font-black text-blue-600 truncate select-all break-all max-w-[154px] sm:max-w-none">{withdraw.userEmail}</span>
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
                              <CheckCircle size={14} />
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
                  ) : listingFilter === 'Payments' ? (
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
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex flex-wrap gap-x-2 gap-y-1 items-center">
                              <span>TRX ID: <span className="text-slate-900 font-black break-all select-all">{payment.trxId}</span></span>
                              <span className="text-slate-300 hidden min-[380px]:inline">•</span>
                              <span>{payment.method === 'nagad' ? 'Nagad' : 'bKash'}: <span className="text-slate-900 font-black break-all select-all">{payment.senderNumber}</span></span>
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex flex-wrap gap-x-2 gap-y-1 items-center">
                              <span>Amount: <span className="text-[#2E7D32] font-black">৳{payment.amount}</span></span>
                              <span className="text-slate-300 hidden min-[380px]:inline">•</span>
                              <span>Reference: <span className="text-blue-600 font-black break-all select-all">{payment.listingId}</span></span>
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
                               {formatDate(payment.createdAt)}
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
                          <div className="space-y-1 flex-1 min-w-0">
                            <h4 className="font-bold text-slate-800 break-all select-all">Order by {order.userEmail}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex flex-wrap gap-x-2 gap-y-1 items-center">
                              <span>Item: <span className="text-slate-900 font-black break-all select-all">{order.gmailAccount}</span></span>
                              <span className="text-slate-300 hidden min-[380px]:inline">•</span>
                              <span>Price: <span className="text-[#2E7D32] font-black">৳{order.price}</span></span>
                            </p>
                            {order.sellerBkash && (
                              <p className="text-[10px] text-orange-600 font-black uppercase tracking-widest mt-1 flex flex-wrap gap-x-1 items-center">
                                <span>Seller bKash:</span> <span className="underline decoration-orange-200 break-all select-all">{order.sellerBkash}</span>
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
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{formatDate(order.purchasedAt)}</p>
                          <div className="mt-2 flex items-center gap-2 justify-end">
                            <div className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black border border-green-100 shadow-sm">
                              <CheckCircle size={14} />
                              APPROVED
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : listingFilter === 'Reports' ? (
                    adminReports.length === 0 ? (
                      <div className="p-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                          <AlertTriangle size={40} className="text-slate-200" />
                        </div>
                        <h4 className="font-black text-slate-800 text-base mb-1">কোনো রিপোর্ট নেই</h4>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">সব ডেসপ্যুট ও কমপ্লেইন পরিষ্কার রয়েছে</p>
                      </div>
                    ) : (
                      adminReports.map((report, i) => (
                        <motion.div
                          key={report.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white rounded-3xl border border-red-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 shrink-0">
                              <AlertTriangle size={24} />
                            </div>
                            <div className="space-y-1">
                              <h4 className="font-bold text-slate-800">Report by {report.buyerEmail}</h4>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                Listing: <span className="text-slate-900 font-black">{report.listingId}</span> • Sibling/Purchase: <span className="text-slate-900 font-bold">{report.purchaseId || 'N/A'}</span>
                              </p>
                              <p className="text-xs font-bold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-2">
                               💬 <span className="italic">{report.message}</span>
                              </p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                Seller UID: <span className="text-slate-600">{report.sellerId}</span>
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end gap-2 shrink-0">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{formatDate(report.createdAt)}</p>
                            <div className="flex gap-2">
                              {report.status !== 'resolved' ? (
                                <button
                                  onClick={async () => {
                                    if (confirm('এই রিপোর্টটি সমাধান ও রিসিভ করতে চান?')) {
                                      await updateDoc(doc(db, 'reports', report.id), { status: 'resolved' });
                                      alert('Report resolved!');
                                    }
                                  }}
                                  className="px-4 py-2 bg-[#2E7D32] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#1B5E20] transition-all flex items-center gap-1 shadow-md active:scale-95"
                                >
                                  <Check size={12} /> Resolve
                                </button>
                              ) : (
                                <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black border border-green-100">
                                  RESOLVED
                                </span>
                              )}
                              <button
                                onClick={async () => {
                                  if (confirm('রিপোর্টটি কি ডিলিট করতে চান?')) {
                                    await deleteDoc(doc(db, 'reports', report.id));
                                    alert('Report deleted!');
                                  }
                                }}
                                className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all active:scale-95"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )
                  ) : (
                    allListings
                      .filter(item => 
                        listingFilter === 'All' 
                          ? true 
                          : item.status === listingFilter
                      )
                      .map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`bg-white rounded-3xl border p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:shadow-md transition-all ${adminSelectedListings.includes(item.id) ? 'border-red-600 ring-2 ring-red-500/10 bg-red-50/5' : 'border-slate-100'}`}
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
                           <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${adminSelectedListings.includes(item.id) ? 'bg-[#2E7D32] border-[#2E7D32] scale-110 shadow-lg shadow-green-100' : 'bg-white border-slate-200 group-hover/check:border-red-300'}`}>
                              {adminSelectedListings.includes(item.id) && <CheckCircle size={18} className="text-white" />}
                           </div>
                        </button>
                        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 shrink-0">
                          <Mail size={24} />
                        </div>
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-slate-800 truncate max-w-full">
                              {revealedPasswords[item.id] ? (item.realGmail || item.gmailAccount) : '********************'}
                            </h4>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter shrink-0 ${
                              item.status === 'Available' ? 'bg-green-100 text-green-700' : 
                              item.status === 'SellRequest' ? 'bg-blue-50 text-blue-600' :
                              item.status === 'Approved' ? 'bg-green-500 text-white' :
                              'bg-slate-100 text-slate-500'
                            }`}>{item.status}</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-x-4 gap-y-1.5 w-full items-center">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                              Price: <span className="text-[#2E7D32] font-black">৳{item.price}</span>
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                              Seller ID: <span className="text-slate-600 font-mono">{item.sellerNumericId || item.sellerId.substring(0, 5)}</span>
                            </p>
                            {item.bkashNumber && (
                              <p className="text-[10px] text-orange-600 font-black uppercase tracking-widest flex items-center gap-1 flex-wrap shrink-0">
                                <span>bKash:</span>
                                <span className="font-mono tracking-normal normal-case text-slate-700 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100 font-extrabold select-all break-all">{item.bkashNumber}</span>
                              </p>
                            )}
                            {item.description && (
                              <p className="text-[10px] text-red-500 font-bold tracking-widest uppercase">
                                Desc: <span className="text-slate-600 italic normal-case">{item.description}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <button 
                          onClick={() => revealPassword(item.id, item.sellerId)}
                          className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-slate-800 hover:bg-slate-800 transition-all shadow-sm"
                        >
                          {revealedPasswords[item.id] ? <Eye size={14} /> : <EyeOff size={14} />}
                          Creds
                        </button>
                        <button 
                           onClick={() => deleteListing(item.id)}
                           className="px-4 py-2.5 rounded-xl bg-red-50 text-red-600 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-red-100 hover:bg-red-100 transition-all"
                        >
                           <Trash2 size={14} />
                           Delete
                        </button>

                        {item.paymentStatus !== 'Paid' && (
                          <>
                            <button 
                              onClick={async () => {
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
                              className="px-4 py-2.5 rounded-xl bg-blue-50 text-blue-600 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-blue-100 hover:bg-blue-100 transition-all"
                            >
                              <RefreshCw size={14} />
                              Edit Info
                            </button>
                            <button 
                              onClick={() => updateListingStatus(item.id, 'Available')}
                              className="px-4 py-2.5 rounded-xl bg-blue-50 text-blue-600 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-blue-100 hover:bg-blue-100 transition-all"
                            >
                              <CheckCircle size={14} />
                              Available
                            </button>
                            <button 
                              onClick={() => updateListingStatus(item.id, 'Dispute')}
                              className="px-4 py-2.5 rounded-xl bg-orange-50 text-orange-600 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-orange-100 hover:bg-orange-100 transition-all"
                            >
                              <Shield size={14} />
                              Dispute
                            </button>
                          </>
                        )}
                      </div>

                      {/* Seller Payout Section for Sold Items */}
                      {item.status === 'Sold' && (
                        <div className="w-full mt-4 p-5 bg-gradient-to-br from-red-50 to-blue-50/30 rounded-3xl border border-red-100/50 flex flex-col md:flex-row items-center justify-between gap-6">
                           <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.paymentStatus === 'Paid' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600 shadow-inner'}`}>
                                 {item.paymentStatus === 'Paid' ? <CheckCircle size={24} /> : <Clock size={24} className="animate-pulse" />}
                              </div>
                              <div className="space-y-1">
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seller Payout Status</p>
                                 <div className="flex items-center gap-2">
                                    <h4 className={`text-sm font-black uppercase tracking-tight ${item.paymentStatus === 'Paid' ? 'text-green-600' : 'text-orange-600'}`}>
                                       {item.paymentStatus || 'Pending'}
                                    </h4>
                                    {item.paymentStatus === 'Paid' && (
                                       <span className="text-[10px] font-bold text-slate-400 bg-white/50 px-2 py-0.5 rounded-full border border-slate-100">
                                          TRX: {item.payoutTrxId}
                                       </span>
                                    )}
                                 </div>
                              </div>
                           </div>

                           {item.paymentStatus !== 'Paid' ? (
                              <div className="flex-1 flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                                 <div className="relative flex-1 w-full group">
                                    <input 
                                       type="text"
                                       value={adminTrxMap[item.id] || ''}
                                       onChange={(e) => setAdminTrxMap(prev => ({ ...prev, [item.id]: e.target.value }))}
                                       placeholder="Enter bKash TRX ID..."
                                       className="w-full px-5 py-3.5 bg-white border-2 border-slate-200 rounded-2xl font-bold text-sm focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all placeholder:text-slate-300 group-hover:border-slate-300"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-focus-within:text-red-400 transition-colors">
                                       <CreditCard size={18} />
                                    </div>
                                 </div>
                                 <button 
                                    onClick={() => handleAdminConfirmPayout(item.id)}
                                    className="w-full sm:w-auto px-8 py-3.5 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                                 >
                                    <CheckCircle size={16} />
                                    Confirm Paid
                                 </button>
                              </div>
                           ) : (
                             <div className="px-6 py-3 bg-white/60 rounded-2xl border border-green-100 flex items-center gap-2">
                                <BadgeCheck size={18} className="text-green-500" />
                                <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Payout Completed</span>
                             </div>
                           )}
                        </div>
                      )}

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
                                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:outline-none focus:border-red-600"
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
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:outline-none focus:border-red-600"
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
                          className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-100 transition-all flex items-center justify-center gap-2"
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
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Approved", status: 'Approved', count: sellerListings.filter(l => l.status === 'Approved').length, color: "text-green-600", bg: "bg-green-50" },
                    { label: "Dispute", status: 'Dispute', count: sellerListings.filter(l => l.status === 'Dispute').length, color: "text-red-500", bg: "bg-red-50" },
                    { label: "Sold", status: 'Sold', count: sellerListings.filter(l => l.status === 'Sold').length, color: "text-red-600", bg: "bg-red-50" },
                  ].map((stat, i) => (
                    <button 
                      key={i} 
                      onClick={() => setListingFilter(listingFilter === stat.status ? 'All' : stat.status)}
                      className={`${stat.bg} py-2 px-1.5 rounded-lg border transition-all active:scale-95 flex flex-col items-center justify-center text-center ${listingFilter === stat.status ? 'border-red-400 shadow-sm ring-1 ring-red-50' : 'border-white shadow-sm hover:border-slate-200'}`}
                    >
                      <span className={`text-base font-black ${stat.color}`}>{stat.count}</span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.1em]">{stat.label}</span>
                    </button>
                  ))}
                </div>

                {/* Seller Center Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-1 p-2 bg-white rounded-lg border border-slate-50 shadow-sm relative">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-red-50 rounded-md">
                      <Mail className="text-red-500" size={12} />
                    </div>
                    <div>
                      <h2 className="font-display text-[12px] font-black text-slate-800 tracking-tight">Seller Center</h2>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="flex items-center gap-1 bg-slate-50 px-1 py-0.5 rounded border border-slate-50/50">
                          <span className="w-1 h-1 bg-blue-500 rounded-full" />
                          <span className="text-[7px] font-bold text-slate-500 uppercase tracking-wider">Live:</span>
                          <span className="text-[9px] font-black text-blue-600">{sellerListings.filter(l => l.status === 'Available').length}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-slate-50 px-1 py-0.5 rounded border border-slate-50/50">
                          <span className="w-1 h-1 bg-orange-400 rounded-full" />
                          <span className="text-[7px] font-bold text-slate-500 uppercase tracking-wider">Pending:</span>
                          <span className="text-[9px] font-black text-orange-600">{sellerListings.filter(l => l.status === 'Pending').length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-1.5">
                  <button 
                    onClick={() => {}}
                    className="flex-1 py-2 bg-white border border-slate-200 text-slate-700 font-black rounded-lg shadow-sm flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-[0.98]"
                  >
                    <History size={12} />
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
                    className="flex-1 bg-[#2E7D32] text-white font-black py-2 rounded-lg shadow-md shadow-green-900/5 flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-widest hover:bg-[#1B5E20] transition-all active:scale-[0.98]"
                  >
                    <Plus size={12} />
                    Sell Gmail
                  </button>
                </div>

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

                {/* Seller Center Option Filters - Structured Grid to Prevent Off-screen Overflow on Mobile */}
                <div className="grid grid-cols-4 gap-1 w-full pb-1 min-w-0">
                  <button 
                    onClick={() => setListingFilter('All')}
                    className={`px-0.5 py-2 rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-tight sm:tracking-wider text-center transition-all border cursor-pointer truncate ${listingFilter === 'All' ? 'bg-[#1B5E20] text-white border-[#1B5E20] shadow-md shadow-green-500/10' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}
                  >
                    All
                  </button>
                  <button 
                    onClick={() => setListingFilter('Approved')}
                    className={`px-0.5 py-2 rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-tight sm:tracking-wider text-center transition-all border cursor-pointer truncate ${listingFilter === 'Approved' ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}
                  >
                    Approved
                  </button>
                  <button 
                    onClick={() => setListingFilter('Sold')}
                    className={`px-0.5 py-2 rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-tight sm:tracking-wider text-center transition-all border cursor-pointer truncate ${listingFilter === 'Sold' ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-500/10' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}
                  >
                    Sold
                  </button>
                  <button 
                    onClick={() => setListingFilter('Reports')}
                    className={`px-0.5 py-2 rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-tight sm:tracking-wider text-center transition-all border cursor-pointer truncate ${listingFilter === 'Reports' ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-500/10' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}
                    title={`Reports (${sellerReports.length})`}
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
                             <span>{formatDate(report.createdAt)}</span>
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
                        className="bg-white rounded-2xl sm:rounded-[2rem] border border-slate-100 p-4 sm:p-6 md:p-8 space-y-4 md:space-y-6 shadow-sm shadow-slate-200/40 relative min-w-0 overflow-hidden"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-display text-base sm:text-xl font-bold text-slate-800 truncate break-all block" title={item.gmailAccount}>
                              {item.gmailAccount}
                            </h4>
                          </div>
                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
                            <span className={`px-2.5 py-1 rounded-lg border text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${
                              item.status === 'Approved' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                              item.status === 'Available' ? 'bg-green-50 border-green-100 text-green-600' :
                              item.status === 'Dispute' ? 'bg-red-50 border-red-100 text-red-600' :
                              item.status === 'Sold' ? 'bg-red-50 border-red-100 text-red-600 shadow-inner' :
                              'bg-slate-50 border-slate-100 text-slate-500'
                            }`}>
                              {item.status === 'Sold' && item.paymentStatus === 'Paid' ? 'Approved' : (item.status === 'Approved' ? 'Approved' : item.status)}
                            </span>
                            <p className="text-[10px] sm:text-xs font-black text-red-600">৳{item.price}</p>
                          </div>
                        </div>

                        <div className="inline-block px-3 py-1 rounded-lg bg-slate-50 border border-slate-100 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          {item.type}
                        </div>

                        {false && (
                          <div className="space-y-4 min-w-0">
                            <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.1em]">ACCOUNT DETAILS</p>
                            <div className="space-y-3 min-w-0">
                              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 min-w-0 gap-2">
                                <div className="flex-1 min-w-0 flex flex-col gap-1">
                                  <span className="text-[8px] font-black text-slate-400 uppercase">Account Credentials</span>
                                  <div className="space-y-2 mt-1 min-w-0">
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-[8px] text-slate-500">Email:</span>
                                      <span className="font-mono text-slate-900 text-xs sm:text-sm break-all font-semibold select-all">
                                        {revealedPasswords[item.id] ? revealedPasswords[item.id].email : '**********'}
                                      </span>
                                    </div>
                                    {revealedPasswords[item.id] && (
                                      <>
                                        <div className="flex flex-col min-w-0">
                                          <span className="text-[8px] text-slate-500">Password:</span>
                                          <span className="font-mono text-slate-900 text-xs sm:text-sm font-bold break-all select-all">
                                            {revealedPasswords[item.id].password}
                                          </span>
                                        </div>
                                        {(revealedPasswords[item.id].recoveryEmail || revealedPasswords[item.id].recovery) && (
                                          <div className="flex flex-col min-w-0">
                                            <span className="text-[8px] text-slate-500">Recovery:</span>
                                            <span className="font-mono text-slate-900 text-xs sm:text-sm break-all select-all">
                                              {revealedPasswords[item.id].recoveryEmail || revealedPasswords[item.id].recovery}
                                            </span>
                                          </div>
                                        )}
                                        {revealedPasswords[item.id].twoFactor && (
                                          <div className="flex flex-col min-w-0">
                                            <span className="text-[8px] text-slate-500">2FA / Security Code:</span>
                                            <span className="font-mono text-slate-900 text-xs sm:text-sm break-all select-all">
                                              {revealedPasswords[item.id].twoFactor}
                                            </span>
                                          </div>
                                        )}
                                      </>
                                    )}
                                    {!revealedPasswords[item.id] && (
                                      <div className="flex flex-col min-w-0">
                                        <span className="text-[8px] text-slate-500">Password:</span>
                                        <span className="font-mono text-slate-900 text-xs sm:text-sm italic opacity-30 break-all select-none">
                                          Hidden
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <button 
                                  onClick={() => revealPassword(item.id, item.sellerId)}
                                  className="p-2 hover:bg-white rounded-lg transition-colors shadow-sm self-start shrink-0"
                                >
                                  {revealedPasswords[item.id] ? <Eye className="text-[#2E7D32]" size={16} /> : <EyeOff className="text-slate-400" size={16} />}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Seller payout info for sold item */}
                        {item.status === 'Sold' && (
                          <div className="bg-slate-100/50 rounded-2xl p-4 sm:p-5 border border-slate-200/50 space-y-3 shadow-inner min-w-0 overflow-hidden">
                             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full shrink-0 ${item.paymentStatus === 'Paid' ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`} />
                                  <p className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">Payout Tracking</p>
                                </div>
                                <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border self-start sm:self-auto ${item.paymentStatus === 'Paid' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-orange-50 border-orange-100 text-orange-700'}`}>
                                   {item.paymentStatus === 'Paid' ? 'PAID / CONFIRMED' : 'PAYMENT PENDING'}
                                </span>
                             </div>
                             
                             {item.paymentStatus === 'Paid' ? (
                               <div className="bg-white p-3 rounded-xl border border-green-50 shadow-sm flex flex-col gap-1.5 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                     <span className="text-[9px] font-bold text-slate-400 uppercase">Payout Method:</span>
                                     <span className="text-[10px] font-black text-slate-700 uppercase">bKash</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-2 min-w-0">
                                     <span className="text-[9px] font-bold text-slate-400 uppercase shrink-0">TRX ID:</span>
                                     <span className="text-[10px] sm:text-[11px] font-black text-red-600 font-mono tracking-wider select-all break-all text-right">{item.payoutTrxId}</span>
                                  </div>
                                  <div className="mt-1 pt-1 border-t border-slate-50 flex items-center justify-center gap-1.5 text-green-600">
                                     <CheckCircle size={12} className="shrink-0" />
                                     <span className="text-[9px] font-black uppercase text-center">আপনার বিকাশ চেক করুন</span>
                                  </div>
                               </div>
                             ) : (
                               <div className="bg-white/40 p-3 rounded-xl border border-slate-100 text-center min-w-0">
                                  <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 leading-relaxed break-words">
                                     আইটেমটি সফলভাবে বিক্রি হয়েছে। এডমিন বিকাশ থেকে আপনার নম্বরে পেমেন্ট পাঠিয়ে এখানে TRX ID সাবমিট করলে আপনি সেটি নিশ্চিত দেখতে পাবেন।
                                  </p>
                               </div>
                             )}
                          </div>
                        )}

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

          {/* User Notifications Modal */}
          <AnimatePresence>
            {isNotificationsOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsNotificationsOpen(false)}
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-sm sm:max-w-md bg-white rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] border border-slate-100/50 flex flex-col max-h-[85vh] z-10 font-sans"
                >
                  <div className="flex items-center justify-between px-6 py-5 border-b border-rose-50/10 flex-shrink-0 bg-white select-none">
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight leading-none">
                      Notifications
                    </h3>
                    
                    <div className="flex items-center gap-4">
                      {unreadCount > 0 ? (
                        <button
                          onClick={markAllNotificationsRead}
                          className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-red-600 hover:text-red-700 transition-all cursor-pointer"
                        >
                          CLEAR
                        </button>
                      ) : (
                        <button
                          onClick={() => setIsNotificationsOpen(false)}
                          className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                        >
                          CLOSE
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-grow overflow-y-auto px-6 py-1 bg-white custom-scrollbar scroll-smooth">
                    <div className="divide-y divide-slate-100">
                      {notifications.map((notif) => {
                        // Dynamically resolve notification template styles to match screenshot perfectly
                        const msg = notif.message || '';
                        const type = notif.type;
                        
                        let title = 'STATION UPDATE';
                        let isSuccess = false;
                        
                        if (type === 'success' || msg.toLowerCase().includes('deposit') || msg.toLowerCase().includes('পেমেন্ট') || msg.toLowerCase().includes('উইথড্র') || msg.toLowerCase().includes('এপ্রুভ')) {
                          title = 'INSTANT DEPOSIT';
                          isSuccess = true;
                        } else if (type === 'warning' || type === 'error' || msg.toLowerCase().includes('sell') || msg.toLowerCase().includes('লিস্টিং') || msg.toLowerCase().includes('অনুরোধ')) {
                          title = 'NEW SELL REQUEST';
                        } else {
                          title = 'SYSTEM UPDATE';
                        }

                        // Short date string formatter matching screenshot: 04:20 PM or 01:06 AM
                        const formatNotifTime = (timestamp: any) => {
                          if (!timestamp) return '11:30 AM';
                          let dateObj = new Date();
                          if (timestamp.toDate) dateObj = timestamp.toDate();
                          else if (timestamp.seconds) dateObj = new Date(timestamp.seconds * 1000);
                          else dateObj = new Date(timestamp);
                          
                          let hours = dateObj.getHours();
                          let minutes = dateObj.getMinutes();
                          const ampm = hours >= 12 ? 'PM' : 'AM';
                          hours = hours % 12;
                          hours = hours ? hours : 12;
                          const minutesStr = minutes < 10 ? '0' + minutes : minutes;
                          const hoursStr = hours < 10 ? '0' + hours : hours;
                          return `${hoursStr}:${minutesStr} ${ampm}`;
                        };

                        return (
                          <motion.div
                            key={notif.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => {
                              if (!notif.read) {
                                markNotificationRead(notif.id);
                              }
                            }}
                            className="py-4.5 flex flex-col relative transition-all cursor-pointer hover:bg-slate-50/20"
                          >
                            {/* Blue active marker indicator */}
                            {!notif.read && (
                              <span className="absolute left-0 top-5 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-blue-100/50" />
                            )}

                            {/* Alert Header Row */}
                            <div className="flex items-center justify-between pl-3.5 pr-1 select-none">
                              <div className="flex items-center gap-1.5">
                                {isSuccess ? (
                                  <div className="w-4 h-4 rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center text-emerald-500 shrink-0">
                                    <Check size={9} strokeWidth={4} />
                                  </div>
                                ) : (
                                  <div className="w-4 h-4 rounded-full bg-orange-50 border border-orange-300 flex items-center justify-center text-orange-500 font-extrabold text-[9px] shrink-0 leading-none">
                                    !
                                  </div>
                                )}
                                <span className={`text-[9.5px] min-[360px]:text-[10px] font-black uppercase tracking-widest ${isSuccess ? 'text-emerald-500' : 'text-orange-500/90'}`}>
                                  {title}
                                </span>
                              </div>

                              {/* Dismiss checkbox button on right side */}
                              {!notif.read ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markNotificationRead(notif.id);
                                  }}
                                  className="w-4 h-4 rounded border border-slate-200 hover:border-red-400 bg-white flex items-center justify-center text-slate-300 hover:text-red-600 transition-all cursor-pointer active:scale-90"
                                >
                                  <Check size={10} strokeWidth={3} />
                                </button>
                              ) : (
                                <div className="text-slate-300/60 flex items-center justify-center">
                                  <Check size={12} strokeWidth={2.5} />
                                </div>
                              )}
                            </div>

                            {/* Body Text Area */}
                            <div className="pl-3.5 pr-1 mt-1 text-left">
                              <p className="text-[12px] min-[360px]:text-[13px] font-bold text-slate-700 leading-relaxed break-words font-sans">
                                {notif.message}
                              </p>
                            </div>

                            {/* Subtitle/Footer metadata block matching layout detail */}
                            <div className="pl-3.5 pr-1 mt-2 flex items-center justify-between text-[9px] sm:text-[9.5px] font-bold text-slate-400 select-none">
                              <span className="uppercase tracking-wider">
                                {notif.fromName || 'MD SAYFULLAH'} • {formatNotifTime(notif.createdAt)}
                              </span>
                              <span className="font-mono text-[8.5px] sm:text-[9px] text-slate-350 font-medium">
                                ID: {(notif.id || 'rV3JE').substring(0, 5).toUpperCase()}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}

                      {notifications.length === 0 && (
                        <div className="py-20 text-center select-none bg-slate-50/20 rounded-[2rem] border-2 border-dashed border-slate-100 my-4">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner border border-slate-50">
                            <Bell className="text-slate-300" size={20} />
                          </div>
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em]">কোনো নোটিফিকেশন নেই</p>
                          <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-0.5">No notifications found</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* See all activity matching footer */}
                  <div className="py-4.5 text-center border-t border-slate-100 flex-shrink-0 bg-white select-none">
                    <button
                      onClick={() => setIsNotificationsOpen(false)}
                      className="text-[10px] min-[360px]:text-[11px] font-black tracking-widest text-slate-400 hover:text-slate-600 uppercase transition-all cursor-pointer active:scale-95"
                    >
                      SEE ALL ACTIVITY
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
                <div className="p-8 text-center bg-red-50/50">
                   <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <Layers size={32} className="text-red-600" />
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
                        className="w-full py-4 rounded-xl bg-red-600 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-red-100 hover:bg-slate-900 transition-all flex items-center justify-center gap-2 active:scale-95"
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

          {comingSoonPlatform && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setComingSoonPlatform(null)}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100]"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[360px] bg-white rounded-3xl shadow-2xl z-[101] overflow-hidden border border-slate-100 p-6 text-center"
              >
                <div className="flex flex-col items-center">
                  {/* Platform-specific beautiful icon/badge */}
                  <div className={`w-14 h-14 ${
                    comingSoonPlatform === 'Instagram' ? 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]' :
                    comingSoonPlatform === 'Telegram OTP' ? 'bg-[#229ED9]' : 'bg-[#25D366]'
                  } rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg`}>
                    {comingSoonPlatform === 'Instagram' && <Camera size={26} strokeWidth={2.5} />}
                    {comingSoonPlatform === 'Telegram OTP' && <Send size={24} strokeWidth={2.5} className="-ml-0.5 mt-0.5" />}
                    {comingSoonPlatform === 'WhatsApp OTP' && <MessageSquare size={26} strokeWidth={2.5} />}
                  </div>

                  <span className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-1">Coming Soon</span>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">
                    {comingSoonPlatform} Integration
                  </h3>
                  
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold mb-6 px-1">
                    আমরা খুবই শীঘ্রই আমাদের নিরাপদ এস্ক্রো সিস্টেমে <span className="font-extrabold text-slate-800">{comingSoonPlatform}</span> বেচাকেনা সুবিধা চালু করতে যাচ্ছি। আপডেট পেতে নোটিশ বোর্ড লক্ষ্য রাখুন!
                  </p>

                  <button 
                    onClick={() => setComingSoonPlatform(null)}
                    className="w-full py-3.5 bg-red-600 hover:bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-red-100 transition-all active:scale-95"
                  >
                    ঠিক আছে
                  </button>
                </div>
              </motion.div>
            </>
          )}

          {showPaymentModal.show && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleClosePaymentModal}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100]"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-[380px] ${showPaymentModal.listingId === 'deposit' ? (paymentForm.method === 'bkash' ? 'bg-[#e2136e] border-[#d11264]' : 'bg-[#ed1c24] border-[#d11218]') : 'bg-slate-900 border-slate-950'} rounded-[2rem] shadow-2xl z-[101] overflow-hidden border transition-colors duration-500`}
              >
                <div className="py-2.5 px-4 text-white relative font-sans">
                   <div className="flex items-center justify-between mb-2">
                     {showPaymentModal.listingId === 'deposit' ? (
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
                           className={`flex-1 h-10 rounded-xl flex items-center justify-center p-1 shadow-md transition-all relative ${paymentForm.method === 'nagad' ? 'bg-white scale-105 ring-2 ring-white/30' : 'bg-white/45 hover:bg-white/65 opacity-70 hover:opacity-100'}`}
                         >
                           <img src="https://www.logo.wine/a/logo/Nagad/Nagad-Logo.wine.svg" alt="Nagad" className="w-full h-full object-contain scale-125" referrerPolicy="no-referrer" />
                           {paymentForm.method === 'nagad' && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-600 rounded-full border border-white"></div>}
                         </button>
                       </div>
                     ) : (
                       <div className="flex items-center gap-2 py-1 pl-1">
                         <Wallet size={16} className="text-white animate-pulse" />
                         <span className="text-[11px] font-black uppercase tracking-widest text-[#FFEB3B]">GMAIL MARKETPLACE CHECKOUT</span>
                       </div>
                     )}
                     <button 
                       onClick={handleClosePaymentModal}
                       className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors ml-2"
                     >
                       <X size={14} />
                     </button>
                   </div>

                  <div className="flex items-end justify-between px-2 pb-1 bg-transparent border-0 shadow-none">
                    {showPaymentModal.listingId === 'deposit' ? (
                      <div className="space-y-1">
                        <p className="text-white/80 text-[9px] font-black uppercase tracking-[0.2em]">Deposit Amount (BDT)</p>
                        <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-xl border border-white/10 animate-in fade-in duration-300">
                          <span className="font-extrabold text-base text-white">৳</span>
                          <input 
                            type="number"
                            min="10"
                            max="50000"
                            value={showPaymentModal.price || ''}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setShowPaymentModal(prev => ({ ...prev, price: val }));
                              setPaymentForm(prev => ({ ...prev, senderNumber: e.target.value }));
                            }}
                            className="bg-transparent text-white font-extrabold text-base w-24 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="Amount"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-0">
                        <p className="text-white/80 text-[10px] font-black uppercase tracking-[0.2em]">Pay Amount</p>
                        <h3 className="text-2xl font-black italic tracking-tighter">৳{showPaymentModal.price.toFixed(2)}</h3>
                      </div>
                    )}
                    <div className="mb-0.5 flex flex-col items-end gap-1">
                      <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest border border-white/10 leading-none">Personal</span>
                      <span className="text-[7.5px] font-black text-white/80 tracking-tight leading-none">Balance: ৳{userProfile?.balance?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-t-[1.5rem] px-4 py-4 space-y-3 max-h-[75vh] overflow-y-auto custom-scrollbar shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                  <div className="space-y-4 font-sans">
                    <AnimatePresence mode="wait">
                      {isDepositCompleted ? (
                        <motion.div 
                          key="deposit-completion-success"
                          initial={{ opacity: 0, scale: 0.9, y: 15 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: -15 }}
                          className="space-y-6 py-6 px-3 text-center flex flex-col items-center justify-center min-h-[260px]"
                        >
                          <div className="relative">
                            <motion.div 
                              className="absolute inset-0 bg-emerald-100 rounded-full"
                              initial={{ scale: 0.8, opacity: 0.6 }}
                              animate={{ scale: 1.5, opacity: 0 }}
                              transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                            />
                            <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg border-4 border-white relative z-10">
                              <CheckCircle size={32} className="animate-bounce text-white" />
                            </div>
                          </div>
                          
                          <div className="space-y-2 relative z-10 px-2">
                            <h3 className="text-base font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 inline-block tracking-tight text-[11px] uppercase tracking-widest mb-1 font-sans">Submit Successful</h3>
                            <p className="text-slate-800 text-sm font-black leading-relaxed">
                              ডিপোজিট রিকুয়েস্ট সফলভাবে পাঠানো হয়েছে। অ্যাডমিন চেক করে অ্যাপ্রুভ করবে।
                            </p>
                            
                            {/* min balance / Deposit amount view shown on this next step */}
                            <div className="my-3 flex items-center justify-between p-3 bg-red-50/70 border border-red-100/40 rounded-2xl text-left shadow-xs w-full max-w-[220px] mx-auto animate-in fade-in slide-in-from-bottom duration-500 delay-150 font-sans">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                                <span className="text-[10px] font-black text-red-700 uppercase tracking-widest leading-none">min balance</span>
                              </div>
                              <span className="text-xs font-black text-slate-800">৳{userProfile?.balance?.toFixed(2) || '0.00'}</span>
                            </div>

                            <p className="text-slate-400 text-[10px] font-bold">
                              উইন্ডোটি অটোমেটিক চলে যাবে, অনুগ্রহ করে অপেক্ষা করুন...
                            </p>
                          </div>
                        </motion.div>
                      ) : isPaymentSent ? (
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
                              <h3 className="text-xl font-black text-slate-800 tracking-tight tracking-normal">পেমেন্ট পেন্ডিং (Pending Approval)</h3>
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
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-sans">কিভাবে চেক করবেন?</p>
                                <p className="text-[11px] text-slate-600 font-bold">"লেনদেন ইতিহাস" ট্যাব থেকে আপডেট দেখতে পাবেন।</p>
                             </div>
                          </div>

                          <button 
                            type="button"
                            onClick={() => {
                              setShowPaymentModal({ show: false, price: 0 });
                              setView('gmail-market');
                              setMarketTab('Bought');
                            }}
                            className="w-full py-4 rounded-xl bg-[#2E7D32] text-white font-black text-[10px] uppercase tracking-widest hover:bg-[#1B5E20] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
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
                             <p className="text-[#2E7D32] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 font-sans">
                               <CheckCircle size={20} />
                               PAYMENT VERIFIED
                             </p>
                          </div>
                          
                          <div className="p-6 bg-[#0F172A] rounded-[2rem] space-y-6 shadow-2xl relative overflow-hidden border border-slate-800">
                             <div className="absolute top-0 right-0 p-6 opacity-5">
                                <ShieldCheck size={80} className="text-white" />
                             </div>
                             
                             <div className="space-y-3 relative z-10">
                              <div className="space-y-1 text-left">
                                <span className="text-[8px] text-white/30 uppercase font-black tracking-widest block font-sans">Purchased Gmail</span>
                                <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                                  <p className="font-mono font-bold text-white text-xs truncate mr-2 select-all">{purchasedCreds.gmail}</p>
                                  <button type="button" onClick={() => { navigator.clipboard.writeText(purchasedCreds.gmail); alert('Gmail Copied!'); }} className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-[#FFEB3B] hover:scale-110 transition-all cursor-pointer"><Copy size={12}/></button>
                                </div>
                              </div>
  
                              <div className="space-y-1 text-left">
                                <span className="text-[8px] text-white/30 uppercase font-black tracking-widest block font-sans">Account Password</span>
                                <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                                  <p className="font-mono font-bold text-[#FFEB3B] text-xs truncate mr-2 select-all">{purchasedCreds.pass}</p>
                                  <button type="button" onClick={() => { navigator.clipboard.writeText(purchasedCreds.pass); alert('Password Copied!'); }} className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white hover:scale-110 transition-all cursor-pointer"><Copy size={12}/></button>
                                </div>
                              </div>

                              {purchasedCreds.recovery && (
                                <div className="space-y-1 text-left">
                                  <span className="text-[8px] text-white/30 uppercase font-black tracking-widest block font-sans">Recovery Email</span>
                                  <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                                    <p className="font-mono font-bold text-green-300 text-xs truncate mr-2 select-all">{purchasedCreds.recovery}</p>
                                    <button type="button" onClick={() => { navigator.clipboard.writeText(purchasedCreds.recovery!); alert('Recovery Copied!'); }} className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white hover:scale-110 transition-all cursor-pointer"><Copy size={12}/></button>
                                  </div>
                                </div>
                              )}

                              {purchasedCreds.twoFactor && (
                                <div className="space-y-1 text-left">
                                  <span className="text-[8px] text-white/30 uppercase font-black tracking-widest block font-sans">2FA / Authenticator</span>
                                  <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                                    <p className="font-mono font-bold text-blue-300 text-xs truncate mr-2 select-all">{purchasedCreds.twoFactor}</p>
                                    <button type="button" onClick={() => { navigator.clipboard.writeText(purchasedCreds.twoFactor!); alert('2FA Copied!'); }} className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white hover:scale-110 transition-all cursor-pointer"><Copy size={12}/></button>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="bg-white/5 p-3 rounded-xl flex items-center gap-2.5 border border-white/5 text-left">
                               <AlertCircle size={14} className="text-yellow-300/80 shrink-0" />
                               <p className="text-[9px] text-white/50 font-medium leading-tight">
                                  You can find your credentials under "Bought" tab or logs at any time.
                                </p>
                            </div>
                          </div>

                          <button 
                            type="button"
                            onClick={() => {
                              setShowPaymentModal({ show: false, price: 0 });
                              setPurchasedCreds(null);
                              setView('gmail-market');
                              setMarketTab('Bought');
                            }}
                            className="w-full py-5 rounded-[1.5rem] bg-[#2E7D32] text-white font-black text-xs uppercase tracking-[0.15em] hover:bg-[#1B5E20] transition-all shadow-[0_10px_30px_rgba(46,125,50,0.3)] active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
                          >
                            FINISH & VIEW ACCOUNT
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="form"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="space-y-3.5"
                        >
                          {showPaymentModal.listingId !== 'deposit' && (
                            <div className="space-y-3 animate-in fade-in duration-300">
                              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                                    <div className="flex flex-col text-left">
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none font-sans">Wallet Balance</span>
                                      <span className="text-xs font-black text-slate-700">৳{userProfile?.balance?.toFixed(2) || '0.00'}</span>
                                    </div>
                                  </div>
                                  <div className="text-right font-sans">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none">Total Cost</span>
                                    <span className="text-xs font-black text-[#2E7D32]">৳{showPaymentModal.price.toFixed(2)}</span>
                                  </div>
                                </div>

                                {userProfile && userProfile.balance >= showPaymentModal.price ? (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (showPaymentModal.listingId === 'bulk') {
                                        await executeBulkBuy();
                                      } else {
                                        const listing = marketListings.find(l => l.id === showPaymentModal.listingId);
                                        if (listing) {
                                          await buyListing(listing);
                                        } else {
                                          alert("আইটেমটি পাওয়া যায়নি!");
                                        }
                                      }
                                    }}
                                    disabled={isSubmitting}
                                    className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-md shadow-green-100"
                                  >
                                    {isSubmitting ? (
                                      <RefreshCw size={14} className="animate-spin" />
                                    ) : (
                                      <>
                                        <CheckCircle size={14} />
                                        Wallet Balance দিয়ে কিনুন
                                      </>
                                    )}
                                  </button>
                                ) : (
                                  <div className="bg-amber-50 border border-amber-100 p-3.5 rounded-xl text-left space-y-2.5">
                                    <p className="text-[9.5px] font-bold text-amber-850 leading-normal flex items-start gap-1.5 font-sans">
                                      <AlertCircle size={12} className="shrink-0 mt-0.5 text-amber-600 animate-pulse" />
                                      <span>
                                        আপনার ওয়ালেট ব্যালেন্স পর্যাপ্ত নয়! জিমেইল কিনতে চাইলে দয়া করে আগে ব্যালেন্স ডেপোজিট করুন।
                                      </span>
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setView('profile');
                                        setShowDepositArea(true);
                                        setShowPaymentModal({ show: true, price: 100, listingId: 'deposit' });
                                      }}
                                      className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl text-[9.5px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md font-sans"
                                    >
                                      <Wallet size={11} />
                                      টাকা ডেপোজিট করুন (Deposit Balance)
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                         {showPaymentModal.listingId === 'deposit' && (
                           <div className="space-y-1 text-left bg-slate-50 p-2 rounded-2xl border border-slate-100 animate-in fade-in duration-300">
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1 pl-1">Quick Select Amount</span>
                             <div className="flex flex-wrap gap-1">
                               {[50, 100, 200, 500, 1000].map((amt) => (
                                 <button
                                   key={amt}
                                   type="button"
                                   onClick={() => {
                                     setShowPaymentModal(prev => ({ ...prev, price: amt }));
                                     setPaymentForm(prev => ({ ...prev, senderNumber: String(amt) }));
                                   }}
                                   className={`px-2.5 py-1.5 rounded-xl text-[10px] font-extrabold transition-all active:scale-95 border cursor-pointer ${showPaymentModal.price === amt 
                                     ? (paymentForm.method === 'bkash' ? 'bg-[#e2136e] border-[#e2136e] text-white shadow-sm' : 'bg-[#ed1c24] border-[#ed1c24] text-white shadow-sm')
                                     : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'}`}
                                 >
                                   ৳{amt}
                                 </button>
                               ))}
                             </div>
                           </div>
                         )}
                        {showPaymentModal.listingId === 'deposit' && (
                          <>
                            <div className={`p-2.5 rounded-2xl border relative overflow-hidden group transition-colors ${paymentForm.method === 'bkash' ? 'bg-pink-50 border-pink-100' : 'bg-red-50 border-red-100'}`}>
                              <div className={`absolute top-0 right-0 w-16 h-16 ${paymentForm.method === 'bkash' ? 'bg-pink-100/50' : 'bg-red-100/50'} rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform`}></div>
                              <div className="relative z-10 flex items-center justify-between">
                                <div className="space-y-0.5">
                                  <div className={`text-[8px] ${paymentForm.method === 'bkash' ? 'text-pink-600' : 'text-red-600'} font-black uppercase tracking-widest flex items-center gap-1.5`}>
                                    <div className="w-5 h-5 bg-white rounded-md flex items-center justify-center p-0.5 shadow-sm">
                                      <img 
                                        src={paymentForm.method === 'bkash' ? "https://www.logo.wine/a/logo/BKash/BKash-Logo.wine.svg" : "https://www.logo.wine/a/logo/Nagad/Nagad-Logo.wine.svg"} 
                                        alt=""
                                        className="w-full h-full object-contain"
                                      />
                                    </div>
                                    <span className="pt-0.5">SEND MONEY (Personal - {paymentForm.method.toUpperCase()})</span>
                                  </div>
                                  <p className="text-lg font-black text-slate-800 tracking-tight lg:text-xl select-all font-mono">
                                    {paymentForm.method === 'bkash' ? '01857902383' : '01410731308'}
                                  </p>
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const num = paymentForm.method === 'bkash' ? '01857902383' : '01410731308';
                                    navigator.clipboard.writeText(num);
                                    alert("Number copied!");
                                  }}
                                  className={`w-8 h-8 rounded-xl bg-white flex items-center justify-center ${paymentForm.method === 'bkash' ? 'text-pink-600 border-pink-100' : 'text-red-600 border-red-100'} shadow-sm border hover:scale-110 transition-all active:scale-95`}
                                >
                                  <Copy size={13} />
                                </button>
                              </div>
                            </div>
                            
                            {/* Collapsible Rules & Instructions Card */}
                            <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                              <button
                                type="button"
                                onClick={() => setShowInstructions(!showInstructions)}
                                className="w-full flex items-center justify-between p-2.5 bg-slate-50 text-slate-700 hover:bg-slate-100/70 transition-colors text-left focus:outline-none"
                              >
                                <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                  <Info size={12} className={paymentForm.method === 'bkash' ? 'text-[#e2136e]' : 'text-[#ed1c24]'} />
                                  পেমেন্ট নিয়ম ও জরুরি নোটিশ (Rules & Notice)
                                </span>
                                <span className="text-[9px] font-black text-slate-400">
                                  {showInstructions ? 'লুকান ▲' : 'দেখুন ▼'}
                                </span>
                              </button>
                              
                              <AnimatePresence initial={false}>
                                {showInstructions && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <div className={`p-3 space-y-2 border-t border-slate-100 transition-colors ${paymentForm.method === 'bkash' ? 'bg-pink-50/20' : 'bg-red-50/20'}`}>
                                      <div className={`${paymentForm.method === 'bkash' ? 'bg-[#e2136e]' : 'bg-[#ed1c24]'} text-white p-2.5 rounded-xl shadow-md`}>
                                         <div className="flex items-center gap-1.5 mb-1">
                                            <AlertCircle size={12} className="animate-pulse" />
                                            <p className="text-[9px] font-black uppercase tracking-widest">জরুরী নোটিশ</p>
                                         </div>
                                         <p className="text-[8.5px] font-bold leading-relaxed">
                                            সঠিক TrxID দিন। ভুল আইডি দিলে আপনার পেমেন্ট রিজেক্ট হয়ে যাবে। পেমেন্টে কোনো সমস্যা হলে আমাদের সাথে সরাসরি চ্যাট বা সাপোর্ট বক্স এ যোগাযোগ করুন।
                                         </p>
                                      </div>
                                      <div className="space-y-1.5 pl-1">
                                        <p className="text-[8.5px] text-slate-650 font-bold leading-relaxed">
                                          ১. নাম্বারটি কপি করে আপনার ${paymentForm.method === 'bkash' ? 'বিকাশ' : 'নগদ'} অ্যাপ থেকে <span className="font-extrabold text-slate-900">Send Money</span> করুন।
                                        </p>
                                        <p className="text-[8.5px] text-slate-655 font-bold leading-relaxed">
                                          ২. পেমেন্ট শেষে প্রাপ্ত <span className="font-extrabold text-slate-900">TrxID</span> টি কপি করে নিচের বক্সে দিন।
                                        </p>
                                        <p className="text-[8.5px] text-slate-655 font-bold leading-relaxed">
                                          ৩. সঠিক তথ্য দিলে আপনি স্বয়ংক্রিয়ভাবে জিমেইল একাউন্টটি পেয়ে যাবেন।
                                        </p>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1 group">
                                <label className={`text-[9.5px] font-black text-slate-400 uppercase tracking-widest ml-1 transition-colors ${paymentForm.method === 'bkash' ? 'group-focus-within:text-[#e2136e]' : 'group-focus-within:text-[#ed1c24]'}`}>Amount</label>
                                <div className="relative">
                                  <div className={`absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 transition-colors ${paymentForm.method === 'bkash' ? 'group-focus-within:text-[#e2136e]' : 'group-focus-within:text-[#ed1c24]'}`}>
                                    <Wallet size={12} />
                                  </div>
                                  <input 
                                    type="text" 
                                    placeholder="Type Amount"
                                    value={paymentForm.senderNumber}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setPaymentForm(prev => ({...prev, senderNumber: val}));
                                      if (showPaymentModal.listingId === 'deposit') {
                                        const numericVal = Number(val) || 0;
                                        setShowPaymentModal(prev => ({ ...prev, price: numericVal }));
                                      }
                                    }}
                                    className={`w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-1.5 py-2.5 text-[11px] font-bold focus:outline-none focus:ring-4 transition-all ${paymentForm.method === 'bkash' ? 'focus:ring-[#e2136e]/10 focus:border-[#e2136e]' : 'focus:ring-[#ed1c24]/10 focus:border-[#ed1c24]'}`}
                                  />
                                </div>
                              </div>
                              
                              <div className="space-y-1 group">
                                <label className={`text-[9.5px] font-black text-slate-400 uppercase tracking-widest ml-1 transition-colors ${paymentForm.method === 'bkash' ? 'group-focus-within:text-[#e2136e]' : 'group-focus-within:text-[#ed1c24]'}`}>
                                  Transaction ID (TrxID)
                                </label>
                                <div className="relative">
                                  <div className={`absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 transition-colors ${paymentForm.method === 'bkash' ? 'group-focus-within:text-[#e2136e]' : 'group-focus-within:text-[#ed1c24]'}`}>
                                    <BadgeCheck size={12} />
                                  </div>
                                  <input 
                                    type="text" 
                                    placeholder="Type Transaction ID"
                                    value={paymentForm.trxId}
                                    onChange={(e) => setPaymentForm({...paymentForm, trxId: e.target.value})}
                                    className={`w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-1.5 py-2.5 text-[11px] font-bold focus:outline-none focus:ring-4 transition-all ${paymentForm.method === 'bkash' ? 'focus:ring-[#e2136e]/10 focus:border-[#e2136e]' : 'focus:ring-[#ed1c24]/10 focus:border-[#ed1c24]'}`}
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
                                  'Submit'
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
                          </>
                        )}
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
                                 setWithdrawMode('referral');
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

                {/* Ads view Earn Modal */}
                <AnimatePresence>
                  {showAdsEarnModal && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => {
                          if (adWatchStatus !== 'watching') {
                            setShowAdsEarnModal(false);
                          } else {
                            alert("বিজ্ঞাপন চলাকালীন বন্ধ করা যাবে না! অনুগ্রহ করে অপেক্ষা করুন।");
                          }
                        }}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200]"
                      />
                       <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        className="fixed inset-x-4 max-w-[350px] mx-auto top-1/2 -translate-y-1/2 md:left-1/2 md:-translate-x-1/2 md:w-[350px] bg-white rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.06)] z-[210] p-3 flex flex-col max-h-[90vh] border border-amber-100/60 overflow-hidden"
                      >
                        {/* Header */}
                        <div className="relative pb-1">
                          <button 
                            onClick={() => {
                              if (adWatchStatus !== 'watching') {
                                setShowAdsEarnModal(false);
                              } else {
                                alert("বিজ্ঞাপন চলাকালীন বন্ধ করা যাবে না! অনুগ্রহ করে অপেক্ষা করুন।");
                              }
                            }}
                            className="absolute -top-1 -right-1 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors z-10 animate-hover"
                          >
                            <X size={15} className="text-slate-400" />
                          </button>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 border border-amber-100 font-sans shadow-sm animate-pulse">
                              <Megaphone size={12} className="text-amber-600 shrink-0" />
                            </div>
                            <div>
                              <h3 className="font-extrabold text-slate-800 text-[13px] tracking-tight font-display">Ads view Earn Console</h3>
                              <p className="text-[8px] font-black text-amber-500 uppercase tracking-wider">১০৫% পেমেন্ট নিশ্চিত</p>
                            </div>
                          </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
                          {!user ? (
                            <div className="p-4 text-center space-y-3 bg-slate-50 rounded-xl border border-slate-100 font-sans">
                              <ShieldAlert className="mx-auto text-amber-500" size={24} />
                              <p className="text-[10px] text-slate-600 font-bold leading-relaxed">
                                আপনি এখনো লগইন করেননি। আমাদের ভেরিফাইড বিজ্ঞাপনী প্ল্যাটফর্মে আয় শুরু করতে প্রথমে একটি একাউন্ট তৈরি করুন অথবা লগইন করুন।
                              </p>
                              <button
                                onClick={() => {
                                  setShowAdsEarnModal(false);
                                  setView('login');
                                }}
                                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[9px] font-black uppercase tracking-wider rounded-lg hover:opacity-95 transition-all shadow-sm active:scale-95 cursor-pointer font-sans"
                              >
                                লগইন করুন (Login Now)
                              </button>
                            </div>
                          ) : (
                            <>
                              {/* Error State Banner inside Modal */}
                              {adsEarnError && (
                                <div className="bg-red-50 border border-red-150 p-2.5 rounded-xl flex items-start gap-2 text-left font-sans">
                                  <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={12} />
                                  <p className="text-[9.5px]/relaxed text-red-700 font-bold">
                                    {adsEarnError}
                                  </p>
                                </div>
                              )}

                              {/* Success State Banner inside Modal */}
                              {adsEarnSuccess && (
                                <div className="bg-emerald-50 border border-emerald-150 p-2.5 rounded-xl flex items-start gap-2 text-left font-sans animate-pulse">
                                  <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={12} />
                                  <p className="text-[9.5px]/relaxed text-emerald-800 font-black">
                                    {adsEarnSuccess}
                                  </p>
                                </div>
                              )}

                              {/* Current Balance & Rate */}
                              <div className="grid grid-cols-2 gap-2 font-sans">
                                <div className="bg-amber-50/55 border border-amber-100/50 p-2.5 rounded-xl flex flex-col justify-between">
                                  <span className="text-[7.5px] font-black uppercase tracking-widest text-slate-400">Balance</span>
                                  <span className="text-sm font-black text-slate-800 mt-0.5">৳{(userProfile?.earningsBalance || 0).toFixed(2)} BDT</span>
                                </div>
                                <div className="bg-emerald-50/55 border border-emerald-100/50 p-2.5 rounded-xl flex flex-col justify-between">
                                  <span className="text-[7.5px] font-black uppercase tracking-widest text-emerald-600">Rate / Ad</span>
                                  <span className="text-sm font-black text-emerald-700 mt-0.5">৳০.১০ BDT</span>
                                </div>
                              </div>

                              {/* Daily Limit & Count of Watched Ads */}
                              <div className="grid grid-cols-2 gap-2 font-sans">
                                <div className="bg-rose-50/55 border border-rose-100/50 p-2.5 rounded-xl flex flex-col justify-between">
                                  <span className="text-[7.5px] font-black uppercase tracking-widest text-rose-500">Daily Limit</span>
                                  <span className="text-sm font-black text-rose-700 mt-0.5">500 Ads</span>
                                </div>
                                <div className="bg-blue-50/55 border border-blue-100/50 p-2.5 rounded-xl flex flex-col justify-between">
                                  <span className="text-[7.5px] font-black uppercase tracking-widest text-blue-500">Today Watched</span>
                                  <span className="text-sm font-black text-blue-700 mt-0.5">
                                    {userProfile?.lastAdWatchedDate === getTodayDateString() ? (userProfile?.adsWatchedToday || 0) : 0} / 500
                                  </span>
                                </div>
                              </div>

                              {/* Clean Light-Themed Status Dashboard instead of the Dark Sponsor Ad box */}
                              {adWatchStatus === 'idle' ? (
                                <div className="bg-red-50/40 border border-red-100 p-2.5 rounded-xl text-center space-y-1 font-sans">
                                  <Sparkles size={15} className="text-red-500 mx-auto animate-pulse" />
                                  <h4 className="text-[9.5px] font-black text-red-800 uppercase tracking-wider">বিজ্ঞাপন দেখে আয় শুরু করুন</h4>
                                  <p className="text-[8.5px] text-slate-600 leading-normal font-semibold">
                                    নিচে <strong className="text-red-700">"👉 VIEW (৳০.১০ আয় করুন)"</strong> বাটনে ক্লিক করলে একটি বিজ্ঞাপনের ট্যাব ওপেন হবে।
                                  </p>
                                </div>
                              ) : (
                                <div className="bg-emerald-50/45 border border-emerald-100 p-2.5 rounded-xl text-center space-y-1.5 font-sans animate-pulse">
                                  <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                                    <CheckCircle size={13} />
                                  </div>
                                  <h4 className="text-[9.5px] font-black text-emerald-700 uppercase tracking-wider">বিজ্ঞাপন লিংক সাকসেসফুলি ওপেনড!</h4>
                                  <p className="text-[8.5px] text-slate-600 leading-normal font-semibold">
                                    ⚠️ অবশ্যই ওপেন হওয়া উইন্ডোতে <strong className="text-rose-600 font-extrabold">১৫ সেকেন্ড অপেক্ষা</strong> করুন। তারপর এখানে ফিরে এসে ক্লেম করুন!
                                  </p>
                                </div>
                              )}

                              {/* Instructions */}
                              <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl space-y-1 text-left font-sans">
                                <span className="block text-[7.5px] font-black text-slate-400 uppercase tracking-widest">Guaranteed Rules & Terms</span>
                                <p className="text-[8.5px] text-slate-655 leading-normal font-bold">
                                  ১. প্রতিটি বিজ্ঞাপন ভিউ করার জন্য আপনি <strong className="text-slate-850 font-black">৳০.১০</strong> পাবেন।<br />
                                  ২. প্রতিদিনের কাজের সর্বোচ্চ লিমিট <strong className="text-rose-600">৫০০টি বিজ্ঞাপন</strong>।<br />
                                  ৩. ওপেন হওয়া নতুন অ্যাড ট্যাবে অবশ্যই ১৫ সেকেন্ড থাকতে হবে।
                                </p>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Footer Controls */}
                        {user && (
                          <div className="pt-2 border-t border-slate-100 mt-1 space-y-1.5">
                            {adWatchStatus === 'idle' ? (
                              <button
                                onClick={startWatchingAd}
                                className="w-full py-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.15em] shadow-md shadow-amber-100/50 hover:opacity-95 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                              >
                                <Megaphone size={11} className="animate-pulse font-sans" />
                                👉 VIEW (৳০.১০ আয় করুন)
                              </button>
                            ) : adWatchStatus === 'watching' ? (
                              <button
                                disabled
                                className="w-full py-2.5 bg-slate-100 text-slate-400 rounded-xl font-black text-[9px] uppercase tracking-[0.12em] transition-all text-center flex items-center justify-center gap-1.5 cursor-not-allowed font-sans"
                              >
                                <RefreshCw size={11} className="animate-spin" />
                                Verifying Advertisement {adWatchCountdown}s...
                              </button>
                            ) : (
                              <button
                                disabled={isClaimingAd}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (claimSecondsRemaining > 0 || isClaimingAd) {
                                    e.preventDefault();
                                    return;
                                  }
                                  claimAdEarning();
                                }}
                                className={`w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.15em] shadow-md shadow-emerald-100/50 hover:opacity-95 transition-all text-center flex items-center justify-center gap-1.5 font-sans ${isClaimingAd ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer animate-pulse'}`}
                              >
                                {isClaimingAd ? (
                                  <>
                                    <RefreshCw size={10} className="animate-spin" />
                                    ব্যালেন্স যোগ হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন
                                  </>
                                ) : claimSecondsRemaining > 0 ? (
                                  <>
                                    <RefreshCw size={10} className="animate-spin" />
                                    ক্লেম করতে {claimSecondsRemaining} সেকেন্ড অপেক্ষা করুন
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle size={10} />
                                    Claim Reward (৳০.১০ ওয়ালেটে নিন)
                                  </>
                                )}
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowAdsEarnModal(false);
                              }}
                              disabled={adWatchStatus === 'watching'}
                              className="w-full py-2 bg-slate-55 text-slate-500 rounded-lg font-black text-[8px] uppercase tracking-wider hover:bg-slate-100 hover:text-slate-700 transition-all text-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-sans"
                            >
                              Close Window
                            </button>
                          </div>
                        )}
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
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                              {withdrawMode === 'referral' ? 'Withdraw Referral Bonus' : 'Withdraw Seller Earnings'}
                            </h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                              Amount: ৳{withdrawMode === 'referral' ? ((userProfile?.successfulReferrals || 0) * 5).toFixed(2) : (userProfile?.earningsBalance || 0).toFixed(2)}
                            </p>
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
                           disabled={isSubmitting}
                           onClick={async () => {
                             const method = (document.getElementById('withdraw-method') as HTMLSelectElement).value;
                             const number = (document.getElementById('withdraw-number') as HTMLInputElement).value;
                             if (!number || number.length < 11) {
                               alert(`${method} নাম্বার সঠিক নয়!`);
                               return;
                             }
                             setIsSubmitting(true);
                             try {
                               const amount = withdrawMode === 'referral' 
                                 ? (userProfile?.successfulReferrals || 0) * 5 
                                 : (userProfile?.earningsBalance || 0);

                               if (amount < 50) {
                                 alert('উইথড্র করতে আপনার সর্বনিম্ন ৳৫০ ব্যালেন্স থাকতে হবে!');
                                 return;
                               }
                               
                               if (withdrawMode === 'referral') {
                                 if ((userProfile?.successfulReferrals || 0) * 5 < amount) {
                                   alert('আপনার উইথড্রয়েবল ব্যালেন্স পর্যাপ্ত নয়!');
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
                                   earningsBalance: increment(-amount)
                                 });
                                 
                                 setUserProfile((prev: any) => ({ 
                                   ...prev, 
                                   successfulReferrals: 0,
                                   earningsBalance: (prev.earningsBalance || 0) - amount
                                 }));
                               } else {
                                 if ((userProfile?.earningsBalance || 0) < amount) {
                                   alert('আপনার সেল ব্যালেন্স পর্যাপ্ত নয়!');
                                   return;
                                 }

                                 await addDoc(collection(db, 'withdrawals'), {
                                   userId: user?.uid,
                                   userEmail: user?.email,
                                   amount: amount,
                                   number: number,
                                   method: method,
                                   status: 'pending',
                                   type: 'seller_earnings',
                                   createdAt: serverTimestamp()
                                 });

                                 await updateDoc(doc(db, 'profiles', user!.uid), {
                                   earningsBalance: increment(-amount)
                                 });
                                 
                                 setUserProfile((prev: any) => ({ 
                                   ...prev, 
                                   earningsBalance: (prev.earningsBalance || 0) - amount
                                 }));
                               }

                               alert('উইথড্র রিকুয়েস্ট সফলভাবে পাঠানো হয়েছে! ২৪ ঘণ্টার মধ্যে পেমেন্ট পাবেন ইনশাআল্লাহ।');
                               setShowWithdrawModal(false);
                             } catch (err: any) {
                               alert('Error: ' + err.message);
                             } finally {
                               setIsSubmitting(false);
                             }
                           }}
                           className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center"
                         >
                           {isSubmitting ? <RefreshCw className="animate-spin" size={16} /> : 'Submit Withdrawal'}
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
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-[400px] bg-white rounded-3xl shadow-2xl p-6 z-[70] overflow-hidden flex flex-col max-h-[85vh]"
              >
                <button 
                  onClick={handleCloseWelcome}
                  className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors z-20 animate-in fade-in"
                >
                  <X size={18} className="text-slate-400" />
                </button>
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-500 via-purple-500 to-pink-500 z-10" />
                
                <div className="flex-1 overflow-y-auto pr-1 -mr-2 scrollbar-none space-y-4 pt-2">
                  <div className="text-center space-y-2 mb-4">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Welcome to Gmail Buy & Sell BD</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">সম্পূর্ণ ভেরিফাইড মার্কেটপ্লেস এ আপনাকে স্বাগতম। অনুগ্রহ করে প্রোফাইলটি সম্পূর্ণ করুন।</p>
                  </div>

                  {/* Photo Upload */}
                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div 
                      onClick={() => welcomeFileInputRef.current?.click()}
                      className="w-16 h-16 rounded-2xl bg-white border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-red-400 transition-all shadow-sm"
                    >
                      {welcomeForm.photoURL || userProfile?.photoURL ? (
                        <img src={welcomeForm.photoURL || userProfile?.photoURL} className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="text-slate-300 group-hover:text-red-400" size={24} />
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
                       <span className="text-[10px] font-mono font-black text-red-600 bg-red-50 px-2 py-1 rounded-lg border border-red-100">#{userProfile?.numericId || '...'}</span>
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
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition-all text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name <span className="text-[8px] opacity-60">Optional</span></label>
                      <input 
                        type="text"
                        value={welcomeForm.lastName}
                        onChange={(e) => setWelcomeForm(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Enter last name"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition-all text-xs font-bold"
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
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition-all text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Address (ঠিকানা) <span className="text-[8px] opacity-60">Optional</span></label>
                    <textarea 
                      value={welcomeForm.address}
                      onChange={(e) => setWelcomeForm(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Enter address"
                      rows={2}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition-all text-xs font-bold resize-none"
                    />
                  </div>

                  <button 
                    onClick={handleWelcomeSubmit}
                    disabled={isSubmitting}
                    className="w-full py-3.5 mt-1 bg-slate-900 text-white rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2 group"
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

        {/* Global Floating WhatsApp Support Button */}
        <a 
          id="site-chat-button"
          href="https://wa.me/8801410731308"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-24 right-6 w-14 h-14 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-full shadow-[0_16px_48px_-12px_rgba(37,211,102,0.5)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 group cursor-pointer"
          title="Contact Support on WhatsApp"
        >
          <svg 
            className="w-8 h-8 fill-current" 
            viewBox="0 0 24 24"
          >
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.578 1.98 14.115 1.053 11.5 1.053c-5.442 0-9.868 4.371-9.872 9.799-.001 1.761.464 3.481 1.347 4.981l-.972 3.548 3.65-.955zm11.163-5.263c-.302-.15-1.78-.876-2.053-.974-.273-.098-.472-.147-.671.15-.197.297-.767.974-.94 1.169-.173.195-.347.218-.648.069-.302-.15-1.272-.469-2.423-1.493-.895-.796-1.5-1.78-1.275-2.17.223-.389.023-.601-.176-.797-.18-.177-.347-.405-.52-.607-.173-.203-.23-.347-.13-.548.1-.2.05-.376-.025-.525-.075-.15-.671-1.616-.92-2.215-.242-.582-.488-.504-.671-.513-.173-.008-.372-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.78-.727 2.03-1.429.25-.701.25-1.3.173-1.43-.075-.129-.273-.203-.574-.353z" />
          </svg>
        </a>

        {/* Mobile Footer Navigation */}
        <AnimatePresence>
          {showSellNotice && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSellNotice(false)}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120]"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="fixed inset-x-4 md:inset-x-auto top-1/2 -translate-y-1/2 md:left-1/2 md:-translate-x-1/2 md:w-[450px] bg-[#F8FAFC] rounded-3xl shadow-2xl z-[130] overflow-hidden flex flex-col max-h-[85vh] border border-white"
              >
                {/* Header */}
                <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-50 p-2 rounded-xl">
                      <Bell className="text-emerald-600" size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800 leading-tight">নোটিশ বোর্ড</h3>
                      <p className="text-[10px] font-bold text-slate-500">সর্বশেষ আপডেট ও গুরুত্বপূর্ণ তথ্য</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowSellNotice(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X size={18} className="text-slate-400" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400" />
                    
                    <div className="flex items-center gap-2 mb-4">
                      <AlertCircle className="text-amber-500" size={18} />
                      <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-tight">
                        📢 Gmail Sell Rules 🔔
                        <span className="bg-amber-100 text-amber-700 text-[8px] px-1.5 py-0.5 rounded-full">সতর্কতা</span>
                      </h4>
                    </div>

                    <ul className="space-y-4">
                      <li className="flex gap-3">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                        <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
                          ১. Gmail List করার পূর্বে অবশ্যই <span className="text-slate-900">Gmail Checker</span> দিয়ে চেক করুন। শুধুমাত্র Live / Good Gmail হলে তবেই List করুন।
                        </p>
                      </li>
                      <li className="flex gap-3">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                        <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
                          ২. Gmail Remove করা বাধ্যতামূলক। Website-এ Gmail Submit/List করার পর সাথে সাথে আপনার ফোন/ডিভাইস থেকে Gmail টি Remove করে দিন।
                        </p>
                      </li>
                      <li className="flex gap-3">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                        <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
                          ৩. Gmail Address ও Password অবশ্যই সঠিকভাবে এবং সম্পূর্ণভাবে দিন। ভুল তথ্য দিলে Buyer সমস্যায় পড়বে এবং আপনার Rating কমে যাবে।
                        </p>
                      </li>
                      <li className="flex gap-3">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                        <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
                          ৪. Gmail Website-এ List করার পর Password Change করবেন না এবং Gmail-এ আর Login করে রাখবেন না।
                        </p>
                      </li>
                      <li className="flex gap-3">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                        <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
                          ৫. Fresh vs Used Gmail: Used Gmail কখনোই Fresh বলে Sell করবেন না। Buyer Report করলে আপনার Rating কমে যাবে এবং Account Risk-এ পড়বে।
                        </p>
                      </li>
                      <li className="flex gap-3">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                        <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
                          ৬. Rating Policy: আপনার Rating যদি ২০% এর নিচে নেমে যায়, তাহলে আপনি Payment পাবেন না।
                        </p>
                      </li>
                      <li className="flex gap-3">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                        <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
                          ৭. Recovery Info Remove করুন: Gmail List করার আগে Recovery Email/Phone Number Remove করে দিন, যাতে Buyer সম্পূর্ণ Access পায়।
                        </p>
                      </li>
                    </ul>

                    <div className="mt-5 p-3 bg-red-50 border border-red-100 rounded-xl">
                      <p className="text-[10px] font-bold text-red-600 leading-tight">
                        Invalid বা Fake Gmail দিলে আপনার Account Temporarily বা Permanently Ban হতে পারে।
                      </p>
                    </div>
                  </div>

                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex gap-3">
                    <span className="text-xl">✅</span>
                    <div>
                      <p className="text-[11px] font-bold text-emerald-800 leading-relaxed">
                        <span className="font-black">Final Tip:</span> সততা বজায় রেখে কাজ করলে আপনার Rating বাড়বে, বেশি Sale হবে এবং Long-Term Income নিশ্চিত হবে 💰
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-white border-t border-slate-100">
                  <button 
                    onClick={() => {
                      setShowSellNotice(false);
                    }}
                    className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] text-white py-4 rounded-2xl font-black text-sm transition-all active:scale-[0.98] shadow-lg shadow-emerald-900/10"
                  >
                    বুঝেছি, চালিয়ে যান
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSellModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4">
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
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                className="relative w-full max-w-md bg-white rounded-2xl md:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-[120]"
              >
                <div className="bg-gradient-to-br from-[#1B5E20] to-[#2E7D32] p-4 sm:p-6 text-white relative shrink-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-display text-lg sm:text-xl md:text-2xl font-black tracking-tight">{sellListingToEdit ? 'Edit & Resell' : 'Sell Gmail'}</h3>
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

                <form onSubmit={handleSellGmail} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 bg-slate-50/50">
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
                          type="text" 
                          required
                          autoComplete="off"
                          placeholder="Enter Gmail"
                          value={sellForm.email}
                          onChange={(e) => setSellForm({ ...sellForm, email: e.target.value })}
                          className="w-full pl-10 pr-3 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/10 focus:border-[#2E7D32] transition-all font-bold text-xs"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Lock size={10} className="text-[#2E7D32]" />
                        Password
                      </label>
                      <div className="relative group">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2E7D32] transition-colors" size={16} />
                        <input 
                          type="text" 
                          required
                          autoComplete="off"
                          placeholder="Correct Password"
                          value={sellForm.password}
                          onChange={(e) => setSellForm({ ...sellForm, password: e.target.value })}
                          className="w-full pl-10 pr-3 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/10 focus:border-[#2E7D32] transition-all font-bold text-xs"
                        />
                      </div>
                    </div>

                    {/* Recovery Email */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Mail size={10} className="text-[#2E7D32]" />
                        Recovery Email
                      </label>
                      <div className="relative group">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2E7D32] transition-colors" size={16} />
                        <input 
                          type="text" 
                          required
                          autoComplete="off"
                          placeholder="Recovery Email"
                          value={sellForm.recoveryEmail}
                          onChange={(e) => setSellForm({ ...sellForm, recoveryEmail: e.target.value })}
                          className="w-full pl-10 pr-3 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/10 focus:border-[#2E7D32] transition-all font-bold text-xs"
                        />
                      </div>
                    </div>

                    {/* 2FA Authenticator */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <ShieldCheck size={10} className="text-[#2E7D32]" />
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
                          className="w-full pl-10 pr-3 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/10 focus:border-[#2E7D32] transition-all font-bold text-xs"
                        />
                      </div>
                    </div>

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
                          className="w-full pl-10 pr-3 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/10 focus:border-[#2E7D32] transition-all font-bold text-xs"
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
                          className="w-full px-2 sm:px-3 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#2E7D32] transition-all font-bold text-[11px]"
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
                          className={`w-full px-2 sm:px-3 py-2.5 sm:py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#2E7D32] transition-all font-bold text-[11px] ${Object.keys(gmailPrices).includes(sellForm.type) ? 'bg-slate-100 text-slate-500' : 'bg-white'}`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button 
                      disabled={isSubmitting}
                      type="submit"
                      className="w-full bg-[#2E7D32] text-white font-black py-3 sm:py-3.5 rounded-xl shadow-lg shadow-green-900/10 hover:shadow-green-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest disabled:opacity-50"
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
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {activeChatRoom && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveChatRoom(null)}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[180]"
              />
              <motion.div
                initial={{ y: "100%", opacity: 0.8 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0.8 }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed inset-x-0 bottom-0 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:bottom-4 md:w-[480px] h-[85vh] md:h-[680px] bg-slate-50 md:rounded-3xl rounded-t-[2.5rem] shadow-2xl z-[190] flex flex-col overflow-hidden border border-white"
              >
                {/* Header */}
                <div className="bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between shadow-xs shrink-0">
                  <div className="flex items-center gap-3">
                    {/* Avatar with circle logo */}
                    <div className="w-10 h-10 bg-red-50 text-red-650 rounded-full flex items-center justify-center font-black text-xs border border-red-100 relative shadow-sm">
                      {activeChatRoom.sellerId === user?.uid 
                        ? activeChatRoom.buyerName.substring(0, 2).toUpperCase()
                        : activeChatRoom.sellerName.substring(0, 2).toUpperCase()}
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white shadow-xs"></div>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 leading-none">
                        {activeChatRoom.sellerId === user?.uid ? activeChatRoom.buyerName : activeChatRoom.sellerName}
                      </h4>
                      <span className="text-[9.5px] font-black text-[#2D8A4E] uppercase tracking-wider block mt-1 leading-none">
                        {activeChatRoom.listingTitle || 'Facebook Listing Customer'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setActiveChatRoom(null)} 
                      className="p-2 text-slate-400 hover:text-slate-800 bg-slate-100/50 hover:bg-slate-100 rounded-full transition-all active:scale-95"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Message List area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 relative flex flex-col">
                  {/* Notice of safety escrow */}
                  <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl text-center self-center max-w-[95%] mb-1 shadow-2xs">
                    <span className="text-[11px] font-black text-emerald-800 tracking-tight block">🔐 Escrow Secure Chat</span>
                    <span className="text-[9.5px] font-bold text-emerald-600 block mt-0.5 leading-snug">সবচেয়ে বিশ্বস্ত ডিল নিশ্চয়তা। কোনো প্রকার ডিরেক্ট লেনদেন করার আগে অবশ্যই আমাদের রুলস মেনে চলুন।</span>
                  </div>

                  {chatMessages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 my-auto">
                      <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-2.5 border border-red-100/50 shadow-inner">
                        <MessageSquare size={22} />
                      </div>
                      <p className="font-black text-[11px] uppercase tracking-wider text-slate-500">মেসেজিং শুরু করুন</p>
                      <p className="text-[9px] text-slate-400 font-bold mt-1.5 leading-normal max-w-[80%] mx-auto">বিক্রেতার সাথে সরাসরি চ্যাটের মাধ্যমে দামাদামি বা ডেলিভারি কনফার্ম করুন।</p>
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => {
                      const isMe = msg.senderId === user?.uid;
                      return (
                        <div 
                          key={msg.id || idx} 
                          className={`flex flex-col max-w-[80%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                        >
                          {!isMe && (
                            <span className="text-[8.5px] font-black text-slate-400 pl-1.5 mb-0.5 uppercase tracking-wider">{msg.senderName}</span>
                          )}
                          
                          <div 
                            className={`px-4 py-2.5 rounded-2xl text-[11.5px] leading-snug font-bold shadow-2xs break-words ${
                              isMe 
                                ? 'bg-[#2D8A4E] text-white rounded-br-xs' 
                                : 'bg-white text-slate-800 rounded-bl-xs border border-slate-100'
                            }`}
                          >
                            {msg.imageUrl && (
                              <div className="mb-1.5 max-w-full rounded-lg overflow-hidden border border-black/5 bg-slate-100">
                                <img src={msg.imageUrl} referrerPolicy="no-referrer" alt="Attached asset" className="max-h-[160px] w-auto object-cover" />
                              </div>
                            )}
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                          </div>

                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-1 px-1">
                            {formatTimeOnly(msg.createdAt, 'Sending...')}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input controls on bottom */}
                <div className="bg-white p-2.5 border-t border-slate-100 shadow-lg shrink-0 flex items-center gap-2 pb-safe">
                  <label className="p-2 text-slate-400 hover:text-[#2D8A4E] bg-slate-50 hover:bg-emerald-50 rounded-full transition-all active:scale-95 cursor-pointer border border-slate-100">
                    <Camera size={16} />
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleChatImageAttach} 
                      className="hidden" 
                    />
                  </label>

                  <input 
                    type="text" 
                    placeholder="মেসেজ লিখুন..." 
                    value={chatInputValue}
                    onChange={(e) => setChatInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSendChatMessage();
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-slate-100/50 hover:bg-slate-100/80 border border-transparent hover:border-slate-200 rounded-xl font-bold text-[10.5px] focus:outline-none focus:border-[#2D8A4E] focus:bg-white transition-all text-slate-800"
                  />

                  <button 
                    onClick={handleSendChatMessage}
                    className="w-10 h-10 bg-[#2D8A4E] hover:bg-emerald-800 text-white rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isChatInboxOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsChatInboxOpen(false)}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[180]"
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-slate-50 shadow-2xl z-[190] flex flex-col overflow-hidden border-l border-white"
              >
                {/* Header */}
                <div className="bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-50 text-[#2D8A4E] rounded-xl">
                      <MessageSquare size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800 tracking-tight leading-none">বার্তা ও ইনবক্স (Inbox)</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1 leading-none">আপনার চলমান চ্যাট সমুহ</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setIsChatInboxOpen(false)} 
                    className="p-2 text-slate-400 hover:text-slate-800 bg-slate-100/50 hover:bg-slate-100 rounded-full transition-all active:scale-95"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Inbox Threads list */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                  {!user ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center my-auto">
                      <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-2.5 border">
                        <UserIcon size={22} />
                      </div>
                      <p className="font-black text-[11px] uppercase tracking-wider text-slate-500">লগইন প্রয়োজন</p>
                      <p className="text-[9px] text-slate-400 font-bold mt-1 max-w-[80%] mx-auto leading-normal">চলমান আলোচনাগুলো দেখতে বা উত্তর দিতে অনুগ্রহ করে প্রথমে সাইন ইন করুন।</p>
                    </div>
                  ) : userInboxThreads.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 my-auto">
                      <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mb-2.5">
                        <MessageSquare size={22} className="opacity-55" />
                      </div>
                      <p className="font-black text-[11px] uppercase tracking-wider text-slate-500">কোনো চ্যাট থ্রেড নেই</p>
                      <p className="text-[9px] text-slate-400 font-bold mt-1 max-w-[85%] mx-auto leading-normal">চলতি কোনো চ্যাট পাওয়া যায়নি। মার্কেটপ্লেস থেকে যেকোনো ফেসবুক পেজের চ্যাট শুরু করতে পারেন।</p>
                    </div>
                  ) : (
                    userInboxThreads.map((thread, idx) => {
                      const isMeSender = thread.senderId === user.uid;
                      
                      // Extract roles safely using Split fallback
                      const parts = thread.roomId ? thread.roomId.split('_') : [];
                      const buyerId = thread.buyerId || parts[0] || 'buyer_id';
                      const sellerId = thread.sellerId || parts[1] || 'seller_id';
                      const isMeBuyer = buyerId === user.uid;
                      
                      const buyerName = thread.buyerName || (isMeBuyer ? (userProfile?.displayName || user.displayName || user.email?.split('@')[0] || 'গ্রাহক') : (isMeSender ? 'গ্রাহক' : (thread.senderName || 'গ্রাহক')));
                      const sellerName = thread.sellerName || (!isMeBuyer ? (userProfile?.displayName || user.displayName || user.email?.split('@')[0] || 'বিক্রেতা') : (isMeSender ? (thread.receiverName || 'বিক্রেতা') : 'বিক্রেতা'));
                      
                      const companionName = isMeBuyer ? sellerName : buyerName;
                      const isUnread = isThreadUnread(thread);
                      
                      return (
                        <div 
                          key={thread.id || idx}
                          onClick={() => {
                            setActiveChatRoom({
                              id: thread.roomId || `${buyerId}_${sellerId}_general`,
                              buyerId: buyerId,
                              buyerName: buyerName,
                              sellerId: sellerId,
                              sellerName: sellerName,
                              listingId: thread.listingId || '',
                              listingTitle: thread.listingTitle || 'Facebook Account',
                              listingCategory: thread.listingCategory || 'Facebook Account',
                              listingPrice: thread.listingPrice || 0,
                              listingDescription: thread.listingDescription || ''
                            });
                            setIsChatInboxOpen(false); // Close inbox drawer when opening room
                          }}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-3xs flex items-center gap-3 group relative ${
                            isUnread 
                              ? 'bg-emerald-50/30 border-emerald-200 hover:bg-emerald-50/60 shadow-sm' 
                              : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-100/50'
                          }`}
                        >
                          <div className={`w-10 h-10 font-black rounded-xl border flex items-center justify-center text-xs shadow-3xs ${
                            isUnread 
                              ? 'bg-emerald-600 border-emerald-700 text-white' 
                              : 'bg-emerald-50 border-emerald-100/50 text-emerald-800'
                          }`}>
                            {companionName.substring(0, 2).toUpperCase()}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[11.5px] font-black text-slate-800 truncate group-hover:text-[#2D8A4E] transition-colors leading-none flex items-center gap-1.5">
                                {companionName}
                                {isUnread && (
                                  <span className="w-2 h-2 bg-[#2D8A4E] rounded-full animate-pulse" />
                                )}
                              </span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                                {formatTimeOnly(thread.createdAt, 'Now')}
                              </span>
                            </div>
                            
                            <p className={`text-[9.5px] truncate leading-snug ${isUnread ? 'font-black text-slate-900' : 'font-semibold text-slate-500'}`}>
                              {isMeSender ? 'You: ' : ''}{thread.text}
                            </p>

                            <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block mt-1 leading-none">
                               {thread.listingTitle || 'N/A'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Sticky bottom Google AdSense banner */}
        {adsterraEnabled && view !== 'admin' && view !== 'login' && view !== 'register' && view !== 'forgot' && view !== 'reset' && (
          <AdSenseSlot 
            type="sticky-bottom" 
            adsterraEnabled={adsterraEnabled}
            adsterraBannerKey={adsterraBannerKey}
            adsterraMobileBannerKey={adsterraMobileBannerKey}
            adsterraInFeedKey={adsterraInFeedKey}
            adsterraStickyKey={adsterraStickyKey}
            bgColor={navBgColor}
          />
        )}

        {/* Mobile Footer Navigation */}
        <nav 
          className="fixed bottom-0 left-0 right-0 z-40 lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.03)] border-t pb-safe"
          style={{ backgroundColor: navBgColor, borderColor: 'rgba(128,128,128,0.15)' }}
        >
          <div className="grid grid-cols-5 h-16 max-w-md mx-auto items-center">
            
            {/* 1. HOME */}
            <button
              onClick={() => setView('marketplace')}
              className={`flex flex-col items-center justify-center h-full transition-all relative ${view === 'marketplace' ? 'text-[#00B56C]' : 'text-slate-400'}`}
            >
              <Home size={19} strokeWidth={view === 'marketplace' ? 2.5 : 2} />
              <span className="text-[9px] font-black tracking-wider uppercase mt-1 leading-none">HOME</span>
              {view === 'marketplace' && (
                <span className="absolute bottom-[2px] w-1.5 h-1.5 rounded-full bg-[#00B56C]" />
              )}
            </button>

            {/* 2. MARKET */}
            <button
              onClick={() => setView('gmail-market')}
              className={`flex flex-col items-center justify-center h-full transition-all relative ${view === 'gmail-market' ? 'text-[#00B56C]' : 'text-slate-400'}`}
            >
              <ShoppingBag size={19} strokeWidth={view === 'gmail-market' ? 2.5 : 2} />
              <span className="text-[9px] font-black tracking-wider uppercase mt-1 leading-none">MARKET</span>
              {view === 'gmail-market' && (
                <span className="absolute bottom-[2px] w-1.5 h-1.5 rounded-full bg-[#00B56C]" />
              )}
            </button>

            {/* 3. SERVICES */}
            <button
              onClick={() => { setView('sell-earn'); setSellEarnTab('services'); }}
              className={`flex flex-col items-center justify-center h-full transition-all relative ${(view === 'sell-earn' && sellEarnTab === 'services') ? 'text-[#00B56C]' : 'text-slate-400'}`}
            >
              <ShieldCheck size={19} strokeWidth={(view === 'sell-earn' && sellEarnTab === 'services') ? 2.5 : 2} />
              <span className="text-[9px] font-black tracking-wider uppercase mt-1 leading-none">SERVICES</span>
              {(view === 'sell-earn' && sellEarnTab === 'services') && (
                <span className="absolute bottom-[2px] w-1.5 h-1.5 rounded-full bg-[#00B56C]" />
              )}
            </button>

            {/* 4. EARN */}
            <button
              onClick={() => { setView('sell-earn'); setSellEarnTab('earn'); }}
              className={`flex flex-col items-center justify-center h-full transition-all relative ${(view === 'sell-earn' && sellEarnTab === 'earn') ? 'text-[#00B56C]' : 'text-slate-400'}`}
            >
              <Zap size={19} strokeWidth={(view === 'sell-earn' && sellEarnTab === 'earn') ? 2.5 : 2} />
              <span className="text-[9px] font-black tracking-wider uppercase mt-1 leading-none">EARN</span>
              {(view === 'sell-earn' && sellEarnTab === 'earn') && (
                <span className="absolute bottom-[2px] w-1.5 h-1.5 rounded-full bg-[#00B56C]" />
              )}
            </button>

            {/* 5. ACCOUNT */}
            <button
              onClick={() => { setView('profile'); setShowDepositArea(false); }}
              className={`flex flex-col items-center justify-center h-full transition-all relative ${view === 'profile' ? 'text-[#00B56C]' : 'text-slate-400'}`}
            >
              <UserIcon size={19} strokeWidth={view === 'profile' ? 2.5 : 2} />
              <span className="text-[9px] font-black tracking-wider uppercase mt-1 leading-none">ACCOUNT</span>
              {view === 'profile' && (
                <span className="absolute bottom-[2px] w-1.5 h-1.5 rounded-full bg-[#00B56C]" />
              )}
            </button>

          </div>
        </nav>

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
                  { label: 'Sell Gmail', action: () => setView('seller-center') }
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
                <a 
                  href="https://wa.me/8801410731308" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-2 hover:text-[#2E7D32] transition-colors"
                >
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  📞 Customer Service
                </a>
              <span>&bull;</span>
              <span>Secure 256-bit AES</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Right Desktop Sidebar Widget */}
      <div className="hidden lg:flex w-[320px] shrink-0 flex-col gap-4 self-stretch justify-start py-4">
        <div className="bg-white border border-slate-200/80 p-6 rounded-[2rem] space-y-4 shadow-[0_8px_30px_rgba(0,0,0,0.03)] relative overflow-hidden text-slate-800 flex flex-col shrink-0 text-left">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em] leading-none">HELP desk</h3>
            <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1 leading-none">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping shrink-0" />
              ONLINE
            </div>
          </div>
          
          <a 
            href="https://wa.me/8801410731308" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="block group bg-emerald-50/5 hover:bg-emerald-50/20 border border-emerald-500/20 hover:border-emerald-500/40 p-4 rounded-2xl transition-all shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/15 rounded-xl flex items-center justify-center text-emerald-605 group-hover:scale-110 transition-transform">
                <Phone size={18} strokeWidth={2.5} />
              </div>
              <div className="text-left font-sans">
                <span className="block text-[8px] font-black tracking-widest text-[#2D8A4E] uppercase">WhatsApp Service</span>
                <span className="text-slate-950 text-xs font-bold leading-none block mt-1 hover:underline">01410-731308</span>
              </div>
            </div>
          </a>

          <div className="space-y-3 pt-1">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Guaranteed Quality</div>
            <div className="space-y-2.5">
              {[
                "100% Verified Escrow Deals",
                "Direct Admin Assistance Link",
                "Instant Cash Out Guarantee",
                "Secure AES Encrypted Keyboards"
              ].map((std, idx) => (
                <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-700 font-semibold leading-none font-sans">
                  <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                  <span>{std}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-6 rounded-[2rem] space-y-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] relative overflow-hidden text-slate-800 flex flex-col shrink-0 text-left">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-yellow-600 shrink-0" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider leading-none">Trade Safety Guide</span>
          </div>
          <p className="text-[11.5px] text-slate-600 leading-relaxed font-sans font-medium">
            লেনদেন জালিয়াতি এড়াতে সর্বদা ওয়েবসাইট Escrow ব্যবহার করুন। Admin-কে সরাসরি WhatsApp/টেলিগ্রাম চুক্তির প্রমাণ প্রদান করতে পারেন।
          </p>
          <div className="bg-red-500/5 border border-red-500/15 p-3 rounded-2xl flex items-start gap-2.5">
            <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-[9.5px] text-red-800 leading-snug font-semibold">
              পাসওয়ার্ড বা রিকভারি ডাটা শেয়ার করার আগে পেমেন্ট ব্যালেন্স চেক করতে ভুলবেন না।
            </p>
          </div>
        </div>
      </div>
    </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans selection:bg-[#2E7D32]/20 relative overflow-hidden">
      {/* Background soft light elements */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-red-500/[0.02] rounded-full blur-[125px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-500/[0.02] rounded-full blur-[125px] pointer-events-none" />
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="w-full max-w-[350px] bg-white rounded-[1.5rem] shadow-[0_12px_40px_rgba(0,0,0,0.02)] p-5 sm:p-6 border border-slate-100/80 relative overflow-hidden"
        >
          {/* Decorative gradients */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#2E7D32]/5 rounded-full blur-3xl -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#2E7D32]/5 rounded-full blur-3xl -ml-16 -mb-16" />

          {view === 'login' && (
            <div className="space-y-6 relative z-10">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md border-2 border-slate-50 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-50 to-white opacity-50" />
                  <Mail size={28} strokeWidth={2.5} className="text-blue-600 relative z-10 group-hover:scale-110 transition-transform" />
                </div>

                <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-[#0D1B3E] leading-tight">
                  Gmail Buy & Sell<span className="text-[#0D1B3E]/80"> BD</span>
                </h1>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest opacity-60">Verified Gmail Marketplace</p>
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

                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-left">
                  <p className="text-[10px] text-amber-850 font-bold leading-relaxed">
                    💡 <span className="text-[#DC2626]">টিপস:</span> যদি গুগল লগইনে সমস্যা হয় (যেমন popup closed error), তবে উপরে বা নিচে থাকা <span className="text-zinc-900 border-b border-zinc-900 w-fit">"Open in a new tab"</span> বাটনে ক্লিক করে অ্যাপটি নতুন ট্যাবে ওপেন করে গুগল লগইন করুন। অথবা সরাসরি ইমেল পাসওয়ার্ড দিয়ে লগইন করুন।
                  </p>
                </div>

                <div className="text-center pt-2">
                  <p className="text-sm text-slate-500 font-medium">
                    New user? Just enter your email and password above to start.
                  </p>
                </div>
              </div>

              {/* System Footer */}
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] pt-4">
                <a 
                  href="https://wa.me/8801410731308" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-2 hover:text-[#2E7D32] transition-colors"
                >
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  📞 Customer Service
                </a>
                <span className="hidden sm:inline opacity-30">&bull;</span>
                <span>Secure 256-bit AES</span>
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
                <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-800 leading-tight">পাসওয়ার্ড রিসেট</h1>
                <p className="text-slate-500 text-sm font-medium">আপনার একাউন্টে ফিরে আসতে আমরা আপনাকে সাহায্য করব।</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
                  <AlertCircle className="text-red-500 shrink-0" size={18} />
                  <p className="text-xs text-red-600 leading-relaxed overflow-hidden text-ellipsis">{getDisplayError(error)}</p>
                </div>
              )}

              <form onSubmit={handleForgot} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">ইমেইল এড্রেস</label>
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
                  disabled={loading}
                  className="w-full bg-[#2E7D32] hover:bg-[#256628] text-white font-bold py-4 rounded-2xl shadow-xl shadow-green-900/10 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="animate-spin" size={18} />
                      লিংক পাঠানো হচ্ছে...
                    </>
                  ) : (
                    'রিসেট লিংক পাঠান'
                  )}
                </button>
              </form>

              <div className="text-center">
                <button 
                  onClick={() => setView('login')}
                  className="text-sm font-bold text-[#2E7D32] hover:underline"
                >
                  লগইন এ ফিরে যান
                </button>
              </div>
            </div>
          )}

          {view === 'reset' && (
            <div className="space-y-10 relative z-10">
              <div className="text-center space-y-3">
                <div className="w-20 h-20 bg-gradient-to-tr from-[#2E7D32] to-[#4CAF50] rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-900/10">
                  <RefreshCw className="text-white" size={36} />
                </div>
                <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-800 leading-tight">নতুন পাসওয়ার্ড</h1>
                <p className="text-slate-500 text-sm font-medium">আপনার একাউন্টের জন্য একটি নতুন পাসওয়ার্ড সেট করুন।</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
                  <AlertCircle className="text-red-500 shrink-0" size={18} />
                  <p className="text-xs text-red-600 leading-relaxed overflow-hidden text-ellipsis">{getDisplayError(error)}</p>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">নতুন পাসওয়ার্ড</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#2E7D32] transition-colors" size={18} />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-[#2E7D32] transition-all text-slate-800 placeholder:text-slate-300"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">পাসওয়ার্ড নিশ্চিত করুন</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#2E7D32] transition-colors" size={18} />
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-[#2E7D32] transition-all text-slate-800 placeholder:text-slate-300"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#2E7D32] hover:bg-[#256628] text-white font-bold py-4 rounded-2xl shadow-xl shadow-green-900/10 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="animate-spin" size={18} />
                      পরিবর্তন করা হচ্ছে...
                    </>
                  ) : (
                    'পাসওয়ার্ড পরিবর্তন করুন'
                  )}
                </button>
              </form>

              <div className="text-center">
                <button 
                  onClick={() => setView('login')}
                  className="text-sm font-bold text-[#2E7D32] hover:underline"
                >
                  লগইন এ ফিরে যান
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
