/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/7/2014
 * Time: 9:23 PM
 */

goog.provide('epiviz.ui.charts.tree.UiNode');

/**
 * @constructor
 * @struct
 * @extends {epiviz.ui.charts.tree.Node}
 */
epiviz.ui.charts.tree.UiNode = function() {
  epiviz.ui.charts.tree.Node.call(this);

  /**
   * @type {number}
   */
  this.x = null;

  /**
   * @type {number}
   */
  this.dx = null;

  /**
   * @type {number}
   */
  this.y = null;

  /**
   * @type {number}
   */
  this.dy = null;

  /**
   * @type {Array.<epiviz.ui.charts.tree.UiNode>}
   */
  this.children = null;

  /**
   * @type {epiviz.ui.charts.tree.UiNode}
   */
  this.parent = null;
};

