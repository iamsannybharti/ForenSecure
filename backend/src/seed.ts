import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { sql } from 'drizzle-orm';
import { db, pool, connectDB, courses, quizzes, research, users, seminars, blogs, announcements, learningPaths, dropdownOptions, teamMembers, accessMatrix } from './db/index';
import { demoPrograms, demoLiveSessions } from './demoPrograms';
import { DEFAULT_MATRIX } from './permissions';

dotenv.config();

const coursesData = [
  {
    title: 'Introduction to Forensic Science',
    subTitle: 'Professional Foundation Micro Certification',
    slug: 'introduction-to-forensic-science',
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
    isActive: true
  },
  {
    title: 'Certified Micro Certificate in Forensic Biometrics',
    subTitle: 'Professional Certification Program',
    slug: 'forensic-biometrics-micro-certification',
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
    isActive: true
  },
  {
    title: 'Certificate Programme in Applied Forensic Science & Crime Scene Investigation',
    subTitle: 'Professional Capacity Building Programme for Police Personnel',
    slug: 'applied-forensic-science-crime-scene-investigation-police',
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
    isActive: true
  },
  {
    title: 'Certified Cyber Forensics & Incident Response Specialist',
    slug: 'cyber-forensics-incident-response',
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
    title: 'Advanced Crime Scene Management & Reconstruction',
    slug: 'crime-scene-management-reconstruction',
    description: 'Learn physical evidence preservation, chain of custody procedures, bloodstain pattern analysis, and 3D digital crime scene modeling.',
    category: 'Physical Investigation',
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
    bannerSvgType: 'crimescene'
  },
  {
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
    bannerSvgType: 'fingerprint'
  },
  ...demoPrograms()
];

