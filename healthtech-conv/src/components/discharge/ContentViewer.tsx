import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SectionType } from "@/constants";

interface ContentViewerProps {
    section: SectionType;
    content: string;
    onEdit: () => void;
    onDictate: () => void;
}

const sectionTitles: Record<SectionType, string> = {
    hpi: "History of Present Illness",
    course: "Hospital Course",
    meds: "Medications",
    diagnosis: "Diagnosis",
};

export const ContentViewer = ({ section, content, onEdit }: ContentViewerProps) => {
    return (
        <div className="flex-1 flex flex-col bg-background">
            {/* Header */}
            <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-border">
                <h1 className="text-lg md:text-xl font-semibold text-foreground">
                    {sectionTitles[section]}
                </h1>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onEdit}
                        className="gap-2"
                    >
                        <Pencil className="h-4 w-4" />
                        <span className="hidden sm:inline">Edit</span>
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 md:p-6 overflow-auto">
                <div className="prose prose-sm max-w-none">
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                        {content}
                    </p>
                </div>
            </div>
        </div>
    );
}
