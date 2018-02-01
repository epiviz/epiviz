/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/7/2014
 * Time: 7:18 PM
 */

goog.provide('epiviz.ui.charts.tree.Icicle');

goog.require('epiviz.ui.charts.tree.HierarchyVisualization');
goog.require('epiviz.ui.charts.Axis');
goog.require('epiviz.ui.charts.VisEventArgs');
goog.require('epiviz.ui.controls.VisConfigSelection');
goog.require('epiviz.datatypes.GenomicRange');
goog.require('epiviz.ui.charts.tree.UiNode');

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

  this._rowAllLevelWidth = 50;

  this._legendX = null;

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

  this._legend = this._svg.append('g').attr('class', 'chart-legend');
};


/**
 * @param {epiviz.datatypes.Range} [range]
 * @param {epiviz.ui.charts.tree.Node} [root]
 * @returns {Array.<epiviz.ui.charts.VisObject>}
 */
epiviz.ui.charts.tree.Icicle.prototype.draw = function(range, root) {
  var uiData = epiviz.ui.charts.tree.HierarchyVisualization.prototype.draw.call(this, range, root);

  var self = this;

  var hoverOpacity = this.customSettingsValues()[epiviz.ui.charts.tree.IcicleType.CustomSettings.HOVER_OPACITY];
  var aggLevel = this.customSettingsValues()[epiviz.ui.charts.tree.IcicleType.CustomSettings.AGG_LEVEL];
  var nodeSel = this.customSettingsValues()[epiviz.ui.charts.tree.IcicleType.CustomSettings.NODE_SEL];
  var icicleRoot = this.customSettingsValues()[epiviz.ui.charts.tree.IcicleType.CustomSettings.ICICLE_ROOT];
  var icicleAutoPropagate = this.customSettingsValues()[epiviz.ui.charts.tree.IcicleType.CustomSettings.AUTO_PROPAGATE];
  
  // reset colors
  // self.colors()._keyIndices = {};
  // self.colors()._nKeys = 0;

  //self.visualization().setCustomSettingsValues(settingsValues);

  var Axis = epiviz.ui.charts.Axis;

  if (!root) {
    root = this._lastData;
  }

  self._lastRoot = root;

  var width = this.width();
  var height = this.height();

  this._xScale = d3.scale.linear().range([this._rowCtrlWidth, width - this.margins().sumAxis(Axis.X) - this._rowAllLevelWidth]);
  //this._yScale = d3.scale.pow().exponent(1.25).range([0, height - this.margins().sumAxis(Axis.Y)]);
  this._yScale = d3.scale.linear().range([0, height - this.margins().sumAxis(Axis.Y)]);
  
  this._drawAxes(root);

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

    var calcOldWidth = function(d) {
        var node = self._getOldNode(d);
        return Math.max(0, self._xScale(node.x + node.dx) - self._xScale(node.x) - 2 * self._nodeBorder);
    };
    var calcOldHeight = function(d) {
        var node = self._getOldNode(d);
        return Math.max(0, self._yScale(node.y + node.dy) - self._yScale(node.y) - 2 * self._nodeBorder);
    };
    var calcOldX = function(d) {
        return self._xScale(self._getOldNode(d).x) + self._nodeBorder;
    };
    var calcOldY = function(d) {
        return height - self._yScale(self._getOldNode(d).y) - calcOldHeight(d) - self.margins().sumAxis(Axis.Y) + self._nodeBorder;
    };
    var calcNewWidth = function(d) {
        var node = self._getNewNode(d);
        return Math.max(0, self._xScale(node.x + node.dx) - self._xScale(node.x) - 2 * self._nodeBorder);
    };
    var calcNewHeight = function(d) {
        var node = self._getNewNode(d);
        return Math.max(0, self._yScale(node.y + node.dy) - self._yScale(node.y) - 2 * self._nodeBorder);
    };
    var calcNewX = function(d) {
        return self._xScale(self._getNewNode(d).x) + self._nodeBorder;
    };
    var calcNewY = function(d) {
        return height - self._yScale(self._getNewNode(d).y) - calcNewHeight(d) - self.margins().sumAxis(Axis.Y) + self._nodeBorder;
    };
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

        self._customSettingsValues["icicleRoot"] = d.id;
        self._customSettingsChanged.notify(new epiviz.ui.charts.VisEventArgs(self._id, self._customSettingsValues));

        self.onRequestHierarchy().notify(new epiviz.ui.charts.VisEventArgs(
          self.id(),
          new epiviz.ui.controls.VisConfigSelection(undefined, undefined, self.datasourceGroup(), self.dataprovider(), undefined, undefined, undefined, d.id)));
          var icicleAutoPropagate = self.customSettingsValues()[epiviz.ui.charts.tree.IcicleType.CustomSettings.AUTO_PROPAGATE];
          
        if(icicleAutoPropagate) {
          self._updateChartLocation(d.start, d.end - d.start);
        }
      }

      d3.event.stopPropagation();
    })
    .on('mouseover', function(d) {
        self._hover.notify(new epiviz.ui.charts.VisEventArgs(self.id(), d));
        self.notifyAggregateNode(d);
        
        var w = calcNewWidth(d);
        var maxChars = w / self._charWidth;
        if (maxChars < 7) {
              d3.select("#" + self.id() + '-' + d.id).append("text")
                  .attr("class", "hoverText")
                  .text(function(d) {return d.name;})
                  .attr("x", function(d) {
                    var xText = calcNewX(d);
                    if (xText < 2*self._rowCtrlWidth) {
                      xText += self._rowCtrlWidth;
                    }
                    if(xText > width -  self._rowCtrlWidth) {
                      xText -= (self._rowCtrlWidth/2);
                    }
                    return xText;
                  })
                  .attr("y", function(d) { return calcNewY(d) + (calcNewHeight(d)/3)});
        }
    })
    .on('mouseout', function () {
      self._unhover.notify(new epiviz.ui.charts.VisEventArgs(self.id()));
      d3.selectAll(".hoverText").remove();
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
    .style("visibility", function(d) {
      var w = calcNewWidth(d);
      var maxChars = w / self._charWidth;
      if (maxChars < 7 && d.depth > (self._levelsTaxonomy.length/2)) {
          return "hidden";
      }
      return "visible";
    })
    .text(function(d) {
      if (d.id == root.id) {
          return self._rootLineageLabel;
      }
      else {
        var w = calcOldWidth(d);
        var maxChars = w / self._charWidth;
        if (maxChars < d.name.length - 3) {
          return d.name.substring(0, maxChars) + '...';
        }
        return d.name;
      }
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
    .attr('class', function(d) { return 'icon-container ' + self.id() + '-icon-' + d.id;} )
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
      d3.event.stopPropagation();

      d3.selectAll(".nodeselection-itemcontainer").remove();
      d3.selectAll(".nodeselection-container").remove();
      d3.selectAll(".nodeselection-text").remove();

      var nodeSelectionType = self._uiDataMap[d.id].selectionType;

      var rdis = "", adis = "", edis = "";
      if(nodeSelectionType == epiviz.ui.charts.tree.HierarchyVisualization.ENUM_SELECTIONS['REMOVED'] || nodeSelectionType == epiviz.ui.charts.tree.HierarchyVisualization.ENUM_SELECTIONS['REMOVED_PRIME']) {
        rdis = "disabled";
      }
      else if(nodeSelectionType == epiviz.ui.charts.tree.HierarchyVisualization.ENUM_SELECTIONS['AGGREGATED'] || nodeSelectionType == epiviz.ui.charts.tree.HierarchyVisualization.ENUM_SELECTIONS['AGGREGATED_PRIME']) {
        adis = "disabled";
      }
      else if(nodeSelectionType == epiviz.ui.charts.tree.HierarchyVisualization.ENUM_SELECTIONS['EXPANDED']) {
        edis = "disabled";
      }

      var v=17; h=23;
      if(Math.max(0, self._xScale(d.x + d.dx) - self._xScale(d.x) - 2 * self._nodeBorder) < 40) {
        h = 0;
      }
      else {
        v = 0;
      }

      var posX = parseInt(this.parentElement.getAttribute("x")) + 3;
      var poxY = parseInt(this.parentElement.getAttribute("y")) - 5;

      d3.select("#" + self.id() + '-' + d.id).append("g")
      .attr("class", "nodeselection-itemcontainer")
      .attr('x', posX + self._iconSize * 0.5)
      .attr('y', poxY - 2);

      d3.select(".nodeselection-itemcontainer").append("circle")
      .attr("class", "nodeselection-container")
      .attr('cx', function(d) { return posX + self._iconSize * 0.5; })
      .attr('cy', function(d) { return poxY - self._iconSize * 0.5; })
      .attr('r', self._iconSize * 0.7)
      .style('fill', '#ffffff')
      .style('opacity', 0.5);

      var fObj = d3.select(".nodeselection-itemcontainer").append('svg:foreignObject')
      .attr('class', "nodeselection-text nodeselection-remove " + rdis)
      .attr('x', posX)
      .attr('y', poxY - 15)
      .attr("height", self._iconSize)
      .attr("width", self._iconSize)
      .on("click", function(dt) {
        d3.event.stopPropagation();

        if(rdis != "disabled") {
          var node = self._getNewNode(d);
          node.selectionType = nodeSelectionType;
          d.selectionType = node.selectionType = self.selectNode(node, epiviz.ui.charts.tree.HierarchyVisualization.ENUM_SELECTIONS['REMOVED']);
          self._customSettingsValues["nodeSel"] = JSON.stringify(self._selectedNodes);
          self._customSettingsChanged.notify(new epiviz.ui.charts.VisEventArgs(self._id, self._customSettingsValues));
        }

        d3.selectAll(".nodeselection-itemcontainer").remove();
        d3.selectAll(".nodeselection-container").remove();
        d3.selectAll(".nodeselection-text").remove();
      })
      .attr("fill", function(d) {
        if(rdis == "disabled") {
          return "gray";          
        }

        return "black";
      });

      fObj.append('xhtml:span')
      .attr('class', 'unselectable-text icon')
      .attr("fill-opacity", .5)
      .style('color', function(d) {
        if(rdis == "disabled") {
          return "gray";          
        }

        return "black";
      });

      d3.select(".nodeselection-itemcontainer").append("circle")
      .attr("class", "nodeselection-container")
      .attr('cx', function(d) { return (posX + self._iconSize * 0.5) + h; })
      .attr('cy', function(d) { return (poxY - self._iconSize * 0.5) - v; })
      .attr('r', self._iconSize * 0.7)
      .style('fill', '#ffffff')
      .style('opacity', 0.5);

      var fObj = d3.select(".nodeselection-itemcontainer").append('svg:foreignObject')
      .attr('class', "nodeselection-text nodeselection-aggregate " + adis)
      .attr('x', posX + h)
      .attr('y', poxY - v - 15)
      .attr("height", self._iconSize)
      .attr("width", self._iconSize)
      .on("click", function(dt) {
        d3.event.stopPropagation();

        if(adis != "disabled") {
          var node = self._getNewNode(d);
          node.selectionType = nodeSelectionType;
          d.selectionType = node.selectionType = self.selectNode(node, epiviz.ui.charts.tree.HierarchyVisualization.ENUM_SELECTIONS['AGGREGATED']);
          self._customSettingsValues["nodeSel"] = JSON.stringify(self._selectedNodes);
          self._customSettingsChanged.notify(new epiviz.ui.charts.VisEventArgs(self._id, self._customSettingsValues));
        }

        d3.selectAll(".nodeselection-itemcontainer").remove();
        d3.selectAll(".nodeselection-container").remove();
        d3.selectAll(".nodeselection-text").remove();
      })
      .attr("fill", function(d) {
        if(adis == "disabled") {
          return "gray";          
        }

        return "black";
      });

      fObj.append('xhtml:span')
      .attr('class', 'unselectable-text icon')
      .attr("fill-opacity", .5)
      .style('color', function(d) {
        if(adis == "disabled") {
          return "gray";          
        }

        return "black";
      });

      d3.select(".nodeselection-itemcontainer").append("circle")
      .attr("class", "nodeselection-container")
      .attr('cx', function(d) { return (posX + self._iconSize * 0.5) + (2 * h); })
      .attr('cy', function(d) { return (poxY - self._iconSize * 0.5) - (2 * v); })
      .attr('r', self._iconSize * 0.7)
      .style('fill', '#ffffff')
      .style('opacity', 0.5);

      var fObj = d3.select(".nodeselection-itemcontainer").append('svg:foreignObject')
      .attr('class', "nodeselection-text nodeselection-expand " + edis)
      .attr('x', posX + (2 * h))
      .attr('y', poxY - (2 * v) - 2 - 13)
      .attr("height", self._iconSize)
      .attr("width", self._iconSize)
      .on("click", function(dt) {
        d3.event.stopPropagation();

        if(edis != "disabled") {
          var node = self._getNewNode(d);
          node.selectionType = nodeSelectionType;
          d.selectionType = node.selectionType = self.selectNode(node, epiviz.ui.charts.tree.HierarchyVisualization.ENUM_SELECTIONS['EXPANDED']);
          self._customSettingsValues["nodeSel"] = JSON.stringify(self._selectedNodes);
          self._customSettingsChanged.notify(new epiviz.ui.charts.VisEventArgs(self._id, self._customSettingsValues));
        }

        d3.selectAll(".nodeselection-itemcontainer").remove();
        d3.selectAll(".nodeselection-container").remove();
        d3.selectAll(".nodeselection-text").remove();
      })
      .attr("fill", function(d) {
        if(edis == "disabled") {
          return "gray";          
        }

        return "black";
      });

      fObj.append('xhtml:span')
      .attr('class', 'unselectable-text icon')
      .attr("fill-opacity", .5)
      .style('color', function(d) {
        if(edis == "disabled") {
          return "gray";          
        }

        return "black";
      });

      $("body").click(function(e) {
        e.stopPropagation();
        d3.selectAll(".nodeselection-itemcontainer").remove();
        d3.selectAll(".nodeselection-container").remove();
        d3.selectAll(".nodeselection-text").remove();
      });
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
    .style('fill', function(d) { 
      return self.colors().getByKey(d.taxonomy); 
    })
    .attr('x', calcNewX)
    .attr('y', calcNewY)
    .attr('width', calcNewWidth)
    .attr('height', calcNewHeight);

  itemsGroup.selectAll('.item').selectAll('.node-label')
    .transition().duration(this._animationDelay)
    .attr('x', function(d) { return calcNewX(d) + calcNewWidth(d) * 0.5; })
    .attr('y', function(d) { return calcNewY(d) + calcNewHeight(d) * 0.5; })
    .style("visibility", function(d) {
      var w = calcNewWidth(d);
      var maxChars = w / self._charWidth;
      if (maxChars < 7 && d.depth > (self._levelsTaxonomy.length/2)) {
          return "hidden";
      }
      return "visible";
    })
    .tween('text', function(d) {
      var w = d3.interpolate(calcOldWidth(d), calcNewWidth(d));
      return function(t) {

        if (d.id == root.id) {
            this.textContent = self._rootLineageLabel;
        }
        else {
          var maxChars = Math.round(w(t) / self._charWidth);
          if (maxChars < d.name.length - 3) {
            this.textContent = d.name.substring(0, maxChars) + '...';
            return;
          }
          this.textContent = d.name;
        }

      };
    });

  itemsGroup.selectAll('.item').selectAll('.icon-bg')
    .transition().duration(this._animationDelay)
    .style("visibility", function(d) {
      var w = calcNewWidth(d);
      if (w < 20) {
          return "hidden";
      }
      return "visible";
    })
    .attr('cx', function(d) { return calcNewX(d) + self._nodeMargin + self._iconSize * 0.5; })
    .attr('cy', function(d) { return calcNewY(d) + calcNewHeight(d) - self._nodeMargin - self._iconSize * 0.5; });

  itemsGroup.selectAll('.item').selectAll('.icon-container')
    .transition().duration(this._animationDelay)
    .style("visibility", function(d) {
      var w = calcNewWidth(d);
      if (w < 20) {
          return "hidden";
      }
      return "visible";
    })
    .attr('x', function(d) { return calcNewX(d) + self._nodeMargin; })
    .attr('y', function(d) { return calcNewY(d) + calcNewHeight(d) - self._nodeMargin - self._iconSize; });


  items.exit()
    .selectAll('.node-label').transition().duration(this._animationDelay)
    .attr('x', function(d) { return calcNewX(d) + calcNewWidth(d) * 0.5; })
    .attr('y', function(d) { return calcNewY(d) + calcNewHeight(d) * 0.5; });

  items.exit()
    .selectAll('.node-label-lineage').transition().duration(this._animationDelay)
    .attr('x', function(d) { return calcNewX(d) + calcNewWidth(d) * 0.5; })
    .attr('y', function(d) { return calcNewY(d) + calcNewHeight(d) * 0.7; });

  items.exit().transition().delay(this._animationDelay).remove();

  this._drawRowControls(root);

  if(this._firstRun == 0) {
    this._firstRun++;

    self.onRequestHierarchy().notify(new epiviz.ui.charts.VisEventArgs(
      self.id(),
      new epiviz.ui.controls.VisConfigSelection(undefined, undefined, self.datasourceGroup(), self.dataprovider(), undefined, undefined, undefined, icicleRoot))
    );

    this.firePropagateHierarchyChanges();
  }

  setTimeout(function() {
      if(root.children[0].length == 1) {
        $("." + self.id() + '-icon-' + root.children[0].id + " span").click();
        (function blink() { 
          $(".nodeselection-expand").fadeOut(500).fadeIn(500, blink); 
        })();
     
      $("body").click(function(e){
        e.stopPropagation();
        d3.selectAll(".nodeselection-itemcontainer").remove();
        d3.selectAll(".nodeselection-container").remove();
        d3.selectAll(".nodeselection-text").remove();
      });
    }
  }, 1000);

  return uiData;
};


epiviz.ui.charts.tree.Icicle.prototype._updateChartLocation = function(start, width) {

  var self = this;
        
  self._propagateIcicleLocationChanges.notify({start: start, width: width});

  self._lastRange = new epiviz.datatypes.GenomicRange('NA', 
                          start, 
                          width);
};

epiviz.ui.charts.tree.Icicle.prototype._updateLocation = function(start, width) {
  var self = this;
  self._lastRange = new epiviz.datatypes.GenomicRange('NA', 
                          start, 
                          width);
};

epiviz.ui.charts.tree.Icicle.prototype._drawAxes = function(root) {

  if(!root) {return;}

  this._legend.selectAll("*").remove();

  var self = this;

  var navbar_y = self.margins().top() - 23;
  var navbar_height = 17;

  //var location =  $('#text-location').val();
  var location = self._lastRange;

  if(location != null) {

      var loc_start = location.start();
      var loc_end = location.end();

      var node_starts = [], node_ends = [];
      var node_starts_val = [], node_ends_val = [];

      var move_level = parseInt(self.selCutLevel);

      if(!(root.globalDepth <= move_level && (root.globalDepth + self._subtreeDepth - 1) >= move_level)) {
          move_level = root.globalDepth + this._subtreeDepth - 1;
      }

      this._uiData.forEach(function(uiNode) {

        if( (uiNode.globalDepth) == move_level) {
          if(  loc_start <= uiNode.start || (loc_start >= uiNode.start && loc_start < uiNode.end) ) {
            node_starts.push(uiNode.x);
            node_starts_val.push([uiNode.start, uiNode.end]);
          }

          if( loc_end >= uiNode.end || (loc_end > uiNode.start && loc_end <= uiNode.end) ) {
            node_ends.push(uiNode.x + uiNode.dx);
            node_ends_val.push([uiNode.start, uiNode.end]);
          }
        }

      });

      function moveLeftCtrl() {
        if(node_starts_val.length == 0 || node_ends_val.length == 0) {
        }
        else {
          var x1 = node_starts_val[0][0] - 1;
          var x2 = node_ends_val[node_ends_val.length-1][0];
          self._updateChartLocation(x1, x2 - x1);
              self._drawAxes(self._lastRoot);
        }        
      }

      function moveCtrCtrl() {
        if(node_starts_val.length == 0 || node_ends_val.length == 0) {
          if(node_starts_val.length > 0) {
            var x1 = node_starts_val[0][0];
            var x2 = node_starts_val[node_starts_val.length-1][1];
            // find the block right to the current position.
            self._updateChartLocation(x1, x2 - x1);
                self._drawAxes(self._lastRoot);
          }
          else if(node_ends_val.length > 0) {
              var x1 = node_ends_val[0][0];
              var x2 = node_ends_val[node_ends_val.length-1][1];
              // find the block right to the current position.
              self._updateChartLocation(x1, x2 - x1);
                  self._drawAxes(self._lastRoot);
          }
        }
        else {
          var x2 = node_starts_val[node_starts_val.length-1][1];
          var x1 = node_ends_val[0][0];
          // find the block right to the current position.
          self._updateChartLocation(x1, x2 - x1);
              self._drawAxes(self._lastRoot);
        }
      }

      function moveRightCtrl() {
        if(node_starts_val.length == 0 || node_ends_val.length == 0) {
        }
        else {
            var x1 = node_starts_val[0][1];
            var x2 = node_ends_val[node_ends_val.length-1][1] + 1;
            // find the block right to the current position.
            self._updateChartLocation(x1, x2 - x1);
                self._drawAxes(self._lastRoot);
        }
      }

      if(node_starts.length == 0) {

        var ctrCtrl = this._legend.append('g')
          .on("click", function(d) {
              moveCtrCtrl();
              d3.event.stopPropagation();
          });

      ctrCtrl.append("rect")
        .attr("x", self.margins().left() + this._rowCtrlWidth / 3 - 1)
        .attr("y", navbar_y)
        .attr("rx", 5)
        .attr("ry", 5)
        .attr("height", navbar_height)
        .attr("width", this._rowCtrlWidth / 3 - 2)
        .attr("fill-opacity", .3)
        .attr("fill","gray");

      var ctrIcons = ctrCtrl.append('svg:foreignObject')
        .attr('class', 'icon-container')
        .attr("x", (self.margins().left() - 5 + this._rowCtrlWidth / 3 - 1 + (this._rowCtrlWidth / 3 - 2) * 0.5 ))
        .attr("y", (navbar_y + (navbar_height/3) - 4))
        .attr("height", navbar_height)
        .attr("width", this._rowCtrlWidth / 3 - 2);

      ctrIcons.append('xhtml:span')
        .attr('class', 'unselectable-text fa fa-exchange')
        .attr("fill-opacity", .5)
        .style('color', 'black');

        this._legend.append("svg:line")
          .attr("x1", self._rowCtrlWidth + self.margins().left() + 5)
          .attr("y1", navbar_y + (navbar_height/2))
          .attr("x2", self.width() - self.margins().left() - 5 - self._rowAllLevelWidth)
          .attr("y2", navbar_y + (navbar_height/2))
          .attr("fill-opacity", .5)
          .style("stroke", "grey")
          .style("stroke-width", 3)
          .attr("stroke-dasharray", "10,10");

        this._legend.append("polyline")
          .style("stroke", "grey")
          .style("fill", "none")
          .style("stroke-width", 2)
          .style("stroke-linejoin", "round")
          .attr("fill-opacity", .5)
          .attr("points", (Math.round(self._rowCtrlWidth + self.margins().left() + 5) - 3) + 
                          "," + (navbar_y + (navbar_height/2) - 7) +
                          " " + (Math.round(self._rowCtrlWidth + self.margins().left() + 5) - 3) +
                          "," + (navbar_y + (navbar_height/2)) + 
                          " " +  (Math.round(self._rowCtrlWidth + self.margins().left() + 5) - 3) + 
                          "," + (navbar_y + (navbar_height/2) + 7)
                          ); 


        this._legend.append("polyline")       
          .style("stroke", "grey")   
          .style("fill", "none")      
          .style("stroke-width", 2)  
          .style("stroke-linejoin", "round")
          .attr("fill-opacity", .5)
          .attr("points", (Math.round(self.width() - self.margins().left() - 5 - self._rowAllLevelWidth) - 5 ) + 
                          "," + (navbar_y + (navbar_height/2) - 7) +
                          " " + (Math.round(self.width() - self.margins().left() - 5 - self._rowAllLevelWidth) + 3) +
                          "," + (navbar_y + (navbar_height/2)) + 
                          " " +  (Math.round(self.width() - self.margins().left() - 5 - self._rowAllLevelWidth) - 5) + 
                          "," + (navbar_y + (navbar_height/2) + 7)
                          ); 
      }
      else if (node_ends.length == 0) {

        var ctrCtrl = this._legend.append('g')
        //.attr("cursor", "pointer")
          .on("click", function(d) {
              moveCtrCtrl();
              d3.event.stopPropagation();
          });

      ctrCtrl.append("rect")
        .attr("x", self.margins().left() + this._rowCtrlWidth / 3 - 1)
        .attr("y", navbar_y)
        .attr("rx", 5)
        .attr("ry", 5)
        .attr("height", navbar_height)
        .attr("width", this._rowCtrlWidth / 3 - 2)
        .attr("fill-opacity", .3)
        .attr("fill","gray");

      var ctrIcons = ctrCtrl.append('svg:foreignObject')
        .attr('class', 'icon-container')
        .attr("x", (self.margins().left() - 5 + this._rowCtrlWidth / 3 - 1 + (this._rowCtrlWidth / 3 - 2) * 0.5 ))
        .attr("y", (navbar_y + (navbar_height/3) - 4))
        .attr("height", navbar_height)
        .attr("width", this._rowCtrlWidth / 3 - 2);

      ctrIcons.append('xhtml:span')
        .attr('class', 'unselectable-text fa fa-exchange')
        .attr("fill-opacity", .5)
        .style('color', 'black');

        this._legend.append("svg:line")
          .attr("x1", self._rowCtrlWidth + self.margins().left() + 5)
          .attr("y1", navbar_y + (navbar_height/2))
          .attr("x2", self.width() - self.margins().left() - 5 - self._rowAllLevelWidth)
          .attr("y2", navbar_y + (navbar_height/2))
          .attr("fill-opacity", .5)
          .style("stroke", "grey")
          .style("stroke-width", 3)
          .attr("stroke-dasharray", "10,10");

        this._legend.append("polyline")
          .style("stroke", "grey")
          .style("fill", "none")
          .style("stroke-width", 2)
          .style("stroke-linejoin", "round")
          .attr("fill-opacity", .5)
          .attr("points", (Math.round(self._rowCtrlWidth + self.margins().left() + 5) + 3) + 
                          "," + (navbar_y + (navbar_height/2) - 7) +
                          " " + (Math.round(self._rowCtrlWidth + self.margins().left() + 5) - 5) +
                          "," + (navbar_y + (navbar_height/2)) + 
                          " " +  (Math.round(self._rowCtrlWidth + self.margins().left() + 5) + 3) + 
                          "," + (navbar_y + (navbar_height/2)  + 7)
                          ); 


        this._legend.append("polyline")       
          .style("stroke", "grey")   
          .style("fill", "none")      
          .style("stroke-width", 2)  
          .style("stroke-linejoin", "round")
          .attr("fill-opacity", .5)
          .attr("points", (Math.round(self.width() - self.margins().left() - 5 - self._rowAllLevelWidth) + 3) + 
                          "," + (navbar_y + (navbar_height/2) - 7) +
                          " " + (Math.round(self.width() - self.margins().left() - 5 - self._rowAllLevelWidth) + 3) +
                          "," + (navbar_y + (navbar_height/2)) + 
                          " " +  (Math.round(self.width() - self.margins().left() - 5 - self._rowAllLevelWidth) + 3) + 
                          "," + (navbar_y + (navbar_height/2)  + 7)
                          ); 

      }
      else {

      var leftCtrl = this._legend.append('g')
      //.attr("cursor", "pointer")
        .on("click", function(d) {
              moveLeftCtrl();
              d3.event.stopPropagation();
          });

      leftCtrl.append("rect")
        .attr("x", self.margins().left())
        .attr("y", navbar_y)
        .attr("class", "item")
        .attr("rx", 5)
        .attr("ry", 5)
        .attr("height", navbar_height)
        .attr("width", this._rowCtrlWidth / 3 - 2)
        .attr("fill-opacity", .3)
        .attr("fill","gray");

      var leftIcons = leftCtrl.append('svg:foreignObject')
        .attr('class', 'icon-container')
        .attr("x", (self.margins().left() - 4 + (this._rowCtrlWidth / 3 - 2) * 0.5 ))
        .attr("y", (navbar_y + (navbar_height/3)) - 4)
        .attr("height", navbar_height)
        .attr("width", this._rowCtrlWidth / 3 - 2);

      leftIcons.append('xhtml:span')
        .attr('class', 'unselectable-text fa fa-arrow-left')
        .attr("fill-opacity", .5)
        .style('color', 'black');

      var ctrCtrl = this._legend.append('g')
        .attr("class", "ctr-select")
        .on("click", function(d) {
              moveCtrCtrl();
              d3.event.stopPropagation();
          });

      ctrCtrl.append("rect")
        .attr("x", self.margins().left() + this._rowCtrlWidth / 3 - 1)
        .attr("y", navbar_y)
        .attr("rx", 5)
        .attr("ry", 5)
        .attr("height", navbar_height)
        .attr("width", this._rowCtrlWidth / 3 - 2)
        .attr("fill-opacity", .3)
        .attr("fill","gray");

      var ctrIcons = ctrCtrl.append('svg:foreignObject')
        .attr('class', 'icon-container')
        .attr("x", (self.margins().left() - 5 + this._rowCtrlWidth / 3 - 1 + (this._rowCtrlWidth / 3 - 2) * 0.5 ))
        .attr("y", (navbar_y + (navbar_height/3)) - 4)
        .attr("height", navbar_height)
        .attr("width", this._rowCtrlWidth / 3 - 2);

      ctrIcons.append('xhtml:span')
        .attr('class', 'unselectable-text fa fa-exchange')
        .attr("fill-opacity", .5)
        .style('color', 'black');

      var rightCtrl = this._legend.append('g')
      //.attr("cursor", "pointer")
        .on("click", function(d) {
              moveRightCtrl();
              d3.event.stopPropagation();
          });

      rightCtrl.append("rect")
        .attr("x", self.margins().left() + 2 * (this._rowCtrlWidth / 3 - 1))
        .attr("y", navbar_y)
        .attr("rx", 5)
        .attr("ry", 5)
        .attr("height", navbar_height)
        .attr("width", this._rowCtrlWidth / 3 - 2)
        .attr("fill-opacity", .3)
        .attr("fill","gray");

    var rightIcons = rightCtrl.append('svg:foreignObject')
        .attr('class', 'icon-container')
        .attr("x", (self.margins().left() - 5 + (2 * (this._rowCtrlWidth / 3 - 1)) + (this._rowCtrlWidth / 3 - 2) * 0.5 ))
        .attr("y", (navbar_y + (navbar_height/3)) - 4)
        .attr("height", navbar_height)
        .attr("width", this._rowCtrlWidth / 3 - 2);

      rightIcons.append('xhtml:span')
        .attr('class', 'unselectable-text fa fa-arrow-right')
        .attr("fill-opacity", .5)
        .style('color', 'black');

      var x1 = self._xScale(Math.min.apply(Math, node_starts)) + this.margins().left() + 5; // + self._nodeBorder + self._nodeMargin;
      var x2 = self._xScale(Math.max.apply(Math, node_ends)) + this.margins().left() - 5; // + self._nodeBorder + self._nodeMargin;

      var bar_width = x2 - x1;
      var bar_start = x1;

      var y1 = navbar_y;

      var extend_bar_width = 8;

      var drag = d3.behavior.drag().origin(Object)
                  .on("drag", dragmove)
                  .on("dragend", dragend);

      var dragright = d3.behavior.drag()
        .origin(Object)
        .on("drag", rdragresize)
        .on("dragend", rdragend);

      var dragleft = d3.behavior.drag()
        .origin(Object)
        .on("drag", ldragresize)
        .on("dragend", ldragend);

      this._legend.data([{x: x1, y:y1}]);

      this._legend.append("line")
                .attr("x1", self._rowCtrlWidth + self.margins().left() + 5)
                .attr("y1", navbar_y + (navbar_height/2))
                .attr("x2", self.width() - self.margins().left() - 5 - self._rowAllLevelWidth)
                .attr("y2", navbar_y + (navbar_height/2))
                .attr("fill-opacity", .5)
                .style("stroke", "grey")
                .style("stroke-width", 3);

            this._legend.append("polyline")
                .style("stroke", "grey")
                .style("fill", "none")
                .style("stroke-width", 2)
                .style("stroke-linejoin", "round")
                .attr("fill-opacity", .5)
                .attr("points", (Math.round(self._rowCtrlWidth + self.margins().left() + 5) - 3) +
                    "," + (navbar_y + (navbar_height/2) - 7) +
                    " " + (Math.round(self._rowCtrlWidth + self.margins().left() + 5) - 3) +
                    "," + (navbar_y + (navbar_height/2)) +
                    " " + (Math.round(self._rowCtrlWidth + self.margins().left() + 5) - 3) +
                    "," + (navbar_y + (navbar_height/2) + 7)
                );


            this._legend.append("polyline")
                .style("stroke", "grey")
                .style("fill", "none")
                .style("stroke-width", 2)
                .style("stroke-linejoin", "round")
                .attr("fill-opacity", .5)
                .attr("points", (Math.round(self.width() - self.margins().left() - 5 - self._rowAllLevelWidth) + 3) +
                    "," + (navbar_y + (navbar_height/2) - 7) +
                    " " + (Math.round(self.width() - self.margins().left() - 5 - self._rowAllLevelWidth) + 3) +
                    "," + (navbar_y + (navbar_height/2)) +
                    " " + (Math.round(self.width() - self.margins().left() - 5 - self._rowAllLevelWidth) + 3) +
                    "," + (navbar_y + (navbar_height/2) + 7)
                );


      var dragrect = this._legend.append("rect")
          .attr("id", "active")
          .attr("x", function(d) { return d.x; })
          .attr("y", function(d) { return d.y; })
          .attr("height", navbar_height)
          .attr("width", bar_width)
          .attr("fill-opacity", .5)
          .attr("cursor", "move")
          .call(drag);

      var dragbarleft = this._legend.append("rect")
          .attr("x", function(d) { return d.x - (extend_bar_width/2); })
          .attr("y", function(d) { return d.y + 1; })
          .attr("id", "dragleft")
          .attr("width", extend_bar_width)
          .attr("height", navbar_height - 2)
          .attr("fill", "red")
          .attr("fill-opacity", .5)
          .attr("cursor", "ew-resize")
          .call(dragleft);

      var dragbarright = this._legend.append("rect")
          .attr("x", function(d) { return d.x + bar_width - (extend_bar_width/2); })
          .attr("y", function(d) { return d.y + 1; })
          .attr("id", "dragright")
          .attr("width", extend_bar_width)
          .attr("height", navbar_height - 2)
          .attr("fill", "red")
          .attr("fill-opacity", .5)
          .attr("cursor", "ew-resize")
          .call(dragright);

      // var txMin = node_starts_val[0][0];
      // var txMax = node_ends_val[node_ends_val.length-1][1]; 
      // self._updateChartLocation(txMin, txMax - txMin);

      function dragmove(d) {
        dragrect
            .attr("x", d.x = Math.max(self._rowCtrlWidth + self.margins().left(), Math.min(self.width() - self.margins().left() - bar_width - self._rowAllLevelWidth, d3.event.x)));

        dragbarleft 
            .attr("x", function(d) { return d.x - (extend_bar_width/2);});

        dragbarright 
            .attr("x", function(d) { return  d.x + bar_width - (extend_bar_width/2);});

        bar_start = d.x;
      }

      function ldragresize(d) {
        var oldx = d.x; 

        d.x = Math.max(self._rowCtrlWidth + self.margins().left(), Math.min(d.x + bar_width - (extend_bar_width/2), d3.event.x)); 

        bar_start = d.x;
        bar_width = bar_width + (oldx - d.x);

        dragbarleft
          .attr("x", function(d) { return d.x - (extend_bar_width/2); });
        
        dragrect
          .attr("x", function(d) { return  d.x;})
          .attr("width", bar_width);
      }

      function rdragresize(d) {
          var dragx = Math.max(d.x + (extend_bar_width/2), Math.min(self.width() - self.margins().left() - self._rowAllLevelWidth, d.x + bar_width + d3.event.dx));
          bar_width = dragx - d.x;

          dragbarright
              .attr("x", dragx - (extend_bar_width/2) );
          dragrect
              .attr("width", bar_width);
      }

      function dragend(d) {
        updateLocationBox(d.x, d.x+bar_width, "drag", d);
      }

      function ldragend(d) {
        updateLocationBox(d.x, d.x+bar_width - 5, "dragleft", d);
      }

      function rdragend(d) {
        updateLocationBox(d.x, d.x+bar_width, "dragright", d);
      }

      function updateLocationBox (loc_x, loc_y, dragType, d) {

        loc_x = self._xScale.invert(loc_x);
        loc_y = self._xScale.invert(loc_y);

        // find nodes positions for those x1 and x2
        var node_starts = [], node_ends = [];
        var range_start = 0, range_end = 0;

        self._uiData.forEach(function(uiNode) {

          if(uiNode.globalDepth == self._rootDepth) {
            range_start = uiNode.start;
            range_end = uiNode.end;
          }

          if( (uiNode.globalDepth) == move_level) {

            if(loc_x >= uiNode.x && loc_x < (uiNode.x + uiNode.dx)) {
              node_starts.push(uiNode.start);
            }

            if(loc_y > uiNode.x && loc_y <= (uiNode.x + uiNode.dx) ) {
              node_ends.push(uiNode.end);
            }
          }

        });

        var x1 = Math.max.apply(Math, node_starts);
        var x2 = Math.min.apply(Math, node_ends);

        if (!Number.isFinite(x1)) {
          x1 = range_start;
        }

        if(!Number.isFinite(x2)) {
          x2 = range_end;
        }

        self._updateChartLocation(x1, x2 - x1);
        self._drawAxes(self._lastRoot);

      }
      }
  }
};

/**
 * @param {epiviz.ui.charts.tree.Node} root
 * @private
 */
epiviz.ui.charts.tree.Icicle.prototype._drawRowControls = function(root) {
  var self = this;

  var height = self.height();

  var calcHeight = function(d, i) { return self._yScale((i + 1) / nLevels) - self._yScale(i / nLevels) - 2; };
  var calcWidth = function(d, i) { return self._rowCtrlWidth - 2; };
  var calcY = function(d, i) { return self._yScale((nLevels - i - 1) / nLevels) + 1; };
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

  rowCtrlGroup.selectAll('.row-ctrl').remove();

  var levelsTaxonomy = this.levelsTaxonomy();
  var nLevels = levelsTaxonomy.length;
  var rowCtrls = rowCtrlGroup.selectAll('.row-ctrl')
    .data(levelsTaxonomy);

  var newCtrls = rowCtrls
    .enter().append('g')
    .attr('id', function(d) { return self.id() + '-' + d; })
    .style('opacity', 0)
    .attr('class', function(d, i) {

      if((root.globalDepth + i) >= Object.keys(self._selectedLevels)[0]) {
        return 'row-ctrl ' + epiviz.ui.charts.tree.HierarchyVisualization.SELECTION_CLASSES[2];
      }

      return 'row-ctrl ' + epiviz.ui.charts.tree.HierarchyVisualization.SELECTION_CLASSES[1];

      // Object.keys(self._selectedLevels).forEach(function(sl) {
      //   var selectionType = self._selectedLevels[sl];
      //   if(levelsTaxonomy[sl] == d) {
      //     return 'row-ctrl ' + epiviz.ui.charts.tree.HierarchyVisualization.SELECTION_CLASSES[selectionType];
      //   }
      // });

      // return 'row-ctrl custom-select';
    });

  newCtrls
    .transition().duration(this._animationDelay)
    .style('opacity', 1);

  rowCtrls.exit()
    .transition().duration(this._animationDelay)
    .style('opacity', 0)
    .remove();

  //   newCtrls
  //   .append('rect')
  //   .style('fill', function(label) { return self.colors().getByKey(label); });

  // rowCtrlGroup.selectAll('.row-ctrl').select('rect')
  //   .attr('x', calcX)
  //   .attr('width', calcWidth)
  //   .attr('rx', 10)
  //   .attr('ry', 10)
  //   .transition().duration(this._animationDelay)
  //   .attr('y', calcY)
  //   .attr('height', calcHeight)
  //   .style('fill', function(label) { return self.colors().getByKey(label); });

  newCtrls
    .append('path')
    .attr("class", "rowCtrlPath")
    .style('fill', function(label) { return self.colors().getByKey(label); });


  var lineFunction = d3.svg.line()
                          .x(function(d) { return d.x; })
                          .y(function(d) { return d.y; })
                      .interpolate("linear");

  var lineGraph = rowCtrlGroup.selectAll('.row-ctrl').select("path.rowCtrlPath")
    .attr("d", function(d, i) {

        var height = calcHeight(d, i);
        var width = calcWidth(d, i);
        var x = calcX(d, i);
        var y = calcY(d, i);
        var polyFactor = 5/7;

        var lineData = [];
        y = y+2;

        lineData.push({'x': x, 'y': y});
        lineData.push({'x': x, 'y': y + height});
        lineData.push({'x': x + width, 'y': y + height});
        lineData.push({'x': x + width, 'y': y});
        lineData.push({'x': x, 'y': y});
        return lineFunction(lineData);
    })
    .attr("stroke", "none");

  var textFields2 = newCtrls.append('text')
    .attr("class", "rotatetext-rowCtrl")
    .text(function(d){return d.charAt(0).toUpperCase();})
    .style("font-size", 17)
    .attr("text-anchor", "middle")
    .style("font-weight", "bolder")
    .attr("transform" , function(d, i) {
      var x = calcWidth(d, i) / 2 + 1 - (calcR(d,i) * Math.cos(265));
      var y = calcY(d, i) + (calcHeight(d, i)* 7 / 12) - (calcR(d,i) * Math.sin(265));

      return "translate(" + x + "," + y + ") " + "rotate(-30)";
    });

  var newIconsBg = newCtrls.append('circle')
    .attr('class', 'icon-bg')
    .style('fill', '#ffffff')
    .style('opacity', 0.5);

  rowCtrlGroup.selectAll('.icon-bg')
    .transition().duration(this._animationDelay)
    .attr('cx', function(d, i) { return calcWidth(d, i) / 2 + 1; })
    .attr('cy', function(d, i) { return  calcY(d, i) + (calcHeight(d, i)* 7 / 12); })
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
    .attr('y', function(d, i) { return  calcY(d, i) + (calcHeight(d, i)* 7 / 12) - calcR(d, i) + 5; });

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
      self._customSettingsValues["aggLevel"] = root.globalDepth + i;
      self._customSettingsChanged.notify(new epiviz.ui.charts.VisEventArgs(self._id, self._customSettingsValues));
      d3.event.stopPropagation();
    });

    var height = self.height();
    var nAllLevels = self._allLevels.length;
    var calcHeight = function(d, i) { return self._yScale((i + 1) / nAllLevels) - self._yScale(i / nAllLevels) - 2; };
    var calcWidth = function(d, i) { return self._rowCtrlWidth - 2; };
    var calcY = function(d, i) { return self._yScale((nAllLevels - i - 1) / nAllLevels) + 1; };
    var calcX = function(d, i) { return 1; };
    var calcR = function(d, i) {
      var height = calcHeight(d, i) - 3;
      var width = calcWidth(d, i) - 3;
      return Math.min(height, width) / 2 - 5;
    };

    var rowCtrlGroup = this._svg.select('.row-ctrls-levels');

    if (rowCtrlGroup.empty()) {
      rowCtrlGroup = this._svg.append('g')
        .attr('class', 'row-ctrls-levels');
    }

    rowCtrlGroup
      .attr('transform', sprintf('translate(%s,%s)', this.width() - this.margins().left() - this._rowAllLevelWidth, this.margins().top()));

    rowCtrlGroup.selectAll('.row-ctrl-level').remove();

    var levelsTaxonomy = this._allLevels;
    var nLevels = levelsTaxonomy.length;
    var rowCtrls = rowCtrlGroup.selectAll('.row-ctrl-level')
      .data(levelsTaxonomy);

    var newCtrls = rowCtrls
      .enter().append('g')
      .style('opacity', 0)
      .attr('class', 'row-ctrl-level custom-select');;

    newCtrls
      .transition().duration(this._animationDelay)
      .style('opacity', function(d) {
        // return 0;
        if(self.levelsTaxonomy().indexOf(d) != -1) {
          return 1;
        } 
        return 0.2;
      });

    rowCtrls.exit()
      .transition().duration(this._animationDelay)
      .style('opacity', function(d) {
        // return 0;
        if(self.levelsTaxonomy().indexOf(d) != -1) {
          return 1;
        } 
        return 0.5;
      })
      .remove();
    
    newCtrls
      .append('rect')
      .style('fill', function(label) { return self.colors().getByKey(label); });

    rowCtrlGroup.selectAll('.row-ctrl-level').select('rect')
      .attr('x', calcX)
      .attr('width', calcWidth)
      .attr('rx', 5)
      .attr('ry', 5)
      .transition().duration(this._animationDelay)
      .attr('y', calcY)
      .attr('height', calcHeight)
      .style('fill', function(label) { return self.colors().getByKey(label); });

    var textFields2 = newCtrls.append('text')
      .attr("class", "rotatetext-rowCtrl")
      .text(function(d){return d.charAt(0).toUpperCase();})
      .style("font-size", 17)
      .attr("text-anchor", "middle")
      .style("font-weight", "bolder")
      .attr("transform" , function(d, i) {
        var x = calcWidth(d, i) / 2 + 1;
        var y = calcY(d, i) + (calcHeight(d, i)* 2 / 3);

        return "translate(" + x + "," + y + ") ";
      });

    rowCtrlGroup.selectAll('.icon-container')
      .style('visibility', function(d, i) {
        return (calcR(d, i) * 2 + 13 < calcWidth(d, i)) ?
          'hidden' : 'visible';
      })
      .transition().duration(this._animationDelay)
      .attr('x', function(d, i) { return calcX(d, i) + calcWidth(d, i) / 2 - calcR(d, i) + 5; })
      .attr('y', function(d, i) { return  calcY(d, i) + (calcHeight(d, i)* 7 / 12) - calcR(d, i) + 5; });
};

/**
 * @param {epiviz.ui.charts.VisObject} selectedObject
 */
epiviz.ui.charts.tree.Icicle.prototype.doHover = function(selectedObject) {

  var hoverOpacity = this.customSettingsValues()[epiviz.ui.charts.tree.IcicleType.CustomSettings.HOVER_OPACITY];

    var self = this;
    if (this._dragging) {
        return;
    }

    var itemsGroup = this._svg.select('.items');
    itemsGroup.classed('unhovered', true);
    var selectItems = itemsGroup.selectAll('.item').filter(function(d) {
        if (d instanceof epiviz.ui.charts.tree.UiNode) {
            var isOverlap = selectedObject.overlapsWith(d);

            if (isOverlap && d.selectionType == 2) {
                self.hoverHierarchy(d);
            }

            return isOverlap;
        }
        return false;
    });
    selectItems.classed('hovered', true);
    itemsGroup.selectAll('.item').sort(function(d1, d2) {
        if (d1 instanceof epiviz.ui.charts.tree.UiNode) {
            return selectedObject.overlapsWith(d1) ? 1 : -1;
        }
        return -1;

    });

    if (selectedObject instanceof epiviz.ui.charts.tree.UiNode) {
        this.hoverHierarchy(selectedObject);
    }

      this._svg.selectAll(".item rect")
      .style("fill-opacity", 1 - hoverOpacity);

      this._svg.selectAll(".item.hovered rect")
      .style("fill-opacity", hoverOpacity);
};

/**
 */
epiviz.ui.charts.tree.Icicle.prototype.doUnhover = function() {

  var hoverOpacity = this.customSettingsValues()[epiviz.ui.charts.tree.IcicleType.CustomSettings.HOVER_OPACITY];

  if (this._dragging) { return; }
  this._svg.select('.items').classed('unhovered', false);
  this._svg.select('.items').selectAll('.item').classed('hovered', false);

        this._svg.selectAll(".item.hovered rect")
      .style("fill-opacity", 1);

      this._svg.selectAll(".item rect")
      .style("fill-opacity", 1);
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

epiviz.ui.charts.tree.Icicle.prototype.hoverHierarchy = function(selectedObject) {

    var self = this;
    var itemsGroup = this._svg.select('.items');

    // for all children and parents set class hovered = true;
    function setChildrenHovered(nes) {
        var selectItems = itemsGroup.selectAll('.item').filter(function(d) {
            if (d instanceof epiviz.ui.charts.tree.UiNode) {
              return nes.overlapsWith(d);
            }
            return false;
        });

        selectItems.classed('hovered', true);
        if (nes.children.length == 0) {
            return;
        } else {
            nes.children.forEach(function(n) {
                setChildrenHovered(n);
            });
        }
    }

    setChildrenHovered(selectedObject);

    function setParentHovered(nes) {
        var selectItems = itemsGroup.selectAll('.item').filter(function(d) {
            if (d instanceof epiviz.ui.charts.tree.UiNode) {
                return nes.overlapsWith(d);
            }
            return false;
        });

        selectItems.classed('hovered', true);
        if (nes.parent == null) {
            return;
        } else {
            setParentHovered(nes.parent);
        }
    }
    setParentHovered(selectedObject);

};

epiviz.ui.charts.tree.Icicle.prototype.notifyAggregateNode = function(node) {

    var self = this;

    function setParentHovered(nes) {

        if (nes.selectionType == 2) {
            self._hover.notify(new epiviz.ui.charts.VisEventArgs(self.id(), nes));
        }

        if (nes.parent == null) {
            return;
        } else {
            setParentHovered(nes.parent);
        }

    }

    if (node.parent != null) {
        setParentHovered(node.parent);
    }

};
