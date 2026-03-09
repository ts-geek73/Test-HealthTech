import { History, ClipboardCheck, CheckCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface ActionBarProps {
    onVersionHistory: () => void;
    onReview: () => void;
    onSignOff: () => void;
}

export const ActionBar = ({ onVersionHistory, onReview, onSignOff }: ActionBarProps) => {
    return (
        <div className="flex items-center justify-between px-4 md:px-6 py-2 md:py-3 border-t border-border bg-background">
            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onVersionHistory}
                    className="gap-2 text-muted-foreground hover:text-foreground"
                >
                    <History className="h-4 w-4" />
                    <span className="hidden sm:inline">Version History</span>
                </Button>

                <Link to="/draft-summary">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-muted-foreground hover:text-foreground"
                    >
                        <FileText className="h-4 w-4" />
                        <span className="hidden sm:inline">Draft Summary</span>
                    </Button>
                </Link>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onReview}
                    className="gap-2"
                >
                    <ClipboardCheck className="h-4 w-4" />
                    <span className="hidden sm:inline">Review</span>
                </Button>
                <Button
                    size="sm"
                    onClick={onSignOff}
                    className="gap-2"
                >
                    <CheckCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">Sign-off</span>
                </Button>
            </div>
        </div>
    );
}
