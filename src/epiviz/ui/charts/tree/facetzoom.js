/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/7/2014
 * Time: 7:18 PM
 */

goog.provide('epiviz.ui.charts.tree.Facetzoom');

/**
 * @param {string} id
 * @param {jQuery} container
 * @param {epiviz.ui.charts.ChartProperties} properties
 * @constructor
 * @extends {epiviz.ui.charts.Visualization.<epiviz.ui.charts.tree.Node>}
 */
epiviz.ui.charts.tree.Facetzoom = function(id, container, properties) {

  epiviz.ui.charts.Visualization.call(this, id, container, properties);

  /**
   * @type {string}
   * @private
   */
  this._datasourceGroup = properties.visConfigSelection.datasourceGroup;

  /**
   * @type {string}
   * @private
   */
  this._dataprovider = properties.visConfigSelection.dataprovider;

  if (!this._dataprovider) {
    var self = this;
    properties.visConfigSelection.measurements.foreach(function(m) {
      if (m.dataprovider()) { self._dataprovider = m.dataprovider(); return true; }
    })
  }

  // Selection

  /**
   * @type {Object.<string, epiviz.ui.charts.tree.NodeSelectionType>}
   * @private
   */
  this._selectedNodes = {};

  /**
   * @type {boolean}
   * @private
   */
  this._selectMode = false;

  // Events

  /**
   * @type {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<Object.<string, epiviz.ui.charts.tree.NodeSelectionType>>>}
   * @private
   */
  this._propagateSelection = new epiviz.events.Event();

  // Animation

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
    // function(d) { return d.nleaves; }) // If we want the size of the nodes to reflect the number of leaves under them
    function(d) { return 1; }) // If we want the size of the nodes to reflect only the number of leaves in the current subtree
    //.sort(function() { return 0; }); // No reordering of the nodes
    .sort(function(d1, d2) { return (d1.order || 0) - (d2.order || 0); }); // Take predefined order into account

  /**
   * The number of milliseconds for animations within the chart
   * @type {number}
   * @private
   */
  this._animationDelay = 750;

  /**
   * Used to measure maximum number of chars to display
   * @type {number}
   * @private
   */
  this._charWidth = 10;

  /**
   * Used to clip labels that are too long
   * @type {number}
   * @private
   */
  this._nodeMargin = 3;

  /**
   * Size of icons on nodes. This should be the same as the font size of ".facetzoom .icon" in svg.css
   * @type {number}
   * @private
   */
  this._iconSize = 16;

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
 * @returns {epiviz.ui.charts.VisualizationType.DisplayType}
 */
epiviz.ui.charts.tree.Facetzoom.prototype.displayType = function() { return epiviz.ui.charts.VisualizationType.DisplayType.METADATA; };

/**
 * @type {Object.<epiviz.ui.charts.tree.NodeSelectionType, string>}
 * @const
 */
epiviz.ui.charts.tree.Facetzoom.SELECTION_CLASSES = {
  0: 'none-select',
  1: 'node-select',
  2: 'leaves-select',
  3: 'custom-select'
};

/**
 * Initializes the chart and draws the initial SVG in the container
 * @protected
 */
