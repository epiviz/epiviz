/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/7/2014
 * Time: 7:18 PM
 */

goog.provide('epiviz.ui.charts.tree.Sunburst');

/**
 * @param {string} id
 * @param {jQuery} container
 * @param {{width: number|string, height: number|string, margins: epiviz.ui.charts.Margins, colors: epiviz.ui.charts.ColorPalette}} properties
 * @constructor
 */
epiviz.ui.charts.tree.Sunburst = function(id, container, properties) {
  /**
   * @type {string}
   * @protected
   */
  this._id = id;

  /**
   * @type {jQuery}
   * @protected
   */
  this._container = container;

  /**
   * @type {{width: (number|string), height: (number|string), margins: epiviz.ui.charts.Margins, colors: epiviz.ui.charts.ColorPalette}}
   * @private
   */
  this._properties = properties;

  /**
   * @type {string}
   * @protected
   */
  this._svgId = sprintf('%s-svg', this._id);

  /**
   * The D3 svg handler for the chart
   * @protected
   */
  this._svg = null;

  /**
   * @type {?epiviz.ui.charts.tree.Node}
   * @protected
   */
  this._lastData = null;

  /**
   * The difference in size between the container and the inner SVG
   * @type {?number}
   * @private
   */
  this._widthDif = null;

  /**
   * The difference in size between the container and the inner SVG
   * @type {?number}
   * @private
   */
  this._heightDif = null;

  // Sunburst specific

  /**
   * A D3 function used to partition a tree
   * @private
   */
  this._partition = d3.layout.partition().value(
    /**
     * @param {epiviz.ui.charts.tree.Node} d
     * @returns {number}
     */
    function(d) { return d.nleaves; });

  /**
   * Converts x values for a partition to radians (0..1 -> 0..2PI)
   * @type {function(number): number}
   * @private
   */
  this._x = d3.scale.linear().range([0, 2 * Math.PI]);

  /**
   * Converts y values for a partition (depth) to circle radius
   * @type {function(number): number}
   * @private
   */
  this._y = d3.scale.pow().exponent(1.2);

  /**
   * Generates an arc given a ui node
   * @type {function(epiviz.ui.charts.tree.UiNode): string}
   * @private
   */
  this._arcMap = null;

  /**
   * The number of milliseconds for animations within the chart
   * @type {number}
   * @private
   */
  this._animationDelay = 500;

  /**
   * @type {Array.<epiviz.ui.charts.tree.UiNode>}
   * @private
   */
  this._uiData = null;

  /**
   * @type {number}
   * @private
   */
  this._oldSubtreeDepth = null;

  /**
   * @type {number}
   * @private
   */
  this._subtreeDepth = null;

  /**
   * @type {Object.<string, epiviz.ui.charts.tree.UiNode>}
   * @private
   */
  this._oldUiDataMap = null;

  /**
   * @type {Object.<string, epiviz.ui.charts.tree.UiNode>}
   * @private
   */
  this._uiDataMap = null;

  this._initialize();
};

/**
 * Generates an arc given a ui node
 * @type {function(epiviz.ui.charts.tree.UiNode): string}
 */
epiviz.ui.charts.tree.Sunburst.arc = d3.svg.arc()
  .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
  .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
  .innerRadius(function(d) { return Math.max(0, y(d.y)); })
  .outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });

/**
 * TODO: Create an even more simplified version of the base chart that contains all of this
 * Initializes the chart and draws the initial SVG in the container
 * @protected
 */
