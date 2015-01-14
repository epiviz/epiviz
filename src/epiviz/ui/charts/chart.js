/**
 * Created by: Florin Chelaru
 * Date: 10/3/13
 * Time: 8:21 PM
 */

goog.provide('epiviz.ui.charts.Chart');

/**
 * @param {string} id
 * @param {jQuery} container The div where the chart will be drawn
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @constructor
 * @extends {epiviz.ui.charts.Visualization}
 */
epiviz.ui.charts.Chart = function(id, container, properties) {
  // Call superclass constructor
  epiviz.ui.charts.Visualization.call(this, id, container, properties);

  /**
   * Constant used for mouse highlighting by location
   * @type {number}
   * @protected
   */
  this._nBins = 100;

  /**
   * Used for mouse highlighting by location
   * @type {?number}
   * @protected
   */
  this._binSize = null;
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.Chart.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.Visualization.prototype);
epiviz.ui.charts.Chart.constructor = epiviz.ui.charts.Chart;

/**
 * @protected
 */
epiviz.ui.charts.Chart.prototype._initialize = function() {
  // Call super
  epiviz.ui.charts.Visualization.prototype._initialize.call(this);

  this._svg.classed('base-chart', true);
};

/**
 * Deprecated method, kept for future reference
 * @protected
 * @deprecated
 */
epiviz.ui.charts.Chart.prototype._addFilters = function() {
  var defs = this._svg.append('defs');
  var glow = defs.append('filter')
    .attr('id', this.id() + '-glow');
  glow.append('feGaussianBlur')
    .attr('id', 'gaussianBlur')
    .attr('stdDeviation', '2')
    .attr('result', 'blurResult');
  glow.append('feComposite')
    .attr('id', 'composite')
    .attr('in', 'SourceGraphic')
    .attr('in2', 'blurResult')
    .attr('operator', 'over');

  var contour = defs.append('filter')
    .attr('id', this.id() + '-contour');
  contour.append('feGaussianBlur')
    .attr('in', 'SourceAlpha')
    .attr('stdDeviation', '1')
    .attr('result', 'blur');
  contour.append('feColorMatrix')
    .attr('values', '1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 10 -1 ')
    .attr('result', 'colorMatrix');
  contour.append('feFlood')
    .attr('result', 'fillColor')
    .attr('flood-color', '#800000')
    .attr('in', 'blur');
  contour.append('feComposite')
    .attr('result', 'composite')
    .attr('in', 'fillColor')
    .attr('in2', 'colorMatrix')
    .attr('operator', 'atop');
  contour.append('feComposite')
    .attr('in', 'SourceGraphic')
    .attr('in2', 'composite')
    .attr('operator', 'atop');

  var dropShadow = defs.append('filter')
    .attr('id', this.id() + '-dropshadow')
    .attr('filterUnits', 'userSpaceOnUse')
    .attr('color-interpolation-filters', 'sRGB');
  var temp = dropShadow.append('feComponentTransfer')
    .attr('in', 'SourceAlpha');
  temp.append('feFuncR')
    .attr('type', 'discrete')
    .attr('tableValues', '1');
  temp.append('feFuncG')
    .attr('type', 'discrete')
    .attr('tableValues', 198/255);
  temp.append('feFuncB')
    .attr('type', 'discrete')
    .attr('tableValues', '0');
  dropShadow.append('feGaussianBlur')
    .attr('stdDeviation', '2');
  dropShadow.append('feOffset')
    .attr('dx', '0')
    .attr('dy', '0')
    .attr('result', 'shadow');
  dropShadow.append('feComposite')
    .attr('in', 'SourceGraphic')
    .attr('in2', 'shadow')
    .attr('operator', 'over');
};

/**
 * @param {epiviz.datatypes.GenomicRange} [range]
 * @param {epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>} [data]
 * @returns {Array.<epiviz.ui.charts.ChartObject>} The objects drawn
 */
epiviz.ui.charts.Chart.prototype.draw = function(range, data) {
  epiviz.ui.charts.Visualization.prototype.draw.call(this, range, data);
  if (range) {
    this._binSize = Math.ceil((range.end() - range.start()) / this._nBins);
  }

  // Ordering functionality
  if (this._measurementsOrder) {
    this._lastData = this._lastData.sorted(this._measurementsOrder);
  }

  // Marker functionality
  // If data is defined, then the base class sets this._lastData to data.
  // If it isn't, then we'll use the data from the last draw call
  /*data = this._lastData;
  if (data) {
    var self = this;

    this._markerValues = new epiviz.measurements.MeasurementHashtable();

    var preMethodsResults = {};
    this._markers.forEach(function(marker) {
      if (!marker) { return; }
      preMethodsResults[marker.id()] = marker.preMark()(data);
    });
    data.foreach(function(m, series) {
      var msMap = {};
      self._markerValues.put(m, msMap);
      for (var i = 0; i < series.size(); ++i) {
        var markerMap = {};
        msMap[i + series.globalStartIndex()] = markerMap;
        self._markers.forEach(function(marker) {
          if (!marker) { return; }
          markerMap[marker.id()] = marker.mark()(series.get(i), data, preMethodsResults[marker.id()]);
        });
      }
    });
  }*/

  return [];
};

/**
 * @returns {epiviz.ui.charts.VisualizationProperties}
 */
epiviz.ui.charts.Chart.prototype.properties = function() {
  return /** @type {epiviz.ui.charts.VisualizationProperties} */ epiviz.ui.charts.Visualization.prototype.properties.call(this);
};

/**
 * @returns {Array.<string>}
 */
epiviz.ui.charts.Chart.prototype.colorLabels = function() {
  var self = this;
  var colors = new Array(this.measurements().size());
  this.measurements().foreach(
    /**
     * @param {epiviz.measurements.Measurement} m
     * @param {number} i
     */
    function(m, i) {
      colors[i] = m.name();
    });

  return colors;
};
