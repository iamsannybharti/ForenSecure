import { useState, useEffect } from 'react';
import SEO from '../components/SEO';
import { BookOpen, Calendar, User, Download, Copy, Check, ChevronLeft, Bookmark } from 'lucide-react';

export default function Research() {
  const [papers, setPapers] = useState<any[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Utilities
  const [copied, setCopied] = useState(false);
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    const saved = localStorage.getItem('research_bookmarks');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    setIsLoading(true);
    fetch('/api/research')
      .then(res => res.json())
      .then(data => {
        setPapers(data);
        const cats = Array.from(new Set(data.map((p: any) => p.category))) as string[];
        setCategories(['All', ...cats]);
        setIsLoading(false);
      })
      .catch(() => {
        setPapers([]);
        setCategories(['All']);
        setIsLoading(false);
      });
  }, []);

  const toggleBookmark = (id: string) => {
    let newBookmarks = [...bookmarks];
    if (bookmarks.includes(id)) {
      newBookmarks = newBookmarks.filter(b => b !== id);
    } else {
      newBookmarks.push(id);
    }
    setBookmarks(newBookmarks);
    localStorage.setItem('research_bookmarks', JSON.stringify(newBookmarks));
  };

  const copyCitation = (citationText: string) => {
    navigator.clipboard.writeText(citationText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredPapers = activeCategory === 'All'
    ? papers
    : papers.filter(p => p.category === activeCategory);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-brand-darkBg">
        <div className="w-10 h-10 border-4 border-brand-glowCyan border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title={selectedPaper ? selectedPaper.title : "Scientific Research & Publications Registry"}
        description="Search peer-reviewed journals, cyber forensic SOP checklists, and Section 45 legal admissibility proofs."
        canonicalPath={selectedPaper ? `/research?paper=${selectedPaper.slug}` : "/research"}
      />

      <div className="relative min-h-screen pt-12 pb-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-brand-darkBg transition-colors duration-300">
        <div className="max-w-5xl mx-auto" data-reveal-stagger>

          {/* READ ARTICLE VIEW */}
          {selectedPaper ? (
            <div className="space-y-6">
              
              <button
                onClick={() => setSelectedPaper(null)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-brand-glowCyan print:hidden"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Journal Index
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Article Details & TOC */}
                <div className="lg:col-span-8 p-6 sm:p-8 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm space-y-6">
                  
                  {/* Article Title Header */}
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-deepBlue/5 dark:bg-brand-glowCyan/10 text-brand-deepBlue dark:text-brand-glowCyan mb-3 inline-block">
                      {selectedPaper.category}
                    </span>
                    <h1 className="text-xl sm:text-2xl font-extrabold text-brand-deepBlue dark:text-white heading-display leading-tight">
                      {selectedPaper.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 mt-4 font-medium border-y border-slate-100 dark:border-brand-darkBorder py-3">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-brand-glowCyan" />
                        {selectedPaper.authors?.join(', ')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-brand-glowCyan" />
                        {new Date(selectedPaper.publishedDate || Date.now()).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span>{selectedPaper.readTimeMinutes} Mins Read</span>
                    </div>
                  </div>

                  {/* Abstract preview box */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-brand-darkBg/50 border-l-4 border-brand-glowCyan text-xs italic text-slate-600 dark:text-slate-300 leading-relaxed">
                    <span className="font-bold block text-slate-700 dark:text-white not-italic mb-1">Abstract</span>
                    {selectedPaper.abstract}
                  </div>

                  {/* Body Content (Simulating markdown rendering) */}
                  <article className="prose dark:prose-invert max-w-none text-xs leading-relaxed text-slate-700 dark:text-slate-300 space-y-4 whitespace-pre-line font-sans border-t border-slate-100 dark:border-brand-darkBorder pt-6">
                    {selectedPaper.content}
                  </article>

                </div>

                {/* Right Citation Sidebar */}
                <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6 print:hidden">
                  
                  {/* Action card */}
                  <div className="p-6 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm space-y-4">
                    <h3 className="text-xs uppercase font-extrabold tracking-widest text-brand-deepBlue dark:text-white">
                      Document Actions
                    </h3>
                    
                    <button
                      onClick={() => toggleBookmark(selectedPaper.id)}
                      className="w-full py-2.5 rounded-lg border border-slate-200 dark:border-brand-darkBorder hover:bg-slate-100 dark:hover:bg-brand-darkBg text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1.5 text-xs font-semibold"
                    >
                      <Bookmark className={`w-4 h-4 ${bookmarks.includes(selectedPaper.id) ? 'fill-brand-glowCyan text-brand-glowCyan' : ''}`} />
                      {bookmarks.includes(selectedPaper.id) ? 'Bookmarked' : 'Bookmark Article'}
                    </button>

                    <button
                      onClick={() => { alert('Downloading PDF...'); }}
                      className="w-full py-2.5 rounded-lg bg-brand-deepBlue dark:bg-brand-glowBlue hover:bg-brand-glowCyan text-white flex items-center justify-center gap-1.5 text-xs font-bold transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF Document
                    </button>
                  </div>

                  {/* Cite card */}
                  <div className="p-6 rounded-3xl bg-slate-100 dark:bg-brand-darkCard/50 border border-slate-200/50 dark:border-brand-darkBorder/50 space-y-3">
                    <span className="text-[11px] uppercase font-bold text-slate-500 block">
                      Citations Reference
                    </span>
                    <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-white dark:bg-brand-darkBg p-3 rounded-lg border border-slate-200 dark:border-brand-darkBorder leading-normal">
                      {selectedPaper.citation}
                    </p>
                    <button
                      onClick={() => copyCitation(selectedPaper.citation)}
                      className="text-xs font-semibold text-brand-glowBlue dark:text-brand-glowCyan flex items-center gap-1 hover:underline"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied' : 'Copy Citation'}
                    </button>
                  </div>

                </div>

              </div>

            </div>
          ) : (
            
            /* GENERAL JOURNAL INDEX VIEW */
            <div className="space-y-8">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-200 dark:border-brand-darkBorder pb-8">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight heading-display text-brand-deepBlue dark:text-white mb-2">
                    Research Journal
                  </h1>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    Search peer-reviewed forensic publications and legal-technical guidelines.
                  </p>
                </div>

                {/* Category toggles */}
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition-colors ${
                        activeCategory === cat
                          ? 'bg-brand-deepBlue text-white dark:bg-brand-glowBlue'
                          : 'bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder hover:bg-slate-100 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Research articles list */}
              <div className="space-y-6">
                {filteredPapers.map((paper) => (
                  <div 
                    key={paper.id}
                    className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder hover:border-brand-glowCyan hover:shadow-md transition-all duration-300 space-y-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-deepBlue/5 dark:bg-brand-glowCyan/10 text-brand-deepBlue dark:text-brand-glowCyan">
                          {paper.category}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {paper.readTimeMinutes} Mins Read
                        </span>
                      </div>
                      
                      <h2 
                        onClick={() => setSelectedPaper(paper)}
                        className="text-base font-extrabold text-brand-deepBlue dark:text-white hover:text-brand-glowCyan dark:hover:text-brand-glowCyan cursor-pointer transition-colors leading-tight line-clamp-2"
                      >
                        {paper.title}
                      </h2>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {paper.abstract}
                    </p>

                    <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-brand-darkBorder text-[11px] text-slate-400 font-semibold">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-brand-glowCyan" />
                        {paper.authors?.join(', ')}
                      </span>
                      <button
                        onClick={() => setSelectedPaper(paper)}
                        className="text-xs font-bold text-brand-glowBlue dark:text-brand-glowCyan hover:underline flex items-center gap-1"
                      >
                        Read Publication <BookOpen className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>
      </div>
    </>
  );
}
