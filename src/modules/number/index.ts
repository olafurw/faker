import type { SimpleFaker } from '../..';
import { FakerError } from '../../errors/faker-error';
import { bindThisToMemberFunctions } from '../../internal/bind-this-to-member-functions';

/**
 * Module to generate numbers of any kind.
 *
 * ### Overview
 *
 * For simple integers, use [`int()`](https://fakerjs.dev/api/number.html#int). For decimal/floating-point numbers, use [`float()`](https://fakerjs.dev/api/number.html#float).
 *
 * For numbers not in base-10, you can use [`hex()`](https://fakerjs.dev/api/number.html#hex), [`octal()`](https://fakerjs.dev/api/number.html#octal) and [`binary()`](https://fakerjs.dev/api/number.html#binary)`.
 *
 * ### Related modules
 *
 * - For numeric strings of a given length, use [`faker.string.numeric()`](https://fakerjs.dev/api/string.html#numeric).
 * - For credit card numbers, use [`faker.finance.creditCardNumber()`](https://fakerjs.dev/api/finance.html#creditcardnumber).
 */
export class NumberModule {
  constructor(private readonly faker: SimpleFaker) {
    bindThisToMemberFunctions(this);
  }

  /**
   * Returns a single random integer between zero and the given max value or the given range.
   * The bounds are inclusive.
   *
   * @param options Maximum value or options object. Defaults to `{}`.
   * @param options.min Lower bound for generated number. Defaults to `0`.
   * @param options.max Upper bound for generated number. Defaults to `Number.MAX_SAFE_INTEGER`.
   * @param options.exclude An array of numbers to exclude from the generated range. Defaults to `[]`.
   *
   * @throws When options define `max < min`.
   * @throws When exclude array covers all possible values in the range.
   *
   * @see faker.string.numeric() If you would like to generate a `string` of digits with a given length (range).
   *
   * @example
   * faker.number.int() // 2900970162509863
   * faker.number.int(100) // 52
   * faker.number.int({ min: 1000000 }) // 2900970162509863
   * faker.number.int({ max: 100 }) // 42
   * faker.number.int({ min: 10, max: 100 }) // 57
   * faker.number.int({ min: 1, max: 7, exclude: [2, 4, 6] }) // 3
   *
   * @since 8.0.0
   */
  int(
    options:
      | number
      | {
          /**
           * Lower bound for generated number.
           *
           * @default 0
           */
          min?: number;
          /**
           * Upper bound for generated number.
           *
           * @default Number.MAX_SAFE_INTEGER
           */
          max?: number;
          /**
           * Exclude numbers from the generated range.
           *
           * @default []
           */
          exclude?: number[];
        } = {}
  ): number {
    if (typeof options === 'number') {
      options = { max: options };
    }

    const { min = 0, max = Number.MAX_SAFE_INTEGER, exclude = [] } = options;
    const effectiveMin = Math.ceil(min);
    const effectiveMax = Math.floor(max);
    const uniqueExclude = [...new Set(exclude)].filter((value: number) => {
      return value >= effectiveMin && value <= effectiveMax;
    });

    if (effectiveMin === effectiveMax) {
      return effectiveMin;
    }

    if (effectiveMax < effectiveMin) {
      if (max >= min) {
        throw new FakerError(
          `No integer value between ${min} and ${max} found.`
        );
      }

      throw new FakerError(`Max ${max} should be greater than min ${min}.`);
    }

    if (uniqueExclude.length >= effectiveMax - effectiveMin + 1) {
      throw new FakerError(
        `More values in exclude list than possible values in the range.`
      );
    }

    // @ts-expect-error: access private member field
    const randomizer = this.faker._randomizer;
    const generate = () => {
      const real = randomizer.next();
      return Math.floor(
        real * (effectiveMax + 1 - effectiveMin) + effectiveMin
      );
    };

    let result = generate();
    while (uniqueExclude.includes(result)) {
      result = generate();
    }

    return result;
  }

  /**
   * Returns a single random floating-point number for a given precision or range and precision.
   *
   * @param options Upper bound or options object. Defaults to `{}`.
   * @param options.min Lower bound for generated number. Defaults to `0.0`.
   * @param options.max Upper bound for generated number. Defaults to `1.0`.
   * @param options.precision Precision of the generated number, for example `0.01` will round to 2 decimal points.
   *
   * @example
   * faker.number.float() // 0.5688541042618454
   * faker.number.float(3) // 2.367973240558058
   * faker.number.float({ min: -1000000 }) //-780678.849672846
   * faker.number.float({ max: 100 }) // 17.3687307164073
   * faker.number.float({ precision: 0.1 }) // 0.9
   * faker.number.float({ min: 10, max: 100, precision: 0.001 }) // 35.415
   *
   * @since 8.0.0
   */
  float(
    options:
      | number
      | {
          /**
           * Lower bound for generated number.
           *
           * @default 0.0
           */
          min?: number;
          /**
           * Upper bound for generated number.
           *
           * @default 1.0
           */
          max?: number;
          /**
           * Precision of the generated number.
           */
          precision?: number;
        } = {}
  ): number {
    if (typeof options === 'number') {
      options = {
        max: options,
      };
    }

    const { min = 0, max = 1, precision } = options;

    if (max === min) {
      return min;
    }

    if (max < min) {
      throw new FakerError(`Max ${max} should be greater than min ${min}.`);
    }

    if (precision !== undefined) {
      if (precision <= 0) {
        throw new FakerError(`Precision should be greater than 0.`);
      }

      const factor = 1 / precision;
      const int = this.int({
        min: min * factor,
        max: max * factor,
      });
      return int / factor;
    }

    // @ts-expect-error: access private member field
    const randomizer = this.faker._randomizer;
    const real = randomizer.next();
    return real * (max - min) + min;
  }

