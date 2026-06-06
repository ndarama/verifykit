import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getUserByEmail } from '../../lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).send('Missing credentials');

  try {
    const user = await getUserByEmail(email);
    if (!user) return res.status(401).send('No account found');
    const ok = bcrypt.compareSync(password, user.passwordHash);
    if (!ok) return res.status(401).send('Invalid credentials');

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '8h' });
    return res.status(200).json({ token, user: { id: user.id, repName: user.repName, email: user.email, companyEmail: user.companyEmail } });
  } catch (e: any) {
    return res.status(500).send(e.message || 'Login error');
  }
}
