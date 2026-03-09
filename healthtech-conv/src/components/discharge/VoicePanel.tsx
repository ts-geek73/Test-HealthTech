import { X, Mic, Square, Pause, Play, Loader2, AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import useVoice from "./hooks/use-voice-panel-v2";
import { useEffect, useState } from "react";

interface VoicePanelProps {
  open: boolean;
  onClose: () => void;
  onTranscript: (text: string) => void;
}

export const VoicePanel = ({ open, onClose, onTranscript }: VoicePanelProps) => {
  const {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    isSupported,
    error,
    transcript,
    isTranscribing,
    transcriptionError,
    formatTime,
    handleToggleRecording,
    handleTogglePause,
    handleDone,
    handleCancel,
    handleRetry,
  } = useVoice({ onTranscript, onClose });

  const [editedTranscript, setEditedTranscript] = useState(transcript || "");

  useEffect(() => {
    if (transcript) {
      setEditedTranscript(transcript);
    }
  }, [transcript]);

  if (!open) return null;

  return (
    // Transparent overlay — click outside to close
    <div className="fixed inset-0 z-50" onClick={handleCancel}>
      {/* Popup anchored below header, top-right near mic button */}
      <div
        className="absolute top-14 right-4 w-72 bg-card border border-border rounded-xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-colors",
                isRecording && !isPaused
                  ? "bg-red-500 animate-pulse"
                  : isRecording && isPaused
                    ? "bg-amber-400"
                    : "bg-muted-foreground/40"
              )}
            />
            <span className="text-xs font-semibold text-foreground">Voice Input</span>
            {isRecording && (
              <span className="font-mono text-[11px] text-muted-foreground">
                {formatTime(recordingTime)}
                {isPaused && <span className="ml-1 text-amber-500">(paused)</span>}
              </span>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCancel}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col items-center gap-3">

          {/* Browser support / error warnings */}
          {(!isSupported || (error && isSupported)) && (
            <div className="w-full flex items-start gap-2 p-2.5 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
              <p className="text-[11px] text-destructive leading-relaxed">
                {!isSupported
                  ? "Recording not supported in this browser. Try Chrome, Edge, or Safari."
                  : error}
              </p>
            </div>
          )}

          {/* Record + Pause buttons */}
          <div className="flex items-center gap-3 mt-1">
            {/* Main record button */}
            <button
              onClick={handleToggleRecording}
              disabled={!isSupported || isTranscribing}
              className={cn(
                "h-14 w-14 rounded-full flex items-center justify-center transition-all shadow-sm",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
                isRecording
                  ? "bg-red-500 hover:bg-red-600 ring-4 ring-red-500/20"
                  : "bg-primary hover:opacity-90",
                (!isSupported || isTranscribing) && "opacity-50 cursor-not-allowed"
              )}
            >
              {isRecording ? (
                <Square className="h-5 w-5 text-white" />
              ) : (
                <Mic className="h-5 w-5 text-primary-foreground" />
              )}
            </button>

            {/* Pause/resume — only visible while recording */}
            {isRecording && (
              <button
                onClick={handleTogglePause}
                className={cn(
                  "h-9 w-9 rounded-full flex items-center justify-center transition-all",
                  "border border-border bg-background hover:bg-muted",
                  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                )}
              >
                {isPaused ? (
                  <Play className="h-4 w-4 text-foreground" />
                ) : (
                  <Pause className="h-4 w-4 text-foreground" />
                )}
              </button>
            )}
          </div>

          {/* Status line */}
          <div className="flex items-center gap-1.5 h-4">
            {isTranscribing && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            <span className="text-[11px] text-muted-foreground">
              {isTranscribing
                ? "Processing audio…"
                : isRecording
                  ? isPaused
                    ? "Paused — tap to resume"
                    : "Recording… tap to stop"
                  : "Tap to record"}
            </span>
          </div>

          {/* Manual Input / Transcript */}
          {(!isRecording && !isTranscribing) ? (
            <div className="w-full bg-muted/50 border border-border rounded-lg p-3 max-h-32 overflow-y-auto min-h-[100px] flex flex-col">
              <textarea
                className="w-full bg-transparent text-xs text-foreground leading-relaxed whitespace-pre-wrap border-none focus:ring-0 resize-none outline-none p-0 scrollbar-hide flex-1"
                value={editedTranscript}
                onChange={(e) => setEditedTranscript(e.target.value)}
                placeholder="Type or record your input..."
                rows={4}
              />
            </div>
          ) : isTranscribing ? (
            <div className="w-full border border-dashed border-border rounded-lg px-3 py-4 flex items-center justify-center min-h-[100px]">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <p className="text-[11px] text-muted-foreground/60 text-center">
                  Processing audio…
                </p>
              </div>
            </div>
          ) : isRecording ? (
            <div className="w-full border border-dashed border-border rounded-lg px-3 py-4 flex items-center justify-center min-h-[100px]">
              <div className="flex flex-col items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <p className="text-[11px] text-muted-foreground/60 text-center">
                  Recording in progress…
                </p>
              </div>
            </div>
          ) : null}

          {/* Retry on transcription error */}
          {transcriptionError && audioBlob && (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs"
              onClick={handleRetry}
              disabled={isTranscribing}
            >
              Retry Transcription
            </Button>
          )}

          {/* Actions */}
          {!isRecording && !isTranscribing && (
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs"
                disabled={!editedTranscript.trim()}
                onClick={() => {
                  setEditedTranscript("");
                  if (transcript) {
                    handleCancel();
                  }
                }}
              >
                Clear
              </Button>
              <Button
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={() => handleDone(editedTranscript)}
                disabled={!editedTranscript.trim()}
              >
                <Check className="h-3 w-3 mr-1" />
                Apply
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoicePanel;