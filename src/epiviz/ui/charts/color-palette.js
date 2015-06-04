/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/22/13
 * Time: 9:00 PM
 */

goog.provide('epiviz.ui.charts.ColorPalette');

/**
 * @param {Array.<string>} colors
 * @param {string} [name]
 * @param {string} [id]
 * @constructor
 */
epiviz.ui.charts.ColorPalette = function(colors, name, id) {
  /**
   * @type {Array.<string>}
   * @private
   */
  this._colors = colors;

  /**
   * @type {string}
   * @private
   */
  this._id = id || epiviz.utils.generatePseudoGUID(6);

  /**
   * @type {string}
   * @private
   */
  this._name = name || 'Custom (' + this._id + ')';

  /**
   * @type {Object.<string|number, number>}
   * @private
   */
  this._keyIndices = {};

  /**
   * @type {number}
   * @private
   */
  this._nKeys = 0;
};

/**
 * @returns {string}
 */
epiviz.ui.charts.ColorPalette.prototype.id = function() { return this._id; };

/**
 * @returns {string}
 */
epiviz.ui.charts.ColorPalette.prototype.name = function() { return this._name; };

/**
 * @param {number} i
 * @returns {string} A color corresponding to the index i
 */
epiviz.ui.charts.ColorPalette.prototype.get = function(i) {
  return this._colors[i % this._colors.length];
};

/**
 * @param {string|number} key
 * @returns {string}
 */
epiviz.ui.charts.ColorPalette.prototype.getByKey = function(key) {
  var index = this._keyIndices[key];
  if (index == undefined) {
    index = this._nKeys;
    this._keyIndices[key] = this._nKeys;
    ++this._nKeys;
  }
  return this.get(index);
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
 * @param {epiviz.Config} [config]
 * @returns {{id: string, name: string, colors: Array.<string>}}
 */
epiviz.ui.charts.ColorPalette.prototype.raw = function(config) {
  if (config && (this._id in config.colorPalettesMap)) {
    return {id: this._id};
  }
  return {id: this._id, name: this._name, colors: this._colors};
};

/**
 * @param {Array.<string>|{id:string, name:string, colors:Array.<string>}} o
 * @param {epiviz.Config} [config]
 * @returns {epiviz.ui.charts.ColorPalette}
 */
epiviz.ui.charts.ColorPalette.fromRawObject = function(o, config) {
  if ($.isArray(o)) {
    return new epiviz.ui.charts.ColorPalette(o);
  }

  if (config && (o.id in config.colorPalettesMap)) {
    return config.colorPalettesMap[o.id];
  }

  return new epiviz.ui.charts.ColorPalette(o.colors, o.name, o.id);
};
