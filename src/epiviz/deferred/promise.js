/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 1/26/2015
 * Time: 9:45 AM
 */

goog.provide('epiviz.deferred.Promise');

/**
 * Wrapper around JQuery Promise
 * @param {Promise} promise
 * @constructor
 * @template T The type of result
 */
epiviz.deferred.Promise = function(promise) {
  /**
   * @type {Promise}
   * @private
   */
  this._promise = promise;
};

/**
 * @param {function(T)} doneFilter
 * @param {function} [failFilter]
 * @param {function} [progressFilter]
 * @returns {epiviz.deferred.Promise.<T>}
 */
epiviz.deferred.Promise.prototype.then = function(doneFilter, failFilter, progressFilter) {
  return new epiviz.deferred.Promise(this._promise.then(doneFilter, failFilter, progressFilter));
};

/**
 * @param {function(T)|Array.<function(T)>} doneCallbacks
 * @param {function(T)|Array.<function(T)>} [moreDoneCallbacks]
 * @returns {epiviz.deferred.Deferred.<T>}
 */
epiviz.deferred.Promise.prototype.done = function(doneCallbacks, moreDoneCallbacks) {
  return new epiviz.deferred.Deferred(this._promise.done(doneCallbacks, moreDoneCallbacks));
};

/**
 * @param {function|Array.<function>} failCallbacks
 * @param {function|Array.<function>} [moreFailCallbacks]
 * @returns {epiviz.deferred.Deferred.<T>}
 */
epiviz.deferred.Promise.prototype.fail = function(failCallbacks, moreFailCallbacks) {
  return new epiviz.deferred.Deferred(this._promise.fail(failCallbacks, moreFailCallbacks));
};

/**
 * @param {function|Array.<function>} alwaysCallbacks
 * @param {function|Array.<function>} [moreAlwaysCallbacks]
 * @returns {epiviz.deferred.Deferred.<T>}
 */
epiviz.deferred.Promise.prototype.always = function(alwaysCallbacks, moreAlwaysCallbacks) {
  return new epiviz.deferred.Deferred(this._promise.always(alwaysCallbacks, moreAlwaysCallbacks));
};

/**
 * @returns {string}
 */
epiviz.deferred.Promise.prototype.state = function() {
  return this._promise.state();
};
