/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/7/2014
 * Time: 8:33 PM
 */

goog.provide('epiviz.ui.charts.tree.Node');

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
 * @constructor
 * @struct
 * @extends {epiviz.ui.charts.VisObject}
 */
epiviz.ui.charts.tree.Node = function(id, name, children, parentId, size, depth, nchildren, nleaves, selectionType, order, globalDepth, taxonomy) {
  epiviz.ui.charts.VisObject.call(this);

  /**
   * @type {string}
   */
  this.id = id;

  /**
   * @type {string}
   */
  this.name = name;

  /**
   * @type {Array.<epiviz.ui.charts.tree.Node>}
   */
  this.children = children;

  /**
   * @type {string}
   */
  this.parentId = parentId;

  /**
   * @type {number}
   */
  this.size = size;

  /**
   * @type {number}
   */
  this.depth = depth;

  /**
   * @type {number}
   */
  this.nchildren = nchildren;

  /**
   * @type {number}
   */
  this.nleaves = nleaves;

  /**
   * @type {epiviz.ui.charts.tree.NodeSelectionType}
   */
  this.selectionType = selectionType || epiviz.ui.charts.tree.NodeSelectionType.NONE;

  /**
   * @type {number}
   */
  this.order = order;

  /**
   * @type {number}
   */
  this.globalDepth = globalDepth;

  /**
   * @type {string}
   */
  this.taxonomy = taxonomy;
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.tree.Node.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.VisObject.prototype);
epiviz.ui.charts.tree.Node.constructor = epiviz.ui.charts.tree.Node;

/**
 * Measurement i, object j
 * @param {number} i
 * @param {number} j
 * @param {string} metadataCol
 * @returns {string}
 */
epiviz.ui.charts.tree.Node.prototype.getMetadata = function(i, j, metadataCol) { return (i != 0 || j != 0 || metadataCol != 'lineage') ? null : this.id; };

/**
 * @returns {Array.<string>}
 */
epiviz.ui.charts.tree.Node.prototype.metadataColumns = function() { return ['lineage']; };

/**
 * Number of measurements times number of objects stored per measurement
 * @returns {Array.<number>}
 */
epiviz.ui.charts.tree.Node.prototype.dimensions = function() { return [1, 1]; };

/**
 * @returns {boolean}
 */
epiviz.ui.charts.tree.Node.prototype.metadataLooseCompare = function() { return true; };

/**
 * @param {epiviz.ui.charts.tree.Node} node
 * @param {function(epiviz.ui.charts.tree.Node): boolean} callback A function called
 *   for each node in the traversal. If it returns something that evaluates to true, the
 *   traversal is halted.
 */
epiviz.ui.charts.tree.Node.dfs = function(node, callback) {
  if (!node) { return; }
  if (callback(node)) { return; }
  if (node.children) {
    node.children.forEach(function(child) { epiviz.ui.charts.tree.Node.dfs(child, callback); });
  }
};

/**
 * @param {epiviz.ui.charts.tree.Node} node
 * @param {function(epiviz.ui.charts.tree.Node): boolean} callback A function called
 *   for each node in the traversal. If it returns something that evaluates to true, the
 *   traversal is halted.
 */
epiviz.ui.charts.tree.Node.bfs = function(node, callback) {
  if (!node) { return; }

  var q = [];
  q.push(node);
  for (var i = 0; i < q.length; ++i) {
    if (callback(q[i])) { return; }
    if (q[i].nchildren) {
      q[i].children.forEach(function(child) { q.push(child); });
    }
  }
};

/**
 * Creates a copy of the tree filtering out nodes specified by the filter callback
 * @param {epiviz.ui.charts.tree.Node} node
 * @param {function(epiviz.ui.charts.tree.Node): boolean} filter
 */
epiviz.ui.charts.tree.Node.filter = function(node, filter) {
  if (!filter(node)) { return null; }
  var copy = {};
  for (var key in node) {
    if (!node.hasOwnProperty(key) || key == 'children') { continue; }
    copy[key] = node[key];
  }
  if (node.children) {
    copy.children = [];
    node.children.forEach(function(child) {
      var childCopy = epiviz.ui.charts.tree.Node.filter(child, filter);
      if (childCopy !== null) {
        copy.children.push(childCopy);
      }
    });
  }
  return copy;
};
