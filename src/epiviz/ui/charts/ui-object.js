/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 3/25/14
 * Time: 2:03 PM
 */

goog.provide('epiviz.ui.charts.UiObject');

/**
 * A struct for various objects in visualizations, like blocks, genes or circles in scatter plots
 * @param {string} id
 * @param {number} start
 * @param {number} end
 * @param {?Array.<number>} values One for each measurement
 * @param {number} seriesIndex
 * @param {Array.<Array.<epiviz.datatypes.GenomicDataMeasurementWrapper.ValueItem>>} valueItems For each measurement, an array of value items
 * @param {Array.<epiviz.measurements.Measurement>} measurements
 * @param {string} cssClasses
 * @constructor
 * @struct
 */
epiviz.ui.charts.UiObject = function(id, start, end, values, seriesIndex, valueItems, measurements, cssClasses) {
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
   * @type {Array.<epiviz.measurements.Measurement>}
   */
  this.measurements = measurements;

  /**
   * @type {string}
   */
  this.cssClasses = cssClasses;
};

/**
 * @param {epiviz.ui.charts.UiObject} other
 * @returns {boolean}
 */
epiviz.ui.charts.UiObject.prototype.overlapsWith = function(other) {
  if (!other) { return false; }
  if (this === other) { return true; }

  var i, j, k;
  var thisRowItem, otherRowItem;

  // If this is a generic selection with no cells inside, then check its start and end against
  // the other object's cells/location
  if (!this.measurements || !this.measurements.length) {
    if (!other.measurements || !other.measurements.length) {
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
  var commonMetadata = epiviz.utils.mapKeyIntersection(this.valueItems[0][0].rowItem.rowMetadata(), other.valueItems[0][0].rowItem.rowMetadata());

  if (commonMetadata.length) {
    for (i = 0; i < this.valueItems[0].length; ++i) {
      for (j = 0; j < other.valueItems[0].length; ++j) {
        thisRowItem = this.valueItems[0][i].rowItem;
        otherRowItem = other.valueItems[0][j].rowItem;

        var metadataMatches = true;
        for (k = 0; k < commonMetadata.length; ++k) {
          if (thisRowItem.metadata(commonMetadata[k]) != otherRowItem.metadata(commonMetadata[k])) {
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
