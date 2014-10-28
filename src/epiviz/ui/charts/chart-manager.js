/**
 * Created by: Florin Chelaru
 * Date: 10/3/13
 * Time: 11:24 PM
 */

goog.provide('epiviz.ui.charts.ChartManager');

/**
 * @param {epiviz.Config} config
 * @constructor
 */
epiviz.ui.charts.ChartManager = function(config) {

  /**
   * @type {epiviz.Config}
   * @private
   */
  this._config = config;

  /**
   * Map id to chart
   * @type {Object.<string, epiviz.ui.charts.Chart>}
   * @private
   */
  this._charts = {};

  /**
   * Each array in the map contains the ids of the charts in order
   * @type {Object.<epiviz.ui.charts.ChartType.DisplayType, Array.<string>>}
   * @private
   */
  this._chartsOrder = {};

  /**
   * Used to resize the charts after window has been resized
   * @type {?number}
   * @private
   */
  this._resizeInterval = null;

  /**
   * @type {epiviz.events.Event.<{
   *   id: string,
   *   type: epiviz.ui.charts.ChartType,
   *   properties: epiviz.ui.charts.ChartProperties,
   *   chartsOrder: Object.<epiviz.ui.charts.ChartType.DisplayType, Array.<string>>
   * }>}
   * @private
   */
  this._chartAdded = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<{id: string, chartsOrder: Object.<epiviz.ui.charts.ChartType.DisplayType, Array.<string>>}>}
   * @private
   */
  this._chartRemoved = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event}
   * @private
   */
  this._chartsCleared = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<{id: string, colors: epiviz.ui.charts.ColorPalette}>}
   * @private
   */
  this._chartColorsChanged = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<{id: string, modifiedMethods: Object.<string, string>}>}
   * @private
   */
  this._chartMethodsModified = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<{id: string, customSettingsValues: Object.<string, *>}>}
   * @private
   */
  this._chartCustomSettingsChanged = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<{id: string, width: number|string, height: number|string}>}
   * @private
   */
  this._chartSizeChanged = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<{id: string, margins: epiviz.ui.charts.Margins}>}
   * @private
   */
  this._chartMarginsChanged = new epiviz.events.Event();

  this._registerWindowResize();
};

/**
 * @param {epiviz.ui.charts.ChartType} chartType
 * @param {epiviz.measurements.MeasurementSet} measurements
 * @param {string} [id] The specific id for the chart. If not
 *   specified, it's generated dynamically
 * @param {epiviz.ui.charts.ChartProperties} [chartProperties]
 * @returns {string} The id of the newly created chart
 */
epiviz.ui.charts.ChartManager.prototype.addChart = function(chartType, measurements, id, chartProperties) {
  id = id || sprintf('%s-%s-%s', chartType.chartDisplayType(), chartType.chartHtmlAttributeName(), epiviz.utils.generatePseudoGUID(5));
  var css = chartType.cssClass();
  var chartsContainer = $('#' + chartType.chartContainer());
  chartsContainer.append(sprintf('<div id="%s" class="%s"></div>', id, css));
  var container = chartsContainer.find('#' + id);

  chartProperties = chartProperties || new epiviz.ui.charts.ChartProperties(
    chartType.defaultWidth(), // width
    chartType.defaultHeight(), // height
    chartType.defaultMargins(), // margins
    measurements, // measurements
    chartType.defaultColors(), // colors
    null, // modified methods
    chartType.customSettingsValues(),
    chartType.customSettingsDefs()
  );

  var chart = chartType.createNew(id, container, chartProperties);
  this._charts[id] = chart;

  this._registerChartHover(chart);
  this._registerChartUnhover(chart);
  this._registerChartSelect(chart);
  this._registerChartDeselect(chart);
  this._registerChartColorsChanged(chart);
  this._registerChartMethodsModified(chart);
  this._registerChartCustomSettingsChanged(chart);
  this._registerChartSizeChanged(chart);
  this._registerChartMarginsChanged(chart);
  this._registerChartRemove(chart);
  this._registerChartSave(chart);

  if (!(chartType.chartDisplayType() in this._chartsOrder)) { this._chartsOrder[chartType.chartDisplayType()] = []; }
  this._chartsOrder[chartType.chartDisplayType()].push(id);

  this._chartAdded.notify({
      id: id,
      type: chartType,
      properties: chartProperties,
      chartsOrder: this._chartsOrder
    });

  return id;
};

/**
 * @param {string} id The id of the chart being removed
 */
epiviz.ui.charts.ChartManager.prototype.removeChart = function(id) {
  $('#' + id).remove();

  var DisplayType = epiviz.ui.charts.ChartType.DisplayType;
  var chart = this._charts[id];
  delete this._charts[id];
  this._chartsOrder[chart.displayType()].splice(this._chartsOrder[chart.displayType()].indexOf(id), 1);

  this._chartRemoved.notify({id: id, chartsOrder: this._chartsOrder});
};

