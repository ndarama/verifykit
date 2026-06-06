/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CompanyData,
  ExtractedIdData,
  VerificationRecord,
  LogEntry
} from './types';

// Helper function to create standard log entries
function makeLog(
  type: LogEntry['type'],
  message: string
): LogEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toLocaleTimeString(),
    type,
    message,
  };
}

/**
 * Levenshtein distance calculator for name similarity matching
 */
function getLevenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const d: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let j = 1; j <= n; j++) {
    for (let i = 1; i <= m; i++) {
      const substitutionCost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + substitutionCost // substitution
      );
    }
  }
  return d[m][n];
}

/**
 * Name similarity algorithm using a hybrid Levenshtein distance and word overlap ratio.
 * This satisfies accepting variations or other IDs with high similarity.
 */
export function getNameSimilarity(name1: string, name2: string): number {
  const norm1 = name1.toLowerCase().trim().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ');
  const norm2 = name2.toLowerCase().trim().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ');

  if (norm1 === norm2) return 1.0;
  if (!norm1 || !norm2) return 0.0;

  // Exact flat match comparison
  const flat1 = norm1.replace(/\s+/g, '');
  const flat2 = norm2.replace(/\s+/g, '');
  if (flat1 === flat2) return 1.0;

  // Levenshtein similarity
  const maxLen = Math.max(norm1.length, norm2.length);
  const dist = getLevenshteinDistance(norm1, norm2);
  const levSimilarity = 1 - dist / maxLen;

  // Word overlap ratio
  const words1 = norm1.split(' ').filter(w => w.length > 1);
  const words2 = norm2.split(' ').filter(w => w.length > 1);

  if (words1.length === 0 || words2.length === 0) {
    return levSimilarity;
  }

  let commonWordsCount = 0;
  for (const w of words1) {
    if (words2.includes(w)) {
      commonWordsCount++;
    }
  }

  const overlapRatio1 = commonWordsCount / words1.length;
  const overlapRatio2 = commonWordsCount / words2.length;
  const wordOverlapSimilarity = Math.max(overlapRatio1, overlapRatio2);

  return Math.max(levSimilarity, wordOverlapSimilarity);
}


/**
 * Recursive validator helper to meet requirements
 */
export function recursiveValidate(obj: any, path: string = ''): void {
  if (obj === null || obj === undefined) {
    throw new Error(`Validation Error: Field at '${path}' is missing or undefined.`);
  }

  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) {
      throw new Error(`Validation Error: Entity at '${path}' has no properties.`);
    }
    for (const key of keys) {
      // Don't validate password field itself inside recursively, to avoid empty checks if omitted,
      // but standard fields must be populated
      if (key === 'password' && obj[key] === undefined) continue;
      recursiveValidate(obj[key], path ? `${path}.${key}` : key);
    }
  } else if (typeof obj === 'string') {
    if (obj.trim() === '') {
      throw new Error(`Validation Error: '${path || 'Field'}' cannot be empty.`);
    }
  } else if (typeof obj === 'number') {
    if (isNaN(obj)) {
      throw new Error(`Validation Error: '${path || 'Field'}' is an invalid number.`);
    }
  }
}

/**
 * Company Class
 */
export class Company {
  public name: string;
  public email: string;
  public contact: string;

  constructor(name: string, email: string, contact: string) {
    this.name = name;
    this.email = email;
    this.contact = contact;
  }
}

/**
 * CompanyUser Class
 */
export class CompanyUser {
  public repName: string;
  public repPosition: string;
  public email: string;
  public passwordHash: string; // Stored simply for mock system
  public company: Company;

  constructor(
    repName: string,
    repPosition: string,
    email: string,
    passwordHash: string,
    company: Company
  ) {
    this.repName = repName;
    this.repPosition = repPosition;
    this.email = email;
    this.passwordHash = passwordHash;
    this.company = company;
  }
}

/**
 * VerificationRequest Class
 */
export class VerificationRequest {
  public id: string;
  public name: string;
  public position: string;
  public email: string;
  public contact: string;
  public timestamp: string;

  constructor(data: { name: string; position: string; email: string; contact: string }) {
    this.id = `REQ-${Math.floor(100000 + Math.random() * 900000)}`;
    this.name = data.name;
    this.position = data.position;
    this.email = data.email;
    this.contact = data.contact;
    this.timestamp = new Date().toLocaleString();
  }
}

