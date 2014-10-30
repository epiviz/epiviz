/**
 * Created by: Florin Chelaru
 * Date: 10/3/13
 * Time: 11:02 PM
 */

goog.provide('epiviz.ui.charts.ChartType');
goog.provide('epiviz.ui.charts.ChartType.DisplayType');

goog.require('epiviz.ui.charts.Chart');


/**
 * Abstract class
 * @param {epiviz.Config} config
 * @constructor
 */
epiviz.ui.charts.ChartType = function(config) {

  var ChartPropertySettings = epiviz.Config.ChartPropertySettings;

  /**
   * @type {epiviz.Config}
   * @private
   */
  this._config = config;

  /**
   * @type {Object.<epiviz.Config.ChartPropertySettings|string, *>}
   * @protected
   */
  this._defaultSettings = epiviz.utils.mapCombine(
    epiviz.utils.mapCombine(config.chartSettings[this.typeName()], config.chartSettings[this.chartDisplayType()], true),
    config.chartSettings['default'], true);

  /**
   * @type {string|number}
   * @private
   */
  this._defaultWidth = this._defaultSettings[ChartPropertySettings.WIDTH];

  /**
   * @type {string|number}
   * @private
   */
  this._defaultHeight = this._defaultSettings[ChartPropertySettings.HEIGHT];

  /**
   * @type {epiviz.ui.charts.Margins}
   * @private
   */
  this._defaultMargins = this._defaultSettings[ChartPropertySettings.MARGINS];

  /**
   * @type {epiviz.ui.charts.ColorPalette}
   * @private
   */
  this._defaultColors = this._defaultSettings[ChartPropertySettings.COLORS];

  /**
   * @type {Array.<string>}
   * @private
   */
  this._decorations = this._defaultSettings[ChartPropertySettings.DECORATIONS];

  /**
   * @type {?Object.<string, *>}
   * @private
   */
  this._customSettingsValues = config.chartCustomSettings[this.typeName()] || null;
};

/**
 * @enum {string}
 */
epiviz.ui.charts.ChartType.DisplayType = {
  PLOT: 'plot',
  TRACK: 'track'
};

/**
 * @param {string} id
 * @param {jQuery} container
 * @param {epiviz.ui.charts.ChartProperties} properties
 * @returns {epiviz.ui.charts.Chart}
 */
epiviz.ui.charts.ChartType.prototype.createNew = function(id, container, properties) { throw Error('unimplemented abstract method'); };

/**
 * @returns {string} The fully qualified type name of the chart
 */
epiviz.ui.charts.ChartType.prototype.typeName = function() { throw Error('unimplemented abstract method'); };

/**
 * @returns {string}
 */
epiviz.ui.charts.ChartType.prototype.chartName = function() { throw Error('unimplemented abstract method'); };

/**
 * @returns {string} a string to be used for html id attributes of
 *   elements containing this chart type
 */
epiviz.ui.charts.ChartType.prototype.chartHtmlAttributeName = function() { throw Error('unimplemented abstract method'); };

/**
 * @returns {epiviz.ui.charts.ChartType.DisplayType}
 */
epiviz.ui.charts.ChartType.prototype.chartDisplayType = function() { throw Error('unimplemented abstract method'); };

/**
 * @returns {epiviz.measurements.Measurement.Type}
 */
epiviz.ui.charts.ChartType.prototype.chartContentType = function() { throw Error('unimplemented abstract method'); };

/**
 * If true, this flag indicates that the corresponding chart can only show measurements that belong to the same
 * data source group
 * @returns {boolean}
 */
epiviz.ui.charts.ChartType.prototype.isRestrictedToSameDatasourceGroup = function() { return false; };

/**
 * Gets the minimum number of measurements that must be selected for the chart to be displayed
 * @returns {number}
 */
epiviz.ui.charts.ChartType.prototype.minSelectedMeasurements = function() { return 1; };

/**
 * @returns {string}
 */
epiviz.ui.charts.ChartType.prototype.chartContainer = function() {
  return epiviz.ui.ControlManager.CHART_TYPE_CONTAINERS[this.chartDisplayType()];
};

/**
 * @returns {string}
 */
epiviz.ui.charts.ChartType.prototype.cssClass = function() { throw Error('unimplemented abstract method'); };

/**
 * @returns {number|string}
 */
epiviz.ui.charts.ChartType.prototype.defaultWidth = function() { return this._defaultWidth; };

/**
 * @returns {number|string}
 */
epiviz.ui.charts.ChartType.prototype.defaultHeight = function() { return this._defaultHeight; };

/**
 * @returns {epiviz.ui.charts.Margins}
 */
epiviz.ui.charts.ChartType.prototype.defaultMargins = function() { return this._defaultMargins; };

/**
 * @returns {epiviz.ui.charts.ColorPalette}
 */
epiviz.ui.charts.ChartType.prototype.defaultColors = function() { return this._defaultColors; };

/**
 * @returns {Array.<string>}
 */
epiviz.ui.charts.ChartType.prototype.decorations = function() { return this._decorations; };

/**
 * @returns {?Object.<string, *>}
 */
epiviz.ui.charts.ChartType.prototype.customSettingsValues = function() { return this._customSettingsValues; };

/**
 * @returns {Array.<epiviz.ui.charts.CustomSetting>}
 */
epiviz.ui.charts.ChartType.prototype.customSettingsDefs = function() {
  return [
    new epiviz.ui.charts.CustomSetting(
      epiviz.ui .charts.ChartType.CustomSettings.MARGIN_TOP,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      this._defaultMargins.top(),
      'Top margin'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.ui.charts.ChartType.CustomSettings.MARGIN_BOTTOM,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      this._defaultMargins.bottom(),
      'Bottom margin'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.ui.charts.ChartType.CustomSettings.MARGIN_LEFT,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      this._defaultMargins.left(),
      'Left margin'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.ui.charts.ChartType.CustomSettings.MARGIN_RIGHT,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      this._defaultMargins.right(),
      'Right margin')
  ];
};

/**
 * @param {epiviz.measurements.MeasurementSet} measurements
 * @returns {string}
 */
epiviz.ui.charts.ChartType.prototype.constructTitle = function(measurements) {
  var measurementNames = [];
  measurements.foreach(function(m) {
    measurementNames.push(m.name());
  });
  return measurementNames.join(', ');
};

/**
 * @enum {string}
 */
epiviz.ui.charts.ChartType.CustomSettings = {
  MARGIN_LEFT: 'marginLeft',
  MARGIN_RIGHT: 'marginRight',
  MARGIN_TOP: 'marginTop',
  MARGIN_BOTTOM: 'marginBottom',
  X_MIN: 'xMin',
  X_MAX: 'xMax',
  Y_MIN: 'yMin',
  Y_MAX: 'yMax',
  LABEL: 'label'
};
