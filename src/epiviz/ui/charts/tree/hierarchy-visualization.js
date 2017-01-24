/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 12/2/2014
 * Time: 7:13 PM
 */


goog.provide('epiviz.ui.charts.tree.HierarchyVisualization');

goog.require('epiviz.ui.charts.DataStructureVisualization');
goog.require('epiviz.ui.charts.tree.NodeSelectionType');
goog.require('epiviz.ui.charts.tree.Node');
goog.require('epiviz.ui.charts.tree.UiNode');
goog.require('epiviz.ui.charts.VisEventArgs');

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
  this._selectedNodes = JSON.parse(this._customSettingsValues["nodeSel"]) || {};

  /**
   * @type {Object.<number, number>}
   * @private
   */
  this._selectedLevels = {};

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

  /**
   * @type {Array.<string>}
   * @private
   */
  this._levelsTaxonomy = null;

  this.selCutLevel = parseInt(this._customSettingsValues["aggLevel"]) || 3;

  this._selectedLevels[this.selCutLevel] = 2;

  this._firstRun = 0;
};

/**
 * @type {Object.<epiviz.ui.charts.tree.NodeSelectionType, string>}
 * @const
 */
epiviz.ui.charts.tree.HierarchyVisualization.SELECTION_CLASSES = {
  0: 'none-select',
  1: 'leaves-select',
  2: 'node-select'
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

  // If data is defined, then the base class sets this._lastData to data.
  // If it isn't, then we'll use the data from the last draw call
  root = this._lastData;
  range = this._lastRange;

  if(this._lastData.dataprovidertype != null && this._lastData.dataprovidertype == "websocket") {
    root = this._lastData.tree;
    range = this._lastRange;

    if(root) {

      self._selectedNodes = {};
      self._oldUiDataMap = null;
      self._uiDataMap = {};

      var selTypeKeys = Object.keys(this._lastData.nodeSelectionTypes);

      for(var i=0; i < selTypeKeys.length; i++) {
        if(this._lastData.nodeSelectionTypes[selTypeKeys[i]] != 1) {
            self._selectedNodes[selTypeKeys[i]] = this._lastData.nodeSelectionTypes[selTypeKeys[i]];
        }
      }

      self._selectedLevels = {};
      self._selectedLevels[this._lastData.selectionLevel] = 2;
    }

      this._lastData = root;
  }

  if (root) {
    this._oldRootDepth = this._rootDepth;
    this._rootDepth = root.depth;
    this._referenceNode = null;
    var uiSelected = root.children && root.children.length ? this._uiDataMap[root.children[0].id] : null;
    this._selectedNode = uiSelected ?
      new epiviz.ui.charts.tree.UiNode(uiSelected.id, uiSelected.name, uiSelected.children, uiSelected.parentId, uiSelected.size,
        uiSelected.depth, uiSelected.nchildren, uiSelected.nleaves, uiSelected.selectionType, uiSelected.order, uiSelected.globalDepth, uiSelected.taxonomy, uiSelected.x, uiSelected.dx, uiSelected.y, uiSelected.dy, uiSelected.parent, uiSelected.start, uiSelected.end) : null;

    this._oldSubtreeDepth = this._subtreeDepth;
    this._subtreeDepth = 0;
    
    // append new data to old data for hierarchy propogation
    if(this._oldUiDataMap == null) {
        this._oldUiDataMap = this._uiDataMap;
    }
    else {
      Object.keys(self._uiDataMap).forEach(function(uiDM) {
        self._oldUiDataMap[uiDM] = self._uiDataMap[uiDM];
      });
    }

    this._uiDataMap = {};

    var uiData = this._partition.nodes(root);
    this._uiData = [];
    var rootCopy = null;
    uiData.every(function(node) {
      if (node.id == root.id) {
        rootCopy = epiviz.ui.charts.tree.UiNode.deepCopy(node);
        return false; // break
      }
      return true;
    });
    var levelsTaxonomy = {};
    epiviz.ui.charts.tree.Node.dfs(rootCopy, function(node) {
      self._uiData.push(node);
      if (!(node.taxonomy in levelsTaxonomy)) { levelsTaxonomy[node.taxonomy] = node.taxonomy; }
    });
    this._levelsTaxonomy = Object.keys(levelsTaxonomy);

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

    if(Object.keys(self._selectedLevels).length == 0) {
      self._selectedLevels["3"] = 2;
    }
    else {
      self.selCutLevel = parseInt(Object.keys(self._selectedLevels)[0]);
    }

    Object.keys(self._selectedLevels).forEach(function(sel) {
        if (parseInt(sel) < self.selCutLevel) {
            self.selCutLevel = parseInt(sel);
        }
    });

    // get selectionType from oldUiData
    this._uiData.forEach(function(node) {
        if (self._oldUiDataMap[node.id] != null) {
            node.selectionType = self._oldUiDataMap[node.id].selectionType;
            self._updateSelectionAttribute(node, node.selectionType);
        }

        if(node.globalDepth == self.selCutLevel && node.selectionType != 0) {
          self._updateSelectionAttribute(node, 2);
        }
    }); 

    //update to give parent higher preference
    Object.keys(self._selectedNodes).forEach(function(sel) {
      if(self._uiDataMap[sel]) {
        self._updateSelectionAttribute(self._uiDataMap[sel], self._selectedNodes[sel]);
      }
    });
  }

  //this._drawLegend();

  return this._uiData;
};