epiviz.ui.charts.tree.Sunburst.prototype._initialize = function() {
  if (this._properties.height == '100%') { this._properties.height = this._container.height() - epiviz.ui.charts.tree.Sunburst.SVG_MARGIN; }
  if (this._properties.width == '100%') { this._properties.width = this._container.width() - epiviz.ui.charts.tree.Sunburst.SVG_MARGIN; }

  var width = this.width();
  var height = this.height();

  this._container.append(sprintf('<svg id="%s" class="base-chart" width="%s" height="%s"></svg>', this._svgId, width, height));
  this._svg = d3.select('#' + this._svgId);

  var x = this._x, y = this._y;

  var jSvg = $('#' + this._svgId);

  var self = this;
  this._arcMap = function(d) {
    return epiviz.ui.charts.tree.Sunburst.arc(self._uiDataMap[d.id]);
  };

  /**
   * The difference in size between the container and the inner SVG
   * @type {number}
   * @private
   */
  this._widthDif = jSvg.width() - (this._container.width() - epiviz.ui.charts.tree.Sunburst.SVG_MARGIN);

  /**
   * The difference in size between the container and the inner SVG
   * @type {number}
   * @private
   */
  this._heightDif = height - (this._container.height() - epiviz.ui.charts.tree.Sunburst.SVG_MARGIN);

  this._properties.width = width;
  this._properties.height = height;
};

/**
 * @param {number} width
 * @param {number} height
 */
epiviz.ui.charts.tree.Sunburst.prototype.resize = function(width, height) {
  if (width) { this._properties.width = width; }
  if (height) { this._properties.height = height; }

  this.draw();
};

/**
 */
epiviz.ui.charts.tree.Sunburst.prototype.containerResize = function() {
  this.resize(
    this._widthDif + this._container.width() - epiviz.ui.charts.tree.Sunburst.SVG_MARGIN,
    this._heightDif + this._container.height() - epiviz.ui.charts.tree.Sunburst.SVG_MARGIN);
};

/**
 * TODO: Later we will return the drawn objects
 * @param {epiviz.ui.charts.tree.Node} [data]
 */
epiviz.ui.charts.tree.Sunburst.prototype.draw = function(data) {
  var self = this;

  if (data) {
    this._lastData = data;
    this._uiData = this._partition.nodes(data);
    this._oldSubtreeDepth = this._subtreeDepth;
    this._subtreeDepth = 0;
    this._oldUiDataMap = this._uiDataMap;
    this._uiDataMap = {};
    this._uiData.forEach(function(node) {
      self._uiDataMap[node.id] = node;
      if (self._subtreeDepth < node.depth + 1) {
        self._subtreeDepth = node.depth + 1;
      }
    });
  } else {
    data = this._lastData;
  }

  var width = this.width();
  var height = this.height();
  this._svg
    .attr('width', width)
    .attr('height', height);

  var canvas = this._svg.select('.sunburst-canvas');
  if (canvas.empty()) {
    canvas = this._svg.append('g')
      .attr('class', 'sunburst-canvas')
      .attr('transform', sprintf('translate(%s,%s) rotate(180)', width * 0.5, height * 0.5));
  }

  if (!data) { return; }


};


/**
 * @returns {jQuery}
 */
epiviz.ui.charts.tree.Sunburst.prototype.container = function() { return this._container; };

/**
 * @returns {string}
 */
epiviz.ui.charts.tree.Sunburst.prototype.id = function() { return this._id; };

/**
 * @returns {{width: (number|string), height: (number|string), margins: epiviz.ui.charts.Margins, colors: epiviz.ui.charts.ColorPalette}}
 */
epiviz.ui.charts.tree.Sunburst.prototype.properties = function() {
  return this._properties;
};

/**
 * @returns {number}
 */
epiviz.ui.charts.tree.Sunburst.prototype.height = function() {
  return this._properties.height;
};

/**
 * @returns {number}
 */
epiviz.ui.charts.tree.Sunburst.prototype.width = function() {
  return this._properties.width;
};

/**
 * @returns {epiviz.ui.charts.Margins}
 */
epiviz.ui.charts.tree.Sunburst.prototype.margins = function() {
  return this._properties.margins;
};

/**
 * @returns {epiviz.ui.charts.ColorPalette}
 */
epiviz.ui.charts.tree.Sunburst.prototype.colors = function() {
  return this._properties.colors;
};

