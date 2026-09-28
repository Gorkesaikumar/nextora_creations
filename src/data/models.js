/**
 * Master Data Models & Constants for Nextora Creations Recruitment System
 */

export const APPLICATION_STATUS = {
  APPLIED: 'APPLIED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  SHORTLISTED: 'SHORTLISTED',
  INTERVIEW_SCHEDULED: 'INTERVIEW_SCHEDULED',
  INTERVIEW_COMPLETED: 'INTERVIEW_COMPLETED',
  SELECTED: 'SELECTED',
  REJECTED: 'REJECTED',
  OFFER_ISSUED: 'OFFER_ISSUED',
  OFFER_ACCEPTED: 'OFFER_ACCEPTED',
  INTERNSHIP_ACTIVE: 'INTERNSHIP_ACTIVE',
  INTERNSHIP_COMPLETED: 'INTERNSHIP_COMPLETED',
  CERTIFICATE_ISSUED: 'CERTIFICATE_ISSUED'
};

export const OPPORTUNITY_STATUS = {
  DRAFT: 'DRAFT',
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  ARCHIVED: 'ARCHIVED'
};

export const OFFER_STATUS = {
  ISSUED: 'ISSUED',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
  EXPIRED: 'EXPIRED'
};

export const INTERN_STATUS = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  TERMINATED: 'TERMINATED'
};

export const CERTIFICATE_STATUS = {
  VALID: 'VALID',
  REVOKED: 'REVOKED',
  SUPERSEDED: 'SUPERSEDED'
};

export const EVALUATION_FINAL_STATUS = {
  COMPLETED: 'COMPLETED',
  INCOMPLETE: 'INCOMPLETE',
  TERMINATED: 'TERMINATED'
};

export const DEFAULT_SETTINGS = {
  orgName: 'Nextora Creations',
  orgTagline: 'We Build Systems For Your Business',
  orgEmail: 'support@nextoracreations.co.in',
  orgWebsite: 'https://nextoracreations.co.in',
  orgPhone: '+91 7674981970',
  orgAddress: 'Hyderabad, Telangana, India',
  signatoryName: 'Gorke Sai Kumar',
  signatoryTitle: 'Founder & CEO',
  appPrefix: 'NC-APP-',
  offerPrefix: 'NC-OFR-',
  internPrefix: 'NC-INT-',
  certificatePrefix: 'NC/INT/',
  termsVersion: 'v1.1',
  termsContent: `
### NEXTORA CREATIONS — INTERNSHIP TERMS & CONDITIONS (v1.1)

1. **NATURE OF INTERNSHIP**: This program is an experiential learning and professional development internship offered by Nextora Creations. It is designed to provide practical experience on software engineering, AI, and business project deliverables.
2. **DURATION & TIMELINE**: The internship duration shall be strictly as specified in the official Offer Letter. Extensions or early completions require written approval from Nextora Creations management.
3. **WORK EXPECTATIONS & ATTENDANCE**: Interns are expected to dedicate the agreed daily hours (e.g. 4-6 hours/day), maintain regular attendance, complete assigned tasks promptly, and update their daily activity log.
4. **PROFESSIONAL CONDUCT**: High standards of professional integrity, punctuality, teamwork, and communication must be maintained throughout the internship period.
5. **CONFIDENTIALITY & NON-DISCLOSURE**: All project source code, client records, internal architectures, algorithms, and business communications remain strictly confidential proprietary property of Nextora Creations.
6. **INTELLECTUAL PROPERTY**: All work products, software, documentation, designs, or code created during the internship belong exclusively to Nextora Creations.
7. **COMPANY RESOURCES**: Any development tools, credentials, server access, or APIs provided must be used solely for authorized project tasks.
8. **EVALUATION & CERTIFICATION**: Certificates of Completion are awarded solely upon successful fulfillment of internship objectives, positive supervisor evaluation, minimum 85% task completion rate, and full compliance with terms.
9. **TERMINATION**: Nextora Creations reserves the right to terminate the internship in cases of non-performance, breach of confidentiality, misrepresentation, or misconduct.
10. **ISSUANCE NOTICE**: Issued by Nextora Creations. This program is an industry internship program.
  `
};

export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function generateSecureToken(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const values = new Uint8Array(length);
    crypto.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      result += chars[values[i] % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return result;
}

export function generateFormattedCode(prefix, year, count) {
  const padded = String(count).padStart(4, '0');
  return `${prefix}${year}-${padded}`;
}

export function generateCertificateCode(year, count) {
  const padded = String(count).padStart(4, '0');
  return `NC/INT/${year}/${padded}`;
}
