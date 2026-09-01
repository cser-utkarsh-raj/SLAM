export type WorkAuthStatus = 'Authorized' | 'Needs Sponsorship' | 'Citizen/PR' | 'Unknown';

export interface WorkExperience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  location?: string;
  bullets: string[];
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  graduationYear: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  country: string;
  timezone: string;
  headline: string;
  summary: string;
  yearsOfExperience: number;
  currentRole: string;
  targetRoles: string[];
  industries: string[];
  skills: string[];
  technologies: string[];
  certifications: string[];
  education: EducationItem[];
  workHistory: WorkExperience[];
  languages: string[];
  workAuth: WorkAuthStatus;
  sponsorshipRequired: boolean;
  noticePeriod: string;
  availability: string;
  relocationPreference: 'Yes' | 'No' | 'Remote Only';
  salaryExpectation: string;
}

export interface JobPreference {
  desiredRoles: string[];
  locations: string[];
  remotePreference: 'Any' | 'Remote Only' | 'Hybrid' | 'On-site';
  employmentTypes: ('Full-time' | 'Contract' | 'Part-time' | 'Internship')[];
  minSalary: number;
  maxSalary: number;
  experienceLevel: 'Entry' | 'Mid' | 'Senior' | 'Lead' | 'Executive';
  excludedCompanies: string[];
  excludedKeywords: string[];
  requiredKeywords: string[];
}

export interface JobSourceEntry {
  sourceName: string; // e.g. 'Company Careers', 'Greenhouse', 'Lever', 'LinkedIn', 'Indeed'
  sourceUrl: string;
  sourceType: 'Direct ATS' | 'Job Board' | 'Company Page' | 'Aggregator';
  postedDate: string;
  isOfficial: boolean;
}

export interface JobPosting {
  id: string;
  title: string;
  normalizedTitle: string;
  roleFamily: string;
  company: string;
  companyDomain?: string;
  location: string;
  remote: boolean;
  remoteType: 'Remote' | 'Hybrid' | 'On-site';
  employmentType: 'Full-time' | 'Contract' | 'Part-time';
  experienceLevel: string;
  minYearsExperience: number;
  minSalary?: number;
  maxSalary?: number;
  currency?: string;
  salaryText?: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  postingDate: string;
  freshnessLabel: string;
  lastSeenAt: string;
  applicationUrl: string;
  primarySource: string;
  sourcesList: JobSourceEntry[];
  applicationMethod: 'Direct ATS' | 'External Form' | 'Assisted Flow' | 'Supported Automation';
  recruiterName?: string;
  recruiterEmail?: string;
  applicantCount?: string | number;
  hardRequirements: string[];
  requiresWorkAuth?: boolean;
}

export interface CompatibilityBreakdown {
  skillsScore: number;      // max 30
  experienceScore: number;  // max 20
  roleScore: number;        // max 15
  locationScore: number;    // max 10
  qualificationScore: number; // max 10
  educationScore?: number;  // max 5
  industryScore?: number;   // max 5
  salaryScore?: number;     // max 5
}

export interface CompatibilityResult {
  compatibilityScore: number;
  opportunityScore: number;
  isEligible: boolean;
  eligibilityReason: string;
  matchedSkills: string[];
  partialSkills: string[];
  missingSkills: string[];
  strengths: string[];
  concerns: string[];
  breakdown: CompatibilityBreakdown;
  confidence?: 'High' | 'Medium' | 'Estimated';
}

export interface TailoredResume {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  timestamp: string;
  tailoredSummary: string;
  tailoredSkills: string[];
  tailoredWorkHistory: WorkExperience[];
  modificationsList: string[];
}

export interface ApplicationAnswer {
  id: string;
  question: string;
  normalizedQuestion: string;
  answer: string;
  source: 'User-Approved' | 'AI-Generated' | 'System Default';
  isApproved: boolean;
  lastUpdated: string;
  category: 'Authorization' | 'Compensation' | 'Availability' | 'Behavioral' | 'Technical' | 'General';
}

export type ApplicationStatus =
  | 'DISCOVERED'
  | 'SAVED'
  | 'PREPARED'
  | 'READY_TO_APPLY'
  | 'APPLIED'
  | 'HUMAN_ACTION_REQUIRED'
  | 'APPLICATION_FAILED'
  | 'INTERVIEW'
  | 'OFFER'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface ApplicationRecord {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  location: string;
  salaryText?: string;
  dateDiscovered: string;
  dateApplied?: string;
  status: ApplicationStatus;
  compatibilityScore: number;
  applicationMode: 'REVIEW' | 'ASSISTED' | 'AUTOMATED';
  resumeVersionUsed?: string;
  tailoredResume?: TailoredResume;
  coverLetter?: string;
  submittedAnswers?: { question: string; answer: string }[];
  notes: string;
  failureReason?: string;
  applicationUrl: string;
  source: string;
  lastUpdated: string;
}

export type AutomationStep =
  | 'IDLE'
  | 'DISCOVERED'
  | 'MATCHED'
  | 'PREPARING'
  | 'READY'
  | 'WAITING_FOR_USER'
  | 'AUTHENTICATED'
  | 'FILLING'
  | 'REVIEW'
  | 'SUBMITTING'
  | 'SUBMITTED'
  | 'HALTED_HUMAN_ACTION'
  | 'CANCELLED';

export interface AutomationLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'warn' | 'success' | 'alert';
}

export interface AutomationTask {
  taskId: string;
  jobId: string;
  jobTitle: string;
  company: string;
  mode: 'ASSISTED' | 'AUTOMATED';
  currentStep: AutomationStep;
  progress: number;
  statusMessage: string;
  humanActionRequiredReason?: string;
  logs: AutomationLog[];
  isPausable: boolean;
  isCancellable: boolean;
}
