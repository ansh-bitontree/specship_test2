import packageJson from '../package.json';
import viteConfig from '../vite.config';
import { describe, expect, it } from 'vitest';

describe('local development setup', () => {
  it('uses a PowerShell-friendly npm test script', () => {
    expect(packageJson.scripts.test).toBe('vitest run');
  });

  it('proxies frontend API calls to the local FastAPI backend', () => {
    const proxy = viteConfig.server?.proxy;

    expect(proxy).toMatchObject({
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    });
  });
});
