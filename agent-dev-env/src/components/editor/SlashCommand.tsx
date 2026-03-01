import React, { useState, useEffect, useRef } from "react";
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code2,
  Table,
  CheckSquare,
  Quote,
} from "lucide-react";

interface SlashCommandItem {
  id: string;
  label: string;
  icon: React.ElementType;
  insertText: string;
  description: string;
}

const commands: SlashCommandItem[] = [
  {
    id: "h1",
    label: "Heading 1",
    icon: Heading1,
    insertText: "# ",
    description: "Large section heading",
  },
  {
    id: "h2",
    label: "Heading 2",
    icon: Heading2,
    insertText: "## ",
    description: "Medium section heading",
  },
  {
    id: "h3",
    label: "Heading 3",
    icon: Heading3,
    insertText: "### ",
    description: "Small section heading",
  },
  {
    id: "ul",
    label: "Bullet List",
    icon: List,
    insertText: "- ",
    description: "Create a bulleted list",
  },
  {
    id: "ol",
    label: "Numbered List",
    icon: ListOrdered,
    insertText: "1. ",
    description: "Create a numbered list",
  },
  {
    id: "code",
    label: "Code Block",
    icon: Code2,
    insertText: "```\n\n```",
    description: "Insert a code block",
  },
  {
    id: "table",
    label: "Table",
    icon: Table,
    insertText: "| Column 1 | Column 2 |\n| -------- | -------- |\n| Cell 1   | Cell 2   |",
    description: "Insert a table",
  },
  {
    id: "todo",
    label: "Todo List",
    icon: CheckSquare,
    insertText: "- [ ] ",
    description: "Create a todo item",
  },
  {
    id: "quote",
    label: "Quote",
    icon: Quote,
    insertText: "> ",
    description: "Insert a blockquote",
  },
];

interface SlashCommandProps {
  position: { top: number; left: number };
  onSelect: (insertText: string) => void;
  onClose: () => void;
  searchQuery: string;
}

export function SlashCommand({
  position,
  onSelect,
  onClose,
  searchQuery,
}: SlashCommandProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmd.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          onSelect(filteredCommands[selectedIndex].insertText);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, filteredCommands, onSelect, onClose]);

  if (filteredCommands.length === 0) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-72 bg-panel border border-border-subtle rounded-lg shadow-xl overflow-hidden"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <div className="max-h-80 overflow-y-auto">
        {filteredCommands.map((cmd, index) => {
          const Icon = cmd.icon;
          return (
            <button
              key={cmd.id}
              onClick={() => onSelect(cmd.insertText)}
              className={`w-full flex items-start gap-3 px-3 py-2 text-left transition-colors ${
                index === selectedIndex
                  ? "bg-surface text-text-primary"
                  : "text-text-secondary hover:bg-surface/50"
              }`}
            >
              <Icon size={18} className="mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{cmd.label}</div>
                <div className="text-xs text-text-tertiary">{cmd.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
