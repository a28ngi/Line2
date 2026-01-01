'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatPanel } from './components/ChatPanel';
import { AIBoard } from './components/AIBoard'; // Keep for legacy/logic reusing if needed
import { GeminiChat, ChatMessage } from './components/GeminiChat';
import { SettingsModal } from './components/SettingsModal';
import { ProjectSidebar } from './components/ProjectSidebar';
import { ChatTreeSidebar } from './components/ChatTreeSidebar'; // New
import { InteractiveMap } from './components/InteractiveMap'; // New
import { Message, AIState, Project, ProjectData, ChatNode } from './types';
import { LayoutDashboard, MessageSquareText, GripVertical, Cloud, CloudOff } from 'lucide-react';
import { clsx } from 'clsx';
import { useSupabase } from '@/hooks/useSupabase';

const INITIAL_AI_STATE: AIState = {
    summary: [],
    todos: [],
    suggestions: "Waiting for conversation to start...",
    mindmap: null,
    structure: [],
};

const DEFAULT_PROJECT_ID = 'default';

export default function Home() {
    // --- State ---
    const [activeNodeId, setActiveNodeId] = useState<string | null>(null); // null = Master Chat
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Split View State
    const [splitPos, setSplitPos] = useState(40); // Chat width percentage
    const isResizing = useRef(false);

    // Settings State
    const [apiKey, setApiKey] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [chatSystemPrompt, setChatSystemPrompt] = useState('');
    const [model, setModel] = useState('gemini-1.5-flash');
    const [language, setLanguage] = useState<'jp' | 'en'>('jp');

    // Load Settings
    useEffect(() => {
        const storedKey = localStorage.getItem('gemini_api_key'); if (storedKey) setApiKey(storedKey);
        const storedPrompt = localStorage.getItem('gemini_system_prompt'); if (storedPrompt) setSystemPrompt(storedPrompt);
        const storedChatPrompt = localStorage.getItem('gemini_chat_system_prompt'); if (storedChatPrompt) setChatSystemPrompt(storedChatPrompt);
        const storedModel = localStorage.getItem('gemini_model'); if (storedModel) setModel(storedModel);
        const storedLang = localStorage.getItem('gemini_language') as 'jp' | 'en'; if (storedLang) setLanguage(storedLang);
    }, []);

    // Supabase Hook
    const {
        isConnected,
        projects,
        activeProjectId,
        setActiveProjectId,
        currentMessages,
        currentGeminiMessages,
        currentAIState,
        createProject,
        renameProject,
        sendMessage,
        sendReaction,
        deleteMessage,
        sendGeminiMessage,
        updateAIState
    } = useSupabase([{ id: DEFAULT_PROJECT_ID, name: 'My Project', color: '#6366f1' }]);

    // --- Derived State ---
    const viewMessages = currentMessages.filter(msg => {
        if (activeNodeId === null) return !msg.nodeId; // Master Chat has no nodeId (or null)
        return msg.nodeId === activeNodeId;
    });

    // --- Handlers ---

    // Chat
    const handleSendMessage = (msg: Message, replyToId?: string | null) => {
        // Inject current nodeId
        const msgWithNode = { ...msg, nodeId: activeNodeId };
        sendMessage(activeProjectId, msgWithNode);

        // If in Master Chat, trigger AI analysis (Simulation for MVP)
        // In reality, this would check if the message asks to "create mind map"
    };

    // Node & Tree Management
    const handleSelectNode = (nodeId: string | null) => {
        setActiveNodeId(nodeId);
    };

    const handleToggleCollapse = (nodeId: string) => {
        const newStructure = currentAIState.structure.map(n =>
            n.id === nodeId ? { ...n, isCollapsed: !n.isCollapsed } : n
        );
        updateAIState(activeProjectId, { ...currentAIState, structure: newStructure });
    };

    const handleStructureChange = (newStructure: ChatNode[]) => {
        updateAIState(activeProjectId, { ...currentAIState, structure: newStructure });
    };

    const handleNodeClick = (nodeId: string) => {
        setActiveNodeId(nodeId);
    };

    // Mock Mind Map Generation
    const handleRunMindMap = () => {
        if (currentAIState.structure.length === 0) {
            // Initial Tree Generation
            const root1 = Date.now().toString();

            const newNodes: ChatNode[] = [
                { id: root1, label: 'Central Idea', parentId: null, children: [], isCollapsed: false, position: { x: 0, y: 0 } },
            ];
            updateAIState(activeProjectId, { ...currentAIState, structure: newNodes, mindmap: 'generated' });

            // Initial System Message for Root
            const sysMsg: Message = {
                id: Date.now().toString(),
                sender: 'partner', // System/Partner
                text: "Discuss the central idea here. Click 'Add Node' to branch out.",
                timestamp: new Date().toLocaleString(),
                nodeId: root1
            };
            handleSendMessage(sysMsg, null); // Utilize existing handler logic but with specific nodeId

        } else {
            // Add a random node to current active node or root
            const parentId = activeNodeId;
            if (!parentId) {
                alert("Select a node to branch from.");
                return;
            }

            const parentNode = currentAIState.structure.find(n => n.id === parentId);
            const parentContext = parentNode ? `Context from ${parentNode.label}` : "Root Context";

            const newId = Date.now().toString();
            const newNode: ChatNode = {
                id: newId,
                label: 'New Topic',
                parentId: parentId,
                children: [],
                isCollapsed: false,
                context: `Inherited: ${parentContext}`,
                position: { x: (parentNode?.position?.x || 0) + 200, y: (parentNode?.position?.y || 0) + 50 }
            };

            const newStructure = [...currentAIState.structure, newNode];
            const updatedStructure = newStructure.map(n =>
                n.id === parentId ? { ...n, children: [...n.children, newId] } : n
            );

            updateAIState(activeProjectId, { ...currentAIState, structure: updatedStructure });

            // INHERITANCE: Inject Initial System Message in new Child Chat
            const contextMsg: Message = {
                id: Date.now().toString(),
                sender: 'partner',
                text: `[System] Created new branch from "${parentNode?.label}".\n\nInherited Context: ${parentContext}\n\nWhat specific aspect would you like to explore?`,
                timestamp: new Date().toLocaleString(),
                nodeId: newId
            };

            // We need to bypass handleSendMessage's 'activeNodeId' injection because we are creating for a *new* node
            // Direct sendMessage call:
            sendMessage(activeProjectId, contextMsg);

            // Switch to new node
            setActiveNodeId(newId);
        }
    };


    // Resizer
    const handleMouseDown = (e: React.MouseEvent) => { isResizing.current = true; document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); };
    const handleMouseMove = (e: MouseEvent) => { if (isResizing.current) { const newPos = (e.clientX / window.innerWidth) * 100; if (newPos > 20 && newPos < 80) setSplitPos(newPos); } };
    const handleMouseUp = () => { isResizing.current = false; document.body.style.cursor = 'default'; document.body.style.userSelect = 'auto'; window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
            {/* 1. Project Sidebar (Leftmost) */}
            <ProjectSidebar
                projects={projects}
                activeProjectId={activeProjectId}
                onSelectProject={(id) => { setActiveProjectId(id); setActiveNodeId(null); }}
                onAddProject={() => createProject('New Project', '#10b981')}
                onRenameProject={renameProject}
            />

            {/* 2. Tree Navigation (Secondary Sidebar) */}
            <ChatTreeSidebar
                structure={currentAIState.structure}
                activeNodeId={activeNodeId}
                onSelectNode={handleSelectNode}
                onToggleCollapse={handleToggleCollapse}
            />

            {/* 3. Main Workspace (Split View) */}
            <main className="flex-1 flex overflow-hidden bg-white rounded-l-2xl shadow-xl border border-slate-200 ml-1 my-1 relative z-0">

                {/* Left: Chat Panel */}
                <div style={{ width: `${splitPos}%` }} className="h-full flex flex-col min-w-[300px] border-r border-slate-100">
                    <ChatPanel
                        messages={viewMessages}
                        onSendMessage={handleSendMessage}
                        onReact={(msgId, emoji) => sendReaction(msgId, { ...viewMessages.find(m => m.id === msgId)?.reactions, [emoji]: (viewMessages.find(m => m.id === msgId)?.reactions?.[emoji] || 0) + 1 })}
                        onDelete={deleteMessage}
                        onOpenSettings={() => setIsSettingsOpen(true)}
                    />
                </div>

                {/* Resizer Handle */}
                <div
                    className="w-1 bg-slate-50 hover:bg-indigo-500 cursor-col-resize flex items-center justify-center transition-colors group z-20 absolute h-full hover:w-1.5"
                    style={{ left: `calc(${splitPos}% - 2px)` }}
                    onMouseDown={handleMouseDown}
                >
                    <div className="h-8 w-1 bg-slate-300 rounded-full group-hover:bg-indigo-300 transition-colors opacity-0 group-hover:opacity-100" />
                </div>

                {/* Right: Interactive Map (AI Board Replacement) */}
                <div className="flex-1 h-full bg-slate-50/30 min-w-[300px] relative">
                    {/* Overlay Connection Status */}
                    {!isConnected && (
                        <div className="absolute top-2 right-2 flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-full text-xs font-medium border border-rose-100 z-50">
                            <CloudOff size={14} /> Offline
                        </div>
                    )}

                    <div className="h-full flex flex-col">
                        <div className="h-14 border-b border-slate-100 bg-white flex items-center justify-between px-6 shrink-0">
                            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Cloud size={16} className="text-indigo-500" />
                                Mind Map Canvas
                            </h3>
                            <button
                                onClick={handleRunMindMap}
                                className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full font-medium hover:bg-indigo-100 transition-colors border border-indigo-100 shadow-sm"
                            >
                                {currentAIState.structure.length === 0 ? "Generate Map" : "Add Node"}
                            </button>
                        </div>
                        <div className="flex-1 relative">
                            {currentAIState.structure.length > 0 ? (
                                <InteractiveMap
                                    structure={currentAIState.structure}
                                    activeNodeId={activeNodeId}
                                    onNodeClick={handleNodeClick}
                                    onStructureChange={handleStructureChange}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                                        <LayoutDashboard size={24} className="text-slate-300" />
                                    </div>
                                    <p>No mind map generated yet.</p>
                                    <button onClick={handleRunMindMap} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm shadow-md hover:bg-indigo-700 transition-all">
                                        Generate Initial Map
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </main>

            {/* Modals */}
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                currentApiKey={apiKey}
                onSaveApiKey={(key) => { setApiKey(key); localStorage.setItem('gemini_api_key', key); }}
                currentSystemPrompt={systemPrompt}
                onSaveSystemPrompt={(p) => { setSystemPrompt(p); localStorage.setItem('gemini_system_prompt', p); }}
                currentChatSystemPrompt={chatSystemPrompt}
                onSaveChatSystemPrompt={(p) => { setChatSystemPrompt(p); localStorage.setItem('gemini_chat_system_prompt', p); }}
                currentModel={model}
                onSaveModel={(m) => { setModel(m); localStorage.setItem('gemini_model', m); }}
                currentLanguage={language}
                onSaveLanguage={(l) => { setLanguage(l); localStorage.setItem('gemini_language', l); }}
            />
        </div>
    );
}
