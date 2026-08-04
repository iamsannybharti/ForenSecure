import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import SEO from '../components/SEO';
import CourseCard from '../components/CourseCard';
import { Search, Filter, ShieldAlert, ChevronDown, Check, X } from 'lucide-react';

interface DropdownOption {
  id: string;
  label: string;
}

interface MultiSelectDropdownProps {
  label: string;
  options: DropdownOption[];
  selected: string[];
  onChange: (newSelected: string[]) => void;
  placeholder?: string;
}

function MultiSelectDropdown({ label, options, selected, onChange, placeholder }: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isAllSelected = selected.length === 0 || selected.includes('All');

  const toggleOption = (id: string) => {
    if (id === 'All') {
      onChange([]);
      return;
    }

    let next: string[];
    if (selected.includes(id)) {
      next = selected.filter(item => item !== id);
    } else {
      next = [...selected.filter(item => item !== 'All'), id];
    }
    onChange(next);
  };

  const getDisplayText = () => {
    if (isAllSelected) {
      return placeholder || `All ${label}s`;
    }
    if (selected.length === 1) {
      const found = options.find(o => o.id === selected[0]);
      return found ? found.label : selected[0];
    }
    return `${selected.length} Selected`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">
        {label}
      </label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder text-xs text-left flex items-center justify-between text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-glowCyan transition-all hover:border-slate-300 dark:hover:border-slate-600"
      >
        <span className="truncate font-semibold pr-2">
          {getDisplayText()}
        </span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!isAllSelected && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
              className="p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              title="Clear selection"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div className="absolute z-30 mt-1.5 w-full rounded-2xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-xl p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
          
          {/* Search box if option list has more than 5 items */}
          {options.length > 5 && (
            <div className="p-1 mb-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder={`Search ${label}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-8 pl-8 pr-2 text-xs rounded-lg bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-glowCyan"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          )}

          {/* Option list */}
          <div className="max-h-56 overflow-y-auto space-y-0.5 pr-0.5 custom-scrollbar">
            {/* All option */}
            <button
              type="button"
              onClick={() => toggleOption('All')}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between font-semibold transition-colors ${
                isAllSelected
                  ? 'bg-brand-deepBlue/10 dark:bg-brand-glowCyan/10 text-brand-deepBlue dark:text-brand-glowCyan'
                  : 'hover:bg-slate-100 dark:hover:bg-brand-darkBg text-slate-600 dark:text-slate-300'
              }`}
            >
              <span>All {label}s</span>
              {isAllSelected && <Check className="w-3.5 h-3.5 text-brand-glowCyan flex-shrink-0" />}
            </button>

            {filteredOptions.map((opt) => {
              const isChecked = selected.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleOption(opt.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between font-medium transition-colors ${
                    isChecked
                      ? 'bg-brand-deepBlue text-white dark:bg-brand-glowBlue'
                      : 'hover:bg-slate-100 dark:hover:bg-brand-darkBg text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span className="truncate pr-2">{opt.label}</span>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                    isChecked
                      ? 'bg-white border-white text-brand-deepBlue'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Courses() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState<any[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [categories, setCategories] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters Multi-Select State
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    const param = searchParams.get('category');
    return param ? param.split(',').filter(Boolean) : [];
  });
  const [selectedLevels, setSelectedLevels] = useState<string[]>(() => {
    const param = searchParams.get('level');
    return param ? param.split(',').filter(Boolean) : [];
  });
  const [selectedFormats, setSelectedFormats] = useState<string[]>(() => {
    const param = searchParams.get('format');
    return param ? param.split(',').filter(Boolean) : [];
  });
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  const formatOptions: DropdownOption[] = [
    { id: 'Self-Paced', label: 'Self-Paced Courses' },
    { id: 'Live', label: 'Live Cohorts' },
    { id: 'Diploma', label: 'Professional Diplomas' }
  ];

  const levelOptions: DropdownOption[] = [
    { id: 'Beginner', label: 'Beginner' },
    { id: 'Intermediate', label: 'Intermediate' },
    { id: 'Advanced', label: 'Advanced' }
  ];

  useEffect(() => {
    fetch('/api/courses')
      .then(async res => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || 'Unable to load courses');
        }
        return res.json();
      })
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setCourses(list);
        
        // Extract unique categories dynamically
        const cats = Array.from(new Set(list.map((c: any) => c.category).filter(Boolean))) as string[];
        setCategories(cats.map(c => ({ id: c, label: c })));
      })
      .catch(reason => setError(reason instanceof Error ? reason.message : 'Unable to load courses'))
      .finally(() => setLoading(false));
  }, []);

  // Update filters if URL params change
  useEffect(() => {
    const search = searchParams.get('search') || '';
    const cat = searchParams.get('category');
    const fmt = searchParams.get('format');
    const lvl = searchParams.get('level');
    
    setSearchQuery(search);
    setSelectedCategories(cat ? cat.split(',').filter(Boolean) : []);
    setSelectedFormats(fmt ? fmt.split(',').filter(Boolean) : []);
    setSelectedLevels(lvl ? lvl.split(',').filter(Boolean) : []);
  }, [searchParams]);

  // Apply filters logic
  useEffect(() => {
    let result = courses;

    // Filter by Categories (Multi-select)
    if (selectedCategories.length > 0 && !selectedCategories.includes('All')) {
      result = result.filter(c => selectedCategories.includes(c.category));
    }

    // Filter by Levels / Difficulty (Multi-select)
    if (selectedLevels.length > 0 && !selectedLevels.includes('All')) {
      result = result.filter(c => selectedLevels.includes(c.difficulty));
    }

    // Filter by Format / Program Type (Multi-select)
    if (selectedFormats.length > 0 && !selectedFormats.includes('All')) {
      result = result.filter(c => {
        return selectedFormats.some(fmt => {
          if (fmt === 'Diploma') return c.format === 'diploma';
          if (fmt === 'Live') return c.courseType === 'live' && c.format !== 'diploma';
          if (fmt === 'Self-Paced') return c.courseType !== 'live' && c.format !== 'diploma';
          return false;
        });
      });
    }

    // Filter by Search Keyword
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => 
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q)) ||
        (c.category && c.category.toLowerCase().includes(q))
      );
    }

    setFilteredCourses(result);
  }, [courses, selectedCategories, selectedLevels, selectedFormats, searchQuery]);

  // Helper to sync state changes to URL query parameters
  const updateUrlParams = (newCats: string[], newFmts: string[], newLvls: string[], newSearch: string) => {
    const params = new URLSearchParams();
    if (newCats.length > 0) params.set('category', newCats.join(','));
    if (newFmts.length > 0) params.set('format', newFmts.join(','));
    if (newLvls.length > 0) params.set('level', newLvls.join(','));
    if (newSearch) params.set('search', newSearch);
    setSearchParams(params);
  };

  const handleCategoriesChange = (newSelected: string[]) => {
    setSelectedCategories(newSelected);
    updateUrlParams(newSelected, selectedFormats, selectedLevels, searchQuery);
  };

  const handleFormatsChange = (newSelected: string[]) => {
    setSelectedFormats(newSelected);
    updateUrlParams(selectedCategories, newSelected, selectedLevels, searchQuery);
  };

  const handleLevelsChange = (newSelected: string[]) => {
    setSelectedLevels(newSelected);
    updateUrlParams(selectedCategories, selectedFormats, newSelected, searchQuery);
  };

  const handleResetFilters = () => {
    setSelectedCategories([]);
    setSelectedFormats([]);
    setSelectedLevels([]);
    setSearchQuery('');
    setSearchParams({});
  };

  const hasActiveFilters = selectedCategories.length > 0 || selectedFormats.length > 0 || selectedLevels.length > 0 || searchQuery !== '';

  return (
    <>
      <SEO 
        title="Forensic Education Courses & Certifications" 
        description="Browse professional self-paced certifications and academic programs in Digital Forensics, Crime Scene Investigations, and Biometrics."
        canonicalPath="/courses"
      />

      <div className="relative min-h-screen pt-12 pb-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-brand-darkBg transition-colors duration-300">
        <div className="max-w-7xl mx-auto" data-reveal-stagger>
          
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-3xl font-extrabold tracking-tight heading-display text-brand-deepBlue dark:text-white mb-3">
              Forensic Science Programs
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm max-w-2xl">
              Equip yourself with practical court-admissible skills. Learn digital artifact carving, biometric ridge cataloging, and physical scene mapping under Indian IT and Evidence law templates.
            </p>
          </div>

          {/* Search and Filters Hub */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Left Sidebar Filters */}
            <div className="lg:col-span-1 space-y-6">
              <div className="p-5 rounded-2xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm space-y-6">
                
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-brand-darkBorder pb-3">
                  <h2 className="text-xs uppercase font-extrabold tracking-widest text-brand-deepBlue dark:text-white flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-brand-glowCyan" />
                    Filter Catalog
                  </h2>
                  {hasActiveFilters && (
                    <button 
                      onClick={handleResetFilters}
                      className="text-[11px] text-brand-glowBlue dark:text-brand-glowCyan hover:underline font-semibold"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Search query field */}
                <div>
                  <label htmlFor="search-courses" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">
                    Search
                  </label>
                  <div className="relative">
                    <input
                      id="search-courses"
                      type="text"
                      placeholder="Keyword Search..."
                      value={searchQuery}
                      onChange={e => {
                        const val = e.target.value;
                        setSearchQuery(val);
                        updateUrlParams(selectedCategories, selectedFormats, selectedLevels, val);
                      }}
                      className="w-full h-10 pl-9 pr-3 rounded-xl text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-brand-glowCyan focus:outline-none"
                    />
                    <Search className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>

                {/* Multi-Select Dropdown 1: Program Type */}
                <MultiSelectDropdown
                  label="Program Type"
                  options={formatOptions}
                  selected={selectedFormats}
                  onChange={handleFormatsChange}
                  placeholder="All Program Types"
                />

                {/* Multi-Select Dropdown 2: Category */}
                <MultiSelectDropdown
                  label="Category"
                  options={categories}
                  selected={selectedCategories}
                  onChange={handleCategoriesChange}
                  placeholder="All Categories"
                />

                {/* Multi-Select Dropdown 3: Difficulty */}
                <MultiSelectDropdown
                  label="Difficulty"
                  options={levelOptions}
                  selected={selectedLevels}
                  onChange={handleLevelsChange}
                  placeholder="All Difficulties"
                />

              </div>
            </div>

            {/* Right Course Grid */}
            <div className="lg:col-span-3">
              {loading ? (
                <div className="grid min-h-64 place-items-center"><div className="h-9 w-9 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>
              ) : error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
              ) : filteredCourses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                  {filteredCourses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder rounded-2xl space-y-3">
                  <ShieldAlert className="w-12 h-12 text-slate-400 mx-auto" />
                  <h3 className="text-sm font-bold text-brand-deepBlue dark:text-white mb-1">
                    No programs matched your active filters
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Try clearing one or more active parameters or searching with a different keyword.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 rounded-xl bg-brand-deepBlue dark:bg-brand-glowBlue text-white text-xs font-bold hover:bg-brand-glowCyan transition-colors"
                  >
                    Reset All Filters
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </>
  );
}
