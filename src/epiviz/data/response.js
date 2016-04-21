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
epiviz.data.Response.prototype.data = function() {

  var data = this._data;

  // for getMeasurements and getSeqInfo response!
  var all_keys = Object.keys(data);
  if(all_keys.length > 0) {
    if (all_keys.indexOf('success') != -1) {
      all_keys.splice(all_keys.indexOf('success'), 1);
      delete data['success'];
      //for SeqInfo response
/*      if(all_keys.indexOf("") != -1) {
        return data[all_keys[0]];
      }*/
    }
  }
  return data;
};

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
