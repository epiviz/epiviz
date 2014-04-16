/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 2/6/14
 * Time: 5:10 PM
 */

goog.provide('epiviz.ui.charts.ChartProperties');

/**
 * @param {number|string} [width]
 * @param {number|string} [height]
 * @param {epiviz.ui.charts.Margins} [margins]
 * @param {epiviz.measurements.MeasurementSet} [measurements]
 * @param {epiviz.ui.charts.ColorPalette} [colors]
 * @param {Object<string, *>} [customSettingsValues]
 * @param {Array.<epiviz.ui.charts.CustomSetting>} [customSettingsDefs]
 * @constructor
 * @struct
 */
epiviz.ui.charts.ChartProperties = function(width, height, margins, measurements, colors, customSettingsValues, customSettingsDefs) {
  /**
   * @type {number|string=}
   */
  this.width = width;

  /**
   * @type {number|string=}
   */
  this.height = height;

  /**
   * @type {epiviz.ui.charts.Margins=}
   */
  this.margins = margins;

  /**
   * @type {epiviz.measurements.MeasurementSet=}
   */
  this.measurements = measurements;

  /**
   * @type {epiviz.ui.charts.ColorPalette=}
   */
  this.colors = colors;

  /**
   * @type {Object.<string, *>}
   */
  this.customSettingsValues = customSettingsValues || {};

  /**
   * @type {Array.<epiviz.ui.charts.CustomSetting>}
   */
  this.customSettingsDefs = customSettingsDefs || [];
};

/**
 * @returns {epiviz.ui.charts.ChartProperties}
 */
epiviz.ui.charts.ChartProperties.prototype.copy = function() {
  return new epiviz.ui.charts.ChartProperties(
    this.width, this.height,
    this.margins ? this.margins.copy() : this.margins,
    this.measurements ? new epiviz.measurements.MeasurementSet(this.measurements) : this.measurements,
    this.colors ? this.colors.copy() : this.colors,
    this.customSettingsValues ? epiviz.utils.mapCopy(this.customSettingsValues) : this.customSettingsValues,
    this.customSettingsDefs ? this.customSettingsDefs.slice(0) : this.customSettingsDefs);
};
