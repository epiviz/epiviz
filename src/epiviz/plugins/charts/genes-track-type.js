/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/18/13
 * Time: 7:34 PM
 */

goog.provide('epiviz.plugins.charts.GenesTrackType');

goog.require('epiviz.ui.charts.Chart');

/**
 * @param {epiviz.Config} config
 * @extends {epiviz.ui.charts.TrackType}
 * @constructor
 */
epiviz.plugins.charts.GenesTrackType = function(config) {
  // Call superclass constructor
  epiviz.ui.charts.TrackType.call(this, config);
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.GenesTrackType.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.TrackType.prototype);
epiviz.plugins.charts.GenesTrackType.constructor = epiviz.plugins.charts.GenesTrackType;

/**
 * @param {string} id
 * @param {jQuery} container The div where the chart will be drawn
 * @param {epiviz.ui.charts.ChartProperties} properties
 * @returns {epiviz.plugins.charts.GenesTrack}
 */
epiviz.plugins.charts.GenesTrackType.prototype.createNew = function(id, container, properties) {
  return new epiviz.plugins.charts.GenesTrack(id, container, properties);
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.GenesTrackType.prototype.typeName = function() {
  return 'epiviz.plugins.charts.GenesTrack';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.GenesTrackType.prototype.chartName = function() {
  return 'Genes Track';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.GenesTrackType.prototype.chartHtmlAttributeName = function() {
  return 'genes';
};

/**
 * @returns {epiviz.measurements.Measurement.Type}
 */
epiviz.plugins.charts.GenesTrackType.prototype.chartContentType = function() {
  return epiviz.measurements.Measurement.Type.RANGE;
};
