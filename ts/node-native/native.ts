import { IInternalHash } from '../base/index';

export interface INativeReader {
  free?(): void;
  fill(target: Uint8Array): void;
  set_position(position: Buffer): void;
}

export interface INativeHash extends IInternalHash<INativeReader> {
  new (hashKey?: Buffer, context?: string): INativeHash;
}

export interface INativeModule {
  Hasher: INativeHash;
  hash(input: Buffer, length: number): Buffer;
}

const blake3: INativeModule = require('../blake3/native.node');
const sha2: INativeModule = require('../sha2/native.node');

export {
  blake3 as blake3,
  sha2 as sha2,
};
