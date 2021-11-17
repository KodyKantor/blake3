import { blake3, sha2, md5, INativeReader } from './native';
import { NodeHash } from '../node/hash-instance';
import { NodeHashReader } from '../node/hash-reader';

// A buffer we reuse for sending bigints. set_position is synchronous, so
// this just saves creating garbage.
const bigIntBuffer = Buffer.alloc(8);

const readerFactory = (r: INativeReader) =>
  new NodeHashReader({
    fill: target => r.fill(target),
    set_position: position => {
      bigIntBuffer.writeBigUInt64BE(position);
      r.set_position(bigIntBuffer);
    },
  });

/**
 * A Node.js crypto-like createHash method.
 */
export const createHash = (type: String) => {
  if (type === "blake3") {
    return new NodeHash(new blake3.Hasher(), readerFactory);
  } else if (type === "sha2") {
    return new NodeHash(new sha2.Hasher(), readerFactory);
  } else if (type === "md5") {
    return new NodeHash(new md5.Hasher(), readerFactory);
  }
  return new NodeHash(new blake3.Hasher(), readerFactory);
}

/**
 * Construct a new Hasher for the keyed hash function.
 */
export const createKeyed = (key: Buffer) => new NodeHash(new blake3.Hasher(key), readerFactory);

/**
 * Construct a new Hasher for the key derivation function.
 */
export const createDeriveKey = (context: string) =>
  new NodeHash(new blake3.Hasher(undefined, context), readerFactory);
