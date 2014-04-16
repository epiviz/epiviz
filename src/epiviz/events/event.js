/**
 * Created by: Florin Chelaru
 * Date: 9/30/13
 * Time: 8:42 PM
 */

goog.provide('epiviz.events.Event');

goog.require('epiviz.events.EventListener');

/**
 * @constructor
 * @template T
 */
epiviz.events.Event = function() {
  /**
   * @type {number}
   * @private
   */
  this._count = 0;

  /**
   * @type {Object.<number, epiviz.events.EventListener.<T>>}
   * @private
   */
  this._listeners = {};

  /**
   * Set to true when in the notify() method, to avoid loops
   * @type {boolean}
   * @private
   */
  this._firing = false;
};

/**
 * @param {epiviz.events.EventListener.<T>} listener
 */
epiviz.events.Event.prototype.addListener = function(listener) {
  if (!this._listeners[listener.id()]) { ++this._count; }

  this._listeners[listener.id()] = listener;
};

/**
 * @param {epiviz.events.EventListener.<T>} listener
 */
epiviz.events.Event.prototype.removeListener = function(listener) {
  if (!this._listeners[listener.id()]) { return; }

  delete this._listeners[listener.id()];
  --this._count;
};

/**
 * @param {T} [args]
 */
epiviz.events.Event.prototype.notify = function(args) {
  if (this._firing) { return; }

  if (this._count == 0) { return; }

  this._firing = true;

  for (var id in this._listeners) {
    if (!this._listeners.hasOwnProperty(id)) { continue; }
    this._listeners[id].update(args);
  }

  this._firing = false;
};

/**
 * Returns true if the event is already firing
 * @returns {boolean}
 */
epiviz.events.Event.prototype.isFiring = function() { return this._firing; };
