// Build the AWS-ready OpenAPI from the Hono app for `put-rest-api` (/backend/openapi,
// /infrastructure/api-gateway). Takes the generated contract and injects, per route:
//   - x-amazon-apigateway-integration → the single BFF Lambda (AWS_PROXY)
//   - an OPTIONS (MOCK) preflight + gateway responses for CORS (the gateway owns preflight + errors;
//     the BFF echoes the origin on 2xx). Phase 1 routes are public — the Cognito authorizer is added
//     per protected route in Phase 2.
import { writeFileSync } from 'node:fs';
import { app } from '../src/index';

/* eslint-disable @typescript-eslint/no-explicit-any */

const invokeArn = process.env.INVOKE_ARN_BFF;
const spaOrigin = process.env.SPA_ORIGIN ?? 'https://staging.tadeumendonca.io';
const version = process.env.API_VERSION ?? '0.0.0';
const out = process.env.OPENAPI_OUT ?? 'openapi.aws.json';

if (!invokeArn) throw new Error('INVOKE_ARN_BFF is required (the BFF Lambda proxy integration URI)');

const doc: any = app.getOpenAPI31Document({
  openapi: '3.0.1',
  info: { title: 'tadeumendonca-api', version },
});

const bffIntegration = {
  type: 'aws_proxy',
  httpMethod: 'POST', // Lambda proxy integrations always POST to the function
  uri: invokeArn,
  passthroughBehavior: 'when_no_match',
};

const corsOptions = {
  responses: {
    '200': {
      description: 'CORS preflight',
      headers: {
        'Access-Control-Allow-Origin': { schema: { type: 'string' } },
        'Access-Control-Allow-Methods': { schema: { type: 'string' } },
        'Access-Control-Allow-Headers': { schema: { type: 'string' } },
      },
    },
  },
  'x-amazon-apigateway-integration': {
    type: 'mock',
    requestTemplates: { 'application/json': '{"statusCode":200}' },
    responses: {
      default: {
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': `'${spaOrigin}'`,
          'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'",
          'method.response.header.Access-Control-Allow-Headers': "'authorization,content-type'",
        },
      },
    },
  },
};

// Plain Hono routes (not app.openapi) aren't in the generated document — add them so the gateway
// routes them to the BFF too. Path params use the {param} form API Gateway expects.
doc.paths = doc.paths ?? {};
const pathParam = (name: string) => ({ name, in: 'path', required: true, schema: { type: 'string' } });
const ensure = (path: string, def: unknown) => {
  if (!doc.paths[path]) doc.paths[path] = def;
};
ensure('/health', { get: { responses: { '200': { description: 'OK' } } } });
ensure('/og-meta/{type}/{slug}', {
  get: { parameters: [pathParam('type'), pathParam('slug')], responses: { '200': { description: 'OG meta' } } },
});
ensure('/prerender/{type}/{slug}', {
  get: { parameters: [pathParam('type'), pathParam('slug')], responses: { '200': { description: 'Prerendered HTML' } } },
});

for (const pathItem of Object.values(doc.paths) as any[]) {
  for (const method of Object.keys(pathItem)) {
    if (method === 'options' || method.startsWith('x-')) continue;
    pathItem[method]['x-amazon-apigateway-integration'] = bffIntegration;
  }
  pathItem.options = corsOptions; // gateway-owned preflight
}

doc['x-amazon-apigateway-gateway-responses'] = {
  DEFAULT_4XX: {
    responseParameters: { 'gatewayresponse.header.Access-Control-Allow-Origin': `'${spaOrigin}'` },
  },
  DEFAULT_5XX: {
    responseParameters: { 'gatewayresponse.header.Access-Control-Allow-Origin': `'${spaOrigin}'` },
  },
};

writeFileSync(out, JSON.stringify(doc, null, 2) + '\n');
console.log(`wrote ${out} (${Object.keys(doc.paths ?? {}).length} paths, BFF proxy + CORS)`);
