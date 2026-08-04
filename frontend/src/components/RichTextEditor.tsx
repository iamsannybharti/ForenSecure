import React, { useRef, useEffect, useState } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Link2, Code, Heading2, Heading3, Quote, Eraser, Image as ImageIcon } from 'lucide-react';

// contentEditable + execCommand: deprecated but universally supported, and it keeps the stored
// value plain HTML, which is exactly what the student player already renders.
type Cmd = { icon: React.ElementType; title: string; run: () => void };

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  // When provided, an image button appears; the parent uploads the file and
  // resolves to a URL that gets inserted inline. Kept optional so the course
  // builder's editors are unchanged.
  onRequestImage?: () => Promise<string | null>;
}

export default function RichTextEditor({ value, onChange, placeholder, minHeight = '9rem', onRequestImage }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showSource, setShowSource] = useState(false);

  // Only push the prop back into the DOM when it actually differs, otherwise every keystroke
  // would re-render the node and drop the caret to the start.
  useEffect(() => {
    const el = editorRef.current;
    if (el && !showSource && el.innerHTML !== value) el.innerHTML = value || '';
  }, [value, showSource]);

  const exec = (command: string, arg?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    onChange(editorRef.current?.innerHTML || '');
  };

  const commands: Cmd[] = [
    { icon: Bold, title: 'Bold', run: () => exec('bold') },
    { icon: Italic, title: 'Italic', run: () => exec('italic') },
    { icon: Underline, title: 'Underline', run: () => exec('underline') },
    { icon: Heading2, title: 'Section heading', run: () => exec('formatBlock', '<h2>') },
    { icon: Heading3, title: 'Sub heading', run: () => exec('formatBlock', '<h3>') },
    { icon: Quote, title: 'Quote', run: () => exec('formatBlock', '<blockquote>') },
    { icon: List, title: 'Bullet list', run: () => exec('insertUnorderedList') },
    { icon: ListOrdered, title: 'Numbered list', run: () => exec('insertOrderedList') },
    {
      icon: Link2,
      title: 'Insert link',
      run: () => {
        const href = window.prompt('Link URL');
        if (href) exec('createLink', href);
      }
    },
    { icon: Code, title: 'Monospace', run: () => exec('formatBlock', '<pre>') },
    { icon: Eraser, title: 'Clear formatting', run: () => exec('removeFormat') },
    ...(onRequestImage
      ? [{
          icon: ImageIcon,
          title: 'Insert image',
          run: async () => {
            const url = await onRequestImage();
            if (url) exec('insertImage', url);
          }
        }]
      : [])
  ];

  return (
    <div className="rounded-lg border border-slate-202 dark:border-brand-darkBorder bg-white dark:bg-brand-darkBg overflow-hidden">
      <div className="flex flex-wrap items-center gap-0.5 px-1.5 py-1 border-b border-slate-202 dark:border-brand-darkBorder bg-slate-50 dark:bg-brand-darkCard">
        {commands.map(({ icon: Icon, title, run }) => (
          <button
            key={title}
            type="button"
            title={title}
            disabled={showSource}
            onMouseDown={e => e.preventDefault()} // keep the selection while the button takes focus
            onClick={run}
            className="p-1.5 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-brand-darkBorder disabled:opacity-30"
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowSource(s => !s)}
          className={`ml-auto px-2 py-1 rounded text-[10px] font-bold ${showSource ? 'bg-brand-deepBlue text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-brand-darkBorder'}`}
        >
          {showSource ? 'Editor' : 'HTML'}
        </button>
      </div>

      {showSource ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-2.5 text-xs font-mono bg-transparent text-slate-800 dark:text-white outline-none resize-y"
          style={{ minHeight }}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          data-placeholder={placeholder}
          onInput={e => onChange((e.target as HTMLDivElement).innerHTML)}
          className="rte-content w-full p-2.5 text-xs text-slate-800 dark:text-white outline-none overflow-y-auto"
          style={{ minHeight }}
        />
      )}
    </div>
  );
}
