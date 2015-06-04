/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/15/2014
 * Time: 9:05 AM
 */

goog.provide('epiviz.ui.charts.Visualization');

/**
 * Uses data of T type for drawing objects of a subtype of epiviz.ui.charts.VisObject
 * @param {string} id
 * @param {jQuery} container The div where the visualization will be drawn
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @constructor
 * @template T
 */
epiviz.ui.charts.Visualization = function(id, container, properties) {
  /**
   * @type {string}
   * @private
   */
  this._id = id;

  /**
   * @type {jQuery}
   * @private
   */
  this._container = container;

  /**
   * @type {epiviz.ui.charts.VisualizationProperties}
   * @private
   */
  this._properties = properties;

  /**
   * @type {Object.<string, function>}
   * @private
   */
  this._originalMethods = {};

  /**
   * @type {boolean}
   * @private
   */
  this._hasModifiedMethods = false;

  /**
   * @type {string}
   * @private
   */
  this._lastModifiedMethod = 'draw';

  var self = this;
  if (properties.modifiedMethods) {
    var methodsUpdated = new epiviz.deferred.Deferred();
    var modifiedMethods = properties.modifiedMethods;
    var modifiedMethodNames = Object.keys(modifiedMethods);
    var cajoledMethods = {};
    var nMethodsUpdated = 0;
    for (var m in modifiedMethods) {
      if (!modifiedMethods.hasOwnProperty(m)) { continue; }
      if (m == '_setModifiedMethods') { continue; } // Ignore modifications to this method
      (function(m) {
        epiviz.caja.cajole(modifiedMethods[m], epiviz.caja.buildChartMethodContext()).done(function(method) {
          if (!method) { return; }
          cajoledMethods[m] = method;
          nMethodsUpdated += 1;
          if (nMethodsUpdated >= modifiedMethodNames.length) {
            methodsUpdated.resolve();
          }
        });
      })(m);
    }
    methodsUpdated.done(function() {
      for (var m in cajoledMethods) {
        if (!cajoledMethods.hasOwnProperty(m)) { continue; }
        self._originalMethods[m] = self[m];
        self[m] = cajoledMethods[m];
        self._lastModifiedMethod = m;
      }
      self._hasModifiedMethods = true;
      self.draw();
    });
  }

  /**
   * @type {Object.<string, *>}
   * @private
   */
  this._customSettingsValues = {};
  for (var i = 0; i < properties.customSettingsDefs.length; ++i) {
    var setting = properties.customSettingsDefs[i];
    var val = properties.customSettingsValues[setting.id];
    switch (setting.type) {
      case epiviz.ui.charts.CustomSetting.Type.BOOLEAN:
        this._customSettingsValues[setting.id] = (val === false || val) ? val : setting.defaultValue;
        break;
      case epiviz.ui.charts.CustomSetting.Type.NUMBER:
        this._customSettingsValues[setting.id] = (val === 0 || val) ? val : setting.defaultValue;
        break;
      case epiviz.ui.charts.CustomSetting.Type.STRING:
        this._customSettingsValues[setting.id] = (val === '' || val) ? val : setting.defaultValue;
        break;
      case epiviz.ui.charts.CustomSetting.Type.MEASUREMENTS_METADATA:
        var possibleValues = {};
        properties.visConfigSelection.measurements.foreach(function(m) {
          m.metadata().forEach(function(metadataCol) { possibleValues[metadataCol] = metadataCol; });
        });
        setting.possibleValues = Object.keys(possibleValues);
        setting.possibleValues.sort();
        val = val || setting.defaultValue;
        this._customSettingsValues[setting.id] = (val in possibleValues) ?
          val : ((setting.possibleValues.length) ? setting.possibleValues[0] : '');
        break;
      case epiviz.ui.charts.CustomSetting.Type.MEASUREMENTS_ANNOTATION:
        var possibleValues = {name: 'name'};
        properties.visConfigSelection.measurements.foreach(function(m) {
          var anno = m.annotation();
          if (!anno) { return; }
          Object.keys(anno).forEach(function(key) { possibleValues[key] = key; });
        });
        setting.possibleValues = Object.keys(possibleValues);
        setting.possibleValues.sort();
        val = val || setting.defaultValue;
        this._customSettingsValues[setting.id] = (val in possibleValues) ?
          val : ((setting.possibleValues.length) ? setting.possibleValues[0] : '');
        break;
      default:
        this._customSettingsValues[setting.id] = val || setting.defaultValue;
        break;
    }
  }

  /**
   * @type {string}
   * @private
   */
  this._svgId = sprintf('%s-svg', this._id);

  /**
   * The D3 svg handler for the visualization
   * @protected
   */
  this._svg = null;

  /**
   * @type {?T}
   * @protected
   */
  this._unalteredData = null;

  /**
   * @type {?T}
   * @protected
   */
  this._lastData = null;

  /**
   * @type {epiviz.datatypes.Range}
   * @protected
   */
  this._lastRange = null;

  /**
   * @type {number}
   * @protected
   */
  this._slide = 0;

  /**
   * @type {number}
   * @protected
   */
  this._zoom = 1;

  /**
   * @type {Array.<epiviz.ui.charts.markers.VisualizationMarker>}
   * @protected
   */
  this._markers = properties.chartMarkers;

  /**
   * @type {Object.<string, epiviz.ui.charts.markers.VisualizationMarker>}
   * @protected
   */
  this._markersMap = {};

  /**
   * @type {Object.<string, number>}
   * @private
   */
  this._markersIndices = {};

  this._markers.forEach(function(marker, i) {
    if (!marker) { return; }
    self._markersMap[marker.id()] = marker;
    self._markersIndices[marker.id()] = i;
  });

  /**
   * @type {boolean}
   */
  this._autoPropagateChanges = true;

  // Events

  /**
   * @type {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<epiviz.ui.charts.VisObject>>}
   * @protected
   */
  this._hover = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs>}
   * @protected
   */
  this._unhover = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<epiviz.ui.charts.VisObject>>}
   * @protected
   */
  this._select = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs>}
   * @protected
   */
  this._deselect = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs>}
   * @private
   */
  this._save = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs>}
   * @private
   */
  this._remove = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<epiviz.ui.charts.ColorPalette>>}
   * @protected
   */
  this._colorsChanged = new epiviz.events.Event();

  /**
   * Event arg: a map of method -> code
   * @type {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<Object.<string, string>>>}
   * @private
   */
  this._methodsModified = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs>}
   * @private
   */
  this._methodsReset = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<Array.<epiviz.ui.charts.markers.VisualizationMarker>>>}
   * @private
   */
  this._markersModified = new epiviz.events.Event();

  /**
   * Event arg: custom settings values setting -> value
   * @type {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<Object.<string, *>>>}
   * @private
   */
  this._customSettingsChanged = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<{width: number|string, height: number|string}>>}
   * @private
   */
  this._sizeChanged = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<epiviz.ui.charts.Margins>>}
   * @private
   */
  this._marginsChanged = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs>}
   * @private
   */
  this._dataWaitStart = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs>}
   * @protected
   */
  this._dataWaitEnd = new epiviz.events.Event();
};

