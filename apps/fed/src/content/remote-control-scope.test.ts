// Remote Control scope guard (#384).
//
// The /architecture page and the README both make ONE claim about `remoteControlAtStartup`, and it is a
// claim about the TOOL rather than about this repo: a repo-scoped `.claude/settings.json` cannot turn
// Remote Control ON. Measured against the shipped CLI (2.1.243), in the settings resolver that reads the
// key — project and local settings are consulted only for the value `false`, and a `true` there is
// dropped with `repo-scoped settings cannot enable Remote Control; set it at user scope (/config)`.
//
// Three things can rot here, and each has its own test below.
//
// 1. THE DECISION. The owner's call on #384 was that this repo commits NEITHER value: `true` is inert
//    (per the measurement) and `false` would take the capability away from a forker who wants it. That
//    decision lives in prose in two files, which is exactly where a decision goes to die quietly — so it
//    is asserted here instead. Note the asymmetry of what is asserted: an ABSENT key passes and `false`
//    passes, because `false` is a legitimate thing for some other repo to commit and this test travels
//    with a fork. `true` fails, and it fails for a reason that is true of every fork of this repo: the
//    CLI ignores it, so committing it ships a line that reads like a setting and is not one.
//
// 2. THE PROSE, in both editions. `architecture-links.test.ts` asserts cross-locale parity of in-repo
//    blob URLs — and this section deliberately links the README through the bare repo-root + anchor
//    form, the same shape the fork-to-live paragraph already uses, which that regex does not match. So
//    the new copy has no parity cover from that suite at all. It gets it here, and on a key that is
//    locale-independent by construction: the quoted CLI string, which is a quotation and is therefore
//    untranslated in both editions.
//
// 3. THE README. It is the canonical owner of the setup step (`architecture.*.md` says so, in the
//    fork-to-live paragraph), and the page links to it by anchor. An anchor is a string that no compiler
//    checks, so the heading it points at is asserted verbatim.
import { describe, it, expect } from 'vitest';
import architectureEn from './architecture.en.md?raw';
import architecturePt from './architecture.pt.md?raw';

// Dotfile + repo-root globs need literal paths: `../../../../.claude/**` does not match a leading dot,
// and `../../../../*.md` would not reach the root README from inside a package. Both are spelled out,
// the same fix `architecture-links.test.ts` records for `iac/.checkov.yaml`.
const rootModules = import.meta.glob('../../../../.claude/settings.json', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;
const readmeModules = import.meta.glob('../../../../README.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const committedSettingsRaw = Object.values(rootModules)[0];
const readme = Object.values(readmeModules)[0];

// The exact clause the CLI emits when a repo tries to enable it. Quoted in both editions and in the
// README, untranslated, because it is a quotation of the tool.
const CLI_REFUSAL = 'repo-scoped settings cannot enable Remote Control';
const README_HEADING = '### Remote control, and why it is not committed';
// The anchor GitHub derives from that heading, as both editions link it.
const README_ANCHOR = '#remote-control-and-why-it-is-not-committed';

describe('remoteControlAtStartup — scope, and the decision not to commit it (#384)', () => {
  // Vacuity guard. A glob that silently matched nothing would make every assertion below pass by
  // reading `undefined`, which is the failure shape this repo's own suites keep recording.
  it('resolves the committed settings file and the root README', () => {
    expect(typeof committedSettingsRaw).toBe('string');
    expect(committedSettingsRaw).toContain('"permissions"');
    expect(typeof readme).toBe('string');
    expect(readme).toContain('## Fork to live');
  });

  it('does not enable Remote Control from repo scope — the CLI would ignore it', () => {
    const settings = JSON.parse(committedSettingsRaw) as Record<string, unknown>;
    // Absent is the state #384 decided on; `false` stays legal because it is the one value repo scope
    // can actually carry. Only `true` is a defect, and it is a defect in every fork, not just this one.
    expect(settings.remoteControlAtStartup).not.toBe(true);
  });

  it.each([
    ['en', architectureEn],
    ['pt', architecturePt],
  ] as const)('the %s edition states the measured behaviour, not the key name', (_locale, body) => {
    expect(body).toContain('remoteControlAtStartup');
    // The measurement itself. Naming the key without this clause is the inferred-from-the-name claim
    // the issue exists to prevent.
    expect(body).toContain(CLI_REFUSAL);
    // And it points at the canonical setup step rather than restating it.
    expect(body).toContain(README_ANCHOR);
  });

  it('keeps the section the two editions link to, under the heading they anchor', () => {
    expect(readme).toContain(README_HEADING);
    // Both methods, named by their location — this is the acceptance criterion the page delegates here.
    expect(readme).toContain('~/.claude/settings.json');
    expect(readme).toContain(CLI_REFUSAL);
    // The version the behaviour was read out of. A measurement without the build it was taken on is a
    // standing fact, and this one is not.
    expect(readme).toContain('2.1.243');
  });
});
