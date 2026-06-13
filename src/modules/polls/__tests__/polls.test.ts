import { describe, it, expect, vi, afterEach } from 'vitest';

const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('../../../shared/db/client', () => ({ ddb: { send } }));

import { app } from '../../../index';

const headers = { 'content-type': 'application/json' };

// The third arg to app.request is the Lambda event bindings — we inject the gateway authorizer claims
// (sub + optional cognito:groups) exactly as the real authorizer would, to exercise admin guards.
const claims = (groups?: string) => ({
  event: { requestContext: { authorizer: { claims: { sub: 'u-1', ...(groups ? { 'cognito:groups': groups } : {}) } } } },
});

const poll = {
  poll_id: 'p1',
  question: 'Qual seu serviço AWS favorito?',
  options: [
    { id: 'o1', label: 'Lambda' },
    { id: 'o2', label: 'DynamoDB' },
  ],
  published: true,
  created_at: '2026-06-01T00:00:00.000Z',
};

afterEach(() => vi.clearAllMocks());

describe('GET /polls (public list)', () => {
  it('lists published polls via the sparse by-created GSI (Query, no Scan), newest-first', async () => {
    send.mockResolvedValueOnce({
      Items: [
        { ...poll, poll_id: 'p2', gsi_pk: 'POLL', created_at: '2026-05-01T00:00:00Z' },
        { ...poll, poll_id: 'p1', gsi_pk: 'POLL', created_at: '2026-01-01T00:00:00Z' },
      ],
      LastEvaluatedKey: { poll_id: 'p1' },
    });
    const res = await app.request('/polls');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: Array<{ poll_id: string; gsi_pk?: string }>; next_cursor?: string };
    expect(body.items[0].poll_id).toBe('p2'); // GSI returns newest-first
    expect(body.items[0].gsi_pk).toBeUndefined(); // index key stripped from the API surface
    expect(body.next_cursor).toBeDefined(); // opaque cursor echoed from LastEvaluatedKey
    const cmd = send.mock.calls[0][0];
    expect(cmd.constructor.name).toBe('QueryCommand');
    expect(cmd.input.IndexName).toBe('by-created');
    expect(cmd.input.ExpressionAttributeValues[':pk']).toBe('POLL');
    expect(cmd.input.ScanIndexForward).toBe(false);
  });

  it('passes the decoded cursor through as ExclusiveStartKey', async () => {
    send.mockResolvedValueOnce({ Items: [] });
    const cursor = Buffer.from(JSON.stringify({ poll_id: 'p9' })).toString('base64url');
    await app.request(`/polls?cursor=${cursor}&limit=5`);
    const cmd = send.mock.calls[0][0];
    expect(cmd.input.ExclusiveStartKey).toEqual({ poll_id: 'p9' });
    expect(cmd.input.Limit).toBe(5);
  });
});

describe('GET /polls/{poll_id}', () => {
  it('returns a published poll', async () => {
    send.mockResolvedValueOnce({ Item: poll });
    const res = await app.request('/polls/p1');
    expect(res.status).toBe(200);
    expect(((await res.json()) as { poll_id: string }).poll_id).toBe('p1');
    expect(send.mock.calls[0][0].constructor.name).toBe('GetCommand');
  });

  it('404s a missing poll', async () => {
    send.mockResolvedValueOnce({});
    expect((await app.request('/polls/nope')).status).toBe(404);
  });

  it('404s an unpublished (draft) poll — drafts are not public', async () => {
    send.mockResolvedValueOnce({ Item: { ...poll, published: false } });
    expect((await app.request('/polls/p1')).status).toBe(404);
  });
});

describe('POST /polls/{poll_id}/votes (public)', () => {
  it('records a vote and returns updated counts — no auth required', async () => {
    send
      .mockResolvedValueOnce({ Item: poll }) // getById (validate option + published)
      .mockResolvedValueOnce({}) // ensure-map update
      .mockResolvedValueOnce({ Attributes: { vote_counts: { o1: 1 } } }); // ADD update
    const res = await app.request('/polls/p1/votes', { method: 'POST', headers, body: JSON.stringify({ option_id: 'o1' }) });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ vote_counts: { o1: 1 } });
    expect(send.mock.calls[2][0].input.ExpressionAttributeNames['#o']).toBe('o1');
    expect(send.mock.calls[2][0].input.ExpressionAttributeValues[':d']).toBe(1);
  });

  it('400s an option that does not belong to the poll', async () => {
    send.mockResolvedValueOnce({ Item: poll });
    const res = await app.request('/polls/p1/votes', { method: 'POST', headers, body: JSON.stringify({ option_id: 'ghost' }) });
    expect(res.status).toBe(400);
    expect(send).toHaveBeenCalledTimes(1); // no write attempted
  });

  it('404s a vote on a missing poll', async () => {
    send.mockResolvedValueOnce({});
    const res = await app.request('/polls/nope/votes', { method: 'POST', headers, body: JSON.stringify({ option_id: 'o1' }) });
    expect(res.status).toBe(404);
  });

  it('404s a vote on a draft poll', async () => {
    send.mockResolvedValueOnce({ Item: { ...poll, published: false } });
    const res = await app.request('/polls/p1/votes', { method: 'POST', headers, body: JSON.stringify({ option_id: 'o1' }) });
    expect(res.status).toBe(404);
  });

  it('maps a vanished-poll conditional failure to 404', async () => {
    send
      .mockResolvedValueOnce({ Item: poll }) // getById
      .mockRejectedValueOnce(Object.assign(new Error('x'), { name: 'ConditionalCheckFailedException' })); // ensure-map
    const res = await app.request('/polls/p1/votes', { method: 'POST', headers, body: JSON.stringify({ option_id: 'o1' }) });
    expect(res.status).toBe(404);
  });
});

