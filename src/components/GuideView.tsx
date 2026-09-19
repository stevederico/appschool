import { Check, CheckCircle, Clock, HelpCircle, Play } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { getBackendURL, getCSRFToken } from '@stevederico/skateboard-ui/Utilities';
import MarkdownRenderer from './MarkdownRenderer';
import SlideView from './SlideView';
import type { Slide } from './SlideView';

const WORDS_PER_MINUTE = 150;

/** A guide fetched from the backend. */
interface Guide {
  title: string;
  content?: string;
  wordCount?: number;
  category?: string;
}

/** Minimal course shape used for the guide header. */
interface GuideCourse {
  title: string;
}

/**
 * Split markdown content into slides on `#` and `##` headers.
 *
 * @param markdownContent - Guide markdown content
 * @returns Ordered list of slides
 */
function parseSlides(markdownContent: string | undefined): Slide[] {
  if (!markdownContent) return [];
  // Split on both # and ## headers
  const sections = markdownContent.split(/(?=^#{1,2} )/gm);
  return sections.map((section, index): Slide | null => {
    const trimmed = section.trim();
    if (!trimmed) return null;
    const titleMatch = trimmed.match(/^#{1,2} (.+)$/m);
    const title = titleMatch ? titleMatch[1] : `Slide ${index + 1}`;
    return { title, content: trimmed, index };
  }).filter((slide): slide is Slide => slide !== null);
}

export default function GuideView() {
  const { slug, guideSlug } = useParams();
  const navigate = useNavigate();
  const [guide, setGuide] = useState<Guide | null>(null);
  const [course, setCourse] = useState<GuideCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [viewMode, setViewMode] = useState<'slide' | 'reading'>('slide');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(() => localStorage.getItem('voiceEnabled') === 'true');
  const [autoAdvance, setAutoAdvance] = useState(() => localStorage.getItem('autoAdvance') === 'true');
  const [voiceSpeed, setVoiceSpeed] = useState(() => parseFloat(localStorage.getItem('voiceSpeed') || '') || 1.0);
  const [ttsProvider, setTtsProvider] = useState(() => localStorage.getItem('ttsProvider') || 'browser');
  const [xaiVoice, setXaiVoice] = useState(() => localStorage.getItem('xaiVoice') || 'eve');
  const [skipCode, setSkipCode] = useState(() => localStorage.getItem('skipCode') === 'true');
  const [bookmarkedSections, setBookmarkedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchGuide = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${getBackendURL()}/courses/${slug}/guides/${guideSlug}`, {
          credentials: 'include'
        });

        if (!response.ok) throw new Error('Guide not found');

        const data = await response.json();
        setGuide(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Guide not found');
      } finally {
        setLoading(false);
      }
    };

    fetchGuide();
  }, [slug, guideSlug]);

  useEffect(() => {
    if (guide?.content) {
      const parsed = parseSlides(guide.content);
      setSlides(parsed);

      const savedSlide = localStorage.getItem(`slide-${slug}-${guideSlug}`);
      if (savedSlide !== null) {
        const idx = parseInt(savedSlide, 10);
        if (idx >= 0 && idx < parsed.length) {
          setCurrentSlide(idx);
        }
      }
    }
  }, [guide?.content, slug, guideSlug]);

  useEffect(() => {
    if (slides.length > 0) {
      localStorage.setItem(`slide-${slug}-${guideSlug}`, currentSlide.toString());
    }
  }, [currentSlide, slides.length, slug, guideSlug]);

  // Persist TTS settings
  useEffect(() => {
    localStorage.setItem('ttsProvider', ttsProvider);
  }, [ttsProvider]);

  useEffect(() => {
    localStorage.setItem('xaiVoice', xaiVoice);
  }, [xaiVoice]);

  useEffect(() => {
    localStorage.setItem('voiceSpeed', voiceSpeed.toString());
  }, [voiceSpeed]);

  useEffect(() => {
    localStorage.setItem('voiceEnabled', voiceEnabled.toString());
  }, [voiceEnabled]);

  useEffect(() => {
    localStorage.setItem('autoAdvance', autoAdvance.toString());
  }, [autoAdvance]);

  useEffect(() => {
    localStorage.setItem('skipCode', skipCode.toString());
  }, [skipCode]);

  // Fetch course for title
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await fetch(`${getBackendURL()}/courses/${slug}`, { credentials: 'include' });
        if (res.ok) setCourse(await res.json());
      } catch (err) {
        console.error('Failed to fetch course:', err);
      }
    };
    fetchCourse();
  }, [slug]);

  // Fetch bookmarks when guide loads
  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const response = await fetch(
          `${getBackendURL()}/courses/${slug}/guides/${guideSlug}/bookmarks`,
          { credentials: 'include' }
        );
        if (response.ok) {
          const data = await response.json();
          setBookmarkedSections(new Set(data.bookmarkedSections));
        }
      } catch (err) {
        console.error('Failed to fetch bookmarks:', err);
      }
    };

    if (guide) fetchBookmarks();
  }, [slug, guideSlug, guide]);

  const handleToggleBookmark = async (sectionTitle: string, sectionContent: string) => {
    const isCurrentlyBookmarked = bookmarkedSections.has(sectionTitle);
    const url = `${getBackendURL()}/courses/${slug}/guides/${guideSlug}/bookmarks`;

    try {
      if (isCurrentlyBookmarked) {
        await fetch(url, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': getCSRFToken() ?? ''
          },
          body: JSON.stringify({ sectionTitle })
        });
        setBookmarkedSections(prev => {
          const next = new Set(prev);
          next.delete(sectionTitle);
          return next;
        });
      } else {
        await fetch(url, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': getCSRFToken() ?? ''
          },
          body: JSON.stringify({
            sectionTitle,
            sectionContent,
            guideTitle: guide?.title || '',
            courseTitle: course?.title || ''
          })
        });
        setBookmarkedSections(prev => new Set([...prev, sectionTitle]));
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  const handleComplete = async () => {
    try {
      setCompleting(true);
      const response = await fetch(`${getBackendURL()}/courses/${slug}/guides/${guideSlug}/complete`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getCSRFToken() ?? ''
        }
      });

      if (!response.ok) throw new Error('Failed to mark complete');

      setIsCompleted(true);
    } catch (err) {
      console.error('Complete error:', err);
    } finally {
      setCompleting(false);
    }
  };

  const handleTakeQuiz = () => {
    navigate(`/app/courses/${slug}/quizzes/${guideSlug}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading guide...</div>
      </div>
    );
  }

  if (error || !guide) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">{error || 'Guide not found'}</div>
      </div>
    );
  }

  if (viewMode === 'slide' && slides.length > 0) {
    return (
      <>
        <SlideView
          slides={slides}
          currentSlide={currentSlide}
          setCurrentSlide={setCurrentSlide}
          voiceEnabled={voiceEnabled}
          setVoiceEnabled={setVoiceEnabled}
          autoAdvance={autoAdvance}
          setAutoAdvance={setAutoAdvance}
          voiceSpeed={voiceSpeed}
          setVoiceSpeed={setVoiceSpeed}
          ttsProvider={ttsProvider}
          setTtsProvider={setTtsProvider}
          xaiVoice={xaiVoice}
          setXaiVoice={setXaiVoice}
          skipCode={skipCode}
          setSkipCode={setSkipCode}
          onExit={() => setViewMode('reading')}
          onTakeQuiz={async () => {
            await handleComplete();
            navigate(`/app/courses/${slug}/quizzes/${guideSlug}`);
          }}
          guideTitle={guide.title}
          bookmarkedSections={bookmarkedSections}
          onToggleBookmark={handleToggleBookmark}
        />
      </>
    );
  }

  return (
    <>
      <div className="p-6 max-w-4xl mx-auto" data-section-id="guide-view">
        {/* Guide Meta */}
        <div className="flex items-center justify-between mb-6" data-section-id="guide-meta">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {guide.wordCount != null && guide.wordCount > 0 && (
              <span className="flex items-center gap-1">
                <Clock size={16}/>
                ~{Math.ceil(guide.wordCount / (WORDS_PER_MINUTE * voiceSpeed))} min read
              </span>
            )}
            {guide.category && (
              <span className="bg-accent px-2 py-1 rounded">{guide.category}</span>
            )}
          </div>
          {slides.length > 0 && (
            <button
              onClick={() => setViewMode('slide')}
              className="px-4 py-2 bg-accent hover:bg-accent/80 rounded-lg flex items-center gap-2 cursor-pointer transition-all text-sm"
              data-umami-event="guide-slide-mode-clicked"
            >
              <Play size={16}/>
              Slide Mode
            </button>
          )}
        </div>

        {/* Guide Content */}
        <div className="prose prose-invert max-w-none" data-section-id="guide-content">
          <MarkdownRenderer
            content={guide.content}
            xaiVoice={xaiVoice}
            ttsProvider={ttsProvider}
            bookmarkedSections={bookmarkedSections}
            onToggleBookmark={handleToggleBookmark}
          />
        </div>

        {/* Actions */}
        <div className="mt-12 pt-6 border-t border-accent flex items-center justify-between" data-section-id="guide-actions">
          <button
            onClick={handleComplete}
            disabled={completing || isCompleted}
            data-umami-event="guide-mark-complete-clicked"
            className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all cursor-pointer ${
              isCompleted
                ? 'bg-green-500/20 text-green-400'
                : 'bg-accent hover:bg-accent/80'
            }`}
          >
            {isCompleted ? (
              <>
                <CheckCircle size={20}/>
                Completed
              </>
            ) : completing ? (
              'Marking...'
            ) : (
              <>
                <Check size={20}/>
                Mark Complete
              </>
            )}
          </button>

          <button
            onClick={handleTakeQuiz}
            className="px-6 py-3 bg-app text-white rounded-lg font-medium hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer"
            data-umami-event="guide-take-quiz-clicked"
          >
            <HelpCircle size={20}/>
            Take Quiz
          </button>
        </div>
      </div>
    </>
  );
}
