'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Project, Message, AIState } from '@/app/types';
import { ChatMessage } from '@/app/components/GeminiChat';

const INITIAL_AI_STATE: AIState = {
    summary: [],
    todos: [],
    suggestions: "Waiting for conversation to start...",
    mindmap: null,
    structure: [], // Initial empty tree
};

export function useSupabase(initialProjects: Project[]) {
    const [isConnected, setIsConnected] = useState(false);
    const [projects, setProjects] = useState<Project[]>(initialProjects);
    const [activeProjectId, setActiveProjectId] = useState<string>(initialProjects[0]?.id || 'default');

    // Data Maps
    const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({});
    const [geminiMessagesMap, setGeminiMessagesMap] = useState<Record<string, ChatMessage[]>>({});
    const [aiStatesMap, setAiStatesMap] = useState<Record<string, AIState>>({});

    // Check connection
    useEffect(() => {
        if (supabase) {
            setIsConnected(true);
            fetchProjects();
        }
    }, []);

    // Fetch Initial Data
    const fetchProjects = async () => {
        if (!supabase) return;
        const { data, error } = await supabase.from('projects').select('*').order('created_at');
        if (!error && data) {
            setProjects(data.map(p => ({
                id: p.id,
                name: p.name,
                color: p.color
            })));

            // Also load AI states
            const states: Record<string, AIState> = {};
            data.forEach(p => {
                if (p.ai_state) states[p.id] = p.ai_state;
            });
            setAiStatesMap(prev => ({ ...prev, ...states }));
        }
    };

    // Realtime Subscriptions
    useEffect(() => {
        if (!supabase) return;

        // Subscribe to Projects
        const projectSub = supabase
            .channel('public:projects')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    const newP = payload.new as any;
                    setProjects(prev => [...prev, { id: newP.id, name: newP.name, color: newP.color }]);
                } else if (payload.eventType === 'UPDATE') {
                    const newP = payload.new as any;
                    setProjects(prev => prev.map(p => p.id === newP.id ? { ...p, name: newP.name, color: newP.color } : p));
                    if (newP.ai_state) {
                        setAiStatesMap(prev => ({ ...prev, [newP.id]: newP.ai_state }));
                    }
                }
            })
            .subscribe();

        // Subscribe to Messages
        const messageSub = supabase
            .channel('public:messages')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
                const msg = payload.new as any;
                if (payload.eventType === 'INSERT') {
                    setMessagesMap(prev => ({
                        ...prev,
                        [msg.project_id]: [...(prev[msg.project_id] || []), {
                            id: msg.id,
                            sender: msg.sender, // Client needs to handle 'me'/'partner' view mapping if needed, but simple string match for now
                            text: msg.text,
                            timestamp: msg.timestamp,
                            replyTo: msg.reply_to,
                            reactions: msg.reactions,
                            nodeId: msg.node_id
                        }]
                    }));
                } else if (payload.eventType === 'UPDATE') {
                    // Handle reactions update
                    setMessagesMap(prev => ({
                        ...prev,
                        [msg.project_id]: (prev[msg.project_id] || []).map(m =>
                            m.id === msg.id ? { ...m, reactions: msg.reactions } : m
                        )
                    }));
                } else if (payload.eventType === 'DELETE') {
                    const old = payload.old as any;
                    // We need project_id to update map efficiently, but DELETE payload usually mimics PK only.
                    // This is tricky without fetching all or knowing project. 
                    // MVP: We'll scan all project maps (inefficient but safe for small MVP)
                    setMessagesMap(prev => {
                        const next = { ...prev };
                        Object.keys(next).forEach(pid => {
                            next[pid] = next[pid].filter(m => m.id !== old.id);
                        });
                        return next;
                    });
                }
            })
            .subscribe();

        // Subscribe to Gemini Messages
        const geminiSub = supabase
            .channel('public:gemini_messages')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'gemini_messages' }, (payload) => {
                const msg = payload.new as any;
                if (payload.eventType === 'INSERT') {
                    setGeminiMessagesMap(prev => ({
                        ...prev,
                        [msg.project_id]: [...(prev[msg.project_id] || []), {
                            id: msg.id,
                            sender: msg.sender,
                            text: msg.text
                        }]
                    }));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(projectSub);
            supabase.removeChannel(messageSub);
            supabase.removeChannel(geminiSub);
        };
    }, []);

    // --- Actions ---

    const createProject = async (name: string, color: string) => {
        if (!supabase) return null;
        const id = Date.now().toString();
        const { error } = await supabase.from('projects').insert({ id, name, color, ai_state: INITIAL_AI_STATE });
        if (!error) return id;
        return null;
    };

    const renameProject = async (id: string, name: string) => {
        if (!supabase) return;
        await supabase.from('projects').update({ name }).eq('id', id);
    };

    const sendMessage = async (projectId: string, message: Message) => {
        if (!supabase) return;
        await supabase.from('messages').insert({
            id: message.id,
            project_id: projectId,
            sender: message.sender,
            text: message.text,
            timestamp: message.timestamp,
            reply_to: message.replyTo,
            reactions: message.reactions,
            node_id: message.nodeId
        });
    };

    const sendReaction = async (messageId: string, reactions: Record<string, number>) => {
        if (!supabase) return;
        await supabase.from('messages').update({ reactions }).eq('id', messageId);
    };

    const deleteMessage = async (messageId: string) => {
        if (!supabase) return;
        await supabase.from('messages').delete().eq('id', messageId);
    };

    const sendGeminiMessage = async (projectId: string, message: ChatMessage) => {
        if (!supabase) return;
        await supabase.from('gemini_messages').insert({
            id: message.id,
            project_id: projectId,
            sender: message.sender,
            text: message.text
        });
    };

    const updateAIState = async (projectId: string, newState: AIState) => {
        if (!supabase) return;
        await supabase.from('projects').update({ ai_state: newState }).eq('id', projectId);
    };

    // Load messages for active project if empty (Initial fetch)
    useEffect(() => {
        if (!supabase || !activeProjectId) return;

        // Check if loaded
        if (messagesMap[activeProjectId]) return;

        const loadDeep = async () => {
            // Messages
            const { data: msgs } = await supabase.from('messages').select('*').eq('project_id', activeProjectId).order('created_at');
            if (msgs) {
                setMessagesMap(prev => ({
                    ...prev,
                    [activeProjectId]: msgs.map((m: any) => ({
                        id: m.id, sender: m.sender, text: m.text, timestamp: m.timestamp,
                        replyTo: m.reply_to, reactions: m.reactions, nodeId: m.node_id
                    }))
                }));
            }

            // Gemini
            const { data: gMsgs } = await supabase.from('gemini_messages').select('*').eq('project_id', activeProjectId).order('created_at');
            if (gMsgs) {
                setGeminiMessagesMap(prev => ({
                    ...prev,
                    [activeProjectId]: gMsgs.map((m: any) => ({ id: m.id, sender: m.sender, text: m.text }))
                }));
            }
        };
        loadDeep();
    }, [activeProjectId]);

    return {
        isConnected,
        projects,
        activeProjectId,
        setActiveProjectId,
        currentMessages: messagesMap[activeProjectId] || [],
        currentGeminiMessages: geminiMessagesMap[activeProjectId] || [],
        currentAIState: aiStatesMap[activeProjectId] || INITIAL_AI_STATE,
        createProject,
        renameProject,
        sendMessage,
        sendReaction,
        deleteMessage,
        sendGeminiMessage,
        updateAIState
    };
}
