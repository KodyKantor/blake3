import { blake3, sha2, md5 } from './native';
import { HashInput } from '../node/hash-fn';
import { IBaseHashOptions, defaultHashLength } from '../base/hash-fn';

/**
 * @hidden
 */
export const normalizeInput = (input: HashInput, encoding?: BufferEncoding): Buffer => {
  if (input instanceof Buffer) {
    return input;
  }

  if (typeof input === 'string') {
    return Buffer.from(input, encoding);
  }

  return Buffer.from(input as Uint8Array);
};

/**
 * Returns a blake3 hash of the input, returning the binary hash data.
 */
export function hash(
  type: string,
  input: HashInput,
  { length = defaultHashLength }: IBaseHashOptions = {},
): Buffer | string {
  const m_input = normalizeInput(input);
  if (type === "blake3") {
    return blake3.hash(m_input, length);
  } else if (type === "sha2") {
    return sha2.hash(m_input, length);
  } else if (type === "md5") {
    return md5.hash(m_input, 16);
  } else {
    return blake3.hash(m_input, length);
  }
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
  const hasher = new blake3.Hasher(undefined, context);
  hasher.update(normalizeInput(material));
  const result = Buffer.alloc(length);
  hasher.digest(result);
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
  const hasher = new blake3.Hasher(key);
  hasher.update(normalizeInput(input));
  const result = Buffer.alloc(length);
  hasher.digest(result);
  return result;
}
