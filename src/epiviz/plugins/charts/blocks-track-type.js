/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/16/13
 * Time: 9:36 AM
 */

goog.provide('epiviz.plugins.charts.BlocksTrackType');

goog.require('epiviz.ui.charts.Chart');

/**
 * @param {epiviz.Config} config
 * @extends {epiviz.ui.charts.TrackType}
 * @constructor
 */
epiviz.plugins.charts.BlocksTrackType = function(config) {
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
 * @param {epiviz.ui.charts.ChartProperties} properties
 * @returns {epiviz.plugins.charts.BlocksTrack}
 */
epiviz.plugins.charts.BlocksTrackType.prototype.createNew = function(id, container, properties) {
  return new epiviz.plugins.charts.BlocksTrack(id, container, properties);
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.BlocksTrackType.prototype.typeName = function() {
  return 'epiviz.plugins.charts.BlocksTrack';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.BlocksTrackType.prototype.chartName = function() {
  return 'Blocks Track';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.BlocksTrackType.prototype.chartHtmlAttributeName = function() {
  return 'blocks';
};

/**
 * @returns {epiviz.measurements.Measurement.Type}
 */
epiviz.plugins.charts.BlocksTrackType.prototype.chartContentType = function() {
  return epiviz.measurements.Measurement.Type.RANGE;
};

/**
 * @returns {Array.<epiviz.ui.charts.CustomSetting>}
 */
epiviz.plugins.charts.BlocksTrackType.prototype.customSettingsDefs = function() {
  return epiviz.ui.charts.TrackType.prototype.customSettingsDefs.call(this).concat([
    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.BlocksTrackType.CustomSettings.MIN_BLOCK_DISTANCE,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      5,
      'Minimum block distance')
  ]);
};

/**
 * @enum {string}
 */
epiviz.plugins.charts.BlocksTrackType.CustomSettings = {
  MIN_BLOCK_DISTANCE: 'minBlockDistance'
};

