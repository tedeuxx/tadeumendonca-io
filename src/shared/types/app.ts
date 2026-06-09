// Lambda bindings injected by the hono/aws-lambda `handle` adapter (c.env = { event, lambdaContext }),
// and the BFF app type. hono/aws-lambda doesn't export a bindings type, so we derive it.
import type { OpenAPIHono } from '@hono/zod-openapi';
import type { LambdaEvent, LambdaContext } from 'hono/aws-lambda';

export type LambdaBindings = {
  event: LambdaEvent;
  lambdaContext: LambdaContext;
};

export type BffApp = OpenAPIHono<{ Bindings: LambdaBindings }>;
