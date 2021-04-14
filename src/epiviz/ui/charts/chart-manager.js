/**
 * Created by: Florin Chelaru
 * Date: 10/3/13
 * Time: 11:24 PM
 */

goog.provide('epiviz.ui.charts.ChartManager');

goog.require('epiviz.events.Event');
goog.require('epiviz.ui.charts.markers.VisualizationMarker');
goog.require('epiviz.utils');
goog.require('epiviz.ui.ControlManager');
goog.require('epiviz.ui.charts.VisualizationProperties');
goog.require('epiviz.ui.charts.VisEventArgs');
goog.require('epiviz.ui.charts.VisualizationType');
goog.require('epiviz.events.EventListener');
goog.require('epiviz.ui.controls.SaveSvgAsImageDialog');
goog.require('epiviz.ui.charts.decoration.RemoveChartButton');
goog.require('epiviz.ui.charts.decoration.SaveChartButton');
goog.require('epiviz.ui.charts.decoration.CustomSettingsButton');
goog.require('epiviz.ui.charts.decoration.EditCodeButton');
goog.require('epiviz.ui.charts.decoration.ChartColorsButton');
goog.require('epiviz.ui.charts.decoration.ChartLoaderAnimation');
goog.require('epiviz.ui.charts.decoration.ChartResize');
goog.require('epiviz.ui.charts.decoration.ToggleTooltipButton');
goog.require('epiviz.ui.charts.decoration.ChartTooltip');
goog.require('epiviz.ui.charts.decoration.ChartFilterCodeButton');
goog.require('epiviz.ui.charts.tree.decoration.TogglePropagateSelectionButton');
goog.require('epiviz.ui.charts.decoration.HierarchyFilterCodeButton');
goog.require('epiviz.ui.charts.decoration.ChartGroupByMeasurementsCodeButton');
goog.require('epiviz.ui.charts.decoration.ChartColorByMeasurementsCodeButton');
goog.require('epiviz.ui.charts.decoration.ChartOrderByMeasurementsCodeButton');
goog.require('epiviz.ui.charts.decoration.ChartColorByRowCodeButton');

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
   * @type {Object.<epiviz.ui.charts.VisualizationType.DisplayType, Array.<string>>}
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
   * @type {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<{
   *   type: epiviz.ui.charts.ChartType,
   *   properties: epiviz.ui.charts.VisualizationProperties,
   *   chartsOrder: Object.<epiviz.ui.charts.VisualizationType.DisplayType, Array.<string>>
   * }>>}
   * @private
   */
  this._chartAdded = new epiviz.events.Event();

  /**
   * Argument is chartsOrder: track -> ids, plot -> ids
   * @type {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<Object.<epiviz.ui.charts.VisualizationType.DisplayType, Array.<string>>>>}
   * @private
   */
  this._chartRemoved = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<Object.<epiviz.ui.charts.VisualizationType.DisplayType, Array.<string>>>}
   * @private
   */
  this._chartsOrderChanged = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event}
   * @private
   */
  this._chartsCleared = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<epiviz.ui.charts.ColorPalette>>}
   * @private
   */
  this._chartColorsChanged = new epiviz.events.Event();

  /**
   * Event arg: a map of method -> code
   * @type {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<Object.<string, string>>>}
   * @private
   */
  this._chartMethodsModified = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs>}
   * @private
   */
  this._chartMethodsReset = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<Array.<epiviz.ui.charts.markers.VisualizationMarker>>>}
   * @private
   */
  this._chartMarkersModified = new epiviz.events.Event();

  /**
   * Event arg: custom settings values setting -> value
   * @type {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<Object.<string, *>>>}
   * @private
   */
  this._chartCustomSettingsChanged = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<{width: number|string, height: number|string}>>}
   * @private
   */
  this._chartSizeChanged = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<epiviz.ui.charts.Margins>>}
   * @private
   */
  this._chartMarginsChanged = new epiviz.events.Event();

  /**
   * event -> event args -> selection -> data
   * @type {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<epiviz.ui.controls.VisConfigSelection.<*>>>}
   * @protected
   */
  this._chartRequestHierarchy = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<{selection: Object.<string, epiviz.ui.charts.tree.NodeSelectionType>, order: Object.<string, number>}>>}
   * @private
   */
  this._chartPropagateHierarchyChanges = new epiviz.events.Event();

  this._chartPropogateIcicleLocationChanges = new epiviz.events.Event();

  this._chartIcicleLocationChanges = new epiviz.events.Event();

  this._chartPropagateNavigationChanges = new epiviz.events.Event();
  
  this._registerWindowResize();
};

