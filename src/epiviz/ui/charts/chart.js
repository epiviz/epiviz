/**
 * Created by: Florin Chelaru
 * Date: 10/3/13
 * Time: 8:21 PM
 */

goog.provide('epiviz.ui.charts.Chart');

/**
 * @param {string} id
 * @param {jQuery} container The div where the chart will be drawn
 * @param {epiviz.ui.charts.ChartProperties} properties
 * @constructor
 */
epiviz.ui.charts.Chart = function(id, container, properties) {
  /**
   * @type {string}
   * @protected
   */
  this._id = id;

  /**
   * @type {jQuery}
   * @protected
   */
  this._container = container;

  /**
   * @type {epiviz.ui.charts.ChartProperties}
   * @private
   */
  this._properties = properties;

  if (properties.modifiedMethods) {
    var modifiedMethods = properties.modifiedMethods;
    for (var m in modifiedMethods) {
      if (!modifiedMethods.hasOwnProperty(m)) { continue; }
      if (m == '_setModifiedMethods') { continue; } // Ignore modifications to this method

      try {
        this[m] = eval('(' + modifiedMethods[m] + ')');
      } catch (e) {
        // Ignore bad modified methods
      }
    }
  }

  /**
   * @type {Object.<string, *>}
   * @protected
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
      default:
        this._customSettingsValues[setting.id] = val || setting.defaultValue;
        break;
    }
  }

  /**
   * @type {string}
   * @protected
   */
  this._svgId = sprintf('%s-svg', this._id);

  /**
   * The D3 svg handler for the chart
   * @protected
   */
  this._svg = null;

  /**
   * @type {?epiviz.datatypes.GenomicRange}
   * @protected
   */
  this._lastRange = null;

  /**
   * @type {?epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>}
   * @protected
   */
  this._lastData = null;

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

  // Events

  /**
   * @type {epiviz.events.Event.<epiviz.ui.charts.UiObject>}
   * @protected
   */
  this._hover = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event}
   * @protected
   */
  this._unhover = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<epiviz.ui.charts.UiObject>}
   * @protected
   */
  this._select = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event}
   * @protected
   */
  this._deselect = new epiviz.events.Event();

  /**
   * The event argument is the id of the chart
   *
   * @type {epiviz.events.Event.<string>}
   * @private
   */
  this._save = new epiviz.events.Event();

  /**
   * The event argument is the id of the chart
   *
   * @type {epiviz.events.Event.<string>}
   * @private
   */
  this._remove = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<{id: string, colors: epiviz.ui.charts.ColorPalette}>}
   * @private
   */
  this._colorsChanged = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<{id: string, modifiedMethods: Object.<string, string>}>}
   * @private
   */
  this._methodsModified = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<{id: string, customSettingsValues: Object.<string, *>}>}
   * @private
   */
  this._customSettingsChanged = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<{id: string, width: number|string, height: number|string}>}
   * @private
   */
  this._sizeChanged = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<{id: string, margins: epiviz.ui.charts.Margins}>}
   * @private
   */
  this._marginsChanged = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event}
   * @private
   */
  this._dataWaitStart = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event}
   * @private
   */
  this._dataWaitEnd = new epiviz.events.Event();
};

/**
 * @type {number}
 * @constant
 */
epiviz.ui.charts.Chart.SVG_MARGIN = 20;

/**
 * Initializes the chart and draws the initial SVG in the container
 * @protected
 */
epiviz.ui.charts.Chart.prototype._initialize = function() {
  if (this._properties.height == '100%') { this._properties.height = this._container.height() - epiviz.ui.charts.Chart.SVG_MARGIN; }
  if (this._properties.width == '100%') { this._properties.width = this._container.width() - epiviz.ui.charts.Chart.SVG_MARGIN; }

  var width = this.width();
  var height = this.height();

  this._container.append(sprintf('<svg id="%s" class="base-chart" width="%s" height="%s"></svg>', this._svgId, width, height));
  this._svg = d3.select('#' + this._svgId);

  this._addStyles();
  this._addFilters();


  var jSvg = $('#' + this._svgId);

  /**
   * The difference in size between the container and the inner SVG
   * @type {number}
   * @private
   */
  this._widthDif = jSvg.width() - (this._container.width() - epiviz.ui.charts.Chart.SVG_MARGIN);

  /**
   * The difference in size between the container and the inner SVG
   * @type {number}
   * @private
   */
  this._heightDif = height - (this._container.height() - epiviz.ui.charts.Chart.SVG_MARGIN);

  this._properties.width = width;
  this._properties.height = height;

  var self = this;
  this._container.click(function() { self._deselect.notify(); });
};

