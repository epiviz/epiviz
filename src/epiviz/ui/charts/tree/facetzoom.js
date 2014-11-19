/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/7/2014
 * Time: 7:18 PM
 */

goog.provide('epiviz.ui.charts.tree.Facetzoom');

/**
 * @param {string} id
 * @param {jQuery} container
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @constructor
 * @extends {epiviz.ui.charts.Visualization.<epiviz.ui.charts.tree.Node>}
 */
epiviz.ui.charts.tree.Facetzoom = function(id, container, properties) {

  epiviz.ui.charts.Visualization.call(this, id, container, properties);

  // Sunburst specific

  /**
   * A D3 function used to partition a tree
   * @private
   */
  this._partition = d3.layout.partition()
    .value(
    /**
     * @param {epiviz.ui.charts.tree.Node} d
     * @returns {number}
     */
    //function(d) { return d.nleaves; }); // If we want the size of the nodes to reflect the number of leaves under them
      function(d) { return 1; }) // If we want the size of the nodes to reflect only the number of leaves in the current subtree
    .sort(function(d1, d2) { return 0; }); // No reordering of the nodes

  var self = this;
  /**
   * Generates an arc given a ui node
   * @type {function(epiviz.ui.charts.tree.UiNode): string}
   */
  /*this._arc = d3.svg.arc()
    .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, self._x(d.x))); })
    .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, self._x(d.x + d.dx))); })
    .innerRadius(function(d) { return Math.max(0, self._y(d.y)); })
    .outerRadius(function(d) { return Math.max(0, self._y(d.y + d.dy)); });*/

  /**
   * The number of milliseconds for animations within the chart
   * @type {number}
   * @private
   */
  this._animationDelay = 750;

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
   * @type {number}
   * @private
   */
  this._oldRootDepth = null;

  /**
   * @type {number}
   * @private
   */
  this._rootDepth = null;

  /**
   * @type {Object.<string, epiviz.ui.charts.tree.UiNode>}
   * @private
   */
  this._oldUiDataMap = null;

  /**
   * @type {Object.<string, epiviz.ui.charts.tree.UiNode>}
   * @private
   */
  this._uiDataMap = {};

  /**
   * @type {epiviz.ui.charts.tree.UiNode}
   * @private
   */
  this._referenceNode = null;

  /**
   * @type {epiviz.ui.charts.tree.UiNode}
   * @private
   */
  this._selectedNode = null;

  this._initialize();
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.tree.Facetzoom.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.Visualization.prototype);
epiviz.ui.charts.tree.Facetzoom.constructor = epiviz.ui.charts.tree.Facetzoom;

/**
 * Initializes the chart and draws the initial SVG in the container
 * @protected
 */
epiviz.ui.charts.tree.Facetzoom.prototype._initialize = function() {
  epiviz.ui.charts.Visualization.prototype._initialize.call(this);

  this._svg.classed('facetzoom', true);
};


/**
 * @param {epiviz.ui.charts.tree.Node} [root]
 * @returns {Array.<epiviz.ui.charts.VisObject>}
 */
