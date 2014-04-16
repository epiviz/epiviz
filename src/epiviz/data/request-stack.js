/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/5/13
 * Time: 9:51 AM
 */

goog.provide('epiviz.data.RequestStack');

/**
 * @constructor
 */
epiviz.data.RequestStack = function() {
  /**
   * An array of requests, in the order they are made
   * @type {Array.<epiviz.data.Request>}
   * @private
   */
  this._requests = [];

  /**
   * Map of callbacks stored by request id
   * @type {Object.<number, function(*)>}
   * @private
   */
  this._callbacks = {};

  /**
   * Map of responses stored by request id
   * @type {Object.<number, *>}
   * @private
   */
  this._dataMap = {};
};

/**
 * @param {epiviz.data.Request} request
 * @param {function(*)} callback
 */
epiviz.data.RequestStack.prototype.pushRequest = function(request, callback) {
  this._requests.push(request);
  this._callbacks[request.id()] = callback;
};

/**
 * Correlates the response to a particular request; the callback corresponding to that
 * request will be called when all requests that were made before this one have been
 * served.
 *
 * @param {epiviz.data.Response<*>} response
 */
epiviz.data.RequestStack.prototype.serveData = function(response) {

  if (!this._callbacks[response.id()]) {
    return;
  }

  // Check if this request is the first request in the stack. If it is,
  // pop it. Otherwise, we'll wait, so that we execute everything in the
  // same order as it was requested.
  if (this._requests.length > 0 && this._requests[0].id() == response.id()) {
    var callback = this._callbacks[response.id()];
    delete this._callbacks[response.id()];
    this._requests = this._requests.slice(1);
    callback(response.data());

    // Serve all other responses that have already come back, and are immediately after this one
    while (this._requests.length > 0 && (this._requests[0].id() in this._dataMap)) {
      callback = this._callbacks[this._requests[0].id()];
      var data = this._dataMap[this._requests[0].id()];
      delete this._callbacks[this._requests[0].id()];
      delete this._dataMap[this._requests[0].id()];
      this._requests = this._requests.slice(1);

      // It is important we call the callback after we've already changed the stack,
      // because the callback may query the stack again
      callback(data);
    }

    return;
  }

  // If unable to serve data, then store it for later
  this._dataMap[response.id()] = response.data();
};

/**
 * Clears the entire request stack
 */
epiviz.data.RequestStack.prototype.clear = function() {
  this._requests = [];
  this._callbacks = {};
  this._dataMap = {};
};