/**
 * @protected
 */
epiviz.ui.charts.Chart.prototype._addStyles = function() {
  var jSvg = this._container.find('svg');
  jSvg.append('<style type="text/css"></style>');
};

/**
 * @protected
 */
epiviz.ui.charts.Chart.prototype._addFilters = function() {
  var defs = this._svg.append('defs');
  var glow = defs.append('filter')
    .attr('id', this._id + '-glow');
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
    .attr('id', this._id + '-contour');
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
    .attr('id', this._id + '-dropshadow')
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
 * @param [svg] D3 svg container for the axes
 * @protected
 */
epiviz.ui.charts.Chart.prototype._clearAxes = function(svg) {
  svg = svg || this._svg;
  svg.selectAll('.xAxis').remove();
  svg.selectAll('.yAxis').remove();
};

/**
 * @param xScale D3 linear scale for the x axis
 * @param yScale D3 linear scale for the y axis
 * @param {number} [xTicks]
 * @param {number} [yTicks]
 * @param [svg] D3 svg container for the axes
 * @param {number} [width]
 * @param {number} [height]
 * @param {epiviz.ui.charts.Margins} [margins]
 * @protected
 */
epiviz.ui.charts.Chart.prototype._drawAxes = function(xScale, yScale, xTicks, yTicks, svg, width, height, margins) {
  svg = svg || this._svg;
  margins = margins || this.margins();
  height = height || this.height();
  width = width || this.width();

  var axesGroup = svg.select('.axes'),
    xAxisGrid = axesGroup.select('.xAxis-grid'),
    yAxisGrid = axesGroup.select('.yAxis-grid'),
    xAxisLine = axesGroup.select('.xAxis-line'),
    yAxisLine = axesGroup.select('.yAxis-line');

  if (axesGroup.empty()) {
    axesGroup = svg.append('g').attr('class', 'axes');
  }

  if (xAxisGrid.empty()) {
    xAxisGrid = axesGroup.append('g').attr('class', 'xAxis xAxis-grid');
  }

  if (yAxisGrid.empty()) {
    yAxisGrid = axesGroup.append('g').attr('class', 'yAxis yAxis-grid');
  }

  if (xAxisLine.empty()) {
    xAxisLine = axesGroup.append('g').attr('class', 'xAxis xAxis-line');
  }

  if (yAxisLine.empty()) {
    yAxisLine = axesGroup.append('g').attr('class', 'yAxis yAxis-line');
  }

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

    var xAxis = d3.svg.axis()
      .scale(xScale)
      .orient('bottom')
      .tickFormat(d3.format('s'));
    xAxisLine
      .attr('transform', 'translate(' + margins.left() + ', ' + (height - margins.bottom()) + ')')
      .call(xAxis);
  }

  if (yScale) {
    // Draw Y-axis grid lines
    yAxisGrid
      .attr('transform', 'translate(' + margins.left() + ', ' + margins.top() + ')')
      .selectAll('line.y')
      .data(yScale.ticks(yTicks))
      .enter().append('line')
      .attr('x1', 0)
      .attr('x2', width - margins.left() - margins.right())
      .attr('y1', yScale)
      .attr('y2', yScale)
      .style('stroke', '#eeeeee')
      .style('shape-rendering', 'crispEdges');

    var yAxis = d3.svg.axis()
      .scale(yScale)
      .orient('left');
    yAxisLine
      .attr('transform', 'translate(' + margins.left() + ', ' + margins.top() + ')')
      .call(yAxis);
  }
};

/**
 * @param {number} width
 * @param {number} height
 */
epiviz.ui.charts.Chart.prototype.resize = function(width, height) {
  if (width) { this._properties.width = width; }
  if (height) { this._properties.height = height; }

  this.draw();

  this._sizeChanged.notify({ id: this._id, width: this._properties.width, height: this._properties.height });
};

/**
 */
epiviz.ui.charts.Chart.prototype.containerResize = function() {
  this.resize(
    this._widthDif + this._container.width() - epiviz.ui.charts.Chart.SVG_MARGIN,
    this._heightDif + this._container.height() - epiviz.ui.charts.Chart.SVG_MARGIN);
};

/**
 * @param {epiviz.datatypes.GenomicRange} [range]
 * @param {epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>} [data]
 * @returns {Array.<epiviz.ui.charts.UiObject>} The objects drawn
 */
