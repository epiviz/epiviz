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
 * @extends {epiviz.ui.charts.Visualization.<epiviz.datatypes.GenomicData>}
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

  /**
   * @type {epiviz.measurements.MeasurementHashtable.<string>}
   * @protected
   */
  this._measurementColorLabels = null;

  /**
   * @type {Object.<number, string>}
   * @protected
   */
  this._globalIndexColorLabels = null;
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
 * @param {epiviz.datatypes.GenomicData} [data]
 * @returns {Array.<epiviz.ui.charts.ChartObject>} The objects drawn
 */
epiviz.ui.charts.Chart.prototype.draw = function(range, data) {
  epiviz.ui.charts.Visualization.prototype.draw.call(this, range, data);
  if (range) {
    this._binSize = Math.ceil((range.end() - range.start()) / this._nBins);
  }

  return [];
};

/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {epiviz.datatypes.GenomicData} data
 * @returns {epiviz.deferred.Deferred}
 */
epiviz.ui.charts.Chart.prototype.transformData = function(range, data) {
  var deferred = new epiviz.deferred.Deferred();
  var self = this;
  epiviz.ui.charts.Visualization.prototype.transformData.call(this, range, data)
    .done(function() {
      if (!self._lastData) { deferred.resolve(); return; }
      self._lastData.ready(function() {
        var isFeatureChart = false;
        self._lastData.measurements().every(function(m) { isFeatureChart = m.type() !== epiviz.measurements.Measurement.Type.RANGE; return !isFeatureChart });

        if (isFeatureChart) {
          var groupByMarker;
          self._markers.every(function(marker) {
            if (marker && marker.type() == epiviz.ui.charts.markers.VisualizationMarker.Type.GROUP_BY_MEASUREMENTS) {
              groupByMarker = marker;
            }
            return !groupByMarker;
          });
          if (groupByMarker) {
            var aggregator = epiviz.ui.charts.markers.MeasurementAggregators[
              self.customSettingsValues()[epiviz.ui.charts.ChartType.CustomSettings.MEASUREMENT_GROUPS_AGGREGATOR]];
            self._lastData = new epiviz.datatypes.MeasurementAggregatedGenomicData(self._lastData, groupByMarker, aggregator);
          }
        }

        var filter;
        self._markers.every(function(marker) {
          if (marker && marker.type() == epiviz.ui.charts.markers.VisualizationMarker.Type.FILTER) {
            filter = marker;
          }
          return !filter;
        });
        if (filter) { self._lastData = new epiviz.datatypes.ItemFilteredGenomicData(self._lastData, filter); }

        var order;
        self._markers.every(function(marker) {
          if (marker && marker.type() == epiviz.ui.charts.markers.VisualizationMarker.Type.ORDER_BY_MEASUREMENTS) {
            order = marker;
          }
          return !order;
        });

        if (order) { self._lastData = new epiviz.datatypes.MeasurementOrderedGenomicData(self._lastData, order); }

        self._lastData.ready(function() {
          // self._lastData might have changed since we started to wait for it
          // so check the last version of it
          var data = self._lastData;
          if (data.isReady()) {
            // Also reassign color labels for both measurements and global indices
            var deferredColorByMeasurements = new epiviz.deferred.Deferred();
            var colorByMeasurements;
            self._markers.every(function(marker) {
              if (marker && marker.type() == epiviz.ui.charts.markers.VisualizationMarker.Type.COLOR_BY_MEASUREMENTS) {
                colorByMeasurements = marker;
              }
              return !colorByMeasurements;
            });

            self._measurementColorLabels = null;
            if (colorByMeasurements) {
              var measurementColorLabels = new epiviz.measurements.MeasurementHashtable();
              colorByMeasurements.preMark()(data).done(function(preColorVars) {
                var measurements = data.measurements();
                epiviz.utils.deferredFor(measurements.length, function(j) {
                  var mDeferredIteration = new epiviz.deferred.Deferred();
                  colorByMeasurements.mark()(measurements[j], data, preColorVars).done(function(label) {
                    measurementColorLabels.put(measurements[j], label);
                    mDeferredIteration.resolve();
                  });
                  return mDeferredIteration;
                }).done(function() {
                  self._measurementColorLabels = measurementColorLabels;
                  deferredColorByMeasurements.resolve();
                });
              });
            } else {
              deferredColorByMeasurements.resolve();
            }

            var deferredColorByGlobalIndices = new epiviz.deferred.Deferred();
            var colorByGlobalIndices;
            self._markers.every(function(marker) {
              if (marker && marker.type() == epiviz.ui.charts.markers.VisualizationMarker.Type.COLOR_BY_ROW) {
                colorByGlobalIndices = marker;
              }
              return !colorByGlobalIndices;
            });

            self._globalIndexColorLabels = null;
            if (colorByGlobalIndices) {
              var globalIndexColorLabels = {};
              colorByGlobalIndices.preMark()(data).done(function(preColorVars) {
                var firstSeries = data.firstSeries();
                epiviz.utils.deferredFor(firstSeries.size(), function(j) {
                  var seriesDeferredIteration = new epiviz.deferred.Deferred();
                  colorByGlobalIndices.mark()(firstSeries.getRow(j), data, preColorVars).done(function(label) {
                    globalIndexColorLabels[j + firstSeries.globalStartIndex()] = label;
                    seriesDeferredIteration.resolve();
                  });
                  return seriesDeferredIteration;
                }).done(function() {
                  self._globalIndexColorLabels = globalIndexColorLabels;
                  deferredColorByGlobalIndices.resolve();
                });
              });
            } else {
              deferredColorByGlobalIndices.resolve();
            }

            deferredColorByMeasurements.done(function() {
              if (deferredColorByGlobalIndices.state() == epiviz.deferred.Deferred.State.RESOLVED) {
                self._dataWaitEnd.notify(new epiviz.ui.charts.VisEventArgs(self.id()));
                deferred.resolve();
              }
            });

            deferredColorByGlobalIndices.done(function() {
              if (deferredColorByMeasurements.state() == epiviz.deferred.Deferred.State.RESOLVED) {
                self._dataWaitEnd.notify(new epiviz.ui.charts.VisEventArgs(self.id()));
                deferred.resolve();
              }
            });
          }
        });
      });
    });
  return deferred;
};

/**
 * @returns {epiviz.ui.charts.VisualizationProperties}
 */
epiviz.ui.charts.Chart.prototype.properties = function() {
  return /** @type {epiviz.ui.charts.VisualizationProperties} */ epiviz.ui.charts.Visualization.prototype.properties.call(this);
};
