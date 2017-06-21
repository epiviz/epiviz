/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/14/13
 * Time: 11:55 PM
 */

goog.provide('epiviz.plugins.charts.FeatureScatterPlotType');

goog.require('epiviz.ui.charts.Chart');

/**
 * @param {epiviz.Config} config
 * @extends {epiviz.ui.charts.PlotType}
 * @constructor
 */
epiviz.plugins.charts.FeatureScatterPlotType = function(config) {
  // Call superclass constructor
  epiviz.ui.charts.PlotType.call(this, config);
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.FeatureScatterPlotType.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.PlotType.prototype);
epiviz.plugins.charts.FeatureScatterPlotType.constructor = epiviz.plugins.charts.FeatureScatterPlotType;

/**
 * @param {string} id
 * @param {jQuery} container The div where the chart will be drawn
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @returns {epiviz.plugins.charts.ScatterPlot}
 */
epiviz.plugins.charts.FeatureScatterPlotType.prototype.createNew = function(id, container, properties) {
  return new epiviz.plugins.charts.FeatureScatterPlot(id, container, properties);
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.FeatureScatterPlotType.prototype.typeName = function() {
  return 'epiviz.plugins.charts.FeatureScatterPlot';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.FeatureScatterPlotType.prototype.chartName = function() {
  return 'Feature Plot';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.FeatureScatterPlotType.prototype.chartHtmlAttributeName = function() {
  return 'feature_scatter';
};

/**
 * @returns {function(epiviz.measurements.Measurement): boolean}
 */
epiviz.plugins.charts.FeatureScatterPlotType.prototype.measurementsFilter = function() { return function(m) { return epiviz.measurements.Measurement.Type.hasValues(m.type()); }; };

/**
 * If true, this flag indicates that the corresponding chart can only show measurements that belong to the same
 * data source group
 * @returns {boolean}
 */
epiviz.plugins.charts.FeatureScatterPlotType.prototype.isRestrictedToSameDatasourceGroup = function() { return true; };

/**
 * Gets the minimum number of measurements that must be selected for the chart to be displayed
 * @returns {number}
 */
epiviz.plugins.charts.FeatureScatterPlotType.prototype.minSelectedMeasurements = function() { return 2; };

/**
 * @returns {Array.<epiviz.ui.charts.CustomSetting>}
 */
epiviz.plugins.charts.FeatureScatterPlotType.prototype.customSettingsDefs = function() {
  return epiviz.ui.charts.PlotType.prototype.customSettingsDefs.call(this).concat([
    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.FeatureScatterPlotType.CustomSettings.CIRCLE_RADIUS_RATIO,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      0.015,
      'Circle radius ratio'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.ui.charts.Visualization.CustomSettings.ROW_LABEL,
      epiviz.ui.charts.CustomSetting.Type.MEASUREMENTS_ANNOTATION,
      'name',
      'Row labels'),
      
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
      'Max Y'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.FeatureScatterPlotType.CustomSettings.FEATURE_NAME,
      epiviz.ui.charts.CustomSetting.Type.STRING,
      "Bacteria",
      'Feature Name'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.FeatureScatterPlotType.CustomSettings.FEATURE_ID,
      epiviz.ui.charts.CustomSetting.Type.STRING,
      "0-0",
      'Feature ID'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.FeatureScatterPlotType.CustomSettings.LOG_TRANSFORM,
      epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
      true,
      'Log Transform count data'),
    
    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.FeatureScatterPlotType.CustomSettings.SHOW_POINTS,
      epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
      false,
      'Show points on box plot')

  ]);
};

/**
 * @enum {string}
 */
epiviz.plugins.charts.FeatureScatterPlotType.CustomSettings = {
  CIRCLE_RADIUS_RATIO: 'circleRadiusRatio',
  FEATURE_NAME: 'featureName',
  FEATURE_ID: 'featureId',
  LOG_TRANSFORM: 'logTransform',
  SHOW_POINTS: 'showPoints'
};
