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
 * @param {Array.<Array.<epiviz.datatypes.GenomicDataMeasurementWrapper.ValueItem>>} [valueItems] For each measurement, an array of value items
 * @param {Array.<epiviz.measurements.Measurement>} [measurements]
 * @param {string} [cssClasses]
 * @param {Array.<Array.<Object.<string, string>>>} [metadata]
 * @param {boolean} [useLooseCompare]
 * @constructor
 * @struct
 * @implements {epiviz.ui.charts.VisObject}
 */
epiviz.ui.charts.ChartObject = function(id, start, end, values, seriesIndex, valueItems, measurements, cssClasses, metadata, useLooseCompare) {
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
   * @type {Array.<Array.<epiviz.datatypes.GenomicDataMeasurementWrapper.ValueItem>>}
   */
  this.valueItems = valueItems;

  /**
   * For each measurement, a group of items, and for each item, the corresponding metadata as a map of column name and value
   * @type {Array.<Array.<Object.<string, string>>>}
   */
  this.metadata = metadata;

  /**
   * @type {Array.<epiviz.measurements.Measurement>}
   */
  this.measurements = measurements;

  /**
   * @type {string}
   */
  this.cssClasses = cssClasses;

  /**
   * @type {boolean}
   */
  this.useLooseCompare = useLooseCompare;
};

/**
 * @param {number} i
 * @param {number} j
 * @param {string} metadataCol
 * @returns {string}
 */
epiviz.ui.charts.ChartObject.prototype.getMetadata = function(i, j, metadataCol) {
  if (this.metadata) {
    return this.metadata[i][j][metadataCol];
  }

  if (this.valueItems) {
    return this.valueItems[i][j].rowItem.metadata(metadataCol);
  }

  return null;
};

/**
 * Number of measurements times number of objects stored per measurement
 * @returns {Array.<number>}
 */
epiviz.ui.charts.ChartObject.prototype.dimensions = function() {
  var ret = [];
  if (this.metadata) {
    ret.push(this.metadata.length);
    if (this.metadata.length) {
      ret.push(this.metadata[0].length);
    } else {
      ret.push(0);
    }
    return ret;
  }

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

/**
 * @param {epiviz.ui.charts.ChartObject} other
 * @returns {boolean}
 */
epiviz.ui.charts.ChartObject.prototype.overlapsWith = function(other) {
  if (!other) { return false; }
  if (this === other) { return true; }

  var i, j, k;
  var thisRowItem, otherRowItem;

  // If this is a generic selection with no cells inside, then check its start and end against
  // the other object's cells/location
  var thisDim = this.dimensions();
  var otherDim = other.dimensions();
  // TODO: Code cleanup
  //if (!this.measurements || !this.measurements.length) {
  if (!thisDim[0]) {
    //if (!other.measurements || !other.measurements.length) {
    if (!otherDim[0]) {
      return (this.start < other.end && this.end > other.start);
    }

    for (j = 0; j < other.valueItems[0].length; ++j) {
      otherRowItem = other.valueItems[0][j].rowItem;

      if (this.start < otherRowItem.end() && this.end > otherRowItem.start()) {
        return true;
      }
    }

    return false;
  }

  // Check metadata
  var thisMetadata = this.metadata ? this.metadata[0][0] : this.valueItems[0][0].rowItem.rowMetadata();
  var otherMetadata = other.metadata ? other.metadata[0][0] : other.valueItems[0][0].rowItem.rowMetadata();
  var commonMetadata = epiviz.utils.mapKeyIntersection(thisMetadata, otherMetadata);

  if (commonMetadata.length) {
    for (i = 0; i < thisDim[1]; ++i) {
      for (j = 0; j < otherDim[1]; ++j) {
        var metadataMatches = true;
        for (k = 0; k < commonMetadata.length; ++k) {
          var useLooseCompare = this.useLooseCompare || other.useLooseCompare;
          var thisM = this.getMetadata(0, i, commonMetadata[k]);
          var otherM = other.getMetadata(0, j, commonMetadata[k]);
          if ((!useLooseCompare && thisM != otherM) ||
            (useLooseCompare && thisM.indexOf(otherM) < 0 && otherM.indexOf(thisM) < 0)) {
            metadataMatches = false;
            break;
          }
        }

        if (metadataMatches) {
          return true;
        }
      }
    }
    return false;
  }

  // If there are no common metadata columns, then we'll check for location overlaps
  for (i = 0; i < this.valueItems[0].length; ++i) {
    for (j = 0; j < other.valueItems[0].length; ++j) {
      thisRowItem = this.valueItems[0][i].rowItem;
      otherRowItem = other.valueItems[0][j].rowItem;

      if (thisRowItem.overlapsWith(otherRowItem)) { return true; }
    }
  }

  return false;
};


