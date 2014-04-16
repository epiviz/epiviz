/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 4/1/14
 * Time: 3:31 PM
 */

goog.provide('epiviz.ui.controls.MeasurementsDialogData');

/**
 * @param {epiviz.measurements.MeasurementSet} measurements
 * @param {epiviz.measurements.Measurement.Type} [type]
 * @param {string} [datasource]
 * @param {string} [datasourceGroup]
 * @param {string} [dataprovider]
 * @param {Object.<string, string>} [annotation]
 * @param {string} [defaultChartType]
 * @param {number} [minSelectedMeasurements]
 * @constructor
 * @struct
 */
epiviz.ui.controls.MeasurementsDialogData = function(measurements, type, datasource, datasourceGroup, dataprovider, annotation, defaultChartType, minSelectedMeasurements) {
  /**
   * @type {epiviz.measurements.MeasurementSet}
   */
  this.measurements = measurements;

  /**
   * @type {epiviz.measurements.Measurement.Type=}
   */
  this.type = type;

  /**
   * @type {string=}
   */
  this.datasource = datasource;

  /**
   * @type {string=}
   */
  this.datasourceGroup = datasourceGroup;

  /**
   * @type {string=}
   */
  this.dataprovider = dataprovider;

  /**
   * @type {Object.<string, string>=}
   */
  this.annotation = annotation;

  /**
   * @type {string=}
   */
  this.defaultChartType = defaultChartType;

  /**
   * @type {number}
   */
  this.minSelectedMeasurements = minSelectedMeasurements || 1;
};
