/**
 * Ambient declarations for `react-syntax-highlighter`.
 *
 * The package ships no TypeScript types and the project policy forbids adding
 * `@types/*` dependencies, so these minimal declarations cover only the surface
 * this app uses: the `Prism` highlighter component and the bundled prism styles.
 */
declare module 'react-syntax-highlighter' {
  import type { ComponentType, ReactNode } from 'react';

  /** Props accepted by the Prism/Light syntax highlighter components. */
  interface SyntaxHighlighterProps {
    language?: string;
    // Prism style objects are loosely shaped (token -> CSSProperties).
    style?: Record<string, unknown>;
    PreTag?: string | ComponentType<unknown>;
    className?: string;
    children?: ReactNode;
    [key: string]: unknown;
  }

  export const Prism: ComponentType<SyntaxHighlighterProps>;
  export const Light: ComponentType<SyntaxHighlighterProps>;
  const SyntaxHighlighter: ComponentType<SyntaxHighlighterProps>;
  export default SyntaxHighlighter;
}

declare module 'react-syntax-highlighter/dist/esm/styles/prism' {
  const style: Record<string, Record<string, unknown>>;
  export const oneDark: Record<string, unknown>;
  export default style;
}
