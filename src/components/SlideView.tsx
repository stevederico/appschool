import { useEffect, useRef, useCallback, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, Loader, Pause, Play, Settings, Volume2, X } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import BookmarkButton from './BookmarkButton';
import { BrowserTTS, XaiTTS, stripMarkdown, XAI_VOICES } from '../services/tts';

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.75, 2.0];
const WORDS_PER_MINUTE = 150;

/** A single slide parsed from guide markdown. */
export interface Slide {
  title: string;
  content: string;
  index: number;
}

/**
 * Estimate minutes remaining to speak the slides from the current index.
 *
 * @param slides - All slides
 * @param currentSlide - Current slide index
 * @param voiceSpeed - Voice speed multiplier
 * @returns Whole minutes remaining
 */
function calculateTimeRemaining(slides: Slide[], currentSlide: number, voiceSpeed: number): number {
  const remainingSlides = slides.slice(currentSlide);
  const totalWords = remainingSlides.reduce((sum, slide) => {
    const clean = stripMarkdown(slide.content);
    return sum + clean.split(/\s+/).filter(Boolean).length;
  }, 0);
  const minutes = totalWords / (WORDS_PER_MINUTE * voiceSpeed);
  return Math.ceil(minutes);
}

/** Props for {@link SlideView}. */
interface SlideViewProps {
  slides: Slide[];
  currentSlide: number;
  setCurrentSlide: Dispatch<SetStateAction<number>>;
  voiceEnabled: boolean;
  setVoiceEnabled: Dispatch<SetStateAction<boolean>>;
  autoAdvance: boolean;
  setAutoAdvance: Dispatch<SetStateAction<boolean>>;
  voiceSpeed: number;
  setVoiceSpeed: Dispatch<SetStateAction<number>>;
  ttsProvider: string;
  setTtsProvider: Dispatch<SetStateAction<string>>;
  xaiVoice: string;
  setXaiVoice: Dispatch<SetStateAction<string>>;
  skipCode: boolean;
  setSkipCode: Dispatch<SetStateAction<boolean>>;
  onExit: () => void;
  onTakeQuiz: () => void;
  guideTitle?: string;
  bookmarkedSections?: Set<string>;
  onToggleBookmark?: ((sectionTitle: string, sectionContent: string) => void) | null;
}

