/**
 * Monaco, bundled with the app instead of fetched from a CDN.
 *
 * `@monaco-editor/react` loads Monaco from cdn.jsdelivr.net by default. The
 * backend's Content-Security-Policy (`script-src 'self'`) refuses that script,
 * and the failed load used to crash the rep page. Handing the loader a bundled
 * instance keeps everything same-origin.
 *
 * Imported lazily by `CodeEditor`, so Monaco lands in its own chunk and is only
 * downloaded when a rep is opened. Only the languages reps use are included.
 */
import { loader } from '@monaco-editor/react';
import 'monaco-editor/esm/vs/editor/edcore.main.js';
import 'monaco-editor/esm/vs/basic-languages/swift/swift.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution.js';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker.js?worker';

self.MonacoEnvironment = {
  getWorker: () => new EditorWorker()
};

loader.config({ monaco });
