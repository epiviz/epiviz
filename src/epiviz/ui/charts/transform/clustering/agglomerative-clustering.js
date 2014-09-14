/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 4/14/14
 * Time: 11:37 AM
 */

goog.provide('epiviz.ui.charts.transform.clustering.AgglomerativeClustering');

/**
 * @constructor
 * @implements {epiviz.ui.charts.transform.clustering.HierarchicalClusteringAlgorithm}
 */
epiviz.ui.charts.transform.clustering.AgglomerativeClustering = function() {};

/**
 * @param {Array.<Array.<number>>} data
 * @param {epiviz.ui.charts.transform.clustering.ClusteringMetric} metric
 * @param {epiviz.ui.charts.transform.clustering.ClusteringLinkage} linkage
 * @returns {epiviz.ui.charts.transform.clustering.ClusterTree}
 */
epiviz.ui.charts.transform.clustering.AgglomerativeClustering.prototype.cluster = function(data, metric, linkage) {
  var i, j;
  var distances = new Array(data.length);
  for (i = 0; i < data.length; ++i) {
    distances[i] = new Array(data.length);

    for (j = i + 1; j < data.length; ++j) {
      distances[i][j] = metric.distance(data[i], data[j]);
    }
  }

  var nodes = [];
  for (i = 0; i < data.length; ++i) {
    nodes.push(new epiviz.ui.charts.transform.clustering.ClusterLeaf(i));
  }

  while (nodes.length > 1) {
    var minInfo = epiviz.utils.indexOfMin(distances, true);
    var indices = minInfo.index;
    var node = new epiviz.ui.charts.transform.clustering.ClusterSubtree([nodes[indices[0]], nodes[indices[1]]], minInfo.min);
    if (indices[0] < indices[1]) {
      var aux = indices[0];
      indices[0] = indices[1];
      indices[1] = aux;
    }
    nodes.splice(indices[0], 1);
    nodes.splice(indices[1], 1);
    nodes.push(node);
    distances = linkage.link(distances, indices);
  }

  return new epiviz.ui.charts.transform.clustering.ClusterTree(nodes[0], data);
};

/**
 * @returns {string}
 */
epiviz.ui.charts.transform.clustering.AgglomerativeClustering.prototype.id = function() { return 'agglomerative'; };
