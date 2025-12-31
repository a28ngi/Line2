'use client';

import { useState, useEffect } from 'react';
import { X, Key, Save, AlertCircle, Cpu, Languages, Eye, EyeOff } from 'lucide-react';
import { clsx } from 'clsx';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveApiKey: (key: string) => void;
    currentApiKey: string;
    onSaveSystemPrompt: (prompt: string) => void;
    currentSystemPrompt: string;
    onSaveChatSystemPrompt: (prompt: string) => void;
    currentChatSystemPrompt: string;
    onSaveModel: (model: string) => void;
    currentModel: string;
    onSaveLanguage: (lang: 'jp' | 'en') => void;
    currentLanguage: 'jp' | 'en';
}

export function SettingsModal({
    isOpen,
    onClose,
    onSaveApiKey,
    currentApiKey,
    onSaveSystemPrompt,
    currentSystemPrompt,
    onSaveChatSystemPrompt,
    currentChatSystemPrompt,
    onSaveModel,
    currentModel,
    onSaveLanguage,
    currentLanguage,
}: SettingsModalProps) {
    const [localApiKey, setLocalApiKey] = useState(currentApiKey);
    const [localSystemPrompt, setLocalSystemPrompt] = useState(currentSystemPrompt);
    const [localChatSystemPrompt, setLocalChatSystemPrompt] = useState(currentChatSystemPrompt);
    const [localModel, setLocalModel] = useState(currentModel || 'gemini-1.5-flash');
    const [localLanguage, setLocalLanguage] = useState<'jp' | 'en'>(currentLanguage || 'jp');
    const [showKey, setShowKey] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLocalApiKey(currentApiKey);
            setLocalSystemPrompt(currentSystemPrompt);
            setLocalChatSystemPrompt(currentChatSystemPrompt);
            setLocalModel(currentModel || 'gemini-1.5-flash');
            setLocalLanguage(currentLanguage || 'jp');
        }
    }, [isOpen, currentApiKey, currentSystemPrompt, currentChatSystemPrompt, currentModel, currentLanguage]);

    const handleSave = () => {
        onSaveApiKey(localApiKey);
        onSaveSystemPrompt(localSystemPrompt);
        onSaveChatSystemPrompt(localChatSystemPrompt);
        onSaveModel(localModel);
        onSaveLanguage(localLanguage);
        onClose();
    };

    if (!isOpen) return null;

    const models = [
        { id: 'gemini-3-pro', name: 'Gemini 3 Pro (Best Performance)' },
        { id: 'gemini-3-flash', name: 'Gemini 3 Flash (High Speed & Quality)' },
        { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Stable High-End)' },
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Standard)' },
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Legacy)' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2 text-slate-800">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <Key size={20} />
                        </div>
                        <h2 className="font-semibold text-lg">AI Settings</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* API Key Section */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Gemini API Key
                        </label>
                        <div className="relative">
                            <input
                                id="apiKey"
                                type={showKey ? "text" : "password"}
                                value={localApiKey}
                                onChange={(e) => setLocalApiKey(e.target.value)}
                                placeholder="AIza..."
                                className="w-full px-4 py-3 pr-10 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 text-slate-800 transition-all font-mono text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                            >
                                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                            <Key size={12} />
                            Your key is stored locally in your browser.
                        </p>
                    </div>

                    {/* Model & Language Selection Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                AI Model
                            </label>
                            <select
                                value={localModel}
                                onChange={(e) => setLocalModel(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                            >
                                {models.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Response Language
                            </label>
                            <select
                                value={localLanguage}
                                onChange={(e) => setLocalLanguage(e.target.value as 'jp' | 'en')}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                            >
                                <option value="jp">Japanese (日本語)</option>
                                <option value="en">English (英語)</option>
                            </select>
                        </div>
                    </div>

                    {/* System Prompt Section */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Custom System Prompt (Live Summary)
                            </label>
                            <textarea
                                value={localSystemPrompt}
                                onChange={(e) => setLocalSystemPrompt(e.target.value)}
                                placeholder={localLanguage === 'jp' ? "例: あなたは優秀なアシスタントです。" : "e.g. You are a helpful assistant."}
                                className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                Defines the persona for Summaries, To-Dos, and Suggestions.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Chat Persona (Gemini Chat)
                            </label>
                            <textarea
                                value={localChatSystemPrompt}
                                onChange={(e) => setLocalChatSystemPrompt(e.target.value)}
                                placeholder={localLanguage === 'jp' ? "例: あなたは海賊です..." : "e.g. You are a friendly pirate..."}
                                className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                Defines the persona and behavior for the Gemini Chat mode.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-sm shadow-indigo-200 flex items-center gap-2 transition-all active:scale-95"
                    >
                        <Save size={16} />
                        Save Settings
                    </button>
                </div>

            </div>
        </div>
    );
}