/**
 * @type {number}
 * @constant
 */
epiviz.ui.charts.Visualization.SVG_MARGIN = 20;

/**
 * Initializes the visualization and draws the initial SVG in the container
 * @protected
 */
epiviz.ui.charts.Visualization.prototype._initialize = function() {
  if (this._properties.height == '100%') { this._properties.height = this._container.height() - epiviz.ui.charts.Visualization.SVG_MARGIN; }
  if (this._properties.width == '100%') { this._properties.width = this._container.width() - epiviz.ui.charts.Visualization.SVG_MARGIN; }

  var width = this.width();
  var height = this.height();

  this._container.addClass('visualization-container');

  this._container.append(sprintf('<svg id="%s" class="visualization" width="%s" height="%s"><style type="text/css"></style><defs></defs></svg>', this._svgId, width, height));
  this._svg = d3.select('#' + this._svgId);

  var jSvg = $('#' + this._svgId);

  /**
   * The difference in size between the container and the inner SVG
   * @type {number}
   * @private
   */
  this._widthDif = jSvg.width() - (this._container.width() - epiviz.ui.charts.Visualization.SVG_MARGIN);

  /**
   * The difference in size between the container and the inner SVG
   * @type {number}
   * @private
   */
  this._heightDif = height - (this._container.height() - epiviz.ui.charts.Visualization.SVG_MARGIN);

  this._properties.width = width;
  this._properties.height = height;

  var self = this;
  this._container.click(function() { self._deselect.notify(new epiviz.ui.charts.VisEventArgs(self._id)); });
};

