import { CheckCircle2, Loader2, PenLine, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";

interface SignoffModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (signatureDataUrl: string) => void;
  signedBy?: string;
  loading?: boolean;
}

const SignoffModal = ({
  open,
  onClose,
  onConfirm,
  signedBy,
  loading,
}: SignoffModalProps) => {
  const sigPadRef = useRef<SignatureCanvas>(null);
  const [hasSigned, setHasSigned] = useState(false);

  useEffect(() => {
    if (open) {
      sigPadRef.current?.clear();
      setHasSigned(false);
    }
  }, [open]);

  const handleClear = () => {
    sigPadRef.current?.clear();
    setHasSigned(false);
  };

  const handleConfirm = () => {
    if (!sigPadRef.current || sigPadRef.current.isEmpty()) return;
    const dataUrl = sigPadRef.current.getCanvas().toDataURL("image/png");
    onConfirm(dataUrl);
  };

  if (!open) return null;

  const timestamp = new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!loading ? onClose : undefined}
      />

      <div className="relative z-10 bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <PenLine className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Electronic Signoff
              </h2>
              <p className="text-xs text-muted-foreground">
                Sign to finalize and lock this document
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
            <span>{signedBy ?? "anonymous"}</span>
            <span>{timestamp}</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Signature
            </label>
            <div className="relative rounded-xl border-2 border-dashed border-border bg-white overflow-hidden transition-colors hover:border-primary/40">
              <SignatureCanvas
                ref={sigPadRef}
                penColor="#1e293b"
                minWidth={1}
                maxWidth={3}
                velocityFilterWeight={0.8}
                canvasProps={{
                  style: { width: "100%", height: "200px", display: "block" },
                }}
                onEnd={() => setHasSigned(true)}
              />
              {loading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px]" />
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            By signing, you confirm this discharge summary is accurate and
            complete. This document will be locked and the signature will be
            recorded with a timestamp.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-border bg-muted/20">
          <button
            onClick={handleClear}
            disabled={!hasSigned || loading}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors px-3 py-2 rounded-lg hover:bg-muted"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!hasSigned || loading}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors min-w-[110px] justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Sign &amp; Lock
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignoffModal;
