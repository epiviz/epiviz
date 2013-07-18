/**
 * Created with JetBrains PhpStorm.
 * User: florin
 * Date: 2/25/13
 * Time: 8:36 PM
 * To change this template use File | Settings | File Templates.
 */

GeneScatterPlot.prototype = new BaseChart();

GeneScatterPlot.prototype.constructor = GeneScatterPlot;

// Inherit SelectableChart (multiple inheritance)
Inheritance.add(GeneScatterPlot, SelectableChart);

function GeneScatterPlot() {
  // Call the constructors of all the superclasses but the first:
  SelectableChart.call(this);

  this._data = null;
  this._measurementsX = null;
  this._measurementsY = null;

  this._measurementsMap = null;

  this._circleRadiusRatio = null;
  this._circleRadius = null;

  this._chartContent = null;
  this._jChartContent = null;
  this._legend = null;

  this._legendWidth = null;
  this._legendHeight = null;

  this._aggregate = GeneScatterPlot.aggregationTypes.NONE;
  this._aggregatedData = null;
}

GeneScatterPlot.aggregationTypes = {
  NONE: 'none',
  MEAN: 'mean',
  MEDIAN: 'median',
  MIN: 'min',
  MAX: 'max'
};

GeneScatterPlot.prototype.initialize = function (parentId, width, height, margin, workspaceData) {

  // Call super
  BaseChart.prototype.initialize.call(this, parentId, width, height, margin, workspaceData);

  SelectableChart.prototype.initialize.call(this);

  var measurementsMap = this.getChartHandler().getDataTypeHandler().getMeasurementsStore().getMeasurements();
  if (measurementsMap) {
    this._measurementsMap = measurementsMap;
  }

  this._circleRadiusRatio = 0.015;
  this._circleRadius = this._circleRadiusRatio * Math.min(width, height);
  this._measurementsX = this._measurements[0];
  this._measurementsY = this._measurements[1];

  this._addStyles();

  this._chartContent = this._svg.append('g').attr('class', 'chart-content');
  this._jChartContent = this._jParent.find('.chart-content');
  this._legend = this._svg.append('g').attr('class', 'chart-legend');

  // Add options button
  this._addOptionsButton();

  this._addTooltip();

  EventManager.instance.addEventListener(EventManager.eventTypes.BEGIN_UPDATE_CHART_DATA, this);
  EventManager.instance.addEventListener(EventManager.eventTypes.CHART_DATA_UPDATED, this);
  EventManager.instance.addEventListener(EventManager.eventTypes.MEASUREMENTS_LOADED, this);
};

GeneScatterPlot.prototype._addStyles = function() {
  var svgId = '#' + this._svgId;
  var style =
    sprintf('%s .items { stroke: #ffffff; stroke-opacity: 0.5; }\n', svgId) +
    sprintf('%s .items .selected { fill: #1a6d00; stroke: #ffc600; stroke-width: 5; stroke-opacity: 0.7; fill-opacity: 1; }\n', svgId) +
    sprintf('%s .items .hovered { fill: #1a6d00; stroke: #ffc600; stroke-width: 5; stroke-opacity: 0.7; fill-opacity: 1; }\n', svgId);
  var nSeries = Math.min(this._measurementsX.length, this._measurementsY.length);
  for (var i = 0; i < nSeries; ++i) {
    style += sprintf('%s .data-series-%s { opacity: 0.7; }\n', svgId, i);
  }

  var jSvg = this._jParent.find('svg');
  jSvg.append(sprintf('<style type="text/css">%s</style>', style));
};

GeneScatterPlot.prototype._addTooltip = function() {
  var self = this;
  this._jParent.tooltip({
    items: '.item',
    content:function () {
      var point = d3.select(this).data()[0];
      var mx = self._measurementsMap[self._measurementsX[point.seriesIndex]];
      var my = self._measurementsMap[self._measurementsY[point.seriesIndex]];
      return sprintf('<b>Probe:</b> %s<br/><b>Gene:</b> %s<br/><b>Start:</b> %s<br/><b>End:</b> %s<br/><b>%s:</b> %s<br/><b>%s:</b> %s',
        point.probe,
        point.gene,
        point.start,
        point.end,
        mx,
        point.x,
        my,
        point.y);
      },
    track: true,
    show: false
  });
};

