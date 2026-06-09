// Binary asset imports (resvg wasm, Inter woff) are embedded by esbuild's `binary` loader as
// Uint8Array (esbuild.config.mjs). These ambient declarations type those imports for tsc/eslint.
declare module '*.wasm' {
  const data: Uint8Array;
  export default data;
}
declare module '*.woff' {
  const data: Uint8Array;
  export default data;
}