const quizzesData: any[] = [
  {
    title: 'Forensic Science Core Assessment Quiz',
    description: 'Test your fundamental understanding of forensic sciences, including Edmond Locard\'s exchange principle, chain of custody, and physical evidence recovery.',
    category: 'General Forensic',
    timeLimitMinutes: 10,
    questions: [
      {
        questionText: 'What is Edmond Locard\'s Exchange Principle?',
        options: [
          'Every contact leaves a trace.',
          'Fingerprints are unique to each individual.',
          'DNA deteriorates in high temperatures.',
          'Digital evidence is easily modified.'
        ],
        correctOptionIndex: 0,
        explanation: 'Edmond Locard stated that "Every contact leaves a trace," which forms the baseline philosophy of all trace evidence forensics.'
      },
      {
        questionText: 'Which section of the Indian Evidence Act deals with expert witness testimony?',
        options: [
          'Section 65B',
          'Section 45',
          'Section 32',
          'Section 9'
        ],
        correctOptionIndex: 1,
        explanation: 'Section 45 of the Indian Evidence Act, 1872, allows the court to seek opinions of experts in science, art, identification of handwriting, or finger impressions.'
      },
      {
        questionText: 'To verify digital evidence in an Indian court, which certificate is mandatory under the IT Act?',
        options: [
          'Section 65B Certificate',
          'Section 80A Certificate',
          'Aadhar Verification Certificate',
          'ISO 27001 Audit Certificate'
        ],
        correctOptionIndex: 0,
        explanation: 'Under Section 65B(4) of the Indian Information Technology Act, a signed certificate is mandatory to validate the integrity of electronic records in court.'
      },
      {
        questionText: 'In memory forensics, which volatility command is used to list active process network connections?',
        options: ['netscan', 'pslist', 'pstree', 'malfind'],
        correctOptionIndex: 0,
        explanation: 'The netscan command in Volatility extracts network connections and associated processes from memory dumps.'
      },
      {
        questionText: 'What does the abbreviation AFIS stand for in forensic identification?',
        options: ['Automated Fingerprint Identification System', 'Analysis of Forensic Investigation Systems', 'Advanced Forensic Imaging Software', 'Analytical Fingerprint Indexing Standard'],
        correctOptionIndex: 0,
        explanation: 'AFIS stands for Automated Fingerprint Identification System, used worldwide by police agencies to search fingerprint databases.'
      },
      {
        questionText: "Which poison causes a characteristic 'cherry-red' post-mortem staining of the skin and internal organs?",
        options: ['Carbon Monoxide', 'Cyanide', 'Arsenic', 'Mercury'],
        correctOptionIndex: 0,
        explanation: 'Carbon monoxide binds to hemoglobin to form carboxyhemoglobin, giving the skin and blood a bright cherry-red color.'
      },
      {
        questionText: 'Which type of chromatography is most widely considered the gold standard for separating and identifying drugs in forensic toxicology?',
        options: ['Gas Chromatography-Mass Spectrometry (GC-MS)', 'Paper Chromatography', 'Thin Layer Chromatography (TLC)', 'Column Chromatography'],
        correctOptionIndex: 0,
        explanation: 'GC-MS is the gold standard in forensic toxicology because it separates mixtures and identifies components with high specificity.'
      },
      {
        questionText: 'Which international database is used for matching ballistic fingerprints of firearms and cartridge casings?',
        options: ['IBIS (Integrated Ballistics Identification System)', 'CODIS', 'AFIS', 'NIBIN'],
        correctOptionIndex: 0,
        explanation: 'IBIS captures and matches digital images of bullets and cartridge casings.'
      },
      {
        questionText: 'In digital forensics, what is the process of recovering deleted files based on their file signatures (headers/footers) called?',
        options: ['File Carving', 'Data Scraping', 'Registry Auditing', 'Network Sniffing'],
        correctOptionIndex: 0,
        explanation: 'File carving scans raw unallocated disk space for known file header and footer bytes.'
      },
      {
        questionText: 'What type of device is used during digital forensic acquisition to prevent any modifications to the target storage media?',
        options: ['Hardware Write Blocker', 'Logic Analyzer', 'USB Hub', 'Network Firewall'],
        correctOptionIndex: 0,
        explanation: 'A hardware write blocker intercepts and blocks write commands sent to the evidence drive.'
      },
      {
        questionText: 'Which biometric trait is considered the most secure and resistant to falsification due to its protected internal location and high complexity?',
        options: ['Iris Pattern', 'Fingerprint', 'Voice Pitch', 'Facial Geometry'],
        correctOptionIndex: 0,
        explanation: 'Iris patterns are stable, unique, and protected by the cornea, making them difficult to spoof.'
      },
      {
        questionText: 'What is the name for the post-mortem cooling of the body to ambient temperature?',
        options: ['Algor Mortis', 'Rigor Mortis', 'Livor Mortis', 'Pallor Mortis'],
        correctOptionIndex: 0,
        explanation: 'Algor mortis is the reduction in body temperature following death.'
      },
      {
        questionText: 'Which chemical reagent is commonly sprayed at a crime scene to detect trace amounts of blood by emitting blue luminescence?',
        options: ['Luminol', 'Ninhydrin', 'Phenolphthalein', 'Iodine Crystals'],
        correctOptionIndex: 0,
        explanation: 'Luminol reacts with iron in hemoglobin to reveal hidden blood through blue chemiluminescence.'
      },
      {
        questionText: 'Which digital forensic tool is widely used for extracting data from locked mobile devices?',
        options: ['Cellebrite UFED', 'Wireshark', 'Nmap', 'Burp Suite'],
        correctOptionIndex: 0,
        explanation: 'Cellebrite UFED is commonly used by law enforcement for mobile device data extraction.'
      },
      {
        questionText: 'What type of cyber attack involves pretending to be a trustworthy entity to steal credentials or sensitive data?',
        options: ['Phishing', 'DDoS', 'SQL Injection', 'Buffer Overflow'],
        correctOptionIndex: 0,
        explanation: 'Phishing impersonates trusted entities to trick users into revealing credentials.'
      },
      {
        questionText: 'In forensic toxicology, what is the primary organ or tissue analyzed to detect historical drug ingestion over several weeks or months?',
        options: ['Hair Follicles', 'Blood Serum', 'Saliva', 'Stomach Contents'],
        correctOptionIndex: 0,
        explanation: 'Hair records drug and metabolite exposure over months as it grows.'
      },
      {
        questionText: 'What is the term for the stiffening of muscles that occurs a few hours after death?',
        options: ['Rigor Mortis', 'Algor Mortis', 'Livor Mortis', 'Cadaveric Spasm'],
        correctOptionIndex: 0,
        explanation: 'Rigor mortis is post-mortem muscle stiffening caused by ATP depletion.'
      },
      {
        questionText: 'Which standard forensic utility is used to generate SHA-256 or MD5 hashes of raw disk images to verify integrity?',
        options: ['FTK Imager', 'Autopsy', 'Volatility', 'John the Ripper'],
        correctOptionIndex: 0,
        explanation: 'FTK Imager computes hashes of the source drive and the forensic image to verify integrity.'
      },
      {
        questionText: 'Which poisonous substance binds to cytochrome c oxidase, inhibiting cellular respiration and causing rapid death?',
        options: ['Cyanide', 'Arsenic', 'Thallium', 'Lead'],
        correctOptionIndex: 0,
        explanation: 'Cyanide inhibits cytochrome c oxidase and stops cellular respiration.'
      },
      {
        questionText: 'In bloodstain pattern analysis, what is the angle of impact of a blood drop that forms a perfectly circular stain?',
        options: ['90 degrees', '45 degrees', '10 degrees', '0 degrees'],
        correctOptionIndex: 0,
        explanation: 'A drop striking a flat surface at 90 degrees forms a circular stain.'
      }
    ]
  },
  {
    title: 'Digital Forensics & Incident Response Challenge',
    description: 'Evaluate your ability to handle cybercrime scene investigation, identify malicious processes, and perform live memory analysis.',
    category: 'Digital Forensics',
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
        explanation: 'The `netscan` command in Volatility extracts network artifacts, active TCP connections, and listening UDP sockets from memory dumps.'
      },
      {
        questionText: 'What is the standard header (Magic Bytes) of a PNG image file?',
        options: [
          'FF D8 FF E0',
          '89 50 4E 47',
          '4D 5A',
          '25 50 44 46'
        ],
        correctOptionIndex: 1,
        explanation: '89 50 4E 47 represents the hex signature (\x89PNG) of PNG files. FF D8 is JPEG, 4D 5A (MZ) is Windows Executable, and 25 50 44 46 (%PDF) is PDF.'
      },
      {
        questionText: 'When gathering digital evidence, which is the correct order of volatility (highest to lowest)?',
        options: [
          'Hard drive, CPU Cache, RAM, Network state',
          'CPU Cache & Registers, RAM, Network Connections, Hard drive',
          'Hard drive, Network Connections, RAM, CPU Cache',
          'RAM, Hard drive, CPU Cache, Backup tapes'
        ],
        correctOptionIndex: 1,
        explanation: 'RFC 3227 guidelines dictate collecting the most volatile information first: CPU Registers/Cache -> Routing table/RAM -> Network connections -> Disk -> Backups.'
      }
    ]
  },
  {
    title: 'Mixed-Format Forensic Proficiency Exam',
    description: 'Demonstrates every supported question format: single-choice, multi-select, true/false, numeric, and short-answer. Negative marking is enabled.',
    category: 'General Forensic',
    timeLimitMinutes: 12,
    passingPercentage: 60,
    negativeMarking: true,
    negativeMarkFraction: 0.25,
    attemptsAllowed: 3,
    questions: [
      {
        questionText: 'Which principle states that "every contact leaves a trace"?',
        questionType: 'mcq',
        options: ["Locard's Exchange Principle", 'Daubert Standard', 'Frye Standard', "Kirk's Principle"],
        correctOptionIndex: 0,
        points: 1,
        explanation: 'Edmond Locard formulated the exchange principle.'
      },
      {
        questionText: 'Select ALL that are valid latent fingerprint development techniques.',
        questionType: 'multi',
        options: ['Ninhydrin', 'Cyanoacrylate fuming', 'Luminol blood search', 'Magnetic powder'],
        correctOptionIndex: 0,
        correctOptionIndices: [0, 1, 3],
        points: 2,
        explanation: 'Luminol is for blood; the other three develop latent prints.'
      },
      {
        questionText: 'A Section 65B certificate is required to admit electronic evidence in an Indian court.',
        questionType: 'tf',
        options: ['True', 'False'],
        correctOptionIndex: 0,
        points: 1,
        explanation: 'Section 65B(4) mandates the certificate.'
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
    ]
  }
];

