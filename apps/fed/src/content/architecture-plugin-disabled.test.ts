// /architecture against the setting that disables the plugin here (#733, ADR-0043 2026-10-15 amendment).
//
// WHY THIS EXISTS. The `tadeumendonca-skills` plugin is disabled in this repository (#715), and the page
// kept describing its hooks as if they ran here: the components grid, the refusal paragraphs and the
// production lane all read as this repository's loop. Nothing went red, because every check on this page
// compares the drawing with the PLUGIN, and the plugin did not change. What changed was a setting here.
//
// Two arms:
//
//   (a) While `.claude/settings.json` sets the plugin to `false`, every `##` section of either edition
//       that names a hook id from the manifest must carry the disabled-here sentence, and must carry it
//       BEFORE the first hook id it names. If the plugin is ever re-enabled here, the requirement lifts,
//       because the sentence would then be false.
//   (b) No persona-table row lists `devops`. The method that runs here split that skill into `scm`, `ci`
//       and `provisioning`; the plugin still ships it, which is how the column went stale.
//   (c) Neither edition, nor the plugin's repo card, calls the plugin a generated mirror of the method.
//       It is not one yet: its own README says it "becomes" one, and its main still ships skills the
//       method retired. Each edition instead carries the ADR-0043 sentence on the plugin's status.
//
// WHAT THIS CANNOT DO. Arm (a) checks that a sentence is PRESENT and placed first; it cannot check that
// any other sentence in the section is true. Arm (c) is a PHRASE CHECK: it catches the mirror claim in
// the words it was published in, and a paraphrase passes. Arm (b) is a ONE-IDENTIFIER SPELLING CHECK: it catches
// `devops` coming back and nothing else. The column's real source is the user-level agent definitions
// that `mhw install --method` writes, which no checkout in CI can read, so a skill added to or removed
// from a method preload reddens nothing here.
import { describe, it, expect } from 'vitest';
import architectureEn from './architecture.en.md?raw';
import architecturePt from './architecture.pt.md?raw';
import harness from './generated/harness.json';
import { repoCards } from '../data/repoCards';

const settingsModules = import.meta.glob('../../../../.claude/settings.json', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;
const settingsRaw = Object.values(settingsModules)[0];

const PLUGIN_KEY = 'tadeumendonca-skills@tadeumendonca';

// The sentence, verbatim per locale. Later slices reuse it, so it is pinned whole rather than by keyword.
const DISABLED_HERE: Record<string, string> = {
  en: 'The `tadeumendonca-skills` plugin is disabled in this repository, and the method that runs here comes from the workstation at user level.',
  pt: 'O plugin `tadeumendonca-skills` está desligado neste repositório, e o método que roda aqui vem da workstation, no nível do usuário.',
};
const BODY: Record<string, string> = { en: architectureEn, pt: architecturePt };
const LOCALES = ['en', 'pt'] as const;

type Component = { kind: string; id: string };
const components = harness as Component[];
const hookIds = [...new Set(components.filter((c) => c.kind === 'hook').map((c) => c.id.replace(/\.sh$/, '')))];
const personaIds = components.filter((c) => c.kind === 'persona').map((c) => c.id);

// A whole id, never a prefix or a suffix of a longer hyphenated name.
const firstIndexOfId = (text: string, id: string): number => {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`(?<![\\w-])${escaped}(?![\\w-])`).exec(text);
  return m ? m.index : -1;
};

const sections = (body: string): { heading: string; text: string }[] =>
  body
    .split(/^(?=## )/m)
    .map((text) => ({ heading: text.split('\n', 1)[0], text }));

const pluginDisabledHere = (): boolean => {
  const settings = JSON.parse(settingsRaw) as { enabledPlugins?: Record<string, boolean> };
  return settings.enabledPlugins?.[PLUGIN_KEY] === false;
};

describe('the page says the plugin is disabled here before it names a hook (#733)', () => {
  it('reads the committed settings and a manifest that carries hooks', () => {
    expect(typeof settingsRaw, 'the settings glob matched nothing').toBe('string');
    expect(settingsRaw).toContain(PLUGIN_KEY);
    expect(hookIds.length, 'the manifest carries no hooks — arm (a) would be vacuous').toBeGreaterThan(0);
  });

  it.each(LOCALES)('every %s section naming a hook carries the sentence before its first hook id', (locale) => {
    const naming = sections(BODY[locale])
      .map((s) => {
        const hits = hookIds.map((id) => firstIndexOfId(s.text, id)).filter((i) => i >= 0);
        return { ...s, firstHook: hits.length ? Math.min(...hits) : -1 };
      })
      .filter((s) => s.firstHook >= 0);
    // Anti-vacuity: the page does name the plugin's hooks, so a parse that finds none is broken.
    expect(naming.length, `${locale}: no section names a hook id — the split or the matcher broke`).toBeGreaterThan(0);
    if (!pluginDisabledHere()) return;
    for (const s of naming) {
      const at = s.text.indexOf(DISABLED_HERE[locale]);
      expect(at, `${locale} "${s.heading}" names a hook and never says the plugin is disabled here`).toBeGreaterThanOrEqual(0);
      expect(at, `${locale} "${s.heading}" names a hook before it says the plugin is disabled here`).toBeLessThan(
        s.firstHook,
      );
    }
  });
});

describe('the persona table lists no `devops` (#733)', () => {
  it.each(LOCALES)('no %s persona row carries the retired skill name', (locale) => {
    const rows = BODY[locale]
      .split('\n')
      .filter((line) => personaIds.some((id) => line.startsWith(`| \`${id}\` |`)));
    expect(rows.length, `${locale}: the persona table did not parse to one row per persona`).toBe(personaIds.length);
    const stale = rows.filter((row) => row.includes('`devops`')).map((row) => row.split('|')[1].trim());
    expect(stale, `${locale}: these rows still list devops, which the method split into scm, ci and provisioning`).toEqual([]);
  });
});

// The plugin's status, verbatim per locale: the ADR-0043 amendment's sentence, as page copy (#733).
const PLUGIN_STATUS: Record<string, string> = {
  en: 'The plugin is still published, but it is deprecated as a source, and its README points to `tedeuxx/mhw`.',
  pt: 'O plugin continua publicado, mas está descontinuado como fonte, e o README dele aponta para o `tedeuxx/mhw`.',
};
// The claim in the words each edition published it in.
const MIRROR_CLAIM: Record<string, RegExp> = {
  en: /generated mirror|\bmirror of (?:that|the) method/i,
  pt: /espelho gerado|espelho (?:desse|do) método/i,
};

describe('the page does not call the plugin a generated mirror (#733)', () => {
  it.each(LOCALES)('the %s edition makes no mirror claim and states the plugin status', (locale) => {
    expect(BODY[locale], `${locale}: the page calls the plugin a generated mirror again`).not.toMatch(MIRROR_CLAIM[locale]);
    expect(BODY[locale], `${locale}: the ADR-0043 sentence on the plugin's status is gone`).toContain(PLUGIN_STATUS[locale]);
  });

  it.each(LOCALES)('the plugin repo card makes no mirror claim in %s', (locale) => {
    const card = repoCards.find((r) => r.repoUrl === 'https://github.com/tedeuxx/tadeumendonca-skills');
    expect(card, 'the plugin card is gone from the registry').toBeDefined();
    expect(card?.description[locale]).not.toMatch(MIRROR_CLAIM[locale]);
  });
});