epiviz.ui.charts.tree.Facetzoom.prototype._initialize = function() {
  epiviz.ui.charts.Visualization.prototype._initialize.call(this);

  this.container().addClass('facetzoom-container ui-widget-content');

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
    var uiSelected = root.children && root.children.length ? this._uiDataMap[root.children[0].id] : null;
    this._selectedNode = uiSelected ?
      new epiviz.ui.charts.tree.UiNode(uiSelected.id, uiSelected.name, uiSelected.children, uiSelected.parentId, uiSelected.size,
        uiSelected.depth, uiSelected.nchildren, uiSelected.nleaves, uiSelected.selectionType, uiSelected.x, uiSelected.dx, uiSelected.y, uiSelected.dy, uiSelected.parent) : null;

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
  var yScale = d3.scale.pow().exponent(1.5).range([0, height - this.margins().sumAxis(Axis.Y)]);

  var canvas = this._svg.select('.canvas');
  var defs = this._svg.select('.defs');
  if (canvas.empty()) {
    canvas = this._svg.append('g')
      .attr('class', 'canvas')
      .attr('transform', sprintf('translate(%s,%s)', this.margins().left(), this.margins().top()));
  }
  if (defs.empty()) {
    defs = this._svg.select('defs').append('g')
      .attr('class', 'defs')
      .attr('transform', sprintf('translate(%s,%s)', this.margins().left(), this.margins().top()));
  }

  if (!root) { return []; }

  var calcOldWidth = function(d) { var node = self._getOldNode(d); return xScale(node.x + node.dx) - xScale(node.x); };
  var calcOldHeight = function(d) { var node = self._getOldNode(d); return yScale(node.y + node.dy) - yScale(node.y); };
  var calcOldX = function(d) { return xScale(self._getOldNode(d).x); };
  var calcOldY = function(d) { return yScale(self._getOldNode(d).y); };
  var calcNewWidth = function(d) { var node = self._getNewNode(d); return xScale(node.x + node.dx) - xScale(node.x); };
  var calcNewHeight = function(d) { var node = self._getNewNode(d); return yScale(node.y + node.dy) - yScale(node.y); };
  var calcNewX = function(d) { return xScale(self._getNewNode(d).x); };
  var calcNewY = function(d) { return yScale(self._getNewNode(d).y); };

  var items = canvas.selectAll('g')
    .data(this._uiData, function(d) { return d.id; });

  var clips = defs.selectAll('clipPath')
    .data(this._uiData, function(d) { return d.id; });

  var newItems = items
    .enter().append('g')
    .attr('id', function(d) { return self.id() + '-' + d.id; })
    .attr('class', function(d) {
      var selectionType = self._selectedNodes[d.id];
      if (selectionType == undefined) { selectionType = d.selectionType || 0; }
      return 'item ' + epiviz.ui.charts.tree.Facetzoom.SELECTION_CLASSES[selectionType];
    })
    .on('click', function(d) {
      //self._select.notify(new epiviz.ui.charts.VisEventArgs(self.id(), d));
      if (self._selectMode) {
        var selectionType = d.selectionType || 0;
        selectionType = (selectionType + 1) % 3;
        d.selectionType = selectionType;
        self.selectNode(d, selectionType);
      } else {
        self._requestMetadata.notify(new epiviz.ui.charts.VisEventArgs(
          self.id(),
          new epiviz.ui.controls.VisConfigSelection(undefined, undefined, self.datasourceGroup(), self.dataprovider(), undefined, undefined, undefined, d.id)));
      }
    });

  var newClips = clips
    .enter().append('clipPath')
    .attr('id', function(d) { return self.id() + '-clip-' + d.id; })
    .append('rect')
    .attr('x', function(d) { return calcOldX(d) + self._nodeMargin; })
    .attr('y', function(d) { return calcOldY(d) + self._nodeMargin; })
    .attr('width', function(d) { return Math.max(0, calcOldWidth(d) - 2 * self._nodeMargin); })
    .attr('height', function(d) { return Math.max(0, calcOldHeight(d) - 2 * self._nodeMargin); });

  var newRects = newItems.append('rect')
    .style('fill', function(d) { return self.colors().getByKey((d.nchildren ? d : d.parent).id); })
    .attr('x', calcOldX)
    .attr('y', calcOldY)
    .attr('width', calcOldWidth)
    .attr('height', calcOldHeight);

  var newLabels = newItems.append('text')
    .attr('class', 'unselectable-text node-label')
    .attr('clip-path', function(d) { return 'url(#' + self.id() + '-clip-' + d.id + ')'; })
    .text(function(d) {
      var w = calcOldWidth(d);
      var maxChars = w / self._charWidth;
      if (maxChars < d.name.length - 3) {
        return d.name.substring(0, maxChars) + '...';
      }
      return d.name;
    })
    .attr('x', function(d) { return calcOldX(d) + calcOldWidth(d) * 0.5; })
    .attr('y', function(d) { return calcOldY(d) + calcOldHeight(d) * 0.5; });

  var newIcons = newItems.append("svg:foreignObject")
    .attr('class', 'icon-container')
    .attr('clip-path', function(d) { return 'url(#' + self.id() + '-clip-' + d.id + ')'; })
    .attr('width', this._iconSize)
    .attr('height', this._iconSize)
    .attr('x', function(d) { return calcOldX(d) + self._nodeMargin; })
    .attr('y', function(d) { return calcOldY(d) + calcOldHeight(d) - self._nodeMargin - self._iconSize; })
    .append('xhtml:span')
    .attr('class', 'unselectable-text icon');


  defs.selectAll('rect')
    .transition().duration(this._animationDelay)
    .attr('x', function(d) { return calcNewX(d) + self._nodeMargin; })
    .attr('y', function(d) { return calcNewY(d) + self._nodeMargin; })
    .attr('width', function(d) { return Math.max(0, calcNewWidth(d) - 2 * self._nodeMargin); })
    .attr('height', function(d) { return Math.max(0, calcNewHeight(d) - 2 * self._nodeMargin); });

  canvas.selectAll('g').selectAll('rect')
    .transition().duration(this._animationDelay)
    .attr('x', calcNewX)
    .attr('y', calcNewY)
    .attr('width', calcNewWidth)
    .attr('height', calcNewHeight);

  canvas.selectAll('g').selectAll('.node-label')
    .transition().duration(this._animationDelay)
    .attr('x', function(d) { return calcNewX(d) + calcNewWidth(d) * 0.5; })
    .attr('y', function(d) { return calcNewY(d) + calcNewHeight(d) * 0.5; })
    .tween('text', function(d) {
      var w = d3.interpolate(calcOldWidth(d), calcNewWidth(d));
      return function(t) {
        var maxChars = Math.round(w(t) / self._charWidth);
        if (maxChars < d.name.length - 3) {
          this.textContent = d.name.substring(0, maxChars) + '...';
          return;
        }
        this.textContent = d.name;
      };
    });

  canvas.selectAll('g').selectAll('.icon-container')
    .transition().duration(this._animationDelay)
    .attr('x', function(d) { return calcNewX(d) + self._nodeMargin; })
    .attr('y', function(d) { return calcNewY(d) + calcNewHeight(d) - self._nodeMargin - self._iconSize; });

  items.exit()
    .selectAll('.node-label').transition().duration(this._animationDelay)
    .attr('x', function(d) { return calcNewX(d) + calcNewWidth(d) * 0.5; })
    .attr('y', function(d) { return calcNewY(d) + calcNewHeight(d) * 0.5; });
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
    node.id, node.name, node.children, node.parentId, node.size, node.depth, node.nchildren, node.nleaves, node.selectionType,

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
    node.id, node.name, node.children, node.parentId, node.size, node.depth, node.nchildren, node.nleaves, node.selectionType,
    isExtremity ? oldNode.x : (oldNode.x <= this._selectedNode.x ? 0 : 1), // x
    isExtremity ? oldNode.dx : 0, // dx
    newY, // y
    isExtremity ? 0 : oldNode.y + oldNode.dy - newY); // dy
};

