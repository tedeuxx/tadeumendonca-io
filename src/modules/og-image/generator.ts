// OG image generator (/backend/og-image-generator): satori (element tree → SVG) + resvg-wasm
// (SVG → PNG). WASM (not the @resvg native build) so esbuild bundles a single self-contained file —
// no per-platform .node binary to ship. The wasm + fonts are embedded at build via esbuild's `binary`
// loader (esbuild.config.mjs), so there are no runtime file reads. 1200×630 is the OG standard size.
//
// TRADE-OFFs: WASM renders a touch slower than native (irrelevant — images are cached in S3 and
// regenerated rarely); satori only supports flexbox layout + a fixed font set (no system fonts).
import satori from 'satori';
import { initWasm, Resvg } from '@resvg/resvg-wasm';
// These imports resolve to Uint8Array via esbuild's binary loader (.wasm / .woff).
import resvgWasm from '@resvg/resvg-wasm/index_bg.wasm';
import interRegular from '@fontsource/inter/files/inter-latin-400-normal.woff';
import interBold from '@fontsource/inter/files/inter-latin-700-normal.woff';
import type { Profile, Post } from '../../shared/types/entities';

const WIDTH = 1200;
const HEIGHT = 630;

// initWasm throws if called twice — memoise so concurrent invocations on a warm Lambda share one init.
let wasmReady: Promise<void> | undefined;
const ensureWasm = (): Promise<void> => (wasmReady ??= initWasm(resvgWasm as unknown as ArrayBuffer));

// satori takes a React-element-like tree; we build it with plain objects (no JSX/React dep). Every
// node with multiple children must declare display:flex — satori only lays out flexbox.
/* eslint-disable @typescript-eslint/no-explicit-any */
const el = (type: string, style: Record<string, unknown>, children: any): any => ({
  type,
  props: { style, children },
});

function card(profile: Profile): any {
  const skills = Object.values(profile.skills).flat().slice(0, 6).join(' · ');
  return el(
    'div',
    {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '90px',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      fontFamily: 'Inter',
    },
    [
      el('div', { display: 'flex', width: '120px', height: '10px', backgroundColor: '#38bdf8', marginBottom: '48px' }, ''),
      el('div', { fontSize: '76px', fontWeight: 700, lineHeight: 1.1 }, profile.name),
      el('div', { fontSize: '40px', marginTop: '24px', color: '#38bdf8' }, profile.headline),
      skills
        ? el('div', { fontSize: '28px', marginTop: '40px', color: '#94a3b8' }, skills)
        : el('div', { display: 'flex' }, ''),
    ],
  );
}

// Post share card — the title is the hero; the date + tags sit below the accent bar.
function postCardNode(post: Post): any {
  const tags = (post.tags ?? []).slice(0, 4).map((t) => `#${t}`).join('  ');
  return el(
    'div',
    {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '90px',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      fontFamily: 'Inter',
    },
    [
      el('div', { display: 'flex', width: '120px', height: '10px', backgroundColor: '#38bdf8', marginBottom: '48px' }, ''),
      el('div', { fontSize: '64px', fontWeight: 700, lineHeight: 1.15 }, post.title),
      el(
        'div',
        { display: 'flex', fontSize: '28px', marginTop: '40px', color: '#94a3b8' },
        tags ? `${post.created_at.slice(0, 10)}   ${tags}` : post.created_at.slice(0, 10),
      ),
    ],
  );
}

async function toPng(node: any): Promise<Uint8Array> {
  const svg = await satori(node, {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      { name: 'Inter', data: interRegular as unknown as ArrayBuffer, weight: 400, style: 'normal' },
      { name: 'Inter', data: interBold as unknown as ArrayBuffer, weight: 700, style: 'normal' },
    ],
  });
  await ensureWasm();
  return new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng();
}

export const generateOgImage = (profile: Profile): Promise<Uint8Array> => toPng(card(profile));
export const generatePostImage = (post: Post): Promise<Uint8Array> => toPng(postCardNode(post));
