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

    var sBox = $('#search-box-' + self.id());
    sBox.val(self.customSettingsValues()['featureName']);
    return self.drawScatter(self._lastRange, self._lastData.data, "sample_id", self._xLabel, "count");
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

    $('#' + self.id()).prepend('<div style="position:absolute;"><input id="search-box-' + self.id() + '" class="feature-search-box ui-widget-content ui-corner-all" type="text"/></div>');

    var sBox = $('#search-box-' + self.id());
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

epiviz.plugins.charts.FeatureScatterPlot.prototype.displayTypeName = function() { return 'featureScatterPlot'; };

/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {epiviz.datatypes.GenomicData} data
 * @returns {Array.<epiviz.ui.charts.ChartObject>} The objects drawn
 * @private
 */
epiviz.plugins.charts.FeatureScatterPlot.prototype._drawCircles = function(originalData, dimx, dimy, key) {
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
    var showPoints = this.customSettingsValues()[epiviz.plugins.charts.FeatureScatterPlotType.CustomSettings.SHOW_POINTS];
    var logTransform = this.customSettingsValues()[epiviz.plugins.charts.FeatureScatterPlotType.CustomSettings.LOG_TRANSFORM];

    var data = JSON.parse(JSON.stringify(originalData));

    var allValues = [];
    var uniqueValues = [];
    var count= 0;
    minYdata = 100000; 
    maxYdata = 0;
    var plotData = [];
    data.forEach(function(m){
        if(logTransform) {
            m[dimy] = Math.log2(m[dimy] + 1);
        }
        allValues.push(m[dimx]);

        if(uniqueValues.indexOf(m[dimx]) == -1) {
            uniqueValues.push(m[dimx]);
            plotData[count] = [];
            plotData[count][0] = count;
            plotData[count][1] = [];
            count++;
        }

        var index = uniqueValues.indexOf(m[dimx]);
        m._xVal = index+1;
        if(m[dimy] < minYdata) {
            minYdata = m[dimy];
        }
        if(m[dimy] > maxYdata) {
            maxYdata = m[dimy];
        }
        plotData[index][1].push(m[dimy]);

    });
    // console.log(plotData);
    // if (minX == CustomSetting.DEFAULT) { minX = this._measurementsX[0].minValue(); }
    if (minY == CustomSetting.DEFAULT) { minY = minYdata - 1;}
    // if (maxX == CustomSetting.DEFAULT) { maxX = this._measurementsX[0].maxValue(); }
    if (maxY == CustomSetting.DEFAULT) { maxY = maxYdata + 1;}

    this.xTickValues = uniqueValues;
    
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
    // console.log(data);
    var seriesIndex = 0; // Assume only 1 pair of datax and datay
    for (var i = 0; i < data.length; ++i) {

        var cellX = data[i]["_xVal"];
        var cellY = data[i][dimy];
        
        //if (!cellX || !cellY) {
        //    continue;
        //}

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
    // console.log(items);
    var itemsGroup = this._chartContent.select('.items');

    if (itemsGroup.empty()) {
        itemsGroup = this._chartContent.append('g').attr('class', 'items');
        var selectedGroup = itemsGroup.append('g').attr('class', 'selected');
        itemsGroup.append('g').attr('class', 'hovered');
        selectedGroup.append('g').attr('class', 'hovered');
    }

    itemsGroup.selectAll('circle').remove();
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

    //if(showPoints) {
        selection.each(
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
                    .style('fill', fill);
            }
        );
    //}        

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
        var valuesToPlot = plotData[i][1];
        valuesToPlot.sort(d3.ascending);
        var firstQuartile = d3.quantile(valuesToPlot, .25);
        var secondQuartile = d3.quantile(valuesToPlot, .5);
        var thirdQuartile = d3.quantile(valuesToPlot, .75);
        
        var iqr = thirdQuartile - firstQuartile;
        var iqr150Percent = iqr * 1.5;

        var whiskerLowerIndex = 0;
        var whiskerUpperIndex = valuesToPlot.length-1;
        var bottomWhiskerBound = firstQuartile - iqr150Percent;
        var upperWhiskerBound = thirdQuartile + iqr150Percent;


        for(var j = 0; j < valuesToPlot.length; j++){
            whiskerLowerIndex = j;
            if(valuesToPlot[j] >= bottomWhiskerBound) {
                break;
            }
        }
        for(var k = valuesToPlot.length-1; k > 0; k--){
            whiskerUpperIndex = k;
            if(valuesToPlot[k] <= upperWhiskerBound) {
                break;
            }
        }
    
    rectBox.append("rect")
    .attr('id', "0")
    .attr('class', 'iqr-range')
    .style('opacity', 1)
    .style('fill-opacity', 0.2)
    .attr('x', margins.left() + (0.6 + plotData[i][0] - minX) * (width - margins.sumAxis(Axis.X)) / (maxX - minX))
    .attr('y', height - margins.bottom() - ((thirdQuartile - minY) * (height - margins.sumAxis(Axis.Y)) / (maxY - minY)))
    .attr('width', xScale(.8))
    .attr('height', Math.abs((yScale(thirdQuartile)-yScale(firstQuartile))))
    .attr('fill', '#1E90FF');

     rectBox.append("line")
    .style("stroke", "grey")
    .style("stroke-width", "2")
    .attr('class', 'whisker')
    .attr("x1", margins.left() + (1 + plotData[i][0] - minX) * (width - margins.sumAxis(Axis.X)) / (maxX - minX))
    .attr('y1', height - margins.bottom() - ((thirdQuartile - minY) * (height - margins.sumAxis(Axis.Y)) / (maxY - minY)))
    .attr("x2", margins.left() + (1 + plotData[i][0] - minX) * (width - margins.sumAxis(Axis.X)) / (maxX - minX))
    .attr('y2', (height - margins.bottom() - ((valuesToPlot[whiskerUpperIndex] - minY) * (height - margins.sumAxis(Axis.Y)) / (maxY - minY))));

    rectBox.append("line")
    .style("stroke", "grey")
    .style("stroke-width", "2")
    .attr('class', 'whisker')
    .attr("x1", margins.left() + (1 + plotData[i][0] - minX) * (width - margins.sumAxis(Axis.X)) / (maxX - minX))
    .attr('y1', height - margins.bottom() - ((firstQuartile - minY) * (height - margins.sumAxis(Axis.Y)) / (maxY - minY)))
    .attr("x2", margins.left() + (1 + plotData[i][0] - minX) * (width - margins.sumAxis(Axis.X)) / (maxX - minX))
    .attr('y2', (height - margins.bottom() - ((valuesToPlot[whiskerLowerIndex] - minY) * (height - margins.sumAxis(Axis.Y)) / (maxY - minY))));

     rectBox.append("line")
    .style("stroke", "grey")
    .style("stroke-width", "2")
    .attr('class', 'whisker')
    .attr("x1", margins.left() + (0.6 + plotData[i][0] - minX) * (width - margins.sumAxis(Axis.X)) / (maxX - minX))
    .attr('y1', height - margins.bottom() - ((valuesToPlot[whiskerUpperIndex] - minY) * (height - margins.sumAxis(Axis.Y)) / (maxY - minY)))
    .attr("x2", margins.left() + (1.4 + plotData[i][0] - minX) * (width - margins.sumAxis(Axis.X)) / (maxX - minX))
    .attr('y2', (height - margins.bottom() - ((valuesToPlot[whiskerUpperIndex] - minY) * (height - margins.sumAxis(Axis.Y)) / (maxY - minY))));

    rectBox.append("line")
    .style("stroke", "grey")
    .style("stroke-width", "2")
    .attr('class', 'whisker')
    .attr("x1", margins.left() + (0.6 + plotData[i][0] - minX) * (width - margins.sumAxis(Axis.X)) / (maxX - minX))
    .attr('y1', height - margins.bottom() - ((valuesToPlot[whiskerLowerIndex] - minY) * (height - margins.sumAxis(Axis.Y)) / (maxY - minY)))
    .attr("x2", margins.left() + (1.4 + plotData[i][0] - minX) * (width - margins.sumAxis(Axis.X)) / (maxX - minX))
    .attr('y2', (height - margins.bottom() - ((valuesToPlot[whiskerLowerIndex] - minY) * (height - margins.sumAxis(Axis.Y)) / (maxY - minY))));

    // Add median line
    rectBox.append("line")
    .style("stroke", "grey")
    .style("stroke-width", "2")
    .attr('class', 'whisker')
    .attr("x1", margins.left() + (0.6 + plotData[i][0] - minX) * (width - margins.sumAxis(Axis.X)) / (maxX - minX))
    .attr('y1', height - margins.bottom() - ((secondQuartile - minY) * (height - margins.sumAxis(Axis.Y)) / (maxY - minY)))
    .attr("x2", margins.left() + (1.4 + plotData[i][0] - minX) * (width - margins.sumAxis(Axis.X)) / (maxX - minX))
    .attr('y2', (height - margins.bottom() - ((secondQuartile - minY) * (height - margins.sumAxis(Axis.Y)) / (maxY - minY))));

    // if(showPoints){
        //  var selectionOutliers = itemsGroup.selectAll('circle').data(items, function(d) {
        //     return d.id;
        //  });

        // selectionOutliers
        // .each(
        //     /**
        //      * @param {epiviz.ui.charts.ChartObject} d
        //      */
        //     function(d) {
        //         var circle = d3.select(this);

        //         var fill = self.colors().get(d.seriesIndex);
        //         if (d.values[1] < (valuesToPlot[whiskerLowerIndex] - minY) || d.values[1] > (valuesToPlot[whiskerUpperIndex] - minY)){
        //             circle
        //                 .attr('cx', margins.left() + (d.values[0] - minX) * (width - margins.sumAxis(Axis.X)) / (maxX - minX))
        //                 .attr('cy', height - margins.bottom() - ((d.values[1] - minY) * (height - margins.sumAxis(Axis.Y)) / (maxY - minY)))
        //                 .attr('class', d.cssClasses)
        //                 .style('fill', fill);
        //         }
        //     });
        // }
        // var selectionOutliers = itemsGroup.selectAll('circle').data(items, function(d) {
        //     return d.id;
        //  });

        // selectionOutliers
        // .each(
        //     /**
        //      * @param {epiviz.ui.charts.ChartObject} d
        //      */
        //     function(d) {
        //         var circle = d3.select(this);

        //         var fill = self.colors().get(d.seriesIndex);
        //         if (d.values[1] > (valuesToPlot[whiskerLowerIndex] - minY) && d.values[1] < (valuesToPlot[whiskerUpperIndex] - minY)){
        //             circle
        //                 .attr('cx', margins.left() + (d.values[0] - minX) * (width - margins.sumAxis(Axis.X)) / (maxX - minX))
        //                 .attr('cy', height - margins.bottom() - ((d.values[1] - minY) * (height - margins.sumAxis(Axis.Y)) / (maxY - minY)))
        //                 .attr('class', d.cssClasses)
        //                 .style('fill', "none")
        //                 .style('opacity', 0);
        //         }
        //     });
    }

    return items;
};

/**
 * @returns {Array.<{name: string, color: string}>}
 */
epiviz.plugins.charts.FeatureScatterPlot.prototype.colorLabels = function() {
    return this._colorLabels;
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
