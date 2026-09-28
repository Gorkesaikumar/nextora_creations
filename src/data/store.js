/**
 * Centralized Store & Local Storage Repository with Automated Initial Seeding
 */

import {
  APPLICATION_STATUS,
  OPPORTUNITY_STATUS,
  OFFER_STATUS,
  INTERN_STATUS,
  CERTIFICATE_STATUS,
  DEFAULT_SETTINGS
} from './models.js';

const STORAGE_KEY = 'NEXTORA_RECRUITMENT_DB_V1';

const INITIAL_SEED = {
  settings: DEFAULT_SETTINGS,
  opportunities: [
    {
      id: 'opp-1',
      opportunityCode: 'NC-OPP-2026-0001',
      title: 'Full-Stack Software Engineering Intern',
      department: 'Software Engineering',
      project: 'Nextora POS & Enterprise Systems',
      description: 'Join Nextora Creations to engineer scalable Web & Cloud platforms. Work directly on full-stack web applications, REST APIs, and database engines.',
      responsibilities: `Develop robust web interfaces using modern JavaScript/TypeScript.
Design RESTful API endpoints and integrate backend microservices.
Collaborate on database schema design, optimization, and state management.
Participate in code reviews, bug fixes, and performance tuning.`,
      requiredSkills: 'JavaScript, Node.js, React/Vite, HTML5/CSS3, Tailwind CSS, PostgreSQL/MongoDB, Git',
      eligibility: 'B.Tech / B.E. / MCA / B.Sc Computer Science (2024, 2025, 2026 graduates)',
      workMode: 'Remote / Hybrid',
      duration: '3 - 6 Months',
      startDate: '2026-10-01',
      endDate: '2027-01-01',
      dailyHours: '5 Hours/day',
      openings: 5,
      deadline: '2026-10-15',
      stipendType: 'Performance Based / Stipend',
      stipendAmount: '₹8,000 - ₹15,000 / month',
      status: OPPORTUNITY_STATUS.OPEN,
      createdAt: '2026-09-01T10:00:00.000Z',
      updatedAt: '2026-09-01T10:00:00.000Z'
    },
    {
      id: 'opp-2',
      opportunityCode: 'NC-OPP-2026-0002',
      title: 'AI & Machine Learning Engineering Intern',
      department: 'AI & Data Science',
      project: 'Nextora Intelligence Suite',
      description: 'Build cutting-edge AI features, LLM workflows, automated data pipelines, and intelligent AI agents for modern enterprise client applications.',
      responsibilities: `Implement LLM API integrations (OpenAI, Gemini, Claude).
Build automated data extraction and processing pipelines using Python.
Develop custom AI prompt logic and fine-tuning experiments.
Integrate AI model outputs with web dashboards.`,
      requiredSkills: 'Python, FastAPI/Django, OpenAI/Gemini APIs, LangChain, NumPy, Pandas, Git',
      eligibility: 'B.Tech / M.Tech / Data Science specialization students',
      workMode: 'Remote',
      duration: '3 Months',
      startDate: '2026-10-05',
      endDate: '2027-01-05',
      dailyHours: '4-5 Hours/day',
      openings: 3,
      deadline: '2026-10-20',
      stipendType: 'Stipend',
      stipendAmount: '₹10,000 / month',
      status: OPPORTUNITY_STATUS.OPEN,
      createdAt: '2026-09-05T10:00:00.000Z',
      updatedAt: '2026-09-05T10:00:00.000Z'
    },
    {
      id: 'opp-3',
      opportunityCode: 'NC-OPP-2026-0003',
      title: 'UI/UX Design & Frontend Development Intern',
      department: 'Design & Frontend',
      project: 'EduNaukri & Nextora Web',
      description: 'Craft beautiful, pixel-perfect user interfaces, wireframes, animations, and high-conversion front-end web components.',
      responsibilities: `Design modern wireframes and high-fidelity UI mockups.
Convert Figma designs into clean responsive Tailwind CSS components.
Ensure high performance, mobile accessibility, and micro-interactions.`,
      requiredSkills: 'Figma, Tailwind CSS, HTML5, JavaScript, UI/UX Principles, Responsive Design',
      eligibility: 'Design or CS background with strong portfolio',
      workMode: 'Remote',
      duration: '3 Months',
      startDate: '2026-10-01',
      endDate: '2027-01-01',
      dailyHours: '4 Hours/day',
      openings: 2,
      deadline: '2026-10-12',
      stipendType: 'Stipend',
      stipendAmount: '₹7,000 / month',
      status: OPPORTUNITY_STATUS.OPEN,
      createdAt: '2026-09-10T10:00:00.000Z',
      updatedAt: '2026-09-10T10:00:00.000Z'
    }
  ],
  candidates: [
    {
      id: 'cand-demo-1',
      fullName: 'Rahul Sharma',
      email: 'rahul.sharma@example.com',
      phone: '+91 9876543210',
      city: 'Hyderabad',
      state: 'Telangana',
      college: 'JNTU Hyderabad',
      university: 'JNTUH',
      course: 'B.Tech',
      specialization: 'Computer Science & Engineering',
      graduationYear: '2026',
      skills: 'JavaScript, React, Node.js, Python, Tailwind CSS',
      linkedinUrl: 'https://linkedin.com/in/rahulsharma-demo',
      portfolioUrl: 'https://rahulsharma.dev',
      githubUrl: 'https://github.com/rahulsharma-demo',
      createdAt: '2026-09-15T10:00:00.000Z',
      updatedAt: '2026-09-15T10:00:00.000Z'
    }
  ],
  applications: [
    {
      id: 'app-demo-1',
      applicationCode: 'NC-APP-2026-0001',
      candidateId: 'cand-demo-1',
      opportunityId: 'opp-1',
      whyInterested: 'I want to build real enterprise software systems and gain practical engineering experience with Nextora Creations.',
      whySelectYou: 'I have strong Javascript fundamentals and built full-stack web projects.',
      availability: 'Immediate (Full Availability)',
      expectedStartDate: '2026-10-01',
      status: APPLICATION_STATUS.INTERNSHIP_COMPLETED,
      internalNotes: 'Top performing candidate during evaluation.',
      createdAt: '2026-09-15T10:30:00.000Z',
      updatedAt: '2026-09-24T10:00:00.000Z'
    }
  ],
  interviews: [
    {
      id: 'intv-demo-1',
      interviewCode: 'NC-INTV-2026-0001',
      applicationId: 'app-demo-1',
      date: '2026-09-18',
      time: '11:00 AM',
      mode: 'Google Meet',
      meetingLink: 'https://meet.google.com/abc-defg-hij',
      interviewer: 'Gorke Sai Kumar',
      communicationScore: 5,
      domainScore: 4,
      problemSolvingScore: 5,
      confidenceScore: 4,
      roleFitScore: 5,
      availabilityScore: 5,
      overallScore: 4.7,
      recommendation: 'Strong Select',
      notes: 'Excellent logical skills and clear communication.',
      status: 'COMPLETED'
    }
  ],
  offers: [
    {
      id: 'ofr-demo-1',
      offerCode: 'NC-OFR-2026-0001',
      applicationId: 'app-demo-1',
      role: 'Full-Stack Software Engineering Intern',
      department: 'Software Engineering',
      project: 'Nextora POS Platform',
      startDate: '2026-09-20',
      endDate: '2026-12-20',
      duration: '3 Months',
      workMode: 'Remote',
      expectedHours: '5 Hours / day',
      stipend: '₹10,000 / month',
      supervisor: 'Gorke Sai Kumar',
      issuedDate: '2026-09-19',
      expiryDate: '2026-09-25',
      status: OFFER_STATUS.ACCEPTED,
      documentVersion: 'v1.1',
      token: 'sec-offer-token-rahul-2026'
    }
  ],
  acceptances: [
    {
      id: 'acc-demo-1',
      offerId: 'ofr-demo-1',
      candidateId: 'cand-demo-1',
      accepted: true,
      termsVersion: 'v1.1',
      candidateTypedName: 'Rahul Sharma',
      acceptedAt: '2026-09-19T14:20:00.000Z',
      acceptanceMetadata: 'IP: 103.15.22.4, Browser: Chrome Desktop',
      createdAt: '2026-09-19T14:20:00.000Z'
    }
  ],
  interns: [
    {
      id: 'intern-demo-1',
      internCode: 'NC-INT-2026-0001',
      candidateId: 'cand-demo-1',
      applicationId: 'app-demo-1',
      offerId: 'ofr-demo-1',
      role: 'Full-Stack Software Engineering Intern',
      department: 'Software Engineering',
      project: 'Nextora POS Platform',
      supervisor: 'Gorke Sai Kumar',
      startDate: '2026-09-20',
      endDate: '2026-12-20',
      status: INTERN_STATUS.COMPLETED,
      completionPercentage: 100
    }
  ],
  activities: [
    {
      id: 'act-demo-1',
      internId: 'intern-demo-1',
      date: '2026-09-21',
      attendanceStatus: 'PRESENT',
      task: 'POS Module Frontend Setup',
      description: 'Built responsive Tailwind order entry components and state handlers.',
      hours: 5,
      status: 'APPROVED',
      supervisorNotes: 'Great execution quality.'
    }
  ],
  evaluations: [
    {
      id: 'eval-demo-1',
      internId: 'intern-demo-1',
      attendanceScore: 5,
      communicationScore: 5,
      professionalismScore: 5,
      workQualityScore: 5,
      initiativeScore: 5,
      teamworkScore: 4,
      problemSolvingScore: 5,
      projectCompletionScore: 5,
      overallScore: 4.9,
      supervisorComments: 'Outstanding contribution. Completed all deliverables ahead of schedule.',
      finalStatus: 'COMPLETED',
      evaluatedAt: '2026-09-24T16:00:00.000Z'
    }
  ],
  certificates: [
    {
      id: 'cert-demo-1',
      certificateCode: 'NC/INT/2026/0001',
      internId: 'intern-demo-1',
      certificateType: 'INTERNSHIP_COMPLETION',
      issueDate: '2026-09-24',
      status: CERTIFICATE_STATUS.VALID,
      verificationToken: 'vertok-demo-rahul-sharma-2026',
      documentVersion: 'v1.0',
      createdAt: '2026-09-24T17:00:00.000Z'
    }
  ],
  auditLogs: [
    {
      id: 'audit-demo-1',
      actor: 'SYSTEM',
      action: 'SYSTEM_INITIALIZED',
      entityType: 'SYSTEM',
      entityId: 'SYSTEM',
      metadata: { note: 'Nextora Recruitment System Engine initialized successfully' },
      timestamp: new Date().toISOString()
    }
  ]
};

