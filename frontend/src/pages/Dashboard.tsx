import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import MfaSettings from '../components/MfaSettings';
import { parseVideoUrl, PROVIDER_LABEL } from '../lib/videoEmbed';
import RichTextEditor from '../components/RichTextEditor';
import LectureCalendar from '../components/LectureCalendar';
import CourseThumbnail from '../components/CourseThumbnail';
import CourseStatusBadge from '../components/CourseStatusBadge';
import { courseStatus } from '../lib/courseStatus';
import {
  BookOpen, Award, FileText, CheckCircle, ChevronRight, User, GraduationCap,
  Plus, Trash2, Eye, Check, Edit2, AlertCircle, FileCode, Video, FileCheck,
  ArrowLeft, Users, Settings, PlusCircle, Star, Save, Calendar, DollarSign,
  Megaphone, ShieldAlert, Key, Globe, Shield, ShieldCheck, RefreshCw, Send, Clipboard, ToggleLeft, Link2, Sliders,
  Upload, Paperclip, Folder
} from 'lucide-react';

// Small file picker used for lecture videos, documents and study material
function FileUploadButton({ label, accept, busy, onPick }: { label: string; accept: string; busy: boolean; onPick: (file: File) => void }) {
  return (
    <label className={`px-2.5 py-1 rounded text-[10px] font-bold border border-slate-202 dark:border-brand-darkBorder flex items-center gap-1 whitespace-nowrap ${busy ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:bg-slate-100 dark:hover:bg-brand-darkBg'} text-slate-655 dark:text-slate-350`}>
      <Upload className="w-3 h-3" /> {busy ? 'Uploading...' : label}
      <input
        type="file"
        accept={accept}
        className="hidden"
        disabled={busy}
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
          e.target.value = '';
        }}
      />
    </label>
  );
}

