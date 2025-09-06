
'use client';

import { useState, useEffect, useCallback } from 'react';

// This interface is required to use the non-standard webkitSpeechRecognition
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((this: SpeechRecognition, ev: any) => any) | null;
  onerror: ((this: SpeechRecognition, ev: any) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionOptions {
  onResult: (transcript: string) => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
}

export function useSpeechRecognition({ onResult, onEnd, onError }: SpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check for browser support and initialize recognition object
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      const recognitionInstance = new SpeechRecognitionAPI() as SpeechRecognition;
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'fr-FR';
      setRecognition(recognitionInstance);
    } else {
        console.warn("Speech Recognition API is not supported in this browser.");
    }

    return () => {
      // Cleanup on unmount
      if (recognition) {
        recognition.stop();
      }
    };
    // We only want this to run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      recognition.start();
      setIsListening(true);
    }
  }, [recognition, isListening]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  }, [recognition, isListening]);

  useEffect(() => {
    if (!recognition) return;

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript && onResult) {
        onResult(finalTranscript);
      }
    };
    
    recognition.onerror = (event: any) => {
      // The "aborted" error is thrown when stopListening is called manually.
      // It's not a true error in our case, so we can safely ignore it.
      if (event.error === 'aborted') {
        return;
      }
      console.error('Speech recognition error', event.error);
      if (onError) onError(event.error);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      if (onEnd) onEnd();
      setIsListening(false);
    };

  }, [recognition, onResult, onError, onEnd]);

  return {
    isListening,
    startListening,
    stopListening,
    isSupported: !!recognition,
  };
}
