export interface AdSecurityState {
  isVpnDetected: boolean;
  isAdBlockDetected: boolean;
  isChecking: boolean;
  ipAddress: string;
  country: string;
}

let state: AdSecurityState = {
  isVpnDetected: false,
  isAdBlockDetected: false,
  isChecking: true,
  ipAddress: '',
  country: '',
};

const listeners = new Set<(s: AdSecurityState) => void>();

export function subscribeToAdSecurity(listener: (s: AdSecurityState) => void) {
  listeners.add(listener);
  // Send current state immediately
  listener(state);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  listeners.forEach((l) => l(state));
}

/**
 * Robust AdBlocker Detection
 * 1. Checks if a honeypot element with ad-related classes gets blocked/hidden by the browser.
 * 2. Attempts to fetch a known Monetag/Google Ad script endpoint. If it fails due to network blocking, AdBlock is confirmed.
 */
export async function detectAdBlocker(): Promise<boolean> {
  let isBlocked = false;

  // Method A: Honeypot element
  try {
    const bait = document.createElement('div');
    // Using classic ad-blocker target classes
    bait.className = 'adsbox ad-zone ad-banner ad-placement ad-placeholder ads-partner doubleclick-ad';
    bait.setAttribute('style', 'position: absolute; left: -9999px; top: -9999px; width: 1px; height: 1px; block-size: 1px; display: block !important;');
    document.body.appendChild(bait);

    // Small delay to allow AdBlockers to intercept/hide the element
    await new Promise((resolve) => setTimeout(resolve, 50));

    const styles = window.getComputedStyle(bait);
    if (
      bait.offsetHeight === 0 ||
      bait.offsetWidth === 0 ||
      styles.display === 'none' ||
      styles.visibility === 'hidden'
    ) {
      isBlocked = true;
    }
    document.body.removeChild(bait);
  } catch (e) {
    // Ignore element check failure
  }

  if (isBlocked) return true;

  // Method B: Script Fetch honeypot (tries fetching a known ad-serving URL)
  try {
    // Requesting a standard ad script with a low timeout to detect local network request blockage
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    await fetch('https://groleegni.net/601/invoke.js', {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(timeoutId);
  } catch (e: any) {
    // AdBlockers typically trigger 'TypeError: Failed to fetch' or 'Failed to load resource'
    isBlocked = true;
  }

  return isBlocked;
}

/**
 * Robust VPN/Proxy and Datacenter IP Detection
 * Uses secure free IP intelligence APIs (freeipapi.com and ipwhois.app) to check proxy/VPN flags.
 */
export async function detectVPN(): Promise<{ isVpn: boolean; ip: string; country: string }> {
  // 1. Check local session cache to avoid redundant API queries and keep loads fast
  const cachedVpn = sessionStorage.getItem('ad_sec_vpn');
  const cachedIp = sessionStorage.getItem('ad_sec_ip');
  const cachedCountry = sessionStorage.getItem('ad_sec_country');

  if (cachedVpn !== null) {
    return {
      isVpn: cachedVpn === 'true',
      ip: cachedIp || '',
      country: cachedCountry || '',
    };
  }

  let isVpn = false;
  let ip = '';
  let country = '';

  // Attempt API 1: Free IP API (Highly reliable, returns isProxy boolean)
  try {
    const res = await fetch('https://freeipapi.com/api/json');
    if (res.ok) {
      const data = await res.json();
      ip = data.ipAddress || '';
      country = data.countryName || '';
      // isProxy flags proxies, VPNs, Tor, and hostings
      if (data.isProxy === true) {
        isVpn = true;
      }
      
      // Secondary heuristic: If country is not Bangladesh (BD) and not empty,
      // can be a strong indicator if the target audience is strictly Bangladesh,
      // but let's be safe and rely strictly on the official proxy flags first.
    }
  } catch (e) {
    // Fallback to API 2
  }

  // Attempt API 2 (Fallback): IPWhois (returns detailed security metrics including vpn, proxy, tor, hosting)
  if (!ip) {
    try {
      const res = await fetch('https://ipwhois.app/json/');
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          ip = data.ip || '';
          country = data.country || '';
          
          if (data.security) {
            isVpn = 
              data.security.vpn === true || 
              data.security.proxy === true || 
              data.security.tor === true || 
              data.security.hosting === true;
          }
        }
      }
    } catch (e) {
      // Fallback: If both fail, default to false (safe approach)
    }
  }

  // Cache outcomes
  sessionStorage.setItem('ad_sec_vpn', String(isVpn));
  sessionStorage.setItem('ad_sec_ip', ip);
  sessionStorage.setItem('ad_sec_country', country);

  return { isVpn, ip, country };
}

/**
 * Initializes the combined ad security check
 */
export async function initializeAdSecurity(): Promise<AdSecurityState> {
  state.isChecking = true;
  notifyListeners();

  try {
    const [adBlockActive, vpnResult] = await Promise.all([
      detectAdBlocker(),
      detectVPN().catch(() => ({ isVpn: false, ip: '', country: '' }))
    ]);

    state = {
      isVpnDetected: vpnResult.isVpn,
      isAdBlockDetected: adBlockActive,
      isChecking: false,
      ipAddress: vpnResult.ip,
      country: vpnResult.country,
    };
  } catch (err) {
    state.isChecking = false;
  }

  notifyListeners();
  return state;
}

export function getAdSecurityState(): AdSecurityState {
  return state;
}