const researchPapersData = [
  {
    title: 'Integrating Machine Learning in Automated Latent Fingerprint Matching: A Comparative Study',
    slug: 'ml-latent-fingerprint-matching',
    abstract: 'Latent fingerprints found at crime scenes are often distorted, smudged, or overlapping. This paper reviews current deep learning models (specifically CNNs and Vision Transformers) in automating minutiae extraction, comparing performance metrics against standard manual minutiae marking under the CFSL and state police departments in India.',
    content: `
## 1. Introduction
Latent fingerprints play a pivotal role in criminal investigations, acting as key physical link evidence connecting suspects to crime scenes. However, unlike direct ink prints, latent prints are often severely compromised by overlapping patterns, uneven substrate textures, and chemical deterioration. Historically, fingerprint examiners manually identify minutiae points—bifurcations, ridge endings, and dots—an activity requiring years of training and prone to subjective human error.

## 2. Methodology
In this study, we benchmark three deep learning architectures:
- ResNet-50 customized for localized minutiae density classification
- Vision Transformers (ViT) for global contextual ridge orientation mapping
- standard Minutiae-based minutiae extractors (MINDTCT) from NIST Biometric Image Software (NBIS)

We utilize a dataset of 5,000 synthetic and 1,200 real latent prints provided under research licensing.

## 3. Results & Discussion
Our findings demonstrate that customized Vision Transformers achieve a **94.2% True Acceptance Rate (TAR)** with a low **0.01% False Acceptance Rate (FAR)**, vastly outperforming NBIS on partial prints. However, computational latency remains high, demanding dedicated edge GPU modules for real-time operation in police field kits.

## 4. Section 45 Admissibility
Under Section 45 of the Indian Evidence Act, expert opinion backed by machine-extracted minutiae reports must show structural integrity validation. We outline a mathematical proof showing how cryptographic hash verification secures the chain of custodian processing for the digital reports.

## References
1. Edmond Locard, *Treatise on Criminalistics*, 1931.
2. Federal Bureau of Investigation, *The Science of Fingerprints*, GPO.
3. National Institute of Standards and Technology, *NBIS Software Documentation*, 2021.
    `,
    category: 'Biometrics',
    authors: ['Shri R. K. Sharma', 'Dr. Priya Srinivasan'],
    readTimeMinutes: 10,
    citation: 'Sharma, R. K., & Srinivasan, P. (2026). Integrating Machine Learning in Automated Latent Fingerprint Matching. Indian Journal of Forensic Sciences, Vol. 14, 45-56.',
    downloadsCount: 420,
    references: [
      'Edmond Locard, Treatise on Criminalistics, 1931.',
      'Federal Bureau of Investigation, The Science of Fingerprints.',
      'NIST Special Database 27a (Latent Fingerprints).'
    ]
  },
  {
    title: 'Framework for Memory Forensic Acquisition Under Section 65B of Indian Information Technology Act',
    slug: 'memory-forensics-65b-framework',
    abstract: 'Volatile memory stores active network connections, decryption keys, and malware payloads. Since RAM is wiped on system reboot, traditional write-blockers cannot capture it. This research details a forensically sound methodology for memory acquisition that satisfies the legal admissibility requirements under Section 65B of the IT Act.',
    content: `
## 1. The Legal Challenge of Volatility
Under Indian Law, specifically Section 65B of the Information Technology Act 2000, electronic records are admissible only when accompanied by a certificate confirming that the computer system which produced the electronic record was operating properly and that the data was not altered during storage.

## 2. Volatile RAM Acquisition Protocol
To capture RAM without altering it (a paradox, as executing an acquisition tool changes RAM itself), we propose:
- use of hardware-based DMA devices where possible
- execution of lightweight, pre-compiled static binaries (e.g., LiME for Linux, WinPmem for Windows) from write-protected external drives
- simultaneous hashing of output stream utilizing SHA-256

## 3. Legal Admissibility Checklist
We provide a standard operating procedure (SOP) sheet which should be filled out during acquisition:
1. Note system local time, UTC time, and physical device ID.
2. Record SHA-256 hash immediately upon completion of memory capture.
3. Log all processes triggered by the forensic investigator.
4. Have the independent panch (witnesses) sign the physical capture log.

This documentation serves as the evidentiary backup required to support the 65B affidavit in court.
    `,
    category: 'Digital Forensics',
    authors: ['Dr. Aravind Swaminathan', 'Adv. Rohan Sen'],
    readTimeMinutes: 12,
    citation: 'Swaminathan, A., & Sen, R. (2026). Memory Forensic Acquisition and Section 65B IT Act. Cyber Crime & Law Review India, Vol. 9, 102-118.',
    downloadsCount: 560,
    references: [
      'Supreme Court of India, Arjun Panditrao Khotkar v. Kailash Kushanrao Gorantyal (2020) 7 SCC 1.',
      'Carrier, B. (2005). File System Forensic Analysis. Addison-Wesley.',
      'ISO/IEC 27037:2012 Guidelines for identification, collection, acquisition and preservation of digital evidence.'
    ]
  }
];