GeneScatterPlot.prototype._addOptionsButton = function() {
  var self = this;

  var optionsButtonId = 'options-' + this._id;
  this._jParent.append('<button id="' + optionsButtonId + '" style="position: absolute; top: 5px; right: 105px">Gene Aggregation Options</button>');
  var optionsButton = $('#' + optionsButtonId);

  var optionsMenuId = 'menu-' + this._id;

  var optionIds = {};
  optionIds['menu-option-mean-' + this._id] = GeneScatterPlot.aggregationTypes.MEAN;
  optionIds['menu-option-median-' + this._id] = GeneScatterPlot.aggregationTypes.MEDIAN;
  optionIds['menu-option-min-' + this._id] = GeneScatterPlot.aggregationTypes.MIN;
  optionIds['menu-option-max-' + this._id] = GeneScatterPlot.aggregationTypes.MAX;


  var menuHtml =
    '<div class="dropdown-menu">' +
      '<ul id="' + optionsMenuId + '">';

  var optionNoneId = 'menu-option-none-' + this._id;
  menuHtml += '<li><a href="javascript:void(0)" id="' + optionNoneId + '">Show all probes</a></li>';

  var optionId;
  for (optionId in optionIds) {
    menuHtml += '<li><a href="javascript:void(0)" id="' + optionId + '">Aggregate by gene ' + optionIds[optionId] + '</a></li>';
  }

  optionIds[optionNoneId] = GeneScatterPlot.aggregationTypes.NONE;

  menuHtml += '</ul></div>';

  this._jParent.append(menuHtml);
  var optionsMenu = $('#' + optionsMenuId);

  optionsButton
    .button({
      text: false,
      icons: {
        primary: 'ui-icon ui-icon-scatterplot', // 'ui-icon ui-icon-bookmark',
        secondary: "ui-icon-triangle-1-s"
      }
    })
    .click(function() {
      var menu = optionsMenu;
      var visible = menu.is(":visible");
      $('.dropdown-menu').find(">:first-child").hide();
      if (!visible) {
        menu.show().position({
          my: "left top",
          at: "left bottom",
          of: this
        });
        var optionId;
        for (optionId in optionIds) {
          if (optionIds[optionId] == self._aggregate) {
            $('#' + optionId).addClass('ui-state-focus');
          } else {
            $('#' + optionId).removeClass('ui-state-focus');
          }
        }
      }
      $( document ).one( "click", function() {
        menu.hide();
      });
      return false;
    });

  optionsMenu
    .hide()
    .menu();

  for (optionId in optionIds) {
    $('#' + optionId).click(function(optionId, optionIds) {
      return function() {
        if (self._aggregate == optionIds[optionId]) {
          // Nothing to do
          return;
        }

        self._aggregate = optionIds[optionId];
        self._aggregatedData = self._aggregateGenes(self._data);
        self.draw();
      };
    }.call(null, optionId, optionIds));
  }

  // Toggle legend button

  var legendButtonId = 'toggle-legend-' + this._id;
  this._jParent.append(
    '<div id="' + legendButtonId + '-container" style="position: absolute; top: 7px; right: 150px" >' +
      '<input type="checkbox" id="' + legendButtonId + '" checked="checked" />' +
      '<label for="' + legendButtonId + '" >Toggle Show Legend</label>' +
      '</div>');
  var legendButton = $('#' + legendButtonId);
  var legendButtonContainer = $('#' + legendButtonId + '-container');

  legendButton.button({
    text: false,
    icons: {
      primary: 'ui-icon ui-icon-image'
    }
  })
    .click(function() {
      var showLegend = legendButton.is(':checked');
      if (!showLegend) {
        self._legend.style('display', 'none');
      } else {
        self._legend.style('display', null);
      }
    });


  this._jParent
    .mousemove(function () {
      optionsButton.show();
      legendButtonContainer.show();
    })
    .mouseleave(function () {
      optionsButton.hide();
      optionsMenu.hide();
      legendButtonContainer.hide();
    });
};

GeneScatterPlot.prototype.draw = function(data) {
  // Call super
  BaseChart.prototype.draw.call(this, data);

  var d;
  if (data) {
    this._data = data;
    this._aggregatedData = this._aggregateGenes(data);
  } else if (!this._data) {
    // Nothing to display
    return;
  }

  d = this._aggregatedData;

  this._svg
    .attr('width', this._width - this._parentMargins.x)
    .attr('height', this._height - this._parentMargins.y);

  this._drawCircles(d);
  this._drawLegend();

  this.refreshSelection();
};

