import { useCallback, useState } from "react";

interface UseBackendTranscriptionOptions {
  onSuccess?: (transcript: string) => void;
  onError?: (error: Error) => void;
}

interface UseBackendTranscriptionReturn {
  transcript: string;
  isTranscribing: boolean;
  error: string | null;
  transcribe: (audioBlob: Blob) => Promise<string | null>;
  clearTranscript: () => void;
}

/**
 * Custom hook for transcribing audio using the backend endpoint
 */
export const useBackendTranscription = (
  options: UseBackendTranscriptionOptions = {},
): UseBackendTranscriptionReturn => {
  const { onSuccess, onError } = options;

  const [transcript, setTranscript] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transcribe = useCallback(
    async (audioBlob: Blob): Promise<string | null> => {
      if (isTranscribing) return null;

      setIsTranscribing(true);
      setError(null);

      const formData = new FormData();
      // Assuming the backend expects a field named 'file'
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("autoProcess", "false");

      const baseUrl =
        import.meta.env?.VITE_API_BASE_URL || "http://localhost:5000";
      const endpoint = `${baseUrl}/api/voice-command`;

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `Server error: ${response.status}`,
          );
        }

        const result = await response.json();
        const transcribedText =
          result.data?.text || result.text || result.data?.transcription || "";

        setTranscript(transcribedText);

        if (onSuccess) {
          onSuccess(transcribedText);
        }

        return transcribedText;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to transcribe audio";
        setError(errorMessage);
        setTranscript("");

        if (onError) {
          onError(err instanceof Error ? err : new Error(errorMessage));
        }

        return null;
      } finally {
        setIsTranscribing(false);
      }
    },
    [onSuccess, onError, isTranscribing],
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
};