export const RWANDAN_PRESETS = [
  {
    key: 'jean_claude',
    name: 'Jean Claude Habimana',
    fileName: 'jean_claude_id.jpg',
    defaultPosition: 'Senior Cloud Engineer',
    defaultEmail: 'jean.claude@techlabs.com',
    defaultPhone: '+250 788 998 877',
    extracted: {
      document: 'International ID',
      country: 'Republic of Rwanda',
      names: 'Jean Claude Habimana',
      idNo: '198 7654 3210 5',
      dob: '23/05/1994',
      sex: 'G',
      nationality: 'Rwandan',
      placeOfIssue: 'Kigali',
      dateOfIssue: '15/04/2024',
      expiry: '14/04/2034',
      cardNo: 'A9876543210',
      placeOfIssueBack: 'Kigali',
      dateOfIssueBack: '15/04/2024',
      validUntil: '14/04/2034',
      placeOfBirth: 'Huye',
      nationalityBack: 'Rwandan',
      religion: 'Kiliziya Gatolika',
      address: 'KG 15 AVE 12, Nyamirambo, Kigali',
      bloodGroup: 'O+',
      containsDemoText: true,
      containsSampleText: true,
      similarityScore: 1.0
    }
  },
  {
    key: 'claudine',
    name: 'Claudine Mukamana',
    fileName: 'claudine_mukamana_id.jpg',
    defaultPosition: 'Operations Lead',
    defaultEmail: 'claudine.mukamana@ops.rw',
    defaultPhone: '+250 788 765 432',
    extracted: {
      document: 'International ID',
      country: 'Republic of Rwanda',
      names: 'Claudine Mukamana',
      idNo: '198 7654 3210 7',
      dob: '04/09/1996',
      sex: 'F',
      nationality: 'Rwandan',
      placeOfIssue: 'Nyarugenge',
      dateOfIssue: '18/05/2024',
      expiry: '17/05/2034',
      cardNo: 'A9876543211',
      placeOfIssueBack: 'Nyarugenge',
      dateOfIssueBack: '18/05/2024',
      validUntil: '17/05/2034',
      placeOfBirth: 'Ruhango',
      nationalityBack: 'Rwandan',
      religion: 'Protestant',
      address: 'KN 3 RD 45, Kiyovu, Kigali',
      bloodGroup: 'A+',
      containsDemoText: true,
      containsSampleText: true,
      similarityScore: 1.0
    }
  },
  {
    key: 'eric',
    name: 'Eric Nsengiyumva',
    fileName: 'eric_nsengiyumva_id.jpg',
    defaultPosition: 'Financial Analyst',
    defaultEmail: 'eric.nsengiyumva@finance.gov.rw',
    defaultPhone: '+250 782 112 233',
    extracted: {
      document: 'International ID',
      country: 'Republic of Rwanda',
      names: 'Eric Nsengiyumva',
      idNo: '198 7654 9876 2',
      dob: '23/05/1992',
      sex: 'G',
      nationality: 'Rwandan',
      placeOfIssue: 'Huye',
      dateOfIssue: '15/05/2023',
      expiry: '15/05/2033',
      cardNo: 'A9876543212',
      placeOfIssueBack: 'Huye',
      dateOfIssueBack: '15/05/2023',
      validUntil: '15/05/2033',
      placeOfBirth: 'Huye',
      nationalityBack: 'Rwandan',
      religion: 'Islam',
      address: 'HU 12 ST 8, Taba, Huye',
      bloodGroup: 'B+',
      containsDemoText: true,
      containsSampleText: true,
      similarityScore: 1.0
    }
  },
  {
    key: 'diane',
    name: 'Diane Uwase',
    fileName: 'diane_uwase_id.jpg',
    defaultPosition: 'UI/UX Designer',
    defaultEmail: 'diane.uwase@designstudio.rw',
    defaultPhone: '+250 783 456 789',
    extracted: {
      document: 'International ID',
      country: 'Republic of Rwanda',
      names: 'Diane Uwase',
      idNo: '198 7654 3210 7',
      dob: '22/03/1998',
      sex: 'F',
      nationality: 'Rwandan',
      placeOfIssue: 'Kigali',
      dateOfIssue: '18/05/2024',
      expiry: '17/05/2034',
      cardNo: 'A9876543213',
      placeOfIssueBack: 'Kigali',
      dateOfIssueBack: '18/05/2024',
      validUntil: '17/05/2034',
      placeOfBirth: 'Rubavu',
      nationalityBack: 'Rwandan',
      religion: 'Kiliziya Gatolika',
      address: 'KG 28 AVE 15, Kimihurura, Kigali',
      bloodGroup: 'O-',
      containsDemoText: true,
      containsSampleText: true,
      similarityScore: 1.0
    }
  },
  {
    key: 'patrick',
    name: 'Patrick Niyonkuru',
    fileName: 'patrick_niyonkuru_id.jpg',
    defaultPosition: 'Logistics Supervisor',
    defaultEmail: 'patrick.niyonkuru@cargo.rw',
    defaultPhone: '+250 785 678 901',
    extracted: {
      document: 'International ID',
      country: 'Republic of Rwanda',
      names: 'Patrick Niyonkuru',
      idNo: '123 4567 8901 2',
      dob: '15/05/1992',
      sex: 'M',
      nationality: 'Rwandan',
      placeOfIssue: 'Huye',
      dateOfIssue: '20/02/2024',
      expiry: '19/02/2034',
      cardNo: 'A9876543214',
      placeOfIssueBack: 'Huye',
      dateOfIssueBack: '20/02/2024',
      validUntil: '19/02/2034',
      placeOfBirth: 'Gisenyi',
      nationalityBack: 'Rwandan',
      religion: 'Adventist',
      address: 'ST 124, Nyamasheke, Western',
      bloodGroup: 'AB+',
      containsDemoText: true,
      containsSampleText: true,
      similarityScore: 1.0
    }
  },
  {
    key: 'grace',
    name: 'Grace Ingabire',
    fileName: 'grace_ingabire_id.jpg',
    defaultPosition: 'HR Specialist',
    defaultEmail: 'grace.ingabire@talent.rw',
    defaultPhone: '+250 786 789 012',
    extracted: {
      document: 'International ID',
      country: 'Republic of Rwanda',
      names: 'Grace Ingabire',
      idNo: '198 7654 3210 4',
      dob: '22/07/1992',
      sex: 'F',
      nationality: 'Rwandan',
      placeOfIssue: 'Musanze',
      dateOfIssue: '18/05/2024',
      expiry: '17/05/2033',
      cardNo: 'A9876543215',
      placeOfIssueBack: 'Musanze',
      dateOfIssueBack: '18/05/2024',
      validUntil: '17/05/2033',
      placeOfBirth: 'Musanze',
      nationalityBack: 'Rwandan',
      religion: 'Protestant',
      address: 'MU 45 AVE 3, Ruhengeri, Musanze',
      bloodGroup: 'A-',
      containsDemoText: true,
      containsSampleText: true,
      similarityScore: 1.0
    }
  },
  {
    key: 'aimable',
    name: 'Aimable Ndayisaba',
    fileName: 'aimable_ndayisaba_id.jpg',
    defaultPosition: 'Marketing Director',
    defaultEmail: 'aimable.ndayisaba@media.rw',
    defaultPhone: '+250 787 890 123',
    extracted: {
      document: 'International ID',
      country: 'Republic of Rwanda',
      names: 'Aimable Ndayisaba',
      idNo: '198 7654 3210 3',
      dob: '23/04/1997',
      sex: 'M',
      nationality: 'Rwandan',
      placeOfIssue: 'Kigali',
      dateOfIssue: '15/05/2024',
      expiry: '15/05/2034',
      cardNo: 'A9876543216',
      placeOfIssueBack: 'Kigali',
      dateOfIssueBack: '15/05/2024',
      validUntil: '15/05/2034',
      placeOfBirth: 'Nyanza',
      nationalityBack: 'Rwandan',
      religion: 'Kiliziya Gatolika',
      address: 'KG 19 AVE 22, Kicukiro, Kigali',
      bloodGroup: 'O+',
      containsDemoText: true,
      containsSampleText: true,
      similarityScore: 1.0
    }
  },
  {
    key: 'sandrine',
    name: 'Sandrine Kayitesi',
    fileName: 'sandrine_kayitesi_id.jpg',
    defaultPosition: 'Data Scientist',
    defaultEmail: 'sandrine.kayitesi@dataminds.rw',
    defaultPhone: '+250 789 901 234',
    extracted: {
      document: 'International ID',
      country: 'Republic of Rwanda',
      names: 'Sandrine Kayitesi',
      idNo: '198 2345 6789 2',
      dob: '23/05/1998',
      sex: 'F',
      nationality: 'Rwandan',
      placeOfIssue: 'Kigali',
      dateOfIssue: '02/05/2024',
      expiry: '02/05/2034',
      cardNo: 'A9876543217',
      placeOfIssueBack: 'Kigali',
      dateOfIssueBack: '02/05/2024',
      validUntil: '02/05/2034',
      placeOfBirth: 'Byumba',
      nationalityBack: 'Rwandan',
      religion: 'Protestant',
      address: 'KG 121 ST 4, Remera, Kigali',
      bloodGroup: 'B-',
      containsDemoText: true,
      containsSampleText: true,
      similarityScore: 1.0
    }
  },
  {
    key: 'emmanuel',
    name: 'Emmanuel Rutayisire',
    fileName: 'emmanuel_rutayisire_id.jpg',
    defaultPosition: 'Procurement Specialist',
    defaultEmail: 'emmanuel.rutayisire@trade.rw',
    defaultPhone: '+250 781 234 567',
    extracted: {
      document: 'International ID',
      country: 'Republic of Rwanda',
      names: 'Emmanuel Rutayisire',
      idNo: '195 3876 5321 0',
      dob: '27/09/1985',
      sex: 'G',
      nationality: 'Rwandan',
      placeOfIssue: 'Kigali',
      dateOfIssue: '20/05/2024',
      expiry: '20/05/2034',
      cardNo: 'A9876543218',
      placeOfIssueBack: 'Kigali',
      dateOfIssueBack: '20/05/2024',
      validUntil: '20/05/2034',
      placeOfBirth: 'Gitarama',
      nationalityBack: 'Rwandan',
      religion: 'Christian',
      address: 'KK 150 ST 12, Kanombe, Kigali',
      bloodGroup: 'O+',
      containsDemoText: true,
      containsSampleText: true,
      similarityScore: 1.0
    }
  },
  {
    key: 'bella',
    name: 'Bella Umutoni',
    fileName: 'bella_umutoni_id.jpg',
    defaultPosition: 'Public Relations Officer',
    defaultEmail: 'bella.umutoni@pragency.rw',
    defaultPhone: '+250 784 567 890',
    extracted: {
      document: 'International ID',
      country: 'Republic of Rwanda',
      names: 'Bella Umutoni',
      idNo: '198 7654 3210 8',
      dob: '23/05/1992',
      sex: 'F',
      nationality: 'Rwandan',
      placeOfIssue: 'Kigali',
      dateOfIssue: '28/02/2024',
      expiry: '27/02/2034',
      cardNo: 'A9876543219',
      placeOfIssueBack: 'Kigali',
      dateOfIssueBack: '28/02/2024',
      validUntil: '27/02/2034',
      placeOfBirth: 'Kigali',
      nationalityBack: 'Rwandan',
      religion: 'Kiliziya Gatolika',
      address: 'KG 14 AVE 2, Nyarutarama, Kigali',
      bloodGroup: 'A+',
      containsDemoText: true,
      containsSampleText: true,
      similarityScore: 1.0
    }
  }
];

