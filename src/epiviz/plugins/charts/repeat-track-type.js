/**
 * Created by Jayaram Kanchera ( jayaram.kancherla@gmail.com )
 * Date: 10/04/20
 */

goog.provide('epiviz.plugins.charts.RepeatTrackType');

goog.require('epiviz.plugins.charts.RepeatTrack');
goog.require('epiviz.ui.charts.TrackType');
goog.require('epiviz.measurements.Measurement.Type');
goog.require('epiviz.ui.charts.CustomSetting');


/**
 * @param {epiviz.Config} config
 * @extends {epiviz.ui.charts.TrackType}
 * @constructor
 */
epiviz.plugins.charts.RepeatTrackType = function(config) {
  // Call superclass constructor
  epiviz.ui.charts.TrackType.call(this, config);
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.RepeatTrackType.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.TrackType.prototype);
epiviz.plugins.charts.RepeatTrackType.constructor = epiviz.plugins.charts.RepeatTrackType;

/**
 * @param {string} id
 * @param {jQuery} container The div where the chart will be drawn
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @returns {epiviz.plugins.charts.RepeatTrack}
 */
epiviz.plugins.charts.RepeatTrackType.prototype.createNew = function(id, container, properties) {
  return new epiviz.plugins.charts.RepeatTrack(id, container, properties);
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.RepeatTrackType.prototype.typeName = function() {
  return 'epiviz.plugins.charts.RepeatTrack';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.RepeatTrackType.prototype.chartName = function() {
  return 'Repeat Track';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.RepeatTrackType.prototype.chartHtmlAttributeName = function() {
  return 'repeat';
};

/**
 * @returns {boolean}
 */
epiviz.plugins.charts.RepeatTrackType.prototype.isRestrictedToRangeMeasurements = function() { return true; };

/**
 * @returns {function(epiviz.measurements.Measurement): boolean}
 */
epiviz.plugins.charts.RepeatTrackType.prototype.measurementsFilter = function() { return function(m) { return m.type() == epiviz.measurements.Measurement.Type.RANGE; }; };