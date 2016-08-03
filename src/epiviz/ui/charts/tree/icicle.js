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


  this._legend = null;

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
  var Axis = epiviz.ui.charts.Axis;

  if (!root) {
    root = this._lastData;
  }

  var width = this.width();
  var height = this.height();

  this._xScale = d3.scale.linear().range([this._rowCtrlWidth, width - this.margins().sumAxis(Axis.X)]);
  this._yScale = d3.scale.pow().exponent(1.5).range([0, height - this.margins().sumAxis(Axis.Y)]);

  this._drawAxes();

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
      node.selection = d.selectionType;
      node.selectionType = self.selectNode(node);
      d.selectionType = node.selectionType;
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
    .style('fill', function(d) { 

      // if(d.selectionType == 0) {
      //   return "#bfbfbf";
      // }

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


epiviz.ui.charts.tree.Icicle.prototype._drawAxes = function() {

  this._legend.selectAll("*").remove();

  var self = this;

  var location =  $('#text-location').val();

  if(location !== undefined || location != "" || location != null) {

      var startEnd = location.split('-');
      var loc_start = Globalize.parseInt(startEnd[0]);
      var loc_end = Globalize.parseInt(startEnd[1]);

      var node_starts = [], node_ends = [];

      this._uiData.forEach(function(uiNode) {

        if( (uiNode.depth+1) == self._subtreeDepth) {
          if(  loc_start <= uiNode.start || (loc_start >= uiNode.start && loc_start < uiNode.end) ) {
            node_starts.push(uiNode.x);
          }

          if( loc_end > uiNode.end || (loc_end > uiNode.start && loc_end <= uiNode.end) ) {
            node_ends.push(uiNode.x + uiNode.dx);
          }
        }

      });

      if(node_starts.length == 0) {
        /// out of range

        //console.log("out of range");

        this._legend.append("svg:line")
          .attr("x1", self._rowCtrlWidth + self.margins().left() + 5)
          .attr("y1", this.height() - 10)
          .attr("x2", self.width() - self.margins().left() - 5)
          .attr("y2", this.height() - 10)
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
                          "," + (this.height() - 10 - 7) +
                          " " + (Math.round(self._rowCtrlWidth + self.margins().left() + 5) - 3) +
                          "," + (this.height() - 10) + 
                          " " +  (Math.round(self._rowCtrlWidth + self.margins().left() + 5) - 3) + 
                          "," + (this.height() - 10  + 7)
                          ); 


        this._legend.append("polyline")       
          .style("stroke", "grey")   
          .style("fill", "none")      
          .style("stroke-width", 2)  
          .style("stroke-linejoin", "round")
          .attr("fill-opacity", .5)
          .attr("points", (Math.round(self.width() - self.margins().left() - 5) - 5 ) + 
                          "," + (this.height() - 10 - 7) +
                          " " + (Math.round(self.width() - self.margins().left() - 5) + 3) +
                          "," + (this.height() - 10) + 
                          " " +  (Math.round(self.width() - self.margins().left() - 5) - 5) + 
                          "," + (this.height() - 10  + 7)
                          ); 
      }
      else if (node_ends.length == 0) {

        this._legend.append("svg:line")
          .attr("x1", self._rowCtrlWidth + self.margins().left() + 5)
          .attr("y1", this.height() - 10)
          .attr("x2", self.width() - self.margins().left() - 5)
          .attr("y2", this.height() - 10)
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
                          "," + (this.height() - 10 - 7) +
                          " " + (Math.round(self._rowCtrlWidth + self.margins().left() + 5) - 5) +
                          "," + (this.height() - 10) + 
                          " " +  (Math.round(self._rowCtrlWidth + self.margins().left() + 5) + 3) + 
                          "," + (this.height() - 10  + 7)
                          ); 


        this._legend.append("polyline")       
          .style("stroke", "grey")   
          .style("fill", "none")      
          .style("stroke-width", 2)  
          .style("stroke-linejoin", "round")
          .attr("fill-opacity", .5)
          .attr("points", (Math.round(self.width() - self.margins().left() - 5) + 3) + 
                          "," + (this.height() - 10 - 7) +
                          " " + (Math.round(self.width() - self.margins().left() - 5) + 3) +
                          "," + (this.height() - 10) + 
                          " " +  (Math.round(self.width() - self.margins().left() - 5) + 3) + 
                          "," + (this.height() - 10  + 7)
                          ); 

      }
      else {

      var x1 = self._xScale(Math.min.apply(Math, node_starts)) + this.margins().left() + 5; // + self._nodeBorder + self._nodeMargin;
      var x2 = self._xScale(Math.max.apply(Math, node_ends)) + this.margins().left() - 5; // + self._nodeBorder + self._nodeMargin;

      var bar_width = x2 - x1;
      var bar_start = x1;

      var y1 = this.height() - 15;

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

      this._legend.append("svg:line")
        .attr("x1", self._rowCtrlWidth + self.margins().left() + 5)
        .attr("y1", this.height() - 10)
        .attr("x2", self.width() - self.margins().left() - 5)
        .attr("y2", this.height() - 10)
        .attr("fill-opacity", .5)
        .style("stroke", "grey")
        .style("stroke-width", 3);

      this._legend.append("polyline")
        .style("stroke", "grey")
        .style("fill", "none")
        .style("stroke-width", 2)
        .style("stroke-linejoin", "round")
        .attr("fill-opacity", .5)
        .attr("points", (Math.round(self._rowCtrlWidth + self.margins().left() + 5) -3) + 
                        "," + (this.height() - 10 - 7) +
                        " " + (Math.round(self._rowCtrlWidth + self.margins().left() + 5) - 3) +
                        "," + (this.height() - 10) + 
                        " " +  (Math.round(self._rowCtrlWidth + self.margins().left() + 5) - 3) + 
                        "," + (this.height() - 10  + 7)
                        ); 


      this._legend.append("polyline")       
        .style("stroke", "grey")   
        .style("fill", "none")      
        .style("stroke-width", 2)  
        .style("stroke-linejoin", "round")
        .attr("fill-opacity", .5)
        .attr("points", (Math.round(self.width() - self.margins().left() - 5) + 3) + 
                        "," + (this.height() - 10 - 7) +
                        " " + (Math.round(self.width() - self.margins().left() - 5) + 3) +
                        "," + (this.height() - 10) + 
                        " " +  (Math.round(self.width() - self.margins().left() - 5) + 3) + 
                        "," + (this.height() - 10  + 7)
                        ); 

      var dragrect = this._legend.append("rect")
          .attr("id", "active")
          .attr("x", function(d) { return d.x; })
          .attr("y", function(d) { return d.y; })
          .attr("height", 10)
          .attr("width", bar_width)
          .attr("fill-opacity", .5)
          .attr("cursor", "move")
          .call(drag);

      var dragbarleft = this._legend.append("rect")
          .attr("x", function(d) { return d.x - (extend_bar_width/2); })
          .attr("y", function(d) { return d.y + 1; })
          .attr("id", "dragleft")
          .attr("width", extend_bar_width)
          .attr("height", 8)
          .attr("fill", "red")
          .attr("fill-opacity", .5)
          .attr("cursor", "ew-resize")
          .call(dragleft);

      var dragbarright = this._legend.append("rect")
          .attr("x", function(d) { return d.x + bar_width - (extend_bar_width/2); })
          .attr("y", function(d) { return d.y + 1; })
          .attr("id", "dragright")
          .attr("width", extend_bar_width)
          .attr("height", 8)
          .attr("fill", "red")
          .attr("fill-opacity", .5)
          .attr("cursor", "ew-resize")
          .call(dragright);


      function dragmove(d) {
        dragrect
            .attr("x", d.x = Math.max(self._rowCtrlWidth + self.margins().left(), Math.min(self.width() - self.margins().left() - bar_width, d3.event.x)));

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
          var dragx = Math.max(d.x + (extend_bar_width/2), Math.min(self.width() - self.margins().left(), d.x + bar_width + d3.event.dx));
          bar_width = dragx - d.x;

          dragbarright
              .attr("x", dragx - (extend_bar_width/2) );
          dragrect
              .attr("width", bar_width);
      }

      function dragend(d) {

        updateLocationBox(d.x, d.x+bar_width, "drag", d);
        //updateLocationBox(bar_start, bar_start+bar_width, "drag", d);
      }

      function ldragend(d) {
        //console.log(dragbarright.datum());
        //updateLocationBox(d.x, dragbarright.datum().x - d.x, "dragleft", d);
        updateLocationBox(d.x, d.x+bar_width - 5, "dragleft", d);
      }

      function rdragend(d) {

        //updateLocationBox(d.x, d.x - dragbarleft.datum().x, "dragright", d);
        updateLocationBox(d.x, d.x+bar_width, "dragright", d);
      }

      function updateLocationBox (loc_x, loc_y, dragType, d) {
        loc_x = self._xScale.invert(loc_x);
        loc_y = self._xScale.invert(loc_y);

        // find nodes positions for those x1 and x2
        var node_starts = [], node_ends = [];
        var node_starts_x = [], node_ends_x = [];
        var range_start = 0, range_end = 0;

        self._uiData.forEach(function(uiNode) {

          if(uiNode.depth == self._rootDepth) {
            range_start = uiNode.start;
            range_end = uiNode.end;
          }

          if( (uiNode.depth+1) == self._subtreeDepth) {
            if(loc_x >= uiNode.x && loc_x < (uiNode.x + uiNode.dx)) {
              node_starts.push(uiNode.start);
              node_starts_x.push(uiNode.x);
            }

            if(loc_y > uiNode.x && loc_y <= (uiNode.x + uiNode.dx) ) {
              node_ends.push(uiNode.end);
              node_ends_x.push(uiNode.x + uiNode.dx);
            }
          }
        });

        var x1 = Math.max.apply(Math, node_starts);
        //var snapx1 = Math.max.apply(Math, node_starts_x);
        var x2 = Math.min.apply(Math, node_ends);
        //var snapx2 = Math.max.apply(Math, node_ends_x);

        var snapx1min = Math.max.apply(Math, node_starts_x);
        var snapx2min = Math.min.apply(Math, node_ends_x);

        if (!Number.isFinite(x1)) {
          x1 = range_start;
          //snapx1min = self._rowCtrlWidth;
        }

        if(!Number.isFinite(x2)) {
          x2 = range_end;
          //snapx2min = self.width();
        }

        var snapx1 = self._xScale(snapx1min) + self.margins().left() + 5;
        var snapx2 = self._xScale(snapx2min) - 1;

        self._propagateIcicleLocationChanges.notify({start: x1, width: x2 - x1});

        //snap scroll bar to these edges

        if(dragType == "drag") {

          bar_width = snapx2 - snapx1;

          dragrect
            .attr("x", d.x = snapx1)
            .attr("width", bar_width);

          dragbarleft
            .attr("x", snapx1 - (extend_bar_width/2));

          dragbarright
            .attr("x", snapx2 - (extend_bar_width/2) );

        }
        else if(dragType == "dragleft") {

          bar_width = snapx2 - snapx1;

          dragbarleft
            .attr("x", snapx1 - (extend_bar_width/2));

          dragrect
            .attr("x", d.x = snapx1)
            .attr("width", bar_width);
        }
        else if(dragType == "dragright") {

          bar_width = snapx2 - snapx1;

          dragbarright
            .attr("x", snapx2 - (extend_bar_width/2) );

          dragrect
            .attr("width", bar_width);
        }

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
    .attr('class', function(d) {
      Object.keys(self._selectedLevels).forEach(function(sl) {
        var selectionType = self._selectedLevels[sl];
        if(levelsTaxonomy[sl] == d) {
          return 'row-ctrl ' + epiviz.ui.charts.tree.HierarchyVisualization.SELECTION_CLASSES[selectionType];
        }
      });

      return 'row-ctrl custom-select';
    });

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