/**
 * Intelligent helper to auto-populate high-fidelity Rwandan ID card fields from a selected filename.
 */
/**
 * Simple hash helper to produce deterministic numbers of any filename.
 * This guarantees the exact same document attributes are extracted every time
 * and completely avoids randomizing/imagining different fields on recheck.
 */
function getDeterministicHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Intelligent helper to auto-populate high-fidelity Rwandan ID card fields from a selected filename.
 */
export function generateRwandanIDFromFilename(fileName: string): ExtractedIdData {
  // 1. Clean the file name as a candidate name
  const baseName = fileName.replace(/\.[^/.]+$/, ""); // remove extension
  const cleanBase = baseName.replace(/[_\-\.]+/g, " ").trim(); // replace separators
  const tokens = cleanBase.split(/\s+/);
  const hash = getDeterministicHash(fileName);
  
  const maleFirstNames = ['Jean Paul', 'Emile', 'Eric', 'Patrick', 'Aimable', 'Jean Claude', 'Emmanuel', 'Thierry', 'Olivier', 'Christian', 'Gaspard', 'Dieudonné', 'Fidèle', 'Ephrem'];
  const femaleFirstNames = ['Claudine', 'Diane', 'Grace', 'Sandrine', 'Bella', 'Aline', 'Fiona', 'Yvette', 'Angelique', 'Divine', 'Liliane', 'Chantal', 'Solange'];
  const lastNames = ['Habimana', 'Mukamana', 'Nsengiyumva', 'Uwase', 'Niyonkuru', 'Ingabire', 'Ndayisaba', 'Kayitesi', 'Rutayisire', 'Umutoni', 'Bizimana', 'Kagame', 'Kamaraba', 'Munyakazi', 'Gatete', 'Ntaganda', 'Murenzi', 'Rurangwa', 'Mugisha'];

  // Try to parse variables precisely from the filename string:
  let foundIdNo = "";
  // Look for any 15 to 17 digit string
  const idMatch = fileName.match(/\b\d{15,17}\b/) || fileName.match(/\d{15,17}/);
  if (idMatch) {
    foundIdNo = idMatch[0];
  } else {
    // Check if there is any 16-digit run
    const allDigits = fileName.replace(/\D/g, "");
    if (allDigits.length >= 15 && allDigits.length <= 17) {
      foundIdNo = allDigits.substring(0, 16);
    }
  }

  // Find Date of Birth in filename, e.g. 12_04_1990 or 1994-05-23
  let foundDob = "";
  const dobMatch = fileName.match(/(\d{2})[\/\-\._](\d{2})[\/\-\._](\d{4})/) || fileName.match(/(\d{4})[\/\-\._](\d{2})[\/\-\._](\d{2})/);
  if (dobMatch) {
    if (dobMatch[3].length === 4) {
      foundDob = `${dobMatch[1]}/${dobMatch[2]}/${dobMatch[3]}`;
    } else if (dobMatch[1].length === 4) {
      foundDob = `${dobMatch[3]}/${dobMatch[2]}/${dobMatch[1]}`;
    }
  }

  // Find blood group in filename, e.g. Apos, Bneg, O_pos, AB+
  let foundBloodGroup = "";
  const bloodList = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  for (const b of bloodList) {
    const escaped = b.replace('+', '\\+').replace('-', '\\-');
    const regex = new RegExp(`\\b${escaped}\\b|_${escaped}_|_${escaped}$|^${escaped}_`, 'i');
    if (regex.test(fileName)) {
      foundBloodGroup = b;
      break;
    }
  }
  // Try to map word versions
  if (!foundBloodGroup) {
    if (/apos|a_pos|a_positive/i.test(fileName)) foundBloodGroup = 'A+';
    else if (/aneg|a_neg|a_negative/i.test(fileName)) foundBloodGroup = 'A-';
    else if (/bpos|b_pos|b_positive/i.test(fileName)) foundBloodGroup = 'B+';
    else if (/bneg|b_neg|b_negative/i.test(fileName)) foundBloodGroup = 'B-';
    else if (/opos|o_pos|o_positive/i.test(fileName)) foundBloodGroup = 'O+';
    else if (/oneg|o_neg|o_negative/i.test(fileName)) foundBloodGroup = 'O-';
    else if (/abpos|ab_pos|ab_positive/i.test(fileName)) foundBloodGroup = 'AB+';
    else if (/abneg|ab_neg|ab_negative/i.test(fileName)) foundBloodGroup = 'AB-';
  }

  // Find gender in filename
  let sex = "";
  if (/\b(female|gore|woman|girl|f|female)\b/i.test(fileName) || /_f_/i.test(fileName) || /_f$/i.test(fileName)) {
    sex = 'F';
  } else if (/\b(male|gabo|man|boy|m|g)\b/i.test(fileName) || /_m_/i.test(fileName) || /_m$/i.test(fileName)) {
    sex = 'G';
  } else {
    sex = (hash % 2 === 0) ? 'G' : 'F';
  }

  // Find names in filename while stripping generic tokens
  const ignoreKeywords = [
    'id', 'scan', 'card', 'doc', 'photo', 'image', 'nid', 'national', 'unnamed', 'copy', 'new', 'scanned',
    'png', 'jpg', 'jpeg', 'dob', 'sex', 'blood', 'bloodgroup', 'religion', 'address', 'verified', 'rejected',
    'mismatch', 'male', 'female', 'gabo', 'gore', 'rwandan', 'republic', 'rwanda', 'national_id', 'scan_new',
    'img', 'dsc', 'picture', 'avatar', 'file', 'upload', 'document', 'kyc', 'page', 'recto', 'verso'
  ];

  const nameTokens = tokens.filter(t => {
    const tl = t.toLowerCase();
    if (/^\d+$/.test(tl)) return false;
    if (ignoreKeywords.includes(tl)) return false;
    return true;
  });

  let names = nameTokens.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  if (!names) {
    const firstList = sex === 'G' ? maleFirstNames : femaleFirstNames;
    const first = firstList[hash % firstList.length];
    const last = lastNames[(hash + 3) % lastNames.length];
    names = `${first} ${last}`;
  } else {
    // If it's a single word name, make sure we deterministically add a last name
    const parts = names.split(/\s+/);
    if (parts.length === 1) {
      names = `${parts[0]} ${lastNames[hash % lastNames.length]}`;
    }
  }

  // Deterministic DOB fallback
  if (!foundDob) {
    const birthYear = 1980 + (hash % 25); // 1980 - 2004
    const birthMonth = String(1 + ((hash + 5) % 12)).padStart(2, '0');
    const birthDay = String(1 + ((hash + 9) % 28)).padStart(2, '0');
    foundDob = `${birthDay}/${birthMonth}/${birthYear}`;
  }

  // Compute birth year for structuring NID
  const dobParts = foundDob.split('/');
  const birthYear = dobParts.length === 3 ? parseInt(dobParts[2]) : 1990;

  // Format 16 digit ID deterministically from parameters / filename hash
  let formattedId = "";
  if (foundIdNo && foundIdNo.length === 16) {
    const d = foundIdNo;
    formattedId = `${d.substring(0, 3)} ${d.substring(3, 7)} ${d.substring(7, 11)} ${d.substring(11, 15)} ${d.substring(15)}`;
  } else {
    const gDigit = sex === 'G' ? '8' : '7';
    let idDigits = `1${birthYear}${gDigit}`;
    for (let i = 0; i < 10; i++) {
      idDigits += ((hash + i * 11) % 10).toString();
    }
    formattedId = `${idDigits.substring(0, 3)} ${idDigits.substring(3, 7)} ${idDigits.substring(7, 11)} ${idDigits.substring(11, 15)} ${idDigits.substring(15)}`;
  }

  const placesOfIssue = ['Kigali', 'Nyarugenge', 'Huye', 'Musanze', 'Rubavu', 'Bugesera', 'Kayonza', 'Rwamagana', 'Gicumbi', 'Karongi', 'Nyanza', 'Ruhango', 'Nyamagabe', 'Kamonyi'];
  const birthplace = placesOfIssue[(hash + 2) % placesOfIssue.length];
  const issuePlace = placesOfIssue[(hash + 6) % placesOfIssue.length];

  const religions = ['Kiliziya Gatolika', 'Protestant', 'Adventist', 'Islam', 'Assembly of God', 'Christian'];
  const religion = religions[(hash + 11) % religions.length];

  if (!foundBloodGroup) {
    foundBloodGroup = bloodList[(hash + 4) % bloodList.length];
  }

  const issueYear = 2024 - (hash % 2); // issue within 2 years
  const expiryYear = issueYear + 10; // valid for 10 years
  
  const issueDate = `12/04/${issueYear}`;
  const expiryDate = `11/04/${expiryYear}`;

  // Serial Card number deterministically
  let cardDigits = "";
  for (let i = 0; i < 10; i++) {
    cardDigits += ((hash + i * 13) % 10).toString();
  }

  return {
    document: 'International ID',
    country: 'Republic of Rwanda',
    names,
    idNo: formattedId, 
    dob: foundDob,
    sex,
    nationality: 'Rwandan',
    placeOfIssue: issuePlace,
    dateOfIssue: issueDate,
    expiry: expiryDate,
    cardNo: `A${cardDigits}`,
    placeOfIssueBack: issuePlace,
    dateOfIssueBack: issueDate,
    validUntil: expiryDate,
    placeOfBirth: birthplace,
    nationalityBack: 'Rwandan',
    religion,
    address: `KG ${10 + (hash % 190)} AVE ${1 + (hash % 49)}, ${issuePlace}, Rwanda`,
    bloodGroup: foundBloodGroup,
    containsDemoText: true,
    containsSampleText: true,
    similarityScore: 1.0
  };
}

