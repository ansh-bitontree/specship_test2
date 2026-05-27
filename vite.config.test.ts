import { describe, expect, it } from 'vitest';
import viteConfig from './vite.config';

describe('Vite local API proxy', () => {
  it('proxies frontend /api requests to the FastAPI backend', () => {
    expect(viteConfig.server?.proxy?.['/api']).toMatchObject({
      target: 'http://127.0.0.1:8000',
      changeOrigin: true,
    });
  });
});
