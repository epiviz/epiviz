/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 4/14/14
 * Time: 11:24 AM
 */

goog.provide('epiviz.ui.charts.transform.clustering.ClusteringMetric');

/**
 * @interface
 */
epiviz.ui.charts.transform.clustering.ClusteringMetric = function() {};

/**
 * @param {Array.<number>} item1
 * @param {Array.<number>} item2
 * @returns {number}
 */
epiviz.ui.charts.transform.clustering.ClusteringMetric.prototype.distance = function(item1, item2) {};

/**
 * @returns {string}
 */
epiviz.ui.charts.transform.clustering.ClusteringMetric.prototype.id = function() {};
