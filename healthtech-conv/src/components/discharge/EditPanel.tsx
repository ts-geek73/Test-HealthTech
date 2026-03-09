import { X, Save, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface EditPanelProps {
    content: string;
    onChange: (content: string) => void;
    onDictate: () => void;
    onSave: () => void;
    onCancel: () => void;
}

export const EditPanel = ({ content, onChange, onDictate, onSave, onCancel }: EditPanelProps) => {
    return (
        <div className="border-t border-border bg-secondary/50 p-3 md:p-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between mb-2 md:mb-3">
                <h3 className="text-sm font-semibold text-foreground">Edit Content</h3>
                <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8">
                    <X className="h-4 w-4" />
                </Button>
            </div>
            <Textarea
                value={content}
                onChange={(e) => onChange(e.target.value)}
                className="min-h-[100px] md:min-h-[120px] bg-background border-border resize-none mb-2 md:mb-3"
                placeholder="Enter content..."
            />
            <div className="flex justify-end gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onDictate}
                    className="gap-2 rounded-full h-10 w-10"
                >
                    <Mic className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={onCancel}>
                    <span className="hidden md:inline">Cancel</span>
                    <X className="h-4 w-4 md:hidden" />
                </Button>
                <Button size="sm" onClick={onSave} className="gap-2">
                    <Save className="h-4 w-4" />
                    <span className="hidden md:inline">Save</span>
                </Button>
            </div>
        </div>
    );
}
