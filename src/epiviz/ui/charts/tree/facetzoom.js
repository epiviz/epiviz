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
 * @extends {epiviz.ui.charts.tree.HierarchyVisualization}
 */
epiviz.ui.charts.tree.Facetzoom = function(id, container, properties) {

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
   * Size of icons on nodes. This should be the same as the font size of ".facetzoom .icon" in svg.css
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

  this._initialize();
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.tree.Facetzoom.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.tree.HierarchyVisualization.prototype);
epiviz.ui.charts.tree.Facetzoom.constructor = epiviz.ui.charts.tree.Facetzoom;

/**
 * Initializes the chart and draws the initial SVG in the container
 * @protected
 */
epiviz.ui.charts.tree.Facetzoom.prototype._initialize = function() {
  epiviz.ui.charts.tree.HierarchyVisualization.prototype._initialize.call(this);

  this._svg.classed('facetzoom', true);
};


/**
 * @param {epiviz.datatypes.Range} [range]
 * @param {epiviz.ui.charts.tree.Node} [root]
 * @returns {Array.<epiviz.ui.charts.VisObject>}
 */
epiviz.ui.charts.tree.Facetzoom.prototype.draw = function(range, root) {
  var uiData = epiviz.ui.charts.tree.HierarchyVisualization.prototype.draw.call(this, range, root);

  var self = this;
  var Axis = epiviz.ui.charts.Axis;

  if (!root) {
    root = this._lastData;
  }

  var width = this.width();
  var height = this.height();

  this._xScale = d3.scale.linear().range([0, width - this.margins().sumAxis(Axis.X)]);
  this._yScale = d3.scale.pow().exponent(1.5).range([0, height - this.margins().sumAxis(Axis.Y)]);

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

  var calcOldWidth = function(d) { var node = self._getOldNode(d); return Math.max(0, self._xScale(node.x + node.dx) - self._xScale(node.x) - 2 * self._nodeBorder); };
  var calcOldHeight = function(d) { var node = self._getOldNode(d); return Math.max(0, self._yScale(node.y + node.dy) - self._yScale(node.y) - 2 * self._nodeBorder); };
  var calcOldX = function(d) { return self._xScale(self._getOldNode(d).x) + self._nodeBorder; };
  var calcOldY = function(d) { return self._yScale(self._getOldNode(d).y) + self._nodeBorder; };
  var calcNewWidth = function(d) { var node = self._getNewNode(d); return Math.max(0, self._xScale(node.x + node.dx) - self._xScale(node.x) - 2 * self._nodeBorder); };
  var calcNewHeight = function(d) { var node = self._getNewNode(d); return Math.max(0, self._yScale(node.y + node.dy) - self._yScale(node.y) - 2 * self._nodeBorder); };
  var calcNewX = function(d) { return self._xScale(self._getNewNode(d).x) + self._nodeBorder; };
  var calcNewY = function(d) { return self._yScale(self._getNewNode(d).y) + self._nodeBorder; };
  var getOverlappingNode = function(x, y, depth) {
    var ret = null;
    uiData.forEach(function(uiNode) {
      var nodeRect = {
        x: calcNewX(uiNode),
        y: calcNewY(uiNode),
        width: calcNewWidth(uiNode),
        height: calcNewHeight(uiNode)
      };
      if (nodeRect.x <= x && x < nodeRect.x + nodeRect.width && uiNode.depth == depth) {
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
      var uiNodeHovered = getOverlappingNode(mouseCoordinates[0], mouseCoordinates[1], d.depth);
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

      setTimeout(function() {
        self.draw(range, root);
      }, 0);
    });

  var items = canvas.selectAll('g')
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
        var selectionType = d.selectionType || 0;
        selectionType = (selectionType + 1) % 3;
        d.selectionType = selectionType;
        self.selectNode(d, selectionType);
      } else {
        self.onRequestHierarchy().notify(new epiviz.ui.charts.VisEventArgs(
          self.id(),
          new epiviz.ui.controls.VisConfigSelection(undefined, undefined, self.datasourceGroup(), self.dataprovider(), undefined, undefined, undefined, d.id)));
      }
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



  return uiData;
};