/**
 * @param {epiviz.ui.charts.tree.UiNode} node
 * @protected
 */
epiviz.ui.charts.tree.HierarchyVisualization.prototype._calcNodeOrder = function(node) {
  if (node.id in this._nodesOrder) { return this._nodesOrder[node.id]; }
  if (node.id in this._uiDataMap) { return this._uiDataMap[node.id].order; }
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
    node.id, node.name, node.children, node.parentId, node.size, node.depth, node.nchildren, node.nleaves, node.selectionType, node.order, node.globalDepth, node.taxonomy,

    isExtremity ? newNode.x : (newNode.x <= this._referenceNode.x ? 0 : 1), // x
    isExtremity ? newNode.dx : 0, // dx
    oldY, // y
    isExtremity ? 0 : newNode.y + newNode.dy - oldY, // dy
    null,
    node.start,
    node.end
    ); 
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
    node.id, node.name, node.children, node.parentId, node.size, node.depth, node.nchildren, node.nleaves, node.selectionType, node.order, node.globalDepth, node.taxonomy,
    isExtremity ? oldNode.x : (oldNode.x <= this._selectedNode.x ? 0 : 1), // x
    isExtremity ? oldNode.dx : 0, // dx
    newY, // y
    isExtremity ? 0 : oldNode.y + oldNode.dy - newY, // dy
    null, 
    node.start,
    node.end
    ); 
};

/**
 * @private
 */
epiviz.ui.charts.tree.HierarchyVisualization.prototype._drawLegend = function() {
  this._svg.selectAll('.chart-title').remove();
  this._svg.selectAll('.chart-title-color').remove();
  if (!this._levelsTaxonomy) { return; }
  var self = this;
  var titleEntries = this._svg
    .selectAll('.chart-title')
    .data(this._levelsTaxonomy);
  titleEntries
    .enter()
    .append('text')
    .attr('class', 'chart-title')
    .attr('font-weight', 'bold')
    .attr('y', this.margins().top() - 5);
  titleEntries
    .attr('fill', function(label) { return self.colors().getByKey(label); })
    .text(function(label) { return label; });

  var textLength = 0;
  var titleEntriesStartPosition = [];

  $('#' + this.id() + ' .chart-title')
    .each(function(i) {
      titleEntriesStartPosition.push(textLength);
      textLength += this.getBBox().width + 15;
    });

  titleEntries.attr('x', function(column, i) {
    return self.margins().left() + 10 + titleEntriesStartPosition[i];
  });

  var colorEntries = this._svg
    .selectAll('.chart-title-color')
    .data(this._levelsTaxonomy)
    .enter()
    .append('circle')
    .attr('class', 'chart-title-color')
    .attr('cx', function(column, i) { return self.margins().left() + 4 + titleEntriesStartPosition[i]; })
    .attr('cy', self.margins().top() - 9)
    .attr('r', 4)
    .style('shape-rendering', 'auto')
    .style('stroke-width', '0')
    .style('fill', function(label) { return self.colors().getByKey(label); });
};

/**
 * @returns {Array.<string>}
 */
epiviz.ui.charts.tree.HierarchyVisualization.prototype.levelsTaxonomy = function() { return this._levelsTaxonomy; };

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
 */
epiviz.ui.charts.tree.HierarchyVisualization.prototype.selectNode = function(node) {
  var selectionType = (node.selectionType + 1) % 3;
  this._selectedNodes[node.id] = selectionType;

  var self = this;

  function setDisplay(nes) {

    nes.selectionType = selectionType;
    self._changeNodeSelection(nes, selectionType);

    if(nes.children.length == 0) {
      return;
    }
    else {
      nes.children.forEach(function(n) {
        setDisplay(n);
      });
    }
  }

  setDisplay(node);

  // this._changeNodeSelection(node, selectionType);

  if (this.autoPropagateChanges()) {
    this.firePropagateHierarchyChanges();
  }

  return selectionType;
};

/**
 * @param {number} level
 */
