import { BaseHashInput, inputToArray, IBaseHashOptions, defaultHashLength } from './hash-fn';
import { IHashReader } from './hash-reader';

/**
 * A blake3 hash. Quite similar to Node's crypto hashing.
 *
 * Note that you must call {@link IHash#dispose} or {@link IHash#done} when
 * you're finished with it to free memory.
 */
export interface IHasher<T> {
  /**
   * Adds the given data to the hash.
   * @throws {Error} if {@link IHash#digest} has already been called.
   */
  update(data: BaseHashInput): this;

  /**
   * Returns a digest of the hash.
   *
   * If `dispose: false` is given in the options, the hash will not
   * automatically be disposed of, allowing you to continue updating
   * it after obtaining the current reader.
   */
  digest(options?: IBaseHashOptions & { dispose?: boolean }): T;

  /**
   * Returns a {@link HashReader} for the current hash.
   *
   * If `dispose: false` is given in the options, the hash will not
   * automatically be disposed of, allowing you to continue updating
   * it after obtaining the current reader.
   */
  reader(options?: { dispose?: boolean }): IHashReader<T>;

  /**
   * Frees data associated with the hash. This *must* be called if
   * {@link IHash#digest} is not called in order to free memory.
   */
  dispose(): void;
}

/**
 * @hidden
 */
export interface IInternalHash<Reader> {
  free(): void;
  reader(): Reader;
  update(bytes: Uint8Array): void;
  digest(into: Uint8Array): void;
  algo(): String;
}

export interface IHasherDigestOptions extends IBaseHashOptions {
  dispose?: boolean;
}

/**
 * Base implementation of hashing.
 */
export class BaseHash<Binary extends Uint8Array, InternalReader, Reader extends IHashReader<Binary>>
  implements IHasher<Binary> {
  private hash: IInternalHash<InternalReader> | undefined;

  constructor(
    implementation: IInternalHash<InternalReader>,
    private readonly alloc: (length: number) => Binary,
    private readonly getReader: (internal: InternalReader) => Reader,
  ) {
    this.hash = implementation;
  }

  /**
   * @inheritdoc
   */
  public update(data: BaseHashInput): this {
    if (!this.hash) {
      throw new Error('Cannot continue updating hashing after dispose() has been called');
    }

    this.hash.update(inputToArray(data));
    return this;
  }

  /**
   * @inheritdoc
   */
  public digest({ length = defaultHashLength, dispose = true }: IHasherDigestOptions = {}): Binary {
    if (!this.hash) {
      throw new Error('Cannot call digest() after dipose() has been called');
    }

    if (this.hash.algo() === "md5") {
      length = 16;
    }

    const digested = this.alloc(length);
    this.hash.digest(digested);

    if (dispose) {
      this.dispose();
    }

    return digested;
  }

  /**
   * @inheritdoc
   */
  public reader({ dispose = true }: { dispose?: boolean } = {}) {
    if (!this.hash) {
      throw new Error('Cannot call reader() after dipose() has been called');
    }

    const reader = this.getReader(this.hash.reader());
    if (dispose) {
      this.dispose();
    }

    return reader;
  }

  /**
   * @inheritdoc
   */
  dispose() {
    this.hash?.free();
    this.hash = undefined;
  }
}