GeneScatterPlot.prototype._drawLegend = function() {
  if (!this._measurementsMap) { return; }

  var mx = this._measurementsX;
  var my = this._measurementsY;
  var mNames = this._measurementsMap;
  var indices = d3.range(0, Math.min(mx.length, my.length));
  var maxTextWidth = 0;

  for (var i = 0; i < indices.length; ++i) {
    var width = Math.max(mNames[mx[i]].length, mNames[my[i]].length);
    if (width > maxTextWidth) {
      maxTextWidth = width;
    }
  }

  var lineSpacing = 25;
  this._legendWidth = 80 + maxTextWidth * 5;
  this._legendHeight = lineSpacing + lineSpacing * indices.length * 3;

  this._legend.attr('transform',
      'translate(' + (this._width - this._margin - this._legendWidth - 15) + ', ' + (this._margin + 5) + ')');

  var legendContent = this._legend.select('.legend-content');

  if (!legendContent.empty()) {
    // Legend already drawn
    return;
  }

  legendContent = this._legend.append('g').attr('class', 'legend-content');

  legendContent.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', this._legendWidth)
    .attr('height', this._legendHeight)
    .attr('fill', '#ffffff')
    .style('stroke', '#dcdcdc')
    .style('shape-rendering', 'crispEdges');

  legendContent
    .append('text')
    .attr('x', 30)
    .attr('y', lineSpacing)
    .attr('style', 'font-weight: bold; font-size: 14;')
    .text('Legend');

  var self = this;
  legendContent
    .append('g')
    .selectAll('circle')
    .data(indices).enter()
    .append('circle')
    .attr('class', 'legend-item')
    .attr('r', 10)
    .attr('fill', function(index){
      return self._colors[index];
    })
    .attr('cx', 20)
    .attr('cy', function (index) {
      return 60 + lineSpacing / 2 + index * 3 * lineSpacing;
    });

  legendContent
    .append('g')
    .selectAll('text')
    .data(indices).enter()
    .append('svg:text')
    .attr('x', 40)
    .attr('y', function(index) {
      return 63 + index * 3 * lineSpacing;
    })
    .text(function(index) {
      return mNames[mx[index]] + ' vs.';
    });

  legendContent
    .append('g')
    .selectAll('text')
    .data(indices).enter()
    .append('svg:text')
    .attr('x', 40)
    .attr('y', function(index) {
      return 63 + 25 + index * 3 * lineSpacing;
    })
    .text(function(index) {
      return mNames[my[index]];
    });
};

