// ─── useSpeechInput.js ────────────────────────────────────────────────────────
// Thin wrapper around the Web Speech API (SpeechRecognition).
// Works in Chrome, Edge, Safari 17+. Falls back gracefully on unsupported browsers.
//
// Usage:
//   const { listening, supported, start, stop } = useSpeechInput({
//     onResult: (text) => { /* append or replace text */ },
//     onError:  (err)  => { /* optional error handler */ },
//     continuous: false,  // default: stops after first result
//     lang: 'en-GB',      // BCP-47 language tag
//   });

import { useState, useCallback, useRef } from 'react';

export function useSpeechInput({
  onResult,
  onError,
  continuous  = false,
  interimResults = false,
  lang        = 'en-GB',
} = {}) {
  const [listening, setListening]   = useState(false);
  const [supported]                  = useState(() =>
    typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  );
  const recRef = useRef(null);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    if (!supported) {
      onError?.('Speech recognition not supported in this browser.');
      return;
    }
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const rec = new SpeechRecognition();
    rec.lang            = lang;
    rec.continuous      = continuous;
    rec.interimResults  = interimResults;
    rec.maxAlternatives = 1;

    rec.onstart  = () => setListening(true);
    rec.onend    = () => setListening(false);
    rec.onerror  = (e) => {
      setListening(false);
      onError?.(e.error || 'Speech error');
    };
    rec.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(r => r[0].transcript)
        .join(' ')
        .trim();
      if (transcript) onResult?.(transcript);
      if (!continuous) rec.stop();
    };

    recRef.current = rec;
    rec.start();
  }, [supported, lang, continuous, interimResults, onResult, onError, stop]);

  const toggle = useCallback(() => {
    listening ? stop() : start();
  }, [listening, start, stop]);

  return { listening, supported, start, stop, toggle };
}