/**
 * DocumentExtractor Class
 */
export class DocumentExtractor {
  /**
   * Simulates extracting identity information from an uploaded file.
   * Leverages async/await to simulate processing delays.
   */
  public async extractFromJpg(
    fileName: string,
    fileType: string,
    scenario: 'match' | 'mismatch' | 'invalid_id' | 'sparse_scan',
    onProgressLog: (log: LogEntry) => void,
    presetKey?: string
  ): Promise<ExtractedIdData> {
    onProgressLog(makeLog('file', `Initializing upload stream for '${fileName}'...`));
    
    // Check file extension / type
    const lowerName = fileName.toLowerCase();
    const isSupported = lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.png') || 
                        fileType === 'image/jpeg' || fileType === 'image/jpg' || fileType === 'image/png';
    
    if (!isSupported) {
      onProgressLog(makeLog('error', `Security policy block: File '${fileName}' failed format validation.`));
      throw new Error(`Unsupported file format. Only JPG, JPEG, and PNG files are accepted for identity extraction.`);
    }

    onProgressLog(makeLog('file', `File verification passed: '${fileName}' is a valid document image.`));
    onProgressLog(makeLog('scanner', `Simulating neural OCR scan (DocumentExtractor processing)...`));
    
    // Simulate OCR extraction delays
    await new Promise((resolve) => setTimeout(resolve, 800));
    onProgressLog(makeLog('scanner', `OCR Stage 1: Document boundary detection & alignment complete.`));
    
    await new Promise((resolve) => setTimeout(resolve, 600));
    onProgressLog(makeLog('scanner', `OCR Stage 2: Segmented Text Line extraction complete.`));

    await new Promise((resolve) => setTimeout(resolve, 500));
    onProgressLog(makeLog('scanner', `OCR Stage 3: Field auto-classification and mapping complete.`));

    if (scenario === 'invalid_id') {
      onProgressLog(makeLog('scanner', `Parsing Error: Extracted text elements do not contain valid national card layout.`));
      throw new Error(`Unreadable ID Document: The text regions extracted from the image do not map to the Genuine ID format.`);
    }

    

    // Default Rwanda National ID card of Jean Claude Habimana as per requested details
    const standardRwandaID: ExtractedIdData = {
      document: 'International ID',
      country: 'Republic of Rwanda',
      names: 'Jean Claude Habimana',
      idNo: '198 7654 3210 5',
      dob: '23/05/1994',
      sex: 'G',
      nationality: 'Rwandan',
      placeOfIssue: 'Kigali',
      dateOfIssue: '15/04/2024',
      expiry: '14/04/2034',
      cardNo: 'A9876543210',
      placeOfIssueBack: 'Kigali',
      dateOfIssueBack: '15/04/2024',
      validUntil: '14/04/2034',
      placeOfBirth: 'Huye',
      nationalityBack: 'Rwandan',
      religion: 'Kiliziya Gatolika',
      address: 'KG 15 AVE 12, Nyamirambo, Kigali',
      bloodGroup: 'O+',
      containsDemoText: true,
      containsSampleText: true,
      similarityScore: 1.0
    };

    // Find if the filename or presetKey corresponds to any preset
    const preset = RWANDAN_PRESETS.find(p => p.key === presetKey || p.fileName === fileName || lowerName.includes(p.key));
    const baseID = preset ? preset.extracted : standardRwandaID;

    // Sparse scan simulation: return a deliberately under-populated extracted result
    // to simulate documents with very few readable fields.
    if (scenario === 'sparse_scan') {
      onProgressLog(makeLog('scanner', `Sparse Scan: Producing low-field extraction sample.`));
      const sparseResult: ExtractedIdData = {
        document: baseID.document,
        country: baseID.country,
        names: '',
        idNo: '',
        dob: '',
        sex: '',
        nationality: '',
        placeOfIssue: '',
        dateOfIssue: '',
        expiry: '',
        cardNo: '',
        placeOfIssueBack: '',
        dateOfIssueBack: '',
        validUntil: '',
        placeOfBirth: '',
        nationalityBack: '',
        religion: '',
        address: '',
        bloodGroup: '',
        containsDemoText: false,
        containsSampleText: false,
        similarityScore: 0.5
      };

      return sparseResult;
    }

    if (scenario === 'mismatch') {
      // Omitted Demo / Sample / Critical marks scenario (fails the strict 90% threshold check!)
      onProgressLog(makeLog('scanner', `Compliance exception: Required security marks (SAMPLE watermark) are missing from scan.`));
      return {
        ...baseID,
        containsDemoText: false,  // Missing watermarks/texts!
        containsSampleText: false, // Fails 90% layout criteria!
        similarityScore: 0.68      // Markings dropped, far below 90% threshold!
      };
    }

    return {
      ...baseID,
      similarityScore: 1.0
    };
  }
}

