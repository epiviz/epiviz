/**
 * Created with JetBrains PhpStorm.
 * User: florin
 * Date: 1/21/13
 * Time: 9:48 AM
 * To change this template use File | Settings | File Templates.
 */

function ChartManager() {
  this._nextId = 0;

  this._trackIds = [];
  this._tracks = {};

  this._plotIds = [];
  this._plots = {};

  this._trackContainerId = null;
  this._plotContainerId = null;

  this._trackContainer = null;
  this._plotContainer = null;
}

ChartManager.instance = new ChartManager();

ChartManager.prototype.initialize = function(trackContainerId, xyChartContainerId) {
  this._trackContainerId = trackContainerId;
  this._plotContainerId = xyChartContainerId;

  this._trackContainer = $(this._trackContainerId);
  this._plotContainer = $(this._plotContainerId);

  EventManager.instance.addEventListener(EventManager.eventTypes.MEASUREMENTS_LOADED, this);
  EventManager.instance.addEventListener(EventManager.eventTypes.WORKSPACE_LOADED, this);
};

ChartManager.prototype._getNextId = function() {
  return this._nextId++;
};

ChartManager.prototype._chartResizable = function(chartId, chart) {
  $('#' + chartId).resizable({
    resize:function (event, ui) {
      chart.onContainerResize(ui.size.width, ui.size.height);
    },
    stop:function (event, ui) {
      chart.onContainerResizeFinish(ui.size.width, ui.size.height);
    }
  });
};

ChartManager.prototype.addChart = function(workspaceData, useUI) {
  var chartType = workspaceData[0];
  var chartHandler = ChartFactory.instance.getChartHandlerByChartType(chartType);

  switch (chartHandler.getChartDisplayType()) {
    case ChartDisplayType.TRACK:
      return this.addTrack(workspaceData, chartHandler, useUI);
    case ChartDisplayType.PLOT:
      return this.addPlot(workspaceData, chartHandler, useUI);
    default:
      return null;
  }
};

ChartManager.prototype.addTrack = function (workspaceData, chartHandler, useUI) {
  useUI = typeof useUI != 'undefined' ? useUI : true;

  var chartDetails = this._addChart(workspaceData, chartHandler, useUI);


  if (useUI) {
    var liId = sprintf('li_%s', chartDetails.numericId);
    $('#sortable-track-list').append(
    '<li class="ui-state-default" data-id="' + chartDetails.id + '" id="'+liId+'">' +
    ((chartDetails.chart._title == '') ? chartHandler.getChartTypeName() + ' (' + chartDetails.numericId + ')' : chartDetails.chart._title) + '</li>');
  }

  this._trackIds.push(chartDetails.id);
  this._tracks[chartDetails.id] = chartDetails.chart;

  EventManager.instance.chartAdded(this, chartDetails.id, chartDetails.measurementsMap);

  return chartDetails.id;
};

ChartManager.prototype.removeChart = function(id) {
  var chart = $('#' + id);
  chart.remove();

  var ids = null;
  var charts = null;

  if (this._tracks[id]) {
    var numericId = id.substr(id.indexOf('_') + 1);
    var liId = sprintf('li_%s', numericId);
    $('#' + liId).remove();

    ids = this._trackIds;
    charts = this._tracks;
  } else {
    ids = this._plotIds;
    charts = this._plots;
  }

  ids.splice(ids.indexOf(id), 1);
  delete charts[id];

  EventManager.instance.chartRemoved(this, id);
};

ChartManager.prototype.insertTrack = function(measurements, trackType, index) {
  // TODO: Test this method
  var id = this.addTrack(measurements, trackType);
  this.moveTrack(id, index);

  return id;
};

ChartManager.prototype.moveTrack = function(id, index) {
  var chart = $('#' + id);
  var startIndex = chart.index();
  var newIndex = index;

  if (newIndex == startIndex) {
    return;
  }

  if (newIndex > startIndex) {
    $('#track-container').children('div:eq(' + newIndex +')').after(chart);
  } else {
    $('#track-container').children('div:eq(' + newIndex +')').before(chart);
  }

  this._trackIds.splice(this._trackIds.indexOf(id), 1);
  this._trackIds.splice(index, 0, id);
};

ChartManager.prototype.getAllCharts = function() {
  var charts = [];
  for (var i = 0; i < this._trackIds.length; ++i) {
    charts.push(this._tracks[this._trackIds[i]]);
  }
  for (i = 0; i < this._plotIds.length; ++i) {
    charts.push(this._plots[this._plotIds[i]]);
  }

  return charts;
};

ChartManager.prototype.addPlot = function(workspaceData, chartHandler, useUI) {
  var chartDetails = this._addChart(workspaceData, chartHandler, useUI);

  this._plotIds.push(chartDetails.id);
  this._plots[chartDetails.id] = chartDetails.chart;

  EventManager.instance.chartAdded(this, chartDetails.id, chartDetails.measurementsMap);

  return chartDetails.id;
};

