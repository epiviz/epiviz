/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/14/13
 * Time: 11:55 PM
 */

goog.provide('epiviz.plugins.charts.FeatureScatterPlot');

/**
 * @param {string} id
 * @param {jQuery} container
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @extends {epiviz.ui.charts.Plot}
 * @constructor
 */
epiviz.plugins.charts.FeatureScatterPlot = function(id, container, properties) {
    // Call superclass constructor
    epiviz.ui.charts.Plot.call(this, id, container, properties);

    // this._dispatch = d3.dispatch("hover", "click");

    /**
     * D3 chart container
     * @type {*}
     * @private
     */
    this._chartContent = null;

    /**
     * D3 legend container
     * @type {*}
     * @private
     */
    this._legend = null;

    /**
     * @type {Array.<epiviz.measurements.Measurement>}
     * @private
     */
    this._measurementsX = [];

    /**
     * @type {Array.<epiviz.measurements.Measurement>}
     * @private
     */
    this._measurementsY = [];

    var self = this;
    this.measurements().foreach(function(m, i) {
        if (i % 2 == 0) { self._measurementsX.push(m); } else { self._measurementsY.push(m); }
    });

    /**
     * @type {string}
     * @private
     */
    this._xLabel = '';

    /**
     * @type {string}
     * @private
     */
    this._yLabel = '';

    for (var i = 0; i < Math.min(this._measurementsX.length, this._measurementsY.length); ++i) {
        if (i > 0) {
            this._xLabel += ', ';
            this._yLabel += ', ';
        }
        this._xLabel += this._measurementsX[i].name();
        this._yLabel += this._measurementsY[i].name();
    }

    /**
     * @type {Array.<string>}
     * @private
     */
    this._colorLabels = [];

    /**
     * @type {epiviz.events.Event.<{searchTerm: string, callback: function(Array.<{probe: string, gene: string, seqName: string, start: number, end: number}>)}>}
     * @private
     */
    this._searchFeatureChart = new epiviz.events.Event();

    this._registerFeatureGetData = new epiviz.events.Event();

    this._featureType = "featureScatterPlot";

    this._initialize();
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.FeatureScatterPlot.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.Plot.prototype);
epiviz.plugins.charts.FeatureScatterPlot.constructor = epiviz.plugins.charts.FeatureScatterPlot;

/**
 * @protected
 */
epiviz.plugins.charts.FeatureScatterPlot.prototype._initialize = function() {
    // Call super
    epiviz.ui.charts.Plot.prototype._initialize.call(this);

    this._svg.classed('scatter-plot', true);

    this._chartContent = this._svg.append('g').attr('class', 'chart-content');
    this._legend = this._svg.append('g').attr('class', 'chart-legend');

    var featureName = this.customSettingsValues()[epiviz.plugins.charts.FeatureScatterPlotType.CustomSettings.FEATURE_NAME];
    var featureId = this.customSettingsValues()[epiviz.plugins.charts.FeatureScatterPlotType.CustomSettings.FEATURE_ID];

    this._drawNavigation(featureName, featureId);
};

/**
 * @param {epiviz.datatypes.GenomicRange} [range]
 * @param {?epiviz.datatypes.GenomicData} [data]
 * @returns {Array.<epiviz.ui.charts.ChartObject>} The objects drawn
 */

epiviz.plugins.charts.FeatureScatterPlot.prototype.draw = function() {
    epiviz.ui.charts.Plot.prototype.draw.call(this, undefined, undefined);
    var self = this;

    self.drawScatter(self._lastRange, self._lastData.data, "sample_id", self._xLabel, "count");
};

epiviz.plugins.charts.FeatureScatterPlot.prototype.drawScatter = function(range, data, key, dimx, dimy) {

    this.xTag = this.customSettingsValues()[epiviz.ui.charts.Visualization.CustomSettings.ROW_LABEL];

    var old_x_axis = this._measurementsX[0];
    var tempAnnotation = old_x_axis.annotation();
    this._measurementsX = [];
    var new_x_axis = new epiviz.measurements.Measurement(this.xTag, this.xTag, 'feature', 'ihmp', 'ihmp',
                                           'ihmp', null, null, tempAnnotation,
                                           -1, 1,[]);
    this._measurementsX.push(new_x_axis);
    return this._drawCircles(data, this.xTag, dimy, key);
};

