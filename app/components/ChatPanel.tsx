'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, User, Users, Settings, Plus, Smile, Reply, Trash2, X as XIcon } from 'lucide-react';
import { Message } from '../types';
import { clsx } from 'clsx';

interface ChatPanelProps {
    messages: Message[];
    onSendMessage: (msg: Message, replyToId?: string | null) => void;
    onReact: (messageId: string, emoji: string) => void;
    onDelete: (messageId: string) => void;
    onOpenSettings: () => void;
}

const REACTIONS = ['👍', '👎', '❤️', '🔥', '🎉'];

export function ChatPanel({ messages, onSendMessage, onReact, onDelete, onOpenSettings }: ChatPanelProps) {
    const [inputText, setInputText] = useState('');
    const [currentUser, setCurrentUser] = useState<'me' | 'partner'>('me');
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputText.trim()) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            sender: currentUser,
            text: inputText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            replyTo: replyingTo?.id || null,
            reactions: {}
        };

        onSendMessage(newMessage, replyingTo?.id);
        setInputText('');
        setReplyingTo(null);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 text-slate-800 font-sans">
            {/* Header */}
            <header className="h-16 border-b border-gray-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <Users size={20} />
                    </div>
                    <div>
                        <h1 className="font-bold text-slate-900 leading-tight">Project Chat</h1>
                        <p className="text-xs text-slate-500 font-medium">Team collaboration</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* User Toggle */}
                    <div className="bg-slate-100 p-1 rounded-lg flex text-xs font-semibold shadow-inner">
                        <button
                            onClick={() => setCurrentUser('me')}
                            className={clsx(
                                "px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5",
                                currentUser === 'me' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <User size={14} /> Me
                        </button>
                        <button
                            onClick={() => setCurrentUser('partner')}
                            className={clsx(
                                "px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5",
                                currentUser === 'partner' ? "bg-white text-rose-500 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <Users size={14} /> Partner
                        </button>
                    </div>

                    <button onClick={onOpenSettings} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                        <Settings size={20} />
                    </button>
                </div>
            </header>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 opacity-60">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                            <Smile size={40} className="text-slate-300" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-semibold text-slate-600 mb-1">Welcome!</h3>
                            <p className="text-sm">Start the conversation here.</p>
                        </div>
                    </div>
                )}
                {messages.map((msg, index) => {
                    const isMe = msg.sender === 'me';
                    const isSequence = index > 0 && messages[index - 1].sender === msg.sender && !msg.replyTo;
                    const replyParent = msg.replyTo ? messages.find(m => m.id === msg.replyTo) : null;

                    return (
                        <div key={msg.id} className={clsx("group flex flex-col max-w-[85%]", isMe ? "ml-auto items-end" : "mr-auto items-start", isSequence ? "mt-1" : "mt-6")}>

                            {/* Reply Context */}
                            {replyParent && (
                                <div className={clsx("flex items-center gap-2 mb-1 text-xs opacity-70", isMe ? "mr-2 flex-row-reverse" : "ml-2")}>
                                    <div className="w-1 h-3 rounded-full bg-slate-300" />
                                    <span className="font-medium text-slate-600">Reply to {replyParent.sender === 'me' ? 'Me' : 'Partner'}</span>
                                    <span className="truncate max-w-[150px] text-slate-500 italic">"{replyParent.text}"</span>
                                </div>
                            )}

                            <div className={clsx("flex gap-3 items-end group", isMe ? "flex-row-reverse" : "flex-row")}>
                                {/* Avatar */}
                                <div className={clsx("w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-white shadow-sm ring-2 ring-white", isSequence ? "opacity-0 h-0 w-8" : "", isMe ? "bg-indigo-500" : "bg-rose-500")}>
                                    {!isSequence && (isMe ? <User size={14} /> : <Users size={14} />)}
                                </div>

                                <div className="relative max-w-full">
                                    {/* Sender Name (First in sequence only) */}
                                    {!isSequence && !isMe && (
                                        <span className="text-[10px] text-slate-400 font-bold ml-1 mb-1 block uppercase tracking-wider">Partner</span>
                                    )}

                                    {/* Bubble */}
                                    <div className={clsx(
                                        "px-4 py-2.5 rounded-2xl shadow-sm text-[15px] leading-relaxed break-words relative transition-transform hover:scale-[1.01] origin-bottom-left",
                                        isMe
                                            ? "bg-indigo-600 text-white rounded-tr-sm"
                                            : "bg-white text-slate-800 border border-slate-100 rounded-tl-sm"
                                    )}>
                                        {msg.text}
                                    </div>

                                    {/* Timestamp & Actions */}
                                    <div className={clsx("absolute top-0 bottom-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity px-2", isMe ? "right-full flex-row-reverse" : "left-full")}>
                                        <div className="flex items-center gap-1 bg-white shadow-sm border border-slate-100 rounded-full p-1 transform scale-90">
                                            {REACTIONS.map(emoji => (
                                                <button key={emoji} onClick={() => onReact(msg.id, emoji)} className="hover:scale-125 transition-transform text-sm p-0.5">{emoji}</button>
                                            ))}
                                            <div className="w-px h-3 bg-slate-200 mx-1" />
                                            <button onClick={() => setReplyingTo(msg)} className="text-slate-400 hover:text-indigo-500 p-1"><Reply size={14} /></button>
                                            <button onClick={() => onDelete(msg.id)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                                        </div>
                                        <span className="text-[10px] text-slate-300 font-medium whitespace-nowrap mx-2">{msg.timestamp}</span>
                                    </div>

                                    {/* Reactions Display */}
                                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                        <div className={clsx("flex flex-wrap gap-1 mt-1.5", isMe ? "justify-end" : "justify-start")}>
                                            {Object.entries(msg.reactions).map(([emoji, count]) => (
                                                <div key={emoji} className="flex items-center gap-1 bg-white shadow-sm border border-slate-100 rounded-full px-2 py-0.5 text-xs font-medium text-slate-600 scale-95 origin-top">
                                                    <span>{emoji}</span>
                                                    <span className="text-slate-400">{count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white/50 backdrop-blur-sm border-t border-slate-100">
                {replyingTo && (
                    <div className="flex items-center justify-between bg-indigo-50 text-indigo-900 px-4 py-2 rounded-t-xl text-sm border-b border-indigo-100 mx-1">
                        <span className="flex items-center gap-2 truncate">
                            <Reply size={14} className="text-indigo-500" />
                            Replying to <span className="font-bold">{replyingTo.sender === 'me' ? 'Me' : 'Partner'}</span>
                        </span>
                        <button onClick={() => setReplyingTo(null)} className="text-indigo-400 hover:text-indigo-600"><XIcon size={14} /></button>
                    </div>
                )}

                <div className={clsx("relative bg-white border border-slate-200 shadow-sm rounded-2xl focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400 transition-all overflow-hidden", replyingTo ? "rounded-t-none" : "")}>
                    <button className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 p-1.5 hover:bg-indigo-50 rounded-full transition-colors">
                        <Plus size={20} />
                    </button>

                    <form onSubmit={handleSend} className="w-full">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Escape') setReplyingTo(null); }}
                            placeholder={`Message #${currentUser}...`}
                            className="w-full bg-transparent text-slate-800 placeholder-slate-400 border-none pl-12 pr-12 py-3.5 focus:outline-none"
                        />
                        <button
                            type="submit"
                            disabled={!inputText.trim()}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 p-2 rounded-xl transition-all shadow-sm"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
