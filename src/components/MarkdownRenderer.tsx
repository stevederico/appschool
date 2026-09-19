import { useState, useMemo, useEffect, useRef } from 'react';
import type { ReactNode, MouseEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { XaiTTS } from '../services/tts';
import BookmarkButton from './BookmarkButton';

/**
 * Split markdown into a map of `## ` section title -> section markdown.
 *
 * @param content - Markdown content
 * @returns Map of section title to its markdown block
 */
function parseSections(content: string | undefined): Record<string, string> {
  if (!content) return {};
  const sections = content.split(/(?=^## )/gm);
  const map: Record<string, string> = {};
  sections.forEach(section => {
    const match = section.match(/^## (.+)$/m);
    if (match) map[match[1].trim()] = section;
  });
  return map;
}

/** Props for {@link SpeakerButton}. */
interface SpeakerButtonProps {
  /** Text (markdown) to read aloud. */
  text: string;
  /** xAI voice id. */
  voice: string;
}

function SpeakerButton({ text, voice }: SpeakerButtonProps) {
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const ttsRef = useRef<XaiTTS | null>(null);

  useEffect(() => {
    ttsRef.current = new XaiTTS();
    return () => {
      ttsRef.current?.cleanup();
    };
  }, []);

  const toggle = async (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (speaking) {
      ttsRef.current?.stop();
      setSpeaking(false);
      setLoading(false);
    } else {
      setLoading(true);
      try {
        await ttsRef.current?.speak(text, voice, 1.0, () => {
          setSpeaking(false);
        });
        setSpeaking(true);
      } catch (err) {
        console.error('TTS error:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <button onClick={toggle} disabled={loading} className="ml-2 p-1 opacity-40 hover:opacity-100 transition-opacity disabled:opacity-20">
      {loading ? (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      ) : speaking ? (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="6" width="12" height="12" rx="1"/>
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
        </svg>
      )}
    </button>
  );
}

/** Props for {@link MarkdownRenderer}. */
interface MarkdownRendererProps {
  /** Markdown content to render. */
  content?: string;
  /** xAI voice id for the speaker buttons. */
  xaiVoice?: string;
  /** TTS provider id (passed through; kept for API compatibility). */
  ttsProvider?: string;
  /** Whether to show per-section speaker buttons. */
  showSpeaker?: boolean;
  /** Titles of currently bookmarked sections. */
  bookmarkedSections?: Set<string>;
  /** Toggle handler for a section bookmark. */
  onToggleBookmark?: ((sectionTitle: string, sectionContent: string) => void) | null;
  /** Whether to show per-section bookmark buttons. */
  showBookmarks?: boolean;
}

export default function MarkdownRenderer({
  content,
  xaiVoice = 'eve',
  showSpeaker = true,
  bookmarkedSections = new Set(),
  onToggleBookmark = null,
  showBookmarks = true
}: MarkdownRendererProps) {
  const sectionMap = useMemo(() => parseSections(content), [content]);
  const components: Components = {
        code({ className, children, style, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const language = match ? match[1] : '';
          const codeString = String(children).replace(/\n$/, '');

          // Check if it's a code block (has language or contains newlines)
          const isCodeBlock = language || codeString.includes('\n');

          if (isCodeBlock) {
            return (
              <SyntaxHighlighter
                style={oneDark}
                language={language || 'text'}
                PreTag="div"
                className="rounded-none my-4 text-sm"
                {...props}
              >
                {codeString}
              </SyntaxHighlighter>
            );
          }

          // Inline code
          return (
            <code className="bg-accent px-1.5 py-0.5 rounded-none text-sm font-mono" style={style} {...props}>
              {children}
            </code>
          );
        },
        h1: ({ children }) => (
          <h1 className="text-3xl font-bold mt-8 mb-4">{children}</h1>
        ),
        h2: ({ children }) => {
          const title = typeof children === 'string' ? children
            : Array.isArray(children) ? children.map(c => typeof c === 'string' ? c : '').join('')
            : '';
          const trimmedTitle = title.trim();
          const section = sectionMap[trimmedTitle];
          const isBookmarked = bookmarkedSections.has(trimmedTitle);
          return (
            <h2 className="text-2xl font-bold mt-6 mb-3 pb-2 border-b border-accent flex items-center">
              {children}
              {showSpeaker && section && <SpeakerButton text={section} voice={xaiVoice} />}
              {showBookmarks && onToggleBookmark && (
                <BookmarkButton
                  isBookmarked={isBookmarked}
                  onToggle={() => onToggleBookmark(trimmedTitle, section || '')}
                  className="ml-2"
                />
              )}
            </h2>
          );
        },
        h3: ({ children }) => (
          <h3 className="text-xl font-semibold mt-5 mb-2">{children}</h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-lg font-semibold mt-4 mb-2">{children}</h4>
        ),
        p: ({ children }) => (
          <p className="my-3 leading-relaxed">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc list-inside my-3 space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside my-3 space-y-1">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="ml-2">{children}</li>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-app pl-4 my-4 italic opacity-80">
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          <a href={href} className="text-app hover:underline" target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
        hr: () => (
          <hr className="my-6 border-accent" />
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-4">
            <table className="min-w-full divide-y divide-accent">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-accent">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="px-4 py-2 text-left text-sm font-semibold">{children}</th>
        ),
        td: ({ children }) => (
          <td className="px-4 py-2 text-sm border-t border-accent">{children}</td>
        ),
        strong: ({ children }) => (
          <strong className="font-bold">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic">{children}</em>
        )
  };
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
}
