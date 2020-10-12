/**
 * Created by Jayaram Kanchera ( jayaram.kancherla@gmail.com )
 * Date: 10/04/20
 */

goog.provide('epiviz.plugins.charts.TranscriptTrackType');

goog.require('epiviz.plugins.charts.TranscriptTrack');
goog.require('epiviz.ui.charts.TrackType');
goog.require('epiviz.measurements.Measurement.Type');
goog.require('epiviz.ui.charts.CustomSetting');


/**
 * @param {epiviz.Config} config
 * @extends {epiviz.ui.charts.TrackType}
 * @constructor
 */
epiviz.plugins.charts.TranscriptTrackType = function(config) {
  // Call superclass constructor
  epiviz.ui.charts.TrackType.call(this, config);
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.TranscriptTrackType.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.TrackType.prototype);
epiviz.plugins.charts.TranscriptTrackType.constructor = epiviz.plugins.charts.TranscriptTrackType;

/**
 * @param {string} id
 * @param {jQuery} container The div where the chart will be drawn
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @returns {epiviz.plugins.charts.TranscriptTrack}
 */
epiviz.plugins.charts.TranscriptTrackType.prototype.createNew = function(id, container, properties) {
  return new epiviz.plugins.charts.TranscriptTrack(id, container, properties);
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.TranscriptTrackType.prototype.typeName = function() {
  return 'epiviz.plugins.charts.TranscriptTrack';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.TranscriptTrackType.prototype.chartName = function() {
  return 'Transcript Track';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.TranscriptTrackType.prototype.chartHtmlAttributeName = function() {
  return 'transcript';
};

/**
 * @returns {epiviz.measurements.Measurement.Type}
 */
/*epiviz.plugins.charts.TranscriptTrackType.prototype.chartContentType = function() {
  return epiviz.measurements.Measurement.Type.RANGE;
};*/

/**
 * @returns {boolean}
 */
epiviz.plugins.charts.TranscriptTrackType.prototype.isRestrictedToRangeMeasurements = function() { return true; };

/**
 * @returns {function(epiviz.measurements.Measurement): boolean}
 */
epiviz.plugins.charts.TranscriptTrackType.prototype.measurementsFilter = function() { return function(m) { return m.type() == epiviz.measurements.Measurement.Type.RANGE; }; };

// goog.inherits(epiviz.plugins.charts.TranscriptTrackType, epiviz.ui.charts.TrackType);
epiviz.plugins.charts.TranscriptTrackType.prototype.customSettingsDefs = function () {
  return epiviz.ui.charts.TrackType.prototype.customSettingsDefs.call(this).concat([
    
    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.TranscriptTrackType.CustomSettings.SHOW_TRANSCRIPTS,
      epiviz.ui.charts.CustomSetting.Type.STRING,
      epiviz.ui.charts.CustomSetting.DEFAULT,
      'Hide Transcripts')

  ]);
};

/**
 * @enum {string}
 */
epiviz.plugins.charts.TranscriptTrackType.CustomSettings = {
  SHOW_TRANSCRIPTS: "showTranscripts"
};