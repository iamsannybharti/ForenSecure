// Demo live courses, diplomas and scheduled classes shared by the seed script and the
// in-memory simulation dataset. Dates are relative to run time so the demo never expires:
// one course is always running, two are always upcoming, one is always finished.

const days = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

export function demoPrograms() {
  return [
    // Running right now -> "Live now" badge, and the homepage falls back to this
    // only when nothing is upcoming.
    {
      title: 'Live Cohort: Memory Forensics Intensive',
      slug: 'live-memory-forensics-intensive',
      description: 'Six weeks of instructor-led memory acquisition and Volatility analysis, with weekly live labs on real malware dumps.',
      category: 'Digital Forensics',
      instructorName: 'Dr. Aravind Swaminathan',
      instructorTitle: 'Former Scientist, Government Cyber Defense Cell',
      durationWeeks: 6,
      difficulty: 'Advanced',
      courseType: 'live',
      format: 'course',
      startDate: days(-10),
      endDate: days(25),
      priceINR: 18999,
      rating: 4.9,
      ratingCount: 64,
      studentsCount: 38,
      syllabus: ['Acquisition & imaging', 'Volatility plugin workflows', 'Rootkit and injection hunting', 'Reporting for court'],
      features: ['Weekly live labs', 'Instructor office hours', 'Recorded catch-up sessions'],
      bannerSvgType: 'cyber',
      isActive: true,
      targetPercentage: 60,
      topics: []
    },

    // Nearest upcoming -> leads the homepage section.
    {
      title: 'Live Cohort: Mobile Device Forensics',
      slug: 'live-mobile-device-forensics',
      description: 'Extract, decode and validate artefacts from iOS and Android handsets, from logical pulls to chip-off recovery.',
      category: 'Digital Forensics',
      instructorName: 'Prof. Meera Deshmukh',
      instructorTitle: 'Head of Criminology at NFSU Affiliate Center',
      durationWeeks: 8,
      difficulty: 'Intermediate',
      courseType: 'live',
      format: 'course',
      startDate: days(9),
      endDate: days(65),
      priceINR: 15499,
      rating: 4.8,
      ratingCount: 22,
      studentsCount: 12,
      syllabus: ['Seizure & isolation', 'Logical vs physical extraction', 'App artefact decoding', 'Validation and dual-tool testing'],
      features: ['Live weekly labs', 'Loan handset kit', 'Placement interview referral'],
      bannerSvgType: 'mobile',
      isActive: true,
      targetPercentage: 60,
      topics: []
    },

    // Later upcoming -> sorts after the nearer one.
    {
      title: 'Live Cohort: Courtroom Testimony Lab',
      slug: 'live-courtroom-testimony-lab',
      description: 'Mock cross-examination clinics covering Section 65B certificates, exhibit handling and expert opinion drafting.',
      category: 'Cyber Law',
      instructorName: 'Adv. Kavita Rao',
      instructorTitle: 'Senior Counsel, Cyber Appellate Practice',
      durationWeeks: 4,
      difficulty: 'Intermediate',
      courseType: 'live',
      format: 'course',
      startDate: days(31),
      endDate: days(60),
      priceINR: 8999,
      rating: 4.7,
      ratingCount: 15,
      studentsCount: 6,
      syllabus: ['Evidence admissibility', 'Drafting expert opinions', 'Cross-examination drills', 'Exhibit presentation'],
      features: ['Recorded mock testimony review', 'Advocate-led feedback'],
      bannerSvgType: 'law',
      isActive: true,
      targetPercentage: 60,
      topics: []
    },

    // Already finished -> "Completed" in the catalog, and never on the homepage.
    {
      title: 'Live Cohort: Ransomware Response (Spring Batch)',
      slug: 'live-ransomware-response-spring',
      description: 'Closed batch covering containment, negotiation posture and recovery forensics for ransomware incidents.',
      category: 'Digital Forensics',
      instructorName: 'Dr. Aravind Swaminathan',
      instructorTitle: 'Former Scientist, Government Cyber Defense Cell',
      durationWeeks: 5,
      difficulty: 'Advanced',
      courseType: 'live',
      format: 'course',
      startDate: days(-120),
      endDate: days(-30),
      priceINR: 16999,
      rating: 4.9,
      ratingCount: 41,
      studentsCount: 44,
      syllabus: ['Containment playbooks', 'Encryption artefact triage', 'Recovery validation'],
      features: ['Full session recordings', 'Incident report templates'],
      bannerSvgType: 'cyber',
      isActive: true,
      targetPercentage: 60,
      topics: []
    },

    // --- Professional diplomas ---
    // Upcoming intake -> Details button routes to the contact page.
    {
      title: 'Certified Digital Forensic Expert (CDFE)',
      slug: 'diploma-certified-digital-forensic-expert',
      description: 'Six-month professional diploma covering disk, memory, network and mobile forensics, ending in a supervised casework portfolio.',
      category: 'Digital Forensics',
      instructorName: 'Dr. Aravind Swaminathan',
      instructorTitle: 'Former Scientist, Government Cyber Defense Cell',
      durationWeeks: 26,
      difficulty: 'Advanced',
      courseType: 'live',
      format: 'diploma',
      startDate: days(21),
      endDate: days(203),
      priceINR: 249900,
      rating: 4.9,
      ratingCount: 88,
      studentsCount: 210,
      syllabus: ['Evidence handling & chain of custody', 'Disk and filesystem forensics', 'Memory and network analysis', 'Mobile forensics', 'Expert testimony & reporting'],
      features: ['Mentor support', 'Supervised casework portfolio', 'Placement interview pipeline'],
      bannerSvgType: 'fingerprint',
      isActive: true,
      targetPercentage: 70,
      topics: []
    },

    // Currently running diploma -> "Live now".
    {
      title: 'Advanced Malware Analysis (AMA)',
      slug: 'diploma-advanced-malware-analysis',
      description: 'Four-month diploma in static and dynamic malware analysis, unpacking, and behavioural reporting with one-on-one lab reviews.',
      category: 'Digital Forensics',
      instructorName: 'Marcus Thorne',
      instructorTitle: 'Principal Reverse Engineer',
      durationWeeks: 17,
      difficulty: 'Advanced',
      courseType: 'live',
      format: 'diploma',
      startDate: days(-14),
      endDate: days(105),
      priceINR: 189900,
      rating: 4.8,
      ratingCount: 52,
      studentsCount: 96,
      syllabus: ['Static triage & PE internals', 'Sandbox and dynamic analysis', 'Unpacking and anti-analysis', 'YARA authoring', 'Behavioural reporting'],
      features: ['1-on-1 lab reviews', 'Private malware corpus access', 'Mentor support'],
      bannerSvgType: 'cyber',
      isActive: true,
      targetPercentage: 70,
      topics: []
    }
  ];
}

