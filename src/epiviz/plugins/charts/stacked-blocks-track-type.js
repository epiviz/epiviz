/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/16/13
 * Time: 9:36 AM
 */

goog.provide('epiviz.plugins.charts.StackedBlocksTrackType');

goog.require('epiviz.plugins.charts.StackedBlocksTrack');
goog.require('epiviz.ui.charts.TrackType');
goog.require('epiviz.measurements.Measurement.Type');
goog.require('epiviz.ui.charts.CustomSetting');


/**
 * @param {epiviz.Config} config
 * @extends {epiviz.ui.charts.TrackType}
 * @constructor
 */
epiviz.plugins.charts.StackedBlocksTrackType = function(config) {
  // Call superclass constructor
  epiviz.ui.charts.TrackType.call(this, config);
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.StackedBlocksTrackType.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.TrackType.prototype);
epiviz.plugins.charts.StackedBlocksTrackType.constructor = epiviz.plugins.charts.StackedBlocksTrackType;

/**
 * @param {string} id
 * @param {jQuery} container The div where the chart will be drawn
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @returns {epiviz.plugins.charts.StackedBlocksTrack}
 */
epiviz.plugins.charts.StackedBlocksTrackType.prototype.createNew = function(id, container, properties) {
  return new epiviz.plugins.charts.StackedBlocksTrack(id, container, properties);
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.StackedBlocksTrackType.prototype.typeName = function() {
  return 'epiviz.plugins.charts.StackedBlocksTrack';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.StackedBlocksTrackType.prototype.chartName = function() {
  return 'Stacked Blocks Track';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.StackedBlocksTrackType.prototype.chartHtmlAttributeName = function() {
  return 'stacked-blocks';
};

/**
 * @returns {epiviz.measurements.Measurement.Type}
 */
/*epiviz.plugins.charts.StackedBlocksTrackType.prototype.chartContentType = function() {
  return epiviz.measurements.Measurement.Type.RANGE;
};*/

/**
 * @returns {boolean}
 */
epiviz.plugins.charts.StackedBlocksTrackType.prototype.isRestrictedToRangeMeasurements = function() { return true; };

/**
 * @returns {function(epiviz.measurements.Measurement): boolean}
 */
epiviz.plugins.charts.StackedBlocksTrackType.prototype.measurementsFilter = function() { return function(m) { return m.type() == epiviz.measurements.Measurement.Type.RANGE; }; };

/**
 * @returns {Array.<epiviz.ui.charts.CustomSetting>}
 */
epiviz.plugins.charts.StackedBlocksTrackType.prototype.customSettingsDefs = function() {
  return epiviz.ui.charts.TrackType.prototype.customSettingsDefs.call(this).concat([
    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.StackedBlocksTrackType.CustomSettings.MIN_BLOCK_DISTANCE,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      5,
      'Minimum block distance'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.StackedBlocksTrackType.CustomSettings.USE_COLOR_BY,
      epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
      false,
      'Use Block Color by'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.StackedBlocksTrackType.CustomSettings.BLOCK_COLOR_BY,
      epiviz.ui.charts.CustomSetting.Type.MEASUREMENTS_METADATA,
      'colLabel',
      'Block color by')
  ]);
};

/**
 * @enum {string}
 */
epiviz.plugins.charts.StackedBlocksTrackType.CustomSettings = {
  MIN_BLOCK_DISTANCE: 'minBlockDistance',
  BLOCK_COLOR_BY: 'blockColorBy',
  USE_COLOR_BY: 'useColorBy'
};
