/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/14/13
 * Time: 9:30 AM
 */

goog.provide('epiviz.plugins.charts.GwasTrackType');

goog.require('epiviz.plugins.charts.GwasTrack');
goog.require('epiviz.plugins.charts.LineTrackType');
goog.require('epiviz.measurements.Measurement.Type');
goog.require('epiviz.ui.charts.CustomSetting');
goog.require('epiviz.ui.charts.Visualization');

/**
 * @param {epiviz.Config} config
 * @extends {epiviz.ui.charts.TrackType}
 * @constructor
 */
epiviz.plugins.charts.GwasTrackType = function(config) {
  // Call superclass constructor
  epiviz.plugins.charts.LineTrackType.call(this, config);
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.GwasTrackType.prototype = epiviz.utils.mapCopy(epiviz.plugins.charts.LineTrackType.prototype);
epiviz.plugins.charts.GwasTrackType.constructor = epiviz.plugins.charts.GwasTrackType;

/**
 * @param {string} id
 * @param {jQuery} container The div where the chart will be drawn
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @returns {epiviz.plugins.charts.LineTrack}
 */
epiviz.plugins.charts.GwasTrackType.prototype.createNew = function(id, container, properties) {
  return new epiviz.plugins.charts.GwasTrack(id, container, properties);
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.GwasTrackType.prototype.typeName = function() {
  return 'epiviz.plugins.charts.GwasTrack';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.GwasTrackType.prototype.chartName = function() {
  return 'GWAS Track';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.GwasTrackType.prototype.chartHtmlAttributeName = function() {
  return 'gwas';
};

/**
 * @returns {function(epiviz.measurements.Measurement): boolean}
 */
epiviz.plugins.charts.GwasTrackType.prototype.measurementsFilter = function() { return function(m) { return m; }; };

/**
 * @returns {Array.<epiviz.ui.charts.CustomSetting>}
 */
epiviz.plugins.charts.GwasTrackType.prototype.customSettingsDefs = function() {
  return epiviz.ui.charts.TrackType.prototype.customSettingsDefs.call(this).concat([
    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.GwasTrackType.CustomSettings.STEP,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      1,
      'Step'),
    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.GwasTrackType.CustomSettings.SHOW_POINTS,
      epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
      true,
      'Show points'),
    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.GwasTrackType.CustomSettings.SHOW_LINES,
      epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
      false,
      'Show lines'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.GwasTrackType.CustomSettings.SHOW_ERROR_BARS,
      epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
      false,
      'Show error bars'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.GwasTrackType.CustomSettings.POINT_RADIUS,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      2,
      'Point radius'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.GwasTrackType.CustomSettings.LINE_THICKNESS,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      1,
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
      epiviz.plugins.charts.GwasTrackType.CustomSettings.INTERPOLATION,
      epiviz.ui.charts.CustomSetting.Type.CATEGORICAL,
      'linear',
      'Interpolation',
      ['linear', 'step-before', 'step-after', 'basis', 'basis-open', 'basis-closed', 'bundle', 'cardinal', 'cardinal-open', 'monotone']),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.GwasTrackType.CustomSettings.ABS_LINE_VAL,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      500,
      'Threshold'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.GwasTrackType.CustomSettings.Y_AXIS_SEL,
      epiviz.ui.charts.CustomSetting.Type.MEASUREMENTS_METADATA,
      'name;',
      'Y-axis column')
  ]);
};

/**
 * @enum {string}
 */
epiviz.plugins.charts.GwasTrackType.CustomSettings = {
  STEP: 'step',
  SHOW_POINTS: 'showPoints',
  SHOW_ERROR_BARS: 'showErrorBars',
  SHOW_LINES: 'showLines',
  POINT_RADIUS: 'pointRadius',
  LINE_THICKNESS: 'lineThickness',
  INTERPOLATION: 'interpolation',
  ABS_LINE_VAL: 'abLine',
  Y_AXIS_SEL: 'yAxisField'
};

// goog.inherits(epiviz.plugins.charts.GwasTrackType, epiviz.ui.charts.TrackType);
