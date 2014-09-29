/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 4/14/14
 * Time: 11:59 AM
 */

goog.provide('epiviz.ui.charts.transform.clustering.NoneClustering');

/**
 * @constructor
 * @implements {epiviz.ui.charts.transform.clustering.HierarchicalClusteringAlgorithm}
 */
epiviz.ui.charts.transform.clustering.NoneClustering = function() {};

/**
 * @param {Array.<Array.<number>>} data
 * @param {epiviz.ui.charts.transform.clustering.ClusteringMetric} metric
 * @param {epiviz.ui.charts.transform.clustering.ClusteringLinkage} linkage
 * @returns {epiviz.ui.charts.transform.clustering.ClusterTree}
 */
epiviz.ui.charts.transform.clustering.NoneClustering.prototype.cluster = function(data, metric, linkage) {
  var nodes = [];
  for (var i = 0; i < data.length; ++i) {
    nodes.push(new epiviz.ui.charts.transform.clustering.ClusterLeaf(i));
  }

  var root = new epiviz.ui.charts.transform.clustering.ClusterSubtree(nodes, 0);

  return new epiviz.ui.charts.transform.clustering.ClusterTree(root, data);
};

/**
 * @returns {string}
 */
epiviz.ui.charts.transform.clustering.NoneClustering.prototype.id = function() { return 'none'; };
