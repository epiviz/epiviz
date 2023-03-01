/**
 * Created by Jayaram Kanchera ( jayaram.kancherla@gmail.com )
 * Date: 10/04/20
 */

goog.provide('epiviz.plugins.charts.GuideBBTrackType');

goog.require('epiviz.plugins.charts.GuideTrack');
goog.require('epiviz.ui.charts.TrackType');
goog.require('epiviz.measurements.Measurement.Type');
goog.require('epiviz.ui.charts.CustomSetting');


/**
 * @param {epiviz.Config} config
 * @extends {epiviz.ui.charts.TrackType}
 * @constructor
 */
epiviz.plugins.charts.GuideBBTrackType = function(config) {
  // Call superclass constructor
  epiviz.ui.charts.TrackType.call(this, config);
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.GuideBBTrackType.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.TrackType.prototype);
epiviz.plugins.charts.GuideBBTrackType.constructor = epiviz.plugins.charts.GuideBBTrackType;

/**
 * @param {string} id
 * @param {jQuery} container The div where the chart will be drawn
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @returns {epiviz.plugins.charts.GuideTrack}
 */
epiviz.plugins.charts.GuideBBTrackType.prototype.createNew = function(id, container, properties) {
  return new epiviz.plugins.charts.GuideBBTrack(id, container, properties);
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.GuideBBTrackType.prototype.typeName = function() {
  return 'epiviz.plugins.charts.GuideTrack';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.GuideBBTrackType.prototype.chartName = function() {
  return 'Guide Track';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.GuideBBTrackType.prototype.chartHtmlAttributeName = function() {
  return 'guide';
};

/**
 * @returns {epiviz.measurements.Measurement.Type}
 */
/*epiviz.plugins.charts.GuideBBTrackType.prototype.chartContentType = function() {
  return epiviz.measurements.Measurement.Type.RANGE;
};*/

/**
 * @returns {boolean}
 */
epiviz.plugins.charts.GuideBBTrackType.prototype.isRestrictedToRangeMeasurements = function() { return true; };

/**
 * @returns {function(epiviz.measurements.Measurement): boolean}
 */
epiviz.plugins.charts.GuideBBTrackType.prototype.measurementsFilter = function() { return function(m) { return m.type() == epiviz.measurements.Measurement.Type.RANGE; }; };

// goog.inherits(epiviz.plugins.charts.GuideBBTrackType, epiviz.ui.charts.TrackType);
epiviz.plugins.charts.GuideBBTrackType.prototype.customSettingsDefs = function () {
  return epiviz.ui.charts.TrackType.prototype.customSettingsDefs.call(this).concat([
  ]);
};

/**
 * @enum {string}
 */
epiviz.plugins.charts.GuideBBTrackType.CustomSettings = {
};