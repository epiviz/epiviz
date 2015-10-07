/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/7/2014
 * Time: 7:18 PM
 */

goog.provide('epiviz.ui.charts.tree.Icicle');

/**
 * @param {string} id
 * @param {jQuery} container
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @constructor
 * @extends {epiviz.ui.charts.tree.HierarchyVisualization}
 */
epiviz.ui.charts.tree.Icicle = function(id, container, properties) {

  epiviz.ui.charts.tree.HierarchyVisualization.call(this, id, container, properties);

  // Animation

  /**
   * The number of milliseconds for animations within the chart
   * @type {number}
   * @private
   */
  this._animationDelay = 750;

  /**
   * @type {boolean}
   * @private
   */
  this._dragging = false;

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
   * @type {number}
   * @private
   */
  this._nodeBorder = 1;

  /**
   * Size of icons on nodes. This should be the same as the font size of ".icicle .icon" in svg.css
   * @type {number}
   * @private
   */
  this._iconSize = 16;

  /**
   * @type {function(number): number}
   * @private
   */
  this._xScale = null;

  /**
   * @type {function(number): number}
   * @private
   */
  this._yScale = null;

  /**
   * @type {number}
   * @private
   */
  this._rowCtrlWidth = 50;

  this._initialize();
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.tree.Icicle.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.tree.HierarchyVisualization.prototype);
epiviz.ui.charts.tree.Icicle.constructor = epiviz.ui.charts.tree.Icicle;

/**
 * Initializes the chart and draws the initial SVG in the container
 * @protected
 */
epiviz.ui.charts.tree.Icicle.prototype._initialize = function() {
  epiviz.ui.charts.tree.HierarchyVisualization.prototype._initialize.call(this);

  this._svg.classed('icicle', true);
};


/**
 * @param {epiviz.datatypes.Range} [range]
 * @param {epiviz.ui.charts.tree.Node} [root]
 * @returns {Array.<epiviz.ui.charts.VisObject>}
 */
