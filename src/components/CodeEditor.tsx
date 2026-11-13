import Editor from '@monaco-editor/react';
import { useEffect, useState } from 'react';

/** Whether the bundled Monaco chunk has loaded. */
type MonacoStatus = 'loading' | 'ready' | 'failed';

/** Props for {@link CodeEditor}. */
interface CodeEditorProps {
  /** Editor contents. */
  value?: string;
  /** Called with the new value on edit. */
  onChange?: (value: string | undefined) => void;
  /** Monaco language id (e.g. 'javascript', 'swift'). */
  language?: string;
  /** Editor height (CSS value). */
  height?: string;
  /** Whether the editor is read-only. */
  readOnly?: boolean;
  /** Monaco theme name. */
  theme?: string;
}

export default function CodeEditor({
  value = '',
  onChange,
  language = 'javascript',
  height = '400px',
  readOnly = false,
  theme = 'vs-dark'
}: CodeEditorProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [monaco, setMonaco] = useState<MonacoStatus>('loading');

  // Load the bundled Monaco before mounting <Editor>, so the loader never
  // reaches for its CDN default. If the chunk cannot be fetched, a plain
  // editor is shown instead of crashing the page.
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        await import('./monacoSetup');
        if (active) setMonaco('ready');
      } catch (err) {
        console.error('Code editor failed to load:', err);
        if (active) setMonaco('failed');
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const handleEditorMount = () => {
    setIsLoading(false);
  };

  const handleChange = (newValue: string | undefined) => {
    if (onChange) {
      onChange(newValue);
    }
  };

  if (monaco === 'failed') {
    return (
      <div className="rounded-lg overflow-hidden border border-accent">
        <textarea
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          readOnly={readOnly}
          spellCheck={false}
          aria-label="Code editor"
          style={{ height }}
          className="block w-full resize-none bg-accent p-4 font-mono text-sm outline-none"
        />
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden border border-accent" style={{ minHeight: height }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-accent z-10">
          <div className="animate-pulse text-muted-foreground">Loading editor...</div>
        </div>
      )}
      {monaco === 'ready' && <Editor
        height={height}
        language={language}
        value={value}
        theme={theme}
        onChange={handleChange}
        onMount={handleEditorMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: 'JetBrains Mono, Menlo, Monaco, monospace',
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          tabSize: 2,
          padding: { top: 16, bottom: 16 },
          automaticLayout: true,
          formatOnPaste: true,
          formatOnType: true,
          bracketPairColorization: { enabled: true }
        }}
      />}
    </div>
  );
}
