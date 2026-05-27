declare const process: {
  env: Record<string, string | undefined>;
};

process.env.NODE_ENV = 'test';

await import('@testing-library/jest-dom/vitest');

export {};