/**
 * VerificationService Class (Coordinates system operations)
 */
export class VerificationService {
  private companies: Company[] = [];
  private companyUsers: CompanyUser[] = [];
  private records: VerificationRecord[] = [];
  private activeUser: CompanyUser | null = null;
  private documentExtractor: DocumentExtractor;
  
  // Developer logs history
  private devLogs: LogEntry[] = [];
  private logListeners: ((log: LogEntry) => void)[] = [];

  constructor() {
    this.documentExtractor = new DocumentExtractor();
    this.addLog('system', 'Booting VerifyKit TS System Engine v1.0.0...');
    this.addLog('system', 'System dependencies loaded successfully.');
    this.addLog('system', 'Ready to handle company-based ID verifications.');
    this.loadState();
  }

  // Register a logging listener
  public onLog(listener: (log: LogEntry) => void): () => void {
    this.logListeners.push(listener);
    return () => {
      this.logListeners = this.logListeners.filter((l) => l !== listener);
    };
  }

  private addLog(type: LogEntry['type'], message: string): void {
    const entry = makeLog(type, message);
    this.devLogs.push(entry);
    // Keep logs capped at 300 to avoid performance lag
    if (this.devLogs.length > 300) {
      this.devLogs.shift();
    }
    // Print to developer console too!
    console.log(`[${type.toUpperCase()}] ${message}`);
    // Emit to active UI listeners
    this.logListeners.forEach((listener) => listener(entry));
  }

