/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/14/13
 * Time: 9:30 AM
 */

goog.provide('epiviz.plugins.charts.LineTrackType');

goog.require('epiviz.ui.charts.Chart');

/**
 * @param {epiviz.Config} config
 * @extends {epiviz.ui.charts.TrackType}
 * @constructor
 */
epiviz.plugins.charts.LineTrackType = function(config) {
  // Call superclass constructor
  epiviz.ui.charts.TrackType.call(this, config);
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.LineTrackType.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.TrackType.prototype);
epiviz.plugins.charts.LineTrackType.constructor = epiviz.plugins.charts.LineTrackType;

/**
 * @param {string} id
 * @param {jQuery} container The div where the chart will be drawn
 * @param {epiviz.ui.charts.ChartProperties} properties
 * @returns {epiviz.plugins.charts.LineTrack}
 */
epiviz.plugins.charts.LineTrackType.prototype.createNew = function(id, container, properties) {
  return new epiviz.plugins.charts.LineTrack(id, container, properties);
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.LineTrackType.prototype.typeName = function() {
  return 'epiviz.plugins.charts.LineTrack';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.LineTrackType.prototype.chartName = function() {
  return 'Line Track';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.LineTrackType.prototype.chartHtmlAttributeName = function() {
  return 'lines';
};

/**
 * @returns {epiviz.measurements.Measurement.Type}
 */
epiviz.plugins.charts.LineTrackType.prototype.chartContentType = function() {
  return epiviz.measurements.Measurement.Type.FEATURE;
};

/**
 * @returns {Array.<epiviz.ui.charts.CustomSetting>}
 */
epiviz.plugins.charts.LineTrackType.prototype.customSettingsDefs = function() {
  return epiviz.ui.charts.TrackType.prototype.customSettingsDefs.call(this).concat([
    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.LineTrackType.CustomSettings.MAX_POINTS,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      100,
      'Maximum points'),
    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.LineTrackType.CustomSettings.SHOW_POINTS,
      epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
      false,
      'Show points'),
    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.LineTrackType.CustomSettings.SHOW_LINES,
      epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
      true,
      'Show lines'),
    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.LineTrackType.CustomSettings.POINT_RADIUS,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      1,
      'Point radius'),
    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.LineTrackType.CustomSettings.LINE_THICKNESS,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      1,
      'Line thickness'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.ui.charts.ChartType.CustomSettings.Y_MIN,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      epiviz.ui.charts.CustomSetting.DEFAULT,
      'Min Y'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.ui.charts.ChartType.CustomSettings.Y_MAX,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      epiviz.ui.charts.CustomSetting.DEFAULT,
      'Max Y'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.LineTrackType.CustomSettings.INTERPOLATION,
      epiviz.ui.charts.CustomSetting.Type.CATEGORICAL,
      'linear',
      'Interpolation',
      ['linear', 'step-before', 'step-after', 'basis', 'basis-open', 'basis-closed', 'bundle', 'cardinal', 'cardinal-open', 'monotone'])
  ]);
};

/**
 * @enum {string}
 */
epiviz.plugins.charts.LineTrackType.CustomSettings = {
  MAX_POINTS: 'maxPoints',
  SHOW_POINTS: 'showPoints',
  SHOW_LINES: 'showLines',
  POINT_RADIUS: 'pointRadius',
  LINE_THICKNESS: 'lineThickness',
  INTERPOLATION: 'interpolation'
};