ChartManager.prototype._addChart = function(workspaceData, chartHandler, useUI) {
  useUI = typeof useUI != 'undefined' ? useUI : true;

  var numericId = this._getNextId();
  var id = sprintf('%s_%s', chartHandler.getChartType(), numericId);
  var container = (chartHandler.getChartDisplayType() == ChartDisplayType.TRACK) ? this._trackContainer : this._plotContainer;
  var c = chartHandler.getCssClass();
  var chart = chartHandler.createChart();
  var height = chartHandler.getDefaultHeight();
  var width = chartHandler.getDefaultWidth();
  var margin = chartHandler.getDefaultMargin();
  var measurementsMap = chartHandler.workspaceDataToMeasurementsMap(workspaceData);

  var chartDetails = {
    id: id,
    numericId: numericId,
    chart: chart,
    measurementsMap: measurementsMap
  };

  if (!useUI) {
    container.append(sprintf('<div id="%s">Chart with id %s of class %s with measurements %s</div>', id, id, c, JSON.stringify(chartDetails.measurementsMap)));
    return chartDetails;
  }

  container.append(sprintf('<div id="%s" class="%s"></div>', id, c));

  chart.initialize('#' + id, width, height, margin, workspaceData);

  var chartDiv = $('#' + id);
  chartDiv.resizable({
    resize:function (event, ui) {
      chart.onContainerResize(ui.size.width, ui.size.height);
    },
    stop:function (event, ui) {
      chart.onContainerResize(ui.size.width, ui.size.height);
    }
  });

  // Save button
  var saveButtonId = 'save-' + id;
  chartDiv.append('<button id="' + saveButtonId + '" style="position: absolute; top: 5px; right: 35px">Save</button>');
  var saveButton = $('#' + saveButtonId);

  saveButton.button({
    icons:{
      primary:'ui-icon ui-icon-disk'
    },
    text:false
  });

  saveButton.click(function(){
    SaveSvg.parentId = '#' + id;
    var dialog = $('#save-svg-dialog');
    dialog.dialog('open');
    return false;
  });

  // Remove button
  var removeButtonId = 'remove-' + id;
  chartDiv.append('<button id="' + removeButtonId + '" style="position: absolute; top: 5px; right: 5px">Remove</button>');
  var removeButton = $('#' + removeButtonId);

  removeButton.button({
    icons:{
      primary:'ui-icon ui-icon-cancel'
    },
    text:false
  });

  var self = this;
  removeButton.click(function(){
    self.removeChart(id);
    Workspace.instance.changed();
  });

  // Color Picker button
  var colorsButtonId = 'color-picker-' + id;
  chartDiv.append('<button id="' + colorsButtonId + '" style="position: absolute; top: 5px; right: 65px">Colors</button>');
  var colorsButton = $('#' + colorsButtonId);

  colorsButton.button({
    icons:{
      primary:'ui-icon ui-icon-person' // TODO: Change this later
    },
    text:false
  });

  colorsButton.click(function(){
    ChartColorPicker.instance.initializeChartColors(chart);

    var dialog = $('#pick-colors-dialog');
    dialog.dialog('open');
    return false;
  });

  chartDiv
    .mousemove(function () {
      saveButton.show();
      removeButton.show();
      colorsButton.show();
    })
    .mouseleave(function () {
      saveButton.hide();
      removeButton.hide();
      colorsButton.hide();
    });

  return chartDetails;
};

ChartManager.prototype.onMeasurementsLoaded = function(event) {
  var lis = $('#sortable-track-list').children();
  for (var i = 0; i < lis.length; ++i) {
    var li = $(lis[i]);
    var id = li.data('id');

    var track = this._tracks[id];
    var handler = track.getChartHandler().getDataTypeHandler();
    var measurementsMap = event.detail[handler.getMeasurementsType()];

    var title = track.createTitle(measurementsMap);
    if (title != '') { li.text(title); }
  }
};

ChartManager.prototype.onWorkspaceLoaded = function(event) {
  var i;
  var charts = this.getAllCharts();
  for (i = 0; i < charts.length; ++i) {
    this.removeChart(charts[i]._id);
  }

  // Remove all computed measurements
  ComputedMeasurements.instance.clear();

  var workspace = Workspace.instance;

  // Add new computed measurements
  var ms = workspace.computedMeasurements;

  if (ms) {
    for (i = 0; i < ms.length; ++i) {
      ComputedMeasurements.instance.add(ms[i][0], ms[i][1], ms[i][2], ms[i][3], ms[i][4], ms[i][5]);
    }
  }

  charts = workspace.getCharts();
  for (i = 0; i < charts.length; ++i) {
    this.addChart(charts[i]);
  }
};