/**
 * @returns {boolean}
 */
epiviz.ui.charts.tree.Facetzoom.prototype.selectMode = function() { return this._selectMode; };

/**
 * @param {boolean} mode
 */
epiviz.ui.charts.tree.Facetzoom.prototype.setSelectMode = function(mode) { this._selectMode = mode; };


/**
 * @param {epiviz.ui.charts.tree.UiNode} node
 * @param {epiviz.ui.charts.tree.NodeSelectionType} selectionType
 */
epiviz.ui.charts.tree.Facetzoom.prototype.selectNode = function(node, selectionType) {
  this._selectedNodes[node.id] = selectionType;

  // TODO: Later on, we will have controls that set all children in a subtree
  this._changeNodeSelection(node, selectionType);
};

/**
 * @param {epiviz.ui.charts.tree.UiNode} node
 * @param {epiviz.ui.charts.tree.NodeSelectionType} selectionType
 */
epiviz.ui.charts.tree.Facetzoom.prototype._changeNodeSelection = function(node, selectionType) {
  var selectionClasses = epiviz.ui.charts.tree.Facetzoom.SELECTION_CLASSES;
  var item = this._svg.select('#' + this.id() + '-' + node.id);

  for (var t in selectionClasses) {
    if (!selectionClasses.hasOwnProperty(t)) { continue; }
    item.classed(selectionClasses[t], false);
  }
  item.classed(selectionClasses[selectionType], true);
};

/**
 */
epiviz.ui.charts.tree.Facetzoom.prototype.firePropagateSelection = function() {
  var selectedNodes = this._selectedNodes;
  this._selectedNodes = {};
  this._propagateSelection.notify(new epiviz.ui.charts.VisEventArgs(
    this.id(),
    new epiviz.ui.controls.VisConfigSelection(undefined, undefined, this.datasourceGroup(), this.dataprovider(), undefined, undefined, undefined, selectedNodes)));
};

/**
 * @returns {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<Object.<string, epiviz.ui.charts.tree.NodeSelectionType>>>}
 */
epiviz.ui.charts.tree.Facetzoom.prototype.onPropagateSelection = function() { return this._propagateSelection; };

/**
 * @returns {string}
 */
epiviz.ui.charts.tree.Facetzoom.prototype.datasourceGroup = function() { return this._datasourceGroup; };

/**
 * @returns {string}
 */
epiviz.ui.charts.tree.Facetzoom.prototype.dataprovider = function() { return this._dataprovider; };