  public getLogs(): LogEntry[] {
    return [...this.devLogs];
  }

  public clearLogs(): void {
    this.devLogs = [makeLog('system', 'Developer Console cleared.')];
    this.logListeners.forEach((listener) => listener(this.devLogs[0]));
  }

  private saveState(): void {
    try {
      const state = {
        companies: this.companies.map(c => ({ name: c.name, email: c.email, contact: c.contact })),
        users: this.companyUsers.map(u => ({
          repName: u.repName,
          repPosition: u.repPosition,
          email: u.email,
          passwordHash: u.passwordHash,
          companyEmail: u.company.email
        })),
        records: this.records,
        activeUserEmail: this.activeUser ? this.activeUser.email : null
      };
      localStorage.setItem('verifykit_state_v2', JSON.stringify(state));
    } catch (e) {
      this.addLog('error', `Failed to persist state to LocalStorage: ${e}`);
    }
  }

  private loadState(): void {
    try {
      const serialized = localStorage.getItem('verifykit_state_v2');
      if (!serialized) {
        // Hydrate mock company for easier testing
        this.addLog('system', 'No persistent state found. Seeding initial test databases...');
        const tempComp = new Company('Rwanda Tech Labs', 'contact@rwandatech.rw', '+250788123456');
        const tempUser = new CompanyUser('Sarah Jenkins', 'HR Director', 'sarah@rwandatech.rw', 'password123', tempComp);
        this.companies.push(tempComp);
        this.companyUsers.push(tempUser);
        
        // Seed a sample record
        const sampleRecord: VerificationRecord = {
          id: 'REC-394852',
          timestamp: new Date(Date.now() - 3600000 * 2).toLocaleString(),
          extractedData: {
            document: 'International ID',
            country: 'Republic of Rwanda',
            names: 'Jean Claude Habimana',
            idNo: '198 7654 3210 5',
            dob: '23/05/1994',
            sex: 'G',
            nationality: 'Rwandan',
            placeOfIssue: 'Kigali',
            dateOfIssue: '15/04/2024',
            expiry: '14/04/2034',
            cardNo: 'A9876543210',
            placeOfIssueBack: 'Kigali',
            dateOfIssueBack: '15/04/2024',
            validUntil: '14/04/2034',
            placeOfBirth: 'Huye',
            nationalityBack: 'Rwandan',
            religion: 'Kiliziya Gatolika',
            address: 'KG 15 AVE 12, Nyamirambo, Kigali',
            bloodGroup: 'O+',
            containsDemoText: true,
            containsSampleText: true,
            similarityScore: 1.0
          },
          status: 'Verified',
          fileName: 'jean_claude_id.jpg',
          companyEmail: 'sarah@rwandatech.rw'
        };
        this.records.push(sampleRecord);
        this.saveState();
        return;
      }

      const state = JSON.parse(serialized);
      this.companies = state.companies.map((c: any) => new Company(c.name, c.email, c.contact));
      this.companyUsers = state.users.map((u: any) => {
        const company = this.companies.find((c) => c.email === u.companyEmail) || 
          new Company('Unknown Company', u.companyEmail, '');
        return new CompanyUser(u.repName, u.repPosition, u.email, u.passwordHash, company);
      });
      this.records = state.records;
      if (state.activeUserEmail) {
        this.activeUser = this.companyUsers.find((u) => u.email === state.activeUserEmail) || null;
      }
      this.addLog('system', `State loaded successfully. Companies: ${this.companies.length}, Users: ${this.companyUsers.length}, Records: ${this.records.length}`);
    } catch (e) {
      this.addLog('error', `Failed to restore state from LocalStorage: ${e}`);
    }
  }

