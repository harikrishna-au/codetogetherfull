// Node globals required by simple-peer (readable-stream) in the browser.
// Vite aliases `process` for module imports, but simple-peer references the
// GLOBAL `process.nextTick` at runtime — define it before anything else loads.
const g = globalThis as Record<string, any>;

g.process = g.process ?? {};
if (typeof g.process.nextTick !== 'function') {
  g.process.nextTick = (fn: (...args: unknown[]) => void, ...args: unknown[]) =>
    queueMicrotask(() => fn(...args));
}
g.process.env = g.process.env ?? {};

export {};
