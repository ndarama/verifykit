/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PageId =
  | 'homepage'
  | 'register'
  | 'login'
  | 'dashboard'
  | 'verify'
  | 'result'
  | 'about'
  | 'faq'
  | 'privacy'
  | 'terms'
  | 'contact';

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'system' | 'auth' | 'validation' | 'file' | 'scanner' | 'comparison' | 'error' | 'success';
  message: string;
}

export interface CompanyData {
  companyName: string;
  companyEmail: string;
  companyContact: string;
  repName: string;
  repPosition: string;
  password?: string;
}

export interface ExtractedIdData {
  document: string;
  country: string;
  
  // Front Fields
  names: string;
  idNo: string;
  dob: string;
  sex: string;
  nationality: string;
  placeOfIssue: string;
  dateOfIssue: string;
  expiry: string;
  cardNo: string;

  // Back Fields
  placeOfIssueBack: string;
  dateOfIssueBack: string;
  validUntil: string;
  placeOfBirth: string;
  nationalityBack: string;
  religion: string;
  address: string;
  bloodGroup: string;

  // Security Markings & Score
  containsDemoText: boolean;
  containsSampleText: boolean;
  similarityScore: number;
}

export interface VerificationRecord {
  id: string;
  timestamp: string;
  extractedData: ExtractedIdData | null;
  status: 'Verified' | 'Rejected';
  reason?: string;
  fileName: string;
  companyEmail?: string;
}