GeneScatterPlot.prototype._drawCircles = function(d) {
  var self = this;
  var circleRadius = this._circleRadius;
  var nSeries = Math.min(this._measurementsX.length, this._measurementsY.length);
  var nGenes = d['data']['gene'].length;
  var m = {
    top: this._margin,
    right: this._margin + 10,
    bottom: this._margin + 30,
    left: this._margin + 30
  };
  var width = this._width;
  var height = this._height;

  var min = {};
  var max = {};

  for (var j = 0; j < nSeries; ++j) {
    min[self._measurementsX[j]] = ComputedMeasurements.instance.min(d.min, self._measurementsX[j]);
    max[self._measurementsX[j]] = ComputedMeasurements.instance.max(d.max, self._measurementsX[j]);
    min[self._measurementsY[j]] = ComputedMeasurements.instance.min(d.min, self._measurementsY[j]);
    max[self._measurementsY[j]] = ComputedMeasurements.instance.max(d.max, self._measurementsY[j]);
  }

  var minX = min[this._measurementsX[0]];
  var maxX = max[this._measurementsX[0]];
  var minY = min[this._measurementsY[0]];
  var maxY = max[this._measurementsY[0]];

  var xScale = d3.scale.linear()
    .domain([minX, maxX])
    .range([0, width - m.left - m.right]);
  var yScale = d3.scale.linear()
    .domain([minY, maxY])
    .range([height - m.top - m.bottom, 0]);

  this._chartContent.selectAll('.xAxis').remove();
  this._chartContent.selectAll('.yAxis').remove();
  this._chartContent.selectAll('.xy-text').remove();
  this._drawAxes(xScale, yScale, 15, 15, this._chartContent, width, null, m);

  var indices = d3.range(0, nSeries * nGenes);

  var data = indices.map(function (i) {
    var index = i % nGenes;
    var seriesIndex = Math.floor(i / nGenes);
    var seriesX = self._measurementsX[seriesIndex];
    var seriesY = self._measurementsY[seriesIndex];
    var classes = sprintf('item data-series-%s probe-%s gene-%s', seriesIndex, d.data.probe[index], d.data.gene[index]);
    var s = Math.floor(d.data.start[index] / self._binSize);
    var e = Math.floor(d.data.end[index] / self._binSize);

    for (var j = s; j <= e; ++j) {
      classes += sprintf(' bin-%s', j);
    }

    var x = ComputedMeasurements.instance.evaluate(d.data, seriesX, index, function(s, index) { return s[index]; });
    var y = ComputedMeasurements.instance.evaluate(d.data, seriesY, index, function(s, index) { return s[index]; });

    return {
      index: index,
      probe: d['data']['probe'][index],
      start: d['data']['start'][index],
      end: d['data']['end'][index],
      gene: d['data']['gene'][index],
      fill: self._colors[seriesIndex],
      seriesIndex: seriesIndex,
      x: x,
      y: y,

      classes: classes
    }
  });

  var itemsGroup = this._chartContent.select('.items');

  if (itemsGroup.empty()) {
    itemsGroup = this._chartContent.append('g').attr('class', 'items');
    var selectedGroup = itemsGroup.append('g').attr('class', 'selected');
    itemsGroup.append('g').attr('class', 'hovered');
    selectedGroup.append('g').attr('class', 'hovered');
  }

  var selection = itemsGroup.selectAll('circle').data(data, function(d) { return 'scatter_' + d.probe + ' ' + d.gene + ' ' + d.seriesIndex; });

  selection
    .enter()
    .insert('circle', ':first-child')
    .style('opacity', 0)
    .attr('r', 0);
  selection
    .each(function(d) {
      var circle = d3.select(this);
      var seriesX = self._measurementsX[d.seriesIndex];
      var seriesY = self._measurementsY[d.seriesIndex];
      circle
        .attr('cx', m.left + (d.x - min[seriesX]) * (width - m.left - m.right) / (max[seriesX] - min[seriesX]))
        .attr('cy', height - m.bottom - ((d.y - min[seriesY]) * (height - m.top - m.bottom) / (max[seriesY] - min[seriesY])))
        .attr('class', d.classes)
        .style('fill', function(d) { return self._colors[d.seriesIndex]; });
    });

  selection
    .transition()
    .duration(1000)
    .style('opacity', null)
    .attr('r', circleRadius)
    .attr('id', function (d) {
      return sprintf('%s-item-%s-%s', self._parentId.substr(1), d.seriesIndex, d.index);
    });

  selection
    .exit()
    .transition()
    .duration(1000)
    .style('opacity', 0)
    .attr('r', 0)
    .remove();

  selection
    .on('mouseover', function (d) {
      var o = { probe: d.probe, gene: d.gene, start: d.start, end: d.end };
      EventManager.instance.blockHovered(o);
    })
    .on('mouseout', function (d) {
      EventManager.instance.blockUnhovered();
    })
    .on('click', function (d) {
      // Select
      var o = { probe: d.probe, gene: d.gene, start: d.start, end: d.end };
      EventManager.instance.blockDeselected();
      EventManager.instance.blockSelected(o);
      d3.event.stopPropagation();
    })
};

GeneScatterPlot.prototype._drawAxes = function(xScale, yScale, xTicks, yTicks, svg, width, height, margin) {
  BaseChart.prototype._drawAxes.call(this, xScale, yScale, xTicks, yTicks, svg, width, height, margin);

  if (!this._measurementsMap) { return; }

  var xyTextGroup = this._svg.select('.axes').select('.xy-text');

  if (!xyTextGroup.empty()) {
    return;
  }

  xyTextGroup = this._svg.select('.axes').append('g').attr('class', 'xy-text');

  var mx = this._measurementsX;
  var my = this._measurementsY;
  var mNames = this._measurementsMap;

  var xTitle = '';
  var yTitle = '';

  var nSeries = Math.min(mx.length, my.length);

  var i;
  for (i = 0; i < nSeries; ++i) {
    xTitle += mNames[mx[i]] + ', ';
  }
  if (xTitle.length >= 2) {
    xTitle = xTitle.substr(0, xTitle.length - 2);
  }

  for (i = 0; i < nSeries; ++i) {
    yTitle += mNames[my[i]] + ', ';
  }
  if (yTitle.length >= 2) {
    yTitle = yTitle.substr(0, yTitle.length - 2);
  }

  var xWidth = xTitle.length * 7;
  var yWidth = yTitle.length * 7;
  xyTextGroup.append('text')
    .attr('x', (this._width - xWidth) * 0.5)
    .attr('y', (this._height - 10))
    .attr('style', 'font-weight: regular; font-size: 12;')
    .attr('fill', '#000000')
    .attr('stroke', 'none')
    .style('fill-opacity', 1)
    .text(xTitle);

  xyTextGroup.append('text')
    .attr('x', - this._height + (this._height - yWidth) * 0.5 + this._margin)
    .attr('y', 15)
    .attr('transform', 'rotate(-90)')
    .attr('style', 'font-weight: regular; font-size: 12;')
    .attr('fill', '#000000')
    .attr('stroke', 'none')
    .style('fill-opacity', 1)
    .text(yTitle);
};