/**
 * @private
 */
epiviz.plugins.charts.FeatureScatterPlot.prototype._drawNavigation = function(fName, fId) {

    var self = this;

    console.log(self);

    $('#' + self.id()).prepend('<div style="text-align:center;padding-top:30px">Find a taxonomic feature <input id="search-box-' + self.id() + '" class="feature-search-box ui-widget-content ui-corner-all" type="text"/></div>');

    sBox = $('#search-box-' + self.id());
    sBox.val(self.customSettingsValues()['featureName']);
    sBox.watermark('Find a taxonomic feature');
    self._hoveritem = new epiviz.ui.charts.tree.UiNode(
        self.customSettingsValues()['featureId'], self.customSettingsValues()['featureName'], [], 
        null, null,
        null, 0, null, 
        null, null, null, 
        null, null, null, null, null, 
        null, 0, 100000);

    sBox.on("mouseover", function() {
        self._hover.notify(new epiviz.ui.charts.VisEventArgs(self.id(), self._hoveritem));
    });

    sBox.on("mouseout", function() {
        self._unhover.notify(new epiviz.ui.charts.VisEventArgs(self.id()));
    });

    sBox.autocomplete({
        source: function(request, callback) {
        self._searchFeatureChart.notify({ 
            searchTerm: request.term, 
            callback:
                /**
                 * @param {Array.<{probe: string, gene: string, seqName: string, start: number, end: number}>} results
                 */
                function(results) {
                    var items = [];
                    for (var i = 0; i < results.length; ++i) {
                        items.push({
                            value: results[i].probe || results[i].gene,
                            label: results[i].probe || results[i].gene,
                            html: sprintf('<b>%s</b>, [%s]', results[i].gene, results[i].level),
                            range: epiviz.datatypes.GenomicRange.fromStartEnd(results[i].seqName, results[i].start, results[i].end),
                            level: results[i].level || null,
                            node: results[i].nodeId || null,
                            nodeStart: results[i].start || null,
                            nodeEnd: results[i].end || null
                        });
                    }

                    callback(items);
                }
            });
        },
        minLength: 1,
        select: function(event, ui) {
            var vals = self.customSettingsValues();
            vals.featureId = ui.item.node;
            vals.featureName = ui.item.value;
            var d = ui.item;
            self._hoveritem = new epiviz.ui.charts.tree.UiNode(
                d.node, d.label, [], 
                null, null,
                null, 0, null, 
                null, null, null, 
                null, null, null, null, null, 
                null, d.nodeStart, d.nodeEnd);

            // self.setCustomSettingsValues(vals);

                self._registerFeatureGetData.notify({
                    chartId: self.id(), 
                    feature: vals.featureId
                });
            // var currentLocation = self._locationManager.lastUnfilledLocationChangeRequest() || self._locationManager.currentLocation();
            // var seqName = ui.item.range.seqName();
            // var start = ui.item.range.start();
            // var width = ui.item.range.width();
            // self._updateSelectedLocation(new epiviz.datatypes.GenomicRange(seqName, start, width));
        },
        focus: function(event) {
            // event.preventDefault();
        },
        open: function() {},
        close: function() {}
    }).data('autocomplete')._renderItem = function(ul, item) {
        return $('<li></li>')
        .data( 'item.autocomplete', item )
        .append(sprintf('<a>%s</a>', item.html))
        .appendTo(ul);
    };
};

epiviz.plugins.charts.FeatureScatterPlot.prototype.displayType = function() { return 'featureScatterPlot'; };

/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {epiviz.datatypes.GenomicData} data
 * @returns {Array.<epiviz.ui.charts.ChartObject>} The objects drawn
 * @private
 */
