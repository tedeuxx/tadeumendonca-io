// The personal journey photographs on /me (#127).
//
// WHY ITS OWN MODULE AND NOT `profile.ts`. Two reasons, and only the second one survives this slice.
// The near-term one: #416 (the role rename) is open against `profile.ts` — open rather than in flight,
// since it carries no `ready` label and has no PR at the time of writing — and a second slice editing the
// same file buys a conflict for nothing. The lasting one is the reason this file will still be here after
// that lands — `profile.ts` is the CV, and the CV is the thing `/cv.pdf` is PRINTED from. Everything in it
// is a claim a recruiter reads on paper. These four photographs are deliberately NOT claims: they carry no
// date, no employer, no title, and they are hidden in the print edition (see `JourneyStrip`). Putting them
// in the CV data would make the two-page budget in `e2e/cv-pdf.spec.ts` depend on a decorative strip, and
// would invite the next reader to treat a photograph as a credential.
//
// SHAPE: modelled on `library.ts` — the FACTS (which file) authored once with no locale, and the
// reader-facing prose leaves typed `Record<Locale, string>` so a missing translation is a COMPILE error.
// That is the contract `catalog.ts` lacked when it served Portuguese on `/en/portfolio` for three days
// (#235), and it matters more here than there: `alt` is the ONLY thing a reader who cannot see the
// photograph gets, so an untranslated one is not a cosmetic defect.
//
// ORDER IS AUTHORED, NOT SORTED, AND IT IS NOT THE AGENT'S TO CHANGE. The owner approved this exact set in
// this exact order (#127, 2026-08-25, "de acordo"). It is not chronological — 2020, 2020, 2022, 2022 — it
// is an order of reading: the craft, the work, the chapter, the place. A sort by date would silently
// discard that. Substituting, adding or reordering a photograph is an owner decision, not an
// implementation one, because what was approved was these four rather than a category.
//
// PROVENANCE AND REVERSIBILITY. The sources live outside this repo, in the owner's own library, and are
// deliberately not committed: what ships is a 660x880 grayscale derivative with every metadata segment
// removed. `scripts/photo-assets.test.mjs` proves the EXIF absence against the committed bytes, which is
// the half that can be checked here; the originals staying out of git is the half that cannot, and is a
// process fact recorded in the PR rather than a property of this file.
import { LOCALES, type Locale } from '../i18n';
import { photoFor, type PhotoAsset } from './photos';

/** An entry as AUTHORED: the filename, plus the two prose leaves. */
export interface JourneyEntry {
  /** Root-relative, and it must be a key of the photograph registry — see `assertJourneyShape`. */
  src: string;
  /**
   * What is in the frame, for a reader who never sees it.
   *
   * NOT the same string as `caption`, and the distinction is the one `PhotoFigure` already draws: `alt`
   * describes the frame, `caption` says what the photograph is doing on the page. Collapsing them gives a
   * screen-reader user the editorial line and none of the picture.
   */
  alt: Record<Locale, string>;
  /** What the photograph is doing here — reader-facing prose, authored per locale. */
  caption: Record<Locale, string>;
}

/** An entry as RENDERED: the same prose, with the filename resolved to its measured asset. */
export interface JourneyPhoto extends Omit<JourneyEntry, 'src'> {
  photo: PhotoAsset;
}

/**
 * Everything about an authored entry that TypeScript cannot say, checked at module load.
 *
 * MODELLED ON `assertLibraryShape`, including the part that matters most: it reads its ARGUMENT and never
 * the shipped array, so the test can feed it a bad entry and watch it throw. An assertion that can only be
 * exercised through the real, correct data is an assertion nobody has ever seen fail — which is this
 * workspace's recurring defect, not a hypothetical one.
 *
 * Three things it catches that the type system cannot:
 *
 *   1. A `src` that is not in `photos.json`. The registry is what supplies `width`/`height`, so an
 *      unregistered file renders with no reserved box — cumulative layout shift on every tile, which is
 *      the exact failure the registry was built to remove. `photoFor` returns `null` rather than guessing,
 *      by design, and a `null` the component branched on would degrade to three tiles silently.
 *   2. A blank prose leaf. `Record<Locale, string>` makes a MISSING locale a compile error and has nothing
 *      at all to say about `''`, and an empty `alt` is worse than a missing one: it declares the image
 *      decorative to a screen reader.
 *   3. `alt` equal to `caption`. They are two jobs (describe the frame / say what it is doing here), and
 *      collapsing them is the cheap mistake — it looks like less duplication and costs a reader who cannot
 *      see the photograph the whole photograph.
 */
