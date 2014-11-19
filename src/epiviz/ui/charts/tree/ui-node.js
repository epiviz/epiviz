/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/7/2014
 * Time: 9:23 PM
 */

goog.provide('epiviz.ui.charts.tree.UiNode');

/**
 * @param {string} id
 * @param {string} name
 * @param {Array.<epiviz.ui.charts.tree.Node>} children
 * @param {string} parentId
 * @param {number} [size]
 * @param {number} [depth]
 * @param {number} [nchildren]
 * @param {number} [nleaves]
 * @param {number} [x]
 * @param {number} [dx]
 * @param {number} [y]
 * @param {number} [dy]
 * @param {epiviz.ui.charts.tree.Node} [parent]
 * @constructor
 * @struct
 * @extends {epiviz.ui.charts.tree.Node}
 * @implements {epiviz.ui.charts.VisObject}
 */
epiviz.ui.charts.tree.UiNode = function(id, name, children, parentId, size, depth, nchildren, nleaves, x, dx, y, dy, parent) {
  epiviz.ui.charts.tree.Node.call(this, id, name, children, parentId, size, depth, nchildren, nleaves);

  /**
   * @type {number}
   */
  this.x = x;

  /**
   * @type {number}
   */
  this.dx = dx;

  /**
   * @type {number}
   */
  this.y = y;

  /**
   * @type {number}
   */
  this.dy = dy;

  /**
   * @type {epiviz.ui.charts.tree.UiNode}
   */
  this.parent = null;
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.tree.UiNode.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.tree.Node.prototype);
epiviz.ui.charts.tree.UiNode.constructor = epiviz.ui.charts.tree.UiNode;

/**
 * @param {epiviz.ui.charts.tree.UiNode} other
 */
epiviz.ui.charts.tree.UiNode.prototype.overlapsWith = function(other) {
  return (other && other.id == this.id);
};
