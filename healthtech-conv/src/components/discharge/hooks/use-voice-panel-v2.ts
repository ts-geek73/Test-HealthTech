import { useAudioRecorder, useBackendTranscription } from "@/hooks";
import { useEffect, useMemo, useRef } from "react";

interface UseVoiceProps {
    onTranscript: (text: string) => void;
    onClose: () => void;
}

const useVoice = ({ onTranscript, onClose }: UseVoiceProps) => {
    // Audio recording hook
    const {
        isRecording,
        isPaused,
        recordingTime,
        audioBlob,
        isSupported,
        error: recordingError,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        clearRecording,
    } = useAudioRecorder();

    // Memoized backend transcription options
    const transcriptionOptions = useMemo(() => ({
        onSuccess: (text: string) => {
            console.log("Transcription successful:", text);
        },
        onError: (error: Error) => {
            console.error("Transcription error:", error);
        },
    }), []);

    // Backend transcription hook
    const {
        transcript,
        isTranscribing,
        error: transcriptionError,
        transcribe,
        clearTranscript,
    } = useBackendTranscription(transcriptionOptions);

    // Track last transcribed blob to prevent duplicate calls
    const lastTranscribedBlobRef = useRef<Blob | null>(null);


    // Auto-transcribe when recording stops
    useEffect(() => {
        if (audioBlob && !isRecording && audioBlob !== lastTranscribedBlobRef.current) {
            lastTranscribedBlobRef.current = audioBlob;
            transcribe(audioBlob);
        }
    }, [audioBlob, isRecording, transcribe]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (isRecording) {
                stopRecording();
            }
        };
    }, [isRecording, stopRecording]);

    // Format recording time as MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const handleToggleRecording = async () => {
        if (isRecording) {
            stopRecording();
        } else {
            clearRecording();
            clearTranscript();
            lastTranscribedBlobRef.current = null;
            await startRecording();
        }
    };

    const handleTogglePause = () => {
        if (isPaused) {
            resumeRecording();
        } else {
            pauseRecording();
        }
    };

    const handleDone = (text?: string) => {
        const transcriptToUse = (text || transcript).trim();
        if (transcriptToUse) {
            onTranscript(transcriptToUse);
        }
        if (isRecording) {
            stopRecording();
        }
        onClose();
    };

    const handleCancel = () => {
        if (isRecording) {
            stopRecording();
        }
        onClose();
    };

    const handleRetry = async () => {
        if (audioBlob) {
            await transcribe(audioBlob);
        }
    };

    const error = recordingError || transcriptionError;

    return {
        isRecording,
        isPaused,
        recordingTime,
        audioBlob,
        isSupported,
        error,
        transcript,
        isTranscribing,
        transcriptionError,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        clearRecording,
        clearTranscript,
        transcribe,
        formatTime,
        handleToggleRecording,
        handleTogglePause,
        handleDone,
        handleCancel,
        handleRetry,
    };

}

export default useVoice;