epiviz.ui.charts.tree.HierarchyVisualization.prototype.selectLevel = function(level) {
  var self = this;
  var deselectedNodeIds = [];
  var deselectedNodes = [];
  $.each(this._selectedNodes, function(nodeId, selectionType) {
    /** @type {epiviz.ui.charts.tree.UiNode} */
    var node = self._uiDataMap[nodeId];
    if (node != undefined && node.globalDepth == level) {
      deselectedNodeIds.push(nodeId);
      deselectedNodes.push(node);
    }
  });
  deselectedNodeIds.forEach(function(nodeId) { delete self._selectedNodes[nodeId]; });

  var tLevel;

  if (!(level in this._selectedLevels)) {

    var currentLevel = Object.keys(self._selectedLevels)[0]

    self._changeLevelSelection(this._levelsTaxonomy[currentLevel], 1);

      //propogate level selection to nodes
    self._uiData.forEach(function(node) {
      if (node.globalDepth == currentLevel && node.selectionType != 0) {
          self._updateSelectionAttribute(node, 1);
          self._uiDataMap[node.id] == node.selectionType;
      }
    });

    for(var nodeId in  self._oldUiDataMap) {
      var node = self._oldUiDataMap[nodeId];
      if (node.globalDepth == currentLevel && node.selectionType != 0) {
          self._updateSelectionAttribute(node, 1);
          self._oldUiDataMap[nodeId] == 1;
      }
    }

    this._selectedLevels = {};

    tLevel = 2;
    this._selectedLevels[level] = epiviz.ui.charts.tree.NodeSelectionType.NODE;
  } else {
    
    var tLevel = (this._selectedLevels[level] + 1) % 3;

    if (tLevel == 0) {
      tLevel = 1;
    }
    this._selectedLevels[level] = tLevel;
  }

  deselectedNodes.forEach(function(tn) {
    self._changeNodeSelection(tn, tLevel);
  });

  self._changeLevelSelection(self._levelsTaxonomy[level], tLevel);

  //propogate level selection to nodes
  self._uiData.forEach(function(node) {
    if (node.globalDepth == level) {
        node.selectionType = self._selectedLevels[level.toString()];
        self._updateSelectionAttribute(node, node.selectionType);
        self._uiDataMap[node.id] == node.selectionType;
    }
  });

  for(var nodeId in  self._oldUiDataMap) {
      var node = self._oldUiDataMap[nodeId];
      if (node.globalDepth == level) {
        node.selectionType = self._selectedLevels[level.toString()];
          self._updateSelectionAttribute(node, node.selectionType);
          self._oldUiDataMap[nodeId] == node.selectionType;
      }
    }

  if (this.autoPropagateChanges()) {
    this.firePropagateHierarchyChanges();
  }
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

epiviz.ui.charts.tree.HierarchyVisualization.prototype._changeLevelSelection = function(level, selectionType) {
  var selectionClasses = epiviz.ui.charts.tree.HierarchyVisualization.SELECTION_CLASSES;
  var item = this._svg.select('#' + this.id() + '-' + level);

  for (var t in selectionClasses) {
    if (!selectionClasses.hasOwnProperty(t)) { continue; }
    item.classed(selectionClasses[t], false);
  }
  item.classed('custom-select', false);
  item.classed(selectionClasses[selectionType], true);
};

/**
 */
epiviz.ui.charts.tree.HierarchyVisualization.prototype.firePropagateHierarchyChanges = function() {
  var selectedNodes = this._selectedNodes;
  var nodesOrder = this._nodesOrder;
  var selectedLevels = this._selectedLevels;
  //this._selectedNodes = {};
  //this._nodesOrder = {};
  this.onPropagateHierarchyChanges().notify(new epiviz.ui.charts.VisEventArgs(
    this.id(),
    new epiviz.ui.controls.VisConfigSelection(undefined, undefined, this.datasourceGroup(), this.dataprovider(), undefined, undefined, undefined,
      {selection: selectedNodes, order: nodesOrder, selectedLevels: selectedLevels})));
};

/**
 */
epiviz.ui.charts.tree.HierarchyVisualization.prototype.fireRequestHierarchy = function() {
  var nodeId = null;
  if (this._lastData && this._lastData.children) {
    if (this._lastData.children.length == 1) {
      nodeId = this._lastData.children[0].id;
    } else {
      nodeId = this._lastData.id;
    }
  }
  this.onRequestHierarchy().notify(new epiviz.ui.charts.VisEventArgs(
    this.id(),
    new epiviz.ui.controls.VisConfigSelection(undefined, undefined, this.datasourceGroup(), this.dataprovider(), undefined, undefined, undefined, nodeId)));
};

/**
 * @param {boolean} val
 */
epiviz.ui.charts.tree.HierarchyVisualization.prototype.setAutoPropagateChanges = function(val) {
  epiviz.ui.charts.Visualization.prototype.setAutoPropagateChanges.call(this, val);
  if (val) { this.firePropagateHierarchyChanges(); }
};


/**
 * @param {epiviz.ui.charts.tree.UiNode} node
 * @param {number} selectionType
 */
epiviz.ui.charts.tree.HierarchyVisualization.prototype._updateSelectionAttribute = function(node, selectionType) {

  var self = this;

  function setDisplay(nes, sType) {

    if(nes.selectionType != 0) {
      nes.selectionType = sType;
    }

    self._changeNodeSelection(nes, nes.selectionType);

    if(nes.children.length == 0) {
      return;
    }
    else {
      nes.children.forEach(function(n) {
        setDisplay(n, nes.selectionType);
      });
    }
  }

  setDisplay(node, selectionType);
};