export default function Dashboard() {
  const { user, token, isAuthenticated, isLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // Navigation State
  const [activeTab, setActiveTab] = useState<'my-courses' | 'builder' | 'seminars' | 'blogs' | 'revenue' | 'grading'>('my-courses');
  const [adminActiveTab, setAdminActiveTab] = useState<'users' | 'invite' | 'matrix' | 'dropdowns'>('users');
  const [adminPortalMode, setAdminPortalMode] = useState<'system' | 'instructor'>('system');
  
  // Data State
  const [courses, setCourses] = useState<any[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [seminars, setSeminars] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  
  // Admin Data State
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [accessMatrix, setAccessMatrix] = useState<any[]>([]);
  const [matrixLoading, setMatrixLoading] = useState(false);

  // Dynamic Dropdowns & Relations State
  const [dropdowns, setDropdowns] = useState<any[]>([]);
  const [dropdownsLoading, setDropdownsLoading] = useState(false);
  const [ddCategory, setDdCategory] = useState('Course Categories');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  const [ddLabel, setDdLabel] = useState('');
  const [ddValue, setDdValue] = useState('');

  const [ddRelatedTo, setDdRelatedTo] = useState('');
  const [isCustomRelation, setIsCustomRelation] = useState(false);
  const [customRelation, setCustomRelation] = useState('');

  const [ddSubmitting, setDdSubmitting] = useState(false);
  const [ddSuccess, setDdSuccess] = useState('');
  const [ddError, setDdError] = useState('');

  // Invite Form State
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('teacher');
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState('');
  const [inviteMagicLink, setInviteMagicLink] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);

  // Grading View State
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [gradingStudent, setGradingStudent] = useState<any | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<any | null>(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [gradeSubmitting, setGradeSubmitting] = useState(false);

  // Course Builder Form State
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [courseCategory, setCourseCategory] = useState('Digital Forensics');
  const [courseDifficulty, setCourseDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [courseType, setCourseType] = useState<'recorded' | 'live'>('recorded');
  const [courseStartDate, setCourseStartDate] = useState('');
  const [courseEndDate, setCourseEndDate] = useState('');
  const [courseThumbnail, setCourseThumbnail] = useState('');
  const [courseFormat, setCourseFormat] = useState<'course' | 'diploma'>('course');
  const [courseDuration, setCourseDuration] = useState('8');
  const [coursePrice, setCoursePrice] = useState('4999');
  const [targetPct, setTargetPct] = useState('60');
  const [builderTopics, setBuilderTopics] = useState<any[]>([]);
  const [builderError, setBuilderError] = useState('');
  const [builderSuccess, setBuilderSuccess] = useState('');
  const [builderSubmitting, setBuilderSubmitting] = useState(false);
  const [draftCourseId, setDraftCourseId] = useState('');
  const [savingTopicIdx, setSavingTopicIdx] = useState<number | null>(null);
  const [savedTopicIdx, setSavedTopicIdx] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [uploadingKey, setUploadingKey] = useState('');

  // Seminar Scheduler Form State
  const [seminarTitle, setSeminarTitle] = useState('');
  const [seminarDesc, setSeminarDesc] = useState('');
  const [seminarDate, setSeminarDate] = useState('');
  const [seminarDuration, setSeminarDuration] = useState('60');
  const [seminarLink, setSeminarLink] = useState('https://meet.google.com/abc-defg-hij');
  const [seminarLimit, setSeminarLimit] = useState('50');
  const [seminarCourseId, setSeminarCourseId] = useState('');
  const [seminarError, setSeminarError] = useState('');
  const [seminarSuccess, setSeminarSuccess] = useState('');
  const [seminarSubmitting, setSeminarSubmitting] = useState(false);

  // Blog Publisher Form State
  const [blogTitle, setBlogTitle] = useState('');
  const [blogCategory, setBlogCategory] = useState('Incident Response');
  const [blogContent, setBlogContent] = useState('');
  const [blogTags, setBlogTags] = useState('');
  const [blogReadTime, setBlogReadTime] = useState('5');
  const [blogError, setBlogError] = useState('');
  const [blogSuccess, setBlogSuccess] = useState('');
  const [blogSubmitting, setBlogSubmitting] = useState(false);

  const upcomingSeminars = seminars
    .filter(s => new Date(s.date).getTime() >= Date.now())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Admin Portal user modify state
  const [updatingUserId, setUpdatingUserId] = useState('');
  const [newRoleInput, setNewRoleInput] = useState('student');

  // Load teacher's courses
  const fetchTeacherCourses = async () => {
    if (!token) return;
    setCoursesLoading(true);
    try {
      const res = await fetch('/api/courses?adminView=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCoursesLoading(false);
    }
  };

  // Load seminars
  const fetchSeminars = async () => {
    try {
      const res = await fetch('/api/seminars');
      if (res.ok) {
        const data = await res.json();
        setSeminars(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load blogs
  const fetchBlogs = async () => {
    try {
      const res = await fetch('/api/blogs');
      if (res.ok) {
        const data = await res.json();
        setBlogs(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load admin user list
  const fetchAdminUsers = async () => {
    if (!token || user?.role !== 'admin') return;
    setAdminLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminUsers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdminLoading(false);
    }
  };

  // Load access control matrix
  const fetchAccessMatrix = async () => {
    if (!token || user?.role !== 'admin') return;
    setMatrixLoading(true);
    try {
      const res = await fetch('/api/admin/access-matrix', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAccessMatrix(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMatrixLoading(false);
    }
  };

  // Load dropdown options & relations
  const fetchDropdowns = async () => {
    setDropdownsLoading(true);
    try {
      const res = await fetch('/api/admin/dropdowns');
      if (res.ok) {
        const data = await res.json();
        setDropdowns(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDropdownsLoading(false);
    }
  };

  const handleCreateDropdown = async (e: React.FormEvent) => {
    e.preventDefault();
    setDdError('');
    setDdSuccess('');

    const finalCategory = isCustomCategory ? customCategory.trim() : ddCategory;
    const finalRelatedTo = isCustomRelation ? customRelation.trim() : ddRelatedTo;

    if (!finalCategory || !ddLabel || !ddValue) {
      setDdError('Category group, label, and internal value are required.');
      return;
    }
    setDdSubmitting(true);
    try {
      const res = await fetch('/api/admin/dropdowns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          category: finalCategory,
          label: ddLabel,
          value: ddValue,
          relatedTo: finalRelatedTo
        })
      });
      if (res.ok) {
        setDdSuccess(`Dropdown item "${ddLabel}" with relation added successfully!`);
        setDdLabel('');
        setDdValue('');
        setCustomCategory('');
        setCustomRelation('');
        setIsCustomCategory(false);
        setIsCustomRelation(false);
        fetchDropdowns();
      } else {
        const d = await res.json();
        setDdError(d.message || 'Failed to create item.');
      }
    } catch (err) {
      setDdError('Server error creating item.');
    } finally {
      setDdSubmitting(false);
    }
  };

  const handleDeleteDropdown = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/dropdowns/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchDropdowns();
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    } else if (user) {
      fetchSeminars();
      fetchBlogs();
      fetchDropdowns();
      if (user.role === 'teacher' || user.role === 'admin' || user.role === 'faculty') {
        fetchTeacherCourses();
      }
      if (user.role === 'admin') {
        fetchAdminUsers();
        fetchAccessMatrix();
      }
    }
  }, [isAuthenticated, isLoading, navigate, user]);

  // Register for seminar
  const handleRegisterSeminar = async (seminarId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/seminars/${seminarId}/register`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Registered successfully for the live seminar!');
        fetchSeminars();
      }
    } catch (err) {
      alert('Error registering for seminar.');
    }
  };

  // Load students for grading
  const fetchCourseStudents = async (courseId: string) => {
    if (!token) return;
    setStudentsLoading(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleSelectCourseForGrading = (course: any) => {
    setSelectedCourse(course);
    fetchCourseStudents(course.id);
    setActiveTab('grading');
  };

  // Submit Grade Handler
  const handleSubmitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !gradingStudent || !gradingSubmission || !gradeInput) return;
    
    setGradeSubmitting(true);
    try {
      const res = await fetch(`/api/courses/${selectedCourse.id}/submissions/${gradingStudent.id}/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          topicTitle: gradingSubmission.topicTitle,
          subTopicTitle: gradingSubmission.subTopicTitle,
          assignmentTitle: gradingSubmission.assignmentTitle,
          grade: Number(gradeInput),
          feedback: feedbackInput
        })
      });

      if (res.ok) {
        await fetchCourseStudents(selectedCourse.id);
        setGradingStudent(null);
        setGradingSubmission(null);
        setGradeInput('');
        setFeedbackInput('');
        alert('Grade submitted successfully!');
      } else {
        alert('Failed to submit grade.');
      }
    } catch (err) {
      alert('Error submitting grade.');
    } finally {
      setGradeSubmitting(false);
    }
  };

  // Course Builder Helpers
  const addTopic = () => {
    setBuilderTopics([...builderTopics, { title: '', subTopics: [] }]);
  };

  const removeTopic = (tIdx: number) => {
    setBuilderTopics(builderTopics.filter((_, idx) => idx !== tIdx));
  };

  const updateTopicTitle = (tIdx: number, val: string) => {
    const updated = [...builderTopics];
    updated[tIdx].title = val;
    setBuilderTopics(updated);
  };

  const addSubTopic = (tIdx: number) => {
    const updated = [...builderTopics];
    updated[tIdx].subTopics.push({
      title: '',
      richTextContent: '',
      videoUrl: '',
      documentUrl: '',
      documentName: '',
      resources: [],
      quizTimeLimit: 15,
      quizNegativeMarking: false,
      quizAttemptsAllowed: 3,
      quizQuestions: [],
      assignment: { title: '', instructionsHtml: '', required: true }
    });
    setBuilderTopics(updated);
  };

  const removeSubTopic = (tIdx: number, sIdx: number) => {
    const updated = [...builderTopics];
    updated[tIdx].subTopics = updated[tIdx].subTopics.filter((_: any, idx: number) => idx !== sIdx);
    setBuilderTopics(updated);
  };

  const updateSubTopic = (tIdx: number, sIdx: number, key: string, val: any) => {
    const updated = [...builderTopics];
    updated[tIdx].subTopics[sIdx][key] = val;
    setBuilderTopics(updated);
  };

  const updateSubTopicAssignment = (tIdx: number, sIdx: number, key: string, val: any) => {
    const updated = [...builderTopics];
    if (!updated[tIdx].subTopics[sIdx].assignment) {
      updated[tIdx].subTopics[sIdx].assignment = { title: '', instructionsHtml: '', required: true };
    }
    updated[tIdx].subTopics[sIdx].assignment[key] = val;
    setBuilderTopics(updated);
  };

  const addQuizQuestion = (tIdx: number, sIdx: number) => {
    const updated = [...builderTopics];
    updated[tIdx].subTopics[sIdx].quizQuestions.push({
      questionText: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0,
      explanation: ''
    });
    setBuilderTopics(updated);
  };

  const removeQuizQuestion = (tIdx: number, sIdx: number, qIdx: number) => {
    const updated = [...builderTopics];
    updated[tIdx].subTopics[sIdx].quizQuestions = updated[tIdx].subTopics[sIdx].quizQuestions.filter((_: any, idx: number) => idx !== qIdx);
    setBuilderTopics(updated);
  };

  const updateQuizQuestion = (tIdx: number, sIdx: number, qIdx: number, key: string, val: any) => {
    const updated = [...builderTopics];
    updated[tIdx].subTopics[sIdx].quizQuestions[qIdx][key] = val;
    setBuilderTopics(updated);
  };

  const updateQuizOption = (tIdx: number, sIdx: number, qIdx: number, oIdx: number, val: string) => {
    const updated = [...builderTopics];
    updated[tIdx].subTopics[sIdx].quizQuestions[qIdx].options[oIdx] = val;
    setBuilderTopics(updated);
  };

  // Study material (downloadable resources) helpers
  const addResource = (tIdx: number, sIdx: number) => {
    const updated = [...builderTopics];
    const sub = updated[tIdx].subTopics[sIdx];
    if (!sub.resources) sub.resources = [];
    sub.resources.push({ name: '', url: '', type: 'PDF', isDownloadable: true });
    setBuilderTopics(updated);
  };

  const updateResource = (tIdx: number, sIdx: number, rIdx: number, key: string, val: any) => {
    const updated = [...builderTopics];
    updated[tIdx].subTopics[sIdx].resources[rIdx][key] = val;
    setBuilderTopics(updated);
  };

  const removeResource = (tIdx: number, sIdx: number, rIdx: number) => {
    const updated = [...builderTopics];
    updated[tIdx].subTopics[sIdx].resources = updated[tIdx].subTopics[sIdx].resources.filter((_: any, idx: number) => idx !== rIdx);
    setBuilderTopics(updated);
  };

  // Upload a file to the media store, returns { url, name }
  const uploadFile = async (file: File, key: string): Promise<{ url: string; name: string } | null> => {
    setBuilderError('');
    setUploadingKey(key);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/uploads', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: form
      });
      const data = await res.json();
      if (!res.ok) {
        setBuilderError(data.message || 'File upload failed.');
        return null;
      }
      return data;
    } catch (err) {
      setBuilderError('Connection error while uploading file.');
      return null;
    } finally {
      setUploadingKey('');
    }
  };

  // Persist the builder state — creates the course on first save, updates it afterwards
  const saveCourseDraft = async (): Promise<any | null> => {
    if (!courseTitle || !courseDesc || !coursePrice) {
      setBuilderError('Course Title, Description, and Tuition Price are required before saving.');
      return null;
    }
    if (courseType === 'live' && !courseStartDate) {
      setBuilderError('A live course needs a start date.');
      return null;
    }
    if (courseType === 'live' && courseEndDate && courseEndDate < courseStartDate) {
      setBuilderError('The end date must be on or after the start date.');
      return null;
    }

    const isUpdate = Boolean(draftCourseId);
    const res = await fetch(isUpdate ? `/api/courses/${draftCourseId}` : '/api/courses', {
      method: isUpdate ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: courseTitle,
        description: courseDesc,
        category: courseCategory,
        difficulty: courseDifficulty,
        courseType,
        format: courseFormat,
        startDate: courseType === 'live' ? courseStartDate : '',
        endDate: courseType === 'live' ? courseEndDate : '',
        thumbnailUrl: courseThumbnail,
        durationWeeks: Number(courseDuration),
        priceINR: Number(coursePrice),
        targetPercentage: Number(targetPct),
        syllabus: builderTopics.map(t => t.title),
        features: ['Direct Instructor Support', 'Self-paced Reading Modules', 'Topic Assessments & Assignments'],
        topics: builderTopics
      })
    });

    const data = await res.json();
    if (!res.ok) {
      setBuilderError(data.message || 'Failed to save course.');
      return null;
    }
    setDraftCourseId(data.course.id);
    return data.course;
  };

  // Save a single topic module without leaving the builder
  const handleSaveModule = async (tIdx: number) => {
    setBuilderError('');
    setBuilderSuccess('');
    setSavedTopicIdx(null);
    setSavingTopicIdx(tIdx);
    try {
      const course = await saveCourseDraft();
      if (course) {
        setSavedTopicIdx(tIdx);
        setBuilderSuccess(`Module "${builderTopics[tIdx].title || `Topic #${tIdx + 1}`}" saved.`);
        await fetchTeacherCourses();
      }
    } catch (err) {
      setBuilderError('Connection error saving module.');
    } finally {
      setSavingTopicIdx(null);
    }
  };

  // Save, then open the real student course player in preview mode
  const handlePreviewAsStudent = async () => {
    setBuilderError('');
    setBuilderSuccess('');
    setPreviewLoading(true);
    try {
      const course = await saveCourseDraft();
      if (course) {
        await fetchTeacherCourses();
        window.open(`/courses/${course.slug}?preview=1`, '_blank');
      }
    } catch (err) {
      setBuilderError('Connection error opening preview.');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Submit New Course
  const handleCreateCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBuilderError('');
    setBuilderSuccess('');
    setBuilderSubmitting(true);
    try {
      const course = await saveCourseDraft();
      if (course) {
        setBuilderSuccess('Course module published successfully!');
        setCourseTitle('');
        setCourseDesc('');
        setCoursePrice('4999');
        setBuilderTopics([]);
        setCourseType('recorded');
        setCourseStartDate('');
        setCourseEndDate('');
        setCourseThumbnail('');
        setCourseFormat('course');
        setDraftCourseId('');
        await fetchTeacherCourses();
        setActiveTab('my-courses');
      }
    } catch (err) {
      setBuilderError('Connection error creating course module.');
    } finally {
      setBuilderSubmitting(false);
    }
  };

  // Submit Live Seminar
  const handleScheduleSeminar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSeminarError('');
    setSeminarSuccess('');
    setSeminarSubmitting(true);
    try {
      const res = await fetch('/api/seminars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: seminarTitle,
          description: seminarDesc,
          date: seminarDate,
          durationMinutes: Number(seminarDuration),
          link: seminarLink,
          maxParticipants: Number(seminarLimit),
          courseId: seminarCourseId,
          courseTitle: courses.find(c => c.id === seminarCourseId)?.title || ''
        })
      });
      if (res.ok) {
        setSeminarSuccess('Live seminar scheduled successfully!');
        setSeminarTitle('');
        setSeminarDesc('');
        setSeminarDate('');
        fetchSeminars();
      } else {
        setSeminarError('Failed to schedule seminar.');
      }
    } catch (err) {
      setSeminarError('Server error scheduling seminar.');
    } finally {
      setSeminarSubmitting(false);
    }
  };

  // Submit Blog Article
  const handlePublishBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlogError('');
    setBlogSuccess('');
    // The rich text editor is not a form control, so the browser cannot enforce `required` on it.
    if (!blogContent.replace(/<[^>]*>/g, '').trim()) {
      setBlogError('Article content is required.');
      return;
    }
    setBlogSubmitting(true);
    try {
      const res = await fetch('/api/blogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: blogTitle,
          content: blogContent,
          category: blogCategory,
          tags: blogTags.split(',').map(t => t.trim()),
          readTimeMinutes: Number(blogReadTime)
        })
      });
      if (res.ok) {
        setBlogSuccess('Blog article published successfully!');
        setBlogTitle('');
        setBlogContent('');
        setBlogTags('');
        fetchBlogs();
      } else {
        setBlogError('Failed to publish article.');
      }
    } catch (err) {
      setBlogError('Server error publishing blog.');
    } finally {
      setBlogSubmitting(false);
    }
  };

  // Admin user role update
  const handleUpdateUserRole = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRoleInput })
      });
      if (res.ok) {
        alert('User permission level updated!');
        fetchAdminUsers();
        setUpdatingUserId('');
      } else {
        alert('Error updating role.');
      }
    } catch (err) {
      alert('Connection error updating user role.');
    }
  };

  // Admin Invite User Submit
  const handleInviteUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccessMsg('');
    setInviteMagicLink('');
    setInviteSubmitting(true);

    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: inviteName, email: inviteEmail, role: inviteRole })
      });
      const data = await res.json();
      if (res.ok) {
        setInviteSuccessMsg('Staff member invited successfully!');
        setInviteMagicLink(data.resetLink);
        setInviteName('');
        setInviteEmail('');
        fetchAdminUsers();
      } else {
        setInviteError(data.message || 'Invitation failed.');
      }
    } catch (err) {
      setInviteError('Connection error inviting staff.');
    } finally {
      setInviteSubmitting(false);
    }
  };

  // Admin Access Matrix cell toggle
  const handleToggleMatrixCell = (role: string, feature: string, permissionKey: 'create' | 'read' | 'update') => {
    const updated = accessMatrix.map(item => {
      if (item.role === role && item.feature === feature) {
        return {
          ...item,
          [permissionKey]: !item[permissionKey]
        };
      }
      return item;
    });
    setAccessMatrix(updated);
  };

  // Admin Access Matrix Save
  const handleSaveAccessMatrix = async () => {
    try {
      const res = await fetch('/api/admin/access-matrix', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ updates: accessMatrix })
      });
      if (res.ok) {
        alert('LMS Access Matrix configured successfully!');
        fetchAccessMatrix();
      } else {
        alert('Failed to update Access Matrix.');
      }
    } catch (err) {
      alert('Connection error saving Access Matrix.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-brand-darkBg">
        <div className="w-10 h-10 border-4 border-brand-glowCyan border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return null;

  // RENDER ADMIN PORTAL (System Management View)
  if (user.role === 'admin' && adminPortalMode === 'system') {
    return (
      <>
        <SEO title="System Administrator Dashboard" description="Configure registry security parameters, moderate reviews, and modify instructor/student permission access." canonicalPath="/dashboard" />
        <div className="min-h-screen pt-8 pb-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-brand-darkBg transition-colors duration-300">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {!user.mfaEnabled && (
              <div className="p-4 rounded-3xl bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-250 dark:border-yellow-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs shadow-sm text-slate-800">
                <div className="space-y-1">
                  <p className="font-extrabold text-yellow-800 dark:text-yellow-450 uppercase tracking-wider flex items-center gap-1.5">
                    Security Warning: 2FA Disabled
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">
                    Two-Factor Authentication is currently disabled. Protect your administrative credentials by enabling TOTP authentication.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/profile')}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-bold uppercase tracking-wider whitespace-nowrap"
                >
                  Enable 2FA
                </button>
              </div>
            )}

            {/* Header */}
            <div className="p-6 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-red-500/5 pointer-events-none"></div>
              <div className="flex items-center gap-4 z-10">
                <div className="w-12 h-12 rounded-2xl bg-red-650 text-white flex items-center justify-center font-bold text-lg shadow-md">
                  A
                </div>
                <div>
                  <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest block">System Registry Root</span>
                  <h1 className="text-xl font-extrabold text-brand-deepBlue dark:text-white mt-0.5">{user.name}</h1>
                </div>
              </div>

              {/* Mode & Navigation Tabs */}
              <div className="flex flex-wrap gap-2 items-center z-10">
                <button
                  onClick={() => setAdminPortalMode('instructor')}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-deepBlue to-brand-glowBlue hover:from-brand-glowBlue hover:to-brand-glowCyan text-white text-xs font-bold flex items-center gap-1.5 transition-all duration-300 shadow-sm"
                >
                  <BookOpen className="w-3.5 h-3.5 text-brand-glowCyan" /> Instructor Workspace (Courses & Quizzes)
                </button>
                <div className="flex gap-1 bg-slate-100 dark:bg-brand-darkBg p-1 rounded-xl w-full sm:w-auto font-bold text-xs">
                  <button
                    onClick={() => setAdminActiveTab('users')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      adminActiveTab === 'users' ? 'bg-white dark:bg-brand-darkCard text-slate-800 dark:text-white shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    User Matrix
                  </button>
                  <button
                    onClick={() => setAdminActiveTab('invite')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      adminActiveTab === 'invite' ? 'bg-white dark:bg-brand-darkCard text-slate-800 dark:text-white shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Invite Staff
                  </button>
                  <button
                    onClick={() => setAdminActiveTab('matrix')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      adminActiveTab === 'matrix' ? 'bg-white dark:bg-brand-darkCard text-slate-800 dark:text-white shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Access Matrix
                  </button>
                  <button
                    onClick={() => setAdminActiveTab('dropdowns')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      adminActiveTab === 'dropdowns' ? 'bg-white dark:bg-brand-darkCard text-slate-800 dark:text-white shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Dropdowns & Relations
                  </button>
                </div>
              </div>
            </div>

            {/* TAB: USERS REGISTRY MATRIX */}
            {adminActiveTab === 'users' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6 bg-white dark:bg-brand-darkCard p-6 rounded-3xl border border-slate-200 dark:border-brand-darkBorder shadow-sm">
                  <h2 className="text-xs uppercase font-extrabold tracking-widest text-slate-400 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-red-500" /> User Registry Access Matrix
                  </h2>
                  {adminLoading ? (
                    <div className="text-center py-6">
                      <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <span className="text-xs text-slate-400">Loading registry...</span>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-200">
                            <th className="p-3">User Details</th>
                            <th className="p-3">Role</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminUsers.map(u => (
                            <tr key={u.id} className="border-b border-slate-100 text-xs text-slate-700 hover:bg-slate-50/50">
                              <td className="p-3">
                                <span className="font-bold text-brand-deepBlue block">{u.name}</span>
                                <span className="text-[11px] text-slate-400 block">{u.email}</span>
                              </td>
                              <td className="p-3 font-semibold capitalize">{u.role}</td>
                              <td className="p-3 text-right">
                                {updatingUserId === u.id ? (
                                  <div className="flex items-center gap-1.5 justify-end">
                                    <select
                                      value={newRoleInput}
                                      onChange={e => setNewRoleInput(e.target.value)}
                                      className="h-7 px-1.5 border border-slate-200 rounded text-xs"
                                    >
                                      <option value="student">Student</option>
                                      <option value="teacher">Teacher</option>
                                      <option value="admin">Admin</option>
                                    </select>
                                    <button
                                      onClick={() => handleUpdateUserRole(u.id)}
                                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-bold"
                                    >
                                      Save
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => { setUpdatingUserId(u.id); setNewRoleInput(u.role); }}
                                    className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 text-[11px] rounded font-bold"
                                  >
                                    Modify
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* System state status */}
                <div className="bg-white dark:bg-brand-darkCard p-6 rounded-3xl border border-slate-200 dark:border-brand-darkBorder space-y-4">
                  <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-400">Database Status</h3>
                  <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-2 text-xs">
                    <span className="font-bold text-emerald-700 block">Persistent Database Required</span>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Accounts, permissions, courses, and assessments are stored in PostgreSQL. The API stops if database connectivity fails.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: INVITE SUB-ADMINS & TEACHERS */}
            {adminActiveTab === 'invite' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <form onSubmit={handleInviteUserSubmit} className="lg:col-span-7 bg-white dark:bg-brand-darkCard p-6 rounded-3xl border border-slate-200 dark:border-brand-darkBorder space-y-4 shadow-sm">
                  <h3 className="text-sm font-extrabold text-brand-deepBlue dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-red-500" /> Send Staff Setup Invitation
                  </h3>
                  <p className="text-xs text-slate-400">Teachers and sub-admins cannot register themselves. Generate a secure setup token to invite them.</p>

                  {inviteError && <div className="p-3 bg-red-100 border border-red-200 text-red-700 text-xs rounded">{inviteError}</div>}
                  {inviteSuccessMsg && <div className="p-3 bg-green-100 border border-green-200 text-green-700 text-xs rounded">{inviteSuccessMsg}</div>}

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={inviteName}
                      onChange={e => setInviteName(e.target.value)}
                      placeholder="e.g. Prof. Sarah Connor"
                      className="w-full h-9 px-3 rounded-lg text-xs bg-slate-50 border border-slate-200 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      placeholder="s.connor@forensecure.edu.in"
                      className="w-full h-9 px-3 rounded-lg text-xs bg-slate-50 border border-slate-200 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Authorized Permission Role</label>
                    <select
                      value={inviteRole}
                      onChange={e => setInviteRole(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg text-xs bg-slate-50 border border-slate-200 text-slate-700"
                    >
                      <option value="teacher">Instructor / Teacher</option>
                      <option value="admin">Sub-Administrator</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={inviteSubmitting}
                    className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white text-xs font-bold rounded-lg disabled:opacity-50"
                  >
                    {inviteSubmitting ? 'Generating...' : 'Invite User'}
                  </button>
                </form>

                {inviteMagicLink && (
                  <div className="lg:col-span-5 bg-white dark:bg-brand-darkCard p-6 rounded-3xl border border-green-200 bg-green-50/30 space-y-4">
                    <h4 className="text-xs font-extrabold text-green-700 uppercase tracking-widest flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" /> Setup Magic Link Generated
                    </h4>
                    <p className="text-xs text-slate-500 leading-normal">
                      An invitation token has been created. Copy this URL to set up the credentials locally:
                    </p>

                    <div className="p-3 border border-slate-200 bg-white rounded-xl select-all font-mono text-[10px] break-all leading-normal text-slate-800">
                      {inviteMagicLink}
                    </div>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(inviteMagicLink);
                        alert('Magic link copied to clipboard!');
                      }}
                      className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5"
                    >
                      <Clipboard className="w-4 h-4" /> Copy Link
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB: DATABASE ACCESS CONTROL MATRIX EDITOR */}
            {adminActiveTab === 'matrix' && (
              <div className="bg-white dark:bg-brand-darkCard p-6 rounded-3xl border border-slate-200 dark:border-brand-darkBorder shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-extrabold text-brand-deepBlue dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <ToggleLeft className="w-4 h-4 text-red-500" /> LMS Feature Access Permissions Matrix
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Toggle CRUD operations by page and role permissions directly inside the database.</p>
                  </div>
                  <button
                    onClick={handleSaveAccessMatrix}
                    className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" /> Save Permission matrix
                  </button>
                </div>

                {matrixLoading ? (
                  <div className="text-center py-6">
                    <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <span className="text-xs text-slate-400">Loading access matrix...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-bold text-slate-405 uppercase border-b border-slate-200">
                          <th className="p-3">User Role</th>
                          <th className="p-3">LMS Page / Feature Name</th>
                          <th className="p-3 text-center">CREATE</th>
                          <th className="p-3 text-center">READ</th>
                          <th className="p-3 text-center">UPDATE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accessMatrix.map((item, idx) => (
                          <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="p-3 font-bold text-brand-deepBlue capitalize">{item.role}</td>
                            <td className="p-3 font-mono text-[11px] text-slate-500">{item.feature}</td>
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={item.create}
                                onChange={() => handleToggleMatrixCell(item.role, item.feature, 'create')}
                                className="h-4 w-4 text-red-650 border-slate-300 rounded focus:ring-red-500"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={item.read}
                                onChange={() => handleToggleMatrixCell(item.role, item.feature, 'read')}
                                className="h-4 w-4 text-red-650 border-slate-300 rounded focus:ring-red-500"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={item.update}
                                onChange={() => handleToggleMatrixCell(item.role, item.feature, 'update')}
                                className="h-4 w-4 text-red-650 border-slate-300 rounded focus:ring-red-500"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB: DROPDOWNS & RELATIONS MANAGER */}
            {adminActiveTab === 'dropdowns' && (() => {
              const existingCategories = Array.from(new Set(dropdowns.map((d: any) => d.category))).filter(Boolean);
              const defaultCategoryPresets = ['Course Categories', 'Difficulty Levels', 'Program Types', 'Departments', 'Research Categories'];
              const categoryOptions = Array.from(new Set([...defaultCategoryPresets, ...existingCategories]));
              const existingRelations = Array.from(new Set(dropdowns.map((d: any) => d.value || d.label))).filter(Boolean);

              return (
                <div className="space-y-8">
                  {/* Form to add item with relation */}
                  <form onSubmit={handleCreateDropdown} className="bg-white dark:bg-brand-darkCard p-6 rounded-3xl border border-slate-200 dark:border-brand-darkBorder shadow-sm space-y-4">
                    <h3 className="text-sm font-extrabold text-brand-deepBlue dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-red-500" /> Manage Dynamic Dropdown Items &amp; Linked Relations
                    </h3>
                    <p className="text-xs text-slate-400">Configure dropdown options (e.g. Course Categories, Difficulty Levels, Departments) and define parent/linked relations.</p>

                    {ddError && <div className="p-3 bg-red-100 border border-red-200 text-red-700 text-xs rounded">{ddError}</div>}
                    {ddSuccess && <div className="p-3 bg-green-100 border border-green-200 text-green-700 text-xs rounded">{ddSuccess}</div>}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Dropdown Group / Category</label>
                        <select
                          value={isCustomCategory ? '__CUSTOM__' : ddCategory}
                          onChange={e => {
                            if (e.target.value === '__CUSTOM__') {
                              setIsCustomCategory(true);
                            } else {
                              setIsCustomCategory(false);
                              setDdCategory(e.target.value);
                            }
                          }}
                          className="w-full h-9 px-3 rounded-lg text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-200 text-slate-800 dark:text-white font-medium"
                        >
                          {categoryOptions.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                          <option value="__CUSTOM__">+ Type New Category...</option>
                        </select>
                        {isCustomCategory && (
                          <input
                            type="text"
                            required
                            value={customCategory}
                            onChange={e => setCustomCategory(e.target.value)}
                            placeholder="e.g. Lab Equipment Types"
                            className="w-full h-9 px-3 rounded-lg text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-200 text-slate-800 dark:text-white mt-1.5 font-medium"
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Option Display Label</label>
                        <input
                          type="text"
                          required
                          value={ddLabel}
                          onChange={e => {
                            setDdLabel(e.target.value);
                            setDdValue(e.target.value);
                          }}
                          placeholder="e.g. Cloud Security Forensics"
                          className="w-full h-9 px-3 rounded-lg text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-200 text-slate-800 dark:text-white font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Option Internal Value</label>
                        <input
                          type="text"
                          required
                          value={ddValue}
                          onChange={e => setDdValue(e.target.value)}
                          placeholder="e.g. Cloud Security Forensics"
                          className="w-full h-9 px-3 rounded-lg text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-200 text-slate-800 dark:text-white font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Linked Relation / Parent</label>
                        <select
                          value={isCustomRelation ? '__CUSTOM__' : ddRelatedTo}
                          onChange={e => {
                            if (e.target.value === '__CUSTOM__') {
                              setIsCustomRelation(true);
                            } else {
                              setIsCustomRelation(false);
                              setDdRelatedTo(e.target.value);
                            }
                          }}
                          className="w-full h-9 px-3 rounded-lg text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-200 text-slate-800 dark:text-white font-medium"
                        >
                          <option value="">None (Standalone)</option>
                          {existingRelations.map(rel => (
                            <option key={rel} value={rel}>{rel}</option>
                          ))}
                          <option value="__CUSTOM__">+ Type Custom Relation...</option>
                        </select>
                        {isCustomRelation && (
                          <input
                            type="text"
                            value={customRelation}
                            onChange={e => setCustomRelation(e.target.value)}
                            placeholder="e.g. Cyber Security Dept"
                            className="w-full h-9 px-3 rounded-lg text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-200 text-slate-800 dark:text-white mt-1.5 font-medium"
                          />
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={ddSubmitting}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> {ddSubmitting ? 'Adding...' : 'Add Dropdown Item & Relation'}
                    </button>
                  </form>

                {/* Table listing all options & relations */}
                <div className="bg-white dark:bg-brand-darkCard p-6 rounded-3xl border border-slate-200 dark:border-brand-darkBorder shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-400 flex items-center gap-1.5">
                      <Link2 className="w-4 h-4 text-red-500" /> Active Dropdown Registry & Relation Matrix ({dropdowns.length})
                    </h3>
                  </div>

                  {dropdownsLoading ? (
                    <div className="text-center py-6">
                      <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <span className="text-xs text-slate-400">Loading dropdown items...</span>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-brand-darkBg text-[10px] font-bold text-slate-400 uppercase border-b border-slate-200">
                            <th className="p-3">Category Group</th>
                            <th className="p-3">Option Label</th>
                            <th className="p-3">Option Value</th>
                            <th className="p-3">Linked Relation</th>
                            <th className="p-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dropdowns.map((dd: any) => (
                            <tr key={dd.id} className="border-b border-slate-100 dark:border-brand-darkBorder hover:bg-slate-50/50">
                              <td className="p-3 font-bold text-brand-deepBlue dark:text-white">
                                <span className="px-2 py-0.5 rounded bg-red-50 text-red-600 text-[11px] font-extrabold">{dd.category}</span>
                              </td>
                              <td className="p-3 font-bold text-slate-700 dark:text-slate-200">{dd.label}</td>
                              <td className="p-3 font-mono text-[11px] text-slate-500">{dd.value}</td>
                              <td className="p-3">
                                {dd.relatedTo ? (
                                  <span className="text-[11px] font-semibold text-brand-glowBlue dark:text-brand-glowCyan flex items-center gap-1">
                                    <Link2 className="w-3 h-3" /> {dd.relatedTo}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-400 italic">None</span>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => handleDeleteDropdown(dd.id)}
                                  className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors"
                                  title="Delete item"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          </div>
        </div>
      </>
    );
  }

  // RENDER TEACHER / INSTRUCTOR PORTAL (Visible to teachers, faculty, and admins in instructor mode)
  if (user.role === 'teacher' || user.role === 'faculty' || (user.role === 'admin' && adminPortalMode === 'instructor')) {
    return (
      <>
        <SEO title="Instructor Dashboard" description="Configure course modules, schedule live webinars, publish articles, and grade student submissions." canonicalPath="/dashboard" />
        <div className="relative min-h-screen pt-8 pb-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-brand-darkBg transition-colors duration-300">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {!user.mfaEnabled && (
              <div className="p-4 rounded-3xl bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-250 dark:border-yellow-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs shadow-sm text-slate-800">
                <div className="space-y-1">
                  <p className="font-extrabold text-yellow-800 dark:text-yellow-450 uppercase tracking-wider flex items-center gap-1.5">
                    Security Warning: 2FA Disabled
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">
                    Two-Factor Authentication is currently disabled. Protect your instructor credentials by enabling TOTP authentication.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/profile')}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-bold uppercase tracking-wider whitespace-nowrap"
                >
                  Enable 2FA
                </button>
              </div>
            )}

            {/* Header card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden">
              <div className="absolute inset-0 digital-grid opacity-10 pointer-events-none"></div>
              <div className="flex items-center gap-4 z-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-deepBlue to-brand-glowBlue text-white flex items-center justify-center font-bold text-lg shadow-md">
                  {user.role === 'admin' ? 'A' : 'T'}
                </div>
                <div>
                  <span className="text-[10px] text-brand-glowCyan font-bold uppercase tracking-widest block">
                    {user.role === 'admin' ? 'Authorized System Admin & Instructor' : 'Authorized Instructor'}
                  </span>
                  <h1 className="text-xl font-extrabold text-brand-deepBlue dark:text-white heading-display leading-tight mt-0.5">{user.name}</h1>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex flex-wrap gap-2 items-center z-10">
                {user.role === 'admin' && (
                  <button
                    onClick={() => setAdminPortalMode('system')}
                    className="px-3 py-1.5 bg-red-650 hover:bg-red-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Shield className="w-3.5 h-3.5" /> Return to System Admin
                  </button>
                )}
                <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-brand-darkBg p-1 rounded-xl w-full sm:w-auto">
                  {[
                    { id: 'my-courses', label: 'Programs' },
                    { id: 'builder', label: 'Course Builder' },
                    { id: 'seminars', label: 'Live Calendar' },
                    { id: 'blogs', label: 'Blogs' },
                    { id: 'revenue', label: 'Revenue' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        activeTab === tab.id
                          ? 'bg-white dark:bg-brand-darkCard text-brand-deepBlue dark:text-white shadow-sm'
                          : 'text-slate-505 hover:text-slate-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                  {selectedCourse && (
                    <button
                      onClick={() => setActiveTab('grading')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        activeTab === 'grading'
                          ? 'bg-white dark:bg-brand-darkCard text-brand-deepBlue dark:text-white shadow-sm'
                          : 'text-slate-505 hover:text-slate-800'
                      }`}
                    >
                      Grading Portal
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* TAB CONTENTS */}
            {activeTab === 'my-courses' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm uppercase font-extrabold tracking-widest text-brand-deepBlue dark:text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-brand-glowCyan" />
                    My Created Programs
                  </h2>
                  <button
                    onClick={() => setActiveTab('builder')}
                    className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-brand-deepBlue to-brand-glowBlue hover:from-brand-glowBlue hover:to-brand-glowCyan text-white text-xs font-bold flex items-center gap-1.5 transition-all duration-300"
                  >
                    <PlusCircle className="w-4 h-4" /> Create Course
                  </button>
                </div>

                {coursesLoading ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-2 border-brand-glowCyan border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <span className="text-xs text-slate-405">Loading courses...</span>
                  </div>
                ) : courses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                      <div key={course.id} className="rounded-2xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden">
                        <div className="relative aspect-[16/9] bg-slate-900">
                          <CourseThumbnail src={course.thumbnailUrl} title={course.title} seed={course.slug || course.id} />
                          <div className="absolute top-2 left-2">
                            <CourseStatusBadge status={courseStatus(course)} />
                          </div>
                        </div>

                        <div className="p-5 flex-grow">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-extrabold uppercase bg-brand-glowCyan/10 text-brand-deepBlue dark:text-brand-glowCyan px-2 py-0.5 rounded w-max">
                                {course.category}
                              </span>
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded w-max ${
                                course.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' :
                                course.approvalStatus === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-750'
                              }`}>
                                {course.approvalStatus === 'approved' ? 'Approved' : course.approvalStatus === 'rejected' ? 'Rejected' : 'Pending Approval'}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">₹{course.priceINR?.toLocaleString('en-IN')}</span>
                          </div>
                          <h3 className="text-sm font-extrabold text-brand-deepBlue dark:text-white mt-3 line-clamp-2 leading-snug">
                            {course.title}
                          </h3>
                          {course.courseType === 'live' && course.startDate && (
                            <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(course.startDate).toLocaleDateString()}
                              {course.endDate ? ` – ${new Date(course.endDate).toLocaleDateString()}` : ''}
                            </p>
                          )}
                          <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                            {course.description}
                          </p>
                        </div>

                        <div className="flex justify-between items-center border-t border-slate-100 dark:border-brand-darkBorder px-5 py-3">
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-brand-glowCyan" />
                            {course.studentsCount || 0} Students
                          </span>
                          <button
                            onClick={() => handleSelectCourseForGrading(course)}
                            className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-brand-darkBg dark:hover:bg-brand-darkBorder text-slate-700 dark:text-white text-[11px] font-bold transition-all flex items-center gap-1"
                          >
                            <Settings className="w-3 h-3" /> Track & Grade
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-brand-deepBlue dark:text-white mb-1">No courses created yet</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">Create your first forensic learning module complete with reading materials, video resources, quizzes, and assignments.</p>
                    <button
                      onClick={() => setActiveTab('builder')}
                      className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-brand-darkBg text-xs font-bold text-brand-deepBlue dark:text-white"
                    >
                      Open Course Builder
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB BUILDER */}
            {activeTab === 'builder' && (
              <form onSubmit={handleCreateCourseSubmit} className="space-y-8 bg-white dark:bg-brand-darkCard p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-brand-darkBorder shadow-sm relative">
                <div className="absolute inset-0 digital-grid opacity-10 pointer-events-none"></div>
                <div className="z-10 relative">
                  <h2 className="text-lg font-bold text-brand-deepBlue dark:text-white mb-1">Publish New Course</h2>
                  <p className="text-xs text-slate-400 mb-6">Author syllabus topics, compile MCQs, and draft rich-text assignment worksheets.</p>
                  
                  {builderError && <div className="p-3 mb-4 rounded bg-red-100 border border-red-200 text-red-700 text-xs font-semibold">{builderError}</div>}
                  {builderSuccess && <div className="p-3 mb-4 rounded bg-green-100 border border-green-200 text-green-700 text-xs font-semibold">{builderSuccess}</div>}

                  {/* Core Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Course Title</label>
                      <input
                        type="text"
                        value={courseTitle}
                        onChange={e => setCourseTitle(e.target.value)}
                        placeholder="e.g. Memory Forensics & Malware Artifacts"
                        className="w-full h-9 px-3 rounded-lg text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder text-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Category</label>
                      <select
                        value={courseCategory}
                        onChange={e => setCourseCategory(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder text-slate-700 dark:text-slate-300"
                      >
                        {(dropdowns.filter(d => d.category.toLowerCase().includes('category')).length > 0
                          ? dropdowns.filter(d => d.category.toLowerCase().includes('category'))
                          : [
                              { value: 'Digital Forensics', label: 'Digital Forensics' },
                              { value: 'Physical Investigation', label: 'Physical Investigation' },
                              { value: 'Biometrics', label: 'Biometrics' },
                              { value: 'Cyber Law', label: 'Cyber Law' }
                            ]
                        ).map((catOpt: any, idx: number) => (
                          <option key={idx} value={catOpt.value}>
                            {catOpt.label} {catOpt.relatedTo ? `(${catOpt.relatedTo})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Description</label>
                      <textarea
                        value={courseDesc}
                        onChange={e => setCourseDesc(e.target.value)}
                        placeholder="Summarize course goals and outcomes..."
                        rows={3}
                        className="w-full p-3 rounded-lg text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder text-slate-800 dark:text-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Listing</label>
                      <div className="flex gap-2">
                        {[
                          { id: 'course', label: 'Catalog Course' },
                          { id: 'diploma', label: 'Professional Diploma' }
                        ].map(opt => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setCourseFormat(opt.id as any)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                              courseFormat === opt.id
                                ? 'border-brand-glowCyan bg-brand-glowCyan/10 text-brand-deepBlue dark:text-brand-glowCyan'
                                : 'border-slate-200 dark:border-brand-darkBorder text-slate-500 hover:bg-slate-50 dark:hover:bg-brand-darkBg'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Diplomas appear in the Professional Diplomas section instead of the course catalog.</p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Course Delivery Type</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { id: 'recorded', label: 'Premade / Self-paced', hint: 'Students work through recorded topics on their own schedule.', icon: BookOpen },
                          { id: 'live', label: 'Live Lecture Course', hint: 'Taught through scheduled sessions on the live calendar.', icon: Calendar }
                        ].map(opt => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setCourseType(opt.id as any)}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              courseType === opt.id
                                ? 'border-brand-glowCyan bg-brand-glowCyan/10'
                                : 'border-slate-200 dark:border-brand-darkBorder hover:bg-slate-50 dark:hover:bg-brand-darkBg'
                            }`}
                          >
                            <span className="text-xs font-extrabold text-brand-deepBlue dark:text-white flex items-center gap-1.5">
                              <opt.icon className="w-3.5 h-3.5 text-brand-glowCyan" /> {opt.label}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-1">{opt.hint}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    {courseType === 'live' && (
                      <>
                        <div>
                          <label htmlFor="course-start" className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                            Course Start Date <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="course-start"
                            type="datetime-local"
                            required
                            value={courseStartDate}
                            onChange={e => setCourseStartDate(e.target.value)}
                            className="w-full h-9 px-3 rounded-lg text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder text-slate-800 dark:text-white"
                          />
                        </div>
                        <div>
                          <label htmlFor="course-end" className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                            Course End Date <span className="font-medium normal-case text-slate-400">(optional)</span>
                          </label>
                          <input
                            id="course-end"
                            type="datetime-local"
                            min={courseStartDate}
                            value={courseEndDate}
                            onChange={e => setCourseEndDate(e.target.value)}
                            className="w-full h-9 px-3 rounded-lg text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder text-slate-800 dark:text-white"
                          />
                        </div>
                      </>
                    )}

                    {/* Course thumbnail */}
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Course Thumbnail</label>
                      <div className="flex flex-col sm:flex-row gap-4 items-start">
                        <div className="w-full sm:w-48 aspect-[16/9] rounded-xl overflow-hidden border border-slate-200 dark:border-brand-darkBorder flex-shrink-0">
                          <CourseThumbnail src={courseThumbnail} title={courseTitle || 'Untitled course'} seed={courseTitle} />
                        </div>
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            <FileUploadButton
                              label={courseThumbnail ? 'Replace Image' : 'Upload Image'}
                              accept="image/*"
                              busy={uploadingKey === 'course-thumb'}
                              onPick={async file => {
                                const up = await uploadFile(file, 'course-thumb');
                                if (up) setCourseThumbnail(up.url);
                              }}
                            />
                            {courseThumbnail && (
                              <button
                                type="button"
                                onClick={() => setCourseThumbnail('')}
                                className="px-2.5 py-1 rounded text-[10px] font-bold border border-slate-202 dark:border-brand-darkBorder text-red-500 hover:bg-red-50 flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" /> Remove
                              </button>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 max-w-xs">
                            Wide 16:9 image, JPG/PNG/WebP. Leave empty and the course keeps the branded placeholder shown here.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Difficulty Level</label>
                      <select
                        value={courseDifficulty}
                        onChange={e => setCourseDifficulty(e.target.value as any)}
                        className="w-full h-9 px-3 rounded-lg text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder text-slate-700 dark:text-slate-300"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Duration (Weeks)</label>
                      <input
                        type="number"
                        value={courseDuration}
                        onChange={e => setCourseDuration(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder text-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Tuition Price (INR)</label>
                      <input
                        type="number"
                        value={coursePrice}
                        onChange={e => setCoursePrice(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder text-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Target Passing Score (%)</label>
                      <input
                        type="number"
                        value={targetPct}
                        onChange={e => setTargetPct(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder text-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <hr className="my-8 border-slate-100 dark:border-brand-darkBorder" />

                  {/* Course Syllabus topics */}
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-brand-deepBlue dark:text-white uppercase tracking-wider">Syllabus Topic Modules</h3>
                      <button
                        type="button"
                        onClick={addTopic}
                        className="px-3 py-1.5 rounded-lg border border-brand-glowCyan/30 text-brand-glowBlue dark:text-brand-glowCyan text-[11px] font-bold flex items-center gap-1 bg-brand-glowCyan/5 hover:bg-brand-glowCyan/10"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> Add Topic Module
                      </button>
                    </div>

                    {builderTopics.map((topic, tIdx) => (
                      <div key={tIdx} className="p-5 rounded-2xl border border-slate-200 dark:border-brand-darkBorder bg-slate-50/50 dark:bg-brand-darkBg/25 space-y-4">
                        <div className="flex items-center gap-4 justify-between">
                          <div className="flex-grow">
                            <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Topic #{tIdx + 1} Title</label>
                            <input
                              type="text"
                              value={topic.title}
                              onChange={e => updateTopicTitle(tIdx, e.target.value)}
                              placeholder="e.g. Locard Exchange Principle"
                              className="w-full h-9 px-3 rounded-lg text-xs bg-white dark:bg-brand-darkBg border border-slate-202 dark:border-brand-darkBorder text-slate-800 dark:text-white"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSaveModule(tIdx)}
                            disabled={savingTopicIdx !== null}
                            className="self-end mb-1 px-3 py-2 rounded-lg bg-brand-deepBlue hover:bg-brand-glowBlue text-white text-[11px] font-bold flex items-center gap-1 disabled:opacity-50 whitespace-nowrap"
                          >
                            {savingTopicIdx === tIdx ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : savedTopicIdx === tIdx ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Save className="w-3.5 h-3.5" />
                            )}
                            {savingTopicIdx === tIdx ? 'Saving...' : savedTopicIdx === tIdx ? 'Saved' : 'Save Module'}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeTopic(tIdx)}
                            className="text-red-555 hover:text-red-655 self-end mb-1 p-2 rounded-lg hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Subtopics container */}
                        <div className="space-y-4 pl-4 border-l-2 border-brand-deepBlue/20 dark:border-brand-glowCyan/20">
                          <div className="flex justify-between items-center">
                            <h4 className="text-xs font-bold text-slate-505 uppercase tracking-wide">Subtopics / Lectures</h4>
                            <button
                              type="button"
                              onClick={() => addSubTopic(tIdx)}
                              className="px-2.5 py-1 text-slate-655 dark:text-slate-350 text-[10px] font-bold flex items-center gap-1 border border-slate-202 dark:border-brand-darkBorder hover:bg-slate-100 rounded"
                            >
                              <Plus className="w-3 h-3" /> Add Subtopic
                            </button>
                          </div>

                          {topic.subTopics.map((sub: any, sIdx: number) => (
                            <div key={sIdx} className="p-4 rounded-xl border border-slate-202 dark:border-brand-darkBorder bg-white dark:bg-brand-darkCard space-y-4 shadow-xs">
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-grow">
                                  <label className="block text-[10px] font-bold text-slate-455 uppercase mb-0.5">Subtopic #{sIdx + 1} Title</label>
                                  <input
                                    type="text"
                                    value={sub.title}
                                    onChange={e => updateSubTopic(tIdx, sIdx, 'title', e.target.value)}
                                    placeholder="e.g. Trace evidence transfer in cars"
                                    className="w-full h-8 px-2.5 rounded text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-202 dark:border-brand-darkBorder text-slate-800 dark:text-white"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeSubTopic(tIdx, sIdx)}
                                  className="text-red-400 hover:text-red-500 p-1.5 rounded hover:bg-red-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Lecture content editor */}
                              <div>
                                <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">Lecture Content</label>
                                <RichTextEditor
                                  value={sub.richTextContent || ''}
                                  onChange={html => updateSubTopic(tIdx, sIdx, 'richTextContent', html)}
                                  placeholder="Write the lecture notes students will read..."
                                />
                              </div>

                              {/* Lecture media uploads (video + primary document) */}
                              <div className="p-3.5 rounded-lg border border-slate-105 dark:border-brand-darkBorder bg-white dark:bg-brand-darkBg/10 space-y-3">
                                <h5 className="text-[11px] font-extrabold text-brand-deepBlue dark:text-brand-glowCyan uppercase tracking-wider flex items-center gap-1">
                                  <Video className="w-3.5 h-3.5" /> Lecture Media
                                </h5>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-455 uppercase mb-0.5">Lecture Video (upload a file, or paste a Vimeo / YouTube link)</label>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={sub.videoUrl || ''}
                                      onChange={e => updateSubTopic(tIdx, sIdx, 'videoUrl', e.target.value)}
                                      placeholder="Upload an MP4 or paste a video link"
                                      className="flex-grow h-8 px-2.5 rounded text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-202 dark:border-brand-darkBorder text-slate-800 dark:text-white"
                                    />
                                    <FileUploadButton
                                      label="Upload Video"
                                      accept=".mp4,.webm,.mov,.m4v"
                                      busy={uploadingKey === `vid-${tIdx}-${sIdx}`}
                                      onPick={async file => {
                                        const up = await uploadFile(file, `vid-${tIdx}-${sIdx}`);
                                        if (up) updateSubTopic(tIdx, sIdx, 'videoUrl', up.url);
                                      }}
                                    />
                                  </div>
                                  {sub.videoUrl && (
                                    <span className={`text-[10px] font-bold flex items-center gap-1 mt-1 ${parseVideoUrl(sub.videoUrl).provider === 'unknown' ? 'text-amber-600' : 'text-green-600'}`}>
                                      {parseVideoUrl(sub.videoUrl).provider === 'unknown' ? <ShieldAlert className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                                      {PROVIDER_LABEL[parseVideoUrl(sub.videoUrl).provider]}
                                    </span>
                                  )}
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-455 uppercase mb-0.5">Lecture Handbook / Notes (PDF, DOC, PPT)</label>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={sub.documentUrl || ''}
                                      onChange={e => updateSubTopic(tIdx, sIdx, 'documentUrl', e.target.value)}
                                      placeholder="Document URL or upload a file"
                                      className="flex-grow h-8 px-2.5 rounded text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-202 dark:border-brand-darkBorder text-slate-800 dark:text-white"
                                    />
                                    <FileUploadButton
                                      label="Upload Doc"
                                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.zip"
                                      busy={uploadingKey === `doc-${tIdx}-${sIdx}`}
                                      onPick={async file => {
                                        const up = await uploadFile(file, `doc-${tIdx}-${sIdx}`);
                                        if (up) {
                                          const updated = [...builderTopics];
                                          updated[tIdx].subTopics[sIdx].documentUrl = up.url;
                                          updated[tIdx].subTopics[sIdx].documentName = up.name;
                                          setBuilderTopics(updated);
                                        }
                                      }}
                                    />
                                  </div>
                                  {sub.documentName && (
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                                      <Paperclip className="w-3 h-3" /> {sub.documentName}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Study material library for this subtopic */}
                              <div className="p-3.5 rounded-lg border border-slate-105 dark:border-brand-darkBorder bg-slate-50/50 dark:bg-brand-darkBg/10 space-y-3">
                                <div className="flex justify-between items-center">
                                  <h5 className="text-[11px] font-extrabold text-brand-deepBlue dark:text-brand-glowCyan uppercase tracking-wider flex items-center gap-1">
                                    <Folder className="w-3.5 h-3.5" /> Study Material ({sub.resources?.length || 0})
                                  </h5>
                                  <button
                                    type="button"
                                    onClick={() => addResource(tIdx, sIdx)}
                                    className="px-2 py-0.5 rounded text-[10px] font-bold text-slate-700 bg-white border border-slate-250 hover:bg-slate-50 flex items-center gap-0.5"
                                  >
                                    <Plus className="w-3 h-3" /> Add Material
                                  </button>
                                </div>

                                {(sub.resources || []).map((resItem: any, rIdx: number) => (
                                  <div key={rIdx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                                    <input
                                      type="text"
                                      value={resItem.name}
                                      onChange={e => updateResource(tIdx, sIdx, rIdx, 'name', e.target.value)}
                                      placeholder="Material name e.g. Chain of Custody Form"
                                      className="md:col-span-4 h-8 px-2.5 rounded text-xs bg-white dark:bg-brand-darkBg border border-slate-202 dark:border-brand-darkBorder text-slate-800 dark:text-white"
                                    />
                                    <input
                                      type="text"
                                      value={resItem.url}
                                      onChange={e => updateResource(tIdx, sIdx, rIdx, 'url', e.target.value)}
                                      placeholder="File URL"
                                      className="md:col-span-4 h-8 px-2.5 rounded text-xs bg-white dark:bg-brand-darkBg border border-slate-202 dark:border-brand-darkBorder text-slate-800 dark:text-white"
                                    />
                                    <select
                                      value={resItem.type}
                                      onChange={e => updateResource(tIdx, sIdx, rIdx, 'type', e.target.value)}
                                      className="md:col-span-2 h-8 px-2 rounded text-xs bg-white dark:bg-brand-darkBg border border-slate-202 dark:border-brand-darkBorder text-slate-700 dark:text-slate-300"
                                    >
                                      {['PDF', 'DOC', 'PPT', 'XLS', 'ZIP', 'Image', 'Audio', 'Link'].map(t => (
                                        <option key={t} value={t}>{t}</option>
                                      ))}
                                    </select>
                                    <div className="md:col-span-2 flex items-center gap-1">
                                      <FileUploadButton
                                        label="Upload"
                                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.zip,image/*,audio/*"
                                        busy={uploadingKey === `res-${tIdx}-${sIdx}-${rIdx}`}
                                        onPick={async file => {
                                          const up = await uploadFile(file, `res-${tIdx}-${sIdx}-${rIdx}`);
                                          if (up) {
                                            const updated = [...builderTopics];
                                            updated[tIdx].subTopics[sIdx].resources[rIdx].url = up.url;
                                            if (!updated[tIdx].subTopics[sIdx].resources[rIdx].name) {
                                              updated[tIdx].subTopics[sIdx].resources[rIdx].name = up.name;
                                            }
                                            setBuilderTopics(updated);
                                          }
                                        }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => removeResource(tIdx, sIdx, rIdx)}
                                        className="text-red-400 hover:text-red-500 p-1 rounded hover:bg-red-50"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Subtopic Quiz configuration details */}
                              <div className="p-3.5 rounded-lg border border-brand-glowCyan/10 bg-brand-glowCyan/5 space-y-3">
                                <h5 className="text-[11px] font-extrabold text-brand-deepBlue dark:text-brand-glowCyan uppercase tracking-wider flex items-center gap-1">
                                  <GraduationCap className="w-3.5 h-3.5" /> MCQ Quiz Rules (Time limits & marking)
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-450 uppercase mb-0.5">Time Limit (Minutes)</label>
                                    <input
                                      type="number"
                                      value={sub.quizTimeLimit}
                                      onChange={e => updateSubTopic(tIdx, sIdx, 'quizTimeLimit', Number(e.target.value))}
                                      className="w-full h-8 px-2.5 rounded text-xs bg-white dark:bg-brand-darkBg border border-slate-202 text-slate-800 dark:text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-450 uppercase mb-0.5">Max Attempts Allowed</label>
                                    <input
                                      type="number"
                                      value={sub.quizAttemptsAllowed}
                                      onChange={e => updateSubTopic(tIdx, sIdx, 'quizAttemptsAllowed', Number(e.target.value))}
                                      className="w-full h-8 px-2.5 rounded text-xs bg-white dark:bg-brand-darkBg border border-slate-202 text-slate-800 dark:text-white"
                                    />
                                  </div>
                                  <div className="flex items-center mt-3">
                                    <input
                                      type="checkbox"
                                      id={`neg-${tIdx}-${sIdx}`}
                                      checked={sub.quizNegativeMarking}
                                      onChange={e => updateSubTopic(tIdx, sIdx, 'quizNegativeMarking', e.target.checked)}
                                      className="h-4 w-4 text-brand-glowCyan border-slate-355 rounded focus:ring-brand-glowCyan"
                                    />
                                    <label htmlFor={`neg-${tIdx}-${sIdx}`} className="ml-2 text-xs font-semibold text-slate-600 dark:text-slate-300">Negative Marking</label>
                                  </div>
                                </div>

                                <div className="flex justify-between items-center pt-2">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase">Questions list ({sub.quizQuestions?.length || 0})</span>
                                  <button
                                    type="button"
                                    onClick={() => addQuizQuestion(tIdx, sIdx)}
                                    className="px-2 py-0.5 rounded text-[10px] font-bold text-slate-700 bg-white border border-slate-250 hover:bg-slate-50 flex items-center gap-0.5"
                                  >
                                    + Add Question
                                  </button>
                                </div>

                                {/* Questions list map */}
                                {(sub.quizQuestions || []).map((q: any, qIdx: number) => (
                                  <div key={qIdx} className="p-3 rounded-lg border border-slate-202 bg-white dark:bg-brand-darkCard space-y-2 relative text-slate-800 dark:text-white">
                                    <button
                                      type="button"
                                      onClick={() => removeQuizQuestion(tIdx, sIdx, qIdx)}
                                      className="absolute right-2 top-2 text-red-405 hover:text-red-500"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                    
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-400 uppercase">Question #{qIdx + 1} Text</label>
                                      <input
                                        type="text"
                                        value={q.questionText}
                                        onChange={e => updateQuizQuestion(tIdx, sIdx, qIdx, 'questionText', e.target.value)}
                                        placeholder="e.g. Which command list processes?"
                                        className="w-full h-8 px-2 rounded text-xs bg-slate-50 border border-slate-200 text-slate-805"
                                      />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {q.options.map((opt: string, oIdx: number) => (
                                        <div key={oIdx}>
                                          <label className="block text-[10px] font-bold text-slate-450">Option {oIdx + 1}</label>
                                          <input
                                            type="text"
                                            value={opt}
                                            onChange={e => updateQuizOption(tIdx, sIdx, qIdx, oIdx, e.target.value)}
                                            className="w-full h-7 px-2 rounded text-xs bg-slate-50 border border-slate-200 text-slate-805"
                                          />
                                        </div>
                                      ))}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Correct Option Index</label>
                                        <select
                                          value={q.correctOptionIndex}
                                          onChange={e => updateQuizQuestion(tIdx, sIdx, qIdx, 'correctOptionIndex', Number(e.target.value))}
                                          className="w-full h-8 px-2 rounded text-xs bg-slate-50 border border-slate-200 text-slate-700"
                                        >
                                          <option value={0}>Option 1</option>
                                          <option value={1}>Option 2</option>
                                          <option value={2}>Option 3</option>
                                          <option value={3}>Option 4</option>
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Assignment details builder */}
                              <div className="p-3.5 rounded-lg border border-slate-105 dark:border-brand-darkBorder bg-slate-50/50 dark:bg-brand-darkBg/10 space-y-3">
                                <h5 className="text-[11px] font-extrabold text-brand-deepBlue dark:text-brand-glowCyan uppercase tracking-wider flex items-center gap-1">
                                  <FileCheck className="w-3.5 h-3.5" /> Topic Assignment Section
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-455 uppercase mb-0.5">Assignment Title</label>
                                    <input
                                      type="text"
                                      value={sub.assignment?.title || ''}
                                      onChange={e => updateSubTopicAssignment(tIdx, sIdx, 'title', e.target.value)}
                                      placeholder="e.g. Analyze Memory Dump Assignment"
                                      className="w-full h-8 px-2.5 rounded text-xs bg-white dark:bg-brand-darkBg border border-slate-220 text-slate-805"
                                    />
                                  </div>
                                  <div className="flex items-center mt-4">
                                    <input
                                      type="checkbox"
                                      id={`req-${tIdx}-${sIdx}`}
                                      checked={sub.assignment?.required !== false}
                                      onChange={e => updateSubTopicAssignment(tIdx, sIdx, 'required', e.target.checked)}
                                      className="h-4 w-4 text-brand-glowCyan border-slate-355 rounded focus:ring-brand-glowCyan"
                                    />
                                    <label htmlFor={`req-${tIdx}-${sIdx}`} className="ml-2 text-xs font-semibold text-slate-600 dark:text-slate-300">Required to pass</label>
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-455 uppercase mb-0.5">Assignment Instructions</label>
                                  <RichTextEditor
                                    value={sub.assignment?.instructionsHtml || ''}
                                    onChange={html => updateSubTopicAssignment(tIdx, sIdx, 'instructionsHtml', html)}
                                    placeholder="Explain worksheet instructions..."
                                    minHeight="6rem"
                                  />
                                </div>
                              </div>

                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <hr className="my-8 border-slate-105 dark:border-brand-darkBorder" />

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('my-courses')}
                      className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-605 hover:bg-slate-50 text-xs font-bold dark:text-slate-350"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handlePreviewAsStudent}
                      disabled={previewLoading}
                      className="px-4 py-2.5 rounded-lg border border-brand-glowCyan/40 bg-brand-glowCyan/5 hover:bg-brand-glowCyan/10 text-brand-glowBlue dark:text-brand-glowCyan text-xs font-bold disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Eye className="w-4 h-4" />
                      {previewLoading ? 'Preparing...' : 'Preview as Student'}
                    </button>
                    <button
                      type="submit"
                      disabled={builderSubmitting}
                      className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-brand-deepBlue to-brand-glowBlue hover:from-brand-glowBlue hover:to-brand-glowCyan text-white text-xs font-bold shadow-md disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      {builderSubmitting ? 'Publishing...' : 'Publish Course Module'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* TAB SEMINARS SCHEDULER */}
            {activeTab === 'seminars' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <form onSubmit={handleScheduleSeminar} className="lg:col-span-7 bg-white dark:bg-brand-darkCard p-6 rounded-3xl border border-slate-200 dark:border-brand-darkBorder space-y-4 shadow-sm">
                  <h3 className="text-sm font-extrabold text-brand-deepBlue dark:text-white uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-brand-glowCyan" /> Schedule a Live Forensic Seminar
                  </h3>

                  {seminarError && <div className="p-3 bg-red-150 border border-red-200 text-red-700 text-xs rounded">{seminarError}</div>}
                  {seminarSuccess && <div className="p-3 bg-green-150 border border-green-200 text-green-700 text-xs rounded">{seminarSuccess}</div>}

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Seminar Title</label>
                    <input
                      type="text"
                      required
                      value={seminarTitle}
                      onChange={e => setSeminarTitle(e.target.value)}
                      placeholder="e.g. Memory Forensics Live Walkthrough"
                      className="w-full h-9 px-3 rounded-lg text-xs bg-slate-50 border border-slate-202 text-slate-805"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Description / Goals</label>
                    <textarea
                      required
                      value={seminarDesc}
                      onChange={e => setSeminarDesc(e.target.value)}
                      placeholder="Summarize seminar objectives..."
                      rows={2}
                      className="w-full p-2.5 rounded text-xs bg-slate-50 border border-slate-202 text-slate-805"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Part of a Live Course</label>
                    <select
                      value={seminarCourseId}
                      onChange={e => setSeminarCourseId(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-202 dark:border-brand-darkBorder text-slate-700 dark:text-slate-300"
                    >
                      <option value="">Standalone webinar (not tied to a course)</option>
                      {courses.filter(c => c.courseType === 'live').map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date & Time</label>
                      <input
                        type="datetime-local"
                        required
                        value={seminarDate}
                        onChange={e => setSeminarDate(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg text-xs bg-slate-50 border border-slate-202 text-slate-805"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Duration (Minutes)</label>
                      <input
                        type="number"
                        required
                        value={seminarDuration}
                        onChange={e => setSeminarDuration(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg text-xs bg-slate-50 border border-slate-202 text-slate-850"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Google Meet / Zoom URL</label>
                      <input
                        type="text"
                        required
                        value={seminarLink}
                        onChange={e => setSeminarLink(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg text-xs bg-slate-50 border border-slate-202 text-slate-805"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Max Participants</label>
                      <input
                        type="number"
                        required
                        value={seminarLimit}
                        onChange={e => setSeminarLimit(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg text-xs bg-slate-50 border border-slate-202 text-slate-850"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={seminarSubmitting}
                    className="px-4 py-2 bg-brand-deepBlue text-white hover:bg-brand-glowBlue text-xs font-bold rounded-lg disabled:opacity-50"
                  >
                    {seminarSubmitting ? 'Scheduling...' : 'Schedule Class'}
                  </button>
                </form>

                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-white dark:bg-brand-darkCard p-6 rounded-3xl border border-slate-200 dark:border-brand-darkBorder">
                    <LectureCalendar sessions={seminars} />
                  </div>

                  <div className="bg-white dark:bg-brand-darkCard p-6 rounded-3xl border border-slate-200 dark:border-brand-darkBorder space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Next Up</h4>
                    {upcomingSeminars.length > 0 ? (
                      upcomingSeminars.slice(0, 5).map((s, idx) => (
                        <div key={idx} className="p-3 border border-slate-100 dark:border-brand-darkBorder rounded-xl space-y-1 text-xs">
                          <span className="font-bold text-brand-deepBlue dark:text-white block">{s.title}</span>
                          <span className="text-[11px] text-slate-400 block">
                            {new Date(s.date).toLocaleString()} ({s.durationMinutes}m)
                            {s.courseTitle ? ` · ${s.courseTitle}` : ''}
                          </span>
                          <a href={s.link} target="_blank" rel="noreferrer" className="text-[11px] text-brand-glowBlue dark:text-brand-glowCyan hover:underline">{s.link}</a>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">No upcoming live sessions.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB BLOG ARTICLE PUBLISHER */}
            {activeTab === 'blogs' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <form onSubmit={handlePublishBlog} className="lg:col-span-8 bg-white dark:bg-brand-darkCard p-6 rounded-3xl border border-slate-200 dark:border-brand-darkBorder space-y-4 shadow-sm">
                  <h3 className="text-sm font-extrabold text-brand-deepBlue dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-brand-glowCyan" /> Publish Forensic Case File Article
                  </h3>

                  {blogError && <div className="p-3 bg-red-150 border border-red-200 text-red-700 text-xs rounded">{blogError}</div>}
                  {blogSuccess && <div className="p-3 bg-green-150 border border-green-200 text-green-700 text-xs rounded">{blogSuccess}</div>}

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Article Title</label>
                    <input
                      type="text"
                      required
                      value={blogTitle}
                      onChange={e => setBlogTitle(e.target.value)}
                      placeholder="e.g. Deciphering NTFS MFT records"
                      className="w-full h-9 px-3 rounded-lg text-xs bg-slate-55 border border-slate-202 text-slate-805"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Category</label>
                      <input
                        type="text"
                        required
                        value={blogCategory}
                        onChange={e => setBlogCategory(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg text-xs bg-slate-50 border border-slate-202 text-slate-805"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tags (Comma separated)</label>
                      <input
                        type="text"
                        value={blogTags}
                        onChange={e => setBlogTags(e.target.value)}
                        placeholder="e.g. NTFS, file carving"
                        className="w-full h-9 px-3 rounded-lg text-xs bg-slate-50 border border-slate-202 text-slate-805"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Read Time (Mins)</label>
                      <input
                        type="number"
                        value={blogReadTime}
                        onChange={e => setBlogReadTime(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg text-xs bg-slate-50 border border-slate-202 text-slate-850"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Content</label>
                    <RichTextEditor
                      value={blogContent}
                      onChange={setBlogContent}
                      placeholder="Write your article analysis details here..."
                      minHeight="14rem"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={blogSubmitting}
                    className="px-4 py-2 bg-brand-deepBlue text-white hover:bg-brand-glowBlue text-xs font-bold rounded-lg disabled:opacity-50"
                  >
                    {blogSubmitting ? 'Publishing...' : 'Publish Article'}
                  </button>
                </form>

                <div className="lg:col-span-4 bg-white dark:bg-brand-darkCard p-6 rounded-3xl border border-slate-200 dark:border-brand-darkBorder space-y-4 animate-fade-in">
                  <h4 className="text-xs font-bold text-slate-405 uppercase tracking-widest">Active Bulletins</h4>
                  {blogs.length > 0 ? (
                    <div className="space-y-3">
                      {blogs.map((b, idx) => (
                        <div key={idx} className="p-3 border border-slate-100 rounded-xl space-y-1 text-xs">
                          <span className="font-bold text-brand-deepBlue block">{b.title}</span>
                          <span className="text-[11px] text-slate-400 block">{b.category} • {b.readTimeMinutes}m read</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No blog posts found.</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB REVENUE */}
            {activeTab === 'revenue' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="p-6 rounded-2xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm">
                    <span className="text-xs text-slate-400 font-bold block uppercase">Lifetime Sales</span>
                    <span className="text-2xl font-extrabold text-brand-deepBlue dark:text-white mt-1 block">₹{courses.reduce((acc, c) => acc + (c.studentsCount || 0) * (c.priceINR || 0), 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="p-6 rounded-2xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm">
                    <span className="text-xs text-slate-400 font-bold block uppercase">Net Earnings</span>
                    <span className="text-2xl font-extrabold text-brand-glowBlue dark:text-brand-glowCyan mt-1 block">₹{Math.round(courses.reduce((acc, c) => acc + (c.studentsCount || 0) * (c.priceINR || 0), 0) * 0.8).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="p-6 rounded-2xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm">
                    <span className="text-xs text-slate-400 font-bold block uppercase">Commission (20%)</span>
                    <span className="text-2xl font-extrabold text-slate-500 mt-1 block">₹{Math.round(courses.reduce((acc, c) => acc + (c.studentsCount || 0) * (c.priceINR || 0), 0) * 0.2).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-brand-darkCard p-6 rounded-3xl border border-slate-200 dark:border-brand-darkBorder">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Course-wise Revenue Split</h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-55 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-200">
                          <th className="p-3">Course Title</th>
                          <th className="p-3">Tuition Price</th>
                          <th className="p-3">Students</th>
                          <th className="p-3 text-right">Total Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courses.map((c, idx) => (
                          <tr key={idx} className="border-b border-slate-100 text-slate-700 hover:bg-slate-50/50">
                            <td className="p-3 font-bold text-brand-deepBlue">{c.title}</td>
                            <td className="p-3">₹{c.priceINR?.toLocaleString('en-IN')}</td>
                            <td className="p-3">{c.studentsCount || 0} enrolled</td>
                            <td className="p-3 text-right font-extrabold text-slate-800">₹{((c.studentsCount || 0) * (c.priceINR || 0)).toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB GRADING PORTAL */}
            {activeTab === 'grading' && selectedCourse && (
              <div className="space-y-6 bg-white dark:bg-brand-darkCard p-6 rounded-3xl border border-slate-200 dark:border-brand-darkBorder shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <button
                      onClick={() => setActiveTab('my-courses')}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-404 hover:text-brand-glowCyan mb-2"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to courses
                    </button>
                    <h2 className="text-base font-extrabold text-brand-deepBlue dark:text-white leading-tight">Enrolled Students & Progress</h2>
                    <span className="text-[11px] text-brand-glowCyan font-bold uppercase">{selectedCourse.title}</span>
                  </div>
                </div>

                {studentsLoading ? (
                  <div className="text-center py-8">
                    <div className="w-6 h-6 border-2 border-brand-glowCyan border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <span className="text-xs text-slate-400">Loading registry...</span>
                  </div>
                ) : students.length > 0 ? (
                  <div className="space-y-6">
                    <div className="overflow-x-auto rounded-xl border border-slate-205">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-200">
                            <th className="p-4">Student Details</th>
                            <th className="p-4">Subtopics Completed</th>
                            <th className="p-4">Quizzes Taken</th>
                            <th className="p-4">Submissions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map((student) => {
                            const subtopicsCount = selectedCourse.topics?.reduce((acc: number, t: any) => acc + (t.subTopics?.length || 0), 0) || 0;
                            const completedCount = student.progress?.completedSubTopics?.length || 0;
                            const pct = subtopicsCount > 0 ? Math.round((completedCount / subtopicsCount) * 100) : 0;

                            return (
                              <tr key={student.id} className="border-b border-slate-150 text-xs text-slate-700 hover:bg-slate-50/50">
                                <td className="p-4">
                                  <div className="font-bold text-brand-deepBlue">{student.name}</div>
                                  <div className="text-[11px] text-slate-405 font-medium mt-0.5">{student.email}</div>
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold">{completedCount} / {subtopicsCount}</span>
                                    <div className="w-20 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                      <div className="bg-brand-glowCyan h-full rounded-full" style={{ width: `${pct}%` }}></div>
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-400">{pct}%</span>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="space-y-1">
                                    {student.progress?.quizScores?.map((q: any, qIdx: number) => (
                                      <div key={qIdx} className="text-[11px] flex items-center gap-1.5">
                                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${q.passed ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                        <span className="font-bold">{q.subTopicTitle}:</span>
                                        <span className={q.passed ? 'text-green-505 font-extrabold' : 'text-red-500'}>{q.score}%</span>
                                      </div>
                                    )) || <span className="text-[11px] text-slate-400">None</span>}
                                  </div>
                                </td>
                                <td className="p-4">
                                  {student.progress?.assignmentSubmissions?.length > 0 ? (
                                    <div className="space-y-2">
                                      {student.progress.assignmentSubmissions.map((sub: any, subIdx: number) => (
                                        <div key={subIdx} className="p-2 border border-slate-100 rounded-lg bg-slate-50 flex items-center justify-between gap-4">
                                          <div>
                                            <span className="font-semibold text-brand-deepBlue block">{sub.assignmentTitle}</span>
                                            <span className="text-[10px] text-slate-400 block">Topic: {sub.subTopicTitle}</span>
                                            <span className={`text-[10px] font-bold ${sub.status === 'graded' ? 'text-green-600' : 'text-amber-500'}`}>
                                              {sub.status === 'graded' ? `Graded: ${sub.grade}/100` : 'Pending Grade'}
                                            </span>
                                          </div>
                                          
                                          <button
                                            onClick={() => {
                                              setGradingStudent(student);
                                              setGradingSubmission(sub);
                                              setGradeInput(sub.grade !== undefined ? String(sub.grade) : '');
                                              setFeedbackInput(sub.feedback || '');
                                            }}
                                            className="px-2 py-1 rounded bg-brand-deepBlue text-white hover:bg-brand-glowCyan text-[10px] font-bold transition-all"
                                          >
                                            {sub.status === 'graded' ? 'Re-grade' : 'Grade'}
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-[11px] text-slate-400">No submissions</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Grading Overlay */}
                    {gradingStudent && gradingSubmission && (
                      <div className="p-6 rounded-2xl border border-brand-glowCyan/30 bg-brand-glowCyan/5 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-sm font-extrabold text-brand-deepBlue">Grading Submission</h3>
                            <span className="text-[11px] text-slate-400 block font-bold uppercase mt-0.5">Student: {gradingStudent.name}</span>
                          </div>
                          <button
                            onClick={() => { setGradingStudent(null); setGradingSubmission(null); }}
                            className="text-xs font-bold text-slate-400 hover:text-slate-700"
                          >
                            Close Panel
                          </button>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-white text-xs space-y-3">
                          <div>
                            <span className="font-bold text-slate-400 block text-[10px] uppercase">Assignment Topic</span>
                            <span className="font-bold text-brand-deepBlue text-xs">{gradingSubmission.assignmentTitle} ({gradingSubmission.subTopicTitle})</span>
                          </div>
                          
                          {gradingSubmission.submissionType === 'text' ? (
                            <div>
                              <span className="font-bold text-slate-400 block text-[10px] uppercase">Text Response</span>
                              <div
                                className="p-3 border border-slate-100 rounded-lg bg-slate-50/50 leading-relaxed font-mono mt-1 text-slate-800"
                                dangerouslySetInnerHTML={{ __html: gradingSubmission.textSubmission || '' }}
                              />
                            </div>
                          ) : (
                            <div>
                              <span className="font-bold text-slate-400 block text-[10px] uppercase">Submitted File</span>
                              <div className="flex items-center gap-2 p-3 border border-slate-100 rounded-lg bg-slate-50/50 mt-1">
                                <FileCheck className="w-5 h-5 text-brand-glowCyan" />
                                <div className="flex-grow">
                                  <span className="font-bold text-xs text-brand-deepBlue block">{gradingSubmission.fileName}</span>
                                  <span className="text-[10px] text-slate-400">Security scanned • Secure mock download ready</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => alert(`Downloading mock assignment file: ${gradingSubmission.fileName}`)}
                                  className="px-2.5 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold"
                                >
                                  Download File
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        <form onSubmit={handleSubmitGrade} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Grade (0-100)</label>
                            <input
                              type="number"
                              required
                              min="0"
                              max="100"
                              value={gradeInput}
                              onChange={e => setGradeInput(e.target.value)}
                              placeholder="Score"
                              className="w-full h-9 px-3 rounded-lg text-xs bg-white border border-slate-200 focus:outline-none"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Feedback Notes</label>
                            <input
                              type="text"
                              value={feedbackInput}
                              onChange={e => setFeedbackInput(e.target.value)}
                              placeholder="Write evaluation notes for the student..."
                              className="w-full h-9 px-3 rounded-lg text-xs bg-white border border-slate-200 focus:outline-none"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={gradeSubmitting}
                            className="w-full h-9 rounded-lg bg-brand-deepBlue hover:bg-brand-glowBlue text-white text-xs font-bold disabled:opacity-50"
                          >
                            {gradeSubmitting ? 'Grading...' : 'Submit Evaluation'}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-8">No students enrolled in this program yet.</p>
                )}
              </div>
            )}

          </div>
        </div>
      </>
    );
  }

  // RENDER STUDENT DASHBOARD
  return (
    <>
      <SEO title="Student Dashboard" description="Access enrolled cyber programs, review lecture progress, complete worksheets, and download verified digital certificates." canonicalPath="/dashboard" />
      <div className="fs-shell">
        <div className="fs-page">
          {!user.mfaEnabled && (
            <div className="mb-6 p-4 rounded-3xl bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-250 dark:border-yellow-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs shadow-sm text-slate-800">
              <div className="space-y-1">
                <p className="font-extrabold text-yellow-800 dark:text-yellow-450 uppercase tracking-wider flex items-center gap-1.5">
                  Security Warning: 2FA Disabled
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  Two-Factor Authentication is currently disabled. Protect your learning dashboard and certificates by enabling TOTP authentication.
                </p>
              </div>
              <button
                onClick={() => navigate('/profile')}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-bold uppercase tracking-wider whitespace-nowrap"
              >
                Enable 2FA
              </button>
            </div>
          )}
          {/* Header */}
          <div className="fs-page-head">
            <div>
              <div className="fs-eyebrow">Digital Evidence Examiner Track · Cohort 14</div>
              <h1 className="fs-page-title">Good morning, {user.name}</h1>
            </div>
            <div className="fs-page-date">Friday, July 18 · Week 9 of 16</div>
          </div>

          {/* Stat Cards Row */}
          <div className="fs-grid fs-g-4" style={{ marginTop: '22px' }}>
            <div className="fs-card fs-stat">
              <div className="fs-stat-label">Continuing-ed hours</div>
              <div className="fs-stat-value">26 <small>/ 40 hrs</small></div>
              <div className="fs-track"><i style={{ width: '65%' }}></i></div>
            </div>
            <div className="fs-card fs-stat">
              <div className="fs-stat-label">Courses in progress</div>
              <div className="fs-stat-value">{user.enrolledCourses?.length || 3}</div>
              <div className="fs-stat-sub">1 nearing deadline</div>
            </div>
            <div className="fs-card fs-stat">
              <div className="fs-stat-label">Study streak</div>
              <div className="fs-stat-value">6 days</div>
              <div className="fs-dots">
                <span></span><span></span><span></span><span></span><span></span><span className="off"></span>
              </div>
            </div>
            <div className="fs-card fs-stat fs-card-hero">
              <div className="fs-stat-label">Certification exam</div>
              <div className="fs-stat-value">18 days</div>
              <div className="fs-stat-sub">CDEE Level II · proctored</div>
            </div>
          </div>

          {/* Main 2-column Split */}
          <div className="fs-split" style={{ marginTop: '22px' }}>
            {/* Left: Continue training */}
            <div>
              <div className="fs-page-head" style={{ alignItems: 'center' }}>
                <div className="fs-section-title" style={{ margin: 0 }}>Continue training</div>
                <Link className="fs-link" to="/courses">View all courses</Link>
              </div>

              <div style={{ marginTop: '14px' }}>
                {user.enrolledCourses && user.enrolledCourses.length > 0 ? (
                  user.enrolledCourses.map((course: any, idx: number) => {
                    const progress = user.courseProgress?.find(p => p.courseId === course.id);
                    const completedCount = progress?.completedSubTopics?.length || 0;
                    const subtopicsCount = course.topics?.reduce((acc: number, t: any) => acc + (t.subTopics?.length || 0), 0) || 10;
                    const pct = subtopicsCount > 0 ? Math.round((completedCount / subtopicsCount) * 100) : 68;
                    const thumbClass = idx % 3 === 0 ? 'g' : idx % 3 === 1 ? 's' : 'b';

                    return (
                      <div key={course.id} className="fs-course-row">
                        <div className={`fs-thumb ${thumbClass}`}>course img</div>
                        <div className="fs-course-meta">
                          <div className="fs-course-code">{course.category || 'DF-204'}</div>
                          <div className="fs-course-name">{course.title}</div>
                          <div className="fs-course-sub">
                            {completedCount} of {subtopicsCount} modules completed
                          </div>
                        </div>
                        <div className="fs-course-prog">
                          <div className="fs-pcts">
                            <span>{pct}%</span>
                            <span>{Math.max(1, 10 - Math.floor(pct / 10))}h left</span>
                          </div>
                          <div className="fs-track"><i style={{ width: `${pct}%` }}></i></div>
                        </div>
                        <Link className="fs-btn primary" to={`/courses/${course.slug}`}>Resume</Link>
                      </div>
                    );
                  })
                ) : (
                  <>
                    <div className="fs-course-row">
                      <div className="fs-thumb g">course img</div>
                      <div className="fs-course-meta">
                        <div className="fs-course-code">DF-204</div>
                        <div className="fs-course-name">Mobile Device Forensics: iOS &amp; Android Acquisition</div>
                        <div className="fs-course-sub">Module 6 of 9 · Logical vs. physical extraction</div>
                      </div>
                      <div className="fs-course-prog">
                        <div className="fs-pcts"><span>68%</span><span>4h left</span></div>
                        <div className="fs-track"><i style={{ width: '68%' }}></i></div>
                      </div>
                      <Link className="fs-btn primary" to="/courses">Resume</Link>
                    </div>

                    <div className="fs-course-row">
                      <div className="fs-thumb s">course img</div>
                      <div className="fs-course-meta">
                        <div className="fs-course-code">CSI-110</div>
                        <div className="fs-course-name">Crime Scene Documentation &amp; Evidence Handling</div>
                        <div className="fs-course-sub">Module 3 of 8 · Photographing the scene</div>
                      </div>
                      <div className="fs-course-prog">
                        <div className="fs-pcts"><span>34%</span><span>9h left</span></div>
                        <div className="fs-track"><i style={{ width: '34%' }}></i></div>
                      </div>
                      <Link className="fs-btn" to="/courses">Resume</Link>
                    </div>

                    <div className="fs-course-row">
                      <div className="fs-thumb b">course img</div>
                      <div className="fs-course-meta">
                        <div className="fs-course-code">LAW-301</div>
                        <div className="fs-course-name">Chain of Custody &amp; Courtroom Testimony</div>
                        <div className="fs-course-sub due">Lab report due Mon, Jul 21</div>
                      </div>
                      <div className="fs-course-prog">
                        <div className="fs-pcts"><span>81%</span><span>2h left</span></div>
                        <div className="fs-track"><i style={{ width: '81%' }}></i></div>
                      </div>
                      <Link className="fs-btn" to="/courses">Resume</Link>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right Rail Panels */}
            <div>
              {/* Upcoming Panel */}
              <div className="fs-panel">
                <h4>Upcoming</h4>
                <div className="fs-up-item">
                  <div className="fs-datechip">
                    <div className="fs-datechip-m">Jul</div>
                    <div className="fs-datechip-d">21</div>
                  </div>
                  <div>
                    <div className="fs-u-title">Lab report: custody log audit</div>
                    <div className="fs-u-sub">LAW-301 · 11:59 PM</div>
                  </div>
                </div>
                <div className="fs-up-item">
                  <div className="fs-datechip">
                    <div className="fs-datechip-m">Jul</div>
                    <div className="fs-datechip-d">24</div>
                  </div>
                  <div>
                    <div className="fs-u-title">Live session: SQLite artifacts</div>
                    <div className="fs-u-sub">DF-204 · 2:00 PM · Instr. Cho</div>
                  </div>
                </div>
                <div className="fs-up-item">
                  <div className="fs-datechip">
                    <div className="fs-datechip-m">Aug</div>
                    <div className="fs-datechip-d">05</div>
                  </div>
                  <div>
                    <div className="fs-u-title">CDEE Level II proctored exam</div>
                    <div className="fs-u-sub">Testing center · 90 min</div>
                  </div>
                </div>
              </div>

              {/* Certification path / stepper */}
              <div className="fs-panel" style={{ marginTop: '18px' }}>
                <h4>Certification path</h4>
                <div className="fs-path-item">
                  <div className="fs-path-dot">
                    <div className="fs-path-o done"></div>
                    <div className="fs-path-bar"></div>
                  </div>
                  <div>
                    <div className="fs-p-title">Foundations of Digital Evidence</div>
                    <div className="fs-p-sub">Completed May 2026</div>
                  </div>
                </div>
                <div className="fs-path-item">
                  <div className="fs-path-dot">
                    <div className="fs-path-o now"></div>
                    <div className="fs-path-bar"></div>
                  </div>
                  <div>
                    <div className="fs-p-title">
                      Examiner coursework <span className="fs-chip" style={{ marginLeft: '4px' }}>In progress</span>
                    </div>
                    <div className="fs-p-sub">3 of 5 courses complete</div>
                  </div>
                </div>
                <div className="fs-path-item">
                  <div className="fs-path-dot">
                    <div className="fs-path-o"></div>
                  </div>
                  <div>
                    <div className="fs-p-title faint">Level II certification exam</div>
                    <div className="fs-p-sub">Unlocks Aug 5</div>
                  </div>
                </div>
              </div>

              {/* Verified Credentials list */}
              {user.certificates && user.certificates.length > 0 && (
                <div className="fs-panel" style={{ marginTop: '18px' }}>
                  <h4>Verified Credentials</h4>
                  {user.certificates.map((cert: any, idx: number) => (
                    <Link key={idx} to={`/certificates/${cert.certificateId}`} className="fs-up-item" style={{ textDecoration: 'none' }}>
                      <div>
                        <div className="fs-u-title">{cert.courseName}</div>
                        <div className="fs-u-sub">ID: {cert.certificateId}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="fs-footer">
          ForenSecure · Student Portal
        </div>
      </div>
    </>
  );
}
