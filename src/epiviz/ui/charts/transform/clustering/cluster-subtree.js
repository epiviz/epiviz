/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 4/14/14
 * Time: 11:33 AM
 */

goog.provide('epiviz.ui.charts.transform.clustering.ClusterSubtree');

/**
 * @param {Array.<epiviz.ui.charts.transform.clustering.ClusterNode>} children
 * @param {number} distance
 * @constructor
 * @implements {epiviz.ui.charts.transform.clustering.ClusterNode}
 */
epiviz.ui.charts.transform.clustering.ClusterSubtree = function(children, distance) {
  /**
   * @type {Array.<epiviz.ui.charts.transform.clustering.ClusterNode>}
   * @private
   */
  this._children = children;

  /**
   * @type {?number}
   * @private
   */
  this._weight = null;

  /**
   * @type {number}
   * @private
   */
  this._distance = distance;

  /**
   * @type {boolean}
   * @private
   */
  this._sorted = false;
};

/**
 * @returns {number}
 */
epiviz.ui.charts.transform.clustering.ClusterSubtree.prototype.weight = function() {
  if (this._weight == undefined) {
    var weight = 0;
    for (var i = 0; i < this._children.length; ++i) {
      weight += this._children[i].weight();
    }
    this._weight = weight;
  }

  return this._weight;
};

/**
 * @returns {Array.<epiviz.ui.charts.transform.clustering.ClusterNode>}
 */
epiviz.ui.charts.transform.clustering.ClusterSubtree.prototype.children = function() { return this._children; };

/**
 * The indices of the data stored
 * @returns {Array.<number>}
 */
epiviz.ui.charts.transform.clustering.ClusterSubtree.prototype.data = function() {
  var ret = [];
  for (var i = 0; i < this._children.length; ++i) {
    ret = ret.concat(this._children[i].data());
  }

  return ret;
};

/**
 * @param {boolean} [recursive]
 */
epiviz.ui.charts.transform.clustering.ClusterSubtree.prototype.sort = function(recursive) {
  if (this.sorted()) { return; }

  this._children.sort(function(node1, node2) {
    return node1.weight() - node2.weight();
  });

  if (recursive) {
    for (var i = 0; i < this._children.length; ++i) {
      this._children[i].sort(recursive);
    }

    this._sorted = true;
  }
};

/**
 * @returns {epiviz.ui.charts.transform.clustering.ClusterNode}
 */
epiviz.ui.charts.transform.clustering.ClusterSubtree.prototype.copy = function() {
  var children = [];
  for (var i = 0; i < this._children.length; ++i) {
    children.push(this._children[i].copy());
  }
  return new epiviz.ui.charts.transform.clustering.ClusterSubtree(children);
};

/**
 * @returns {number}
 */
epiviz.ui.charts.transform.clustering.ClusterSubtree.prototype.distance = function() { return this._distance; };

/**
 * @returns {boolean}
 */
epiviz.ui.charts.transform.clustering.ClusterSubtree.prototype.sorted = function() { return this._sorted; };
