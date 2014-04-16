/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 3/29/14
 * Time: 2:52 PM
 */

goog.provide('epiviz.ui.charts.CustomSetting');

/**
 * @param {string} id
 * @param {epiviz.ui.charts.CustomSetting.Type} type
 * @param defaultValue
 * @param {string} [label]
 * @param {Array} [possibleValues]
 * @constructor
 * @struct
 */
epiviz.ui.charts.CustomSetting = function(id, type, defaultValue, label, possibleValues) {
  /**
   * @type {string}
   */
  this.id = id;

  /**
   * @type {epiviz.ui.charts.CustomSetting.Type}
   */
  this.type = type;

  this.defaultValue = defaultValue;

  /**
   * @type {string}
   */
  this.label = label || id;

  /**
   * @type {Array=}
   */
  this.possibleValues = possibleValues || null;
};

/**
 * @enum {string}
 */
epiviz.ui.charts.CustomSetting.Type = {
  NUMBER: 'number',
  STRING: 'string',
  ARRAY: 'array',
  BOOLEAN: 'boolean',
  CATEGORICAL: 'categorical'
};

/**
 * @type {string}
 * @constant
 */
epiviz.ui.charts.CustomSetting.DEFAULT = 'default';