const blogsData = [
  {
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
    approvalStatus: 'approved' as const,
    isActive: true
  }
];

const announcementsData = [
  {
    title: 'Platform Maintenance Window',
    body: 'Scheduled maintenance this Sunday 02:00–04:00 IST. Course players and uploads may be briefly unavailable.',
    authorName: 'ForenSecure Operations',
    level: 'warning' as const,
    pinned: true,
    isActive: true
  },
  {
    title: 'New Learning Path Released',
    body: 'The "Certified Forensic Investigator Track" is now live. Enroll from the Learning Paths page.',
    authorName: 'Academic Team',
    level: 'info' as const,
    pinned: false,
    isActive: true
  }
];

const teamMembersData: any[] = [];

const dropdownOptionsData = [
  { category: 'Course Categories', label: 'Digital Forensics', value: 'Digital Forensics', relatedTo: 'Cyber Defense' },
  { category: 'Course Categories', label: 'Physical Investigation', value: 'Physical Investigation', relatedTo: 'Criminology' },
  { category: 'Course Categories', label: 'Biometrics', value: 'Biometrics', relatedTo: 'Security' },
  { category: 'Course Categories', label: 'Cyber Law', value: 'Cyber Law', relatedTo: 'Legal' },
  { category: 'Difficulty Levels', label: 'Beginner', value: 'Beginner', relatedTo: 'Foundation' },
  { category: 'Difficulty Levels', label: 'Intermediate', value: 'Intermediate', relatedTo: 'Mid-Level' },
  { category: 'Difficulty Levels', label: 'Advanced', value: 'Advanced', relatedTo: 'Expert' }
];

