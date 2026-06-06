import type { NextApiRequest, NextApiResponse } from 'next';
import type { ExtractedIdData } from '../../src/types';
import { extractFromJpg, generateRwandanIDFromFilename } from '../../lib/utils';

// Lightweight parser: map OCR text into the ExtractedIdData shape (best-effort)
function parseOcrText(text: string, fileName: string): ExtractedIdData {
  const fallback = generateRwandanIDFromFilename(fileName);

  const parsed: ExtractedIdData = {
    document: 'National Identity Card',
    country: 'Republic of Rwanda',
    names: '',
    idNo: '',
    dob: '',
    sex: '',
    nationality: 'Rwandan',
    placeOfIssue: '',
    dateOfIssue: '',
    expiry: '',
    cardNo: '',
    placeOfIssueBack: '',
    dateOfIssueBack: '',
    validUntil: '',
    placeOfBirth: '',
    nationalityBack: 'Rwandan',
    religion: '',
    address: '',
    bloodGroup: '',
    containsDemoText: /demo/i.test(text),
    containsSampleText: /sample/i.test(text),
    similarityScore: 0.0
  };

  const lines = text.replace(/\r/g, '\n').split('\n').map(l => l.trim()).filter(Boolean);
  const upper = text.toUpperCase();

  // ID number heuristics: contiguous 15-17 digits or grouped patterns
  let idMatch = text.match(/\b\d{15,17}\b/);
  if (!idMatch) {
    const grouped = text.match(/\b\d{3}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{1,4}\b/);
    if (grouped) idMatch = [grouped[0].replace(/\s+/g, '')];
  }
  if (idMatch) {
    const digits = idMatch[0].replace(/\D/g, '');
    if (digits.length === 16) {
      parsed.idNo = `${digits.substring(0,3)} ${digits.substring(3,7)} ${digits.substring(7,11)} ${digits.substring(11,15)} ${digits.substring(15)}`;
    } else {
      parsed.idNo = digits;
    }
  }

  // DOB detection (dd/mm/yyyy or yyyy-mm-dd)
  const dobMatch = text.match(/(\d{2}[\/\-\.\s]\d{2}[\/\-\.\s]\d{4})/) || text.match(/(\d{4}[\/\-\.\s]\d{2}[\/\-\.\s]\d{2})/);
  if (dobMatch) parsed.dob = dobMatch[0].replace(/[\.\-\s]/g, '/');

  // Sex detection
  if (/\bMALE\b/i.test(text) || /\bM\b(?![a-z])/i.test(text)) parsed.sex = 'G';
  else if (/\bFEMALE\b/i.test(text) || /\bF\b(?![a-z])/i.test(text)) parsed.sex = 'F';

  // Card number (A followed by digits)
  const cardMatch = text.match(/\bA\d{6,12}\b/i);
  if (cardMatch) parsed.cardNo = cardMatch[0].toUpperCase();

  // Blood group detection
  const bgMatch = text.match(/(?:\bAB\b|\bA\b|\bB\b|\bO\b)\s*[+\-]/i);
  if (bgMatch) parsed.bloodGroup = bgMatch[0].replace(/\s+/g, '').toUpperCase();

  // Place detection (best-effort list)
  const places = ['Kigali','Nyarugenge','Huye','Musanze','Rubavu','Bugesera','Kayonza','Rwamagana','Gicumbi','Karongi','Nyanza','Ruhango','Nyamagabe','Kamonyi','Gisenyi','Byumba','Kicukiro','Remera','Nyamirambo','Kanombe'];
  for (const p of places) {
    if (upper.includes(p.toUpperCase())) {
      if (!parsed.placeOfIssue) parsed.placeOfIssue = p;
      if (!parsed.placeOfBirth) parsed.placeOfBirth = p;
    }
  }

  // Religion
  const religions = ['Kiliziya Gatolika','Protestant','Adventist','Islam','Christian','Assembly of God'];
  for (const r of religions) {
    if (upper.includes(r.toUpperCase())) {
      parsed.religion = r;
      break;
    }
  }

  // Address heuristics: look for a line with 'KG' or 'AVE' or a comma and numbers
  for (const line of lines) {
    if (/KG\s+\d+/i.test(line) || /AVE|AVENUE|ST|ROAD|KN\s+\d+/i.test(line) || /,\s*\w+\s*$/.test(line)) {
      parsed.address = line;
      break;
    }
  }

  // Names: choose first long-ish line that doesn't look like header/footer
  const blacklist = ['REPUBLIC','RWANDA','NATIONAL','IDENTITY','IDENTIFICATION','ID','DOCUMENT','DOB','DATE','SEX','NID','ISSUE','PLACE','ADDRESS','SAMPLE','DEMO','SCAN','PHOTO'];
  for (const line of lines) {
    const u = line.toUpperCase();
    if (line.length > 4 && u.split(/\s+/).length >= 2 && !blacklist.some(k => u.includes(k))) {
      parsed.names = line.replace(/\s{2,}/g, ' ').trim();
      break;
    }
  }

  // If OCR gave almost nothing, fall back to filename-based deterministic generator
  const requiredCount = ['names','idNo','dob','sex','cardNo'];
  const present = requiredCount.filter(k => (parsed as any)[k]).length;
  if (present === 0) {
    return fallback;
  }

  // Compute similarity score as fraction of populated key fields (19 total)
  const fieldsToCheck: (keyof ExtractedIdData)[] = ['document','country','names','idNo','dob','sex','nationality','placeOfIssue','dateOfIssue','expiry','cardNo','placeOfIssueBack','dateOfIssueBack','validUntil','placeOfBirth','nationalityBack','religion','address','bloodGroup'];
  const populated = fieldsToCheck.reduce((count, key) => ((parsed as any)[key] && (parsed as any)[key].toString().trim().length > 0) ? count + 1 : count, 0);
  parsed.similarityScore = +(populated / fieldsToCheck.length).toFixed(2);

  return parsed;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { image, fileName, fileType, scenario } = req.body || {};
    if (!fileName || !fileType) return res.status(400).json({ error: 'Missing fileName or fileType in request body.' });

    // If image base64 present, run Tesseract OCR; otherwise fall back to filename-based extractor.
    if (image && typeof image === 'string') {
      // Strip data URL prefix if present
      let base64 = image;
      const commaIdx = base64.indexOf(',');
      if (commaIdx !== -1) base64 = base64.slice(commaIdx + 1);
      const buffer = Buffer.from(base64, 'base64');

      const tesseract = await import('tesseract.js');
      const createWorkerFn = (tesseract as any).createWorker || tesseract.createWorker;
      const worker: any = await createWorkerFn();

      // Preferred approach: call recognize directly; newer workers may come pre-loaded.
      let data: any;
      try {
        data = (await worker.recognize(buffer)) || {};
      } catch (ocrErr: any) {
        console.error('Tesseract recognition failed:', ocrErr?.message || ocrErr);
        try {
          if (worker && typeof worker.terminate === 'function') await worker.terminate();
        } catch (termErr) {
          console.warn('Failed to terminate tesseract worker after error:', termErr);
        }

        // Fallback to deterministic filename-based generator when OCR fails
        const generated = generateRwandanIDFromFilename(fileName);
        return res.status(200).json(generated);
      }

      try {
        if (worker && typeof worker.terminate === 'function') await worker.terminate();
      } catch (termErr) {
        console.warn('Failed to terminate tesseract worker:', termErr);
      }

      const text = data?.text || '';
      if (!text || text.trim().length === 0) {
        // Fallback to deterministic generator if OCR returned nothing
        const generated = generateRwandanIDFromFilename(fileName);
        return res.status(200).json(generated);
      }

      const parsed = parseOcrText(text, fileName);

      // Apply scenario modifiers
      if (scenario === 'invalid_id') return res.status(500).json({ error: 'Unreadable ID Document: OCR reports invalid layout.' });
      if (scenario === 'mismatch') {
        parsed.containsDemoText = false;
        parsed.containsSampleText = false;
        parsed.similarityScore = Math.min(parsed.similarityScore, 0.68);
      }
      if (scenario === 'sparse_scan') {
        // Zero-out most fields to simulate sparse extraction
        parsed.names = '';
        parsed.idNo = '';
        parsed.dob = '';
        parsed.sex = '';
        parsed.cardNo = '';
        parsed.similarityScore = 0.5;
      }

      return res.status(200).json(parsed);
    }

    // No image provided: fallback to existing helper (filename-based)
    const extracted = await extractFromJpg(fileName, fileType, scenario || 'match');
    return res.status(200).json(extracted);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'OCR extraction failed' });
  }
}
