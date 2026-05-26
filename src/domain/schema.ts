export const appSchema = {
  Message: {
    id: 'string',
    role: 'string',
    content: 'string',
    timestamp: 'number',
  },
  Conversation: {
    messages: 'Message[]',
    createdAt: 'number',
  },
  ApiResponse: {
    content: 'string',
    status: 'string',
    error: 'string | null',
  },
  UserSettings: {
    theme: 'string',
    preferences: 'Record<string, unknown>',
  },
} as const;
