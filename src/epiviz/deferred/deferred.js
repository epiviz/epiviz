/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 1/26/2015
 * Time: 9:41 AM
 */

goog.provide('epiviz.deferred.Deferred');

/**
 * Wrapper around JQuery Deferred
 * @param {Deferred} [deferred]
 * @constructor
 * @template T
 */
epiviz.deferred.Deferred = function(deferred) {
  /**
   * @type {Deferred}
   * @private
   */
  this._deferred = deferred || $.Deferred();
};

/**
 * @enum {string}
 */
epiviz.deferred.Deferred.State = {
  PENDING: 'pending',
  RESOLVED: 'resolved',
  REJECTED: 'rejected'
};

/**
 * @param {function(T)} doneFilter
 * @param {function} [failFilter]
 * @param {function} [progressFilter]
 * @returns {epiviz.deferred.Promise.<T>}
 */
epiviz.deferred.Deferred.prototype.then = function(doneFilter, failFilter, progressFilter) {
  return new epiviz.deferred.Promise(this._deferred.then(doneFilter, failFilter, progressFilter));
};

/**
 * @param {function(T)|Array.<function(T)>} doneCallbacks
 * @param {function(T)|Array.<function(T)>} [moreDoneCallbacks]
 * @returns {epiviz.deferred.Deferred.<T>}
 */
epiviz.deferred.Deferred.prototype.done = function(doneCallbacks, moreDoneCallbacks) {
  return new epiviz.deferred.Deferred(this._deferred.done(doneCallbacks, moreDoneCallbacks));
};

/**
 * @param {function|Array.<function>} failCallbacks
 * @param {function|Array.<function>} [moreFailCallbacks]
 * @returns {epiviz.deferred.Deferred.<T>}
 */
epiviz.deferred.Deferred.prototype.fail = function(failCallbacks, moreFailCallbacks) {
  return new epiviz.deferred.Deferred(this._deferred.fail(failCallbacks, moreFailCallbacks));
};

/**
 * @param {function|Array.<function>} alwaysCallbacks
 * @param {function|Array.<function>} [moreAlwaysCallbacks]
 * @returns {epiviz.deferred.Deferred.<T>}
 */
epiviz.deferred.Deferred.prototype.always = function(alwaysCallbacks, moreAlwaysCallbacks) {
  return new epiviz.deferred.Deferred(this._deferred.always(alwaysCallbacks, moreAlwaysCallbacks));
};

/**
 * @returns {string}
 */
epiviz.deferred.Deferred.prototype.state = function() {
  return this._deferred.state();
};

/**
 * @param {Object} [args]
 * @retuns {epiviz.deferred.Deferred.<T>}
 */
epiviz.deferred.Deferred.prototype.notify = function(args) {
  return new epiviz.deferred.Deferred(this._deferred.notify(args));
};

/**
 * @param {Object} context
 * @param {Array} [args]
 * @retuns {epiviz.deferred.Deferred.<T>}
 */
epiviz.deferred.Deferred.prototype.notifyWith = function(context, args) {
  return new epiviz.deferred.Deferred(this._deferred.notifyWith(context, args));
};

/**
 * @param {function|Array.<function>} progressCallbacks
 * @param {function|Array.<function>} [moreProgressCallbacks]
 * @returns {epiviz.deferred.Deferred.<T>}
 */
epiviz.deferred.Deferred.prototype.progress = function(progressCallbacks, moreProgressCallbacks) {
  return new epiviz.deferred.Deferred(this._deferred.progress(progressCallbacks, moreProgressCallbacks));
};

/**
 * @param {Object} [target]
 * @returns {epiviz.deferred.Promise.<T>}
 */
epiviz.deferred.Deferred.prototype.promise = function(target) {
  return new epiviz.deferred.Promise(this._deferred.promise(target));
};

/**
 * @param {*} [args]
 * @returns {epiviz.deferred.Deferred.<T>}
 */
epiviz.deferred.Deferred.prototype.reject = function(args) {
  return new epiviz.deferred.Deferred(this._deferred.reject(args));
};

/**
 * @param {Object} context
 * @param {Array} [args]
 * @retuns {epiviz.deferred.Deferred.<T>}
 */
epiviz.deferred.Deferred.prototype.rejectWith = function(context, args) {
  return new epiviz.deferred.Deferred(this._deferred.rejectWith(context, args));
};

/**
 * @param {*} [args]
 * @returns {epiviz.deferred.Deferred.<T>}
 */
epiviz.deferred.Deferred.prototype.resolve = function(args) {
  return new epiviz.deferred.Deferred(this._deferred.resolve(args));
};

/**
 * @param {Object} context
 * @param {Array} [args]
 * @retuns {epiviz.deferred.Deferred.<T>}
 */
epiviz.deferred.Deferred.prototype.resolveWith = function(context, args) {
  return new epiviz.deferred.Deferred(this._deferred.resolveWith(context, args));
};
