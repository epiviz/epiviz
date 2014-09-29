/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 4/14/14
 * Time: 11:35 AM
 */

goog.provide('epiviz.ui.charts.transform.clustering.ClusterLeaf');

/**
 * @param {number} dataIndex
 * @constructor
 * @implements {epiviz.ui.charts.transform.clustering.ClusterNode}
 */
epiviz.ui.charts.transform.clustering.ClusterLeaf = function(dataIndex) {
  /**
   * @type {number}
   * @private
   */
  this._dataIndex = dataIndex;
};

/**
 * @returns {number}
 */
epiviz.ui.charts.transform.clustering.ClusterLeaf.prototype.weight = function() { return 1; };

/**
 * @returns {Array.<epiviz.ui.charts.transform.clustering.ClusterNode>}
 */
epiviz.ui.charts.transform.clustering.ClusterLeaf.prototype.children = function() { return []; };

/**
 * The indices of the data stored
 * @returns {Array.<number>}
 */
epiviz.ui.charts.transform.clustering.ClusterLeaf.prototype.data = function() { return [this._dataIndex]; };

/**
 */
epiviz.ui.charts.transform.clustering.ClusterLeaf.prototype.sort = function() {};

/**
 * @returns {epiviz.ui.charts.transform.clustering.ClusterNode}
 */
epiviz.ui.charts.transform.clustering.ClusterLeaf.prototype.copy = function() { return new epiviz.ui.charts.transform.clustering.ClusterLeaf(this._dataIndex); };

/**
 * @returns {number}
 */
epiviz.ui.charts.transform.clustering.ClusterLeaf.prototype.distance = function() { return 0; };

/**
 * @returns {boolean}
 */
epiviz.ui.charts.transform.clustering.ClusterLeaf.prototype.sorted = function() { return true; };
