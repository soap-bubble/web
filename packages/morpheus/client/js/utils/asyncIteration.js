// Copied from https://github.com/toniov/p-iteration/blob/master/lib/static-methods.js
//  so that it will transpile

/**
 * Same functionality as [`forEach()`](global.html#forEach), but runs only one callback at a time.
 * @param {Array} array - Array to iterate over.
 * @param {Function} callback - Function to apply each item in `array`.
 *   Accepts three arguments: `currentValue`, `index` and `array`.
 * @param {Object} [thisArg] - Value to use as *this* when executing the `callback`.
 * @return {Promise} - Returns a Promise with undefined value.
 */
export const forEachSeries = async (array, callback, thisArg) => {
  for (let i = 0; i < array.length; i++) {
    if (i in array) {
      await callback.call(thisArg || this, await array[i], i, array);
    }
  }
};

/**
 * Same functionality as [`some()`](global.html#some), but runs only one callback at a time.
 * @param {Array} array - Array to iterate over.
 * @param {Function} callback - Function to apply each item in `array`.
 *    Accepts three arguments: `currentValue`, `index` and `array`.
 * @param {Object} [thisArg] - Value to use as *this* when executing the `callback`.
 * @return {Promise} - Returns a Promise with *true* as value if some element
 *    passed the test, otherwise *false*.
 */
export const someSeries = async (array, callback, thisArg) => {
  for (let i = 0; i < array.length; i++) {
    if (i in array && await callback.call(thisArg || this, await array[i], i, array)) {
      return true;
    }
  }
  return false;
};

/**
 * Implements ES5 [`Array#reduce()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce) method.<br><br>
 * Applies a `callback` against an accumulator and each element in `array`.
 * @param {Array} array - Array to iterate over.
 * @param {Function} callback - Function to apply each item in `array`. Accepts four arguments: `accumulator`, `currentValue`, `currentIndex` and `array`.
 * @param {Object} [initialValue] - Used as first argument to the first call of `callback`.
 * @return {Promise} - Returns a Promise with the resultant value from the reduction.
 */
export const reduce = async (array, callback, initialValue) => {
  if (array.length === 0 && initialValue === undefined) {
    throw TypeError('Reduce of empty array with no initial value');
  }
  let i = 0;
  let previousValue;
  if (initialValue !== undefined) {
    previousValue = initialValue;
  }
  for (i; i < array.length; i++) {
    if (i in array) {
      previousValue = await callback(await previousValue, await array[i], i, array);
    }
  }
  return previousValue;
};