export function demoLiveSessions() {
  return [
    {
      title: 'Mac OS Memory Forensics',
      description: 'Acquiring and parsing memory from Apple silicon devices, including SIP constraints and volatility profiles.',
      instructorName: 'Dr. Aravind Swaminathan',
      courseTitle: 'Live Cohort: Memory Forensics Intensive',
      date: days(3),
      durationMinutes: 150,
      link: 'https://meet.google.com/demo-mac-mem',
      maxParticipants: 80,
      registeredStudents: [],
      attendees: []
    },
    {
      title: 'Cloud Instance Imaging',
      description: 'Snapshotting and validating EC2 and Azure VM disks without breaking chain of custody.',
      instructorName: 'Prof. Meera Deshmukh',
      courseTitle: 'Live Cohort: Mobile Device Forensics',
      date: days(6),
      durationMinutes: 120,
      link: 'https://meet.google.com/demo-cloud-image',
      maxParticipants: 80,
      registeredStudents: [],
      attendees: []
    },
    {
      title: 'Dark Web Investigation',
      description: 'Tracing onion services, marketplace artefacts and attribution pitfalls for investigators.',
      instructorName: 'Marcus Thorne',
      courseTitle: 'Advanced Malware Analysis (AMA)',
      date: days(12),
      durationMinutes: 120,
      link: 'https://meet.google.com/demo-darkweb',
      maxParticipants: 60,
      registeredStudents: [],
      attendees: []
    }
  ];
}
