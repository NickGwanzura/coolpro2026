'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
    useCourses,
    useExamSubmissions,
    createCourse,
    updateCourse,
    submitCourseForApproval,
    gradeExamSubmission,
    uploadCourseMaterial,
    getCourseMaterialDownloadUrl,
    type ManagedCourse,
    type CourseModule,
    type CourseAttachment,
    type ExamSubmission,
} from '@/lib/platformStore';
import { deleteCourseMaterial } from '@/lib/api';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Paperclip, Download, X, Loader2 } from 'lucide-react';

function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string) {
    return new Intl.DateTimeFormat('en-ZW', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
}

const STATUS_LABEL: Record<string, string> = {
    draft: 'Draft',
    pending_nou: 'Pending NOU',
    approved: 'Approved',
    rejected: 'Rejected',
};

const STATUS_BADGE_MAP: Record<string, string> = {
    draft: 'inactive',
    pending_nou: 'pending',
    approved: 'approved',
    rejected: 'rejected',
};

// ---------------------------------------------------------------------------
// Module editor row
// ---------------------------------------------------------------------------

function ModuleRow({
    mod,
    index,
    courseId,
    onChange,
    onAttachmentsChange,
    onRemove,
    readOnly,
}: {
    mod: CourseModule;
    index: number;
    courseId?: string;
    onChange: (index: number, field: keyof CourseModule, value: string | number) => void;
    onAttachmentsChange: (index: number, attachments: CourseAttachment[]) => void;
    onRemove: (index: number) => void;
    readOnly: boolean;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [error, setError] = useState('');
    const attachments = mod.attachments ?? [];

    async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file || !courseId) return;
        setError('');
        setUploadProgress(0);
        try {
            const attachment = await uploadCourseMaterial(courseId, file, setUploadProgress);
            onAttachmentsChange(index, [...attachments, attachment]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploadProgress(null);
        }
    }

    async function handleDownload(attachment: CourseAttachment) {
        if (!courseId) return;
        try {
            const url = await getCourseMaterialDownloadUrl(courseId, attachment.r2Key);
            window.open(url, '_blank', 'noopener,noreferrer');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not open file');
        }
    }

    function handleRemoveAttachment(attachmentId: string) {
        const attachment = attachments.find(a => a.id === attachmentId);
        if (attachment && courseId) {
            // Remove from R2 storage — fire-and-forget; if it fails the file
            // lingers in the bucket but the course is no longer referencing it.
            deleteCourseMaterial(courseId, attachment.r2Key).catch(err =>
                console.error('Failed to delete material from R2:', err)
            );
        }
        onAttachmentsChange(index, attachments.filter(a => a.id !== attachmentId));
    }

    return (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Module {index + 1}</p>
                {!readOnly && (
                    <button
                        type="button"
                        onClick={() => onRemove(index)}
                        className="text-xs text-red-500 hover:underline"
                    >
                        Remove
                    </button>
                )}
            </div>
            <input
                disabled={readOnly}
                value={mod.title}
                onChange={e => onChange(index, 'title', e.target.value)}
                placeholder="Module title"
                className="w-full border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed rounded-lg"
            />
            <textarea
                disabled={readOnly}
                value={mod.content}
                onChange={e => onChange(index, 'content', e.target.value)}
                placeholder="Module content"
                rows={3}
                className="w-full border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed rounded-lg"
            />
            <input
                type="number"
                min="1"
                disabled={readOnly}
                value={mod.minutes}
                onChange={e => onChange(index, 'minutes', Number(e.target.value))}
                placeholder="Estimated minutes"
                className="w-40 border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed rounded-lg"
            />
            <span className="ml-2 text-xs text-gray-400">min</span>

            <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Materials</p>
                {attachments.length === 0 && <p className="text-xs text-gray-400">No files attached.</p>}
                {attachments.map(attachment => (
                    <div key={attachment.id} className="rounded-lg flex items-center justify-between gap-3 border border-gray-200 bg-white px-3 py-2">
                        <span className="flex min-w-0 items-center gap-2 text-sm text-gray-700">
                            <Paperclip className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                            <span className="truncate">{attachment.fileName}</span>
                            <span className="shrink-0 text-xs text-gray-400">{formatFileSize(attachment.sizeBytes)}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                            <button type="button" onClick={() => handleDownload(attachment)} className="text-gray-400 hover:text-blue-600" aria-label="Download">
                                <Download className="h-4 w-4" />
                            </button>
                            {!readOnly && (
                                <button type="button" onClick={() => handleRemoveAttachment(attachment.id)} className="text-gray-400 hover:text-red-500" aria-label="Remove">
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </span>
                    </div>
                ))}
                {!readOnly && courseId && (
                    <div>
                        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadProgress !== null}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline disabled:opacity-60"
                        >
                            {uploadProgress !== null ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading {uploadProgress}%
                                </>
                            ) : (
                                <>
                                    <Paperclip className="h-3.5 w-3.5" /> Attach file
                                </>
                            )}
                        </button>
                    </div>
                )}
                {!readOnly && !courseId && (
                    <p className="text-xs text-gray-400">Save the course as a draft first to attach files.</p>
                )}
                {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Inline course editor / viewer panel
// ---------------------------------------------------------------------------

type EditorMode = 'edit' | 'view';

function CoursePanel({
    course,
    onClose,
    onSaved,
}: {
    course: ManagedCourse;
    onClose: () => void;
    onSaved: (updated: ManagedCourse) => void;
}) {
    const isLocked = course.status === 'pending_nou' || course.status === 'approved';
    const [mode] = useState<EditorMode>(isLocked ? 'view' : 'edit');
    const [title, setTitle] = useState(course.title);
    const [description, setDescription] = useState(course.description);
    const [modules, setModules] = useState<CourseModule[]>(course.modules);
    const [notice, setNotice] = useState('');
    const [saving, setSaving] = useState(false);

    const readOnly = mode === 'view' || isLocked;

    function handleModuleChange(index: number, field: keyof CourseModule, value: string | number) {
        setModules(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
    }

    async function handleAttachmentsChange(index: number, attachments: CourseAttachment[]) {
        const updatedModules = modules.map((m, i) => i === index ? { ...m, attachments } : m);
        setModules(updatedModules);
        try {
            const updated = await updateCourse(course.id, { modules: updatedModules });
            onSaved(updated);
        } catch (err) {
            setNotice(err instanceof Error ? err.message : 'Failed to save attachment.');
        }
    }

    function handleModuleRemove(index: number) {
        setModules(prev => prev.filter((_, i) => i !== index));
    }

    function addModule() {
        setModules(prev => [...prev, { title: '', content: '', minutes: 30 }]);
    }

    async function handleSaveDraft() {
        if (!title.trim()) { setNotice('Course title is required.'); return; }
        if (modules.length === 0) { setNotice('Add at least one module.'); return; }
        try {
            setSaving(true);
            const updated = await updateCourse(course.id, { title: title.trim(), description: description.trim(), modules });
            onSaved(updated);
            setNotice('Draft saved.');
        } catch (err) {
            setNotice((err as Error).message);
        } finally {
            setSaving(false);
        }
    }

    async function handleSubmit() {
        if (!title.trim()) { setNotice('Course title is required.'); return; }
        if (modules.length === 0) { setNotice('Add at least one module.'); return; }
        setSaving(true);
        try {
            await updateCourse(course.id, { title: title.trim(), description: description.trim(), modules });
            const updated = await submitCourseForApproval(course.id);
            onSaved(updated);
            setNotice('Submitted for NOU approval.');
        } catch (err) {
            setNotice((err as Error).message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-6 py-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">
                        {isLocked ? 'Course Details' : 'Edit Course'}
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-gray-900">{course.title}</h2>
                </div>
                <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-800">
                    Close
                </button>
            </div>

            <div className="p-6 space-y-5">
                {isLocked && (
                    <div className="rounded-lg rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        This course is <strong>{STATUS_LABEL[course.status]}</strong> and cannot be edited.
                        {course.status === 'rejected' && course.rejectionReason && (
                            <span> Rejection reason: {course.rejectionReason}</span>
                        )}
                    </div>
                )}

                <div className="space-y-3">
                    <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Title</label>
                    <input
                        disabled={readOnly}
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed rounded-lg"
                    />
                </div>

                <div className="space-y-3">
                    <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Description</label>
                    <textarea
                        disabled={readOnly}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={3}
                        className="w-full border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed rounded-lg"
                    />
                </div>

                <div className="space-y-3">
                    <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Modules ({modules.length})</label>
                    {modules.map((mod, i) => (
                        <ModuleRow
                            key={i}
                            mod={mod}
                            index={i}
                            courseId={course.id}
                            onChange={handleModuleChange}
                            onAttachmentsChange={handleAttachmentsChange}
                            onRemove={handleModuleRemove}
                            readOnly={readOnly}
                        />
                    ))}
                    {!readOnly && (
                        <button
                            type="button"
                            onClick={addModule}
                            className="text-sm font-semibold text-blue-600 hover:underline"
                        >
                            + Add Module
                        </button>
                    )}
                </div>

                {!isLocked && (
                    <div className="flex flex-wrap gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleSaveDraft}
                            disabled={saving}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            Save Draft
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={saving}
                            className="rounded-lg bg-[#FF6B35] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            Submit for NOU Approval
                        </button>
                    </div>
                )}

                {notice && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">{notice}</div>
                )}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Exam grading panel
// ---------------------------------------------------------------------------

function GradePanel({
    submission,
    onClose,
    onGraded,
}: {
    submission: ExamSubmission;
    onClose: () => void;
    onGraded: (updated: ExamSubmission) => void;
}) {
    const [score, setScore] = useState(submission.score ?? 0);
    const [passed, setPassed] = useState(submission.passed ?? false);
    const [feedback, setFeedback] = useState(submission.feedback ?? '');
    const [notice, setNotice] = useState('');
    const [saving, setSaving] = useState(false);
    const alreadyGraded = submission.status === 'graded';

    async function handleSubmit() {
        if (score < 0 || score > 100) { setNotice('Score must be between 0 and 100.'); return; }
        setSaving(true);
        try {
            const updated = await gradeExamSubmission(submission.id, score, passed, feedback.trim());
            onGraded(updated);
            setNotice('Grade submitted.');
        } catch (err) {
            setNotice((err as Error).message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-6 py-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">Exam Submission</p>
                    <h2 className="mt-1 text-lg font-bold text-gray-900">{submission.studentName}</h2>
                    <p className="mt-0.5 text-sm text-gray-500">{submission.courseTitle}</p>
                </div>
                <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-800">Close</button>
            </div>

            <div className="p-6 space-y-5">
                <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Student Answers</p>
                    {submission.answers.map((a, i) => (
                        <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-1">
                            <p className="text-sm font-semibold text-gray-700">{a.question}</p>
                            <p className="text-sm text-gray-600">{a.answer}</p>
                        </div>
                    ))}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Score (0-100)</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            disabled={alreadyGraded}
                            value={score}
                            onChange={e => setScore(Number(e.target.value))}
                            className="w-full border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed rounded-lg"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Result</label>
                        <div className="flex gap-4 pt-1">
                            <label className="inline-flex items-center gap-2 text-sm">
                                <input
                                    type="radio"
                                    disabled={alreadyGraded}
                                    checked={passed}
                                    onChange={() => setPassed(true)}
                                    className="h-4 w-4 cursor-pointer text-blue-600"
                                />
                                Pass
                            </label>
                            <label className="inline-flex items-center gap-2 text-sm">
                                <input
                                    type="radio"
                                    disabled={alreadyGraded}
                                    checked={!passed}
                                    onChange={() => setPassed(false)}
                                    className="h-4 w-4 cursor-pointer text-blue-600"
                                />
                                Fail
                            </label>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Feedback</label>
                    <textarea
                        disabled={alreadyGraded}
                        value={feedback}
                        onChange={e => setFeedback(e.target.value)}
                        rows={3}
                        placeholder="Comments for the student"
                        className="w-full border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed rounded-lg"
                    />
                </div>

                {!alreadyGraded && (
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={saving}
                        className="rounded-lg bg-[#FF6B35] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        Submit Grade
                    </button>
                )}

                {notice && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">{notice}</div>
                )}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Create course form
// ---------------------------------------------------------------------------

function CreateCourseForm({
    lecturerId,
    lecturerName,
    onCreated,
    onCancel,
}: {
    lecturerId: string;
    lecturerName: string;
    onCreated: (c: ManagedCourse) => void;
    onCancel: () => void;
}) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [modules, setModules] = useState<CourseModule[]>([{ title: '', content: '', minutes: 30 }]);
    const [notice, setNotice] = useState('');
    const [saving, setSaving] = useState(false);

    function handleModuleChange(index: number, field: keyof CourseModule, value: string | number) {
        setModules(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
    }

    function handleAttachmentsChange(index: number, attachments: CourseAttachment[]) {
        setModules(prev => prev.map((m, i) => i === index ? { ...m, attachments } : m));
    }

    function handleModuleRemove(index: number) {
        setModules(prev => prev.filter((_, i) => i !== index));
    }

    async function handleCreate() {
        if (!title.trim()) { setNotice('Course title is required.'); return; }
        if (modules.length === 0) { setNotice('Add at least one module.'); return; }
        setSaving(true);
        try {
            const course = await createCourse({ lecturerId, lecturerName, title: title.trim(), description: description.trim(), modules });
            onCreated(course);
        } catch (err) {
            setNotice((err as Error).message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-6 py-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">New Course</p>
                    <h2 className="mt-1 text-lg font-bold text-gray-900">Create Course</h2>
                </div>
                <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-800">Cancel</button>
            </div>

            <div className="p-6 space-y-5">
                <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Title</label>
                    <input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Course title"
                        className="w-full border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Description</label>
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={3}
                        placeholder="Course objectives and overview"
                        className="w-full border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
                    />
                </div>
                <div className="space-y-3">
                    <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Modules</label>
                    {modules.map((mod, i) => (
                        <ModuleRow
                            key={i}
                            mod={mod}
                            index={i}
                            onChange={handleModuleChange}
                            onAttachmentsChange={handleAttachmentsChange}
                            onRemove={handleModuleRemove}
                            readOnly={false}
                        />
                    ))}
                    <button
                        type="button"
                        onClick={() => setModules(prev => [...prev, { title: '', content: '', minutes: 30 }])}
                        className="text-sm font-semibold text-blue-600 hover:underline"
                    >
                        + Add Module
                    </button>
                </div>
                <button
                    type="button"
                    onClick={handleCreate}
                    disabled={saving}
                    className="rounded-lg bg-[#FF6B35] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    Create Course
                </button>
                {notice && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">{notice}</div>
                )}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

type ActiveTab = 'courses' | 'exams';

export default function LearnManagePage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const { data: allCourses, error: coursesError } = useCourses();
    const { data: allSubmissions, error: subsError } = useExamSubmissions();

    const [tab, setTab] = useState<ActiveTab>('courses');
    const [selectedCourse, setSelectedCourse] = useState<ManagedCourse | null>(null);
    const [selectedSubmission, setSelectedSubmission] = useState<ExamSubmission | null>(null);
    const [showCreate, setShowCreate] = useState(false);

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="h-8 w-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!user || (user.role !== 'trainer' && user.role !== 'lecturer')) {
        router.replace('/dashboard');
        return null;
    }

    if (coursesError) {
        return <div className="p-8 text-sm text-red-600">Failed to load. {coursesError.message}</div>;
    }

    if (subsError) {
        return <div className="p-8 text-sm text-red-600">Failed to load. {subsError.message}</div>;
    }

    if (allCourses === undefined || allSubmissions === undefined) {
        return <div className="p-8 text-sm text-slate-500">Loading...</div>;
    }

    const courses = allCourses;
    const myCourseIds = new Set(courses.map(c => c.id));
    const submissions = allSubmissions.filter(s => myCourseIds.has(s.courseId));
    const pendingExams = submissions.filter(s => s.status === 'pending').length;

    function handleCourseUpdated(updated: ManagedCourse) {
        if (selectedCourse?.id === updated.id) setSelectedCourse(updated);
    }

    function handleCourseCreated(course: ManagedCourse) {
        setShowCreate(false);
        setSelectedCourse(course);
    }

    function handleGraded(updated: ExamSubmission) {
        if (selectedSubmission?.id === updated.id) setSelectedSubmission(updated);
    }

    return (
        <div className="space-y-6">
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">Learning Management</p>
                <h1 className="mt-2 text-2xl font-bold text-gray-900">Course Management</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Create and manage your courses, then submit them for NOU approval. Grade student exam submissions below.
                </p>
            </div>

            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => { setTab('courses'); setSelectedSubmission(null); }}
                    className={`px-5 py-3 text-sm font-semibold transition border-b-2 -mb-px ${
                        tab === 'courses'
                            ? 'border-[#FF6B35] text-[#FF6B35]'
                            : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                >
                    My Courses ({courses.length})
                </button>
                <button
                    onClick={() => { setTab('exams'); setSelectedCourse(null); setShowCreate(false); }}
                    className={`px-5 py-3 text-sm font-semibold transition border-b-2 -mb-px ${
                        tab === 'exams'
                            ? 'border-[#FF6B35] text-[#FF6B35]'
                            : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                >
                    Exam Submissions
                    {pendingExams > 0 && (
                        <span className="ml-2 rounded-full bg-[#FF6B35] px-2 py-0.5 text-xs font-semibold text-white">
                            {pendingExams}
                        </span>
                    )}
                </button>
            </div>

            {tab === 'courses' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">{courses.length} course{courses.length !== 1 ? 's' : ''} in your portfolio</p>
                        <button
                            onClick={() => { setShowCreate(true); setSelectedCourse(null); }}
                            className="rounded-lg bg-[#FF6B35] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                        >
                            Create Course
                        </button>
                    </div>

                    {showCreate && user && (
                        <CreateCourseForm
                            lecturerId={user.id}
                            lecturerName={user.name}
                            onCreated={handleCourseCreated}
                            onCancel={() => setShowCreate(false)}
                        />
                    )}

                    {selectedCourse && !showCreate && (
                        <CoursePanel
                            course={selectedCourse}
                            onClose={() => setSelectedCourse(null)}
                            onSaved={handleCourseUpdated}
                        />
                    )}

                    <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Title</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Modules</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Last Updated</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {courses.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                                            No courses yet. Create your first course above.
                                        </td>
                                    </tr>
                                )}
                                {courses.map(course => (
                                    <tr key={course.id} className="hover:bg-gray-50 transition">
                                        <td className="px-4 py-3 font-medium text-gray-900">{course.title}</td>
                                        <td className="px-4 py-3 text-gray-600">{course.modules.length}</td>
                                        <td className="px-4 py-3">
                                            <StatusBadge
                                                status={STATUS_BADGE_MAP[course.status] ?? course.status}
                                                label={STATUS_LABEL[course.status] ?? course.status}
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">{formatDate(course.updatedAt)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => { setSelectedCourse(course); setShowCreate(false); }}
                                                className="text-sm font-semibold text-blue-600 hover:underline"
                                            >
                                                {course.status === 'pending_nou' || course.status === 'approved' ? 'View' : 'Edit'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {tab === 'exams' && (
                <div className="space-y-6">
                    <p className="text-sm text-gray-500">
                        {submissions.length} submission{submissions.length !== 1 ? 's' : ''} across your courses
                        {pendingExams > 0 && <span className="ml-1 font-semibold text-amber-700">  {pendingExams} awaiting grade</span>}
                    </p>

                    {selectedSubmission && (
                        <GradePanel
                            submission={selectedSubmission}
                            onClose={() => setSelectedSubmission(null)}
                            onGraded={handleGraded}
                        />
                    )}

                    <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Student</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Course</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Submitted</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Status</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {submissions.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                                            No exam submissions yet.
                                        </td>
                                    </tr>
                                )}
                                {submissions.map(sub => (
                                    <tr key={sub.id} className="hover:bg-gray-50 transition">
                                        <td className="px-4 py-3 font-medium text-gray-900">{sub.studentName}</td>
                                        <td className="px-4 py-3 text-gray-600">{sub.courseTitle}</td>
                                        <td className="px-4 py-3 text-gray-500">{formatDate(sub.submittedAt)}</td>
                                        <td className="px-4 py-3">
                                            <StatusBadge
                                                status={sub.status === 'graded' ? 'completed' : 'pending'}
                                                label={sub.status === 'graded' ? 'Graded' : 'Pending'}
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => setSelectedSubmission(sub)}
                                                className="text-sm font-semibold text-blue-600 hover:underline"
                                            >
                                                {sub.status === 'graded' ? 'View' : 'Grade'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
