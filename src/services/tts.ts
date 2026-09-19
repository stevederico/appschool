// TTS Service - Browser Speech Synthesis + xAI Grok Voice (Speech-to-Speech realtime)
// API: https://docs.x.ai/developers/model-capabilities/audio/speech-to-speech
import { getBackendURL, getCSRFToken } from '@stevederico/skateboard-ui/Utilities';

/** Options accepted by the TTS speak methods and stripMarkdown. */
interface TTSOptions {
  skipCode?: boolean;
}

/** Callback fired when speech playback finishes. */
type OnEndCallback = (() => void) | null;

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

/**
 * Strip markdown syntax to plain text suitable for speech synthesis.
 *
 * @param text - Raw markdown text
 * @param options - When skipCode is true, code blocks/inline code are removed
 * @returns Plain text with markdown markers removed
 */
function stripMarkdown(text: string, options: TTSOptions = {}): string {
  const { skipCode = false } = options;

  let result = text;

  if (skipCode) {
    result = result.replace(/```[\s\S]*?```/g, '');
    result = result.replace(/`[^`]+`/g, '');
  } else {
    result = result.replace(/```\w*\n?/g, ' code example: ');
    result = result.replace(/```/g, ' end code. ');
    result = result.replace(/`([^`]+)`/g, '$1');
  }

  return result
    .replace(/#{1,6}\s?/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/^\s*[-*+]\s/gm, '')
    .replace(/^\s*\d+\.\s/gm, '')
    .replace(/\n+/g, ' ')
    .trim();
}

/** Browser Speech Synthesis wrapper. */
class BrowserTTS {
  synth: SpeechSynthesis;
  utterance: SpeechSynthesisUtterance | null;
  onEndCallback: OnEndCallback;

  constructor() {
    this.synth = window.speechSynthesis;
    this.utterance = null;
    this.onEndCallback = null;
  }

  speak(text: string, speed = 1.0, onEnd: OnEndCallback = null, options: TTSOptions = {}): void {
    this.stop();
    const clean = stripMarkdown(text, options);
    if (!clean) return;

    this.utterance = new SpeechSynthesisUtterance(clean);
    this.utterance.rate = speed;
    this.utterance.pitch = 1.0;
    this.utterance.onend = () => {
      if (onEnd) onEnd();
      if (this.onEndCallback) this.onEndCallback();
    };
    this.synth.speak(this.utterance);
  }

  pause(): void {
    this.synth.pause();
  }

  resume(): void {
    this.synth.resume();
  }

  stop(): void {
    this.synth.cancel();
  }

  get paused(): boolean {
    return this.synth.paused;
  }

  get speaking(): boolean {
    return this.synth.speaking;
  }
}

/** A selectable xAI voice option (built-in Grok voices). */
interface XaiVoice {
  id: string;
  name: string;
}

/** Built-in Grok voices from GET /v1/tts/voices (lowercase). */
const XAI_VOICES: XaiVoice[] = [
  { id: 'eve', name: 'Eve (Default)' },
  { id: 'ara', name: 'Ara (Warm)' },
  { id: 'rex', name: 'Rex (Confident)' },
  { id: 'sal', name: 'Sal (Smooth)' },
  { id: 'leo', name: 'Leo (Authoritative)' },
];

/** Map legacy / display voice labels onto built-in ids. */
function normalizeXaiVoice(voice: string): string {
  const key = voice.trim().toLowerCase();
  const legacy: Record<string, string> = {
    charon: 'rex',
    iris: 'ara',
    orpheus: 'leo',
    sage: 'sal',
  };
  if (legacy[key]) return legacy[key];
  if (XAI_VOICES.some((v) => v.id === key)) return key;
  return 'eve';
}

/** Realtime API message envelope received over the WebSocket. */
interface RealtimeMessage {
  type: string;
  delta?: string;
  error?: unknown;
  [key: string]: unknown;
}

/** xAI Speech-to-Speech realtime used as open→speak→close TTS. */
class XaiTTS {
  ws: WebSocket | null;
  audioContext: AudioContext | null;
  audioQueue: (Float32Array | null)[];
  isPlaying: boolean;
  isPaused: boolean;
  isStopped: boolean;
  currentSource: AudioBufferSourceNode | null;
  onEndCallback: OnEndCallback;
  pendingText: string | null;
  sessionReady: boolean;
  tokenExpiry: number | null;
  voice: string;
  cachedToken: string | null;

  constructor() {
    this.ws = null;
    this.audioContext = null;
    this.audioQueue = [];
    this.isPlaying = false;
    this.isPaused = false;
    this.isStopped = false;
    this.currentSource = null;
    this.onEndCallback = null;
    this.pendingText = null;
    this.sessionReady = false;
    this.tokenExpiry = null;
    this.voice = 'eve';
    this.cachedToken = null;
  }

  async getToken(): Promise<string> {
    if (this.tokenExpiry && this.cachedToken && Date.now() < this.tokenExpiry - 30000) {
      return this.cachedToken;
    }

    const response = await fetch(`${getBackendURL()}/xai/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': getCSRFToken() ?? '',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Token fetch failed' })) as {
        error?: string;
      };
      throw new Error(error.error || 'Failed to get xAI token');
    }

    const data = await response.json() as { token?: string; expires_at?: string };
    if (!data.token) {
      throw new Error('Voice token missing from server response');
    }
    this.cachedToken = data.token;
    this.tokenExpiry = data.expires_at ? new Date(data.expires_at).getTime() : Date.now() + 300_000;
    return data.token;
  }

  async connect(voice = 'eve'): Promise<void> {
    this.voice = normalizeXaiVoice(voice);

    // Never reuse a sticky open socket — each speak() is open→speak→close.
    this.cleanup();
    this.isStopped = false;

    const token = await this.getToken();

    return new Promise<void>((resolve, reject) => {
      // grok-voice-latest tracks the newest Speech-to-Speech model.
      this.ws = new WebSocket(
        'wss://api.x.ai/v1/realtime?model=grok-voice-latest',
        [`xai-client-secret.${token}`],
      );

      this.ws.onopen = () => {
        const ws = this.ws;
        if (!ws) return;
        // Current session schema (nested audio formats) — not legacy flat fields.
        ws.send(JSON.stringify({
          type: 'session.update',
          session: {
            voice: this.voice,
            turn_detection: null,
            instructions:
              'You are a text-to-speech engine. Read the provided text naturally and clearly. Do not add commentary.',
            audio: {
              output: { format: { type: 'audio/pcm', rate: 24000 } },
            },
          },
        }));
      };

      this.ws.onmessage = (event: MessageEvent) => {
        const msg: RealtimeMessage = JSON.parse(String(event.data));
        this.handleMessage(msg, resolve);
      };

      this.ws.onerror = (err) => {
        console.error('xAI WebSocket error:', err);
        reject(new Error('WebSocket connection failed'));
      };

      this.ws.onclose = () => {
        this.sessionReady = false;
      };
    });
  }

  handleMessage(msg: RealtimeMessage, resolveConnect?: () => void): void {
    switch (msg.type) {
      case 'session.created':
      case 'session.updated':
        this.sessionReady = true;
        if (resolveConnect) resolveConnect();
        if (this.pendingText) {
          this.sendText(this.pendingText);
          this.pendingText = null;
        }
        break;

      case 'response.output_audio.delta':
      case 'response.audio.delta':
        if (msg.delta && !this.isStopped) {
          this.queueAudio(msg.delta);
        }
        break;

      case 'response.output_audio.done':
      case 'response.audio.done':
      case 'response.done':
        if (!this.isStopped) {
          this.audioQueue.push(null); // Signal end
          void this.playQueue();
        }
        break;

      case 'error':
        console.error('xAI error:', msg.error);
        break;
    }
  }

  sendText(text: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.pendingText = text;
      return;
    }

    this.ws.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{
          type: 'input_text',
          text: `READ ALOUD VERBATIM: ${text}`,
        }],
      },
    }));

    this.ws.send(JSON.stringify({
      type: 'response.create',
    }));
  }

  queueAudio(base64Data: string): void {
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const pcm16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768;
    }

    this.audioQueue.push(float32);
    void this.playQueue();
  }

  async playQueue(): Promise<void> {
    if (this.isPlaying || this.isPaused || this.isStopped) return;
    if (this.audioQueue.length === 0) return;

    this.isPlaying = true;

    if (!this.audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) throw new Error('AudioContext not supported');
      this.audioContext = new AudioContextClass({ sampleRate: 24000 });
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    while (this.audioQueue.length > 0 && !this.isStopped && !this.isPaused) {
      const chunk = this.audioQueue.shift();

      if (chunk === null) {
        // End signal — hang up Grok immediately (open→speak→close).
        this.isPlaying = false;
        if (this.onEndCallback) {
          this.onEndCallback();
          this.onEndCallback = null;
        }
        this.cleanup();
        return;
      }

      if (chunk) await this.playChunk(chunk);
    }

    this.isPlaying = false;
  }

  playChunk(float32Data: Float32Array): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this.isStopped || !this.audioContext) {
        resolve();
        return;
      }

      const buffer = this.audioContext.createBuffer(1, float32Data.length, 24000);
      buffer.getChannelData(0).set(float32Data);

      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);

      this.currentSource = source;

      source.onended = () => {
        this.currentSource = null;
        resolve();
      };

      source.start();
    });
  }

  async speak(text: string, voice = 'eve', _speed = 1.0, onEnd: OnEndCallback = null, options: TTSOptions = {}): Promise<void> {
    this.stop();
    this.isStopped = false;
    this.onEndCallback = onEnd;

    const clean = stripMarkdown(text, options);
    if (!clean) {
      if (onEnd) onEnd();
      return;
    }

    try {
      await this.connect(voice);
      this.sendText(clean);
    } catch (err) {
      console.error('xAI TTS error:', err);
      throw err;
    }
  }

  pause(): void {
    this.isPaused = true;
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {
        // Already stopped
      }
    }
    if (this.audioContext) {
      void this.audioContext.suspend();
    }
  }

  resume(): void {
    this.isPaused = false;
    if (this.audioContext) {
      void this.audioContext.resume();
    }
    void this.playQueue();
  }

  stop(): void {
    this.isStopped = true;
    this.isPaused = false;
    this.audioQueue = [];
    this.pendingText = null;

    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {
        // Already stopped
      }
      this.currentSource = null;
    }

    this.isPlaying = false;
  }

  cleanup(): void {
    this.stop();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.sessionReady = false;
  }

  get paused(): boolean {
    return this.isPaused;
  }

  get speaking(): boolean {
    return this.isPlaying && !this.isPaused;
  }
}

export {
  BrowserTTS,
  XaiTTS,
  stripMarkdown,
  XAI_VOICES,
};
