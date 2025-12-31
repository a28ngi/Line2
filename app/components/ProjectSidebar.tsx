'use client';

import { Plus } from 'lucide-react';
import { clsx } from 'clsx';
import { Project } from '../types';
import { useState, useEffect } from 'react';

interface ProjectSidebarProps {
    projects: Project[];
    activeProjectId: string;
    onSelectProject: (id: string) => void;
    onAddProject: () => void;
    onRenameProject: (id: string, newName: string) => void;
}

export function ProjectSidebar({ projects, activeProjectId, onSelectProject, onAddProject, onRenameProject }: ProjectSidebarProps) {
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; projectId: string } | null>(null);

    const handleContextMenu = (e: React.MouseEvent, projectId: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, projectId });
    };

    const handleRename = () => {
        if (!contextMenu) return;
        const project = projects.find(p => p.id === contextMenu.projectId);
        if (!project) return;

        const newName = window.prompt("Enter new project name:", project.name);
        if (newName && newName.trim()) {
            onRenameProject(contextMenu.projectId, newName.trim());
        }
        setContextMenu(null);
    };

    // Close menu on click outside
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    return (
        <>
            <div className="w-[72px] bg-slate-900 h-full flex flex-col items-center py-4 gap-3 shrink-0 overflow-y-auto z-20">
                {/* Project List */}
                {projects.map((project) => (
                    <button
                        key={project.id}
                        onClick={() => onSelectProject(project.id)}
                        onContextMenu={(e) => handleContextMenu(e, project.id)}
                        className="group relative flex items-center justify-center shrink-0"
                    >
                        {/* Active Indicator */}
                        <div className={clsx(
                            "absolute left-0 w-1 bg-white rounded-r-full transition-all duration-200",
                            activeProjectId === project.id ? "h-8" : "h-2 scale-0 group-hover:scale-100"
                        )} />

                        {/* Icon */}
                        <div className={clsx(
                            "w-12 h-12 rounded-[24px] flex items-center justify-center text-white font-semibold transition-all duration-200 overflow-hidden",
                            activeProjectId === project.id
                                ? "bg-indigo-600 rounded-[16px]"
                                : "bg-slate-700 group-hover:bg-indigo-600 group-hover:rounded-[16px]"
                        )}
                            style={{ backgroundColor: activeProjectId === project.id ? undefined : project.color }}
                        >
                            {project.name.substring(0, 2).toUpperCase()}
                        </div>

                        {/* Tooltip */}
                        <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                            {project.name}
                        </div>
                    </button>
                ))}

                {/* Separator */}
                <div className="w-8 h-[2px] bg-slate-700 rounded-full mx-auto my-1 shrink-0" />

                {/* Add Project Button */}
                <button
                    onClick={onAddProject}
                    className="group relative flex items-center justify-center w-12 h-12 rounded-[24px] bg-slate-700 text-emerald-500 hover:bg-emerald-600 hover:text-white transition-all duration-200 hover:rounded-[16px] shrink-0"
                >
                    <Plus size={24} />
                    <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                        Add Project
                    </div>
                </button>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="fixed z-50 bg-white shadow-xl rounded-lg py-1 border border-slate-200 w-40 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                >
                    <button
                        className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                        onClick={handleRename}
                    >
                        Rename Project
                    </button>
                </div>
            )}
        </>
    );
}
