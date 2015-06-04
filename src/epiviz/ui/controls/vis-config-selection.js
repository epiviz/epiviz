/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 4/1/14
 * Time: 3:31 PM
 */

goog.provide('epiviz.ui.controls.VisConfigSelection');

/**
 * @param {epiviz.measurements.MeasurementSet} [measurements]
 * @param {string} [datasource]
 * @param {string} [datasourceGroup]
 * @param {string} [dataprovider]
 * @param {Object.<string, string>} [annotation]
 * @param {string} [defaultChartType]
 * @param {number} [minSelectedMeasurements]
 * @param {T} [customData]
 * @constructor
 * @struct
 * @template T
 */
epiviz.ui.controls.VisConfigSelection = function(measurements, datasource, datasourceGroup, dataprovider, annotation, defaultChartType, minSelectedMeasurements, customData) {
  /**
   * @type {epiviz.measurements.MeasurementSet}
   */
  this.measurements = measurements;

  /**
   * @type {string}
   */
  this.datasource = datasource;

  /**
   * @type {string}
   */
  this.datasourceGroup = datasourceGroup;

  /**
   * @type {string}
   */
  this.dataprovider = dataprovider;

  /**
   * @type {Object.<string, string>}
   */
  this.annotation = annotation;

  /**
   * @type {string}
   */
  this.defaultChartType = defaultChartType;

  /**
   * @type {number}
   */
  this.minSelectedMeasurements = minSelectedMeasurements || 1;

  /**
   * @type {T}
   */
  this.customData = customData;
};