export function assertJourneyShape(entries: readonly JourneyEntry[]): void {
  for (const { src, alt, caption } of entries) {
    if (!photoFor(src)) {
      throw new Error(`journey: ${src} is not in the photograph registry (src/data/photos.json)`);
    }
    for (const locale of LOCALES) {
      if (!alt[locale]?.trim()) throw new Error(`journey: ${src} has no ${locale} alt text`);
      if (!caption[locale]?.trim()) throw new Error(`journey: ${src} has no ${locale} caption`);
      if (alt[locale] === caption[locale]) {
        throw new Error(`journey: ${src} reuses its ${locale} caption as alt text`);
      }
    }
  }
}

/**
 * The four photographs, in the approved order.
 *
 * Every string below is reader-facing copy on a hiring surface, so it is `product-lead`'s to rule on and
 * not the builder's to rewrite. What the builder owns is that both editions exist and that `alt` and
 * `caption` are different jobs.
 */
const journey: readonly JourneyEntry[] = [
  {
    src: '/photos/journey-sticker-lid.jpg',
    alt: {
      pt: 'Homem sorrindo atrás da tampa aberta de um notebook coberta de adesivos de ferramentas — Amazon Web Services, Elastic Stack, Terraform, Flutter, npm, VS Code, SonarQube, Docker, Kubernetes, MongoDB, Redis, Python, Android — vestindo uma camiseta com uma baleia carregando contêineres.',
      en: 'A smiling man behind the open lid of a laptop covered in tool stickers — Amazon Web Services, Elastic Stack, Terraform, Flutter, npm, VS Code, SonarQube, Docker, Kubernetes, MongoDB, Redis, Python, Android — wearing a t-shirt of a whale carrying containers.',
    },
    caption: {
      pt: 'O ofício antes do empregador: o que eu escolhi aprender, colado na tampa.',
      en: 'The craft before the employer: what I chose to learn, stuck to the lid.',
    },
  },
  {
    src: '/photos/journey-home-office.jpg',
    alt: {
      pt: 'Homem de óculos em primeiro plano, de lado, com uma escrivaninha atrás: um monitor externo exibindo um painel de monitoramento com gráficos e um notebook aberto exibindo um editor de código em tema escuro.',
      en: 'A man in glasses in the foreground, turned to the side, with a desk behind him: an external monitor showing a monitoring dashboard of charts, and an open laptop showing a dark-theme code editor.',
    },
    caption: {
      pt: '2020, em casa: gráficos numa tela, código na outra, e ninguém por perto.',
      en: '2020, at home: charts on one screen, code on the other, and nobody around.',
    },
  },
  {
    src: '/photos/journey-aws-summit.jpg',
    alt: {
      pt: 'Homem de pé diante de um painel liso onde se lê "aws Summit São Paulo", usando um cordão com crachá pendurado no pescoço.',
      en: 'A man standing in front of a plain wall reading "aws Summit São Paulo", a lanyard and badge around his neck.',
    },
    caption: {
      pt: 'O nome na parede era o da empresa em que eu trabalhava. Eu estava lá a trabalho.',
      en: 'The name on the wall was the company I worked for. I was there on the job.',
    },
  },
  {
    src: '/photos/journey-corridor.jpg',
    alt: {
      pt: 'Homem de pé no meio de um corredor de escritório longo e vazio, com luminárias circulares e o forro aberto, mostrando dutos e tubulações; portas de elevador à direita.',
      en: 'A man standing in the middle of a long, empty office corridor, circular light fittings overhead and the ceiling opened up to show ducts and pipework; lift doors along the right.',
    },
    caption: {
      pt: 'Nunca aconteceu nada nesse corredor. A maior parte do trabalho tem essa cara.',
      en: 'Nothing ever happened in this corridor. Most of the work looks exactly like this.',
    },
  },
];

// Checked at module load, exactly as `library.ts` does it: a defect in the authored data fails the build
// and every test that imports it, rather than reaching a reader as a missing box or a silent `undefined`.
assertJourneyShape(journey);

/**
 * The set, with each `src` resolved to its measured asset.
 *
 * The non-null assertion is safe BECAUSE of the line above and for no other reason — `assertJourneyShape`
 * has already refused every `src` the registry does not know. Written as `!` rather than as a second
 * runtime branch on purpose: a branch here would be unreachable code that no test could cover honestly,
 * and an uncoverable branch is how a suite starts reporting numbers about lines nobody can exercise.
 */
export const JOURNEY_PHOTOS: readonly JourneyPhoto[] = journey.map(({ src, alt, caption }) => ({
  photo: photoFor(src)!,
  alt,
  caption,
}));
