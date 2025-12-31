'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, User, Users, Settings, Plus, Smile, Gift, Reply, Trash2, ThumbsUp, ThumbsDown, Heart, Circle, X as XIcon, MoreHorizontal } from 'lucide-react';
import { Message } from '../types';
import { clsx } from 'clsx';
// Since I don't see radix installed, I'll build a simple custom popover or static list for now, or just simple buttons on hover.

interface ChatPanelProps {
    messages: Message[];
    onSendMessage: (msg: Message, replyToId?: string | null) => void;
    onReact: (messageId: string, emoji: string) => void;
    onDelete: (messageId: string) => void;
    onOpenSettings: () => void;
}

const REACTIONS = ['👍', '👎', '⭕', '❌', '❤️'];

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
        <div className="flex flex-col h-full bg-[#313338] text-[#dbdee1]">
            {/* Discord Header */}
            <header className="h-12 border-b border-[#26272d] bg-[#313338] flex items-center justify-between px-4 sticky top-0 z-10 shadow-sm shrink-0">
                <div className="flex items-center gap-2">
                    <Users size={20} className="text-[#80848e]" />
                    <h1 className="font-bold text-white tracking-tight">Project Room</h1>
                </div>
                <div className="flex items-center gap-4">
                    {/* User Toggle */}
                    <div className="bg-[#1e1f22] p-0.5 rounded flex text-xs font-medium">
                        <button
                            onClick={() => setCurrentUser('me')}
                            className={clsx(
                                "px-3 py-1 rounded transition-all flex items-center gap-1.5",
                                currentUser === 'me' ? "bg-[#404249] text-white" : "text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]"
                            )}
                        >
                            <User size={12} /> Me
                        </button>
                        <button
                            onClick={() => setCurrentUser('partner')}
                            className={clsx(
                                "px-3 py-1 rounded transition-all flex items-center gap-1.5",
                                currentUser === 'partner' ? "bg-[#404249] text-white" : "text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]"
                            )}
                        >
                            <Users size={12} /> Partner
                        </button>
                    </div>

                    <button onClick={onOpenSettings} className="text-[#b5bac1] hover:text-[#dbdee1] transition-colors">
                        <Settings size={20} />
                    </button>
                </div>
            </header>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto px-4 pt-4 space-y-[0.125rem] scrollbar-thin scrollbar-thumb-[#1a1b1e] scrollbar-track-[#2b2d31]">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-[#949ba4] space-y-4">
                        <div className="w-16 h-16 bg-[#41434a] rounded-full flex items-center justify-center">
                            <span className="text-3xl">#</span>
                        </div>
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-white mb-2">Welcome</h3>
                            <p className="text-sm">Start the conversation here.</p>
                        </div>
                    </div>
                )}
                {messages.map((msg, index) => {
                    const isSequence = index > 0 && messages[index - 1].sender === msg.sender && !msg.replyTo;
                    const replyParent = msg.replyTo ? messages.find(m => m.id === msg.replyTo) : null;

                    return (
                        <div key={msg.id} className={clsx("group flex flex-col pr-4 -mx-4 px-4 py-0.5 hover:bg-[#2e3035] relative", isSequence ? "mt-0.5" : "mt-4")}>

                            {/* Reply Context */}
                            {replyParent && (
                                <div className="flex items-center gap-2 mb-1 ml-11 opacity-60 text-xs">
                                    <div className="w-8 border-t-2 border-l-2 border-[#4e5058] h-3 rounded-tl-md shrink-0 mb-[-6px]" />
                                    <span className="text-[#dbdee1] font-medium mr-1">@{replyParent.sender === 'me' ? 'Me' : 'Partner'}</span>
                                    <span className="truncate max-w-[300px] text-[#dbdee1]">{replyParent.text}</span>
                                </div>
                            )}

                            <div className="flex gap-4 items-start relative">
                                {/* Actions (Hover) */}
                                <div className="absolute right-0 top-[-8px] bg-[#313338] shadow-sm border border-[#26272d] rounded flex items-center p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    {REACTIONS.map(emoji => (
                                        <button
                                            key={emoji}
                                            onClick={() => onReact(msg.id, emoji)}
                                            className="p-1.5 hover:bg-[#404249] rounded transition-colors text-base"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                    <div className="w-[1px] h-4 bg-[#4e5058] mx-1" />
                                    <button onClick={() => setReplyingTo(msg)} className="p-1.5 hover:bg-[#404249] rounded text-[#b5bac1] hover:text-[#dbdee1]" title="Reply">
                                        <Reply size={16} />
                                    </button>
                                    <button onClick={() => onDelete(msg.id)} className="p-1.5 hover:bg-[#da373c] hover:text-white rounded text-[#b5bac1]" title="Delete">
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                {/* Avatar */}
                                <div className={clsx("w-10 h-10 shrink-0 cursor-pointer hover:drop-shadow-sm active:translate-y-[1px]", isSequence ? "opacity-0 h-0" : "")}>
                                    {!isSequence && (
                                        msg.sender === 'me' ? (
                                            <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center text-white">
                                                <User size={20} />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-[#f23f42] flex items-center justify-center text-white">
                                                <Users size={20} />
                                            </div>
                                        )
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    {!isSequence && (
                                        <div className="flex items-center gap-2">
                                            <span className={clsx("font-medium hover:underline cursor-pointer", msg.sender === 'me' ? "text-white" : "text-white")}>
                                                {msg.sender === 'me' ? 'Me' : 'Partner'}
                                            </span>
                                            <span className="text-xs text-[#949ba4] ml-1">{msg.timestamp}</span>
                                        </div>
                                    )}
                                    <p className={clsx("text-[#dbdee1] whitespace-pre-wrap break-words leading-[1.375rem]", isSequence && "ml-0")}>
                                        {msg.text}
                                    </p>

                                    {/* Reactions Display */}
                                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {Object.entries(msg.reactions).map(([emoji, count]) => (
                                                <div key={emoji} className="flex items-center gap-1.5 bg-[#2b2d31] hover:bg-[#35373c] border border-[#1e1f22] rounded-[4px] px-1.5 py-0.5 cursor-pointer transition-colors">
                                                    <span className="text-sm">{emoji}</span>
                                                    <span className="text-xs font-bold text-[#b5bac1]">{count}</span>
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
            <div className="px-4 pb-6 bg-[#313338] shrink-0 z-20">
                {replyingTo && (
                    <div className="flex items-center justify-between bg-[#2b2d31] p-2 rounded-t-lg mx-2 border-b border-[#383a40]">
                        <div className="flex items-center gap-2 text-sm text-[#dbdee1]">
                            <span className="text-[#949ba4]">Replying to</span>
                            <span className="font-medium">@{replyingTo.sender === 'me' ? 'Me' : 'Partner'}</span>
                        </div>
                        <button onClick={() => setReplyingTo(null)} className="text-[#949ba4] hover:text-[#dbdee1]">
                            <XIcon size={16} />
                        </button>
                    </div>
                )}

                <div className={clsx("relative bg-[#383a40] rounded-lg", replyingTo ? "rounded-t-none" : "")}>
                    <button className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b5bac1] hover:text-[#dbdee1] p-1 bg-[#b5bac1]/0 hover:bg-[#b5bac1]/10 rounded-full transition-all">
                        <Plus size={20} strokeWidth={2.5} />
                    </button>

                    <form onSubmit={handleSend} className="w-full">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') setReplyingTo(null);
                            }}
                            placeholder={`Message #${currentUser === 'me' ? 'me' : 'partner'}`}
                            className="w-full bg-transparent text-[#dbdee1] placeholder-[#949ba4] border-none px-14 py-3 h-[44px] focus:outline-none"
                        />
                        <button
                            type="submit"
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#b5bac1] hover:text-[#dbdee1]"
                            disabled={!inputText.trim()}
                        >
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
