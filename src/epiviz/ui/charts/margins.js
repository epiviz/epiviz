/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/22/13
 * Time: 8:34 PM
 */

goog.provide('epiviz.ui.charts.Margins');

/**
 * @param {number} top
 * @param {number} left
 * @param {number} bottom
 * @param {number} right
 * @constructor
 */
epiviz.ui.charts.Margins = function(top, left, bottom, right) {
  /**
   * @type {number}
   * @private
   */
  this._top = top;

  /**
   * @type {number}
   * @private
   */
  this._left = left;

  /**
   * @type {number}
   * @private
   */
  this._bottom = bottom;

  /**
   * @type {number}
   * @private
   */
  this._right = right;
};

/**
 * @type {epiviz.ui.charts.Margins}
 * @const
 */
epiviz.ui.charts.Margins.ZERO_MARGIN = new epiviz.ui.charts.Margins(0, 0, 0, 0);

/**
 * @returns {number}
 */
epiviz.ui.charts.Margins.prototype.top = function() { return this._top; };

/**
 * @returns {number}
 */
epiviz.ui.charts.Margins.prototype.left = function() { return this._left; };

/**
 * @returns {number}
 */
epiviz.ui.charts.Margins.prototype.bottom = function() { return this._bottom; };

/**
 * @returns {number}
 */
epiviz.ui.charts.Margins.prototype.right = function() { return this._right; };

/**
 * @param {epiviz.ui.charts.Axis} axis
 * @returns {number}
 */
epiviz.ui.charts.Margins.prototype.sumAxis = function(axis) {
  switch (axis) {
    case epiviz.ui.charts.Axis.X: return this._left + this._right;
    case epiviz.ui.charts.Axis.Y: return this._top + this._bottom;
    default: throw Error('Invalid argument: ' + axis);
  }
};

/**
 * @returns {{top: number, left: number, bottom: number, right: number}}
 */
epiviz.ui.charts.Margins.prototype.raw = function() {
  return {
    top: this._top,
    left: this._left,
    bottom: this._bottom,
    right: this._right
  };
};

/**
 * @param {{top: number, left: number, bottom: number, right: number}} o
 * @returns {epiviz.ui.charts.Margins}
 */
epiviz.ui.charts.Margins.fromRawObject = function(o) {
  return new epiviz.ui.charts.Margins(o.top, o.left, o.bottom, o.right);
};

/**
 * @returns {epiviz.ui.charts.Margins}
 */
epiviz.ui.charts.Margins.prototype.copy = function() {
  return new epiviz.ui.charts.Margins(this._top, this._left, this._bottom, this._right);
};

/**
 * @param {epiviz.ui.charts.Margins} other
 * @returns {boolean}
 */
epiviz.ui.charts.Margins.prototype.equals = function(other) {
  if (!other) { return false; }
  if (this == other) { return true; }
  return (this._top == other._top && this._left == other._left && this._bottom == other._bottom && this._right == other._right);
};
