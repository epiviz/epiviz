/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/7/2014
 * Time: 7:18 PM
 */

goog.provide('epiviz.ui.charts.tree.Sunburst');

goog.require('epiviz.ui.charts.Visualization');
goog.require('epiviz.ui.charts.VisEventArgs');


/**
 * @param {string} id
 * @param {jQuery} container
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @constructor
 * @extends {epiviz.ui.charts.Visualization.<epiviz.ui.charts.tree.Node>}
 */
epiviz.ui.charts.tree.Sunburst = function(id, container, properties) {

  // epiviz.ui.charts.Visualization.call(this, id, container, properties);
  epiviz.ui.charts.tree.HierarchyVisualization.call(this, id, container, properties);
  // Sunburst specific
  this.type = "Sunburst";

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
   * @type {number}
   * @private
   */
  this._radius = null;

  /**
   * Converts y values for a partition (depth) to circle radius
   * @type {function(number): number}
   * @private
   */
  this._y = null;

  var self = this;
  /**
   * Generates an arc given a ui node
   * @type {function(epiviz.ui.charts.tree.UiNode): string}
   */
  this._arc = d3.svg.arc()
    .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, self._x(d.x))); })
    .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, self._x(d.x + d.dx))); })
    .innerRadius(function(d) { return Math.max(0, self._y(d.y)); })
    .outerRadius(function(d) { return Math.max(0, self._y(d.y + d.dy)); });

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
// epiviz.ui.charts.tree.Sunburst.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.tree.HierarchyVisualization.prototype);
epiviz.ui.charts.tree.Sunburst.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.tree.HierarchyVisualization.prototype);
epiviz.ui.charts.tree.Sunburst.constructor = epiviz.ui.charts.tree.Sunburst;

/**
 * Initializes the chart and draws the initial SVG in the container
 * @protected
 */
epiviz.ui.charts.tree.Sunburst.prototype._initialize = function() {
  epiviz.ui.charts.tree.HierarchyVisualization.prototype._initialize.call(this);

  this._radius = Math.min(this.width(), this.height()) * 0.5;
  this._y = d3.scale.pow().exponent(1.2)
    .range([0, this._radius]);
};


/**
 * @param {epiviz.ui.charts.tree.Node} [root]
 * @returns {Array.<epiviz.ui.charts.VisObject>}
 */
epiviz.ui.charts.tree.Sunburst.prototype.draw = function(root) {
  epiviz.ui.charts.tree.HierarchyVisualization.prototype.draw.call(this, root);

  var self = this;

  if (root) {
    this._oldRootDepth = this._rootDepth;
    this._rootDepth = root.depth;
    this._referenceNode = null;
    this._selectedNode = this._uiDataMap[root.id];

    this._uiData = this._partition.nodes(root);
    this._oldSubtreeDepth = this._subtreeDepth;
    this._subtreeDepth = 0;
    this._oldUiDataMap = this._uiDataMap;
    this._uiDataMap = {};
    this._uiData.forEach(function(node) {
      self._uiDataMap[node.id] = node;
      if ((!self._referenceNode || !self._referenceNode.x) && (node.id in self._oldUiDataMap)) {
        self._referenceNode = node;
      }
      if (self._subtreeDepth < node.depth + 1) {
        self._subtreeDepth = node.depth + 1;
      }
    });
    if (!this._referenceNode) { this._referenceNode = this._uiData[0]; }
    if (this._oldSubtreeDepth == null) { this._oldSubtreeDepth = this._subtreeDepth; }
    if (this._oldRootDepth == null) { this._oldRootDepth = this._rootDepth; }
  } else {
    root = this._lastData;
  }

  var width = this.width();
  var height = this.height();

  var canvas = this._svg.select('.Sunburst-canvas');
  if (canvas.empty()) {
    canvas = this._svg.append('g')
      .attr('class', 'Sunburst-canvas')
      .attr('transform', sprintf('translate(%s,%s) rotate(180)', width * 0.5, height * 0.5));
  }

  if (!root) { return; }

  var groups = canvas.selectAll('g')
    .data(this._uiData, function(d) { return d.id; });

  var newGroups = groups
    .enter().append('g')
    .on('click', function(d) { self._select.notify(new epiviz.ui.charts.VisEventArgs(self.id(), d)); });

  var newPaths = newGroups.append('path')
    .attr('id', function(d) { return self.id() + '-' + d.id; })
    .attr('class', 'node-arc')
    .style('fill', function(d) { return self.colors().getByKey((d.children && d.children.length ? d : d.parent).id); })
    .on('mouseover', function(d) { self._hover.notify(new epiviz.ui.charts.VisEventArgs(self.id(), d)); })
    .on('mouseout', function() { self._unhover.notify(new epiviz.ui.charts.VisEventArgs(self.id())); });

  var newLabels = newGroups.append('text')
    .attr('class', 'unselectable-text node-label')
    .append('textPath')
    .attr('xlink:href', function(d) { return '#' + self.id() + '-' + d.id; })
    .attr("dx", "6") // margin
    .attr("dy", ".35em") // vertical-align
    .attr('startOffset', 20)
    .text(function(d) { return d.name; });

  canvas.selectAll('g').selectAll('path')
    .transition().duration(this._animationDelay)
    .attrTween('d', function(d) { return self._nodeArcTween(d); });

  canvas.selectAll('g').selectAll('text')
    .transition().duration(this._animationDelay)
    .attrTween('transform', function(d) { return self._nodeLabelTransformTween(d); })
    .each(function(d) {
      d3.select(this.childNodes[0])
        .transition().duration(self._animationDelay)
        .attrTween('startOffset', function(d) { return self._nodeLabelStartOffsetTween(d); });
    });

  groups.exit()
    .selectAll('text').transition().duration(this._animationDelay).style('opacity', 0);
  groups.exit().transition().delay(this._animationDelay).remove();

  return this._uiData;
};

