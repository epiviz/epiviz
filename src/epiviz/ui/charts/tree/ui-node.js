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
 * @param {epiviz.ui.charts.tree.NodeSelectionType} [selectionType]
 * @param {number} [order]
 * @param {number} [globalDepth]
 * @param {string} [taxonomy]
 * @param {number} [x]
 * @param {number} [dx]
 * @param {number} [y]
 * @param {number} [dy]
 * @param {epiviz.ui.charts.tree.Node} [parent]
 * @constructor
 * @struct
 * @extends {epiviz.ui.charts.tree.Node}
 */
epiviz.ui.charts.tree.UiNode = function(id, name, children, parentId, size, depth, nchildren, nleaves, selectionType, order, globalDepth, taxonomy, x, dx, y, dy, parent) {
  epiviz.ui.charts.tree.Node.call(this, id, name, children, parentId, size, depth, nchildren, nleaves, selectionType, order, globalDepth, taxonomy);

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
  this.parent = parent || null;
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.tree.UiNode.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.tree.Node.prototype);
epiviz.ui.charts.tree.UiNode.constructor = epiviz.ui.charts.tree.UiNode;

/**
 * @param {epiviz.ui.charts.tree.UiNode} node
 * @returns {epiviz.ui.charts.tree.UiNode}
 */
epiviz.ui.charts.tree.UiNode.deepCopy = function(node) {
  var copy = new epiviz.ui.charts.tree.UiNode(node.id, node.name, [], node.parentId,
    node.size, node.depth, node.nchildren, node.nleaves, node.selectionType, node.order, node.globalDepth, node.taxonomy, node.x, node.dx, node.y, node.dy, null);
  if (node.children && node.children.length) {
    node.children.forEach(function(child) {
      var childCopy = epiviz.ui.charts.tree.UiNode.deepCopy(child);
      copy.children.push(childCopy);
      childCopy.parent = copy;
    });
  }

  return copy;
};
