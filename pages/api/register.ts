import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createCompany, createUser, getUserByEmail } from '../../lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { companyName, companyEmail, companyContact, repName, repPosition, password } = req.body;
  if (!companyName || !companyEmail || !repName || !password) return res.status(400).send('Missing required fields');

  try {
    const existing = await getUserByEmail(companyEmail);
    if (existing) return res.status(409).send('An account with this email already exists');

    const companyId = await createCompany(companyName, companyEmail, companyContact);
    const passwordHash = bcrypt.hashSync(password, 10);
    const userId = await createUser(repName, repPosition || '', companyEmail, passwordHash, companyId);

    const token = jwt.sign({ userId, email: companyEmail }, JWT_SECRET, { expiresIn: '8h' });
    return res.status(201).json({ token, user: { id: userId, repName, repPosition, email: companyEmail } });
  } catch (e: any) {
    return res.status(500).send(e.message || 'Registration error');
  }
}
