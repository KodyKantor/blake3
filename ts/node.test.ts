import * as wasm from './node';
import * as native from './node-native';
import { expect } from 'chai';
import { inputs, /*hello48,*/ ogTestVectors } from './base/test-helpers';
import { ReadableStreamBuffer } from 'stream-buffers';
//import { maxHashBytes } from './base/hash-reader';

const hashType = "blake3";

function suite({
  hash,
  createHash,
//  keyedHash,
//  deriveKey,
//  createDeriveKey,
//  createKeyed,
}: typeof wasm | typeof native) {
  describe('encoding', () => {
    it('hashes a buffer', () => {
      expect(hash(hashType, Buffer.from(inputs.hello.input))).to.deep.equal(inputs.hello.hash);
    });

    it('hashes a string', () => {
      expect(hash(hashType, inputs.hello.input)).to.deep.equal(inputs.hello.hash);
    });

    it('hashes an arraybuffer', () => {
      const buf = Buffer.from(inputs.hello.input);
      expect(hash(hashType, new Uint8Array(buf).buffer)).to.deep.equal(inputs.hello.hash);
    });

    it('customizes the output length', () => {
      expect(hash(inputs.hello.input, { length: 16 })).to.deep.equal(
        inputs.hello.hash.slice(0, 16),
      );
    });
  });

  describe('memory-safety (#5)', () => {
    it('hash', () => {
      const hashA = hash(hashType, 'hello');
      const hashB = hash(hashType, 'goodbye');
      expect(hashA.toString('hex')).to.equal(
        'ea8f163db38682925e4491c5e58d4bb3506ef8c14eb78a86e908c5624a67200f',
      );
      expect(hashB.toString('hex')).to.equal(
        'f94a694227c5f31a07551908ad5fb252f5f0964030df5f2f200adedfae4d9b69',
      );
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
      expect(hashA.toString('hex')).to.equal(
        'ea8f163db38682925e4491c5e58d4bb3506ef8c14eb78a86e908c5624a67200f',
      );
      expect(hashB.toString('hex')).to.equal(
        'f94a694227c5f31a07551908ad5fb252f5f0964030df5f2f200adedfae4d9b69',
      );
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
        expect(actual).to.deep.equal(inputs.large.hash);
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
          expect(hash).to.deep.equal(inputs.large.hash);
          callback();
        });
    });

    it('customizes the output length', () => {
      const hash = createHash(hashType);
      hash.update(inputs.hello.input);
      expect(hash.digest('hex', { length: 16 })).to.equal(
        inputs.hello.hash.slice(0, 16).toString('hex'),
      );
    });

    it('throws on write after dispose', () => {
      const hash = createHash(hashType);
      hash.dispose();
      expect(() => hash.update('')).to.throw(/after dispose/);
    });

    it('allows taking incremental hashes', () => {
      const hasher = createHash(hashType);
      hasher.update('hel');

      const hashA = hasher.digest(undefined, { dispose: false });
      //const readA = hasher.reader({ dispose: false });

      hasher.update('lo');
      const hashB = hasher.digest(undefined, { dispose: false });
      //const readB = hasher.reader({ dispose: false });

      const expectedA = Buffer.from(
        '3121c5bb1b9193123447ac7cfda042f67f967e7a8cf5c12e7570e25529746e4a',
        'hex',
      );
      expect(hashA).to.deep.equal(expectedA);
      //expect(readA.toBuffer()).to.deep.equal(expectedA);

      expect(hashB).to.deep.equal(inputs.hello.hash);
      //expect(readB.toBuffer()).to.deep.equal(inputs.hello.hash);

      hasher.dispose();
      //readA.dispose();
      //readB.dispose();
    });
  });

