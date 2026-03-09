import { useAudioRecorder, useSpeechToText } from "@/hooks";
import { useEffect, useMemo } from "react";

interface UseVoiceProps {
    onTranscript: (text: string) => void;
    onClose: () => void;
    elevenlabsApiKey: string;
}

const useVoice = ({ onTranscript, onClose, elevenlabsApiKey }: UseVoiceProps) => {
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

    // ElevenLabs transcription hook with memoized options
    const transcriptionOptions = useMemo(() => ({
        apiKey: elevenlabsApiKey,
        model: "scribe_v2" as const,
        language: "en",
        onSuccess: (text: string) => {
            console.log("Transcription successful:", text);
        },
        onError: (error: Error) => {
            console.error("Transcription error:", error);
        },
    }), [elevenlabsApiKey]);

    const {
        transcript,
        isTranscribing,
        error: transcriptionError,
        transcribe,
        clearTranscript,
    } = useSpeechToText(transcriptionOptions);


    // Auto-transcribe when recording stops
    useEffect(() => {
        if (audioBlob && !isRecording) {
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

    const handleDone = () => {
        if (transcript.trim()) {
            onTranscript(transcript.trim());
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