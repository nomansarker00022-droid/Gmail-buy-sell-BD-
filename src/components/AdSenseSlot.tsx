import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { ExternalLink, HelpCircle, X, Sparkles, AlertCircle, Coins, Flame } from 'lucide-react';

interface AdSenseSlotProps {
  pubId?: string;
  slotId?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  type: 'banner' | 'square' | 'sidebar' | 'in-feed' | 'sticky-bottom';
  className?: string;

  // New configurations for dual monetization
  adsenseEnabled?: boolean;
  adsterraEnabled?: boolean;
  adsterraBannerKey?: string;
  adsterraMobileBannerKey?: string;
  adsterraInFeedKey?: string;
  adsterraStickyKey?: string;
}

// Highly appealing simulated Google AdSense ads matching Bengali marketplace theme
const SIMULATED_ADS_ADSENSE = [
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
    url: "https://www.namecheap.com",
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

// Beautiful high-CPM direct offers for Adsterra simulation
const SIMULATED_ADS_ADSTERRA = [
  {
    title: "Adsterra Publishers - Monetize 100% Traffic",
    descr: "Join the fastest growing high-CPM ad network. Earn up to $45+ ecpm. Fast payments starting at just $5 via bKash/Binance!",
    cta: "Create Publisher Account",
    url: "https://adsterra.com",
    bg: "from-indigo-600/10 to-violet-600/5",
    accent: "text-indigo-600",
    border: "border-indigo-500/20",
    badge: "Adsterra Official Partner"
  },
  {
    title: "Rocket VPN: Super Fast, Unlimited & Secure",
    descr: "Protect your online privacy with military-grade encryption. Safeguard credentials with 1-click super-fast servers.",
    cta: "Install Free extension",
    url: "https://adsterra.com",
    bg: "from-amber-500/10 to-yellow-500/5",
    accent: "text-amber-700",
    border: "border-amber-500/20",
    badge: "Secure Utility"
  },
  {
    title: "Play Kingdom Quest Web RPG Now!",
    descr: "No downloads required. Join millions of players online. Face legendary monsters, level up and trade valuable legendary item drops.",
    cta: "Play instantly",
    url: "https://adsterra.com",
    bg: "from-rose-500/10 to-red-500/5",
    accent: "text-rose-600",
    border: "border-rose-500/20",
    badge: "Web RPG Classic"
  },
  {
    title: "Earn $200 Daily Listing Unused Gmails",
    descr: " Bangladesh's largest secure marketplace. Sellers are making up to 15,000 BDT daily. Real-time payouts, 100% trusted transactions.",
    cta: "Start Selling",
    url: "#",
    bg: "from-emerald-500/10 to-teal-500/5",
    accent: "text-emerald-700",
    border: "border-emerald-500/20",
    badge: "BD Passive Income"
  }
];

export const AdSenseSlot: React.FC<AdSenseSlotProps> = ({
  pubId,
  slotId = "886784280898",
  format = "auto",
  type,
  className = "",

  // Props with default fallback values connected to local storage or fallback to system active status
  adsenseEnabled = true,
  adsterraEnabled = false,
  adsterraBannerKey = "",
  adsterraMobileBannerKey = "",
  adsterraInFeedKey = "",
  adsterraStickyKey = ""
}) => {
  const [adIndex, setAdIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Monitor screen size for Adsterra responsive banner key switching
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Pick a random simulated ad index on load
  useEffect(() => {
    const listLength = adsterraEnabled ? SIMULATED_ADS_ADSTERRA.length : SIMULATED_ADS_ADSENSE.length;
    setAdIndex(Math.floor(Math.random() * listLength));
  }, [adsterraEnabled]);

  // Handle live Google AdSense or Adsterra scripts
  useEffect(() => {
    // If we're displaying Google AdSense
    if (!adsterraEnabled && adsenseEnabled && pubId) {
      try {
        const adsbygoogle = (window as any).adsbygoogle || [];
        adsbygoogle.push({});
      } catch (err) {
        console.warn("Google AdSense pushing error (safely skipped in workspace):", err);
      }
    }
    
    // If we're displaying live Adsterra script inside container
    if (adsterraEnabled && containerRef.current) {
      // Clear containers
      containerRef.current.innerHTML = '';
      
      // Determine active key based on slot type and screen size
      let activeKey = "";
      let height = 90;
      let width = 728;

      if (type === 'banner') {
        if (isMobile) {
          activeKey = (adsterraMobileBannerKey || adsterraBannerKey || "").trim();
          width = 320;
          height = 50;
        } else {
          activeKey = (adsterraBannerKey || "").trim();
          width = 728;
          height = 90;
        }
      } else if (type === 'in-feed') {
        activeKey = (adsterraInFeedKey || "").trim();
        width = 300;
        height = 250;
      } else if (type === 'sticky-bottom') {
        activeKey = (adsterraStickyKey || "").trim();
        width = 320;
        height = 50;
      }

      // If a real active key is provided for Adsterra, inject script
      if (activeKey) {
        try {
          const atOptionsScript = document.createElement('script');
          atOptionsScript.type = 'text/javascript';
          atOptionsScript.innerHTML = `
            window.atOptions = {
              'key' : '${activeKey}',
              'format' : 'iframe',
              'height' : ${height},
              'width' : ${width},
              'params' : {}
            };
          `;
          containerRef.current.appendChild(atOptionsScript);

          const invokeScript = document.createElement('script');
          invokeScript.type = 'text/javascript';
          invokeScript.src = `//www.highperformanceformat.com/${activeKey}/invoke.js`;
          
          // Fallback script source handling error protection
          invokeScript.onerror = () => {
            console.warn("Retrying with fallback topcreativeformat server for Adsterra...");
            const fallbackScript = document.createElement('script');
            fallbackScript.type = 'text/javascript';
            fallbackScript.src = `//www.topcreativeformat.com/${activeKey}/invoke.js`;
            if (containerRef.current) {
              containerRef.current.appendChild(fallbackScript);
            }
          };

          containerRef.current.appendChild(invokeScript);
        } catch (scriptErr) {
          console.error("Adsterra script loading exception:", scriptErr);
        }
      }
    }
  }, [adsenseEnabled, adsterraEnabled, pubId, adsterraBannerKey, adsterraMobileBannerKey, adsterraInFeedKey, adsterraStickyKey, type, isMobile]);

  if (dismissed) return null;

  // Set active simulated ad information
  const currentAd = adsterraEnabled 
    ? SIMULATED_ADS_ADSTERRA[adIndex] || SIMULATED_ADS_ADSTERRA[0]
    : SIMULATED_ADS_ADSENSE[adIndex] || SIMULATED_ADS_ADSENSE[0];

  // ============================================
  // CASE 1: REAL LIVE ADSTERRA SCRIPT RENDERING
  // ============================================
  const hasLiveAdsterraKey = adsterraEnabled && (
    (type === 'banner' && (isMobile ? (adsterraMobileBannerKey || adsterraBannerKey) : adsterraBannerKey)) ||
    (type === 'in-feed' && adsterraInFeedKey) ||
    (type === 'sticky-bottom' && adsterraStickyKey)
  );

  if (adsterraEnabled && hasLiveAdsterraKey) {
    let containerWidth = "w-full max-w-[728px]";
    let containerHeight = "min-h-[90px]";
    if (type === 'in-feed') {
      containerWidth = "w-full max-w-[300px]";
      containerHeight = "min-h-[250px]";
    } else if (isMobile || type === 'sticky-bottom') {
      containerWidth = "w-full max-w-[320px]";
      containerHeight = "min-h-[50px]";
    }

    return (
      <div className={`adsterra-wrapper my-6 overflow-hidden mx-auto text-center ${className}`}>
        <div className={`mx-auto ${containerWidth} flex items-center justify-between px-3 py-1 bg-slate-900 border border-slate-800 rounded-t-xl text-[9px] text-indigo-400 font-bold`}>
          <div className="flex items-center gap-1.5 font-sans">
            <Flame size={10} className="text-indigo-400 animate-bounce" />
            <span>ADSTERRA NETWORK PREMIUM SPONSOR</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="hover:underline">Secure Ad</span>
          </div>
        </div>
        <div 
          className={`bg-slate-950 border-x border-b border-slate-800 p-3 rounded-b-xl flex justify-center items-center ${containerHeight} mx-auto`}
          ref={containerRef}
          id={`adsterra-container-${type}`}
        />
      </div>
    );
  }

  // ============================================
  // CASE 2: REAL LIVE GOOGLE ADSENSE RENDERING
  // ============================================
  if (!adsterraEnabled && adsenseEnabled && pubId) {
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

  // ============================================
  // CASE 3: HIGH-FIDELITY SIMULATED AD DESIGN
  // ============================================
  
  if (type === 'sticky-bottom') {
    return (
      <motion.div 
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="fixed bottom-16 sm:bottom-20 left-0 right-0 z-[40] px-4 md:px-8 pointer-events-none"
      >
        <div className={`max-w-4xl mx-auto rounded-2xl p-3 md:p-4 border shadow-2xl flex items-center justify-between gap-4 pointer-events-auto ${
          adsterraEnabled 
            ? 'bg-slate-950/95 border-indigo-500/20 text-white' 
            : 'bg-slate-900/95 border-white/10 text-white'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0 ${
              adsterraEnabled ? 'bg-indigo-600 text-white animate-pulse' : 'bg-[#FFEB3B] text-slate-900'
            }`}>
              AD
            </span>
            <div className="min-w-0">
              <h5 className="text-xs md:text-sm font-black truncate">{currentAd.title}</h5>
              <p className="text-slate-300 text-[10px] md:text-xs truncate hidden sm:block">{currentAd.descr}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a 
              href={currentAd.url} 
              target="_blank" 
              rel="noreferrer"
              className={`px-3.5 py-2 text-white font-black text-[10.5px] uppercase tracking-wider rounded-xl transition-all active:scale-95 flex items-center gap-1 shadow-sm ${
                adsterraEnabled ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-500 hover:bg-emerald-600'
              }`}
            >
              <span>{currentAd.cta}</span>
              <ExternalLink size={10} />
            </a>
            <button 
              onClick={() => setDismissed(true)}
              className="p-2 text-slate-400 hover:text-white transition-colors animate-pulse"
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
        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-xl pointer-events-none ${
          adsterraEnabled ? 'bg-gradient-to-br from-indigo-500/10 to-transparent' : 'bg-gradient-to-br from-emerald-500/10 to-transparent'
        }`} />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className={`border border-black/10 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest shrink-0 shadow-sm ${
              adsterraEnabled ? 'bg-indigo-600 text-white' : 'bg-[#FFEB3B] text-slate-900'
            }`}>
              AD
            </span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{currentAd.badge}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
              {adsterraEnabled ? 'Adsterra Ads' : 'Google AdSense'} <HelpCircle size={10} />
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
          <h4 className={`font-display text-base sm:text-lg font-black tracking-tight ${adsterraEnabled ? 'text-indigo-700 font-extrabold' : currentAd.accent}`}>
            {currentAd.title}
          </h4>
          <p className="text-[11px] sm:text-xs font-semibold text-slate-600 leading-relaxed">
            {currentAd.descr}
          </p>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
            <span>{adsterraEnabled ? 'adsterra-invoke.js' : 'adsbygoogle.js'}</span>
          </div>
          <a
            href={currentAd.url}
            target="_blank"
            rel="noreferrer"
            className={`px-4.5 py-2.5 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer ${
              adsterraEnabled ? 'bg-indigo-600 hover:bg-slate-900' : 'bg-slate-900 text-white hover:bg-black'
            }`}
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
          <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider mr-1 text-white ${
            adsterraEnabled ? 'bg-indigo-600' : 'bg-orange-500'
          }`}>
            SPONSORED
          </span>
          <span>{adsterraEnabled ? 'ADSTERRA PREMIUM MONETIZATION SIMULATOR' : 'GOOGLE ADSENSE SIMULATOR'}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hover:underline cursor-pointer">Ad Choices</span>
          <button onClick={() => setDismissed(true)} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={10} />
          </button>
        </div>
      </div>

      <div className={`p-5 sm:p-6 md:p-8 flex flex-col md:flex-row items-center gap-4 bg-gradient-to-r ${currentAd.bg}`}>
        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs font-bold text-lg ${
          adsterraEnabled 
            ? 'bg-indigo-500/10 border-indigo-500/10 text-indigo-600' 
            : 'bg-orange-500/10 border-orange-500/10 text-orange-600'
        }`}>
          {currentAd.title.charAt(0)}
        </div>
        
        <div className="flex-1 min-w-0 text-center md:text-left space-y-1">
          <h4 className={`text-sm sm:text-base font-black tracking-tight ${adsterraEnabled ? 'text-indigo-600' : currentAd.accent} truncate`}>
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
            className={`flex-1 md:flex-initial px-5 py-3 text-white font-black text-[10px] uppercase tracking-widest transition-all text-center rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 ${
              adsterraEnabled ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            <span>{currentAd.cta}</span>
            <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </div>
  );
};
