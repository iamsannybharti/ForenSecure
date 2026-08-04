import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import { parseVideoUrl } from '../lib/videoEmbed';
import {
  Shield, BookOpen, Clock, FileText, CheckCircle, ArrowLeft, ArrowRight, User,
  Video, Eye, Lock, ChevronDown, ChevronRight, FileCheck, FileCode, Award, RotateCcw,
  MessageSquare, Send, Bookmark, ThumbsUp, Download, ExternalLink, Folder, Sparkles,
  Plus, Trash2, HelpCircle, Printer, QrCode, GraduationCap
} from 'lucide-react';

export default function CourseDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, token, refreshProfile } = useAuth();
  
  const [course, setCourse] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Course Learning Portal States
  const [activeTopicIdx, setActiveTopicIdx] = useState(0);
  const [activeSubTopicIdx, setActiveSubTopicIdx] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<any | null>(null);
  const [quizSubmitting, setQuizSubmitting] = useState(false);

  // Quiz Timer State
  const [quizTimeLeft, setQuizTimeLeft] = useState<number | null>(null);
  const [quizTimerActive, setQuizTimerActive] = useState(false);

  // Udemy Player Bottom Tabs State
  const [bottomTab, setBottomTab] = useState<'overview' | 'resources' | 'qa' | 'notes' | 'assessment'>('overview');

  // Discussion Board State
  const [discussionOpen, setDiscussionOpen] = useState(true);
  const [discussions] = useState<any[]>([]);
  const [newDiscussionText, setNewDiscussionText] = useState('');
  const [qaIncludeTimestamp, setQaIncludeTimestamp] = useState(false);
  const [qaTimestampText, setQaTimestampText] = useState('01:30');

  // Personal Notes State
  const [personalNotes, setPersonalNotes] = useState<any[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [noteTimestamp, setNoteTimestamp] = useState('02:15');

  // Assignment States
  const [assignmentType, setAssignmentType] = useState<'text' | 'file'>('text');
  const [assignmentText, setAssignmentText] = useState('');
  const [assignmentFileName, setAssignmentFileName] = useState('');
  const [assignmentSubmitting, setAssignmentSubmitting] = useState(false);
  const [assignmentMessage, setAssignmentMessage] = useState('');

  // Certificate Claim State
  const [claimingCert, setClaimingCert] = useState(false);
  const [claimedCertId, setClaimedCertId] = useState('');

  const fetchPersonalNotes = async () => {
    if (!slug || !token) {
      try {
        const saved = localStorage.getItem(`notes_${slug}`);
        setPersonalNotes(saved ? JSON.parse(saved) : []);
      } catch {
        setPersonalNotes([]);
      }
      return;
    }

    setNotesLoading(true);
    try {
      const res = await fetch(`/api/courses/${slug}/notes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Notes unavailable');
      const notes = await res.json();
      setPersonalNotes(notes);
      try { localStorage.setItem(`notes_${slug}`, JSON.stringify(notes)); } catch {}
    } catch {
      try {
        const saved = localStorage.getItem(`notes_${slug}`);
        setPersonalNotes(saved ? JSON.parse(saved) : []);
      } catch {
        setPersonalNotes([]);
      }
    } finally {
      setNotesLoading(false);
    }
  };
  const fetchCourseData = () => {
    setIsLoading(true);
    fetch(`/api/courses/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error('Course not found');
        return res.json();
      })
      .then(data => {
        setCourse(data);
        setIsLoading(false);
      })
      .catch(reason => {
        setCourse(null);
        setErrorMessage(reason instanceof Error ? reason.message : 'Unable to load this course');
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchCourseData();
  }, [slug]);

  useEffect(() => {
    fetchPersonalNotes();
  }, [slug, token]);

  // Check enrollment state
  useEffect(() => {
    if (user && course) {
      // Staff can open ?preview=1 to walk their own course exactly as a student sees it
      const isStaffPreview = new URLSearchParams(window.location.search).get('preview') === '1'
        && ['teacher', 'faculty', 'admin'].includes(user.role);
      const isEnrolled = user.enrolledCourses?.some((c: any) => c.id === course.id || c === course.id);
      const hasPaid = Number(course.priceINR) === 0 || user.successfulPayments?.some((c: any) => c === course.id || c.id === course.id);
      setEnrolled((isEnrolled && hasPaid) || isStaffPreview);

      if (isEnrolled && hasPaid && user.courseProgress) {
        const progress = user.courseProgress.find((p: any) => p.courseId === course.id);
        const subTopic = course.topics?.[activeTopicIdx]?.subTopics?.[activeSubTopicIdx];
        
        if (progress && subTopic) {
          const scoreRecord = progress.quizScores?.find((q: any) => q.subTopicTitle === subTopic.title);
          if (scoreRecord) {
            setQuizResult({
              score: scoreRecord.score,
              passed: scoreRecord.passed,
              totalQuestions: scoreRecord.totalQuestions
            });
            const answersMap: Record<number, number> = {};
            scoreRecord.answers?.forEach((ans: number, idx: number) => {
              answersMap[idx] = ans;
            });
            setQuizAnswers(answersMap);
            setQuizTimerActive(false);
          } else {
            setQuizResult(null);
            setQuizAnswers({});
            // Reset and trigger quiz timer
            const tLimit = subTopic.quizTimeLimit || 15;
            setQuizTimeLeft(tLimit * 60);
            setQuizTimerActive(true);
          }

          setAssignmentText('');
          setAssignmentFileName('');
          setAssignmentMessage('');
        }
      }
    }
  }, [user, course, activeTopicIdx, activeSubTopicIdx]);

  // Quiz Timer Countdown Effect
  useEffect(() => {
    if (!quizTimerActive || quizTimeLeft === null || quizResult !== null) return;

    if (quizTimeLeft <= 0) {
      setQuizTimerActive(false);
      handleSubmitQuiz();
      return;
    }

    const timer = setTimeout(() => {
      setQuizTimeLeft(quizTimeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [quizTimeLeft, quizTimerActive]);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      const target = window.location.pathname + '?enroll=1';
      navigate('/login?redirect=' + encodeURIComponent(target));
      return;
    }

    setEnrolling(true);
    setErrorMessage('');

    if (Number(course.priceINR) > 0) {
      const confirmPayment = window.confirm(`This is a paid program. Proceed with mock payment of ₹${course.priceINR.toLocaleString('en-IN')}?`);
      if (!confirmPayment) {
        setEnrolling(false);
        return;
      }
    }

    try {
      const res = await fetch(`/api/courses/${course.id}/enroll`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ paymentSuccess: true })
      });

      const data = await res.json();
      if (res.ok) {
        setEnrolled(true);
        await refreshProfile();
        if (window.location.search.includes('enroll=1')) {
          window.history.replaceState({}, '', window.location.pathname);
        }
      } else {
        setErrorMessage(data.message || 'Enrollment failed');
      }
    } catch (err) {
      setErrorMessage('Server connection error. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  // Auto-enroll when redirected back from Login with ?enroll=1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('enroll') === '1' && isAuthenticated && course && !enrolled && !enrolling) {
      handleEnroll();
    }
  }, [isAuthenticated, course, enrolled]);

  // Student Quiz Submission
  const handleSubmitQuiz = async () => {
    if (quizSubmitting || !course) return;
    setQuizSubmitting(true);
    setQuizTimerActive(false);

    const subTopic = course.topics?.[activeTopicIdx]?.subTopics?.[activeSubTopicIdx];
    const totalQ = subTopic?.quizQuestions?.length || 0;
    const answersArray = Array.from({ length: totalQ }, (_, i) => quizAnswers[i] !== undefined ? quizAnswers[i] : -1);

    try {
      const res = await fetch(`/api/courses/${course.id}/topics/${activeTopicIdx}/subtopics/${activeSubTopicIdx}/submit-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ answers: answersArray })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setQuizResult(data);
        await refreshProfile();
      } else {
        throw new Error(data.message || 'Unable to grade this quiz');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to grade this quiz');
    } finally {
      setQuizSubmitting(false);
    }
  };

  // Re-test handler
  const handleRetestQuiz = () => {
    setQuizAnswers({});
    setQuizResult(null);
    const subTopic = course.topics?.[activeTopicIdx]?.subTopics?.[activeSubTopicIdx];
    const tLimit = subTopic?.quizTimeLimit || 15;
    setQuizTimeLeft(tLimit * 60);
    setQuizTimerActive(true);
  };

  // Student Assignment Submission
  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !course) return;

    setAssignmentSubmitting(true);
    setAssignmentMessage('');

    const bodyData = {
      submissionType: assignmentType,
      textSubmission: assignmentType === 'text' ? assignmentText : undefined,
      fileName: assignmentType === 'file' ? assignmentFileName : undefined
    };

    try {
      const res = await fetch(`/api/courses/${course.id}/topics/${activeTopicIdx}/subtopics/${activeSubTopicIdx}/submit-assignment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      });

      if (res.ok) {
        setAssignmentMessage('Assignment submitted successfully! Awaiting instructor grading.');
        await refreshProfile();
      } else {
        setAssignmentMessage('Submission error on server.');
      }
    } catch (err) {
      setAssignmentMessage('Unable to reach the server. Please try again.');
    } finally {
      setAssignmentSubmitting(false);
    }
  };

  // Add Discussion Thread
  const handleAddDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscussionText.trim() || !course) return;
    const activeSubTopic = course.topics?.[activeTopicIdx]?.subTopics?.[activeSubTopicIdx];
    if (!activeSubTopic) return;

    const textToSubmit = qaIncludeTimestamp ? `[At ${qaTimestampText}] ${newDiscussionText}` : newDiscussionText;
    setNewDiscussionText('');

    try {
      const res = await fetch(`/api/courses/${course.slug}/subtopics/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subTopicTitle: activeSubTopic.title,
          text: textToSubmit,
          timestampSeconds: qaIncludeTimestamp ? 90 : 0
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.course) {
          setCourse(data.course);
        }
      }
    } catch (err) {
      console.error(err);
    }

  };

  const handleAddPersonalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;

    const activeTopic = course?.topics?.[activeTopicIdx];
    const activeLesson = activeTopic?.subTopics?.[activeSubTopicIdx];
    const draftNote = {
      id: 'note_' + Date.now(),
      text: noteInput.trim(),
      timestamp: noteTimestamp,
      topicTitle: activeTopic?.title || '',
      subTopicTitle: activeLesson?.title || 'Lesson',
      createdAt: new Date().toISOString()
    };

    if (!token) {
      const updated = [draftNote, ...personalNotes];
      setPersonalNotes(updated);
      try { localStorage.setItem(`notes_${slug}`, JSON.stringify(updated)); } catch {}
      setNoteInput('');
      return;
    }

    try {
      const res = await fetch(`/api/courses/${slug}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          text: draftNote.text,
          timestamp: draftNote.timestamp,
          topicTitle: draftNote.topicTitle,
          subTopicTitle: draftNote.subTopicTitle
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not save note');
      const updated = [data.note, ...personalNotes];
      setPersonalNotes(updated);
      try { localStorage.setItem(`notes_${slug}`, JSON.stringify(updated)); } catch {}
      setNoteInput('');
    } catch {
      const updated = [draftNote, ...personalNotes];
      setPersonalNotes(updated);
      try { localStorage.setItem(`notes_${slug}`, JSON.stringify(updated)); } catch {}
      setNoteInput('');
    }
  };

  const handleDeletePersonalNote = async (id: string) => {
    const updated = personalNotes.filter(n => (n.id || n.id) !== id);
    setPersonalNotes(updated);
    try { localStorage.setItem(`notes_${slug}`, JSON.stringify(updated)); } catch {}

    if (!token) return;
    try {
      await fetch(`/api/courses/${slug}/notes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch {}
  };

  const handleUpvoteComment = async (commentId: string) => {
    try {
      await fetch(`/api/courses/${slug}/subtopics/comment/${commentId}/upvote`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchCourseData();
    } catch (err) {}
  };

  // Claim Certificate Handler
  const handleClaimCertificate = async () => {
    if (claimingCert || !token || !course) return;
    setClaimingCert(true);
    try {
      const res = await fetch(`/api/courses/${course.id}/claim-certificate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.certificate?.certificateId) {
        setClaimedCertId(data.certificate.certificateId);
        await refreshProfile();
      } else {
        alert(data.message || 'Verification checks failed. Cannot issue certificate.');
      }
    } catch (err) {
      alert('Unable to reach the server. Please try again.');
    } finally {
      setClaimingCert(false);
    }
  };

  // Dynamic CSS Watermark Overlay component
  const WatermarkOverlay = () => {
    if (!user) return null;
    return (
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none select-none opacity-[0.06] text-slate-800 dark:text-white font-mono text-[10px] uppercase text-center rotate-[-15deg] z-40">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-center p-4 truncate">
            {user.name} ({user.email}) • SECURE PREVIEW
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-brand-darkBg">
        <div className="w-10 h-10 border-4 border-brand-glowCyan border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <h1 className="text-2xl font-extrabold">Course unavailable</h1>
        <p className="mt-2 text-sm text-red-600">{errorMessage || 'This course was not found in the database.'}</p>
        <Link to="/courses" className="mt-5 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white"><ArrowLeft className="h-4 w-4" />Back to courses</Link>
      </div>
    );
  }

  // RENDER LEARNING PORTAL IF ENROLLED
  if (enrolled && course.topics && course.topics.length > 0) {
    const activeSubTopic = course.topics[activeTopicIdx]?.subTopics?.[activeSubTopicIdx];
    const progress = user?.courseProgress?.find((p: any) => p.courseId === course.id);
    const completedSubTopics = progress?.completedSubTopics || [];
    
    const totalSubTopics = course.topics.reduce((acc: number, t: any) => acc + (t.subTopics?.length || 0), 0) || 0;
    const progressPct = totalSubTopics > 0 ? Math.round((completedSubTopics.length / totalSubTopics) * 100) : 0;
    const coursePassed = progressPct === 100;

    const existingSubmission = progress?.assignmentSubmissions?.find((s: any) => 
      s.subTopicTitle === activeSubTopic?.title
    );

    // Format Quiz Timer left minutes/seconds
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
      <>
        <SEO title={`Learn: ${course.title}`} description="ForenSecure interactive course viewer." canonicalPath={`/courses/${course.slug}`} />
        
        <div className="min-h-screen bg-slate-50 dark:bg-brand-darkBg flex flex-col lg:flex-row transition-colors duration-300">
          
          {/* Left Sidebar */}
          <aside className="w-full lg:w-80 bg-white dark:bg-brand-darkCard border-r border-slate-200 dark:border-brand-darkBorder flex-shrink-0 flex flex-col justify-between">
            <div className="p-5 border-b border-slate-100 dark:border-brand-darkBorder">
              <span className="text-[10px] uppercase font-bold text-brand-glowCyan block tracking-wider mb-1">Interactive Portal</span>
              <h2 className="text-sm font-extrabold text-brand-deepBlue dark:text-white leading-snug line-clamp-2">{course.title}</h2>
              
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-slate-400">
                  <span>Modules Completed</span>
                  <span>{completedSubTopics.length} / {totalSubTopics} ({progressPct}%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-brand-darkBg h-1.5 rounded-full overflow-hidden">
                  <div className="bg-brand-glowCyan h-full rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }}></div>
                </div>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-4 max-h-[350px] lg:max-h-[500px]">
              {course.topics.map((topic: any, tIdx: number) => (
                <div key={tIdx} className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-brand-deepBlue dark:text-white uppercase tracking-wider">
                    <ChevronDown className="w-3.5 h-3.5 text-brand-glowCyan" />
                    <span>{topic.title}</span>
                  </div>
                  
                  <div className="pl-4 space-y-1 border-l border-slate-100 dark:border-brand-darkBorder">
                    {topic.subTopics.map((sub: any, sIdx: number) => {
                      const isActive = activeTopicIdx === tIdx && activeSubTopicIdx === sIdx;
                      const isCompleted = completedSubTopics.includes(sub.title);

                      return (
                        <button
                          key={sIdx}
                          onClick={() => {
                            setActiveTopicIdx(tIdx);
                            setActiveSubTopicIdx(sIdx);
                          }}
                          className={`w-full text-left p-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                            isActive
                              ? 'bg-brand-deepBlue/5 dark:bg-brand-glowCyan/10 text-brand-glowBlue dark:text-brand-glowCyan border border-brand-glowCyan/20'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-brand-darkBg'
                          }`}
                        >
                          <span className="truncate pr-2">{sub.title}</span>
                          {isCompleted ? (
                            <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          ) : (
                            <span className="w-3.5 h-3.5 rounded-full border border-slate-300 flex-shrink-0"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Claim certificate trigger */}
            <div className="p-5 border-t border-slate-100 dark:border-brand-darkBorder bg-slate-50/50 dark:bg-brand-darkBg/25 text-center">
              {claimedCertId || user?.certificates?.some(c => c.courseName === course.title) ? (
                <div>
                  <div className="w-full py-2.5 rounded-xl bg-green-100 dark:bg-green-950/20 text-green-700 dark:text-green-400 text-xs font-bold border border-green-200 flex items-center justify-center gap-1">
                    <Award className="w-4 h-4" /> Certificate Issued
                  </div>
                  <Link
                    to={`/certificates/${claimedCertId || user?.certificates.find(c => c.courseName === course.title)?.certificateId}`}
                    className="block text-xs font-bold text-brand-glowBlue hover:underline mt-2"
                  >
                    View & Print badge
                  </Link>
                </div>
              ) : coursePassed ? (
                <button
                  onClick={handleClaimCertificate}
                  disabled={claimingCert}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-deepBlue to-brand-glowBlue hover:from-brand-glowBlue hover:to-brand-glowCyan text-white text-xs font-bold shadow-lg disabled:opacity-50"
                >
                  {claimingCert ? 'Claiming...' : 'Claim Digital Certificate'}
                </button>
              ) : (
                <div className="text-[11px] text-slate-400 font-semibold flex items-center justify-center gap-1.5 py-2">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Syllabus incomplete for Certificate</span>
                </div>
              )}
            </div>
          </aside>

          {/* Center Learning Panel */}
          <main className="flex-grow p-6 sm:p-8 space-y-8 overflow-y-auto max-h-[85vh] lg:max-h-screen">
            
            {/* Header */}
            <div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{course.topics[activeTopicIdx]?.title}</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-brand-glowCyan">{activeSubTopic?.title}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-brand-deepBlue dark:text-white heading-display leading-tight mt-1.5">
                {activeSubTopic?.title}
              </h1>
            </div>

            {/* Secure Video Player / Lesson Header */}
            {activeSubTopic?.videoUrl ? (
              <div className="p-5 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder relative space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-400 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-brand-glowCyan" /> Video Lesson Stream
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-brand-darkBg text-slate-600 dark:text-slate-300 text-[11px] font-bold">
                      1080p HD
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setNoteTimestamp('01:45');
                        setBottomTab('notes');
                      }}
                      className="px-2.5 py-1 rounded bg-brand-glowCyan/10 text-brand-glowBlue dark:text-brand-glowCyan text-[11px] font-bold hover:bg-brand-glowCyan/20 flex items-center gap-1"
                    >
                      <Bookmark className="w-3 h-3" /> Bookmark Timestamp
                    </button>
                  </div>
                </div>

                <div
                  className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl"
                  onContextMenu={e => e.preventDefault()}
                >
                  {(() => {
                    const video = parseVideoUrl(activeSubTopic.videoUrl);
                    // Hosted providers stream fragmented, key-protected media inside their own player,
                    // which keeps seeking working while the source file stays out of reach.
                    if (video.provider === 'file') {
                      return (
                        <video
                          src={video.embedUrl}
                          controls
                          controlsList="nodownload noplaybackrate"
                          disablePictureInPicture
                          className="absolute inset-0 w-full h-full select-none"
                        />
                      );
                    }
                    return (
                      <iframe
                        src={video.embedUrl}
                        title="Module Lesson Video"
                        className="absolute inset-0 w-full h-full select-none"
                        // encrypted-media is what lets the provider run its DRM/AES key exchange in the frame.
                        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                        allowFullScreen
                      />
                    );
                  })()}
                  <WatermarkOverlay />
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-3xl bg-gradient-to-br from-brand-deepBlue to-slate-900 text-white shadow-lg space-y-2">
                <span className="px-2.5 py-1 rounded bg-brand-glowCyan/20 text-brand-glowCyan text-[10px] font-extrabold uppercase tracking-widest">Text & Reading Module</span>
                <h2 className="text-lg font-extrabold">{activeSubTopic?.title}</h2>
                <p className="text-xs text-slate-300">Review the lecture handbook notes, resources, and self-assessment below.</p>
              </div>
            )}

            {/* Udemy Player Bottom Tabs Navigation */}
            <div className="border-b border-slate-200 dark:border-brand-darkBorder flex gap-2 overflow-x-auto pb-1 text-xs font-bold">
              <button
                onClick={() => setBottomTab('overview')}
                className={`px-4 py-2.5 rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
                  bottomTab === 'overview'
                    ? 'border-brand-glowCyan text-brand-deepBlue dark:text-white bg-white dark:bg-brand-darkCard shadow-xs'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Overview & Notes
              </button>
              <button
                onClick={() => setBottomTab('resources')}
                className={`px-4 py-2.5 rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
                  bottomTab === 'resources'
                    ? 'border-brand-glowCyan text-brand-deepBlue dark:text-white bg-white dark:bg-brand-darkCard shadow-xs'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Folder className="w-3.5 h-3.5" /> Resources ({(activeSubTopic?.resources?.length || 0) + (activeSubTopic?.documentUrl ? 1 : 0)})
              </button>
              <button
                onClick={() => setBottomTab('qa')}
                className={`px-4 py-2.5 rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
                  bottomTab === 'qa'
                    ? 'border-brand-glowCyan text-brand-deepBlue dark:text-white bg-white dark:bg-brand-darkCard shadow-xs'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-brand-glowCyan" /> Q&A Forum ({(activeSubTopic?.comments?.length || 0) + discussions.length})
              </button>
              <button
                onClick={() => setBottomTab('notes')}
                className={`px-4 py-2.5 rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
                  bottomTab === 'notes'
                    ? 'border-brand-glowCyan text-brand-deepBlue dark:text-white bg-white dark:bg-brand-darkCard shadow-xs'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" /> Personal Notes ({notesLoading ? '...' : personalNotes.length})
              </button>
              <button
                onClick={() => setBottomTab('assessment')}
                className={`px-4 py-2.5 rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
                  bottomTab === 'assessment'
                    ? 'border-brand-glowCyan text-brand-deepBlue dark:text-white bg-white dark:bg-brand-darkCard shadow-xs'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" /> Assessment & Worksheets
              </button>
            </div>

            {/* TAB 1: OVERVIEW & INSTRUCTOR NOTES */}
            {bottomTab === 'overview' && (
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-xs space-y-4">
                  <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-400 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-brand-glowCyan" /> Lecture Reading Notes
                  </h3>
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed font-sans"
                    dangerouslySetInnerHTML={{ __html: activeSubTopic?.richTextContent || '<p>No reading content available for this lesson.</p>' }}
                  />
                </div>

                {activeSubTopic?.instructorNotes?.summary && (
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder space-y-2">
                    <h4 className="text-xs font-extrabold text-brand-deepBlue dark:text-white uppercase tracking-wider">Instructor Key Summary</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{activeSubTopic.instructorNotes.summary}</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: DOWNLOADABLE RESOURCES */}
            {bottomTab === 'resources' && (
              <div className="space-y-4">
                {activeSubTopic?.documentUrl && (
                  <div className="p-5 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder">
                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-4 relative overflow-hidden">
                      <div className="flex items-center gap-3 select-none">
                        <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                          <FileCode className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="font-extrabold text-sm text-brand-deepBlue block">{activeSubTopic.documentName || 'Attachment Handbook'}</span>
                          <span className="text-[11px] text-slate-400 block font-semibold">SECURE PROOF • COPYING & DOWNLOAD DISABLED</span>
                        </div>
                      </div>
                      <button
                        onClick={() => alert('Anti-Piracy restriction active. Downloading has been blocked for this handbook.')}
                        className="p-2.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1 select-none z-10"
                      >
                        <Eye className="w-4 h-4" /> View Securely
                      </button>
                    </div>
                  </div>
                )}

                {activeSubTopic?.resources && activeSubTopic.resources.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeSubTopic.resources.map((resItem: any, rIdx: number) => (
                      <div key={rIdx} className="p-4 rounded-2xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <Folder className="w-5 h-5 text-brand-glowCyan" />
                          <div>
                            <span className="font-bold text-xs text-brand-deepBlue dark:text-white block">{resItem.name}</span>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">{resItem.type || 'Resource File'}</span>
                          </div>
                        </div>
                        <a
                          href={resItem.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-brand-deepBlue text-white text-xs font-bold flex items-center gap-1 hover:bg-brand-glowBlue"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  !activeSubTopic?.documentUrl && (
                    <div className="text-center py-8 bg-white dark:bg-brand-darkCard rounded-3xl border border-slate-200 dark:border-brand-darkBorder text-slate-400 text-xs">
                      No additional downloadable resource files for this lesson.
                    </div>
                  )
                )}
              </div>
            )}

            {/* TAB 3: Q&A DISCUSSION FORUM */}
            {bottomTab === 'qa' && (
              <div className="p-6 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-400 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-brand-glowCyan" /> Lesson Q&A Forum ({(activeSubTopic?.comments?.length || 0) + discussions.length})
                  </h3>
                </div>

                {/* Form to ask timestamped question */}
                <form onSubmit={handleAddDiscussion} className="p-4 rounded-2xl bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder space-y-3">
                  <span className="text-xs font-bold text-brand-deepBlue dark:text-white block">Ask a Question / Join Discussion</span>
                  <div className="flex items-center gap-3 text-xs">
                    <label className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={qaIncludeTimestamp}
                        onChange={e => setQaIncludeTimestamp(e.target.checked)}
                        className="rounded text-brand-glowCyan"
                      />
                      Link to timestamp
                    </label>
                    {qaIncludeTimestamp && (
                      <input
                        type="text"
                        value={qaTimestampText}
                        onChange={e => setQaTimestampText(e.target.value)}
                        placeholder="01:30"
                        className="w-16 h-7 px-2 text-center rounded border border-slate-300 font-mono text-xs"
                      />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={newDiscussionText}
                      onChange={e => setNewDiscussionText(e.target.value)}
                      placeholder="Ask the instructor or discuss with peers..."
                      className="flex-grow h-9 px-3 rounded-lg border border-slate-200 dark:border-brand-darkBorder text-xs bg-white dark:bg-brand-darkCard text-slate-800 dark:text-white focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="h-9 px-4 rounded-lg bg-brand-deepBlue text-white hover:bg-brand-glowBlue font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" /> Post Question
                    </button>
                  </div>
                </form>

                {/* Question List */}
                <div className="space-y-3">
                  {activeSubTopic?.comments?.map((c: any, idx: number) => (
                    <div key={idx} className="p-4 border border-slate-100 dark:border-brand-darkBorder rounded-2xl bg-slate-50/50 dark:bg-brand-darkBg/50 text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-brand-deepBlue dark:text-white">{c.userName}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${c.userRole === 'admin' ? 'bg-red-100 text-red-700' : c.userRole === 'teacher' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                            {c.userRole}
                          </span>
                          {c.timestampSeconds && (
                            <span className="px-2 py-0.5 rounded bg-brand-glowCyan/10 text-brand-glowBlue text-[10px] font-mono font-bold">
                              @{Math.floor(c.timestampSeconds / 60)}:{(c.timestampSeconds % 60).toString().padStart(2, '0')}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleUpvoteComment(c.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-brand-darkCard border border-slate-200 text-slate-600 text-[11px] font-bold hover:bg-slate-100"
                        >
                          <ThumbsUp className="w-3 h-3 text-brand-glowCyan" /> {c.upvotes || 0}
                        </button>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-normal">{c.text}</p>
                    </div>
                  ))}

                  {discussions.map((d, idx) => (
                    <div key={'loc_' + idx} className="p-4 border border-slate-100 dark:border-brand-darkBorder rounded-2xl bg-slate-50/50 dark:bg-brand-darkBg/50 text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-brand-deepBlue dark:text-white">{d.author}</span>
                        <span className="text-[11px] text-slate-400 font-semibold">{d.date}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-normal">{d.text}</p>
                    </div>
                  ))}
                  
                  {/* Course-Wide Q&A Section */}
                  {course?.courseQnA && course.courseQnA.length > 0 && (
                    <div className="border-t border-slate-200 dark:border-brand-darkBorder pt-4 space-y-3">
                      <span className="text-xs font-extrabold uppercase text-slate-400 block">Course-Wide Q&A Threads ({course.courseQnA.length})</span>
                      {course.courseQnA.map((qnaItem: any, qnaIdx: number) => (
                        <div key={qnaIdx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder text-xs space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-brand-deepBlue dark:text-white">{qnaItem.studentName}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${qnaItem.isAnswered ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                              {qnaItem.isAnswered ? 'Answered by Instructor' : 'Awaiting Answer'}
                            </span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 font-semibold">{qnaItem.question}</p>
                          {qnaItem.answer && (
                            <div className="p-2.5 rounded-xl bg-white dark:bg-brand-darkCard border border-green-200 text-slate-600 dark:text-slate-300">
                              <span className="text-[10px] font-bold text-green-600 uppercase block mb-1">Instructor Response</span>
                              {qnaItem.answer}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: PERSONAL NOTES (SYNCED) */}
            {bottomTab === 'notes' && (
              <div className="p-6 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-400 flex items-center gap-1.5">
                    <Bookmark className="w-4 h-4 text-brand-glowCyan" /> Personal Notes ({notesLoading ? '...' : personalNotes.length})
                  </h3>
                </div>

                <form onSubmit={handleAddPersonalNote} className="p-4 rounded-2xl bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-brand-deepBlue dark:text-white">Save Personal Note</span>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-[11px] font-bold text-slate-400 uppercase">Timestamp:</span>
                      <input
                        type="text"
                        value={noteTimestamp}
                        onChange={e => setNoteTimestamp(e.target.value)}
                        className="w-16 h-7 px-2 text-center rounded border border-slate-300 font-mono text-xs"
                      />
                    </div>
                  </div>
                  <textarea
                    required
                    rows={2}
                    value={noteInput}
                    onChange={e => setNoteInput(e.target.value)}
                    placeholder="Write private notes or key takeaways for this timestamp..."
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs bg-white dark:bg-brand-darkCard text-slate-800 dark:text-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-brand-deepBlue text-white hover:bg-brand-glowBlue font-bold text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Save Note
                  </button>
                </form>

                <div className="space-y-3">
                  {personalNotes.map(n => (
                    <div key={n.id || n.id} className="p-4 rounded-2xl border border-slate-200 dark:border-brand-darkBorder bg-slate-50/50 dark:bg-brand-darkBg/50 text-xs flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-brand-glowCyan/10 text-brand-glowBlue font-mono font-bold text-[11px]">
                            @{n.timestamp}
                          </span>
                          <span className="text-[11px] text-slate-400 font-semibold">{n.subTopicTitle || n.lessonTitle} • {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 font-medium">{n.text}</p>
                      </div>
                      <button
                        onClick={() => handleDeletePersonalNote(n.id || n.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: ASSESSMENT & WORKSHEETS */}
            {bottomTab === 'assessment' && (
              <div className="space-y-6">
                {/* MCQ Quiz Section */}
                {activeSubTopic?.quizQuestions && activeSubTopic.quizQuestions.length > 0 ? (
                  <div className="p-6 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-400 flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-brand-glowCyan" /> Module Assessment MCQ
                      </h3>
                      {quizTimerActive && quizTimeLeft !== null && (
                        <div className="px-3 py-1 bg-red-50 text-red-600 rounded text-xs font-bold animate-pulse">
                          Time Remaining: {formatTime(quizTimeLeft)}
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      {activeSubTopic.quizQuestions.map((q: any, qIdx: number) => {
                        const isAnswered = quizAnswers[qIdx] !== undefined;
                        const isPassed = quizResult?.passed;
                        const showResultColors = quizResult !== null;

                        return (
                          <div key={qIdx} className="space-y-3">
                            <span className="text-[11px] text-slate-400 font-bold block">Question {qIdx + 1} of {activeSubTopic.quizQuestions.length}</span>
                            <h4 className="text-sm font-bold text-brand-deepBlue dark:text-white leading-snug">{q.questionText}</h4>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {q.options.map((opt: string, oIdx: number) => {
                                const isSelected = quizAnswers[qIdx] === oIdx;
                                const isCorrect = q.correctOptionIndex === oIdx;

                                return (
                                  <button
                                    key={oIdx}
                                    type="button"
                                    disabled={isAnswered || isPassed || quizResult !== null}
                                    onClick={() => setQuizAnswers(prev => ({ ...prev, [qIdx]: oIdx }))}
                                    className={`w-full text-left p-3.5 rounded-xl border text-xs font-semibold transition-all ${
                                      showResultColors
                                        ? isCorrect
                                          ? 'bg-green-50 border-green-300 text-green-700 font-bold'
                                          : isSelected
                                          ? 'bg-red-50 border-red-300 text-red-700'
                                          : 'bg-slate-50 border-slate-100 text-slate-400'
                                        : isSelected
                                        ? 'bg-brand-deepBlue border-brand-deepBlue text-white'
                                        : 'bg-slate-50/50 hover:bg-slate-100 border-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {quizResult ? (
                      <div className="p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                        <div>
                          <span className="text-[11px] font-bold text-slate-400 block uppercase">Evaluation Results</span>
                          <span className={`font-extrabold text-sm ${quizResult.passed ? 'text-green-600' : 'text-red-500'}`}>
                            {quizResult.score}% Score • {quizResult.passed ? 'Passed (Topic Unlocked)' : `Failed (Required: ${course.targetPercentage || 60}%)`}
                          </span>
                        </div>
                        {!quizResult.passed && (
                          <button
                            onClick={handleRetestQuiz}
                            className="px-4 py-2 rounded-lg border border-brand-glowCyan text-brand-glowBlue dark:text-brand-glowCyan text-xs font-bold flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Re-test Quiz
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={handleSubmitQuiz}
                        disabled={quizSubmitting || Object.keys(quizAnswers).length < activeSubTopic.quizQuestions.length}
                        className="px-6 py-2.5 rounded-lg bg-brand-deepBlue text-white text-xs font-bold hover:bg-brand-glowBlue disabled:opacity-50 transition-colors mt-6"
                      >
                        {quizSubmitting ? 'Grading...' : 'Submit Answers'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-white dark:bg-brand-darkCard rounded-3xl border border-slate-200 dark:border-brand-darkBorder text-slate-400 text-xs">
                    No multiple-choice quiz assessment required for this lesson module.
                  </div>
                )}

                {/* Assignment Section */}
                {activeSubTopic?.assignment && (
                  <div className="p-6 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder space-y-6">
                    <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-400 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-brand-glowCyan" /> Worksheet Assignment
                    </h3>

                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 dark:bg-brand-darkBg/50 text-xs">
                      <h4 className="font-extrabold text-brand-deepBlue dark:text-white mb-2">{activeSubTopic.assignment.title}</h4>
                      <div
                        className="prose prose-sm leading-relaxed text-slate-500 dark:text-slate-400"
                        dangerouslySetInnerHTML={{ __html: activeSubTopic.assignment.instructionsHtml }}
                      />
                    </div>

                    {existingSubmission ? (
                      <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 dark:bg-brand-darkBg space-y-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Submission Details</span>
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold block">Status: {existingSubmission.status === 'graded' ? 'Evaluated' : 'Submitted (Awaiting Grading)'}</span>
                            {existingSubmission.status === 'graded' && (
                              <span className="text-brand-glowCyan font-bold text-sm block mt-1">Score: {existingSubmission.grade}/100</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmitAssignment} className="space-y-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setAssignmentType('text')}
                            className={`px-3 py-1.5 rounded text-xs font-bold ${
                              assignmentType === 'text' ? 'bg-slate-200 text-brand-deepBlue' : 'text-slate-400'
                            }`}
                          >
                            Type Answer
                          </button>
                          <button
                            type="button"
                            onClick={() => setAssignmentType('file')}
                            className={`px-3 py-1.5 rounded text-xs font-bold ${
                              assignmentType === 'file' ? 'bg-slate-200 text-brand-deepBlue' : 'text-slate-400'
                            }`}
                          >
                            Upload Document
                          </button>
                        </div>

                        {assignmentType === 'text' ? (
                          <textarea
                            required
                            value={assignmentText}
                            onChange={e => setAssignmentText(e.target.value)}
                            placeholder="Type response analysis here..."
                            rows={4}
                            className="w-full p-2.5 rounded text-xs border border-slate-200 bg-slate-50/50"
                          />
                        ) : (
                          <input
                            type="file"
                            accept=".pdf,.docx,.ppt"
                            onChange={e => {
                              const files = e.target.files;
                              if (files && files[0]) {
                                setAssignmentFileName(files[0].name);
                              }
                            }}
                            className="w-full h-9 p-1 rounded border border-slate-200 text-xs bg-slate-50"
                          />
                        )}

                        {assignmentMessage && <p className="text-xs font-semibold text-brand-glowCyan">{assignmentMessage}</p>}

                        <button
                          type="submit"
                          disabled={assignmentSubmitting}
                          className="px-5 py-2.5 rounded-lg bg-brand-deepBlue text-white text-xs font-bold hover:bg-brand-glowBlue disabled:opacity-50"
                        >
                          {assignmentSubmitting ? 'Submitting...' : 'Submit Work'}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-slate-200 dark:border-brand-darkBorder mt-8 print:hidden">
              <span className="text-xs text-slate-404 font-semibold">Active Module Navigation</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={activeTopicIdx === 0 && activeSubTopicIdx === 0}
                  onClick={() => {
                    if (activeSubTopicIdx > 0) {
                      setActiveSubTopicIdx(prev => prev - 1);
                    } else if (activeTopicIdx > 0) {
                      const prevT = activeTopicIdx - 1;
                      setActiveTopicIdx(prevT);
                      setActiveSubTopicIdx(course.topics[prevT].subTopics.length - 1);
                    }
                  }}
                  className="px-3.5 py-1.5 rounded border border-slate-200 text-slate-655 text-xs font-bold hover:bg-slate-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={
                    activeTopicIdx === course.topics.length - 1 &&
                    activeSubTopicIdx === course.topics[activeTopicIdx].subTopics.length - 1
                  }
                  onClick={() => {
                    const currentT = course.topics[activeTopicIdx];
                    if (activeSubTopicIdx < currentT.subTopics.length - 1) {
                      setActiveSubTopicIdx(prev => prev + 1);
                    } else if (activeTopicIdx < course.topics.length - 1) {
                      setActiveTopicIdx(prev => prev + 1);
                      setActiveSubTopicIdx(0);
                    }
                  }}
                  className="px-3.5 py-1.5 rounded border border-slate-200 text-slate-655 text-xs font-bold hover:bg-slate-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>

          </main>

        </div>
      </>
    );
  }

  // RENDER COURSE LANDING PAGE
  return (
    <>
      <SEO 
        title={course.title} 
        description={course.description} 
        canonicalPath={`/courses/${course.slug}`} 
        schemaType="Course"
        schemaData={{
          name: course.title,
          description: course.description,
          instructorName: course.instructorName
        }}
      />
      <div className="relative pt-6 pb-20 bg-slate-50 dark:bg-brand-darkBg transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <Link to="/courses" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-brand-glowCyan mb-8">
            <ArrowLeft className="w-4 h-4" /> Back to Catalog
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            <div className="lg:col-span-8 space-y-8">
              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 digital-grid opacity-20 pointer-events-none"></div>
                <div className="relative z-10 space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-brand-deepBlue/5 dark:bg-brand-glowCyan/10 text-brand-deepBlue dark:text-brand-glowCyan">
                      {course.category}
                    </span>
                    {course.level && (
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-brand-darkBg text-slate-600 dark:text-slate-300">
                        {course.level}
                      </span>
                    )}
                    {course.subTitle && (
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-brand-deepBlue dark:bg-brand-darkBorder dark:text-brand-glowCyan">
                        {course.subTitle}
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight heading-display text-brand-deepBlue dark:text-white leading-tight">
                    {course.title}
                  </h1>
                  
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {course.description}
                  </p>

                  {course.overview && (
                    <div className="pt-2 border-t border-slate-100 dark:border-brand-darkBorder">
                      <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-2">Course Overview</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed whitespace-pre-line">
                        {course.overview}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 border-t border-slate-100 dark:border-brand-darkBorder pt-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-brand-darkBorder flex items-center justify-center text-slate-500">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-brand-deepBlue dark:text-white leading-tight">{course.instructorName}</span>
                      <span className="text-[11px] text-slate-400">{course.instructorTitle}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Highlights & Features */}
              {course.highlights && course.highlights.length > 0 && (
                <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm space-y-4">
                  <h2 className="text-lg font-bold text-brand-deepBlue dark:text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-brand-glowCyan" /> Course Highlights
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {course.highlights.map((h: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-brand-darkBg/50 text-xs text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-brand-darkBorder/40">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Target Audience / Eligibility */}
              {(course.eligibility || course.targetAudience || course.targetParticipants || course.whoShouldEnroll || course.whoShouldAttend) && (
                <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm space-y-4">
                  <h2 className="text-lg font-bold text-brand-deepBlue dark:text-white flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-brand-glowCyan" /> Who Should Enroll / Eligibility
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {(course.eligibility || course.targetAudience || course.targetParticipants || course.whoShouldEnroll || course.whoShouldAttend || []).map((item: string, idx: number) => (
                      <span key={idx} className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-brand-darkBg text-brand-deepBlue dark:text-brand-glowCyan border border-blue-100 dark:border-brand-darkBorder text-xs font-semibold">
                        ✓ {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* What You'll Learn / Outcomes */}
              {(course.whatYouWillLearn || course.learningOutcomes || course.learningObjectives || course.programmeOutcomes) && (
                <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm space-y-4">
                  <h2 className="text-lg font-bold text-brand-deepBlue dark:text-white flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-brand-glowCyan" /> Learning Objectives &amp; Outcomes
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(course.whatYouWillLearn || course.learningOutcomes || course.learningObjectives || course.programmeOutcomes || []).map((out: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                        <span className="text-brand-glowCyan font-bold">✔</span>
                        <span>{out}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Virtual Practical Labs / Practical Training */}
              {(course.practicalLabs?.length || course.virtualLabs || course.practicalTraining || course.capstoneProjectScenarios) && (
                <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm space-y-4">
                  <h2 className="text-lg font-bold text-brand-deepBlue dark:text-white flex items-center gap-2">
                    <FileCode className="w-5 h-5 text-brand-glowCyan" /> Practical Training &amp; Virtual Labs
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {((course.practicalLabs?.length ? course.practicalLabs : course.virtualLabs || course.practicalTraining || course.capstoneProjectScenarios) || []).map((lab: string, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-brand-darkBg text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-brand-darkBorder">
                        🔬 {lab}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Syllabus */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm">
                <h2 className="text-lg font-bold text-brand-deepBlue dark:text-white mb-6 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-brand-glowCyan" /> Course Curriculum &amp; Modules
                </h2>
                <div className="space-y-4">
                  {course.syllabus?.map((item: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-brand-darkBg/50 border border-slate-100 dark:border-brand-darkBorder/50">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-deepBlue/10 dark:bg-brand-glowCyan/10 text-xs font-bold text-brand-deepBlue dark:text-brand-glowCyan flex-shrink-0">
                        {idx + 1}
                      </div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assessment Structure */}
              {course.assessmentStructure && (
                <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm space-y-4">
                  <h2 className="text-lg font-bold text-brand-deepBlue dark:text-white flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-brand-glowCyan" /> Assessment Structure
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {course.assessmentStructure.map((ast: any, idx: number) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-brand-darkBg text-center space-y-1 border border-slate-100 dark:border-brand-darkBorder">
                        <span className="text-base font-extrabold text-brand-glowBlue dark:text-brand-glowCyan block">{ast.weightage}</span>
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block">{ast.name}</span>
                      </div>
                    ))}
                  </div>
                  {course.passingCriteria && (
                    <p className="text-xs font-semibold text-slate-500">
                      Passing Requirement: <span className="text-brand-deepBlue dark:text-white font-bold">{course.passingCriteria}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Learning Resources */}
              {course.learningResources && (
                <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm space-y-4">
                  <h2 className="text-lg font-bold text-brand-deepBlue dark:text-white flex items-center gap-2">
                    <Folder className="w-5 h-5 text-brand-glowCyan" /> Learning Resources Included
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {course.learningResources.map((res: string, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-brand-darkBg text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 border border-slate-100 dark:border-brand-darkBorder">
                        <Download className="w-3.5 h-3.5 text-brand-glowCyan flex-shrink-0" />
                        <span>{res}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Career Benefits / Opportunities */}
              {(course.careerBenefits || course.careerOpportunities) && (
                <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm space-y-4">
                  <h2 className="text-lg font-bold text-brand-deepBlue dark:text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-brand-glowCyan" /> Career Opportunities &amp; Benefits
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(course.careerBenefits || course.careerOpportunities || []).map((cb: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 p-2.5 rounded-xl bg-slate-50 dark:bg-brand-darkBg">
                        <span className="text-green-500 font-bold">➜</span>
                        <span>{cb}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
              <div className="p-6 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-205 dark:border-brand-darkBorder shadow-sm">
                <div className="mb-6">
                  <span className="text-xs text-slate-404 font-semibold block mb-1">PROGRAM TUITION</span>
                  <span className="text-3xl font-extrabold text-brand-deepBlue dark:text-white">
                    ₹{course.priceINR?.toLocaleString('en-IN') || '9,999'}
                  </span>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-2.5 text-xs text-slate-650 dark:text-slate-300">
                    <Clock className="w-4 h-4 text-brand-glowCyan" />
                    <span>{course.durationWeeks} Weeks self-paced study</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-650 dark:text-slate-300">
                    <Shield className="w-4 h-4 text-brand-glowCyan" />
                    <span>Court-verified IT certificate badge</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-650 dark:text-slate-300">
                    <FileCheck className="w-4 h-4 text-brand-glowCyan" />
                    <span>Topic Worksheets & MCQ Assessments</span>
                  </div>
                </div>

                {errorMessage && (
                  <p className="text-xs font-medium text-red-500 mb-4">{errorMessage}</p>
                )}

                {enrolled ? (
                  <div className="space-y-2">
                    <div className="w-full py-3 rounded-xl bg-green-105 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/50 flex items-center justify-center gap-1.5 text-xs font-bold">
                      <CheckCircle className="w-4 h-4" /> Enrolled in Program
                    </div>
                    <button
                      onClick={() => { refreshProfile(); }}
                      className="w-full py-3 rounded-xl bg-brand-deepBlue text-white dark:bg-brand-glowBlue hover:bg-brand-glowCyan flex items-center justify-center gap-1.5 text-xs font-bold transition-colors"
                    >
                      Enter Learning Portal <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-deepBlue to-brand-glowBlue hover:from-brand-glowBlue hover:to-brand-glowCyan text-white text-xs font-bold transition-all duration-300 shadow-md shadow-brand-deepBlue/10 disabled:opacity-50"
                  >
                    {enrolling ? 'Enrolling...' : !isAuthenticated ? 'Sign In or Register to Enroll' : 'Enroll Program'}
                  </button>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    </>
  );
}
