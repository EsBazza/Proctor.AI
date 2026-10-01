'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Cpu, BookOpen, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  GraduationCap, 
  CheckCircle2, 
  RefreshCw, 
  FileText, 
  UploadCloud, 
  X, 
  Plus, 
  Trash2, 
  Files,
  History,
  Search,
  Check,
  FolderOpen,
  CheckSquare,
  Square,
  FolderPlus
} from 'lucide-react';
import { 
  createExamAction, 
  extractMultipleDocumentsAction, 
  StudentRosterItem 
} from '@/actions/exam';
import { getTeacherCoursesAction, getCourseRosterAction } from '@/actions/classroom';
import { 
  getPastMaterialsAction, 
  deletePastMaterialAction,
  deleteMultiplePastMaterialsAction,
  uploadMultipleToPastMaterialsAction,
  savePastMaterialAction
} from '@/actions/material';
import type { ClassroomCourse, ClassroomStudent } from '@/lib/google-classroom';
import type { PastMaterialRecord } from '@/lib/db';
import { AIExamGenerationModal } from '@/components/AIExamGenerationModal';

export interface EnrolledStudentItem extends ClassroomStudent {
  isPresent: boolean;
}

export default function CreateExamPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Google Classroom integration state
  const [courses, setCourses] = useState<ClassroomCourse[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedCourseName, setSelectedCourseName] = useState<string>('');
  const [importedStudents, setImportedStudents] = useState<EnrolledStudentItem[]>([]);
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);

  // Fallback manual roster option
  const [isManualRoster, setIsManualRoster] = useState(false);
  const [manualRosterText, setManualRosterText] = useState('');

  // Exam fields
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [language, setLanguage] = useState<'English' | 'Tagalog' | 'Bisaya'>('English');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [questionCount, setQuestionCount] = useState(4);
  const [maxStrikes, setMaxStrikes] = useState(2);
  const [lessonContent, setLessonContent] = useState('');

  const AVAILABLE_QUESTION_TYPES = [
    { id: 'MCQ', label: 'Multiple Choice', desc: '4-option questions (A, B, C, D)' },
    { id: 'TRUE_FALSE', label: 'True or False', desc: 'Binary statement verification' },
    { id: 'SHORT_ANSWER', label: 'Short Answer', desc: '1-2 sentence concise explanation' },
    { id: 'ESSAY', label: 'Essay', desc: 'In-depth conceptual analysis with live word counter' },
    { id: 'FILL_IN_BLANK', label: 'Fill in the Blank', desc: 'Sentence with missing key concept or formula' },
    { id: 'MATCHING', label: 'Matching Type', desc: 'Pair terms from Column A to Column B' },
    { id: 'IDENTIFICATION', label: 'Identification', desc: 'Provide term matching definition or clue' }
  ];

  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<string[]>([
    'MCQ',
    'TRUE_FALSE',
    'SHORT_ANSWER',
    'ESSAY'
  ]);

  const toggleQuestionType = (typeId: string) => {
    setSelectedQuestionTypes((prev) => {
      if (prev.includes(typeId)) {
        if (prev.length === 1) return prev;
        return prev.filter((t) => t !== typeId);
      }
      return [...prev, typeId];
    });
  };

  // Point Valuation & Scoring Scheme State
  const [pointsMode, setPointsMode] = useState<'AI_DYNAMIC' | 'FIXED' | 'BY_TYPE'>('AI_DYNAMIC');
  const [fixedPoints, setFixedPoints] = useState<number>(10);
  const [pointsByType, setPointsByType] = useState<Record<string, number>>({
    MCQ: 5,
    TRUE_FALSE: 2,
    SHORT_ANSWER: 5,
    ESSAY: 15,
    FILL_IN_BLANK: 5,
    MATCHING: 10,
    IDENTIFICATION: 5
  });

  const calculateTotalPointsDisplay = () => {
    if (pointsMode === 'FIXED') {
      return questionCount * fixedPoints;
    }
    if (pointsMode === 'BY_TYPE') {
      const selectedPoints = selectedQuestionTypes.map((t) => pointsByType[t] || 10);
      const avg = selectedPoints.length > 0
        ? selectedPoints.reduce((a, b) => a + b, 0) / selectedPoints.length
        : 10;
      return Math.round(avg * questionCount);
    }
    return questionCount * 10;
  };


  // Multi-document / PDF extraction state (Gemini 3.5 Flash Lite)
  const [queuedFiles, setQueuedFiles] = useState<File[]>([]);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [synthesizedDocNames, setSynthesizedDocNames] = useState<string[]>([]);
  const [tokensProcessed, setTokensProcessed] = useState<number | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAddFiles = (newFiles: FileList | File[]) => {
    setExtractionError(null);
    const validMimes = ['application/pdf', 'text/plain', 'image/png', 'image/jpeg', 'image/webp'];
    const added: File[] = [];

    Array.from(newFiles).forEach((file) => {
      const mime = file.type || 'application/pdf';
      if (!validMimes.includes(mime) && !file.name.toLowerCase().endsWith('.pdf')) {
        setExtractionError(`"${file.name}" is not a supported format. Please upload PDF, TXT, or images.`);
        return;
      }
      if (file.size > 4 * 1024 * 1024) {
        setExtractionError(`"${file.name}" exceeds the 4MB limit for serverless document uploads.`);
        return;
      }
      // avoid duplicates by name and size
      if (!queuedFiles.some((f) => f.name === file.name && f.size === file.size)) {
        added.push(file);
      }
    });

    if (added.length > 0) {
      setQueuedFiles((prev) => [...prev, ...added]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setQueuedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAllFiles = () => {
    setQueuedFiles([]);
    setSynthesizedDocNames([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExtractQueuedFiles = async (): Promise<boolean> => {
    if (queuedFiles.length === 0) return false;
    setIsExtractingPdf(true);
    setExtractionError(null);

    try {
      const formData = new FormData();
      queuedFiles.forEach((file) => formData.append('files', file));
      const res = await extractMultipleDocumentsAction(formData);

      if (res.success && res.extractedContent) {
        setLessonContent(res.extractedContent);
        setSynthesizedDocNames(res.fileNames || queuedFiles.map((f) => f.name));
        if (res.totalTokens) setTokensProcessed(res.totalTokens);
        if (!title && res.title) setTitle(res.title);
        if (!subject && res.subject) setSubject(res.subject);
        // Refresh past materials library with newly synthesized document
        loadPastMaterials();
        return true;
      } else {
        setExtractionError(res.error || 'Failed to extract content from documents.');
        return false;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error extracting files.';
      setExtractionError(msg);
      return false;
    } finally {
      setIsExtractingPdf(false);
    }
  };

  // Past Files & Saved Materials Library state (Multi-file enabled)
  const [sourceTab, setSourceTab] = useState<'upload' | 'past'>('upload');
  const [pastMaterials, setPastMaterials] = useState<PastMaterialRecord[]>([]);
  const [isLoadingPastMaterials, setIsLoadingPastMaterials] = useState(false);
  const [pastSearchQuery, setPastSearchQuery] = useState('');
  const [selectedPastMaterialIds, setSelectedPastMaterialIds] = useState<string[]>([]);
  const [isUploadingToLibrary, setIsUploadingToLibrary] = useState(false);
  const [libraryUploadStatus, setLibraryUploadStatus] = useState<string | null>(null);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteSubject, setNewNoteSubject] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const libraryFileInputRef = React.useRef<HTMLInputElement>(null);

  const loadPastMaterials = useCallback(async () => {
    setIsLoadingPastMaterials(true);
    try {
      const res = await getPastMaterialsAction();
      if (res.success && res.materials) {
        setPastMaterials(res.materials);
      }
    } catch (err) {
      console.warn('Error loading past materials:', err);
    } finally {
      setIsLoadingPastMaterials(false);
    }
  }, [setPastMaterials, setIsLoadingPastMaterials]);

  useEffect(() => {
    loadPastMaterials();
  }, [loadPastMaterials]);

  const toggleSelectPastMaterial = (id: string) => {
    setSelectedPastMaterialIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllPastMaterials = () => {
    const filtered = pastMaterials.filter((item) => {
      if (!pastSearchQuery.trim()) return true;
      const q = pastSearchQuery.toLowerCase();
      return (
        item.fileName.toLowerCase().includes(q) ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.subject && item.subject.toLowerCase().includes(q)) ||
        item.extractedContent.toLowerCase().includes(q)
      );
    });
    setSelectedPastMaterialIds(filtered.map((m) => m.id));
  };

  const handleDeselectAllPastMaterials = () => {
    setSelectedPastMaterialIds([]);
  };

  const handleUseSelectedPastMaterials = () => {
    if (selectedPastMaterialIds.length === 0) return;
    const selected = pastMaterials.filter((m) => selectedPastMaterialIds.includes(m.id));
    if (selected.length === 0) return;

    const mergedContent = selected
      .map((m) => m.extractedContent.trim())
      .filter(Boolean)
      .join('\n\n---\n\n');

    setLessonContent(mergedContent);
    const fileNames = selected.map((m) => m.fileName);
    setSynthesizedDocNames(fileNames);

    if (!title && selected[0]?.title) {
      setTitle(selected[0].title);
    }
    if (!subject && selected[0]?.subject) {
      setSubject(selected[0].subject);
    }
  };

  const handleAppendSelectedPastMaterials = () => {
    if (selectedPastMaterialIds.length === 0) return;
    const selected = pastMaterials.filter((m) => selectedPastMaterialIds.includes(m.id));
    if (selected.length === 0) return;

    const mergedContent = selected
      .map((m) => m.extractedContent.trim())
      .filter(Boolean)
      .join('\n\n---\n\n');

    setLessonContent((prev) =>
      prev.trim().length > 0 ? `${prev.trim()}\n\n---\n\n${mergedContent}` : mergedContent
    );

    const newNames = selected.map((m) => m.fileName);
    setSynthesizedDocNames((prev) => Array.from(new Set([...prev, ...newNames])));
  };

  const handleDeleteSelectedPastMaterials = async () => {
    if (selectedPastMaterialIds.length === 0) return;
    const toDelete = [...selectedPastMaterialIds];
    try {
      const res = await deleteMultiplePastMaterialsAction(toDelete);
      if (res.success) {
        setPastMaterials((prev) => prev.filter((m) => !toDelete.includes(m.id)));
        setSelectedPastMaterialIds([]);
      }
    } catch (err) {
      console.error('Error deleting selected materials:', err);
    }
  };

  const handleSelectPastMaterial = (item: PastMaterialRecord) => {
    setLessonContent(item.extractedContent);
    setSelectedPastMaterialIds([item.id]);
    setSynthesizedDocNames([item.fileName]);
    if (!title && item.title) setTitle(item.title);
    if (!subject && item.subject) setSubject(item.subject);
  };

  const handleAppendPastMaterial = (item: PastMaterialRecord) => {
    setLessonContent((prev) =>
      prev.trim().length > 0 ? `${prev.trim()}\n\n---\n\n${item.extractedContent}` : item.extractedContent
    );
    setSelectedPastMaterialIds((prev) =>
      prev.includes(item.id) ? prev : [...prev, item.id]
    );
    setSynthesizedDocNames((prev) =>
      prev.includes(item.fileName) ? prev : [...prev, item.fileName]
    );
  };

  const handleDeletePastMaterial = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await deletePastMaterialAction(id);
      if (res.success) {
        setPastMaterials((prev) => prev.filter((m) => m.id !== id));
        setSelectedPastMaterialIds((prev) => prev.filter((i) => i !== id));
      }
    } catch (err) {
      console.error('Error deleting past material:', err);
    }
  };

  const handleAddFilesToLibrary = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsUploadingToLibrary(true);
    setLibraryUploadStatus(`Uploading & analyzing ${files.length} document${files.length > 1 ? 's' : ''}...`);

    try {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append('files', f));
      const res = await uploadMultipleToPastMaterialsAction(formData);

      if (res.success && res.materials) {
        setPastMaterials((prev) => [...res.materials!, ...prev]);
        const newIds = res.materials.map((m) => m.id);
        setSelectedPastMaterialIds((prev) => Array.from(new Set([...prev, ...newIds])));
        setLibraryUploadStatus(`Successfully added ${res.addedCount} document${res.addedCount! > 1 ? 's' : ''} to library!`);
        setTimeout(() => setLibraryUploadStatus(null), 4000);
      } else {
        setLibraryUploadStatus(res.error || 'Failed to add files to library.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error adding files to library.';
      setLibraryUploadStatus(msg);
    } finally {
      setIsUploadingToLibrary(false);
      if (libraryFileInputRef.current) libraryFileInputRef.current.value = '';
    }
  };

  const handleSaveManualNote = async () => {
    if (!newNoteContent.trim()) return;
    setIsSavingNote(true);
    try {
      const res = await savePastMaterialAction({
        fileName: `${newNoteTitle.trim() || 'Study Notes'}.txt`,
        title: newNoteTitle.trim() || 'Study Notes',
        subject: newNoteSubject.trim() || 'General Subject',
        mimeType: 'text/plain',
        extractedContent: newNoteContent.trim()
      });
      if (res.success && res.material) {
        setPastMaterials((prev) => [res.material!, ...prev]);
        setSelectedPastMaterialIds((prev) => [...prev, res.material!.id]);
        setShowAddNoteModal(false);
        setNewNoteTitle('');
        setNewNoteSubject('');
        setNewNoteContent('');
        setLibraryUploadStatus('Custom study notes saved to library!');
        setTimeout(() => setLibraryUploadStatus(null), 3000);
      }
    } catch (err) {
      console.error('Error saving manual note:', err);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };


  const handleCourseSelect = useCallback(async (courseId: string, courseName?: string) => {
    setSelectedCourseId(courseId);
    setSelectedCourseName((prevName) => courseName || prevName);

    if (courseName) {
      setTitle((prev) => prev || `${courseName} - Unit Assessment`);
      setSubject((prev) => prev || courseName);
    }

    if (!courseId) {
      setImportedStudents([]);
      return;
    }

    setIsLoadingRoster(true);
    setError(null);
    try {
      const res = await getCourseRosterAction(courseId);
      if (res.success && res.students) {
        setImportedStudents(res.students.map((st) => ({ ...st, isPresent: true })));
      } else {
        setImportedStudents([]);
        if (res.error) {
          setError(res.error);
        }
      }
    } catch (err) {
      console.error('Error fetching roster:', err);
      setImportedStudents([]);
    } finally {
      setIsLoadingRoster(false);
    }
  }, []);

  const toggleStudentAttendance = (studentId: string) => {
    setImportedStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, isPresent: !s.isPresent } : s))
    );
  };

  const handleSelectAllStudents = () => {
    setImportedStudents((prev) => prev.map((s) => ({ ...s, isPresent: true })));
  };

  const handleDeselectAllStudents = () => {
    setImportedStudents((prev) => prev.map((s) => ({ ...s, isPresent: false })));
  };

  // Fetch teacher's Google Classroom courses on mount
  useEffect(() => {
    async function loadCourses() {
      setIsLoadingCourses(true);
      try {
        const res = await getTeacherCoursesAction();
        if (res.success && res.courses && res.courses.length > 0) {
          setCourses(res.courses);
          const firstCourse = res.courses[0];
          await handleCourseSelect(firstCourse.id, firstCourse.name);
        } else {
          setIsManualRoster(true);
        }
      } catch (err) {
        console.warn('Could not load Google Classroom courses:', err);
        setIsManualRoster(true);
      } finally {
        setIsLoadingCourses(false);
      }
    }

    loadCourses();
  }, [handleCourseSelect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let roster: StudentRosterItem[] = [];

    if (!isManualRoster) {
      if (importedStudents.length === 0) {
        setError('The selected Google Classroom course has no enrolled students. Please select another course or enter a manual roster.');
        return;
      }
      const activeStudents = importedStudents.filter((s) => s.isPresent);
      if (activeStudents.length === 0) {
        setError('Please check at least one present student to generate an exam.');
        return;
      }
      roster = activeStudents.map((s) => ({
        name: s.name,
        email: s.email ? s.email.trim() : undefined,
        googleUserId: s.id
      }));
    } else {
      const lines = manualRosterText.split('\n').filter((l) => l.trim().length > 0);
      roster = lines.map((line) => {
        const emailMatch = line.match(/\(([^)]+)\)/);
        const email = emailMatch ? emailMatch[1].trim() : undefined;
        const name = line.replace(/\([^)]+\)/, '').trim();
        return { name, email };
      });

      if (roster.length === 0) {
        setError('Please provide at least one student in the roster.');
        return;
      }
    }

    let activeLessonContent = lessonContent;
    let activeTitle = title;
    let activeSubject = subject;

    // If teacher hasn't parsed queued documents yet, parse them now before generating!
    if (!activeLessonContent.trim() && queuedFiles.length > 0) {
      setIsExtractingPdf(true);
      try {
        const formData = new FormData();
        queuedFiles.forEach((file) => formData.append('files', file));
        const parseRes = await extractMultipleDocumentsAction(formData);

        if (parseRes.success && parseRes.extractedContent) {
          activeLessonContent = parseRes.extractedContent;
          setLessonContent(parseRes.extractedContent);
          setSynthesizedDocNames(parseRes.fileNames || queuedFiles.map((f) => f.name));
          if (!activeTitle && parseRes.title) {
            activeTitle = parseRes.title;
            setTitle(parseRes.title);
          }
          if (!activeSubject && parseRes.subject) {
            activeSubject = parseRes.subject;
            setSubject(parseRes.subject);
          }
        } else {
          setError(parseRes.error || 'Failed to extract content from documents.');
          setIsExtractingPdf(false);
          return;
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error extracting documents.');
        setIsExtractingPdf(false);
        return;
      } finally {
        setIsExtractingPdf(false);
      }
    }

    if (!activeTitle || !activeSubject || !activeLessonContent) {
      setError('Please fill in or extract all required fields (Title, Subject, and Lesson Content).');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await createExamAction({
        title: activeTitle,
        subject: activeSubject,
        lessonContent: activeLessonContent,
        language,
        durationMinutes,
        questionCount,
        maxStrikes,
        questionTypes: selectedQuestionTypes,
        pointsMode,
        fixedPoints,
        pointsByType,
        roster,
        googleCourseId: selectedCourseId || undefined,
        googleCourseName: selectedCourseName || undefined
      });


      if (!res.success || !res.examId) {
        setError(res.error || 'Failed to generate personalized exams.');
        setIsSubmitting(false);
        return;
      }

      router.push(`/teacher/exam/${res.examId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-ink tracking-tight">Create Personalized Exam</h1>
        <p className="text-ink-muted text-sm mt-1">
          Select your Google Classroom course to automatically import students, paste your lesson notes, and let Gemini AI craft unique isomorphic variants.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-[2px] bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Google Classroom Class & Roster Import */}
        <div className="rounded-[2px] bg-paper border border-rule p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rule pb-3">
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-ink" />
              <span>1. Google Classroom Class & Enrolled Roster</span>
            </h2>
            <button
              type="button"
              onClick={() => setIsManualRoster(!isManualRoster)}
              className="text-xs text-ink hover:text-ink-muted transition"
            >
              {isManualRoster ? '← Use Google Classroom' : 'Switch to Manual Roster'}
            </button>
          </div>

          {!isManualRoster ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
                  Select Google Classroom Course *
                </label>
                {isLoadingCourses ? (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-[2px] bg-ground border border-rule text-ink-muted text-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-ink" />
                    <span>Connecting to Google Classroom...</span>
                  </div>
                ) : courses.length === 0 ? (
                  <div className="p-4 rounded-[2px] bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
                    <span>No active Google Classroom courses found on your account.</span>
                    <button
                      type="button"
                      onClick={() => setIsManualRoster(true)}
                      className="underline font-semibold"
                    >
                      Use Manual Roster
                    </button>
                  </div>
                ) : (
                  <select
                    value={selectedCourseId}
                    onChange={(e) => handleCourseSelect(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-[2px] bg-paper border border-rule text-ink focus:outline-none focus:border-ink transition text-sm"
                  >
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name} {course.section ? `(${course.section})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Roster Auto-Sync Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    Enrolled Students Sync
                  </span>
                  {isLoadingRoster && (
                    <span className="text-xs text-ink flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Fetching roster...
                    </span>
                  )}
                </div>

                {isLoadingRoster ? (
                  <div className="p-6 rounded-[2px] bg-ground border border-rule text-center text-xs text-ink-muted flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-ink" />
                    <span>Loading student names and Google email addresses...</span>
                  </div>
                ) : importedStudents.length > 0 ? (
                  <div className="rounded-[2px] bg-ground border border-rule p-4 space-y-3.5">
                    {/* Attendance Header with Select All / Deselect All */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-rule">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-ground border border-rule text-verified">
                          ● {importedStudents.filter((s) => s.isPresent).length} of {importedStudents.length} Students Present
                        </span>
                        <span className="text-[11px] text-ink-muted">
                          (Uncheck absent students to skip)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSelectAllStudents}
                          className="px-2.5 py-1 rounded-[2px] bg-ground hover:bg-slate-800 text-[11px] font-medium text-ink-muted border border-rule transition"
                        >
                          ✓ Select All
                        </button>
                        <button
                          type="button"
                          onClick={handleDeselectAllStudents}
                          className="px-2.5 py-1 rounded-[2px] bg-ground hover:bg-slate-800 text-[11px] font-medium text-ink-muted hover:text-rose-300 border border-rule transition"
                        >
                          ✗ Deselect All
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCourseSelect(selectedCourseId, selectedCourseName)}
                          className="p-1 rounded-[2px] text-ink-muted hover:text-ink transition"
                          title="Re-sync Roster"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Attendance Checklist */}
                    <div className="max-h-56 overflow-y-auto divide-y divide-slate-800/60 text-xs">
                      {importedStudents.map((st) => (
                        <div
                          key={st.id}
                          onClick={() => toggleStudentAttendance(st.id)}
                          className={`py-2.5 px-2 rounded-[2px] flex items-center justify-between gap-4 cursor-pointer transition select-none ${
                            st.isPresent
                              ? 'hover:bg-ground text-ink'
                              : 'opacity-50 hover:opacity-75 bg-paper/40 text-ink-muted'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={st.isPresent}
                              onChange={() => toggleStudentAttendance(st.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 rounded text-ink bg-ground border-rule focus:ring-ink cursor-pointer"
                            />
                            <div>
                              <div className={`font-medium ${st.isPresent ? 'text-ink' : 'line-through text-ink-muted'}`}>
                                {st.name}
                              </div>
                              <div className="text-ink-muted font-mono text-[11px]">
                                {st.email || 'No email found'}
                              </div>
                            </div>
                          </div>

                          <div>
                            {st.isPresent ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-ground text-verified border border-rule">
                                Present
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-ink-muted border border-rule">
                                Absent - Skipped
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : selectedCourseId ? (
                  <div className="p-4 rounded-[2px] bg-ground border border-rule space-y-2">
                    <p className="text-rose-300 text-xs font-medium">
                      No students currently detected in this Google Classroom course.
                    </p>
                    <p className="text-ink-muted text-[11px] leading-relaxed">
                      If you recently enrolled students or updated permissions, please ensure they have accepted your class invitation, or try signing out and signing in again to grant Google Classroom email permissions.
                    </p>
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => handleCourseSelect(selectedCourseId, selectedCourseName)}
                        className="px-3 py-1.5 rounded-[2px] bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition"
                      >
                        <RefreshCw className="w-3 h-3" /> Retry Sync
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsManualRoster(true)}
                        className="text-xs text-ink hover:text-ink-muted underline font-medium transition"
                      >
                        Switch to Manual Roster
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Manual Roster (Name & Google Email)
              </label>
              <textarea
                rows={5}
                value={manualRosterText}
                onChange={(e) => setManualRosterText(e.target.value)}
                placeholder="Juan Dela Cruz (juan@school.edu)&#10;Maria Santos (maria@school.edu)"
                className="w-full px-4 py-3 rounded-[2px] bg-paper border border-rule text-ink placeholder-slate-500 focus:outline-none focus:border-ink transition text-sm font-mono leading-relaxed"
              />
              <p className="text-[11px] text-ink-muted">
                Format: <code>Student Name (student@school.edu)</code> one per line.
              </p>
            </div>
          )}
        </div>

        {/* Step 2: Exam Basic Information */}
        <div className="rounded-[2px] bg-paper border border-rule p-6 space-y-6">
          <h2 className="text-lg font-bold text-ink flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-ink" />
            <span>2. Exam Details & Configuration</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
                Exam Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Photosynthesis & Cellular Energy Midterm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-[2px] bg-paper border border-rule text-ink placeholder-slate-500 focus:outline-none focus:border-ink transition text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
                Subject / Course *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Grade 10 Biology"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 rounded-[2px] bg-paper border border-rule text-ink placeholder-slate-500 focus:outline-none focus:border-ink transition text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'English' | 'Tagalog' | 'Bisaya')}
                className="w-full px-4 py-2.5 rounded-[2px] bg-paper border border-rule text-ink focus:outline-none focus:border-ink transition text-sm"
              >
                <option value="English">English</option>
                <option value="Tagalog">Tagalog (Filipino)</option>
                <option value="Bisaya">Bisaya (Cebuano)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
                Duration (Minutes)
              </label>
              <input
                type="number"
                min="5"
                max="180"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 30)}
                className="w-full px-4 py-2.5 rounded-[2px] bg-paper border border-rule text-ink focus:outline-none focus:border-ink transition text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Questions Per Student *
                </label>
                <span className="text-[11px] text-ink font-mono">1 to 100 Qs</span>
              </div>
              <input
                type="number"
                min="1"
                max="100"
                value={questionCount}
                onChange={(e) => setQuestionCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-full px-4 py-2.5 rounded-[2px] bg-paper border border-rule text-ink focus:outline-none focus:border-ink transition text-sm font-semibold"
              />
              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="text-[10px] text-ink-muted uppercase font-semibold">Presets:</span>
                {[5, 10, 15, 20, 25, 30, 50].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setQuestionCount(count)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                      questionCount === count
                        ? 'bg-ink text-paper font-bold'
                        : 'bg-ground border border-rule text-ink-muted hover:text-ink hover:border-rule'
                    }`}
                  >
                    {count} Qs
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Lockout Threshold *
                </label>
                <span className="text-[11px] text-ink font-mono font-semibold">{maxStrikes} Flags</span>
              </div>
              <input
                type="number"
                min="1"
                max="20"
                value={maxStrikes}
                onChange={(e) => setMaxStrikes(Math.max(1, parseInt(e.target.value) || 2))}
                className="w-full px-4 py-2.5 rounded-[2px] bg-paper border border-rule text-ink focus:outline-none focus:border-ink transition text-sm font-semibold"
              />
              {/* Presets */}
              <div className="flex items-center gap-1 mt-2 flex-wrap">
                <span className="text-[10px] text-ink-muted uppercase font-semibold">Flags:</span>
                {[
                  { value: 1, label: '1 (Strict)' },
                  { value: 2, label: '2 (Std)' },
                  { value: 3, label: '3 (Lenient)' },
                  { value: 5, label: '5 (High)' }
                ].map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setMaxStrikes(preset.value)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition ${
                      maxStrikes === preset.value
                        ? 'bg-signal text-paper font-bold'
                        : 'bg-ground border border-rule text-ink-muted hover:text-ink'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>


          {/* Question Formats Selector */}
          <div className="pt-4 border-t border-rule space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
                  Included Question Formats ({selectedQuestionTypes.length} Selected)
                </label>
                <p className="text-[11px] text-ink-muted">
                  Select which question types Gemini should generate for this exam.
                </p>
              </div>
              <span className="text-[11px] text-ink font-mono">
                {selectedQuestionTypes.length === AVAILABLE_QUESTION_TYPES.length ? 'All 7 Types Active' : 'Custom Mix'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {AVAILABLE_QUESTION_TYPES.map((t) => {
                const isChecked = selectedQuestionTypes.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleQuestionType(t.id)}
                    className={`flex items-start gap-2.5 p-3 rounded-[2px] border text-left transition ${
                      isChecked
                        ? 'bg-ground border-ink text-ink shadow-sm '
                        : 'bg-paper/60 border-rule text-ink-muted hover:border-rule hover:text-ink'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border transition shrink-0 ${
                        isChecked
                          ? 'bg-ink border-ink text-ink'
                          : 'border-slate-600 bg-ground'
                      }`}
                    >
                      {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-ink" />}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{t.label}</div>
                      <div className="text-[11px] text-ink-muted mt-0.5 leading-tight">{t.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Question Point Valuation & Scoring Scheme */}
            <div className="pt-5 border-t border-rule space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
                    Question Point Valuation & Scoring Scheme
                  </label>
                  <p className="text-[11px] text-ink-muted">
                    Let AI dynamically value questions based on depth and difficulty, or manually specify points.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-ground border border-rule text-xs font-mono text-ink-muted">
                  <span>Estimated Total Score:</span>
                  <strong className="text-ink font-bold">~{calculateTotalPointsDisplay()} pts</strong>
                </div>
              </div>

              {/* 3 Point Modes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Mode 1: AI Dynamic */}
                <button
                  type="button"
                  onClick={() => setPointsMode('AI_DYNAMIC')}
                  className={`p-3.5 rounded-[2px] border text-left transition flex flex-col justify-between gap-2.5 ${
                    pointsMode === 'AI_DYNAMIC'
                      ? 'bg-ground border-ink text-ink shadow-sm '
                      : 'bg-paper/60 border-rule text-ink-muted hover:border-rule hover:text-ink'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-ink flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-ink" />
                      <span>AI Smart Dynamic</span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-ground text-ink-muted">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-muted leading-snug">
                    AI automatically weights points based on cognitive depth (e.g. 2-5 pts for True/False, 10 pts for MCQ, 15-25 pts for Essays).
                  </p>
                </button>

                {/* Mode 2: Uniform Fixed Points */}
                <button
                  type="button"
                  onClick={() => setPointsMode('FIXED')}
                  className={`p-3.5 rounded-[2px] border text-left transition flex flex-col justify-between gap-2.5 ${
                    pointsMode === 'FIXED'
                      ? 'bg-ground border-ink text-ink shadow-sm '
                      : 'bg-paper/60 border-rule text-ink-muted hover:border-rule hover:text-ink'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-ink">Uniform Fixed Points</span>
                    <span className="font-mono text-xs text-ink-muted">{fixedPoints} pts/ea</span>
                  </div>
                  <p className="text-[11px] text-ink-muted leading-snug">
                    Every question across all formats carries the exact same fixed point value (e.g. 5 or 10 pts each).
                  </p>
                </button>

                {/* Mode 3: Custom by Format */}
                <button
                  type="button"
                  onClick={() => setPointsMode('BY_TYPE')}
                  className={`p-3.5 rounded-[2px] border text-left transition flex flex-col justify-between gap-2.5 ${
                    pointsMode === 'BY_TYPE'
                      ? 'bg-ground border-ink text-ink shadow-sm '
                      : 'bg-paper/60 border-rule text-ink-muted hover:border-rule hover:text-ink'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-ink">Custom Per Format</span>
                    <span className="text-[10px] text-ink-muted font-mono">By Type</span>
                  </div>
                  <p className="text-[11px] text-ink-muted leading-snug">
                    Manually assign different point values to each question type (e.g. Essays = 20 pts, True/False = 2 pts).
                  </p>
                </button>
              </div>

              {/* Sub-controls when Fixed Mode is active */}
              {pointsMode === 'FIXED' && (
                <div className="p-4 rounded-[2px] bg-ground border border-rule space-y-3 animate-in fade-in duration-150">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <label className="text-xs font-medium text-ink">
                      Fixed Points Assigned Per Question:
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 5, 10, 15, 20].map((pt) => (
                        <button
                          key={pt}
                          type="button"
                          onClick={() => setFixedPoints(pt)}
                          className={`px-2.5 py-1 rounded-[2px] text-xs font-mono font-semibold transition ${
                            fixedPoints === pt
                              ? 'bg-ink text-paper'
                              : 'bg-ground text-ink-muted hover:bg-slate-800 hover:text-ink'
                          }`}
                        >
                          {pt} pt{pt > 1 ? 's' : ''}
                        </button>
                      ))}
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={fixedPoints}
                        onChange={(e) => setFixedPoints(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 px-2 py-1 rounded-[2px] bg-ground border border-rule text-ink text-xs font-mono text-center focus:outline-none focus:border-ink"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-controls when By-Type Mode is active */}
              {pointsMode === 'BY_TYPE' && (
                <div className="p-4 rounded-[2px] bg-ground border border-rule space-y-3 animate-in fade-in duration-150">
                  <div className="text-xs text-ink font-medium">
                    Set Point Values for Selected Question Formats:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {AVAILABLE_QUESTION_TYPES.filter((t) => selectedQuestionTypes.includes(t.id)).map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-2.5 rounded-[2px] bg-ground border border-rule text-xs"
                      >
                        <span className="font-medium text-ink truncate mr-2">{t.label}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={pointsByType[t.id] ?? 10}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value) || 1);
                              setPointsByType((prev) => ({ ...prev, [t.id]: val }));
                            }}
                            className="w-14 px-2 py-1 rounded bg-paper border border-rule text-ink text-xs font-mono text-center focus:outline-none focus:border-ink"
                          />
                          <span className="text-[11px] text-ink-muted">pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>


        {/* Step 3: Lesson Content & Multi-Document Upload */}
        <div className="rounded-[2px] bg-paper border border-rule p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                <Cpu className="w-5 h-5 text-ink" />
                <span>3. Lesson Content & Source Material *</span>
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Attach one or multiple PDFs/notes, then click extract to synthesize the core syllabus concepts.
              </p>
            </div>
            
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ground border border-rule text-[11px] font-medium text-ink-muted">
              <Cpu className="w-3.5 h-3.5 text-ink" />
              <span>Parser: Gemini 3.5 Flash Lite</span>
            </div>
          </div>

          {/* Source Material Mode Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-rule">
            <div className="flex items-center gap-1.5 p-1 rounded-[2px] bg-ground border border-rule">
              <button
                type="button"
                onClick={() => setSourceTab('upload')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-[2px] text-xs font-semibold transition ${
                  sourceTab === 'upload'
                    ? 'bg-ink text-paper shadow-sm'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload New Files</span>
                {queuedFiles.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-ink text-paper">
                    {queuedFiles.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSourceTab('past')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-[2px] text-xs font-semibold transition ${
                  sourceTab === 'past'
                    ? 'bg-ink text-paper shadow-sm'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Past Files Library</span>
                {pastMaterials.length > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    sourceTab === 'past' ? 'bg-ink text-paper' : 'bg-slate-800 text-ink-muted'
                  }`}>
                    {pastMaterials.length}
                  </span>
                )}
              </button>
            </div>

            <span className="text-[11px] text-ink-muted">
              {sourceTab === 'upload' 
                ? 'Upload new PDFs, notes, or slides' 
                : 'Instantly reuse study materials from past exams and uploads'}
            </span>
          </div>

          {/* TAB 1: UPLOAD NEW FILES */}
          {sourceTab === 'upload' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Hidden File Input supporting multiple files */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.txt,image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleAddFiles(e.target.files);
                  }
                }}
                className="hidden"
              />

              {/* Multi-Document Dropzone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => !isExtractingPdf && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-[2px] p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                  isDragging
                    ? 'border-ink bg-ground'
                    : 'border-rule hover:border-rule bg-paper/60 hover:bg-paper'
                }`}
              >
                <div className="w-10 h-10 rounded-[2px] bg-ground border border-rule flex items-center justify-center text-ink">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-ink hover:text-ink-muted">
                    Click to browse files
                  </span>{' '}
                  <span className="text-xs text-ink-muted">or drag and drop multiple PDFs here</span>
                </div>
                <p className="text-[11px] text-ink-muted">
                  Select multiple PDFs, syllabi, lecture slides, or scanned notes (up to 4MB per file)
                </p>
              </div>

              {/* Queued Files List & Extraction Action Button */}
              {queuedFiles.length > 0 && (
                <div className="p-4 rounded-[2px] bg-ground border border-rule space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-ink flex items-center gap-1.5">
                      <Files className="w-4 h-4 text-ink" />
                      <span>{queuedFiles.length} Document{queuedFiles.length > 1 ? 's' : ''} Queued</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] text-ink hover:text-ink-muted flex items-center gap-1 transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add More
                      </button>
                      <span className="text-slate-700">|</span>
                      <button
                        type="button"
                        onClick={handleClearAllFiles}
                        className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Clear All
                      </button>
                    </div>
                  </div>

                  {/* Individual Queued File Chips */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {queuedFiles.map((file, idx) => (
                      <div
                        key={`${file.name}-${idx}`}
                        className="flex items-center justify-between p-2.5 rounded-[2px] bg-ground border border-rule text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded bg-ground flex items-center justify-center text-ink shrink-0">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-ink font-medium truncate max-w-[180px] sm:max-w-[220px]">
                              {file.name}
                            </div>
                            <div className="text-[10px] text-ink-muted">
                              {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(idx);
                          }}
                          className="p-1 rounded text-ink-muted hover:text-rose-400 transition"
                          title="Remove file"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Dedicated Parse Action Button */}
                  <div className="pt-1">
                    <button
                      type="button"
                      disabled={isExtractingPdf}
                      onClick={handleExtractQueuedFiles}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[2px] bg-ink hover:bg-ink/90 text-paper font-semibold text-xs transition shadow-md  disabled:opacity-50"
                    >
                      {isExtractingPdf ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-ink" />
                          <span>Synthesizing {queuedFiles.length} Documents with Gemini 3.5 Flash Lite...</span>
                        </>
                      ) : (
                        <>
                          <Cpu className="w-4 h-4" />
                          <span>Extract & Synthesize All {queuedFiles.length} File{queuedFiles.length > 1 ? 's' : ''} (Gemini 3.5 Flash Lite)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Active Extraction Animation */}
              {isExtractingPdf && queuedFiles.length === 0 && (
                <div className="flex flex-col items-center justify-center py-4 gap-2 text-ink bg-paper rounded-[2px] border border-rule">
                  <Loader2 className="w-7 h-7 animate-spin" />
                  <div className="text-sm font-semibold text-ink">Synthesizing Course Material...</div>
                  <div className="text-xs text-ink-muted">
                    Gemini 3.5 Flash Lite is extracting cross-document concepts and learning objectives.
                  </div>
                </div>
              )}

              {/* Success Banner */}
              {synthesizedDocNames.length > 0 && (
                <div className="flex items-center justify-between p-3.5 rounded-[2px] bg-ground border border-emerald-500/20 text-xs">
                  <div className="flex items-center gap-2.5 text-verified">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <div>
                      <span className="font-semibold">Successfully Synthesized {synthesizedDocNames.length} Document{synthesizedDocNames.length > 1 ? 's' : ''}: </span>
                      <span className="text-emerald-300 font-mono text-[11px] truncate inline-block max-w-sm align-bottom">
                        {synthesizedDocNames.join(', ')}
                      </span>
                      {tokensProcessed !== null && (
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/20 text-[10px] text-emerald-200 font-mono">
                          {tokensProcessed.toLocaleString()} tokens
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-ink-muted text-[11px]">Ready for Exam Generation</span>
                </div>
              )}

              {/* Error Banner */}
              {extractionError && (
                <div className="flex items-center gap-2 p-3 rounded-[2px] bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{extractionError}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PAST FILES LIBRARY */}
          {sourceTab === 'past' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Hidden file input for adding files directly to library */}
              <input
                ref={libraryFileInputRef}
                type="file"
                multiple
                accept=".pdf,.txt,image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleAddFilesToLibrary(e.target.files);
                  }
                }}
                className="hidden"
              />

              {/* Search & Actions Toolbar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-ink-muted" />
                  <input
                    type="text"
                    placeholder="Search library by file name, subject, topic, or content..."
                    value={pastSearchQuery}
                    onChange={(e) => setPastSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 rounded-[2px] bg-ground border border-rule text-ink placeholder-slate-500 text-xs focus:outline-none focus:border-ink transition"
                  />
                  {pastSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setPastSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-ink-muted hover:text-ink"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Add Files to Library Button (Multi-file enabled) */}
                  <button
                    type="button"
                    onClick={() => libraryFileInputRef.current?.click()}
                    disabled={isUploadingToLibrary}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[2px] bg-ink hover:bg-ink/90 text-paper text-xs font-semibold transition disabled:opacity-50"
                    title="Upload and save multiple files to your library"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Add Files to Library</span>
                  </button>

                  {/* Quick Text Note Modal Trigger */}
                  <button
                    type="button"
                    onClick={() => setShowAddNoteModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[2px] bg-ground hover:bg-slate-800 border border-rule text-ink text-xs font-medium transition"
                    title="Add custom written notes to library"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-ink" />
                    <span>New Note</span>
                  </button>

                  <button
                    type="button"
                    onClick={loadPastMaterials}
                    disabled={isLoadingPastMaterials}
                    className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-[2px] bg-paper hover:bg-slate-800 border border-rule text-ink text-xs font-medium transition disabled:opacity-50"
                    title="Refresh library"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPastMaterials ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Upload Status Banner */}
              {isUploadingToLibrary && (
                <div className="flex items-center gap-2.5 p-3 rounded-[2px] bg-ground border border-ink text-xs text-ink">
                  <Loader2 className="w-4 h-4 animate-spin text-ink shrink-0" />
                  <span>{libraryUploadStatus || 'Extracting and saving files into your library with Gemini...'}</span>
                </div>
              )}

              {libraryUploadStatus && !isUploadingToLibrary && (
                <div className="flex items-center justify-between p-3 rounded-[2px] bg-ground border border-rule text-xs text-verified">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{libraryUploadStatus}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLibraryUploadStatus(null)}
                    className="text-ink-muted hover:text-ink text-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Multi-Selection Control Bar */}
              {pastMaterials.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-[2px] bg-ground border border-rule text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleSelectAllPastMaterials}
                      className="px-2.5 py-1 rounded-[2px] bg-paper hover:bg-slate-800 border border-rule text-ink font-medium transition text-[11px]"
                    >
                      ✓ Select All Visible
                    </button>
                    {selectedPastMaterialIds.length > 0 && (
                      <button
                        type="button"
                        onClick={handleDeselectAllPastMaterials}
                        className="px-2.5 py-1 rounded-[2px] bg-paper hover:bg-slate-800 border border-rule text-ink-muted hover:text-ink transition text-[11px]"
                      >
                        ✗ Deselect All
                      </button>
                    )}
                    <span className="text-ink font-medium">
                      {selectedPastMaterialIds.length > 0 ? (
                        <span className="text-verified font-semibold">
                          ● {selectedPastMaterialIds.length} of {pastMaterials.length} Selected
                        </span>
                      ) : (
                        <span className="text-ink-muted">
                          (Click checkboxes or cards to select multiple files)
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Batch Actions when 1 or more are selected */}
                  {selectedPastMaterialIds.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleUseSelectedPastMaterials}
                        className="px-3.5 py-1.5 rounded-[2px] bg-ink hover:bg-ink/90 text-paper font-semibold transition text-xs shadow-sm flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Use Selected ({selectedPastMaterialIds.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleAppendSelectedPastMaterials}
                        className="px-3 py-1.5 rounded-[2px] bg-paper hover:bg-slate-800 border border-rule text-ink font-medium transition text-xs flex items-center gap-1"
                        title="Append selected documents to current lesson outline"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Append ({selectedPastMaterialIds.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDeleteSelectedPastMaterials}
                        className="p-1.5 rounded-[2px] bg-paper hover:bg-rose-950/40 border border-rule hover:border-rose-500/40 text-rose-400 hover:text-rose-300 transition text-xs"
                        title="Delete selected documents from library"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Past Materials Grid */}
              {isLoadingPastMaterials ? (
                <div className="p-8 rounded-[2px] bg-ground border border-rule text-center text-xs text-ink-muted flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-ink" />
                  <span>Loading your saved materials library...</span>
                </div>
              ) : pastMaterials.length === 0 ? (
                <div className="p-8 rounded-[2px] bg-paper/60 border border-dashed border-rule text-center space-y-3">
                  <div className="w-10 h-10 rounded-[2px] bg-ground border border-rule flex items-center justify-center text-ink mx-auto">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-ink">No Saved Files in Library Yet</h4>
                    <p className="text-xs text-ink-muted max-w-sm mx-auto mt-1">
                      Add multiple PDFs, lecture notes, or syllabi directly here to preserve them for all your future exams!
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => libraryFileInputRef.current?.click()}
                      className="px-4 py-2 rounded-[2px] bg-ink hover:bg-ink/90 text-paper text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload Files to Library</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddNoteModal(true)}
                      className="px-3.5 py-2 rounded-[2px] bg-ground hover:bg-slate-800 border border-rule text-ink text-xs font-medium transition flex items-center gap-1.5"
                    >
                      <FolderPlus className="w-3.5 h-3.5 text-ink" />
                      <span>Write Note</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                  {pastMaterials
                    .filter((item) => {
                      if (!pastSearchQuery.trim()) return true;
                      const q = pastSearchQuery.toLowerCase();
                      return (
                        item.fileName.toLowerCase().includes(q) ||
                        (item.title && item.title.toLowerCase().includes(q)) ||
                        (item.subject && item.subject.toLowerCase().includes(q)) ||
                        item.extractedContent.toLowerCase().includes(q)
                      );
                    })
                    .map((item) => {
                      const isSelected = selectedPastMaterialIds.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleSelectPastMaterial(item.id)}
                          className={`p-3.5 rounded-[2px] border text-xs transition flex flex-col justify-between gap-3 cursor-pointer select-none ${
                            isSelected
                              ? 'bg-ground border-ink ring-1 ring-ink/30 shadow-md'
                              : 'bg-paper/80 border-rule hover:border-slate-600'
                          }`}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                {/* Multi-select Checkbox */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSelectPastMaterial(item.id);
                                  }}
                                  className="text-ink hover:text-ink p-0.5 rounded transition shrink-0"
                                >
                                  {isSelected ? (
                                    <CheckSquare className="w-4 h-4 text-ink" />
                                  ) : (
                                    <Square className="w-4 h-4 text-ink-muted hover:text-slate-300" />
                                  )}
                                </button>

                                <div className="w-7 h-7 rounded-[2px] bg-ground border border-rule flex items-center justify-center text-ink shrink-0">
                                  <FileText className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-ink truncate max-w-[170px]" title={item.fileName}>
                                    {item.fileName}
                                  </div>
                                  <div className="text-[10px] text-ink-muted">
                                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => handleDeletePastMaterial(e, item.id)}
                                className="p-1 text-ink-muted hover:text-rose-400 rounded-[2px] transition"
                                title="Delete from library"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {(item.subject || item.title) && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {item.subject && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-ground text-ink-muted border border-rule">
                                    {item.subject}
                                  </span>
                                )}
                                {item.title && (
                                  <span className="text-[11px] text-ink font-medium truncate max-w-[180px]">
                                    {item.title}
                                  </span>
                                )}
                              </div>
                            )}

                            <p className="text-ink-muted text-[11px] line-clamp-2 leading-relaxed">
                              {item.extractedContent}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-rule" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[10px] font-mono text-ink-muted">
                              {item.extractedContent.length.toLocaleString()} chars
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleAppendPastMaterial(item)}
                                className="px-2 py-1 rounded-[2px] bg-ground hover:bg-slate-800 text-[11px] font-medium text-ink border border-rule transition"
                                title="Append to existing notes"
                              >
                                + Append
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSelectPastMaterial(item)}
                                className={`px-2.5 py-1 rounded-[2px] text-[11px] font-semibold transition flex items-center gap-1 ${
                                  isSelected
                                    ? 'bg-ink text-paper'
                                    : 'bg-paper hover:bg-slate-800 text-ink border border-rule'
                                }`}
                              >
                                {isSelected ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    <span>Selected</span>
                                  </>
                                ) : (
                                  <span>Use File</span>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* Quick Note Modal */}
          {showAddNoteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ground/80 backdrop-blur-sm animate-in fade-in duration-150">
              <div className="w-full max-w-lg rounded-[2px] bg-ground border border-rule p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between pb-2 border-b border-rule">
                  <div className="flex items-center gap-2 text-sm font-bold text-ink">
                    <FolderPlus className="w-4 h-4 text-ink" />
                    <span>Save Custom Note to Library</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddNoteModal(false)}
                    className="text-ink-muted hover:text-ink transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-ink-muted font-medium mb-1">Title</label>
                    <input
                      type="text"
                      placeholder="e.g., Chapter 4: Genetics and Heredity"
                      value={newNoteTitle}
                      onChange={(e) => setNewNoteTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-[2px] bg-paper border border-rule text-ink placeholder-slate-500 focus:outline-none focus:border-ink transition"
                    />
                  </div>

                  <div>
                    <label className="block text-ink-muted font-medium mb-1">Subject</label>
                    <input
                      type="text"
                      placeholder="e.g., Biology 101"
                      value={newNoteSubject}
                      onChange={(e) => setNewNoteSubject(e.target.value)}
                      className="w-full px-3 py-2 rounded-[2px] bg-paper border border-rule text-ink placeholder-slate-500 focus:outline-none focus:border-ink transition"
                    />
                  </div>

                  <div>
                    <label className="block text-ink-muted font-medium mb-1">Study Notes / Syllabus Outline *</label>
                    <textarea
                      rows={5}
                      placeholder="Paste or write lesson concepts, formulas, definitions, or syllabus contents here..."
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      className="w-full px-3 py-2 rounded-[2px] bg-paper border border-rule text-ink placeholder-slate-500 focus:outline-none focus:border-ink transition leading-relaxed font-sans"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-rule">
                  <button
                    type="button"
                    onClick={() => setShowAddNoteModal(false)}
                    className="px-3.5 py-1.5 rounded-[2px] bg-ground hover:bg-slate-800 text-ink-muted text-xs font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSavingNote || !newNoteContent.trim()}
                    onClick={handleSaveManualNote}
                    className="px-4 py-1.5 rounded-[2px] bg-ink hover:bg-ink/90 text-paper text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSavingNote && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save to Library</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Active Source Banner */}
          {selectedPastMaterialIds.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-[2px] bg-ground border border-rule text-xs">
              <div className="flex items-center gap-2 text-ink">
                <FileText className="w-4 h-4 text-ink shrink-0" />
                <span>
                  Using lesson content from <strong>{selectedPastMaterialIds.length}</strong> saved library document{selectedPastMaterialIds.length > 1 ? 's' : ''}
                  {synthesizedDocNames.length > 0 && (
                    <span className="text-ink-muted text-[11px] ml-1">
                      ({synthesizedDocNames.join(', ')})
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUseSelectedPastMaterials}
                  className="px-2.5 py-1 rounded-[2px] bg-ink hover:bg-ink/90 text-paper text-[11px] font-semibold transition"
                >
                  Apply All Selected ({selectedPastMaterialIds.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPastMaterialIds([]);
                    setSynthesizedDocNames([]);
                    setLessonContent('');
                  }}
                  className="text-xs text-ink-muted hover:text-rose-400 transition underline"
                >
                  Clear Selection & Content
                </button>
              </div>
            </div>
          )}


          {/* Lesson Content Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-ink-muted">
              <span>{synthesizedDocNames.length > 0 ? 'Synthesized Lesson Notes (Review & Edit):' : 'Or Paste Lesson Text Directly:'}</span>
              {lessonContent.length > 0 && (
                <span className="font-mono text-ink font-medium">{lessonContent.length} characters</span>
              )}
            </div>
            <textarea
              required
              rows={8}
              placeholder="Your synthesized lesson outline will appear here, or you can paste syllabus text directly..."
              value={lessonContent}
              onChange={(e) => setLessonContent(e.target.value)}
              className="w-full px-4 py-3 rounded-[2px] bg-paper border border-rule text-ink placeholder-slate-500 focus:outline-none focus:border-ink transition text-sm font-sans leading-relaxed"
            />
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-2 space-y-2">
          {!isManualRoster && importedStudents.length > 0 && importedStudents.filter((s) => s.isPresent).length === 0 && (
            <p className="text-center text-xs text-amber-400 font-medium">
              Please mark at least one student present in the attendance checklist above to generate this exam.
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || isExtractingPdf || (!isManualRoster && importedStudents.length > 0 && importedStudents.filter((s) => s.isPresent).length === 0)}
            className="group relative overflow-hidden w-full flex items-center justify-center gap-3 px-8 py-4 rounded-[2px] bg-ink hover:bg-ink/90 text-paper font-mono text-xs uppercase tracking-widest font-semibold transition-all duration-200 hover:shadow-lg disabled:opacity-40 min-h-[48px] active:scale-[0.99]"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none animate-shimmer" />
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>AI Generating Isomorphic Exam Sets via Gemini 3.5 Flash...</span>
              </>
            ) : (
              <>
                <Cpu className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                <span>Generate Personalized Isomorphic Exams</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* AI Reasoning & Generation Thinking Modal */}
      <AIExamGenerationModal
        isOpen={isSubmitting}
        title={title}
        subject={subject}
        candidateCount={
          !isManualRoster
            ? (importedStudents.filter((s) => s.isPresent).length || importedStudents.length || 1)
            : (manualRosterText.split('\n').filter((l) => l.trim().length > 0).length || 1)
        }
        questionCount={questionCount}
        maxStrikes={maxStrikes}
        questionTypes={selectedQuestionTypes}
      />
    </div>
  );
}
