import { useState } from 'react';
import { ChevronRight, ChevronLeft, Video, Clock } from 'lucide-react';
import { buildMonthGrid, isSameDay, addMonths, WEEKDAY_LABELS, MONTH_LABELS } from '../lib/calendar';

interface Session {
  id?: string;
  title: string;
  date: string | Date;
  durationMinutes?: number;
  link?: string;
  courseTitle?: string;
}

export default function LectureCalendar({ sessions }: { sessions: Session[] }) {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<Date>(today);

  const grid = buildMonthGrid(cursor.getFullYear(), cursor.getMonth());
  const sessionsOn = (day: Date) => sessions.filter(s => isSameDay(new Date(s.date), day));
  const selectedSessions = sessionsOn(selected).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-extrabold uppercase tracking-widest text-brand-deepBlue dark:text-white">
          {MONTH_LABELS[cursor.getMonth()]} {cursor.getFullYear()}
        </h4>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setCursor(addMonths(cursor, -1))} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-brand-darkBorder text-slate-600 dark:text-slate-300">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => { setCursor(new Date(today.getFullYear(), today.getMonth(), 1)); setSelected(today); }} className="px-2 py-1 rounded text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-brand-darkBorder">
            Today
          </button>
          <button type="button" onClick={() => setCursor(addMonths(cursor, 1))} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-brand-darkBorder text-slate-600 dark:text-slate-300">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map(label => (
          <div key={label} className="text-center text-[10px] font-bold uppercase text-slate-400 py-1">{label.slice(0, 1)}</div>
        ))}

        {grid.map((day, idx) => {
          const count = sessionsOn(day).length;
          const inMonth = day.getMonth() === cursor.getMonth();
          const isSelected = isSameDay(day, selected);
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setSelected(day)}
              className={`aspect-square rounded-lg text-[11px] font-bold flex flex-col items-center justify-center gap-0.5 transition-colors ${
                isSelected
                  ? 'bg-brand-deepBlue text-white'
                  : isSameDay(day, today)
                    ? 'bg-brand-glowCyan/15 text-brand-deepBlue dark:text-brand-glowCyan'
                    : inMonth
                      ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-brand-darkBorder'
                      : 'text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-brand-darkBg'
              }`}
            >
              {day.getDate()}
              {count > 0 && (
                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-brand-glowCyan'}`} />
              )}
            </button>
          );
        })}
      </div>

      <div className="border-t border-slate-100 dark:border-brand-darkBorder pt-3 space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {selected.toDateString()}
        </span>
        {selectedSessions.length > 0 ? (
          selectedSessions.map((s, idx) => (
            <div key={s.id || idx} className="p-2.5 rounded-lg border border-slate-100 dark:border-brand-darkBorder space-y-1">
              <span className="text-xs font-bold text-brand-deepBlue dark:text-white block">{s.title}</span>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(s.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {s.durationMinutes ? ` · ${s.durationMinutes}m` : ''}
                {s.courseTitle ? ` · ${s.courseTitle}` : ''}
              </span>
              {s.link && (
                <a href={s.link} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-brand-glowBlue dark:text-brand-glowCyan flex items-center gap-1 hover:underline">
                  <Video className="w-3 h-3" /> Join session
                </a>
              )}
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-400">No live lectures on this day.</p>
        )}
      </div>
    </div>
  );
}
