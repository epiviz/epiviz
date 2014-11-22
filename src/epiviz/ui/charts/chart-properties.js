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
 * @param {epiviz.ui.controls.VisConfigSelection} [visConfigSelection]
 * @param {epiviz.ui.charts.ColorPalette} [colors]
 * @param {Object.<string, string>} [modifiedMethods]
 * @param {Object<string, *>} [customSettingsValues]
 * @param {Array.<epiviz.ui.charts.CustomSetting>} [customSettingsDefs]
 * @constructor
 * @struct
 * @extends {epiviz.ui.charts.VisualizationProperties}
 */
epiviz.ui.charts.ChartProperties = function(width, height, margins, visConfigSelection, colors, modifiedMethods, customSettingsValues, customSettingsDefs) {

  epiviz.ui.charts.VisualizationProperties.call(this, width, height, margins, colors, modifiedMethods, customSettingsValues, customSettingsDefs);

  /**
   * @type {epiviz.ui.controls.VisConfigSelection}
   */
  this.visConfigSelection = visConfigSelection;
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
  ret.visConfigSelection = new epiviz.ui.controls.VisConfigSelection(
    this.visConfigSelection.measurements ? new epiviz.measurements.MeasurementSet(this.visConfigSelection.measurements) : undefined,
    this.visConfigSelection.datasource,
    this.visConfigSelection.dataprovider,
    epiviz.utils.mapCopy(this.visConfigSelection.annotation),
    this.visConfigSelection.defaultChartType,
    this.visConfigSelection.minSelectedMeasurements);
  return ret;
};
