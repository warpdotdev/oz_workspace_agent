import { useRef, useState, useCallback } from "react";
import { Tree, type NodeRendererProps } from "react-arborist";
import {
  FileText,
  FolderClosed,
  FolderOpen,
  Brain,
  Sparkles,
  Plus,
  FilePlus,
  FolderPlus,
  Pencil,
  Trash2,
} from "lucide-react";
import { useAppStore } from "../../store/appStore";
import type { FileTreeNode } from "../../types";

// ── Context Menu ──────────────────────────────────────────────────────

interface ContextMenuState {
  x: number;
  y: number;
  nodeId: string;
  isFolder: boolean;
}

function ContextMenu({
  state,
  onClose,
  onNewFile,
  onNewFolder,
  onRename,
  onDelete,
}: {
  state: ContextMenuState;
  onClose: () => void;
  onNewFile: (parentId: string) => void;
  onNewFolder: (parentId: string) => void;
  onRename: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
}) {
  const items = [
    ...(state.isFolder
      ? [
          {
            label: "New File",
            icon: FilePlus,
            action: () => onNewFile(state.nodeId),
          },
          {
            label: "New Folder",
            icon: FolderPlus,
            action: () => onNewFolder(state.nodeId),
          },
          { separator: true as const },
        ]
      : []),
    {
      label: "Rename",
      icon: Pencil,
      action: () => onRename(state.nodeId),
    },
    {
      label: "Delete",
      icon: Trash2,
      action: () => onDelete(state.nodeId),
      destructive: true,
    },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 min-w-[160px] rounded-md border border-border bg-panel p-1 shadow-lg"
        style={{ top: state.y, left: state.x }}
      >
        {items.map((item, i) => {
          if ("separator" in item) {
            return (
              <div key={i} className="my-1 h-px bg-border-subtle" />
            );
          }
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => {
                item.action();
                onClose();
              }}
              className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors ${
                "destructive" in item && item.destructive
                  ? "text-status-errored hover:bg-status-errored/10"
                  : "text-text-secondary hover:bg-surface hover:text-text-primary"
              }`}
            >
              <Icon size={14} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

// ── File Icon Helper ──────────────────────────────────────────────────

function getFileIcon(node: FileTreeNode, isOpen: boolean) {
  if (node.isFolder) {
    if (node.fileType === "memory") {
      return isOpen ? (
        <FolderOpen size={14} className="text-status-deploying shrink-0" />
      ) : (
        <Brain size={14} className="text-status-deploying shrink-0" />
      );
    }
    if (node.fileType === "skill") {
      return isOpen ? (
        <FolderOpen size={14} className="text-accent-text shrink-0" />
      ) : (
        <Sparkles size={14} className="text-accent-text shrink-0" />
      );
    }
    return isOpen ? (
      <FolderOpen size={14} className="text-accent-text shrink-0" />
    ) : (
      <FolderClosed size={14} className="text-text-tertiary shrink-0" />
    );
  }
  // Files
  if (node.fileType === "memory") {
    return <Brain size={14} className="text-status-deploying shrink-0" />;
  }
  if (node.fileType === "skill") {
    return <Sparkles size={14} className="text-accent-text shrink-0" />;
  }
  return <FileText size={14} className="text-text-tertiary shrink-0" />;
}

// ── Node Renderer ─────────────────────────────────────────────────────

function Node({ node, style, dragHandle }: NodeRendererProps<FileTreeNode>) {
  const selectedFileId = useAppStore((s) => s.selectedFileId);
  const setSelectedFileId = useAppStore((s) => s.setSelectedFileId);
  const isSelected = !node.data.isFolder && selectedFileId === node.id;

  const handleClick = () => {
    if (node.data.isFolder) {
      node.toggle();
    } else {
      setSelectedFileId(node.id);
    }
  };

  return (
    <div
      ref={dragHandle}
      style={style}
      className={`flex items-center gap-1.5 rounded-md px-1.5 cursor-pointer select-none transition-colors duration-[var(--transition-fast)] ${
        isSelected
          ? "bg-accent/12 text-text-primary"
          : "text-text-secondary hover:bg-surface hover:text-text-primary"
      }`}
      onClick={handleClick}
    >
      {getFileIcon(node.data, node.isOpen)}
      {node.isEditing ? (
        <input
          type="text"
          defaultValue={node.data.name}
          autoFocus
          className="flex-1 bg-surface border border-accent rounded px-1 py-0 text-sm text-text-primary outline-none min-w-0"
          onBlur={() => node.reset()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              node.submit(e.currentTarget.value);
            }
            if (e.key === "Escape") {
              node.reset();
            }
          }}
        />
      ) : (
        <span className="text-sm truncate">{node.data.name}</span>
      )}
    </div>
  );
}

// ── Helpers for tree mutations ────────────────────────────────────────

function addNodeToTree(
  tree: FileTreeNode[],
  parentId: string,
  newNode: FileTreeNode
): FileTreeNode[] {
  return tree.map((node) => {
    if (node.id === parentId && node.isFolder) {
      return {
        ...node,
        children: [...(node.children || []), newNode],
      };
    }
    if (node.children) {
      return {
        ...node,
        children: addNodeToTree(node.children, parentId, newNode),
      };
    }
    return node;
  });
}

function removeNodeFromTree(
  tree: FileTreeNode[],
  nodeId: string
): FileTreeNode[] {
  return tree
    .filter((node) => node.id !== nodeId)
    .map((node) => ({
      ...node,
      children: node.children
        ? removeNodeFromTree(node.children, nodeId)
        : undefined,
    }));
}

function renameNodeInTree(
  tree: FileTreeNode[],
  nodeId: string,
  newName: string
): FileTreeNode[] {
  return tree.map((node) => {
    if (node.id === nodeId) {
      return { ...node, name: newName };
    }
    if (node.children) {
      return {
        ...node,
        children: renameNodeInTree(node.children, nodeId, newName),
      };
    }
    return node;
  });
}

// ── Main FileTree Component ───────────────────────────────────────────

export function FileTree() {
  const selectedAgentId = useAppStore((s) => s.selectedAgentId);
  const fileTreeByAgent = useAppStore((s) => s.fileTreeByAgent);
  const setFileTree = useAppStore((s) => s.setFileTree);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(
    null
  );
  const treeRef = useRef<any>(null);

  const treeData = selectedAgentId
    ? fileTreeByAgent[selectedAgentId] || []
    : [];

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, nodeId: string, isFolder: boolean) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, nodeId, isFolder });
    },
    []
  );

  const handleNewFile = useCallback(
    (parentId: string) => {
      if (!selectedAgentId) return;
      const id = `${parentId}-file-${Date.now()}`;
      const newNode: FileTreeNode = {
        id,
        name: "untitled.md",
        isFolder: false,
        fileType: "markdown",
      };
      const updated = addNodeToTree(treeData, parentId, newNode);
      setFileTree(selectedAgentId, updated);
      // Start rename after a tick
      setTimeout(() => {
        const api = treeRef.current;
        if (api) {
          api.edit(id);
        }
      }, 50);
    },
    [selectedAgentId, treeData, setFileTree]
  );

  const handleNewFolder = useCallback(
    (parentId: string) => {
      if (!selectedAgentId) return;
      const id = `${parentId}-folder-${Date.now()}`;
      const newNode: FileTreeNode = {
        id,
        name: "new-folder",
        isFolder: true,
        children: [],
      };
      const updated = addNodeToTree(treeData, parentId, newNode);
      setFileTree(selectedAgentId, updated);
      setTimeout(() => {
        const api = treeRef.current;
        if (api) {
          api.edit(id);
        }
      }, 50);
    },
    [selectedAgentId, treeData, setFileTree]
  );

  const handleRename = useCallback(
    (nodeId: string) => {
      const api = treeRef.current;
      if (api) {
        api.edit(nodeId);
      }
    },
    []
  );

  const handleDelete = useCallback(
    (nodeId: string) => {
      if (!selectedAgentId) return;
      const updated = removeNodeFromTree(treeData, nodeId);
      setFileTree(selectedAgentId, updated);
    },
    [selectedAgentId, treeData, setFileTree]
  );

  const handleRenameSubmit = useCallback(
    ({ id, name }: { id: string; name: string }) => {
      if (!selectedAgentId) return;
      const updated = renameNodeInTree(treeData, id, name);
      setFileTree(selectedAgentId, updated);
    },
    [selectedAgentId, treeData, setFileTree]
  );

  if (!selectedAgentId) return null;

  if (treeData.length === 0) {
    return (
      <div className="px-2 py-4 text-center text-xs text-text-tertiary">
        No files yet
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
          Files
        </span>
        <button
          onClick={() => {
            // Create file in the first folder (markdown)
            if (treeData.length > 0 && treeData[0].isFolder) {
              handleNewFile(treeData[0].id);
            }
          }}
          className="p-0.5 rounded hover:bg-surface text-text-tertiary hover:text-text-secondary transition-colors duration-[var(--transition-fast)]"
          title="New file"
        >
          <Plus size={14} />
        </button>
      </div>
      <div
        onContextMenu={(e) => {
          // Get the node from the clicked element
          const target = e.target as HTMLElement;
          const row = target.closest("[data-testid]");
          if (row) {
            const nodeId = row.getAttribute("data-testid");
            if (nodeId) {
              // Determine if it's a folder by checking the tree data
              const findNode = (
                nodes: FileTreeNode[],
                id: string
              ): FileTreeNode | null => {
                for (const n of nodes) {
                  if (n.id === id) return n;
                  if (n.children) {
                    const found = findNode(n.children, id);
                    if (found) return found;
                  }
                }
                return null;
              };
              const node = findNode(treeData, nodeId);
              if (node) {
                handleContextMenu(e, nodeId, node.isFolder);
              }
            }
          }
        }}
      >
        <Tree<FileTreeNode>
          ref={treeRef}
          data={treeData}
          openByDefault={false}
          initialOpenState={{
            // Open the markdown folder by default, collapse memory and skills
            ...(selectedAgentId
              ? {
                  [`${selectedAgentId}-markdown`]: true,
                  [`${selectedAgentId}-memory`]: false,
                  [`${selectedAgentId}-skills`]: false,
                }
              : {}),
          }}
          width="100%"
          height={treeData.length * 32 + 100}
          indent={16}
          rowHeight={32}
          paddingTop={0}
          paddingBottom={8}
          disableDrag
          disableDrop
          onRename={handleRenameSubmit}
          renderRow={({ node, attrs, innerRef, children }) => (
            <div
              {...attrs}
              ref={innerRef}
              data-testid={node.id}
              className="flex items-center"
            >
              {children}
            </div>
          )}
        >
          {Node}
        </Tree>
      </div>

      {contextMenu && (
        <ContextMenu
          state={contextMenu}
          onClose={() => setContextMenu(null)}
          onNewFile={handleNewFile}
          onNewFolder={handleNewFolder}
          onRename={handleRename}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
