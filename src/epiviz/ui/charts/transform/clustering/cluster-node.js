/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 4/14/14
 * Time: 11:30 AM
 */

goog.provide('epiviz.ui.charts.transform.clustering.ClusterNode');

/**
 * @interface
 */
epiviz.ui.charts.transform.clustering.ClusterNode = function() {};

/**
 * @returns {number}
 */
epiviz.ui.charts.transform.clustering.ClusterNode.prototype.weight = function() {};

/**
 * @returns {Array.<epiviz.ui.charts.transform.clustering.ClusterNode>}
 */
epiviz.ui.charts.transform.clustering.ClusterNode.prototype.children = function() {};

/**
 * The indices of the data stored
 * @returns {Array.<number>}
 */
epiviz.ui.charts.transform.clustering.ClusterNode.prototype.data = function() {};

/**
 * @param {boolean} [recursive]
 */
epiviz.ui.charts.transform.clustering.ClusterNode.prototype.sort = function(recursive) {};

/**
 * @returns {epiviz.ui.charts.transform.clustering.ClusterNode}
 */
epiviz.ui.charts.transform.clustering.ClusterNode.prototype.copy = function() {};

/**
 * @returns {number}
 */
epiviz.ui.charts.transform.clustering.ClusterNode.prototype.distance = function() {};

/**
 * @returns {boolean}
 */
epiviz.ui.charts.transform.clustering.ClusterNode.prototype.sorted = function() {};
