import { SectionNav } from "@/components/discharge/SectionNav";
import { MobileSectionNav } from "@/components/discharge/MobileSectionNav";
import { ContentViewer } from "@/components/discharge/ContentViewer";
import { EditPanel } from "@/components/discharge/EditPanel";
import { VoicePanel } from "@/components/discharge/VoicePanel";
import { ActionBar } from "@/components/discharge/ActionBar";
import { VersionHistoryPanel } from "@/components/discharge/VersionHistoryPanel";
import useDischarge from "./hooks/use-discharge";


const Index = () => {
    const {
        setActiveSection,
        activeSection,
        content,
        setPanelMode,
        panelMode,
        setEditDraft,
        editDraft,
        handleEdit,
        handleSaveEdit,
        handleDictate,
        handleTranscript,
        handleVersionHistory,
        handleReview,
        handleSignOff,
        handleRestore
    } = useDischarge();

    const renderPanel = () => {
        switch (panelMode) {
            case "edit":
                return (
                    <EditPanel
                        content={editDraft}
                        onChange={setEditDraft}
                        onSave={handleSaveEdit}
                        onCancel={() => setPanelMode("none")}
                        onDictate={handleDictate}
                    />
                );
            case "voice":
                return (
                    <VoicePanel
                        onTranscript={handleTranscript}
                        onClose={() => setPanelMode("none")}
                        open={false}
                    />
                );
            case "history":
                return (
                    <VersionHistoryPanel
                        onClose={() => setPanelMode("none")}
                        onRestore={handleRestore}
                    />
                );
            case "none":
            default:
                return null;
        }
    };

    return (
        <div className="flex min-h-screen bg-background">
            {/* Left Sidebar - Hidden on mobile, visible on tablet+ */}
            <SectionNav
                activeSection={activeSection}
                onSectionChange={(section) => {
                    setActiveSection(section);
                    setPanelMode("none");
                }}
            />

            {/* Main Content Area */}
            <div className="flex flex-col w-full border-l border-border md:border-l">
                <MobileSectionNav
                    activeSection={activeSection}
                    onSectionChange={(section) => {
                        setActiveSection(section);
                        setPanelMode("none");
                    }}
                />

                {/* Header with title */}
                <header className="px-4 md:px-6 py-3 md:py-4 border-b border-border bg-background">
                    <h1 className="text-base md:text-lg font-semibold text-foreground">
                        Discharge Summary
                    </h1>
                    <p className="text-xs md:text-sm text-muted-foreground">
                        Patient: John Doe · MRN: 12345678 · DOB: 01/15/1959
                    </p>
                </header>

                {/* Content Viewer */}
                <ContentViewer
                    section={activeSection}
                    content={content[activeSection]}
                    onEdit={handleEdit}
                    onDictate={handleDictate}
                />

                {/* Conditional Panels */}
                {renderPanel()}

                {/* Bottom Action Bar */}
                <ActionBar
                    onVersionHistory={handleVersionHistory}
                    onReview={handleReview}
                    onSignOff={handleSignOff}
                />
            </div>
        </div>
    );
};

export default Index;