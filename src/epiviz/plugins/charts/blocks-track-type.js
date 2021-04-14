/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/16/13
 * Time: 9:36 AM
 */

goog.provide('epiviz.plugins.charts.BlocksTrackType');

goog.require('epiviz.plugins.charts.BlocksTrack');
goog.require('epiviz.ui.charts.TrackType');
goog.require('epiviz.measurements.Measurement.Type');
goog.require('epiviz.ui.charts.CustomSetting');

/**
 * @param {epiviz.Config} config
 * @extends {epiviz.ui.charts.TrackType}
 * @constructor
 */
epiviz.plugins.charts.BlocksTrackType = function (config) {
  // Call superclass constructor
  epiviz.ui.charts.TrackType.call(this, config);
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.BlocksTrackType.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.TrackType.prototype);
epiviz.plugins.charts.BlocksTrackType.constructor = epiviz.plugins.charts.BlocksTrackType;

/**
 * @param {string} id
 * @param {jQuery} container The div where the chart will be drawn
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @returns {epiviz.plugins.charts.BlocksTrack}
 */
epiviz.plugins.charts.BlocksTrackType.prototype.createNew = function (id, container, properties) {
  return new epiviz.plugins.charts.BlocksTrack(id, container, properties);
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.BlocksTrackType.prototype.typeName = function () {
  return 'epiviz.plugins.charts.BlocksTrack';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.BlocksTrackType.prototype.chartName = function () {
  return 'Blocks Track';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.BlocksTrackType.prototype.chartHtmlAttributeName = function () {
  return 'blocks';
};

/**
 * @returns {epiviz.measurements.Measurement.Type}
 */
/*epiviz.plugins.charts.BlocksTrackType.prototype.chartContentType = function() {
  return epiviz.measurements.Measurement.Type.RANGE;
};*/

/**
 * @returns {boolean}
 */
epiviz.plugins.charts.BlocksTrackType.prototype.isRestrictedToRangeMeasurements = function () { return true; };

/**
 * @returns {function(epiviz.measurements.Measurement): boolean}
 */
epiviz.plugins.charts.BlocksTrackType.prototype.measurementsFilter = function () { return function (m) { return m.type() == epiviz.measurements.Measurement.Type.RANGE; }; };

/**
 * @returns {Array.<epiviz.ui.charts.CustomSetting>}
 */
epiviz.plugins.charts.BlocksTrackType.prototype.customSettingsDefs = function () {
  return epiviz.ui.charts.TrackType.prototype.customSettingsDefs.call(this).concat([
    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.BlocksTrackType.CustomSettings.MIN_BLOCK_DISTANCE,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      5,
      'Minimum block distance'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.BlocksTrackType.CustomSettings.USE_COLOR_BY,
      epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
      false,
      'Use Block Color by'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.BlocksTrackType.CustomSettings.BLOCK_COLOR_BY,
      epiviz.ui.charts.CustomSetting.Type.MEASUREMENTS_METADATA,
      'colLabel',
      'Block color by'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.BlocksTrackType.CustomSettings.IS_COLOR,
      epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
      false,
      'Color by field contain color (itemRGB in bigbeds) ?'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.BlocksTrackType.CustomSettings.USE_SCALE_BY,
      epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
      false,
      'Use Block scale by'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.BlocksTrackType.CustomSettings.BLOCK_SCALE_BY,
      epiviz.ui.charts.CustomSetting.Type.MEASUREMENTS_METADATA,
      'colLabel',
      'Block scale by'),

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
epiviz.plugins.charts.BlocksTrackType.CustomSettings = {
  MIN_BLOCK_DISTANCE: 'minBlockDistance',
  BLOCK_COLOR_BY: 'blockColorBy',
  USE_COLOR_BY: 'useColorBy',
  BLOCK_SCALE_BY: 'blockScaleBy',
  USE_SCALE_BY: 'useScaleBy',
  IS_COLOR: "isColor"
};

// goog.inherits(epiviz.plugins.charts.BlocksTrackType, epiviz.ui.charts.TrackType);
