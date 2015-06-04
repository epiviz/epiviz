/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 3/25/14
 * Time: 2:03 PM
 */

goog.provide('epiviz.ui.charts.ChartObject');

/**
 * A struct for various objects in visualizations, like blocks, genes or circles in scatter plots
 * @param {string} id
 * @param {number} start
 * @param {number} end
 * @param {?Array.<number>} [values] One for each measurement
 * @param {number} [seriesIndex]
 * @param {Array.<Array.<epiviz.datatypes.GenomicData.ValueItem>>} [valueItems] For each measurement, an array of value items
 * @param {Array.<epiviz.measurements.Measurement>} [measurements]
 * @param {string} [cssClasses]
 * @constructor
 * @struct
 * @extends {epiviz.ui.charts.VisObject}
 */
epiviz.ui.charts.ChartObject = function(id, start, end, values, seriesIndex, valueItems, measurements, cssClasses) {
  epiviz.ui.charts.VisObject.call(this);

  /**
   * @type {string}
   */
  this.id = id;

  /**
   * @type {number}
   */
  this.start = start;

  /**
   * @type {number}
   */
  this.end = end;

  /**
   * @type {?Array<number>}
   */
  this.values = values;

  /**
   * @type {number}
   */
  this.seriesIndex = seriesIndex;

  /**
   * For each measurement, an array of value items
   * @type {Array.<Array.<epiviz.datatypes.GenomicData.ValueItem>>}
   */
  this.valueItems = valueItems;

  /**
   * @type {Array.<epiviz.measurements.Measurement>}
   */
  this.measurements = measurements;

  /**
   * @type {string}
   */
  this.cssClasses = cssClasses;
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.ChartObject.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.VisObject.prototype);
epiviz.ui.charts.ChartObject.constructor = epiviz.ui.charts.ChartObject;

/**
 * @returns {number}
 */
epiviz.ui.charts.ChartObject.prototype.regionStart = function() { return this.start; };

/**
 * @returns {number}
 */
epiviz.ui.charts.ChartObject.prototype.regionEnd = function() { return this.end; };

/**
 * @param {number} i
 * @param {number} j
 * @param {string} metadataCol
 * @returns {string}
 */
epiviz.ui.charts.ChartObject.prototype.getMetadata = function(i, j, metadataCol) {
  if (this.valueItems) {
    return this.valueItems[i][j].rowItem.metadata(metadataCol);
  }

  return null;
};

/**
 * Measurement i, object j
 * @param {number} i
 * @param {number} j
 * @returns {number}
 */
epiviz.ui.charts.ChartObject.prototype.getStart = function(i, j) { return this.valueItems[i][j].rowItem.start(); };

/**
 * Measurement i, object j
 * @param {number} i
 * @param {number} j
 * @returns {number}
 */
epiviz.ui.charts.ChartObject.prototype.getEnd = function(i, j) { return this.valueItems[i][j].rowItem.end(); };

/**
 * @returns {Array.<string>}
 */
epiviz.ui.charts.ChartObject.prototype.metadataColumns = function() { return Object.keys(this.valueItems[0][0].rowItem.rowMetadata()); };

/**
 * Number of measurements times number of objects stored per measurement
 * @returns {Array.<number>}
 */
epiviz.ui.charts.ChartObject.prototype.dimensions = function() {
  var ret = [];

  if (this.valueItems) {
    ret.push(this.valueItems.length);
    if (this.valueItems.length) {
      ret.push(this.valueItems[0].length);
    } else {
      ret.push(0);
    }
    return ret;
  }

  return [0, 0];
};
