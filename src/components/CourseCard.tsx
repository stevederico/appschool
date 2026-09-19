import { useNavigate } from 'react-router';
import type { MouseEvent } from 'react';
import { BookOpen, Check, Clock, Code, HelpCircle } from 'lucide-react';

/** A course summary as returned by GET /courses. */
export interface Course {
  _id?: string;
  slug: string;
  title: string;
  description?: string;
  difficulty?: string;
  estimatedHours?: number;
  guideCount?: number;
  quizCount?: number;
  repCount?: number;
  tags?: string[];
  isEnrolled?: boolean;
}

/** Props for {@link CourseCard}. */
interface CourseCardProps {
  /** Course to render. */
  course: Course;
  /** Called with the course slug when the Enroll button is clicked. */
  onEnroll?: (slug: string) => void;
}

export default function CourseCard({ course, onEnroll }: CourseCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/app/courses/${course.slug}`);
  };

  const handleEnroll = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onEnroll?.(course.slug);
  };

  const difficultyColors: Record<string, string> = {
    beginner: 'bg-green-500/20 text-green-400',
    intermediate: 'bg-yellow-500/20 text-yellow-400',
    advanced: 'bg-red-500/20 text-red-400'
  };

  return (
    <div
      onClick={handleClick}
      className={`bg-accent rounded-xl p-6 cursor-pointer hover:bg-accent/80 transition-all border ${course.isEnrolled ? 'border-app' : 'border-transparent hover:border-app/30'}`}
      data-umami-event="course-card-clicked"
      data-umami-event-course={course.slug}
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl font-bold">{course.title}</h3>
        {course.isEnrolled ? (
          <div className="bg-app/20 text-app px-3 py-1 rounded-full text-sm flex items-center gap-1">
            <Check size={14}/>
            Enrolled
          </div>
        ) : (
          <button
            onClick={handleEnroll}
            className="bg-app text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:opacity-90 transition-all cursor-pointer"
            data-umami-event="course-enroll-clicked"
            data-umami-event-course={course.slug}
          >
            Enroll
          </button>
        )}
      </div>

      <p className="text-muted-foreground mb-4 line-clamp-2">{course.description}</p>

      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        <span className="flex items-center gap-1">
          <Clock size={16}/>
          ~{course.estimatedHours || 20} hours
        </span>
        <span className="flex items-center gap-1">
          <BookOpen size={16}/>
          {course.guideCount || 0} Guides
        </span>
        <span className="flex items-center gap-1">
          <HelpCircle size={16}/>
          {course.quizCount || 0} Quizzes
        </span>
        <span className="flex items-center gap-1">
          <Code size={16}/>
          {course.repCount || 0} Reps
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
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
  );
}
