import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User as UserIcon } from 'lucide-react';
import { clsx } from 'clsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export interface ChatMessage {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    timestamp?: string;
}

interface GeminiChatProps {
    messages: ChatMessage[];
    onSendMessage: (text: string) => void;
    isLoading: boolean;
}

export function GeminiChat({ messages, onSendMessage, isLoading }: GeminiChatProps) {
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoading]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        onSendMessage(input);
        setInput('');
    };

    return (
        <div className="flex flex-col h-full bg-white font-sans">
            {/* Header Area (Visual only, controls are in parent) */}
            <div className="flex-none p-4 pb-2">
                <div className="flex items-center justify-center gap-2 opacity-50 mb-4">
                    <Sparkles size={16} className="text-indigo-500" />
                    <span className="text-xs font-medium text-indigo-500 tracking-wider uppercase">Gemini Powered</span>
                </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 space-y-6 pb-4">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40 space-y-4">
                        <div className="w-16 h-16 bg-gradient-to-tr from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center">
                            <Bot size={32} className="text-indigo-400" />
                        </div>
                        <p className="text-slate-500 font-medium">How can I help you today?</p>
                    </div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className={clsx(
                        "flex gap-4 max-w-3xl mx-auto",
                        msg.sender === 'user' ? "flex-row-reverse" : "flex-row"
                    )}>
                        {/* Avatar */}
                        <div className={clsx(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                            msg.sender === 'user' ? "bg-slate-100" : "bg-white border border-indigo-100 shadow-sm"
                        )}>
                            {msg.sender === 'user' ? (
                                <UserIcon size={16} className="text-slate-500" />
                            ) : (
                                <Sparkles size={16} className="text-indigo-500" />
                            )}
                        </div>

                        {/* Bubble */}
                        <div className={clsx(
                            "px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed shadow-sm max-w-[85%]",
                            msg.sender === 'user'
                                ? "bg-[#f0f4f9] text-[#1f1f1f] rounded-tr-sm"
                                : "bg-white text-[#374151] border border-gray-100 rounded-tl-sm w-full"
                        )}>
                            {msg.sender === 'user' ? (
                                <div className="whitespace-pre-wrap">{msg.text}</div>
                            ) : (
                                <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-p:leading-relaxed prose-headings:my-2 prose-headings:font-semibold prose-pre:bg-gray-50 prose-pre:rounded-lg prose-pre:border prose-pre:border-gray-100 prose-ul:my-1 prose-li:my-0.5">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {msg.text}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-4 max-w-3xl mx-auto">
                        <div className="w-8 h-8 rounded-full bg-white border border-indigo-100 shadow-sm flex items-center justify-center shrink-0 mt-1 animate-pulse">
                            <Sparkles size={16} className="text-indigo-400" />
                        </div>
                        <div className="px-5 py-3.5 rounded-2xl bg-white border border-gray-100 rounded-tl-sm shadow-sm">
                            <div className="flex gap-1.5 pt-1">
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <div className="flex-none p-4 sm:p-6 max-w-4xl mx-auto w-full">
                <form onSubmit={handleSubmit} className="relative group">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Enter a prompt here"
                        className="w-full bg-[#f0f4f9] hover:bg-[#e9eef6] focus:bg-white border-2 border-transparent focus:border-indigo-100 rounded-full py-4 pl-6 pr-14 text-slate-700 placeholder:text-slate-400 focus:outline-none transition-all shadow-sm"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                    >
                        <Send size={20} />
                    </button>
                    {/* Brand footer line if desired */}
                    <p className="text-center text-[10px] text-slate-400 mt-2">
                        Gemini displaying may allow for mistakes. Please double-check responses.
                    </p>
                </form>
            </div>
        </div>
    );
}
