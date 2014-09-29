/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 4/1/14
 * Time: 5:56 PM
 */

goog.provide('epiviz.plugins.charts.HeatmapPlotType');

goog.require('epiviz.ui.charts.Chart');

/**
 * @param {epiviz.Config} config
 * @extends {epiviz.ui.charts.PlotType}
 * @constructor
 */
epiviz.plugins.charts.HeatmapPlotType = function(config) {
  // Call superclass constructor
  epiviz.ui.charts.PlotType.call(this, config);
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.HeatmapPlotType.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.PlotType.prototype);
epiviz.plugins.charts.HeatmapPlotType.constructor = epiviz.plugins.charts.HeatmapPlotType;

/**
 * @param {string} id
 * @param {jQuery} container The div where the chart will be drawn
 * @param {epiviz.ui.charts.ChartProperties} properties
 * @returns {epiviz.plugins.charts.HeatmapPlot}
 */
epiviz.plugins.charts.HeatmapPlotType.prototype.createNew = function(id, container, properties) {
  return new epiviz.plugins.charts.HeatmapPlot(id, container, properties);
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.HeatmapPlotType.prototype.typeName = function() {
  return 'epiviz.plugins.charts.HeatmapPlot';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.HeatmapPlotType.prototype.chartName = function() {
  return 'Heatmap';
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.HeatmapPlotType.prototype.chartHtmlAttributeName = function() {
  return 'heatmap';
};

/**
 * @returns {epiviz.measurements.Measurement.Type}
 */
epiviz.plugins.charts.HeatmapPlotType.prototype.chartContentType = function() {
  return epiviz.measurements.Measurement.Type.FEATURE;
};

/**
 * If true, this flag indicates that the corresponding chart can only show measurements that belong to the same
 * data source group
 * @returns {boolean}
 */
epiviz.plugins.charts.HeatmapPlotType.prototype.isRestrictedToSameDatasourceGroup = function() { return true; };

/**
 * @returns {Array.<epiviz.ui.charts.CustomSetting>}
 */
epiviz.plugins.charts.HeatmapPlotType.prototype.customSettingsDefs = function() {
  var clusteringFactory = epiviz.ui.charts.transform.clustering.ClusteringAlgorithmFactory.instance();

  return epiviz.ui.charts.PlotType.prototype.customSettingsDefs.call(this).concat([
    new epiviz.ui.charts.CustomSetting(
      epiviz.ui.charts.ChartType.CustomSettings.LABEL,
      epiviz.ui.charts.CustomSetting.Type.STRING,
      'probe',
      'Columns labels'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.HeatmapPlotType.CustomSettings.MAX_COLUMNS,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      40,
      'Max columns'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.HeatmapPlotType.CustomSettings.CLUSTERING_ALG,
      epiviz.ui.charts.CustomSetting.Type.CATEGORICAL,
      clusteringFactory.algorithms()[0],
      'Clustering Algorithm',
      clusteringFactory.algorithms()),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.HeatmapPlotType.CustomSettings.CLUSTERING_METRIC,
      epiviz.ui.charts.CustomSetting.Type.CATEGORICAL,
      clusteringFactory.metrics()[0],
      'Clustering Metric',
      clusteringFactory.metrics()),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.HeatmapPlotType.CustomSettings.CLUSTERING_LINKAGE,
      epiviz.ui.charts.CustomSetting.Type.CATEGORICAL,
      clusteringFactory.linkages()[0],
      'Clustering Linkage',
      clusteringFactory.linkages()),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.HeatmapPlotType.CustomSettings.DENDROGRAM_RATIO,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      0,
      'Dendrogram Ratio'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.HeatmapPlotType.CustomSettings.SHOW_DENDROGRAM_LABELS,
      epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
      true,
      'Show Dendrogram Labels')
  ]);
};

/**
 * @enum {string}
 */
epiviz.plugins.charts.HeatmapPlotType.CustomSettings = {
  MAX_COLUMNS: 'maxColumns',
  CLUSTERING_ALG: 'clusteringAlg',
  CLUSTERING_METRIC: 'clusteringMetric',
  CLUSTERING_LINKAGE: 'clusteringLinkage',
  DENDROGRAM_RATIO: 'dendrogramRatio',
  SHOW_DENDROGRAM_LABELS: 'showDendrogramLabels'
};
