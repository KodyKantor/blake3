import { provideWasm } from './esm/browser/wasm';
import * as wasm from './dist/wasm/blake3/browser';

provideWasm(wasm);

export * from './esm/browser';
