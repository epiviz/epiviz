/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 3/25/14
 * Time: 2:03 PM
 */

goog.provide('epiviz.ui.charts.ChartIndexObject');

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
epiviz.ui.charts.ChartIndexObject = function(id, keys, keyValues, values, valueItems, measurements, seriesIndex, cssClasses) {
    epiviz.ui.charts.VisObject.call(this);

    this.id = id;

    // Array
    this.keys = keys;

    // Array - made of [keys]
    this.keyValues = keyValues;

    // array [x, y]
    this.values = values;

    // number
    this.seriesIndex = seriesIndex;

    // array [actual dataX and dataY items]
    this.valueItems = valueItems;

    // [dimx, dimY]
    this.measurements = measurements;
    this.cssClasses = cssClasses;
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.ChartIndexObject.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.VisObject.prototype);
epiviz.ui.charts.ChartIndexObject.constructor = epiviz.ui.charts.ChartIndexObject;

epiviz.ui.charts.ChartIndexObject.prototype.getMetadata = function(i, j, metadataCol) {
    if (this.valueItems) {
        return this.valueItems[i][j][metadataCol];
    }

    return null;
};

epiviz.ui.charts.ChartIndexObject.prototype.metadataColumns = function() {
    return this.keys;
};

epiviz.ui.charts.ChartIndexObject.prototype.dimensions = function() {
    return [1, 1];
};