/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 4/14/14
 * Time: 11:28 AM
 */

goog.provide('epiviz.ui.charts.transform.clustering.ClusterTree');

/**
 * @param {epiviz.ui.charts.transform.clustering.ClusterNode} root
 * @param {Array.<Array.<number>>} data
 * @constructor
 */
epiviz.ui.charts.transform.clustering.ClusterTree = function(root, data) {
  /**
   * @type {epiviz.ui.charts.transform.clustering.ClusterNode}
   * @private
   */
  this._root = root;

  /**
   * @type {Array.<Array.<number>>}
   * @private
   */
  this._data = data;
};

/**
 * @returns {epiviz.ui.charts.transform.clustering.ClusterNode}
 */
epiviz.ui.charts.transform.clustering.ClusterTree.prototype.root = function() { return this._root; };

/**
 * @returns {Array.<Array.<number>>}
 */
epiviz.ui.charts.transform.clustering.ClusterTree.prototype.orderedData = function() {
  if (!this._root.sorted()) {
    this._root.sort(true);
  }

  var orderedIndices = this._root.data();
  var orderedData = [];
  for (var i = 0; i < orderedIndices.length; ++i) {
    orderedData.push(this._data[orderedIndices[i]]);
  }

  return orderedData;
};