/**
 * Returns a map of chart ids as keys and corresponding measurements as values
 * @returns {Object.<string, epiviz.measurements.MeasurementSet>}
 */
epiviz.ui.charts.ChartManager.prototype.chartsMeasurements = function() {
  /** @type {Object.<string, epiviz.measurements.MeasurementSet>} */
  var result = {};
  for (var chartId in this._charts) {
    if (!this._charts.hasOwnProperty(chartId)) { continue; }

    result[chartId] = this._charts[chartId].measurements();
  }

  return result;
};

/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>} data
 * @param {Array.<string>} [chartIds]
 */
epiviz.ui.charts.ChartManager.prototype.updateCharts = function(range, data, chartIds) {
  chartIds = chartIds || Object.keys(this._charts);
  for (var i = 0; i < chartIds.length; ++i) {
    if (!this._charts.hasOwnProperty(chartIds[i])) { continue; }
    var chart = this._charts[chartIds[i]];
    if (!chart) { continue; }
    chart.draw(range, data);
  }
};

/**
 * Clears all the charts on stage
 */
epiviz.ui.charts.ChartManager.prototype.clear = function() {
  this._charts = {};
  this._chartsOrder = {};

  var chartContainers = epiviz.ui.ControlManager.CHART_TYPE_CONTAINERS;

  for (var displayType in chartContainers) {
    if (!chartContainers.hasOwnProperty(displayType)) { continue; }
    $('#' + chartContainers[displayType]).empty();
  }

  this._chartsCleared.notify();
};

/**
 * Tells all charts to display loading animation until new data is loaded
 * @param {string} [chartId]
 */
epiviz.ui.charts.ChartManager.prototype.addChartsLoaderAnimation = function(chartId) {
  if (chartId && this._charts[chartId]) {
    this._charts[chartId].addLoaderAnimation();
    return;
  }
  for (var id in this._charts) {
    if (!this._charts.hasOwnProperty(chartId)) { continue; }
    this._charts[chartId].addLoaderAnimation();
  }
};

/**
 * @returns {epiviz.events.Event.<{
 *   id: string,
 *   type: epiviz.ui.charts.ChartType,
 *   properties: epiviz.ui.charts.ChartProperties,
 *   chartsOrder: Object.<epiviz.ui.charts.ChartType.DisplayType, Array.<string>>}>}
 */
epiviz.ui.charts.ChartManager.prototype.onChartAdded = function() { return this._chartAdded; };

/**
 * @returns {epiviz.events.Event.<{chartId: string, chartsOrder: Object.<epiviz.ui.charts.ChartType.DisplayType, Array.<string>>}>}
 */
epiviz.ui.charts.ChartManager.prototype.onChartRemoved = function() { return this._chartRemoved; };

/**
 * @returns {epiviz.events.Event}
 */
epiviz.ui.charts.ChartManager.prototype.onChartsCleared = function() { return this._chartsCleared; };

/**
 * @returns {epiviz.events.Event.<{id: string, colors: epiviz.ui.charts.ColorPalette}>}
 */
epiviz.ui.charts.ChartManager.prototype.onChartColorsChanged = function() { return this._chartColorsChanged; };

/**
 * @returns {epiviz.events.Event.<{id: string, modifiedMethods: Object.<string, string>}>}
 */
epiviz.ui.charts.ChartManager.prototype.onChartMethodsModified = function() { return this._chartMethodsModified; };

/**
 * @returns {epiviz.events.Event.<{id: string, customSettingsValues: Object.<string, *>}>}
 */
epiviz.ui.charts.ChartManager.prototype.onChartCustomSettingsChanged = function() { return this._chartCustomSettingsChanged; };

/**
 * @returns {epiviz.events.Event.<{id: string, width: number|string, height: number|string}>}
 */
epiviz.ui.charts.ChartManager.prototype.onChartSizeChanged = function() { return this._chartSizeChanged; };

/**
 * @returns {epiviz.events.Event.<{id: string, margins: epiviz.ui.charts.Margins}>}
 */
epiviz.ui.charts.ChartManager.prototype.onChartMarginsChanged = function() { return this._chartMarginsChanged; };

/**
 * @private
 */
epiviz.ui.charts.ChartManager.prototype._registerWindowResize = function() {
  var self = this;
  $(window).resize(function(e) {
    if (self._resizeInterval !== null) { window.clearTimeout(self._resizeInterval); }
    self._resizeInterval = window.setTimeout(function() {
      for (var chartId in self._charts) {
        if (!self._charts.hasOwnProperty(chartId)) { continue; }
        self._charts[chartId].containerResize();
      }
      self._resizeInterval = null;
    }, 500);
  });
};

