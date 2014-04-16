/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/22/13
 * Time: 9:00 PM
 */

goog.provide('epiviz.ui.charts.ColorPalette');

/**
 * @param {Array.<string>} colors
 * @constructor
 */
epiviz.ui.charts.ColorPalette = function(colors) {
  this._colors = colors;
};

/**
 * @param {number} i
 * @returns {string} A color corresponding to the index i
 */
epiviz.ui.charts.ColorPalette.prototype.get = function(i) {
  return this._colors[i % this._colors.length];
};

/**
 * @returns {Number} The number of colors contained in this palette
 */
epiviz.ui.charts.ColorPalette.prototype.size = function() {
  return this._colors.length;
};

/**
 * @param {epiviz.ui.charts.ColorPalette} other
 * @returns {boolean}
 */
epiviz.ui.charts.ColorPalette.prototype.equals = function(other) {
  if (this == other) { return true; }
  if (!other) { return false; }

  return epiviz.utils.arraysEqual(this._colors, other._colors);
};

/**
 * @returns {epiviz.ui.charts.ColorPalette}
 */
epiviz.ui.charts.ColorPalette.prototype.copy = function() {
  return new epiviz.ui.charts.ColorPalette(this._colors.slice(0));
};

/**
 * @returns {Array.<string>}
 */
epiviz.ui.charts.ColorPalette.prototype.raw = function() {
  return this._colors;
};

/**
 * @param {Array.<string>} o
 * @returns {epiviz.ui.charts.ColorPalette}
 */
epiviz.ui.charts.ColorPalette.fromRawObject = function(o) {
  return new epiviz.ui.charts.ColorPalette(o);
};
