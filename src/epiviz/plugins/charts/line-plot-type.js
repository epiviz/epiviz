/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 12/9/2014
 * Time: 1:09 AM
 */

goog.provide('epiviz.plugins.charts.LinePlotType');

goog.require('epiviz.ui.charts.Chart');

/**
 * @param {epiviz.Config} config
 * @extends {epiviz.ui.charts.PlotType}
 * @constructor
 */
epiviz.plugins.charts.LinePlotType = function(config) {
  // Call superclass constructor
  epiviz.ui.charts.PlotType.call(this, config);
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.LinePlotType.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.PlotType.prototype);
epiviz.plugins.charts.LinePlotType.constructor = epiviz.plugins.charts.LinePlotType;

/**
 * @param {string} id
 * @param {jQuery} container The div where the chart will be drawn
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @returns {epiviz.plugins.charts.LinePlot}
 */
epiviz.plugins.charts.LinePlotType.prototype.createNew = function(id, container, properties) {
  return new epiviz.plugins.charts.LinePlot(id, container, properties);
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.LinePlotType.prototype.typeName = function() {
  return 'epiviz.plugins.charts.LinePlot';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.LinePlotType.prototype.chartName = function() {
  return 'Line Plot';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.LinePlotType.prototype.chartHtmlAttributeName = function() {
  return 'line-plot';
};

/**
 * @returns {function(epiviz.measurements.Measurement): boolean}
 */
epiviz.plugins.charts.LinePlotType.prototype.measurementsFilter = function() { return function(m) { return m.type() == epiviz.measurements.Measurement.Type.FEATURE; }; };

/**
 * If true, this flag indicates that the corresponding chart can only show measurements that belong to the same
 * data source group
 * @returns {boolean}
 */
epiviz.plugins.charts.LinePlotType.prototype.isRestrictedToSameDatasourceGroup = function() { return true; };

/**
 * @returns {Array.<epiviz.ui.charts.CustomSetting>}
 */
epiviz.plugins.charts.LinePlotType.prototype.customSettingsDefs = function() {
  return epiviz.ui.charts.PlotType.prototype.customSettingsDefs.call(this).concat([
    new epiviz.ui.charts.CustomSetting(
      epiviz.ui.charts.Visualization.CustomSettings.COL_LABEL,
      epiviz.ui.charts.CustomSetting.Type.MEASUREMENTS_METADATA,
      'colLabel',
      'Columns labels'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.ui.charts.Visualization.CustomSettings.ROW_LABEL,
      epiviz.ui.charts.CustomSetting.Type.MEASUREMENTS_ANNOTATION,
      'name',
      'Row labels'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.LinePlotType.CustomSettings.SHOW_POINTS,
      epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
      false,
      'Show points'),
    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.LinePlotType.CustomSettings.SHOW_LINES,
      epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
      true,
      'Show lines'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.LinePlotType.CustomSettings.SHOW_ERROR_BARS,
      epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
      true,
      'Show error bars'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.LinePlotType.CustomSettings.POINT_RADIUS,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      4,
      'Point radius'),
    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.LinePlotType.CustomSettings.LINE_THICKNESS,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      3,
      'Line thickness'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.ui.charts.Visualization.CustomSettings.Y_MIN,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      epiviz.ui.charts.CustomSetting.DEFAULT,
      'Min Y'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.ui.charts.Visualization.CustomSettings.Y_MAX,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      epiviz.ui.charts.CustomSetting.DEFAULT,
      'Max Y'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.LinePlotType.CustomSettings.INTERPOLATION,
      epiviz.ui.charts.CustomSetting.Type.CATEGORICAL,
      'basis',
      'Interpolation',
      ['linear', 'step-before', 'step-after', 'basis', 'basis-open', 'basis-closed', 'bundle', 'cardinal', 'cardinal-open', 'monotone'])
  ]);
};

/**
 * @enum {string}
 */
epiviz.plugins.charts.LinePlotType.CustomSettings = {
  SHOW_POINTS: 'showPoints',
  SHOW_ERROR_BARS: 'showErrorBars',
  SHOW_LINES: 'showLines',
  POINT_RADIUS: 'pointRadius',
  LINE_THICKNESS: 'lineThickness',
  INTERPOLATION: 'interpolation'
};