describe('POST /polls (admin create)', () => {
  const body = JSON.stringify({ question: 'A ou B?', options: [{ label: 'A' }, { label: 'B' }], published: true });

  it('403s without a token', async () => {
    expect((await app.request('/polls', { method: 'POST', headers, body })).status).toBe(403);
  });

  it('403s a non-admin group', async () => {
    expect((await app.request('/polls', { method: 'POST', headers, body }, claims('registered'))).status).toBe(403);
  });

  it('400s fewer than two options (zod validation)', async () => {
    const bad = JSON.stringify({ question: 'one?', options: [{ label: 'only' }], published: false });
    const res = await app.request('/polls', { method: 'POST', headers, body: bad }, claims('admin'));
    expect(res.status).toBe(400);
  });

  it('creates a published poll with server-generated option ids + sparse gsi_pk', async () => {
    send.mockResolvedValueOnce({}); // createPoll Put
    const res = await app.request('/polls', { method: 'POST', headers, body }, claims('admin'));
    expect(res.status).toBe(201);
    const created = (await res.json()) as { poll_id: string; options: Array<{ id: string; label: string }>; gsi_pk?: string };
    expect(created.options).toHaveLength(2);
    expect(created.options[0].id).toBeTruthy(); // server-assigned
    expect(created.options[0].label).toBe('A');
    expect(created.gsi_pk).toBeUndefined(); // stripped from the API surface
    const item = send.mock.calls[0][0].input.Item;
    expect(item.gsi_pk).toBe('POLL'); // but written to the item for the sparse index
    expect(item.author_sub).toBe('u-1');
    expect(send.mock.calls[0][0].input.ConditionExpression).toContain('attribute_not_exists');
  });

  it('omits gsi_pk when created as a draft (kept out of the sparse index)', async () => {
    send.mockResolvedValueOnce({});
    const draft = JSON.stringify({ question: 'A ou B?', options: [{ label: 'A' }, { label: 'B' }], published: false });
    await app.request('/polls', { method: 'POST', headers, body: draft }, claims('admin'));
    expect(send.mock.calls[0][0].input.Item.gsi_pk).toBeUndefined();
  });
});

describe('PUT /polls/{poll_id} (admin update)', () => {
  it('preserves votes for options kept by id and prunes votes for removed options', async () => {
    send
      .mockResolvedValueOnce({ Item: { ...poll, vote_counts: { o1: 5, o2: 3 } } }) // getById
      .mockResolvedValueOnce({}); // savePoll Put
    const body = JSON.stringify({
      question: poll.question,
      options: [
        { id: 'o1', label: 'Lambda' }, // kept → votes survive
        { label: 'Step Functions' }, // new (o2 dropped) → o2 votes pruned
      ],
      published: true,
    });
    const res = await app.request('/polls/p1', { method: 'PUT', headers, body }, claims('admin'));
    expect(res.status).toBe(200);
    const item = send.mock.calls[1][0].input.Item;
    expect(item.vote_counts).toEqual({ o1: 5 }); // o2 pruned, o1 retained
    expect(item.options[1].id).toBeTruthy(); // new option got a fresh id
    expect(item.gsi_pk).toBe('POLL');
    expect(item.updated_at).toBeTruthy();
  });

  it('drops gsi_pk when unpublishing', async () => {
    send.mockResolvedValueOnce({ Item: poll }).mockResolvedValueOnce({});
    const body = JSON.stringify({ question: poll.question, options: [{ id: 'o1', label: 'Lambda' }, { id: 'o2', label: 'DynamoDB' }], published: false });
    await app.request('/polls/p1', { method: 'PUT', headers, body }, claims('admin'));
    expect(send.mock.calls[1][0].input.Item.gsi_pk).toBeUndefined();
  });

  it('404s updating a missing poll', async () => {
    send.mockResolvedValueOnce({});
    const body = JSON.stringify({ question: 'x', options: [{ label: 'A' }, { label: 'B' }], published: false });
    expect((await app.request('/polls/nope', { method: 'PUT', headers, body }, claims('admin'))).status).toBe(404);
  });

  it('403s a non-admin', async () => {
    const body = JSON.stringify({ question: 'x', options: [{ label: 'A' }, { label: 'B' }], published: false });
    expect((await app.request('/polls/p1', { method: 'PUT', headers, body }, claims('registered'))).status).toBe(403);
  });
});

describe('DELETE /polls/{poll_id} (admin)', () => {
  it('deletes an existing poll', async () => {
    send.mockResolvedValueOnce({ Item: poll }).mockResolvedValueOnce({});
    const res = await app.request('/polls/p1', { method: 'DELETE' }, claims('admin'));
    expect(res.status).toBe(204);
    expect(send.mock.calls[1][0].constructor.name).toBe('DeleteCommand');
  });

  it('404s deleting a missing poll', async () => {
    send.mockResolvedValueOnce({});
    expect((await app.request('/polls/nope', { method: 'DELETE' }, claims('admin'))).status).toBe(404);
  });

  it('403s a non-admin', async () => {
    expect((await app.request('/polls/p1', { method: 'DELETE' }, claims('registered'))).status).toBe(403);
  });
});
