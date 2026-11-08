import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile, Send, Loader2, Type } from "lucide-react";
import EmojiPickerComponent from "@/components/emoji-picker";
import LexicalEditor, {
  isLexicalStateEmpty,
  extractMentionsFromLexicalState,
  extractPlainTextFromLexical,
} from "@/lib/lexical";

interface CommentInputProps {
  taskId?: string;
  workspaceId?: string;
  parentId?: string | null;
  placeholder?: string;
  initialContent?: any;
  submitLabel?: string;
  isSubmitting?: boolean;
  onCancel?: () => void;
  onSubmit: (data: {
    content: any; // Lexical JSON AST object
    parentId?: string | null;
    mentions?: string[];
  }) => Promise<void> | void;
  members?: Array<{
    _id: string;
    name: string;
    profilePicture?: string | null;
    email?: string;
  }>;
}

export const CommentInput: React.FC<CommentInputProps> = React.memo(({
  parentId = null,
  placeholder = "Write a comment or type '@' to mention...",
  initialContent = null,
  submitLabel = "Post",
  isSubmitting = false,
  onCancel,
  onSubmit,
  members = [],
}) => {
  const [content, setContent] = useState<any>(initialContent);
  const [showToolbar, setShowToolbar] = useState(false);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const mentionOptions = useMemo(
    () =>
      members.map((m) => ({
        id: m._id,
        name: m.name,
        avatar: m.profilePicture,
        email: m.email,
      })),
    [members]
  );

  const handleSubmit = async () => {
    if (isSubmitting || isLexicalStateEmpty(content)) return;

    // 1. Extract mentions from Lexical JSON AST nodes
    const lexicalMentions = extractMentionsFromLexicalState(content);

    // 2. Also check if any member name was typed as @Name in plain text
    const plainText = extractPlainTextFromLexical(content);
    const textMentions: string[] = [];
    members.forEach((m) => {
      if (plainText.includes(`@${m.name}`)) {
        textMentions.push(m._id);
      }
    });

    const combinedMentions = Array.from(
      new Set([...lexicalMentions, ...textMentions])
    );

    await onSubmit({
      content,
      parentId,
      mentions: combinedMentions,
    });

    if (!initialContent) {
      setContent(null);
    }
  };

  const handleSelectEmoji = (emoji: string) => {
    // If content is empty or string, append
    if (!content || typeof content === "string") {
      setContent((prev: any) => (prev ? prev + emoji : emoji));
    } else {
      // If content is Lexical JSON object, append emoji as a paragraph text node
      try {
        const cloned = JSON.parse(JSON.stringify(content));
        const root = cloned.root;
        if (root && Array.isArray(root.children)) {
          let lastBlock = root.children[root.children.length - 1];
          if (!lastBlock || lastBlock.type !== "paragraph") {
            lastBlock = {
              type: "paragraph",
              format: "",
              indent: 0,
              version: 1,
              children: [],
            };
            root.children.push(lastBlock);
          }
          lastBlock.children.push({
            type: "text",
            text: emoji,
            format: 0,
            detail: 0,
            mode: "normal",
            style: "",
            version: 1,
          });
          setContent(cloned);
        }
      } catch {
        // Fallback
      }
    }
    setIsEmojiOpen(false);
  };

  const isEmpty = isLexicalStateEmpty(content);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border/70 bg-card p-2.5 shadow-xs focus-within:border-primary/60 transition-colors">
      {/* Lexical Rich Text Editor */}
      <LexicalEditor
        value={content}
        onChange={setContent}
        outputFormat="json"
        placeholder={placeholder}
        mentionOptions={mentionOptions}
        showToolbar={showToolbar}
        onSubmitShortcut={handleSubmit}
        className="lx-compact border-0 shadow-none"
      />

      {/* Footer Toolbar & Actions */}
      <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
        <div className="flex items-center gap-1">
          {/* Formatting Toolbar Toggle */}
          <Button
            type="button"
            variant={showToolbar ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setShowToolbar((prev) => !prev)}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            title="Toggle formatting toolbar"
          >
            <Type className="h-3.5 w-3.5" />
          </Button>

          {/* Emoji Picker */}
          <Popover open={isEmojiOpen} onOpenChange={setIsEmojiOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                title="Add emoji"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="start"
              className="w-auto p-0 border-0 bg-transparent shadow-none z-50"
            >
              <EmojiPickerComponent onSelectEmoji={handleSelectEmoji} />
            </PopoverContent>
          </Popover>

          <span className="text-[10px] text-muted-foreground/60 ml-2 hidden sm:inline">
            Ctrl + Enter to post · @ to mention
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
              className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            disabled={isEmpty || isSubmitting}
            onClick={() => handleSubmit()}
            className="h-7 px-3 text-xs gap-1.5"
          >
            {isSubmitting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Send className="h-3 w-3" />
            )}
            <span>{submitLabel}</span>
          </Button>
        </div>
      </div>
    </div>
  );
});

CommentInput.displayName = "CommentInput";

export default CommentInput;
