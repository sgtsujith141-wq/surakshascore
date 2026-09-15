/**
 * Suspicious Link Scanner (§7.8)
 * Client-side heuristic URL analyzer and phishing domain detector.
 */

export type LinkVerdict = 'SAFE' | 'SUSPICIOUS' | 'MALICIOUS';

export interface LinkAnalysisResult {
  url: string;
  domain: string;
  verdict: LinkVerdict;
  riskScore: number; // 0 - 100
  redFlags: string[];
  protocol: 'https:' | 'http:' | 'unknown';
  isIpHost: boolean;
  hasPunycode: boolean;
  hasSuspiciousTld: boolean;
  hasTyposquatting: boolean;
  hasDeceptivePath: boolean;
  recommendations: string[];
}

const HIGH_RISK_TLDS = new Set([
  '.xyz',
  '.top',
  '.click',
  '.work',
  '.gq',
  '.cf',
  '.ml',
  '.fit',
  '.loan',
  '.download',
  '.racing',
  '.rest',
]);

const TARGETED_BRANDS = [
  'paypal',
  'google',
  'apple',
  'microsoft',
  'netflix',
  'amazon',
  'facebook',
  'instagram',
  'hdfc',
  'sbi',
  'icici',
  'chase',
  'bankofamerica',
  'wellsfargo',
  'binance',
  'coinbase',
];

const DECEPTIVE_KEYWORDS = [
  'login',
  'signin',
  'verify',
  'verification',
  'account-suspended',
  'security-alert',
  'update-billing',
  'kyc-update',
  'otp-confirm',
  'secure-banking',
  'password-reset',
  'free-gift',
  'claim-reward',
];

/**
 * Evaluates a URL against phishing heuristics.
 */
export function analyzeSuspiciousLink(rawUrl: string): LinkAnalysisResult {
  let urlStr = rawUrl.trim();
  if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
    urlStr = `https://${urlStr}`;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(urlStr);
  } catch {
    return {
      url: rawUrl,
      domain: 'invalid-url',
      verdict: 'MALICIOUS',
      riskScore: 90,
      redFlags: ['Invalid URL format / malformed syntax'],
      protocol: 'unknown',
      isIpHost: false,
      hasPunycode: false,
      hasSuspiciousTld: false,
      hasTyposquatting: false,
      hasDeceptivePath: false,
      recommendations: ['Do not open malformed or non-standard link strings.'],
    };
  }

  const redFlags: string[] = [];
  let penalty = 0;

  const hostname = parsedUrl.hostname.toLowerCase();
  const pathname = parsedUrl.pathname.toLowerCase();
  const protocol = parsedUrl.protocol as 'http:' | 'https:';

  // 1. IP Address as Hostname
  const isIpHost = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
  if (isIpHost) {
    redFlags.push('Raw IP address used as hostname instead of a registered domain');
    penalty += 45;
  }

  // 2. Punycode / Homoglyphs
  const hasPunycode = hostname.startsWith('xn--') || hostname.includes('.xn--');
  if (hasPunycode) {
    redFlags.push('Punycode internationalized domain detected (common homoglyph spoofing)');
    penalty += 40;
  }

  // 3. Unencrypted HTTP
  if (protocol === 'http:') {
    redFlags.push('Unencrypted HTTP protocol — communication can be intercepted');
    penalty += 20;
  }

  // 4. Suspicious TLD
  const hasSuspiciousTld = Array.from(HIGH_RISK_TLDS).some((tld) => hostname.endsWith(tld));
  if (hasSuspiciousTld) {
    redFlags.push('High-risk top-level domain frequently associated with throwaway phishing campaigns');
    penalty += 25;
  }

  // 5. Excessive Subdomains (e.g. login.secure.bank.verify.evil.com)
  const domainParts = hostname.split('.');
  if (domainParts.length > 4 && !isIpHost) {
    redFlags.push(`Excessive subdomain nesting (${domainParts.length} levels) disguising true domain`);
    penalty += 25;
  }

  // 6. Brand Typosquatting / Lookalike names (e.g. paypa1, g00gle, micros0ft)
  let hasTyposquatting = false;
  const normalizedHostname = hostname
    .replace(/1/g, 'l')
    .replace(/0/g, 'o')
    .replace(/5/g, 's')
    .replace(/3/g, 'e')
    .replace(/8/g, 'b')
    .replace(/@/g, 'a')
    .replace(/vv/g, 'w')
    .replace(/rn/g, 'm');

  for (const brand of TARGETED_BRANDS) {
    if (hostname.includes(brand) || normalizedHostname.includes(brand)) {
      // Check if it's the real brand domain or a deceptive sub-keyword
      const isOfficial =
        hostname === `${brand}.com` ||
        hostname === `www.${brand}.com` ||
        hostname.endsWith(`.${brand}.com`) ||
        hostname.endsWith(`.${brand}.co.in`) ||
        hostname.endsWith(`.${brand}.org`);

      if (!isOfficial) {
        hasTyposquatting = true;
        redFlags.push(`Deceptive brand typosquatting / spoofing match ("${brand}") on unverified domain`);
        penalty += 45;
        break;
      }
    }
  }

  // 7. Deceptive Keywords in Path / Query
  let hasDeceptivePath = false;
  const fullPath = `${pathname}${parsedUrl.search}`.toLowerCase();
  for (const kw of DECEPTIVE_KEYWORDS) {
    if (fullPath.includes(kw)) {
      hasDeceptivePath = true;
      redFlags.push(`Suspicious authentication/urgency keyword in URL path ("${kw}")`);
      penalty += 20;
      break;
    }
  }

  const riskScore = Math.min(100, Math.max(0, penalty));

  let verdict: LinkVerdict = 'SAFE';
  if (riskScore >= 60 || isIpHost || (hasTyposquatting && hasDeceptivePath)) {
    verdict = 'MALICIOUS';
  } else if (riskScore >= 25) {
    verdict = 'SUSPICIOUS';
  }

  const recommendations: string[] = [];
  if (verdict === 'MALICIOUS') {
    recommendations.push('Do NOT click this link or enter passwords / OTPs.');
    recommendations.push('Delete the message and report sender as spam/phishing.');
  } else if (verdict === 'SUSPICIOUS') {
    recommendations.push('Proceed with caution — verify domain spelling manually.');
    recommendations.push('Check the official website by typing the address directly in your browser.');
  } else {
    recommendations.push('No obvious phishing anomalies detected in URL heuristics.');
    recommendations.push('Always ensure the browser shows a secure padlock before logging in.');
  }

  return {
    url: rawUrl,
    domain: hostname,
    verdict,
    riskScore,
    redFlags,
    protocol,
    isIpHost,
    hasPunycode,
    hasSuspiciousTld,
    hasTyposquatting,
    hasDeceptivePath,
    recommendations,
  };
}
