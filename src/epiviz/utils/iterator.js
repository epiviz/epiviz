/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/15/13
 * Time: 11:14 AM
 */

goog.provide('epiviz.utils.Iterator');

/**
 * @interface
 * @template T
 */
epiviz.utils.Iterator = function() {};

/**
 * @returns {?T}
 */
epiviz.utils.Iterator.prototype.first = function() { throw Error('unimplemented abstract method'); };

/**
 * @returns {?T}
 */
epiviz.utils.Iterator.prototype.next = function() { throw Error('unimplemented abstract method'); };
