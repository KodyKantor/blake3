import * as blake from '../../dist/wasm/blake3/nodejs/blake3_js';
import * as sha2 from '../../dist/wasm/sha2/nodejs/sha2_js';
import * as md5 from '../../dist/wasm/md5/nodejs/md5_js';

/**
 * Lazyily get the WebAssembly module. Used to avoid unnecessarily importing
 * the wasm when extending the WebAssembly node code for native bindings.
 */
export const getWasm = (type: String) => {
  if (type === "blake3") {
    return require('../../dist/wasm/blake3/nodejs/blake3_js') as typeof blake;
  } else if (type === "sha2") {
    return require('../../dist/wasm/sha2/nodejs/sha2_js') as typeof sha2;
  } else if (type === "md5") {
    return require('../../dist/wasm/md5/nodejs/md5_js') as typeof md5;
  }
  return require('../../dist/wasm/blake3/nodejs/blake3_js') as typeof blake;
};
