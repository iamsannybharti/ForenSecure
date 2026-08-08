import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { rateLimit } from 'express-rate-limit';
import { and, arrayContains, asc, desc, eq, gt, sql } from 'drizzle-orm';
import {
  db,
  connectDB,
  asUuid,
  users,
  courses,
  quizzes,
  certificates,
  research,
  contacts,
  seminars,
  blogs,
  accessMatrix,
  dropdownOptions,
  learningPaths,
  announcements,
  studentNotes,
  notifications,
  teamMembers
} from './db/index';
import type { AssignmentSubmission, CompletedQuiz, CourseProgress, QuizScore, UserCertificate } from './db/schema';
import { sortAnnouncements } from './announcements';
import { sortNotifications } from './notifications';
import { isCourseComplete, computePathProgress as computePathProgressPure } from './learningPathLogic';
import { gradeQuiz } from './quizGrading';
import { isAllowed, DEFAULT_MATRIX, PermAction } from './permissions';
import { generateSecret, verifyTotp, otpauthURL } from './totp';
import { computeCourseAnalytics, computeOverview } from './analytics';
import { isAllowedUpload, safeUploadName } from './uploads';
import { validateSchedule, expandSchedule } from './courseSchedule';
import { demoPrograms, demoLiveSessions } from './demoPrograms';
import { inviteTemplate, readMailerConfig, resetPasswordUrl, resetTemplate, sendMail } from './mailer';
import { publicUser, hashToken, issueToken, validatePassword } from './security';
import dotenv from 'dotenv';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// The dev fallback is a published string — anyone holding it can mint a token
// for any user, including an admin. Outside development it has to come from the
// environment, and refusing to boot is the only way that stays true.
const JWT_SECRET = (() => {
  const fromEnv = process.env.JWT_SECRET;
  if (fromEnv && fromEnv.length >= 32) return fromEnv;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set to at least 32 characters in production');
  }
  if (fromEnv) {
    console.warn('[WARNING] JWT_SECRET is shorter than 32 characters. Set a longer one before deploying.');
    return fromEnv;
  }
  console.warn('[WARNING] JWT_SECRET is unset — using the development fallback. Never deploy with this.');
  return 'forensecure_secret_jwt_key_2026_safe';
})();

// Global Middlewares
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(morgan('dev'));

// Uploaded course media (videos, PDFs, study material) served statically
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Copy generated course thumbnails to UPLOAD_DIR on startup
const generatedImages = [
  { src: 'intro_forensic_1785072895575.png', dest: 'intro_forensic.png' },
  { src: 'forensic_biometrics_1785072911153.png', dest: 'forensic_biometrics.png' },
  { src: 'crime_scene_inv_1785072924171.png', dest: 'crime_scene_inv.png' },
  { src: 'cyber_forensics_1785072938769.png', dest: 'cyber_forensics.png' },
  { src: 'scene_recon_1785072952618.png', dest: 'scene_recon.png' }
];

for (const img of generatedImages) {
  const srcPath = path.join('C:\\Users\\sbharti\\.gemini\\antigravity-ide\\brain\\c41d2a36-9403-45f3-bbbb-4fccc0690e0b', img.src);
  const destPath = path.join(UPLOAD_DIR, img.dest);
  if (fs.existsSync(srcPath)) {
    try {
      fs.copyFileSync(srcPath, destPath);
      console.log(`[INFO] Copied ${img.src} to ${img.dest}`);
    } catch (e) {
      console.error(`[ERROR] Failed to copy image ${img.src}:`, e);
    }
  }
}

app.use('/uploads', express.static(UPLOAD_DIR));

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000, // Increased from 200 to 10000 for testing/dev ease
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' }
});
app.use('/api/', apiLimiter);

// Root healthcheck route for domain verification
app.get('/', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'ForenSecure API', timestamp: new Date().toISOString() });
});


// Credential endpoints get a far tighter budget than the rest of the API
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Increased from 10 to 1000 for testing/dev ease
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please wait 15 minutes and try again.' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/mfa/login', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password-magic', authLimiter);
app.use('/api/auth/verify-magic-token', authLimiter);

// --- IN-MEMORY SIMULATION DATASETS (FALLBACK) ---
let mockUsers: any[] = [
  {
    id: 'admin_mock_id',
    name: 'Admin Investigator',
    email: 'imailforensecure@gmail.com',
    passwordHash: '', // Hash filled on boot
    role: 'admin',
    enrolledCourses: [],
    successfulPayments: [],
    completedQuizzes: [],
    certificates: []
  },
  {
    id: 'teacher_mock_id',
    name: 'Teacher Faculty',
    email: 'teacher@forensecure.edu.in',
    passwordHash: '', // Hash filled on boot
    role: 'teacher',
    enrolledCourses: [],
    successfulPayments: [],
    completedQuizzes: [],
    certificates: []
  },
  {
    id: 'student_mock_id',
    name: 'Student Candidate',
    email: 'student@forensecure.edu.in',
    passwordHash: '', // Hash filled on boot
    role: 'student',
    enrolledCourses: [],
    successfulPayments: [],
    completedQuizzes: [],
    certificates: []
  }
];

const defaultMockPasswordHash = bcrypt.hashSync('ForenSecure2026!', 10);
mockUsers.forEach(user => { user.passwordHash = defaultMockPasswordHash; });

let mockStudentNotes: any[] = [];
let mockNotifications: any[] = [];

let mockDropdowns: any[] = [
  { id: 'dd_1', category: 'Course Categories', label: 'Digital Forensics', value: 'Digital Forensics', relatedTo: 'Cyber Defense' },
  { id: 'dd_2', category: 'Course Categories', label: 'Physical Investigation', value: 'Physical Investigation', relatedTo: 'Criminology' },
  { id: 'dd_3', category: 'Course Categories', label: 'Biometrics', value: 'Biometrics', relatedTo: 'Security' },
  { id: 'dd_4', category: 'Course Categories', label: 'Cyber Law', value: 'Cyber Law', relatedTo: 'Legal' },
  { id: 'dd_5', category: 'Difficulty Levels', label: 'Beginner', value: 'Beginner', relatedTo: 'Foundation' },
  { id: 'dd_6', category: 'Difficulty Levels', label: 'Intermediate', value: 'Intermediate', relatedTo: 'Mid-Level' },
  { id: 'dd_7', category: 'Difficulty Levels', label: 'Advanced', value: 'Advanced', relatedTo: 'Expert' }
];

let mockCourses: any[] = [
  {
    id: 'course_intro_forensic',
    title: 'Introduction to Forensic Science',
    subTitle: 'Professional Foundation Micro Certification',
    slug: 'introduction-to-forensic-science',
    thumbnailUrl: '/uploads/intro_forensic.png',
    description: 'Master the fundamentals of forensic science through a practical, industry-oriented certification designed for beginners. Learn crime scene investigation, evidence handling, fingerprint science, forensic biology, chemistry, toxicology, and the legal framework that supports criminal investigations.',
    overview: `The Introduction to Forensic Science Micro Certification is a beginner-friendly professional program designed to provide a strong foundation in modern forensic science. Unlike traditional theory-based courses, this program combines conceptual learning with practical demonstrations, crime scene simulations, case studies, and assessments to help learners understand how forensic science supports criminal investigations. Whether you are preparing for a career in forensic science, law enforcement, legal studies, or competitive examinations, this course equips you with the essential knowledge and practical skills needed to begin your journey with confidence.`,
    category: 'Micro Certification',
    level: 'Beginner (Level 1)',
    difficulty: 'Beginner',
    durationWeeks: 2,
    durationHours: '15 Hours',
    learningMode: 'Online + Recorded Lectures',
    certificateName: 'ForenSecure Micro Certificate',
    certificateValidity: 'Lifetime',
    instructorName: 'Dr. Simranjeet Kaur',
    instructorTitle: 'Senior Forensic Scientist & Academic Director',
    rating: 4.9,
    ratingCount: 420,
    studentsCount: 3100,
    priceINR: 4999,
    eligibility: [
      '12th Pass Students',
      'Undergraduate Students',
      'Law Students',
      'Police Personnel',
      'Competitive Exam Aspirants'
    ],
    assessmentStructure: [
      { name: 'Module Quizzes', weightage: '20%' },
      { name: 'Practical Assignments', weightage: '20%' },
      { name: 'Case Study Analysis', weightage: '20%' },
      { name: 'Final MCQ Examination', weightage: '40%' }
    ],
    passingCriteria: '50% Overall Score',
    highlights: [
      'Beginner Friendly - No prior forensic knowledge required.',
      'Industry-Oriented Curriculum - Designed using modern forensic investigation practices.',
      'Practical Learning - Includes quizzes, case studies, and practical activities.',
      'Lifetime Certificate - Receive a lifetime-valid digital micro certification upon successful completion.',
      'Flexible Learning - Learn anytime through online recorded lectures.',
      'Career Ready - Ideal foundation before pursuing advanced forensic specializations.'
    ],
    whatYouWillLearn: [
      'Understand the fundamentals of forensic science.',
      'Identify different categories of forensic evidence.',
      'Understand crime scene investigation procedures.',
      'Learn fingerprint examination principles.',
      'Explore biological and chemical evidence.',
      'Understand forensic toxicology and forensic medicine.',
      'Maintain proper chain of custody.',
      'Understand Indian legal provisions related to forensic evidence.',
      'Build a strong foundation for advanced forensic certifications.'
    ],
    syllabus: [
      'Module 1: Fundamentals of Forensic Science (History, Scope, Locard Principle, Ethics)',
      'Module 2: Crime Scene Management (Security, Documentation, Search, Packaging, Chain of Custody)',
      'Module 3: Forensic Fingerprint Science (Ridge Characteristics, Patterns, Latent Prints, AFIS)',
      'Module 4: Introduction to Forensic Biology (Blood, Saliva, Hair, Bone, DNA Basics)',
      'Module 5: Introduction to Forensic Chemistry (Drugs, Paint, Glass, Soil, Explosives)',
      'Module 6: Forensic Toxicology & Forensic Medicine (Poisons, Toxicity, Viscera, Postmortem)',
      'Module 7: Legal Aspects & Expert Witness (Indian Evidence Law, Court Procedures, Ethics)',
      'Module 8: Integrated Case Study & Final Assessment (Complete Investigation, Exam)'
    ],
    learningResources: [
      'HD Video Lectures',
      'Downloadable Notes',
      'Crime Scene Illustrations',
      'Fingerprint Charts',
      'Evidence Handling SOPs',
      'Indian Case Studies',
      'Practice MCQs',
      'Revision Handbook'
    ],
    careerBenefits: [
      'Build a strong foundation in forensic science.',
      'Prepare for advanced certifications.',
      'Develop practical investigation skills.',
      'Strengthen your competitive exam preparation.',
      'Enhance your readiness for forensic laboratories and law enforcement support roles.'
    ],
    whoShouldEnroll: [
      'Students interested in forensic science',
      'Law students',
      'Police and law enforcement personnel',
      'Competitive examination aspirants',
      'Security professionals',
      'Private investigators',
      'Anyone looking to begin a career in forensic science'
    ],
    nextSteps: [
      'Crime Scene Investigation Professional',
      'Fingerprint Identification & AFIS',
      'Forensic Biology & DNA Analysis',
      'Forensic Chemistry',
      'Forensic Toxicology & Medicine',
      'Questioned Document Examination',
      'Digital Forensics',
      'Cyber Crime Investigation',
      'Advanced Forensic Investigation Professional Certificate'
    ],
    bannerSvgType: 'crimescene',
    isActive: true,
    targetPercentage: 60,
    topics: []
  },
  {
    id: 'course_forensic_biometrics',
    title: 'Certified Micro Certificate in Forensic Biometrics',
    subTitle: 'Professional Certification Program',
    slug: 'forensic-biometrics-micro-certification',
    thumbnailUrl: '/uploads/forensic_biometrics.png',
    description: 'Build practical expertise in modern forensic biometric technologies used in criminal investigations, digital identity verification, border security, and cybercrime investigations. Learn through live sessions, virtual laboratories, practical exercises, and real-world case studies.',
    overview: `The Certified Micro Certificate in Forensic Biometrics is an industry-oriented certification program designed to provide learners with both the scientific principles and practical applications of biometric identification. From fingerprint science and facial recognition to iris analysis, behavioural biometrics, and AI-powered identification systems, this course prepares learners to understand how biometric technologies are applied in modern forensic investigations. Delivered through live expert sessions, virtual laboratories, case-based learning, and practical assessments, the program develops technical knowledge alongside real investigative skills, making it suitable for both academic progression and professional development.`,
    category: 'Biometrics',
    level: 'Beginner to Intermediate',
    difficulty: 'Intermediate',
    durationWeeks: 4,
    durationHours: '30 Hours (15 Hours Live + 15 Hours Self-Paced Learning)',
    learningMode: 'Online (Live Interactive Sessions + Recorded Lectures + Virtual Practical Laboratory)',
    certificateName: 'ForenSecure Certified Micro Certificate in Forensic Biometrics',
    certificateValidity: 'Lifetime',
    instructorName: 'Shri R. K. Sharma',
    instructorTitle: 'Veteran Fingerprint Director, Central Forensic Science Laboratory',
    rating: 4.9,
    ratingCount: 310,
    studentsCount: 1850,
    priceINR: 7999,
    highlights: [
      'Industry-Oriented Curriculum - Designed around modern forensic investigation practices.',
      'Practical Virtual Labs - Gain hands-on experience through guided biometric analysis exercises.',
      'Learn from Experts - Live interactive sessions with experienced forensic professionals.',
      'AI & Modern Technologies - Explore emerging biometric technologies including AI-powered identification systems.',
      'Career-Focused Certification - Build skills relevant for forensic laboratories, law enforcement, cybersecurity, and digital identity systems.',
      'Flexible Learning - Learn through a combination of live classes, recorded lectures, and self-paced study.'
    ],
    targetAudience: [
      'Undergraduate Students',
      'Postgraduate Students',
      'Forensic Science Aspirants',
      'Police & Law Enforcement Personnel',
      'Legal Professionals',
      'Cybersecurity Professionals',
      'Competitive Examination Aspirants',
      'Working Professionals seeking upskilling'
    ],
    learningOutcomes: [
      'Understand forensic biometric technologies and their role in criminal investigations.',
      'Differentiate physiological and behavioural biometrics.',
      'Examine and classify fingerprint evidence using forensic methodologies.',
      'Understand AFIS and biometric database systems.',
      'Analyze facial, iris, retinal, palmprint, vein, and voice biometrics.',
      'Apply evidence collection and preservation techniques.',
      'Understand legal admissibility of biometric evidence.',
      'Evaluate ethical, privacy, and cybersecurity challenges.',
      'Prepare professional forensic biometric examination reports.'
    ],
    syllabus: [
      'Module 1: Introduction to Forensic Biometrics',
      'Module 2: Fundamentals of Human Identification',
      'Module 3: Fingerprint Science & Identification',
      'Module 4: Automated Fingerprint Identification Systems (AFIS)',
      'Module 5: Facial Recognition Technologies',
      'Module 6: Iris & Retinal Biometrics',
      'Module 7: Palmprint, Hand Geometry & Vein Biometrics',
      'Module 8: Behavioural Biometrics',
      'Module 9: DNA Profiling & Biometrics',
      'Module 10: Crime Scene Biometrics & Evidence Collection',
      'Module 11: Legal, Ethical & Privacy Considerations',
      'Module 12: Emerging Trends in Forensic Biometrics'
    ],
    virtualLabs: [
      'Fingerprint Analysis',
      'Latent Print Development',
      'AFIS Simulation',
      'Facial Recognition',
      'Iris Examination',
      'Palmprint Analysis',
      'Voice Biometrics',
      'Crime Scene Evidence Collection',
      'Professional Forensic Report Preparation'
    ],
    learningResources: [
      'HD Video Lectures',
      'Digital Study Notes',
      'Interactive Infographics',
      'Downloadable Resources',
      'Practical Demonstrations',
      'Flashcards',
      'Chapter Summaries',
      'Assignments',
      'Case Studies',
      'Discussion Forums',
      'Practice Tests',
      'Revision MCQs'
    ],
    assessmentStructure: [
      { name: 'Module Quizzes', weightage: '20%' },
      { name: 'Practical Assignments', weightage: '20%' },
      { name: 'Case Study Analysis', weightage: '15%' },
      { name: 'Discussion Participation', weightage: '10%' },
      { name: 'Capstone Project', weightage: '15%' },
      { name: 'Final Online Examination', weightage: '20%' }
    ],
    capstoneProjectScenarios: [
      'Biometric Attendance System Design',
      'Criminal Identification Investigation',
      'Authentication Technology Evaluation',
      'Expert Witness Report Preparation',
      'Privacy & Security Assessment'
    ],
    certificationRequirements: 'Achieve a minimum 60% overall score, score at least 50% in the final examination, and successfully complete all practical assignments, learning modules, and the capstone project.',
    careerOpportunities: [
      'Forensic Science Laboratories',
      'Law Enforcement Agencies',
      'Digital Identity & Authentication',
      'Border Security',
      'Cybersecurity & Digital Forensics',
      'Government Investigation Agencies',
      'Research & Higher Education',
      'Biometric Technology Companies'
    ],
    bannerSvgType: 'fingerprint',
    isActive: true,
    targetPercentage: 60,
    topics: []
  },
  {
    id: 'course_police_capacity_building',
    title: 'Certificate Programme in Applied Forensic Science & Crime Scene Investigation',
    subTitle: 'Professional Capacity Building Programme for Police Personnel',
    slug: 'applied-forensic-science-crime-scene-investigation-police',
    thumbnailUrl: '/uploads/crime_scene_inv.png',
    description: 'A comprehensive professional training programme designed to strengthen the forensic investigation capabilities of police personnel through practical crime scene exercises, evidence management, digital investigation techniques, medico-legal procedures, and courtroom preparation.',
    overview: `The Certificate Programme in Applied Forensic Science & Crime Scene Investigation is a specialized capacity-building initiative developed to equip police personnel with the practical knowledge and investigative skills required for modern criminal investigations. The programme focuses on scientific crime scene management, forensic evidence collection, digital investigations, medico-legal procedures, and legal compliance under the latest Indian criminal laws. Through classroom learning, practical demonstrations, mock crime scenes, and scenario-based exercises, participants develop the competencies needed to improve investigation quality and support successful prosecution.`,
    category: 'Police Capacity Building',
    level: 'Intermediate',
    difficulty: 'Intermediate',
    durationWeeks: 4,
    durationHours: '30 Hours (Basic) / 45 Hours (Advanced)',
    learningMode: 'Hybrid Learning (Online + Practical Demonstrations + On-site Workshops)',
    certificateName: 'Certificate of Competency in Applied Forensic Investigation',
    certificateValidity: 'Lifetime',
    instructorName: 'Prof. Meera Deshmukh & CFSL Veterans',
    instructorTitle: 'Lead Police Training Instructors',
    rating: 5.0,
    ratingCount: 520,
    studentsCount: 2200,
    priceINR: 11999,
    designedFor: 'Police Personnel',
    targetParticipants: [
      'Constables',
      'Head Constables',
      'Assistant Sub-Inspectors (ASI)',
      'Sub-Inspectors (SI)',
      'Inspectors',
      'Investigation Officers',
      'Cyber Cell Officers',
      'Women Police Personnel',
      'Newly Recruited Police Officers'
    ],
    highlights: [
      'Practical Police-Oriented Training - Designed around real investigative challenges faced by law enforcement agencies.',
      'Crime Scene Simulations - Hands-on practical exercises using mock crime scenes and real investigation scenarios.',
      'Evidence-Based Investigation - Learn scientific evidence collection, preservation, and documentation techniques.',
      'Latest Legal Framework - Covers current Indian criminal laws including BNS, BNSS, BSA, and IT Act provisions.',
      'Expert-Led Sessions - Training delivered by experienced forensic professionals and subject matter experts.',
      'Competency-Based Certification - Focused on improving operational effectiveness and investigative confidence.'
    ],
    learningObjectives: [
      'Understand the role of forensic science in criminal investigations.',
      'Secure and preserve crime scenes using scientific procedures.',
      'Collect, package, preserve, and transport forensic evidence correctly.',
      'Prevent contamination of physical and biological evidence.',
      'Improve investigation quality using forensic techniques.',
      'Coordinate effectively with forensic laboratories.',
      'Understand medico-legal procedures during investigations.',
      'Prepare effective forensic examination requisitions.',
      'Handle digital and cyber evidence legally.',
      'Present forensic evidence confidently before courts.'
    ],
    syllabus: [
      'Module 1: Introduction to Forensic Science',
      'Module 2: Crime Scene Management',
      'Module 3: Physical Evidence Handling',
      'Module 4: Fingerprint Examination',
      'Module 5: Biological Evidence & DNA',
      'Module 6: Cyber & Digital Evidence',
      'Module 7: Forensic Medicine',
      'Module 8: Narcotics & Toxicology',
      'Module 9: Legal Provisions & Courtroom Testimony',
      'Module 10: Regional Investigation Challenges'
    ],
    practicalTraining: [
      'Mock Murder Investigation',
      'Road Accident Investigation',
      'Crime Scene Documentation',
      'Evidence Packaging',
      'Fingerprint Development',
      'Crime Scene Photography',
      'Digital Device Seizure Exercises'
    ],
    assessmentStructure: [
      { name: 'MCQ Examination', weightage: '30%' },
      { name: 'Practical Assessment', weightage: '40%' },
      { name: 'Crime Scene Exercise', weightage: '20%' },
      { name: 'Attendance', weightage: '10%' }
    ],
    programmeOutcomes: [
      'Conduct scientifically sound crime scene investigations.',
      'Handle forensic evidence according to established protocols.',
      'Support forensic laboratories through accurate documentation.',
      'Investigate digital evidence using accepted legal procedures.',
      'Strengthen case preparation through scientific evidence.',
      'Improve courtroom presentation of forensic findings.',
      'Enhance operational effectiveness during criminal investigations.'
    ],
    alignment: 'This programme is aligned with recognized national training objectives and current Indian criminal laws (BNS, BNSS, BSA, IT Act), supporting competency development in applied forensic investigation and modern policing practices.',
    whoShouldAttend: [
      'State Police Departments',
      'District Police Units',
      'Crime Branch Officers',
      'Investigation Officers',
      'Cyber Crime Units',
      'Women Police Personnel',
      'Police Training Academies',
      'Newly Recruited Police Officers'
    ],
    bannerSvgType: 'crimescene',
    isActive: true,
    targetPercentage: 60,
    topics: []
  },
  {
    id: 'course_mock_1',
    title: 'Certified Cyber Forensics & Incident Response Specialist',
    slug: 'cyber-forensics-incident-response',
    thumbnailUrl: '/uploads/cyber_forensics.png',
    description: 'Master the art of tracking digital footprints, recovering deleted files, network forensic analysis, and handling cyber security incidents under Indian IT Law guidelines.',
    category: 'Digital Forensics',
    instructorName: 'Dr. Aravind Swaminathan',
    instructorTitle: 'Former Scientist, Government Cyber Defense Cell',
    durationWeeks: 12,
    difficulty: 'Advanced',
    rating: 4.9,
    ratingCount: 340,
    studentsCount: 2450,
    priceINR: 14999,
    syllabus: [
      'Introduction to Digital Evidence & Forensics Science standards',
      'Windows & Linux Filesystem analysis & deep file carving',
      'Network Forensics, packet captures, and logs decoding',
      'Memory Forensics, Volatility tool usage, and process audits',
      'Mobile device forensics & security measures',
      'Indian IT Act 2000 (65A & 65B Certificate generation) & court presentation guidelines'
    ],
    features: [
      'Hands-on labs with real malware memory dumps',
      'Government grade cyber crime scene simulation cases',
      '1-on-1 feedback from senior forensic analysts',
      'Guaranteed internship interview with forensic partner cells'
    ],
    bannerSvgType: 'cyber',
    isActive: true,
    targetPercentage: 60,
    topics: [
      {
        title: 'Locard Exchange Tenets',
        subTopics: [
          {
            title: 'Foundational Locard Theory',
            richTextContent: '<h3>Locard\'s Exchange Principle</h3><p>Locard\'s Exchange Principle states that <strong>"Every contact leaves a trace."</strong> This is the foundational tenet of forensic science, meaning that whenever an investigator or perpetrator enters a crime scene, they both bring something to and take something away from it.</p><p>Typical traces include hair, fibers, soil, dust, or digital footprints.</p>',
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            documentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            documentName: 'locard_sop_v1.pdf',
            quizQuestions: [
              {
                questionText: 'What is Edmond Locard\'s Exchange Principle?',
                options: [
                  'Every contact leaves a trace.',
                  'Fingerprints are unique to each individual.',
                  'DNA deteriorates in high temperatures.',
                  'Digital evidence is easily modified.'
                ],
                correctOptionIndex: 0,
                explanation: 'Edmond Locard stated that every physical contact results in a transfer of material, leaving a trace.'
              }
            ],
            assignment: {
              title: 'Analyze Contact Transfer Case Study',
              instructionsHtml: '<p>Read the SOP document and describe a case scenario where Locard\'s Exchange Principle applies. <strong>Detail the Class vs Individual evidence transfer.</strong></p>',
              required: true
            }
          }
        ]
      }
    ]
  },
  {
    id: 'course_mock_2',
    title: 'Advanced Crime Scene Management & Reconstruction',
    slug: 'crime-scene-management-reconstruction',
    thumbnailUrl: '/uploads/scene_recon.png',
    description: 'Learn physical evidence preservation, chain of custody procedures, bloodstain pattern analysis, and 3D digital crime scene modeling.',
    category: 'Physical Labs',
    instructorName: 'Prof. Meera Deshmukh',
    instructorTitle: 'Head of Criminology at NFSU Affiliate Center',
    durationWeeks: 8,
    difficulty: 'Intermediate',
    rating: 4.8,
    ratingCount: 180,
    studentsCount: 1890,
    priceINR: 9999,
    syllabus: [
      'Crime scene securing, mapping, and photography protocols',
      'Trace evidence collection: Hair, fiber, glass fracture analysis',
      'Bloodstain Pattern Analysis (BPA) & physics modeling',
      'Arson and explosive residue identification techniques',
      '3D laser scanning & photogrammetry reconstructions'
    ],
    features: [
      'Virtual reality walkthrough of mock crime scenes',
      'Accredited evidence toolkit delivered to your home',
      'Live case studies from CBI investigation briefs'
    ],
    bannerSvgType: 'crimescene',
    isActive: true,
    targetPercentage: 60,
    topics: []
  },
  {
    id: 'course_mock_3',
    title: 'Fingerprint Analysis and Biometric Systems',
    slug: 'fingerprint-analysis-biometric-systems',
    description: 'Study ridge patterns, latent fingerprint development, chemical processing, AFIS systems operation, and expert witness report drafting.',
    category: 'Biometrics',
    instructorName: 'Shri R. K. Sharma',
    instructorTitle: 'Veteran Fingerprint Director, Central Forensic Science Laboratory',
    durationWeeks: 6,
    difficulty: 'Beginner',
    rating: 4.7,
    ratingCount: 110,
    studentsCount: 1120,
    priceINR: 6499,
    syllabus: [
      'History of fingerprinting and Galton details classification',
      'Latent fingerprint development: Powder, cyanoacrylate, ninhydrin',
      'Digital enhancement & ridge identification standards',
      'AFIS & IAFIS database structures and matching logic',
      'Preparation of fingerprint expert opinion for Indian Evidence Act Section 45'
    ],
    features: [
      'Lab manuals containing Indian court-tested formats',
      'Access to cloud-hosted AFIS emulator tools',
      'Direct review of your latent prints lift results'
    ],
    bannerSvgType: 'fingerprint',
    isActive: true,
    targetPercentage: 60,
    topics: []
  },
  ...demoPrograms().map((c, idx) => ({ id: `course_demo_${idx + 1}`, ...c }))
];
mockCourses.forEach(c => {
  if (!c.approvalStatus) c.approvalStatus = 'approved';
  if (c.discountPercentage === undefined) c.discountPercentage = 0;
});