//  describe('reader', () => {
//    let reader: wasm.NodeHashReader;
//    beforeEach(() => {
//      const hash = createHash(hashType);
//      hash.update(inputs.hello.input);
//      reader = hash.reader();
//    });
//
//    afterEach(() => reader.dispose());
//
//    it('implements toString()', () => {
//      expect(reader.toString('hex')).to.equal(inputs.hello.hash.toString('hex'));
//      reader.position = BigInt(42);
//      expect(reader.toString('hex')).to.equal(inputs.hello.hash.toString('hex'));
//    });
//
//    it('implements toBuffer()', () => {
//      expect(reader.toBuffer()).to.deep.equal(inputs.hello.hash);
//      reader.position = BigInt(42);
//      expect(reader.toBuffer()).to.deep.equal(inputs.hello.hash);
//    });
//
//    it('implements readInto() and advances', () => {
//      const actual = Buffer.alloc(32);
//      reader.readInto(actual.slice(0, 10));
//      reader.readInto(actual.slice(10));
//      expect(actual).to.deep.equal(inputs.hello.hash);
//      expect(reader.position).to.equal(BigInt(32));
//    });
//
//    it('implements read() and advances', () => {
//      const actual = reader.read(32);
//      expect(actual).to.deep.equal(inputs.hello.hash);
//      expect(reader.position).to.equal(BigInt(32));
//
//      const actualNext = reader.read(16);
//      expect(actualNext).to.deep.equal(hello48.slice(32));
//      expect(reader.position).to.equal(BigInt(48));
//    });
//
//    it('manually sets position', () => {
//      reader.position = BigInt(32);
//      const actual = reader.read(16);
//      expect(actual).to.deep.equal(hello48.slice(32));
//    });
//
//    it('throws if set out of range', () => {
//      expect(() => (reader.position = BigInt(-1))).to.throw(RangeError);
//      expect(() => (reader.position = BigInt('18446744073709551616'))).to.throw(RangeError);
//
//      reader.position = maxHashBytes - BigInt(1);
//      expect(() => reader.read(2)).to.throw(RangeError);
//    });
//  });

  describe('original test vectors', () => {
    for (const { inputLen, /*expectedDerive, expectedKeyed,*/ expectedHash } of ogTestVectors.cases) {
      describe(`${inputLen}`, async () => {
        const input = Buffer.alloc(inputLen);
        for (let i = 0; i < inputLen; i++) {
          input[i] = i % 251;
        }

        it('hash()', () => {
          expect(hash(hashType, input, { length: expectedHash.length / 2 }).toString('hex')).to.equal(
            expectedHash,
          );
        });

//        it('deriveKey()', () => {
//          expect(
//            deriveKey(ogTestVectors.context, input, { length: expectedDerive.length / 2 }).toString(
//              'hex',
//            ),
//          ).to.equal(expectedDerive);
//        });

//        it('createDeriveKey()', callback => {
//          const buffer = new ReadableStreamBuffer();
//          buffer.put(Buffer.from(input));
//          buffer.stop();
//          const hash = createDeriveKey(ogTestVectors.context, hashType);
//          buffer.on('data', b => hash.update(b));
//          buffer.on('end', () => {
//            const actual = hash.digest({ length: expectedDerive.length / 2 }).toString('hex');
//            expect(actual).to.equal(expectedDerive);
//            callback();
//          });
//        });

//        it('keyedHash()', () => {
//          expect(
//            keyedHash(Buffer.from(ogTestVectors.key), input, {
//              length: expectedKeyed.length / 2,
//            }).toString('hex'),
//          ).to.equal(expectedKeyed);
//        });

//        it('createKeyed()', callback => {
//          const buffer = new ReadableStreamBuffer();
//          buffer.put(Buffer.from(input));
//          buffer.stop();
//          const hash = createKeyed(Buffer.from(ogTestVectors.key), hashType);
//          buffer.on('data', b => hash.update(b));
//          buffer.on('end', () => {
//            const actual = hash.digest({ length: expectedDerive.length / 2 }).toString('hex');
//            expect(actual).to.equal(expectedKeyed);
//            callback();
//          });
//        });
      });
    }
  });
}

describe('node.js wasm', () => suite(wasm));
//describe('node.js native', () => suite(native));
