import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { ExternalLink, HelpCircle, X, Flame } from 'lucide-react';
import { getAdSecurityState, subscribeToAdSecurity } from '../lib/adSecurity';

interface AdSenseSlotProps {
  type: 'banner' | 'square' | 'sidebar' | 'in-feed' | 'sticky-bottom';
  className?: string;

  adsterraEnabled?: boolean;
  adsterraBannerKey?: string;
  adsterraMobileBannerKey?: string;
  adsterraInFeedKey?: string;
  adsterraStickyKey?: string;
  bgColor?: string;

  adsenseEnabled?: boolean;
  adsensePublisherId?: string;
  adsenseBannerSlotId?: string;
  adsenseInFeedSlotId?: string;
  adsenseStickySlotId?: string;

  // Monetag Configurations
  monetagEnabled?: boolean;
  monetagBannerTagId?: string;
  monetagMobileBannerTagId?: string;
  monetagInFeedTagId?: string;
  monetagStickyTagId?: string;
}

// Beautiful high-CPM direct offers for Monetag simulation
const SIMULATED_ADS_MONETAG = [
  {
    title: "Monetag Publishers - Ultimate Monetization Platform",
    descr: "Boost your ad earnings with high-impact native formats, smartlinks, and AI-optimized CPM rates. Instant payouts globally.",
    cta: "Start Earning with Monetag",
    url: "https://monetag.com",
    bg: "from-blue-600/10 to-cyan-600/5",
    accent: "text-blue-600",
    border: "border-blue-500/20",
    badge: "Monetag Certified Partner"
  },
  {
    title: "X-Cleaner: Turbo Boost & Mobile Protection",
    descr: "Instantly clean storage, optimize system memory, and block malicious tracking cookies in 1-tap. 100% free download.",
    cta: "Download Free Cleaner",
    url: "https://monetag.com",
    bg: "from-teal-500/10 to-cyan-500/5",
    accent: "text-teal-700",
    border: "border-teal-500/20",
    badge: "Android/iOS Utility"
  },
  {
    title: "Play Galaxy Fleet: Elite Space Shooter",
    descr: "Epic 3D space battles with millions of commanders online. Build bases, upgrade shields, and dominate the galaxy.",
    cta: "Launch game",
    url: "https://monetag.com",
    bg: "from-violet-500/10 to-fuchsia-500/5",
    accent: "text-violet-600",
    border: "border-violet-500/20",
    badge: "Space Strategy MMO"
  },
  {
    title: "Earn 10,000 BDT Daily Reselling Gmail Accounts",
    descr: "Fastest-growing secure trading desk in BD. Auto verification, instant bKash disbursements, and dedicated 24/7 support agent help.",
    cta: "Sell Now",
    url: "#",
    bg: "from-sky-500/10 to-blue-500/5",
    accent: "text-sky-700",
    border: "border-sky-500/20",
    badge: "BD Smart Earners"
  }
];

