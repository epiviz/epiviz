/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 1/2/2015
 * Time: 4:43 PM
 */

goog.provide('epiviz.plugins.charts.StackedLinePlotType');

goog.require('epiviz.plugins.charts.StackedLinePlot');
goog.require('epiviz.ui.charts.PlotType');
goog.require('epiviz.measurements.Measurement.Type');
goog.require('epiviz.ui.charts.CustomSetting');
goog.require('epiviz.ui.charts.Visualization');

/**
 * @param {epiviz.Config} config
 * @extends {epiviz.ui.charts.PlotType}
 * @constructor
 */
epiviz.plugins.charts.StackedLinePlotType = function(config) {
  // Call superclass constructor
  epiviz.ui.charts.PlotType.call(this, config);
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.StackedLinePlotType.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.PlotType.prototype);
epiviz.plugins.charts.StackedLinePlotType.constructor = epiviz.plugins.charts.StackedLinePlotType;

/**
 * @param {string} id
 * @param {jQuery} container The div where the chart will be drawn
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @returns {epiviz.plugins.charts.StackedLinePlot}
 */
epiviz.plugins.charts.StackedLinePlotType.prototype.createNew = function(id, container, properties) {
  return new epiviz.plugins.charts.StackedLinePlot(id, container, properties);
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.StackedLinePlotType.prototype.typeName = function() {
  return 'epiviz.plugins.charts.StackedLinePlot';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.StackedLinePlotType.prototype.chartName = function() {
  return 'Stacked Plot';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.StackedLinePlotType.prototype.chartHtmlAttributeName = function() {
  return 'stacked-line-plot';
};

/**
 * @returns {function(epiviz.measurements.Measurement): boolean}
 */
epiviz.plugins.charts.StackedLinePlotType.prototype.measurementsFilter = function() { return function(m) { return m.type() == epiviz.measurements.Measurement.Type.FEATURE; }; };

/**
 * If true, this flag indicates that the corresponding chart can only show measurements that belong to the same
 * data source group
 * @returns {boolean}
 */
epiviz.plugins.charts.StackedLinePlotType.prototype.isRestrictedToSameDatasourceGroup = function() { return true; };

/**
 * @returns {Array.<epiviz.ui.charts.CustomSetting>}
 */
epiviz.plugins.charts.StackedLinePlotType.prototype.customSettingsDefs = function() {
  return epiviz.ui.charts.PlotType.prototype.customSettingsDefs.call(this).concat([
    new epiviz.ui.charts.CustomSetting(
      epiviz.ui.charts.Visualization.CustomSettings.COL_LABEL,
      epiviz.ui.charts.CustomSetting.Type.MEASUREMENTS_METADATA,
      'colLabel',
      'Color by'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.ui.charts.Visualization.CustomSettings.ROW_LABEL,
      epiviz.ui.charts.CustomSetting.Type.MEASUREMENTS_ANNOTATION,
      'name',
      'Labels'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.StackedLinePlotType.CustomSettings.OFFSET,
      epiviz.ui.charts.CustomSetting.Type.CATEGORICAL,
      'zero',
      'Offset',
      ['zero', 'wiggle']),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.StackedLinePlotType.CustomSettings.INTERPOLATION,
      epiviz.ui.charts.CustomSetting.Type.CATEGORICAL,
      'step-after',
      'Interpolation',
      ['linear', 'step-before', 'step-after', 'basis', 'basis-open', 'basis-closed', 'bundle', 'cardinal', 'cardinal-open', 'monotone']),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.StackedLinePlotType.CustomSettings.SCALE_TO_PERCENT,
      epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
      true,
      'Scale to Percent'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.StackedLinePlotType.CustomSettings.USE_GROUP_BY,
      epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
      false,
      'Use Group by'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.StackedLinePlotType.CustomSettings.ROW_GROUP_BY,
      epiviz.ui.charts.CustomSetting.Type.MEASUREMENTS_ANNOTATION,
      'name',
      'Group By'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.StackedLinePlotType.CustomSettings.ORDER_BY,
      epiviz.ui.charts.CustomSetting.Type.MEASUREMENTS_ANNOTATION,
      'name',
      'Order By'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.StackedLinePlotType.CustomSettings.HOVER_OPACITY,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      0.6,
      'Hover Opacity')
  ]);
};

/**
 * @enum {string}
 */
epiviz.plugins.charts.StackedLinePlotType.CustomSettings = {
  INTERPOLATION: 'interpolation',
  OFFSET: 'offset',
  SCALE_TO_PERCENT: 'scaleToPercent',
  ROW_GROUP_BY: 'groupBy',
  USE_GROUP_BY: 'useGroupBy',
  HOVER_OPACITY: 'hoverOpacity',
  ORDER_BY: 'orderBy'
};

// goog.inherits(epiviz.plugins.charts.StackedLinePlotType, epiviz.ui.charts.PlotType);