GeneScatterPlot.prototype._getTitle = function() {
  if (this._title && this._title != '') {
    return this._title;
  }

  var nSeries = Math.min(this._measurementsX.length, this._measurementsY.length);
  var title = '';

  var i;
  title += this._measurementsMap[this._measurementsX[0]];
  for (i = 1; i < nSeries; ++i) {
    title += ', ' + this._measurementsMap[this._measurementsX[i]];
  }

  title += ' vs. ';
  title += this._measurementsMap[this._measurementsY[0]];
  for (i = 1; i < nSeries; ++i) {
    title += ', ' + this._measurementsMap[this._measurementsY[i]];
  }

  this._title = title;

  return this._title;
};

GeneScatterPlot.prototype._aggregateGenes = function(data) {
  if (this._aggregate == GeneScatterPlot.aggregationTypes.NONE) { return data; }

  var d = {
    start: data.start,
    end: data.end,
    chr: data.chr,
    min: data.min,
    max: data.max,
    data: {
    }
  };

  var gene;
  var genesMap = {};
  for (var i = 0; i < data.data['gene'].length; ++i) {
    gene = data.data['gene'][i];
    if (!genesMap[gene]) {
      genesMap[gene] = [];
    }

    genesMap[gene].push(i);
  }

  var key;
  for (key in data.data) {
    d.data[key] = [];
  }

  for (gene in genesMap) {
    for (key in data.data) {
      switch (key) {
        case 'gene':
          d.data[key].push(gene);
          break;
        case 'start':
          d.data[key].push(this._min(data.data[key], genesMap[gene]));
          break;
        case 'end':
          d.data[key].push(this._max(data.data[key], genesMap[gene]));
          break;
        case 'probe':
          d.data[key].push('NA');
          break;
        default:
          var val;
          var column = data.data[key];
          var indices = genesMap[gene];
          switch(this._aggregate) {
            case GeneScatterPlot.aggregationTypes.MEAN:
              val = this._mean(column, indices);
              break;
            case GeneScatterPlot.aggregationTypes.MEDIAN:
              val = this._median(column, indices);
              break;
            case GeneScatterPlot.aggregationTypes.MIN:
              val = this._min(column, indices);
              break;
            case GeneScatterPlot.aggregationTypes.MAX:
              val = this._max(column, indices);
              break;
          }
          d.data[key].push(val);
          break;
      }
    }
  }

  return d;
};

GeneScatterPlot.prototype._mean = function(column, indices) {
  var sum = 0;
  for (var i = 0; i < indices.length; ++i) {
    sum += column[indices[i]];
  }

  return sum / indices.length;
};

GeneScatterPlot.prototype._median = function(column, indices) {
  indices.sort(function(i, j) { return column[i] - column[j]; });

  return column[indices[Math.floor(indices.length / 2)]];
};

GeneScatterPlot.prototype._min = function(column, indices) {
  var min = column[indices[0]];
  for (var i = 1; i < indices.length; ++i) {
    if (column[indices[i]] < min) { min = column[indices[i]]; }
  }

  return min;
};

GeneScatterPlot.prototype._max = function(column, indices) {
  var max = column[indices[0]];
  for (var i = 1; i < indices.length; ++i) {
    if (column[indices[i]] > max) { max = column[indices[i]]; }
  }

  return max;
};

GeneScatterPlot.prototype.onContainerResize = function(width, height) {
  this._circleRadius = Math.min(width, height) * this._circleRadiusRatio;
  EventManager.instance.blockDeselected();

  // Call super
  BaseChart.prototype.onContainerResize.call(this, width, height);
};

GeneScatterPlot.prototype.onBeginUpdateChartData = function(event) {
  if (event.detail.chartId == this._id) {
    this._addLoader();
  }
};

