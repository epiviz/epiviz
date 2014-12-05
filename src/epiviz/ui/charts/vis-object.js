/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/15/2014
 * Time: 11:03 AM
 */

goog.provide('epiviz.ui.charts.VisObject');

/**
 * @constructor
 */
epiviz.ui.charts.VisObject = function() {};

/**
 * @returns {number}
 */
epiviz.ui.charts.VisObject.prototype.regionStart = function() { return null; };

/**
 * @returns {number}
 */
epiviz.ui.charts.VisObject.prototype.regionEnd = function() { return null; };

/**
 * Measurement i, object j
 * @param {number} i
 * @param {number} j
 * @param {string} metadataCol
 * @returns {string}
 */
epiviz.ui.charts.VisObject.prototype.getMetadata = function(i, j, metadataCol) { return null; };

/**
 * Measurement i, object j
 * @param {number} i
 * @param {number} j
 * @returns {number}
 */
epiviz.ui.charts.VisObject.prototype.getStart = function(i, j) { return null; };

/**
 * Measurement i, object j
 * @param {number} i
 * @param {number} j
 * @returns {number}
 */
epiviz.ui.charts.VisObject.prototype.getEnd = function(i, j) { return null; };

/**
 * @returns {Array.<string>}
 */
epiviz.ui.charts.VisObject.prototype.metadataColumns = function() { return null; };

/**
 * Number of measurements times number of objects stored per measurement
 * @returns {Array.<number>}
 */
epiviz.ui.charts.VisObject.prototype.dimensions = function() { return [0, 0]; };

/**
 * @returns {boolean}
 */
epiviz.ui.charts.VisObject.prototype.metadataLooseCompare = function() { return false; };

/**
 * @param {epiviz.ui.charts.VisObject} other
 * @returns {boolean}
 */
epiviz.ui.charts.VisObject.prototype.overlapsWith = function(other) {
  if (!other) { return false; }
  if (this === other) { return true; }

  var i, j, k;

  // If this is a generic selection with no cells inside, then check its start and end against
  // the other object's cells/location
  var thisDim = this.dimensions();
  var otherDim = other.dimensions();

  if ((!thisDim[0] || !otherDim[0]) &&
    (this.regionStart() == undefined || other.regionStart() == undefined || this.regionEnd() == undefined || other.regionEnd() == undefined)) {

    return false;
  }

  if (!thisDim[0]) {
    if (!otherDim[0]) {
      return (this.regionStart() < other.regionEnd() && this.regionEnd() > other.regionStart());
    }

    for (j = 0; j < otherDim[1]; ++j) {
      var otherRowStart = other.getStart(0, j);
      var otherRowEnd = other.getEnd(0, j);

      if (otherRowStart != undefined && otherRowEnd != undefined &&
        this.regionStart() < otherRowEnd && this.regionEnd() > otherRowStart) {
        return true;
      }
    }

    return false;
  }

  // Check metadata
  var commonMetadata = epiviz.utils.arrayIntersection(this.metadataColumns(), other.metadataColumns());

  if (commonMetadata.length) {
    for (i = 0; i < thisDim[1]; ++i) {
      for (j = 0; j < otherDim[1]; ++j) {
        var metadataMatches = true;
        for (k = 0; k < commonMetadata.length; ++k) {
          var useLooseCompare = this.metadataLooseCompare() || other.metadataLooseCompare();
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
  for (i = 0; i < thisDim[1]; ++i) {
    for (j = 0; j < otherDim[1]; ++j) {
      if (this.getStart(0, i) < other.getEnd(0, j) && this.getEnd(0, i) > other.getStart(0, j)) {
        return true;
      }
    }
  }

  return false;
};