epiviz.plugins.charts.FeatureScatterPlot.prototype._drawCircles = function(data, dimx, dimy, key) {
    var self = this;
    var Axis = epiviz.ui.charts.Axis;
    var circleRadius = Math.max(1, this.customSettingsValues()[epiviz.plugins.charts.FeatureScatterPlotType.CustomSettings.CIRCLE_RADIUS_RATIO] * Math.min(this.width(), this.height()));
    var gridSquareSize = Math.max(Math.floor(circleRadius), 1);

    var margins = this.margins();
    var width = this.width();
    var height = this.height();

    var CustomSetting = epiviz.ui.charts.CustomSetting;
    var minY = this.customSettingsValues()[epiviz.ui.charts.Visualization.CustomSettings.Y_MIN];
    var maxY = this.customSettingsValues()[epiviz.ui.charts.Visualization.CustomSettings.Y_MAX];
    var minX = this.customSettingsValues()[epiviz.ui.charts.Visualization.CustomSettings.X_MIN];
    var maxX = this.customSettingsValues()[epiviz.ui.charts.Visualization.CustomSettings.X_MAX];

    // if (minX == CustomSetting.DEFAULT) { minX = this._measurementsX[0].minValue(); }
    if (minY == CustomSetting.DEFAULT) { minY = this._measurementsY[0].minValue(); }
    // if (maxX == CustomSetting.DEFAULT) { maxX = this._measurementsX[0].maxValue(); }
    if (maxY == CustomSetting.DEFAULT) { maxY = this._measurementsY[0].maxValue(); }

    var allValues = []
    data.forEach(function(m) { allValues.push(m[dimx]);});

    var uniqueValues = [];

    allValues.forEach(function(m) {
        if(uniqueValues.indexOf(m) == -1) {
            uniqueValues.push(m);
        }
    });

    this.xTickValues = uniqueValues;
    data.forEach(function(n) {
        var index = uniqueValues.indexOf(n[dimx]);
        n._xVal = index+1;
    } );

    var count= 0;
    minY = 100000; 
    maxY = 0;
    var plotData = [];
    uniqueValues.forEach(function(m) {
        plotData[count] = [];
        plotData[count][0] = count;
        plotData[count][1] = [];
        count++;

    });

    data.forEach(function(d) {
        var ind = uniqueValues.indexOf(d[dimx]);
        if(Math.log2(d[dimy]+1) < minY) {
            minY = Math.log2(d[dimy]+1);
        }
        if(Math.log2(d[dimy]+1) > maxY) {
            maxY = Math.log2(d[dimy]+1);
        }
        plotData[ind][1].push(Math.log2(d[dimy]+1));
    });

    //maxY += 10;
    //minY -= 10;

    if (minX == CustomSetting.DEFAULT) {
        minX = 0;
    }
    if (maxX == CustomSetting.DEFAULT) {
        maxX = uniqueValues.length+1;
    }
    
    var xScale = d3.scale.linear()
        .domain([minX, maxX])
        .range([0, width - margins.sumAxis(Axis.X)]);
    var yScale = d3.scale.linear()
        .domain([minY, maxY])
        .range([height - margins.sumAxis(Axis.Y), 0]);

    this._clearAxes(this._chartContent);
    xLabelsPadded = [""];
    uniqueValues.forEach(function(n) {xLabelsPadded.push(n);});
    this._drawAxes(xScale, yScale, xLabelsPadded.length, 15, this._chartContent, width, height, margins, undefined, undefined,xLabelsPadded, undefined, undefined)

    var grid = {};
    var items = [];
    var maxGroupItems = 1;
    
    var seriesIndex = 0; // Assume only 1 pair of datax and datay
    for (var i = 0; i < data.length; ++i) {

        var cellX = data[i]["_xVal"];
        var cellY = data[i][dimy];
        if (!cellX || !cellY) {
            continue;
        }

        var classes = sprintf('item data-series-%s', seriesIndex);

        var x = xScale(cellX);
        var y = yScale(cellY);

        var gridX = Math.floor(x / gridSquareSize) * gridSquareSize;
        var gridY = Math.floor(y / gridSquareSize) * gridSquareSize;

        var uiObj = null;
        if (grid[gridY] && grid[gridY][gridX]) {
            uiObj = grid[gridY][gridX];
            uiObj.id += '_' + data[i][key];
            uiObj.values[0] = (uiObj.values[0] * uiObj.valueItems[0].length + cellX) / (uiObj.valueItems[0].length + 1);
            uiObj.values[1] = (uiObj.values[1] * uiObj.valueItems[1].length + cellY) / (uiObj.valueItems[1].length + 1);
            uiObj.valueItems[0].push(data[i]);
            uiObj.valueItems[1].push(data[i]);
            if (uiObj.valueItems[0].length > maxGroupItems) {
                maxGroupItems = uiObj.valueItems[0].length;
            }
            continue;
        }

        uiObj = new epiviz.ui.charts.ChartIndexObject(
            sprintf('scatter_%s_%s_%s_%s', cellX, cellY, seriesIndex, data[i][key]), [key],
            data[i][key], [cellX, cellY], [
                [data[i]],
                [data[i]]
            ], // valueItems one for each measurement
            ["_xVal", dimy], // measurements
            seriesIndex,
            classes);

        if (!grid[gridY]) { grid[gridY] = {}; }
        grid[gridY][gridX] = uiObj;

        items.push(uiObj);
    }

    var itemsGroup = this._chartContent.select('.items');

    if (itemsGroup.empty()) {
        itemsGroup = this._chartContent.append('g').attr('class', 'items');
        var selectedGroup = itemsGroup.append('g').attr('class', 'selected');
        itemsGroup.append('g').attr('class', 'hovered');
        selectedGroup.append('g').attr('class', 'hovered');
    }

    var selection = itemsGroup.selectAll('circle').data(items, function(d) {
        return d.id;
    });

    selection
        .enter()
        .insert('circle', ':first-child')
        .attr('id', function(d) {
            return sprintf('%s-item-%s', self.id(), d.seriesIndex);
        })
        .style('opacity', 0)
        .style('fill-opacity', 0)
        .attr('r', 0);
    selection
        .each(
            /**
             * @param {epiviz.ui.charts.ChartObject} d
             */
            function(d) {
                var circle = d3.select(this);

                var fill = self.colors().get(d.seriesIndex);

                circle
                    .attr('cx', margins.left() + (d.values[0] - minX) * (width - margins.sumAxis(Axis.X)) / (maxX - minX))
                    .attr('cy', height - margins.bottom() - ((d.values[1] - minY) * (height - margins.sumAxis(Axis.Y)) / (maxY - minY)))
                    .attr('class', d.cssClasses)
                    .style('fill', 'none')
                    .style('stroke', 'none');
            });


    selection
        .transition()
        .duration(1000)
        .style('fill-opacity', function(d) {
            return Math.max(0.6, d.valueItems[0].length / maxGroupItems);
        })
        .style('opacity', null)
        .attr('r', circleRadius);

    selection
        .exit()
        .transition()
        .duration(1000)
        .style('opacity', 0)
        .attr('r', 0)
        .remove();

    selection
        .on('click', function(d) {
            self._deselect.notify(new epiviz.ui.charts.VisEventArgs(self.id()));
            self._select.notify(new epiviz.ui.charts.VisEventArgs(self.id(), d));
            self._dispatch.click(self.id(), null);

            d3.event.stopPropagation();
        });

    // Draw legend if necessary
    if (this._globalIndexColorLabels) {
        var colorLabelsMap = {};
        for (j = firstGlobalIndex; j < lastGlobalIndex; ++j) {
            colorLabelsMap[this._globalIndexColorLabels[j]] = this._globalIndexColorLabels[j];
        }
        this._colorLabels = Object.keys(colorLabelsMap);

        this._svg.selectAll('.chart-title').remove();
        this._svg.selectAll('.chart-title-color ').remove();
        var titleEntries = this._svg
            .selectAll('.chart-title')
            .data(this._colorLabels);
        titleEntries
            .enter()
            .append('text')
            .attr('class', 'chart-title')
            .attr('font-weight', 'bold')
            .attr('y', self.margins().top() - 5);
        titleEntries
            .attr('fill', function(label, i) {
                return self.colors().getByKey(label);
            })
            .text(function(label) {
                return label;
            });
        var textLength = 0;
        var titleEntriesStartPosition = [];

        $('#' + this.id() + ' .chart-title')
            .each(function(i) {
                titleEntriesStartPosition.push(textLength);
                textLength += this.getBBox().width + 15;
            });

        titleEntries.attr('x', function(column, i) {
            return self.margins().left() + 10 + titleEntriesStartPosition[i];
        });

        var colorEntries = this._svg
            .selectAll('.chart-title-color')
            .data(this._colorLabels)
            .enter()
            .append('circle')
            .attr('class', 'chart-title-color')
            .attr('cx', function(column, i) {
                return self.margins().left() + 4 + titleEntriesStartPosition[i];
            })
            .attr('cy', self.margins().top() - 9)
            .attr('r', 4)
            .style('shape-rendering', 'auto')
            .style('stroke-width', '0')
            .attr('fill', function(label, i) {
                return self.colors().getByKey(label);
            })
            .style('stroke-width', 0)
    } else {
        var n = Math.min(this._measurementsX.length, this._measurementsY.length);
        var colors = new Array(n);

        for (j = 0; j < n; ++j) {
            colors[j] = sprintf('%s vs %s', this._measurementsX[j].name(), this._measurementsY[j].name());
        }

        this._colorLabels = colors;
    }
    
    var rectBox = itemsGroup;

    rectBox.selectAll('.iqr-range').remove();
    rectBox.selectAll('.whisker').remove();
    for(i = 0; i < plotData.length; i++){
        var findIQR = plotData[i][1];
        var lower_median_upper = [];
        lower_median_upper = quartiles(findIQR);
        
        var iqr_result = lower_median_upper[2] - lower_median_upper[0];
        var iqr_15 = iqr_result * 1.5;

        var whisker_lower_index = 0;
        var whisker_upper_index = findIQR.length-1;
        for(j = 0; j < findIQR.length; j++){
            if(findIQR[j] < lower_median_upper[0] - iqr_15) {
                whisker_lower_index = j;
            }
            else {
                break;
            }
        }
        for(k = findIQR.length-1; k > 0; k--){
            if(findIQR[k] > (lower_median_upper[2] + iqr_15)) {
                whisker_upper_index = k;
            }
            else {
                break;
            }
        }

        
    rectBox.append("rect")
    .attr('id', "0")
    .attr('class', 'iqr-range')
    .style('opacity', 1)
    .style('fill-opacity', 0.2)
    .attr('x', margins.left() + (0.6 + plotData[i][0] - minX) * (width - margins.sumAxis(Axis.X)) / (maxX - minX))
    .attr('y', height - margins.bottom() - ((lower_median_upper[2] - minY) * (height - margins.sumAxis(Axis.Y)) / (maxY - minY)))
    .attr('width', xScale(.8))
    .attr('height', Math.abs((yScale(lower_median_upper[2])-yScale(lower_median_upper[0]))))
    .attr('fill', '#1E90FF');

     rectBox.append("line")
    .style("stroke", "gray")
    .attr('class', 'whisker')
    .attr("x1", margins.left() + (1 + plotData[i][0] - minX) * (width - margins.sumAxis(Axis.X)) / (maxX - minX))
    .attr('y1', height - margins.bottom() - ((lower_median_upper[2] - minY) * (height - margins.sumAxis(Axis.Y)) / (maxY - minY)))
    .attr("x2", margins.left() + (1 + plotData[i][0] - minX) * (width - margins.sumAxis(Axis.X)) / (maxX - minX))
    .attr('y2', (height - margins.bottom() - ((findIQR[whisker_upper_index] - minY) * (height - margins.sumAxis(Axis.Y)) / (maxY - minY))));

    rectBox.append("line")
    .style("stroke", "gray")
    .attr('class', 'whisker')
    .attr("x1", margins.left() + (1 + plotData[i][0] - minX) * (width - margins.sumAxis(Axis.X)) / (maxX - minX))
    .attr('y1', height - margins.bottom() - ((lower_median_upper[0] - minY) * (height - margins.sumAxis(Axis.Y)) / (maxY - minY)))
    .attr("x2", margins.left() + (1 + plotData[i][0] - minX) * (width - margins.sumAxis(Axis.X)) / (maxX - minX))
    .attr('y2', (height - margins.bottom() - ((findIQR[whisker_lower_index] - minY) * (height - margins.sumAxis(Axis.Y)) / (maxY - minY))));

     rectBox.append("line")
    .style("stroke", "gray")
    .attr('class', 'whisker')
    .attr("x1", margins.left() + (0.6 + plotData[i][0] - minX) * (width - margins.sumAxis(Axis.X)) / (maxX - minX))
    .attr('y1', height - margins.bottom() - ((findIQR[whisker_upper_index] - minY) * (height - margins.sumAxis(Axis.Y)) / (maxY - minY)))
    .attr("x2", margins.left() + (1.4 + plotData[i][0] - minX) * (width - margins.sumAxis(Axis.X)) / (maxX - minX))
    .attr('y2', (height - margins.bottom() - ((findIQR[whisker_upper_index] - minY) * (height - margins.sumAxis(Axis.Y)) / (maxY - minY))));

    rectBox.append("line")
    .style("stroke", "gray")
    .attr('class', 'whisker')
    .attr("x1", margins.left() + (0.6 + plotData[i][0] - minX) * (width - margins.sumAxis(Axis.X)) / (maxX - minX))
    .attr('y1', height - margins.bottom() - ((findIQR[whisker_lower_index] - minY) * (height - margins.sumAxis(Axis.Y)) / (maxY - minY)))
    .attr("x2", margins.left() + (1.4 + plotData[i][0] - minX) * (width - margins.sumAxis(Axis.X)) / (maxX - minX))
    .attr('y2', (height - margins.bottom() - ((findIQR[whisker_lower_index] - minY) * (height - margins.sumAxis(Axis.Y)) / (maxY - minY))));

    // Add median line
    rectBox.append("line")
    .style("stroke", "gray")
    .attr('class', 'whisker')
    .attr("x1", margins.left() + (0.6 + plotData[i][0] - minX) * (width - margins.sumAxis(Axis.X)) / (maxX - minX))
    .attr('y1', height - margins.bottom() - ((lower_median_upper[1] - minY) * (height - margins.sumAxis(Axis.Y)) / (maxY - minY)))
    .attr("x2", margins.left() + (1.4 + plotData[i][0] - minX) * (width - margins.sumAxis(Axis.X)) / (maxX - minX))
    .attr('y2', (height - margins.bottom() - ((lower_median_upper[1] - minY) * (height - margins.sumAxis(Axis.Y)) / (maxY - minY))));

    var selectionOutliers = itemsGroup.selectAll('circle').data(items, function(d) {
        return d.id;
    });

    selectionOutliers
        .each(
            /**
             * @param {epiviz.ui.charts.ChartObject} d
             */
            function(d) {
                var circle = d3.select(this);

                var fill = self.colors().get(d.seriesIndex);
                if (d.values[1] < findIQR[whisker_lower_index] || d.values[1] > findIQR[whisker_upper_index]){
                circle
                    .attr('cx', margins.left() + (d.values[0] - minX) * (width - margins.sumAxis(Axis.X)) / (maxX - minX))
                    .attr('cy', height - margins.bottom() - ((d.values[1] - minY) * (height - margins.sumAxis(Axis.Y)) / (maxY - minY)))
                    .attr('class', d.cssClasses)
                    .style('fill', fill);
                }
            });

    }



    function quartiles(d) {
        d.sort(d3.ascending);
        var q1 = d3.quantile(d, .25);
        var q2 = d3.quantile(d, .5);
        var q3 = d3.quantile(d, .75);
        return [q1, q2, q3];
    };

    return items;
};