/**
 * @param {epiviz.ui.charts.tree.UiNode} node
 * @returns {function(number): epiviz.ui.charts.tree.UiNode}
 * @private
 */
epiviz.ui.charts.tree.Sunburst.prototype._nodeTween = function(node) {
  var self = this;
  var oldNode = this._oldUiDataMap[node.id];
  var newNode = this._uiDataMap[node.id];

  if (!oldNode && !newNode) {
    return function(t) {
      return node;
    };
  }

  var isRoot, isExtremity;

  // this node will be added
  if (!oldNode) {
    var oldDepth = newNode.depth + this._rootDepth - this._oldRootDepth;
    isRoot = oldDepth < 0;
    isExtremity = oldDepth < 0 || oldDepth >= this._subtreeDepth;
    var oldY = isRoot ? 0 : Math.min(1, oldDepth / this._oldSubtreeDepth);
    oldNode = {
      x: isExtremity ? newNode.x : (newNode.x <= this._referenceNode.x ? 0 : 1),
      dx: isRoot ? 1 : (isExtremity ? newNode.dx : 0),
      y: oldY,
      dy: isExtremity ? 0 : newNode.y + newNode.dy - oldY
    };
  }

  // this node will be removed
  if (!newNode) {
    var newDepth = oldNode.depth - this._rootDepth + this._oldRootDepth;
    isRoot = newDepth < 0;
    isExtremity = newDepth < 0 || newDepth >= this._subtreeDepth;
    var newY = isRoot ? 0 : Math.min(1, newDepth / this._subtreeDepth);
    newNode = {
      x: isExtremity ? oldNode.x : (oldNode.x <= this._selectedNode.x ? 0 : 1),
      dx: isRoot ? 1 : (isExtremity ? oldNode.dx : 0),
      y: newY,
      dy: isExtremity ? 0 : oldNode.y + oldNode.dy - newY
    };
  }

  var xi = d3.interpolate(oldNode.x, newNode.x);
  var dxi = d3.interpolate(oldNode.dx, newNode.dx);
  var yi = d3.interpolate(oldNode.y, newNode.y);
  var dyi = d3.interpolate(oldNode.dy, newNode.dy);
  return function(t) {
    return {x: xi(t), dx: dxi(t), y: yi(t), dy: dyi(t)};
  };
};

/**
 * @param {epiviz.ui.charts.tree.UiNode} node
 * @returns {function(number): string}
 * @private
 */
epiviz.ui.charts.tree.Sunburst.prototype._nodeArcTween = function(node) {
  var self = this;
  /** @type {function(number): epiviz.ui.charts.tree.UiNode} */
  var nodeTween = this._nodeTween(node);
  return function(t) { return self._arc(nodeTween(t)); };
};

/**
 * @param {epiviz.ui.charts.tree.UiNode} node
 * @returns {function(number): string}
 * @private
 */
epiviz.ui.charts.tree.Sunburst.prototype._nodeLabelTransformTween = function(node) {
  var self = this;
  /** @type {function(number): epiviz.ui.charts.tree.UiNode} */
  var nodeTween = this._nodeTween(node);
  return function(t) {
    var dt = nodeTween(t);
    var dx = dt.dx == 1 ? 0 : dt.dx;
    var phi = self._x(dt.x + dx / 2);
    var z = (self._y(dt.y + dt.dy) - self._y(dt.y)) / 2;
    var ty = Math.cos(phi) * z;
    var tx = Math.sin(phi) * z;
    return 'rotate(' + (dt.dx == 1 ? 180 : 0) + ') translate(' + -tx + ',' + ty + ')';
  };
};

/**
 * @param {epiviz.ui.charts.tree.UiNode} node
 * @returns {function(number): string}
 * @private
 */
epiviz.ui.charts.tree.Sunburst.prototype._nodeLabelStartOffsetTween = function(node) {
  var self = this;
  /** @type {function(number): epiviz.ui.charts.tree.UiNode} */
  var nodeTween = this._nodeTween(node);
  return function(t) {
    var dt = nodeTween(t);
    var py = self._y(dt.y + dt.dy);
    return py * self._x(dt.dx / 2);
  };
};

/**
 * @param {epiviz.ui.charts.tree.UiNode} node
 * @returns {string}
 * @private
 */
epiviz.ui.charts.tree.Sunburst.prototype._nodeLabelTransform = function(node) {
  // Bug in D3.js, making arcs start point be in a different location when the arc transforms into a circle:
  var dx = node.dx == 1 ? 0 : node.dx;

  var y0 = this._y(node.y);
  var y1 = this._y(node.y + node.dy);
  var phi = this._x(node.x + dx / 2);
  var z = (y1 - y0) / 2;
  var ty = Math.cos(phi) * z;
  var tx = Math.sin(phi) * z;
  return 'rotate(' + (node.dx == 1 ? 180 : 0) + ') translate(' + -tx + ',' + ty + ')';
};

/**
 * @param {epiviz.ui.charts.tree.UiNode} node
 * @returns {number}
 * @private
 */
epiviz.ui.charts.tree.Sunburst.prototype._nodeLabelStartOffset = function(node) {
  var py = this._y(node.y + node.dy);
  return py * this._x(node.dx / 2);
};