/**
 * @param {epiviz.ui.charts.ChartType} chartType
 * @param {epiviz.ui.controls.VisConfigSelection} visConfigSelection
 * @param {string} [id] The specific id for the chart. If not
 *   specified, it's generated dynamically
 * @param {epiviz.ui.charts.VisualizationProperties} [chartProperties]
 * @returns {string} The id of the newly created chart
 */
epiviz.ui.charts.ChartManager.prototype.addChart = function(chartType, visConfigSelection, id, chartProperties) {
  id = id || sprintf('%s-%s-%s', chartType.chartDisplayType(), chartType.chartHtmlAttributeName(), epiviz.utils.generatePseudoGUID(5));
  var css = chartType.cssClass();

  var chartDisplayTypeContainer = $('#' + chartType.chartContainer());
  var chartsAccordion = chartDisplayTypeContainer.find('.accordion');
  var chartsContainer = chartsAccordion.find('.vis-container');
  if (chartsAccordion.length == 0) {
    chartsAccordion = $('<div class="accordion"></div>').appendTo(chartDisplayTypeContainer);
    var displayType = chartType.chartDisplayType();
    chartsAccordion.append(
      sprintf('<h3><a href="#"><b><span style="color: #025167">Views by %s</span></b></a></h3>',
        epiviz.ui.ControlManager.DISPLAY_TYPE_LABELS[displayType]));
    chartsContainer = $('<div class="vis-container"></div>').appendTo(chartsAccordion);
    chartsAccordion.multiAccordion();
    chartsAccordion.multiAccordion('option', 'active', 'all');
    var self = this;
    // TODO: This doesn't go well with the icicle, because that requires a lot of drag & drop
    // TODO: Once we find a solution for it, re-enable the feature
    /*chartsContainer.sortable({
      stop: function(e, ui) {
        var newOrder = chartsContainer.find('.visualization-container')
          .map(function(i, el) {
            return $(el).attr('id');
          });
        if (epiviz.utils.arraysEqual(newOrder, self._chartsOrder[displayType])) { return; }
        self._chartsOrder[displayType] = newOrder;
        self._chartsOrderChanged.notify(self._chartsOrder);
      }
    });*/
  }

  chartsContainer.append(sprintf('<div id="%s" class="%s"></div>', id, css));
  var container = chartsContainer.find('#' + id);

  var chartMarkers = []; 
  
  if( chartType._defaultSettings.chartMarkers != null || chartType._defaultSettings.chartMarkers != undefined) {
    for (var i=0; i < chartType._defaultSettings.chartMarkers.length ; i++ ) {
      var tMark = chartType._defaultSettings.chartMarkers[i];
      chartMarkers.push(new epiviz.ui.charts.markers.VisualizationMarker(tMark.type, tMark.id, tMark.name, tMark.preMark, tMark.mark));
    }
  } 

  chartProperties = chartProperties || new epiviz.ui.charts.VisualizationProperties(
    chartType.defaultWidth(), // width
    chartType.defaultHeight(), // height
    chartType.defaultMargins(), // margins
    visConfigSelection, // configuration of measurements and other information selected by the user
    chartType.defaultColors(), // colors
    null, // modified methods
    chartType.customSettingsValues(),
    chartType.customSettingsDefs(),
    //[],
    chartMarkers
  );

  var chart = chartType.createNew(id, container, chartProperties);
  chart._createdChartType = chartType;
  this._charts[id] = chart;

  this._registerChartHover(chart);
  this._registerChartUnhover(chart);
  this._registerChartSelect(chart);
  this._registerChartDeselect(chart);
  this._registerChartColorsChanged(chart);
  this._registerChartMethodsModified(chart);
  this._registerChartMethodsReset(chart);
  this._registerChartMarkersModified(chart);
  this._registerChartCustomSettingsChanged(chart);
  this._registerChartSizeChanged(chart);
  this._registerChartMarginsChanged(chart);
  this._registerChartRemove(chart);
  this._registerChartSave(chart);
  this._registerChartRequestHierarchy(chart);
  this._registerChartPropagateHierarchyChanges(chart);
  this._registerChartPropogateIcicleLocationChanges(chart);
  this._registerChartIcicleLocationChanges(chart);
  this._registerChartPropagateNavigationChanges(chart);

  if (chartType.decorations()) {
    /** @type {epiviz.ui.charts.decoration.VisualizationDecoration} */
    var topDecoration = undefined;
    for (var i = 0; i < chartType.decorations().length; ++i) {
      /** @type {?(function(new:epiviz.ui.charts.decoration.VisualizationDecoration))} */
      var decorationCtor = epiviz.utils.evaluateFullyQualifiedTypeName(chartType.decorations()[i]);

      if (!decorationCtor) { continue; }

      /** @type {epiviz.ui.charts.decoration.VisualizationDecoration} */
      topDecoration  = epiviz.utils.applyConstructor(decorationCtor, [chart, topDecoration, this._config]);
    }

    if (topDecoration) {
      topDecoration.decorate();
    }
  }

  if (!(chartType.chartDisplayType() in this._chartsOrder)) { this._chartsOrder[chartType.chartDisplayType()] = []; }
  this._chartsOrder[chartType.chartDisplayType()].push(id);

  this._chartAdded.notify(new epiviz.ui.charts.VisEventArgs(id, {
      type: chartType,
      properties: chartProperties,
      chartsOrder: this._chartsOrder
    }));

  return id;
};

