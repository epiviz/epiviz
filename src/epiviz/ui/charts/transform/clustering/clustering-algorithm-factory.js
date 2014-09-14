/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 4/14/14
 * Time: 10:17 AM
 */

goog.provide('epiviz.ui.charts.transform.clustering.ClusteringAlgorithmFactory');

/**
 * @param {epiviz.Config} config
 * @constructor
 */
epiviz.ui.charts.transform.clustering.ClusteringAlgorithmFactory = function(config) {
  /**
   * @type {epiviz.Config}
   * @private
   */
  this._config = config;

  /**
   * @type {Object.<string, epiviz.ui.charts.transform.clustering.HierarchicalClusteringAlgorithm>}
   * @private
   */
  this._algorithms = {};

  /**
   * @type {Object.<string, epiviz.ui.charts.transform.clustering.ClusteringMetric>}
   * @private
   */
  this._metrics = {};

  /**
   * @type {Object.<string, epiviz.ui.charts.transform.clustering.ClusteringLinkage>}
   * @private
   */
  this._linkages = {};

  var i;
  for (i = 0; i < config.clustering.algorithms.length; ++i) {
    /** @type {?function(new:epiviz.ui.charts.transform.clustering.HierarchicalClusteringAlgorithm)} */
    var algorithmConstructor = epiviz.utils.evaluateFullyQualifiedTypeName(config.clustering.algorithms[i]);

    /** @type {epiviz.ui.charts.transform.clustering.HierarchicalClusteringAlgorithm} */
    var algorithm = epiviz.utils.applyConstructor(algorithmConstructor);

    this._algorithms[algorithm.id()] = algorithm;
  }

  for (i = 0; i < config.clustering.metrics.length; ++i) {
    /** @type {?function(new:epiviz.ui.charts.transform.clustering.ClusteringMetric)} */
    var metricConstructor = epiviz.utils.evaluateFullyQualifiedTypeName(config.clustering.metrics[i]);

    /** @type {epiviz.ui.charts.transform.clustering.ClusteringMetric} */
    var metric = epiviz.utils.applyConstructor(metricConstructor);

    this._metrics[metric.id()] = metric;
  }

  for (i = 0; i < config.clustering.linkages.length; ++i) {
    /** @type {?function(new:epiviz.ui.charts.transform.clustering.ClusteringLinkage)} */
    var linkageConstructor = epiviz.utils.evaluateFullyQualifiedTypeName(config.clustering.linkages[i]);

    /** @type {epiviz.ui.charts.transform.clustering.ClusteringLinkage} */
    var linkage = epiviz.utils.applyConstructor(linkageConstructor);

    this._linkages[linkage.id()] = linkage;
  }
};

/**
 * @type {?epiviz.ui.charts.transform.clustering.ClusteringAlgorithmFactory}
 * @private
 */
epiviz.ui.charts.transform.clustering.ClusteringAlgorithmFactory._instance = null;

/**
 * @returns {?epiviz.ui.charts.transform.clustering.ClusteringAlgorithmFactory}
 */
epiviz.ui.charts.transform.clustering.ClusteringAlgorithmFactory.instance = function() {
  return epiviz.ui.charts.transform.clustering.ClusteringAlgorithmFactory._instance;
};

/**
 * @param {epiviz.Config} config
 */
epiviz.ui.charts.transform.clustering.ClusteringAlgorithmFactory.initialize = function(config) {
  epiviz.ui.charts.transform.clustering.ClusteringAlgorithmFactory._instance =
    new epiviz.ui.charts.transform.clustering.ClusteringAlgorithmFactory(config);
};

/**
 * @param {string} id
 * @returns {epiviz.ui.charts.transform.clustering.HierarchicalClusteringAlgorithm}
 */
epiviz.ui.charts.transform.clustering.ClusteringAlgorithmFactory.prototype.algorithm = function(id) { return this._algorithms[id]; };

/**
 * @param {string} id
 * @returns {epiviz.ui.charts.transform.clustering.ClusteringMetric}
 */
epiviz.ui.charts.transform.clustering.ClusteringAlgorithmFactory.prototype.metric = function(id) { return this._metrics[id]; };

/**
 * @param {string} id
 * @returns {epiviz.ui.charts.transform.clustering.ClusteringLinkage}
 */
epiviz.ui.charts.transform.clustering.ClusteringAlgorithmFactory.prototype.linkage = function(id) { return this._linkages[id]; };

/**
 * @returns {Array.<string>}
 */
epiviz.ui.charts.transform.clustering.ClusteringAlgorithmFactory.prototype.algorithms = function() { return Object.keys(this._algorithms); };

/**
 * @returns {Array.<string>}
 */
epiviz.ui.charts.transform.clustering.ClusteringAlgorithmFactory.prototype.metrics = function() { return Object.keys(this._metrics); };

/**
 * @returns {Array.<string>}
 */
epiviz.ui.charts.transform.clustering.ClusteringAlgorithmFactory.prototype.linkages = function() { return Object.keys(this._linkages); };
