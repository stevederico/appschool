import Editor from '@monaco-editor/react';
import { useState } from 'react';

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

  const handleEditorMount = () => {
    setIsLoading(false);
  };

  const handleChange = (newValue: string | undefined) => {
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div className="relative rounded-lg overflow-hidden border border-accent">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-accent z-10">
          <div className="animate-pulse text-muted-foreground">Loading editor...</div>
        </div>
      )}
      <Editor
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
      />
    </div>
  );
}
