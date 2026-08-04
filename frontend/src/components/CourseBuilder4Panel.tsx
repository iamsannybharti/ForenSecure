import React, { useState } from 'react';
import {
  Layers, Plus, Trash2, ArrowUp, ArrowDown, Video, FileText, FileCode,
  GraduationCap, FileCheck, Eye, Save, Settings, Sparkles, Check, X, Bookmark, Lock, HelpCircle, CalendarClock
} from 'lucide-react';

interface CourseBuilder4PanelProps {
  courseForm: any;
  setCourseForm: React.Dispatch<React.SetStateAction<any>>;
  onSave: (e: React.FormEvent) => void;
  onClose: () => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CourseBuilder4Panel({ courseForm, setCourseForm, onSave, onClose }: CourseBuilder4PanelProps) {
  const [activeTopicIdx, setActiveTopicIdx] = useState(0);
  const [activeSubTopicIdx, setActiveSubTopicIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'builder' | 'details' | 'preview'>('builder');

  const setField = (field: string, value: any) => setCourseForm((prev: any) => ({ ...prev, [field]: value }));

  const schedule = courseForm.schedule || { days: [], time: '18:00', meetLink: '', durationMinutes: 60 };
  const setSchedule = (patch: any) => setField('schedule', { ...schedule, ...patch });
  const toggleDay = (d: number) =>
    setSchedule({ days: schedule.days.includes(d) ? schedule.days.filter((x: number) => x !== d) : [...schedule.days, d].sort() });

  const assessment: { name: string; weightage: string }[] = courseForm.assessmentStructure || [];
  const setAssessment = (rows: any[]) => setField('assessmentStructure', rows);

  const topics = courseForm.topics || [];
  const currentTopic = topics[activeTopicIdx] || null;
  const currentSubTopic = currentTopic?.subTopics?.[activeSubTopicIdx] || null;

  // Handlers for Topics/Subtopics
  const handleAddTopic = () => {
    const newTopic = {
      title: `Module ${topics.length + 1}: Syllabus Section`,
      isCollapsed: false,
      subTopics: [
        {
          title: 'Lesson 1: Lecture Video & Notes',
          type: 'video',
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          richTextContent: '<p>Lecture notes and key takeaways...</p>',
          documentName: 'Handbook.pdf',
          documentUrl: '#',
          isPreview: false
        }
      ]
    };
    setCourseForm((prev: any) => ({ ...prev, topics: [...prev.topics, newTopic] }));
    setActiveTopicIdx(topics.length);
    setActiveSubTopicIdx(0);
  };

  const handleMoveTopic = (index: number, direction: 'up' | 'down') => {
    const updated = [...topics];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= updated.length) return;
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setCourseForm((prev: any) => ({ ...prev, topics: updated }));
    setActiveTopicIdx(targetIdx);
  };

  const handleDeleteTopic = (index: number) => {
    const updated = topics.filter((_: any, i: number) => i !== index);
    setCourseForm((prev: any) => ({ ...prev, topics: updated }));
    if (activeTopicIdx >= updated.length) setActiveTopicIdx(Math.max(0, updated.length - 1));
  };

  const handleAddSubTopic = (tIdx: number) => {
    const updated = [...topics];
    const subCount = updated[tIdx].subTopics.length;
    updated[tIdx].subTopics.push({
      title: `Lesson ${subCount + 1}: Video Stream`,
      type: 'video',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      richTextContent: '<p>Lesson reading handbook...</p>',
      isPreview: false
    });
    setCourseForm((prev: any) => ({ ...prev, topics: updated }));
    setActiveSubTopicIdx(subCount);
  };

  const handleUpdateSubTopic = (field: string, value: any) => {
    if (!currentTopic || !currentSubTopic) return;
    const updatedTopics = [...topics];
    updatedTopics[activeTopicIdx].subTopics[activeSubTopicIdx] = {
      ...updatedTopics[activeTopicIdx].subTopics[activeSubTopicIdx],
      [field]: value
    };
    setCourseForm((prev: any) => ({ ...prev, topics: updatedTopics }));
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 z-50 flex flex-col font-sans">
      
      {/* 1. TOP HEADER TOOLBAR */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-glowBlue to-brand-glowCyan flex items-center justify-center font-bold text-slate-900 text-sm shadow-md">
            4P
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold tracking-wide">{courseForm.title || 'Untitled Course'}</h2>
              <span className="px-2 py-0.5 rounded bg-brand-glowCyan/10 text-brand-glowCyan text-[10px] font-mono font-bold">
                v{courseForm.version || 1}.0 Enterprise
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-semibold block">Auto-Save Status: Active • Real-Time Live Sync</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5">
            {([['builder', 'Lessons', Layers], ['details', 'Course Details', Settings], ['preview', 'Preview', Eye]] as const).map(([key, label, Icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === key ? 'bg-brand-glowCyan text-slate-900' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onSave}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-brand-deepBlue to-brand-glowBlue text-white text-xs font-bold hover:from-brand-glowBlue hover:to-brand-glowCyan flex items-center gap-1.5 shadow-md"
          >
            <Save className="w-3.5 h-3.5" /> Publish Snapshot
          </button>

          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. MAIN 4-PANEL WORKSPACE */}
      {activeTab === 'builder' && (
        <div className="flex-grow grid grid-cols-12 overflow-hidden bg-slate-950 text-xs">
          
          {/* PANEL 1: COURSE OUTLINE WORKSPACE (Cols 3) */}
          <section className="col-span-3 border-r border-slate-800 bg-slate-900/60 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-brand-glowCyan" /> Course Outline ({topics.length})
              </span>
              <button
                type="button"
                onClick={handleAddTopic}
                className="px-2.5 py-1 rounded bg-brand-glowCyan/10 text-brand-glowCyan hover:bg-brand-glowCyan/20 text-[11px] font-bold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Section
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {topics.map((topic: any, tIdx: number) => (
                <div
                  key={tIdx}
                  className={`p-3 rounded-xl border transition-all ${
                    activeTopicIdx === tIdx ? 'bg-slate-800/80 border-brand-glowCyan/50 shadow-md' : 'bg-slate-900/40 border-slate-800 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex justify-between items-center gap-1 mb-2">
                    <input
                      type="text"
                      value={topic.title}
                      onChange={e => {
                        const updated = [...topics];
                        updated[tIdx].title = e.target.value;
                        setCourseForm({ ...courseForm, topics: updated });
                      }}
                      className="w-full h-7 px-2 rounded bg-slate-950 border border-slate-800 font-bold text-xs text-white focus:outline-none"
                    />
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        disabled={tIdx === 0}
                        onClick={() => handleMoveTopic(tIdx, 'up')}
                        className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={tIdx === topics.length - 1}
                        onClick={() => handleMoveTopic(tIdx, 'down')}
                        className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTopic(tIdx)}
                        className="p-1 rounded text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 pl-2 border-l border-slate-800">
                    {topic.subTopics?.map((sub: any, sIdx: number) => {
                      const isSubActive = activeTopicIdx === tIdx && activeSubTopicIdx === sIdx;
                      return (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => {
                            setActiveTopicIdx(tIdx);
                            setActiveSubTopicIdx(sIdx);
                          }}
                          className={`w-full text-left p-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-all ${
                            isSubActive
                              ? 'bg-brand-glowBlue text-white shadow-sm'
                              : 'text-slate-300 hover:bg-slate-800/60'
                          }`}
                        >
                          <span className="truncate pr-2">{sub.title}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-950/60 text-slate-400">
                            {sub.type || 'video'}
                          </span>
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => handleAddSubTopic(tIdx)}
                      className="w-full py-1.5 rounded text-[11px] font-bold text-brand-glowCyan hover:bg-brand-glowCyan/10 text-center block mt-1"
                    >
                      + Add Lesson
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* PANEL 2: CONTENT EDITOR WORKSPACE (Cols 4) */}
          <section className="col-span-4 border-r border-slate-800 bg-slate-900/30 flex flex-col overflow-y-auto p-5 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 block">
                Panel 2 • Content Editor
              </span>
              <h3 className="text-sm font-bold text-white mt-0.5">{currentSubTopic?.title || 'Select Lesson'}</h3>
            </div>

            {currentSubTopic ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Lesson Title</label>
                  <input
                    type="text"
                    value={currentSubTopic.title}
                    onChange={e => handleUpdateSubTopic('title', e.target.value)}
                    className="w-full h-8 px-3 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Video URL (YouTube / Stream)</label>
                  <input
                    type="text"
                    value={currentSubTopic.videoUrl || ''}
                    onChange={e => handleUpdateSubTopic('videoUrl', e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full h-8 px-3 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Attachment Handbook File Name</label>
                  <input
                    type="text"
                    value={currentSubTopic.documentName || ''}
                    onChange={e => handleUpdateSubTopic('documentName', e.target.value)}
                    placeholder="Lesson_Handbook.pdf"
                    className="w-full h-8 px-3 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Lecture Reading Notes (HTML / Markdown)</label>
                  <textarea
                    rows={6}
                    value={currentSubTopic.richTextContent || ''}
                    onChange={e => handleUpdateSubTopic('richTextContent', e.target.value)}
                    placeholder="Enter lecture reading material here..."
                    className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-white font-sans text-xs focus:outline-none leading-relaxed"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">Select a section lesson to edit content</div>
            )}
          </section>

          {/* PANEL 3: PROPERTIES & SETTINGS WORKSPACE (Cols 3) */}
          <section className="col-span-3 border-r border-slate-800 bg-slate-900/60 flex flex-col overflow-y-auto p-5 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 block">
                Panel 3 • Properties & Policy
              </span>
              <h3 className="text-sm font-bold text-white mt-0.5">Lesson Rules</h3>
            </div>

            {/* Program-level settings — these decide where the course is listed and how its status reads. */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Program Settings</span>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Listing</label>
                <select
                  value={courseForm.format || 'course'}
                  onChange={e => setCourseForm({ ...courseForm, format: e.target.value })}
                  className="w-full h-8 px-2 rounded bg-slate-900 border border-slate-800 text-white font-semibold text-xs"
                >
                  <option value="course">Catalog Course</option>
                  <option value="diploma">Professional Diploma</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Delivery</label>
                <select
                  value={courseForm.courseType || 'recorded'}
                  onChange={e => setCourseForm({ ...courseForm, courseType: e.target.value })}
                  className="w-full h-8 px-2 rounded bg-slate-900 border border-slate-800 text-white font-semibold text-xs"
                >
                  <option value="recorded">Premade / Self-paced</option>
                  <option value="live">Live (scheduled)</option>
                </select>
              </div>

              {courseForm.courseType === 'live' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Start Date *</label>
                    <input
                      type="datetime-local"
                      required
                      value={courseForm.startDate || ''}
                      onChange={e => setCourseForm({ ...courseForm, startDate: e.target.value })}
                      className="w-full h-8 px-2 rounded bg-slate-900 border border-slate-800 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">End Date (optional)</label>
                    <input
                      type="datetime-local"
                      min={courseForm.startDate || undefined}
                      value={courseForm.endDate || ''}
                      onChange={e => setCourseForm({ ...courseForm, endDate: e.target.value })}
                      className="w-full h-8 px-2 rounded bg-slate-900 border border-slate-800 text-white text-xs"
                    />
                  </div>

                  {/* Weekly recurrence — expanded into individual live sessions on save. */}
                  <div className="pt-2 mt-1 border-t border-slate-800 space-y-2.5">
                    <span className="text-[10px] font-bold text-brand-glowCyan uppercase flex items-center gap-1.5">
                      <CalendarClock className="w-3 h-3" /> Weekly Class Schedule
                    </span>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Class Days</label>
                      <div className="flex flex-wrap gap-1">
                        {WEEKDAYS.map((label, d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => toggleDay(d)}
                            className={`w-8 h-7 rounded text-[10px] font-bold ${
                              schedule.days.includes(d) ? 'bg-brand-glowCyan text-slate-900' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Time</label>
                        <input
                          type="time"
                          value={schedule.time}
                          onChange={e => setSchedule({ time: e.target.value })}
                          className="w-full h-8 px-2 rounded bg-slate-900 border border-slate-800 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mins / session</label>
                        <input
                          type="number"
                          min={15}
                          value={schedule.durationMinutes}
                          onChange={e => setSchedule({ durationMinutes: Number(e.target.value) })}
                          className="w-full h-8 px-2 rounded bg-slate-900 border border-slate-800 text-white text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Google Meet / Teams / Zoom Link</label>
                      <input
                        type="url"
                        value={schedule.meetLink}
                        onChange={e => setSchedule({ meetLink: e.target.value })}
                        placeholder="https://meet.google.com/…"
                        className="w-full h-8 px-2 rounded bg-slate-900 border border-slate-800 text-white font-mono text-[11px]"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 leading-snug">
                      Sessions auto-generate on the chosen days from start to end date and appear on the Live Classes page.
                    </p>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Thumbnail URL</label>
                <input
                  type="text"
                  value={courseForm.thumbnailUrl || ''}
                  onChange={e => setCourseForm({ ...courseForm, thumbnailUrl: e.target.value })}
                  placeholder="/uploads/… or https://…"
                  className="w-full h-8 px-2 rounded bg-slate-900 border border-slate-800 text-white text-xs"
                />
              </div>
            </div>

            {currentSubTopic && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Lesson Type</label>
                  <select
                    value={currentSubTopic.type || 'video'}
                    onChange={e => handleUpdateSubTopic('type', e.target.value)}
                    className="w-full h-8 px-3 rounded-lg bg-slate-950 border border-slate-800 text-brand-glowCyan font-bold"
                  >
                    <option value="video">Video Lesson</option>
                    <option value="text">Text Lesson</option>
                    <option value="pdf">PDF Handbook</option>
                    <option value="quiz">Assessment Quiz</option>
                    <option value="assignment">Worksheet Assignment</option>
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="p3-prev"
                      checked={currentSubTopic.isPreview || false}
                      onChange={e => handleUpdateSubTopic('isPreview', e.target.checked)}
                      className="rounded text-brand-glowCyan"
                    />
                    <label htmlFor="p3-prev" className="text-xs font-bold text-white">Allow Free Preview</label>
                  </div>
                  <p className="text-[11px] text-slate-400">Unenrolled students can watch this lesson before purchasing.</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Course Seeking Policy</span>
                  <select
                    value={courseForm.seekingMode || 'free'}
                    onChange={e => setCourseForm({ ...courseForm, seekingMode: e.target.value })}
                    className="w-full h-8 px-2 rounded bg-slate-900 border border-slate-800 text-white font-semibold text-xs"
                  >
                    <option value="free">Free Navigation (Seek Anywhere)</option>
                    <option value="sequential">Sequential Learning (No Forward Seeking)</option>
                    <option value="strict">Strict Mode (Must Watch 100%)</option>
                  </select>
                </div>
              </div>
            )}
          </section>

          {/* PANEL 4: LIVE PREVIEW WORKSPACE (Cols 2) */}
          <section className="col-span-2 bg-slate-950 flex flex-col p-4 overflow-y-auto space-y-3 border-l border-slate-900">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">
              Panel 4 • Live Student Preview
            </span>

            {currentSubTopic?.videoUrl ? (
              <div className="aspect-video rounded-xl overflow-hidden bg-black border border-slate-800 relative shadow-lg">
                <iframe
                  src={currentSubTopic.videoUrl.replace('watch?v=', 'embed/')}
                  title="Live Preview"
                  className="w-full h-full pointer-events-none"
                />
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-center text-[11px]">
                No Video Attached
              </div>
            )}

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 space-y-1">
              <span className="font-bold text-white block">{currentSubTopic?.title}</span>
              <p className="line-clamp-3 text-slate-400">{currentSubTopic?.richTextContent?.replace(/<[^>]+>/g, '') || 'No text notes'}</p>
            </div>
          </section>

        </div>
      )}

      {/* COURSE DETAILS / MARKETING CMS — everything on the landing page */}
      {activeTab === 'details' && (
        <div className="flex-grow bg-slate-950 overflow-y-auto p-6 sm:p-10 text-xs">
          <div className="max-w-3xl mx-auto space-y-8 text-white">

            {/* Basics */}
            <section className="space-y-4">
              <h3 className="text-sm font-extrabold text-brand-glowCyan uppercase tracking-widest">Basics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Course Title" value={courseForm.title} onChange={v => setField('title', v)} />
                <Field label="Subtitle" value={courseForm.subTitle} onChange={v => setField('subTitle', v)} placeholder="Professional Foundation Micro Certification" />
                <Field label="Category" value={courseForm.category} onChange={v => setField('category', v)} />
                <Field label="Level" value={courseForm.level} onChange={v => setField('level', v)} placeholder="Beginner (Level 1)" />
                <Field label="Instructor Name" value={courseForm.instructorName} onChange={v => setField('instructorName', v)} />
                <Field label="Instructor Title" value={courseForm.instructorTitle} onChange={v => setField('instructorTitle', v)} />
                <Field label="Duration (weeks)" type="number" value={courseForm.durationWeeks} onChange={v => setField('durationWeeks', Number(v))} />
                <Field label="Price (INR)" type="number" value={courseForm.priceINR} onChange={v => setField('priceINR', Number(v))} />
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Difficulty</label>
                  <select
                    value={courseForm.difficulty || 'Beginner'}
                    onChange={e => setField('difficulty', e.target.value)}
                    className="w-full h-9 px-2 rounded-lg bg-slate-900 border border-slate-800 text-white font-semibold"
                  >
                    <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                  </select>
                </div>
              </div>
              <TextArea label="Short Description" value={courseForm.description} onChange={v => setField('description', v)} rows={3} />
              <TextArea label="Course Overview (long)" value={courseForm.overview} onChange={v => setField('overview', v)} rows={5} />
            </section>

            {/* List sections — one item per line */}
            <section className="space-y-4">
              <h3 className="text-sm font-extrabold text-brand-glowCyan uppercase tracking-widest">Landing Page Sections</h3>
              <p className="text-[11px] text-slate-500">One item per line. Each block maps to a section on the public course page.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextArea label="Course Highlights" value={courseForm.highlights} onChange={v => setField('highlights', v)} rows={5} />
                <TextArea label="Who Should Enroll / Eligibility" value={courseForm.eligibility} onChange={v => setField('eligibility', v)} rows={5} />
                <TextArea label="Learning Objectives & Outcomes" value={courseForm.learningObjectives} onChange={v => setField('learningObjectives', v)} rows={5} />
                <TextArea label="Curriculum Modules (Syllabus)" value={courseForm.syllabus} onChange={v => setField('syllabus', v)} rows={5} />
                <TextArea label="Learning Resources Included" value={courseForm.learningResources} onChange={v => setField('learningResources', v)} rows={5} />
                <TextArea label="Career Opportunities & Benefits" value={courseForm.careerBenefits} onChange={v => setField('careerBenefits', v)} rows={5} />
                <TextArea label="Practical Training & Virtual Labs" value={courseForm.practicalLabs} onChange={v => setField('practicalLabs', v)} rows={5} />
              </div>
            </section>

            {/* Assessment structure */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-brand-glowCyan uppercase tracking-widest">Assessment Structure</h3>
                <button
                  type="button"
                  onClick={() => setAssessment([...assessment, { name: '', weightage: '' }])}
                  className="px-2.5 py-1 rounded bg-brand-glowCyan/10 text-brand-glowCyan text-[11px] font-bold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Row
                </button>
              </div>
              <div className="space-y-2">
                {assessment.map((row, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      value={row.name}
                      onChange={e => setAssessment(assessment.map((r, j) => j === i ? { ...r, name: e.target.value } : r))}
                      placeholder="e.g. Final MCQ Examination"
                      className="flex-grow h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-white"
                    />
                    <input
                      value={row.weightage}
                      onChange={e => setAssessment(assessment.map((r, j) => j === i ? { ...r, weightage: e.target.value } : r))}
                      placeholder="40%"
                      className="w-24 h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-white text-center"
                    />
                    <button type="button" onClick={() => setAssessment(assessment.filter((_, j) => j !== i))} className="p-2 text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {assessment.length === 0 && <p className="text-[11px] text-slate-500">No rows yet — add the weighting breakdown shown on the course page.</p>}
              </div>
              <Field label="Passing Requirement" value={courseForm.passingCriteria} onChange={v => setField('passingCriteria', v)} placeholder="50% Overall Score" />
            </section>
          </div>
        </div>
      )}

      {activeTab === 'preview' && (
        /* FULL LIVE PREVIEW TAB VIEW */
        <div className="flex-grow bg-slate-900 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto bg-slate-950 rounded-3xl p-8 border border-slate-800 shadow-2xl space-y-6 text-white">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <span className="text-[11px] text-brand-glowCyan uppercase font-extrabold tracking-widest block">Live Student Preview Mode</span>
                <h1 className="text-xl font-extrabold mt-1">{currentSubTopic?.title}</h1>
              </div>
            </div>

            {currentSubTopic?.videoUrl && (
              <div className="aspect-video rounded-2xl overflow-hidden bg-black border border-slate-800">
                <iframe src={currentSubTopic.videoUrl.replace('watch?v=', 'embed/')} title="Preview" className="w-full h-full" allowFullScreen />
              </div>
            )}

            <div className="prose prose-invert text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: currentSubTopic?.richTextContent || '<p>No content</p>' }} />
          </div>
        </div>
      )}

    </div>
  );
}

// Small dark-themed inputs used across the Details tab.
function Field({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: any; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{label}</label>
      <input
        type={type}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-brand-glowCyan"
      />
    </div>
  );
}

function TextArea({ label, value, onChange, rows = 4 }: {
  label: string; value: any; onChange: (v: string) => void; rows?: number;
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{label}</label>
      <textarea
        rows={rows}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        className="w-full p-3 rounded-lg bg-slate-900 border border-slate-800 text-white leading-relaxed focus:outline-none focus:border-brand-glowCyan"
      />
    </div>
  );
}
