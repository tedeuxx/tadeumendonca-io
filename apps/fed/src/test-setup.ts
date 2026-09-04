import '@testing-library/jest-dom/vitest';

// The jsdom environment (opaque about:blank origin) ships a non-functional `localStorage`, so the
// locale layer — which persists the PT/EN choice — is untestable as-is. Provide a minimal,
// spec-shaped in-memory Storage on both `window` and the global scope.
class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length(): number {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

const memoryStorage = new MemoryStorage();
Object.defineProperty(window, 'localStorage', { value: memoryStorage, configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: memoryStorage, configurable: true });

// `sessionStorage` is a SEPARATE instance, not an alias, and the separation is what the tests need to
// be able to say anything: `lib/sessionOnce` writes the once-per-session analytics markers here, while
// consent and locale live in `localStorage`, and dozens of specs call `window.localStorage.clear()` in
// a `beforeEach`. Aliasing the two would make every one of those silently clear the analytics guard as
// well, so a hook that had lost the guard entirely would still pass.
const sessionMemoryStorage = new MemoryStorage();
Object.defineProperty(window, 'sessionStorage', { value: sessionMemoryStorage, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: sessionMemoryStorage, configurable: true });