GeneScatterPlot.prototype.onChartDataUpdated = function(event) {
  if (event.detail.chartId != this._id) {
    return;
  }

  this._removeLoader();

  var data = event.detail.data.geneData;
  var lastLocation = event.detail.lastLocation;

  if (data.chr != lastLocation.chr
    || data.start != lastLocation.start
    || data.end != lastLocation.end) {
    return;
  }

  this.draw(data);
};

GeneScatterPlot.prototype.onMeasurementsLoaded = function (event) {
  this._measurementsMap = event.detail.geneMeasurements;

  this._title = this._getTitle();
};

// For selection:

GeneScatterPlot.prototype._filterClassSelection = function(selectionData) {
  if (selectionData.probe && selectionData.probe != 'NA') {
    return sprintf('> .probe-%s', selectionData.probe);
  }

  if (selectionData.gene) {
    return sprintf('> .gene-%s', selectionData.gene);
  }

  return null;
};

GeneScatterPlot.prototype._findItems = function() {
  return this._jChartContent.find('> .items');
};

GeneScatterPlot.prototype.getDisplayInformation = function(objects) {
  var i, d;
  var result = '';
  var none = GeneScatterPlot.aggregationTypes.NONE;
  var key = (this._aggregate == none) ? 'probe' : 'gene';
  var nMeasurements = Math.min(this._measurementsX.length, this._measurementsY.length);

  var tableLocation = '';
  if (this._aggregate == none) {
    tableLocation += '<td><b>Probe</b></td>';
  }
  tableLocation = sprintf('<tr>%s<td><b>Gene</b></td><td><b>Start</b></td><td><b>End</b></td></tr>', tableLocation);

  var items = [];
  for (i = 0; i < nMeasurements; ++i) { items.push({}); }

  var seenItems = {};

  for (i = 0; i < objects.length; ++i) {
    d = d3.select(objects[i]).data()[0];
    items[d.seriesIndex][d[key]] = d;

    if (seenItems[d[key]]) {
      continue;
    }

    seenItems[d[key]] = d[key];

    var row = '';
    if (this._aggregate == none) {
      row += sprintf('<td>%s</td>', d.probe);
    }
    row = sprintf('<tr>%s<td>%s</td><td style="text-align: right">%s</td><td style="text-align: right">%s</td></tr>',
      row, d.gene, Globalize.format(d.start, 'n0'), Globalize.format(d.end, 'n0'));
    tableLocation += row;
  }
  tableLocation = sprintf('<table class="info-panel-table">%s</table>', tableLocation);

  result += tableLocation;

  for (var k = 0; k < nMeasurements; ++k) {
    var colx = this._measurementsX[k];
    var coly = this._measurementsY[k];

    var tableMeasurements = '';
    if (this._aggregate == none) {
      tableMeasurements += '<td><b>Probe</b></td>';
    }
    tableMeasurements += '<td><b>Gene</b></td>';
    tableMeasurements += sprintf('<td><b>%s</b></td><td><b>%s</b></td>', this._measurementsMap[colx], this._measurementsMap[coly]);

    for (var p in seenItems) {
      d = items[k][p];
      row = '';
      if (this._aggregate == none) {
        row += sprintf('<td>%s</td>', d.probe);
      }
      row += sprintf('<td>%s</td>', d.gene);
      row += sprintf('<td style="text-align: right">%s</td><td style="text-align: right">%s</td>', Globalize.format(d.x, 'n5'), Globalize.format(d.y, 'n5'));
      tableMeasurements += sprintf('<tr>%s</tr>', row);
    }
    tableMeasurements = sprintf('<table class="info-panel-table">%s</table>', tableMeasurements);

    result += '<br/>' + tableMeasurements;
  }

  return result;
};

GeneScatterPlot.prototype.getMeasurementColorMap = function() {
  var measurementNames = this.getChartHandler().getDataTypeHandler().getMeasurementsStore().getMeasurements();
  var map = {};

  var nSeries = Math.min(this._measurementsX.length, this._measurementsY.length);
  for (var i = 0; i < nSeries; ++i) {
    var name = sprintf('%s vs. %s',
      measurementNames[this._measurementsX[i]],
      measurementNames[this._measurementsY[i]]);
    map[name] = this._colors[i];
  }

  return map;
};

GeneScatterPlot.prototype.setColors = function(colors) {
  BaseChart.prototype.setColors.call(this, colors);

  var items = this._svg.selectAll('.item');
  items.style('fill', function(d) { return colors[d.seriesIndex]; });

  this._legend.selectAll('.legend-item').style('fill', function(i) { return colors[i]; });
};
