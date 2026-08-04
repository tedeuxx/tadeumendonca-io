// The version layer (#345). Two constants and two URL builders, and only ONE of them has logic worth a
// suite: `resolvePluginVersion`, which chooses between the deploy's env var and the committed floor.
//
// IT IS TESTED AS A FUNCTION, never through `import.meta.env`. `VITE_PLUGIN_VERSION` is undefined under
// vitest, so a test that set it would be testing the harness; and a test that asserted `PLUGIN_VERSION`
// against the same JSON the module imports would be the circular assertion this repo has paid for before
// — the same literal on both sides of the equals. What is worth pinning is the CHOICE, driven by inputs
// the test supplies.
import { describe, it, expect } from 'vitest';
import {
  PLUGIN_VERSION,
  SITE_VERSION,
  pluginReleaseUrl,
  releaseUrl,
  resolvePluginVersion,
} from './version';

describe('resolvePluginVersion — the deploy overrides the floor, and empty is not a value', () => {
  it('prefers the deploy-resolved override', () => {
    expect(resolvePluginVersion('0.9.12', '0.4.41')).toBe('0.9.12');
  });

  it('falls through to the committed floor when the override is absent', () => {
    expect(resolvePluginVersion(undefined, '0.4.41')).toBe('0.4.41');
  });

  // THE NAMED BUG. `??` catches only null/undefined, and the shapes a shell actually delivers are `''`
  // (an unset `$(cat VERSION)`) and a stray newline. Both are present-but-useless: with `??` they would
  // win the resolution and then fail validation, turning a deploy-time hiccup into a hard build failure
  // instead of a fall-through to a perfectly good committed tag.
  it('treats an empty or whitespace override as absent, not as a value', () => {
    expect(resolvePluginVersion('', '0.4.41')).toBe('0.4.41');
    expect(resolvePluginVersion('   ', '0.4.41')).toBe('0.4.41');
    expect(resolvePluginVersion('\n', '0.4.41')).toBe('0.4.41');
  });

  it('trims a value that arrived with the newline `cat` leaves on it', () => {
    expect(resolvePluginVersion('0.9.12\n', '0.4.41')).toBe('0.9.12');
  });

  // Validation is on the RESOLVED value, so a malformed floor is caught even when it is the one in use,
  // and a malformed override is caught even though the floor beside it is fine — an override that is
  // present and wrong is a deploy exporting garbage, which must fail rather than ship a 404 link.
  it('throws on a malformed resolved value, from either source', () => {
    expect(() => resolvePluginVersion(undefined, 'v0.4.41')).toThrow(/no `v` prefix/);
    expect(() => resolvePluginVersion('not-a-version', '0.4.41')).toThrow(/unusable plugin version/);
    expect(() => resolvePluginVersion(undefined, '')).toThrow(/unusable plugin version/);
    expect(() => resolvePluginVersion(undefined, '0.4')).toThrow(/unusable plugin version/);
  });

  // The message has to name where to look, because the two sources fail for different reasons and the
  // reader cannot tell which one produced the string.
  it('names both sources in the failure', () => {
    expect(() => resolvePluginVersion('bad', 'bad')).toThrow(/VITE_PLUGIN_VERSION/);
    expect(() => resolvePluginVersion('bad', 'bad')).toThrow(/plugin-release\.json/);
  });
});

describe('the release URL builders', () => {
  // Both constants must be usable as tags — asserted by SHAPE rather than against a literal, which would
  // just re-read the file the module read.
  it('resolves both versions to a bare X.Y.Z', () => {
    expect(SITE_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    expect(PLUGIN_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('adds the `v` the stored versions deliberately omit', () => {
    expect(releaseUrl('1.2.3')).toBe('https://github.com/tedeuxx/tadeumendonca-io/releases/tag/v1.2.3');
    expect(pluginReleaseUrl('https://github.com/tedeuxx/other', '1.2.3')).toBe(
      'https://github.com/tedeuxx/other/releases/tag/v1.2.3',
    );
  });

  // `repoUrl` is a parameter, unlike `releaseUrl`'s hardcoded origin: which repo a card points at is data
  // on the card. This fails if the builder ever infers the repo instead of being handed it.
  it('points at the repo it is given rather than at this one', () => {
    expect(pluginReleaseUrl('https://github.com/tedeuxx/tadeumendonca-skills')).toContain(
      '/tedeuxx/tadeumendonca-skills/releases/tag/v',
    );
    expect(pluginReleaseUrl('https://github.com/tedeuxx/tadeumendonca-skills')).toContain(PLUGIN_VERSION);
  });
});
