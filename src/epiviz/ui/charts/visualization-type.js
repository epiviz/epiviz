/**
 * Created by: Florin Chelaru
 * Date: 11/22/14
 * Time: 12:43 PM
 */

goog.provide('epiviz.ui.charts.VisualizationType');
goog.provide('epiviz.ui.charts.VisualizationType.DisplayType');

goog.require('epiviz.ui.charts.Visualization');


/**
 * Abstract class
 * @param {epiviz.Config} config
 * @constructor
 */
epiviz.ui.charts.VisualizationType = function(config) {

  var VisualizationPropertySettings = epiviz.Config.VisualizationPropertySettings;

  /**
   * @type {epiviz.Config}
   * @private
   */
  this._config = config;

  /**
   * @type {Object.<epiviz.Config.VisualizationPropertySettings|string, *>}
   * @protected
   */
  this._defaultSettings = epiviz.utils.mapCombine(
    epiviz.utils.mapCombine(config.chartSettings[this.typeName()], config.chartSettings[this.chartDisplayType()], true),
    config.chartSettings['default'], true);

  /**
   * @type {string|number}
   * @private
   */
  this._defaultWidth = this._defaultSettings[VisualizationPropertySettings.WIDTH];

  /**
   * @type {string|number}
   * @private
   */
  this._defaultHeight = this._defaultSettings[VisualizationPropertySettings.HEIGHT];

  /**
   * @type {epiviz.ui.charts.Margins}
   * @private
   */
  this._defaultMargins = this._defaultSettings[VisualizationPropertySettings.MARGINS];

  /**
   * @type {epiviz.ui.charts.ColorPalette}
   * @private
   */
  this._defaultColors = config.colorPalettesMap[this._defaultSettings[VisualizationPropertySettings.COLORS]];

  /**
   * @type {Array.<string>}
   * @private
   */
  this._decorations = this._defaultSettings[VisualizationPropertySettings.DECORATIONS];

  /**
   * @type {?Object.<string, *>}
   * @private
   */
  this._customSettingsValues = config.chartCustomSettings[this.typeName()] || null;
};

/**
 * @enum {string}
 */
epiviz.ui.charts.VisualizationType.DisplayType = {
  PLOT: 'plot',
  TRACK: 'track',
  DATA_STRUCTURE: 'data-structure'
};

/**
 * @param {string} id
 * @param {jQuery} container
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @returns {epiviz.ui.charts.Chart}
 */
epiviz.ui.charts.VisualizationType.prototype.createNew = function(id, container, properties) { throw Error('unimplemented abstract method'); };

/**
 * @returns {string} The fully qualified type name of the chart
 */
epiviz.ui.charts.VisualizationType.prototype.typeName = function() { throw Error('unimplemented abstract method'); };

/**
 * @returns {string}
 */
epiviz.ui.charts.VisualizationType.prototype.chartName = function() { throw Error('unimplemented abstract method'); };

/**
 * @returns {string} a string to be used for html id attributes of
 *   elements containing this chart type
 */
epiviz.ui.charts.VisualizationType.prototype.chartHtmlAttributeName = function() { throw Error('unimplemented abstract method'); };

/**
 * @returns {epiviz.ui.charts.VisualizationType.DisplayType}
 */
epiviz.ui.charts.VisualizationType.prototype.chartDisplayType = function() { throw Error('unimplemented abstract method'); };

/**
 * @returns {function(epiviz.measurements.Measurement): boolean}
 */
epiviz.ui.charts.VisualizationType.prototype.measurementsFilter = function() { return function(m) { return true; }; };

/**
 * If true, this flag indicates that the corresponding chart can only show measurements that belong to the same
 * data source group
 * @returns {boolean}
 */
epiviz.ui.charts.VisualizationType.prototype.isRestrictedToSameDatasourceGroup = function() { return false; };

/**
 * @returns {boolean}
 */
epiviz.ui.charts.VisualizationType.prototype.isRestrictedToRangeMeasurements = function() { return false; };

/**
 * @returns {boolean}
 */
epiviz.ui.charts.VisualizationType.prototype.isRestrictedToFeatureMeasurements = function() { return !this.isRestrictedToRangeMeasurements(); };

/**
 * Gets the minimum number of measurements that must be selected for the chart to be displayed
 * @returns {number}
 */
epiviz.ui.charts.VisualizationType.prototype.minSelectedMeasurements = function() { return 1; };

/**
 * @returns {string}
 */
epiviz.ui.charts.VisualizationType.prototype.chartContainer = function() {
  return epiviz.ui.ControlManager.CHART_TYPE_CONTAINERS[this.chartDisplayType()];
};

/**
 * @returns {string}
 */
epiviz.ui.charts.VisualizationType.prototype.cssClass = function() { throw Error('unimplemented abstract method'); };

/**
 * @returns {number|string}
 */
epiviz.ui.charts.VisualizationType.prototype.defaultWidth = function() { return this._defaultWidth; };

/**
 * @returns {number|string}
 */
epiviz.ui.charts.VisualizationType.prototype.defaultHeight = function() { return this._defaultHeight; };

/**
 * @returns {epiviz.ui.charts.Margins}
 */
epiviz.ui.charts.VisualizationType.prototype.defaultMargins = function() { return this._defaultMargins; };

/**
 * @returns {epiviz.ui.charts.ColorPalette}
 */
epiviz.ui.charts.VisualizationType.prototype.defaultColors = function() { return this._defaultColors; };

/**
 * @returns {Array.<string>}
 */
epiviz.ui.charts.VisualizationType.prototype.decorations = function() { return this._decorations; };

/**
 * @returns {?Object.<string, *>}
 */
epiviz.ui.charts.VisualizationType.prototype.customSettingsValues = function() { return this._customSettingsValues; };

/**
 * @returns {Array.<epiviz.ui.charts.CustomSetting>}
 */
epiviz.ui.charts.VisualizationType.prototype.customSettingsDefs = function() {
  return [
    new epiviz.ui.charts.CustomSetting(
      epiviz.ui.charts.Visualization.CustomSettings.TITLE,
      epiviz.ui.charts.CustomSetting.Type.STRING,
      '',
      'Title'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.ui.charts.Visualization.CustomSettings.MARGIN_TOP,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      this._defaultMargins.top(),
      'Top margin'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.ui.charts.Visualization.CustomSettings.MARGIN_BOTTOM,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      this._defaultMargins.bottom(),
      'Bottom margin'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.ui.charts.Visualization.CustomSettings.MARGIN_LEFT,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      this._defaultMargins.left(),
      'Left margin'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.ui.charts.Visualization.CustomSettings.MARGIN_RIGHT,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      this._defaultMargins.right(),
      'Right margin')
  ];
};
