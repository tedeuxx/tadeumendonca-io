import { describe, it, expect } from 'vitest';
import { markdownPayload } from './shareMarkdown';
import { SITE_URL } from '../lib/site';

// The locale prefixer, as the real `useLocalePath` behaves — pinned here rather than imported so the
// payload's own contract ("root-relative targets go through the caller's localizer") is what is under
// test, not the localizer.
const lp = (path: string) => `/pt${path === '/' ? '' : path}`;

const build = (body: string, overrides: Partial<Parameters<typeof markdownPayload>[0]> = {}) =>
  markdownPayload({
    title: 'Arquitetura',
    path: '/pt/architecture',
    body,
    localizePath: lp,
    sourceLabel: 'Fonte',
    adrIndexLabel: 'Índice de decisões (ADRs), no repositório',
    adrIndexUrl: 'https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr',
    ...overrides,
  });

describe('the copied markdown payload', () => {
  it('leads with a generated H1 — no body on this site authors one', () => {
    expect(build('Corpo.')).toMatch(/^# Arquitetura\n/);
  });

  it('carries the canonical URL as an attribution line, directly under the title', () => {
    const out = build('Corpo.');
    expect(out).toContain(`> Fonte: ${SITE_URL}/pt/architecture`);
    // Position is part of the claim: a paste that gets truncated keeps its head, and an attribution that
    // only exists after the last paragraph is one a partial quote drops. Asserting containment alone
    // would stay green if the line moved to the end.
    expect(out.indexOf('> Fonte:')).toBeLessThan(out.indexOf('Corpo.'));
  });

  // THE UTM DECISION, asserted rather than trusted. Every other share URL on this site is tagged (#272),
  // so the clean one is the exception and an accidental `withShareUtm` here would look like consistency.
  it('emits a CLEAN canonical URL — this is a citation, not a click target', () => {
    const out = build('Corpo.');
    expect(out).not.toMatch(/utm_source|utm_medium|utm_campaign/);
    expect(out).toContain(`${SITE_URL}/pt/architecture\n`);
  });

  it('makes root-relative links absolute, in the reader’s own edition', () => {
    const out = build('Estão na [Biblioteca](/library), com nota.');
    expect(out).toContain(`[Biblioteca](${SITE_URL}/pt/library)`);
    // The failure this closes is a DEAD link in someone else's notes, so the relative form must be gone,
    // not merely accompanied.
    expect(out).not.toContain('](/library)');
  });

  it('preserves a link title while absolutizing its target', () => {
    expect(build('[A](/library "A estante")')).toContain(`[A](${SITE_URL}/pt/library "A estante")`);
  });

  it('rewrites image targets too — the syntax is the same and so is the breakage', () => {
    expect(build('![Card](/og-default.png)')).toContain(`![Card](${SITE_URL}/pt/og-default.png)`);
  });

  it('leaves external, protocol-relative, mailto and anchor targets exactly as authored', () => {
    const body = [
      '[ADR](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0002-x.md)',
      '[CDN](//cdn.example.com/x.png)',
      '[Mail](mailto:someone@example.com)',
      '[Section](#uma-secao)',
    ].join('\n\n');
    const out = build(body);
    expect(out).toContain('[ADR](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0002-x.md)');
    expect(out).toContain('[CDN](//cdn.example.com/x.png)');
    expect(out).toContain('[Mail](mailto:someone@example.com)');
    expect(out).toContain('[Section](#uma-secao)');
  });

  // The fence is EMPTY in source and only means anything to the renderer. Copied verbatim the reader gets
  // three backticks and nothing, which is the defect — so the assertion is that the marker is GONE and
  // something useful stands where it was.
  it('replaces the empty adr-index fence with a link to the library it would have expanded into', () => {
    const out = build('Antes.\n\n```adr-index\n```\n\nDepois.');
    expect(out).not.toContain('adr-index');
    expect(out).toContain(
      '[Índice de decisões (ADRs), no repositório](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr)',
    );
    // The prose either side survives — this is a substitution, not a truncation at the marker.
    expect(out).toContain('Antes.');
    expect(out).toContain('Depois.');
  });

  it('leaves mermaid fences alone — GitHub and most readers render them', () => {
    const body = '```mermaid\naccTitle: Um diagrama\nflowchart TD\n  a --> b\n```';
    expect(build(body)).toContain(body);
  });

  // `{{years}}` is handled by WHERE the body comes from, not by a transform here, so the guard that
  // matters is at the page level (RampUpPage.test.tsx). What is asserted here is the other half of that
  // design: this function does not silently paper over a raw import either.
  it('does not invent a {{years}} resolver — the caller passes the body it renders', () => {
    expect(build('Sao {{years}} anos.')).toContain('{{years}}');
  });

  it('never emits frontmatter — the body it receives has none, and it adds none', () => {
    const out = build('Corpo.');
    expect(out).not.toMatch(/^---$/m);
    expect(out).not.toMatch(/\bslug:|\bdate:|\btrack:|\bhasVideo:/);
  });

  it('ends with exactly one trailing newline, whatever whitespace the body carried', () => {
    expect(build('Corpo.\n\n\n')).toMatch(/Corpo\.\n$/);
  });
});
