'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatPanel } from './components/ChatPanel';
import { AIBoard } from './components/AIBoard';
import { GeminiChat, ChatMessage } from './components/GeminiChat';
import { SettingsModal } from './components/SettingsModal';
import { ProjectSidebar } from './components/ProjectSidebar';
import { Message, AIState, Project, ProjectData } from './types';
import { LayoutDashboard, MessageSquareText, GripVertical, Cloud, CloudOff } from 'lucide-react';
import { clsx } from 'clsx';
import { useSupabase } from '@/hooks/useSupabase';

const INITIAL_AI_STATE: AIState = {
    summary: [],
    todos: [],
    suggestions: "Waiting for conversation to start...",
    mindmap: null,
};

const DEFAULT_PROJECT_ID = 'default';

export default function Home() {
    // --- Hybrid State Management ---
    // We try to use Supabase, but if not connected, we fallback to Local state.

    // Local fallback state
    const [localProjects, setLocalProjects] = useState<Project[]>([{ id: DEFAULT_PROJECT_ID, name: 'Local Project', color: '#6366f1' }]);
    const [localProjectsData, setLocalProjectsData] = useState<Record<string, ProjectData>>({
        [DEFAULT_PROJECT_ID]: { id: DEFAULT_PROJECT_ID, messages: [], aiState: INITIAL_AI_STATE, geminiMessages: [], lastActiveAt: Date.now() }
    });
    const [localActiveId, setLocalActiveId] = useState(DEFAULT_PROJECT_ID);

    // Supabase Hook
    const sb = useSupabase(localProjects);

    // Derived State (Active)
    const activeProjectId = sb.isConnected ? sb.activeProjectId : localActiveId;
    const projects = sb.isConnected ? sb.projects : localProjects;

    const currentData = sb.isConnected
        ? {
            messages: sb.currentMessages,
            aiState: sb.currentAIState,
            geminiMessages: sb.currentGeminiMessages
        }
        : (localProjectsData[activeProjectId] || { messages: [], aiState: INITIAL_AI_STATE, geminiMessages: [] });

    // UI State
    const [rightPanelMode, setRightPanelMode] = useState<'board' | 'chat'>('board');
    const [leftWidth, setLeftWidth] = useState(50);
    const isResizing = useRef(false);
    const [isThinking, setIsThinking] = useState({ summary: false, todos: false, suggestions: false, mindmap: false });
    const [isGeminiThinking, setIsGeminiThinking] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Settings
    const [apiKey, setApiKey] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [chatSystemPrompt, setChatSystemPrompt] = useState('');
    const [model, setModel] = useState('gemini-1.5-flash');
    const [language, setLanguage] = useState<'jp' | 'en'>('jp');

    // Persistence Loading (Local Only)
    useEffect(() => {
        const storedKey = localStorage.getItem('gemini_api_key'); if (storedKey) setApiKey(storedKey);
        const storedPrompt = localStorage.getItem('gemini_system_prompt'); if (storedPrompt) setSystemPrompt(storedPrompt);
        const storedChatPrompt = localStorage.getItem('gemini_chat_system_prompt'); if (storedChatPrompt) setChatSystemPrompt(storedChatPrompt);
        const storedModel = localStorage.getItem('gemini_model'); if (storedModel) setModel(storedModel);
        const storedLang = localStorage.getItem('gemini_language') as 'jp' | 'en'; if (storedLang) setLanguage(storedLang);

        if (!sb.isConnected) {
            const savedProjects = localStorage.getItem('split_ai_projects');
            if (savedProjects) setLocalProjects(JSON.parse(savedProjects));
            const savedData = localStorage.getItem('split_ai_projects_data');
            if (savedData) setLocalProjectsData(JSON.parse(savedData));
        }
    }, [sb.isConnected]);

    // Local Persistence Saving
    useEffect(() => {
        if (!sb.isConnected) {
            localStorage.setItem('split_ai_projects', JSON.stringify(localProjects));
            localStorage.setItem('split_ai_projects_data', JSON.stringify(localProjectsData));
        }
    }, [localProjects, localProjectsData, sb.isConnected]);

    // --- Action Handlers (Hybrid) ---

    const handleAddProject = async () => {
        const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const name = `Project ${projects.length + 1}`;

        if (sb.isConnected) {
            const id = await sb.createProject(name, randomColor);
            if (id) sb.setActiveProjectId(id);
        } else {
            const newId = Date.now().toString();
            const newProject = { id: newId, name, color: randomColor };
            const newData = { id: newId, messages: [], aiState: INITIAL_AI_STATE, geminiMessages: [], lastActiveAt: Date.now() };
            setLocalProjects(prev => [...prev, newProject]);
            setLocalProjectsData(prev => ({ ...prev, [newId]: newData }));
            setLocalActiveId(newId);
        }
    };

    const handleSelectProject = (id: string) => {
        if (sb.isConnected) sb.setActiveProjectId(id);
        else setLocalActiveId(id);
    };

    const handleRenameProject = (id: string, newName: string) => {
        if (sb.isConnected) sb.renameProject(id, newName);
        else setLocalProjects(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
    };

    // Helper for Local Update
    const updateLocalProject = (updater: (prev: ProjectData) => ProjectData) => {
        setLocalProjectsData(prev => ({ ...prev, [localActiveId]: updater(prev[localActiveId]) }));
    };

    const handleNewMessage = async (newMessage: Message, replyToId?: string | null) => {
        const safeMessage = { ...newMessage, id: newMessage.id.toString(), replyTo: replyToId };

        if (sb.isConnected) {
            await sb.sendMessage(activeProjectId, safeMessage);
        } else {
            updateLocalProject(prev => ({ ...prev, messages: [...prev.messages, safeMessage] }));
        }
    };

    const handleReact = (messageId: string, emoji: string) => {
        if (sb.isConnected) {
            const msg = currentData.messages.find(m => m.id === messageId);
            if (msg) {
                const currentCount = msg.reactions?.[emoji] || 0;
                // Toggle logic simulation: just distinct increment for MVP
                sb.sendReaction(messageId, { ...(msg.reactions || {}), [emoji]: currentCount + 1 });
            }
        } else {
            updateLocalProject(prev => ({
                ...prev,
                messages: prev.messages.map(msg => {
                    if (msg.id.toString() === messageId) {
                        const currentCount = msg.reactions?.[emoji] || 0;
                        return { ...msg, reactions: { ...msg.reactions, [emoji]: currentCount + 1 } };
                    }
                    return msg;
                })
            }));
        }
    };

    const handleDelete = (messageId: string) => {
        if (!confirm(language === 'jp' ? "メッセージを削除しますか？" : "Delete this message?")) return;
        if (sb.isConnected) sb.deleteMessage(messageId);
        else updateLocalProject(prev => ({ ...prev, messages: prev.messages.filter(m => m.id.toString() !== messageId) }));
    };

    const handleGeminiChatSend = async (text: string) => {
        if (!apiKey) {
            alert(language === 'jp' ? "APIキーを設定してください。" : "Please set your Gemini API Key first.");
            setIsSettingsOpen(true);
            return;
        }

        const newUserMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text };

        if (sb.isConnected) {
            await sb.sendGeminiMessage(activeProjectId, newUserMsg);
        } else {
            updateLocalProject(prev => ({ ...prev, geminiMessages: [...prev.geminiMessages, newUserMsg] }));
        }

        setIsGeminiThinking(true);
        // Context: Use current state msg + new one
        const historyForCall = [...currentData.geminiMessages, newUserMsg];

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: historyForCall,
                    apiKey,
                    systemPrompt: chatSystemPrompt,
                    model,
                    language,
                    type: 'chat'
                }),
            });

            if (!response.ok) throw new Error("API Failed");
            const data = await response.json();
            const aiText = data.chatResponse || "Available (No response text)";
            const newAiMsg: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'ai', text: aiText };

            if (sb.isConnected) await sb.sendGeminiMessage(activeProjectId, newAiMsg);
            else updateLocalProject(prev => ({ ...prev, geminiMessages: [...prev.geminiMessages, newAiMsg] }));

        } catch (error) {
            console.error("Gemini Error:", error);
            const errorMsg = { id: Date.now().toString(), sender: 'ai' as const, text: language === 'jp' ? "エラーが発生しました。" : "Sorry, I encountered an error." };
            if (sb.isConnected) await sb.sendGeminiMessage(activeProjectId, errorMsg);
            else updateLocalProject(prev => ({ ...prev, geminiMessages: [...prev.geminiMessages, errorMsg] }));
        } finally {
            setIsGeminiThinking(false);
        }
    };

    const handleRunAI = async (type: 'summary' | 'todos' | 'suggestions' | 'mindmap') => {
        if (!apiKey) {
            alert(language === 'jp' ? "APIキーを設定してください。" : "Please set your Gemini API Key first.");
            setIsSettingsOpen(true);
            return;
        }
        setIsThinking(prev => ({ ...prev, [type]: true }));

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: currentData.messages,
                    apiKey,
                    systemPrompt,
                    model,
                    language,
                    type
                })
            });

            if (!response.ok) throw new Error("API Failed");
            const data = await response.json();

            // Merge logic
            const newState = {
                ...currentData.aiState,
                summary: type === 'summary' && data.summary ? data.summary : currentData.aiState.summary,
                todos: type === 'todos' && data.todos ? data.todos : currentData.aiState.todos,
                suggestions: type === 'suggestions' && data.suggestions ? data.suggestions : currentData.aiState.suggestions,
                mindmap: type === 'mindmap' && data.mindmap ? data.mindmap : currentData.aiState.mindmap,
            };

            if (sb.isConnected) await sb.updateAIState(activeProjectId, newState);
            else updateLocalProject(prev => ({ ...prev, aiState: newState }));

        } catch (error) {
            alert(language === 'jp' ? "AI分析に失敗しました。" : "AI Analysis failed.");
        } finally {
            setIsThinking(prev => ({ ...prev, [type]: false }));
        }
    };

    // --- Settings Handlers ---
    const handleSaveApiKey = (key: string) => { setApiKey(key); localStorage.setItem('gemini_api_key', key); };
    const handleSaveSystemPrompt = (prompt: string) => { setSystemPrompt(prompt); localStorage.setItem('gemini_system_prompt', prompt); };
    const handleSaveChatSystemPrompt = (prompt: string) => { setChatSystemPrompt(prompt); localStorage.setItem('gemini_chat_system_prompt', prompt); };
    const handleSaveModel = (newModel: string) => { setModel(newModel); localStorage.setItem('gemini_model', newModel); };
    const handleSaveLanguage = (lang: 'jp' | 'en') => { setLanguage(lang); localStorage.setItem('gemini_language', lang); };

    // --- Resize Handlers ---
    const startResizing = () => { isResizing.current = true; document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); };
    const handleMouseMove = (e: MouseEvent) => { if (!isResizing.current) return; const sidebarWidth = 72; const availableWidth = window.innerWidth - sidebarWidth; const relativeX = e.clientX - sidebarWidth; const newLeftWidth = (relativeX / availableWidth) * 100; if (newLeftWidth >= 20 && newLeftWidth <= 80) setLeftWidth(newLeftWidth); };
    const handleMouseUp = () => { isResizing.current = false; document.body.style.cursor = 'default'; document.body.style.userSelect = 'auto'; window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-slate-900">
            {/* Sidebar */}
            <ProjectSidebar
                projects={projects}
                activeProjectId={activeProjectId}
                onSelectProject={handleSelectProject}
                onAddProject={handleAddProject}
                onRenameProject={handleRenameProject}
            />

            {/* Main Area */}
            <main className="flex-1 flex overflow-hidden bg-white rounded-l-2xl shadow-2xl relative z-0">
                {/* Connection Status Indicator */}
                <div className="absolute top-2 right-4 z-50 pointer-events-none">
                    {sb.isConnected ? (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 text-xs font-medium shadow-sm">
                            <Cloud size={12} /> <span>Online Multi-User</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 text-slate-400 rounded-full border border-slate-200 text-xs font-medium">
                            <CloudOff size={12} /> <span>Offline (Local)</span>
                        </div>
                    )}
                </div>

                <SettingsModal
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                    onSaveApiKey={handleSaveApiKey} currentApiKey={apiKey}
                    onSaveSystemPrompt={handleSaveSystemPrompt} currentSystemPrompt={systemPrompt}
                    onSaveChatSystemPrompt={handleSaveChatSystemPrompt} currentChatSystemPrompt={chatSystemPrompt}
                    onSaveModel={handleSaveModel} currentModel={model}
                    onSaveLanguage={handleSaveLanguage} currentLanguage={language}
                />

                {/* Left Panel: Chat Zone */}
                <div className="h-full border-r border-gray-200 shrink-0 relative flex flex-col" style={{ width: `${leftWidth}%` }}>
                    <div className="flex-1 overflow-hidden key={activeProjectId}">
                        <ChatPanel
                            messages={currentData.messages}
                            onSendMessage={handleNewMessage}
                            onReact={handleReact}
                            onDelete={handleDelete}
                            onOpenSettings={() => setIsSettingsOpen(true)}
                        />
                    </div>
                </div>

                {/* Resizer Handle */}
                <div className="w-1.5 h-full bg-gray-50 hover:bg-indigo-500 cursor-col-resize flex items-center justify-center shrink-0 transition-colors z-10 border-l border-r border-gray-100/50" onMouseDown={startResizing}>
                    <GripVertical size={12} className="text-gray-300 pointer-events-none" />
                </div>

                {/* Right Panel: AI Canvas */}
                <div className="h-full bg-slate-50 flex flex-col shrink-0" style={{ width: `${100 - leftWidth}%` }}>
                    {/* Mode Switcher Header */}
                    <div className="h-12 border-b border-gray-200 bg-white flex items-center justify-center px-4 shrink-0">
                        <div className="bg-slate-100 p-1 rounded-lg flex items-center">
                            <button onClick={() => setRightPanelMode('board')} className={clsx("flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap", rightPanelMode === 'board' ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700")}>
                                <LayoutDashboard size={16} /> <span className="hidden sm:inline">Live Summary</span>
                            </button>
                            <button onClick={() => setRightPanelMode('chat')} className={clsx("flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap", rightPanelMode === 'chat' ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700")}>
                                <MessageSquareText size={16} /> <span className="hidden sm:inline">Gemini Chat</span>
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-hidden relative">
                        {rightPanelMode === 'board' ? (
                            <div className="absolute inset-0">
                                <AIBoard
                                    aiState={currentData.aiState}
                                    isThinking={isThinking}
                                    onRunSummary={() => handleRunAI('summary')}
                                    onRunTodos={() => handleRunAI('todos')}
                                    onRunSuggestions={() => handleRunAI('suggestions')}
                                    onRunMindMap={() => handleRunAI('mindmap')}
                                />
                            </div>
                        ) : (
                            <div className="absolute inset-0">
                                <GeminiChat messages={currentData.geminiMessages} onSendMessage={handleGeminiChatSend} isLoading={isGeminiThinking} />
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
