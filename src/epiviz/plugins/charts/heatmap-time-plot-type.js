/**
 * Created by Jayaram Kancherla ( jkanche [at] umiacs [dot] umd [dot] edu )
 */

goog.provide('epiviz.plugins.charts.HeatmapTimePlotType');

goog.require('epiviz.plugins.charts.HeatmapTimePlot');
/**
 * @param {epiviz.Config} config
 * @extends {epiviz.ui.charts.PlotType}
 * @constructor
 */
epiviz.plugins.charts.HeatmapTimePlotType = function(config) {
  // Call superclass constructor
  epiviz.plugins.charts.HeatmapPlotType.call(this, config);
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.HeatmapTimePlotType.prototype = epiviz.utils.mapCopy(epiviz.plugins.charts.HeatmapPlotType.prototype);
epiviz.plugins.charts.HeatmapTimePlotType.constructor = epiviz.plugins.charts.HeatmapTimePlotType;

/**
 * @param {string} id
 * @param {jQuery} container The div where the chart will be drawn
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @returns {epiviz.plugins.charts.HeatmapTimePlot}
 */
epiviz.plugins.charts.HeatmapTimePlotType.prototype.createNew = function(id, container, properties) {
  return new epiviz.plugins.charts.HeatmapTimePlot(id, container, properties);
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.HeatmapTimePlotType.prototype.typeName = function() {
  return 'epiviz.plugins.charts.HeatmapTimePlot';
};

/**
* @returns {string}
*/
epiviz.plugins.charts.HeatmapTimePlotType.prototype.chartName = function() {
 return 'HeatmapTimeSeries';
};

/**
* @returns {string}
*/
epiviz.plugins.charts.HeatmapTimePlotType.prototype.chartHtmlAttributeName = function() {
 return 'heatmaptimeseries';
};

epiviz.plugins.charts.HeatmapTimePlotType.prototype.customSettingsDefs = function() {
  var clusteringFactory = epiviz.ui.charts.transform.clustering.ClusteringAlgorithmFactory.instance();

  return epiviz.ui.charts.PlotType.prototype.customSettingsDefs.call(this).concat([
    new epiviz.ui.charts.CustomSetting(
      epiviz.ui.charts.Visualization.CustomSettings.COL_LABEL,
      epiviz.ui.charts.CustomSetting.Type.MEASUREMENTS_METADATA,
      'colLabel',
      'Columns labels'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.ui.charts.Visualization.CustomSettings.ROW_LABEL,
      epiviz.ui.charts.CustomSetting.Type.MEASUREMENTS_ANNOTATION,
      'name',
      'Row labels'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.HeatmapPlotType.CustomSettings.SHOW_COLORS_FOR_ROW_LABELS,
      epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
      false,
      'Row labels as colors'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.HeatmapPlotType.CustomSettings.MAX_COLUMNS,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      40,
      'Max columns'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.ui.charts.Visualization.CustomSettings.Y_MIN,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      epiviz.ui.charts.CustomSetting.DEFAULT,
      'Min Value'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.ui.charts.Visualization.CustomSettings.Y_MAX,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      epiviz.ui.charts.CustomSetting.DEFAULT,
      'Max Value'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.HeatmapPlotType.CustomSettings.CLUSTER,
      epiviz.ui.charts.CustomSetting.Type.CATEGORICAL,
      'rows',
      'Cluster',
      Object.keys(epiviz.plugins.charts.HeatmapPlotType.Cluster).map(function(key) { return epiviz.plugins.charts.HeatmapTimePlotType.Cluster[key]; })),

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

    // TODO: Maybe add back later
    /*new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.HeatmapPlotType.CustomSettings.DENDROGRAM_RATIO,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      0,
      'Dendrogram Ratio'),*/

    /*new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.HeatmapPlotType.CustomSettings.SHOW_DENDROGRAM_LABELS,
      epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
      false,
      'Show Dendrogram Labels')*/
    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.HeatmapPlotType.CustomSettings.SHOW_DENDROGRAM,
      epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
      true,
      'Show Dendrogram'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.plugins.charts.HeatmapPlotType.CustomSettings.LOG_TRANSFORM,
      epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
      true,
      'Log Transform count data')
  ]);
};

epiviz.plugins.charts.HeatmapTimePlotType.Cluster = {
  NONE: 'none',
  ROWS: 'rows',
  COLS: 'columns',
  BOTH: 'both'
};

/**
 * @enum {string}
 */
epiviz.plugins.charts.HeatmapTimePlotType.CustomSettings = {
  MAX_COLUMNS: 'maxColumns',
  CLUSTER: 'cluster',
  CLUSTERING_ALG: 'clusteringAlg',
  CLUSTERING_METRIC: 'clusteringMetric',
  CLUSTERING_LINKAGE: 'clusteringLinkage',
  // TODO: Maybe add back later
  //DENDROGRAM_RATIO: 'dendrogramRatio',
  //SHOW_DENDROGRAM_LABELS: 'showDendrogramLabels',
  SHOW_DENDROGRAM: 'showDendrogram',
  SHOW_COLORS_FOR_ROW_LABELS: 'showColorsForRowLabels',
  LOG_TRANSFORM: 'logTransform'
};