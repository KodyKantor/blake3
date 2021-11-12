import * as blake from '../../dist/wasm/blake3/nodejs/blake3_js';
import * as sha2 from '../../dist/wasm/sha2/nodejs/sha2_js';

/**
 * Lazyily get the WebAssembly module. Used to avoid unnecessarily importing
 * the wasm when extending the WebAssembly node code for native bindings.
 */
export const getWasm = (type: String) => {
  //let w: typeof blake | undefined;
  if (type === "blake3") {
    //if (!w) {
    //  w = require('../../dist/wasm/blake3/nodejs/blake3_js') as typeof blake;
    //}
    return require('../../dist/wasm/blake3/nodejs/blake3_js') as typeof blake;
  } else if (type === "sha2") {
    //  w = require('../../dist/wasm/sha2/nodejs/sha2_js') as typeof blake;
    return require('../../dist/wasm/sha2/nodejs/sha2_js') as typeof sha2;
  } else {
    return require('../../dist/wasm/blake3/nodejs/blake3_js') as typeof blake;
  }

  //return w;
};
