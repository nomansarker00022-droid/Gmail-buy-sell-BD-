import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ExternalLink, HelpCircle, X, Sparkles, AlertCircle } from 'lucide-react';

interface AdSenseSlotProps {
  pubId?: string;
  slotId?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  type: 'banner' | 'square' | 'sidebar' | 'in-feed' | 'sticky-bottom';
  className?: string;
}

// Highly appealing simulated ad contents matching Bengali marketplace theme
const SIMULATED_ADS = [
  {
    title: "বিকাশ অ্যাপ ডাউনলোড করুন",
    descr: "বিকাশ অ্যাপে প্রথম লগইনে পাচ্ছেন ১০০ টাকা পর্যন্ত ইনস্ট্যান্ট বোনাস! এখনই ডাউনলোড করে সেলফ-রেজিস্ট্রেশন করুন।",
    cta: "অফারটি নিন",
    url: "https://www.bkash.com",
    bg: "from-[#e2136e]/10 to-[#e2136e]/5",
    accent: "text-[#e2136e]",
    border: "border-pink-500/20",
    badge: "bKash Exclusive"
  },
  {
    title: "Namecheap - $0.99 Domains",
    descr: "Register your custom domain with namecheap starting from just $0.99! Reliable domain service & 24/7 client support.",
    cta: "Get Domain",
    url: "https://www.namecheap.com",
    bg: "from-orange-500/10 to-orange-500/5",
    accent: "text-orange-600",
    border: "border-orange-500/20",
    badge: "Web Domain"
  },
  {
    title: "সবচেয়ে ফাস্ট বিডি হোস্টিং - ৳৯৯/মাস",
    descr: "Dhaka NVMe SSD Server-এ চমৎকার স্পিড ও ৯৯.৯% আপটাইম গ্যারান্টি। ডোমেইন ও ফ্রি SSL সহ হোস্টিং কিনুন ১ মিনিটে।",
    cta: "হোস্টিং দেখুন",
    url: "#",
    bg: "from-[#2E7D32]/10 to-[#2E7D32]/5",
    accent: "text-[#2E7D32]",
    border: "border-green-500/20",
    badge: "Ultra BD Hosting"
  },
  {
    title: "Google Cloud - Start your Free Trial",
    descr: "Get $300 in free credits to build and deploy your scalable applications globally on Google high-performance network.",
    cta: "Start Free",
    url: "https://cloud.google.com",
    bg: "from-blue-500/10 to-blue-500/5",
    accent: "text-blue-600",
    border: "border-blue-500/20",
    badge: "Google Cloud Tech"
  },
  {
    title: "Daraz - ১০% ক্যাশব্যাক অফার",
    descr: "নগদ ও বিকাশ পেমেন্টে দারাজ থেকে কেনাকাটায় অতিরিক্ত ১০% ডিসকাউন্ট উপভোগ করুন। মোবাইল, গ্যাজেট ও কিচেন আইটেমে সেরা ছাড়!",
    cta: "শপিং করুন",
    url: "https://www.daraz.com.bd",
    bg: "from-yellow-500/10 to-yellow-500/5",
    accent: "text-yellow-600",
    border: "border-yellow-500/20",
    badge: "Super Shopping"
  }
];