/**
 * @param [svg] D3 svg container for the axes
 * @protected
 */
epiviz.ui.charts.Visualization.prototype._clearAxes = function(svg) {
  svg = svg || this._svg;
  svg.selectAll('.xAxis').remove();
  svg.selectAll('.yAxis').remove();
};

/**
 * @param [xScale] D3 linear scale for the x axis
 * @param [yScale] D3 linear scale for the y axis
 * @param {number} [xTicks]
 * @param {number} [yTicks]
 * @param [svg] D3 svg container for the axes
 * @param {number} [width]
 * @param {number} [height]
 * @param {epiviz.ui.charts.Margins} [margins]
 * @param {function} [xAxisFormat]
 * @param {function} [yAxisFormat]
 * @param {Array.<string>} [xLabels]
 * @param {Array.<string>} [yLabels]
 * @param {boolean} [xLabelsBtTicks]
 * @param {boolean} [yLabelsBtTicks]
 * @protected
 */
epiviz.ui.charts.Visualization.prototype._drawAxes = function (xScale, yScale, xTicks, yTicks, svg, width, height, margins, xAxisFormat, yAxisFormat, xLabels, yLabels, xLabelsBtTicks, yLabelsBtTicks) {

  svg = svg || this._svg;
  margins = margins || this.margins();
  height = height || this.height();
  width = width || this.width();

  var axesGroup = svg.select('.axes'),
    xAxisGrid = axesGroup.select('.xAxis-grid'),
    yAxisGrid = axesGroup.select('.yAxis-grid'),
    xAxisLine = axesGroup.select('.xAxis-line'),
    yAxisLine = axesGroup.select('.yAxis-line');

  if (axesGroup.empty()) { axesGroup = svg.append('g').attr('class', 'axes'); }

  if (xAxisGrid.empty()) { xAxisGrid = axesGroup.append('g').attr('class', 'xAxis xAxis-grid'); }
  if (yAxisGrid.empty()) { yAxisGrid = axesGroup.append('g').attr('class', 'yAxis yAxis-grid'); }
  if (xAxisLine.empty()) { xAxisLine = axesGroup.append('g').attr('class', 'xAxis xAxis-line'); }
  if (yAxisLine.empty()) { yAxisLine = axesGroup.append('g').attr('class', 'yAxis yAxis-line'); }

  if (xScale) {
    // Draw X-axis grid lines
    xAxisGrid
      .attr('transform', 'translate(' + margins.left() + ', ' + margins.top() + ')')
      .selectAll('line.x')
      .data(xScale.ticks(xTicks))
      .enter().append('line')
      .attr('x1', xScale)
      .attr('x2', xScale)
      .attr('y1', 0)
      .attr('y2', height - margins.top() - margins.bottom())
      .style('stroke', '#eeeeee')
      .style('shape-rendering', 'crispEdges');

    var xAxisTickFormat = xAxisFormat ||
      ((xLabels) ?
        function(i) { return xLabels[i]; } :
        function(x) {
          var format = d3.format('s');
          var rounded = Math.round(x * 1000) / 1000;
          return format(rounded);
        });

    var xAxis = d3.svg.axis()
      .scale(xScale)
      .orient('bottom')
      .ticks(xTicks)
      .tickFormat(xAxisTickFormat);

    xAxisLine
      .attr('transform', 'translate(' + margins.left() + ', ' + (height - margins.bottom()) + ')')
      .call(xAxis);

    if (xLabels) {
      var xTransform = 'rotate(-90)';
      if (xLabelsBtTicks) { xTransform += 'translate(0,' + (xScale(0.5) - xScale(0)) + ')'; }
      xAxisLine
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '-0.5em')
      .attr('transform', xTransform);
    }
  }

  if (yScale) {
    // Draw Y-axis grid lines
    yAxisGrid
      .attr('transform', 'translate(' + margins.left() + ', ' + margins.top() + ')')
      .selectAll('line.y')
      .data(yScale.ticks(yTicks - 1))
      .enter().append('line')
      .attr('x1', 0)
      .attr('x2', width - margins.left() - margins.right())
      .attr('y1', yScale)
      .attr('y2', yScale)
      .style('stroke', '#eeeeee')
      .style('shape-rendering', 'crispEdges');

    var yAxisTickFormat = (yLabels) ? function(i) { return yLabels[i]; } :
      function(y) {
        var format = d3.format('s');
        var rounded = Math.round(y * 1000) / 1000;
        return format(rounded);
      };

    var yAxis = d3.svg.axis()
      .ticks(yTicks - 1)
      .scale(yScale)
      .orient('left')
      .tickFormat(yAxisTickFormat);
    yAxisLine
      .attr('transform', 'translate(' + margins.left() + ', ' + margins.top() + ')')
      .call(yAxis);
  }
};