/**
 * @param {string} id The id of the chart being removed
 */
epiviz.ui.charts.ChartManager.prototype.removeChart = function(id) {
  $('#' + id).remove();

  var chart = this._charts[id];
  delete this._charts[id];
  this._chartsOrder[chart.displayType()].splice(this._chartsOrder[chart.displayType()].indexOf(id), 1);

  var chartDisplayTypeContainer = $('#' + epiviz.ui.ControlManager.CHART_TYPE_CONTAINERS[chart.displayType()]);
  var chartsAccordion = chartDisplayTypeContainer.find('.accordion');
  var chartsContainer = chartsAccordion.find('.vis-container');
  if (chartsContainer.children().length == 0) {
    chartDisplayTypeContainer.empty();
  }

  this._chartRemoved.notify(new epiviz.ui.charts.VisEventArgs(id, this._chartsOrder));
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
    if (this._charts[chartId].displayType() == epiviz.ui.charts.VisualizationType.DisplayType.DATA_STRUCTURE) { continue; }
    result[chartId] = this._charts[chartId].measurements();
  }

  return result;
};

/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {epiviz.datatypes.GenomicData} data
 * @param {Array.<string>} [chartIds]
 */
epiviz.ui.charts.ChartManager.prototype.updateCharts = function(range, data, chartIds) {
  chartIds = chartIds || Object.keys(this._charts);
  for (var i = 0; i < chartIds.length; ++i) {
    if (!this._charts.hasOwnProperty(chartIds[i])) { continue; }
    var chart = this._charts[chartIds[i]];
    if (!chart) { continue; }

    (function(chart) {
      chart.transformData(range, data).done(function() {
        // No need to call with arguments, since transformData will set the lastRange and lastData values

        //  only do this for bigwigs, bigbeds
        if (["gwaspip", "gwas", "blocks", "stacked-blocks"].includes(chart._createdChartType.chartHtmlAttributeName())) {
          var msFlag = false;
          data.foreach(function(m, series, i) {
            if (series.getRow(0)) {
              var metadataFromData = Object.keys(series.getRow(0).rowMetadata());
              var ms = chart._properties.visConfigSelection.measurements.get(i);
              ms._metadata = metadataFromData;
              msFlag = true;
            }
          });
          
          if (msFlag) {
            chart._properties.customSettingsDefs = chart._createdChartType.customSettingsDefs();
            for (var i = 0; i < chart._properties.customSettingsDefs.length; ++i) {
              var setting = chart._properties.customSettingsDefs[i];
              var val = chart._properties.customSettingsValues[setting.id];
              switch (setting.type) {
                case epiviz.ui.charts.CustomSetting.Type.MEASUREMENTS_METADATA:
                  var possibleValues = {};
                  chart._properties.visConfigSelection.measurements.foreach(function(m) {
                    m.metadata().forEach(function(metadataCol) {
                      possibleValues[metadataCol] = metadataCol;
                    });
                  });
                  setting.possibleValues = Object.keys(possibleValues);
                  setting.possibleValues.sort();
                  val = val || setting.defaultValue;
                  chart._customSettingsValues[setting.id] =
                    val in possibleValues
                      ? val
                      : setting.possibleValues.length
                        ? setting.possibleValues[0]
                        : "";
                  break;
                case epiviz.ui.charts.CustomSetting.Type.MEASUREMENTS_ANNOTATION:
                  var possibleValues = { name: "name" };
                  chart._properties.visConfigSelection.measurements.foreach(function(m) {
                    var anno = m.annotation();
                    if (!anno) {
                      return;
                    }
                    Object.keys(anno).forEach(function(key) {
                      possibleValues[key] = key;
                    });
                  });
                  setting.possibleValues = Object.keys(possibleValues);
                  setting.possibleValues.sort();
                  val = val || setting.defaultValue;
                  chart._customSettingsValues[setting.id] =
                    val in possibleValues
                      ? val
                      : setting.possibleValues.length
                        ? setting.possibleValues[0]
                        : "";
                  break;
                default:
                  chart._customSettingsValues[setting.id] = val || setting.defaultValue;
                  break;
              }
            }
          }
        }

        var result = chart.draw();

        chart._svg
        .select(".no-data-text")
        .remove();

        if (result.length == 0) {
              chart._svg
              .append("text")
              .attr("font-weight", "bold")
              .attr("font-style", "italic")
              .attr("fill", "#C0C0C0")
              .attr("transform", "translate(" + (chart.width() / 2) + "," + (chart.height() / 2) + ")")
              .attr("class", "no-data-text")
              .text(function(d) { return "No data in this region"; });
        }
      });
    })(chart);
  }
};