// Landing-page sections rely on canonical columns; the seed authors above use a
// mix of legacy alias keys. Fold those aliases into the real columns so DB-mode
// renders every section exactly as mock mode does. Unknown keys drizzle ignores.
const normalizeCourse = (c: any) => ({
  ...c,
  learningObjectives: c.learningObjectives || c.whatYouWillLearn || c.learningOutcomes || c.programmeOutcomes || [],
  eligibility: c.eligibility || c.targetParticipants || c.whoShouldEnroll || c.whoShouldAttend || [],
  careerBenefits: c.careerBenefits || c.careerOpportunities || [],
  practicalLabs: c.virtualLabs || c.practicalTraining || c.capstoneProjectScenarios || []
});

/**
 * Seeding destroys data: it truncates users along with every content table. The
 * deploy pipeline runs this on every push, so by default it is a no-op once the
 * database has any account in it — otherwise each release would delete everyone
 * who had registered since the last one. `--force` (or SEED_FORCE=true) is the
 * deliberate "wipe and rebuild the demo data" path.
 */
const FORCE = process.argv.includes('--force') || process.env.SEED_FORCE === 'true';

const seedDatabase = async () => {
  try {
    try {
      // Also applies pending migrations — seeding a fresh database has to create
      // the tables before it can truncate and fill them.
      await connectDB();
    } catch (error) {
      console.error('Seed: Postgres is required and could not be reached.', error);
      process.exit(1);
    }

    if (!FORCE) {
      let count = 0;
      try {
        const res = await db.select({ count: sql<number>`count(*)::int` }).from(users);
        count = res[0]?.count || 0;
      } catch (_e) {
        count = 0;
      }
      if (count > 0) {
        console.log(`Seed: skipped — the database already holds ${count} user account(s).`);
        console.log('Seed: re-run with --force to wipe every table and rebuild the demo data.');
        await pool.end();
        return;
      }
      console.log('Seed: empty database detected, populating demo data.');
    }

    // Clear old data. Truncating together satisfies the foreign keys pointing at
    // courses and users in one statement; CASCADE also empties the dependent
    // tables (notes, notifications, certificates) that reference them.
    try {
      await db.execute(sql`
        truncate table ${users}, ${courses}, ${quizzes}, ${research}, ${seminars},
          ${blogs}, ${announcements}, ${learningPaths}, ${dropdownOptions}, ${teamMembers},
          ${accessMatrix} restart identity cascade
      `);
      console.log('Seed: Cleared old tables.');
    } catch (_e) {
      console.log('Seed: Fresh database detected, proceeding to insert records.');
    }

    // Create Courses (alias keys folded into real columns first)
    const courseRows = await db.insert(courses).values(coursesData.map(normalizeCourse) as any).returning();
    console.log(`Seed: Inserted ${courseRows.length} courses.`);

    // Match quizzes with courses
    const cyberCourse = courseRows.find(c => c.slug === 'cyber-forensics-incident-response');
    const fingerprintCourse = courseRows.find(c => c.slug === 'fingerprint-analysis-biometric-systems');

    if (cyberCourse) {
      quizzesData[1].courseId = cyberCourse.id;
    }
    if (fingerprintCourse) {
      quizzesData[0].courseId = fingerprintCourse.id;
    }

    // Create Quizzes
    const quizRows = await db.insert(quizzes).values(quizzesData).returning();
    console.log(`Seed: Inserted ${quizRows.length} quizzes.`);

    // Create Research
    const researchRows = await db.insert(research).values(researchPapersData).returning();
    console.log(`Seed: Inserted ${researchRows.length} research publications.`);

    // Create Seminars
    const seminarRows = await db.insert(seminars).values(demoLiveSessions() as any).returning();
    console.log(`Seed: Inserted ${seminarRows.length} live seminars.`);

    // Create demo users (Admin, Teacher, Student)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('ForenSecure2026!', salt);

    const [adminUser, teacherUser, studentUser] = await db.insert(users).values([
      {
        name: 'Admin Investigator',
        email: 'imailforensecure@gmail.com',
        passwordHash,
        role: 'admin' as const,
        enrolledCourses: courseRows.map(c => c.id),
        successfulPayments: []
      },
      {
        name: 'Teacher Faculty',
        email: 'teacher@forensecure.edu.in',
        passwordHash,
        role: 'teacher' as const,
        successfulPayments: []
      },
      {
        name: 'Student Candidate',
        email: 'student@forensecure.edu.in',
        passwordHash,
        role: 'student' as const,
        successfulPayments: []
      }
    ]).returning();

    console.log(`Seed: Created accounts for admin (${adminUser.email}), teacher (${teacherUser.email}), and student (${studentUser.email}) with password ForenSecure2026!`);

    // Blogs / announcements / dropdown options
    const blogRows = await db.insert(blogs).values(blogsData as any).returning();
    console.log(`Seed: Inserted ${blogRows.length} blogs.`);
    const annRows = await db.insert(announcements).values(announcementsData as any).returning();
    console.log(`Seed: Inserted ${annRows.length} announcements.`);
    const ddRows = await db.insert(dropdownOptions).values(dropdownOptionsData).returning();
    console.log(`Seed: Inserted ${ddRows.length} dropdown options.`);
    const matrixRows = await db.insert(accessMatrix).values(DEFAULT_MATRIX as any).returning();
    console.log(`Seed: Inserted ${matrixRows.length} access rules.`);
    const teamRows = await db.insert(teamMembers).values(teamMembersData).returning();
    console.log(`Seed: Inserted ${teamRows.length} team members.`);

    // Learning path — courses referenced by the freshly-generated UUIDs.
    const idBySlug = (slug: string) => courseRows.find(c => c.slug === slug)?.id;
    const trackCourses = [
      { courseId: idBySlug('fingerprint-analysis-biometric-systems'), order: 0, required: true },
      { courseId: idBySlug('crime-scene-management-reconstruction'), order: 1, required: true },
      { courseId: idBySlug('cyber-forensics-incident-response'), order: 2, required: true }
    ].filter(c => c.courseId);
    const pathRows = await db.insert(learningPaths).values([{
      title: 'Certified Forensic Investigator Track',
      slug: 'certified-forensic-investigator-track',
      description: 'A guided, sequential career path: begin with fingerprint fundamentals, progress through crime scene reconstruction, and finish with advanced cyber forensics. Complete all three required courses to earn the full track certificate.',
      category: 'Career Track',
      courses: trackCourses,
      sequential: true,
      issueCertificate: true,
      certificateTitle: 'Certified Forensic Investigator (Full Track)',
      isActive: true
    }] as any).returning();
    console.log(`Seed: Inserted ${pathRows.length} learning paths.`);

    await pool.end();
    console.log('Seed: Completed successfully and disconnected.');
  } catch (error) {
    console.error('Seed: Error seeding database:', error);
    process.exit(1);
  }
};

// Execute if run directly
seedDatabase();