epiviz.ui.charts.tree.Icicle.prototype.draw = function(range, root) {
  var uiData = epiviz.ui.charts.tree.HierarchyVisualization.prototype.draw.call(this, range, root);

  var self = this;
  var Axis = epiviz.ui.charts.Axis;

  if (!root) {
    root = this._lastData;
  }

  var width = this.width();
  var height = this.height();

  this._xScale = d3.scale.linear().range([this._rowCtrlWidth, width - this.margins().sumAxis(Axis.X)]);
  this._yScale = d3.scale.pow().exponent(1.5).range([0, height - this.margins().sumAxis(Axis.Y)]);

  var itemsGroup = this._svg.select('.items');
  var defs = this._svg.select('.defs');
  if (itemsGroup.empty()) {
    itemsGroup = this._svg.append('g')
      .attr('class', 'items');

    var selectedGroup = itemsGroup.append('g').attr('class', 'selected');
    itemsGroup.append('g').attr('class', 'hovered');
    selectedGroup.append('g').attr('class', 'hovered');
  }
  if (defs.empty()) {
    defs = this._svg.select('defs').append('g')
      .attr('class', 'defs');
  }
  itemsGroup
    .attr('transform', sprintf('translate(%s,%s)', this.margins().left(), this.margins().top()));
  defs
    .attr('transform', sprintf('translate(%s,%s)', this.margins().left(), this.margins().top()));

  if (!root) { return []; }

  var calcOldWidth = function(d) { var node = self._getOldNode(d); return Math.max(0, self._xScale(node.x + node.dx) - self._xScale(node.x) - 2 * self._nodeBorder); };
  var calcOldHeight = function(d) { var node = self._getOldNode(d); return Math.max(0, self._yScale(node.y + node.dy) - self._yScale(node.y) - 2 * self._nodeBorder); };
  var calcOldX = function(d) { return self._xScale(self._getOldNode(d).x) + self._nodeBorder; };
  var calcOldY = function(d) { return self._yScale(self._getOldNode(d).y) + self._nodeBorder; };
  var calcNewWidth = function(d) { var node = self._getNewNode(d); return Math.max(0, self._xScale(node.x + node.dx) - self._xScale(node.x) - 2 * self._nodeBorder); };
  var calcNewHeight = function(d) { var node = self._getNewNode(d); return Math.max(0, self._yScale(node.y + node.dy) - self._yScale(node.y) - 2 * self._nodeBorder); };
  var calcNewX = function(d) { return self._xScale(self._getNewNode(d).x) + self._nodeBorder; };
  var calcNewY = function(d) { return self._yScale(self._getNewNode(d).y) + self._nodeBorder; };
  var getOverlappingNode = function(x, y, globalDepth) {
    var ret = null;
    uiData.forEach(function(uiNode) {
      var nodeRect = {
        x: calcNewX(uiNode),
        y: calcNewY(uiNode),
        width: calcNewWidth(uiNode),
        height: calcNewHeight(uiNode)
      };
      if (nodeRect.x <= x && x < nodeRect.x + nodeRect.width && uiNode.globalDepth == globalDepth) {
        //&& nodeRect.y <= y && y < nodeRect.y + nodeRect.height) {
        ret = uiNode;
      }
    });

    return ret;
  };

  var lastUiNodeHovered = null;
  var drag = d3.behavior.drag()
    .origin(function(d) { return {x:0, y:0}})
    .on('dragstart', function(d) {
      self._svg.selectAll('.item').sort(function (a, b) { return (a.id != d.id) ? -1 : 1; });
    })
    .on('drag', function(d) {
      self._dragging = true;
      d3.select(this)
        .attr('transform', 'translate(' + d3.event.x + ',' + d3.event.y + ')');
      var mouseCoordinates = d3.mouse(self._svg[0][0]);
      var uiNodeHovered = getOverlappingNode(mouseCoordinates[0], mouseCoordinates[1], d.globalDepth);
      if (uiNodeHovered && uiNodeHovered.parentId == d.parentId) {
        lastUiNodeHovered = uiNodeHovered;
        self._svg.selectAll('.item').classed('selected', false).classed('dragstart', true);
        self._svg.select('#' + self.id() + '-' + d.id).classed('selected', true).classed('dragstart', false);
        self._svg.select('#' + self.id() + '-' + uiNodeHovered.id).classed('selected', true).classed('dragstart', false);
      }
    })
    .on('dragend', function(d) {
      if (!self._dragging) { return; }
      self._svg.selectAll('.item').classed('selected', false).classed('dragstart', false);
      d3.select(this)
        .attr('transform', null);
      // Change the order
      var mouseCoordinates = d3.mouse(self._svg[0][0]);
      var uiNodeHovered = lastUiNodeHovered;
      if (!uiNodeHovered || uiNodeHovered.parentId != d.parentId || uiNodeHovered.id == d.id) { return; }

      /** @type {epiviz.ui.charts.tree.UiNode} */
      var parent = self._uiDataMap[d.parentId];
      var uiNodeX = calcNewX(uiNodeHovered);
      var uiNodeWidth = calcNewWidth(uiNodeHovered);
      var uiNodeOrder = self._calcNodeOrder(uiNodeHovered);
      var after = false;
      if (mouseCoordinates[0] >= uiNodeX + uiNodeWidth * 0.5) { after = true; }
      var other = null;
      var otherOrder;
      parent.children.forEach(function(child) {
        var childOrder = self._calcNodeOrder(child);
        if ((after && childOrder > uiNodeOrder && (otherOrder == undefined || childOrder < otherOrder)) ||
            (!after && childOrder < uiNodeOrder && (otherOrder == undefined || childOrder > otherOrder))) {
          other = child;
          otherOrder = childOrder;
        }
      });

      var order;
      if (!other && !after) { order = uiNodeOrder - 1; }
      else if (!other && after) { order = uiNodeOrder + 1; }
      else { order = (uiNodeOrder + otherOrder) * 0.5; }

      self.nodesOrder()[d.id] = order;

      if (self.autoPropagateChanges()) {
        self.firePropagateHierarchyChanges();
      } else {
        setTimeout(function() {
          self.draw(range, root);
        }, 0);
      }
    });

  var items = itemsGroup.selectAll('.item')
    .data(uiData, function(d) { return d.id; });

  var clips = defs.selectAll('clipPath')
    .data(uiData, function(d) { return d.id; });

  var newItems = items
    .enter().append('g')
    .attr('id', function(d) { return self.id() + '-' + d.id; })
    .attr('class', function(d) {
      var selectionType = self.selectedNodes()[d.id];
      if (selectionType == undefined) { selectionType = d.selectionType || 0; }
      return 'item ' + epiviz.ui.charts.tree.HierarchyVisualization.SELECTION_CLASSES[selectionType];
    })
    .on('click', function(d) {
      if (self._dragging) { self._dragging = false; return; }
      if (self.selectMode()) {
        var node = self._getNewNode(d);
        d.selectionType = node.selectionType = self.selectNode(node);
      } else {
        self.onRequestHierarchy().notify(new epiviz.ui.charts.VisEventArgs(
          self.id(),
          new epiviz.ui.controls.VisConfigSelection(undefined, undefined, self.datasourceGroup(), self.dataprovider(), undefined, undefined, undefined, d.id)));
      }
    })
    .on('mouseover', function(d) {
      self._hover.notify(new epiviz.ui.charts.VisEventArgs(self.id(), d));
    })
    .on('mouseout', function () {
      self._unhover.notify(new epiviz.ui.charts.VisEventArgs(self.id()));
    })
    .call(drag);

  var newClips = clips
    .enter().append('clipPath')
    .attr('id', function(d) { return self.id() + '-clip-' + d.id; })
    .append('rect')
    .attr('x', function(d) { return calcOldX(d) + self._nodeMargin; })
    .attr('y', function(d) { return calcOldY(d) + self._nodeMargin; })
    .attr('width', function(d) { return Math.max(0, calcOldWidth(d) - 2 * self._nodeMargin); })
    .attr('height', function(d) { return Math.max(0, calcOldHeight(d) - 2 * self._nodeMargin); });

  var newRects = newItems.append('rect')
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

  var newIconsBg = newItems.append('circle')
    .attr('class', 'icon-bg')
    .attr('cx', function(d) { return calcOldX(d) + self._nodeMargin + self._iconSize * 0.5; })
    .attr('cy', function(d) { return calcOldY(d) + calcOldHeight(d) - self._nodeMargin - self._iconSize * 0.5; })
    .attr('r', self._iconSize * 0.5 + 2)
    .style('fill', '#ffffff')
    .style('opacity', 0);

  var newIcons = newItems.append('svg:foreignObject')
    .attr('class', 'icon-container')
    .attr('clip-path', function(d) { return 'url(#' + self.id() + '-clip-' + d.id + ')'; })
    .attr('width', this._iconSize)
    .attr('height', this._iconSize)
    .attr('x', function(d) { return calcOldX(d) + self._nodeMargin; })
    .attr('y', function(d) { return calcOldY(d) + calcOldHeight(d) - self._nodeMargin - self._iconSize; })
    .append('xhtml:span')
    .attr('class', 'unselectable-text icon')
    .on('mouseover', function(d) {
      d3.select(d3.select(this).node().parentNode.parentNode).select('.icon-bg')
        .style('opacity', 0.3);
    })
    .on('mouseout', function(d) {
      d3.select(d3.select(this).node().parentNode.parentNode).select('.icon-bg')
        .style('opacity', 0);
    })
    .on('mousedown', function(d) {
      d3.event.stopPropagation();
    })
    .on('click', function(d) {
      var node = self._getNewNode(d);
      d.selectionType = node.selectionType = self.selectNode(node);
      d3.event.stopPropagation();
    });


  defs.selectAll('rect')
    .transition().duration(this._animationDelay)
    .attr('x', function(d) { return calcNewX(d) + self._nodeMargin; })
    .attr('y', function(d) { return calcNewY(d) + self._nodeMargin; })
    .attr('width', function(d) { return Math.max(0, calcNewWidth(d) - 2 * self._nodeMargin); })
    .attr('height', function(d) { return Math.max(0, calcNewHeight(d) - 2 * self._nodeMargin); });

  itemsGroup.selectAll('.item')
    .attr('class', function(d) {
      var selectionType = self.selectedNodes()[d.id];
      if (selectionType == undefined) { selectionType = d.selectionType || 0; }
      return 'item ' + epiviz.ui.charts.tree.HierarchyVisualization.SELECTION_CLASSES[selectionType];
    });

  itemsGroup.selectAll('.item').selectAll('rect')
    .transition().duration(this._animationDelay)
    .style('fill', function(d) { return self.colors().getByKey(d.taxonomy); })
    .attr('x', calcNewX)
    .attr('y', calcNewY)
    .attr('width', calcNewWidth)
    .attr('height', calcNewHeight);

  itemsGroup.selectAll('.item').selectAll('.node-label')
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

  itemsGroup.selectAll('.item').selectAll('.icon-bg')
    .transition().duration(this._animationDelay)
    .attr('cx', function(d) { return calcNewX(d) + self._nodeMargin + self._iconSize * 0.5; })
    .attr('cy', function(d) { return calcNewY(d) + calcNewHeight(d) - self._nodeMargin - self._iconSize * 0.5; });

  itemsGroup.selectAll('.item').selectAll('.icon-container')
    .transition().duration(this._animationDelay)
    .attr('x', function(d) { return calcNewX(d) + self._nodeMargin; })
    .attr('y', function(d) { return calcNewY(d) + calcNewHeight(d) - self._nodeMargin - self._iconSize; });


  items.exit()
    .selectAll('.node-label').transition().duration(this._animationDelay)
    .attr('x', function(d) { return calcNewX(d) + calcNewWidth(d) * 0.5; })
    .attr('y', function(d) { return calcNewY(d) + calcNewHeight(d) * 0.5; });
  items.exit().transition().delay(this._animationDelay).remove();

  this._drawRowControls(root);

  return uiData;
};