let mockQuizzes: any[] = [
  {
    id: 'quiz_mock_1',
    title: 'Forensic Science Core Assessment Quiz',
    description: 'Test your fundamental understanding of forensic sciences, including Edmond Locard\'s exchange principle, chain of custody, toxicology, and cyber security.',
    category: 'General Forensic',
    courseId: 'course_mock_3',
    timeLimitMinutes: 20,
    questions: [
      {
        questionText: "What is Edmond Locard's Exchange Principle?",
        options: [
          "Every contact leaves a trace.",
          "Fingerprints are unique to each individual.",
          "DNA deteriorates in high temperatures.",
          "Digital evidence is easily modified."
        ],
        correctOptionIndex: 0,
        explanation: "Edmond Locard stated that 'Every contact leaves a trace,' which forms the baseline philosophy of all trace evidence forensics."
      },
      {
        questionText: "Which section of the Indian Evidence Act deals with expert witness testimony?",
        options: [
          "Section 65B",
          "Section 45",
          "Section 32",
          "Section 9"
        ],
        correctOptionIndex: 1,
        explanation: "Section 45 of the Indian Evidence Act, 1872, allows the court to seek opinions of experts in science, art, identification of handwriting, or finger impressions."
      },
      {
        questionText: "To verify digital evidence in an Indian court, which certificate is mandatory under the IT Act?",
        options: [
          "Section 65B Certificate",
          "Section 80A Certificate",
          "Aadhar Verification Certificate",
          "ISO 27001 Audit Certificate"
        ],
        correctOptionIndex: 0,
        explanation: "Under Section 65B(4) of the Indian Information Technology Act, a signed certificate is mandatory to validate the integrity of electronic records in court."
      },
      {
        questionText: "In memory forensics, which volatility command is used to list active process network connections?",
        options: [
          "netscan",
          "pslist",
          "pstree",
          "malfind"
        ],
        correctOptionIndex: 0,
        explanation: "The 'netscan' command in Volatility extracts network connections and associated processes from memory dumps."
      },
      {
        questionText: "What does the abbreviation AFIS stand for in forensic identification?",
        options: [
          "Automated Fingerprint Identification System",
          "Analysis of Forensic Investigation Systems",
          "Advanced Forensic Imaging Software",
          "Analytical Fingerprint Indexing Standard"
        ],
        correctOptionIndex: 0,
        explanation: "AFIS stands for Automated Fingerprint Identification System, used worldwide by police agencies to search fingerprint databases."
      },
      {
        questionText: "Which poison causes a characteristic 'cherry-red' post-mortem staining of the skin and internal organs?",
        options: [
          "Carbon Monoxide",
          "Cyanide",
          "Arsenic",
          "Mercury"
        ],
        correctOptionIndex: 0,
        explanation: "Carbon monoxide binds to hemoglobin to form carboxyhemoglobin, giving the skin and blood a bright cherry-red color."
      },
      {
        questionText: "Which type of chromatography is most widely considered the gold standard for separating and identifying drugs in forensic toxicology?",
        options: [
          "Gas Chromatography-Mass Spectrometry (GC-MS)",
          "Paper Chromatography",
          "Thin Layer Chromatography (TLC)",
          "Column Chromatography"
        ],
        correctOptionIndex: 0,
        explanation: "GC-MS is the gold standard in forensic toxicology because it separates mixtures (GC) and identifies components with extreme specificity (MS)."
      },
      {
        questionText: "Which international database is used for matching ballistic fingerprints of firearms and cartridge casings?",
        options: [
          "IBIS (Integrated Ballistics Identification System)",
          "CODIS",
          "AFIS",
          "NIBIN"
        ],
        correctOptionIndex: 0,
        explanation: "IBIS (Integrated Ballistics Identification System) is used to capture and match digital images of bullets and cartridge casings."
      },
      {
        questionText: "In digital forensics, what is the process of recovering deleted files based on their file signatures (headers/footers) called?",
        options: [
          "File Carving",
          "Data Scraping",
          "Registry Auditing",
          "Network Sniffing"
        ],
        correctOptionIndex: 0,
        explanation: "File carving scans raw unallocated disk space for known file header/footer bytes to recover files without file system metadata."
      },
      {
        questionText: "What type of device is used during digital forensic acquisition to prevent any modifications to the target storage media?",
        options: [
          "Hardware Write Blocker",
          "Logic Analyzer",
          "USB Hub",
          "Network Firewall"
        ],
        correctOptionIndex: 0,
        explanation: "A hardware write blocker physically intercepts and blocks any write commands sent from the host computer to the evidence drive."
      },
      {
        questionText: "Which biometric trait is considered the most secure and resistant to falsification due to its protected internal location and high complexity?",
        options: [
          "Iris Pattern",
          "Fingerprint",
          "Voice Pitch",
          "Facial Geometry"
        ],
        correctOptionIndex: 0,
        explanation: "Iris patterns are highly stable, unique, and well-protected by the cornea, making them extremely difficult to forge or spoof."
      },
      {
        questionText: "What is the name for the post-mortem cooling of the body to ambient temperature?",
        options: [
          "Algor Mortis",
          "Rigor Mortis",
          "Livor Mortis",
          "Pallor Mortis"
        ],
        correctOptionIndex: 0,
        explanation: "Algor mortis refers to the reduction in body temperature following death, which is used to estimate the time of death."
      },
      {
        questionText: "Which chemical reagent is commonly sprayed at a crime scene to detect trace amounts of blood by emitting blue luminescence?",
        options: [
          "Luminol",
          "Ninhydrin",
          "Phenolphthalein",
          "Iodine Crystals"
        ],
        correctOptionIndex: 0,
        explanation: "Luminol reacts with the iron in hemoglobin to produce chemiluminescence, glowing blue in dark conditions to reveal hidden blood patterns."
      },
      {
        questionText: "Which digital forensic tool is widely used for extracting data from locked mobile devices?",
        options: [
          "Cellebrite UFED",
          "Wireshark",
          "Nmap",
          "Burp Suite"
        ],
        correctOptionIndex: 0,
        explanation: "Cellebrite UFED (Universal Forensic Extraction Device) is the standard tool used by law enforcement for mobile device data extraction."
      },
      {
        questionText: "What type of cyber attack involves pretending to be a trustworthy entity to steal credentials or sensitive data?",
        options: [
          "Phishing",
          "DDoS",
          "SQL Injection",
          "Buffer Overflow"
        ],
        correctOptionIndex: 0,
        explanation: "Phishing is a social engineering attack where attackers impersonate trusted institutions to trick users into revealing credentials."
      },
      {
        questionText: "In forensic toxicology, what is the primary organ or tissue analyzed to detect historical drug ingestion over several weeks or months?",
        options: [
          "Hair Follicles",
          "Blood Serum",
          "Saliva",
          "Stomach Contents"
        ],
        correctOptionIndex: 0,
        explanation: "Drugs and their metabolites are incorporated into the hair shaft during growth, providing a chronological record of ingestion over months."
      },
      {
        questionText: "What is the term for the stiffening of muscles that occurs a few hours after death?",
        options: [
          "Rigor Mortis",
          "Algor Mortis",
          "Livor Mortis",
          "Cadaveric Spasm"
        ],
        correctOptionIndex: 0,
        explanation: "Rigor mortis is the chemical stiffening of muscles post-death caused by depletion of ATP, starting 2 to 4 hours after death."
      },
      {
        questionText: "Which standard forensic utility is used to generate SHA-256 or MD5 hashes of raw disk images to verify integrity?",
        options: [
          "FTK Imager",
          "Autopsy",
          "Volatility",
          "John the Ripper"
        ],
        correctOptionIndex: 0,
        explanation: "FTK Imager computes hashes of the physical drive and the created image file to verify that the forensic copy is exact and unaltered."
      },
      {
        questionText: "Which poisonous substance binds to cytochrome c oxidase, inhibiting cellular respiration and causing rapid death?",
        options: [
          "Cyanide",
          "Arsenic",
          "Thallium",
          "Lead"
        ],
        correctOptionIndex: 0,
        explanation: "Cyanide binds to the ferric iron of cytochrome c oxidase in mitochondria, halting ATP production and causing rapid asphyxiation at the cellular level."
      },
      {
        questionText: "In bloodstain pattern analysis, what is the angle of impact of a blood drop that forms a perfectly circular stain?",
        options: [
          "90 degrees",
          "45 degrees",
          "10 degrees",
          "0 degrees"
        ],
        correctOptionIndex: 0,
        explanation: "A blood drop falling vertically (at a 90-degree angle of impact) onto a flat surface forms a circular blood stain."
      }
    ],
    isActive: true
  },
  {
    id: 'quiz_mock_2',
    title: 'Digital Forensics & Incident Response Challenge',
    description: 'Evaluate your ability to handle cybercrime scene investigation, identify malicious processes, and perform live memory analysis.',
    category: 'Digital Forensics',
    courseId: 'course_mock_1',
    timeLimitMinutes: 15,
    questions: [
      {
        questionText: 'In memory forensics, which volatility command is used to list active process network connections?',
        options: [
          'netscan',
          'pslist',
          'pstree',
          'malfind'
        ],
        correctOptionIndex: 0,
        explanation: 'The `netscan` command in Volatility extracts network network connections and processes.'
      }
    ],
    isActive: true
  },
  {
    id: 'quiz_mock_3',
    title: 'Mixed-Format Forensic Proficiency Exam',
    description: 'Demonstrates every supported question format: single-choice, multi-select, true/false, numeric, and short-answer. Negative marking is enabled.',
    category: 'General Forensic',
    courseId: null,
    timeLimitMinutes: 12,
    passingPercentage: 60,
    negativeMarking: true,
    negativeMarkFraction: 0.25,
    attemptsAllowed: 3,
    questions: [
      {
        questionText: 'Which principle states that "every contact leaves a trace"?',
        questionType: 'mcq',
        options: ['Locard\'s Exchange Principle', 'Daubert Standard', 'Frye Standard', 'Kirk\'s Principle'],
        correctOptionIndex: 0,
        points: 1,
        explanation: 'Edmond Locard formulated the exchange principle.'
      },
      {
        questionText: 'Select ALL that are valid latent fingerprint development techniques.',
        questionType: 'multi',
        options: ['Ninhydrin', 'Cyanoacrylate fuming', 'Luminol blood search', 'Magnetic powder'],
        correctOptionIndices: [0, 1, 3],
        points: 2,
        explanation: 'Luminol is for blood, not latent prints; the other three develop latent prints.'
      },
      {
        questionText: 'A Section 65B certificate is required to admit electronic evidence in an Indian court.',
        questionType: 'tf',
        options: ['True', 'False'],
        correctOptionIndex: 0,
        points: 1,
        explanation: 'Section 65B(4) of the IT Act mandates the certificate.'
      },
      {
        questionText: 'Under the Indian Evidence Act, which section number governs expert witness opinions?',
        questionType: 'numeric',
        options: [],
        correctOptionIndex: 0,
        correctNumeric: 45,
        numericTolerance: 0,
        points: 1,
        explanation: 'Section 45.'
      },
      {
        questionText: 'Name the Volatility command that lists network connections from a memory image.',
        questionType: 'short',
        options: [],
        correctOptionIndex: 0,
        acceptedAnswers: ['netscan', 'netscan plugin'],
        points: 1,
        explanation: 'The netscan plugin extracts network artifacts.'
      }
    ],
    isActive: true
  }
];

let mockResearch: any[] = [
  {
    id: 'research_mock_1',
    title: 'Integrating Machine Learning in Automated Latent Fingerprint Matching: A Comparative Study',
    slug: 'ml-latent-fingerprint-matching',
    abstract: 'Latent fingerprints found at crime scenes are often distorted, smudged, or overlapping. This paper reviews deep learning models compared with standard manual minutiae markings.',
    content: '## 1. Introduction\nLatent fingerprints found at crime scenes act as key physical links...',
    category: 'Biometrics',
    authors: ['Shri R. K. Sharma', 'Dr. Priya Srinivasan'],
    readTimeMinutes: 10,
    citation: 'Sharma, R. K., & Srinivasan, P. (2026). Integrating Machine Learning in Automated Fingerprints. Indian Journal of Forensic Sciences, Vol. 14, 45-56.',
    downloadsCount: 420,
    publishedDate: new Date(),
    isActive: true
  }
];

let mockCertificates: any[] = [];
let mockContacts: any[] = [];

let mockSeminars: any[] = [
  {
    id: 'seminar_mock_1',
    title: 'Incident Response Case Studies & Evidence Locking',
    description: 'A walkthrough of major network intrusion incidents and Locard exchange tracing steps.',
    instructorName: 'Dr. Aravind Swaminathan',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
    durationMinutes: 90,
    link: 'https://meet.google.com/abc-defg-hij',
    maxParticipants: 100,
    registeredStudents: ['student@forensecure.edu.in'],
    attendees: []
  },
  ...demoLiveSessions().map((s, idx) => ({ id: `seminar_demo_${idx + 1}`, ...s }))
];
mockSeminars.forEach(s => {
  if (!s.approvalStatus) s.approvalStatus = 'approved';
});

