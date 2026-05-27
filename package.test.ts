import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('package scripts', () => {
  it('uses a cross-platform frontend test command', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.test).toBe('vitest run');
  });
});