  /**
   * Returns a [binary](https://en.wikipedia.org/wiki/Binary_number) number.
   *
   * @param options Maximum value or options object. Defaults to `{}`.
   * @param options.min Lower bound for generated number. Defaults to `0`.
   * @param options.max Upper bound for generated number. Defaults to `1`.
   *
   * @throws When options define `max < min`.
   *
   * @see faker.string.binary() If you would like to generate a `binary string` with a given length (range).
   *
   * @example
   * faker.number.binary() // '1'
   * faker.number.binary(255) // '110101'
   * faker.number.binary({ min: 0, max: 65535 }) // '10110101'
   *
   * @since 8.0.0
   */
  binary(
    options:
      | number
      | {
          /**
           * Lower bound for generated number.
           *
           * @default 0
           */
          min?: number;
          /**
           * Upper bound for generated number.
           *
           * @default 1
           */
          max?: number;
        } = {}
  ): string {
    if (typeof options === 'number') {
      options = { max: options };
    }

    const { min = 0, max = 1 } = options;

    return this.int({
      max,
      min,
    }).toString(2);
  }

  /**
   * Returns an [octal](https://en.wikipedia.org/wiki/Octal) number.
   *
   * @param options Maximum value or options object. Defaults to `{}`.
   * @param options.min Lower bound for generated number. Defaults to `0`.
   * @param options.max Upper bound for generated number. Defaults to `7`.
   *
   * @throws When options define `max < min`.
   *
   * @see faker.string.octal() If you would like to generate an `octal string` with a given length (range).
   *
   * @example
   * faker.number.octal() // '5'
   * faker.number.octal(255) // '377'
   * faker.number.octal({ min: 0, max: 65535 }) // '4766'
   *
   * @since 8.0.0
   */
  octal(
    options:
      | number
      | {
          /**
           * Lower bound for generated number.
           *
           * @default 0
           */
          min?: number;
          /**
           * Upper bound for generated number.
           *
           * @default 7
           */
          max?: number;
        } = {}
  ): string {
    if (typeof options === 'number') {
      options = { max: options };
    }

    const { min = 0, max = 7 } = options;

    return this.int({
      max,
      min,
    }).toString(8);
  }

  /**
   * Returns a lowercase [hexadecimal](https://en.wikipedia.org/wiki/Hexadecimal) number.
   *
   * @param options Maximum value or options object. Defaults to `{}`.
   * @param options.min Lower bound for generated number. Defaults to `0`.
   * @param options.max Upper bound for generated number. Defaults to `15`.
   *
   * @example
   * faker.number.hex() // 'b'
   * faker.number.hex(255) // '9d'
   * faker.number.hex({ min: 0, max: 65535 }) // 'af17'
   *
   * @since 8.0.0
   */
  hex(
    options:
      | number
      | {
          /**
           * Lower bound for generated number.
           *
           * @default 0
           */
          min?: number;
          /**
           * Upper bound for generated number.
           *
           * @default 15
           */
          max?: number;
        } = {}
  ): string {
    if (typeof options === 'number') {
      options = { max: options };
    }

    const { min = 0, max = 15 } = options;

    return this.int({
      max,
      min,
    }).toString(16);
  }

  /**
   * Returns a [BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#bigint_type) number.
   *
   * @param options Maximum value or options object. Defaults to `{}`.
   * @param options.min Lower bound for generated bigint. Defaults to `0n`.
   * @param options.max Upper bound for generated bigint. Defaults to `min + 999999999999999n`.
   *
   * @throws When options define `max < min`.
   *
   * @example
   * faker.number.bigInt() // 55422n
   * faker.number.bigInt(100n) // 52n
   * faker.number.bigInt({ min: 1000000n }) // 431433n
   * faker.number.bigInt({ max: 100n }) // 42n
   * faker.number.bigInt({ min: 10n, max: 100n }) // 36n
   *
   * @since 8.0.0
   */
  bigInt(
    options:
      | bigint
      | number
      | string
      | boolean
      | {
          /**
           * Lower bound for generated bigint.
           *
           * @default 0n
           */
          min?: bigint | number | string | boolean;
          /**
           * Upper bound for generated bigint.
           *
           * @default min + 999999999999999n
           */
          max?: bigint | number | string | boolean;
        } = {}
  ): bigint {
    if (
      typeof options === 'bigint' ||
      typeof options === 'number' ||
      typeof options === 'string' ||
      typeof options === 'boolean'
    ) {
      options = {
        max: options,
      };
    }

    const min = BigInt(options.min ?? 0);
    const max = BigInt(options.max ?? min + BigInt(999999999999999));

    if (max === min) {
      return min;
    }

    if (max < min) {
      throw new FakerError(`Max ${max} should be larger then min ${min}.`);
    }

    const delta = max - min;

    const offset =
      BigInt(
        this.faker.string.numeric({
          length: delta.toString(10).length,
          allowLeadingZeros: true,
        })
      ) %
      (delta + BigInt(1));

    return min + offset;
  }
}