/**
 * @param {epiviz.ui.charts.Chart} chart
 * @private
 */
epiviz.ui.charts.ChartManager.prototype._registerChartHover = function(chart) {
  var self = this;
  chart.onHover().addListener(new epiviz.events.EventListener(
    /** @param {epiviz.ui.charts.UiObject} selectedObject */
    function(selectedObject) {
      for (var id in self._charts) {
        if (!self._charts.hasOwnProperty(id)) { continue; }
        self._charts[id].doHover(selectedObject);
      }
    }));
};

/**
 * @param {epiviz.ui.charts.Chart} chart
 * @private
 */
epiviz.ui.charts.ChartManager.prototype._registerChartUnhover = function(chart) {
  var self = this;
  chart.onUnhover().addListener(new epiviz.events.EventListener(function() {
    for (var id in self._charts) {
      if (!self._charts.hasOwnProperty(id)) { continue; }
      self._charts[id].doUnhover();
    }
  }));
};

/**
 * @param {epiviz.ui.charts.Chart} chart
 * @private
 */
epiviz.ui.charts.ChartManager.prototype._registerChartSelect = function(chart) {
  var self = this;
  chart.onSelect().addListener(new epiviz.events.EventListener(
    /** @param {epiviz.ui.charts.UiObject} selectedObject */
      function(selectedObject) {
      for (var id in self._charts) {
        if (!self._charts.hasOwnProperty(id)) { continue; }
        self._charts[id].doSelect(selectedObject);
      }
    }));
};

/**
 * @param {epiviz.ui.charts.Chart} chart
 * @private
 */
epiviz.ui.charts.ChartManager.prototype._registerChartDeselect = function(chart) {
  var self = this;
  chart.onDeselect().addListener(new epiviz.events.EventListener(function() {
    for (var id in self._charts) {
      if (!self._charts.hasOwnProperty(id)) { continue; }
      self._charts[id].doDeselect();
    }
  }));
};

/**
 * @param {epiviz.ui.charts.Chart} chart
 * @private
 */
epiviz.ui.charts.ChartManager.prototype._registerChartRemove = function(chart) {
  var self = this;
  chart.onRemove().addListener(new epiviz.events.EventListener(function() {
    self.removeChart(chart.id());
  }));
};

/**
 * @param {epiviz.ui.charts.Chart} chart
 * @private
 */
epiviz.ui.charts.ChartManager.prototype._registerChartSave = function(chart) {
  var self = this;
  chart.onSave().addListener(new epiviz.events.EventListener(function(chartId) {
    var saveSvgDialog = new epiviz.ui.controls.SaveSvgAsImageDialog(
      {ok: function(){}, cancel: function(){}},
      chartId,
      self._config.dataServerLocation + self._config.chartSaverLocation);

    saveSvgDialog.show();
  }));
};

/**
 * @param {epiviz.ui.charts.Chart} chart
 * @private
 */
epiviz.ui.charts.ChartManager.prototype._registerChartColorsChanged = function(chart) {
  var self = this;
  chart.onColorsChanged().addListener(new epiviz.events.EventListener(function(e) {
    self._chartColorsChanged.notify(e);
  }));
};

/**
 * @param {epiviz.ui.charts.Chart} chart
 * @private
 */
epiviz.ui.charts.ChartManager.prototype._registerChartMethodsModified = function(chart) {
  var self = this;
  chart.onMethodsModified().addListener(new epiviz.events.EventListener(function(e) {
    self._chartMethodsModified.notify(e);
  }));
};

/**
 * @param {epiviz.ui.charts.Chart} chart
 * @private
 */
epiviz.ui.charts.ChartManager.prototype._registerChartCustomSettingsChanged = function(chart) {
  var self = this;
  chart.onCustomSettingsChanged().addListener(new epiviz.events.EventListener(function(e) {
    self._chartCustomSettingsChanged.notify(e);
  }));
};

/**
 * @param {epiviz.ui.charts.Chart} chart
 * @private
 */
epiviz.ui.charts.ChartManager.prototype._registerChartSizeChanged = function(chart) {
  var self = this;
  chart.onSizeChanged().addListener(new epiviz.events.EventListener(function(e) {
    self._chartSizeChanged.notify(e);
  }));
};

/**
 * @param {epiviz.ui.charts.Chart} chart
 * @private
 */
epiviz.ui.charts.ChartManager.prototype._registerChartMarginsChanged = function(chart) {
  var self = this;
  chart.onMarginsChanged().addListener(new epiviz.events.EventListener(function(e) {
    self._chartMarginsChanged.notify(e);
  }));
};
