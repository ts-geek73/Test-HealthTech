import { Button } from "@/components/ui/button";
import { BookOpen, Mic, Save, Wand2 } from "lucide-react";
import { useState } from "react";
import { HiArrowLeft, HiArrowRight } from "react-icons/hi2";
import { Link } from "react-router-dom";
import ReferenceViewer from "../discharge/ReferenceViewer";
import VersionHistoryDropdown, {
  type VersionHistoryDropdownProps,
} from "../discharge/VersionHistoryDropdown";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface Reference {
  id: string;
  title: string;
  content: string;
}

interface DraftSummaryHeaderProps extends VersionHistoryDropdownProps {
  onRefresh: () => void;
  onVoiceClick: () => void;
  onNextSession?: () => void;
  hasNext?: boolean;
  onSave: () => void;
  contentId: string | null;
  sessionId: string | null;
  setContentId: (id: string | null) => void;
  setSessionId: (acc: string | null) => void;
  isPreparing?: boolean;
  setShowInlineConfirm: React.Dispatch<React.SetStateAction<boolean>>;
  isContentLoading?: boolean;
  editor: any;
  dirty?: boolean;
  isPreviewing?: boolean;
  openSignoff: () => void;
  voiceDisabled?: boolean;
  references?: Reference[];
  inlineDirty?: boolean;
}

const DraftSummaryHeader = ({
  onVoiceClick,
  onNextSession,
  hasNext,
  isPreparing,
  signoff,
  dirty,
  isPreviewing,
  references = [],
  isContentLoading,
  voiceDisabled,
  openSignoff,
  setShowInlineConfirm,
  inlineDirty,
  ...props
}: DraftSummaryHeaderProps) => {
  const [showRefs, setShowRefs] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between px-2 sm:px-4 py-3 border-b bg-card shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2 sm:gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/"
                className="group flex items-center gap-2.5 transition-all duration-300"
              >
                <div className="flex items-center justify-center h-8 p-2 rounded-full bg-zinc-100 text-black/60 group-hover:text-black transition-all duration-300 shadow-sm group-hover:shadow-md">
                  <HiArrowLeft className="text-sm transition-transform duration-300 group-hover:-translate-x-0.5" />
                </div>
                <div className="hidden sm:flex flex-col items-start leading-none gap-0.5">
                  <span className="text-sm font-bold text-zinc-600 uppercase tracking-widest group-hover:text-black transition-colors">
                    Dashboard
                  </span>
                </div>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="sm:hidden">Back to Dashboard</TooltipContent>
          </Tooltip>
          {/* <DraftSummaryToolbar editor={editor} /> */}

          {isPreparing && (
            <div className="flex items-center gap-1.5 px-2 md:px-3 py-1 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-widest rounded-full animate-pulse border border-primary/10">
              <Wand2 className="h-3 w-3" />
              <span className="hidden md:inline">Preparing</span>
            </div>
          )}

          {isPreviewing && (
            <div className="flex items-center gap-1.5 px-2 md:px-3 py-1 bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-widest rounded-full animate-pulse border">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
              <span className="hidden md:inline">Previewing</span>
            </div>
          )}

          {!isPreparing && !isPreviewing && dirty && (
            <div className="flex items-center gap-1.5 px-2 md:px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-widest rounded-full border border-amber-100">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="hidden md:inline">Unsaved</span>
            </div>
          )}

          {!isPreparing &&
            !isPreviewing &&
            props.previewVersion &&
            props.previewVersion !== props.currentVersion && (
              <div className="flex items-center gap-1.5 px-2 md:px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-widest rounded-full border border-blue-100">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                <span className="hidden md:inline">Previewing</span>
                {props.previewVersion}
              </div>
            )}
        </div>

        {
          <div className="flex items-center gap-2">
            {/* <PatientDropdown
              setAccountNumber={setAccountNumber}
              setPatientId={setPatientId}
              patientId={patientId}
              accountNumber={accountNumber}
            /> */}
            <VersionHistoryDropdown {...props} signoff={signoff} />

            {references.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showRefs ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setShowRefs((v) => !v)}
                    className="gap-2 rounded-full transition-colors px-2.5 md:px-4"
                  >
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="hidden md:inline">References</span>
                    {references.length > 0 && (
                      <span className="text-[10px] bg-muted-foreground/15 text-muted-foreground px-1.5 py-0.5 rounded-full font-medium">
                        {references.length}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Show Reference Documents</TooltipContent>
              </Tooltip>
            )}

            {!signoff?.isSigned && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowInlineConfirm(true)}
                      className="gap-2 rounded-full px-2.5 md:px-4"
                      disabled={
                        isContentLoading || voiceDisabled || !inlineDirty
                      }
                    >
                      <Save className="h-4 w-4 text-muted-foreground" />
                      <span className="hidden md:inline">Save</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Save Version</TooltipContent>
                </Tooltip>

                {/* <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 rounded-full px-2.5 md:px-4"
                      disabled={isContentLoading || voiceDisabled}
                      onClick={openSignoff}
                    >
                      <Signature className="h-4 w-4 text-muted-foreground" />
                      <span className="hidden md:inline">Sign off</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Sign off and Lock Record</TooltipContent>
                </Tooltip> */}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onVoiceClick}
                        disabled={voiceDisabled}
                        className="gap-2 rounded-full border-primary/20 hover:border-primary/50 transition-colors px-2.5 md:px-4"
                      >
                        <Mic className="h-4 w-4 text-primary" />
                        <span className="hidden md:inline">Voice</span>
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {voiceDisabled
                      ? "To start making changes, please make this version current first."
                      : "Voice Dictation"}
                  </TooltipContent>
                </Tooltip>
              </>
            )}

            {hasNext && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => onNextSession?.()}
                    className="h-8 max-sm:p-2 bg-black text-white rounded-full hover:bg-zinc-800 transition-all flex items-center gap-2 text-sm font-bold shadow-sm sm:ml-2"
                  >
                    <span className="hidden md:inline">Next</span>
                    <HiArrowRight className="text-lg" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="sm:hidden">Another user started the next session. Click to join.</TooltipContent>
              </Tooltip>
            )}
          </div>
        }
      </header>

      <ReferenceViewer
        open={showRefs}
        onClose={() => setShowRefs(false)}
        references={references}
      />
    </>
  );
};

export default DraftSummaryHeader;
