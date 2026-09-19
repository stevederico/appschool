import Header from '@stevederico/skateboard-ui/Header';
import { Activity, BookOpen, Calendar, CheckCircle, Circle, Code, HelpCircle, Layers } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { getBackendURL } from '@stevederico/skateboard-ui/Utilities';

/** A completed activity (guide/quiz/rep) in the progress timeline. */
interface Activity {
  type: 'guide' | 'quiz' | 'rep';
  title: string;
  slug: string;
  courseSlug: string;
  courseName: string;
  label: string;
  passed: boolean;
  score?: number;
  attemptNumber?: number;
  actualMinutes?: number;
  completedAt: string;
}

/** A group of activities sharing the same calendar day. */
interface ActivityGroup {
  date: string;
  label: string;
  items: Activity[];
}

/** Result of the estimated-completion calculation. */
type EstimatedCompletion =
  | { status: 'complete' | 'not_started' | 'insufficient_data' }
  | { status: 'calculated'; date: Date; daysRemaining: number; itemsPerDay: string };

/** Format an ISO date as a relative or weekday header label. */
function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

/** Calendar-day key for grouping (drops the time component). */
function getDateKey(dateStr: string): string {
  return new Date(dateStr).toDateString();
}

/**
 * Group activities by calendar day, newest group first by insertion order.
 *
 * @param items - Activities sorted most-recent-first
 * @returns Day-grouped activities
 */
function groupByDate(items: Activity[]): ActivityGroup[] {
  const groups: Record<string, Activity[]> = {};
  items.forEach(item => {
    const key = getDateKey(item.completedAt);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });
  return Object.entries(groups).map(([, items]) => ({
    date: items[0].completedAt,
    label: formatDateHeader(items[0].completedAt),
    items
  }));
}

/** Props for {@link ActivityItem}. */
interface ActivityItemProps {
  item: Activity;
  onClick: () => void;
}

function ActivityItem({ item, onClick }: ActivityItemProps) {
  const getIcon = (): LucideIcon => {
    switch (item.type) {
      case 'guide': return BookOpen;
      case 'quiz': return HelpCircle;
      case 'rep': return Code;
      default: return Circle;
    }
  };
  const ItemIcon = getIcon();

  const getColor = () => {
    switch (item.type) {
      case 'guide': return 'text-blue-400';
      case 'quiz': return 'text-green-400';
      case 'rep': return 'text-purple-400';
      default: return 'text-muted-foreground';
    }
  };

  const passed = item.passed !== false;

  const date = new Date(item.completedAt);
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-lg cursor-pointer bg-accent hover:bg-accent/80 transition-all"
      data-umami-event="activity-item-clicked"
      data-umami-event-type={item.type}
    >
      <ItemIcon size={16} className={getColor()} />
      <div className="flex-1 min-w-0">
        <div className="truncate">{item.title}</div>
        <div className="text-xs text-muted-foreground">{item.label}</div>
      </div>
      <div className={`text-xs whitespace-nowrap ${passed ? 'text-green-400' : 'text-red-400'}`}>
        {passed ? 'Passed' : 'Failed'}
      </div>
      <div className="text-xs text-muted-foreground whitespace-nowrap">
        {time}
      </div>
    </div>
  );
}

/** An enrolled course as listed on the progress page. */
interface EnrolledCourse {
  slug: string;
  title: string;
  isEnrolled?: boolean;
}

/** Checklist item (guide/quiz/rep) with optional completion metadata. */
interface ProgressChecklistItem {
  _id?: string;
  slug?: string;
  title?: string;
  completed?: boolean;
  completedAt?: string;
  attempts?: ProgressRepAttempt[];
}

/** A single rep attempt within checklist progress. */
interface ProgressRepAttempt {
  codeMatch?: boolean;
  underTarget?: boolean;
  actualMinutes?: number;
  completedAt?: string;
}

/** A recorded quiz attempt from detailed progress. */
interface ProgressQuizAttempt {
  quizId?: string | { toString(): string };
  passed?: boolean;
  score?: number;
  attemptedAt?: string;
}

