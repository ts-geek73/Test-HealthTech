import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { SectionType } from "@/constants";
import { initialContent } from "@/constants";

export type PanelMode = "none" | "edit" | "voice" | "history";

const useDischarge = () => {
    const [activeSection, setActiveSection] = useState<SectionType>("hpi");
    const [content, setContent] = useState(initialContent);
    const [panelMode, setPanelMode] = useState<PanelMode>("none");
    const [editDraft, setEditDraft] = useState("");
    const { toast } = useToast();

    const handleEdit = () => {
        setEditDraft(content[activeSection]);
        setPanelMode("edit");
    };

    const handleSaveEdit = () => {
        setContent((prev) => ({
            ...prev,
            [activeSection]: editDraft,
        }));
        setPanelMode("none");
        toast({
            title: "Changes saved",
            description: "Your edits have been saved successfully.",
        });
    };

    const handleDictate = () => {
        setPanelMode("voice");
    };

    const handleTranscript = (text: string) => {
        setContent((prev) => ({
            ...prev,
            [activeSection]: prev[activeSection] + "\n\n" + text,
        }));
        toast({
            title: "Text added",
            description: "Voice transcript has been added to the document.",
        });
    };

    const handleVersionHistory = () => {
        setPanelMode(panelMode === "history" ? "none" : "history");
    };

    const handleReview = () => {
        toast({
            title: "Marked for review",
            description: "This document has been flagged for review.",
        });
    };

    const handleSignOff = () => {
        toast({
            title: "Document signed",
            description: "The discharge summary has been signed off.",
        });
    };

    const handleRestore = (versionId: string) => {
        toast({
            title: "Version restored",
            description: `Restored to version ${versionId}.`,
        });
        setPanelMode("none");
    };

    return {
        activeSection,
        setActiveSection,
        content,
        panelMode,
        setPanelMode,
        editDraft,
        setEditDraft,
        handleEdit,
        handleSaveEdit,
        handleDictate,
        handleTranscript,
        handleVersionHistory,
        handleReview,
        handleSignOff,
        handleRestore,
    }
}

export default useDischarge;