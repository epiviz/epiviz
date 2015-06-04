/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/22/13
 * Time: 6:47 PM
 */

goog.provide('epiviz.ui.charts.Track');

/**
 * @param {string} id
 * @param {jQuery} container The div where the chart will be drawn
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @extends {epiviz.ui.charts.Chart}
 * @constructor
 */
epiviz.ui.charts.Track = function(id, container, properties) {
  // Call superclass constructor
  epiviz.ui.charts.Chart.call(this, id, container, properties);

  /**
   * D3 rectangle in the SVG
   * @type {*}
   * @protected
   */
  this._background = null;

  /**
   * D3 group in the SVG used for adding hover/selection elements
   * @type {*}
   * @protected
   */
  this._highlightGroup = null;
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.Track.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.Chart.prototype);
epiviz.ui.charts.Track.constructor = epiviz.ui.charts.Track;


/**
 * Initializes the chart and draws the initial SVG in the container
 * @protected
 */
epiviz.ui.charts.Track.prototype._initialize = function() {
  this._properties.width = '100%';

  epiviz.ui.charts.Chart.prototype._initialize.call(this);

  var self = this;

  this._highlightGroup = this._svg
    .append('g')
    .attr('class', 'track-highlight');

  this._background = this._svg
    .append('rect')
    .attr('class', 'chart-background')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('fill', '#ffffff')
    .attr('fill-opacity', '0');

  this._background
    .on('mouseover', function() { self._captureMouseHover(); })
    .on('mousemove', function() { self._captureMouseHover(); })
    .on('mouseout', function () { self._unhover.notify(new epiviz.ui.charts.VisEventArgs(self.id())); });
};

/**
 * @param {epiviz.datatypes.GenomicRange} [range]
 * @param {epiviz.datatypes.GenomicData} [data]
 * @param {number} [slide]
 * @param {number} [zoom]
 * @returns {Array.<epiviz.ui.charts.ChartObject>} The objects drawn
 */
epiviz.ui.charts.Track.prototype.draw = function(range, data, slide, zoom) {
  var result = epiviz.ui.charts.Chart.prototype.draw.call(this, range, data);

  this._drawLegend();

  return result;
};

/**
 * @returns {epiviz.ui.charts.VisualizationType.DisplayType}
 */
epiviz.ui.charts.Track.prototype.displayType = function() { return epiviz.ui.charts.VisualizationType.DisplayType.TRACK; };

/**
 * @param {epiviz.ui.charts.ChartObject} selectedObject
 */
epiviz.ui.charts.Track.prototype.doHover = function(selectedObject) {
  epiviz.ui.charts.Chart.prototype.doHover.call(this, selectedObject);

  if (selectedObject.start == undefined || selectedObject.end == undefined) {
    return;
  }

  if (!this._lastRange) { return; }

  this._highlightGroup.selectAll('rect').remove();
  this._highlightGroup.attr('transform', 'translate(' + this.margins().left() + ', ' + 0 + ')');

  var Axis = epiviz.ui.charts.Axis;
  var xScale = d3.scale.linear()
    .domain([this._lastRange.start(), this._lastRange.end()])
    .range([0, this.width() - this.margins().sumAxis(Axis.X)]);

  var items = [];
  if (!selectedObject.measurements || !selectedObject.measurements.length) {
    items.push({start: selectedObject.start, end: selectedObject.end});
  } else {
    for (var i = 0; i < selectedObject.valueItems[0].length; ++i) {
      var rowItem = selectedObject.valueItems[0][i].rowItem;
      items.push({start: rowItem.start(), end: rowItem.end()});
    }
  }

  var minHighlightSize = 5;
  this._highlightGroup.selectAll('rect').data(items, function(d) { return sprintf('%s-%s', d.start, d.end); })
    .enter()
    .append('rect')
    .style('fill', this.colors().get(0))
    .style('fill-opacity', '0.1')
    .attr('x', function(d) {
      var defaultWidth = xScale(d.end + 1) - xScale(d.start);
      var width = Math.max(minHighlightSize, defaultWidth);
      return xScale(d.start) + defaultWidth * 0.5 - width * 0.5;
    })
    .attr('width', function(d) { return Math.max(minHighlightSize, xScale(d.end + 1) - xScale(d.start)); })
    .attr('y', 0)
    .attr('height', this.height());
};

/**
 */
epiviz.ui.charts.Track.prototype.doUnhover = function() {
  epiviz.ui.charts.Chart.prototype.doUnhover.call(this);

  this._highlightGroup.selectAll('rect').remove();
};

/**
 * @protected
 */
epiviz.ui.charts.Track.prototype._captureMouseHover = function() {
  if (!this._lastRange) { return; }
  this._unhover.notify(new epiviz.ui.charts.VisEventArgs(this.id()));
  var inverseXScale = d3.scale.linear()
    .domain([0, this.width()])
    .range([this._lastRange.start(), this._lastRange.end()]);
  var start = inverseXScale(d3.mouse(this._background[0][0])[0]) - this._binSize / 2;
  var end = start + this._binSize;

  var selectedObject = new epiviz.ui.charts.ChartObject(sprintf('%s-highlight', this.id()), start, end);
  this._hover.notify(new epiviz.ui.charts.VisEventArgs(this.id(), selectedObject));
};

/**
 * @private
 */
epiviz.ui.charts.Track.prototype._drawLegend = function() {
  var self = this;
  this._svg.selectAll('.chart-title').remove();
  this._svg.selectAll('.chart-title-color ').remove();

  if (!this._lastData || !this._lastData.isReady()) { return; }

  var title = '';
  var measurements = this._lastData.measurements();

  var titleEntries = this._svg
    .selectAll('.chart-title')
    .data(measurements)
    .enter()
    .append('text')
    .attr('class', 'chart-title')
    .attr('font-weight', 'bold')
    .attr('fill', function(m, i) {
      if (!self._measurementColorLabels) { return self.colors().get(i); }
      return self.colors().getByKey(self._measurementColorLabels.get(m));
    })
    .attr('y', self.margins().top() - 5)
    .text(function(m, i) { return m.name(); });

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
    .data(measurements)
    .enter()
    .append('circle')
    .attr('class', 'chart-title-color')
    .attr('cx', function(column, i) { return self.margins().left() + 4 + titleEntriesStartPosition[i]; })
    .attr('cy', self.margins().top() - 9)
    .attr('r', 4)
    .style('shape-rendering', 'auto')
    .style('stroke-width', '0')
    .style('fill', function(m, i) {
      if (!self._measurementColorLabels) { return self.colors().get(i); }
      return self.colors().getByKey(self._measurementColorLabels.get(m));
    });
};
