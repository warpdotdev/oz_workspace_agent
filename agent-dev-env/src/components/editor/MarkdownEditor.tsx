import React, { useEffect, useCallback, useRef, useState, useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { EditorView } from "@codemirror/view";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import matter from "gray-matter";
import {
  Bold,
  Italic,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Link2,
  Image,
  Eye,
  EyeOff,
  FileEdit,
} from "lucide-react";
import { useAppStore } from "../../store/appStore";
import { filesApi, type UpdateFileInput } from "../../lib/api";
import { SlashCommand } from "./SlashCommand";

// Debounce hook for autosave
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface ToolbarButtonProps {
  icon: React.ElementType;
  title: string;
  onClick: () => void;
  active?: boolean;
}

function ToolbarButton({ icon: Icon, title, onClick, active }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-md transition-colors duration-[var(--transition-fast)] ${
        active
          ? "bg-primary text-white"
          : "text-text-tertiary hover:text-text-secondary hover:bg-surface"
      }`}
    >
      <Icon size={18} />
    </button>
  );
}

function ToolbarSeparator() {
  return <div className="w-px h-5 bg-border-subtle" />;
}

export function MarkdownEditor() {
  const selectedFileId = useAppStore((s) => s.selectedFileId);
  const editorContent = useAppStore((s) => s.editorContent);
  const setEditorContent = useAppStore((s) => s.setEditorContent);
  const previewMode = useAppStore((s) => s.previewMode);
  const setPreviewMode = useAppStore((s) => s.setPreviewMode);

  const editorRef = useRef<HTMLDivElement>(null);
  const hasLoadedFile = useRef(false);
  const lastSavedContent = useRef("");
  
  // Slash command state
  const [slashCommandOpen, setSlashCommandOpen] = useState(false);
  const [slashCommandPosition, setSlashCommandPosition] = useState({ top: 0, left: 0 });
  const [slashCommandQuery, setSlashCommandQuery] = useState("");
  const [slashCommandStartPos, setSlashCommandStartPos] = useState(0);

  // Debounced content for autosave
  const debouncedContent = useDebounce(editorContent, 2000);

  // Load file content when selectedFileId changes
  useEffect(() => {
    if (selectedFileId && !hasLoadedFile.current) {
      // TODO: Load file content from database when worker-4 provides file tree
      // For now, set placeholder content
      const placeholderContent = `---
title: Agent Skill
description: Edit your agent's skill file
version: 1.0.0
---

# Agent Skill

Write your agent's skill here...
`;
      setEditorContent(placeholderContent);
      lastSavedContent.current = placeholderContent;
      hasLoadedFile.current = true;
    }
  }, [selectedFileId, setEditorContent]);

  // Reset when file changes
  useEffect(() => {
    hasLoadedFile.current = false;
  }, [selectedFileId]);

  // Autosave effect
  useEffect(() => {
    if (
      selectedFileId &&
      debouncedContent &&
      debouncedContent !== lastSavedContent.current
    ) {
      const saveFile = async () => {
        try {
          const input: UpdateFileInput = {
            content: debouncedContent,
          };
          await filesApi.update(selectedFileId, input);
          lastSavedContent.current = debouncedContent;
          console.log("File saved automatically");
        } catch (error) {
          console.error("Failed to save file:", error);
        }
      };
      saveFile();
    }
  }, [debouncedContent, selectedFileId]);

  const handleEditorChange = useCallback(
    (value: string) => {
      setEditorContent(value);
      
      // Detect slash command trigger
      const textarea = editorRef.current?.querySelector("textarea");
      if (!textarea) return;
      
      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = value.substring(0, cursorPos);
      const lastSlashIndex = textBeforeCursor.lastIndexOf("/");
      
      // Check if we just typed a slash at the start of a line or after whitespace
      if (lastSlashIndex !== -1) {
        const charBeforeSlash = textBeforeCursor[lastSlashIndex - 1];
        const isValidSlashPosition = !charBeforeSlash || charBeforeSlash === "\n" || /\s/.test(charBeforeSlash);
        
        if (isValidSlashPosition) {
          const query = textBeforeCursor.substring(lastSlashIndex + 1);
          // Only show if there's no whitespace after the slash
          if (!/\s/.test(query)) {
            setSlashCommandQuery(query);
            setSlashCommandStartPos(lastSlashIndex);
            
            // Calculate position for the menu
            const rect = textarea.getBoundingClientRect();
            setSlashCommandPosition({
              top: rect.top + 30,
              left: rect.left + 10,
            });
            setSlashCommandOpen(true);
            return;
          }
        }
      }
      
      // Close slash command if conditions aren't met
      if (slashCommandOpen) {
        setSlashCommandOpen(false);
      }
    },
    [setEditorContent, slashCommandOpen]
  );
  
  const handleSlashCommandSelect = useCallback(
    (insertText: string) => {
      // Replace the slash and query with the inserted text
      const newContent =
        editorContent.substring(0, slashCommandStartPos) +
        insertText +
        editorContent.substring(slashCommandStartPos + slashCommandQuery.length + 1);
      
      setEditorContent(newContent);
      setSlashCommandOpen(false);
      
      // Focus back on the editor
      setTimeout(() => {
        const textarea = editorRef.current?.querySelector("textarea");
        if (textarea) {
          textarea.focus();
          const newCursorPos = slashCommandStartPos + insertText.length;
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    },
    [editorContent, slashCommandStartPos, slashCommandQuery, setEditorContent]
  );

  // Toolbar actions
  const insertMarkdown = useCallback(
    (before: string, after = "", placeholder = "") => {
      const textarea = editorRef.current?.querySelector("textarea");
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = editorContent.substring(start, end);
      const text = selectedText || placeholder;
      const newContent =
        editorContent.substring(0, start) +
        before +
        text +
        after +
        editorContent.substring(end);

      setEditorContent(newContent);

      // Set cursor position after insertion
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + before.length + text.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [editorContent, setEditorContent]
  );

  const toggleBold = () => insertMarkdown("**", "**", "bold text");
  const toggleItalic = () => insertMarkdown("*", "*", "italic text");
  const toggleCode = () => insertMarkdown("`", "`", "code");
  const insertHeading1 = () => insertMarkdown("# ", "", "Heading 1");
  const insertHeading2 = () => insertMarkdown("## ", "", "Heading 2");
  const insertHeading3 = () => insertMarkdown("### ", "", "Heading 3");
  const insertLink = () => insertMarkdown("[", "](url)", "link text");
  const insertImage = () => insertMarkdown("![", "](url)", "alt text");

  // Parse frontmatter and content for preview
  const { data: frontmatter, content: markdownContent } = matter(editorContent);

  // Custom CodeMirror theme extension
  const editorTheme = useMemo(
    () =>
      EditorView.theme({
        "&": {
          backgroundColor: "#141415",
          color: "#E5E5E5",
          fontFamily: "JetBrains Mono, monospace",
          fontSize: "14px",
        },
        ".cm-content": {
          caretColor: "#6E56CF",
        },
        "&.cm-focused .cm-cursor": {
          borderLeftColor: "#6E56CF",
        },
        "&.cm-focused .cm-selectionBackground, ::selection": {
          backgroundColor: "rgba(110, 86, 207, 0.2)",
        },
        ".cm-activeLine": {
          backgroundColor: "rgba(255, 255, 255, 0.02)",
        },
        ".cm-gutters": {
          backgroundColor: "#0A0A0B",
          color: "#4A4A4D",
          border: "none",
        },
        ".cm-activeLineGutter": {
          backgroundColor: "rgba(255, 255, 255, 0.02)",
          color: "#E5E5E5",
        },
      }),
    []
  );

  if (!selectedFileId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-text-tertiary gap-3">
        <FileEdit size={48} strokeWidth={1} className="text-border" />
        <div className="text-center">
          <p className="text-text-secondary font-medium">Markdown Editor</p>
          <p className="text-sm mt-1">Select a file to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-panel">
      {/* Slash Command Menu */}
      {slashCommandOpen && (
        <SlashCommand
          position={slashCommandPosition}
          onSelect={handleSlashCommandSelect}
          onClose={() => setSlashCommandOpen(false)}
          searchQuery={slashCommandQuery}
        />
      )}
      
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border-subtle bg-panel shrink-0">
        <ToolbarButton icon={Bold} title="Bold (Cmd+B)" onClick={toggleBold} />
        <ToolbarButton icon={Italic} title="Italic (Cmd+I)" onClick={toggleItalic} />
        <ToolbarButton icon={Code2} title="Code (Cmd+E)" onClick={toggleCode} />
        <ToolbarSeparator />
        <ToolbarButton icon={Heading1} title="Heading 1" onClick={insertHeading1} />
        <ToolbarButton icon={Heading2} title="Heading 2" onClick={insertHeading2} />
        <ToolbarButton icon={Heading3} title="Heading 3" onClick={insertHeading3} />
        <ToolbarSeparator />
        <ToolbarButton icon={Link2} title="Insert Link" onClick={insertLink} />
        <ToolbarButton icon={Image} title="Insert Image" onClick={insertImage} />
        <div className="flex-1" />
        <ToolbarButton
          icon={previewMode ? EyeOff : Eye}
          title={previewMode ? "Hide Preview (Cmd+Shift+M)" : "Show Preview (Cmd+Shift+M)"}
          onClick={() => setPreviewMode(!previewMode)}
          active={previewMode}
        />
      </div>

      {/* Editor / Preview Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Pane */}
        <div
          ref={editorRef}
          className={`${previewMode ? "w-1/2 border-r border-border-subtle" : "w-full"} overflow-auto`}
        >
          <CodeMirror
            value={editorContent}
            height="100%"
            extensions={[markdown(), editorTheme]}
            onChange={handleEditorChange}
            theme="dark"
            basicSetup={{
              lineNumbers: true,
              highlightActiveLineGutter: true,
              highlightActiveLine: true,
              bracketMatching: true,
              closeBrackets: true,
              autocompletion: true,
              highlightSelectionMatches: true,
            }}
          />
        </div>

        {/* Preview Pane */}
        {previewMode && (
          <div className="w-1/2 overflow-auto p-6 bg-base prose prose-invert prose-violet max-w-none">
            {/* Frontmatter Display */}
            {Object.keys(frontmatter).length > 0 && (
              <div className="mb-6 p-4 bg-elevated rounded-md border border-border-subtle">
                <h4 className="text-xs font-semibold text-text-tertiary uppercase mb-2">
                  Frontmatter
                </h4>
                <div className="space-y-1">
                  {Object.entries(frontmatter).map(([key, value]) => (
                    <div key={key} className="flex gap-2 text-sm">
                      <span className="text-text-tertiary font-mono">{key}:</span>
                      <span className="text-text-secondary">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Markdown Content */}
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {markdownContent}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
