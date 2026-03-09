import { useState, useRef, useCallback, useEffect } from "react";

interface UseAudioRecorderOptions {
    onRecordingComplete?: (audioBlob: Blob) => void;
    onError?: (error: Error) => void;
    mimeType?: string;
    audioBitsPerSecond?: number;
}

interface UseAudioRecorderReturn {
    isRecording: boolean;
    isPaused: boolean;
    recordingTime: number;
    audioBlob: Blob | null;
    audioURL: string | null;
    isSupported: boolean;
    error: string | null;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    pauseRecording: () => void;
    resumeRecording: () => void;
    clearRecording: () => void;
}

/**
 * Custom hook for audio recording that captures audio data for speech-to-text APIs
 * 
 * Features:
 * - High-quality audio recording with automatic codec selection
 * - Pause/resume functionality
 * - Proper cleanup and memory management
 * - Comprehensive error handling
 * - Browser compatibility detection
 * 
 * @param options - Configuration options
 * @returns Object containing recording state and control functions
 * 
 * @example
 * const { audioBlob, isRecording, startRecording, stopRecording } = useAudioRecorder({
 *   onRecordingComplete: async (blob) => {
 *     // Process the audio blob
 *     await transcribe(blob);
 *   }
 * });
 */
export const useAudioRecorder = (
    options: UseAudioRecorderOptions = {}
): UseAudioRecorderReturn => {
    const {
        onRecordingComplete,
        onError,
        mimeType = "audio/webm",
        audioBitsPerSecond = 128000,
    } = options;

    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioURL, setAudioURL] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSupported] = useState(() => {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    });

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);

    // Cleanup audio URL on unmount or when new recording starts
    useEffect(() => {
        return () => {
            if (audioURL) {
                URL.revokeObjectURL(audioURL);
            }
        };
    }, [audioURL]);

    // Start recording timer
    const startTimer = useCallback(() => {
        timerRef.current = window.setInterval(() => {
            setRecordingTime((prev) => prev + 1);
        }, 1000);
    }, []);

    // Stop recording timer
    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    // Cleanup stream
    const cleanupStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
    }, []);

    // Start recording
    const startRecording = useCallback(async () => {
        if (!isSupported) {
            const errorMsg = "Audio recording is not supported in this browser";
            setError(errorMsg);
            onError?.(new Error(errorMsg));
            return;
        }

        try {
            setError(null);
            chunksRef.current = [];
            setRecordingTime(0);

            // Request microphone access with optimal settings
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });

            streamRef.current = stream;

            // Determine best supported MIME type
            let selectedMimeType = mimeType;
            const mimeTypes = [
                "audio/webm;codecs=opus",
                "audio/webm",
                "audio/ogg;codecs=opus",
                "audio/mp4",
            ];

            if (!MediaRecorder.isTypeSupported(mimeType)) {
                const supported = mimeTypes.find((type) =>
                    MediaRecorder.isTypeSupported(type)
                );
                if (supported) {
                    selectedMimeType = supported;
                }
            }

            // Create MediaRecorder
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: selectedMimeType,
                audioBitsPerSecond,
            });

            mediaRecorderRef.current = mediaRecorder;

            // Handle data available
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            // Handle recording stop
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: selectedMimeType });

                // Revoke old URL before creating new one
                if (audioURL) {
                    URL.revokeObjectURL(audioURL);
                }

                const url = URL.createObjectURL(blob);

                setAudioBlob(blob);
                setAudioURL(url);
                setIsRecording(false);
                setIsPaused(false);
                stopTimer();
                cleanupStream();

                onRecordingComplete?.(blob);
            };

            // Handle errors
            mediaRecorder.onerror = (event: Event) => {
                const error = (event as ErrorEvent).error || new Error("Recording error");
                setError(error.message);
                setIsRecording(false);
                stopTimer();
                cleanupStream();

                onError?.(error);
            };

            // Start recording (collect data every 100ms for smoother processing)
            mediaRecorder.start(100);
            setIsRecording(true);
            startTimer();
        } catch (err) {
            const error = err instanceof Error ? err : new Error("Failed to start recording");
            let errorMsg = "Failed to start recording";

            if (err instanceof Error) {
                if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                    errorMsg = "Microphone permission denied. Please allow access to your microphone.";
                } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                    errorMsg = "No microphone found. Please connect a microphone and try again.";
                } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
                    errorMsg = "Microphone is already in use by another application.";
                } else {
                    errorMsg = err.message;
                }
            }

            setError(errorMsg);
            setIsRecording(false);
            cleanupStream();

            onError?.(error);
        }
    }, [isSupported, mimeType, audioBitsPerSecond, audioURL, onError, onRecordingComplete, startTimer, stopTimer, cleanupStream]);

    // Stop recording
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
        }
    }, [isRecording]);

    // Pause recording
    const pauseRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording && !isPaused) {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
            stopTimer();
        }
    }, [isRecording, isPaused, stopTimer]);

    // Resume recording
    const resumeRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording && isPaused) {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
            startTimer();
        }
    }, [isRecording, isPaused, startTimer]);

    // Clear recording
    const clearRecording = useCallback(() => {
        setAudioBlob(null);
        if (audioURL) {
            URL.revokeObjectURL(audioURL);
            setAudioURL(null);
        }
        setRecordingTime(0);
        setError(null);
        chunksRef.current = [];
    }, [audioURL]);

    return {
        isRecording,
        isPaused,
        recordingTime,
        audioBlob,
        audioURL,
        isSupported,
        error,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        clearRecording,
    };
}