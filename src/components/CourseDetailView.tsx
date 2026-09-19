import { BookOpen, Check, Clock, Code, HelpCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { getBackendURL, getCSRFToken } from '@stevederico/skateboard-ui/Utilities';
import { useAuthGate } from '@stevederico/skateboard-ui/useAuthGate';
import ProgressChecklist from './ProgressChecklist';
import type { Checklist, ProgressStats } from './ProgressChecklist';
import type { Course } from './CourseCard';

/** A course's progress payload (checklist + aggregate stats). */
interface CourseProgress {
  checklist?: Checklist;
  stats?: ProgressStats | null;
}

/** Narrow unknown JSON items into checklist entries (slug + title required). */
function toChecklistEntries(raw: unknown): NonNullable<Checklist['guides']> {
  if (!Array.isArray(raw)) return [];
  const out: NonNullable<Checklist['guides']> = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;
    if (!('slug' in item) || !('title' in item)) continue;
    if (typeof item.slug !== 'string' || typeof item.title !== 'string') continue;
    out.push({
      slug: item.slug,
      title: item.title,
      _id: '_id' in item && typeof item._id === 'string' ? item._id : undefined,
      wordCount: 'wordCount' in item && typeof item.wordCount === 'number' ? item.wordCount : undefined,
      targetMinutes: 'targetMinutes' in item && typeof item.targetMinutes === 'number' ? item.targetMinutes : undefined,
      category: 'category' in item && typeof item.category === 'string' ? item.category : undefined,
      completed: false,
    });
  }
  return out;
}

export default function CourseDetailView() {
  const { slug } = useParams();
  const requireAuth = useAuthGate();
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  const fetchCourseData = async () => {
    try {
      setLoading(true);

      // Fetch course and progress in parallel
      const [courseRes, progressRes] = await Promise.all([
        fetch(`${getBackendURL()}/courses/${slug}`, { credentials: 'include' }),
        fetch(`${getBackendURL()}/progress/${slug}`, { credentials: 'include' })
      ]);

      if (!courseRes.ok) throw new Error('Course not found');

      const courseData = await courseRes.json();
      setCourse(courseData);

      if (progressRes.ok) {
        const progressData = await progressRes.json();
        setProgress(progressData);
      } else {
        // Fetch guides and reps directly when progress is not available
        const [guidesRes, repsRes] = await Promise.all([
          fetch(`${getBackendURL()}/courses/${slug}/guides`),
          fetch(`${getBackendURL()}/courses/${slug}/reps`)
        ]);
        const guidesJson: unknown = guidesRes.ok ? await guidesRes.json() : [];
        const repsJson: unknown = repsRes.ok ? await repsRes.json() : [];
        setProgress({
          checklist: {
            guides: toChecklistEntries(guidesJson),
            quizzes: [],
            reps: toChecklistEntries(repsJson)
          },
          stats: null
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Course not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseData();
  }, [slug]);

  const handleEnroll = () => {
    requireAuth(async () => {
      try {
        const response = await fetch(`${getBackendURL()}/courses/${slug}/enroll`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': getCSRFToken() ?? ''
          }
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to enroll');
        }

        setEnrollError(null);
        fetchCourseData();
      } catch (err) {
        console.error('Enroll error:', err);
        setEnrollError(err instanceof Error ? err.message : 'Failed to enroll');
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">{error || 'Course not found'}</div>
      </div>
    );
  }

  const difficultyColors: Record<string, string> = {
    beginner: 'bg-green-500/20 text-green-400',
    intermediate: 'bg-yellow-500/20 text-yellow-400',
    advanced: 'bg-red-500/20 text-red-400'
  };

  return (
    <div className="p-6 max-w-4xl mx-auto" data-section-id="course-detail">
        {/* Course Header */}
        <div className="bg-accent rounded-xl p-6 mb-6" data-section-id="course-header">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">{course.title}</h1>
            </div>
            {course.isEnrolled ? (
              <div className="bg-app/20 text-app px-4 py-2 rounded-full flex items-center gap-2">
                <Check size={16}/>
                Enrolled
              </div>
            ) : (
              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={handleEnroll}
                  className="bg-app text-white px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-all cursor-pointer"
                  data-umami-event="course-enroll-now-clicked"
                >
                  Enroll Now
                </button>
                {enrollError && <div className="text-red-400 text-sm">{enrollError}</div>}
              </div>
            )}
          </div>

          <p className="text-muted-foreground mb-4">{course.description}</p>

          <div className="flex items-center gap-6 text-sm">
            <span className="flex items-center gap-1">
              <Clock size={16}/>
              ~{course.estimatedHours} hours
            </span>
            <span className="flex items-center gap-1">
              <BookOpen size={16}/>
              {course.guideCount} Guides
            </span>
            <span className="flex items-center gap-1">
              <HelpCircle size={16}/>
              {course.quizCount} Quizzes
            </span>
            <span className="flex items-center gap-1">
              <Code size={16}/>
              {course.repCount} Reps
            </span>
          </div>

          <div className="flex gap-2 mt-4">
            <span className={`text-xs px-2 py-1 rounded-full ${(course.difficulty && difficultyColors[course.difficulty]) || difficultyColors.intermediate}`}>
              {course.difficulty}
            </span>
            {course.tags && course.tags.map(tag => (
              <span key={tag} className="text-xs bg-background px-2 py-1 rounded whitespace-nowrap">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Progress Checklist */}
        <ProgressChecklist
          courseSlug={slug || ''}
          checklist={progress?.checklist}
          stats={course.isEnrolled ? progress?.stats : null}
          estimatedHours={course.estimatedHours}
          isEnrolled={course.isEnrolled}
        />
    </div>
  );
}
