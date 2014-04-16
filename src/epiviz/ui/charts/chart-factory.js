/**
 * Created by: Florin Chelaru
 * Date: 10/3/13
 * Time: 10:59 PM
 */

goog.provide('epiviz.ui.charts.ChartFactory');

goog.require('epiviz.ui.charts.Chart');
goog.require('epiviz.ui.charts.ChartType');

/**
 * @param {epiviz.Config} config
 * @constructor
 * @implements {epiviz.utils.Iterable}
 */
epiviz.ui.charts.ChartFactory = function(config) {

  /**
   * @type {epiviz.Config}
   * @private
   */
  this._config = config;

  /**
   * A map of type names and their corresponding constructors
   * @type {Object.<string, epiviz.ui.charts.ChartType>}
   * @private
   */
  this._types = {};

  /**
   * @type {number}
   * @private
   */
  this._size = 0;

  for (var i = 0; i < config.chartTypes.length; ++i) {
    this.register(config.chartTypes[i]);
  }
};

/**
 * @returns {number}
 */
epiviz.ui.charts.ChartFactory.prototype.size = function() {
  return this._size;
};

/**
 * @param {epiviz.ui.charts.ChartType} type
 */
epiviz.ui.charts.ChartFactory.prototype.registerType = function(type) {
  if (!(type.typeName() in this._types)) {
    ++this._size;
  }
  this._types[type.typeName()] = type;
};

/**
 * @param {epiviz.ui.charts.ChartType} type
 * @returns {boolean}
 */
epiviz.ui.charts.ChartFactory.prototype.unregisterType = function(type) {
  if (!(type.typeName() in this._types)) { return false; }

  --this._size;

  delete this._types[type.typeName()];
  return true;
};

/**
 * @param {string} typeName
 * @returns {boolean}
 */
epiviz.ui.charts.ChartFactory.prototype.register = function(typeName) {
  /** @type {?function(new:epiviz.ui.charts.ChartType)} */
  var typeDescriptorConstructor = epiviz.utils.evaluateFullyQualifiedTypeName(typeName);

  if (!typeDescriptorConstructor) { return false; }

  this.registerType(/** @type {epiviz.ui.charts.ChartType} */ (new typeDescriptorConstructor(this._config)));
  return true;
};

/**
 * @param {string} typeName
 * @returns {boolean}
 */
epiviz.ui.charts.ChartFactory.prototype.unregister = function(typeName) {
  /** @type {?function(new:epiviz.ui.charts.ChartType)} */
  var typeDescriptorConstructor = epiviz.utils.evaluateFullyQualifiedTypeName(typeName);

  if (!typeDescriptorConstructor) { return false; }

  return this.unregisterType(/** @type {epiviz.ui.charts.ChartType} */ (new typeDescriptorConstructor(this._config)));
};

/**
 * @param {string} typeName
 * @returns {?epiviz.ui.charts.ChartType}
 */
epiviz.ui.charts.ChartFactory.prototype.get = function(typeName) {
  if (typeName && typeName in this._types) {
    return this._types[typeName];
  }

  return null;
};

/**
 * Iterates through all types in the factory, or until func returns something that evaluates to true.
 * @param {function(string, epiviz.ui.charts.ChartType)} func A function called for each (typeName, descriptor) pair in the factory.
 */
epiviz.ui.charts.ChartFactory.prototype.foreach = function(func) {
  for (var typeName in this._types) {
    if (!this._types.hasOwnProperty(typeName)) { continue; }
    if (func(typeName, this._types[typeName])) {
      return;
    }
  }
};

