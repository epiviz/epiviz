/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/14/13
 * Time: 11:55 PM
 */

goog.provide('epiviz.plugins.charts.ScatterPlotType');

goog.require('epiviz.ui.charts.Chart');

/**
 * @param {epiviz.Config} config
 * @extends {epiviz.ui.charts.PlotType}
 * @constructor
 */
epiviz.plugins.charts.ScatterPlotType = function(config) {
  // Call superclass constructor
  epiviz.ui.charts.PlotType.call(this, config);
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.ScatterPlotType.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.PlotType.prototype);
epiviz.plugins.charts.ScatterPlotType.constructor = epiviz.plugins.charts.ScatterPlotType;

/**
 * @param {string} id
 * @param {jQuery} container The div where the chart will be drawn
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @returns {epiviz.plugins.charts.ScatterPlot}
 */
epiviz.plugins.charts.ScatterPlotType.prototype.createNew = function(id, container, properties) {
  return new epiviz.plugins.charts.ScatterPlot(id, container, properties);
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.ScatterPlotType.prototype.typeName = function() {
  return 'epiviz.plugins.charts.ScatterPlot';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.ScatterPlotType.prototype.chartName = function() {
  return 'Scatter Plot';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.ScatterPlotType.prototype.chartHtmlAttributeName = function() {
  return 'scatter';
};

/**
 * @returns {function(epiviz.measurements.Measurement): boolean}
 */
epiviz.plugins.charts.ScatterPlotType.prototype.measurementsFilter = function() { return function(m) { return epiviz.measurements.Measurement.Type.hasValues(m.type()); }; };

/**
 * If true, this flag indicates that the corresponding chart can only show measurements that belong to the same
 * data source group
 * @returns {boolean}
 */
epiviz.plugins.charts.ScatterPlotType.prototype.isRestrictedToSameDatasourceGroup = function() { return true; };

/**
 * Gets the minimum number of measurements that must be selected for the chart to be displayed
 * @returns {number}
 */
epiviz.plugins.charts.ScatterPlotType.prototype.minSelectedMeasurements = function() { return 2; };

/**
 * @returns {Array.<epiviz.ui.charts.CustomSetting>}
 */
epiviz.plugins.charts.ScatterPlotType.prototype.customSettingsDefs = function() {
  return epiviz.ui.charts.PlotType.prototype.customSettingsDefs.call(this).concat([
    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.ScatterPlotType.CustomSettings.CIRCLE_RADIUS_RATIO,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      0.015,
      'Circle radius ratio'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.ui.charts.Visualization.CustomSettings.X_MIN,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      epiviz.ui.charts.CustomSetting.DEFAULT,
      'Min X'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.ui.charts.Visualization.CustomSettings.X_MAX,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      epiviz.ui.charts.CustomSetting.DEFAULT,
      'Max X'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.ui.charts.Visualization.CustomSettings.Y_MIN,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      epiviz.ui.charts.CustomSetting.DEFAULT,
      'Min Y'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.ui.charts.Visualization.CustomSettings.Y_MAX,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      epiviz.ui.charts.CustomSetting.DEFAULT,
      'Max Y')
  ]);
};

/**
 * @enum {string}
 */
epiviz.plugins.charts.ScatterPlotType.CustomSettings = {
  CIRCLE_RADIUS_RATIO: 'circleRadiusRatio'
};
