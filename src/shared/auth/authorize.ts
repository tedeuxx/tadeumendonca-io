// Group-based authorization (/backend/authorization, /backend/action-types). The gateway authorizer
// proves the token is valid (any pool user); these guards enforce WHICH group may act. Call them at
// the top of a protected handler — they throw UnauthorizedError (→ 403) when the claim is missing or
// the group is absent. Server-side authz is the real gate; the SPA's UI gating is cosmetic.
import type { Context } from 'hono';
import type { LambdaBindings } from '../types/app';
import { getClaims, type Claims } from './claims';
import { UnauthorizedError } from '../errors/http-errors';

type Ctx = Context<{ Bindings: LambdaBindings }>;

// Require a valid token (authenticated user, any group). Returns the claims for the handler to use.
export function requireAuth(c: Ctx): Claims {
  const claims = getClaims(c);
  if (!claims?.sub) throw new UnauthorizedError('authentication required');
  return claims;
}

// Require membership of a specific Cognito group (e.g. "admin").
export function requireGroup(c: Ctx, group: string): Claims {
  const claims = requireAuth(c);
  if (!claims.groups.includes(group)) throw new UnauthorizedError(`requires the ${group} group`);
  return claims;
}
