import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { getUserById, getRecordsByCompanyId } from '../../lib/db';

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
  const user = await getUserFromReq(req);
  if (!user) return res.status(401).send('Unauthorized');
  const records = await getRecordsByCompanyId(user.companyId);
  return res.status(200).json({ records });
}
