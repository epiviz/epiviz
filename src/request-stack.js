/**
 * Created with JetBrains PhpStorm.
 * User: florin
 * Date: 2/16/13
 * Time: 1:32 AM
 * To change this template use File | Settings | File Templates.
 */

function RequestStack() {
  this._requestIds = [];
  this._callbacks = {};
  this._dataMap = {};
}

RequestStack.prototype.pushRequestId = function(requestId, sender, callback) {
  this._requestIds.push(requestId);
  this._callbacks[requestId] = new Object({
    sender: sender,
    callback: callback
  });

  // console.log('New request pushed: ' + requestId);
};

RequestStack.prototype.serveData = function(requestId, data) {

  if (!this._callbacks[requestId]) {
    return;
  }

  // Check if this request is the first request in the stack. If it is,
  // pop it. Otherwise, we'll wait, so that we execute everything in the
  // same order as it was requested.
  if (this._requestIds.length > 0 && this._requestIds[0] == requestId) {

    var callback = this._callbacks[requestId].callback;
    var sender = this._callbacks[requestId].sender;
    callback.call(sender, data);

    delete this._callbacks[requestId];

    var i;
    for (i = 1; i < this._requestIds.length && this._dataMap[this._requestIds[i]]; ++i) {
      callback = this._callbacks[this._requestIds[i]].callback;
      sender = this._callbacks[this._requestIds[i]].sender;
      callback.call(sender, this._dataMap[this._requestIds[i]]);

      delete this._callbacks[this._requestIds[i]];
      delete this._dataMap[this._requestIds[i]];
    }

    this._requestIds = this._requestIds.slice(i);
    return;
  }

  this._dataMap[requestId] = data;
};

RequestStack.prototype.clear = function() {
  this._requestIds = [];
  this._callbacks = {};
  this._dataMap = {};
};
