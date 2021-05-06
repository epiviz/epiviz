/**
 * Created by: Florin Chelaru
 * Date: 10/3/13
 * Time: 11:02 PM
 */

goog.provide('epiviz.ui.charts.ChartType');

goog.require('epiviz.ui.charts.VisualizationType');
goog.require('epiviz.ui.charts.markers.MeasurementAggregator');
goog.require('epiviz.ui.charts.CustomSetting');

/**
 * Abstract class
 * @param {epiviz.Config} config
 * @constructor
 * @extends {epiviz.ui.charts.VisualizationType}
 */
epiviz.ui.charts.ChartType = function(config) {
  epiviz.ui.charts.VisualizationType.call(this, config);
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.ChartType.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.VisualizationType.prototype);
epiviz.ui.charts.ChartType.constructor = epiviz.ui.charts.ChartType;

/**
 * @param {string} id
 * @param {jQuery} container
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @returns {epiviz.ui.charts.Chart}
 */
epiviz.ui.charts.ChartType.prototype.createNew = function(id, container, properties) { throw Error('unimplemented abstract method'); };

epiviz.ui.charts.ChartType.prototype.customSettingsDefs = function() {
  var defs = epiviz.ui.charts.VisualizationType.prototype.customSettingsDefs.call(this);
  if (this.isRestrictedToRangeMeasurements()) { return defs; }

  var aggregators = Object.keys(epiviz.ui.charts.markers.MeasurementAggregators);

  return defs.concat([
    new epiviz.ui.charts.CustomSetting(
      epiviz.ui.charts.ChartType.CustomSettings.MEASUREMENT_GROUPS_AGGREGATOR,
      epiviz.ui.charts.CustomSetting.Type.CATEGORICAL,
      aggregators[0],
      'Aggregator for measurement groups', aggregators),

    new epiviz.ui.charts.CustomSetting(
      epiviz.ui.charts.ChartType.CustomSettings.MEASUREMENTS_ORDER,
      epiviz.ui.charts.CustomSetting.Type.MEASUREMENTS_ANNOTATION,
      'name',
      'Order Measurements by')
  ]);
};

/**
 * @enum {string}
 */
epiviz.ui.charts.ChartType.CustomSettings = {
  MEASUREMENT_GROUPS_AGGREGATOR: 'measurementGroupsAggregator',
  MEASUREMENTS_ORDER: 'measurementsOrder'
};
