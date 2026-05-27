import { describe, expect, it } from 'vitest';
import viteConfig from '../vite.config';

describe('Vite local development config', () => {
  it('proxies API requests to the local FastAPI backend', () => {
    const config = typeof viteConfig === 'function' ? viteConfig({ command: 'serve', mode: 'test' }) : viteConfig;

    expect(config.server?.proxy?.['/api']).toMatchObject({
      target: 'http://127.0.0.1:8000',
      changeOrigin: true,
    });
  });
});