/** Per-course progress payload from GET /progress/:slug. */
interface CourseProgressPayload {
  stats?: {
    completedGuides?: number;
    totalGuides?: number;
    completedQuizzes?: number;
    totalQuizzes?: number;
    completedReps?: number;
    totalReps?: number;
    totalTimeSpentMinutes?: number;
  };
  checklist?: {
    guides?: ProgressChecklistItem[];
    quizzes?: ProgressChecklistItem[];
    reps?: ProgressChecklistItem[];
  };
  detailed?: {
    quizAttempts?: ProgressQuizAttempt[];
  };
}

/** Per-course progress payload keyed by course slug. */
type ProgressMap = Record<string, CourseProgressPayload>;

export default function ProgressView() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [progressData, setProgressData] = useState<ProgressMap>({});
  const [loading, setLoading] = useState(true);
  const [showAllCompleted, setShowAllCompleted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const coursesRes = await fetch(`${getBackendURL()}/courses`, {
          credentials: 'include'
        });

        if (!coursesRes.ok) throw new Error('Failed to fetch courses');

        const coursesData = await coursesRes.json();
        const enrolledCourses: EnrolledCourse[] = coursesData.filter((c: EnrolledCourse) => c.isEnrolled);
        setCourses(enrolledCourses);

        const progressPromises = enrolledCourses.map(course =>
          fetch(`${getBackendURL()}/progress/${course.slug}`, { credentials: 'include' })
            .then(res => res.ok ? res.json() : null)
        );

        const progressResults = await Promise.all(progressPromises);
        const progressMap: ProgressMap = {};
        enrolledCourses.forEach((course, idx) => {
          if (progressResults[idx]) {
            progressMap[course.slug] = progressResults[idx];
          }
        });
        setProgressData(progressMap);
      } catch (err) {
        console.error('Error fetching progress:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <>
        <Header title="My Progress" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading progress...</div>
        </div>
      </>
    );
  }

  // Calculate overall stats
  const totalStats = {
    courses: courses.length,
    completedGuides: 0,
    totalGuides: 0,
    completedQuizzes: 0,
    totalQuizzes: 0,
    completedReps: 0,
    totalReps: 0,
    totalTime: 0
  };

  Object.values(progressData).forEach(p => {
    if (p?.stats) {
      totalStats.completedGuides += p.stats.completedGuides || 0;
      totalStats.totalGuides += p.stats.totalGuides || 0;
      totalStats.completedQuizzes += p.stats.completedQuizzes || 0;
      totalStats.totalQuizzes += p.stats.totalQuizzes || 0;
      totalStats.completedReps += p.stats.completedReps || 0;
      totalStats.totalReps += p.stats.totalReps || 0;
      totalStats.totalTime += p.stats.totalTimeSpentMinutes || 0;
    }
  });

  const overallProgress = totalStats.totalGuides + totalStats.totalQuizzes + totalStats.totalReps > 0
    ? Math.round(((totalStats.completedGuides + totalStats.completedQuizzes + totalStats.completedReps) /
        (totalStats.totalGuides + totalStats.totalQuizzes + totalStats.totalReps)) * 100)
    : 0;

  // Calculate estimated completion date
  const calculateEstimatedCompletion = (): EstimatedCompletion => {
    const totalItems = totalStats.totalGuides + totalStats.totalQuizzes + totalStats.totalReps;
    const completedItems = totalStats.completedGuides + totalStats.completedQuizzes + totalStats.completedReps;
    const remainingItems = totalItems - completedItems;

    if (remainingItems === 0) return { status: 'complete' };
    if (completedItems === 0) return { status: 'not_started' };

    // Get all completion dates
    const completionDates: Date[] = [];
    Object.values(progressData).forEach(p => {
      if (!p?.checklist) return;
      const { guides = [], quizzes = [], reps = [] } = p.checklist;

      guides.filter((g) => g.completed && g.completedAt).forEach((g) => {
        if (g.completedAt) completionDates.push(new Date(g.completedAt));
      });
      quizzes.filter((q) => q.completed && q.completedAt).forEach((q) => {
        if (q.completedAt) completionDates.push(new Date(q.completedAt));
      });
      reps.filter((r) => r.completed && r.completedAt).forEach((r) => {
        if (r.completedAt) completionDates.push(new Date(r.completedAt));
      });
    });

    if (completionDates.length < 2) return { status: 'insufficient_data' };

    // Sort dates and calculate rate over active period
    completionDates.sort((a, b) => a.getTime() - b.getTime());
    const firstDate = completionDates[0];
    const lastDate = completionDates[completionDates.length - 1];
    const daysDiff = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
    const itemsPerDay = completedItems / daysDiff;

    if (itemsPerDay <= 0) return { status: 'insufficient_data' };

    const daysRemaining = Math.ceil(remainingItems / itemsPerDay);
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + daysRemaining);

    return {
      status: 'calculated',
      date: estimatedDate,
      daysRemaining,
      itemsPerDay: itemsPerDay.toFixed(1)
    };
  };

  const estimatedCompletion = calculateEstimatedCompletion();

  // Build activity timeline from all courses
  const activities: Activity[] = [];

  courses.forEach(course => {
    const progress = progressData[course.slug];
    if (!progress?.checklist) return;

    const { guides = [], quizzes = [], reps = [] } = progress.checklist;
    const quizAttempts = progress.detailed?.quizAttempts || [];

    // Guide completions
    guides.filter((g) => g.completed && g.completedAt).forEach((g) => {
      if (!g.completedAt) return;
      activities.push({
        type: 'guide',
        title: g.title ?? '',
        slug: g.slug ?? '',
        courseSlug: course.slug,
        courseName: course.title,
        label: `${course.title} · Completed guide`,
        passed: true,
        completedAt: g.completedAt
      });
    });

    // All quiz attempts (not just passed)
    quizAttempts.forEach((attempt) => {
      const attemptQuizId = attempt.quizId?.toString();
      const quiz = quizzes.find((q) =>
        q._id === attemptQuizId || q._id?.toString() === attemptQuizId
      );
      if (!quiz || !attempt.attemptedAt) return;
      activities.push({
        type: 'quiz',
        title: quiz.title ?? '',
        slug: quiz.slug ?? '',
        courseSlug: course.slug,
        courseName: course.title,
        label: `${course.title} · ${attempt.passed ? `Passed ${attempt.score}%` : `Failed ${attempt.score}%`}`,
        passed: attempt.passed ?? false,
        score: attempt.score,
        completedAt: attempt.attemptedAt
      });
    });

    // All rep attempts (not just first completion)
    reps.forEach((r) => {
      if (!r.attempts || r.attempts.length === 0) return;
      r.attempts.forEach((attempt, idx) => {
        if (!attempt.completedAt) return;
        const passed = Boolean(attempt.codeMatch && attempt.underTarget);
        activities.push({
          type: 'rep',
          title: r.title ?? '',
          slug: r.slug ?? '',
          courseSlug: course.slug,
          courseName: course.title,
          label: `${course.title} · ${passed ? 'Passed' : 'Failed'} · ${attempt.actualMinutes}:00`,
          passed,
          attemptNumber: idx + 1,
          actualMinutes: attempt.actualMinutes,
          completedAt: attempt.completedAt
        });
      });
    });

  });

  // Sort activities by date (most recent first)
  activities.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

  // Show all activities from last 7 days by default
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentActivities = activities.filter(a => new Date(a.completedAt) >= oneWeekAgo);
  const olderActivities = activities.filter(a => new Date(a.completedAt) < oneWeekAgo);
  const displayedActivities = showAllCompleted ? activities : recentActivities;

  const navigateToItem = (item: Activity) => {
    const path = item.type === 'guide'
      ? `/app/courses/${item.courseSlug}/guides/${item.slug}`
      : item.type === 'quiz'
        ? `/app/courses/${item.courseSlug}/quizzes/${item.slug}`
        : `/app/courses/${item.courseSlug}/reps/${item.slug}`;
    navigate(path);
  };

  return (
    <>
      <Header title="My Progress" />
      <div className="p-6 max-w-4xl mx-auto" data-section-id="progress-view">
        {courses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen size={48} className="mx-auto mb-4 text-muted-foreground"/>
            <h2 className="text-xl font-semibold mb-2">No Enrolled Courses</h2>
            <p className="text-muted-foreground mb-6">
              Enroll in a course to start tracking your progress.
            </p>
            <button
              onClick={() => navigate('/app/courses')}
              className="bg-app text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-all cursor-pointer"
              data-umami-event="progress-browse-courses-clicked"
            >
              Browse Courses
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overall Stats */}
            <div className="bg-accent rounded-xl p-6" data-section-id="progress-stats">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Overall Progress</span>
                <span className="text-app font-bold text-2xl">{overallProgress}%</span>
              </div>
              <div className="w-full bg-background rounded-full h-3 mb-4">
                <div
                  className="bg-app h-3 rounded-full transition-all duration-500"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>

              {/* Estimated Completion */}
              {estimatedCompletion.status === 'complete' && (
                <div className="flex items-center gap-2 mb-4 text-sm text-green-400">
                  <CheckCircle size={16}/>
                  <span>All enrolled courses completed!</span>
                </div>
              )}
              {estimatedCompletion.status === 'calculated' && (
                <div className="flex items-center justify-between mb-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar size={16}/>
                    <span>Est. completion</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">
                      {estimatedCompletion.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      ({estimatedCompletion.daysRemaining} days @ {estimatedCompletion.itemsPerDay}/day)
                    </span>
                  </div>
                </div>
              )}
              {estimatedCompletion.status === 'insufficient_data' && (
                <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                  <Calendar size={16}/>
                  <span>Complete more items to see estimated completion date</span>
                </div>
              )}

              <div className="grid grid-cols-4 gap-4 text-center text-sm">
                <div>
                  <div className="flex items-center justify-center gap-1 text-app mb-1">
                    <Layers size={14}/>
                    <span className="font-medium">{totalStats.courses}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Courses</div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
                    <BookOpen size={14}/>
                    <span className="font-medium">{totalStats.completedGuides}/{totalStats.totalGuides}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Guides</div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
                    <HelpCircle size={14}/>
                    <span className="font-medium">{totalStats.completedQuizzes}/{totalStats.totalQuizzes}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Quizzes</div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-purple-400 mb-1">
                    <Code size={14}/>
                    <span className="font-medium">{totalStats.completedReps}/{totalStats.totalReps}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Reps</div>
                </div>
              </div>
            </div>

            {/* Activity History */}
            {activities.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Activity size={18} className="text-app"/>
                  Activity
                  <span className="text-sm text-muted-foreground font-normal">
                    ({activities.length})
                  </span>
                </h3>
                <div className="space-y-6">
                  {groupByDate(displayedActivities).map(group => (
                    <div key={group.date}>
                      <div className="text-sm font-semibold mb-3 pb-2 border-b border-accent">{group.label}</div>
                      <div className="space-y-2">
                        {group.items.map((item, idx) => (
                          <ActivityItem
                            key={`${item.type}-${item.courseSlug}-${item.slug}-${idx}`}
                            item={item}
                            onClick={() => navigateToItem(item)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {olderActivities.length > 0 && !showAllCompleted && (
                  <button
                    onClick={() => setShowAllCompleted(true)}
                    className="w-full mt-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    data-umami-event="progress-show-older-clicked"
                  >
                    Show {olderActivities.length} older items
                  </button>
                )}
                {showAllCompleted && olderActivities.length > 0 && (
                  <button
                    onClick={() => setShowAllCompleted(false)}
                    className="w-full mt-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    data-umami-event="progress-hide-older-clicked"
                  >
                    Hide older items
                  </button>
                )}
              </div>
            )}

          </div>
        )}
      </div>
    </>
  );
}