class DataStore {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Ensure default structures are preserved
        return {
          settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
          opportunities: parsed.opportunities || INITIAL_SEED.opportunities,
          candidates: parsed.candidates || INITIAL_SEED.candidates,
          applications: parsed.applications || INITIAL_SEED.applications,
          interviews: parsed.interviews || INITIAL_SEED.interviews,
          offers: parsed.offers || INITIAL_SEED.offers,
          acceptances: parsed.acceptances || INITIAL_SEED.acceptances,
          interns: parsed.interns || INITIAL_SEED.interns,
          activities: parsed.activities || INITIAL_SEED.activities,
          evaluations: parsed.evaluations || INITIAL_SEED.evaluations,
          certificates: parsed.certificates || INITIAL_SEED.certificates,
          auditLogs: parsed.auditLogs || INITIAL_SEED.auditLogs
        };
      }
    } catch (e) {
      console.warn('Failed to load storage, initializing seed defaults:', e);
    }
    this.save(INITIAL_SEED);
    return INITIAL_SEED;
  }

  save(data = this.data) {
    this.data = data;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to save to local storage:', e);
    }
  }

  resetToSeed() {
    this.save(INITIAL_SEED);
    return this.data;
  }

  // Getters
  getSettings() { return this.data.settings; }
  getOpportunities() { return this.data.opportunities || []; }
  getCandidates() { return this.data.candidates || []; }
  getApplications() { return this.data.applications || []; }
  getInterviews() { return this.data.interviews || []; }
  getOffers() { return this.data.offers || []; }
  getAcceptances() { return this.data.acceptances || []; }
  getInterns() { return this.data.interns || []; }
  getActivities() { return this.data.activities || []; }
  getEvaluations() { return this.data.evaluations || []; }
  getCertificates() { return this.data.certificates || []; }
  getAuditLogs() { return this.data.auditLogs || []; }

  // Setters / Updaters
  updateSettings(newSettings) {
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.save();
    return this.data.settings;
  }

  saveEntity(collectionName, entity) {
    if (!this.data[collectionName]) {
      this.data[collectionName] = [];
    }
    const idx = this.data[collectionName].findIndex(item => item.id === entity.id);
    if (idx >= 0) {
      this.data[collectionName][idx] = { ...this.data[collectionName][idx], ...entity, updatedAt: new Date().toISOString() };
    } else {
      this.data[collectionName].push({
        ...entity,
        createdAt: entity.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    this.save();
    return entity;
  }

  deleteEntity(collectionName, id) {
    if (!this.data[collectionName]) return false;
    this.data[collectionName] = this.data[collectionName].filter(item => item.id !== id);
    this.save();
    return true;
  }
}

export const db = new DataStore();
