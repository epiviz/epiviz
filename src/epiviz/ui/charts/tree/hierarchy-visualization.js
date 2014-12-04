/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 12/2/2014
 * Time: 7:13 PM
 */


goog.provide('epiviz.ui.charts.tree.HierarchyVisualization');

/**
 * @param {string} id
 * @param {jQuery} container The div where the chart will be drawn
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @extends {epiviz.ui.charts.DataStructureVisualization.<epiviz.ui.charts.tree.Node>}
 * @constructor
 */
epiviz.ui.charts.tree.HierarchyVisualization = function(id, container, properties) {
  // Call superclass constructor
  epiviz.ui.charts.DataStructureVisualization.call(this, id, container, properties);

  // Selection

  /**
   * @type {Object.<string, epiviz.ui.charts.tree.NodeSelectionType>}
   * @private
   */
  this._selectedNodes = {};

  /**
   * @type {Object.<string, number>}
   * @private
   */
  this._nodesOrder = {};

  /**
   * @type {boolean}
   * @private
   */
  this._selectMode = false;

  // Animation

  var self = this;
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
    .sort(function(d1, d2) { return (self._calcNodeOrder(d1) || 0) - (self._calcNodeOrder(d2) || 0); }); // Take predefined order into account

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
   * @protected
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
};

/**
 * @type {Object.<epiviz.ui.charts.tree.NodeSelectionType, string>}
 * @const
 */
epiviz.ui.charts.tree.HierarchyVisualization.SELECTION_CLASSES = {
  0: 'none-select',
  1: 'node-select',
  2: 'leaves-select',
  3: 'custom-select'
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.tree.HierarchyVisualization.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.DataStructureVisualization.prototype);
epiviz.ui.charts.tree.HierarchyVisualization.constructor = epiviz.ui.charts.tree.HierarchyVisualization;

/**
 * @param {epiviz.datatypes.Range} [range]
 * @param {epiviz.ui.charts.tree.Node} [root]
 * @returns {Array.<epiviz.ui.charts.VisObject>}
 */
epiviz.ui.charts.tree.HierarchyVisualization.prototype.draw = function(range, root) {
  epiviz.ui.charts.DataStructureVisualization.prototype.draw.call(this, range, root);

  var self = this;

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
  }

  return this._uiData;
};

/**
 * @param {epiviz.ui.charts.tree.UiNode} node
 * @protected
 */
epiviz.ui.charts.tree.HierarchyVisualization.prototype._calcNodeOrder = function(node) {
  if (node.id in this._nodesOrder) { return this._nodesOrder[node.id]; }
  return node.order;
};

/**
 * @param {epiviz.ui.charts.tree.UiNode} node
 * @returns {epiviz.ui.charts.tree.UiNode}
 * @protected
 */
epiviz.ui.charts.tree.HierarchyVisualization.prototype._getOldNode = function(node) {
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
 * @protected
 */
epiviz.ui.charts.tree.HierarchyVisualization.prototype._getNewNode = function(node) {
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
epiviz.ui.charts.tree.HierarchyVisualization.prototype.selectMode = function() { return this._selectMode; };

/**
 * @param {boolean} mode
 */
epiviz.ui.charts.tree.HierarchyVisualization.prototype.setSelectMode = function(mode) { this._selectMode = mode; };

/**
 * @param {epiviz.ui.charts.tree.UiNode} node
 * @param {epiviz.ui.charts.tree.NodeSelectionType} selectionType
 */
epiviz.ui.charts.tree.HierarchyVisualization.prototype.selectNode = function(node, selectionType) {
  this._selectedNodes[node.id] = selectionType;

  this._changeNodeSelection(node, selectionType);
};

/**
 * @returns {Object.<string, epiviz.ui.charts.tree.NodeSelectionType>}
 */
epiviz.ui.charts.tree.HierarchyVisualization.prototype.selectedNodes = function() { return this._selectedNodes; };

/**
 * @returns {Object.<string, number>}
 */
epiviz.ui.charts.tree.HierarchyVisualization.prototype.nodesOrder = function() { return this._nodesOrder; };

/**
 * @param {epiviz.ui.charts.tree.UiNode} node
 * @param {epiviz.ui.charts.tree.NodeSelectionType} selectionType
 * @private
 */
epiviz.ui.charts.tree.HierarchyVisualization.prototype._changeNodeSelection = function(node, selectionType) {
  var selectionClasses = epiviz.ui.charts.tree.HierarchyVisualization.SELECTION_CLASSES;
  var item = this._svg.select('#' + this.id() + '-' + node.id);

  for (var t in selectionClasses) {
    if (!selectionClasses.hasOwnProperty(t)) { continue; }
    item.classed(selectionClasses[t], false);
  }
  item.classed(selectionClasses[selectionType], true);
};

/**
 */
epiviz.ui.charts.tree.HierarchyVisualization.prototype.firePropagateHierarchyChanges = function() {
  var selectedNodes = this._selectedNodes;
  var nodesOrder = this._nodesOrder;
  this._selectedNodes = {};
  this._nodesOrder = {};
  this.onPropagateHierarchyChanges().notify(new epiviz.ui.charts.VisEventArgs(
    this.id(),
    new epiviz.ui.controls.VisConfigSelection(undefined, undefined, this.datasourceGroup(), this.dataprovider(), undefined, undefined, undefined,
      {selection: selectedNodes, order: nodesOrder})));
};
