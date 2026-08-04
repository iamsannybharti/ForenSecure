import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import CourseBuilder4Panel from '../components/CourseBuilder4Panel';
import AdminNotificationsPanel from '../components/AdminNotificationsPanel';
import { 
  ShieldAlert, 
  BarChart, 
  BookOpen, 
  Zap, 
  FileText, 
  Users, 
  Plus, 
  Edit, 
  Trash, 
  Check, 
  X, 
  Mail, 
  CheckCircle2, 
  Clock,
  ArrowUp,
  ArrowDown,
  Layers,
  Move,
  Megaphone,
  Bell
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, token, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Active Panel Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'announcements' | 'notifications' | 'courses' | 'paths' | 'quizzes' | 'research' | 'users' | 'contacts' | 'team'>('overview');

  // Stats State
  const [stats, setStats] = useState<any>({ usersCount: 0, coursesCount: 0, quizzesCount: 0, researchCount: 0, contactsCount: 0 });

  // Entity Lists
  const [courses, setCourses] = useState<any[]>([]);
  const [learningPaths, setLearningPaths] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [research, setResearch] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [analyticsRows, setAnalyticsRows] = useState<any[]>([]);
  const [analyticsOverview, setAnalyticsOverview] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [annForm, setAnnForm] = useState({ id: '', title: '', body: '', level: 'info', pinned: false });

  const [teamList, setTeamList] = useState<any[]>([]);
  const emptyTeamForm = { id: '', name: '', role: '', description: '', sortOrder: 0 };
  const [teamForm, setTeamForm] = useState(emptyTeamForm);

  // Modals & Forms State
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const emptyCourseForm = {
    id: '', title: '', description: '', category: 'Digital Forensics', instructorName: '', instructorTitle: '',
    durationWeeks: 8, difficulty: 'Beginner', priceINR: 9999, syllabus: '', features: '', isActive: true,
    topics: [] as any[], format: 'course', courseType: 'recorded', startDate: '', endDate: '', thumbnailUrl: '',
    // Marketing/landing sections — list fields are newline strings, split to arrays on submit.
    subTitle: '', overview: '', level: '', highlights: '', eligibility: '', learningObjectives: '',
    learningResources: '', careerBenefits: '', practicalLabs: '', passingCriteria: '',
    assessmentStructure: [] as { name: string; weightage: string }[],
    schedule: { days: [] as number[], time: '18:00', meetLink: '', durationMinutes: 60 }
  };
  const [courseForm, setCourseForm] = useState(emptyCourseForm);

  const [isPathModalOpen, setIsPathModalOpen] = useState(false);
  const [pathForm, setPathForm] = useState({ id: '', title: '', description: '', category: 'Career Track', courses: [] as any[], sequential: true, issueCertificate: true, certificateTitle: '', isActive: true });

  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [quizForm, setQuizForm] = useState({ id: '', title: '', description: '', category: 'Digital Forensics', courseId: undefined as string | undefined, timeLimitMinutes: 15, questions: [] as any[], passingPercentage: 80, negativeMarking: false, negativeMarkFraction: 0.25, attemptsAllowed: 0, isActive: true });
  const [newQuestion, setNewQuestion] = useState({ questionText: '', options: ['', '', '', ''], correctOptionIndex: 0 });

  const [isResearchModalOpen, setIsResearchModalOpen] = useState(false);
  const [researchForm, setResearchForm] = useState({ id: '', title: '', abstract: '', content: '', category: 'Digital Forensics', authors: '', readTimeMinutes: 8, citation: '', isActive: true });

  // Security Role Protection
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, user, isLoading, navigate]);

  // Fetch initial data
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchAdminStats();
      fetchCourses();
      fetchLearningPaths();
      fetchQuizzes();
      fetchResearch();
      fetchUsers();
      fetchContacts();
      fetchAnalytics();
      fetchAnnouncements();
      fetchTeam();
    }
  }, [isAuthenticated, user]);

  const fetchAdminStats = () => {
    fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => {});
  };

  const fetchCourses = () => {
    fetch('/api/courses?adminView=true', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setCourses(data))
      .catch(() => {});
  };

  const fetchLearningPaths = () => {
    fetch('/api/learning-paths?adminView=true', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setLearningPaths(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  const fetchQuizzes = () => {
    // Admins want correct answers, so we use admin endpoints
    fetch('/api/quizzes?adminView=true', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setQuizzes(data))
      .catch(() => {});
  };

  const fetchResearch = () => {
    fetch('/api/research?adminView=true', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setResearch(data))
      .catch(() => {});
  };

  const fetchUsers = () => {
    fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(() => {});
  };

  const fetchContacts = () => {
    fetch('/api/admin/contacts', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setContacts(data))
      .catch(() => {});
  };

  const fetchAnalytics = () => {
    fetch('/api/analytics/overview', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => { setAnalyticsOverview(data.overview || null); setAnalyticsRows(data.courses || []); })
      .catch(() => {});
  };

  const fetchAnnouncements = () => {
    fetch('/api/announcements?adminView=true')
      .then(res => res.json())
      .then(data => setAnnouncements(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  const handleAnnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = annForm.id ? `/api/admin/announcements/${annForm.id}` : '/api/admin/announcements';
    const method = annForm.id ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(annForm)
      });
      if (res.ok) {
        setAnnForm({ id: '', title: '', body: '', level: 'info', pinned: false });
        fetchAnnouncements();
      }
    } catch { /* ignore */ }
  };

  const toggleAnn = async (a: any, patch: any) => {
    await fetch(`/api/admin/announcements/${a.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(patch)
    });
    fetchAnnouncements();
  };

  const deleteAnn = async (id: string) => {
    if (!window.confirm('Delete this announcement?')) return;
    await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    fetchAnnouncements();
  };

  // --- TEAM MEMBER CRUD ---
  const fetchTeam = () => {
    fetch('/api/team-members?adminView=true')
      .then(res => res.json())
      .then(data => setTeamList(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = teamForm.id ? `/api/admin/team-members/${teamForm.id}` : '/api/admin/team-members';
    const method = teamForm.id ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(teamForm)
      });
      if (res.ok) {
        setTeamForm(emptyTeamForm);
        fetchTeam();
      }
    } catch { /* ignore */ }
  };

  const toggleTeam = async (m: any, patch: any) => {
    await fetch(`/api/admin/team-members/${m.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(patch)
    });
    fetchTeam();
  };

  const deleteTeam = async (id: string) => {
    if (!window.confirm('Delete this team member?')) return;
    await fetch(`/api/admin/team-members/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    fetchTeam();
  };

  // --- COURSE CRUD ACTIONS ---
  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = courseForm.id ? `/api/admin/courses/${courseForm.id}` : '/api/admin/courses';
    const method = courseForm.id ? 'PUT' : 'POST';
    
    // Newline-delimited textareas → string arrays for the API.
    const toLines = (v: string) => (v || '').split('\n').map(s => s.trim()).filter(Boolean);

    const payload = {
      ...courseForm,
      syllabus: toLines(courseForm.syllabus),
      features: toLines(courseForm.features),
      highlights: toLines(courseForm.highlights),
      eligibility: toLines(courseForm.eligibility),
      learningObjectives: toLines(courseForm.learningObjectives),
      learningResources: toLines(courseForm.learningResources),
      careerBenefits: toLines(courseForm.careerBenefits),
      practicalLabs: toLines(courseForm.practicalLabs),
      // Drop empty assessment rows so blank lines don't render on the page.
      assessmentStructure: (courseForm.assessmentStructure || []).filter(r => r.name.trim() || r.weightage.trim())
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsCourseModalOpen(false);
        fetchCourses();
        fetchAdminStats();
        // Reset form
        setCourseForm(emptyCourseForm);
      }
    } catch (err) {}
  };

  const handleApproveCourseClick = async (course: any) => {
    const price = window.prompt("Enter Actual Price (INR):", course.priceINR || "4999");
    if (price === null) return;
    const discountPrice = window.prompt("Enter Discounted Price (INR) [Optional, press Enter to skip]:", course.discountPriceINR || "");
    const discountPercent = window.prompt("Enter Discount Percentage (%) [Optional, press Enter to calculate automatically]:", course.discountPercentage || "");

    try {
      const res = await fetch(`/api/admin/courses/${course.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          approvalStatus: 'approved',
          priceINR: Number(price),
          discountPriceINR: discountPrice ? Number(discountPrice) : undefined,
          discountPercentage: discountPercent ? Number(discountPercent) : undefined
        })
      });
      if (res.ok) {
        alert("Course approved and published successfully!");
        fetchCourses();
      } else {
        alert("Failed to approve course.");
      }
    } catch (err) {
      alert("Connection error.");
    }
  };

  const editCourse = (c: any) => {
    setCourseForm({
      id: c.id,
      title: c.title,
      description: c.description,
      category: c.category,
      instructorName: c.instructorName,
      instructorTitle: c.instructorTitle,
      durationWeeks: c.durationWeeks,
      difficulty: c.difficulty,
      priceINR: c.priceINR,
      syllabus: c.syllabus?.join('\n') || '',
      features: c.features?.join('\n') || '',
      isActive: c.isActive,
      topics: c.topics || [],
      format: c.format || 'course',
      courseType: c.courseType || 'recorded',
      // datetime-local wants "YYYY-MM-DDTHH:mm", not the ISO string the API returns.
      startDate: c.startDate ? new Date(c.startDate).toISOString().slice(0, 16) : '',
      endDate: c.endDate ? new Date(c.endDate).toISOString().slice(0, 16) : '',
      thumbnailUrl: c.thumbnailUrl || '',
      subTitle: c.subTitle || '',
      overview: c.overview || '',
      level: c.level || '',
      // List sections stored as newline strings for editing; split back to arrays on save.
      highlights: (c.highlights || []).join('\n'),
      eligibility: (c.eligibility || []).join('\n'),
      learningObjectives: (c.learningObjectives || []).join('\n'),
      learningResources: (c.learningResources || []).join('\n'),
      careerBenefits: (c.careerBenefits || []).join('\n'),
      practicalLabs: (c.practicalLabs || []).join('\n'),
      passingCriteria: c.passingCriteria || '',
      assessmentStructure: c.assessmentStructure || [],
      schedule: c.schedule || { days: [], time: '18:00', meetLink: '', durationMinutes: 60 }
    });
    setIsCourseModalOpen(true);
  };

  const addCourseTopic = () => {
    setCourseForm(prev => ({
      ...prev,
      topics: [
        ...prev.topics,
        {
          title: `Module ${prev.topics.length + 1}: Syllabus Topic`,
          subTopics: [
            {
              title: 'Lesson 1: Lecture Video & Notes',
              richTextContent: '<p>Enter lecture notes or handbook text here...</p>',
              videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
              documentName: 'Handbook.pdf',
              documentUrl: '#',
              quizQuestions: []
            }
          ]
        }
      ]
    }));
  };

  const addCourseSubTopic = (tIdx: number) => {
    const updated = [...courseForm.topics];
    const subCount = updated[tIdx].subTopics.length;
    updated[tIdx].subTopics.push({
      title: `Lesson ${subCount + 1}: Video & Quiz`,
      richTextContent: '<p>Lecture reading notes...</p>',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      quizQuestions: []
    });
    setCourseForm({ ...courseForm, topics: updated });
  };

  const updateSubTopicField = (tIdx: number, sIdx: number, field: string, val: any) => {
    const updated = [...courseForm.topics];
    updated[tIdx].subTopics[sIdx] = {
      ...updated[tIdx].subTopics[sIdx],
      [field]: val
    };
    setCourseForm({ ...courseForm, topics: updated });
  };

  const moveCourseTopic = (index: number, direction: 'up' | 'down') => {
    const newTopics = [...courseForm.topics];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newTopics.length) return;
    const temp = newTopics[index];
    newTopics[index] = newTopics[targetIndex];
    newTopics[targetIndex] = temp;
    setCourseForm({ ...courseForm, topics: newTopics });
  };

  const deleteCourseTopic = (index: number) => {
    const newTopics = courseForm.topics.filter((_, i) => i !== index);
    setCourseForm({ ...courseForm, topics: newTopics });
  };

  const deleteCourse = async (id: string) => {
    if (window.confirm('Delete this course permanently?')) {
      await fetch(`/api/admin/courses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchCourses();
      fetchAdminStats();
    }
  };

  // --- LEARNING PATH CRUD ACTIONS ---
  // Toggle a course into/out of the path, preserving selection order as `order`.
  const togglePathCourse = (courseId: string) => {
    setPathForm(prev => {
      const exists = prev.courses.some((c: any) => c.courseId === courseId);
      const next = exists
        ? prev.courses.filter((c: any) => c.courseId !== courseId)
        : [...prev.courses, { courseId, required: true }];
      return { ...prev, courses: next.map((c: any, i: number) => ({ ...c, order: i })) };
    });
  };

  const togglePathCourseRequired = (courseId: string) => {
    setPathForm(prev => ({
      ...prev,
      courses: prev.courses.map((c: any) => (c.courseId === courseId ? { ...c, required: !c.required } : c))
    }));
  };

  const handlePathSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pathForm.courses.length === 0) {
      alert('Add at least one course to the path.');
      return;
    }
    const url = pathForm.id ? `/api/admin/learning-paths/${pathForm.id}` : '/api/admin/learning-paths';
    const method = pathForm.id ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(pathForm)
      });
      if (res.ok) {
        setIsPathModalOpen(false);
        fetchLearningPaths();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to save learning path');
      }
    } catch {
      alert('Server error saving learning path');
    }
  };

  const editPath = (p: any) => {
    setPathForm({
      id: p.id,
      title: p.title,
      description: p.description,
      category: p.category,
      courses: (p.courses || []).map((c: any) => ({ courseId: String(c.courseId), order: c.order, required: c.required })),
      sequential: p.sequential,
      issueCertificate: p.issueCertificate,
      certificateTitle: p.certificateTitle || '',
      isActive: p.isActive
    });
    setIsPathModalOpen(true);
  };

  const deletePath = async (id: string) => {
    if (window.confirm('Delete this learning path permanently?')) {
      await fetch(`/api/admin/learning-paths/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchLearningPaths();
    }
  };

  // --- QUIZ CRUD ACTIONS ---
  const handleAddQuestion = () => {
    if (!newQuestion.questionText) return;
    setQuizForm(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
    setNewQuestion({ questionText: '', options: ['', '', '', ''], correctOptionIndex: 0 });
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuizForm(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== idx)
    }));
  };

  const handleQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quizForm.questions.length === 0) {
      alert('Add at least one question to the quiz assessment.');
      return;
    }

    const url = quizForm.id ? `/api/admin/quizzes/${quizForm.id}` : '/api/admin/quizzes';
    const method = quizForm.id ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(quizForm)
      });
      if (res.ok) {
        setIsQuizModalOpen(false);
        fetchQuizzes();
        fetchAdminStats();
        // Reset form
        setQuizForm({ id: '', title: '', description: '', category: 'Digital Forensics', courseId: undefined, timeLimitMinutes: 15, questions: [], passingPercentage: 80, negativeMarking: false, negativeMarkFraction: 0.25, attemptsAllowed: 0, isActive: true });
      }
    } catch (err) {}
  };

  const editQuiz = (q: any) => {
    setQuizForm({
      id: q.id,
      title: q.title,
      description: q.description,
      category: q.category,
      courseId: q.courseId?.id || q.courseId || undefined,
      timeLimitMinutes: q.timeLimitMinutes,
      questions: q.questions || [],
      passingPercentage: q.passingPercentage ?? 80,
      negativeMarking: q.negativeMarking ?? false,
      negativeMarkFraction: q.negativeMarkFraction ?? 0.25,
      attemptsAllowed: q.attemptsAllowed ?? 0,
      isActive: q.isActive
    });
    setIsQuizModalOpen(true);
  };

  const deleteQuiz = async (id: string) => {
    if (window.confirm('Delete this quiz permanently?')) {
      await fetch(`/api/admin/quizzes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchQuizzes();
      fetchAdminStats();
    }
  };

  // --- RESEARCH CRUD ACTIONS ---
  const handleResearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = researchForm.id ? `/api/admin/research/${researchForm.id}` : '/api/admin/research';
    const method = researchForm.id ? 'PUT' : 'POST';

    const payload = {
      ...researchForm,
      authors: researchForm.authors.split(',').map(a => a.trim())
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsResearchModalOpen(false);
        fetchResearch();
        fetchAdminStats();
        setResearchForm({ id: '', title: '', abstract: '', content: '', category: 'Digital Forensics', authors: '', readTimeMinutes: 8, citation: '', isActive: true });
      }
    } catch (err) {}
  };

  const editResearch = (p: any) => {
    setResearchForm({
      id: p.id,
      title: p.title,
      abstract: p.abstract,
      content: p.content,
      category: p.category,
      authors: p.authors?.join(', ') || '',
      readTimeMinutes: p.readTimeMinutes,
      citation: p.citation,
      isActive: p.isActive
    });
    setIsResearchModalOpen(true);
  };

  const deleteResearch = async (id: string) => {
    if (window.confirm('Delete this publication permanently?')) {
      await fetch(`/api/admin/research/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchResearch();
      fetchAdminStats();
    }
  };

  // --- USER ROLE MANAGEMENT ---
  const changeUserRole = async (userId: string, newRole: string) => {
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ role: newRole })
    });
    fetchUsers();
  };

  // --- RESOLVE CONTACT MESSAGES ---
  const toggleContactResolved = async (id: string, currentStatus: boolean) => {
    await fetch(`/api/admin/contacts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ isResolved: !currentStatus })
    });
    fetchContacts();
  };

  if (isLoading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-brand-darkBg">
        <div className="w-10 h-10 border-4 border-brand-glowCyan border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="Admin Control Center" 
        description="ForenSecure administrative dashboard registry settings." 
      />

      <div className="fs-shell">
        <div className="fs-split-wide">
          {/* Side navigation rail */}
          <div className="fs-side">
            <div className="fs-side-grp">Manage</div>
            <a 
              onClick={() => setActiveTab('overview')}
              className={`fs-side-link ${activeTab === 'overview' ? 'active' : ''}`}
            >
              <BarChart className="w-4 h-4" /> Overview
            </a>
            <a 
              onClick={() => setActiveTab('courses')}
              className={`fs-side-link ${activeTab === 'courses' ? 'active' : ''}`}
            >
              <BookOpen className="w-4 h-4" /> Courses &amp; Content
            </a>
            <a 
              onClick={() => setActiveTab('paths')}
              className={`fs-side-link ${activeTab === 'paths' ? 'active' : ''}`}
            >
              <Layers className="w-4 h-4" /> Learning Paths
            </a>
            <a 
              onClick={() => setActiveTab('quizzes')}
              className={`fs-side-link ${activeTab === 'quizzes' ? 'active' : ''}`}
            >
              <Zap className="w-4 h-4" /> Quizzes
            </a>
            <a 
              onClick={() => setActiveTab('users')}
              className={`fs-side-link ${activeTab === 'users' ? 'active' : ''}`}
            >
              <Users className="w-4 h-4" /> Users
            </a>
            <a 
              onClick={() => setActiveTab('contacts')}
              className={`fs-side-link ${activeTab === 'contacts' ? 'active' : ''}`}
            >
              <Mail className="w-4 h-4" /> Messages
            </a>

            <div className="fs-side-grp">System</div>
            <a 
              onClick={() => setActiveTab('research')}
              className={`fs-side-link ${activeTab === 'research' ? 'active' : ''}`}
            >
              <FileText className="w-4 h-4" /> Research
            </a>
            <a
              onClick={() => setActiveTab('analytics')}
              className={`fs-side-link ${activeTab === 'analytics' ? 'active' : ''}`}
            >
              <BarChart className="w-4 h-4" /> Analytics
            </a>
            <a
              onClick={() => setActiveTab('announcements')}
              className={`fs-side-link ${activeTab === 'announcements' ? 'active' : ''}`}
            >
              <Megaphone className="w-4 h-4" /> Announcements
            </a>
            <a
              onClick={() => setActiveTab('notifications')}
              className={`fs-side-link ${activeTab === 'notifications' ? 'active' : ''}`}
            >
              <Bell className="w-4 h-4" /> Notifications
            </a>
            <a
              onClick={() => setActiveTab('team')}
              className={`fs-side-link ${activeTab === 'team' ? 'active' : ''}`}
            >
              <Users className="w-4 h-4" /> Team (About)
            </a>
          </div>

          {/* Main page area */}
          <div className="fs-page">
            <div className="fs-eyebrow">Platform Overview</div>
            <h1 className="fs-page-title">System dashboard</h1>
            {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Counts Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                {[
                  { title: 'Total Accounts', count: stats.usersCount, color: 'text-brand-glowCyan' },
                  { title: 'Courses Registered', count: stats.coursesCount, color: 'text-brand-glowBlue' },
                  { title: 'Total Quizzes', count: stats.quizzesCount, color: 'text-purple-500' },
                  { title: 'Research Articles', count: stats.researchCount, color: 'text-amber-500' },
                  { title: 'Inbox Messages', count: stats.contactsCount, color: 'text-emerald-500' }
                ].map((item, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm">
                    <span className={`block text-2xl font-extrabold heading-display leading-tight mb-1 ${item.color}`}>
                      {item.count}
                    </span>
                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{item.title}</span>
                  </div>
                ))}
              </div>

              {/* Quick instructions */}
              <div className="p-6 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm">
                <h3 className="text-sm font-bold text-brand-deepBlue dark:text-white mb-2 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-brand-glowCyan" />
                  Administrative Operating Instructions
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Use the management tabs above to insert new courses, edit database items, write quiz parameters, adjust time limits, and audit student roles. Setting active state controls visibility in the public directory listings. Ensure chain of custody rules are verified for all changes.
                </p>
              </div>
            </div>
          )}

          {/* 2. COURSES MANAGER */}
          {activeTab === 'courses' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center gap-4">
                <h2 className="text-sm font-extrabold uppercase text-slate-400">Courses Database</h2>
                <button
                  onClick={() => {
                    setCourseForm(emptyCourseForm);
                    setIsCourseModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-900 bg-brand-glowCyan hover:bg-brand-glowBlue hover:text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Program
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courses.map(c => (
                  <div key={c.id} className="p-5 rounded-2xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-deepBlue/5 dark:bg-brand-glowCyan/10 text-brand-deepBlue dark:text-brand-glowCyan">
                          {c.category}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${c.isActive ? 'bg-green-150 text-green-700' : 'bg-red-150 text-red-700'}`}>
                          {c.isActive ? 'Active' : 'Draft'}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          c.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' :
                          c.approvalStatus === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {c.approvalStatus || 'pending'}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-brand-deepBlue dark:text-white line-clamp-1">{c.title}</h3>
                      <p className="text-xs text-slate-404 line-clamp-2">{c.description}</p>
                      {c.approvalStatus === 'pending' && (
                        <div className="bg-yellow-50/50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/50 p-2.5 rounded-xl flex items-center justify-between mt-2 text-xs">
                          <span className="font-bold text-yellow-800 dark:text-yellow-450 flex items-center gap-1">
                            Pending Price
                          </span>
                          <button
                            onClick={() => handleApproveCourseClick(c)}
                            className="px-2 py-0.5 bg-green-600 hover:bg-green-700 text-white rounded font-bold text-[10px] uppercase"
                          >
                            Approve
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-100 dark:border-brand-darkBorder pt-4 mt-4">
                      <span className="text-xs font-bold text-brand-deepBlue dark:text-white">₹{c.priceINR?.toLocaleString('en-IN')}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => editCourse(c)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-brand-darkBorder text-slate-500 hover:text-brand-glowCyan"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteCourse(c.id)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-brand-darkBorder text-slate-550 hover:text-red-500"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Enterprise 4-Panel Course Builder Modal Overlay */}
              {isCourseModalOpen && (
                <CourseBuilder4Panel
                  courseForm={courseForm}
                  setCourseForm={setCourseForm}
                  onSave={handleCourseSubmit}
                  onClose={() => setIsCourseModalOpen(false)}
                />
              )}
            </div>
          )}

          {/* 2b. LEARNING PATHS MANAGER */}
          {activeTab === 'paths' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center gap-4">
                <h2 className="text-sm font-extrabold uppercase text-slate-400">Learning Paths Database</h2>
                <button
                  onClick={() => {
                    setPathForm({ id: '', title: '', description: '', category: 'Career Track', courses: [], sequential: true, issueCertificate: true, certificateTitle: '', isActive: true });
                    setIsPathModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-900 bg-brand-glowCyan hover:bg-brand-glowBlue hover:text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Path
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {learningPaths.map(p => (
                  <div key={p.id} className="p-5 rounded-2xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-deepBlue/5 dark:bg-brand-glowCyan/10 text-brand-deepBlue dark:text-brand-glowCyan">
                          {p.category}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${p.isActive ? 'bg-green-150 text-green-700' : 'bg-red-150 text-red-700'}`}>
                          {p.isActive ? 'Active' : 'Draft'}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-brand-deepBlue dark:text-white line-clamp-1">{p.title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2">{p.description}</p>
                      <span className="text-xs text-slate-400 font-semibold block">
                        {p.courses?.length || 0} courses{p.sequential ? ' · Sequential' : ''}{p.issueCertificate ? ' · Certificate' : ''}
                      </span>
                    </div>
                    <div className="flex justify-end items-center border-t border-slate-100 dark:border-brand-darkBorder pt-4 mt-4 gap-2">
                      <button onClick={() => editPath(p)} className="p-1.5 rounded-lg border border-slate-200 dark:border-brand-darkBorder text-slate-500 hover:text-brand-glowCyan">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deletePath(p.id)} className="p-1.5 rounded-lg border border-slate-200 dark:border-brand-darkBorder text-slate-550 hover:text-red-500">
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Path builder modal */}
              {isPathModalOpen && (
                <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
                  <div className="w-full max-w-2xl bg-white dark:bg-brand-darkCard rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                    <button onClick={() => setIsPathModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                      <X className="w-5 h-5" />
                    </button>
                    <h2 className="text-lg font-bold text-brand-deepBlue dark:text-white">
                      {pathForm.id ? 'Edit Learning Path' : 'Create Learning Path'}
                    </h2>

                    <form onSubmit={handlePathSubmit} className="space-y-4 text-xs font-semibold">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
                          <label htmlFor="adm-p-title" className="block text-[11px] text-slate-450 uppercase mb-1">Path Title</label>
                          <input
                            id="adm-p-title" type="text" required
                            value={pathForm.title}
                            onChange={e => setPathForm({ ...pathForm, title: e.target.value })}
                            className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder focus:outline-none"
                          />
                        </div>
                        <div>
                          <label htmlFor="adm-p-cat" className="block text-[11px] text-slate-450 uppercase mb-1">Category</label>
                          <input
                            id="adm-p-cat" type="text" required
                            value={pathForm.category}
                            onChange={e => setPathForm({ ...pathForm, category: e.target.value })}
                            className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="adm-p-desc" className="block text-[11px] text-slate-450 uppercase mb-1">Description</label>
                        <textarea
                          id="adm-p-desc" required rows={2}
                          value={pathForm.description}
                          onChange={e => setPathForm({ ...pathForm, description: e.target.value })}
                          className="w-full p-3 rounded-lg bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder focus:outline-none"
                        ></textarea>
                      </div>

                      {/* Course selection (order = selection order) */}
                      <div>
                        <span className="block text-[11px] text-slate-450 uppercase mb-2">Courses in Path (tick in order)</span>
                        <div className="space-y-2 max-h-52 overflow-y-auto border border-slate-200 dark:border-brand-darkBorder rounded-lg p-3">
                          {courses.length === 0 && <p className="text-xs text-slate-400">No courses available. Create courses first.</p>}
                          {courses.map(c => {
                            const selected = pathForm.courses.find((pc: any) => pc.courseId === c.id);
                            const idx = pathForm.courses.findIndex((pc: any) => pc.courseId === c.id);
                            return (
                              <div key={c.id} className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={!!selected}
                                  onChange={() => togglePathCourse(c.id)}
                                  className="w-4 h-4 accent-brand-glowCyan"
                                />
                                {selected && (
                                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-deepBlue text-white text-[11px] font-bold shrink-0">{idx + 1}</span>
                                )}
                                <span className="flex-grow text-xs text-slate-600 dark:text-slate-300 line-clamp-1">{c.title}</span>
                                {selected && (
                                  <button
                                    type="button"
                                    onClick={() => togglePathCourseRequired(c.id)}
                                    className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${selected.required ? 'bg-brand-glowCyan/20 text-brand-deepBlue dark:text-brand-glowCyan' : 'bg-slate-100 dark:bg-brand-darkBg text-slate-400'}`}
                                  >
                                    {selected.required ? 'Required' : 'Elective'}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="adm-p-certtitle" className="block text-[11px] text-slate-450 uppercase mb-1">Certificate Title (optional)</label>
                          <input
                            id="adm-p-certtitle" type="text"
                            value={pathForm.certificateTitle}
                            onChange={e => setPathForm({ ...pathForm, certificateTitle: e.target.value })}
                            placeholder="Defaults to path title"
                            className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder focus:outline-none"
                          />
                        </div>
                        <div className="flex items-end gap-4">
                          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                            <input type="checkbox" checked={pathForm.sequential} onChange={e => setPathForm({ ...pathForm, sequential: e.target.checked })} className="w-4 h-4 accent-brand-glowCyan" />
                            Sequential
                          </label>
                          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                            <input type="checkbox" checked={pathForm.issueCertificate} onChange={e => setPathForm({ ...pathForm, issueCertificate: e.target.checked })} className="w-4 h-4 accent-brand-glowCyan" />
                            Certificate
                          </label>
                          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                            <input type="checkbox" checked={pathForm.isActive} onChange={e => setPathForm({ ...pathForm, isActive: e.target.checked })} className="w-4 h-4 accent-brand-glowCyan" />
                            Active
                          </label>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setIsPathModalOpen(false)} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 border border-slate-200 dark:border-brand-darkBorder">
                          Cancel
                        </button>
                        <button type="submit" className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-brand-deepBlue dark:bg-brand-glowBlue hover:bg-brand-glowCyan transition-colors">
                          {pathForm.id ? 'Update Path' : 'Create Path'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. QUIZZES MANAGER */}
          {activeTab === 'quizzes' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center gap-4">
                <h2 className="text-sm font-extrabold uppercase text-slate-400">Assessments Database</h2>
                <button
                  onClick={() => {
                    setQuizForm({ id: '', title: '', description: '', category: 'Digital Forensics', courseId: undefined, timeLimitMinutes: 15, questions: [], passingPercentage: 80, negativeMarking: false, negativeMarkFraction: 0.25, attemptsAllowed: 0, isActive: true });
                    setIsQuizModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-900 bg-brand-glowCyan hover:bg-brand-glowBlue hover:text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Assessment
                </button>
              </div>

              <div className="space-y-4">
                {quizzes.map(q => (
                  <div key={q.id} className="p-6 rounded-2xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder flex items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-deepBlue/5 dark:bg-brand-glowCyan/10 text-brand-deepBlue dark:text-brand-glowCyan">
                          {q.category}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="w-3.5 h-3.5" /> {q.timeLimitMinutes} Mins
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${q.isActive ? 'bg-green-150 text-green-700' : 'bg-red-150 text-red-700'}`}>
                          {q.isActive ? 'Active' : 'Draft'}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-brand-deepBlue dark:text-white">{q.title}</h3>
                      <span className="text-xs text-slate-400 block font-semibold">{q.questions?.length || 0} Questions loaded</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => editQuiz(q)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-brand-darkBorder text-slate-500 hover:text-brand-glowCyan"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteQuiz(q.id)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-brand-darkBorder text-slate-550 hover:text-red-500"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quiz form overlay */}
              {isQuizModalOpen && (
                <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
                  <div className="w-full max-w-2xl bg-white dark:bg-brand-darkCard rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                    <button onClick={() => setIsQuizModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                      <X className="w-5 h-5" />
                    </button>
                    <h2 className="text-lg font-bold text-brand-deepBlue dark:text-white">
                      {quizForm.id ? 'Edit Assessment parameters' : 'Create Assessment parameters'}
                    </h2>

                    <form onSubmit={handleQuizSubmit} className="space-y-4 text-xs font-semibold">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
                          <label htmlFor="adm-q-title" className="block text-[11px] text-slate-450 uppercase mb-1">Assessment Title</label>
                          <input
                            id="adm-q-title"
                            type="text" required
                            value={quizForm.title}
                            onChange={e => setQuizForm({...quizForm, title: e.target.value})}
                            className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder focus:outline-none"
                          />
                        </div>
                        <div>
                          <label htmlFor="adm-q-lim" className="block text-[11px] text-slate-450 uppercase mb-1">Time Limit (Mins)</label>
                          <input
                            id="adm-q-lim"
                            type="number" required
                            value={quizForm.timeLimitMinutes}
                            onChange={e => setQuizForm({...quizForm, timeLimitMinutes: parseInt(e.target.value) || 15})}
                            className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="adm-q-cat" className="block text-[11px] text-slate-450 uppercase mb-1">Category</label>
                          <select
                            id="adm-q-cat"
                            value={quizForm.category}
                            onChange={e => setQuizForm({...quizForm, category: e.target.value})}
                            className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder text-slate-700 dark:text-slate-350 focus:outline-none"
                          >
                            <option>Digital Forensics</option>
                            <option>Physical Labs</option>
                            <option>Biometrics</option>
                            <option>General Forensic</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="adm-q-course" className="block text-[11px] text-slate-450 uppercase mb-1">Linked Course ID (Optional)</label>
                          <select
                            id="adm-q-course"
                            value={quizForm.courseId || ''}
                            onChange={e => setQuizForm({...quizForm, courseId: e.target.value || undefined})}
                            className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder text-slate-700 dark:text-slate-350 focus:outline-none"
                          >
                            <option value="">None</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="adm-q-desc" className="block text-[11px] text-slate-450 uppercase mb-1">Description</label>
                        <textarea
                          id="adm-q-desc"
                          required rows={2}
                          value={quizForm.description}
                          onChange={e => setQuizForm({...quizForm, description: e.target.value})}
                          className="w-full p-3 rounded-lg bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder focus:outline-none"
                        ></textarea>
                      </div>

                      {/* Assessment scoring settings */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-end border-t border-slate-200 dark:border-brand-darkBorder pt-4">
                        <div>
                          <label htmlFor="adm-q-pass" className="block text-[11px] text-slate-450 uppercase mb-1">Pass %</label>
                          <input
                            id="adm-q-pass" type="number" min={0} max={100}
                            value={quizForm.passingPercentage}
                            onChange={e => setQuizForm({ ...quizForm, passingPercentage: parseInt(e.target.value) || 0 })}
                            className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder focus:outline-none"
                          />
                        </div>
                        <div>
                          <label htmlFor="adm-q-attempts" className="block text-[11px] text-slate-450 uppercase mb-1">Max Attempts (0=∞)</label>
                          <input
                            id="adm-q-attempts" type="number" min={0}
                            value={quizForm.attemptsAllowed}
                            onChange={e => setQuizForm({ ...quizForm, attemptsAllowed: parseInt(e.target.value) || 0 })}
                            className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder focus:outline-none"
                          />
                        </div>
                        <div>
                          <label htmlFor="adm-q-negfrac" className="block text-[11px] text-slate-450 uppercase mb-1">Neg. Mark Fraction</label>
                          <input
                            id="adm-q-negfrac" type="number" min={0} max={1} step={0.05}
                            value={quizForm.negativeMarkFraction}
                            onChange={e => setQuizForm({ ...quizForm, negativeMarkFraction: parseFloat(e.target.value) || 0 })}
                            className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder focus:outline-none disabled:opacity-40"
                            disabled={!quizForm.negativeMarking}
                          />
                        </div>
                        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 h-9">
                          <input type="checkbox" checked={quizForm.negativeMarking} onChange={e => setQuizForm({ ...quizForm, negativeMarking: e.target.checked })} className="w-4 h-4 accent-brand-glowCyan" />
                          Negative marking
                        </label>
                      </div>

                      {/* Question builder panel */}
                      <div className="border-t border-slate-200 dark:border-brand-darkBorder pt-4 space-y-4">
                        <span className="block text-xs uppercase font-extrabold tracking-widest text-slate-400">Questions List ({quizForm.questions.length})</span>
                        
                        {quizForm.questions.map((q, idx) => (
                          <div key={idx} className="flex justify-between items-start gap-4 p-3 rounded-lg bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-brand-glowCyan">Q{idx + 1}. {q.questionText}</span>
                              <ul className="text-[10px] text-slate-400 space-y-0.5 mt-1 font-medium">
                                {q.options.map((opt: string, i: number) => (
                                  <li key={i} className={q.correctOptionIndex === i ? 'text-green-500 font-bold' : ''}>
                                    {String.fromCharCode(65 + i)}. {opt}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveQuestion(idx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}

                        {/* Add new question block */}
                        <div className="p-4 rounded-xl border border-dashed border-slate-350 dark:border-brand-darkBorder space-y-3 bg-slate-50/30">
                          <div>
                            <label htmlFor="adm-q-text" className="block text-[11px] text-slate-450 uppercase mb-1">New Question Text</label>
                            <input
                              id="adm-q-text"
                              type="text"
                              value={newQuestion.questionText}
                              onChange={e => setNewQuestion({...newQuestion, questionText: e.target.value})}
                              className="w-full h-8 px-2 rounded bg-white dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {newQuestion.options.map((opt, oIdx) => (
                              <div key={oIdx}>
                                <label htmlFor={`adm-q-o${oIdx}`} className="block text-[10px] text-slate-400 uppercase mb-0.5">Option {String.fromCharCode(65 + oIdx)}</label>
                                <input
                                  id={`adm-q-o${oIdx}`}
                                  type="text"
                                  value={opt}
                                  onChange={e => {
                                    const opts = [...newQuestion.options];
                                    opts[oIdx] = e.target.value;
                                    setNewQuestion({...newQuestion, options: opts});
                                  }}
                                  className="w-full h-8 px-2 rounded bg-white dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder"
                                />
                              </div>
                            ))}
                          </div>

                          <div>
                            <label htmlFor="adm-q-ans" className="block text-[11px] text-slate-450 uppercase mb-1">Correct Option index</label>
                            <select
                              id="adm-q-ans"
                              value={newQuestion.correctOptionIndex}
                              onChange={e => setNewQuestion({...newQuestion, correctOptionIndex: parseInt(e.target.value) || 0})}
                              className="w-full h-8 px-2 rounded bg-white dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder text-slate-700 dark:text-slate-350"
                            >
                              <option value="0">A</option>
                              <option value="1">B</option>
                              <option value="2">C</option>
                              <option value="3">D</option>
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={handleAddQuestion}
                            className="w-full py-1.5 rounded bg-brand-deepBlue/10 text-brand-deepBlue dark:bg-brand-glowCyan/10 dark:text-brand-glowCyan text-[11px] font-bold hover:bg-brand-deepBlue/25 transition-colors"
                          >
                            Add Question to List
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          id="adm-q-act"
                          type="checkbox"
                          checked={quizForm.isActive}
                          onChange={e => setQuizForm({...quizForm, isActive: e.target.checked})}
                          className="w-4 h-4 rounded text-brand-glowCyan border-slate-300"
                        />
                        <label htmlFor="adm-q-act" className="text-xs font-bold text-slate-700 dark:text-slate-300">Set active & publish assessment</label>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-lg bg-brand-deepBlue dark:bg-brand-glowBlue hover:bg-brand-glowCyan text-white text-xs font-bold transition-colors"
                      >
                        Save Assessment parameters
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. RESEARCH MANAGER */}
          {activeTab === 'announcements' && (
            <div className="space-y-6">
              <div>
                <div className="fs-eyebrow">Broadcast</div>
                <h2 className="fs-page-title">Announcements</h2>
              </div>

              <form onSubmit={handleAnnSubmit} className="p-5 rounded-2xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text" required placeholder="Title"
                    value={annForm.title}
                    onChange={e => setAnnForm({ ...annForm, title: e.target.value })}
                    className="sm:col-span-2 h-9 px-3 rounded-lg text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder focus:outline-none"
                  />
                  <select
                    value={annForm.level}
                    onChange={e => setAnnForm({ ...annForm, level: e.target.value })}
                    className="h-9 px-3 rounded-lg text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder focus:outline-none"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <textarea
                  required rows={2} placeholder="Message body"
                  value={annForm.body}
                  onChange={e => setAnnForm({ ...annForm, body: e.target.value })}
                  className="w-full p-3 rounded-lg text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder focus:outline-none"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <input type="checkbox" checked={annForm.pinned} onChange={e => setAnnForm({ ...annForm, pinned: e.target.checked })} className="w-4 h-4 accent-brand-glowCyan" />
                    Pin to top
                  </label>
                  <div className="flex gap-2">
                    {annForm.id && (
                      <button type="button" onClick={() => setAnnForm({ id: '', title: '', body: '', level: 'info', pinned: false })} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 border border-slate-200 dark:border-brand-darkBorder">
                        Cancel
                      </button>
                    )}
                    <button type="submit" className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-brand-deepBlue dark:bg-brand-glowBlue hover:bg-brand-glowCyan transition-colors">
                      {annForm.id ? 'Update' : 'Post'} Announcement
                    </button>
                  </div>
                </div>
              </form>

              <div className="space-y-3">
                {announcements.length === 0 && <p className="text-xs text-slate-400">No announcements yet.</p>}
                {announcements.map(a => (
                  <div key={a.id} className="p-4 rounded-2xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${a.level === 'critical' ? 'bg-red-100 text-red-700' : a.level === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-brand-glowCyan/15 text-brand-deepBlue dark:text-brand-glowCyan'}`}>{a.level}</span>
                        {a.pinned && <span className="text-[11px] font-bold text-slate-400">📌 Pinned</span>}
                        {!a.isActive && <span className="text-[11px] font-bold text-slate-400">Hidden</span>}
                      </div>
                      <h3 className="text-sm font-bold text-brand-deepBlue dark:text-white line-clamp-1">{a.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{a.body}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => toggleAnn(a, { pinned: !a.pinned })} className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-brand-darkBorder text-[11px] font-bold text-slate-500 hover:text-brand-glowCyan">{a.pinned ? 'Unpin' : 'Pin'}</button>
                      <button onClick={() => toggleAnn(a, { isActive: !a.isActive })} className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-brand-darkBorder text-[11px] font-bold text-slate-500 hover:text-brand-glowCyan">{a.isActive ? 'Hide' : 'Show'}</button>
                      <button onClick={() => setAnnForm({ id: a.id, title: a.title, body: a.body, level: a.level, pinned: a.pinned })} className="p-1.5 rounded-lg border border-slate-200 dark:border-brand-darkBorder text-slate-500 hover:text-brand-glowCyan"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteAnn(a.id)} className="p-1.5 rounded-lg border border-slate-200 dark:border-brand-darkBorder text-slate-550 hover:text-red-500"><Trash className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-6">
              <div>
                <div className="fs-eyebrow">About Page</div>
                <h2 className="fs-page-title">Team Members — "Meet the Experts"</h2>
                <p className="text-xs text-slate-400 mt-1">Add, edit, hide, or remove experts. Only active members show on the About page.</p>
              </div>

              <form onSubmit={handleTeamSubmit} className="p-5 rounded-2xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text" required placeholder="Name"
                    value={teamForm.name}
                    onChange={e => setTeamForm({ ...teamForm, name: e.target.value })}
                    className="h-9 px-3 rounded-lg text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder focus:outline-none"
                  />
                  <input
                    type="text" required placeholder="Role (e.g. Former Director, CFSL)"
                    value={teamForm.role}
                    onChange={e => setTeamForm({ ...teamForm, role: e.target.value })}
                    className="h-9 px-3 rounded-lg text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder focus:outline-none"
                  />
                  <input
                    type="number" placeholder="Sort order"
                    value={teamForm.sortOrder}
                    onChange={e => setTeamForm({ ...teamForm, sortOrder: Number(e.target.value) })}
                    className="h-9 px-3 rounded-lg text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder focus:outline-none"
                  />
                </div>
                <input
                  type="text" placeholder="Short description (e.g. Fingerprint & Document Expert)"
                  value={teamForm.description}
                  onChange={e => setTeamForm({ ...teamForm, description: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder focus:outline-none"
                />
                <div className="flex justify-end gap-2">
                  {teamForm.id && (
                    <button type="button" onClick={() => setTeamForm(emptyTeamForm)} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 border border-slate-200 dark:border-brand-darkBorder">
                      Cancel
                    </button>
                  )}
                  <button type="submit" className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-brand-deepBlue dark:bg-brand-glowBlue hover:bg-brand-glowCyan transition-colors">
                    {teamForm.id ? 'Update' : 'Add'} Member
                  </button>
                </div>
              </form>

              <div className="space-y-3">
                {teamList.length === 0 && <p className="text-xs text-slate-400">No team members yet.</p>}
                {teamList.map(m => (
                  <div key={m.id} className="p-4 rounded-2xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-slate-400">#{m.sortOrder}</span>
                        {!m.isActive && <span className="text-[11px] font-bold text-slate-400">Hidden</span>}
                      </div>
                      <h3 className="text-sm font-bold text-brand-deepBlue dark:text-white line-clamp-1">{m.name}</h3>
                      <span className="text-xs font-semibold text-brand-glowBlue dark:text-brand-glowCyan block">{m.role}</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{m.description}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => toggleTeam(m, { isActive: !m.isActive })} className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-brand-darkBorder text-[11px] font-bold text-slate-500 hover:text-brand-glowCyan">{m.isActive ? 'Hide' : 'Show'}</button>
                      <button onClick={() => setTeamForm({ id: m.id, name: m.name, role: m.role, description: m.description || '', sortOrder: m.sortOrder || 0 })} className="p-1.5 rounded-lg border border-slate-200 dark:border-brand-darkBorder text-slate-500 hover:text-brand-glowCyan"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteTeam(m.id)} className="p-1.5 rounded-lg border border-slate-200 dark:border-brand-darkBorder text-slate-550 hover:text-red-500"><Trash className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <AdminNotificationsPanel token={token} />
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <div className="fs-eyebrow">Insights</div>
                <h2 className="fs-page-title">Learning Analytics</h2>
              </div>

              {analyticsOverview && (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  {[
                    { label: 'Courses', v: analyticsOverview.courses },
                    { label: 'Enrollments', v: analyticsOverview.totalEnrollments },
                    { label: 'Completions', v: analyticsOverview.totalCompletions },
                    { label: 'Completion Rate', v: analyticsOverview.overallCompletionRate + '%' },
                    { label: 'Pending Grading', v: analyticsOverview.pendingAssignments }
                  ].map((t, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm">
                      <span className="block text-2xl font-extrabold text-brand-deepBlue dark:text-white leading-tight mb-1">{t.v}</span>
                      <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{t.label}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-2xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 dark:border-brand-darkBorder text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  Per-Course Performance
                </div>
                <div className="divide-y divide-slate-100 dark:divide-brand-darkBorder">
                  {analyticsRows.length === 0 && <div className="p-5 text-xs text-slate-400">No analytics data yet.</div>}
                  {analyticsRows.map((r) => (
                    <div key={r.courseId} className="p-5 space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="text-sm font-bold text-brand-deepBlue dark:text-white line-clamp-1">{r.title}</h3>
                        <span className="text-xs font-semibold text-slate-400 shrink-0">{r.enrolled} enrolled</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-grow h-2 rounded-full bg-slate-100 dark:bg-brand-darkBg overflow-hidden">
                          <div className="h-full bg-brand-glowCyan transition-all" style={{ width: `${r.completionRate}%` }} />
                        </div>
                        <span className="text-xs font-bold text-brand-deepBlue dark:text-white w-28 text-right shrink-0">{r.completionRate}% complete</span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-slate-400 font-semibold">
                        <span>Avg quiz: {r.avgQuizScore === null ? '—' : r.avgQuizScore + '%'}</span>
                        <span>Graded: {r.gradedAssignments}</span>
                        <span>Pending: {r.pendingAssignments}</span>
                        <span>{r.completed}/{r.enrolled} completed</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'research' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center gap-4">
                <h2 className="text-sm font-extrabold uppercase text-slate-400">Research Journal Database</h2>
                <button
                  onClick={() => {
                    setResearchForm({ id: '', title: '', abstract: '', content: '', category: 'Digital Forensics', authors: '', readTimeMinutes: 8, citation: '', isActive: true });
                    setIsResearchModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-900 bg-brand-glowCyan hover:bg-brand-glowBlue hover:text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" /> Publish Research
                </button>
              </div>

              <div className="space-y-4">
                {research.map(p => (
                  <div key={p.id} className="p-6 rounded-2xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder flex items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-deepBlue/5 dark:bg-brand-glowCyan/10 text-brand-deepBlue dark:text-brand-glowCyan">
                          {p.category}
                        </span>
                        <span className="text-[11px] text-slate-400 font-semibold">{p.authors?.join(', ')}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${p.isActive ? 'bg-green-150 text-green-700' : 'bg-red-150 text-red-700'}`}>
                          {p.isActive ? 'Active' : 'Draft'}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-brand-deepBlue dark:text-white">{p.title}</h3>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => editResearch(p)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-brand-darkBorder text-slate-500 hover:text-brand-glowCyan"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteResearch(p.id)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-brand-darkBorder text-slate-550 hover:text-red-500"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Research form overlay */}
              {isResearchModalOpen && (
                <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
                  <div className="w-full max-w-2xl bg-white dark:bg-brand-darkCard rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                    <button onClick={() => setIsResearchModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                      <X className="w-5 h-5" />
                    </button>
                    <h2 className="text-lg font-bold text-brand-deepBlue dark:text-white">
                      {researchForm.id ? 'Edit Research publication' : 'Publish Research Document'}
                    </h2>

                    <form onSubmit={handleResearchSubmit} className="space-y-4 text-xs font-semibold">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="adm-r-title" className="block text-[11px] text-slate-450 uppercase mb-1">Document Title</label>
                          <input
                            id="adm-r-title"
                            type="text" required
                            value={researchForm.title}
                            onChange={e => setResearchForm({...researchForm, title: e.target.value})}
                            className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder focus:outline-none"
                          />
                        </div>
                        <div>
                          <label htmlFor="adm-r-authors" className="block text-[11px] text-slate-450 uppercase mb-1">Authors (Comma separated)</label>
                          <input
                            id="adm-r-authors"
                            type="text" required
                            value={researchForm.authors}
                            onChange={e => setResearchForm({...researchForm, authors: e.target.value})}
                            className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label htmlFor="adm-r-cat" className="block text-[11px] text-slate-450 uppercase mb-1">Category</label>
                          <select
                            id="adm-r-cat"
                            value={researchForm.category}
                            onChange={e => setResearchForm({...researchForm, category: e.target.value})}
                            className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder text-slate-700 dark:text-slate-350 focus:outline-none"
                          >
                            <option>Digital Forensics</option>
                            <option>Biometrics</option>
                            <option>General Forensic</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="adm-r-read" className="block text-[11px] text-slate-450 uppercase mb-1">Read Time (Mins)</label>
                          <input
                            id="adm-r-read"
                            type="number" required
                            value={researchForm.readTimeMinutes}
                            onChange={e => setResearchForm({...researchForm, readTimeMinutes: parseInt(e.target.value) || 8})}
                            className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder focus:outline-none"
                          />
                        </div>
                        <div>
                          <label htmlFor="adm-r-cite" className="block text-[11px] text-slate-450 uppercase mb-1">Citation Format (APA/MLA)</label>
                          <input
                            id="adm-r-cite"
                            type="text" required
                            value={researchForm.citation}
                            onChange={e => setResearchForm({...researchForm, citation: e.target.value})}
                            className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="adm-r-abs" className="block text-[11px] text-slate-450 uppercase mb-1">Abstract Summary</label>
                        <textarea
                          id="adm-r-abs"
                          required rows={3}
                          value={researchForm.abstract}
                          onChange={e => setResearchForm({...researchForm, abstract: e.target.value})}
                          className="w-full p-3 rounded-lg bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder focus:outline-none"
                        ></textarea>
                      </div>

                      <div>
                        <label htmlFor="adm-r-cont" className="block text-[11px] text-slate-450 uppercase mb-1">Main Paper Content</label>
                        <textarea
                          id="adm-r-cont"
                          required rows={6}
                          value={researchForm.content}
                          onChange={e => setResearchForm({...researchForm, content: e.target.value})}
                          className="w-full p-3 rounded-lg bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder focus:outline-none font-mono text-[11px]"
                        ></textarea>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          id="adm-r-act"
                          type="checkbox"
                          checked={researchForm.isActive}
                          onChange={e => setResearchForm({...researchForm, isActive: e.target.checked})}
                          className="w-4 h-4 rounded text-brand-glowCyan border-slate-300"
                        />
                        <label htmlFor="adm-r-act" className="text-xs font-bold text-slate-700 dark:text-slate-300">Set active & publish document</label>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-lg bg-brand-deepBlue dark:bg-brand-glowBlue hover:bg-brand-glowCyan text-white text-xs font-bold transition-colors"
                      >
                        Publish Research details
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. USERS MANAGER */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <h2 className="text-sm font-extrabold uppercase text-slate-400">Student & Faculty registry Accounts</h2>
              
              <div className="rounded-2xl border border-slate-200 dark:border-brand-darkBorder bg-white dark:bg-brand-darkCard overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-brand-darkBg/60 text-slate-400 font-bold border-b border-slate-200 dark:border-brand-darkBorder">
                        <th className="p-4">Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Active Role</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-brand-darkBorder">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-brand-darkBg/20">
                          <td className="p-4 font-bold text-brand-deepBlue dark:text-white">{u.name}</td>
                          <td className="p-4 text-slate-500 dark:text-slate-400">{u.email}</td>
                          <td className="p-4">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              u.role === 'admin' ? 'bg-red-100 text-red-700' : u.role === 'faculty' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <select
                              value={u.role}
                              onChange={e => changeUserRole(u.id, e.target.value)}
                              className="h-7 px-2 rounded border border-slate-200 dark:border-brand-darkBorder bg-white dark:bg-brand-darkBg text-[11px] font-bold text-slate-700 dark:text-slate-350 focus:outline-none"
                            >
                              <option value="student">Student</option>
                              <option value="faculty">Faculty</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 6. CONTACT MESSAGES */}
          {activeTab === 'contacts' && (
            <div className="space-y-6">
              <h2 className="text-sm font-extrabold uppercase text-slate-400">Admissions & Query Inbox</h2>
              
              <div className="space-y-4">
                {contacts.map(c => (
                  <div key={c.id} className="p-6 rounded-2xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-[11px] font-bold text-slate-405 block">FROM: {c.name} ({c.email})</span>
                        <h4 className="text-xs font-extrabold text-brand-deepBlue dark:text-white mt-1">SUBJ: {c.subject || 'Admissions Enquiry'}</h4>
                      </div>
                      <button
                        onClick={() => toggleContactResolved(c.id, c.isResolved)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                          c.isResolved
                            ? 'bg-green-100 border-green-200 text-green-700'
                            : 'bg-slate-100 border-slate-200 text-slate-500 dark:bg-brand-darkBg dark:border-slate-800'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {c.isResolved ? 'Resolved' : 'Mark Resolved'}
                      </button>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-brand-darkBg/50 p-4 rounded-xl border border-slate-100 dark:border-brand-darkBorder/30 whitespace-pre-line font-medium leading-relaxed">
                      {c.message}
                    </p>
                  </div>
                ))}
                {contacts.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">No enquiries received in inbox.</p>
                )}
              </div>
            </div>
            )}
          </div>
        </div>

        <div className="fs-footer">
          ForenSecure · Admin Portal
        </div>
      </div>
    </>
  );
}
