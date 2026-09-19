import Header from '@stevederico/skateboard-ui/Header';
import { AlertCircle, Check, CheckCircle, ChevronDown, ChevronRight, Clock, Eye, EyeOff, History, Pause, Play, RotateCcw, Trophy, X, XCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { getBackendURL, getCSRFToken } from '@stevederico/skateboard-ui/Utilities';
import CodeEditor from './CodeEditor';

/** A coding rep (exercise) fetched from the backend. */
interface Rep {
  title: string;
  slug?: string;
  prompt: string;
  starterCode?: string;
  category?: string;
  priority?: string;
  targetMinutes: number;
  hints?: string[];
}

/** The reference solution for a rep. */
interface Solution {
  solution: string;
  keyPoints?: string[];
}

/** A recorded attempt at a rep. */
interface Attempt {
  actualMinutes: number;
  completedAt: string;
  underTarget?: boolean;
  codeMatch?: boolean;
}

/** A single line entry in the code diff view. */
interface DiffLine {
  type: 'same' | 'missing' | 'extra' | 'different';
  line?: string;
  userLine?: string;
  solutionLine?: string;
  lineNum: number;
}

/** Normalize code by removing #Preview blocks and comment headers (for display). */
const normalizeCode = (code: string | undefined): string => {
  if (!code) return '';
  return code
    .replace(/#Preview\s*\{[\s\S]*?\n\}/g, '')  // Remove #Preview { } blocks
    .replace(/^\/\/.*\n/gm, '')                  // Remove // comment lines
    .replace(/^\/\*[\s\S]*?\*\/\n?/gm, '')       // Remove /* */ block comments
    .trim()
    .replace(/\r\n/g, '\n');
};

/** Normalize code for comparison (removes ALL whitespace). */
const normalizeForComparison = (code: string | undefined): string => {
  if (!code) return '';
  return code
    .replace(/#Preview\s*\{[\s\S]*?\n\}/g, '')  // Remove #Preview blocks
    .replace(/\/\/.*$/gm, '')                    // Remove // comment lines
    .replace(/\/\*[\s\S]*?\*\//g, '')            // Remove /* */ comments
    .replace(/\s+/g, '');                        // Remove ALL whitespace
};

/** Format an ISO date string as a short, human-readable date/time. */
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

export default function RepView() {
  const { slug, repSlug } = useParams();
  const navigate = useNavigate();
  const [rep, setRep] = useState<Rep | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [showSolution, setShowSolution] = useState(true);
  const [solution, setSolution] = useState<Solution | null>(null);
  const [loadingSolution, setLoadingSolution] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [codeMatch, setCodeMatch] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchRep = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${getBackendURL()}/courses/${slug}/reps/${repSlug}`, {
          credentials: 'include'
        });

        if (!response.ok) throw new Error('Rep not found');

        const data = await response.json();
        setRep(data);
        setCode(normalizeCode(data.starterCode || ''));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Rep not found');
      } finally {
        setLoading(false);
      }
    };

    const fetchSolution = async () => {
      try {
        setLoadingSolution(true);
        const response = await fetch(`${getBackendURL()}/courses/${slug}/reps/${repSlug}/solution`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setSolution(data);
        }
      } catch (err) {
        console.error('Solution error:', err);
      } finally {
        setLoadingSolution(false);
      }
    };

    const fetchAttempts = async () => {
      try {
        const response = await fetch(`${getBackendURL()}/progress/${slug}`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          const reps: Array<{ slug?: string; attempts?: Attempt[] }> =
            Array.isArray(data.checklist?.reps) ? data.checklist.reps : [];
          const repAttempts = reps.find((r) => r.slug === repSlug)?.attempts || [];
          setAttempts(repAttempts);
        }
      } catch (err) {
        console.error('Attempts fetch error:', err);
      }
    };

    fetchRep();
    fetchSolution();
    fetchAttempts();
  }, [slug, repSlug]);

  // Timer effect
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning]);

  const startTimer = () => {
    setTimerRunning(true);
    setShowSolution(false);
  };
  const stopTimer = () => setTimerRunning(false);
  const resetTimer = () => {
    setTimerRunning(false);
    setElapsedSeconds(0);
    setShowResults(false);
    setCodeMatch(false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const computeDiff = (userCode: string, solutionCode: string): DiffLine[] => {
    const userLines = (userCode || '').split('\n');
    const solutionLines = (solutionCode || '').split('\n');
    const diff: DiffLine[] = [];
    const maxLen = Math.max(userLines.length, solutionLines.length);

    for (let i = 0; i < maxLen; i++) {
      const userLine = userLines[i] ?? '';
      const solutionLine = solutionLines[i] ?? '';

      if (userLine === solutionLine) {
        diff.push({ type: 'same', line: userLine, lineNum: i + 1 });
      } else if (i >= userLines.length) {
        diff.push({ type: 'missing', line: solutionLine, lineNum: i + 1 });
      } else if (i >= solutionLines.length) {
        diff.push({ type: 'extra', line: userLine, lineNum: i + 1 });
      } else {
        diff.push({ type: 'different', userLine, solutionLine, lineNum: i + 1 });
      }
    }
    return diff;
  };

  const handleStopAndCompare = async () => {
    setTimerRunning(false);

    if (solution) {
      // Use normalized comparison (ignores whitespace differences)
      const normalizedUser = normalizeForComparison(code);
      const normalizedSolution = normalizeForComparison(solution.solution);
      const isMatch = normalizedUser === normalizedSolution;

      setCodeMatch(isMatch);

      // Always record the attempt
      await handleComplete(isMatch);
    }

    setShowResults(true);
  };

  const handleShowSolution = async () => {
    if (solution) {
      setShowSolution(!showSolution);
      return;
    }

    try {
      const response = await fetch(`${getBackendURL()}/courses/${slug}/reps/${repSlug}/solution`, {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to fetch solution');

      const data = await response.json();
      setSolution(data);
      setShowSolution(true);
    } catch (err) {
      console.error('Solution error:', err);
    }
  };

  const handleComplete = async (isCodeMatch = false) => {
    if (!rep) return;
    try {
      setCompleting(true);
      stopTimer();
      const actualMinutes = Math.round(elapsedSeconds / 60);
      const underTarget = elapsedSeconds <= (rep.targetMinutes * 60);

      const response = await fetch(`${getBackendURL()}/courses/${slug}/reps/${repSlug}/complete`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getCSRFToken() ?? ''
        },
        body: JSON.stringify({ actualMinutes, codeMatch: isCodeMatch })
      });

      if (!response.ok) throw new Error('Failed to mark complete');

      // Add the new attempt to local state immediately
      setAttempts(prev => [...prev, {
        actualMinutes,
        completedAt: new Date().toISOString(),
        underTarget,
        codeMatch: isCodeMatch
      }]);

      // Mark as completed if both conditions pass
      if (isCodeMatch && underTarget) {
        setIsCompleted(true);
      }
    } catch (err) {
      console.error('Complete error:', err);
    } finally {
      setCompleting(false);
    }
  };

  const getLanguage = () => {
    if (rep?.category === 'swiftui' || rep?.category === 'uikit') return 'swift';
    if (rep?.slug?.includes('swift')) return 'swift';
    return 'javascript';
  };

  if (loading) {
    return (
      <>
        <Header title="Rep" backPath={`/app/courses/${slug}`} />
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading rep...</div>
        </div>
      </>
    );
  }

  if (error || !rep) {
    return (
      <>
        <Header title="Rep" backPath={`/app/courses/${slug}`} />
        <div className="flex items-center justify-center h-64">
          <div className="text-red-400">{error || 'Rep not found'}</div>
        </div>
      </>
    );
  }

  const priorityColors: Record<string, string> = {
    high: 'bg-red-500/20 text-red-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    low: 'bg-green-500/20 text-green-400'
  };

  return (
    <>
      <Header title={rep.title} backPath={`/app/courses/${slug}`} />
      <div className="p-6" data-section-id="rep-view">
        {/* Timer Bar */}
        <div className="bg-accent rounded-xl p-4 mb-6 flex items-center justify-between" data-section-id="rep-timer">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className={`text-3xl font-mono font-bold ${timerRunning ? 'text-green-400' : ''}`}>
                {formatTime(elapsedSeconds)}
              </div>
              <div className="text-xs text-muted-foreground">elapsed</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-mono font-bold ${
                elapsedSeconds >= rep.targetMinutes * 60 ? 'text-red-400' : 'text-muted-foreground'
              }`}>
                {formatTime(Math.max(0, rep.targetMinutes * 60 - elapsedSeconds))}
              </div>
              <div className="text-xs text-muted-foreground">remaining</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full ${(rep.priority && priorityColors[rep.priority]) || priorityColors.medium}`}>
                {rep.priority}
              </span>
              {rep.category && (
                <span className="text-xs bg-background px-2 py-1 rounded">{rep.category}</span>
              )}
              {isCompleted && (
                <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                  complete
                </span>
              )}
            </div>
            <button
              onClick={resetTimer}
              className="p-2 hover:bg-background rounded-lg transition-all cursor-pointer"
              data-umami-event="rep-reset-timer-clicked"
            >
              <RotateCcw size={16}/>
            </button>
            {!timerRunning ? (
              <button
                onClick={startTimer}
                disabled={isCompleted}
                className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                data-umami-event="rep-start-clicked"
              >
                <Play size={16}/>
                Start
              </button>
            ) : (
              <>
                <button
                  onClick={stopTimer}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-all cursor-pointer flex items-center gap-2"
                  data-umami-event="rep-pause-clicked"
                >
                  <Pause size={16}/>
                  Pause
                </button>
                <button
                  onClick={handleStopAndCompare}
                  className="px-4 py-2 bg-app text-white rounded-lg font-medium hover:opacity-90 transition-all cursor-pointer flex items-center gap-2"
                  data-umami-event="rep-check-work-clicked"
                >
                  <Check size={16}/>
                  Check Work
                </button>
              </>
            )}
          </div>
        </div>

        {/* Prompt */}
        <div className="mb-6">
          <p className="text-2xl font-medium leading-relaxed">{rep.prompt}</p>
        </div>

        {/* Hints */}
        {rep.hints && rep.hints.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => setShowHints(!showHints)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              data-umami-event="rep-hints-toggled"
            >
              {showHints ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              {showHints ? 'Hide Hints' : 'Show Hints'}
            </button>
            {showHints && (
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground ml-6">
                {rep.hints.map((hint, idx) => (
                  <li key={idx} className="list-disc">{hint}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Solution Toggle */}
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setShowSolution(!showSolution)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all cursor-pointer text-sm"
            data-umami-event="rep-solution-toggled"
          >
            {showSolution ? <EyeOff size={16} /> : <Eye size={16} />}
            {showSolution ? 'Hide Solution' : 'Show Solution'}
          </button>
        </div>

        {/* Side-by-side Editors */}
        <div className={`grid gap-4 mb-6 ${showSolution && solution ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`} data-section-id="rep-editors">
          {/* Code Editor */}
          <div>
            <CodeEditor
              value={code}
              onChange={(value) => setCode(value ?? '')}
              language={getLanguage()}
              height="400px"
            />
          </div>

          {/* Solution */}
          {showSolution && solution && (
            <div>
              <CodeEditor
                value={normalizeCode(solution.solution)}
                language={getLanguage()}
                height="400px"
                readOnly
              />
            </div>
          )}
        </div>

        {/* Key Points */}
        {showSolution && solution?.keyPoints && solution.keyPoints.length > 0 && (
          <div className="mb-6 bg-accent rounded-lg p-4">
            <h4 className="font-medium mb-2">Key Points</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {solution.keyPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Check size={14} className="text-green-400 mt-1"/>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Results Panel */}
        {showResults && solution && (
          <div className="mb-6 bg-accent rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Results</h3>
              <button
                onClick={() => setShowResults(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={20}/>
              </button>
            </div>

            {/* Status Summary */}
            {codeMatch && elapsedSeconds <= rep.targetMinutes * 60 && (
              <div className="mb-6 p-4 bg-green-500/20 rounded-lg flex items-center gap-3">
                <Trophy size={24} className="text-green-400"/>
                <div>
                  <div className="font-bold text-green-400">Perfect Rep!</div>
                  <div className="text-sm text-muted-foreground">Code matches and under target time - auto-completed</div>
                </div>
              </div>
            )}

            {/* Time Comparison */}
            <div className="flex items-center gap-4 mb-6 flex-wrap">
              <div className={`text-2xl font-mono font-bold ${
                elapsedSeconds <= rep.targetMinutes * 60 ? 'text-green-400' : 'text-muted-foreground'
              }`}>
                {formatTime(elapsedSeconds)}
              </div>
              <span className="text-muted-foreground">vs</span>
              <div className="text-lg font-mono text-muted-foreground">
                Target: {rep.targetMinutes}:00
              </div>
              {elapsedSeconds <= rep.targetMinutes * 60 ? (
                <span className="text-green-400 flex items-center gap-1 bg-green-500/20 px-3 py-1 rounded-full">
                  <CheckCircle size={16}/>
                  On time!
                </span>
              ) : (
                <span className="text-yellow-400 flex items-center gap-1 bg-yellow-500/20 px-3 py-1 rounded-full">
                  <Clock size={16}/>
                  +{formatTime(elapsedSeconds - rep.targetMinutes * 60)} over
                </span>
              )}
            </div>

            {/* Code Match Status */}
            <div className="flex items-center gap-2 mb-4">
              <h4 className="font-medium">Code Comparison</h4>
              {codeMatch ? (
                <span className="text-green-400 flex items-center gap-1 bg-green-500/20 px-3 py-1 rounded-full text-sm">
                  <CheckCircle size={14}/>
                  Match
                </span>
              ) : (
                <span className="text-yellow-400 flex items-center gap-1 bg-yellow-500/20 px-3 py-1 rounded-full text-sm">
                  <AlertCircle size={14}/>
                  Differences found
                </span>
              )}
            </div>

            {/* Code Diff - only show if not matching */}
            {!codeMatch && (
              <>
                <div className="bg-background rounded-lg p-4 font-mono text-sm overflow-x-auto max-h-96 overflow-y-auto">
                  {computeDiff(normalizeCode(code), normalizeCode(solution.solution)).map((line, idx) => (
                    <div
                      key={idx}
                      className={`flex py-0.5 ${
                        line.type === 'same' ? 'text-muted-foreground' :
                        line.type === 'missing' ? 'bg-red-500/10' :
                        line.type === 'extra' ? 'bg-yellow-500/10' :
                        'bg-blue-500/10'
                      }`}
                    >
                      <span className="w-8 text-right pr-3 opacity-50 select-none">{line.lineNum}</span>
                      {line.type === 'different' ? (
                        <div className="flex-1">
                          <div className="text-red-400">- {line.solutionLine || '(empty)'}</div>
                          <div className="text-green-400">+ {line.userLine || '(empty)'}</div>
                        </div>
                      ) : line.type === 'missing' ? (
                        <span className="text-red-400">- {line.line}</span>
                      ) : line.type === 'extra' ? (
                        <span className="text-yellow-400">+ {line.line}</span>
                      ) : (
                        <span className="flex-1">{line.line || ' '}</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500/20 rounded"></span> Missing from your code</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-500/20 rounded"></span> Extra in your code</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500/20 rounded"></span> Different</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Previous Attempts */}
        {attempts.length > 0 && (
          <div className="mb-6 bg-accent rounded-xl p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <History size={16}/>
              Previous Attempts ({attempts.length})
            </h4>
            <div className="space-y-2">
              {attempts.slice().reverse().map((attempt, idx) => {
                const passed = attempt.codeMatch && attempt.underTarget;
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-2 rounded text-sm bg-background"
                  >
                    <span className="text-muted-foreground">#{attempts.length - idx}</span>
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
          </div>
        )}

      </div>
    </>
  );
}
