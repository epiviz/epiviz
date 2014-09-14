/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 4/14/14
 * Time: 11:21 AM
 */

goog.provide('epiviz.ui.charts.transform.clustering.HierarchicalClusteringAlgorithm');

/**
 * @interface
 */
epiviz.ui.charts.transform.clustering.HierarchicalClusteringAlgorithm = function() {};

/**
 * @param {Array.<Array.<number>>} data An array of rows representing multidimensional items
 * @param {epiviz.ui.charts.transform.clustering.ClusteringMetric} metric
 * @param {epiviz.ui.charts.transform.clustering.ClusteringLinkage} linkage
 * @returns {epiviz.ui.charts.transform.clustering.ClusterTree}
 */
epiviz.ui.charts.transform.clustering.HierarchicalClusteringAlgorithm.prototype.cluster = function(data, metric, linkage) {};

/**
 * @returns {string}
 */
epiviz.ui.charts.transform.clustering.HierarchicalClusteringAlgorithm.prototype.id = function() {};