/**
 * @param {epiviz.ui.charts.tree.Node} root
 * @private
 */
epiviz.ui.charts.tree.Icicle.prototype._drawRowControls = function(root) {
  var self = this;

  var calcHeight = function(d, i) { return self._yScale((i + 1) / nLevels) - self._yScale(i / nLevels) - 2; };
  var calcWidth = function(d, i) { return self._rowCtrlWidth - 2; };
  var calcY = function(d, i) { return self._yScale(i / nLevels) + 1; };
  var calcX = function(d, i) { return 1; };
  var calcR = function(d, i) {
    var height = calcHeight(d, i) - 3;
    var width = calcWidth(d, i) - 3;
    return Math.min(height, width) / 2 - 5;
  };

  var rowCtrlGroup = this._svg.select('.row-ctrls');
  if (rowCtrlGroup.empty()) {
    rowCtrlGroup = this._svg.append('g')
      .attr('class', 'row-ctrls');
  }

  rowCtrlGroup
    .attr('transform', sprintf('translate(%s,%s)', this.margins().left(), this.margins().top()));

  var levelsTaxonomy = this.levelsTaxonomy();
  var nLevels = levelsTaxonomy.length;
  var rowCtrls = rowCtrlGroup.selectAll('.row-ctrl')
    .data(levelsTaxonomy);

  var newCtrls = rowCtrls
    .enter().append('g')
    .style('opacity', 0)
    .attr('class', 'row-ctrl custom-select');

  newCtrls
    .transition().duration(this._animationDelay)
    .style('opacity', 1);

  rowCtrls.exit()
    .transition().duration(this._animationDelay)
    .style('opacity', 0)
    .remove();

  newCtrls
    .append('rect')
    .style('fill', function(label) { return self.colors().getByKey(label); });

  rowCtrlGroup.selectAll('.row-ctrl').select('rect')
    .attr('x', calcX)
    .attr('width', calcWidth)
    .attr('rx', 10)
    .attr('ry', 10)
    .transition().duration(this._animationDelay)
    .attr('y', calcY)
    .attr('height', calcHeight)
    .style('fill', function(label) { return self.colors().getByKey(label); });

  var newIconsBg = newCtrls.append('circle')
    .attr('class', 'icon-bg')
    .style('fill', '#ffffff')
    .style('opacity', 0.5);

  rowCtrlGroup.selectAll('.icon-bg')
    .transition().duration(this._animationDelay)
    .attr('cx', function(d, i) { return calcWidth(d, i) / 2 + 1; })
    .attr('cy', function(d, i) { return  calcY(d, i) + calcHeight(d, i) / 2; })
    .attr('r', calcR);

  var newIcons = newCtrls.append('svg:foreignObject')
    .attr('class', 'icon-container')
    .attr('width', function(d, i) { return calcR(d, i) * 2; })
    .attr('height', function(d, i) { return calcR(d, i) * 2; });

  newIcons.append('xhtml:span')
    .attr('class', 'unselectable-text icon large-icon');

  rowCtrlGroup.selectAll('.icon-container')
    .style('visibility', function(d, i) {
      return (calcR(d, i) * 2 + 13 < calcWidth(d, i)) ?
        'hidden' : 'visible';
    })
    .transition().duration(this._animationDelay)
    .attr('x', function(d, i) { return calcX(d, i) + calcWidth(d, i) / 2 - calcR(d, i) + 5; })
    .attr('y', function(d, i) { return  calcY(d, i) + calcHeight(d, i) / 2 - calcR(d, i) + 5; });

  rowCtrls
    .on('mouseover', function(d, i) {
      d3.select(this)
        .style('opacity', 0.8);
    })
    .on('mouseout', function(d) {
      d3.select(this)
        .style('opacity', 1);
    })
    .on('mousedown', function(d) {
      d3.select(this)
        .style('opacity', 0.7);
    })
    .on('mouseup', function(d) {
      d3.select(this)
        .style('opacity', 0.8);
    })
    .on('click', function(d, i) {
      self.selectLevel(root.globalDepth + i);
      d3.event.stopPropagation();
    });
};