/**
 * @returns {Array.<{name: string, color: string}>}
 */
epiviz.plugins.charts.FeatureScatterPlot.prototype.colorLabels = function() {
    return this._colorLabels;
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
epiviz.plugins.charts.FeatureScatterPlot.prototype._drawAxesOld = function(xScale, yScale, xTicks, yTicks, svg, width, height, margins) {
    epiviz.ui.charts.Visualization.prototype._drawAxes(xScale, yScale, xTicks, yTicks,
    svg, width, height, margins, undefined, undefined,
    this.xTickValues, undefined, undefined);
    //epiviz.ui.charts.Plot.prototype._drawAxes.call(this, xScale, yScale, xTicks, yTicks, svg, width, height, margins);

    this._legend.selectAll('text').remove();

    var xMeasurements = this._measurementsX;
    var self = this;
    this._legend.selectAll('.x-measurement').remove();
    this._legend.selectAll('.x-measurement-color').remove();

    var xEntries = this._legend
        .selectAll('.x-measurement')
        .data(xMeasurements)
        .enter()
        .append('text')
        .attr('class', 'x-measurement')
        .attr('font-weight', 'bold')
        .attr('fill', function(m, i) {
            return self._globalIndexColorLabels ?
                "#000000" : self.colors().get(i);
        })
        .attr('y', (this.height() - this.margins().bottom() + 35))
        .text(function(m, i) {
            return m.name();
        });

    var xTextLength = 0;
    var xTitleEntriesStartPosition = [];

    $('#' + this.id() + ' .x-measurement')
        .each(function(i) {
            xTitleEntriesStartPosition.push(xTextLength);
            xTextLength += this.getBBox().width + 15;
        });

    xEntries.attr('x', function(column, i) {
        return (self.width() - xTextLength) * 0.5 + 7 + xTitleEntriesStartPosition[i];
    });

    var xColorEntries = this._legend
        .selectAll('.x-measurement-color')
        .data(xMeasurements)
        .enter()
        .append('circle')
        .attr('class', 'x-measurement-color')
        .attr('cx', function(column, i) {
            return (self.width() - xTextLength) * 0.5 + 1 + xTitleEntriesStartPosition[i];
        })
        .attr('cy', (this.height() - this.margins().bottom() + 31))
        .attr('r', 4)
        .style('shape-rendering', 'auto')
        .style('stroke-width', '0')
        .style('fill', function(m, i) {
            return self._globalIndexColorLabels ?
                "#ffffff" : self.colors().get(i);
        });


    var yMeasurements = ['count'];
    this._legend.selectAll('.y-measurement').remove();
    this._legend.selectAll('.y-measurement-color').remove();

    var yEntries = this._legend
        .selectAll('.y-measurement')
        .data(yMeasurements)
        .enter()
        .append('text')
        .attr('class', 'y-measurement')
        .attr('font-weight', 'bold')
        .attr('fill', function(m, i) {
            return self._globalIndexColorLabels ?
                "#000000" : self.colors().get(i);
        })
        .attr('y', (this.margins().left() - 35))
        .attr('transform', 'rotate(-90)')
        .text(function(m, i) {
            return m;
        });

    var yTextLength = 0;
    var yTitleEntriesStartPosition = [];

    $('#' + this.id() + ' .y-measurement')
        .each(function(i) {
            yTitleEntriesStartPosition.push(yTextLength);
            yTextLength += this.getBBox().width + 15;
        });

    yEntries.attr('x', function(column, i) {
        return -self.height() + (self.height() - yTextLength) * 0.5 + 12 + self.margins().top() + yTitleEntriesStartPosition[i];
    });

    var yColorEntries = this._legend
        .selectAll('.y-measurement-color')
        .data(yMeasurements)
        .enter()
        .append('circle')
        .attr('class', 'y-measurement-color')
        .attr('cx', function(column, i) {
            return -self.height() + (self.height() - yTextLength) * 0.5 + 6 + self.margins().top() + yTitleEntriesStartPosition[i];
        })
        .attr('cy', (this.margins().left() - 39))
        .attr('transform', 'rotate(-90)')
        .attr('r', 4)
        .style('shape-rendering', 'auto')
        .style('stroke-width', '0')
        .style('fill', function(m, i) {
            return self._globalIndexColorLabels ?
                "#ffffff" : self.colors().get(i);
        });
};

epiviz.plugins.charts.FeatureScatterPlot.prototype.transformData = function(range, data) {
  var lastRange = this._lastRange;

  if (range != undefined) {
    this._lastRange = range;
  }
  if (data != undefined) {
    this._lastData = data;
    this._unalteredData = data;
  }

  var deferred = new epiviz.deferred.Deferred();
  deferred.resolve();
  return deferred;
};

/**
 * @param {Object.<string, *>} settingsValues
 */
epiviz.plugins.charts.FeatureScatterPlot.prototype.setCustomSettingsValues = function(settingsValues) {
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
    self._registerFeatureGetData.notify({
        chartId: self.id(), 
        feature: settingsValues.featureId
    })
  } else {
    this.draw();
  }

  this._customSettingsChanged.notify(new epiviz.ui.charts.VisEventArgs(this._id, settingsValues));
};