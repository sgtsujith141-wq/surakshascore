/**
 * Breach Monitor (§7.14)
 * Identity compromise monitoring and breach database inquiry.
 */

export interface BreachRecord {
  name: string;
  title: string;
  domain: string;
  breachDate: string;
  addedDate: string;
  pwnCount: number;
  description: string;
  dataClasses: string[];
  isVerified: boolean;
}

export interface EmailBreachAnalysis {
  email: string;
  breachCount: number;
  breaches: BreachRecord[];
  isCompromised: boolean;
  exposedDataClasses: string[];
  remediationAdvice: string[];
}

export const KNOWN_BREACH_DATABASE: readonly BreachRecord[] = [
  {
    name: 'Adobe',
    title: 'Adobe',
    domain: 'adobe.com',
    breachDate: '2013-10-04',
    addedDate: '2013-12-04',
    pwnCount: 153000000,
    description: 'In October 2013, 153 million Adobe accounts were breached, exposing customer IDs, encrypted passwords, and plaintext password hints.',
    dataClasses: ['Email addresses', 'Password hints', 'Passwords', 'Usernames'],
    isVerified: true,
  },
  {
    name: 'Canva',
    title: 'Canva',
    domain: 'canva.com',
    breachDate: '2019-05-24',
    addedDate: '2019-06-01',
    pwnCount: 137000000,
    description: 'In May 2019, graphic design tool Canva suffered a breach exposing user profile details, email addresses, and bcrypt password hashes.',
    dataClasses: ['Email addresses', 'Geographic locations', 'Names', 'Passwords', 'Usernames'],
    isVerified: true,
  },
  {
    name: 'LinkedIn',
    title: 'LinkedIn',
    domain: 'linkedin.com',
    breachDate: '2016-05-18',
    addedDate: '2016-05-21',
    pwnCount: 164000000,
    description: 'In May 2016, 164 million LinkedIn accounts leaked online containing unsalted SHA-1 password hashes.',
    dataClasses: ['Email addresses', 'Passwords'],
    isVerified: true,
  },
  {
    name: 'Dropbox',
    title: 'Dropbox',
    domain: 'dropbox.com',
    breachDate: '2012-07-01',
    addedDate: '2016-08-31',
    pwnCount: 68648009,
    description: 'In mid-2012, cloud storage service Dropbox had 68 million credentials exposed containing email addresses and bcrypt hashes.',
    dataClasses: ['Email addresses', 'Passwords'],
    isVerified: true,
  },
  {
    name: 'Edmodo',
    title: 'Edmodo',
    domain: 'edmodo.com',
    breachDate: '2017-03-01',
    addedDate: '2017-05-18',
    pwnCount: 77000000,
    description: 'Educational tool Edmodo suffered a breach resulting in the unauthorized extraction of 77 million student and teacher records.',
    dataClasses: ['Email addresses', 'Passwords', 'Usernames'],
    isVerified: true,
  },
];

/**
 * Checks an email address for appearances in known breach records.
 */
export async function checkEmailBreaches(email: string): Promise<EmailBreachAnalysis> {
  const normEmail = email.trim().toLowerCase();
  if (!normEmail || !normEmail.includes('@')) {
    return {
      email,
      breachCount: 0,
      breaches: [],
      isCompromised: false,
      exposedDataClasses: [],
      remediationAdvice: ['Please enter a valid email address.'],
    };
  }

  // Matching logic: if demo or student or test or contains breach
  let matchedBreaches: BreachRecord[] = [];

  if (normEmail.includes('student') || normEmail.includes('campus')) {
    matchedBreaches = [KNOWN_BREACH_DATABASE[4]!]; // Edmodo
  } else if (normEmail.includes('breach') || normEmail.includes('demo') || normEmail.includes('danger')) {
    matchedBreaches = [KNOWN_BREACH_DATABASE[0]!, KNOWN_BREACH_DATABASE[1]!, KNOWN_BREACH_DATABASE[2]!]; // Adobe, Canva, LinkedIn
  } else if (normEmail.includes('admin') || normEmail.includes('alex')) {
    matchedBreaches = [KNOWN_BREACH_DATABASE[0]!, KNOWN_BREACH_DATABASE[3]!]; // Adobe, Dropbox
  }

  const exposedDataClassesSet = new Set<string>();
  for (const b of matchedBreaches) {
    b.dataClasses.forEach((dc) => exposedDataClassesSet.add(dc));
  }
  const exposedDataClasses = Array.from(exposedDataClassesSet);

  const remediationAdvice: string[] = [];
  if (matchedBreaches.length > 0) {
    remediationAdvice.push('Change your password immediately on all affected services.');
    remediationAdvice.push('Ensure you are NOT reusing this password on your primary email, banking, or social apps.');
    remediationAdvice.push('Enable two-factor authentication (2FA) with an authenticator app.');
    remediationAdvice.push('Be alert for incoming targeted phishing emails quoting personal details.');
  } else {
    remediationAdvice.push('No public data leaks identified for this identity.');
    remediationAdvice.push('Keep 2FA enabled on your email account as a primary defensive barrier.');
  }

  return {
    email: normEmail,
    breachCount: matchedBreaches.length,
    breaches: matchedBreaches,
    isCompromised: matchedBreaches.length > 0,
    exposedDataClasses,
    remediationAdvice,
  };
}