  public getActiveUser(): CompanyUser | null {
    return this.activeUser;
  }

  public getRecords(): VerificationRecord[] {
    if (!this.activeUser) return [];
    return this.records.filter((record) => {
      // For backwards compatibility with any unowned records, default them to the seeded company email
      const owner = record.companyEmail || 'sarah@rwandatech.rw';
      return owner.toLowerCase() === this.activeUser?.email.toLowerCase();
    });
  }

  /**
   * Action: Register Company Account (including representative admin details)
   */
  public register(data: CompanyData): CompanyUser {
    this.addLog('auth', `Initiating registration pipeline for: '${data.companyName}'`);
    
    // Verify properties using recursive checker
    try {
      this.addLog('validation', `Executing recursion validation pipeline for user properties...`);
      recursiveValidate(data);
      this.addLog('validation', `Recursion fields matched expectation. Safe parameters verified.`);
    } catch (validationErr: any) {
      this.addLog('error', `Recursion validation exception caught! Message: ${validationErr.message}`);
      throw validationErr;
    }

    if (data.password !== undefined && data.password.length < 6) {
      this.addLog('error', `Security threshold breached. Password must be at least 6 characters.`);
      throw new Error(`Security Exception: Representative password must be at least 6 characters.`);
    }

    // Check duplicate email
    const exists = this.companyUsers.some((u) => u.email.toLowerCase() === data.companyEmail.toLowerCase());
    if (exists) {
      this.addLog('error', `Conflict: Registered email already exists in system database: '${data.companyEmail}'`);
      throw new Error(`Registration Conflict: An account with the email '${data.companyEmail}' is already registered.`);
    }

    // Class instantiation
    const newCompany = new Company(data.companyName, data.companyEmail, data.companyContact);
    const newAdmin = new CompanyUser(
      data.repName,
      data.repPosition,
      data.companyEmail,
      data.password || 'password123',
      newCompany
    );

    this.companies.push(newCompany);
    this.companyUsers.push(newAdmin);
    this.activeUser = newAdmin;
    
    this.addLog('success', `Company registered successfully! Entity: '${newCompany.name}', AdminID: '${newAdmin.email}'`);
    this.saveState();
    return newAdmin;
  }

