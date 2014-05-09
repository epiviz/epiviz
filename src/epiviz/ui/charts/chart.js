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
   * @type {number}
   * @private
   */
  this._loaderTimeout = 0;

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

  /**
   * @type {boolean}
   * @private
   */
  this._showTooltip = true;

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

  this._addChartButtons();

  this._container.append(sprintf('<svg id="%s" class="base-chart" width="%s" height="%s"></svg>', this._svgId, width, height));
  this._svg = d3.select('#' + this._svgId);

  this._addStyles();
  this._addFilters();

  this._addResizable();
  this._addTooltip();


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
 * @private
 */
epiviz.ui.charts.Chart.prototype._addResizable = function() {
  var self = this;
  var resizeHandler = function(event, ui) { self.containerResize(); };
  this._container.resizable({
    //resize: resizeHandler,
    stop: resizeHandler
  });
};

/**
 * @private
 */
epiviz.ui.charts.Chart.prototype._addTooltip = function() {
  var self = this;
  this._container.tooltip({
    items: '.item',
    content:function () {
      if (!self._showTooltip) { return false; }

      /** @type {epiviz.ui.charts.UiObject} */
      var uiObj = d3.select(this).data()[0];

      var maxMetadataValueLength = 15;

      var metadataCols = uiObj.measurements[0].metadata();
      var colsHeader = sprintf('<th><b>Start</b></th><th><b>End</b></th>%s%s',
        metadataCols ? '<th><b>' + metadataCols.join('</b></th><th><b>') + '</b></th>' : '',
        uiObj.values ? '<th><b>' + uiObj.measurements.join('</b></th><th><b>') + '</b></th>': '');

      var rows = '';
      for (var j = 0; j < uiObj.valueItems[0].length && j < 10; ++j) {
        var row = '';
        var rowItem = uiObj.valueItems[0][j].rowItem;
        row += sprintf('<td>%s</td><td>%s</td>', Globalize.format(rowItem.start(), 'n0'), Globalize.format(rowItem.end(), 'n0'));
        var rowMetadata = rowItem.rowMetadata();
        if (metadataCols && rowMetadata) {
          for (var k = 0; k < metadataCols.length; ++k) {
            var metadataCol = metadataCols[k];
            var metadataValue = rowMetadata[metadataCol] || '';
            row += sprintf('<td>%s</td>', metadataValue.length <= maxMetadataValueLength ? metadataValue : metadataValue.substr(0, maxMetadataValueLength) + '...');
          }
        }

        if (uiObj.values) {
          for (var i = 0; i < uiObj.measurements.length; ++i) {
            row += sprintf('<td>%s</td>', Globalize.format(uiObj.valueItems[i][j].value, 'n3'));
          }
        }

        rows += sprintf('<tr>%s</tr>', row);
      }
      if (j < uiObj.valueItems[0].length) {
        var colspan = 2 + (metadataCols ? metadataCols.length : 0) + (uiObj.values ? uiObj.measurements.length : 0);
        rows += sprintf('<tr><td colspan="%s" style="text-align: center;">...</td></tr>', colspan)
      }

      return sprintf('<table class="tooltip-table"><thead><tr>%s</tr></thead><tbody>%s</tbody></table>', colsHeader, rows);
    },
    track: true,
    show: false
  });
};

/**
 * @protected
 */