let mockBlogs: any[] = [
  {
    id: 'blog_mock_1',
    title: 'Deciphering NTFS MFT Artifacts for Deleted File Recovery',
    subtitle: 'A forensic walkthrough of parsing raw $MFT records to reconstruct deleted files.',
    slug: 'deciphering-ntfs-mft-artifacts',
    content: '<p>The Master File Table (MFT) is the database structure holding filesystem records on NTFS drives. Recovering files requires forensic parsing of raw sectors...</p>',
    authorName: 'Dr. Aravind Swaminathan',
    category: 'Digital Forensics',
    tags: ['NTFS', 'MFT', 'File Carving'],
    attachments: [],
    readTimeMinutes: 5,
    likes: 24,
    commentsCount: 3,
    approvalStatus: 'approved',
    isActive: true
  }
];
mockBlogs.forEach(b => { if (!b.approvalStatus) b.approvalStatus = 'approved'; });

let mockAnnouncements: any[] = [
  {
    id: 'ann_mock_1',
    title: 'Platform Maintenance Window',
    body: 'Scheduled maintenance this Sunday 02:00–04:00 IST. Course players and uploads may be briefly unavailable.',
    authorName: 'ForenSecure Operations',
    level: 'warning',
    pinned: true,
    isActive: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'ann_mock_2',
    title: 'New Learning Path Released',
    body: 'The "Certified Forensic Investigator Track" is now live. Enroll from the Learning Paths page.',
    authorName: 'Academic Team',
    level: 'info',
    pinned: false,
    isActive: true,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  }
];

let mockTeamMembers: any[] = [
  { id: 'team_mock_1', name: 'Shri R.K. Sharma', role: 'Former Director, CFSL', description: 'Fingerprint & Document Expert', sortOrder: 0, isActive: true },
  { id: 'team_mock_2', name: 'Dr. A. Swaminathan', role: 'Cyber Security Informatics Scientist', description: 'Digital & Incident Response', sortOrder: 1, isActive: true },
  { id: 'team_mock_3', name: 'Prof. Meera Deshmukh', role: 'Criminology Research Head', description: 'Crime Scene & Evidence Handling', sortOrder: 2, isActive: true }
];

let mockLearningPaths: any[] = [
  {
    id: 'path_mock_1',
    title: 'Certified Forensic Investigator Track',
    slug: 'certified-forensic-investigator-track',
    description: 'A guided, sequential career path: begin with fingerprint fundamentals, progress through crime scene reconstruction, and finish with advanced cyber forensics. Complete all three required courses to earn the full track certificate.',
    category: 'Career Track',
    courses: [
      { courseId: 'course_mock_3', order: 0, required: true },
      { courseId: 'course_mock_2', order: 1, required: true },
      { courseId: 'course_mock_1', order: 2, required: true }
    ],
    sequential: true,
    issueCertificate: true,
    certificateTitle: 'Certified Forensic Investigator (Full Track)',
    isActive: true
  }
];

// Mutable in-memory copy of the default matrix (admin can edit it via PUT /api/admin/access-matrix).
let mockAccessMatrix: any[] = DEFAULT_MATRIX.map(r => ({ ...r }));

// Legacy mock branches remain temporarily for low-risk cleanup, but runtime
// data is database-only and the server refuses to boot without Postgres.
const useMock = () => false;

// --- QUERY HELPERS ---
// Three shapes cover nearly every mongoose call this file used to make. Tables
// are typed `any` on purpose: threading drizzle's table generics through these
// buys nothing here and costs a lot of noise at each call site.

/** `Model.findById(x)` — returns undefined for ids that aren't valid UUIDs
 *  instead of letting the driver raise a 500 on malformed input. */
const byId = async (table: any, value: unknown): Promise<any | undefined> => {
  const uuid = asUuid(value);
  if (!uuid) return undefined;
  const [row] = await db.select().from(table).where(eq(table.id, uuid));
  return row;
};

/** `doc.save()` — routes mutate the plain row in place exactly as they mutated
 *  the mongoose document, then this writes the whole thing back. */
const save = async (table: any, row: any): Promise<any> => {
  const { id, createdAt, ...rest } = row;
  const [updated] = (await db
    .update(table)
    .set({ ...rest, updatedAt: new Date() })
    .where(eq(table.id, id))
    .returning()) as any[];
  return updated;
};

/** `Model.findByIdAndDelete(x)` — returns the deleted row, or undefined. */
const removeById = async (table: any, value: unknown): Promise<any | undefined> => {
  const uuid = asUuid(value);
  if (!uuid) return undefined;
  const [row] = (await db.delete(table).where(eq(table.id, uuid)).returning()) as any[];
  return row;
};

/** `Model.countDocuments()` */
const countRows = async (table: any): Promise<number> => {
  const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(table);
  return row.n;
};

// --- COURSE CMS HELPERS ---
// Marketing/landing fields a teacher edits from the CMS. Copied verbatim from the
// request body so all four course endpoints persist them without repeating the list.
const MARKETING_FIELDS = [
  'subTitle', 'overview', 'level', 'highlights', 'eligibility', 'learningObjectives',
  'learningResources', 'careerBenefits', 'practicalLabs', 'assessmentStructure', 'passingCriteria', 'schedule'
] as const;

const pickMarketing = (body: any): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const key of MARKETING_FIELDS) if (body[key] !== undefined) out[key] = body[key];
  return out;
};

const applyMarketing = (course: any, body: any) => {
  for (const key of MARKETING_FIELDS) if (body[key] !== undefined) course[key] = body[key];
};

/**
 * Regenerates the live-session `seminars` for a course from its weekly schedule.
 * Deletes the course's existing sessions and re-expands the recurrence, so editing
 * the schedule replaces the old dates. No-op for recorded courses or empty schedules.
 *
 * ponytail: replaces ALL seminars linked to this course, including any hand-made
 * ones. Tag auto-generated rows and filter on that only if manual + generated
 * sessions ever need to coexist on one live course.
 */
const syncCourseSeminars = async (course: any, approvalStatus: 'approved' | 'pending') => {
  const sched = course.schedule;
  if (course.courseType !== 'live' || !sched || !Array.isArray(sched.days) || sched.days.length === 0 || !sched.meetLink) {
    return;
  }
  const sessions = expandSchedule(course.startDate, course.endDate, course.durationWeeks, sched);
  const base = sessions.map((date, i) => ({
    title: `${course.title} — Session ${i + 1}`,
    description: `Live session for ${course.title}.`,
    instructorName: course.instructorName,
    courseTitle: course.title,
    date,
    durationMinutes: Number(sched.durationMinutes) || 60,
    link: sched.meetLink,
    maxParticipants: 100,
    approvalStatus,
    registeredStudents: [] as string[],
    attendees: [] as string[]
  }));

  if (useMock()) {
    mockSeminars = mockSeminars.filter(s => s.courseId !== course.id);
    base.forEach((row, i) => mockSeminars.push({ id: `seminar_auto_${course.id}_${i}`, courseId: course.id, ...row }));
    return;
  }
  const cid = asUuid(course.id);
  if (!cid) return;
  await db.delete(seminars).where(eq(seminars.courseId, cid));
  if (base.length > 0) await db.insert(seminars).values(base.map(row => ({ ...row, courseId: cid })));
};

// --- AUTH MIDDLEWARE ---
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const optionalProtect = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
      req.user = decoded;
    } catch (error) {
      // Ignore token failure for public access
    }
  }
  next();
};

const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden. Admin access required.' });
  }
};

/** The only roles the system recognises. Anything else is rejected at the edge
 *  rather than stored and later misjudged by a permission check. */
const ROLES = ['student', 'teacher', 'faculty', 'admin'];

/** Route guard for endpoints gated on the role alone, with no matrix entry.
 *  Run after `protect`. */
const requireRole = (...allowed: string[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: 'Not authorized, no user context' });
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ message: `Forbidden: this action requires one of: ${allowed.join(', ')}` });
    }
    next();
  };

// --- DATA-DRIVEN RBAC (reads the editable AccessMatrix) ---
// DB-mode matrix is cached in memory and invalidated when the matrix is updated.
// ponytail: single-process cache; use a shared store (Redis) if you run multiple instances.
let matrixCache: any[] | null = null;
const invalidateMatrixCache = () => { matrixCache = null; };

async function loadMatrix(): Promise<any[]> {
  if (useMock()) return mockAccessMatrix;
  if (matrixCache) return matrixCache;
  let rows: any[] = await db.select().from(accessMatrix);
  if (rows.length === 0) rows = await db.insert(accessMatrix).values(DEFAULT_MATRIX as any).returning();
  matrixCache = rows.map((r: any) => ({ role: r.role, feature: r.feature, create: r.create, read: r.read, update: r.update }));
  return matrixCache;
}

// Route guard: run after `protect`. Authorizes req.user.role against the matrix.
const requirePermission = (feature: string, action: PermAction) =>
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: 'Not authorized, no user context' });
    try {
      const matrix = await loadMatrix();
      if (isAllowed(matrix, req.user.role, feature, action)) return next();
      return res.status(403).json({ message: `Forbidden: role '${req.user.role}' lacks '${action}' on '${feature}'` });
    } catch (error: any) {
      return res.status(500).json({ message: 'Authorization check failed', error: error.message });
    }
  };

// --- HEALTH CHECK ---
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    mode: 'Database Connected',
    timestamp: new Date() 
  });
});

// --- AUTH ENDPOINTS ---
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    // `role` is deliberately NOT read from the body. Self-registration always
    // creates a student; anything else is granted by an admin through
    // /api/admin/users/:id/role or an invite. Honouring a client-supplied role
    // here would let anyone POST { role: 'admin' } and own the platform.
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const passwordError = validatePassword(password);
    if (passwordError) return res.status(400).json({ message: passwordError });

    if (useMock()) {
      const existing = mockUsers.find(u => u.email === email);
      if (existing) return res.status(400).json({ message: 'User already exists' });

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      const newUser = {
        id: 'mock_usr_' + Math.random().toString(36).substr(2, 9),
        name,
        email,
        passwordHash,
        role: 'student',
        enrolledCourses: [],
        completedQuizzes: [],
        certificates: []
      };
      mockUsers.push(newUser);
      const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(201).json({ token, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } });
    }

    const [existingUser] = await db.select().from(users).where(eq(users.email, email));
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [newUser] = await db.insert(users).values({
      name,
      email,
      passwordHash,
      role: 'student'
    }).returning();

    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    if (useMock()) {
      const user = mockUsers.find(u => String(u.email).trim().toLowerCase() === cleanEmail);
      if (!user) return res.status(400).json({ message: 'Invalid credentials' });

      const isMatch = await bcrypt.compare(String(password), user.passwordHash);
      if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

      if (user.mfaEnabled) {
        const mfaToken = jwt.sign({ id: user.id, email: user.email, role: user.role, mfa: 'pending' }, JWT_SECRET, { expiresIn: '5m' });
        return res.json({ mfaRequired: true, mfaToken });
      }

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    }

    // No fallback to mockUsers here. Those three demo accounts share a published
    // password, so accepting them once a real database is connected would leave
    // a permanent backdoor into every deployment.
    const [user] = await db.select().from(users).where(eq(users.email, cleanEmail)) as any[];
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(String(password), user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (user.mfaEnabled) {
      const mfaToken = jwt.sign({ id: user.id, email: user.email, role: user.role, mfa: 'pending' }, JWT_SECRET, { expiresIn: '5m' });
      return res.json({ mfaRequired: true, mfaToken });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
});

app.get('/api/auth/profile', protect, async (req: AuthRequest, res: Response) => {
  try {
    if (useMock()) {
      const user = mockUsers.find(u => u.id === req.user?.id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      // Populate enrolledCourses details
      const populatedCourses = user.enrolledCourses.map((cId: string) => 
        mockCourses.find(c => c.id === cId)
      ).filter(Boolean);

      return res.json(publicUser({ ...user, enrolledCourses: populatedCourses }));
    }

    const user = await byId(users, req.user?.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // `populate('enrolledCourses')` replaced the id list with the course rows;
    // one IN query does the same without a join table.
    const safeUser = publicUser(user);
    const enrolled = user.enrolledCourses.length
      ? await db.select().from(courses).where(sql`${courses.id} = ANY(${user.enrolledCourses})`)
      : [];

    res.json({ ...safeUser, enrolledCourses: enrolled });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error fetching profile', error: error.message });
  }
});

app.put('/api/auth/profile', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    if (useMock()) {
      const user = mockUsers.find(u => u.id === req.user?.id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      user.name = name;
      user.email = email;
      return res.json({ message: 'Profile updated successfully (Simulation)', user: publicUser(user) });
    }

    const user = await byId(users, req.user?.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = name;
    user.email = email;
    await save(users, user);

    res.json({ message: 'Profile updated successfully', user: publicUser(user) });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error updating profile', error: error.message });
  }
});

// --- MFA (TOTP two-factor) ENDPOINTS ---

// Step 2 of login: exchange a short-lived mfaToken + TOTP code for a full session token.
app.post('/api/auth/mfa/login', async (req: Request, res: Response) => {
  try {
    const { mfaToken, code } = req.body;
    if (!mfaToken || !code) return res.status(400).json({ message: 'mfaToken and code are required' });

    let decoded: any;
    try {
      decoded = jwt.verify(mfaToken, JWT_SECRET);
    } catch {
      return res.status(401).json({ message: 'MFA session expired, please log in again' });
    }
    if (decoded.mfa !== 'pending') return res.status(400).json({ message: 'Invalid MFA token' });

    let user: any;
    if (useMock()) user = mockUsers.find(u => u.id === decoded.id);
    else user = await byId(users, decoded.id);
    if (!user || !user.mfaEnabled || !user.mfaSecret) return res.status(400).json({ message: 'MFA is not configured for this account' });

    if (!verifyTotp(user.mfaSecret, String(code))) {
      return res.status(401).json({ message: 'Invalid authentication code' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error during MFA login', error: error.message });
  }
});

// Begin enrollment: generate a secret (not yet active) and return it + an otpauth URI.
app.post('/api/auth/mfa/setup', protect, async (req: AuthRequest, res: Response) => {
  try {
    let user: any;
    if (useMock()) user = mockUsers.find(u => u.id === req.user?.id);
    else user = await byId(users, req.user?.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.mfaEnabled) return res.status(400).json({ message: 'MFA is already enabled. Disable it first to re-enroll.' });

    const secret = generateSecret();
    user.mfaSecret = secret;
    user.mfaEnabled = false;
    if (!useMock()) await save(users, user);

    res.json({ secret, otpauthUrl: otpauthURL(secret, user.email) });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error starting MFA setup', error: error.message });
  }
});

// Confirm enrollment: a valid code against the pending secret activates MFA.
app.post('/api/auth/mfa/verify', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Authentication code is required' });

    let user: any;
    if (useMock()) user = mockUsers.find(u => u.id === req.user?.id);
    else user = await byId(users, req.user?.id);
    if (!user || !user.mfaSecret) return res.status(400).json({ message: 'Start MFA setup first' });

    if (!verifyTotp(user.mfaSecret, String(code))) {
      return res.status(401).json({ message: 'Invalid authentication code' });
    }

    user.mfaEnabled = true;
    if (!useMock()) await save(users, user);
    res.json({ message: 'Two-factor authentication enabled', mfaEnabled: true });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error verifying MFA', error: error.message });
  }
});

// Turn MFA off (requires a valid current code).
app.post('/api/auth/mfa/disable', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.body;
    let user: any;
    if (useMock()) user = mockUsers.find(u => u.id === req.user?.id);
    else user = await byId(users, req.user?.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.mfaEnabled) return res.status(400).json({ message: 'MFA is not enabled' });

    if (!verifyTotp(user.mfaSecret, String(code || ''))) {
      return res.status(401).json({ message: 'Invalid authentication code' });
    }

    user.mfaEnabled = false;
    user.mfaSecret = null;
    if (!useMock()) await save(users, user);
    res.json({ message: 'Two-factor authentication disabled', mfaEnabled: false });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error disabling MFA', error: error.message });
  }
});

// --- COURSE ENDPOINTS ---
app.get('/api/courses', optionalProtect, async (req: AuthRequest, res: Response) => {
  try {
    const adminView = req.query.adminView === 'true';
    if (useMock()) {
      const list = adminView ? mockCourses : mockCourses.filter(c => c.isActive && c.approvalStatus === 'approved');
      return res.json(list);
    }
    try {
      let list;
      if (adminView) {
        list = await db.select().from(courses);
      } else {
        list = await db.select().from(courses).where(and(eq(courses.isActive, true), eq(courses.approvalStatus, 'approved')));
      }
      return res.json(list);
    } catch (dbErr: any) {
      throw dbErr;
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Server error fetching courses', error: error.message });
  }
});

app.get('/api/courses/:slug', optionalProtect, async (req: AuthRequest, res: Response) => {
  try {
    const filterCourseForUser = (courseObj: any, userObj: any) => {
      if (!courseObj) return courseObj;
      const isStaff = userObj && ['admin', 'teacher', 'faculty'].includes(userObj.role);
      if (isStaff) return courseObj;

      const isEnrolled = userObj && userObj.enrolledCourses?.some((c: any) => (c.id === courseObj.id || c === courseObj.id || (typeof c === 'string' && c === courseObj.id)));
      const isPaid = courseObj.priceINR > 0;
      const hasPaid = userObj && userObj.successfulPayments?.some((c: any) => (c.id === courseObj.id || c === courseObj.id || (typeof c === 'string' && c === courseObj.id)));

      const canAccess = isEnrolled && (!isPaid || hasPaid);
      if (!canAccess) {
        return {
          ...courseObj,
          topics: []
        };
      }
      return courseObj;
    };

    if (useMock()) {
      const course = mockCourses.find(c => c.slug === req.params.slug);
      if (!course) return res.status(404).json({ message: 'Course not found' });

      // Get the mock user data to check enrollment & payments
      const user = req.user ? mockUsers.find(u => u.id === req.user?.id) : null;
      return res.json(filterCourseForUser(course, user));
    }
    try {
      const [course] = await db.select().from(courses).where(eq(courses.slug, req.params.slug));
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      // Fetch user from DB if authenticated
      let dbUser = null;
      if (req.user) {
        dbUser = await db.select().from(users).where(eq(users.id, req.user.id)).then(r => r[0]);
      }
      return res.json(filterCourseForUser(course, dbUser));
    } catch (dbErr: any) {
      throw dbErr;
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Server error fetching course details', error: error.message });
  }
});

app.post('/api/courses/:id/enroll', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { paymentSuccess } = req.body;

    if (useMock()) {
      const user = mockUsers.find(u => u.id === req.user?.id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      const course = mockCourses.find(c => c.id === req.params.id);
      if (!course) return res.status(404).json({ message: 'Course not found' });

      const isPaid = Number(course.priceINR) > 0;
      if (isPaid && !paymentSuccess) {
        return res.status(402).json({ message: 'Payment required to enroll in this course' });
      }

      if (user.enrolledCourses.includes(req.params.id)) {
        return res.status(400).json({ message: 'Already enrolled in this course' });
      }

      user.enrolledCourses.push(req.params.id);
      if (isPaid || paymentSuccess) {
        if (!user.successfulPayments) user.successfulPayments = [];
        user.successfulPayments.push(req.params.id);
      }
      course.studentsCount += 1;
      return res.json({ message: 'Successfully enrolled', enrolledCourses: user.enrolledCourses, successfulPayments: user.successfulPayments });
    }

    const user = await byId(users, req.user?.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const courseId = asUuid(req.params.id);
    const course = await byId(courses, courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const isPaid = Number(course.priceINR) > 0;
    if (isPaid && !paymentSuccess) {
      return res.status(402).json({ message: 'Payment required to enroll in this course' });
    }

    if (user.enrolledCourses.includes(courseId!)) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    user.enrolledCourses.push(courseId!);
    if (isPaid || paymentSuccess) {
      if (!user.successfulPayments) user.successfulPayments = [];
      user.successfulPayments.push(courseId!);
    }
    await save(users, user);

    course.studentsCount += 1;
    await save(courses, course);

    res.json({ message: 'Successfully enrolled', enrolledCourses: user.enrolledCourses, successfulPayments: user.successfulPayments });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error during enrollment', error: error.message });
  }
});

// --- FILE UPLOADS (course video / documents / study material) ---
const uploader = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      cb(null, safeUploadName(file.originalname, unique));
    }
  }),
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1 GB — lecture videos are stored whole on disk
  fileFilter: (_req, file, cb) => {
    if (!isAllowedUpload(file.originalname)) return cb(new Error(`File type of "${file.originalname}" is not allowed`));
    cb(null, true);
  }
});

