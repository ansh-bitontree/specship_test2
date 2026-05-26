import { describe, expect, it } from 'vitest';
import { appSchema } from './schema';

describe('appSchema', () => {
  it('defines the approved localStorage data model', () => {
    expect(appSchema).toEqual({
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
    });
  });
});
