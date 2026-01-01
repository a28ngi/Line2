'use client';

import { ChatNode } from '../types';
import { ChevronRight, ChevronDown, MessageSquare, LayoutDashboard } from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';

interface ChatTreeSidebarProps {
    structure: ChatNode[];
    activeNodeId: string | null; // null = Master Chat
    onSelectNode: (nodeId: string | null) => void;
    onToggleCollapse: (nodeId: string) => void;
}

export function ChatTreeSidebar({ structure, activeNodeId, onSelectNode, onToggleCollapse }: ChatTreeSidebarProps) {

    const renderNode = (nodeId: string, depth: number = 0) => {
        const node = structure.find(n => n.id === nodeId);
        if (!node) return null;

        const hasChildren = node.children.length > 0;
        const isActive = activeNodeId === node.id;

        return (
            <div key={node.id} className="select-none">
                <div
                    className={clsx(
                        "flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-colors text-sm mx-2",
                        isActive ? "bg-indigo-100 text-indigo-700 font-medium" : "hover:bg-slate-100 text-slate-600"
                    )}
                    style={{ paddingLeft: `${depth * 12 + 8}px` }}
                    onClick={() => onSelectNode(node.id)}
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleCollapse(node.id); }}
                        className={clsx(
                            "p-0.5 rounded hover:bg-slate-200 transition-colors",
                            hasChildren ? "opacity-100" : "opacity-0 pointer-events-none"
                        )}
                    >
                        {node.isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                    </button>

                    <MessageSquare size={14} className={clsx("shrink-0", isActive ? "text-indigo-500" : "text-slate-400")} />
                    <span className="truncate">{node.label}</span>
                </div>

                {!node.isCollapsed && node.children.length > 0 && (
                    <div className="border-l border-slate-100 ml-4">
                        {node.children.map(childId => renderNode(childId, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    // Root nodes are those with null parentId
    const rootNodes = structure.filter(n => n.parentId === null);

    return (
        <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col h-full flex-shrink-0">
            <div className="p-4 border-b border-slate-100 bg-white/50 backdrop-blur-sm">
                <h2 className="font-semibold text-slate-800 text-sm tracking-tight flex items-center gap-2">
                    <LayoutDashboard size={16} className="text-slate-500" />
                    Explorer
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
                {/* Master Chat (Always Top) */}
                <div
                    className={clsx(
                        "flex items-center gap-2 px-3 py-2 mx-2 rounded-md cursor-pointer text-sm mb-2 font-medium",
                        activeNodeId === null ? "bg-indigo-600 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100"
                    )}
                    onClick={() => onSelectNode(null)}
                >
                    <LayoutDashboard size={16} />
                    <span>Master Chat</span>
                </div>

                <div className="px-2 pb-2">
                    <p className="text-[10px] uppercase font-bold text-slate-400 px-2 mb-1 tracking-wider">Mind Map Chats</p>
                </div>

                {rootNodes.length === 0 ? (
                    <p className="px-4 text-xs text-slate-400 italic">No nodes yet. Generate a mind map to start branching.</p>
                ) : (
                    rootNodes.map(node => renderNode(node.id))
                )}
            </div>
        </div>
    );
}