app.post('/api/uploads', protect, requirePermission('course_builder', 'create'), (req: AuthRequest, res: Response) => {
  uploader.single('file')(req as any, res as any, (err: any) => {
    if (err) return res.status(400).json({ message: err.message || 'Upload failed' });
    if (!req.file) return res.status(400).json({ message: 'No file received' });
    res.status(201).json({
      url: `/uploads/${req.file.filename}`,
      name: req.file.originalname,
      sizeBytes: req.file.size
    });
  });
});

// --- TEACHER & PROGRESS ENDPOINTS ---
app.post('/api/courses', protect, requirePermission('course_builder', 'create'), async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      category,
      instructorName,
      instructorTitle,
      durationWeeks,
      difficulty,
      courseType,
      format,
      startDate,
      endDate,
      thumbnailUrl,
      priceINR,
      syllabus,
      features,
      targetPercentage,
      topics
    } = req.body;

    if (!title || !description || !category || priceINR === undefined) {
      return res.status(400).json({ message: 'Title, description, category, and price are required' });
    }

    const scheduleError = validateSchedule(courseType, startDate, endDate);
    if (scheduleError) return res.status(400).json({ message: scheduleError });

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const courseData = {
      title,
      slug,
      description,
      category,
      instructorName: instructorName || (req.user as any).name,
      instructorTitle: instructorTitle || 'Certified Instructor',
      durationWeeks: Number(durationWeeks) || 6,
      difficulty: (difficulty || 'Beginner') as 'Beginner' | 'Intermediate' | 'Advanced',
      courseType: (courseType === 'live' ? 'live' : 'recorded') as 'live' | 'recorded',
      format: (format === 'diploma' ? 'diploma' : 'course') as 'diploma' | 'course',
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      thumbnailUrl: thumbnailUrl || '',
      rating: 5.0,
      ratingCount: 1,
      studentsCount: 0,
      priceINR: Number(priceINR),
      syllabus: syllabus || [],
      features: features || [],
      bannerSvgType: 'fingerprint',
      isActive: true,
      targetPercentage: Number(targetPercentage) || 60,
      topics: topics || [],
      ...pickMarketing(req.body)
    };

    // Teacher-created courses stay pending until an admin approves.
    const approvalStatus = req.user?.role === 'admin' ? 'approved' : 'pending';

    if (useMock()) {
      const newCourse = {
        id: 'course_mock_' + Math.random().toString(36).substr(2, 9),
        approvalStatus,
        ...courseData
      };
      mockCourses.push(newCourse);
      await syncCourseSeminars(newCourse, approvalStatus);
      return res.status(201).json({ message: 'Course created successfully (Simulation)', course: newCourse });
    }

    const [newCourse] = await db.insert(courses).values({ ...courseData, approvalStatus }).returning();
    await syncCourseSeminars(newCourse, approvalStatus);
    res.status(201).json({ message: 'Course created successfully', course: newCourse });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error creating course', error: error.message });
  }
});

app.put('/api/courses/:id', protect, requirePermission('course_builder', 'update'), async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      category,
      instructorName,
      instructorTitle,
      durationWeeks,
      difficulty,
      courseType,
      format,
      startDate,
      endDate,
      thumbnailUrl,
      priceINR,
      syllabus,
      features,
      targetPercentage,
      topics,
      isActive
    } = req.body;

    if (courseType) {
      const scheduleError = validateSchedule(courseType, startDate, endDate);
      if (scheduleError) return res.status(400).json({ message: scheduleError });
    }

    if (useMock()) {
      const course = mockCourses.find(c => c.id === req.params.id);
      if (!course) return res.status(404).json({ message: 'Course not found' });

      if (title) {
        course.title = title;
        course.slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
      if (description) course.description = description;
      if (category) course.category = category;
      if (instructorName) course.instructorName = instructorName;
      if (instructorTitle) course.instructorTitle = instructorTitle;
      if (durationWeeks !== undefined) course.durationWeeks = Number(durationWeeks);
      if (difficulty) course.difficulty = difficulty;
      if (courseType) course.courseType = courseType;
      if (format) course.format = format;
      if (startDate !== undefined) course.startDate = startDate ? new Date(startDate) : undefined;
      if (endDate !== undefined) course.endDate = endDate ? new Date(endDate) : undefined;
      if (thumbnailUrl !== undefined) course.thumbnailUrl = thumbnailUrl;
      if (priceINR !== undefined) course.priceINR = Number(priceINR);
      if (syllabus) course.syllabus = syllabus;
      if (features) course.features = features;
      if (targetPercentage !== undefined) course.targetPercentage = Number(targetPercentage);
      if (topics) course.topics = topics;
      if (isActive !== undefined) course.isActive = isActive;
      applyMarketing(course, req.body);

      await syncCourseSeminars(course, course.approvalStatus === 'approved' ? 'approved' : 'pending');
      return res.json({ message: 'Course updated successfully (Simulation)', course });
    }

    const course = await byId(courses, req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (title) {
      course.title = title;
      course.slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (description) course.description = description;
    if (category) course.category = category;
    if (instructorName) course.instructorName = instructorName;
    if (instructorTitle) course.instructorTitle = instructorTitle;
    if (durationWeeks !== undefined) course.durationWeeks = Number(durationWeeks);
    if (difficulty) course.difficulty = difficulty as any;
    if (courseType) course.courseType = courseType as any;
    if (format) course.format = format as any;
    if (startDate !== undefined) course.startDate = startDate ? new Date(startDate) : undefined;
    if (endDate !== undefined) course.endDate = endDate ? new Date(endDate) : undefined;
    if (thumbnailUrl !== undefined) course.thumbnailUrl = thumbnailUrl;
    if (priceINR !== undefined) course.priceINR = Number(priceINR);
    if (syllabus) course.syllabus = syllabus;
    if (features) course.features = features;
    if (targetPercentage !== undefined) course.targetPercentage = Number(targetPercentage);
    if (topics) course.topics = topics;
    if (isActive !== undefined) course.isActive = isActive;
    applyMarketing(course, req.body);

    await save(courses, course);
    await syncCourseSeminars(course, course.approvalStatus === 'approved' ? 'approved' : 'pending');
    res.json({ message: 'Course updated successfully', course });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error updating course', error: error.message });
  }
});

app.get('/api/courses/:id/students', protect, requirePermission('grading_panel', 'read'), async (req: AuthRequest, res: Response) => {
  try {
    const courseId = req.params.id;

    if (useMock()) {
      const students = mockUsers.filter(u => u.enrolledCourses.includes(courseId));
      const formattedStudents = students.map(s => {
        const progress = s.courseProgress?.find((p: any) => p.courseId === courseId) || {
          completedSubTopics: [],
          quizScores: [],
          assignmentSubmissions: []
        };
        return {
          id: s.id,
          name: s.name,
          email: s.email,
          role: s.role,
          progress
        };
      });
      return res.json(formattedStudents);
    }

    const courseUuid = asUuid(courseId);
    if (!courseUuid) return res.json([]);

    const students = await db
      .select({ id: users.id, name: users.name, email: users.email, role: users.role, courseProgress: users.courseProgress })
      .from(users)
      .where(arrayContains(users.enrolledCourses, [courseUuid]));

    const formattedStudents = students.map(s => {
      const progress = s.courseProgress?.find((p: CourseProgress) => p.courseId === courseId) || {
        completedSubTopics: [],
        quizScores: [],
        assignmentSubmissions: []
      };
      return {
        id: s.id,
        name: s.name,
        email: s.email,
        role: s.role,
        progress
      };
    });
    res.json(formattedStudents);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error fetching course students', error: error.message });
  }
});

app.post('/api/courses/:id/submissions/:studentId/grade', protect, requirePermission('grading_panel', 'create'), async (req: AuthRequest, res: Response) => {
  try {
    const { topicTitle, subTopicTitle, assignmentTitle, grade, feedback } = req.body;
    if (grade === undefined) {
      return res.status(400).json({ message: 'Grade is required' });
    }

    if (useMock()) {
      const student = mockUsers.find(u => u.id === req.params.studentId);
      if (!student) return res.status(404).json({ message: 'Student not found' });

      let progress = student.courseProgress?.find((p: any) => p.courseId === req.params.id);
      if (!progress) return res.status(404).json({ message: 'Course progress not found for student' });

      const submission = progress.assignmentSubmissions?.find((s: any) => 
        s.topicTitle === topicTitle && 
        s.subTopicTitle === subTopicTitle && 
        s.assignmentTitle === assignmentTitle
      );
      if (!submission) return res.status(404).json({ message: 'Submission not found' });

      submission.status = 'graded';
      submission.grade = Number(grade);
      if (feedback) submission.feedback = feedback;

      return res.json({ message: 'Submission graded successfully (Simulation)', submission });
    }

    const student = await byId(users, req.params.studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    let progress = student.courseProgress?.find((p: CourseProgress) => p.courseId === req.params.id);
    if (!progress) return res.status(404).json({ message: 'Course progress not found for student' });

    const submission = progress.assignmentSubmissions?.find((s: AssignmentSubmission) => 
      s.topicTitle === topicTitle && 
      s.subTopicTitle === subTopicTitle && 
      s.assignmentTitle === assignmentTitle
    );
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    submission.status = 'graded';
    submission.grade = Number(grade);
    if (feedback) submission.feedback = feedback;

    await save(users, student);
    res.json({ message: 'Submission graded successfully', submission });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error grading submission', error: error.message });
  }
});

app.post('/api/courses/:id/progress', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { topicTitle, subTopicTitle } = req.body;
    if (!subTopicTitle) return res.status(400).json({ message: 'subTopicTitle is required' });

    if (useMock()) {
      const user = mockUsers.find(u => u.id === req.user?.id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      if (!user.courseProgress) user.courseProgress = [];
      let progress = user.courseProgress.find((p: any) => p.courseId === req.params.id);
      if (!progress) {
        progress = { courseId: req.params.id, completedSubTopics: [], quizScores: [], assignmentSubmissions: [] };
        user.courseProgress.push(progress);
      }

      if (!progress.completedSubTopics.includes(subTopicTitle)) {
        progress.completedSubTopics.push(subTopicTitle);
      }

      return res.json({ message: 'Progress updated (Simulation)', progress });
    }

    const user = await byId(users, req.user?.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.courseProgress) user.courseProgress = [];
    let progress = user.courseProgress.find((p: CourseProgress) => p.courseId === req.params.id);
    if (!progress) {
      const newProgress = { courseId: req.params.id, completedSubTopics: [], quizScores: [], assignmentSubmissions: [] } as any;
      user.courseProgress.push(newProgress);
      progress = newProgress;
    }

    const activeProgress = progress!;
    if (!activeProgress.completedSubTopics.includes(subTopicTitle)) {
      activeProgress.completedSubTopics.push(subTopicTitle);
    }

    await save(users, user);
    res.json({ message: 'Progress updated successfully', progress });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error updating progress', error: error.message });
  }
});

app.post('/api/courses/:id/topics/:topicIdx/subtopics/:subTopicIdx/submit-quiz', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { answers } = req.body;
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Answers array is required' });
    }

    const { id, topicIdx, subTopicIdx } = req.params;
    const tIdx = Number(topicIdx);
    const sIdx = Number(subTopicIdx);

    let course: any = null;
    if (useMock()) {
      course = mockCourses.find(c => c.id === id);
    } else {
      course = await byId(courses, id);
    }

    if (!course) return res.status(404).json({ message: 'Course not found' });

    const topic = course.topics?.[tIdx];
    const subTopic = topic?.subTopics?.[sIdx];
    if (!subTopic) return res.status(404).json({ message: 'Subtopic not found' });

    const quizQuestions = subTopic.quizQuestions || [];
    if (quizQuestions.length === 0) {
      return res.status(400).json({ message: 'This subtopic does not have a quiz' });
    }

    let correctCount = 0;
    quizQuestions.forEach((q: any, idx: number) => {
      if (answers[idx] !== undefined && answers[idx] === q.correctOptionIndex) {
        correctCount++;
      }
    });

    const scorePct = Math.round((correctCount / quizQuestions.length) * 100);
    const targetPct = course.targetPercentage || 60;
    const passed = scorePct >= targetPct;

    if (useMock()) {
      const user = mockUsers.find(u => u.id === req.user?.id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      if (!user.courseProgress) user.courseProgress = [];
      let progress = user.courseProgress.find((p: any) => p.courseId === id);
      if (!progress) {
        progress = { courseId: id, completedSubTopics: [], quizScores: [], assignmentSubmissions: [] };
        user.courseProgress.push(progress);
      }

      let scoreRecord = progress.quizScores.find((q: any) => q.topicTitle === topic.title && q.subTopicTitle === subTopic.title);
      if (scoreRecord) {
        scoreRecord.score = scorePct;
        scoreRecord.totalQuestions = quizQuestions.length;
        scoreRecord.passed = passed;
        scoreRecord.answers = answers;
      } else {
        progress.quizScores.push({
          topicTitle: topic.title,
          subTopicTitle: subTopic.title,
          score: scorePct,
          totalQuestions: quizQuestions.length,
          passed,
          answers
        });
      }

      if (passed && !progress.completedSubTopics.includes(subTopic.title)) {
        progress.completedSubTopics.push(subTopic.title);
      }

      return res.json({ score: scorePct, correctCount, totalQuestions: quizQuestions.length, passed, targetPercentage: targetPct });
    }

    const user = await byId(users, req.user?.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.courseProgress) user.courseProgress = [];
    let progress = user.courseProgress.find((p: CourseProgress) => p.courseId === id);
    if (!progress) {
      const newProgress = { courseId: id, completedSubTopics: [], quizScores: [], assignmentSubmissions: [] } as any;
      user.courseProgress.push(newProgress);
      progress = newProgress;
    }

    const activeProgress = progress!;
    let scoreRecord = activeProgress.quizScores.find((q: QuizScore) => q.topicTitle === topic.title && q.subTopicTitle === subTopic.title);
    if (scoreRecord) {
      scoreRecord.score = scorePct;
      scoreRecord.totalQuestions = quizQuestions.length;
      scoreRecord.passed = passed;
      scoreRecord.answers = answers;
    } else {
      activeProgress.quizScores.push({
        topicTitle: topic.title,
        subTopicTitle: subTopic.title,
        score: scorePct,
        totalQuestions: quizQuestions.length,
        passed,
        answers
      });
    }

    if (passed && !activeProgress.completedSubTopics.includes(subTopic.title)) {
      activeProgress.completedSubTopics.push(subTopic.title);
    }

    await save(users, user);
    res.json({ score: scorePct, correctCount, totalQuestions: quizQuestions.length, passed, targetPercentage: targetPct });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error submitting quiz', error: error.message });
  }
});

app.post('/api/courses/:id/topics/:topicIdx/subtopics/:subTopicIdx/submit-assignment', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { submissionType, textSubmission, fileName } = req.body;
    if (!submissionType) {
      return res.status(400).json({ message: 'submissionType is required (text or file)' });
    }

    const { id, topicIdx, subTopicIdx } = req.params;
    const tIdx = Number(topicIdx);
    const sIdx = Number(subTopicIdx);

    let course: any = null;
    if (useMock()) {
      course = mockCourses.find(c => c.id === id);
    } else {
      course = await byId(courses, id);
    }

    if (!course) return res.status(404).json({ message: 'Course not found' });

    const topic = course.topics?.[tIdx];
    const subTopic = topic?.subTopics?.[sIdx];
    if (!subTopic) return res.status(404).json({ message: 'Subtopic not found' });

    const assignment = subTopic.assignment;
    if (!assignment) {
      return res.status(400).json({ message: 'This subtopic does not have an assignment' });
    }

    const submissionData = {
      topicTitle: topic.title,
      subTopicTitle: subTopic.title,
      assignmentTitle: assignment.title,
      submissionType,
      textSubmission: submissionType === 'text' ? textSubmission : undefined,
      fileName: submissionType === 'file' ? fileName : undefined,
      status: 'pending' as const,
      submittedAt: new Date()
    };

    if (useMock()) {
      const user = mockUsers.find(u => u.id === req.user?.id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      if (!user.courseProgress) user.courseProgress = [];
      let progress = user.courseProgress.find((p: any) => p.courseId === id);
      if (!progress) {
        progress = { courseId: id, completedSubTopics: [], quizScores: [], assignmentSubmissions: [] };
        user.courseProgress.push(progress);
      }

      let existingSub = progress.assignmentSubmissions.find((s: any) => 
        s.topicTitle === topic.title && s.subTopicTitle === subTopic.title && s.assignmentTitle === assignment.title
      );
      if (existingSub) {
        Object.assign(existingSub, submissionData);
      } else {
        progress.assignmentSubmissions.push(submissionData);
      }

      return res.json({ message: 'Assignment submitted (Simulation)', submission: submissionData });
    }

    const user = await byId(users, req.user?.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.courseProgress) user.courseProgress = [];
    let progress = user.courseProgress.find((p: CourseProgress) => p.courseId === id);
    if (!progress) {
      const newProgress = { courseId: id, completedSubTopics: [], quizScores: [], assignmentSubmissions: [] } as any;
      user.courseProgress.push(newProgress);
      progress = newProgress;
    }

    const activeProgress = progress!;
    let existingSub = activeProgress.assignmentSubmissions.find((s: AssignmentSubmission) => 
      s.topicTitle === topic.title && s.subTopicTitle === subTopic.title && s.assignmentTitle === assignment.title
    );
    if (existingSub) {
      Object.assign(existingSub, submissionData);
    } else {
      activeProgress.assignmentSubmissions.push(submissionData as any);
    }

    await save(users, user);
    res.json({ message: 'Assignment submitted successfully', submission: submissionData });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error submitting assignment', error: error.message });
  }
});

