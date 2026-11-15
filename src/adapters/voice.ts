/** Optional spoken copy uses the same text shown on screen. */
export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

export function speak(text: string) {
  if (!canSpeak()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  window.speechSynthesis.speak(utterance);
}

export function stopSpeech() {
  if (canSpeak()) window.speechSynthesis.cancel();
}

export type VoiceCommand = 'read-heart-rate' | 'show-next-check' | 'open-sensors';

export interface VoiceState {
  available: boolean;
  phase: 'idle' | 'listening' | 'error';
  transcript: string;
  message: string;
  command: VoiceCommand | null;
}

// These deliberately small types cover the optional prefixed browser API.
export interface RecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  abort(): void;
}

export type RecognitionFactory = new () => RecognitionInstance;

function browserRecognition(): RecognitionFactory | undefined {
  if (typeof window === 'undefined') return undefined;
  const browser = window as unknown as {
    SpeechRecognition?: RecognitionFactory;
    webkitSpeechRecognition?: RecognitionFactory;
  };
  return browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
}

export function initialVoiceState(): VoiceState {
  return {
    available: !!browserRecognition(), phase: 'idle', transcript: '', command: null,
    message: 'Choose Talk to BY STAR, then say one of the commands below.',
  };
}

/** Only complete, read-only phrases are accepted. Extra instructions are rejected. */
export function parseVoiceCommand(transcript: string): VoiceCommand | null {
  const phrase = transcript.toLowerCase().trim().replace(/[.,!?]/g, '').replace(/\s+/g, ' ')
    .replace(/^(?:hello |hey )?by[ -]star /, '').replace(/^please /, '').replace(/ please$/, '');
  if (['read my heart rate', 'read heart rate', 'what is my heart rate', "what's my heart rate"].includes(phrase)) return 'read-heart-rate';
  if (['show my next check', 'show next check', 'show my next health task'].includes(phrase)) return 'show-next-check';
  if (['open sensors', 'open the sensors', 'show sensors'].includes(phrase)) return 'open-sensors';
  return null;
}

/** Recognition is opt-in and may use the browser vendor's network service. */
export function createVoiceController(onState: (state: VoiceState) => void, Factory = browserRecognition()) {
  let state = { ...initialVoiceState(), available: !!Factory };
  let active: RecognitionInstance | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let generation = 0;
  let disposed = false;

  function emit(update: Partial<VoiceState>) {
    state = { ...state, ...update };
    if (!disposed) onState(state);
  }

  function release() {
    generation += 1;
    if (timer) clearTimeout(timer);
    timer = undefined;
    const previous = active;
    active = undefined;
    // Invalidate handlers before abort; a late final result must not revive a command.
    if (previous) {
      previous.onresult = null;
      previous.onerror = null;
      previous.onend = null;
      try { previous.abort(); } catch { /* The service may already have stopped. */ }
    }
  }

  function start() {
    if (disposed || active) return;
    if (!Factory) {
      emit({ phase: 'error', message: 'Voice input is unavailable in this browser. Use the on-screen controls.' });
      return;
    }
    release();
    stopSpeech();
    const run = generation;
    try {
      const recognition = new Factory();
      active = recognition;
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = event => {
        if (run !== generation || disposed) return;
        const result = Array.from(event.results).find(item => item.isFinal);
        if (!result) return;
        const transcript = result[0].transcript.trim().slice(0, 240);
        const command = parseVoiceCommand(transcript);
        release();
        emit({ phase: 'idle', transcript, command, message: command
          ? 'Check what was heard, then choose Run command.'
          : 'Command not recognized. Try one of the three phrases below.' });
      };
      recognition.onerror = event => {
        if (run !== generation || disposed) return;
        release();
        const messages: Record<string, string> = {
          'not-allowed': 'Microphone permission was not granted. Use the on-screen controls or update your browser permission.',
          'service-not-allowed': 'The browser speech service is unavailable. Use the on-screen controls.',
          'audio-capture': 'No microphone is available. Check the input device or use the on-screen controls.',
          'network': 'The speech service could not connect. Use the on-screen controls.',
          'no-speech': 'No speech was detected. Select Talk to BY STAR to try again.',
        };
        emit({ phase: 'error', command: null, message: messages[event.error] ?? 'Voice input stopped. Use the on-screen controls or try again.' });
      };
      recognition.onend = () => {
        if (run !== generation || disposed) return;
        release();
        emit({ phase: 'idle', command: null, message: 'No command was received. Select Talk to BY STAR to try again.' });
      };
      emit({ phase: 'listening', transcript: '', command: null, message: 'Listening in English… Select Stop listening to cancel.' });
      recognition.start();
      if (active) timer = setTimeout(() => {
        if (run !== generation || disposed) return;
        release();
        emit({ phase: 'idle', command: null, message: 'Listening timed out. Select Talk to BY STAR to try again.' });
      }, 12000);
    } catch {
      release();
      emit({ phase: 'error', command: null, message: 'Voice input could not start. Check microphone access or use the on-screen controls.' });
    }
  }

  return {
    start,
    stop() {
      release();
      emit({ phase: 'idle', command: null, message: 'Listening stopped.' });
    },
    dispose() {
      disposed = true;
      release();
      stopSpeech();
    },
  };
}
