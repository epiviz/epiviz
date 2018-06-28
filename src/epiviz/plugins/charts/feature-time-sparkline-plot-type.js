/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/14/13
 * Time: 11:55 PM
 */

goog.provide('epiviz.plugins.charts.FeatureTimeSparklinePlotType');

goog.require('epiviz.plugins.charts.FeatureTimeSparklinePlot');

/**
 * @param {epiviz.Config} config
 * @extends {epiviz.ui.charts.PlotType}
 * @constructor
 */
epiviz.plugins.charts.FeatureTimeSparklinePlotType = function(config) {
  // Call superclass constructor
  epiviz.ui.charts.PlotType.call(this, config);
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.FeatureTimeSparklinePlotType.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.PlotType.prototype);
epiviz.plugins.charts.FeatureTimeSparklinePlotType.constructor = epiviz.plugins.charts.FeatureTimeSparklinePlotType;

/**
 * @param {string} id
 * @param {jQuery} container The div where the chart will be drawn
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @returns {epiviz.plugins.charts.ScatterPlot}
 */
epiviz.plugins.charts.FeatureTimeSparklinePlotType.prototype.createNew = function(id, container, properties) {
  return new epiviz.plugins.charts.FeatureTimeSparklinePlot(id, container, properties);
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.FeatureTimeSparklinePlotType.prototype.typeName = function() {
  return 'epiviz.plugins.charts.FeatureTimeSparklinePlot';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.FeatureTimeSparklinePlotType.prototype.chartName = function() {
  return 'Feature Plot';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.FeatureTimeSparklinePlotType.prototype.chartHtmlAttributeName = function() {
  return 'feature_scatter';
};

/**
 * @returns {function(epiviz.measurements.Measurement): boolean}
 */
epiviz.plugins.charts.FeatureTimeSparklinePlotType.prototype.measurementsFilter = function() { return function(m) { return epiviz.measurements.Measurement.Type.hasValues(m.type()); }; };

/**
 * If true, this flag indicates that the corresponding chart can only show measurements that belong to the same
 * data source group
 * @returns {boolean}
 */
epiviz.plugins.charts.FeatureTimeSparklinePlotType.prototype.isRestrictedToSameDatasourceGroup = function() { return true; };

/**
 * Gets the minimum number of measurements that must be selected for the chart to be displayed
 * @returns {number}
 */
epiviz.plugins.charts.FeatureTimeSparklinePlotType.prototype.minSelectedMeasurements = function() { return 2; };

/**
 * @returns {Array.<epiviz.ui.charts.CustomSetting>}
 */
epiviz.plugins.charts.FeatureTimeSparklinePlotType.prototype.customSettingsDefs = function() {
  return epiviz.ui.charts.PlotType.prototype.customSettingsDefs.call(this).concat([

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.FeatureTimeSparklinePlotType.CustomSettings.SPARKLINE_PRESENTATION,
      epiviz.ui.charts.CustomSetting.Type.CATEGORICAL,
      'AVERAGE',
      'Sparkline Presentation',
      ['AVERAGE', 'CONTOUR', 'ALL', 'MIN_MAX_AVERAGE', 'MIN_MAX']),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.FeatureTimeSparklinePlotType.CustomSettings.CONTOUR_LOWER_LINE,
      epiviz.ui.charts.CustomSetting.Type.CATEGORICAL,
      'AVERAGE',
      'Contour Lower Line',
      ['MIN', 'AVERAGE']),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.FeatureTimeSparklinePlotType.CustomSettings.GROUP_SPARKLINES,
      epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
      true,
      'Group All Sparklines'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.FeatureTimeSparklinePlotType.CustomSettings.CIRCLE_RADIUS_RATIO,
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
      epiviz.plugins.charts.FeatureTimeSparklinePlotType.CustomSettings.FEATURE_NAME,
      epiviz.ui.charts.CustomSetting.Type.STRING,
      "Bacteria",
      'Feature Name'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.FeatureTimeSparklinePlotType.CustomSettings.FEATURE_ID,
      epiviz.ui.charts.CustomSetting.Type.STRING,
      "0-0",
      'Feature ID'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.FeatureTimeSparklinePlotType.CustomSettings.LOG_TRANSFORM,
      epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
      true,
      'Log Transform count data'),
    
    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.FeatureTimeSparklinePlotType.CustomSettings.SHOW_POINTS,
      epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
      false,
      'Show points on box plot'),

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
      epiviz.plugins.charts.FeatureTimeSparklinePlotType.CustomSettings.SHOW_POINTS,
      epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
      false,
      'Show points'),
    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.FeatureTimeSparklinePlotType.CustomSettings.SHOW_LINES,
      epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
      true,
      'Show lines'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.FeatureTimeSparklinePlotType.CustomSettings.SHOW_ERROR_BARS,
      epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
      true,
      'Show error bars'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.FeatureTimeSparklinePlotType.CustomSettings.POINT_RADIUS,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      4,
      'Point radius'),
    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.FeatureTimeSparklinePlotType.CustomSettings.LINE_THICKNESS,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      3,
      'Line thickness'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.FeatureTimeSparklinePlotType.CustomSettings.INTERPOLATION,
      epiviz.ui.charts.CustomSetting.Type.CATEGORICAL,
      "basis",
      'Interpolation',
      ["linear", 'step-before', 'step-after', "basis", 'basis-open', 'basis-closed', 'bundle', 'cardinal', 'cardinal-open', 'monotone']),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.FeatureTimeSparklinePlotType.CustomSettings.ABS_LINE_VAL,
      epiviz.ui.charts.CustomSetting.Type.STRING,
      epiviz.ui.charts.CustomSetting.DEFAULT,
      'Draw abline')


  ]);
};

/**
 * @enum {string}
 */
epiviz.plugins.charts.FeatureTimeSparklinePlotType.CustomSettings = {
  CIRCLE_RADIUS_RATIO: 'circleRadiusRatio',
  FEATURE_NAME: 'featureName',
  FEATURE_ID: 'featureId',
  LOG_TRANSFORM: 'logTransform',
  SHOW_POINTS: 'showPoints',
  SHOW_ERROR_BARS: 'showErrorBars',
  SHOW_LINES: 'showLines',
  POINT_RADIUS: 'pointRadius',
  LINE_THICKNESS: 'lineThickness',
  INTERPOLATION: 'interpolation',
  ABS_LINE_VAL: 'abLine',
  CONTOUR_LOWER_LINE: 'contourLowerLine',
  SPARKLINE_PRESENTATION: 'sparklinePresentation',
  GROUP_SPARKLINES: 'groupSparklines'
};