export const AdSenseSlot: React.FC<AdSenseSlotProps> = ({
  pubId,
  slotId = "886784280898",
  format = "auto",
  type,
  className = ""
}) => {
  const [adIndex, setAdIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  // Pick a random simulated ad on load
  useEffect(() => {
    setAdIndex(Math.floor(Math.random() * SIMULATED_ADS.length));
    
    // Safely execute AdSense window script update if available and configured
    if (pubId) {
      try {
        const adsbygoogle = (window as any).adsbygoogle || [];
        adsbygoogle.push({});
      } catch (err) {
        console.warn("Google AdSense pushing error (mostly skipped in developer sandbox):", err);
      }
    }
  }, [pubId]);

  if (dismissed) return null;

  const currentAd = SIMULATED_ADS[adIndex];

  // If real publisher ID is configured, we can render the actual AdSense code script!
  if (pubId) {
    return (
      <div className={`adsense-wrapper my-6 overflow-hidden ${className}`}>
        <div className="flex items-center justify-between px-3 py-1 bg-slate-50 border border-slate-100 rounded-t-xl text-[10px] text-slate-400 font-bold">
          <div className="flex items-center gap-1.5 font-sans">
            <Sparkles size={10} className="text-emerald-500 animate-pulse" />
            <span>SPONSORED BY GOOGLE ADSENSE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="hover:underline cursor-pointer">Ad Choices</span>
          </div>
        </div>
        <div className="bg-white border-x border-b border-slate-100 p-4 rounded-b-xl flex justify-center items-center">
          <ins className="adsbygoogle"
               style={{ display: 'block', minHeight: type === 'banner' ? '90px' : '250px' }}
               data-ad-client={pubId}
               data-ad-slot={slotId}
               data-ad-format={format}
               data-full-width-responsive="true"></ins>
        </div>
      </div>
    );
  }

  // --- Beautiful Mock Ad Placeholder Matching the Exact Desired Layout ("দেখে কেমন লাগবে") ---
  
  if (type === 'sticky-bottom') {
    return (
      <motion.div 
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="fixed bottom-16 sm:bottom-20 left-0 right-0 z-[40] px-4 md:px-8 pointer-events-none"
      >
        <div className="max-w-4xl mx-auto bg-slate-900/95 backdrop-blur-md rounded-2xl p-3 md:p-4 border border-white/10 shadow-2xl flex items-center justify-between gap-4 pointer-events-auto">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="bg-[#FFEB3B] text-slate-900 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0">AD</span>
            <div className="min-w-0">
              <h5 className="text-white text-xs md:text-sm font-black truncate">{currentAd.title}</h5>
              <p className="text-slate-300 text-[10px] md:text-xs truncate hidden sm:block">{currentAd.descr}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a 
              href={currentAd.url} 
              target="_blank" 
              rel="noreferrer"
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10.5px] uppercase tracking-wider rounded-xl transition-all active:scale-95 flex items-center gap-1 shadow-sm"
            >
              <span>{currentAd.cta}</span>
              <ExternalLink size={10} />
            </a>
            <button 
              onClick={() => setDismissed(true)}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (type === 'in-feed') {
    return (
      <div className={`bg-gradient-to-r ${currentAd.bg} rounded-[2rem] border ${currentAd.border} p-4 sm:p-6 space-y-4 shadow-sm relative overflow-hidden transition-all hover:shadow-md ${className}`}>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="bg-[#FFEB3B] text-slate-900 border border-slate-900/10 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest shrink-0 shadow-sm">AD</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{currentAd.badge}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
              Google AdSense <HelpCircle size={10} />
            </span>
            <button 
              onClick={() => setDismissed(true)}
              className="p-1 text-slate-400 hover:text-red-500 transition-all rounded-full hover:bg-slate-100"
            >
              <X size={12} />
            </button>
          </div>
        </div>

        <div className="space-y-2 text-left">
          <h4 className={`font-display text-base sm:text-lg font-black tracking-tight ${currentAd.accent}`}>
            {currentAd.title}
          </h4>
          <p className="text-[11px] sm:text-xs font-semibold text-slate-600 leading-relaxed">
            {currentAd.descr}
          </p>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
            <span>adsbygoogle.js</span>
          </div>
          <a
            href={currentAd.url}
            target="_blank"
            rel="noreferrer"
            className={`px-4.5 py-2.5 bg-slate-900 text-white hover:bg-black font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer`}
          >
            <span>{currentAd.cta}</span>
            <ExternalLink size={11} />
          </a>
        </div>
      </div>
    );
  }

  // General Banner style for Top/Bottom placements
  return (
    <div className={`bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-2xs ${className}`}>
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50/80 border-b border-slate-100/50 text-[9px] text-slate-400 font-bold">
        <div className="flex items-center gap-1">
          <span className="bg-[#FF9800] text-white px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider mr-1">SPONSORED</span>
          <span>GOOGLE ADSENSE SIMULATOR</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hover:underline cursor-pointer">Ad Choices</span>
          <button onClick={() => setDismissed(true)} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={10} />
          </button>
        </div>
      </div>

      <div className={`p-5 sm:p-6 md:p-8 flex flex-col md:flex-row items-center gap-4 bg-gradient-to-r ${currentAd.bg}`}>
        <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/10 flex items-center justify-center shrink-0 shadow-2xs font-bold text-orange-600 text-lg">
          {currentAd.title.charAt(0)}
        </div>
        
        <div className="flex-1 min-w-0 text-center md:text-left space-y-1">
          <h4 className={`text-sm sm:text-base font-black tracking-tight ${currentAd.accent} truncate`}>
            {currentAd.title}
          </h4>
          <p className="text-[11px] sm:text-xs text-slate-600 font-semibold line-clamp-2 leading-relaxed">
            {currentAd.descr}
          </p>
        </div>

        <div className="shrink-0 w-full md:w-auto flex flex-col sm:flex-row gap-2 mt-2 md:mt-0">
          <a
            href={currentAd.url}
            target="_blank"
            rel="noreferrer"
            className="flex-1 md:flex-initial px-5 py-3 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all text-center rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
          >
            <span>{currentAd.cta}</span>
            <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </div>
  );
};
