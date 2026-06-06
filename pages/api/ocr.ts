import type { NextApiRequest, NextApiResponse } from 'next';
import type { ExtractedIdData } from '../../src/types';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb',
    },
  },
};

const OCR_TIMEOUT_MS = 45000;

type OcrResult = {
  text: string;
  confidence?: number;
};

type CountryProfile = {
  name: string;
  code: string;
  nationality?: string;
  patterns: RegExp[];
};

const COUNTRY_PROFILES: CountryProfile[] = [
  { name: 'Republic of Rwanda', code: 'RWA', nationality: 'Rwandan', patterns: [/REPUB(?:U)?LIKA\s+Y['\u2019]?\s*U?\s*RWANDA/, /REPUBLIC\s+OF\s+RWANDA/, /\bRWANDA\b/] },
  { name: 'United States', code: 'USA', nationality: 'American', patterns: [/UNITED\s+STATES\s+OF\s+AMERICA/, /\bUNITED\s+STATES\b/, /\bUNITED\s+STATE\b/, /\bU\.?S\.?A\b/, /DEPARTMENT\s+OF\s+STATE/] },
  { name: 'Canada', code: 'CAN', nationality: 'Canadian', patterns: [/\bCANADA\b/] },
  { name: 'United Kingdom', code: 'GBR', nationality: 'British', patterns: [/UNITED\s+KINGDOM/, /GREAT\s+BRITAIN/, /\bBRITISH\b/] },
  { name: 'France', code: 'FRA', nationality: 'French', patterns: [/\bFRANCE\b/, /REPUBLIQUE\s+FRANCAISE/] },
  { name: 'Kenya', code: 'KEN', nationality: 'Kenyan', patterns: [/\bKENYA\b/, /REPUBLIC\s+OF\s+KENYA/] },
  { name: 'Uganda', code: 'UGA', nationality: 'Ugandan', patterns: [/\bUGANDA\b/, /REPUBLIC\s+OF\s+UGANDA/] },
  { name: 'Tanzania', code: 'TZA', nationality: 'Tanzanian', patterns: [/\bTANZANIA\b/, /UNITED\s+REPUBLIC\s+OF\s+TANZANIA/] },
  { name: 'Burundi', code: 'BDI', nationality: 'Burundian', patterns: [/\bBURUNDI\b/, /REPUBLIC\s+OF\s+BURUNDI/] },
  { name: 'South Africa', code: 'ZAF', nationality: 'South African', patterns: [/SOUTH\s+AFRICA/, /REPUBLIC\s+OF\s+SOUTH\s+AFRICA/] },
  { name: 'Nigeria', code: 'NGA', nationality: 'Nigerian', patterns: [/\bNIGERIA\b/, /FEDERAL\s+REPUBLIC\s+OF\s+NIGERIA/] },
  { name: 'Ghana', code: 'GHA', nationality: 'Ghanaian', patterns: [/\bGHANA\b/, /REPUBLIC\s+OF\s+GHANA/] },
  { name: 'Ethiopia', code: 'ETH', nationality: 'Ethiopian', patterns: [/\bETHIOPIA\b/] },
  { name: 'India', code: 'IND', nationality: 'Indian', patterns: [/\bINDIA\b/, /REPUBLIC\s+OF\s+INDIA/] },
  { name: 'China', code: 'CHN', nationality: 'Chinese', patterns: [/\bCHINA\b/, /PEOPLE'?S\s+REPUBLIC\s+OF\s+CHINA/] },
  { name: 'Japan', code: 'JPN', nationality: 'Japanese', patterns: [/\bJAPAN\b/] },
  { name: 'Germany', code: 'DEU', nationality: 'German', patterns: [/\bGERMANY\b/, /BUNDESREPUBLIK\s+DEUTSCHLAND/] },
  { name: 'Belgium', code: 'BEL', nationality: 'Belgian', patterns: [/\bBELGIUM\b/, /\bBELGIQUE\b/] },
  { name: 'Netherlands', code: 'NLD', nationality: 'Dutch', patterns: [/\bNETHERLANDS\b/, /\bNEDERLAND\b/] },
  { name: 'Australia', code: 'AUS', nationality: 'Australian', patterns: [/\bAUSTRALIA\b/] },
];

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`OCR timed out after ${timeoutMs / 1000}s.`)), timeoutMs);
    }),
  ]);
}

