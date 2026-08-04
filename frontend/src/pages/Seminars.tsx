import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import { 
  Calendar as CalendarIcon, Clock, User, Users, AlertCircle, Video, Plus, Edit3, 
  Link as LinkIcon, ExternalLink, X, CheckCircle, ChevronLeft, ChevronRight, List, LayoutGrid 
} from 'lucide-react';

export default function Seminars() {
  const { user, token, isAuthenticated } = useAuth();
  const [seminars, setSeminars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'mine'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [successNotice, setSuccessNotice] = useState('');

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  // Teacher Schedule/Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructorName: '',
    date: '',
    durationMinutes: 60,
    link: '',
    maxParticipants: 50
  });
  const [saving, setSaving] = useState(false);

  const isTeacherOrAdmin = user && ['teacher', 'faculty', 'admin'].includes(user.role);

  const fetchSeminars = () => {
    setLoading(true);
    setError('');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    fetch('/api/seminars', { headers })
      .then(async res => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || 'Unable to load live lectures');
        }
        return res.json();
      })
      .then(data => setSeminars(Array.isArray(data) ? data : []))
      .catch(reason => setError(reason instanceof Error ? reason.message : 'Unable to load live lectures'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSeminars();
  }, []);

  const handleRegister = async (seminarId: string) => {
    if (!isAuthenticated || !token) {
      const target = `/seminars?register=${seminarId}`;
      window.location.href = `/login?redirect=${encodeURIComponent(target)}`;
      return;
    }
    try {
      const res = await fetch(`/api/seminars/${seminarId}/register`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccessNotice('Seat Registered! Switched to your upcoming classes schedule.');
        setFilterTab('mine');
        setViewMode('calendar');
        if (window.location.search.includes('register=')) {
          window.history.replaceState({}, '', window.location.pathname);
        }
        fetchSeminars();
      } else {
        alert('Failed to register seat.');
      }
    } catch {
      alert('Unable to register for this lecture. Please try again.');
    }
  };

  // Auto-register seat when returning from Login with ?register=seminarId
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const seminarId = params.get('register');
    if (seminarId && isAuthenticated && token) {
      handleRegister(seminarId);
    }
  }, [isAuthenticated, token]);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      instructorName: user?.name || 'Faculty Instructor',
      date: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      durationMinutes: 60,
      link: 'https://meet.google.com/',
      maxParticipants: 50
    });
    setShowModal(true);
  };

  const openEditModal = (seminar: any) => {
    setEditingId(seminar.id);
    setFormData({
      title: seminar.title || '',
      description: seminar.description || '',
      instructorName: seminar.instructorName || user?.name || '',
      date: seminar.date ? new Date(seminar.date).toISOString().slice(0, 16) : '',
      durationMinutes: seminar.durationMinutes || 60,
      link: seminar.link || '',
      maxParticipants: seminar.maxParticipants || 50
    });
    setShowModal(true);
  };

  const handleSaveSeminar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);

    const url = editingId ? `/api/seminars/${editingId}` : '/api/seminars';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessNotice(editingId ? 'Live class link updated successfully!' : 'New live class scheduled successfully!');
        setShowModal(false);
        fetchSeminars();
      } else {
        alert(data.message || 'Failed to save live class.');
      }
    } catch {
      alert('Error connecting to server.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSeminar = async (id: string) => {
    if (!confirm('Are you sure you want to delete this live class session?')) return;
    if (!token) return;
    try {
      const res = await fetch(`/api/seminars/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccessNotice('Live class session deleted.');
        fetchSeminars();
      }
    } catch {
      alert('Failed to delete live class.');
    }
  };

  const handleApproveSeminar = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/seminars/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ approvalStatus: 'approved' })
      });
      if (res.ok) {
        setSuccessNotice('Live class approved and published successfully!');
        fetchSeminars();
      } else {
        alert('Failed to approve live class.');
      }
    } catch {
      alert('Error approving live class.');
    }
  };

  const displayedSeminars = filterTab === 'mine' && user
    ? seminars.filter(s => s.registeredStudents?.includes(user.email) || isTeacherOrAdmin)
    : seminars;

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Map seminars by YYYY-MM-DD
  const seminarsByDate: Record<string, any[]> = {};
  displayedSeminars.forEach(s => {
    if (!s.date) return;
    const d = new Date(s.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!seminarsByDate[key]) seminarsByDate[key] = [];
    seminarsByDate[key].push(s);
  });

  const selectedDateSeminars = selectedCalendarDate
    ? seminarsByDate[selectedCalendarDate] || []
    : [];

  return (
    <>
      <SEO 
        title="Live Forensic Classes & Calendar Schedule" 
        description="View and join scheduled live cohort lectures with certified forensic specialists via Teams, Meet, or Zoom." 
        canonicalPath="/seminars" 
      />
      
      <div className="min-h-screen bg-slate-50 dark:bg-brand-darkBg pt-12 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-8" data-reveal-stagger>
          
          {/* Header */}
          <div className="text-center space-y-3">
            <span className="text-xs uppercase font-extrabold tracking-widest text-brand-glowCyan">Interactive Live Cohorts</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-deepBlue dark:text-white heading-display leading-tight">
              Live Forensic Classes Schedule
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
              Real-time interactive lectures hosted on Teams, Meet, or Zoom. View upcoming sessions in List or Calendar view.
            </p>

            {successNotice && (
              <div className="p-3 bg-green-100 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-xs font-bold rounded-2xl flex items-center justify-between max-w-lg mx-auto">
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> {successNotice}</span>
                <button onClick={() => setSuccessNotice('')} className="p-1 hover:bg-green-200 rounded-full"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}

            {/* Filter Tabs, View Switcher & Schedule Action */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-brand-darkBorder">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterTab('all')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    filterTab === 'all'
                      ? 'bg-brand-deepBlue text-white dark:bg-brand-glowBlue'
                      : 'bg-white dark:bg-brand-darkCard text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-brand-darkBorder'
                  }`}
                >
                  All Scheduled Sessions ({seminars.length})
                </button>
                {user && (
                  <button
                    onClick={() => setFilterTab('mine')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                      filterTab === 'mine'
                        ? 'bg-brand-deepBlue text-white dark:bg-brand-glowBlue'
                        : 'bg-white dark:bg-brand-darkCard text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-brand-darkBorder'
                    }`}
                  >
                    My Upcoming Classes
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* View Mode Toggle: List vs Calendar */}
                <div className="flex p-1 bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder rounded-xl">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      viewMode === 'list' ? 'bg-slate-100 dark:bg-brand-darkBg text-brand-deepBlue dark:text-white' : 'text-slate-400 hover:text-slate-600'
                    }`}
                    title="List View"
                  >
                    <List className="w-3.5 h-3.5" /> List
                  </button>
                  <button
                    onClick={() => setViewMode('calendar')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      viewMode === 'calendar' ? 'bg-slate-100 dark:bg-brand-darkBg text-brand-deepBlue dark:text-white' : 'text-slate-400 hover:text-slate-600'
                    }`}
                    title="Calendar View"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" /> Calendar
                  </button>
                </div>

                {isTeacherOrAdmin && (
                  <button
                    onClick={openCreateModal}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-deepBlue to-brand-glowBlue hover:from-brand-glowBlue hover:to-brand-glowCyan text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" /> Schedule New Class
                  </button>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-brand-glowCyan border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <span className="text-xs text-slate-400">Loading scheduled live classes...</span>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
          ) : viewMode === 'calendar' ? (
            /* --- CALENDAR VIEW --- */
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm space-y-6">
                
                {/* Calendar Month Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-brand-glowCyan" />
                    <h2 className="text-lg font-bold text-brand-deepBlue dark:text-white">
                      {monthNames[month]} {year}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={prevMonth}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-brand-darkBg hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentDate(new Date())}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-brand-darkBg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                    >
                      Today
                    </button>
                    <button
                      onClick={nextMonth}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-brand-darkBg hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Day Names Grid */}
                <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100 dark:border-brand-darkBorder">
                  <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                </div>

                {/* Month Days Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {/* Blank lead-in cells */}
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-24 sm:h-28 rounded-2xl bg-slate-50/50 dark:bg-brand-darkBg/20 border border-slate-100/50 dark:border-brand-darkBorder/20 pointer-events-none" />
                  ))}

                  {/* Month Day Cells */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const dayClasses = seminarsByDate[dateKey] || [];
                    const isSelected = selectedCalendarDate === dateKey;
                    const isToday = new Date().toDateString() === new Date(year, month, dayNum).toDateString();

                    return (
                      <div
                        key={dayNum}
                        onClick={() => setSelectedCalendarDate(dateKey)}
                        className={`h-24 sm:h-28 p-2 rounded-2xl border transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'border-brand-glowCyan bg-blue-50/60 dark:bg-brand-glowCyan/10 shadow-sm'
                            : dayClasses.length > 0
                            ? 'border-blue-200 dark:border-brand-glowBlue/40 bg-white dark:bg-brand-darkCard hover:border-brand-glowCyan'
                            : 'border-slate-100 dark:border-brand-darkBorder/40 bg-white dark:bg-brand-darkCard hover:bg-slate-50 dark:hover:bg-brand-darkBg/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${
                            isToday
                              ? 'w-6 h-6 rounded-full bg-brand-deepBlue text-white flex items-center justify-center'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}>
                            {dayNum}
                          </span>
                          {dayClasses.length > 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-blue-600 text-white">
                              {dayClasses.length} {dayClasses.length === 1 ? 'class' : 'classes'}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 overflow-hidden">
                          {dayClasses.slice(0, 2).map(cls => (
                            <div
                              key={cls.id}
                              className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-brand-glowBlue/20 text-brand-deepBlue dark:text-brand-glowCyan text-[10px] font-bold truncate"
                              title={cls.title}
                            >
                              🎥 {cls.title}
                            </div>
                          ))}
                          {dayClasses.length > 2 && (
                            <span className="text-[9px] text-slate-400 block font-semibold">+ {dayClasses.length - 2} more</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* Selected Date Session Details */}
              {selectedCalendarDate && (
                <div className="p-6 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-brand-darkBorder pb-3">
                    <h3 className="text-sm font-bold text-brand-deepBlue dark:text-white flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-brand-glowCyan" /> Classes for {selectedCalendarDate}
                    </h3>
                    <button onClick={() => setSelectedCalendarDate(null)} className="text-xs text-slate-400 hover:text-slate-600">Close</button>
                  </div>

                  {selectedDateSeminars.length > 0 ? (
                    <div className="space-y-4">
                      {selectedDateSeminars.map(s => {
                        const isRegistered = user && s.registeredStudents?.includes(user.email);
                        const canJoin = isRegistered || isTeacherOrAdmin;

                        return (
                          <div key={s.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-brand-darkBg flex flex-col sm:flex-row justify-between sm:items-center gap-4 border border-slate-200 dark:border-brand-darkBorder">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-brand-deepBlue dark:text-white">{s.title}</h4>
                                {s.approvalStatus === 'pending' && (
                                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800">
                                    Pending Approval
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">{s.instructorName} · {new Date(s.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({s.durationMinutes} mins)</p>
                            </div>
                            <div className="flex gap-2">
                              {user?.role === 'admin' && s.approvalStatus === 'pending' && (
                                <button
                                  onClick={() => handleApproveSeminar(s.id)}
                                  className="px-3 py-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold"
                                >
                                  Approve Live Class
                                </button>
                              )}
                              {canJoin ? (
                                <a
                                  href={s.link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                                >
                                  <Video className="w-3.5 h-3.5" /> Join Live Class <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <button
                                  onClick={() => handleRegister(s.id)}
                                  className="px-4 py-2 rounded-xl bg-brand-deepBlue text-white text-xs font-bold hover:bg-brand-glowBlue"
                                >
                                  Register Seat
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-2">No live classes scheduled for this date.</p>
                  )}
                </div>
              )}
            </div>
          ) : displayedSeminars.length > 0 ? (
            /* --- LIST VIEW --- */
            <div className="space-y-6">
              {displayedSeminars.map((s) => {
                const isRegistered = user && s.registeredStudents?.includes(user.email);
                const canJoin = isRegistered || isTeacherOrAdmin;

                return (
                  <div key={s.id} className="p-6 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-6 relative overflow-hidden">
                    <div className="space-y-2.5 flex-grow">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 flex items-center gap-1">
                          <Video className="w-3 h-3 animate-pulse" /> Live Stream Cohort
                        </span>
                        {isRegistered && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Seat Registered
                          </span>
                        )}
                        {isTeacherOrAdmin && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                            s.approvalStatus === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400' :
                            s.approvalStatus === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' :
                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400'
                          }`}>
                            {s.approvalStatus === 'approved' ? 'Approved' : s.approvalStatus === 'rejected' ? 'Rejected' : 'Pending Approval'}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-brand-deepBlue dark:text-white leading-tight">
                        {s.title}
                      </h3>
                      
                      <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed max-w-xl">
                        {s.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium text-slate-500 dark:text-slate-400 pt-1">
                        <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-brand-glowCyan" /> {s.instructorName}</span>
                        <span className="flex items-center gap-1.5"><CalendarIcon className="w-3.5 h-3.5 text-brand-glowCyan" /> {new Date(s.date).toLocaleString()}</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-brand-glowCyan" /> {s.durationMinutes} mins</span>
                        <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-brand-glowCyan" /> {s.registeredStudents?.length || 0} / {s.maxParticipants} Seats</span>
                      </div>
                    </div>

                    <div className="sm:self-center flex-shrink-0 flex flex-col sm:items-end gap-2.5 w-full sm:w-auto border-t sm:border-t-0 border-slate-100 dark:border-brand-darkBorder pt-4 sm:pt-0">
                      {user?.role === 'admin' && s.approvalStatus === 'pending' && (
                        <button
                          onClick={() => handleApproveSeminar(s.id)}
                          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-extrabold transition-all hover:scale-105"
                        >
                          Approve Live Class
                        </button>
                      )}
                      {canJoin ? (
                        <a
                          href={s.link}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white text-xs font-extrabold text-center flex items-center justify-center gap-2 shadow-md shadow-green-600/20 transition-all hover:scale-105"
                        >
                          <Video className="w-4 h-4" /> Join Live Class <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <button
                          onClick={() => handleRegister(s.id)}
                          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-deepBlue hover:bg-brand-glowBlue dark:bg-brand-glowBlue dark:hover:bg-brand-glowCyan text-white text-xs font-extrabold transition-all shadow-md shadow-brand-deepBlue/10"
                        >
                          Register Seat
                        </button>
                      )}

                      {/* Teacher / Admin Controls */}
                      {isTeacherOrAdmin && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(s)}
                            className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-brand-darkBg text-slate-700 dark:text-slate-300 hover:bg-blue-50 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Edit3 className="w-3 h-3 text-blue-600" /> Edit Meeting Link
                          </button>
                          <button
                            onClick={() => handleDeleteSeminar(s.id)}
                            className="px-2 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-[11px] font-semibold transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder space-y-3">
              <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">No live classes scheduled</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Check back soon or ask your faculty instructor for upcoming cohort live stream links.
              </p>
            </div>
          )}

        </div>
      </div>

      {/* Teacher Modal for Scheduling / Editing Live Class */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-brand-darkBg"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-lg font-bold text-brand-deepBlue dark:text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-brand-glowCyan" />
                {editingId ? 'Edit Live Class Link & Details' : 'Schedule New Live Class'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Provide your Google Meet, Microsoft Teams, or Zoom link for students to join.
              </p>
            </div>

            <form onSubmit={handleSaveSeminar} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Class Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Memory Forensics Live Case Study Analysis"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-brand-darkBorder bg-slate-50 dark:bg-brand-darkBg text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-glowCyan outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Join Meeting URL (Google Meet / Teams / Zoom / Webex)
                </label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="url"
                    required
                    placeholder="https://meet.google.com/abc-defg-hij or https://teams.microsoft.com/..."
                    value={formData.link}
                    onChange={e => setFormData({ ...formData, link: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-brand-darkBorder bg-slate-50 dark:bg-brand-darkBg text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-glowCyan outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-brand-darkBorder bg-slate-50 dark:bg-brand-darkBg text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-glowCyan outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    required
                    min={15}
                    max={240}
                    value={formData.durationMinutes}
                    onChange={e => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-brand-darkBorder bg-slate-50 dark:bg-brand-darkBg text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-glowCyan outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Instructor Name</label>
                  <input
                    type="text"
                    required
                    value={formData.instructorName}
                    onChange={e => setFormData({ ...formData, instructorName: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-brand-darkBorder bg-slate-50 dark:bg-brand-darkBg text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-glowCyan outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Max Participant Seats</label>
                  <input
                    type="number"
                    required
                    min={10}
                    value={formData.maxParticipants}
                    onChange={e => setFormData({ ...formData, maxParticipants: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-brand-darkBorder bg-slate-50 dark:bg-brand-darkBg text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-glowCyan outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Session Description / Topic</label>
                <textarea
                  rows={3}
                  placeholder="Outline what evidence artifacts or tools will be covered live."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-brand-darkBorder bg-slate-50 dark:bg-brand-darkBg text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-glowCyan outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-brand-darkBorder">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-brand-darkBg text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-brand-deepBlue text-white dark:bg-brand-glowBlue font-bold hover:bg-brand-glowCyan transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingId ? 'Update Meeting Link' : 'Schedule Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
