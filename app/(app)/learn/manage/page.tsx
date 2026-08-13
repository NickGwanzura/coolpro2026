'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
    useCourses,
    useExamSubmissions,
    createCourse,
    updateCourse,
    deleteCourse,
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
import { Paperclip, Download, X, Loader2, UploadCloud } from 'lucide-react';

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

type CourseFilter = 'all' | ManagedCourse['status'];

function validateModuleEntries(modules: CourseModule[]) {
    if (modules.length === 0) return 'Add at least one module.';
    for (const [index, module] of modules.entries()) {
        if (!module.title.trim()) return `Module ${index + 1} needs a title.`;
        if (!module.content.trim()) return `Module ${index + 1} needs learning content.`;
        if (!Number.isFinite(Number(module.minutes)) || Number(module.minutes) < 1) {
            return `Module ${index + 1} needs at least 1 minute.`;
        }
    }
    return '';
}

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
    showMaterials = true,
}: {
    mod: CourseModule;
    index: number;
    courseId?: string;
    onChange: (index: number, field: keyof CourseModule, value: string | number) => void;
    onAttachmentsChange: (index: number, attachments: CourseAttachment[]) => void;
    onRemove: (index: number) => void;
    readOnly: boolean;
    showMaterials?: boolean;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [error, setError] = useState('');
    const attachments = mod.attachments ?? [];

    async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files ?? []);
        e.target.value = '';
        if (files.length === 0 || !courseId) return;
        setError('');
        setUploadProgress(0);
        try {
            const uploaded: CourseAttachment[] = [];
            for (const [fileIndex, file] of files.entries()) {
                const attachment = await uploadCourseMaterial(courseId, file, percent => {
                    setUploadProgress(Math.round(((fileIndex + percent / 100) / files.length) * 100));
                });
                uploaded.push(attachment);
            }
            onAttachmentsChange(index, [...attachments, ...uploaded]);
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

            {showMaterials && <div className="space-y-2 pt-2">
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
                        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
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
                                    <Paperclip className="h-3.5 w-3.5" /> Upload files
                                </>
                            )}
                        </button>
                    </div>
                )}
                {!readOnly && !courseId && (
                    <p className="text-xs text-gray-400">Save the course as a draft first to attach files.</p>
                )}
                {error && <p className="text-xs text-red-500">{error}</p>}
            </div>}
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
    onDeleted,
    canDelete,
}: {
    course: ManagedCourse;
    onClose: () => void;
    onSaved: (updated: ManagedCourse) => void;
    onDeleted: (courseId: string) => void;
    canDelete: boolean;
}) {
    const isLocked = course.status === 'pending_nou' || course.status === 'approved';
    const [mode] = useState<EditorMode>(isLocked ? 'view' : 'edit');
    const [title, setTitle] = useState(course.title);
    const [description, setDescription] = useState(course.description);
    const [modules, setModules] = useState<CourseModule[]>(course.modules);
    const [notice, setNotice] = useState('');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

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
        if (!description.trim()) { setNotice('Course description is required.'); return; }
        const moduleError = validateModuleEntries(modules);
        if (moduleError) { setNotice(moduleError); return; }
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
        if (!description.trim()) { setNotice('Course description is required.'); return; }
        const moduleError = validateModuleEntries(modules);
        if (moduleError) { setNotice(moduleError); return; }
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

    async function handleDelete() {
        if (!window.confirm(`Delete “${course.title}”? This cannot be undone.`)) return;
        setDeleting(true);
        setNotice('');
        try {
            await deleteCourse(course.id);
            onDeleted(course.id);
        } catch (err) {
            setNotice(err instanceof Error ? err.message : 'Failed to delete course.');
        } finally {
            setDeleting(false);
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
                <div className="flex items-center gap-3">
                    {canDelete && (
                        <button type="button" onClick={handleDelete} disabled={deleting || saving} className="text-sm font-semibold text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50">
                            {deleting ? 'Deleting…' : 'Delete'}
                        </button>
                    )}
                    <button type="button" onClick={onClose} className="text-sm text-gray-500 hover:text-gray-800">Close</button>
                </div>
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

                {canDelete && !isLocked && (
                    <p className="text-xs text-gray-500">Deleting removes this course and any uploaded course materials.</p>
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
    const [selectedFilesByModule, setSelectedFilesByModule] = useState<Record<number, File[]>>({});
    const [step, setStep] = useState(1);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [notice, setNotice] = useState('');
    const [saving, setSaving] = useState(false);
    const materialInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

    const stepLabels = ['Details', 'Curriculum', 'Materials', 'Preview'];
    const selectedFileCount = Object.values(selectedFilesByModule).reduce((sum, files) => sum + files.length, 0);
    const totalMinutes = modules.reduce((sum, module) => sum + Number(module.minutes || 0), 0);

    function formatMinutes(minutes: number) {
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const remaining = minutes % 60;
        return remaining > 0 ? `${hours} hr ${remaining} min` : `${hours} hr`;
    }

    function handleModuleChange(index: number, field: keyof CourseModule, value: string | number) {
        setModules(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
    }

    function handleAttachmentsChange(index: number, attachments: CourseAttachment[]) {
        setModules(prev => prev.map((m, i) => i === index ? { ...m, attachments } : m));
    }

    function handleModuleRemove(index: number) {
        setModules(prev => prev.filter((_, i) => i !== index));
        setSelectedFilesByModule(prev => Object.fromEntries(
            Object.entries(prev)
                .filter(([moduleIndex]) => Number(moduleIndex) !== index)
                .map(([moduleIndex, files]) => [
                    Number(moduleIndex) > index ? Number(moduleIndex) - 1 : Number(moduleIndex),
                    files,
                ]),
        ));
    }

    function handleCourseFilesSelect(moduleIndex: number, e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files ?? []);
        e.target.value = '';
        if (files.length === 0) return;
        setSelectedFilesByModule(prev => ({
            ...prev,
            [moduleIndex]: [...(prev[moduleIndex] ?? []), ...files],
        }));
    }

    function removeSelectedFile(moduleIndex: number, fileIndex: number) {
        setSelectedFilesByModule(prev => ({
            ...prev,
            [moduleIndex]: (prev[moduleIndex] ?? []).filter((_, index) => index !== fileIndex),
        }));
    }

    function validateStep(nextStep: number) {
        if (nextStep >= 2 && !title.trim()) return 'Course title is required.';
        if (nextStep >= 2 && !description.trim()) return 'Course description is required.';
        if (nextStep >= 3) {
            const moduleError = validateModuleEntries(modules);
            if (moduleError) return moduleError;
        }
        return '';
    }

    function goToStep(nextStep: number) {
        const validationError = validateStep(nextStep);
        if (validationError) {
            setNotice(validationError);
            return;
        }
        setNotice('');
        setStep(nextStep);
    }

    async function handleCreate() {
        const moduleError = validateModuleEntries(modules);
        if (moduleError) { setNotice(moduleError); return; }
        setSaving(true);
        setUploadProgress(selectedFileCount > 0 ? 0 : null);
        try {
            const draftModules = modules.map((mod, index) => ({
                ...mod,
                title: mod.title.trim() || `Module ${index + 1}`,
                content: mod.content.trim(),
                minutes: mod.minutes || 30,
            }));
            const course = await createCourse({ lecturerId, lecturerName, title: title.trim(), description: description.trim(), modules: draftModules });

            if (selectedFileCount === 0) {
                onCreated(course);
                return;
            }

            const updatedModules = [...course.modules];
            let uploadedCount = 0;
            for (const [moduleIndexString, files] of Object.entries(selectedFilesByModule)) {
                const moduleIndex = Number(moduleIndexString);
                const uploaded: CourseAttachment[] = [];
                for (const file of files) {
                    const attachment = await uploadCourseMaterial(course.id, file, percent => {
                        setUploadProgress(Math.round(((uploadedCount + percent / 100) / selectedFileCount) * 100));
                    });
                    uploaded.push(attachment);
                    uploadedCount += 1;
                }
                updatedModules[moduleIndex] = {
                    ...updatedModules[moduleIndex],
                    attachments: [...(updatedModules[moduleIndex].attachments ?? []), ...uploaded],
                };
            }
            const updatedCourse = await updateCourse(course.id, { modules: updatedModules });
            onCreated(updatedCourse);
        } catch (err) {
            setNotice((err as Error).message);
        } finally {
            setUploadProgress(null);
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
                <button type="button" onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-800">Cancel</button>
            </div>

            <div className="border-b border-gray-200 px-6 py-4">
                <ol className="grid grid-cols-4 gap-2" aria-label="Course creation steps">
                    {stepLabels.map((label, index) => {
                        const stepNumber = index + 1;
                        const active = step === stepNumber;
                        const complete = step > stepNumber;
                        return (
                            <li key={label}>
                                <button type="button" onClick={() => goToStep(stepNumber)} className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-semibold transition ${active ? 'bg-orange-50 text-orange-700' : complete ? 'text-emerald-700 hover:bg-emerald-50' : 'text-gray-500 hover:bg-gray-50'}`}>
                                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${active ? 'bg-[#FF6B35] text-white' : complete ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{complete ? '✓' : stepNumber}</span>
                                    <span className="hidden sm:inline">{label}</span>
                                </button>
                            </li>
                        );
                    })}
                </ol>
            </div>

            <div className="space-y-5 p-6">
                {step === 1 && (
                    <div className="space-y-5">
                        <div>
                            <p className="text-sm font-semibold text-gray-900">Start with the learner-facing basics</p>
                            <p className="mt-1 text-sm leading-6 text-gray-500">Give learners a clear outcome and the main topics they will cover.</p>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500" htmlFor="new-course-title">Title</label>
                            <input id="new-course-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Course title" className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500" htmlFor="new-course-description">Description</label>
                            <textarea id="new-course-description" value={description} onChange={e => setDescription(e.target.value)} rows={5} placeholder="Course objectives and overview" className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-semibold text-gray-900">Build the curriculum</p>
                            <p className="mt-1 text-sm leading-6 text-gray-500">Keep each module focused on one topic and add a realistic completion time.</p>
                        </div>
                        {modules.map((mod, i) => (
                            <ModuleRow key={i} mod={mod} index={i} onChange={handleModuleChange} onAttachmentsChange={handleAttachmentsChange} onRemove={handleModuleRemove} readOnly={false} showMaterials={false} />
                        ))}
                        <button type="button" onClick={() => setModules(prev => [...prev, { title: '', content: '', minutes: 30 }])} className="min-h-11 text-sm font-semibold text-blue-700 hover:underline">+ Add module</button>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-semibold text-gray-900">Attach materials to the right module</p>
                            <p className="mt-1 text-sm leading-6 text-gray-500">Files stay grouped with the module where learners will use them.</p>
                        </div>
                        {modules.map((mod, moduleIndex) => {
                            const files = selectedFilesByModule[moduleIndex] ?? [];
                            return (
                                <div key={moduleIndex} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Module {moduleIndex + 1}</p>
                                            <p className="mt-1 text-sm font-semibold text-gray-900">{mod.title.trim() || `Module ${moduleIndex + 1}`}</p>
                                        </div>
                                        <input ref={element => { materialInputRefs.current[moduleIndex] = element; }} type="file" multiple className="hidden" onChange={event => handleCourseFilesSelect(moduleIndex, event)} />
                                        <button type="button" onClick={() => materialInputRefs.current[moduleIndex]?.click()} disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 ring-1 ring-gray-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"><UploadCloud className="h-4 w-4" aria-hidden="true" /> Add files</button>
                                    </div>
                                    {files.length > 0 ? (
                                        <div className="mt-3 space-y-2">
                                            {files.map((file, fileIndex) => (
                                                <div key={`${file.name}-${file.lastModified}-${fileIndex}`} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
                                                    <span className="flex min-w-0 items-center gap-2 text-sm text-gray-700"><Paperclip className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden="true" /><span className="truncate">{file.name}</span><span className="shrink-0 text-xs text-gray-400">{formatFileSize(file.size)}</span></span>
                                                    <button type="button" onClick={() => removeSelectedFile(moduleIndex, fileIndex)} disabled={saving} className="min-h-11 min-w-11 text-gray-400 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50" aria-label={`Remove ${file.name}`}><X className="mx-auto h-4 w-4" aria-hidden="true" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : <p className="mt-3 text-xs text-gray-500">No files selected for this module.</p>}
                                </div>
                            );
                        })}
                        {uploadProgress !== null && <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800">Uploading materials… {uploadProgress}%</div>}
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-5">
                        <div>
                            <p className="text-sm font-semibold text-gray-900">Preview before creating</p>
                            <p className="mt-1 text-sm leading-6 text-gray-500">This is how the course summary will appear to learners.</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                            <h3 className="text-lg font-bold text-gray-950">{title.trim() || 'Untitled course'}</h3>
                            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-600">{description.trim() || 'No description provided.'}</p>
                            <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium text-gray-600"><span>{modules.length} modules</span><span>{formatMinutes(totalMinutes)}</span><span>{selectedFileCount} material{selectedFileCount === 1 ? '' : 's'}</span></div>
                        </div>
                        <div className="space-y-2">
                            {modules.map((mod, index) => <div key={index} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">{index + 1}</span><span className="min-w-0 flex-1 text-sm font-semibold text-gray-900">{mod.title.trim() || `Module ${index + 1}`}</span><span className="text-xs text-gray-500">{formatMinutes(Number(mod.minutes || 0))}</span></div>)}
                        </div>
                    </div>
                )}

                {notice && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{notice}</div>}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                    <button type="button" onClick={() => step === 1 ? onCancel() : goToStep(step - 1)} disabled={saving} className="min-h-11 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60">{step === 1 ? 'Cancel' : 'Back'}</button>
                    {step < 4 ? <button type="button" onClick={() => goToStep(step + 1)} disabled={saving} className="min-h-11 rounded-lg bg-[#FF6B35] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">Continue</button> : <button type="button" onClick={handleCreate} disabled={saving} className="min-h-11 rounded-lg bg-[#FF6B35] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">{saving ? (selectedFileCount > 0 ? 'Creating and uploading…' : 'Creating…') : 'Create course draft'}</button>}
                </div>
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
    const [courseFilter, setCourseFilter] = useState<CourseFilter>('all');
    const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);
    const [courseActionError, setCourseActionError] = useState('');

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="h-8 w-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!user || (user.role !== 'trainer' && user.role !== 'lecturer' && user.role !== 'org_admin')) {
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
    const visibleCourses = courseFilter === 'all' ? courses : courses.filter(course => course.status === courseFilter);
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

    function handleCourseDeleted(courseId: string) {
        if (selectedCourse?.id === courseId) setSelectedCourse(null);
    }

    async function handleTableDelete(course: ManagedCourse) {
        if (!window.confirm(`Delete “${course.title}”? This cannot be undone.`)) return;
        setDeletingCourseId(course.id);
        setCourseActionError('');
        try {
            await deleteCourse(course.id);
            handleCourseDeleted(course.id);
        } catch (err) {
            setCourseActionError(err instanceof Error ? err.message : 'Failed to delete course.');
        } finally {
            setDeletingCourseId(null);
        }
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
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-3">
                            <p className="text-sm text-gray-500">{visibleCourses.length} of {courses.length} course{courses.length !== 1 ? 's' : ''}</p>
                            <label className="sr-only" htmlFor="course-status-filter">Filter courses by status</label>
                            <select
                                id="course-status-filter"
                                value={courseFilter}
                                onChange={event => setCourseFilter(event.target.value as CourseFilter)}
                                className="min-h-11 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All statuses</option>
                                <option value="draft">Draft</option>
                                <option value="pending_nou">Pending NOU</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                        <button
                            type="button"
                            onClick={() => { setShowCreate(true); setSelectedCourse(null); }}
                            className="min-h-11 rounded-lg bg-[#FF6B35] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                        >
                            Create Course
                        </button>
                    </div>

                    {courseActionError && <p role="alert" className="text-sm text-red-600">{courseActionError}</p>}

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
                            onDeleted={handleCourseDeleted}
                            canDelete={user.role === 'org_admin' || selectedCourse.status === 'draft' || selectedCourse.status === 'rejected'}
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
                                {visibleCourses.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                                            {courses.length === 0 ? 'No courses yet. Create your first course above.' : 'No courses match this status filter.'}
                                        </td>
                                    </tr>
                                )}
                                {visibleCourses.map(course => (
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
                                            <div className="inline-flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => { setSelectedCourse(course); setShowCreate(false); }}
                                                className="min-h-11 text-sm font-semibold text-blue-600 hover:underline"
                                            >
                                                {course.status === 'pending_nou' || course.status === 'approved' ? 'View' : 'Edit'}
                                            </button>
                                            {(user.role === 'org_admin' || course.status === 'draft' || course.status === 'rejected') && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleTableDelete(course)}
                                                    disabled={deletingCourseId === course.id}
                                                    className="min-h-11 text-sm font-semibold text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {deletingCourseId === course.id ? 'Deleting…' : 'Delete'}
                                                </button>
                                            )}
                                            </div>
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