epiviz.ui.charts.Chart.prototype.draw = function(range, data) {
  if (range) {
    this._binSize = Math.ceil((range.end() - range.start()) / this._nBins);
  }

  if (data && range) {
    this._lastData = data;
    this._lastRange = range;
    this._dataWaitEnd.notify();
  }

  this._svg
    .attr('width', this.width())
    .attr('height', this.height());

  return [];
};

/**
 * @returns {jQuery}
 */
epiviz.ui.charts.Chart.prototype.container = function() { return this._container; };

/**
 * @returns {string}
 */
epiviz.ui.charts.Chart.prototype.id = function() { return this._id; };

/**
 * @returns {epiviz.ui.charts.ChartProperties}
 */
epiviz.ui.charts.Chart.prototype.properties = function() {
  return this._properties;
};

/**
 * @returns {number}
 */
epiviz.ui.charts.Chart.prototype.height = function() {
  return this._properties.height;
};

/**
 * @returns {number}
 */
epiviz.ui.charts.Chart.prototype.width = function() {
  return this._properties.width;
};

/**
 * @returns {epiviz.ui.charts.Margins}
 */
epiviz.ui.charts.Chart.prototype.margins = function() {
  return this._properties.margins;
};

/**
 * @returns {epiviz.measurements.MeasurementSet}
 */
epiviz.ui.charts.Chart.prototype.measurements = function() {
  return this._properties.measurements;
};

/**
 * @returns {epiviz.ui.charts.ColorPalette}
 */
epiviz.ui.charts.Chart.prototype.colors = function() {
  return this._properties.colors;
};

/**
 * @returns {epiviz.ui.charts.ChartType.DisplayType}
 */
epiviz.ui.charts.Chart.prototype.displayType = function() { throw Error('unimplemented abstract method'); };

/**
 * @returns {string}
 */
epiviz.ui.charts.Chart.prototype.chartTypeName = function() { throw Error('unimplemented abstract method'); };

/**
 * @returns {epiviz.events.Event.<epiviz.ui.charts.UiObject>}
 */
epiviz.ui.charts.Chart.prototype.onHover = function() { return this._hover; };

/**
 * @returns {epiviz.events.Event}
 */
epiviz.ui.charts.Chart.prototype.onUnhover = function() { return this._unhover; };

/**
 * @returns {epiviz.events.Event.<epiviz.ui.charts.UiObject>}
 */
epiviz.ui.charts.Chart.prototype.onSelect = function() { return this._select; };

/**
 * @returns {epiviz.events.Event}
 */
epiviz.ui.charts.Chart.prototype.onDeselect = function() { return this._deselect; };

/**
 * @param {epiviz.ui.charts.UiObject} selectedObject
 */