/**
 */
epiviz.ui.charts.ChartManager.prototype.updateDataStructureCharts = function() {
  var chartIds = Object.keys(this._charts);
  for (var i = 0; i < chartIds.length; ++i) {
    if (!this._charts.hasOwnProperty(chartIds[i])) { continue; }
    var chart = this._charts[chartIds[i]];
    if (!chart) { continue; }
    if (chart.displayType() != epiviz.ui.charts.VisualizationType.DisplayType.DATA_STRUCTURE) { continue; }

    (function(chart) {
      setTimeout(function() {
        chart.fireRequestHierarchy();
      }, 0);
    })(chart);
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
 * Tells all charts that new data has been requested.
 * Used, for example, by ChartLoaderAnimation decoration.
 * @param {string} [chartId]
 * @param {function(epiviz.ui.charts.Visualization): boolean} [chartFilter]
 */
epiviz.ui.charts.ChartManager.prototype.dataWaitStart = function(chartId, chartFilter) {
  if (chartId && this._charts[chartId]) {
    this._charts[chartId].onDataWaitStart().notify(new epiviz.ui.charts.VisEventArgs(chartId));
    return;
  }
  for (var id in this._charts) {
    if (!this._charts.hasOwnProperty(id)) { continue; }
    if (!chartFilter || !chartFilter[this._charts[id]]) { continue; }
    this._charts[id].onDataWaitStart().notify(new epiviz.ui.charts.VisEventArgs(id));
  }
};

/**
 * @returns {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<{type: epiviz.ui.charts.ChartType, properties: epiviz.ui.charts.VisualizationProperties, chartsOrder: Object.<epiviz.ui.charts.VisualizationType.DisplayType, Array.<string>>}>>}
 */
epiviz.ui.charts.ChartManager.prototype.onChartAdded = function() { return this._chartAdded; };

/**
 * @returns {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<Object.<epiviz.ui.charts.VisualizationType.DisplayType, Array.<string>>>>}
 */
epiviz.ui.charts.ChartManager.prototype.onChartRemoved = function() { return this._chartRemoved; };

/**
 * @returns {epiviz.events.Event.<Object.<epiviz.ui.charts.VisualizationType.DisplayType, Array.<string>>>}
 */
epiviz.ui.charts.ChartManager.prototype.onChartsOrderChanged = function() { return this._chartsOrderChanged; };

/**
 * @returns {epiviz.events.Event}
 */
epiviz.ui.charts.ChartManager.prototype.onChartsCleared = function() { return this._chartsCleared; };

/**
 * @returns {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<epiviz.ui.charts.ColorPalette>>}
 */
epiviz.ui.charts.ChartManager.prototype.onChartColorsChanged = function() { return this._chartColorsChanged; };

/**
 * @returns {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<Object.<string, string>>>}
 */
epiviz.ui.charts.ChartManager.prototype.onChartMethodsModified = function() { return this._chartMethodsModified; };

/**
 * @returns {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs>}
 */
epiviz.ui.charts.ChartManager.prototype.onChartMethodsReset = function() { return this._chartMethodsReset; };

/**
 * @returns {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<Array.<epiviz.ui.charts.markers.VisualizationMarker>>>}
 */
epiviz.ui.charts.ChartManager.prototype.onChartMarkersModified = function() { return this._chartMarkersModified; };

/**
 * @returns {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<Object.<string, *>>>}
 */
epiviz.ui.charts.ChartManager.prototype.onChartCustomSettingsChanged = function() { return this._chartCustomSettingsChanged; };

/**
 * @returns {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<{width: (number|string), height: (number|string)}>>}
 */
epiviz.ui.charts.ChartManager.prototype.onChartSizeChanged = function() { return this._chartSizeChanged; };

/**
 * @returns {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<epiviz.ui.charts.Margins>>}
 */
epiviz.ui.charts.ChartManager.prototype.onChartMarginsChanged = function() { return this._chartMarginsChanged; };

/**
 * @returns {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<epiviz.ui.controls.VisConfigSelection.<*>>>}
 */
epiviz.ui.charts.ChartManager.prototype.onChartRequestHierarchy = function() { return this._chartRequestHierarchy; };

/**
 * @returns {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<{selection: Object.<string, epiviz.ui.charts.tree.NodeSelectionType>, order: Object.<string, number>}>>}
 */
epiviz.ui.charts.ChartManager.prototype.onChartPropagateHierarchyChanges = function() { return this._chartPropagateHierarchyChanges; };

epiviz.ui.charts.ChartManager.prototype.onChartPropogateIcicleLocationChanges = function() { return this._chartPropogateIcicleLocationChanges; };

epiviz.ui.charts.ChartManager.prototype.onChartIcicleLocationChanges = function() { return this._chartIcicleLocationChanges; };

epiviz.ui.charts.ChartManager.prototype.onChartPropagateNavigationChanges = function() { return this._chartPropagateNavigationChanges; };

/**
 * @private
 */
epiviz.ui.charts.ChartManager.prototype._registerWindowResize = function() {
  var self = this;
  $(window).resize(function() {
    if (self._resizeInterval !== null) { window.clearTimeout(self._resizeInterval); }
    self._resizeInterval = window.setTimeout(function() {
      for (var chartId in self._charts) {
        if (!self._charts.hasOwnProperty(chartId)) { continue; }
        self._charts[chartId].updateSize();
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
    /** @param {epiviz.ui.charts.VisEventArgs.<epiviz.ui.charts.ChartObject>} e */
    function(e) {
      for (var id in self._charts) {
        if (!self._charts.hasOwnProperty(id)) { continue; }
        self._charts[id].doHover(e.args);
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
    /** @param {epiviz.ui.charts.VisEventArgs.<epiviz.ui.charts.ChartObject>} e */
      function(e) {
      var selectedObject = e.args;
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
  chart.onRemove().addListener(new epiviz.events.EventListener(
    /** @param {epiviz.ui.charts.VisEventArgs} e */
    function(e) { self.removeChart(e.id); }));
};

/**
 * @param {epiviz.ui.charts.Chart} chart
 * @private
 */
epiviz.ui.charts.ChartManager.prototype._registerChartSave = function(chart) {
  var self = this;

  if(self._config.configType != "default") {
    chart.onSave().addListener(new epiviz.events.EventListener(
        /** @param {epiviz.ui.charts.VisEventArgs} e */
        function(e) {
          var pm = new epiviz.ui.PrintManager(e.id, "epiviz_" + Math.floor($.now() / 1000), "pdf");
          pm.print();
        }));
  }
  else {
    chart.onSave().addListener(new epiviz.events.EventListener(
        /** @param {epiviz.ui.charts.VisEventArgs} e */
        function(e) {
          var saveSvgDialog = new epiviz.ui.controls.SaveSvgAsImageDialog(
              {ok: function(){}, cancel: function(){}},
              e.id,
              self._config.dataServerLocation + self._config.chartSaverLocation);

          saveSvgDialog.show();
        }));
  }

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
epiviz.ui.charts.ChartManager.prototype._registerChartMethodsReset = function(chart) {
  var self = this;
  chart.onMethodsReset().addListener(new epiviz.events.EventListener(function(e) {
    self._chartMethodsReset.notify(e);
  }));
};

/**
 * @param {epiviz.ui.charts.Chart} chart
 * @private
 */
epiviz.ui.charts.ChartManager.prototype._registerChartMarkersModified = function(chart) {
  var self = this;
  chart.onMarkersModified().addListener(new epiviz.events.EventListener(function(e) {
    self._chartMarkersModified.notify(e);
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

/**
 * @param {epiviz.ui.charts.Visualization} chart
 * @private
 */
epiviz.ui.charts.ChartManager.prototype._registerChartRequestHierarchy = function(chart) {
  var self = this;
  if (chart.displayType() == epiviz.ui.charts.VisualizationType.DisplayType.DATA_STRUCTURE) {
    var dataStructVis = /** @type {epiviz.ui.charts.DataStructureVisualization} */ chart; // Assignment done for consistency
    dataStructVis.onRequestHierarchy().addListener(new epiviz.events.EventListener(function(e) {
      self._chartRequestHierarchy.notify(e);
    }));
  }
};

/**
 * @param {epiviz.ui.charts.Visualization} chart
 * @private
 */
epiviz.ui.charts.ChartManager.prototype._registerChartPropagateHierarchyChanges = function(chart) {
  var self = this;
  if (chart.displayType() == epiviz.ui.charts.VisualizationType.DisplayType.DATA_STRUCTURE) {
    var dataStructVis = /** @type {epiviz.ui.charts.DataStructureVisualization} */ chart; // Assignment done for consistency
    dataStructVis.onPropagateHierarchyChanges().addListener(new epiviz.events.EventListener(function(e) {
      self._chartPropagateHierarchyChanges.notify(e);
    }));
  }
};

epiviz.ui.charts.ChartManager.prototype._registerChartPropogateIcicleLocationChanges = function(chart) {
  var self = this;

  if (chart.displayType() == epiviz.ui.charts.VisualizationType.DisplayType.DATA_STRUCTURE) {
    var dataStructVis = /** @type {epiviz.ui.charts.DataStructureVisualization} */ chart; // Assignment done for consistency
    dataStructVis.onPropagateIcicleLocationChanges().addListener(new epiviz.events.EventListener(function(e) {
      self._chartPropogateIcicleLocationChanges.notify(e);
    }));
  }
};

epiviz.ui.charts.ChartManager.prototype._registerChartIcicleLocationChanges = function(chart) {
   var self = this;

   self.onChartIcicleLocationChanges().addListener(new epiviz.events.EventListener(function(e) {
      if (chart.displayType() == epiviz.ui.charts.VisualizationType.DisplayType.DATA_STRUCTURE) {
        chart._updateLocation(e.args.start, e.args.width);
        chart._drawAxes(chart._lastRoot);
      }
   }));
}; 


epiviz.ui.charts.ChartManager.prototype._registerChartPropagateNavigationChanges = function(chart) {
  var self = this;

  if (chart.displayType() == epiviz.ui.charts.VisualizationType.DisplayType.TRACK) {
    chart._propagateNavigationChanges.addListener(new epiviz.events.EventListener(function(e) {
      self._chartPropagateNavigationChanges.notify(e);
    }));
  }
}; 

epiviz.ui.charts.ChartManager.prototype.getChartSettings = function(id) {

  var chart = this._charts[id];
  var result = {};
  //result['defs'] = chart.properties().customSettingsDefs;
  result['settings'] = chart.customSettingsValues();
  result['colorMap'] = chart.properties().colors;
  return result;

};

epiviz.ui.charts.ChartManager.prototype.setChartSettings = function(id, settings, colorMap) {

  var chart = this._charts[id];

  if(settings != null) {
    var currentSettings = chart.customSettingsValues();

    var all_keys = Object.keys(settings);

    all_keys.forEach(function(key) {
      currentSettings[key] = settings[key];
    });

    chart.setCustomSettingsValues(currentSettings);
  }

  if(colorMap != null) {
    chart.setColors(colorMap);
  }

  chart.draw();
};

