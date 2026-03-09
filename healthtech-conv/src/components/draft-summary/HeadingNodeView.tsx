import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import GeminiIcon from "./GeminiIcon";
import { useSelection } from "./SelectionContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

const HeadingNodeView = ({ node }: { node: any }) => {
    const level = node.attrs.level || 3;
    const sectionId = node.attrs["data-section-id"];
    const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

    const { selectedSectionId, setSelectedSectionId } = useSelection();
    const isSelected = selectedSectionId === sectionId;

    const handleEditClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (sectionId) {
            console.log("Section ID selected:", sectionId);
            setSelectedSectionId(sectionId);
        }
    };

    return (
        <NodeViewWrapper
            as={Tag}
            data-section-id={sectionId ?? undefined}
            className={`heading-with-edit ${isSelected ? "selected-section" : ""}`}
        >
            <NodeViewContent as={"span" as any} className="heading-content" />

            {sectionId && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            contentEditable={false}
                            suppressContentEditableWarning
                            className="heading-edit-btn"
                            onClick={handleEditClick}
                            aria-label={`Edit section ${sectionId}`}
                        >
                            <GeminiIcon isSelected={isSelected} size={30} />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-popover text-popover-foreground border shadow-md">
                        {isSelected
                            ? "AI editing enabled for this section"
                            : "Click to select and use AI on this section"}
                    </TooltipContent>
                </Tooltip>
            )}
        </NodeViewWrapper>
    );
};

export default HeadingNodeView;