epiviz.ui.charts.tree.Facetzoom.prototype.draw = function(root) {
  epiviz.ui.charts.Visualization.prototype.draw.call(this, root);

  var self = this;
  var Axis = epiviz.ui.charts.Axis;

  if (root) {
    this._oldRootDepth = this._rootDepth;
    this._rootDepth = root.depth;
    this._referenceNode = null;
    //var uiRoot = this._uiDataMap[root.id];
    var uiSelected = root.children && root.children.length ? this._uiDataMap[root.children[0].id] : null;
    this._selectedNode = uiSelected ?
      new epiviz.ui.charts.tree.UiNode(uiSelected.id, uiSelected.name, uiSelected.children, uiSelected.parentId, uiSelected.size,
        uiSelected.depth, uiSelected.nchildren, uiSelected.nleaves, uiSelected.x, uiSelected.dx, uiSelected.y, uiSelected.dy, uiSelected.parent) : null;

    this._uiData = this._partition.nodes(root);
    this._oldSubtreeDepth = this._subtreeDepth;
    this._subtreeDepth = 0;
    this._oldUiDataMap = this._uiDataMap;
    this._uiDataMap = {};
    this._uiData.forEach(function(node) {
      self._uiDataMap[node.id] = node;
      if ((!self._referenceNode || self._referenceNode.x == undefined || self._referenceNode.depth < node.depth) && (node.id in self._oldUiDataMap)) {
        self._referenceNode = node;
      }
      if (self._subtreeDepth < node.depth + 1) {
        self._subtreeDepth = node.depth + 1;
      }
    });
    if (!this._selectedNode) { this._selectedNode = root.children && root.children.length ? this._uiDataMap[root.children[0].id] : this._uiDataMap[root.id]; }
    if (!this._referenceNode) { this._referenceNode = this._uiData[0]; }
    if (this._oldSubtreeDepth == null) { this._oldSubtreeDepth = this._subtreeDepth; }
    if (this._oldRootDepth == null) { this._oldRootDepth = this._rootDepth; }
  } else {
    root = this._lastData;
  }

  var width = this.width();
  var height = this.height();

  /** @type {function(number): number} */
  var xScale = d3.scale.linear().range([0, width - this.margins().sumAxis(Axis.X)]);

  /** @type {function(number): number} */
  var yScale = d3.scale.pow().exponent(1.2).range([0, height - this.margins().sumAxis(Axis.Y)]);

  var canvas = this._svg.select('.canvas');
  if (canvas.empty()) {
    canvas = this._svg.append('g')
      .attr('class', 'canvas')
      .attr('transform', sprintf('translate(%s,%s)', this.margins().left(), this.margins().top()));
  }

  if (!root) { return []; }


  var depthDif = this._rootDepth - this._oldRootDepth;

  var items = canvas.selectAll('g')
    .data(this._uiData, function(d) { return d.id; });

  var newItems = items
    .enter().append('g')
    .attr('class', 'item')
    .on('click', function(d) { self._select.notify(new epiviz.ui.charts.VisEventArgs(self.id(), d)); });

  var newRects = newItems.append('rect')
    .attr('id', function(d) { return self.id() + '-' + d.id; })
    .style('fill', function(d) { return self.colors().getByKey((d.children && d.children.length ? d : d.parent).id); })
    .attr('x', function(d) { return xScale(self._getOldNode(d).x); })
    .attr('y', function(d) { return yScale(self._getOldNode(d).y); })
    .attr('width', function(d) { var node = self._getOldNode(d); return xScale(node.x + node.dx) - xScale(node.x); })
    .attr('height', function(d) { var node = self._getOldNode(d); return yScale(node.y + node.dy) - yScale(node.y); });

  /*var newLabels = newItems.append('text')
    .attr('class', 'unselectable-text node-label')
    .text(function(d) { return d.name; });*/

  canvas.selectAll('g').selectAll('rect')
    .transition().duration(this._animationDelay)
    .attr('x', function(d) { return xScale(self._getNewNode(d).x); })
    .attr('y', function(d) { return yScale(self._getNewNode(d).y); })
    .attr('width', function(d) { var node = self._getNewNode(d); return xScale(node.x + node.dx) - xScale(node.x); })
    .attr('height', function(d) { var node = self._getNewNode(d); return yScale(node.y + node.dy) - yScale(node.y); });

  /*canvas.selectAll('g').selectAll('text')
    .transition().duration(this._animationDelay)
    .attrTween('transform', function(d) { return self._nodeLabelTransformTween(d); })
    .each(function(d) {
      d3.select(this.childNodes[0])
        .transition().duration(self._animationDelay)
        .attrTween('startOffset', function(d) { return self._nodeLabelStartOffsetTween(d); });
    });*/

  //items.exit()
  //  .selectAll('text').transition().duration(this._animationDelay).style('opacity', 0);
  items.exit().transition().delay(this._animationDelay).remove();

  return this._uiData;
};

/**
 * @param {epiviz.ui.charts.tree.UiNode} node
 * @returns {epiviz.ui.charts.tree.UiNode}
 * @private
 */
epiviz.ui.charts.tree.Facetzoom.prototype._getOldNode = function(node) {
  var oldNode = this._oldUiDataMap[node.id];
  var newNode = this._uiDataMap[node.id];
  if (oldNode) { return oldNode; }
  if (!newNode) { return node; }
  var oldDepth = newNode.depth + this._rootDepth - this._oldRootDepth;
  var isRoot = oldDepth < 0;
  var isExtremity = oldDepth < 0 || oldDepth >= this._subtreeDepth;
  var oldY = isRoot ? 0 : Math.min(1, oldDepth / this._oldSubtreeDepth);
  return new epiviz.ui.charts.tree.UiNode(
    node.id, node.name, node.children, node.parentId, node.size, node.depth, node.nchildren, node.nleaves,

    //isExtremity ? newNode.x : (newNode.x <= this._selectedNode.x ? 0 : 1), // x
    isExtremity ? newNode.x : (newNode.x <= this._referenceNode.x ? 0 : 1), // x
    isExtremity ? newNode.dx : 0, // dx
    oldY, // y
    isExtremity ? 0 : newNode.y + newNode.dy - oldY); // dy
};

/**
 * @param {epiviz.ui.charts.tree.UiNode} node
 * @returns {epiviz.ui.charts.tree.UiNode}
 * @private
 */
epiviz.ui.charts.tree.Facetzoom.prototype._getNewNode = function(node) {
  var oldNode = this._oldUiDataMap[node.id];
  var newNode = this._uiDataMap[node.id];
  if (newNode) { return newNode; }
  if (!oldNode) { return node; }
  var newDepth = oldNode.depth - this._rootDepth + this._oldRootDepth;
  var isRoot = newDepth < 0;
  var isExtremity = newDepth < 0 || newDepth >= this._subtreeDepth;
  var newY = isRoot ? 0 : Math.min(1, newDepth / this._subtreeDepth);
  return new epiviz.ui.charts.tree.UiNode(
    node.id, node.name, node.children, node.parentId, node.size, node.depth, node.nchildren, node.nleaves,
    isExtremity ? oldNode.x : (oldNode.x <= this._selectedNode.x ? 0 : 1), // x
    isExtremity ? oldNode.dx : 0, // dx
    newY, // y
    isExtremity ? 0 : oldNode.y + oldNode.dy - newY); // dy
};
