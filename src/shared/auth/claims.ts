// JWT claims reader (/backend/lambda-handler). Auth is external: the API Gateway Cognito User Pools
// authorizer validates the token and injects the claims — this app NEVER validates tokens, it only
// reads claims. On REST API (v1) the claims live at `event.requestContext.authorizer.claims` (NOT
// `.jwt.claims`, which is the HTTP API v2 shape). All claim values arrive as strings.
import type { Context } from 'hono';
import type { LambdaBindings } from '../types/app';

export interface Claims {
  sub?: string;
  email?: string;
  groups: string[]; // from cognito:groups (present in both access and id tokens)
}

// cognito:groups surfaces through the REST authorizer as a string — AWS formats the JSON array as
// "[admin registered]" (bracketed, space-separated); also tolerate "admin,registered" or a real array.
function parseGroups(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === 'string') return v.replace(/^\[|\]$/g, '').split(/[\s,]+/).filter(Boolean);
  return [];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function getClaims(c: Context<{ Bindings: LambdaBindings }>): Claims | null {
  const raw = (c.env?.event as any)?.requestContext?.authorizer?.claims;
  if (!raw || typeof raw !== 'object') return null;
  return { sub: raw.sub, email: raw.email, groups: parseGroups(raw['cognito:groups']) };
}
