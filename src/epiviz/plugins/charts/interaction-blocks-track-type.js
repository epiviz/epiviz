/**
 * Created by Jayaram Kancherla ( jkanche [at] umd [dot] edu )
 * Date: 9/10/20
 * Time: 9:35 AM
 */

goog.provide('epiviz.plugins.charts.InteractionBlocksTrackType');

goog.require('epiviz.plugins.charts.InteractionBlocksTrack');
goog.require('epiviz.ui.charts.TrackType');
goog.require('epiviz.measurements.Measurement.Type');
goog.require('epiviz.ui.charts.CustomSetting');

/**
 * @param {epiviz.Config} config
 * @extends {epiviz.ui.charts.TrackType}
 * @constructor
 */
epiviz.plugins.charts.InteractionBlocksTrackType = function (config) {
  // Call superclass constructor
  epiviz.ui.charts.TrackType.call(this, config);
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.InteractionBlocksTrackType.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.TrackType.prototype);
epiviz.plugins.charts.InteractionBlocksTrackType.constructor = epiviz.plugins.charts.InteractionBlocksTrackType;

/**
 * @param {string} id
 * @param {jQuery} container The div where the chart will be drawn
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @returns {epiviz.plugins.charts.InteractionBlocksTrack}
 */
epiviz.plugins.charts.InteractionBlocksTrackType.prototype.createNew = function (id, container, properties) {
  return new epiviz.plugins.charts.InteractionBlocksTrack(id, container, properties);
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.InteractionBlocksTrackType.prototype.typeName = function () {
  return 'epiviz.plugins.charts.InteractionBlocksTrack';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.InteractionBlocksTrackType.prototype.chartName = function () {
  return 'Interaction Track';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.InteractionBlocksTrackType.prototype.chartHtmlAttributeName = function () {
  return 'Interaction';
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
epiviz.plugins.charts.InteractionBlocksTrackType.prototype.isRestrictedToRangeMeasurements = function () { return true; };

/**
 * @returns {function(epiviz.measurements.Measurement): boolean}
 */
epiviz.plugins.charts.InteractionBlocksTrackType.prototype.measurementsFilter = function () { return function (m) { return m.type() == epiviz.measurements.Measurement.Type.RANGE; }; };

/**
 * @returns {Array.<epiviz.ui.charts.CustomSetting>}
 */
epiviz.plugins.charts.InteractionBlocksTrackType.prototype.customSettingsDefs = function () {
  return epiviz.ui.charts.TrackType.prototype.customSettingsDefs.call(this).concat([
    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.InteractionBlocksTrackType.CustomSettings.MIN_BLOCK_DISTANCE,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      0,
      'Minimum block distance'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.InteractionBlocksTrackType.CustomSettings.USE_COLOR_BY,
      epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
      false,
      'Use Block Color by'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.InteractionBlocksTrackType.CustomSettings.BLOCK_COLOR_BY,
      epiviz.ui.charts.CustomSetting.Type.MEASUREMENTS_METADATA,
      'colLabel',
      'Block color by'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.InteractionBlocksTrackType.CustomSettings.USE_SCALE_BY,
      epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
      false,
      'Use Block scale by'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.InteractionBlocksTrackType.CustomSettings.BLOCK_SCALE_BY,
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
epiviz.plugins.charts.InteractionBlocksTrackType.CustomSettings = {
  MIN_BLOCK_DISTANCE: 'minBlockDistance',
  BLOCK_COLOR_BY: 'blockColorBy',
  USE_COLOR_BY: 'useColorBy',
  BLOCK_SCALE_BY: 'blockScaleBy',
  USE_SCALE_BY: 'useScaleBy',
};

// goog.inherits(epiviz.plugins.charts.BlocksTrackType, epiviz.ui.charts.TrackType);
