/**
 * Created by: Florin Chelaru
 * Date: 9/30/13
 * Time: 8:49 PM
 */

goog.provide('epiviz.events.EventListener');

/**
 * @param {function(T=)} updateCallback
 * @constructor
 * @template T
 */
epiviz.events.EventListener = function(updateCallback) {
  /**
   * @type {number}
   * @private
   */
  this._id = epiviz.events.EventListener._nextId++;

  /**
   * @type {function(T)}
   * @private
   */
  this._updateCallback = updateCallback;
};

epiviz.events.EventListener._nextId = 0;

/**
 * @param {T} [args]
 */
epiviz.events.EventListener.prototype.update = function(args) {
  this._updateCallback(args);
};

/**
 * @returns {number}
 */
epiviz.events.EventListener.prototype.id = function() {
  return this._id;
};
