import { X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Version {
    id: string;
    timestamp: string;
    author: string;
    summary: string;
}

interface VersionHistoryPanelProps {
    onClose: () => void;
    onRestore: (versionId: string) => void;
}

const mockVersions: Version[] = [
    {
        id: "v3",
        timestamp: "Today, 2:30 PM",
        author: "Dr. Smith",
        summary: "Updated medication list",
    },
    {
        id: "v2",
        timestamp: "Today, 11:15 AM",
        author: "Dr. Smith",
        summary: "Added hospital course details",
    },
    {
        id: "v1",
        timestamp: "Yesterday, 4:45 PM",
        author: "Dr. Johnson",
        summary: "Initial draft",
    },
];

export const VersionHistoryPanel = ({ onClose, onRestore }: VersionHistoryPanelProps) => {
    return (
        <div className="border-t border-border bg-secondary/50 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between px-3 md:px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="hidden sm:inline">Version History</span>
                    <span className="sm:hidden">History</span>
                </h3>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                    <X className="h-4 w-4" />
                </Button>
            </div>
            <div className="max-h-48 overflow-auto">
                {mockVersions.map((version, index) => (
                    <div
                        key={version.id}
                        className="flex items-center justify-between px-3 md:px-4 py-3 border-b border-border last:border-b-0 hover:bg-accent/50"
                    >
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{version.summary}</p>
                            <p className="text-xs text-muted-foreground truncate">
                                {version.author} · {version.timestamp}
                            </p>
                        </div>
                        {index !== 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRestore(version.id)}
                                className="text-xs ml-2 flex-shrink-0"
                            >
                                Restore
                            </Button>
                        )}
                        {index === 0 && (
                            <span className="text-xs text-muted-foreground px-2 py-1 bg-accent rounded ml-2 flex-shrink-0">
                                Current
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
