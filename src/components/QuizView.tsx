import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { getBackendURL, getCSRFToken } from '@stevederico/skateboard-ui/Utilities';
import { CheckCircle, XCircle } from 'lucide-react';

/** An answer option: either a plain string or an object with id/text. */
type QuizOption = string | { id?: string; text?: string };

/** A quiz question. */
interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
}

/** A quiz fetched from the backend. */
interface Quiz {
  questions?: QuizQuestion[];
  passingScore?: number;
}

/** Per-question result returned after submitting a quiz. */
interface QuestionResult {
  questionId: string;
  correct: boolean;
  userAnswer?: string;
  correctAnswer?: string;
  explanation?: string;
}

/** The overall result of a quiz submission. */
interface QuizResult {
  passed: boolean;
  score: number;
  correctCount: number;
  totalQuestions: number;
  results?: QuestionResult[];
}

export default function QuizView() {
  const { slug, guideSlug } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${getBackendURL()}/courses/${slug}/quizzes/${guideSlug}`, {
          credentials: 'include'
        });

        if (!response.ok) throw new Error('Quiz not found');

        const data = await response.json();
        setQuiz(data);
        startTime.current = Date.now();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Quiz not found');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [slug, guideSlug]);

  const handleAnswer = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const timeSpentSeconds = Math.round((Date.now() - startTime.current) / 1000);

      const response = await fetch(`${getBackendURL()}/courses/${slug}/quizzes/${guideSlug}/submit`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getCSRFToken() ?? ''
        },
        body: JSON.stringify({
          answers: Object.entries(answers).map(([questionId, optionId]) => ({
            questionId,
            answer: optionId
          })),
          timeSpentSeconds
        })
      });

      if (!response.ok) throw new Error('Failed to submit quiz');

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setResult(null);
    startTime.current = Date.now();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading quiz...</div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">{error || 'Quiz not found'}</div>
      </div>
    );
  }

  // Show results
  if (result) {
    return (
      <div className="p-6 max-w-2xl mx-auto" data-section-id="quiz-results">
          <div className={`text-center p-8 rounded-xl mb-6 ${result.passed ? 'bg-green-500/20' : 'bg-red-500/20'}`} data-section-id="quiz-score">
            {result.passed ? (
              <CheckCircle size={64} className="mx-auto mb-4 text-green-400" />
            ) : (
              <XCircle size={64} className="mx-auto mb-4 text-red-400" />
            )}
            <h2 className="text-3xl font-bold mb-2">
              {result.passed ? 'Passed!' : 'Not Quite'}
            </h2>
            <p className="text-xl mb-4">
              Score: {result.score}% ({result.correctCount}/{result.totalQuestions})
            </p>
            <p className="text-muted-foreground">
              Passing score: {quiz.passingScore}%
            </p>
          </div>

          {/* Review Answers */}
          <div className="space-y-6">
            <h3 className="font-semibold text-lg">Review Answers</h3>
            {(result.results || []).map((qr, idx) => (
              <div
                key={qr.questionId}
                className={`p-4 rounded-lg ${qr.correct ? 'bg-green-500/10' : 'bg-red-500/10'}`}
              >
                <div className="flex items-start gap-2 mb-3">
                  <span className={`font-bold ${qr.correct ? 'text-green-400' : 'text-red-400'}`}>
                    Q{idx + 1}.
                  </span>
                  <span>{quiz.questions?.[idx]?.question}</span>
                </div>
                <div className="ml-6 space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Your answer: </span>
                    <span className={qr.correct ? 'text-green-400' : 'text-red-400'}>
                      {qr.userAnswer || 'Not answered'}
                    </span>
                  </p>
                  {!qr.correct && (
                    <p>
                      <span className="text-muted-foreground">Correct answer: </span>
                      <span className="text-green-400">
                        {qr.correctAnswer}
                      </span>
                    </p>
                  )}
                  {qr.explanation && (
                    <p className="text-muted-foreground mt-2 italic">{qr.explanation}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-8 flex gap-4">
            {!result.passed && (
              <button
                onClick={handleRetry}
                className="flex-1 py-3 bg-accent rounded-lg font-medium hover:bg-accent/80 transition-all cursor-pointer"
                data-umami-event="quiz-retry-clicked"
              >
                Try Again
              </button>
            )}
            <button
              onClick={() => navigate(`/app/courses/${slug}`)}
              className="flex-1 py-3 bg-app text-white rounded-lg font-medium hover:opacity-90 transition-all cursor-pointer"
              data-umami-event="quiz-back-to-course-clicked"
            >
              Back to Course
            </button>
          </div>
        </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = quiz.questions?.length || 0;

  return (
    <div className="p-6 max-w-2xl mx-auto" data-section-id="quiz-view">
        {/* Questions */}
        <div className="space-y-8" data-section-id="quiz-questions">
          {quiz.questions?.map((q, idx) => (
            <div key={q.id} className="bg-accent rounded-xl p-6">
              <h3 className="font-semibold mb-4">
                <span className="text-app mr-2">Q{idx + 1}.</span>
                {q.question}
              </h3>
              <div className="space-y-3">
                {[...q.options].sort((a, b) => {
                  const idA = typeof a === 'string' ? a : (a.id || '');
                  const idB = typeof b === 'string' ? b : (b.id || '');
                  return idA.localeCompare(idB);
                }).map((option, optIdx) => {
                  const isStringOption = typeof option === 'string';
                  const optionId = isStringOption ? String.fromCharCode(97 + optIdx) : (option.id || String.fromCharCode(97 + optIdx));
                  const optionText = isStringOption ? option : option.text;
                  const optionValue = isStringOption ? option : optionId;
                  return (
                  <button
                    key={optIdx}
                    onClick={() => handleAnswer(q.id, optionValue)}
                    data-umami-event="quiz-answer-selected"
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      answers[q.id] === optionValue
                        ? 'border-app bg-app/10'
                        : 'border-transparent bg-background hover:border-accent'
                    }`}
                  >
                    <span className="font-medium mr-2">{optionId.toUpperCase()}.</span>
                    {optionText}
                  </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || answeredCount < totalQuestions}
          data-umami-event="quiz-submit-clicked"
          className={`w-full mt-8 py-4 rounded-lg font-medium transition-all ${
            answeredCount < totalQuestions
              ? 'bg-accent text-muted-foreground cursor-not-allowed'
              : 'bg-app text-white hover:opacity-90 cursor-pointer'
          }`}
        >
          {submitting ? 'Submitting...' : `Submit Quiz (${answeredCount}/${totalQuestions})`}
        </button>
    </div>
  );
}
