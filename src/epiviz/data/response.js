/**
 * Created by: Florin Chelaru
 * Date: 9/30/13
 * Time: 8:36 PM
 */

goog.provide('epiviz.data.Response');

/**
 * @param {number} requestId
 * @param {T} data
 * @constructor
 * @template T
 */
epiviz.data.Response = function(requestId, data) {
  /**
   * @type {number}
   * @private
   */
  this._id = requestId;

  /**
   * @type {T}
   * @private
   */
  this._data = data;
};

/**
 * @returns {number}
 */
epiviz.data.Response.prototype.id = function() { return this._id; };

/**
 * @returns {T}
 */
epiviz.data.Response.prototype.data = function() { return this._data; };

/**
 * @returns {epiviz.data.MessageType}
 */
epiviz.data.Response.prototype.type = function() { return epiviz.data.MessageType.RESPONSE; };

/**
 * @returns {{requestId: number, type: epiviz.data.MessageType, data: T}}
 */
epiviz.data.Response.prototype.raw = function() {
  return {
    requestId: this._id,
    type: this.type(),
    data: this._data
  };
};

/**
 * @param {{requestId: number, data: T}} o
 * @constructor
 * @template T
 * @returns {epiviz.data.Response.<T>}
 */
epiviz.data.Response.fromRawObject = function(o) {
  return new epiviz.data.Response(o.requestId, o.data);
};
