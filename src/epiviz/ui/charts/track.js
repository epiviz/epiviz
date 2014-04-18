/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/22/13
 * Time: 6:47 PM
 */

goog.provide('epiviz.ui.charts.Track');

/**
 * @param {string} id
 * @param {jQuery} container The div where the chart will be drawn
 * @param {epiviz.ui.charts.ChartProperties} properties
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
    .on('mouseout', function () { self._unhover.notify(); });
};

/**
 * @param {epiviz.datatypes.GenomicRange} [range]
 * @param {epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>} [data]
 * @param {number} [slide]
 * @param {number} [zoom]
 * @returns {Array.<epiviz.ui.charts.UiObject>} The objects drawn
 */
epiviz.ui.charts.Track.prototype.draw = function(range, data, slide, zoom) {
  var result = epiviz.ui.charts.Chart.prototype.draw.call(this, range, data);

  this._drawTitle();

  return result;
};

/**
 * @returns {epiviz.ui.charts.ChartType.DisplayType}
 */
epiviz.ui.charts.Track.prototype.displayType = function() { return epiviz.ui.charts.ChartType.DisplayType.TRACK; };

/**
 * @param {epiviz.ui.charts.UiObject} selectedObject
 */
epiviz.ui.charts.Track.prototype.doHover = function(selectedObject) {
  epiviz.ui.charts.Chart.prototype.doHover.call(this, selectedObject);

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
  this._unhover.notify();
  var inverseXScale = d3.scale.linear()
    .domain([0, this.width()])
    .range([this._lastRange.start(), this._lastRange.end()]);
  var start = inverseXScale(d3.mouse(this._background[0][0])[0]) - this._binSize / 2;
  var end = start + this._binSize;

  var selectedObject = new epiviz.ui.charts.UiObject(sprintf('%s-highlight', this._id), start, end, null, null, null, null, null);
  this._hover.notify(selectedObject);
};

/**
 * @private
 */
epiviz.ui.charts.Track.prototype._drawTitle = function() {
  var textLength = 0;
  var title = '';

  var measurements = this.measurements().toArray();

  var self = this;
  this._svg.selectAll('.chart-title').remove();
  this._svg
    .selectAll('.chart-title')
    .data(measurements)
    .enter()
    .append('text')
    .attr('class', 'chart-title')
    .attr('font-weight', 'bold')
    .attr('fill', function(m, i) { return self.colors().get(i); })
    .attr('x', function(m, i) {
      var result = self.margins().left() + textLength;
      textLength += m.name().length * 6 + 7;
      return result;
    })
    .attr('y', self.margins().top() - 5)
    .text(function(m, i) { return m.name(); });
};
