import { ExtractedIdData } from '../src/types';

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
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + substitutionCost
      );
    }
  }
  return d[m][n];
}

export function getNameSimilarity(name1: string, name2: string): number {
  const norm1 = name1.toLowerCase().trim().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ');
  const norm2 = name2.toLowerCase().trim().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ');

  if (norm1 === norm2) return 1.0;
  if (!norm1 || !norm2) return 0.0;

  const flat1 = norm1.replace(/\s+/g, '');
  const flat2 = norm2.replace(/\s+/g, '');
  if (flat1 === flat2) return 1.0;

  const maxLen = Math.max(norm1.length, norm2.length);
  const dist = getLevenshteinDistance(norm1, norm2);
  const levSimilarity = 1 - dist / maxLen;

  const words1 = norm1.split(' ').filter(w => w.length > 1);
  const words2 = norm2.split(' ').filter(w => w.length > 1);

  if (words1.length === 0 || words2.length === 0) {
    return levSimilarity;
  }

  let commonWordsCount = 0;
  for (const w of words1) {
    if (words2.includes(w)) commonWordsCount++;
  }

  const overlapRatio1 = commonWordsCount / words1.length;
  const overlapRatio2 = commonWordsCount / words2.length;
  const wordOverlapSimilarity = Math.max(overlapRatio1, overlapRatio2);

  return Math.max(levSimilarity, wordOverlapSimilarity);
}

function getDeterministicHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function generateRwandanIDFromFilename(fileName: string): ExtractedIdData {
  const baseName = fileName.replace(/\.[^/.]+$/, '');
  const cleanBase = baseName.replace(/[_\-\.]+/g, ' ').trim();
  const tokens = cleanBase.split(/\s+/);
  const hash = getDeterministicHash(fileName);

  const maleFirstNames = ['Jean Paul', 'Emile', 'Eric', 'Patrick', 'Aimable', 'Jean Claude', 'Emmanuel'];
  const femaleFirstNames = ['Claudine', 'Diane', 'Grace', 'Sandrine', 'Bella', 'Aline'];
  const lastNames = ['Habimana', 'Mukamana', 'Nsengiyumva', 'Uwase', 'Niyonkuru', 'Ingabire'];

  let foundIdNo = '';
  const idMatch = fileName.match(/\b\d{15,17}\b/) || fileName.match(/\d{15,17}/);
  if (idMatch) foundIdNo = idMatch[0];

  let foundDob = '';
  const dobMatch = fileName.match(/(\d{2})[\/\-\._](\d{2})[\/\-\._](\d{4})/) || fileName.match(/(\d{4})[\/\-\._](\d{2})[\/\-\._](\d{2})/);
  if (dobMatch) {
    if (dobMatch[3] && dobMatch[3].length === 4) foundDob = `${dobMatch[1]}/${dobMatch[2]}/${dobMatch[3]}`;
    else if (dobMatch[1] && dobMatch[1].length === 4) foundDob = `${dobMatch[3]}/${dobMatch[2]}/${dobMatch[1]}`;
  }

  let sex = '';
  if (/\b(female|woman|girl|f)\b/i.test(fileName)) sex = 'F';
  else if (/\b(male|man|boy|m)\b/i.test(fileName)) sex = 'G';
  else sex = (hash % 2 === 0) ? 'G' : 'F';

  const ignoreKeywords = ['id', 'scan', 'card', 'doc', 'photo', 'image', 'nid', 'national', 'rwandan', 'rwanda', 'png', 'jpg', 'jpeg'];
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
    const parts = names.split(/\s+/);
    if (parts.length === 1) names = `${parts[0]} ${lastNames[hash % lastNames.length]}`;
  }

  if (!foundDob) {
    const birthYear = 1980 + (hash % 25);
    const birthMonth = String(1 + ((hash + 5) % 12)).padStart(2, '0');
    const birthDay = String(1 + ((hash + 9) % 28)).padStart(2, '0');
    foundDob = `${birthDay}/${birthMonth}/${birthYear}`;
  }

  const dobParts = foundDob.split('/');
  const birthYear = dobParts.length === 3 ? parseInt(dobParts[2]) : 1990;

  let formattedId = '';
  if (foundIdNo && foundIdNo.length === 16) {
    const d = foundIdNo;
    formattedId = `${d.substring(0, 3)} ${d.substring(3, 7)} ${d.substring(7, 11)} ${d.substring(11, 15)} ${d.substring(15)}`;
  } else {
    const gDigit = sex === 'G' ? '8' : '7';
    let idDigits = `1${birthYear}${gDigit}`;
    for (let i = 0; i < 10; i++) idDigits += ((hash + i * 11) % 10).toString();
    formattedId = `${idDigits.substring(0, 3)} ${idDigits.substring(3, 7)} ${idDigits.substring(7, 11)} ${idDigits.substring(11, 15)} ${idDigits.substring(15)}`;
  }

  const placesOfIssue = ['Kigali', 'Nyarugenge', 'Huye', 'Musanze', 'Rubavu', 'Bugesera'];
  const birthplace = placesOfIssue[(hash + 2) % placesOfIssue.length];
  const issuePlace = placesOfIssue[(hash + 6) % placesOfIssue.length];

  const religions = ['Kiliziya Gatolika', 'Protestant', 'Adventist', 'Islam'];
  const religion = religions[(hash + 11) % religions.length];

  const bloodList = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  const foundBloodGroup = bloodList[(hash + 4) % bloodList.length];

  const issueYear = 2024 - (hash % 2);
  const expiryYear = issueYear + 10;

  const issueDate = `12/04/${issueYear}`;
  const expiryDate = `11/04/${expiryYear}`;

  let cardDigits = '';
  for (let i = 0; i < 10; i++) cardDigits += ((hash + i * 13) % 10).toString();

  return {
    document: 'National Identity Card',
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

export async function extractFromJpg(fileName: string, fileType: string, scenario: 'match' | 'mismatch' | 'invalid_id', presetKey?: string): Promise<ExtractedIdData> {
  // Simple server-side simulation of the client extractor
  const lower = fileName.toLowerCase();
  const isSupported = lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || fileType === 'image/jpeg' || fileType === 'image/png';
  if (!isSupported) throw new Error('Unsupported file format. Only JPG, JPEG and PNG are accepted.');

  // Slight delay to simulate processing
  await new Promise((r) => setTimeout(r, 400));

  if (scenario === 'invalid_id') throw new Error('Unreadable ID Document: The text regions extracted from the image do not map to the Rwanda National Identity Card format.');

  const generated = generateRwandanIDFromFilename(fileName);
  if (scenario === 'mismatch') {
    return { ...generated, containsDemoText: false, containsSampleText: false, similarityScore: 0.68 };
  }
  return { ...generated, similarityScore: 1.0 };
}
