/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/14/13
 * Time: 9:30 AM
 */

goog.provide('epiviz.plugins.charts.LineTrackTypeCustom');

goog.require('epiviz.plugins.charts.LineTrackCustom');
goog.require('epiviz.ui.charts.TrackType');
goog.require('epiviz.measurements.Measurement.Type');
goog.require('epiviz.ui.charts.CustomSetting');
goog.require('epiviz.ui.charts.Visualization');

/**
 * @param {epiviz.Config} config
 * @extends {epiviz.ui.charts.TrackType}
 * @constructor
 */
epiviz.plugins.charts.LineTrackTypeCustom = function(config) {
  // Call superclass constructor
  epiviz.ui.charts.TrackType.call(this, config);
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.LineTrackTypeCustom.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.TrackType.prototype);
epiviz.plugins.charts.LineTrackTypeCustom.constructor = epiviz.plugins.charts.LineTrackTypeCustom;

/**
 * @param {string} id
 * @param {jQuery} container The div where the chart will be drawn
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @returns {epiviz.plugins.charts.LineTrackCustom}
 */
epiviz.plugins.charts.LineTrackTypeCustom.prototype.createNew = function(id, container, properties) {
  return new epiviz.plugins.charts.LineTrackCustom(id, container, properties);
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.LineTrackTypeCustom.prototype.typeName = function() {
  return 'epiviz.plugins.charts.LineTrackCustom';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.LineTrackTypeCustom.prototype.chartName = function() {
  return 'Line Track Custom';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.LineTrackTypeCustom.prototype.chartHtmlAttributeName = function() {
  return 'lines-custom';
};

/**
 * @returns {function(epiviz.measurements.Measurement): boolean}
 */
epiviz.plugins.charts.LineTrackTypeCustom.prototype.measurementsFilter = function() { return function(m) { return m.type() == epiviz.measurements.Measurement.Type.FEATURE; }; };

/**
 * @returns {Array.<epiviz.ui.charts.CustomSetting>}
 */
epiviz.plugins.charts.LineTrackTypeCustom.prototype.customSettingsDefs = function() {
  return epiviz.ui.charts.TrackType.prototype.customSettingsDefs.call(this).concat([
    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.LineTrackTypeCustom.CustomSettings.STEP,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      50,
      'Step'),
    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.LineTrackTypeCustom.CustomSettings.SHOW_POINTS,
      epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
      false,
      'Show points'),
    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.LineTrackTypeCustom.CustomSettings.SHOW_LINES,
      epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
      true,
      'Show lines'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.LineTrackTypeCustom.CustomSettings.SHOW_ERROR_BARS,
      epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
      true,
      'Show error bars'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.LineTrackTypeCustom.CustomSettings.POINT_RADIUS,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      1,
      'Point radius'),
    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.LineTrackTypeCustom.CustomSettings.LINE_THICKNESS,
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
      epiviz.plugins.charts.LineTrackTypeCustom.CustomSettings.INTERPOLATION,
      epiviz.ui.charts.CustomSetting.Type.CATEGORICAL,
      'linear',
      'Interpolation',
      ['linear', 'step-before', 'step-after', 'basis', 'basis-open', 'basis-closed', 'bundle', 'cardinal', 'cardinal-open', 'monotone'])
  ]);
};

/**
 * @enum {string}
 */
epiviz.plugins.charts.LineTrackTypeCustom.CustomSettings = {
  STEP: 'step',
  SHOW_POINTS: 'showPoints',
  SHOW_ERROR_BARS: 'showErrorBars',
  SHOW_LINES: 'showLines',
  POINT_RADIUS: 'pointRadius',
  LINE_THICKNESS: 'lineThickness',
  INTERPOLATION: 'interpolation'
};

// goog.inherits(epiviz.plugins.charts.LineTrackTypeCustom, epiviz.ui.charts.TrackType);