/**
 * @private
 */
epiviz.ui.charts.Visualization.prototype._drawTitle = function() {
  var svgTitle = this._svg.selectAll('.visualization-title');

  var Settings = epiviz.ui.charts.Visualization.CustomSettings;
  var settingsVals = this.customSettingsValues();

  var title = settingsVals[Settings.TITLE];
  if (!title || title.trim() == '') {
    if (!svgTitle.empty()) {
      svgTitle.remove();
    }
    return;
  }

  if (svgTitle.empty()) {
    svgTitle = this._svg.append('text')
      .attr('class', 'visualization-title')
      .attr('text-anchor', 'middle');
  }

  svgTitle
    .attr('x', this.width() * 0.5)
    .attr('y', 25)
    .text(title);
};

/**
 * @param {number} width
 * @param {number} height
 */
epiviz.ui.charts.Visualization.prototype.resize = function(width, height) {
  if (width) { this._properties.width = width; }
  if (height) { this._properties.height = height; }

  this.draw();

  this._sizeChanged.notify(new epiviz.ui.charts.VisEventArgs(this._id, {width: this._properties.width, height: this._properties.height}));
};


/**
 */
epiviz.ui.charts.Visualization.prototype.updateSize = function() {
  this.resize(
    this._widthDif + this._container.width() - epiviz.ui.charts.Visualization.SVG_MARGIN,
    this._heightDif + this._container.height() - epiviz.ui.charts.Visualization.SVG_MARGIN);
};

/**
 * @param {epiviz.datatypes.Range} [range]
 * @param {T} [data]
 * @returns {Array.<epiviz.ui.charts.VisObject>}
 */
epiviz.ui.charts.Visualization.prototype.draw = function(range, data) {

  if (range != undefined) {
    this._lastRange = range;
  }

  if (data != undefined) {
    this._lastData = data;
    this._unalteredData = data;
    this._dataWaitEnd.notify(new epiviz.ui.charts.VisEventArgs(this._id));
  }

  this._svg
    .attr('width', this.width())
    .attr('height', this.height());

  this._drawTitle();

  return [];
};

/* Getters */

/**
 * @returns {jQuery}
 */
epiviz.ui.charts.Visualization.prototype.container = function() { return this._container; };

/**
 * @returns {string}
 */
epiviz.ui.charts.Visualization.prototype.id = function() { return this._id; };

/**
 * @returns {epiviz.ui.charts.VisualizationProperties}
 */
epiviz.ui.charts.Visualization.prototype.properties = function() {
  return this._properties;
};

/**
 * @returns {number}
 */
epiviz.ui.charts.Visualization.prototype.height = function() {
  return this._properties.height;
};

/**
 * @returns {number}
 */
epiviz.ui.charts.Visualization.prototype.width = function() {
  return this._properties.width;
};

/**
 * @returns {epiviz.ui.charts.Margins}
 */
epiviz.ui.charts.Visualization.prototype.margins = function() {
  return this._properties.margins;
};

/**
 * @returns {epiviz.ui.charts.ColorPalette}
 */
epiviz.ui.charts.Visualization.prototype.colors = function() {
  return this._properties.colors;
};

/**
 * @param {epiviz.ui.charts.ColorPalette} colors
 */
