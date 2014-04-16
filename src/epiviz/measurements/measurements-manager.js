/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 2/28/14
 * Time: 12:04 PM
 */

goog.provide('epiviz.measurements.MeasurementsManager');

/**
 * @constructor
 */
epiviz.measurements.MeasurementsManager = function() {
  /**
   * @type {epiviz.events.Event}
   * @private
   */
  this._requestMeasurements = new epiviz.events.Event();

  /**
   * Fires when new measurements are added in a data provider or
   * a computed measurement is created.
   * @type {epiviz.events.Event.<epiviz.measurements.MeasurementSet>}
   * @private
   */
  this._measurementsAdded = new epiviz.events.Event();

  /**
   * Fires when a data provider removes a measurement or a computed
   * measurement is removed.
   * @type {epiviz.events.Event.<epiviz.measurements.MeasurementSet>}
   * @private
   */
  this._measurementsRemoved = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<epiviz.measurements.MeasurementSet>}
   * @private
   */
  this._computedMeasurementsAdded = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<epiviz.measurements.MeasurementSet>}
   * @private
   */
  this._computedMeasurementsRemoved = new epiviz.events.Event();

  /**
   * Contains all measurements, including computed ones
   * @type {epiviz.measurements.MeasurementSet}
   * @private
   */
  this._measurements = new epiviz.measurements.MeasurementSet();

  /**
   * @type {epiviz.measurements.MeasurementSet}
   * @private
   */
  this._computedMeasurements = new epiviz.measurements.MeasurementSet();
};

/**
 */
epiviz.measurements.MeasurementsManager.prototype.initialize = function() {
  this._requestMeasurements.notify();
};

/**
 * @returns {epiviz.events.Event}
 */
epiviz.measurements.MeasurementsManager.prototype.onRequestMeasurements = function() { return this._requestMeasurements; };

/**
 * @returns {epiviz.events.Event.<epiviz.measurements.MeasurementSet>}
 */
epiviz.measurements.MeasurementsManager.prototype.onMeasurementsAdded = function() { return this._measurementsAdded; };

/**
 * @returns {epiviz.events.Event.<epiviz.measurements.MeasurementSet>}
 */
epiviz.measurements.MeasurementsManager.prototype.onMeasurementsRemoved = function() { return this._measurementsRemoved; };

/**
 * @returns {epiviz.events.Event.<epiviz.measurements.MeasurementSet>}
 */
epiviz.measurements.MeasurementsManager.prototype.onComputedMeasurementsAdded = function() { return this._computedMeasurementsAdded; };

/**
 * @returns {epiviz.events.Event.<epiviz.measurements.MeasurementSet>}
 */
epiviz.measurements.MeasurementsManager.prototype.onComputedMeasurementsRemoved = function() { return this._computedMeasurementsRemoved; };

/**
 * @returns {epiviz.measurements.MeasurementSet}
 */
epiviz.measurements.MeasurementsManager.prototype.measurements = function() { return this._measurements; };

/**
 * @returns {epiviz.measurements.MeasurementSet}
 */
epiviz.measurements.MeasurementsManager.prototype.computedMeasurements = function() { return this._computedMeasurements; };

/**
 * @param {epiviz.measurements.MeasurementSet} measurements
 */
epiviz.measurements.MeasurementsManager.prototype.addMeasurements = function(measurements) {
  if (!measurements || !measurements.size()) { return; } // No measurements to add

  var self = this;
  this._measurements.addAll(measurements);

  var computedMeasurements = new epiviz.measurements.MeasurementSet();

  measurements.foreach(function(m) {
    if (m.isComputed()) {
      computedMeasurements.add(m);
      self._computedMeasurements.add(m);
    }
  });

  this._measurementsAdded.notify(measurements);

  if (computedMeasurements.size() > 0) {
    this._computedMeasurementsAdded.notify(computedMeasurements);
  }
};

/**
 * @param {epiviz.measurements.MeasurementSet} measurements
 */
epiviz.measurements.MeasurementsManager.prototype.removeMeasurements = function(measurements) {
  var self = this;
  this._measurements.removeAll(measurements);

  var computedMeasurements = new epiviz.measurements.MeasurementSet();
  measurements.foreach(function(m) {
    if (m.isComputed()) {
      computedMeasurements.add(m);
      self._computedMeasurements.remove(m);
    }
  });

  this._measurementsRemoved.notify(measurements);

  if (computedMeasurements.size() > 0) {
    this._computedMeasurementsRemoved.notify(computedMeasurements);
  }
};

/**
 * @param {epiviz.measurements.Measurement} measurement
 */
epiviz.measurements.MeasurementsManager.prototype.addMeasurement = function(measurement) {
  var measurements = new epiviz.measurements.MeasurementSet();
  measurements.add(measurement);

  this.addMeasurements(measurements);
};

/**
 * @param {epiviz.measurements.Measurement} measurement
 */
epiviz.measurements.MeasurementsManager.prototype.removeMeasurement = function(measurement) {
  var measurements = new epiviz.measurements.MeasurementSet();
  measurements.add(measurement);

  this.removeMeasurements(measurements);
};