app.post('/api/courses/:id/claim-certificate', protect, async (req: AuthRequest, res: Response) => {
  try {
    const courseId = req.params.id;
    let course: any = null;

    if (useMock()) {
      course = mockCourses.find(c => c.id === courseId);
    } else {
      course = await byId(courses, courseId);
    }
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (useMock()) {
      const user = mockUsers.find(u => u.id === req.user?.id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      const progress = user.courseProgress?.find((p: any) => p.courseId === courseId);
      if (!progress) return res.status(400).json({ message: 'No course progress found' });

      const totalSubTopics = course.topics?.reduce((acc: number, t: any) => acc + (t.subTopics?.length || 0), 0) || 0;
      if (progress.completedSubTopics?.length < totalSubTopics) {
        return res.status(400).json({ message: 'You have not completed all topics in this course' });
      }

      const quizzesCount = progress.quizScores?.length || 0;
      if (quizzesCount > 0) {
        const sum = progress.quizScores.reduce((acc: number, q: any) => acc + q.score, 0);
        const avg = sum / quizzesCount;
        if (avg < (course.targetPercentage || 60)) {
          return res.status(400).json({ message: `Your average quiz score of ${Math.round(avg)}% is below the required passing target of ${course.targetPercentage || 60}%` });
        }
      }

      const courseName = course.title;
      const alreadyCertified = user.certificates.some((c: any) => c.courseName === courseName);
      if (alreadyCertified) {
        const cert = mockCertificates.find((c: any) => c.courseName === courseName && c.studentEmail === user.email);
        return res.json({ message: 'Certificate already claimed', certificate: cert });
      }

      const certificateId = 'FSC-' + crypto.randomBytes(4).toString('hex').toUpperCase();
      const hashSig = crypto.createHash('sha256').update(`${user.name}-${courseName}-${certificateId}`).digest('hex');

      const newCert = {
        certificateId,
        studentName: user.name,
        studentEmail: user.email,
        courseName,
        issueDate: new Date(),
        cryptographicHash: hashSig,
        grade: 'Passed'
      };
      mockCertificates.push(newCert);

      user.certificates.push({
        certificateId,
        courseName,
        issueDate: new Date()
      });

      return res.json({ message: 'Certificate generated successfully (Simulation)', certificate: newCert });
    }

    const user = await byId(users, req.user?.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const progress = user.courseProgress?.find((p: CourseProgress) => p.courseId === courseId);
    if (!progress) return res.status(400).json({ message: 'No course progress found' });

    const totalSubTopics = course.topics?.reduce((acc: number, t: any) => acc + (t.subTopics?.length || 0), 0) || 0;
    if (progress.completedSubTopics?.length < totalSubTopics) {
      return res.status(400).json({ message: 'You have not completed all topics in this course' });
    }

    const quizzesCount = progress.quizScores?.length || 0;
    if (quizzesCount > 0) {
      const sum = progress.quizScores.reduce((acc: number, q: QuizScore) => acc + q.score, 0);
      const avg = sum / quizzesCount;
      if (avg < (course.targetPercentage || 60)) {
        return res.status(400).json({ message: `Your average quiz score of ${Math.round(avg)}% is below the required passing target of ${course.targetPercentage || 60}%` });
      }
    }

    const courseName = course.title;
    const alreadyCertified = user.certificates.some((c: UserCertificate) => c.courseName === courseName);
    if (alreadyCertified) {
      const [cert] = await db.select().from(certificates)
        .where(and(eq(certificates.courseName, courseName), eq(certificates.studentEmail, user.email)));
      return res.json({ message: 'Certificate already claimed', certificate: cert });
    }

    const certificateId = 'FSC-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    const hashSig = crypto.createHash('sha256').update(`${user.name}-${courseName}-${certificateId}`).digest('hex');

    const [newCert] = await db.insert(certificates).values({
      certificateId,
      studentName: user.name,
      studentEmail: user.email,
      courseName,
      issueDate: new Date(),
      cryptographicHash: hashSig,
      grade: 'Passed'
    }).returning();

    user.certificates.push({
      certificateId,
      courseName,
      issueDate: new Date()
    });

    await save(users, user);
    res.json({ message: 'Certificate generated successfully', certificate: newCert });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error generating certificate', error: error.message });
  }
});

// --- QUIZ ENDPOINTS ---
app.get('/api/quizzes', async (req: Request, res: Response) => {
  try {
    if (useMock()) {
      const list = req.query.adminView === 'true' ? mockQuizzes : mockQuizzes.filter(q => q.isActive);
      const studentList = list.map(q => {
        const copy = { ...q };
        if (copy.questions) {
          copy.questions = copy.questions.map((ques: any) => {
            const qCopy = { ...ques };
            delete qCopy.correctOptionIndex;
            return qCopy;
          });
        }
        return copy;
      });
      return res.json(studentList);
    }
    try {
      const rows = await db
        .select()
        .from(quizzes)
        .where(req.query.adminView === 'true' ? undefined : eq(quizzes.isActive, true));

      res.json(rows.map(quiz => ({
        ...quiz,
        questions: (quiz.questions || []).map(({ correctOptionIndex, ...rest }: any) => rest)
      })));
    } catch (dbErr: any) {
      throw dbErr;
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Server error fetching quizzes', error: error.message });
  }
});

// Public homepage quiz: answers are intentionally included because this is an
// ungraded lead-magnet quiz. Graded attempts still use /api/quizzes/:id.
app.get('/api/quizzes/free-preview', async (_req: Request, res: Response) => {
  try {
    const [quiz] = await db
      .select({
        id: quizzes.id,
        title: quizzes.title,
        category: quizzes.category,
        questions: quizzes.questions
      })
      .from(quizzes)
      .where(and(eq(quizzes.isActive, true), sql`jsonb_array_length(${quizzes.questions}) >= 10`))
      .orderBy(asc(quizzes.createdAt))
      .limit(1);
    if (!quiz) return res.status(404).json({ message: 'No quiz is available' });
    res.json(quiz);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error fetching the free quiz', error: error.message });
  }
});

app.get('/api/quizzes/:id', optionalProtect, async (req: AuthRequest, res: Response) => {
  try {
    const isStaff = req.user && ['admin', 'teacher', 'faculty'].includes(req.user.role);
    const sanitizeQuiz = (q: any) => {
      if (!q) return q;
      if (isStaff) return q;
      const copy = { ...q };
      if (copy.questions) {
        copy.questions = (copy.questions || []).map((ques: any) => {
          const qCopy = { ...ques };
          delete qCopy.correctOptionIndex;
          return qCopy;
        });
      }
      return copy;
    };

    if (useMock()) {
      const quiz = mockQuizzes.find(q => q.id === req.params.id);
      if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
      return res.json(sanitizeQuiz(quiz));
    }
    try {
      const quiz = await byId(quizzes, req.params.id);
      if (!quiz) {
        return res.status(404).json({ message: 'Quiz not found' });
      }
      return res.json(sanitizeQuiz(quiz));
    } catch (dbErr: any) {
      throw dbErr;
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Server error fetching quiz questions', error: error.message });
  }
});

app.post('/api/quizzes/:id/submit', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { answers } = req.body;
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Answers array is required' });
    }

    if (useMock()) {
      const user = mockUsers.find(u => u.id === req.user?.id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      const quiz = mockQuizzes.find(q => q.id === req.params.id);
      if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

      const passMark = quiz.passingPercentage ?? 80;
      const priorAttempts = user.completedQuizzes.filter((a: any) => String(a.quizId) === String(quiz.id)).length;
      if (quiz.attemptsAllowed && priorAttempts >= quiz.attemptsAllowed) {
        return res.status(403).json({ message: `Maximum attempts (${quiz.attemptsAllowed}) reached for this assessment.` });
      }

      const graded = gradeQuiz(quiz.questions, answers, {
        negativeMarking: quiz.negativeMarking,
        negativeMarkFraction: quiz.negativeMarkFraction,
        passingPercentage: passMark
      });
      const scorePct = graded.score;
      const correctCount = graded.correctCount;

      // Save attempt
      user.completedQuizzes.push({
        quizId: quiz.id,
        quizTitle: quiz.title,
        score: scorePct,
        totalQuestions: quiz.questions.length,
        date: new Date()
      });

      let newCert = null;
      if (scorePct >= passMark) {
        let courseName = 'Certified Forensic Professional (' + quiz.category + ')';
        const linkedCourse = mockCourses.find(c => c.id === quiz.courseId);
        if (linkedCourse) {
          courseName = linkedCourse.title;
        }

        const alreadyCertified = user.certificates.some((c: any) => c.courseName === courseName);
        if (!alreadyCertified) {
          const certificateId = 'FSC-' + crypto.randomBytes(4).toString('hex').toUpperCase();
          const hashSig = crypto.createHash('sha256').update(`${user.name}-${courseName}-${certificateId}`).digest('hex');

          newCert = {
            certificateId,
            studentName: user.name,
            studentEmail: user.email,
            courseName,
            issueDate: new Date(),
            cryptographicHash: hashSig,
            grade: scorePct >= 95 ? 'A++' : scorePct >= 90 ? 'A+' : 'A'
          };
          mockCertificates.push(newCert);

          user.certificates.push({
            certificateId,
            courseName,
            issueDate: new Date()
          });
        }
      }

      return res.json({
        score: scorePct,
        correctCount,
        totalQuestions: quiz.questions.length,
        passed: scorePct >= passMark,
        negativeMarking: !!quiz.negativeMarking,
        certificate: newCert
      });
    }

    const user = await byId(users, req.user?.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const quiz = await byId(quizzes, req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const passMark = quiz.passingPercentage ?? 80;
    const priorAttempts = user.completedQuizzes.filter((a: CompletedQuiz) => String(a.quizId) === String(quiz.id)).length;
    if (quiz.attemptsAllowed && priorAttempts >= quiz.attemptsAllowed) {
      return res.status(403).json({ message: `Maximum attempts (${quiz.attemptsAllowed}) reached for this assessment.` });
    }

    const graded = gradeQuiz(quiz.questions as any[], answers, {
      negativeMarking: quiz.negativeMarking,
      negativeMarkFraction: quiz.negativeMarkFraction,
      passingPercentage: passMark
    });
    const scorePct = graded.score;
    const correctCount = graded.correctCount;

    user.completedQuizzes.push({
      quizId: quiz.id,
      quizTitle: quiz.title,
      score: scorePct,
      totalQuestions: quiz.questions.length,
      date: new Date()
    });

    let newCert = null;
    if (scorePct >= passMark) {
      let courseName = 'Certified Forensic Professional (' + quiz.category + ')';
      if (quiz.courseId) {
        const linkedCourse = await byId(courses, quiz.courseId);
        if (linkedCourse) {
          courseName = linkedCourse.title;
        }
      }

      const alreadyCertified = user.certificates.some((c: UserCertificate) => c.courseName === courseName);
      if (!alreadyCertified) {
        const certificateId = 'FSC-' + crypto.randomBytes(4).toString('hex').toUpperCase();
        const hashSig = crypto.createHash('sha256').update(`${user.name}-${courseName}-${certificateId}`).digest('hex');

        [newCert] = await db.insert(certificates).values({
          certificateId,
          studentName: user.name,
          studentEmail: user.email,
          courseName,
          issueDate: new Date(),
          cryptographicHash: hashSig,
          grade: scorePct >= 95 ? 'A++' : scorePct >= 90 ? 'A+' : 'A'
        }).returning();

        user.certificates.push({
          certificateId,
          courseName,
          issueDate: new Date()
        });
      }
    }

    await save(users, user);

    res.json({
      score: scorePct,
      correctCount,
      totalQuestions: quiz.questions.length,
      passed: scorePct >= passMark,
      negativeMarking: !!quiz.negativeMarking,
      certificate: newCert
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error submitting quiz answers', error: error.message });
  }
});

// --- CERTIFICATE VERIFICATION ---
app.get('/api/certificates/verify/:id', async (req: Request, res: Response) => {
  try {
    if (useMock()) {
      const cert = mockCertificates.find(c => c.certificateId === req.params.id.toUpperCase());
      if (!cert) return res.status(404).json({ message: 'Certificate verification failed. Code not found.' });
      return res.json(cert);
    }
    const [cert] = await db.select().from(certificates)
      .where(eq(certificates.certificateId, req.params.id.toUpperCase()));
    if (!cert) {
      return res.status(404).json({ message: 'Certificate verification failed. Code not found.' });
    }
    res.json(cert);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error verifying certificate', error: error.message });
  }
});

// --- RESEARCH ENDPOINTS ---
app.get('/api/research', async (req: Request, res: Response) => {
  try {
    if (useMock()) {
      const list = req.query.adminView === 'true' ? mockResearch : mockResearch.filter(p => p.isActive);
      return res.json(list);
    }
    try {
      const papers = await db.select().from(research).where(req.query.adminView === 'true' ? undefined : eq(research.isActive, true));
      return res.json(papers);
    } catch (dbErr: any) {
      throw dbErr;
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Server error fetching research publications', error: error.message });
  }
});

app.get('/api/research/:slug', async (req: Request, res: Response) => {
  try {
    if (useMock()) {
      const paper = mockResearch.find(p => p.slug === req.params.slug);
      if (!paper) return res.status(404).json({ message: 'Research paper not found' });
      return res.json(paper);
    }
    try {
      const [paper] = await db.select().from(research).where(eq(research.slug, req.params.slug));
      if (!paper) {
        return res.status(404).json({ message: 'Research paper not found' });
      }
      return res.json(paper);
    } catch (dbErr: any) {
      throw dbErr;
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Server error fetching research details', error: error.message });
  }
});

// --- CONTACT ENDPOINT ---
app.post('/api/contact', async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email, and message are required' });
    }

    if (useMock()) {
      const contactMsg = {
        id: 'contact_mock_' + Math.random().toString(36).substr(2, 9),
        name,
        email,
        subject,
        message,
        isResolved: false,
        createdAt: new Date()
      };
      mockContacts.push(contactMsg);
      return res.status(201).json({ message: 'Message sent successfully (Simulation)', contactMsg });
    }

    const [contactMsg] = await db.insert(contacts).values({ name, email, subject, message }).returning();
    res.status(201).json({ message: 'Message sent successfully', contactMsg });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error saving contact message', error: error.message });
  }
});

// --- ADMIN ENDPOINTS (PROTECTED & ADMIN-ONLY) ---

// Get Administrative Statistics Dashboard
app.get('/api/admin/stats', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    if (useMock()) {
      return res.json({
        usersCount: mockUsers.length,
        coursesCount: mockCourses.length,
        quizzesCount: mockQuizzes.length,
        researchCount: mockResearch.length,
        contactsCount: mockContacts.length
      });
    }

    const usersCount = await countRows(users);
    const coursesCount = await countRows(courses);
    const quizzesCount = await countRows(quizzes);
    const researchCount = await countRows(research);
    const contactsCount = await countRows(contacts);

    res.json({
      usersCount,
      coursesCount,
      quizzesCount,
      researchCount,
      contactsCount
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error fetching admin statistics', error: error.message });
  }
});

// Users Manager List
app.get('/api/admin/users', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    if (useMock()) {
      return res.json(mockUsers.map(publicUser));
    }
    const rows = await db.select().from(users);
    res.json(rows.map(publicUser));
  } catch (error: any) {
    res.status(500).json({ message: 'Server error fetching users list', error: error.message });
  }
});

// Modify User Details / Role
app.put('/api/admin/users/:id', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;
    // A free-form role would write a value no permission check recognises, which
    // fails open or closed depending on the route. Constrain it to the enum.
    if (role && !ROLES.includes(role)) {
      return res.status(400).json({ message: `Role must be one of: ${ROLES.join(', ')}` });
    }

    if (useMock()) {
      const user = mockUsers.find(u => u.id === req.params.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      if (role) user.role = role;
      return res.json({ message: 'User updated successfully (Simulation)', user: publicUser(user) });
    }

    const userToEdit = await byId(users, req.params.id);
    if (!userToEdit) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (role) {
      userToEdit.role = role;
    }

    await save(users, userToEdit);
    res.json({ message: 'User updated successfully', user: publicUser(userToEdit) });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error updating user role', error: error.message });
  }
});

// Courses CRUD Operations
app.post('/api/admin/courses', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const {
      title, description, category, instructorName, instructorTitle, durationWeeks, difficulty,
      priceINR, syllabus, features, bannerSvgType,
      courseType, format, startDate, endDate, thumbnailUrl, topics, targetPercentage
    } = req.body;
    if (!title || !description || !category || !instructorName || !instructorTitle || !priceINR) {
      return res.status(400).json({ message: 'Required fields missing for course creation' });
    }

    const scheduleError = validateSchedule(courseType, startDate, endDate);
    if (scheduleError) return res.status(400).json({ message: scheduleError });

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const adminCourseData = {
      title,
      slug,
      description,
      category,
      instructorName,
      instructorTitle,
      durationWeeks: durationWeeks || 8,
      difficulty: (difficulty || 'Beginner') as 'Beginner' | 'Intermediate' | 'Advanced',
      courseType: (courseType === 'live' ? 'live' : 'recorded') as 'live' | 'recorded',
      format: (format === 'diploma' ? 'diploma' : 'course') as 'diploma' | 'course',
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      thumbnailUrl: thumbnailUrl || '',
      priceINR,
      discountPriceINR: priceINR,
      discountPercentage: 0,
      approvalStatus: 'approved' as const,
      syllabus: syllabus || [],
      features: features || [],
      targetPercentage: targetPercentage !== undefined ? Number(targetPercentage) : 60,
      topics: topics || [],
      bannerSvgType: bannerSvgType || 'fingerprint',
      isActive: true,
      ...pickMarketing(req.body)
    };

    if (useMock()) {
      const newCourse = {
        id: 'mock_c_' + Math.random().toString(36).substr(2, 9),
        ...adminCourseData,
        studentsCount: 0,
        rating: 4.8,
        ratingCount: 1
      };
      mockCourses.push(newCourse);
      await syncCourseSeminars(newCourse, 'approved');
      return res.status(201).json({ message: 'Course created successfully (Simulation)', course: newCourse });
    }

    const [newCourse] = await db.insert(courses).values(adminCourseData).returning();
    await syncCourseSeminars(newCourse, 'approved');
    res.status(201).json({ message: 'Course created successfully', course: newCourse });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error creating course', error: error.message });
  }
});

// Admin Approve / Reject Course
app.post('/api/admin/courses/:id/approve', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { approvalStatus, priceINR, discountPriceINR, discountPercentage } = req.body;

    if (!approvalStatus || !['approved', 'rejected'].includes(approvalStatus)) {
      return res.status(400).json({ message: 'Valid approvalStatus (approved or rejected) is required' });
    }

    if (useMock()) {
      const course = mockCourses.find(c => c.id === req.params.id);
      if (!course) return res.status(404).json({ message: 'Course not found' });

      course.approvalStatus = approvalStatus;
      if (priceINR !== undefined) {
        course.priceINR = Number(priceINR);
      }
      if (discountPriceINR !== undefined) {
        course.discountPriceINR = Number(discountPriceINR);
      }
      if (discountPercentage !== undefined) {
        course.discountPercentage = Number(discountPercentage);
      } else if (priceINR !== undefined && discountPriceINR !== undefined) {
        const actual = Number(priceINR);
        const promo = Number(discountPriceINR);
        course.discountPercentage = actual > 0 ? Math.round(((actual - promo) / actual) * 100) : 0;
      }
      return res.json({ message: `Course ${approvalStatus} successfully (Simulation)`, course });
    }

    const courseId = asUuid(req.params.id);
    const course = await byId(courses, courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    course.approvalStatus = approvalStatus;
    if (priceINR !== undefined) {
      course.priceINR = Number(priceINR);
    }
    if (discountPriceINR !== undefined) {
      course.discountPriceINR = Number(discountPriceINR);
    }
    if (discountPercentage !== undefined) {
      course.discountPercentage = Number(discountPercentage);
    } else if (priceINR !== undefined && discountPriceINR !== undefined) {
      const actual = Number(priceINR);
      const promo = Number(discountPriceINR);
      course.discountPercentage = actual > 0 ? Math.round(((actual - promo) / actual) * 100) : 0;
    }
    await save(courses, course);

    res.json({ message: `Course ${approvalStatus} successfully`, course });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error approving course', error: error.message });
  }
});

// Admin Approve / Reject Seminar (Live Class)
app.post('/api/admin/seminars/:id/approve', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { approvalStatus } = req.body;

    if (!approvalStatus || !['approved', 'rejected'].includes(approvalStatus)) {
      return res.status(400).json({ message: 'Valid approvalStatus (approved or rejected) is required' });
    }

    if (useMock()) {
      const seminar = mockSeminars.find(s => s.id === req.params.id);
      if (!seminar) return res.status(404).json({ message: 'Live class not found' });

      seminar.approvalStatus = approvalStatus;
      return res.json({ message: `Live class ${approvalStatus} successfully (Simulation)`, seminar });
    }

    const seminarId = asUuid(req.params.id);
    const seminarRow = await byId(seminars, seminarId);
    if (!seminarRow) {
      return res.status(404).json({ message: 'Live class not found' });
    }

    seminarRow.approvalStatus = approvalStatus;
    await save(seminars, seminarRow);

    res.json({ message: `Live class ${approvalStatus} successfully`, seminar: seminarRow });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error approving live class', error: error.message });
  }
});

app.put('/api/admin/courses/:id', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const {
      title, description, category, instructorName, instructorTitle, durationWeeks, difficulty,
      priceINR, syllabus, features, isActive,
      courseType, format, startDate, endDate, thumbnailUrl, topics, targetPercentage
    } = req.body;

    if (courseType) {
      const scheduleError = validateSchedule(courseType, startDate, endDate);
      if (scheduleError) return res.status(400).json({ message: scheduleError });
    }

    // Applies every editable field to either the mock record or the database row.
    const applyAdminEdits = (course: any) => {
      if (title) {
        course.title = title;
        course.slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
      if (description) course.description = description;
      if (category) course.category = category;
      if (instructorName) course.instructorName = instructorName;
      if (instructorTitle) course.instructorTitle = instructorTitle;
      if (durationWeeks !== undefined) course.durationWeeks = durationWeeks;
      if (difficulty) course.difficulty = difficulty;
      if (courseType) course.courseType = courseType;
      if (format) course.format = format;
      if (startDate !== undefined) course.startDate = startDate ? new Date(startDate) : undefined;
      if (endDate !== undefined) course.endDate = endDate ? new Date(endDate) : undefined;
      if (thumbnailUrl !== undefined) course.thumbnailUrl = thumbnailUrl;
      if (priceINR !== undefined) course.priceINR = priceINR;
      if (syllabus) course.syllabus = syllabus;
      if (features) course.features = features;
      if (targetPercentage !== undefined) course.targetPercentage = Number(targetPercentage);
      // Topics carry the admin-managed lesson detail; without this the builder's edits were dropped.
      if (topics) course.topics = topics;
      if (isActive !== undefined) course.isActive = isActive;
      applyMarketing(course, req.body);
    };

    if (useMock()) {
      const course = mockCourses.find(c => c.id === req.params.id);
      if (!course) return res.status(404).json({ message: 'Course not found' });

      applyAdminEdits(course);
      await syncCourseSeminars(course, 'approved');
      return res.json({ message: 'Course updated successfully (Simulation)', course });
    }

    const courseToEdit = await byId(courses, req.params.id);
    if (!courseToEdit) {
      return res.status(404).json({ message: 'Course not found' });
    }

    applyAdminEdits(courseToEdit);

    await save(courses, courseToEdit);
    await syncCourseSeminars(courseToEdit, 'approved');
    res.json({ message: 'Course updated successfully', course: courseToEdit });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error updating course details', error: error.message });
  }
});

