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
 * @param {number} nleaves
 * @constructor
 * @struct
 */
epiviz.ui.charts.tree.Node = function(id, name, children, parentId, size, depth, nchildren, nleaves) {
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
};
