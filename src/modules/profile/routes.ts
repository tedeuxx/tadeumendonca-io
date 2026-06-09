// Profile routes — public, read-only (Phase 1 CV). Documented with @hono/zod-openapi so the same
// zod schema types the response AND generates the OpenAPI (/backend/framework-hono, /backend/openapi).
import { createRoute, z } from '@hono/zod-openapi';
import type { BffApp } from '../../shared/types/app';
import { getProfile } from './repository';
import { NotFoundError } from '../../shared/errors/http-errors';

const ExperienceSchema = z.object({
  company: z.string(),
  title: z.string(),
  start_date: z.string(),
  end_date: z.string().nullable(),
  description: z.string().optional(),
  highlights: z.array(z.string()).optional(),
});

const EducationSchema = z.object({
  institution: z.string(),
  degree: z.string(),
  field: z.string().optional(),
  start_date: z.string(),
  end_date: z.string().nullable(),
});

const CertificationSchema = z.object({
  name: z.string(),
  issuer: z.string(),
  issued_date: z.string(),
  credential_url: z.string().optional(),
});

export const ProfileSchema = z
  .object({
    profile_id: z.string(),
    name: z.string(),
    headline: z.string(),
    summary: z.string().optional(),
    location: z.string().optional(),
    experience: z.array(ExperienceSchema),
    education: z.array(EducationSchema),
    certifications: z.array(CertificationSchema),
    skills: z.record(z.array(z.string())),
    metadata: z.record(z.string()),
    updated_at: z.string().optional(),
  })
  .openapi('Profile');

const getProfileRoute = createRoute({
  method: 'get',
  path: '/profile',
  tags: ['profile'],
  summary: 'Get the CV profile (public, read-only)',
  responses: {
    200: {
      description: 'The CV profile',
      content: { 'application/json': { schema: ProfileSchema } },
    },
    404: { description: 'Profile not found' },
  },
});

export function registerProfile(app: BffApp): void {
  app.openapi(getProfileRoute, async (c) => {
    const profile = await getProfile();
    if (!profile) throw new NotFoundError('profile not found');
    return c.json(profile, 200);
  });
}
