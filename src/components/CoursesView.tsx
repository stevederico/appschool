import Header from '@stevederico/skateboard-ui/Header';
import { useState, useEffect } from 'react';
import { getBackendURL, getCSRFToken } from '@stevederico/skateboard-ui/Utilities';
import { useAuthGate } from '@stevederico/skateboard-ui/useAuthGate';
import CourseCard from './CourseCard';
import type { Course } from './CourseCard';

export default function CoursesView() {
  const requireAuth = useAuthGate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${getBackendURL()}/courses`, {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to fetch courses');

      const data = await response.json();
      setCourses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleEnroll = (slug: string) => {
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

        setError(null);
        fetchCourses();
      } catch (err) {
        console.error('Enroll error:', err);
        setError(err instanceof Error ? err.message : 'Failed to enroll');
      }
    });
  };

  if (loading) {
    return (
      <>
        <Header title="Courses" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading courses...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header title="Courses" />
        <div className="flex items-center justify-center h-64">
          <div className="text-red-400">{error}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Courses" />
      <div className="p-6" data-section-id="courses-view">
        {error && (
          <div className="text-red-400 mb-4">{error}</div>
        )}
        {courses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No courses available yet.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-section-id="courses-grid">
            {[...courses].sort((a, b) => Number(b.isEnrolled === true) - Number(a.isEnrolled === true)).map(course => (
              <CourseCard
                key={course._id}
                course={course}
                onEnroll={handleEnroll}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