async function runTesseractOcr(buffer: Buffer): Promise<OcrResult> {
  const tesseract = await import('tesseract.js');
  const createWorker = (tesseract as any).createWorker;
  if (typeof createWorker !== 'function') {
    throw new Error('Tesseract worker API is unavailable.');
  }

  let worker: any;
  try {
    worker = await withTimeout(
      createWorker('eng', 1, {
        langPath: process.cwd(),
        gzip: false,
        cacheMethod: 'readOnly',
      }),
      OCR_TIMEOUT_MS
    );

    if (typeof worker.setParameters === 'function') {
      await worker.setParameters({
        preserve_interword_spaces: '1',
        tessedit_pageseg_mode: '11',
      });
    }

    const result = await withTimeout(worker.recognize(buffer), OCR_TIMEOUT_MS);
    const data = (result as any)?.data || result || {};
    return {
      text: data.text || '',
      confidence: typeof data.confidence === 'number' ? data.confidence : undefined,
    };
  } finally {
    if (worker && typeof worker.terminate === 'function') {
      await worker.terminate().catch((termErr: any) => {
        console.warn('Failed to terminate tesseract worker:', termErr?.message || termErr);
      });
    }
  }
}

function normalizeOcrLine(line: string): string {
  return line.replace(/\s+/g, ' ').trim();
}

