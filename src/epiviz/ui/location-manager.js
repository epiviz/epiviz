/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 2/11/14
 * Time: 12:01 PM
 */

goog.provide('epiviz.ui.LocationManager');

/**
 * @param {epiviz.Config} config
 * @constructor
 */
epiviz.ui.LocationManager = function(config) {
  /**
   * @type {Object.<string, epiviz.datatypes.SeqInfo>}
   * @private
   */
  this._seqInfos = {};

  /**
   * @type {epiviz.datatypes.GenomicRange}
   * @private
   */
  this._currentLocation = null;

  /**
   * @type {?epiviz.datatypes.GenomicRange}
   * @private
   */
  this._lastUnfilledRequest = null;

  /**
   * @type {?number}
   * @private
   */
  this._timeout = null;

  /**
   * @type {number}
   * @private
   */
  this._navigationDelay = config.navigationDelay;

  /**
   * @type {epiviz.events.Event.<{oldValue: epiviz.datatypes.GenomicRange, newValue: epiviz.datatypes.GenomicRange}>}
   * @private
   */
  this._currentLocationChanged = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<Array.<epiviz.datatypes.SeqInfo>>}
   * @private
   */
  this._seqInfosUpdated = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event}
   * @private
   */
  this._requestSeqInfos = new epiviz.events.Event();
};

epiviz.ui.LocationManager.prototype.initialize = function() {
  this._requestSeqInfos.notify();
};

/**
 * @param {epiviz.datatypes.GenomicRange} range
 */
epiviz.ui.LocationManager.prototype.changeCurrentLocation = function(range) {
  if (this._currentLocationChanged.isFiring()) {
    // Event cannot be fired again until it finishes firing;
    // Avoid infinite loops
    return;
  }

  this._lastUnfilledRequest = range;

  if (this._timeout !== null) {
    window.clearTimeout(this._timeout);
    this._timeout = null;
  }

  var self = this;
  var locationChangeFunction = function() {
    var request = self._lastUnfilledRequest;

    if (request === null) { return; }

    self._doChangeCurrentLocation(request);
  };

  if (this._navigationDelay) {
    this._timeout = window.setTimeout(locationChangeFunction, this._navigationDelay);
  } else {
    locationChangeFunction();
  }
};

/**
 * @param {epiviz.datatypes.GenomicRange} range
 */
epiviz.ui.LocationManager.prototype._doChangeCurrentLocation = function(range) {
  var oldValue = this._currentLocation;

  var seqName = range.seqName();
  if (!(range.seqName() in this._seqInfos)) {
    if (!oldValue) { return; }
    seqName = oldValue.seqName();
  }

  var start = undefined, end = undefined;
  if (this._seqInfos[seqName] && this._seqInfos[seqName].min != undefined && this._seqInfos[seqName].max != undefined) {
    start = range.start() != undefined && range.start() >= this._seqInfos[seqName].min ? range.start() : this._seqInfos[seqName].min;
    end = range.width() != undefined ? start + range.width() : start + 9999; // TODO: Set this constant somewhere
  }

  if (start != undefined && end != undefined &&
    end > this._seqInfos[seqName].max) {
    start = Math.max(this._seqInfos[seqName].min, this._seqInfos[seqName].max - end + start);
    end = this._seqInfos[seqName].max;
  }

  this._lastUnfilledRequest = null;

  this._currentLocation = epiviz.datatypes.GenomicRange.fromStartEnd(seqName, start, end);

  this._currentLocationChanged.notify({oldValue: oldValue, newValue: this._currentLocation});
};

/**
 * @returns {epiviz.datatypes.GenomicRange}
 */
epiviz.ui.LocationManager.prototype.currentLocation = function() { return this._currentLocation; };

/**
 * @returns {?epiviz.datatypes.GenomicRange}
 */
epiviz.ui.LocationManager.prototype.lastUnfilledLocationChangeRequest = function() { return this._lastUnfilledRequest; };

/**
 * @param {Array.<epiviz.datatypes.SeqInfo>} seqInfos
 */
epiviz.ui.LocationManager.prototype.updateSeqInfos = function(seqInfos) {
  this._seqInfos = {};
  for (var i = 0; i < seqInfos.length; ++i) {
    this._seqInfos[seqInfos[i].seqName] = seqInfos[i];
  }

  this._seqInfosUpdated.notify(seqInfos);

  if (this._lastUnfilledRequest !== null) {
    if (this._lastUnfilledRequest.seqName() in this._seqInfos) {
      this._doChangeCurrentLocation(this._lastUnfilledRequest);
    } else if (seqInfos.length > 0) {
      var request = new epiviz.datatypes.GenomicRange(seqInfos[0].name(), this._lastUnfilledRequest.start(), this._lastUnfilledRequest.width());
      this._doChangeCurrentLocation(request);
    }
  }
};

/**
 * @param {Array.<epiviz.datatypes.SeqInfo>} seqInfos
 */
epiviz.ui.LocationManager.prototype.addSeqInfos = function(seqInfos) {
  for (var i = 0; i < seqInfos.length; ++i) {
    if (!this._seqInfos[seqInfos[i].seqName]) {
      this._seqInfos[seqInfos[i].seqName] = seqInfos[i];
    }
  }

  var eventSeqInfos = [];
  for (var seqName in this._seqInfos) {
    if (!this._seqInfos.hasOwnProperty(seqName)) { continue; }
    eventSeqInfos.push(this._seqInfos[seqName]);
  }

  this._seqInfosUpdated.notify(eventSeqInfos);
};

/**
 * @param {Array.<string>} seqNames
 */
epiviz.ui.LocationManager.prototype.removeSeqNames = function(seqNames) {

  for (var i = 0; i < seqNames.length; ++i) {
    delete this._seqInfos[seqNames[i]];
  }

  var eventSeqInfos = [];
  for (var seqName in this._seqInfos) {
    if (!this._seqInfos.hasOwnProperty(seqName)) { continue; }
    eventSeqInfos.push(this._seqInfos[seqName]);
  }

  this._seqInfosUpdated.notify(eventSeqInfos);

  if (!(this._currentLocation.seqName() in this._seqInfos)) {
    this.changeCurrentLocation(new epiviz.datatypes.GenomicRange(
      eventSeqInfos[0].seqName,
      this._currentLocation.start(),
      this._currentLocation.width()));
  }
};

/**
 * @returns {Object.<string, epiviz.datatypes.SeqInfo>}
 */
epiviz.ui.LocationManager.prototype.seqInfos = function() { return this._seqInfos; };

/**
 * @returns {epiviz.events.Event.<{oldValue: epiviz.datatypes.GenomicRange, newValue: epiviz.datatypes.GenomicRange}>}
 */
epiviz.ui.LocationManager.prototype.onCurrentLocationChanged = function() { return this._currentLocationChanged; };

/**
 * @returns {epiviz.events.Event.<Array.<epiviz.datatypes.SeqInfo>>}
 */
epiviz.ui.LocationManager.prototype.onSeqInfosUpdated = function() { return this._seqInfosUpdated; };

/**
 * @returns {epiviz.events.Event}
 */
epiviz.ui.LocationManager.prototype.onRequestSeqInfos = function() { return this._requestSeqInfos; };
