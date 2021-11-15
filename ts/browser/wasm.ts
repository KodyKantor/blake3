import * as blake from '../../dist/wasm/blake3/browser/blake3_js';
import * as sha2 from '../../dist/wasm/sha2/browser/sha2_js';

let wasm: typeof blake;

/**
 * Gets the webassembly module provided in provideWasm.
 */
export const getWasm = (type: String) => {
  if (type === "blake3") {
    return require('../../dist/wasm/blake3/browser/blake3_js') as typeof blake;
    //return typeof blake;
  } else if (type === "sha2") {
    return require('../../dist/wasm/sha2/browser/sha2_js') as typeof sha2;
    //return typeof sha2;
  }
  if (!wasm) {
    throw new Error(
      'BLAKE3 webassembly not loaded. Please import the module via `blake3/browser` or `blake3/browser-async`',
    );
  }
  return require('../../dist/wasm/blake3/browser/blake3_js') as typeof blake;
};

/**
 * Sets the webassembly module used for the browser build. This indirection is
 * needed to provide compatibility between the "browser" and "browser-async" modes.
 */
export const provideWasm = (w: typeof blake) => {
  wasm = w;
};
