import { useState } from 'react';
import { useNavigate } from 'react-router';
import { BookOpen, Check, CheckCircle, ChevronDown, ChevronUp, Circle, Code, HelpCircle, XCircle, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const WORDS_PER_MINUTE = 150;

/** A recorded attempt at a rep. */
interface RepAttempt {
  actualMinutes: number;
  completedAt: string;
  underTarget?: boolean;
  codeMatch?: boolean;
}

/** A checklist item (guide or rep) within a course. */
interface ChecklistEntry {
  _id?: string;
  slug: string;
  title: string;
  completed?: boolean;
  wordCount?: number;
  targetMinutes?: number;
  category?: string;
  priority?: 'high' | 'medium' | 'low';
  attempts?: RepAttempt[];
  attemptCount?: number;
  hasUnderTarget?: boolean;
  guideSlug?: string;
}

/** Quiz summary correlated to a guide. */
interface QuizEntry {
  guideSlug?: string;
  bestScore?: number | null;
  passed?: boolean;
}

/** The checklist payload for a course. */
export interface Checklist {
  guides?: ChecklistEntry[];
  quizzes?: QuizEntry[];
  reps?: ChecklistEntry[];
}

/** Aggregate progress stats for a course. */
export interface ProgressStats {
  percentComplete: number;
  totalGuides?: number;
  completedGuides?: number;
  totalQuizzes?: number;
  completedQuizzes?: number;
}

/** Read the persisted voice speed multiplier (defaults to 1.0). */
function getVoiceSpeed(): number {
  return parseFloat(localStorage.getItem('voiceSpeed') || '') || 1.0;
}

/**
 * Estimate reading minutes from a word count at the given voice speed.
 *
 * @param wordCount - Number of words
 * @param voiceSpeed - Voice speed multiplier
 * @returns Estimated whole minutes
 */
function calculateMinutes(wordCount: number, voiceSpeed: number): number {
  if (!wordCount) return 0;
  return Math.ceil(wordCount / (WORDS_PER_MINUTE * voiceSpeed));
}

/** Format an ISO date string as a short, human-readable date/time. */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/** Props for {@link ChecklistItem}. */
interface ChecklistItemProps {
  item: ChecklistEntry;
  type: 'guide' | 'rep';
  courseSlug: string;
  completed?: boolean;
  quiz?: QuizEntry;
  voiceSpeed: number;
  isEnrolled?: boolean;
}

function ChecklistItem({ item, type, courseSlug, completed, quiz, voiceSpeed, isEnrolled }: ChecklistItemProps) {
  const navigate = useNavigate();

  const getPath = () => {
    switch (type) {
      case 'guide':
        return `/app/courses/${courseSlug}/guides/${item.slug}`;
      case 'rep':
        return `/app/courses/${courseSlug}/reps/${item.slug}`;
      default:
        return '#';
    }
  };

  const getIcon = (): LucideIcon => {
    switch (type) {
      case 'guide':
        return BookOpen;
      case 'rep':
        return Code;
      default:
        return Circle;
    }
  };
  const ItemIcon = getIcon();

  const handleClick = () => {
    if (!isEnrolled) {
      alert('Please enroll in this course to access the content.');
      return;
    }
    navigate(getPath());
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
        completed ? 'bg-green-500/10' : 'bg-accent hover:bg-accent/80'
      }`}
      data-umami-event="checklist-item-clicked"
      data-umami-event-type={type}
    >
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center ${
          completed ? 'bg-green-500 text-white' : 'bg-background border-2 border-accent'
        }`}
      >
        {completed && <Check size={14}/>}
      </div>
      <ItemIcon size={16} className="text-muted-foreground" />
      <span className={completed ? 'line-through opacity-60' : ''}>{item.title}</span>
      <div className="ml-auto flex items-center gap-2">
        {quiz && quiz.bestScore !== null && (
          <span className={`text-xs px-2 py-0.5 rounded ${
            quiz.passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {quiz.bestScore}%
          </span>
        )}
        {(item.wordCount || item.targetMinutes) && (
          <span className="text-xs text-muted-foreground">
            {item.wordCount ? calculateMinutes(item.wordCount, voiceSpeed) : item.targetMinutes} min
          </span>
        )}
        {item.category && (
          <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded">
            {item.category}
          </span>
        )}
      </div>
    </div>
  );
}

/** Props for {@link RepItem}. */
interface RepItemProps {
  item: ChecklistEntry;
  courseSlug: string;
  isEnrolled?: boolean;
}

function RepItem({ item, courseSlug, isEnrolled }: RepItemProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const hasAttempts = item.attempts && item.attempts.length > 0;

  const handleClick = () => {
    if (!isEnrolled) {
      alert('Please enroll in this course to access the content.');
      return;
    }
    navigate(`/app/courses/${courseSlug}/reps/${item.slug}`);
  };

  return (
    <div className="space-y-1">
      <div
        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
          item.completed ? 'bg-green-500/10' : 'bg-accent hover:bg-accent/80'
        }`}
      >
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center ${
            item.completed ? 'bg-green-500 text-white' : 'bg-background border-2 border-accent'
          }`}
          onClick={handleClick}
        >
          {item.completed && <Check size={14}/>}
        </div>
        <div
          className="flex-1 flex items-center gap-2"
          onClick={handleClick}
        >
          <Code size={16} className="text-muted-foreground"/>
          <span className={item.completed ? 'line-through opacity-60' : ''}>{item.title}</span>
        </div>
        <div className="flex items-center gap-2">
          {item.hasUnderTarget && (
            <Zap size={14} className="text-yellow-400" aria-label="Under target time"/>
          )}
          {hasAttempts && (
            <span className="text-xs px-2 py-0.5 rounded bg-app/20 text-app">
              {item.attemptCount}x
            </span>
          )}
          {item.targetMinutes && (
            <span className="text-xs text-muted-foreground">
              {item.targetMinutes} min
            </span>
          )}
          {item.priority && (
            <span className={`text-xs px-2 py-0.5 rounded ${
              item.priority === 'high' ? 'bg-red-500/20 text-red-400' :
              item.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-blue-500/20 text-blue-400'
            }`}>
              {item.priority}
            </span>
          )}
          {item.category && (
            <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded">
              {item.category}
            </span>
          )}
          {hasAttempts && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              className="p-1 hover:bg-background rounded"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      </div>
      {expanded && hasAttempts && (
        <div className="ml-8 space-y-1">
          {(item.attempts ?? []).slice().reverse().map((attempt, idx) => {
            const passed = attempt.codeMatch && attempt.underTarget;
            return (
              <div
                key={idx}
                className="flex items-center gap-3 p-2 rounded text-sm bg-background"
              >
                <span className="text-muted-foreground">#{(item.attempts?.length ?? 0) - idx}</span>
                <span className="text-muted-foreground">
                  {formatDate(attempt.completedAt)}
                </span>
                <span className="text-muted-foreground">{attempt.actualMinutes}:00</span>
                <span className={`ml-auto flex items-center gap-1 ${passed ? 'text-green-400' : 'text-red-400'}`}>
                  {passed ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  {passed ? 'Passed' : 'Failed'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Props for {@link ProgressChecklist}. */
interface ProgressChecklistProps {
  courseSlug: string;
  checklist?: Checklist | null;
  stats?: ProgressStats | null;
  estimatedHours?: number;
  isEnrolled?: boolean;
}

export default function ProgressChecklist({ courseSlug, checklist, stats, isEnrolled }: ProgressChecklistProps) {
  const { guides = [], quizzes = [], reps = [] } = checklist || {};
  const voiceSpeed = getVoiceSpeed();

  // Build quiz map by guideSlug for correlating quizzes to guides
  const quizByGuideSlug: Record<string, QuizEntry> = {};
  quizzes.forEach(q => {
    if (q.guideSlug) quizByGuideSlug[q.guideSlug] = q;
  });

  // Calculate remaining time from incomplete items (adjusted for voice speed)
  const incompleteGuides = guides.filter(g => !g.completed);
  const guideMinutes = incompleteGuides.reduce((sum, g) => sum + calculateMinutes(g.wordCount || 0, voiceSpeed), 0);
  const incompleteQuizzes = quizzes.filter(q => !q.passed);
  const quizMinutes = incompleteQuizzes.length * 5;
  const incompleteReps = reps.filter(r => !r.completed);
  const repMinutes = incompleteReps.reduce((sum, r) => sum + (r.targetMinutes || 10), 0);
  const highReps = reps.filter(r => r.priority === 'high');
  const medReps = reps.filter(r => r.priority === 'medium');
  const lowReps = reps.filter(r => r.priority === 'low');
  const repHighMinutes = highReps.filter(r => !r.completed).reduce((sum, r) => sum + (r.targetMinutes || 10), 0);
  const repMediumMinutes = medReps.filter(r => !r.completed).reduce((sum, r) => sum + (r.targetMinutes || 10), 0);
  const repLowMinutes = lowReps.filter(r => !r.completed).reduce((sum, r) => sum + (r.targetMinutes || 10), 0);
  const remainingMinutes = guideMinutes + quizMinutes;

  return (
    <div className="space-y-6">
      {/* Progress Summary */}
      {stats && (
        <div className="bg-accent rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">Overall Progress</span>
            <span className="text-app font-bold">{stats.percentComplete}%</span>
          </div>
          <div className="w-full bg-background rounded-full h-3 mb-4">
            <div
              className="bg-app h-3 rounded-full transition-all duration-500"
              style={{ width: `${stats.percentComplete}%` }}
            />
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <div className="flex justify-between text-sm text-muted-foreground mb-1">
                <span className="flex items-center gap-1">
                  <BookOpen size={14} className="text-blue-400"/>
                  Guides
                </span>
                <span>{stats.totalGuides ? Math.round(((stats.completedGuides ?? 0) / stats.totalGuides) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-background rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${stats.totalGuides ? ((stats.completedGuides ?? 0) / stats.totalGuides) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm text-muted-foreground mb-1">
                <span className="flex items-center gap-1">
                  <HelpCircle size={14} className="text-green-400"/>
                  Quizzes
                </span>
                <span>{stats.totalQuizzes ? Math.round(((stats.completedQuizzes ?? 0) / stats.totalQuizzes) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-background rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${stats.totalQuizzes ? ((stats.completedQuizzes ?? 0) / stats.totalQuizzes) * 100 : 0}%` }}
                />
              </div>
            </div>
            {(() => {
              const highPriorityReps = reps.filter(r => r.priority === 'high');
              const completedHighPriority = highPriorityReps.filter(r => r.completed).length;
              const totalHighPriority = highPriorityReps.length;
              const percent = totalHighPriority ? Math.round((completedHighPriority / totalHighPriority) * 100) : 0;
              return (
                <div>
                  <div className="flex justify-between text-sm text-muted-foreground mb-1">
                    <span className="flex items-center gap-1">
                      <Code size={14} className="text-purple-400"/>
                      Reps
                    </span>
                    <span>{percent}%</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })()}
          </div>
          {remainingMinutes > 0 && (
            <div className="mt-3 text-sm text-muted-foreground text-center">
              {remainingMinutes >= 60
                ? `~${Math.floor(remainingMinutes / 60)}h ${remainingMinutes % 60}m remaining`
                : `~${remainingMinutes}m remaining`}
              <span className="block text-xs opacity-70 mt-1">
                guides: {guideMinutes}m + quizzes: {quizMinutes}m
              </span>
            </div>
          )}
        </div>
      )}

      {/* Guides Section */}
      {guides.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <BookOpen size={18}/>
            Guides
            <span className="text-sm text-muted-foreground font-normal">
              ({guides.filter(g => g.completed).length}/{guides.length})
            </span>
          </h3>
          <div className="space-y-2">
            {guides.map(item => (
              <ChecklistItem
                key={item._id}
                item={item}
                type="guide"
                courseSlug={courseSlug}
                completed={item.completed}
                quiz={quizByGuideSlug[item.slug]}
                voiceSpeed={voiceSpeed}
                isEnrolled={isEnrolled}
              />
            ))}
          </div>
        </div>
      )}

      {/* Reps Section */}
      {reps.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2 flex-wrap">
            <Code size={18}/>
            Reps
            <span className="text-sm text-muted-foreground font-normal">
              ({reps.filter(r => r.completed).length}/{reps.length})
            </span>
            <span className="text-xs text-muted-foreground font-normal">
              high: {highReps.filter(r => r.completed).length}/{highReps.length} {repHighMinutes}m, med: {medReps.filter(r => r.completed).length}/{medReps.length} {repMediumMinutes}m, low: {lowReps.filter(r => r.completed).length}/{lowReps.length} {repLowMinutes}m
            </span>
          </h3>
          <div className="space-y-2">
            {reps.map(item => (
              <RepItem key={item._id} item={item} courseSlug={courseSlug} isEnrolled={isEnrolled} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
