import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { getUserById, createRecord } from '../../lib/db';
import { extractFromJpg } from '../../lib/utils';

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

async function getUserFromReq(req: NextApiRequest) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return await getUserById(decoded.userId);
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const user = await getUserFromReq(req);
  if (!user) return res.status(401).send('Unauthorized');

  const { fileName, fileType, scenario = 'match', customData } = req.body;
  try {
    let extracted;
    if (customData) {
      extracted = customData;
    } else {
      extracted = await extractFromJpg(fileName || 'unknown.jpg', fileType || 'image/jpeg', scenario);
    }

    const status = extracted.similarityScore >= 0.9 ? 'Verified' : 'Rejected';
    const reason = status === 'Rejected' ? `Similarity ${(extracted.similarityScore * 100).toFixed(0)}% below threshold` : undefined;
    const record = {
      id: `REC-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: new Date().toLocaleString(),
      extractedData: extracted,
      status,
      reason,
      fileName: fileName || 'uploaded.jpg',
      companyId: user.companyId
    };
    await createRecord(record as any);
    return res.status(201).json({ record });
  } catch (e: any) {
    return res.status(500).send(e.message || 'Verification error');
  }
}
