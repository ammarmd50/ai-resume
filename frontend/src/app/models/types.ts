export interface Education {
  school: string;
  degree: string;
  fieldOfStudy: string;
  from: string | Date;
  to: string | Date | null;
  current: boolean;
  description: string;
}

export interface Experience {
  title: string;
  company: string;
  location: string;
  from: string | Date;
  to: string | Date | null;
  current: boolean;
  description: string;
}

export interface Project {
  title: string;
  description: string;
  technologies: string[];
  link: string;
}

export interface Certification {
  name: string;
  issuer: string;
  date: string | Date | null;
}

export interface UserProfile {
  phone: string;
  location: string;
  bio: string;
  skills: string[];
  education: Education[];
  experience: Experience[];
}

export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: 'candidate' | 'recruiter';
  profile?: UserProfile;
}

export interface GrammarMistake {
  mistake: string;
  correction: string;
  explanation: string;
}

export interface ImprovedBulletPoint {
  original: string;
  improved: string;
  reason: string;
}

export interface SuggestedImprovement {
  resumeTitle: string;
  summary: string;
  missingKeywords: string[];
  missingProjects: string[];
  missingAchievements: string[];
  improvedBulletPoints: ImprovedBulletPoint[];
}

export interface InterviewQuestion {
  question: string;
  answerOutline: string;
}

export interface LearningResource {
  skill: string;
  resourceName: string;
  url: string;
}

export interface ResumeAnalysis {
  detectedSkills: string[];
  missingSkills: string[];
  strongSkills: string[];
  weakSkills: string[];
  grammarCheck: GrammarMistake[];
  formattingIssues: string[];
  suggestions: SuggestedImprovement;
  linkedInHeadline: string;
  resumeHeadline: string;
  professionalBio: string;
  coverLetter: string;
  interviewQuestions: InterviewQuestion[];
  learningResources: LearningResource[];
}

export interface Resume {
  id?: string;
  _id?: string;
  userId: string;
  skills: string[];
  education: Education[];
  experience: Experience[];
  projects: Project[];
  certifications: Certification[];
  languages: string[];
  atsScore: number;
  aiSummary: string;
  uploadedFile?: {
    filename: string;
    path: string;
    originalName: string;
    mimeType: string;
    size: number;
  };
  analysis: ResumeAnalysis;
  createdAt?: string;
}

export interface Job {
  id?: string;
  _id?: string;
  recruiterId: string;
  title: string;
  company: string;
  location: string;
  skills: string[];
  description: string;
  salary: string;
  experience: string;
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Temporary' | 'Other';
  workMode: 'Remote' | 'Hybrid' | 'Onsite';
  matchPercentage?: number;
  matchExplanation?: string;
  missingSkills?: string[];
  strengths?: string[];
  createdAt?: string;
}

export interface Application {
  id?: string;
  _id?: string;
  userId: string | User;
  jobId: string | Job;
  resumeId?: string;
  status: 'Applied' | 'Reviewing' | 'Interview' | 'Rejected' | 'Selected';
  matchPercentage: number;
  coverLetter: string;
  createdAt?: string;
}

export interface Notification {
  id?: string;
  _id?: string;
  userId: string;
  title: string;
  message: string;
  type: 'RESUME_UPLOADED' | 'ATS_IMPROVED' | 'JOB_MATCHED' | 'APPLICATION_SUBMITTED' | 'INTERVIEW_SCHEDULED' | 'GENERAL';
  isRead: boolean;
  createdAt?: string;
}
