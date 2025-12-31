'use client';

import { Sparkles, Brain, ListTodo, Lightbulb, CheckSquare, Workflow } from 'lucide-react';
import { MermaidDiagram } from './MermaidDiagram';
import { AIState } from '../types';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface AIBoardProps {
    aiState: AIState;
    isThinking: {
        summary: boolean;
        todos: boolean;
        suggestions: boolean;
        mindmap: boolean;
    };
    onRunSummary: () => void;
    onRunTodos: () => void;
    onRunSuggestions: () => void;
    onRunMindMap: () => void;
}

export function AIBoard({ aiState, isThinking, onRunSummary, onRunTodos, onRunSuggestions, onRunMindMap }: AIBoardProps) {
    return (
        <div className="flex flex-col h-full bg-slate-50/50 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            />

            {/* Header */}
            <header className="h-16 border-b border-gray-200/50 bg-white/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-10">
                <div className="flex items-center gap-2 text-indigo-900">
                    <Brain size={20} className="text-indigo-600" />
                    <h2 className="font-semibold tracking-tight">AI Insight Board</h2>
                </div>
                <div className="flex items-center gap-2">
                    {/* Global status if needed, or remove */}
                </div>
            </header>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-0">

                {/* Card 1: Live Summary */}
                <div className="bg-white rounded-xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-100 p-5 transition-all duration-300 hover:shadow-md relative group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-slate-700">
                            <Sparkles size={18} className="text-indigo-500" />
                            <h3 className="font-semibold text-sm uppercase tracking-wide">Live Summary</h3>
                        </div>
                        <button
                            onClick={onRunSummary}
                            disabled={isThinking.summary}
                            className={clsx(
                                "text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1",
                                isThinking.summary
                                    ? "bg-slate-100 text-slate-400 border-slate-200"
                                    : "bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 shadow-sm"
                            )}
                        >
                            {isThinking.summary ? (
                                <span className="flex items-center gap-1">Analyzing...</span>
                            ) : (
                                <>Run <span className="opacity-50">▶</span></>
                            )}
                        </button>
                    </div>

                    <div className="space-y-2">
                        {aiState.summary.length === 0 ? (
                            <p className="text-slate-400 text-sm italic">Click run to generate summary.</p>
                        ) : (
                            <ul className="list-disc list-inside space-y-1">
                                {aiState.summary.map((item, idx) => (
                                    <li key={idx} className="text-slate-600 text-sm leading-relaxed marker:text-slate-300">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Card 2: Action Items */}
                <div className="bg-white rounded-xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-100 p-5 transition-all duration-300 hover:shadow-md relative group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-slate-700">
                            <CheckSquare size={18} className="text-emerald-500" />
                            <h3 className="font-semibold text-sm uppercase tracking-wide">Action Items</h3>
                        </div>
                        <button
                            onClick={onRunTodos}
                            disabled={isThinking.todos}
                            className={clsx(
                                "text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1",
                                isThinking.todos
                                    ? "bg-slate-100 text-slate-400 border-slate-200"
                                    : "bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 shadow-sm"
                            )}
                        >
                            {isThinking.todos ? "Scanning..." : <>Run <span className="opacity-50">▶</span></>}
                        </button>
                    </div>

                    <div className="space-y-3">
                        {aiState.todos.length === 0 ? (
                            <p className="text-slate-400 text-sm italic">Click run to extract tasks.</p>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {aiState.todos.map((todo) => (
                                    <div key={todo.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                        <div className={clsx(
                                            "mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                            todo.status === 'completed' ? "bg-emerald-500 border-emerald-500" : "border-slate-300"
                                        )}>
                                            {todo.status === 'completed' && <CheckSquare size={10} className="text-white" />}
                                        </div>
                                        <span className={clsx(
                                            "text-sm",
                                            todo.status === 'completed' ? "text-slate-400 line-through" : "text-slate-700"
                                        )}>
                                            {todo.task}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Card 3: Ideas & Suggestions */}
                <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-indigo-100/50 p-5 transition-all duration-300 hover:shadow-md relative group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-indigo-900">
                            <Lightbulb size={18} className="text-amber-500" />
                            <h3 className="font-semibold text-sm uppercase tracking-wide">AI Insights</h3>
                        </div>
                        <button
                            onClick={onRunSuggestions}
                            disabled={isThinking.suggestions}
                            className={clsx(
                                "text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1",
                                isThinking.suggestions
                                    ? "bg-slate-100 text-slate-400 border-slate-200"
                                    : "bg-white text-amber-600 border-amber-200 hover:bg-amber-50 hover:border-amber-300 shadow-sm"
                            )}
                        >
                            {isThinking.suggestions ? "Thinking..." : <>Run <span className="opacity-50">▶</span></>}
                        </button>
                    </div>

                    <p className="text-slate-600 text-sm leading-relaxed">
                        {aiState.suggestions || "Click run to get suggestions..."}
                    </p>
                </div>

                {/* Card 4: Mind Map */}
                <div className="bg-white rounded-xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-100 p-5 transition-all duration-300 hover:shadow-md relative group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-slate-700">
                            <Workflow size={18} className="text-pink-500" />
                            <h3 className="font-semibold text-sm uppercase tracking-wide">Mind Map</h3>
                        </div>
                        <button
                            onClick={onRunMindMap}
                            disabled={isThinking.mindmap}
                            className={clsx(
                                "text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1",
                                isThinking.mindmap
                                    ? "bg-slate-100 text-slate-400 border-slate-200"
                                    : "bg-white text-pink-600 border-pink-200 hover:bg-pink-50 hover:border-pink-300 shadow-sm"
                            )}
                        >
                            {isThinking.mindmap ? "Mapping..." : <>Run <span className="opacity-50">▶</span></>}
                        </button>
                    </div>

                    <div className="min-h-[150px] flex items-center justify-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50 overflow-hidden">
                        {aiState.mindmap ? (
                            <div className="w-full overflow-x-auto">
                                <MermaidDiagram chart={aiState.mindmap} />
                            </div>
                        ) : (
                            <p className="text-slate-400 text-sm italic">Click run to visualize.</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
