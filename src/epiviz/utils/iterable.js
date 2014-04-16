/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 3/31/14
 * Time: 10:12 AM
 */

goog.provide('epiviz.utils.Iterable');

/**
 * @interface
 * @template T
 */
epiviz.utils.Iterable = function() {};

/**
 * @param {function(T)} iteration A function that is called for every iteration;
 * if the function returns something that evaluates to true, iteration should break.
 */
epiviz.utils.Iterable.prototype.foreach = function(iteration) {};
