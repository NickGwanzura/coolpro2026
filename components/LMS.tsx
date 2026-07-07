'use client';

import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Clock, Download, FileText } from 'lucide-react';
import { useCourses, getCourseMaterialDownloadUrl, type ManagedCourse } from '@/lib/platformStore';

function totalMinutes(course: ManagedCourse) {
  return course.modules.reduce((sum, m) => sum + m.minutes, 0);
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function CourseCard({ course }: { course: ManagedCourse }) {
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState('');

  async function handleDownload(r2Key: string) {
    setError('');
    try {
      const url = await getCourseMaterialDownloadUrl(course.id, r2Key);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open file');
    }
  }

  return (
    <div className="bg-white border border-gray-200 overflow-hidden flex flex-col">
      <div className="p-5 flex-1 flex flex-col">
        <h4 className="font-semibold text-gray-900 mb-2 leading-tight">{course.title}</h4>
        <p className="text-gray-500 text-sm mb-4 flex-1">{course.description}</p>

        <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            {course.modules.length} modules
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {totalMinutes(course)} min
          </span>
        </div>

        <button
          onClick={() => setExpanded(prev => !prev)}
          className="w-full py-2.5 font-semibold text-sm transition-colors flex items-center justify-center gap-2 bg-gray-900 text-white hover:bg-gray-800"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {expanded ? 'Hide modules' : 'View modules'}
        </button>

        {expanded && (
          <div className="mt-4 space-y-3">
            {course.modules.map((mod, i) => (
              <div key={i} className="border border-gray-200 bg-gray-50 p-3">
                <p className="text-sm font-semibold text-gray-900">{mod.title}</p>
                <p className="mt-1 text-xs text-gray-500">{mod.content}</p>
                <p className="mt-1 text-xs text-gray-400">{mod.minutes} min</p>
                {(mod.attachments ?? []).length > 0 && (
                  <div className="mt-2 space-y-1">
                    {(mod.attachments ?? []).map(attachment => (
                      <button
                        key={attachment.id}
                        onClick={() => handleDownload(attachment.r2Key)}
                        className="flex w-full items-center justify-between gap-2 border border-gray-200 bg-white px-2.5 py-1.5 text-left text-xs text-gray-700 hover:border-blue-300 hover:text-blue-600"
                      >
                        <span className="flex min-w-0 items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                          <span className="truncate">{attachment.fileName}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-1.5 text-gray-400">
                          {formatFileSize(attachment.sizeBytes)}
                          <Download className="h-3.5 w-3.5" />
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LMS() {
  const { data: courses, error, isLoading } = useCourses();

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading courses…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">Failed to load courses. {error.message}</p>;
  }

  if (!courses || courses.length === 0) {
    return <p className="text-sm text-gray-500">No approved courses are available yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map(course => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
