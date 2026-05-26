export interface Message {
  id: string;
  role: string;
  content: string;
  timestamp: number;
}

export interface Conversation {
  messages: Message[];
  createdAt: number;
}

export interface ApiResponse {
  content: string;
  status: string;
  error: string | null;
}

export interface UserSettings {
  theme: string;
  preferences: Record<string, unknown>;
}
