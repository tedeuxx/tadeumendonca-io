// Types for `revision-lines.mjs`, so the end-to-end spec that imports it is checked by `npm run typecheck`.
export type Locale = 'en' | 'pt';

export interface Revision {
  key: string;
  slug: Record<Locale, string>;
  revisionOnly: Record<Locale, string | undefined>;
  publishedOnly: Record<Locale, string | undefined>;
}

export const LOCALES: readonly Locale[];
export function split(raw: string): { fm: string; body: string };
export function slugOf(fm: string, key: string): string;
export function unlink(line: string): string;
export function proseLines(body: string): string[];
export function onlyIn(a: string, b: string): string | undefined;
export const CONTENT_DIR: string;
export function readRevisions(contentDir?: string): Revision[];
