import SignoffFooter from "@/pages/draft-summary/SignoffFooter";
import type { SignoffData } from "@/providers/DraftProvider";
import Heading from "@tiptap/extension-heading";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { EditorContent, ReactNodeViewRenderer, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import HeadingNodeView from "./HeadingNodeView";
import { SelectionContext } from "./SelectionContext";

interface RichtextEditorProps {
  content: string;
  onChange: (content: string) => void;
  onEditorReady: (editor: any) => void;
  onDocChanged?: () => void;
  isPreparing?: boolean;
  selectedSectionId?: string | null;
  onSectionSelect?: (id: string | null) => void;
  editable?: boolean;
  signoff?: SignoffData | null;
  signedBy?: string;
  isCurrent: boolean;
}

const HeadingWithId = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      "data-section-id": {
        default: null,
        parseHTML: (element) => element.getAttribute("data-section-id") ?? null,
        renderHTML: (attributes) => {
          if (!attributes["data-section-id"]) return {};
          return {
            "data-section-id": attributes["data-section-id"],
          };
        },
      },

      "data-section-position": {
        default: null,
        parseHTML: (element) =>
          element.getAttribute("data-section-position") ?? null,
        renderHTML: (attributes) => {
          if (!attributes["data-section-position"]) return {};
          return {
            "data-section-position": attributes["data-section-position"],
          };
        },
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(HeadingNodeView);
  },
});

const RichtextEditor = ({
  content,
  onChange,
  onEditorReady,
  onDocChanged,
  isPreparing = false,
  selectedSectionId = null,
  onSectionSelect = () => {},
  editable = true,
  signoff,
  signedBy,
  isCurrent,
}: RichtextEditorProps) => {
  const editor = useEditor({
    editable: editable && !isPreparing,

    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      HeadingWithId.configure({
        levels: [1, 2, 3, 4],
      }),
      Underline,
      Placeholder.configure({
        placeholder: "Capture your clinical summary...",
      }),
    ],
    content,

    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
      onDocChanged?.();
    },

    editorProps: {
      attributes: {
        class:
          "prose prose-slate max-w-none text-base md:text-lg leading-relaxed text-foreground outline-none min-h-[500px] [&_li::marker]:text-foreground",
      },
    },
  });

  useEffect(() => {
    if (editor) onEditorReady(editor);
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editable && !isPreparing);
  }, [editor, editable, isPreparing]);

  return (
    <div className="relative w-full">
      <SelectionContext.Provider
        value={{ selectedSectionId, setSelectedSectionId: onSectionSelect }}
      >
        <style>{`
          .heading-with-edit {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 8px 12px;
            margin: -8px -12px;
            border-radius: 8px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
          }
          @media (max-width: 640px) {
            .heading-with-edit {
              gap: 8px;
              padding: 4px 8px;
              margin: -4px -8px;
            }
            .prose p {
              margin-top: 0.5em !important;
              margin-bottom: 0.5em !important;
            }
            .prose ul, .prose ol {
              margin-top: 0.5em !important;
              margin-bottom: 0.5em !important;
              padding-left: 1.1em !important;
            }
            .prose li > ul,
            .prose li > ol {
              padding-left: 0.5rem !important;
            }
            .prose li {
              margin-top: 0.2em !important;
              margin-bottom: 0.2em !important;
            }
            .prose li > p {
              margin: 0 !important;
            }
          }
          .heading-with-edit.selected-section {
            background-color: var(--accent, rgba(155, 114, 203, 0.05));
            box-shadow: 0 0 0 1px var(--primary, rgba(155, 114, 203, 0.2));
          }
          .heading-content {
            flex: 1;
            line-height: inherit;
          }
          .heading-edit-btn {
            opacity: 0;
            transition: all 0.2s ease;
            background: none;
            border: none;
            cursor: pointer;
            padding: 2px;
            margin-top: 4px; /* Align with first line of text */
            border-radius: 6px;
            color: var(--muted-foreground, #64748b);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .heading-edit-btn:hover {
            color: var(--foreground, #333);
            background: var(--accent, rgba(0,0,0,0.06));
          }
          .heading-with-edit:hover .heading-edit-btn {
            opacity: 1;
          }
          .heading-with-edit.selected-section .heading-edit-btn {
            opacity: 1;
            color: var(--primary, #9B72CB);
          }
        `}</style>

        {isPreparing && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
              Fetching summary...
            </div>
          </div>
        )}

        <EditorContent editor={editor} />
      </SelectionContext.Provider>

      {signoff && isCurrent && (
        <SignoffFooter signoff={signoff} signedBy={signedBy} />
      )}
    </div>
  );
};

export default RichtextEditor;
