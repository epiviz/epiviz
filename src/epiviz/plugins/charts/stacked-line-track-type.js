/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 12/8/2014
 * Time: 1:32 PM
 */


goog.provide('epiviz.plugins.charts.StackedLineTrackType');

goog.require('epiviz.ui.charts.Chart');

/**
 * @param {epiviz.Config} config
 * @extends {epiviz.ui.charts.TrackType}
 * @constructor
 */
epiviz.plugins.charts.StackedLineTrackType = function(config) {
  // Call superclass constructor
  epiviz.ui.charts.TrackType.call(this, config);
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.StackedLineTrackType.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.TrackType.prototype);
epiviz.plugins.charts.StackedLineTrackType.constructor = epiviz.plugins.charts.StackedLineTrackType;

/**
 * @param {string} id
 * @param {jQuery} container The div where the chart will be drawn
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @returns {epiviz.plugins.charts.StackedLineTrack}
 */
epiviz.plugins.charts.StackedLineTrackType.prototype.createNew = function(id, container, properties) {
  return new epiviz.plugins.charts.StackedLineTrack(id, container, properties);
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.StackedLineTrackType.prototype.typeName = function() {
  return 'epiviz.plugins.charts.StackedLineTrack';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.StackedLineTrackType.prototype.chartName = function() {
  return 'Stacked Track';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.StackedLineTrackType.prototype.chartHtmlAttributeName = function() {
  return 'stacked-lines';
};

/**
 * @returns {function(epiviz.measurements.Measurement): boolean}
 */
epiviz.plugins.charts.StackedLineTrackType.prototype.measurementsFilter = function() { return function(m) { return m.type() == epiviz.measurements.Measurement.Type.FEATURE; }; };

/**
 * If true, this flag indicates that the corresponding chart can only show measurements that belong to the same
 * data source group
 * @returns {boolean}
 */
epiviz.plugins.charts.StackedLineTrackType.prototype.isRestrictedToSameDatasourceGroup = function() { return true; };

/**
 * @returns {Array.<epiviz.ui.charts.CustomSetting>}
 */
epiviz.plugins.charts.StackedLineTrackType.prototype.customSettingsDefs = function() {
  return epiviz.ui.charts.TrackType.prototype.customSettingsDefs.call(this).concat([
    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.StackedLineTrackType.CustomSettings.STEP,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      1,
      'Step'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.StackedLineTrackType.CustomSettings.OFFSET,
      epiviz.ui.charts.CustomSetting.Type.CATEGORICAL,
      'zero',
      'Offset',
      ['zero', 'wiggle']),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.StackedLineTrackType.CustomSettings.INTERPOLATION,
      epiviz.ui.charts.CustomSetting.Type.CATEGORICAL,
      'basis',
      'Interpolation',
      ['linear', 'step-before', 'step-after', 'basis', 'basis-open', 'basis-closed', 'bundle', 'cardinal', 'cardinal-open', 'monotone'])
  ]);
};

/**
 * @enum {string}
 */
epiviz.plugins.charts.StackedLineTrackType.CustomSettings = {
  STEP: 'step',
  OFFSET: 'offset',
  INTERPOLATION: 'interpolation'
};