app.delete('/api/admin/courses/:id', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    if (useMock()) {
      mockCourses = mockCourses.filter(c => c.id !== req.params.id);
      return res.json({ message: 'Course deleted successfully (Simulation)' });
    }

    const deletedCourse = await removeById(courses, req.params.id);
    if (!deletedCourse) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json({ message: 'Course deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error deleting course', error: error.message });
  }
});

// Quizzes CRUD Operations
app.post('/api/admin/quizzes', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category, courseId, timeLimitMinutes, questions, passingPercentage, negativeMarking, negativeMarkFraction, attemptsAllowed } = req.body;
    if (!title || !description || !category || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ message: 'Required fields missing for quiz creation' });
    }

    const scoringSettings = {
      passingPercentage: passingPercentage ?? 80,
      negativeMarking: negativeMarking ?? false,
      negativeMarkFraction: negativeMarkFraction ?? 0.25,
      attemptsAllowed: attemptsAllowed ?? 0
    };

    if (useMock()) {
      const newQuiz = {
        id: 'mock_q_' + Math.random().toString(36).substr(2, 9),
        title,
        description,
        category,
        courseId: courseId || null,
        timeLimitMinutes: timeLimitMinutes || 15,
        questions,
        ...scoringSettings,
        isActive: true
      };
      mockQuizzes.push(newQuiz);
      return res.status(201).json({ message: 'Quiz created successfully (Simulation)', quiz: newQuiz });
    }

    const [newQuiz] = await db.insert(quizzes).values({
      title,
      description,
      category,
      courseId: courseId || null,
      timeLimitMinutes: timeLimitMinutes || 15,
      questions,
      ...scoringSettings,
      isActive: true
    }).returning();

    res.status(201).json({ message: 'Quiz created successfully', quiz: newQuiz });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error creating quiz', error: error.message });
  }
});

app.put('/api/admin/quizzes/:id', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category, courseId, timeLimitMinutes, questions, isActive, passingPercentage, negativeMarking, negativeMarkFraction, attemptsAllowed } = req.body;

    if (useMock()) {
      const quiz = mockQuizzes.find(q => q.id === req.params.id);
      if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

      if (title) quiz.title = title;
      if (description) quiz.description = description;
      if (category) quiz.category = category;
      if (courseId !== undefined) quiz.courseId = courseId;
      if (timeLimitMinutes !== undefined) quiz.timeLimitMinutes = timeLimitMinutes;
      if (questions) quiz.questions = questions;
      if (passingPercentage !== undefined) quiz.passingPercentage = passingPercentage;
      if (negativeMarking !== undefined) quiz.negativeMarking = negativeMarking;
      if (negativeMarkFraction !== undefined) quiz.negativeMarkFraction = negativeMarkFraction;
      if (attemptsAllowed !== undefined) quiz.attemptsAllowed = attemptsAllowed;
      if (isActive !== undefined) quiz.isActive = isActive;

      return res.json({ message: 'Quiz updated successfully (Simulation)', quiz });
    }

    const quizToEdit = await byId(quizzes, req.params.id);
    if (!quizToEdit) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (title) quizToEdit.title = title;
    if (description) quizToEdit.description = description;
    if (category) quizToEdit.category = category;
    if (courseId !== undefined) quizToEdit.courseId = courseId;
    if (timeLimitMinutes !== undefined) quizToEdit.timeLimitMinutes = timeLimitMinutes;
    if (questions) quizToEdit.questions = questions;
    if (passingPercentage !== undefined) quizToEdit.passingPercentage = passingPercentage;
    if (negativeMarking !== undefined) quizToEdit.negativeMarking = negativeMarking;
    if (negativeMarkFraction !== undefined) quizToEdit.negativeMarkFraction = negativeMarkFraction;
    if (attemptsAllowed !== undefined) quizToEdit.attemptsAllowed = attemptsAllowed;
    if (isActive !== undefined) quizToEdit.isActive = isActive;

    await save(quizzes, quizToEdit);
    res.json({ message: 'Quiz updated successfully', quiz: quizToEdit });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error updating quiz details', error: error.message });
  }
});

app.delete('/api/admin/quizzes/:id', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    if (useMock()) {
      mockQuizzes = mockQuizzes.filter(q => q.id !== req.params.id);
      return res.json({ message: 'Quiz deleted successfully (Simulation)' });
    }

    const deletedQuiz = await removeById(quizzes, req.params.id);
    if (!deletedQuiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error deleting quiz', error: error.message });
  }
});

// Research CRUD Operations
app.post('/api/admin/research', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { title, abstract, content, category, authors, readTimeMinutes, citation, references } = req.body;
    if (!title || !abstract || !content || !category || !authors || !citation) {
      return res.status(400).json({ message: 'Required fields missing for research publication' });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (useMock()) {
      const newResearch = {
        id: 'mock_r_' + Math.random().toString(36).substr(2, 9),
        title,
        slug,
        abstract,
        content,
        category,
        authors,
        readTimeMinutes: readTimeMinutes || 8,
        citation,
        references: references || [],
        isActive: true,
        downloadsCount: 0,
        publishedDate: new Date()
      };
      mockResearch.push(newResearch);
      return res.status(201).json({ message: 'Research published successfully (Simulation)', research: newResearch });
    }

    const [newResearch] = await db.insert(research).values({
      title,
      slug,
      abstract,
      content,
      category,
      authors,
      readTimeMinutes: readTimeMinutes || 8,
      citation,
      references: references || [],
      isActive: true
    }).returning();

    res.status(201).json({ message: 'Research published successfully', research: newResearch });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error publishing research', error: error.message });
  }
});

app.put('/api/admin/research/:id', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { title, abstract, content, category, authors, readTimeMinutes, citation, references, isActive } = req.body;

    if (useMock()) {
      const paper = mockResearch.find(p => p.id === req.params.id);
      if (!paper) return res.status(404).json({ message: 'Research paper not found' });

      if (title) {
        paper.title = title;
        paper.slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
      if (abstract) paper.abstract = abstract;
      if (content) paper.content = content;
      if (category) paper.category = category;
      if (authors) paper.authors = authors;
      if (readTimeMinutes !== undefined) paper.readTimeMinutes = readTimeMinutes;
      if (citation) paper.citation = citation;
      if (references) paper.references = references;
      if (isActive !== undefined) paper.isActive = isActive;

      return res.json({ message: 'Research updated successfully (Simulation)', research: paper });
    }

    const researchToEdit = await byId(research, req.params.id);
    if (!researchToEdit) {
      return res.status(404).json({ message: 'Research paper not found' });
    }

    if (title) {
      researchToEdit.title = title;
      researchToEdit.slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (abstract) researchToEdit.abstract = abstract;
    if (content) researchToEdit.content = content;
    if (category) researchToEdit.category = category;
    if (authors) researchToEdit.authors = authors;
    if (readTimeMinutes !== undefined) researchToEdit.readTimeMinutes = readTimeMinutes;
    if (citation) researchToEdit.citation = citation;
    if (references) researchToEdit.references = references;
    if (isActive !== undefined) researchToEdit.isActive = isActive;

    await save(research, researchToEdit);
    res.json({ message: 'Research updated successfully', research: researchToEdit });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error updating research paper', error: error.message });
  }
});

app.delete('/api/admin/research/:id', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    if (useMock()) {
      mockResearch = mockResearch.filter(p => p.id !== req.params.id);
      return res.json({ message: 'Research paper deleted successfully (Simulation)' });
    }

    const deletedResearch = await removeById(research, req.params.id);
    if (!deletedResearch) {
      return res.status(404).json({ message: 'Research not found' });
    }
    res.json({ message: 'Research paper deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error deleting research paper', error: error.message });
  }
});

// Contact Messages Manager
app.get('/api/admin/contacts', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    if (useMock()) {
      return res.json(mockContacts);
    }
    const messages = await db.select().from(contacts).orderBy(desc(contacts.createdAt));
    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error fetching contact messages', error: error.message });
  }
});

app.put('/api/admin/contacts/:id', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { isResolved } = req.body;
    
    if (useMock()) {
      const contact = mockContacts.find(c => c.id === req.params.id);
      if (!contact) return res.status(404).json({ message: 'Contact message not found' });
      if (isResolved !== undefined) contact.isResolved = isResolved;
      return res.json({ message: 'Contact status updated successfully (Simulation)', contactMsg: contact });
    }

    const contactMsg = await byId(contacts, req.params.id);
    if (!contactMsg) {
      return res.status(404).json({ message: 'Contact message not found' });
    }

    if (isResolved !== undefined) {
      contactMsg.isResolved = isResolved;
    }

    await save(contacts, contactMsg);
    res.json({ message: 'Contact status updated successfully', contactMsg });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error resolving contact message', error: error.message });
  }
});

