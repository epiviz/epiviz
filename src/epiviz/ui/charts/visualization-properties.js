/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/15/2014
 * Time: 9:07 AM
 */

goog.provide('epiviz.ui.charts.VisualizationProperties');

/**
 * @param {number|string} [width]
 * @param {number|string} [height]
 * @param {epiviz.ui.charts.Margins} [margins]
 * @param {epiviz.ui.controls.VisConfigSelection} [visConfigSelection]
 * @param {epiviz.ui.charts.ColorPalette} [colors]
 * @param {Object.<string, string>} [modifiedMethods]
 * @param {Object<string, *>} [customSettingsValues]
 * @param {Array.<epiviz.ui.charts.CustomSetting>} [customSettingsDefs]
 * @param {Array.<epiviz.ui.charts.markers.VisualizationMarker>} [chartMarkers]
 * @constructor
 * @struct
 */
epiviz.ui.charts.VisualizationProperties = function(width, height, margins, visConfigSelection, colors, modifiedMethods, customSettingsValues, customSettingsDefs, chartMarkers) {
  /**
   * @type {number|string}
   */
  this.width = width;

  /**
   * @type {number|string}
   */
  this.height = height;

  /**
   * @type {epiviz.ui.charts.Margins}
   */
  this.margins = margins;

  /**
   * @type {epiviz.ui.controls.VisConfigSelection}
   */
  this.visConfigSelection = visConfigSelection;

  /**
   * @type {epiviz.ui.charts.ColorPalette}
   */
  this.colors = colors;

  /**
   * @type {Object.<string, string>}
   */
  this.modifiedMethods = modifiedMethods;

  /**
   * @type {Object.<string, *>}
   */
  this.customSettingsValues = customSettingsValues || {};

  /**
   * @type {Array.<epiviz.ui.charts.CustomSetting>}
   */
  this.customSettingsDefs = customSettingsDefs || [];

  /**
   * @type {Array.<epiviz.ui.charts.markers.VisualizationMarker>}
   */
  this.chartMarkers = chartMarkers || [];
};

/**
 * @returns {epiviz.ui.charts.VisualizationProperties}
 */
epiviz.ui.charts.VisualizationProperties.prototype.copy = function() {
  var visConfigSelection = new epiviz.ui.controls.VisConfigSelection(
    this.visConfigSelection.measurements ? new epiviz.measurements.MeasurementSet(this.visConfigSelection.measurements) : undefined,
    this.visConfigSelection.datasource,
    this.visConfigSelection.datasourceGroup,
    this.visConfigSelection.dataprovider,
    epiviz.utils.mapCopy(this.visConfigSelection.annotation),
    this.visConfigSelection.defaultChartType,
    this.visConfigSelection.minSelectedMeasurements);
  return new epiviz.ui.charts.VisualizationProperties(
    this.width, this.height,
    this.margins ? this.margins.copy() : this.margins,
    visConfigSelection,
    this.colors,
    this.modifiedMethods ? epiviz.utils.mapCopy(this.modifiedMethods) : this.modifiedMethods,
    this.customSettingsValues ? epiviz.utils.mapCopy(this.customSettingsValues) : this.customSettingsValues,
    this.customSettingsDefs ? this.customSettingsDefs.slice(0) : this.customSettingsDefs,
    this.chartMarkers.slice(0));
};

