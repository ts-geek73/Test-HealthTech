import { useState, useCallback, useRef, useEffect } from "react";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

interface UseSpeechToTextOptions {
    apiKey: string;
    model?: "scribe_v2" | "scribe_v1";
    language?: string;
    onSuccess?: (transcript: string) => void;
    onError?: (error: Error) => void;
}

interface UseSpeechToTextReturn {
    transcript: string;
    isTranscribing: boolean;
    error: string | null;
    transcribe: (audioBlob: Blob) => Promise<string | null>;
    clearTranscript: () => void;
}

/**
 * Custom hook for transcribing audio using ElevenLabs SDK
 * 
 * @param options - Configuration options including API key
 * @returns Object containing transcription state and transcribe function
 * 
 * @example
 * const { transcript, isTranscribing, transcribe } = useSpeechToText({
 *   apiKey: process.env.REACT_APP_ELEVENLABS_API_KEY!,
 *   model: "scribe_v2",
 *   language: "en",
 *   onSuccess: (text) => console.log('Transcribed:', text),
 * });
 * 
 * // Then call with audio blob
 * await transcribe(audioBlob);
 */
export const useSpeechToText = (
    options: UseSpeechToTextOptions
): UseSpeechToTextReturn => {
    const {
        apiKey,
        model = "scribe_v2",
        language = "en",
        onSuccess,
        onError
    } = options;

    const [transcript, setTranscript] = useState("");
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Use ref to maintain stable client instance
    const clientRef = useRef<ElevenLabsClient | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Initialize ElevenLabs client
    useEffect(() => {
        if (apiKey) {
            clientRef.current = new ElevenLabsClient({
                apiKey: apiKey,
            });
        }

        return () => {
            // Cleanup on unmount
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [apiKey]);

    const transcribe = useCallback(
        async (audioBlob: Blob): Promise<string | null> => {
            if (!apiKey) {
                const errorMsg = "ElevenLabs API key is required";
                setError(errorMsg);
                if (onError) {
                    onError(new Error(errorMsg));
                }
                return null;
            }

            if (!clientRef.current) {
                const errorMsg = "ElevenLabs client not initialized";
                setError(errorMsg);
                if (onError) {
                    onError(new Error(errorMsg));
                }
                return null;
            }

            // Cancel any ongoing transcription
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            setIsTranscribing(true);
            setError(null);

            try {
                // Convert Blob to File for SDK compatibility
                const audioFile = new File([audioBlob], "recording.webm", {
                    type: audioBlob.type || "audio/webm",
                });

                // Call ElevenLabs Speech-to-Text API using SDK
                const result = await clientRef.current.speechToText.convert({
                    file: audioFile,
                    modelId: model,
                    languageCode: language,
                });

                let transcribedText = "";

                if ("text" in result && typeof result.text === "string") {
                    transcribedText = result.text;
                } else if ("transcripts" in result && Array.isArray(result.transcripts)) {
                    // Handle multichannel response if needed (though we don't request it)
                    transcribedText = result.transcripts
                        .map((t: { text: string }) => t.text)
                        .join("\n");
                }

                setTranscript(transcribedText);

                if (onSuccess) {
                    onSuccess(transcribedText);
                }

                return transcribedText;
            } catch (err) {
                // Don't set error if request was aborted
                if (err instanceof Error && err.name === "AbortError") {
                    return null;
                }

                let errorMessage = "Failed to transcribe audio";

                if (err instanceof Error) {
                    // Handle SDK-specific errors
                    if (err.message.includes("401") || err.message.includes("Unauthorized")) {
                        errorMessage = "Invalid API key. Please check your ElevenLabs API key.";
                    } else if (err.message.includes("429") || err.message.includes("rate limit")) {
                        errorMessage = "Rate limit exceeded. Please try again later.";
                    } else if (err.message.includes("400") || err.message.includes("Bad Request")) {
                        errorMessage = "Invalid audio format. Please try recording again.";
                    } else if (err.message.includes("network") || err.message.includes("fetch")) {
                        errorMessage = "Network error. Please check your internet connection.";
                    } else {
                        errorMessage = err.message;
                    }
                }

                setError(errorMessage);
                setTranscript("");

                if (onError) {
                    onError(err instanceof Error ? err : new Error(errorMessage));
                }

                return null;
            } finally {
                setIsTranscribing(false);
                abortControllerRef.current = null;
            }
        },
        [apiKey, model, language, onSuccess, onError]
    );

    const clearTranscript = useCallback(() => {
        setTranscript("");
        setError(null);
    }, []);

    return {
        transcript,
        isTranscribing,
        error,
        transcribe,
        clearTranscript,
    };
}

export const useElevenLabsTranscription = useSpeechToText;