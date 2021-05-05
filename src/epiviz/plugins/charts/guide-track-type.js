/**
 * Created by Jayaram Kanchera ( jayaram.kancherla@gmail.com )
 * Date: 10/04/20
 */

goog.provide('epiviz.plugins.charts.GuideTrackType');

goog.require('epiviz.plugins.charts.GuideTrack');
goog.require('epiviz.ui.charts.TrackType');
goog.require('epiviz.measurements.Measurement.Type');
goog.require('epiviz.ui.charts.CustomSetting');


/**
 * @param {epiviz.Config} config
 * @extends {epiviz.ui.charts.TrackType}
 * @constructor
 */
epiviz.plugins.charts.GuideTrackType = function(config) {
  // Call superclass constructor
  epiviz.ui.charts.TrackType.call(this, config);
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.GuideTrackType.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.TrackType.prototype);
epiviz.plugins.charts.GuideTrackType.constructor = epiviz.plugins.charts.GuideTrackType;

/**
 * @param {string} id
 * @param {jQuery} container The div where the chart will be drawn
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @returns {epiviz.plugins.charts.GuideTrack}
 */
epiviz.plugins.charts.GuideTrackType.prototype.createNew = function(id, container, properties) {
  return new epiviz.plugins.charts.GuideTrack(id, container, properties);
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.GuideTrackType.prototype.typeName = function() {
  return 'epiviz.plugins.charts.GuideTrack';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.GuideTrackType.prototype.chartName = function() {
  return 'Guide Track';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.GuideTrackType.prototype.chartHtmlAttributeName = function() {
  return 'guide';
};

/**
 * @returns {epiviz.measurements.Measurement.Type}
 */
/*epiviz.plugins.charts.GuideTrackType.prototype.chartContentType = function() {
  return epiviz.measurements.Measurement.Type.RANGE;
};*/

/**
 * @returns {boolean}
 */
epiviz.plugins.charts.GuideTrackType.prototype.isRestrictedToRangeMeasurements = function() { return true; };

/**
 * @returns {function(epiviz.measurements.Measurement): boolean}
 */
epiviz.plugins.charts.GuideTrackType.prototype.measurementsFilter = function() { return function(m) { return m.type() == epiviz.measurements.Measurement.Type.RANGE; }; };

// goog.inherits(epiviz.plugins.charts.GuideTrackType, epiviz.ui.charts.TrackType);
epiviz.plugins.charts.GuideTrackType.prototype.customSettingsDefs = function () {
  return epiviz.ui.charts.TrackType.prototype.customSettingsDefs.call(this).concat([
  ]);
};

/**
 * @enum {string}
 */
epiviz.plugins.charts.GuideTrackType.CustomSettings = {
};