epiviz.ui.charts.Chart.prototype.doHover = function(selectedObject) {
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
epiviz.ui.charts.Chart.prototype.doUnhover = function() {
  var itemsGroup = this._container.find('.items');
  var unselectedHoveredGroup = itemsGroup.find('> .hovered');
  var selectedGroup = itemsGroup.find('> .selected');
  var selectedHoveredGroup = selectedGroup.find('> .hovered');

  itemsGroup.prepend(unselectedHoveredGroup.children());
  //itemsGroup.css('fill-opacity', '');

  selectedGroup.prepend(selectedHoveredGroup.children());
};

/**
 * @param {epiviz.ui.charts.UiObject} selectedObject
 */
epiviz.ui.charts.Chart.prototype.doSelect = function(selectedObject) {
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
epiviz.ui.charts.Chart.prototype.doDeselect = function() {
  var itemsGroup = this._container.find('.items');
  var unselectedHoveredGroup = itemsGroup.find('> .hovered');
  var selectedGroup = itemsGroup.find('> .selected');
  var selectedHoveredGroup = selectedGroup.find('> .hovered');

  itemsGroup.prepend(selectedGroup.find('> .item'));
  unselectedHoveredGroup.prepend(selectedHoveredGroup.children());
};

/**
 * @returns {Array.<{name: string, color: string}>}
 */
epiviz.ui.charts.Chart.prototype.colorMap = function() {
  var self = this;
  var colors = new Array(this._properties.measurements.size());
  this._properties.measurements.foreach(function(m, i) {
    colors[i] = { name: m.name(), color: self._properties.colors.get(i) };
  });

  return colors;
};

/**
 * @param {Array.<{name: string, color: string}>} colorMap
 */
epiviz.ui.charts.Chart.prototype.setColorMap = function(colorMap) {
  var colors = [];
  for (var i = 0; i < colorMap.length; ++i) {
    colors.push(colorMap[i].color);
  }

  for (; i < this._properties.colors.size(); ++i) {
    colors.push(this._properties.colors.get(i));
  }

  this._properties.colors = new epiviz.ui.charts.ColorPalette(colors);

  this.draw();

  this._colorsChanged.notify({id: this._id, colors: this._properties.colors});
};

/**
 * @returns {Object.<string, *>}
 */
epiviz.ui.charts.Chart.prototype.customSettingsValues = function() { return this._customSettingsValues; };

/**
 * @param {Object.<string, *>} settingsValues
 */
epiviz.ui.charts.Chart.prototype.setCustomSettingsValues = function(settingsValues) {
  var CustomSettings = epiviz.ui.charts.ChartType.CustomSettings;
  this._customSettingsValues = settingsValues;

  if (CustomSettings.MARGIN_TOP in settingsValues && CustomSettings.MARGIN_BOTTOM in settingsValues && CustomSettings.MARGIN_LEFT in settingsValues && CustomSettings.MARGIN_RIGHT in settingsValues) {
    this._properties.margins = new epiviz.ui.charts.Margins(settingsValues[CustomSettings.MARGIN_TOP], settingsValues[CustomSettings.MARGIN_LEFT], settingsValues[CustomSettings.MARGIN_BOTTOM], settingsValues[CustomSettings.MARGIN_RIGHT]);
    this._marginsChanged.notify({id: this._id, margins: this._properties.margins});
  }

  this._customSettingsChanged.notify({id: this._id, customSettingsValues: settingsValues});
};

/**
 * @param {Object.<string, string>} modifiedMethods
 */
epiviz.ui.charts.Chart.prototype.setModifiedMethods = function(modifiedMethods) {
  if (!modifiedMethods) { return; }
  for (var m in modifiedMethods) {
    if (!modifiedMethods.hasOwnProperty(m)) { continue; }
    if (m == '_setModifiedMethods') { continue; } // Ignore modifications to this method

    try {
      this[m] = eval('(' + modifiedMethods[m] + ')');
    } catch (e) {
      var dialog = new epiviz.ui.controls.MessageDialog(
        'Error evaluating code',
        {
          Ok: function() {}
        },
        'Could not evaluate the code for method ' + m + '. Error details:<br/>' + e.message,
        epiviz.ui.controls.MessageDialog.Icon.ERROR);
      dialog.show();
    }
  }
  this.draw();

  this._methodsModified.notify({id: this._id, modifiedMethods: modifiedMethods});
};

/**
 * @returns {epiviz.events.Event.<string>}
 */
epiviz.ui.charts.Chart.prototype.onSave = function() { return this._save; };

/**
 * @returns {epiviz.events.Event.<string>}
 */
epiviz.ui.charts.Chart.prototype.onRemove = function() { return this._remove; };

/**
 * @returns {epiviz.events.Event.<{id: string, colors: epiviz.ui.charts.ColorPalette}>}
 */
epiviz.ui.charts.Chart.prototype.onColorsChanged = function() { return this._colorsChanged; };

/**
 * @returns {epiviz.events.Event.<{id: string, modifiedMethods: Object.<string, string>}>}
 */
epiviz.ui.charts.Chart.prototype.onMethodsModified = function() { return this._methodsModified; };

/**
 * @returns {epiviz.events.Event.<{id: string, customSettingsValues: Object.<string, *>}>}
 */
epiviz.ui.charts.Chart.prototype.onCustomSettingsChanged = function() { return this._customSettingsChanged; };

/**
 * @returns {epiviz.events.Event.<{id: string, width: (number|string), height: (number|string)}>}
 */
epiviz.ui.charts.Chart.prototype.onSizeChanged = function() { return this._sizeChanged; };

/**
 * @returns {epiviz.events.Event.<{id: string, margins: epiviz.ui.charts.Margins}>}
 */
epiviz.ui.charts.Chart.prototype.onMarginsChanged = function() { return this._marginsChanged; };

/**
 * @returns {epiviz.events.Event}
 */
epiviz.ui.charts.Chart.prototype.onDataWaitStart = function() { return this._dataWaitStart; };

/**
 * @returns {epiviz.events.Event}
 */
epiviz.ui.charts.Chart.prototype.onDataWaitEnd = function() { return this._dataWaitEnd; };
