import { BaseHashInput, inputToArray, IBaseHashOptions, defaultHashLength } from '../base/hash-fn';
import {
  hash as b3_rawHash,
  create_derive as b3_createDerive,
  create_keyed as b3_createKeyed,
} from '../../dist/wasm/blake3/nodejs/blake3_js';
import {
  hash as md5_rawHash,
} from '../../dist/wasm/md5/nodejs/md5_js';
import {
  hash as sha2_rawHash,
} from '../../dist/wasm/sha2/nodejs/sha2_js';

/**
 * Input used for node-based hashes.
 */
export type HashInput = BaseHashInput | string;

/**
 * @hidden
 */
export const normalizeInput = (input: HashInput, encoding?: BufferEncoding): Uint8Array =>
  inputToArray(typeof input === 'string' ? Buffer.from(input, encoding) : input);

/**
 * Returns a blake3 hash of the input, returning the binary hash data.
 */
export function hash(
  algo: string,
  input: HashInput,
  { length = defaultHashLength }: IBaseHashOptions = {},
): Buffer | string {
  let func;
  if (algo === "blake3") {
    func = b3_rawHash;
  } else if (algo === "sha2") {
    func = sha2_rawHash;
  } else if (algo === "md5") {
    func = md5_rawHash;
  } else {
    func = b3_rawHash;
  }
  const result = Buffer.alloc(length);
  func(normalizeInput(input), result);
  return result;
}

/**
 * Given cryptographic key material  and a context string, services a subkey of
 * any length. See {@link https://docs.rs/blake3/0.1.3/blake3/fn.derive_key.html}
 * for more information.
 */
export function deriveKey(
  context: string,
  material: HashInput,
  { length = defaultHashLength }: IBaseHashOptions = {},
) {
  const derive = b3_createDerive(context);
  derive.update(normalizeInput(material));
  const result = Buffer.alloc(length);
  derive.digest(result);
  return result;
}

/**
 * The keyed hash function. See {@link https://docs.rs/blake3/0.1.3/blake3/fn.keyed_hash.html}.
 */
export function keyedHash(
  key: Buffer,
  input: HashInput,
  { length = defaultHashLength }: IBaseHashOptions = {},
) {
  if (key.length !== 32) {
    throw new Error(`key provided to keyedHash must be 32 bytes, got ${key.length}`);
  }

  const derive = b3_createKeyed(key);
  derive.update(normalizeInput(input));
  const result = Buffer.alloc(length);
  derive.digest(result);
  return result;
}