export default function SlideView({
  slides,
  currentSlide,
  setCurrentSlide,
  voiceEnabled,
  setVoiceEnabled,
  autoAdvance,
  setAutoAdvance,
  voiceSpeed,
  setVoiceSpeed,
  ttsProvider,
  setTtsProvider,
  xaiVoice,
  setXaiVoice,
  skipCode,
  setSkipCode,
  onExit,
  onTakeQuiz,
  bookmarkedSections = new Set(),
  onToggleBookmark = null
}: SlideViewProps) {
  const currentSlideTitle = slides[currentSlide]?.title || '';
  const isCurrentBookmarked = bookmarkedSections.has(currentSlideTitle);
  const browserTTSRef = useRef<BrowserTTS | null>(null);
  const xaiTTSRef = useRef<XaiTTS | null>(null);
  const currentSlideRef = useRef(currentSlide);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const voiceSpeedRef = useRef(voiceSpeed);
  const xaiVoiceRef = useRef(xaiVoice);
  const skipCodeRef = useRef(skipCode);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Keep ref in sync
  useEffect(() => {
    currentSlideRef.current = currentSlide;
  }, [currentSlide]);

  // Initialize TTS engines
  useEffect(() => {
    browserTTSRef.current = new BrowserTTS();
    xaiTTSRef.current = new XaiTTS();
    return () => {
      browserTTSRef.current?.stop();
      xaiTTSRef.current?.cleanup();
    };
  }, []);

  const getTTS = useCallback(() => {
    if (ttsProvider === 'xai') return xaiTTSRef.current;
    return browserTTSRef.current;
  }, [ttsProvider]);

  const speak = useCallback(async (text: string, _slideIndex: number, requestId: number, onEnd: () => void) => {
    const tts = getTTS();
    if (!tts) return;

    setTtsError(null);
    const ttsOptions = { skipCode };

    if (ttsProvider === 'xai') {
      const xaiTTS = xaiTTSRef.current;
      if (!xaiTTS) return;
      setIsLoading(true);
      try {
        await xaiTTS.speak(text, xaiVoice, voiceSpeed, onEnd, ttsOptions);
        if (requestIdRef.current !== requestId) {
          xaiTTS.stop();
          return;
        }
      } catch (err) {
        if (requestIdRef.current === requestId) {
          setTtsError(err instanceof Error ? err.message : 'Speech failed');
          setVoiceEnabled(false);
        }
      } finally {
        if (requestIdRef.current === requestId) {
          setIsLoading(false);
        }
      }
    } else {
      browserTTSRef.current?.speak(text, voiceSpeed, onEnd, ttsOptions);
    }
  }, [getTTS, ttsProvider, xaiVoice, voiceSpeed, skipCode, setVoiceEnabled]);

  const stop = useCallback(() => {
    browserTTSRef.current?.stop();
    xaiTTSRef.current?.stop();
    setIsPaused(false);
    setIsLoading(false);
  }, []);

  const togglePause = useCallback(() => {
    const tts = getTTS();
    if (!tts) return;

    if (isPaused) {
      tts.resume();
      setIsPaused(false);
    } else {
      tts.pause();
      setIsPaused(true);
    }
  }, [getTTS, isPaused]);

  const goNext = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  }, [currentSlide, slides.length, setCurrentSlide]);

  const goPrev = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  }, [currentSlide, setCurrentSlide]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'Escape') {
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev, onExit]);

  // Speak current slide when voice enabled or slide changes (with debounce)
  useEffect(() => {
    // Clear any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Increment request ID to invalidate any in-flight requests
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;

    // Stop current audio immediately on slide change
    stop();

    if (voiceEnabled && slides[currentSlide]) {
      const slideIndex = currentSlide;

      // Debounce: wait 400ms before requesting TTS
      debounceRef.current = setTimeout(() => {
        // Verify request is still current
        if (requestIdRef.current !== currentRequestId) return;

        speak(slides[slideIndex].content, slideIndex, currentRequestId, () => {
          // Verify request still current before auto-advancing
          if (requestIdRef.current === currentRequestId && autoAdvance && slideIndex < slides.length - 1) {
            setCurrentSlide(prev => prev + 1);
          }
        });
      }, 400);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      stop();
    };
  }, [currentSlide, voiceEnabled, autoAdvance, slides, speak, stop, setCurrentSlide, voiceSpeed]);

  // Keep settings refs in sync
  useEffect(() => {
    voiceSpeedRef.current = voiceSpeed;
    xaiVoiceRef.current = xaiVoice;
    skipCodeRef.current = skipCode;
  }, [voiceSpeed, xaiVoice, skipCode]);

  useEffect(() => {
    if (!voiceEnabled) {
      stop();
    }
  }, [voiceEnabled, stop]);

  const progress = ((currentSlide + 1) / slides.length) * 100;
  const timeRemaining = calculateTimeRemaining(slides, currentSlide, voiceSpeed);

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Top Bar - Progress */}
      <div className="flex flex-col px-4 pt-4 pb-2 border-b border-accent">
        <div className="flex items-center justify-between">
          <button
            onClick={onExit}
            className="p-2 hover:bg-accent rounded-lg transition-all cursor-pointer"
          >
            <X size={24}/>
          </button>

          <div className="flex items-center gap-2">
            {onToggleBookmark && (
              <BookmarkButton
                isBookmarked={isCurrentBookmarked}
                onToggle={() => onToggleBookmark(currentSlideTitle, slides[currentSlide]?.content || '')}
                size={20}
              />
            )}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-accent rounded-lg cursor-pointer transition-all"
            >
              <Settings size={20}/>
            </button>
          </div>

          <div className="flex-1 mx-8">
            <div className="w-full bg-accent rounded-full h-1.5">
              <div
                className="bg-app h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="text-center">
            <div className="text-muted-foreground font-mono text-sm">
              {currentSlide + 1} / {slides.length}
            </div>
            <div className="text-xs text-muted-foreground">
              {timeRemaining} min{timeRemaining !== 1 ? 's' : ''} remain
            </div>
          </div>
        </div>
      </div>


      {/* Slide Content */}
      <div className="flex-1 flex items-start justify-center p-8 overflow-auto">
        <div className="max-w-4xl w-full">
          <div className="prose prose-invert prose-lg max-w-none">
            <MarkdownRenderer content={slides[currentSlide]?.content || ''} showSpeaker={false} />
          </div>
        </div>
      </div>

      {/* TTS Error */}
      {ttsError && (
        <div className="mx-4 mb-2 p-3 bg-red-500/20 text-red-400 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle size={16}/>
          {ttsError}
          <button onClick={() => setTtsError(null)} className="ml-auto">
            <X size={14}/>
          </button>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowSettings(false)}>
          <div className="w-80 p-4 bg-accent rounded-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Voice Settings</span>
              <button onClick={() => setShowSettings(false)} className="cursor-pointer">
                <X size={16}/>
              </button>
            </div>

            <div className="space-y-3">
              {/* Provider Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Provider</span>
                <div className="flex bg-background rounded-lg p-1">
                  <button
                    onClick={() => setTtsProvider('browser')}
                    className={`px-2 py-1 text-xs rounded cursor-pointer transition-all ${
                      ttsProvider === 'browser' ? 'bg-accent' : ''
                    }`}
                  >
                    Browser
                  </button>
                  <button
                    onClick={() => setTtsProvider('xai')}
                    className={`px-2 py-1 text-xs rounded cursor-pointer transition-all ${
                      ttsProvider === 'xai' ? 'bg-accent' : ''
                    }`}
                  >
                    xAI
                  </button>
                </div>
              </div>

              {/* xAI Voice Selector */}
              {ttsProvider === 'xai' && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Voice</span>
                  <select
                    value={xaiVoice}
                    onChange={(e) => setXaiVoice(e.target.value)}
                    className="px-3 py-1 bg-background rounded-lg cursor-pointer text-sm"
                  >
                    {XAI_VOICES.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Auto Advance */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Auto-advance</span>
                <button
                  onClick={() => setAutoAdvance(!autoAdvance)}
                  className={`w-10 h-6 rounded-full cursor-pointer transition-all ${
                    autoAdvance ? 'bg-app' : 'bg-background'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-all mx-1 ${
                    autoAdvance ? 'translate-x-4' : ''
                  }`} />
                </button>
              </div>

              {/* Speed Control */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Speed</span>
                <select
                  value={voiceSpeed}
                  onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                  className="px-3 py-1 bg-background rounded-lg cursor-pointer text-sm"
                >
                  {SPEED_OPTIONS.map(speed => (
                    <option key={speed} value={speed}>{speed}x</option>
                  ))}
                </select>
              </div>

              {/* Skip Code */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Skip code</span>
                <button
                  onClick={() => setSkipCode(!skipCode)}
                  className={`w-10 h-6 rounded-full cursor-pointer transition-all ${
                    skipCode ? 'bg-app' : 'bg-background'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-all mx-1 ${
                    skipCode ? 'translate-x-4' : ''
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation - Controls */}
      <div className="flex items-center justify-between p-4 border-t border-accent">
        <button
          onClick={goPrev}
          disabled={currentSlide === 0}
          className="px-6 py-3 bg-accent rounded-lg disabled:opacity-30 cursor-pointer hover:bg-accent/80 transition-all flex items-center gap-2"
        >
          <ArrowLeft size={20}/>
        </button>

        <div className="flex items-center gap-2">
            {/* Voice Toggle / Pause-Play */}
            <button
              onClick={() => {
                if (!voiceEnabled) {
                  setVoiceEnabled(true);
                } else {
                  togglePause();
                }
              }}
              onDoubleClick={() => voiceEnabled && setVoiceEnabled(false)}
              disabled={isLoading}
              className={`p-3 rounded-full flex items-center gap-2 cursor-pointer transition-all bg-accent hover:bg-accent/80 ${isLoading ? 'opacity-50' : ''}`}
            >
              {isLoading ? (
                <Loader size={20} className="animate-spin"/>
              ) : !voiceEnabled ? (
                <Volume2 size={20}/>
              ) : isPaused ? (
                <Play size={20}/>
              ) : (
                <Pause size={20}/>
              )}
            </button>
        </div>

        {currentSlide === slides.length - 1 ? (
          <button
            onClick={onTakeQuiz}
            className="px-6 py-3 bg-app text-white rounded-lg cursor-pointer hover:opacity-90 transition-all flex items-center gap-2"
          >
            Take Quiz
            <ArrowRight size={20}/>
          </button>
        ) : (
          <button
            onClick={goNext}
            className="px-6 py-3 bg-accent rounded-lg cursor-pointer hover:bg-accent/80 transition-all flex items-center gap-2"
          >
            <ArrowRight size={20}/>
          </button>
        )}
      </div>
    </div>
  );
}