function isNoiseLine(line: string): boolean {
  const value = normalizeOcrLine(line);
  if (!value || value.length <= 2) return true;
  if (/^[|\\\/()[\]{}=_\-~:.#@!]+$/.test(value)) return true;
  return /^(AN|WN|BN|SH|TZ|SS|RA|P|I|OF\s*\d+|\d+)$/i.test(value);
}

function findLineIndex(lines: string[], pattern: RegExp, start = 0): number {
  for (let i = start; i < lines.length; i++) {
    if (pattern.test(lines[i])) return i;
  }
  return -1;
}

function scanContext(lines: string[], start: number, length = 8): string[] {
  if (start < 0) return [];
  return lines.slice(start, Math.min(lines.length, start + length)).map(normalizeOcrLine);
}

function firstDateIn(lines: string[]): string {
  for (const line of lines) {
    const date = firstDateValue(line);
    if (date) return date;
  }
  return '';
}

function firstDateValue(text: string): string {
  const formatted = text.match(/\b(?:\d{2}[\/\-\.\s]\d{2}[\/\-\.\s]\d{4}|\d{4}[\/\-\.\s]\d{2}[\/\-\.\s]\d{2})\b/);
  if (formatted) return formatted[0].replace(/[\.\-\s]/g, '/');

  const compact = text.match(/\b\d{8}\b/);
  if (!compact) return '';

  const value = compact[0];
  const dd = Number(value.slice(0, 2));
  const mm = Number(value.slice(2, 4));
  const yyyy = Number(value.slice(4));
  if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12 && yyyy >= 1900 && yyyy <= 2100) {
    return `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;
  }

  return '';
}

function datesIn(lines: string[]): string[] {
  return lines.map(firstDateValue).filter(Boolean);
}

function yearOf(date: string): number {
  const year = Number(date.split('/')[2]);
  return Number.isFinite(year) ? year : 0;
}

function firstKnownPlaceIn(lines: string[], places: string[]): string {
  for (const line of lines) {
    const upper = line.toUpperCase();
    const place = places.find(p => upper.includes(p.toUpperCase()));
    if (place) return place;
  }
  return '';
}

function cleanName(line: string): string {
  return normalizeOcrLine(line)
    .replace(/^names?\s*[:/\-]?\s*/i, '')
    .replace(/^amazina\s*[:/\-]?\s*/i, '')
    .trim();
}

function isNameValue(line: string): boolean {
  const cleaned = cleanName(line);
  const upper = cleaned.toUpperCase();
  const blacklist = ['REPUBLIC','RWANDA','NATIONAL','IDENTITY','IDENTIFICATION','DOCUMENT','DOB','DATE','SEX','NID','ISSUE','PLACE','ADDRESS','SAMPLE','DEMO','SCAN','PHOTO','CARD','VALID','VAID','UNTIL','CYANGWA','BIRTH','BLOOD','GROUP','COUNTRY','AMAZIN','NAMES','YATANGIWE','YAVUTSE'];
  const lettersOnly = cleaned.replace(/[^a-zA-Z\s'-]/g, '').trim();
  return (
    cleaned.length >= 6 &&
    cleaned.split(/\s+/).length >= 2 &&
    lettersOnly.length >= Math.floor(cleaned.length * 0.7) &&
    !blacklist.some(k => upper.includes(k))
  );
}

function extractValueAfterLabel(
  lines: string[],
  labelPattern: RegExp,
  valuePattern: RegExp,
  length = 10
): string {
  const index = findLineIndex(lines, labelPattern);
  if (index < 0) return '';

  for (const line of scanContext(lines, index, length)) {
    const match = line.match(valuePattern);
    if (match) return normalizeOcrLine(match[0]);
  }
  return '';
}

function extractLooseValueAfterLabel(lines: string[], labelPattern: RegExp, length = 8): string {
  const index = findLineIndex(lines, labelPattern);
  if (index < 0) return '';

  const context = scanContext(lines, index, length);
  for (const [offset, line] of context.entries()) {
    const candidate = offset === 0
      ? normalizeOcrLine(line.replace(labelPattern, '').replace(/^[:/\-\s]+/, ''))
      : normalizeOcrLine(line);
    if (!isNoiseLine(candidate) && candidate.length >= 2) return candidate;
  }
  return '';
}

function detectIssuingCountry(text: string): CountryProfile | null {
  const upper = text.toUpperCase();
  return COUNTRY_PROFILES.find(country => country.patterns.some(pattern => pattern.test(upper))) || null;
}

function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
}

function inferOriginCountryName(text: string): string {
  const upper = text.toUpperCase();
  const countryLine = upper.match(/\bCOUNTRY\s*[:/\-]?\s*([A-Z][A-Z ]{3,35})\b/);
  if (countryLine) return toTitleCase(countryLine[1]);

  const originPhrase = upper.match(/\b(?:REPUBLIC|KINGDOM|GOVERNMENT|STATE)\s+OF\s+([A-Z][A-Z ]{3,35})\b/);
  if (originPhrase) return toTitleCase(originPhrase[1]);

  return '';
}

function detectDocumentType(text: string): string {
  const upper = text.toUpperCase();
  if (/PASSPORT/.test(upper)) return 'Passport';
  if (/DRIV(?:ER|ING).{0,12}LICEN[CS]E|LICEN[CS]E/.test(upper)) return 'Driver License';
  if (/RESIDEN(?:T|CE).{0,12}(?:CARD|PERMIT)|PERMANENT\s+RESIDENT/.test(upper)) return 'Resident ID';
  if (/VOTER/.test(upper)) return 'Voter ID';
  if (/NATIONAL\s+(?:IDENTITY|IDENTIFICATION|ID)|IDENTITY\s+CARD|IDENTIFICATION\s+CARD|ID\s+CARD|INDANGAMUNTU/.test(upper)) return 'International ID';
  if (/\b(?:ID|IDENTIFICATION|DOCUMENT)\b/.test(upper)) return 'International ID';
  return '';
}

function hasIdentityDocumentEvidence(text: string, parsed: ExtractedIdData): boolean {
  const upper = text.toUpperCase();
  const markerPatterns = [
    /REPUB(?:U)?LIKA\s+Y['\u2019]?\s*U?\s*RWANDA/,
    /REPUBLIC\s+OF\s+RWANDA/,
    /INDANGAMUNTU/,
    /NATIONAL\s+IDENTITY\s+CARD/,
    /IDENTITY\s+CARD|IDENTIFICATION\s+CARD|ID\s+CARD/,
    /PASSPORT|DRIV(?:ER|ING).{0,12}LICEN[CS]E|RESIDEN(?:T|CE).{0,12}(?:CARD|PERMIT)|VOTER\s+ID/,
    /GOVERNMENT|REPUBLIC|DEPARTMENT\s+OF\s+STATE/,
    /DATE\s+OF\s+BIRTH|\bDOB\b/,
    /GENDER|SEX/,
    /\b(?:ID|1D)\s*NO\b/,
    /DOCUMENT\s*(?:NO|NUMBER)|CARD\s*(?:NO|NUMBER)|LICEN[CS]E\s*(?:NO|NUMBER)|PASSPORT\s*(?:NO|NUMBER)|YIKARITA/,
    /IGITSINA|SEX/,
    /UBWANGANZIRA|NATIONALITY/,
  ];
  const markerCount = markerPatterns.reduce((count, pattern) => count + (pattern.test(upper) ? 1 : 0), 0);
  const normalizedCountry = (parsed.country || '').trim();
  const hasKnownCountry = Boolean(
    (normalizedCountry && !/^Unknown/i.test(normalizedCountry)) ||
    detectIssuingCountry(text) ||
    inferOriginCountryName(text)
  );
  const coreFieldCount = [parsed.names, parsed.idNo, parsed.dob, parsed.sex, parsed.cardNo]
    .filter((value) => value && value.trim().length > 0).length;
  const supportingFieldCount = [
    parsed.country,
    parsed.document,
    parsed.nationality,
    parsed.placeOfIssue,
    parsed.dateOfIssue,
    parsed.expiry,
    parsed.validUntil,
    parsed.placeOfBirth,
    parsed.address,
    parsed.bloodGroup,
  ].filter((value) => value && value.trim().length > 0).length;

  return (
    (markerCount >= 2 && coreFieldCount >= 2 && supportingFieldCount >= 1) ||
    (markerCount >= 1 && hasKnownCountry && coreFieldCount >= 2) ||
    (Boolean(parsed.document) && hasKnownCountry && coreFieldCount >= 3)
  );
}

// Lightweight parser: map OCR text into the ExtractedIdData shape (best-effort)
function parseOcrText(text: string, fileName: string): ExtractedIdData {
  const parsed: ExtractedIdData = {
    document: '',
    country: '',
    originCountry: '',
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
    containsDemoText: /demo/i.test(text),
    containsSampleText: /sample/i.test(text),
    similarityScore: 0.0
  };

  const lines = text.replace(/\r/g, '\n').split('\n').map(normalizeOcrLine).filter(Boolean);
  const upper = text.toUpperCase();
  const places = ['Kigali','Nyarugenge','Huye','Musanze','Rubavu','Bugesera','Kayonza','Rwamagana','Gicumbi','Karongi','Nyanza','Ruhango','Nyamagabe','Kamonyi','Gisenyi','Byumba','Kicukiro','Remera','Nyamirambo','Kanombe','Nyagatare','Kimironko'];
  const countryProfile = detectIssuingCountry(text);
  const inferredOriginCountry = countryProfile?.name || inferOriginCountryName(text);

  parsed.document = detectDocumentType(text);
  if (inferredOriginCountry) {
    parsed.country = inferredOriginCountry;
    parsed.originCountry = inferredOriginCountry;
  }

  const namesIndex = findLineIndex(lines, /AMAZI|NAMES/i);
  if (namesIndex >= 0) {
    for (const line of scanContext(lines, namesIndex + 1, 8)) {
      if (!isNoiseLine(line) && isNameValue(line)) {
        parsed.names = cleanName(line);
        break;
      }
    }
  }

  const idIndex = findLineIndex(lines, /ID\s*No|1D\s*No/i);
  for (const line of scanContext(lines, idIndex >= 0 ? idIndex : 0, idIndex >= 0 ? 10 : lines.length)) {
    const digits = line.replace(/\D/g, '');
    if (digits.length >= 10 && digits.length <= 17 && !/\d{2}\/\d{2}\/\d{4}/.test(line)) {
      parsed.idNo = digits.length === 16
        ? `${digits.substring(0,3)} ${digits.substring(3,7)} ${digits.substring(7,11)} ${digits.substring(11,15)} ${digits.substring(15)}`
        : digits.length === 13
          ? `${digits.substring(0,1)} ${digits.substring(1,3)} ${digits.substring(3,4)} ${digits.substring(4,8)} ${digits.substring(8,12)} ${digits.substring(12)}`
        : normalizeOcrLine(line.replace(/[^\d\s]/g, ''));
      break;
    }
  }
  if (!parsed.idNo) {
    const genericIdIndex = findLineIndex(lines, /(?:ID|IDENTIFICATION|DOCUMENT|DOC|CARD|LICEN[CS]E|PASSPORT)\s*(?:NO|NUMBER|#)|\bNO\.?\b/i);
    for (const line of scanContext(lines, genericIdIndex >= 0 ? genericIdIndex : 0, genericIdIndex >= 0 ? 8 : lines.length)) {
      if (firstDateValue(line)) continue;
      const match = line.match(/\b[A-Z]{0,3}\s*\d[A-Z0-9\s\-]{5,22}\b/i) || line.match(/\b[A-Z0-9]{6,18}\b/i);
      if (match) {
        parsed.idNo = normalizeOcrLine(match[0]).replace(/\s{2,}/g, ' ');
        break;
      }
    }
  }

  const allDates = datesIn(lines);
  const birthContextDates = datesIn(scanContext(lines, findLineIndex(lines, /DATE OF BIRTH|BIRTH\s*DATE|\bDOB\b|YAVUKI(?:Y|V)EHO/i), 10));
  parsed.dob = birthContextDates
    .filter(date => yearOf(date) < 2010)
    .sort((a, b) => yearOf(a) - yearOf(b))[0] || '';

  const issueContextDates = datesIn(scanContext(lines, findLineIndex(lines, /DATE OF ISSUE|ISSUE\s*DATE|ISSUED|YATANGIWEHO|YATANGJWE/i), 12));
  parsed.dateOfIssue = issueContextDates
    .filter(date => yearOf(date) >= 2010)
    .sort((a, b) => yearOf(a) - yearOf(b))[0] || '';
  parsed.dateOfIssueBack = parsed.dateOfIssue;
  parsed.expiry = firstDateIn(scanContext(lines, findLineIndex(lines, /EXPIRY|ZARANGIRA/i), 8));
  parsed.validUntil = firstDateIn(scanContext(lines, findLineIndex(lines, /VALID UNTIL|VAID UNTIL|VAID UNT|CYANGWA|CPANGUA/i), 8));
  if (!parsed.validUntil && parsed.expiry && /VALID UNTIL|VAID UNTIL|VAID UNT|CYANGWA|CPANGUA/i.test(text)) {
    parsed.validUntil = parsed.expiry;
  }

  if (!parsed.dob && allDates.length > 0) {
    parsed.dob = allDates.filter(date => yearOf(date) < 2010).sort((a, b) => yearOf(a) - yearOf(b))[0] || '';
  }
  if (!parsed.dateOfIssue && allDates.length > 0) {
    parsed.dateOfIssue = allDates.filter(date => yearOf(date) >= 2010 && date !== parsed.expiry && date !== parsed.validUntil).sort((a, b) => yearOf(a) - yearOf(b))[0] || '';
    parsed.dateOfIssueBack = parsed.dateOfIssue;
  }

  const sexValue = extractValueAfterLabel(lines, /SEX|GENDER|IGITSINA|TGTSINA/i, /\b[MGF](?:ALE|EMALE|e)?\b/i, 8);
  if (/^G/i.test(sexValue) || /\bMALE\b/i.test(text)) parsed.sex = 'G';
  else if (/^M/i.test(sexValue)) parsed.sex = 'M';
  else if (/^F/i.test(sexValue) || /\bFEMALE\b/i.test(text)) parsed.sex = 'F';

  const cardValue = extractValueAfterLabel(lines, /CARD\s*No|CARD\s*NUMBER|DOCUMENT\s*NUMBER|PASSPORT\s*NUMBER|LICEN[CS]E\s*NUMBER|YIKARITA/i, /\b[A-Z]?\s*\d(?:[A-Z0-9\s\-]){5,16}\b/i, 8);
  const cardMatch = cardValue.match(/\bA\s*\d(?:\s*\d){6,12}\b/i) || text.match(/\bA\d{6,12}\b/i);
  if (cardMatch) parsed.cardNo = cardMatch[0].replace(/\s+/g, '').toUpperCase();
  else if (cardValue) parsed.cardNo = cardValue.replace(/\s{2,}/g, ' ').toUpperCase();

  const bloodContext = scanContext(lines, findLineIndex(lines, /BLOOD GROUP|BLOOD|UBWOKO/i), 6);
  const bgLine = bloodContext.find(line => /(?:\bAB\b|\bA\b|\bB\b|\bO\b|\b0\b)\s*[+\-]|(^|\s)o\+|(^|\s)or(\s|$)/i.test(line));
  const bgMatch = bgLine?.match(/(?:\bAB\b|\bA\b|\bB\b|\bO\b|\b0\b)\s*[+\-]|(^|\s)o\+|(^|\s)or(\s|$)/i);
  if (bgMatch) {
    parsed.bloodGroup = bgMatch[0].replace(/\s+/g, '').replace(/^0/, 'O').replace(/or/i, 'O+').toUpperCase();
  }

  parsed.placeOfIssue = firstKnownPlaceIn(scanContext(lines, findLineIndex(lines, /PLACE OF ISSUE|YATANGIWE/i), 10), places);
  parsed.placeOfBirth = firstKnownPlaceIn(scanContext(lines, findLineIndex(lines, /PLACE OF BIRTH|YAVUTSE|YAWTSE/i), 10), places);

  const nationalityValue = extractValueAfterLabel(lines, /NATIONALITY|CITIZENSHIP|CITIZEN|UBWANGANZIRA|UBWENEGHUGU/i, /\b[A-Z][A-Z]{3,20}\b/i, 8);
  if (nationalityValue) {
    parsed.nationality = toTitleCase(nationalityValue);
    parsed.nationalityBack = parsed.nationality;
  } else if (countryProfile?.nationality) {
    parsed.nationality = countryProfile.nationality;
    parsed.nationalityBack = countryProfile.nationality;
  }

  const religions = ['Kiliziya Gatolika','Gatolika','Protestant','Adventist','Islam','Christian','Assembly of God'];
  const religionContext = scanContext(lines, findLineIndex(lines, /RELIGION|IDINI/i), 5).join(' ').toUpperCase();
  for (const r of religions) {
    if (religionContext.includes(r.toUpperCase()) || upper.includes(r.toUpperCase())) {
      parsed.religion = r === 'Gatolika' ? 'Gatolika' : r;
      break;
    }
  }

  const addressIndex = findLineIndex(lines, /ADDRESS|ADRESS|AHO ATUYE/i);
  if (addressIndex >= 0) {
    const addressParts = scanContext(lines, addressIndex, 10).filter(line =>
      /KG\s*\d+|KN\s*\d+|AVE|AVENUE|ROAD|ST|NYAMIRAMBO|KIMIRONKO|KIGALI/i.test(line) &&
      !/BLOOD|GROUP|UBWOKO/i.test(line)
    );
    parsed.address = addressParts
      .map(line => line.replace(/^.*?(KG\s*\d+)/i, '$1'))
      .join(', ')
      .replace(/,\s*,/g, ',')
      .trim();

    if (!parsed.address) {
      parsed.address = scanContext(lines, addressIndex + 1, 4)
        .filter(line => !isNoiseLine(line) && !/BLOOD|GROUP|NATIONALITY|SEX|DATE|VALID|ISSUE/i.test(line))
        .join(', ')
        .trim();
    }
  }

  if (!parsed.names) {
    const genericName = extractLooseValueAfterLabel(lines, /(?:FULL\s+)?NAME(?:S)?|SURNAME|GIVEN\s+NAMES?|CARDHOLDER|HOLDER/i, 8);
    if (genericName && isNameValue(genericName)) {
      parsed.names = cleanName(genericName);
    }
  }

  if (!parsed.names) {
    for (const line of lines) {
      if (!isNoiseLine(line) && isNameValue(line)) {
        parsed.names = cleanName(line);
        break;
      }
    }
  }

  if (parsed.nationality && /NATIONALITY|CITIZEN/i.test(parsed.nationality)) {
    parsed.nationality = countryProfile?.nationality || '';
    parsed.nationalityBack = parsed.nationality;
  }
  if (!parsed.country && parsed.nationality) {
    const nationalityCountry = COUNTRY_PROFILES.find(country => country.nationality?.toUpperCase() === parsed.nationality.toUpperCase());
    if (nationalityCountry) {
      parsed.country = nationalityCountry.name;
      parsed.originCountry = nationalityCountry.name;
    }
  }
  if (!parsed.originCountry && parsed.country) parsed.originCountry = parsed.country;
  if (!parsed.country) {
    parsed.country = 'Unknown Issuing Origin';
    parsed.originCountry = 'Unknown Issuing Origin';
  }
  if (!parsed.document && hasIdentityDocumentEvidence(text, parsed)) parsed.document = 'International ID';

  const fieldsToCheck: (keyof ExtractedIdData)[] = ['document','country','names','idNo','dob','sex','nationality','placeOfIssue','dateOfIssue','expiry','cardNo','placeOfIssueBack','dateOfIssueBack','validUntil','placeOfBirth','nationalityBack','religion','address','bloodGroup'];
  const populated = fieldsToCheck.reduce((count, key) => ((parsed as any)[key] && (parsed as any)[key].toString().trim().length > 0) ? count + 1 : count, 0);
  parsed.similarityScore = +(populated / fieldsToCheck.length).toFixed(2);

  return parsed;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { image, fileName, fileType } = req.body || {};
    if (!fileName || !fileType) return res.status(400).json({ error: 'Missing fileName or fileType in request body.' });

    // If image base64 present, run Tesseract OCR; otherwise fall back to filename-based extractor.
    if (image && typeof image === 'string') {
      // Strip data URL prefix if present
      let base64 = image;
      const commaIdx = base64.indexOf(',');
      if (commaIdx !== -1) base64 = base64.slice(commaIdx + 1);
      const buffer = Buffer.from(base64, 'base64');

      let ocr: OcrResult;
      try {
        ocr = await runTesseractOcr(buffer);
      } catch (ocrErr: any) {
        console.error('Tesseract recognition failed:', ocrErr?.message || ocrErr);
        return res.status(502).json({
          error: ocrErr?.message || 'Tesseract failed to extract text from the uploaded image.',
        });
      }

      const text = ocr.text || '';
      if (!text || text.trim().length === 0) {
        return res.status(422).json({
          error: 'OCR did not find readable text in the uploaded image. Try a clearer, front-facing scan.',
          ocrText: '',
          ocrConfidence: ocr.confidence ?? null,
        });
      }

      const parsed = parseOcrText(text, fileName) as ExtractedIdData & {
        ocrText?: string;
        ocrConfidence?: number | null;
      };
      parsed.ocrText = text;
      parsed.ocrConfidence = ocr.confidence ?? null;

      if (!hasIdentityDocumentEvidence(text, parsed)) {
        return res.status(422).json({
          error: 'Rejected: uploaded image does not appear to be a Genuine ID document.',
          ocrText: text,
          ocrConfidence: ocr.confidence ?? null,
        });
      }

      return res.status(200).json(parsed);
    }

    return res.status(400).json({
      error: 'OCR requires an uploaded image. No identity data was generated from the filename.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'OCR extraction failed' });
  }
}