epiviz.ui.charts.Chart.prototype._addChartButtons = function() {
  var self = this;

  // Save button
  var saveButtonId = sprintf('%s-save', this._id);
  this._container.append(sprintf(
    '<button id="%s" style="position: absolute; top: 5px; right: 35px">Save</button>',
    saveButtonId));
  var saveButton = $('#' + saveButtonId);

  saveButton.button({
    icons:{
      primary:'ui-icon ui-icon-disk'
    },
    text:false
  }).click(function(){
    self._save.notify(self._id);
    return false;
  });

  // Remove button
  var removeButtonId = sprintf('%s-remove', this._id);
  this._container.append(sprintf(
    '<button id="%s" style="position: absolute; top: 5px; right: 5px">Remove</button>',
    removeButtonId));
  var removeButton = $('#' + removeButtonId);

  removeButton.button({
    icons:{
      primary:'ui-icon ui-icon-cancel'
    },
    text:false
  }).click(function(){
    self._remove.notify(self._id);
    return false;
  });

  // Color Picker button
  var colorsButtonId = sprintf('%s-color-picker', this._id);
  this._container.append(sprintf(
    '<button id="%s" style="position: absolute; top: 5px; right: 65px">Colors</button>',
    colorsButtonId));
  var colorsButton = $('#' + colorsButtonId);

  colorsButton.button({
    icons:{
      primary:'ui-icon ui-icon-colorpicker'
    },
    text:false
  }).click(function(){
    var colors = self.colorMap();
    var colorPickerDialog = new epiviz.ui.controls.ColorPickerDialog(
      {
        ok: function(colors) {
          self.setColorMap(colors);
        },
        cancel: function() {},
        reset: function() {}
      },
      colors);
    colorPickerDialog.show();

    return false;
  });

  // Custom settings button
  var customSettingsButtonId = sprintf('%s-custom-settings', this._id);
  this._container.append(sprintf(
    '<button id="%s" style="position: absolute; top: 5px; right: 95px">Custom settings</button>',
    customSettingsButtonId));
  var customSettingsButton = $('#' + customSettingsButtonId);

  customSettingsButton.button({
    icons:{
      primary:'ui-icon ui-icon-gear'
    },
    text:false
  }).click(function(){
    var CustomSettings = epiviz.ui.charts.ChartType.CustomSettings;
    var customSettingsDialog = new epiviz.ui.controls.CustomSettingsDialog(
      'Edit custom settings', {
        ok: function(settingsValues) {
          self._customSettingsValues = settingsValues;

          if (CustomSettings.MARGIN_TOP in settingsValues && CustomSettings.MARGIN_BOTTOM in settingsValues && CustomSettings.MARGIN_LEFT in settingsValues && CustomSettings.MARGIN_RIGHT in settingsValues) {
            self._properties.margins = new epiviz.ui.charts.Margins(settingsValues[CustomSettings.MARGIN_TOP], settingsValues[CustomSettings.MARGIN_LEFT], settingsValues[CustomSettings.MARGIN_BOTTOM], settingsValues[CustomSettings.MARGIN_RIGHT]);
            self._marginsChanged.notify({id: self._id, margins: self._properties.margins});
          }

          self.draw();
          self._customSettingsChanged.notify({id: self._id, customSettingsValues: settingsValues});
        },
        cancel: function() {}
      },
      self.properties().customSettingsDefs,
      self._customSettingsValues);
    customSettingsDialog.show();

    return false;
  });

  // Toggle tooltip button
  var tooltipButtonId = sprintf('%s-tooltip-button', this._id);
  this._container.append(sprintf(
    '<div id="%1$s-container" style="position: absolute; top: 7px; right: 125px">' +
      '<input type="checkbox" id="%1$s" checked="checked" />' +
      '<label for="%1$s" >Toggle Tooltip</label>' +
    '</div>', tooltipButtonId));
  var tooltipButton = $('#' + tooltipButtonId);
  var tooltipButtonContainer = $('#' + tooltipButtonId + '-container');
  tooltipButton.button({
    text: false,
    icons: {
      primary: 'ui-icon-comment'
    }
  }).click(function() {
    self._showTooltip = tooltipButton.is(':checked');
  });

  this._container
    .mousemove(function () {
      saveButton.show();
      removeButton.show();
      colorsButton.show();
      customSettingsButton.show();
      tooltipButtonContainer.show();
    })
    .mouseleave(function () {
      saveButton.hide();
      removeButton.hide();
      colorsButton.hide();
      customSettingsButton.hide();
      tooltipButtonContainer.hide();
    });
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
 */
epiviz.ui.charts.Chart.prototype.addLoaderAnimation = function() {
  if (this._loaderTimeout) { clearTimeout(this._loaderTimeout); }

  var self = this;
  this._loaderTimeout = setTimeout(function(){
    var loaderCls = 'chart-loader';
    var loaderBgCls = 'chart-loader-background';

    self._container.find('.' + loaderCls).remove();
    self._container.find('.' + loaderBgCls).remove();

    self._container.append(sprintf(
      '<div class="loader-icon %s" style="top: %spx; left: %spx;"></div>',
      loaderCls,
      Math.floor(self.height() * 0.5),
      Math.floor(self.width() * 0.5)));
    self._container.find('.' + loaderCls).activity({
      segments: 8,
      steps: 5,
      opacity: 0.3,
      width: 4,
      space: 0,
      length: 10,
      color: '#0b0b0b',
      speed: 1.0
    });

    self._svg
      .append('rect')
      .attr('class', loaderBgCls)
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', '#ffffff')
      .attr('opacity', 0.7);
  }, 500);
};

/**
 */
epiviz.ui.charts.Chart.prototype.removeLoaderAnimation = function() {
  if (this._loaderTimeout) { clearTimeout(this._loaderTimeout); }
  var loaderCls = 'chart-loader';
  var loaderBgCls = 'chart-loader-background';
  this._container.find('.' + loaderCls).remove();
  this._container.find('.' + loaderBgCls).remove();
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
  this.removeLoaderAnimation();

  if (range) {
    this._binSize = Math.ceil((range.end() - range.start()) / this._nBins);
  }

  if (data && range) {
    this._lastData = data;
    this._lastRange = range;
  }

  this._svg
    .attr('width', this.width())
    .attr('height', this.height());

  return [];
};

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

epiviz.ui.charts.Chart.prototype._changeObjectSelection = function(selectionData, sourceGroup, targetGroup) {
  var selectClasses = this._filterClassSelection(selectionData);
  if (selectClasses == null) {
    selectClasses = '';
    var s = Math.floor(selectionData.start / this._binSize);
    var e = Math.floor(selectionData.end / this._binSize);
    for (var j = s; j <= e; ++j) {
      selectClasses += sprintf('> .bin-%s,', j);
    }
  }

  var objects = sourceGroup.find(selectClasses);

  targetGroup.append(objects);

  return objects;
};

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
