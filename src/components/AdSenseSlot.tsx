import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { ExternalLink, HelpCircle, X, Flame } from 'lucide-react';

interface AdSenseSlotProps {
  type: 'banner' | 'square' | 'sidebar' | 'in-feed' | 'sticky-bottom';
  className?: string;

  adsterraEnabled?: boolean;
  adsterraBannerKey?: string;
  adsterraMobileBannerKey?: string;
  adsterraInFeedKey?: string;
  adsterraStickyKey?: string;
  bgColor?: string;
}

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
  type,
  className = "",

  // Props with default fallback values connected to local storage or fallback to system active status
  adsterraEnabled = true,
  adsterraBannerKey = "",
  adsterraMobileBannerKey = "",
  adsterraInFeedKey = "",
  adsterraStickyKey = "",
  bgColor = ""
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
    setAdIndex(Math.floor(Math.random() * SIMULATED_ADS_ADSTERRA.length));
  }, []);

  // Handle live Adsterra script execution
  useEffect(() => {
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
  }, [adsterraEnabled, adsterraBannerKey, adsterraMobileBannerKey, adsterraInFeedKey, adsterraStickyKey, type, isMobile]);

  if (dismissed || !adsterraEnabled) return null;

  // Set active simulated ad information
  const currentAd = SIMULATED_ADS_ADSTERRA[adIndex] || SIMULATED_ADS_ADSTERRA[0];

  // ============================================
  // CASE 1: REAL LIVE ADSTERRA SCRIPT RENDERING
  // ============================================
  const hasLiveAdsterraKey = adsterraEnabled && (
    (type === 'banner' && (isMobile ? (adsterraMobileBannerKey || adsterraBannerKey) : adsterraBannerKey)) ||
    (type === 'in-feed' && adsterraInFeedKey) ||
    (type === 'sticky-bottom' && adsterraStickyKey)
  );

  if (hasLiveAdsterraKey) {
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
  // CASE 2: HIGH-FIDELITY SIMULATED AD DESIGN
  // ============================================
  
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
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0 animate-pulse ${isBgDark ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'}`}>
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
              className="px-3.5 py-2 text-white font-black text-[10.5px] uppercase tracking-wider rounded-xl transition-all active:scale-95 flex items-center gap-1 shadow-sm bg-[#6366F1] hover:bg-indigo-700"
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
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-xl pointer-events-none bg-gradient-to-br from-indigo-500/10 to-transparent" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="border border-black/10 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest shrink-0 shadow-sm bg-indigo-600 text-white">
              AD
            </span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{currentAd.badge}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
              Adsterra Ads <HelpCircle size={10} />
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
          <h4 className="font-display text-base sm:text-lg font-black tracking-tight text-indigo-700 font-extrabold font-display">
            {currentAd.title}
          </h4>
          <p className="text-[11px] sm:text-xs font-semibold text-slate-600 leading-relaxed">
            {currentAd.descr}
          </p>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
            <span>adsterra-invoke.js</span>
          </div>
          <a
            href={currentAd.url}
            target="_blank"
            rel="noreferrer"
            className="px-4.5 py-2.5 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer bg-indigo-600 hover:bg-slate-900"
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
          <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider mr-1 text-white bg-indigo-600">
            SPONSORED
          </span>
          <span>ADSTERRA PREMIUM MONETIZATION SIMULATOR</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hover:underline cursor-pointer">Ad Choices</span>
          <button onClick={() => setDismissed(true)} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={10} />
          </button>
        </div>
      </div>

      <div className={`p-5 sm:p-6 md:p-8 flex flex-col md:flex-row items-center gap-4 bg-gradient-to-r ${currentAd.bg}`}>
        <div className="w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs font-bold text-lg bg-indigo-500/10 border-indigo-500/10 text-indigo-600">
          {currentAd.title.charAt(0)}
        </div>
        
        <div className="flex-1 min-w-0 text-center md:text-left space-y-1">
          <h4 className="text-sm sm:text-base font-black tracking-tight text-indigo-600 truncate">
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
            className="flex-1 md:flex-initial px-5 py-3 text-white font-black text-[10px] uppercase tracking-widest transition-all text-center rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 bg-indigo-600 hover:bg-indigo-700"
          >
            <span>{currentAd.cta}</span>
            <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </div>
  );
};
