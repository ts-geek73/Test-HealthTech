import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Bold,
    Heading1,
    Heading2,
    Italic,
    List,
    ListOrdered,
    Quote,
    Redo,
    Underline,
    Undo,
} from "lucide-react";

interface DraftSummaryToolbarProps {
  editor: any;
}

const TooltipButton = ({
  icon: Icon,
  label,
  onClick,
  active = false,
  disabled = false,
}: {
  icon: any;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant={active ? "secondary" : "ghost"}
        size="sm"
        onClick={onClick}
        disabled={disabled}
        className={`h-8 w-8 p-0 ${active ? "bg-primary/10 text-primary" : ""}`}
      >
        <Icon className="h-4 w-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent side="top">
      <p className="text-xs">{label}</p>
    </TooltipContent>
  </Tooltip>
);

const DraftSummaryToolbar = ({ editor }: DraftSummaryToolbarProps) => {
  return (
    <div className="flex items-center justify-center gap-1">
      <div className="flex items-center bg-card/50 rounded-lg border p-0.5 gap-0.5 shadow-sm">
        <TooltipButton
          icon={Undo}
          label="Undo"
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!editor?.can().undo()}
        />
        <TooltipButton
          icon={Redo}
          label="Redo"
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={!editor?.can().redo()}
        />
      </div>

      <div className="w-[1px] h-4 bg-border mx-1" />

      <div className="flex items-center bg-card/50 rounded-lg border p-0.5 gap-0.5 shadow-sm">
        <TooltipButton
          icon={Bold}
          label="Bold"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          active={editor?.isActive("bold")}
        />
        <TooltipButton
          icon={Italic}
          label="Italic"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          active={editor?.isActive("italic")}
        />
        <TooltipButton
          icon={Underline}
          label="Underline"
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          active={editor?.isActive("underline")}
        />
      </div>

      <div className="w-[1px] h-4 bg-border mx-1" />

      <div className="flex items-center bg-card/50 rounded-lg border p-0.5 gap-0.5 shadow-sm">
        <TooltipButton
          icon={Heading1}
          label="Heading 1"
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 1 }).run()
          }
          active={editor?.isActive("heading", { level: 1 })}
        />
        <TooltipButton
          icon={Heading2}
          label="Heading 2"
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 2 }).run()
          }
          active={editor?.isActive("heading", { level: 2 })}
        />
        <TooltipButton
          icon={Quote}
          label="Blockquote"
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          active={editor?.isActive("blockquote")}
        />
      </div>

      <div className="w-[1px] h-4 bg-border mx-1" />

      <div className="flex items-center bg-card/50 rounded-lg border p-0.5 gap-0.5 shadow-sm">
        <TooltipButton
          icon={List}
          label="Bullet List"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          active={editor?.isActive("bulletList")}
        />
        <TooltipButton
          icon={ListOrdered}
          label="Numbered List"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          active={editor?.isActive("orderedList")}
        />
      </div>
    </div>
  );
};

export default DraftSummaryToolbar;
