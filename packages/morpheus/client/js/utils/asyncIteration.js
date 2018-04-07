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
