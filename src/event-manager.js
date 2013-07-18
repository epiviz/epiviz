/**
 * Created with JetBrains PhpStorm.
 * User: florin
 * Date: 10/26/12
 * Time: 12:40 PM
 * To change this template use File | Settings | File Templates.
 */

/*
 * Special class created just so that Internet Explorer doesn't crash.
 */
function CustomEvent(type, data) {
  this.type = type;
  this.detail = data.detail;
}


function EventManager() {
  this.eventListeners = {};
  this.lastLocation = {};
}

EventManager.instance = new EventManager();

EventManager.eventTypes = {
  MEASUREMENTS_LOADED: "MEASUREMENTS_LOADED",
  BEGIN_REQUEST_MEASUREMENTS: "BEGIN_REQUEST_MEASUREMENTS",

  CHART_DATA_UPDATED: "CHART_DATA_UPDATED",
  BEGIN_UPDATE_CHART_DATA: "BEGIN_UPDATE_CHART_DATA",

  BLOCK_SELECTED: "BLOCK_SELECTED",
  BLOCK_DESELECTED: "BLOCK_DESELECTED",

  BLOCK_HOVERED: "BLOCK_HOVERED",
  BLOCK_UNHOVERED: "BLOCK_UNHOVERED",

  WORKSPACE_LOADED: "WORKSPACE_LOADED",

  CHART_ADD: "CHART_ADD",
  CHART_REMOVE: "CHART_REMOVE",

  CHART_CONTAINER_RESIZE: "CHART_CONTAINER_RESIZE",

  CHART_INFORMATION: "CHART_INFORMATION"
};

EventManager.prototype.addEventListener = function (type, listener) {
  if (!this.eventListeners[type]) {
    this.eventListeners[type] = [];
  }
  this.eventListeners[type].push(listener);
};

EventManager.prototype.removeEventListener = function (type, listener) {
  if (!this.eventListeners[type]) {
    return;
  }

  for (var i = 0; i < this.eventListeners[type].length; ++i) {
    if (this.eventListeners[type][i] == listener) {
      //this.eventListeners[type].splice(i, 1);
      this.eventListeners[type][i] = null; // TODO: Find a better way to do this
      break;
    }
  }
};

EventManager.prototype.dispatchEvent = function (event) {
  var events = EventManager.eventTypes;
  if (!this.eventListeners[event.type]) { return; }
  for (var i=0; i<this.eventListeners[event.type].length; ++i) {
    var listener = this.eventListeners[event.type][i];
    if (listener == null) { continue; }
    switch (event.type) {
      case events.CHART_DATA_UPDATED:
        listener.onChartDataUpdated(event);
        break;
      case events.MEASUREMENTS_LOADED:
        listener.onMeasurementsLoaded(event);
        break;
      case events.BEGIN_REQUEST_MEASUREMENTS:
        listener.onBeginRequestMeasurements(event);
        break;

      case events.BEGIN_UPDATE_CHART_DATA:
        listener.onBeginUpdateChartData(event);
        break;

      case events.BLOCK_HOVERED:
        listener.onBlockHovered(event);
        break;
      case events.BLOCK_UNHOVERED:
        listener.onBlockUnhovered(event);
        break;
      case events.BLOCK_SELECTED:
        listener.onBlockSelected(event);
        break;
      case events.BLOCK_DESELECTED:
        listener.onBlockDeselected(event);
        break;

      case events.WORKSPACE_LOADED:
        listener.onWorkspaceLoaded(event);
        break;

      case events.CHART_ADD:
        listener.onChartAdd(event);
        break;

      case events.CHART_REMOVE:
        listener.onChartRemove(event);
        break;

      case events.CHART_CONTAINER_RESIZE:
        listener.onChartContainerResize(event);
        break;

      case events.CHART_INFORMATION:
        listener.onChartInformation(event);
        break;

      default:
        break;
    }
  }
};