export const AdSenseSlot: React.FC<AdSenseSlotProps> = ({
  type,
  className = "",
  bgColor = "",

  // Monetag Configurations (Default to active for Monetag-only setup)
  monetagEnabled = false,
  monetagBannerTagId = "",
  monetagMobileBannerTagId = "",
  monetagInFeedTagId = "",
  monetagStickyTagId = ""
}) => {
  const [adIndex, setAdIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [securityState, setSecurityState] = useState(() => getAdSecurityState());

  // Listen to the traffic protection shield status
  useEffect(() => {
    return subscribeToAdSecurity((state) => {
      setSecurityState(state);
    });
  }, []);

  const isTrafficUnsafe = securityState.isVpnDetected || securityState.isAdBlockDetected;

  // Monitor screen size for responsive layouts
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
    setAdIndex(Math.floor(Math.random() * SIMULATED_ADS_MONETAG.length));
  }, []);

  // Handle live Monetag script execution
  useEffect(() => {
    if (monetagEnabled && !isTrafficUnsafe && containerRef.current) {
      // Clear containers
      containerRef.current.innerHTML = '';
      
      const canShowMonetag = monetagEnabled && (
        (type === 'banner' && (isMobile ? (monetagMobileBannerTagId || monetagBannerTagId) : monetagBannerTagId)) ||
        (type === 'in-feed' && monetagInFeedTagId) ||
        (type === 'sticky-bottom' && monetagStickyTagId)
      );

      if (canShowMonetag) {
        let activeKey = "";
        if (type === 'banner') {
          activeKey = isMobile ? (monetagMobileBannerTagId || monetagBannerTagId || "") : (monetagBannerTagId || "");
        } else if (type === 'in-feed') {
          activeKey = (monetagInFeedTagId || "").trim();
        } else if (type === 'sticky-bottom') {
          activeKey = (monetagStickyTagId || "").trim();
        }

        if (activeKey) {
          try {
            if (activeKey.includes('<script')) {
              // Inject raw HTML safely
              const range = document.createRange();
              const documentFragment = range.createContextualFragment(activeKey);
              containerRef.current.appendChild(documentFragment);
            } else {
              // Build dynamic script
              const monetagScript = document.createElement('script');
              monetagScript.type = 'text/javascript';
              monetagScript.setAttribute('data-cfasync', 'false');
              monetagScript.async = true;
              
              if (activeKey.startsWith('http') || activeKey.startsWith('//') || activeKey.includes('.js')) {
                monetagScript.src = activeKey;
              } else {
                // Assume standard Zone ID and load from groleegni.net or common monetag direct endpoint
                monetagScript.src = `https://groleegni.net/601/${activeKey}/invoke.js`;
              }
              containerRef.current.appendChild(monetagScript);
            }
          } catch (scriptErr) {
            console.error("Monetag script loading exception:", scriptErr);
          }
        }
      }
    }
  }, [monetagEnabled, monetagBannerTagId, monetagMobileBannerTagId, monetagInFeedTagId, monetagStickyTagId, type, isMobile, isTrafficUnsafe]);

  if (!monetagEnabled || dismissed) return null;

  // ============================================
  // REAL LIVE MONETAG SCRIPT RENDERING
  // ============================================
  const hasRealTag = !isTrafficUnsafe && (
    (type === 'banner' && (isMobile ? (monetagMobileBannerTagId || monetagBannerTagId) : monetagBannerTagId)) ||
    (type === 'in-feed' && monetagInFeedTagId) ||
    (type === 'sticky-bottom' && monetagStickyTagId)
  );

  if (monetagEnabled && hasRealTag) {
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
      <div className={`monetag-wrapper my-6 overflow-hidden mx-auto text-center ${className}`}>
        <div className={`mx-auto ${containerWidth} flex items-center justify-between px-3 py-1 bg-blue-900 border border-blue-800 rounded-t-xl text-[9px] text-blue-300 font-bold`}>
          <div className="flex items-center gap-1.5 font-sans">
            <Flame size={10} className="text-blue-300 animate-bounce" />
            <span>MONETAG PREMIUM PARTNER SPONSOR</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="hover:underline text-[8.5px]">Secure Ad</span>
          </div>
        </div>
        <div 
          className={`bg-slate-950 border-x border-b border-slate-800 p-3 rounded-b-xl flex justify-center items-center ${containerHeight} mx-auto`}
          ref={containerRef}
          id={`ad-container-monetag-${type}`}
        />
      </div>
    );
  }

  // ============================================
  // HIGH-FIDELITY SIMULATED AD DESIGN (Monetag Fallback)
  // ============================================
  const currentAd = SIMULATED_ADS_MONETAG[adIndex % SIMULATED_ADS_MONETAG.length] || SIMULATED_ADS_MONETAG[0];

  if (type === 'sticky-bottom') {
    const isColorDark = (hexColor: string) => {
      if (!hexColor) return true; // default dark safety
      if (!hexColor.startsWith('#')) return true;
      const hex = hexColor.replace('#', '');
      if (hex.length === 3) {
        const r = parseInt(hex[0] + hex[0], 16);
        const g = parseInt(hex[1] + hex[1], 16);
        const b = parseInt(hex[2] + hex[2], 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return yiq < 128;
      }
      if (hex.length === 6) {
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return yiq < 128;
      }
      return true;
    };

    const isBgDark = isColorDark(bgColor);
    const resolvedBg = bgColor || 'rgba(15, 23, 42, 0.95)'; // fallback Slate-900

    return (
      <motion.div 
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="fixed bottom-16 sm:bottom-20 left-0 right-0 z-[40] px-4 md:px-8 pointer-events-none animate-in fade-in duration-300"
      >
        <div 
          className="max-w-4xl mx-auto rounded-2xl p-3 md:p-4 border shadow-2xl flex items-center justify-between gap-4 pointer-events-auto transition-all duration-300"
          style={{ 
            backgroundColor: resolvedBg, 
            borderColor: isBgDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)' 
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0 animate-pulse bg-blue-600 text-white">
              AD
            </span>
            <div className="min-w-0">
              <h5 className={`text-xs md:text-sm font-black truncate transition-colors ${isBgDark ? 'text-white' : 'text-slate-800'}`}>
                {currentAd.title}
              </h5>
              <p className={`text-[10px] md:text-xs truncate hidden sm:block transition-colors ${isBgDark ? 'text-slate-300' : 'text-slate-500'}`}>
                {currentAd.descr}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a 
              href={currentAd.url} 
              target="_blank" 
              rel="noreferrer"
              className="px-3.5 py-2 text-white font-black text-[10.5px] uppercase tracking-wider rounded-xl transition-all active:scale-95 flex items-center gap-1 shadow-sm bg-blue-600 hover:bg-blue-700"
            >
              <span>{currentAd.cta}</span>
              <ExternalLink size={10} />
            </a>
            <button 
              onClick={() => setDismissed(true)}
              className={`p-2 transition-colors animate-pulse cursor-pointer ${isBgDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
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
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-xl pointer-events-none bg-gradient-to-br from-blue-500/10 to-transparent" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="border border-black/10 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest shrink-0 shadow-sm text-white bg-blue-600">
              AD
            </span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{currentAd.badge}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
              Monetag Ads <HelpCircle size={10} />
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
          <h4 className="font-display text-base sm:text-lg font-black tracking-tight font-extrabold font-display text-blue-700">
            {currentAd.title}
          </h4>
          <p className="text-[11px] sm:text-xs font-semibold text-slate-600 leading-relaxed">
            {currentAd.descr}
          </p>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
            <span>monetag-invoke.js</span>
          </div>
          <a
            href={currentAd.url}
            target="_blank"
            rel="noreferrer"
            className="px-4.5 py-2.5 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer bg-blue-600 hover:bg-blue-700"
          >
            <span>{currentAd.cta}</span>
            <ExternalLink size={11} />
          </a>
        </div>
      </div>
    );
  }

  // General Banner style for Top/Bottom placements (default)
  return (
    <div className={`bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-2xs ${className}`}>
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50/80 border-b border-slate-100/50 text-[9px] text-slate-400 font-bold">
        <div className="flex items-center gap-1">
          <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider mr-1 text-white bg-blue-600">
            SPONSORED
          </span>
          <span>MONETAG PREMIUM MONETIZATION SIMULATOR</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hover:underline cursor-pointer">Ad Choices</span>
          <button onClick={() => setDismissed(true)} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={10} />
          </button>
        </div>
      </div>

      <div className={`p-5 sm:p-6 md:p-8 flex flex-col md:flex-row items-center gap-4 bg-gradient-to-r ${currentAd.bg}`}>
        <div className="w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs font-bold text-lg bg-blue-500/10 border-blue-500/10 text-blue-600">
          {currentAd.title.charAt(0)}
        </div>
        
        <div className="flex-1 min-w-0 text-center md:text-left space-y-1">
          <h4 className="text-sm sm:text-base font-black tracking-tight truncate text-blue-600">
            {currentAd.title}
          </h4>
          <p className="text-[11px] sm:text-xs text-slate-600 font-semibold line-clamp-2 leading-relaxed font-sans">
            {currentAd.descr}
          </p>
        </div>

        <div className="shrink-0 w-full md:w-auto flex flex-col sm:flex-row gap-2 mt-2 md:mt-0">
          <a
            href={currentAd.url}
            target="_blank"
            rel="noreferrer"
            className="flex-1 md:flex-initial px-5 py-3 text-white font-black text-[10px] uppercase tracking-widest transition-all text-center rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 bg-blue-600 hover:bg-blue-700"
          >
            <span>{currentAd.cta}</span>
            <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </div>
  );
};