/**
 * @param {epiviz.ui.charts.VisObject} selectedObject
 */
epiviz.ui.charts.tree.Icicle.prototype.doHover = function(selectedObject) {
  if (this._dragging) { return; }
  var itemsGroup = this._svg.select('.items');
  itemsGroup.classed('unhovered', true);
  var selectItems = itemsGroup.selectAll('.item').filter(function(d) {
    return selectedObject.overlapsWith(d);
  });
  selectItems.classed('hovered', true);
  itemsGroup.selectAll('.item').sort(function(d1, d2) { return selectedObject.overlapsWith(d1) ? 1 : -1; });
};

/**
 */
epiviz.ui.charts.tree.Icicle.prototype.doUnhover = function() {
  if (this._dragging) { return; }
  this._svg.select('.items').classed('unhovered', false);
  this._svg.select('.items').selectAll('.item').classed('hovered', false);
};

/**
 * @param {epiviz.ui.charts.ChartObject} selectedObject
 */
epiviz.ui.charts.tree.Icicle.prototype.doSelect = function(selectedObject) {
  var itemsGroup = this._svg.select('.items');
  var selectItems = itemsGroup.selectAll('.item').filter(function(d) {
    return selectedObject.overlapsWith(d);
  });
  selectItems.classed('selected', true);
};

/**
 */
epiviz.ui.charts.tree.Icicle.prototype.doDeselect = function() {
  this._svg.select('.items').selectAll('.selected').classed('selected', false);
};
