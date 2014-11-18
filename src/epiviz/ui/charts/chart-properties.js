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
 * @param {Object.<string, string>} [modifiedMethods]
 * @param {Object<string, *>} [customSettingsValues]
 * @param {Array.<epiviz.ui.charts.CustomSetting>} [customSettingsDefs]
 * @constructor
 * @struct
 * @extends {epiviz.ui.charts.VisualizationProperties}
 */
epiviz.ui.charts.ChartProperties = function(width, height, margins, measurements, colors, modifiedMethods, customSettingsValues, customSettingsDefs) {

  epiviz.ui.charts.VisualizationProperties.call(this, width, height, margins, colors, modifiedMethods, customSettingsValues, customSettingsDefs);

  /**
   * @type {epiviz.measurements.MeasurementSet}
   */
  this.measurements = measurements;
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.ChartProperties.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.VisualizationProperties.prototype);
epiviz.ui.charts.ChartProperties.constructor = epiviz.ui.charts.ChartProperties;

/**
 * @returns {epiviz.ui.charts.ChartProperties}
 */
epiviz.ui.charts.ChartProperties.prototype.copy = function() {
  var ret = /** @type {epiviz.ui.charts.ChartProperties} */ epiviz.ui.charts.VisualizationProperties.prototype.copy.call(this);
  ret.measurements = this.measurements ? new epiviz.measurements.MeasurementSet(this.measurements) : this.measurements;
  return ret;
};
