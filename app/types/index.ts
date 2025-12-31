export type Message = {
  id: string;
  sender: 'me' | 'partner';
  text: string;
  timestamp: string;
  replyTo?: string | null;
  reactions?: Record<string, number>;
};

export type ToDo = {
  id: number;
  task: string;
  status: 'pending' | 'completed';
};

export type AIState = {
  summary: string[];
  todos: ToDo[];
  suggestions: string;
  mindmap: string | null;
}

export interface Project {
  id: string;
  name: string;
  color: string;
}

export interface ProjectData {
  id: string;
  messages: import('../types').Message[];
  aiState: AIState;
  geminiMessages: import('../components/GeminiChat').ChatMessage[];
  lastActiveAt: number;
};
