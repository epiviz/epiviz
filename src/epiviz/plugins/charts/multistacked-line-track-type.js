/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/14/13
 * Time: 9:30 AM
 */

goog.provide('epiviz.plugins.charts.MultiStackedLineTrackType');

goog.require('epiviz.plugins.charts.MultiStackedLineTrack');
goog.require('epiviz.ui.charts.TrackType');
goog.require('epiviz.measurements.Measurement.Type');
goog.require('epiviz.ui.charts.CustomSetting');
goog.require('epiviz.ui.charts.Visualization');

/**
 * @param {epiviz.Config} config
 * @extends {epiviz.ui.charts.TrackType}
 * @constructor
 */
epiviz.plugins.charts.MultiStackedLineTrackType = function (config) {
  // Call superclass constructor
  epiviz.ui.charts.TrackType.call(this, config);
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.MultiStackedLineTrackType.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.TrackType.prototype);
epiviz.plugins.charts.MultiStackedLineTrackType.constructor = epiviz.plugins.charts.MultiStackedLineTrackType;

/**
 * @param {string} id
 * @param {jQuery} container The div where the chart will be drawn
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @returns {epiviz.plugins.charts.MultiStackedLineTrack}
 */
epiviz.plugins.charts.MultiStackedLineTrackType.prototype.createNew = function (id, container, properties) {
  return new epiviz.plugins.charts.MultiStackedLineTrack(id, container, properties);
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.MultiStackedLineTrackType.prototype.typeName = function () {
  return 'epiviz.plugins.charts.MultiStackedLineTrackType';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.MultiStackedLineTrackType.prototype.chartName = function () {
  return 'Multi Stacked Line Track';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.MultiStackedLineTrackType.prototype.chartHtmlAttributeName = function () {
  return 'MULTI-stacked-lines';
};

epiviz.plugins.charts.MultiStackedLineTrackType.prototype.isRestrictedToSameDatasourceGroup = function () {
  return false;
};

/**
 * @returns {function(epiviz.measurements.Measurement): boolean}
 */
epiviz.plugins.charts.MultiStackedLineTrackType.prototype.measurementsFilter = function () { return function (m) { return m.type() == epiviz.measurements.Measurement.Type.FEATURE; }; };

/**
 * @returns {Array.<epiviz.ui.charts.CustomSetting>}
 */
epiviz.plugins.charts.MultiStackedLineTrackType.prototype.customSettingsDefs = function () {
  return epiviz.ui.charts.TrackType.prototype.customSettingsDefs.call(this).concat([
    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.MultiStackedLineTrackType.CustomSettings.STEP,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      50,
      'Step'),
      
    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.MultiStackedLineTrackType.CustomSettings.SHOW_POINTS,
      epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
      false,
      'Show points'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.MultiStackedLineTrackType.CustomSettings.SHOW_LINES,
      epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
      true,
      'Show lines'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.MultiStackedLineTrackType.CustomSettings.SHOW_FILL,
      epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
      true,
      'fill'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.MultiStackedLineTrackType.CustomSettings.SHOW_ERROR_BARS,
      epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
      true,
      'Show error bars'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.MultiStackedLineTrackType.CustomSettings.POINT_RADIUS,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      1,
      'Point radius'),
    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.MultiStackedLineTrackType.CustomSettings.LINE_THICKNESS,
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
      epiviz.plugins.charts.MultiStackedLineTrackType.CustomSettings.INTERPOLATION,
      epiviz.ui.charts.CustomSetting.Type.CATEGORICAL,
      'linear',
      'Interpolation',
      ['linear', 'step-before', 'step-after', 'basis', 'basis-open', 'basis-closed', 'bundle', 'cardinal', 'cardinal-open', 'monotone']),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.MultiStackedLineTrackType.CustomSettings.ABS_LINE_VAL,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      epiviz.ui.charts.CustomSetting.DEFAULT,
      'Draw abline'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.MultiStackedLineTrackType.CustomSettings.SHOW_TRACKS,
      epiviz.ui.charts.CustomSetting.Type.STRING,
      epiviz.ui.charts.CustomSetting.DEFAULT,
      'Hide/Show Tracks'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.MultiStackedLineTrackType.CustomSettings.SHOW_Y_AXIS,
      epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
      true,
      'Show y-axis')

  ]);
};

/**
 * @enum {string}
 */
epiviz.plugins.charts.MultiStackedLineTrackType.CustomSettings = {
  STEP: 'step',
  SHOW_POINTS: 'showPoints',
  SHOW_ERROR_BARS: 'showErrorBars',
  SHOW_LINES: 'showLines',
  POINT_RADIUS: 'pointRadius',
  LINE_THICKNESS: 'lineThickness',
  INTERPOLATION: 'interpolation',
  ABS_LINE_VAL: 'abLine',
  SHOW_FILL: "showFill",
  SHOW_TRACKS: "showTracks",
  SHOW_Y_AXIS: "showYAxis"
};

// goog.inherits(epiviz.plugins.charts.MultiStackedLineTrackType, epiviz.ui.charts.TrackType);