  /**
   * Action: Authenticate Company Representative
   */
  public login(email: string, passwordHash: string): CompanyUser {
    this.addLog('auth', `Authentication requested for user email: '${email}'`);

    const user = this.companyUsers.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      this.addLog('error', `Authentication exception: Unregistered system email '${email}'`);
      throw new Error(`Authentication Failed: No registered account under the email '${email}'.`);
    }

    if (user.passwordHash !== passwordHash) {
      this.addLog('error', `Authentication exception: Incorrect credentials for '${email}'`);
      throw new Error(`Authentication Failed: Incorrect secret password for user authorization.`);
    }

    this.activeUser = user;
    this.addLog('success', `Session initialized. Portal verified for representative '${user.repName}' representing '${user.company.name}'.`);
    this.saveState();
    return user;
  }

  /**
   * Action: Terminate Session
   */
  public logout(): void {
    if (this.activeUser) {
      const name = this.activeUser.repName;
      this.activeUser = null;
      this.addLog('auth', `Session terminated by representative: '${name}'`);
      this.saveState();
    }
  }

  /**
   * Action: Start New Identity Verification flow
   */
  public async verifyIdentity(
    fileName: string,
    fileType: string,
    scenario: 'match' | 'mismatch' | 'invalid_id' | 'sparse_scan',
    presetKey?: string,
    customData?: ExtractedIdData
  ): Promise<VerificationRecord> {
    this.addLog('system', `Identity verification thread initialized...`);
    
    // Start simulated async file upload extraction
    let extracted: ExtractedIdData | null = null;
    let status: 'Verified' | 'Rejected' = 'Rejected';
    let reason: string | undefined = undefined;

    try {
      if (!customData) {
        throw new Error('Verification requires OCR-extracted data from the uploaded ID image.');
      }

      // Deep clone so changes in UI don't affect previous saved records.
      extracted = JSON.parse(JSON.stringify(customData));
      this.addLog('file', `Using OCR-extracted ID review structure from uploaded image.`);
      this.addLog('scanner', `OCR text extraction and field mapping complete.`);

      this.addLog('comparison', `Running identity compliance comparisons...`);
      this.addLog('comparison', `Extracted document issuer: '${extracted.country}'`);
      this.addLog('comparison', `Extracted document name: '${extracted.names}'`);
      this.addLog('comparison', `Assessed Layout Similarity: ${(extracted.similarityScore * 100).toFixed(0)}%`);

      // 90% strict similarity check requirement implementation!
      if (extracted.similarityScore >= 0.90) {
        status = 'Verified';
        this.addLog('success', `Compliance check: SUCCESS. Subject ID matched Genuine ID layout specifications (Similarity Score: ${(extracted.similarityScore * 100).toFixed(1)}%).`);
      } else {
        status = 'Rejected';
        reason = `Compliance Rejection: Similarity score of ${(extracted.similarityScore * 100).toFixed(0)}% falls below the 90% threshold. The document is missing critical security markings (SAMPLE / DEMO watermarks or back-side identity parameters).`;
        this.addLog('error', `Compliance check: LACKS REQUISITE SIMILARITY (${(extracted.similarityScore * 100).toFixed(0)}%). Rejected.`);
      }
    } catch (extractErr: any) {
      status = 'Rejected';
      reason = extractErr.message || 'Identity processing error occurred.';
      this.addLog('error', `Verification process caught exception: ${reason}`);
      throw extractErr;
    }

    const finalRecord: VerificationRecord = {
      id: `REC-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: new Date().toLocaleString(),
      extractedData: extracted,
      status,
      reason,
      fileName,
      companyEmail: this.activeUser ? this.activeUser.email : undefined
    };

    this.records.unshift(finalRecord);
    this.addLog('system', `Stored VerificationRecord inside local records store. ID: '${finalRecord.id}', Status: '${status}'`);
    this.saveState();
    return finalRecord;
  }
}

// Instantiate and export a singleton service for state persistence across renderers
export const verificationService = new VerificationService();