// --- SEMINARS & LIVE CLASSES ENDPOINTS ---
app.get('/api/seminars', optionalProtect, async (req: AuthRequest, res: Response) => {
  try {
    const isStaff = req.user && ['admin', 'teacher', 'faculty'].includes(req.user.role);
    if (useMock()) {
      const list = isStaff ? mockSeminars : mockSeminars.filter(s => s.approvalStatus === 'approved');
      return res.json(list);
    }
    try {
      let list;
      if (isStaff) {
        list = await db.select().from(seminars).orderBy(asc(seminars.date));
      } else {
        list = await db.select().from(seminars).where(eq(seminars.approvalStatus, 'approved')).orderBy(asc(seminars.date));
      }
      return res.json(list);
    } catch (dbErr: any) {
      throw dbErr;
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching seminars', error: error.message });
  }
});

app.post('/api/seminars', protect, async (req: AuthRequest, res: Response) => {
  try {
    const isStaff = ['teacher', 'faculty', 'admin'].includes(req.user?.role || '');
    if (!isStaff) return res.status(403).json({ message: 'Forbidden. Teacher or admin role required.' });

    const { title, description, date, durationMinutes, link, maxParticipants, courseId, courseTitle } = req.body;
    const instructorName = req.body.instructorName || (req.user as any)?.name || 'Faculty Lead';

    if (!title || !date || !link) {
      return res.status(400).json({ message: 'Title, date, and live meeting link (Teams/Meet/Zoom) are required' });
    }

    const approvalStatus = req.user?.role === 'admin' ? 'approved' : 'pending';

    if (useMock()) {
      const newSeminar = {
        id: 'seminar_mock_' + Math.random().toString(36).substr(2, 9),
        title,
        description: description || 'Live interactive forensic class session.',
        instructorName,
        courseId: courseId || '',
        courseTitle: courseTitle || '',
        date: new Date(date),
        durationMinutes: Number(durationMinutes) || 60,
        link,
        maxParticipants: Number(maxParticipants) || 50,
        approvalStatus,
        registeredStudents: [],
        attendees: []
      };
      mockSeminars.unshift(newSeminar);
      return res.status(201).json({ message: 'Live class scheduled successfully', seminar: newSeminar });
    }

    const [newSeminar] = await db.insert(seminars).values({
      title,
      description: description || 'Live interactive forensic class session.',
      instructorName,
      courseId: asUuid(courseId),
      courseTitle: courseTitle || undefined,
      date: new Date(date),
      durationMinutes: Number(durationMinutes) || 60,
      link,
      maxParticipants: Number(maxParticipants) || 50,
      approvalStatus,
      registeredStudents: [],
      attendees: []
    }).returning();
    res.status(201).json({ message: 'Live class scheduled successfully', seminar: newSeminar });
  } catch (error: any) {
    res.status(500).json({ message: 'Error scheduling live class', error: error.message });
  }
});

app.put('/api/seminars/:id', protect, async (req: AuthRequest, res: Response) => {
  try {
    const isStaff = ['teacher', 'faculty', 'admin'].includes(req.user?.role || '');
    if (!isStaff) return res.status(403).json({ message: 'Forbidden. Teacher or admin role required.' });

    const { title, description, instructorName, date, durationMinutes, link, maxParticipants } = req.body;

    if (useMock()) {
      const seminar = mockSeminars.find(s => s.id === req.params.id);
      if (!seminar) return res.status(404).json({ message: 'Seminar not found' });

      if (title) seminar.title = title;
      if (description) seminar.description = description;
      if (instructorName) seminar.instructorName = instructorName;
      if (date) seminar.date = new Date(date);
      if (durationMinutes !== undefined) seminar.durationMinutes = Number(durationMinutes);
      if (link !== undefined) seminar.link = link;
      if (maxParticipants !== undefined) seminar.maxParticipants = Number(maxParticipants);

      return res.json({ message: 'Live class updated successfully', seminar });
    }

    const seminarToEdit = await byId(seminars, req.params.id);
    if (!seminarToEdit) return res.status(404).json({ message: 'Seminar not found' });

    if (title) seminarToEdit.title = title;
    if (description) seminarToEdit.description = description;
    if (instructorName) seminarToEdit.instructorName = instructorName;
    if (date) seminarToEdit.date = new Date(date);
    if (durationMinutes !== undefined) seminarToEdit.durationMinutes = Number(durationMinutes);
    if (link !== undefined) seminarToEdit.link = link;
    if (maxParticipants !== undefined) seminarToEdit.maxParticipants = Number(maxParticipants);

    await save(seminars, seminarToEdit);
    res.json({ message: 'Live class updated successfully', seminar: seminarToEdit });
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating live class', error: error.message });
  }
});

app.delete('/api/seminars/:id', protect, async (req: AuthRequest, res: Response) => {
  try {
    const isStaff = ['teacher', 'faculty', 'admin'].includes(req.user?.role || '');
    if (!isStaff) return res.status(403).json({ message: 'Forbidden. Teacher or admin role required.' });

    if (useMock()) {
      mockSeminars = mockSeminars.filter(s => s.id !== req.params.id);
      return res.json({ message: 'Live class deleted successfully' });
    }

    const deleted = await removeById(seminars, req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Seminar not found' });
    res.json({ message: 'Live class deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting live class', error: error.message });
  }
});

app.post('/api/seminars/:id/register', protect, async (req: AuthRequest, res: Response) => {
  try {
    const email = req.user?.email;
    if (!email) return res.status(401).json({ message: 'Unauthorized' });

    if (useMock()) {
      const seminar = mockSeminars.find(s => s.id === req.params.id);
      if (!seminar) return res.status(404).json({ message: 'Seminar not found' });
      if (!seminar.registeredStudents.includes(email)) {
        seminar.registeredStudents.push(email);
      }
      return res.json({ message: 'Registered successfully (Simulation)', seminar });
    }

    const seminar = await byId(seminars, req.params.id);
    if (!seminar) return res.status(404).json({ message: 'Seminar not found' });
    if (!seminar.registeredStudents.includes(email)) {
      seminar.registeredStudents.push(email);
      await save(seminars, seminar);
    }
    res.json({ message: 'Registered successfully', seminar });
  } catch (error: any) {
    res.status(500).json({ message: 'Error registering for seminar', error: error.message });
  }
});

// --- BLOGS ENDPOINTS ---
// Staff (teacher/faculty/admin) see every article including their own pending
// drafts; everyone else — including logged-out visitors — sees only approved ones.
app.get('/api/blogs', optionalProtect, async (req: AuthRequest, res: Response) => {
  try {
    const isStaff = !!req.user && ['admin', 'teacher', 'faculty'].includes(req.user.role);
    if (useMock()) {
      return res.json(isStaff ? mockBlogs : mockBlogs.filter(b => b.isActive && b.approvalStatus === 'approved'));
    }
    const list = isStaff
      ? await db.select().from(blogs).orderBy(desc(blogs.createdAt))
      : await db.select().from(blogs)
          .where(and(eq(blogs.isActive, true), eq(blogs.approvalStatus, 'approved')))
          .orderBy(desc(blogs.createdAt));
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching blogs', error: error.message });
  }
});

app.get('/api/blogs/:slug', optionalProtect, async (req: AuthRequest, res: Response) => {
  try {
    const isStaff = !!req.user && ['admin', 'teacher', 'faculty'].includes(req.user.role);
    const visible = (b: any) => isStaff || (b && b.isActive && b.approvalStatus === 'approved');

    if (useMock()) {
      const blog = mockBlogs.find(b => b.slug === req.params.slug);
      if (!blog || !visible(blog)) return res.status(404).json({ message: 'Article not found' });
      return res.json(blog);
    }
    const [blog] = await db.select().from(blogs).where(eq(blogs.slug, req.params.slug));
    if (!blog || !visible(blog)) return res.status(404).json({ message: 'Article not found' });
    res.json(blog);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching article', error: error.message });
  }
});

// Publishing is an editorial action, so it needs a role — 'protect' alone let any
// registered student post to the public research feed. Teacher posts stay 'pending'
// until an admin approves; admin posts publish immediately.
app.post('/api/blogs', protect, requireRole('teacher', 'faculty', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { title, subtitle, content, category, tags, readTimeMinutes, attachments } = req.body;
    const authorName = req.body.authorName || (req.user as any)?.name || 'Instructor';
    if (!title || !content) return res.status(400).json({ message: 'Title and content are required' });
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now().toString(36)}`;
    const approvalStatus = req.user?.role === 'admin' ? 'approved' : 'pending';
    const attachmentList = Array.isArray(attachments) ? attachments : [];

    if (useMock()) {
      const newBlog = {
        id: 'blog_mock_' + Math.random().toString(36).substr(2, 9),
        title,
        subtitle: subtitle || '',
        slug,
        content,
        authorName,
        authorId: req.user?.id,
        category: category || 'Research',
        tags: tags || [],
        attachments: attachmentList,
        readTimeMinutes: Number(readTimeMinutes) || 5,
        likes: 0,
        commentsCount: 0,
        approvalStatus,
        isActive: true,
        createdAt: new Date()
      };
      mockBlogs.unshift(newBlog);
      return res.status(201).json({ message: 'Article submitted for review', blog: newBlog });
    }

    const [newBlog] = await db.insert(blogs).values({
      title,
      subtitle: subtitle || undefined,
      slug,
      content,
      authorName,
      authorId: asUuid(req.user?.id),
      category: category || 'Research',
      tags: tags || [],
      attachments: attachmentList,
      readTimeMinutes: Number(readTimeMinutes) || 5,
      likes: 0,
      commentsCount: 0,
      approvalStatus,
      isActive: true
    }).returning();
    res.status(201).json({
      message: approvalStatus === 'approved' ? 'Article published successfully' : 'Article submitted for review',
      blog: newBlog
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error publishing blog', error: error.message });
  }
});

// Admin editorial gate — mirrors the seminar/course approval flow.
app.post('/api/admin/blogs/:id/approve', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { approvalStatus } = req.body;
    if (!approvalStatus || !['approved', 'rejected'].includes(approvalStatus)) {
      return res.status(400).json({ message: 'Valid approvalStatus (approved or rejected) is required' });
    }

    if (useMock()) {
      const blog = mockBlogs.find(b => b.id === req.params.id);
      if (!blog) return res.status(404).json({ message: 'Article not found' });
      blog.approvalStatus = approvalStatus;
      return res.json({ message: `Article ${approvalStatus} successfully (Simulation)`, blog });
    }

    const blogRow = await byId(blogs, req.params.id);
    if (!blogRow) return res.status(404).json({ message: 'Article not found' });
    blogRow.approvalStatus = approvalStatus;
    await save(blogs, blogRow);
    res.json({ message: `Article ${approvalStatus} successfully`, blog: blogRow });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error approving article', error: error.message });
  }
});

// --- ADMIN USERS ENDPOINTS ---
app.get('/api/admin/users', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    if (useMock()) {
      return res.json(mockUsers.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role })));
    }
    const rows = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role }).from(users);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching user registry', error: error.message });
  }
});

app.put('/api/admin/users/:id/role', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;
    if (!ROLES.includes(role)) {
      return res.status(400).json({ message: `Role must be one of: ${ROLES.join(', ')}` });
    }
    if (useMock()) {
      const userToModify = mockUsers.find(u => u.id === req.params.id);
      if (!userToModify) return res.status(404).json({ message: 'User not found' });
      userToModify.role = role;
      return res.json({ message: 'User role updated (Simulation)', user: publicUser(userToModify) });
    }

    const userToModify = await byId(users, req.params.id);
    if (!userToModify) return res.status(404).json({ message: 'User not found' });
    userToModify.role = role;
    await save(users, userToModify);
    res.json({ message: 'User role updated successfully', user: publicUser(userToModify) });
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating user role', error: error.message });
  }
});

// --- ACCESS CONTROL MATRIX ENDPOINTS ---
app.get('/api/admin/access-matrix', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    if (useMock()) {
      return res.json(mockAccessMatrix);
    }
    let matrix: any = await db.select().from(accessMatrix);
    if (matrix.length === 0) {
      matrix = await db.insert(accessMatrix).values(DEFAULT_MATRIX as any).returning();
    }
    res.json(matrix);
  } catch (error: any) {
    res.status(550).json({ message: 'Error fetching access matrix', error: error.message });
  }
});

app.put('/api/admin/access-matrix', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { updates } = req.body;
    if (useMock()) {
      updates.forEach((upd: any) => {
        const record = mockAccessMatrix.find(r => r.role === upd.role && r.feature === upd.feature);
        if (record) {
          record.create = upd.create;
          record.read = upd.read;
          record.update = upd.update;
        }
      });
      return res.json({ message: 'Access control matrix updated (Simulation)', matrix: mockAccessMatrix });
    }

    for (const upd of updates) {
      // upsert on (role, feature) — the unique index on that pair is what
      // onConflictDoUpdate targets.
      await db
        .insert(accessMatrix)
        .values({ role: upd.role, feature: upd.feature, create: upd.create, read: upd.read, update: upd.update })
        .onConflictDoUpdate({
          target: [accessMatrix.role, accessMatrix.feature],
          set: { create: upd.create, read: upd.read, update: upd.update, updatedAt: new Date() }
        });
    }
    invalidateMatrixCache();
    const matrix = await db.select().from(accessMatrix);
    res.json({ message: 'Access control matrix updated successfully', matrix });
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating access matrix', error: error.message });
  }
});

// --- DROPDOWN OPTIONS & RELATIONS ENDPOINTS ---
app.get('/api/admin/dropdowns', async (req: Request, res: Response) => {
  try {
    if (useMock()) {
      return res.json(mockDropdowns);
    }
    let dropdowns: any[] = await db.select().from(dropdownOptions);
    if (dropdowns.length === 0) {
      const defaults = [
        { category: 'Course Categories', label: 'Digital Forensics', value: 'Digital Forensics', relatedTo: 'Cyber Defense' },
        { category: 'Course Categories', label: 'Physical Investigation', value: 'Physical Investigation', relatedTo: 'Criminology' },
        { category: 'Course Categories', label: 'Biometrics', value: 'Biometrics', relatedTo: 'Security' },
        { category: 'Course Categories', label: 'Cyber Law', value: 'Cyber Law', relatedTo: 'Legal' },
        { category: 'Difficulty Levels', label: 'Beginner', value: 'Beginner', relatedTo: 'Foundation' },
        { category: 'Difficulty Levels', label: 'Intermediate', value: 'Intermediate', relatedTo: 'Mid-Level' },
        { category: 'Difficulty Levels', label: 'Advanced', value: 'Advanced', relatedTo: 'Expert' }
      ];
      dropdowns = await db.insert(dropdownOptions).values(defaults).returning();
    }
    res.json(dropdowns);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching dropdowns', error: error.message });
  }
});

app.post('/api/admin/dropdowns', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { category, label, value, relatedTo } = req.body;
    if (!category || !label || !value) {
      return res.status(400).json({ message: 'Category, label, and value are required' });
    }

    if (useMock()) {
      const newItem = {
        id: 'mock_dd_' + Math.random().toString(36).substr(2, 9),
        category,
        label,
        value,
        relatedTo: relatedTo || ''
      };
      mockDropdowns.push(newItem);
      return res.status(201).json(newItem);
    }

    const [newOption] = await db
      .insert(dropdownOptions)
      .values({ category, label, value, relatedTo: relatedTo || '' })
      .returning();
    res.status(201).json(newOption);
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating dropdown option', error: error.message });
  }
});

app.delete('/api/admin/dropdowns/:id', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (useMock()) {
      mockDropdowns = mockDropdowns.filter(d => d.id !== id);
      return res.json({ message: 'Dropdown option deleted' });
    }
    await removeById(dropdownOptions, id);
    res.json({ message: 'Dropdown option deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting dropdown option', error: error.message });
  }
});

// --- LESSON Q&A DISCUSSION COMMENTS ENDPOINTS ---
app.post('/api/courses/:slug/subtopics/comment', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { slug } = req.params;
    const { subTopicTitle, text, timestampSeconds } = req.body;
    const userName = (req.user as any)?.name || 'User';
    const userRole = (req.user as any)?.role || 'student';

    if (!subTopicTitle || !text) return res.status(400).json({ message: 'subTopicTitle and text are required' });

    const newComment = {
      id: 'cmt_' + Math.random().toString(36).substr(2, 9),
      userName,
      userRole,
      text,
      timestampSeconds: timestampSeconds ? Number(timestampSeconds) : undefined,
      upvotes: 0,
      isPinned: false,
      isBestAnswer: false,
      createdAt: new Date(),
      replies: []
    };

    if (useMock()) {
      const course = mockCourses.find(c => c.slug === slug);
      if (course) {
        for (const topic of course.topics || []) {
          const sub = topic.subTopics?.find((s: any) => s.title === subTopicTitle);
          if (sub) {
            if (!sub.comments) sub.comments = [];
            sub.comments.push(newComment);
            break;
          }
        }
      }
      return res.json({ message: 'Comment added (Simulation)', comment: newComment, course });
    }

    const [course] = await db.select().from(courses).where(eq(courses.slug, slug));
    if (!course) return res.status(404).json({ message: 'Course not found' });

    let foundSub = false;
    for (const topic of course.topics) {
      const sub = topic.subTopics.find(s => s.title === subTopicTitle);
      if (sub) {
        if (!sub.comments) sub.comments = [];
        sub.comments.push(newComment as any);
        foundSub = true;
        break;
      }
    }
    if (foundSub) {
      await save(courses, course);
    }
    res.json({ message: 'Comment added successfully', comment: newComment, course });
  } catch (error: any) {
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
});

app.post('/api/courses/:slug/subtopics/comment/:commentId/upvote', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { slug, commentId } = req.params;
    if (useMock()) {
      const course = mockCourses.find(c => c.slug === slug);
      if (course) {
        for (const topic of course.topics || []) {
          for (const sub of topic.subTopics || []) {
            const comment = sub.comments?.find((c: any) => c.id === commentId);
            if (comment) {
              comment.upvotes = (comment.upvotes || 0) + 1;
              return res.json({ message: 'Upvoted (Simulation)', upvotes: comment.upvotes });
            }
          }
        }
      }
      return res.json({ message: 'Upvoted (Simulation)', upvotes: 1 });
    }

    const [course] = await db.select().from(courses).where(eq(courses.slug, slug));
    if (!course) return res.status(404).json({ message: 'Course not found' });

    for (const topic of course.topics) {
      for (const sub of topic.subTopics) {
        const comment = (sub.comments as any[])?.find((c: any) => c.id?.toString() === commentId || c.id === commentId);
        if (comment) {
          comment.upvotes = (comment.upvotes || 0) + 1;
          await save(courses, course);
          return res.json({ message: 'Upvoted successfully', upvotes: comment.upvotes });
        }
      }
    }
    res.status(404).json({ message: 'Comment not found' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error upvoting comment', error: error.message });
  }
});

// --- COURSE-WIDE Q&A & VERSIONING ENDPOINTS ---
app.post('/api/courses/:slug/qna', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { slug } = req.params;
    const { question } = req.body;
    const studentName = (req.user as any)?.name || 'Student';

    if (!question) return res.status(400).json({ message: 'Question is required' });

    const newQna = {
      id: 'qna_' + Math.random().toString(36).substr(2, 9),
      studentName,
      question,
      isAnswered: false,
      upvotes: 0,
      createdAt: new Date()
    };

    if (useMock()) {
      const course = mockCourses.find(c => c.slug === slug);
      if (course) {
        if (!course.courseQnA) course.courseQnA = [];
        course.courseQnA.push(newQna);
      }
      return res.json({ message: 'Question posted (Simulation)', qna: newQna, course });
    }

    const [course] = await db.select().from(courses).where(eq(courses.slug, slug));
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (!course.courseQnA) course.courseQnA = [];
    course.courseQnA.push(newQna as any);
    await save(courses, course);

    res.json({ message: 'Question posted successfully', qna: newQna, course });
  } catch (error: any) {
    res.status(500).json({ message: 'Error posting question', error: error.message });
  }
});

app.post('/api/courses/:slug/qna/:qnaId/answer', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { slug, qnaId } = req.params;
    const { answer } = req.body;

    if (!answer) return res.status(400).json({ message: 'Answer is required' });

    if (useMock()) {
      const course = mockCourses.find(c => c.slug === slug);
      if (course && course.courseQnA) {
        const item = course.courseQnA.find((q: any) => q.id === qnaId);
        if (item) {
          item.answer = answer;
          item.isAnswered = true;
          return res.json({ message: 'Answer posted (Simulation)', course });
        }
      }
      return res.status(404).json({ message: 'Question not found' });
    }

    const [course] = await db.select().from(courses).where(eq(courses.slug, slug));
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const item = (course.courseQnA as any[])?.find((q: any) => q.id?.toString() === qnaId || q.id === qnaId);
    if (item) {
      item.answer = answer;
      item.isAnswered = true;
      await save(courses, course);
      return res.json({ message: 'Answer posted successfully', course });
    }
    res.status(404).json({ message: 'Question not found' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error answering question', error: error.message });
  }
});

// --- STUDENT NOTES (PRIVATE PER-USER COURSE NOTES) ---
app.get('/api/courses/:slug/notes', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { slug } = req.params;

    if (useMock()) {
      const notes = mockStudentNotes
        .filter(n => n.userId === req.user?.id && n.courseSlug === slug)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return res.json(notes);
    }

    const userId = asUuid(req.user?.id);
    if (!userId) return res.json([]);
    const notes = await db
      .select()
      .from(studentNotes)
      .where(and(eq(studentNotes.userId, userId), eq(studentNotes.courseSlug, slug)))
      .orderBy(desc(studentNotes.createdAt));
    res.json(notes);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching notes', error: error.message });
  }
});

app.post('/api/courses/:slug/notes', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { slug } = req.params;
    const { topicTitle = '', subTopicTitle = '', timestamp = '', text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Note text is required' });

    if (useMock()) {
      const course = mockCourses.find(c => c.slug === slug);
      if (!course) return res.status(404).json({ message: 'Course not found' });
      const note = {
        id: 'note_' + Math.random().toString(36).substr(2, 9),
        userId: req.user?.id,
        courseId: course.id,
        courseSlug: slug,
        topicTitle,
        subTopicTitle,
        timestamp,
        text: text.trim(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockStudentNotes.push(note);
      return res.status(201).json({ message: 'Note saved (Simulation)', note });
    }

    const [course] = await db.select({ id: courses.id, slug: courses.slug }).from(courses).where(eq(courses.slug, slug));
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const [note] = await db.insert(studentNotes).values({
      userId: asUuid(req.user?.id)!,
      courseId: course.id,
      courseSlug: slug,
      topicTitle,
      subTopicTitle,
      timestamp,
      text: text.trim()
    }).returning();
    res.status(201).json({ message: 'Note saved', note });
  } catch (error: any) {
    res.status(500).json({ message: 'Error saving note', error: error.message });
  }
});

app.delete('/api/courses/:slug/notes/:noteId', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { slug, noteId } = req.params;

    if (useMock()) {
      const before = mockStudentNotes.length;
      mockStudentNotes = mockStudentNotes.filter(n => !(n.id === noteId && n.userId === req.user?.id && n.courseSlug === slug));
      if (mockStudentNotes.length === before) return res.status(404).json({ message: 'Note not found' });
      return res.json({ message: 'Note deleted (Simulation)' });
    }

    const noteUuid = asUuid(noteId);
    const ownerId = asUuid(req.user?.id);
    // The userId and courseSlug predicates are the authorisation check: a note
    // is only deletable by its own author, within the course it belongs to.
    const [deleted] = noteUuid && ownerId
      ? await db
          .delete(studentNotes)
          .where(and(
            eq(studentNotes.id, noteUuid),
            eq(studentNotes.userId, ownerId),
            eq(studentNotes.courseSlug, slug)
          ))
          .returning()
      : [];
    if (!deleted) return res.status(404).json({ message: 'Note not found' });
    res.json({ message: 'Note deleted' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting note', error: error.message });
  }
});
// --- MAGIC-LINK HELPERS (shared by invite and forgot-password) ---
// Only the SHA-256 of the token is stored, so the raw value exists solely in the
// recipient's inbox and a leaked users table cannot be replayed. Lookups hash the
// incoming token and compare, which is still one indexed equality check.
const findByMagicToken = async (token: string) => {
  if (useMock()) {
    const hash = hashToken(token);
    const found = mockUsers.find(u => u.magicToken === hash);
    if (!found || !found.magicTokenExpires || new Date() > new Date(found.magicTokenExpires)) return undefined;
    return found;
  }
  const [found] = await db.select().from(users)
    .where(and(eq(users.magicToken, hashToken(token)), gt(users.magicTokenExpires, new Date())));
  return found;
};

// --- ADMIN INVITE USER WITH SECURE MAGIC TOKEN ---
app.post('/api/admin/invite', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, role } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ message: 'Name, email, and role are required' });
    }
    if (!ROLES.includes(role)) {
      return res.status(400).json({ message: `Role must be one of: ${ROLES.join(', ')}` });
    }

    const { token, tokenHash, expires } = issueToken();
    const inviteUrl = resetPasswordUrl(readMailerConfig(), token);

    if (useMock()) {
      const existing = mockUsers.find(u => u.email === email);
      if (existing) return res.status(400).json({ message: 'User already registered' });

      mockUsers.push({
        id: 'mock_inv_' + Math.random().toString(36).substr(2, 9),
        name,
        email,
        passwordHash: 'INVITED_STUB',
        role,
        enrolledCourses: [],
        completedQuizzes: [],
        certificates: [],
        magicToken: tokenHash,
        magicTokenExpires: expires
      });
    } else {
      const [userExists] = await db.select().from(users).where(eq(users.email, email));
      if (userExists) return res.status(400).json({ message: 'User already exists' });

      await db.insert(users).values({
        name,
        email,
        passwordHash: 'INVITED_STUB',
        role,
        magicToken: tokenHash,
        magicTokenExpires: expires
      });
    }

    const emailed = await sendMail(email, inviteTemplate(name, inviteUrl), inviteUrl);

    // The link is only handed back when there is no mail server to deliver it —
    // otherwise an invite response would carry a working credential for another
    // account, and the admin has no reason to see it.
    res.status(201).json({
      message: emailed
        ? 'User invited successfully. An activation email has been sent.'
        : 'User invited successfully. SMTP is not configured, so the activation link is below and in the server log.',
      ...(emailed ? {} : { resetLink: inviteUrl })
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating user invitation', error: error.message });
  }
});

// --- FORGOT PASSWORD (self-service) ---
app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const cleanEmail = String(email).trim().toLowerCase();
    // Same response whether or not the address exists. Anything else turns this
    // endpoint into an account-enumeration oracle.
    const accepted = {
      message: 'If an account exists for that address, a password reset link has been sent.'
    };

    const user = useMock()
      ? mockUsers.find(u => String(u.email).trim().toLowerCase() === cleanEmail)
      : (await db.select().from(users).where(eq(users.email, cleanEmail)))[0];

    if (!user) return res.json(accepted);

    const { token, tokenHash, expires } = issueToken();
    const url = resetPasswordUrl(readMailerConfig(), token);

    if (useMock()) {
      user.magicToken = tokenHash;
      user.magicTokenExpires = expires;
    } else {
      await db
        .update(users)
        .set({ magicToken: tokenHash, magicTokenExpires: expires, updatedAt: new Date() })
        .where(eq(users.id, user.id));
    }

    await sendMail(user.email, resetTemplate(user.name, url), url);
    res.json(accepted);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error requesting password reset', error: error.message });
  }
});

// --- VERIFY INVITE MAGIC TOKEN ---
app.post('/api/auth/verify-magic-token', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Verification token is required' });

    const foundUser = await findByMagicToken(String(token));
    if (!foundUser) return res.status(400).json({ message: 'Invalid or expired magic token link' });

    res.json({ success: true, email: foundUser.email, name: foundUser.name });
  } catch (error: any) {
    res.status(500).json({ message: 'Server verification error', error: error.message });
  }
});

// --- RESET PASSWORD VIA MAGIC LINK ---
app.post('/api/auth/reset-password-magic', async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Token and new password are required' });

    const passwordError = validatePassword(password);
    if (passwordError) return res.status(400).json({ message: passwordError });

    // Validate the token before spending ~100ms hashing a password for a request
    // that is about to be rejected.
    const foundUser = await findByMagicToken(String(token));
    if (!foundUser) return res.status(400).json({ message: 'Invalid or expired magic token link' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    foundUser.passwordHash = passwordHash;
    // Single-use: clearing the token stops the same link resetting the password
    // again, and stops a forwarded email working twice.
    foundUser.magicToken = null;
    foundUser.magicTokenExpires = null;
    if (!useMock()) await save(users, foundUser);

    res.json({ message: 'Password configured successfully. Profile active.' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server password reset error', error: error.message });
  }
});

// ============ LEARNING PATHS MODULE ============

// Resolve a path's course entries into { entry, course, progress }, sorted by order.
// progress is looked up from the given user (may be null for anonymous callers).
async function resolvePathCourses(path: any, user: any) {
  const sorted = [...(path.courses || [])].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
  const resolved: any[] = [];
  for (const entry of sorted) {
    let course: any;
    if (useMock()) {
      course = mockCourses.find(c => c.id === String(entry.courseId));
    } else {
      course = await byId(courses, entry.courseId);
    }
    if (!course) continue;
    const progress = user?.courseProgress?.find((p: any) => String(p.courseId) === String(course.id));
    resolved.push({ entry, course, progress });
  }
  return resolved;
}

// List learning paths (public). ?adminView=true returns drafts too.
app.get('/api/learning-paths', async (req: Request, res: Response) => {
  try {
    if (useMock()) {
      const list = req.query.adminView === 'true' ? mockLearningPaths : mockLearningPaths.filter(p => p.isActive);
      return res.json(list);
    }
    const paths = await db.select().from(learningPaths).where(req.query.adminView === 'true' ? undefined : eq(learningPaths.isActive, true));
    res.json(paths);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error fetching learning paths', error: error.message });
  }
});

// Single learning path by slug, with resolved course summaries (public).
app.get('/api/learning-paths/:slug', async (req: Request, res: Response) => {
  try {
    let path: any;
    if (useMock()) path = mockLearningPaths.find(p => p.slug === req.params.slug);
    else [path] = await db.select().from(learningPaths).where(eq(learningPaths.slug, req.params.slug));
    if (!path) return res.status(404).json({ message: 'Learning path not found' });

    const resolved = await resolvePathCourses(path, null);
    const courseSummaries = resolved.map(({ entry, course }: any) => ({
      id: String(course.id),
      title: course.title,
      slug: course.slug,
      category: course.category,
      difficulty: course.difficulty,
      durationWeeks: course.durationWeeks,
      order: entry.order,
      required: entry.required
    }));

    const base = path.toObject ? path.toObject() : path;
    res.json({ ...base, courseSummaries });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error fetching learning path', error: error.message });
  }
});

// Enroll in a learning path -> also auto-enrolls into each member course.
app.post('/api/learning-paths/:id/enroll', protect, async (req: AuthRequest, res: Response) => {
  try {
    let path: any;
    if (useMock()) path = mockLearningPaths.find(p => p.id === req.params.id);
    else path = await byId(learningPaths, req.params.id);
    if (!path) return res.status(404).json({ message: 'Learning path not found' });

    if (useMock()) {
      const user = mockUsers.find(u => u.id === req.user?.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      if (!user.enrolledPaths) user.enrolledPaths = [];
      if (!user.enrolledPaths.includes(path.id)) user.enrolledPaths.push(path.id);
      for (const entry of path.courses || []) {
        const cid = String(entry.courseId);
        if (!user.enrolledCourses.includes(cid)) {
          user.enrolledCourses.push(cid);
          const course = mockCourses.find(c => c.id === cid);
          if (course) course.studentsCount += 1;
        }
      }
      return res.json({ message: 'Successfully enrolled in learning path', enrolledPaths: user.enrolledPaths, enrolledCourses: user.enrolledCourses });
    }

    const user = await byId(users, req.user?.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.enrolledPaths) user.enrolledPaths = [] as any;

    const pathId = asUuid(req.params.id)!;
    if (!user.enrolledPaths.some((p: string) => p === pathId)) {
      user.enrolledPaths.push(pathId);
    }
    for (const entry of path.courses || []) {
      const cid: string = entry.courseId;
      if (!user.enrolledCourses.some((c: string) => c === cid)) {
        user.enrolledCourses.push(cid);
        const course = await byId(courses, cid);
        if (course) { course.studentsCount += 1; await save(courses, course); }
      }
    }
    await save(users, user);
    res.json({ message: 'Successfully enrolled in learning path', enrolledPaths: user.enrolledPaths, enrolledCourses: user.enrolledCourses });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error enrolling in learning path', error: error.message });
  }
});

// Derived progress for the current user across a path's courses.
app.get('/api/learning-paths/:id/progress', protect, async (req: AuthRequest, res: Response) => {
  try {
    let path: any;
    if (useMock()) path = mockLearningPaths.find(p => p.id === req.params.id);
    else path = await byId(learningPaths, req.params.id);
    if (!path) return res.status(404).json({ message: 'Learning path not found' });

    let user: any;
    if (useMock()) user = mockUsers.find(u => u.id === req.user?.id);
    else user = await byId(users, req.user?.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const resolved = await resolvePathCourses(path, user);
    const result = computePathProgressPure(resolved, !!path.sequential);

    const enrolled = useMock()
      ? (user.enrolledPaths || []).includes(path.id)
      : (user.enrolledPaths || []).some((p: any) => p.toString() === String(path.id));

    res.json({ ...result, enrolled });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error fetching path progress', error: error.message });
  }
});

// Claim the path completion certificate once all required courses are complete.
app.post('/api/learning-paths/:id/claim-certificate', protect, async (req: AuthRequest, res: Response) => {
  try {
    let path: any;
    if (useMock()) path = mockLearningPaths.find(p => p.id === req.params.id);
    else path = await byId(learningPaths, req.params.id);
    if (!path) return res.status(404).json({ message: 'Learning path not found' });
    if (!path.issueCertificate) return res.status(400).json({ message: 'This learning path does not issue a certificate' });

    let user: any;
    if (useMock()) user = mockUsers.find(u => u.id === req.user?.id);
    else user = await byId(users, req.user?.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const resolved = await resolvePathCourses(path, user);
    const { pathComplete } = computePathProgressPure(resolved, !!path.sequential);
    if (!pathComplete) {
      return res.status(400).json({ message: 'Complete all required courses in this path before claiming the certificate' });
    }

    const courseName = path.certificateTitle || path.title;
    const alreadyCertified = user.certificates.some((c: any) => c.courseName === courseName);
    if (alreadyCertified) {
      let cert: any;
      if (useMock()) cert = mockCertificates.find((c: any) => c.courseName === courseName && c.studentEmail === user.email);
      else [cert] = await db.select().from(certificates)
        .where(and(eq(certificates.courseName, courseName), eq(certificates.studentEmail, user.email)));
      return res.json({ message: 'Certificate already claimed', certificate: cert });
    }

    const certificateId = 'FSP-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    const hashSig = crypto.createHash('sha256').update(`${user.name}-${courseName}-${certificateId}`).digest('hex');
    const certData = {
      certificateId,
      studentName: user.name,
      studentEmail: user.email,
      courseName,
      issueDate: new Date(),
      cryptographicHash: hashSig,
      grade: 'Path Completed'
    };

    if (useMock()) {
      mockCertificates.push(certData);
      user.certificates.push({ certificateId, courseName, issueDate: new Date() });
      return res.json({ message: 'Path certificate generated successfully (Simulation)', certificate: certData });
    }

    const [newCert] = await db.insert(certificates).values(certData).returning();
    user.certificates.push({ certificateId, courseName, issueDate: new Date() });
    await save(users, user);
    res.json({ message: 'Path certificate generated successfully', certificate: newCert });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error generating path certificate', error: error.message });
  }
});

// --- ADMIN LEARNING PATH CRUD ---
app.post('/api/admin/learning-paths', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category, courses, sequential, issueCertificate, certificateTitle } = req.body;
    if (!title || !description || !category) {
      return res.status(400).json({ message: 'Title, description, and category are required' });
    }
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const data = {
      title,
      slug,
      description,
      category,
      courses: Array.isArray(courses) ? courses : [],
      sequential: !!sequential,
      issueCertificate: issueCertificate !== false,
      certificateTitle: certificateTitle || '',
      isActive: true
    };

    if (useMock()) {
      const newPath = { id: 'path_mock_' + Math.random().toString(36).substr(2, 9), ...data };
      mockLearningPaths.push(newPath);
      return res.status(201).json({ message: 'Learning path created (Simulation)', learningPath: newPath });
    }
    const [newPath] = await db.insert(learningPaths).values(data).returning();
    res.status(201).json({ message: 'Learning path created successfully', learningPath: newPath });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error creating learning path', error: error.message });
  }
});

app.put('/api/admin/learning-paths/:id', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category, courses, sequential, issueCertificate, certificateTitle, isActive } = req.body;

    if (useMock()) {
      const path = mockLearningPaths.find(p => p.id === req.params.id);
      if (!path) return res.status(404).json({ message: 'Learning path not found' });
      if (title) {
        path.title = title;
        path.slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
      if (description) path.description = description;
      if (category) path.category = category;
      if (Array.isArray(courses)) path.courses = courses;
      if (sequential !== undefined) path.sequential = !!sequential;
      if (issueCertificate !== undefined) path.issueCertificate = !!issueCertificate;
      if (certificateTitle !== undefined) path.certificateTitle = certificateTitle;
      if (isActive !== undefined) path.isActive = isActive;
      return res.json({ message: 'Learning path updated (Simulation)', learningPath: path });
    }

    const path = await byId(learningPaths, req.params.id);
    if (!path) return res.status(404).json({ message: 'Learning path not found' });
    if (title) {
      path.title = title;
      path.slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (description) path.description = description;
    if (category) path.category = category;
    if (Array.isArray(courses)) path.courses = courses;
    if (sequential !== undefined) path.sequential = !!sequential;
    if (issueCertificate !== undefined) path.issueCertificate = !!issueCertificate;
    if (certificateTitle !== undefined) path.certificateTitle = certificateTitle;
    if (isActive !== undefined) path.isActive = isActive;
    await save(learningPaths, path);
    res.json({ message: 'Learning path updated successfully', learningPath: path });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error updating learning path', error: error.message });
  }
});

app.delete('/api/admin/learning-paths/:id', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    if (useMock()) {
      mockLearningPaths = mockLearningPaths.filter(p => p.id !== req.params.id);
      return res.json({ message: 'Learning path deleted successfully (Simulation)' });
    }
    const deleted = await removeById(learningPaths, req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Learning path not found' });
    res.json({ message: 'Learning path deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error deleting learning path', error: error.message });
  }
});

// --- ANALYTICS ENDPOINTS ---
async function loadCoursesAndUsers(): Promise<[any[], any[]]> {
  if (useMock()) return [mockCourses, mockUsers];
  const courseRows = await db.select().from(courses);
  const userRows = await db
    .select({ id: users.id, enrolledCourses: users.enrolledCourses, courseProgress: users.courseProgress })
    .from(users);
  return [courseRows, userRows];
}

// Per-course metrics (instructors + admins).
app.get('/api/analytics/courses', protect, requirePermission('grading_panel', 'read'), async (req: AuthRequest, res: Response) => {
  try {
    const [courses, users] = await loadCoursesAndUsers();
    res.json(courses.map((c: any) => computeCourseAnalytics(c, users)));
  } catch (error: any) {
    res.status(500).json({ message: 'Server error computing course analytics', error: error.message });
  }
});

// Platform rollup (admin only).
app.get('/api/analytics/overview', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const [courses, users] = await loadCoursesAndUsers();
    const rows = courses.map((c: any) => computeCourseAnalytics(c, users));
    res.json({ overview: computeOverview(rows), courses: rows });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error computing analytics overview', error: error.message });
  }
});

// --- ANNOUNCEMENT ENDPOINTS ---
// Public list (active only) unless ?adminView=true. Always pinned-first, newest-first.
app.get('/api/announcements', async (req: Request, res: Response) => {
  try {
    const adminView = req.query.adminView === 'true';
    if (useMock()) {
      const list = adminView ? mockAnnouncements : mockAnnouncements.filter(a => a.isActive);
      return res.json(sortAnnouncements(list));
    }
    const list = await db.select().from(announcements).where(adminView ? undefined : eq(announcements.isActive, true));
    res.json(sortAnnouncements(list as any[]));
  } catch (error: any) {
    res.status(500).json({ message: 'Server error fetching announcements', error: error.message });
  }
});

app.post('/api/admin/announcements', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { title, body, level, pinned } = req.body;
    if (!title || !body) return res.status(400).json({ message: 'Title and body are required' });
    const data = {
      title,
      body,
      authorName: (req.user as any)?.name || 'Administrator',
      level: level || 'info',
      pinned: !!pinned,
      isActive: true
    };
    if (useMock()) {
      const item = { id: 'ann_mock_' + Math.random().toString(36).substr(2, 9), ...data, createdAt: new Date() };
      mockAnnouncements.push(item);
      return res.status(201).json({ message: 'Announcement posted (Simulation)', announcement: item });
    }
    const [item] = await db.insert(announcements).values(data).returning();
    res.status(201).json({ message: 'Announcement posted successfully', announcement: item });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error creating announcement', error: error.message });
  }
});

app.put('/api/admin/announcements/:id', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { title, body, level, pinned, isActive } = req.body;
    if (useMock()) {
      const item = mockAnnouncements.find(a => a.id === req.params.id);
      if (!item) return res.status(404).json({ message: 'Announcement not found' });
      if (title !== undefined) item.title = title;
      if (body !== undefined) item.body = body;
      if (level !== undefined) item.level = level;
      if (pinned !== undefined) item.pinned = pinned;
      if (isActive !== undefined) item.isActive = isActive;
      return res.json({ message: 'Announcement updated (Simulation)', announcement: item });
    }
    const item = await byId(announcements, req.params.id);
    if (!item) return res.status(404).json({ message: 'Announcement not found' });
    if (title !== undefined) item.title = title;
    if (body !== undefined) item.body = body;
    if (level !== undefined) item.level = level;
    if (pinned !== undefined) item.pinned = pinned;
    if (isActive !== undefined) item.isActive = isActive;
    await save(announcements, item);
    res.json({ message: 'Announcement updated successfully', announcement: item });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error updating announcement', error: error.message });
  }
});

app.delete('/api/admin/announcements/:id', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    if (useMock()) {
      mockAnnouncements = mockAnnouncements.filter(a => a.id !== req.params.id);
      return res.json({ message: 'Announcement deleted (Simulation)' });
    }
    const deleted = await removeById(announcements, req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Announcement not found' });
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error deleting announcement', error: error.message });
  }
});

// --- TEAM MEMBERS ("Meet the Experts" on About) ---
// Public list is active-only, ordered; ?adminView=true returns all for the admin panel.
const sortTeam = (list: any[]) => [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

app.get('/api/team-members', async (req: Request, res: Response) => {
  try {
    const adminView = req.query.adminView === 'true';
    if (useMock()) {
      const list = adminView ? mockTeamMembers : mockTeamMembers.filter(m => m.isActive);
      return res.json(sortTeam(list));
    }
    const list = await db.select().from(teamMembers).where(adminView ? undefined : eq(teamMembers.isActive, true));
    res.json(sortTeam(list as any[]));
  } catch (error: any) {
    res.status(500).json({ message: 'Server error fetching team members', error: error.message });
  }
});

app.post('/api/admin/team-members', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { name, role, description, sortOrder } = req.body;
    if (!name || !role) return res.status(400).json({ message: 'Name and role are required' });
    const data = {
      name,
      role,
      description: description || '',
      sortOrder: Number(sortOrder) || 0,
      isActive: true
    };
    if (useMock()) {
      const item = { id: 'team_mock_' + Math.random().toString(36).substr(2, 9), ...data };
      mockTeamMembers.push(item);
      return res.status(201).json({ message: 'Team member added (Simulation)', member: item });
    }
    const [item] = await db.insert(teamMembers).values(data).returning();
    res.status(201).json({ message: 'Team member added successfully', member: item });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error creating team member', error: error.message });
  }
});

app.put('/api/admin/team-members/:id', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { name, role, description, sortOrder, isActive } = req.body;
    const apply = (m: any) => {
      if (name !== undefined) m.name = name;
      if (role !== undefined) m.role = role;
      if (description !== undefined) m.description = description;
      if (sortOrder !== undefined) m.sortOrder = Number(sortOrder);
      if (isActive !== undefined) m.isActive = isActive;
    };
    if (useMock()) {
      const item = mockTeamMembers.find(m => m.id === req.params.id);
      if (!item) return res.status(404).json({ message: 'Team member not found' });
      apply(item);
      return res.json({ message: 'Team member updated (Simulation)', member: item });
    }
    const item = await byId(teamMembers, req.params.id);
    if (!item) return res.status(404).json({ message: 'Team member not found' });
    apply(item);
    await save(teamMembers, item);
    res.json({ message: 'Team member updated successfully', member: item });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error updating team member', error: error.message });
  }
});

app.delete('/api/admin/team-members/:id', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    if (useMock()) {
      mockTeamMembers = mockTeamMembers.filter(m => m.id !== req.params.id);
      return res.json({ message: 'Team member deleted (Simulation)' });
    }
    const deleted = await removeById(teamMembers, req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Team member not found' });
    res.json({ message: 'Team member deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error deleting team member', error: error.message });
  }
});

// --- IN-APP NOTIFICATIONS ---
app.get('/api/notifications', protect, async (req: AuthRequest, res: Response) => {
  try {
    if (useMock()) {
      const items = mockNotifications.filter(n => n.userId === req.user?.id);
      return res.json(sortNotifications(items));
    }

    const userId = asUuid(req.user?.id);
    const items = userId
      ? await db.select().from(notifications).where(eq(notifications.userId, userId))
      : [];
    res.json(sortNotifications(items as any[]));
  } catch (error: any) {
    res.status(500).json({ message: 'Server error fetching notifications', error: error.message });
  }
});

app.patch('/api/notifications/:id/read', protect, async (req: AuthRequest, res: Response) => {
  try {
    if (useMock()) {
      const item = mockNotifications.find(n => n.id === req.params.id && n.userId === req.user?.id);
      if (!item) return res.status(404).json({ message: 'Notification not found' });
      item.read = true;
      item.updatedAt = new Date();
      return res.json({ message: 'Notification marked read (Simulation)', notification: item });
    }

    const notifId = asUuid(req.params.id);
    const ownerId = asUuid(req.user?.id);
    const [item] = notifId && ownerId
      ? await db
          .update(notifications)
          .set({ read: true, updatedAt: new Date() })
          .where(and(eq(notifications.id, notifId), eq(notifications.userId, ownerId)))
          .returning()
      : [];
    if (!item) return res.status(404).json({ message: 'Notification not found' });
    res.json({ message: 'Notification marked read', notification: item });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error updating notification', error: error.message });
  }
});

app.post('/api/notifications/read-all', protect, async (req: AuthRequest, res: Response) => {
  try {
    if (useMock()) {
      let count = 0;
      mockNotifications.forEach(n => {
        if (n.userId === req.user?.id && !n.read) {
          n.read = true;
          n.updatedAt = new Date();
          count++;
        }
      });
      return res.json({ message: 'Notifications marked read (Simulation)', count });
    }

    const ownerId = asUuid(req.user?.id);
    const updated = ownerId
      ? await db
          .update(notifications)
          .set({ read: true, updatedAt: new Date() })
          .where(and(eq(notifications.userId, ownerId), eq(notifications.read, false)))
          .returning({ id: notifications.id })
      : [];
    res.json({ message: 'Notifications marked read', count: updated.length });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error marking notifications read', error: error.message });
  }
});

app.delete('/api/notifications/:id', protect, async (req: AuthRequest, res: Response) => {
  try {
    if (useMock()) {
      const before = mockNotifications.length;
      mockNotifications = mockNotifications.filter(n => !(n.id === req.params.id && n.userId === req.user?.id));
      if (mockNotifications.length === before) return res.status(404).json({ message: 'Notification not found' });
      return res.json({ message: 'Notification deleted (Simulation)' });
    }

    const notifId = asUuid(req.params.id);
    const ownerId = asUuid(req.user?.id);
    const [item] = notifId && ownerId
      ? await db
          .delete(notifications)
          .where(and(eq(notifications.id, notifId), eq(notifications.userId, ownerId)))
          .returning()
      : [];
    if (!item) return res.status(404).json({ message: 'Notification not found' });
    res.json({ message: 'Notification deleted' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error deleting notification', error: error.message });
  }
});

app.post('/api/admin/notifications', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { title, body, type = 'info', actionUrl = '', target = 'all', role = 'student', userId = '' } = req.body;
    if (!title || !body) return res.status(400).json({ message: 'Title and body are required' });

    const pickUsers = (users: any[]) => {
      if (target === 'user') return users.filter(u => String(u.id) === String(userId));
      if (target === 'role') return users.filter(u => u.role === role);
      return users;
    };

    if (useMock()) {
      const recipients = pickUsers(mockUsers);
      if (recipients.length === 0) return res.status(404).json({ message: 'No recipients matched this target' });
      const created = recipients.map(u => ({
        id: 'notif_' + Math.random().toString(36).substr(2, 9),
        userId: String(u.id),
        title,
        body,
        type,
        actionUrl,
        read: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      mockNotifications.push(...created);
      return res.status(201).json({ message: 'Notification sent (Simulation)', count: created.length });
    }

    const rows = await db.select({ id: users.id, role: users.role }).from(users);
    const recipients = pickUsers(rows as any[]);
    if (recipients.length === 0) return res.status(404).json({ message: 'No recipients matched this target' });
    const payload = recipients.map((u: any) => ({
      userId: String(u.id),
      title,
      body,
      type,
      actionUrl,
      read: false
    }));
    await db.insert(notifications).values(payload);
    res.status(201).json({ message: 'Notification sent successfully', count: payload.length });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error sending notification', error: error.message });
  }
});

// --- ERROR HANDLING MIDDLEWARE ---
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong on the server', error: err.message });
});

const startServer = async () => {
  try {
    await connectDB();

    // Sync database course thumbnails
    try {
      await db.update(courses)
        .set({ thumbnailUrl: '/uploads/intro_forensic.png' })
        .where(eq(courses.slug, 'introduction-to-forensic-science'));
      await db.update(courses)
        .set({ thumbnailUrl: '/uploads/forensic_biometrics.png' })
        .where(eq(courses.slug, 'forensic-biometrics-micro-certification'));
      await db.update(courses)
        .set({ thumbnailUrl: '/uploads/crime_scene_inv.png' })
        .where(eq(courses.slug, 'applied-forensic-science-crime-scene-investigation-police'));
      await db.update(courses)
        .set({ thumbnailUrl: '/uploads/cyber_forensics.png' })
        .where(eq(courses.slug, 'cyber-forensics-incident-response'));
      await db.update(courses)
        .set({ thumbnailUrl: '/uploads/scene_recon.png' })
        .where(eq(courses.slug, 'crime-scene-management-reconstruction'));
      console.log('[INFO] Database course thumbnails synced successfully!');
    } catch (dbErr) {
      console.warn('[WARNING] Failed to sync database course thumbnails:', dbErr);
    }

    const server = app.listen(PORT, () => {
      console.log(`ForenSecure API Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n[ERROR] Port ${PORT} is already in use by an existing process.`);
        console.error(`Run this command in PowerShell to free port ${PORT}:\n  Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force\n`);
      }
    });
  } catch (error) {
    console.error('\n[ERROR] Postgres connection failed. The API requires persistent database storage.');
    console.error(error);
    process.exitCode = 1;
  }
};

void startServer();