EventManager.prototype.requestMeasurements = function() {
  var self = this;

  self.dispatchEvent(new CustomEvent(
    EventManager.eventTypes.BEGIN_REQUEST_MEASUREMENTS,
    {
      detail: {},
      bubbles: true,
      cancelable: false
    }
  ));

  DataManager.instance.getMeasurements();
};

EventManager.prototype.measurementsLoaded = function(measurements) {
  this.dispatchEvent(new CustomEvent(
    EventManager.eventTypes.MEASUREMENTS_LOADED,
    {
      detail: measurements,
      bubbles: true,
      cancelable: false
    }
  ));
};

EventManager.prototype.updateData = function(chr, start, end) {
  this.lastLocation = new Object({
    chr: chr,
    start: start,
    end: end
  });

  var self = this;

  DataCache.instance.updateData(chr, start, end, this,
    function(chartId, chartData) {
      self.dispatchEvent(new CustomEvent(
        EventManager.eventTypes.CHART_DATA_UPDATED,
        {
          detail: {
            chartId: chartId,
            data: chartData,
            lastLocation: self.lastLocation
          },
          bubbles: true,
          cancelable: false
        }
      ));
    });
};

EventManager.prototype.beginUpdateChartData = function(chartId) {
  this.dispatchEvent(new CustomEvent(
    EventManager.eventTypes.BEGIN_UPDATE_CHART_DATA,
    {
      detail: {
        chartId: chartId
      },
      bubbles: true,
      cancelable: false
    }
  ))
};

EventManager.prototype.blockHovered = function(d) {
  this.dispatchEvent(new CustomEvent(
    EventManager.eventTypes.BLOCK_HOVERED,
    {
      detail: {
        data: d
      },
      bubbles: true,
      cancelable: false
    }
  ));
};

EventManager.prototype.blockUnhovered = function() {
  this.dispatchEvent(new CustomEvent(
    EventManager.eventTypes.BLOCK_UNHOVERED,
    {
      detail: {},
      bubbles: true,
      cancelable: false
    }
  ));
};

EventManager.prototype.blockSelected = function(d) {
  this.dispatchEvent(new CustomEvent(
    EventManager.eventTypes.BLOCK_SELECTED,
    {
      detail: {
        data: d
      },
      bubbles: true,
      cancelable: false
    }
  ));
};

EventManager.prototype.blockDeselected = function() {
  this.dispatchEvent(new CustomEvent(
    EventManager.eventTypes.BLOCK_DESELECTED,
    {
      detail: {},
      bubbles: true,
      cancelable: false
    }
  ));
};

EventManager.prototype.workspaceLoaded = function() {
  this.dispatchEvent(new CustomEvent(
    EventManager.eventTypes.WORKSPACE_LOADED,
    {
      detail: null,
      bubbles: true,
      cancelable: false
    }
  ));
};

EventManager.prototype.chartAdded = function(sender, chartId, measurements) {
  this.dispatchEvent(new CustomEvent(EventManager.eventTypes.CHART_ADD,
    {
      detail: {
        sender: sender,
        chartId: chartId,
        measurements: measurements
      },
      bubbles: true,
      cancelable: false
    }));
};

EventManager.prototype.chartRemoved = function(sender, chartId) {
  this.dispatchEvent(new CustomEvent(EventManager.eventTypes.CHART_REMOVE,
    {
      detail: {
        sender: sender,
        chartId: chartId
      },
      bubbles: true,
      cancelable: false
    }));
};

EventManager.prototype.chartContainerResized = function(sender) {
  this.dispatchEvent(new CustomEvent(EventManager.eventTypes.CHART_CONTAINER_RESIZE,
    {
      detail: {
        sender: sender
      },
      bubbles: true,
      cancelable: false
    }))
};

EventManager.prototype.sendChartInformation = function(chartId, title, chartHandler, information) {
  this.dispatchEvent(new CustomEvent(
    EventManager.eventTypes.CHART_INFORMATION,
    {
      detail: {
        chartId: chartId,
        title: title,
        chartHandler: chartHandler,
        information: information
      },
      bubbles: true,
      cancelable: false
    }
  ));
};
