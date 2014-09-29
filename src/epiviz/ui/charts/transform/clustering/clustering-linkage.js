/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 4/14/14
 * Time: 11:26 AM
 */

goog.provide('epiviz.ui.charts.transform.clustering.ClusteringLinkage');

/**
 * @interface
 */
epiviz.ui.charts.transform.clustering.ClusteringLinkage = function() {};

/**
 * @param {Array.<Array.<number>>} distances
 * @param {Array.<number>} indices
 * @returns {Array.<Array.<number>>}
 */
epiviz.ui.charts.transform.clustering.ClusteringLinkage.prototype.link = function(distances, indices) {};

/**
 * @returns {string}
 */
epiviz.ui.charts.transform.clustering.ClusteringLinkage.prototype.id = function() {};
