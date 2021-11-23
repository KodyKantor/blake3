import * as wasm from './node';
import * as native from './node-native';
import { expect } from 'chai';
import { inputs } from './base/test-helpers';
import { ReadableStreamBuffer } from 'stream-buffers';

//const hashType = "blake3";

function suite({
  hash,
  createHash,
}: typeof wasm | typeof native, hashType: string) {
  let m_large: Buffer;
  let m_hello: Buffer;
  let m_goodbye: Buffer;
  switch(hashType) {
    case "blake3":
      m_large = inputs.large.blake3;
      m_hello = inputs.hello.blake3;
      m_goodbye = inputs.goodbye.blake3;
      break;
    case "md5":
      m_large = inputs.large.md5;
      m_hello = inputs.hello.md5;
      m_goodbye = inputs.goodbye.md5;
      break;
    default:
      throw new Error("unexpected hashing algorithm");
  }
  describe('encoding', () => {
    it('hashes a buffer', () => {
      expect(hash(hashType, Buffer.from(inputs.hello.input))).to.deep.equal(m_hello);
    });

    it('hashes a string', () => {
      expect(hash(hashType, inputs.hello.input)).to.deep.equal(m_hello);
    });

    it('hashes an arraybuffer', () => {
      const buf = Buffer.from(inputs.hello.input);
      expect(hash(hashType, new Uint8Array(buf).buffer)).to.deep.equal(m_hello);
    });
  });

  describe('memory-safety (#5)', () => {
    it('hash', () => {
      const hashA = hash(hashType, inputs.hello.input);
      const hashB = hash(hashType, inputs.goodbye.input);
      expect(hashA.toString('hex')).to.equal(m_hello.toString('hex'));
      expect(hashB.toString('hex')).to.equal(m_goodbye.toString('hex'));
    });

    it('hasher', () => {
      const hasherA = createHash(hashType);
      const hasherB = createHash(hashType);
      hasherA.update('hel');
      hasherB.update('good');
      hasherA.update('lo');
      hasherB.update('bye');

      const hashA = hasherA.digest();
      const hashB = hasherB.digest();
      expect(hashA.toString('hex')).to.equal(m_hello.toString('hex'));
      expect(hashB.toString('hex')).to.equal(m_goodbye.toString('hex'));
    });
  });

  describe('hasher', () => {
    it('digests', callback => {
      const buffer = new ReadableStreamBuffer();
      buffer.put(Buffer.from(inputs.large.input));
      buffer.stop();

      const hash = createHash(hashType);

      buffer.on('data', b => hash.update(b));
      buffer.on('end', () => {
        const actual = hash.digest();
        expect(actual).to.deep.equal(m_large);
        callback();
      });
    });

    it('is a transform stream', callback => {
      const buffer = new ReadableStreamBuffer();
      buffer.put(Buffer.from(inputs.large.input));
      buffer.stop();

      buffer
        .pipe(createHash(hashType))
        .on('error', callback)
        .on('data', (hash: any) => {
          expect(hash).to.deep.equal(m_large);
          callback();
        });
    });

    it('customizes the output length', () => {
      const hash = createHash(hashType);
      hash.update(inputs.hello.input);
      expect(hash.digest('hex', { length: 16 })).to.equal(
        m_hello.slice(0, 16).toString('hex'),
      );
    });

    it('throws on write after dispose', () => {
      const hash = createHash(hashType);
      hash.dispose();
      expect(() => hash.update('')).to.throw(/after dispose/);
    });
  });
}

describe('blake3 node.js wasm', () => suite(wasm, "blake3"));
describe('blake3 node.js native', () => suite(native, "blake3"));

//describe('md5 node.js wasm', () => suite(wasm, "md5")); // Currently broken.
describe('md5 node.js native', () => suite(native, "md5"));
