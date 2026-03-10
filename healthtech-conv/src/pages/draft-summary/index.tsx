import AlertDialog from "@/components/discharge/AlertDialog";
import EditDiffViewer from "@/components/discharge/EditDiffViewer";
import { VoicePanel } from "@/components/discharge/VoicePanel";
import DraftSummaryHeader from "@/components/draft-summary/DraftSummaryHeader";
import {
  useDraftSummary,
  type EditResponse,
} from "@/components/draft-summary/hooks/useDraftSummary";
import RichtextEditor from "@/components/draft-summary/RichtextEditor";
import type { TrackedSession } from "@/types/session";
import { toast } from "sonner";
import SignoffModal from "./SignoffModal";

const mockEditResponse: EditResponse = {
  success: true,
  needsClarification: false,
  dirty: true,
  message: "3 sections updated successfully.",
  edits: [
    {
      title: "Introduction",
      original:
        "Artificial intelligence is changing the world in many different ways.",
      updated:
        "Artificial intelligence is rapidly transforming industries by automating decision-making and enabling large-scale data analysis.",
      confidence: 0.94,
    },
    {
      title: "Benefits",
      original: "AI helps companies work faster and reduce manual effort.",
      updated:
        "AI enables organizations to improve operational efficiency, reduce manual processes, and uncover insights from large datasets.",
      confidence: 0.91,
    },
    {
      title: "Challenges",
      original:
        "However, AI also raises concerns around privacy and ethical usage.",
      updated:
        "Despite its benefits, AI introduces significant concerns around data privacy, bias in algorithms, and ethical governance.",
      confidence: 0.88,
    },
  ],
};

interface DraftSummaryProps {
  session?: TrackedSession;
  onNextSession?: () => void;
  hasNext?: boolean;
}

const DraftSummary = ({ onNextSession, hasNext }: DraftSummaryProps) => {
  const {
    content,
    showVoice,
    setShowVoice,
    editor,
    setEditor,
    isPreparing,
    handleContentChange,
    handleTranscript,
    handleSave,
    handleRefresh,
    currentVersion,
    dirty,
    history,
    showDiff,
    setShowDiff,
    lastEdits,
    loading,
    commitDraft,
    handleDiscard,
    previewVersion,
    isPreviewing,
    handlePreviewVersion,
    handleRollback,
    references,
    inlineDirty,
    showInlineConfirm,
    setShowInlineConfirm,
    handleConfirmInlineSave,
    handleDocChanged,
    isDiscarding,
    isInlineSaving,
    isRollingBack,
    isSaving,
    canEnableVoice,
    selectedSectionId,
    setSelectedSectionId,
    // signoff
    signoff,
    isSigned,
    openSignoff,
    setOpenSignoff,
    handleSignoffConfirm,
    contentId,
    sessionId,
    setContentId,
    setSessionId,
    isStale,
  } = useDraftSummary();

  const isContentLoading =
    isInlineSaving ||
    isDiscarding ||
    isSaving ||
    isRollingBack ||
    isPreviewing ||
    isPreparing ||
    isStale;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <DraftSummaryHeader
        onRefresh={handleRefresh}
        onVoiceClick={() => {
          if (!selectedSectionId) {
            toast.error("Please select a section first");
            return;
          }
          setShowVoice(true);
        }}
        contentId={contentId}
        sessionId={sessionId}
        setContentId={setContentId}
        setSessionId={setSessionId}
        onSave={handleSave}
        signoff={signoff}
        isPreparing={isPreparing}
        versions={history}
        currentVersion={currentVersion}
        previewVersion={previewVersion}
        onPreview={handlePreviewVersion}
        onRestore={handleRollback}
        onCompare={handlePreviewVersion}
        editor={editor}
        dirty={dirty}
        references={references}
        isPreviewing={isPreviewing}
        voiceDisabled={!canEnableVoice || isContentLoading || isSigned}
        isContentLoading={isContentLoading}
        inlineDirty={inlineDirty}
        setShowInlineConfirm={setShowInlineConfirm}
        openSignoff={() => setOpenSignoff(true)}
        hasNext={hasNext}
        onNextSession={onNextSession}
      />

      <main className="flex-1 p-4 md:p-8 w-full overflow-auto flex flex-col justify-center bg-muted/10">
        <div className="w-full max-w-4xl mx-auto flex flex-col bg-card border rounded-xl shadow-lg p-6 md:p-10 relative">
          <RichtextEditor
            content={content}
            onChange={handleContentChange}
            onEditorReady={setEditor}
            onDocChanged={handleDocChanged}
            isPreparing={isContentLoading}
            selectedSectionId={selectedSectionId}
            onSectionSelect={setSelectedSectionId}
            editable={!isSigned}
            signoff={signoff}
            isCurrent={
              previewVersion ? previewVersion === currentVersion : true
            }
            signedBy={signoff?.signedBy}
          />

          {isSigned && (
            <div className="absolute inset-0 rounded-xl cursor-default" />
          )}
        </div>
      </main>

      <AlertDialog
        open={showInlineConfirm}
        onOpenChange={setShowInlineConfirm}
        onConfirm={handleConfirmInlineSave}
        content={{
          title: "Save as new version?",
          description:
            "This will create a new version with your inline changes. The current version will remain in the history and can be restored at any time.",
          actionText: "Save version",
        }}
      />

      <SignoffModal
        open={openSignoff}
        onClose={() => setOpenSignoff(false)}
        onConfirm={handleSignoffConfirm}
        loading={isSaving}
      />

      {showVoice && (
        <VoicePanel
          onTranscript={handleTranscript}
          onClose={() => setShowVoice(false)}
          open={showVoice}
        />
      )}

      {showDiff && (
        <div className="fixed bottom-0 left-0 right-0 z-40 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
          <EditDiffViewer
            editResponse={(lastEdits as EditResponse) ?? mockEditResponse}
            loading={loading}
            commitDraft={commitDraft}
            onClose={async () => setShowDiff(false)}
            handleDiscard={handleDiscard}
          />
        </div>
      )}
    </div>
  );
};

export default DraftSummary;