epiviz.ui.charts.Visualization.prototype.setColors = function(colors) {
  if (!colors || colors.equals(this._properties.colors)) { return; }
  this._properties.colors = colors;
  this.draw();
  this._colorsChanged.notify(new epiviz.ui.charts.VisEventArgs(this._id, this._properties.colors));
};

/**
 * @returns {Array.<string>}
 */
epiviz.ui.charts.Visualization.prototype.colorLabels = function() {
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

/**
 * @returns {epiviz.measurements.MeasurementSet}
 */
epiviz.ui.charts.Visualization.prototype.measurements = function() {
  return this.properties().visConfigSelection.measurements;
};

/**
 * @returns {Object.<string, *>}
 */
epiviz.ui.charts.Visualization.prototype.customSettingsValues = function() { return this._customSettingsValues; };

/**
 * @param {Object.<string, *>} settingsValues
 */
epiviz.ui.charts.Visualization.prototype.setCustomSettingsValues = function(settingsValues) {
  if (this._customSettingsValues == settingsValues || !settingsValues || epiviz.utils.mapEquals(this._customSettingsValues, settingsValues)) {
    return;
  }
  var CustomSettings = epiviz.ui.charts.Visualization.CustomSettings;

  var currentTitle = this._customSettingsValues[CustomSettings.TITLE] || '';
  var newTitle = settingsValues[CustomSettings.TITLE] || '';

  var currentLen = currentTitle.trim().length;
  var newLen = newTitle.trim().length;

  // Check if either both titles are undefined or both are defined
  if (!(currentLen * newLen) && (currentLen + newLen)) {
    var marginDelta = epiviz.utils.sign(newLen - currentLen) * 20;
    var top = settingsValues[CustomSettings.MARGIN_TOP] || this._properties.margins.top();
    var left = settingsValues[CustomSettings.MARGIN_LEFT] || this._properties.margins.left();
    var right = settingsValues[CustomSettings.MARGIN_RIGHT] || this._properties.margins.right();
    var bottom = settingsValues[CustomSettings.MARGIN_BOTTOM] || this._properties.margins.bottom();
    settingsValues[CustomSettings.MARGIN_TOP] = top + marginDelta;
    settingsValues[CustomSettings.MARGIN_LEFT] = left;
    settingsValues[CustomSettings.MARGIN_RIGHT] = right;
    settingsValues[CustomSettings.MARGIN_BOTTOM] = bottom;
  }

  // FIXME: This is a property specific to Chart and not Visualization; move this portion of the code in Chart
  var currentMeasurementAggregator = this._customSettingsValues[epiviz.ui.charts.ChartType.CustomSettings.MEASUREMENT_GROUPS_AGGREGATOR];
  var newMeasurementAggregator = settingsValues[epiviz.ui.charts.ChartType.CustomSettings.MEASUREMENT_GROUPS_AGGREGATOR];

  this._customSettingsValues = settingsValues;

  if (CustomSettings.MARGIN_TOP in settingsValues && CustomSettings.MARGIN_BOTTOM in settingsValues && CustomSettings.MARGIN_LEFT in settingsValues && CustomSettings.MARGIN_RIGHT in settingsValues) {
    this._properties.margins = new epiviz.ui.charts.Margins(settingsValues[CustomSettings.MARGIN_TOP], settingsValues[CustomSettings.MARGIN_LEFT], settingsValues[CustomSettings.MARGIN_BOTTOM], settingsValues[CustomSettings.MARGIN_RIGHT]);
    this._marginsChanged.notify(new epiviz.ui.charts.VisEventArgs(this._id, this._properties.margins));
  }

  if (currentMeasurementAggregator != newMeasurementAggregator) {
    var self = this;
    this.transformData(this._lastRange, this._unalteredData).done(function() {
      self.draw();
    });
  } else {
    this.draw();
  }

  this._customSettingsChanged.notify(new epiviz.ui.charts.VisEventArgs(this._id, settingsValues));
};

/**
 * @param {Object.<string, string>} modifiedMethods
 */
epiviz.ui.charts.Visualization.prototype.setModifiedMethods = function(modifiedMethods) {
  var self = this;
  var methodsModified = false;
  if (!modifiedMethods) { return; }
  var modifiedMethodNames = Object.keys(modifiedMethods);
  var methodsUpdated = new epiviz.deferred.Deferred();
  var nMethodsUpdated = 0;
  var cajoledMethods = {};
  for (var m in modifiedMethods) {
    if (!modifiedMethods.hasOwnProperty(m)) { continue; }
    if (m == '_setModifiedMethods') { continue; } // Ignore modifications to this method
    if (this[m].toString() == modifiedMethods[m]) { continue; }

    if (!(m in this._originalMethods)) {
      this._originalMethods[m] = this[m];
    }

    (function(m) {
      epiviz.caja.cajole(modifiedMethods[m], epiviz.caja.buildChartMethodContext()).done(function(method) {
        if (method) {
          cajoledMethods[m] = method;
          methodsModified = true;

          nMethodsUpdated += 1;
          if (nMethodsUpdated >= modifiedMethodNames.length) {
            methodsUpdated.resolve();
          }
        }
      });
    })(m);
  }

  methodsUpdated.done(function() {
    if (methodsModified) {
      for (var m in cajoledMethods) {
        if (!cajoledMethods.hasOwnProperty(m)) { continue; }
        self[m] = cajoledMethods[m];
        self._lastModifiedMethod = m;
      }
      self._hasModifiedMethods = true;
      self.draw();
      self._methodsModified.notify(new epiviz.ui.charts.VisEventArgs(self._id, modifiedMethods));
    }
  });
};

/**
 * @returns {boolean}
 */
epiviz.ui.charts.Visualization.prototype.hasModifiedMethods = function() { return this._hasModifiedMethods; };

/**
 * @returns {string}
 */
epiviz.ui.charts.Visualization.prototype.lastModifiedMethod = function() { return this._lastModifiedMethod; };

/**
 */
epiviz.ui.charts.Visualization.prototype.resetModifiedMethods = function() {
  if (!this._hasModifiedMethods) { return; }
  for (var m in this._originalMethods) {
    if (!this._originalMethods.hasOwnProperty(m)) { continue; }
    this[m] = this._originalMethods[m];
  }

  this._hasModifiedMethods = false;

  this.draw();

  this._methodsReset.notify(new epiviz.ui.charts.VisEventArgs(this._id));
};

/**
 * @param {epiviz.ui.charts.markers.VisualizationMarker} marker
 */
epiviz.ui.charts.Visualization.prototype.putMarker = function(marker) {
  if (!marker) { return; }
  var i;
  if (marker.id() in this._markersMap) {
    i = this._markersIndices[marker.id()];
    var oldMarker = this._markers[i];
    if (oldMarker == marker ||
        (oldMarker.type() == marker.type() &&
         oldMarker.preMarkStr() == marker.preMarkStr() &&
         oldMarker.markStr() == marker.markStr())) {
      // Marker not modified
      return;
    }
    this._markers[i] = marker;
    this._markersMap[marker.id()] = marker;
  } else {
    i = this._markers.length;
    this._markers.push(marker);
    this._markersIndices[marker.id()] = i;
    this._markersMap[marker.id()] = marker;
  }

  var self = this;
  this.transformData(this._lastRange, this._unalteredData).done(function() {
    self.draw();
  });

  this._markersModified.notify(new epiviz.ui.charts.VisEventArgs(this._id, this._markers));
};

epiviz.ui.charts.Visualization.prototype.removeMarker = function(markerId) {
  if (!(markerId in this._markersMap)) { return; }

  var i = this._markersIndices[markerId];
  this._markers[i] = null;
  delete this._markersMap[markerId];
  delete this._markersIndices[markerId];

  var self = this;
  this.transformData(this._lastRange, this._unalteredData).done(function() {
    self.draw();
  });

  this._markersModified.notify(new epiviz.ui.charts.VisEventArgs(this._id, this._markers));
};

/**
 * @param {string} markerId
 * @returns {epiviz.ui.charts.markers.VisualizationMarker}
 */
epiviz.ui.charts.Visualization.prototype.getMarker = function(markerId) {
  if (!markerId || !(markerId in this._markersMap)) { return null; }
  return this._markersMap[markerId];
};

/**
 * @returns {epiviz.ui.charts.VisualizationType.DisplayType}
 */
epiviz.ui.charts.Visualization.prototype.displayType = function() { throw Error('unimplemented abstract method'); };

/**
 * @returns {boolean}
 */
epiviz.ui.charts.Visualization.prototype.autoPropagateChanges = function() { return this._autoPropagateChanges; };

/**
 * @param {boolean} val
 */
epiviz.ui.charts.Visualization.prototype.setAutoPropagateChanges = function(val) { this._autoPropagateChanges = val; };

/**
 * @param {epiviz.datatypes.Range} range
 * @param {T} data
 * @returns {epiviz.deferred.Deferred}
 */
epiviz.ui.charts.Visualization.prototype.transformData = function(range, data) {
  var lastRange = this._lastRange;

  if (range != undefined) {
    this._lastRange = range;
  }
  if (data != undefined) {
    this._lastData = data;
    this._unalteredData = data;
  }

  if (lastRange && range && lastRange.overlapsWith(range) && lastRange.width() == range.width()) {
    this._slide = range.start() - lastRange.start();
  }

  if (lastRange && range && lastRange.overlapsWith(range) && lastRange.width() != range.width()) {
    this._zoom = lastRange.width() / range.width();
  }

  var deferred = new epiviz.deferred.Deferred();
  deferred.resolve();
  return deferred;
};

/* Events */

/**
 * @returns {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<epiviz.ui.charts.VisObject>>}
 */
epiviz.ui.charts.Visualization.prototype.onHover = function() { return this._hover; };

/**
 * @returns {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs>}
 */
epiviz.ui.charts.Visualization.prototype.onUnhover = function() { return this._unhover; };

/**
 * @returns {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<epiviz.ui.charts.VisObject>>}
 */
epiviz.ui.charts.Visualization.prototype.onSelect = function() { return this._select; };

/**
 * @returns {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs>}
 */
epiviz.ui.charts.Visualization.prototype.onDeselect = function() { return this._deselect; };

// Deprecated code, kept here for future reference
// Selection and hovering by changing the class of the selected items

/**
 * @param {epiviz.ui.charts.VisObject} selectedObject
 */
/*epiviz.ui.charts.Visualization.prototype.doHover = function(selectedObject) {
  var itemsGroup = this._svg.select('.items');
  itemsGroup.classed('unhovered', true);
  var selectItems = itemsGroup.selectAll('.item').filter(function(d) {
    return selectedObject.overlapsWith(d);
  });
  selectItems.classed('hovered', true);
  itemsGroup.selectAll('.item').sort(function(d1, d2) { return selectedObject.overlapsWith(d1) ? 1 : -1; });
};*/

/**
 */
/*epiviz.ui.charts.Visualization.prototype.doUnhover = function() {
  this._svg.select('.items').classed('unhovered', false);
  this._svg.select('.items').selectAll('.item').classed('hovered', false);
};*/

/**
 * @param {epiviz.ui.charts.ChartObject} selectedObject
 */
/*epiviz.ui.charts.Visualization.prototype.doSelect = function(selectedObject) {
  var itemsGroup = this._svg.select('.items');
  var selectItems = itemsGroup.selectAll('.item').filter(function(d) {
    return selectedObject.overlapsWith(d);
  });
  selectItems.classed('selected', true);
};*/

/**
 */
/*epiviz.ui.charts.Visualization.prototype.doDeselect = function() {
  this._svg.select('.items').selectAll('.selected').classed('selected', false);
};*/

/**
 * @param {epiviz.ui.charts.VisObject} selectedObject
 */
epiviz.ui.charts.Visualization.prototype.doHover = function(selectedObject) {
  var itemsGroup = this._container.find('.items');
  var unselectedHoveredGroup = itemsGroup.find('> .hovered');
  var selectedGroup = itemsGroup.find('> .selected');
  var selectedHoveredGroup = selectedGroup.find('> .hovered');

  var filter = function() {
    return selectedObject.overlapsWith(d3.select(this).data()[0]);
  };
  var selectItems = itemsGroup.find('> .item').filter(filter);
  unselectedHoveredGroup.append(selectItems);

  selectItems = selectedGroup.find('> .item').filter(filter);
  selectedHoveredGroup.append(selectItems);
};

/**
 */
epiviz.ui.charts.Visualization.prototype.doUnhover = function() {
  var itemsGroup = this._container.find('.items');
  var unselectedHoveredGroup = itemsGroup.find('> .hovered');
  var selectedGroup = itemsGroup.find('> .selected');
  var selectedHoveredGroup = selectedGroup.find('> .hovered');

  itemsGroup.prepend(unselectedHoveredGroup.children());

  selectedGroup.prepend(selectedHoveredGroup.children());
};

/**
 * @param {epiviz.ui.charts.ChartObject} selectedObject
 */
epiviz.ui.charts.Visualization.prototype.doSelect = function(selectedObject) {
  var itemsGroup = this._container.find('.items');
  var unselectedHoveredGroup = itemsGroup.find('> .hovered');
  var selectedGroup = itemsGroup.find('> .selected');
  var selectedHoveredGroup = selectedGroup.find('> .hovered');

  var filter = function() {
    return selectedObject.overlapsWith(d3.select(this).data()[0]);
  };
  var selectItems = itemsGroup.find('> .item').filter(filter);
  selectedGroup.append(selectItems);

  selectItems = unselectedHoveredGroup.find('> .item').filter(filter);
  selectedHoveredGroup.append(selectItems);
};

/**
 */
epiviz.ui.charts.Visualization.prototype.doDeselect = function() {
  var itemsGroup = this._container.find('.items');
  var unselectedHoveredGroup = itemsGroup.find('> .hovered');
  var selectedGroup = itemsGroup.find('> .selected');
  var selectedHoveredGroup = selectedGroup.find('> .hovered');

  itemsGroup.prepend(selectedGroup.find('> .item'));
  unselectedHoveredGroup.prepend(selectedHoveredGroup.children());
};

/**
 * @returns {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs>}
 */
epiviz.ui.charts.Visualization.prototype.onSave = function() { return this._save; };

/**
 * @returns {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs>}
 */
epiviz.ui.charts.Visualization.prototype.onRemove = function() { return this._remove; };

/**
 * @returns {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<epiviz.ui.charts.ColorPalette>>}
 */
epiviz.ui.charts.Visualization.prototype.onColorsChanged = function() { return this._colorsChanged; };

/**
 * @returns {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<Object.<string, string>>>}
 */
epiviz.ui.charts.Visualization.prototype.onMethodsModified = function() { return this._methodsModified; };

/**
 * @returns {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs>}
 */
epiviz.ui.charts.Visualization.prototype.onMethodsReset = function() { return this._methodsReset; };

/**
 * @returns {epiviz.events.Event.<Array.<epiviz.ui.charts.markers.VisualizationMarker>>}
 */
epiviz.ui.charts.Visualization.prototype.onMarkersModified = function() { return this._markersModified; };

/**
 * @returns {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<Object.<string, *>>>}
 */
epiviz.ui.charts.Visualization.prototype.onCustomSettingsChanged = function() { return this._customSettingsChanged; };

/**
 * @returns {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<{width: (number|string), height: (number|string)}>>}
 */
epiviz.ui.charts.Visualization.prototype.onSizeChanged = function() { return this._sizeChanged; };

/**
 * @returns {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<epiviz.ui.charts.Margins>>}
 */
epiviz.ui.charts.Visualization.prototype.onMarginsChanged = function() { return this._marginsChanged; };

/**
 * @returns {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs>}
 */
epiviz.ui.charts.Visualization.prototype.onDataWaitStart = function() { return this._dataWaitStart; };

/**
 * @returns {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs>}
 */
epiviz.ui.charts.Visualization.prototype.onDataWaitEnd = function() { return this._dataWaitEnd; };

/**
 * @enum {string}
 */
epiviz.ui.charts.Visualization.CustomSettings = {
  TITLE: 'title',
  MARGIN_LEFT: 'marginLeft',
  MARGIN_RIGHT: 'marginRight',
  MARGIN_TOP: 'marginTop',
  MARGIN_BOTTOM: 'marginBottom',
  X_MIN: 'xMin',
  X_MAX: 'xMax',
  Y_MIN: 'yMin',
  Y_MAX: 'yMax',
  COL_LABEL: 'colLabel',
  ROW_LABEL: 'rowLabel'
};
