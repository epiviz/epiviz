/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/29/13
 * Time: 12:49 PM
 */

goog.provide('epiviz.data.Cache');

/**
 * @param {epiviz.Config} config
 * @param {epiviz.data.DataProviderFactory} dataProviderFactory
 * @constructor
 */
epiviz.data.Cache = function(config, dataProviderFactory) {

  /**
   * @type {epiviz.Config}
   * @private
   */
  this._config = config;

  /**
   * @type {epiviz.data.DataProviderFactory}
   * @private
   */
  this._dataProviderFactory = dataProviderFactory;

  /**
   * @type {Object.<string, epiviz.datatypes.PartialSummarizedExperiment>}
   * @private
   */
  this._data = {};

  /**
   * @type {epiviz.measurements.MeasurementHashtable.<epiviz.data.RequestStack>}
   * @private
   */
  this._measurementRequestStackMap = new epiviz.measurements.MeasurementHashtable();

  /**
   * measurement -> (requestId -> range)
   * @type {epiviz.measurements.MeasurementHashtable.<Object.<number, epiviz.datatypes.GenomicRange>>}
   * @private
   */
  this._measurementPendingRequestsMap = new epiviz.measurements.MeasurementHashtable();

  /**
   * @type {epiviz.datatypes.GenomicRange}
   * @private
   */
  this._lastRequest = null;

  if (this._config.cacheUpdateIntervalMilliseconds > 0) {
    var self = this;
    this._intervalId = window.setTimeout(function() {
      self._clearUnneededData();
    }, config.cacheUpdateIntervalMilliseconds);
  }
};

/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {Object.<string, epiviz.measurements.MeasurementSet>} chartMeasurementsMap
 * @param {function(string, epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>)} dataReadyCallback
 */
epiviz.data.Cache.prototype.getData = function(range, chartMeasurementsMap, dataReadyCallback) {
  var MeasurementType = epiviz.measurements.Measurement.Type;
  var self = this;

  this._lastRequest = epiviz.datatypes.GenomicRange.fromStartEnd(
    range.seqName(),
    range.start() - range.width(),
    range.end() + range.width());

  if (this._config.cacheUpdateIntervalMilliseconds > 0) {
    window.clearInterval(this._intervalId);
    this._intervalId = window.setTimeout(function() {
      self._clearUnneededData();
    }, this._config.cacheUpdateIntervalMilliseconds);
  }

  var computedMs = this._extractComputedMeasurements(chartMeasurementsMap);

  this._updateComputedMeasurementsData(computedMs);
  this._serveAvailableData(range, chartMeasurementsMap, dataReadyCallback);

  var requestRanges = [
    range,
    epiviz.datatypes.GenomicRange.fromStartEnd(range.seqName(), Math.max(range.start() - range.width(), 0), range.start()),
    new epiviz.datatypes.GenomicRange(range.seqName(), range.end(), range.width())
  ];

  /**
   * A map of measurements as keys and for each of them, an array of ranges needed
   * @type {epiviz.measurements.MeasurementHashtable.<Array.<epiviz.datatypes.GenomicRange>>}
   */
  var msNeededRanges = this._calcMeasurementNeededRanges(requestRanges, chartMeasurementsMap);

  msNeededRanges.foreach(function(m, ranges) {
    var requestStack = self._measurementRequestStackMap.get(m);
    if (!requestStack) {
      requestStack = new epiviz.data.RequestStack();
      self._measurementRequestStackMap.put(m, requestStack);
    }
    var request;

    if (ranges.length == 0) {
      request = epiviz.data.Request.emptyRequest();
      requestStack.pushRequest(request, function() {
        self._handleResponse(dataReadyCallback, range, chartMeasurementsMap, request, null, m, null);
      });

      // When the pending requests for this measurements come back, this will also pop out
      requestStack.serveData(new epiviz.data.Response(request.id(), {}));
      return; // continue iteration
    }

    for (var i = 0; i < ranges.length; ++i) {
      request = m.type() == MeasurementType.RANGE ?
        epiviz.data.Request.getRows(m, ranges[i]) :
        epiviz.data.Request.getValues(m, ranges[i]);
      (function(r, request) {
        requestStack.pushRequest(request,
          /** @param {{globalStartIndex: number, values: *, useOffset: ?boolean}} data */
          function(data) {
            self._handleResponse(dataReadyCallback, range, chartMeasurementsMap, request, r, m, data);
          });
      })(ranges[i], request);

      var pendingRequests = self._measurementPendingRequestsMap.get(m);
      if (!pendingRequests) {
        pendingRequests = {};
        self._measurementPendingRequestsMap.put(m, pendingRequests);
      }
      pendingRequests[request.id()] = ranges[i];

      var dataProvider = self._dataProviderFactory.get(m.dataprovider()) || self._dataProviderFactory.get(epiviz.data.EmptyResponseDataProvider.DEFAULT_ID);
      dataProvider.getData(request, function(response) {
        requestStack.serveData(response);
      });
    }
  });
};

/**
 * @param {function(string, epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>)} chartDataReadyCallback
 * @param {epiviz.datatypes.GenomicRange} chartRequestedRange
 * @param {Object.<string, epiviz.measurements.MeasurementSet>} chartMeasurementsMap
 * @param {epiviz.data.Request} request
 * @param {?epiviz.datatypes.GenomicRange} range A range corresponding to the current request; this can be different from the chartRequestedRange, and can also
 *   be null in case no real request to the data provider was necessary to retrieve data for this chart
 * @param {epiviz.measurements.Measurement} measurement
 * @param {?{globalStartIndex: number, values: *, useOffset: ?boolean}} rawData
 * @private
 */
epiviz.data.Cache.prototype._handleResponse = function(chartDataReadyCallback, chartRequestedRange, chartMeasurementsMap, request, range, measurement, rawData) {

  if (range) {
    var genomicArray = measurement.type() == epiviz.measurements.Measurement.Type.RANGE ?
      new epiviz.datatypes.GenomicRangeArray(measurement, range, rawData.globalStartIndex, rawData.values, rawData.useOffset) :
      new epiviz.datatypes.FeatureValueArray(measurement, range, rawData.globalStartIndex, rawData.values);
    this._mergeData(measurement, genomicArray);
  }

  var computedMs = this._extractComputedMeasurements(chartMeasurementsMap);
  this._updateComputedMeasurementsData(computedMs);

  delete this._measurementPendingRequestsMap.get(measurement)[request.id()];

  this._serveAvailableData(chartRequestedRange, chartMeasurementsMap, chartDataReadyCallback);
};

/**
 * Look through charts; if there is one for which we have the whole needed data, serve it by calling
 * dataReadyCallback(chartId, data). Then, remove that particular chart from the map.
 *
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {Object.<string, epiviz.measurements.MeasurementSet>} chartMeasurementsMap
 * @param {function(string, epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>)} dataReadyCallback
 * @private
 */
epiviz.data.Cache.prototype._serveAvailableData = function(range, chartMeasurementsMap, dataReadyCallback) {
  var MeasurementType = epiviz.measurements.Measurement.Type;
  var self = this;

  var servedChartIds = [];

  for (var chartId in chartMeasurementsMap) {
    if (!chartMeasurementsMap.hasOwnProperty(chartId)) { continue; }

    var chartMeasurements = chartMeasurementsMap[chartId];
    var allDataAvailable = true;
    /** @type {epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>} */
    var chartData = new epiviz.measurements.MeasurementHashtable();
    (function(chartData) {
      chartMeasurements.foreach(function(m) {
        var storedData = self._data[m.datasourceGroup()];
        if (!storedData || !storedData.rowData() || (m.type() == MeasurementType.FEATURE && !storedData.values(m))) {
          allDataAvailable = false;
          return true; // Break!
        }
        var rowData = storedData.rowData();
        var valueData = (m.type() == MeasurementType.FEATURE) ? storedData.values(m) : null;
        var neededRanges = range.subtract(rowData.boundaries());
        if (neededRanges.length) {
          allDataAvailable = false;
          return true; // Break;
        }

        if (valueData) {
          neededRanges = range.subtract(valueData.boundaries());
          if (neededRanges.length) {
            allDataAvailable = false;
            return true; // Break!
          }
        }

        chartData.put(m, new epiviz.datatypes.GenomicDataMeasurementWrapper(m, self._data[m.datasourceGroup()]));

        return false;
      });
    }(chartData));

    if (allDataAvailable) {
      dataReadyCallback(chartId, chartData);
      servedChartIds.push(chartId);
    }
  }

  for (var i = 0; i < servedChartIds.length; ++i) {
    delete chartMeasurementsMap[servedChartIds[i]];
  }
};

/**
 * @param {Array.<epiviz.datatypes.GenomicRange>} ranges
 * @param {Object.<string, epiviz.measurements.MeasurementSet>} chartMeasurementsMap
 * @return {epiviz.measurements.MeasurementHashtable.<Array.<epiviz.datatypes.GenomicRange>>}
 * @private
 */
epiviz.data.Cache.prototype._calcMeasurementNeededRanges = function(ranges, chartMeasurementsMap) {
  var MeasurementType = epiviz.measurements.Measurement.Type;
  var self = this;

  /** @type {epiviz.measurements.MeasurementHashtable.<Array.<epiviz.datatypes.GenomicRange>>} */
  var result = new epiviz.measurements.MeasurementHashtable();

  for (var chartId in chartMeasurementsMap) {
    if (!chartMeasurementsMap.hasOwnProperty(chartId)) { continue; }

    var chartMeasurements = new epiviz.measurements.MeasurementSet();

    (function(chartMeasurements) {
      chartMeasurementsMap[chartId].foreach(function(m) {
        var compMs = m.componentMeasurements();
        compMs.foreach(function(compM) {
          chartMeasurements.add(compM);
          chartMeasurements.add(compM.datasource());
        });

        if (!m.isComputed()) {
          chartMeasurements.add(m.datasource());
        }
      });
    })(chartMeasurements);

    chartMeasurements.foreach(function(m) {
      var neededRanges = null;

      /** @type {?epiviz.datatypes.PartialSummarizedExperiment} */
      var storedData = self._data[m.datasourceGroup()];
      if (!storedData || (m.type() == MeasurementType.FEATURE && !storedData.values(m))) {
        neededRanges = ranges.slice(0); // copy array
      } else {
        /** @type {epiviz.datatypes.GenomicArray} */
        var data = (m.type() == MeasurementType.FEATURE) ? storedData.values(m) : storedData.rowData();
        if (!data) {
          neededRanges = ranges.slice(0); // copy array
        } else {
          neededRanges = [];
          var boundaries = data.boundaries();
          for (var i = 0; i < ranges.length; ++i) {
            neededRanges = neededRanges.concat(ranges[i].subtract(boundaries));
          }
        }
      }

      // Also check pending requests

      /** @type {?Object.<number, epiviz.datatypes.GenomicRange>} */
      var pendingRequests = self._measurementPendingRequestsMap.get(m);

      if (pendingRequests) {
        for (var j = 0; j < neededRanges.length; ++j) {
          for (var requestId in pendingRequests) {
            if (!pendingRequests.hasOwnProperty(requestId)) { continue; }

            /** @type {Array.<epiviz.datatypes.GenomicRange>} */
            var dif = neededRanges[j].subtract(pendingRequests[requestId]);

            // Now replace neededRanges[j] with dif
            Array.prototype.splice.apply(neededRanges, [j, 1].concat(dif));
            if (j >= neededRanges.length) { break; }
          }
        }
      }

      // It is very important that, even if there are no needed ranges, we still put the empty
      // array in the hashtable, because there will still be a pseudo-request corresponding to it
      result.put(m, neededRanges);
    });
  }

  return result;
};

/**
 * @param {Object.<string, epiviz.measurements.MeasurementSet>} chartMeasurementsMap
 * @returns {epiviz.measurements.MeasurementSet}
 * @private
 */
epiviz.data.Cache.prototype._extractComputedMeasurements = function(chartMeasurementsMap) {
  var result = new epiviz.measurements.MeasurementSet();
  for (var chartId in chartMeasurementsMap) {
    if (!chartMeasurementsMap.hasOwnProperty(chartId)) { continue; }
    chartMeasurementsMap[chartId].foreach(function(m) {
      if (m.isComputed()) { result.add(m); }
    });
  }

  return result;
};

/**
 * @param {epiviz.measurements.Measurement} measurement
 * @param {epiviz.datatypes.GenomicArray} data
 * @private
 */
epiviz.data.Cache.prototype._mergeData = function(measurement, data) {
  var MeasurementType = epiviz.measurements.Measurement.Type;
  var storedData = this._data[measurement.datasourceGroup()];
  if (!storedData) {
    storedData = new epiviz.datatypes.PartialSummarizedExperiment();
    this._data[measurement.datasourceGroup()] = storedData;
  }

  if (measurement.type() == MeasurementType.RANGE) {
    storedData.addRowData(/** @type {epiviz.datatypes.GenomicRangeArray} */ data);
    return;
  }

  // FEATURE
  storedData.addValues(/** @type {epiviz.datatypes.FeatureValueArray} */ data);
};

/**
 * @private
 */
epiviz.data.Cache.prototype._clearUnneededData = function() {
  if (!this._lastRequest) { return; }
  console.log(sprintf('Clearing data outside of range [%7s%10s%10s]', this._lastRequest.seqName(), this._lastRequest.start(), this._lastRequest.end()));

  var self = this;
  var newData = {};
  for (var datasourceGroup in this._data) {
    if (!this._data.hasOwnProperty(datasourceGroup)) { continue; }
    var exp = this._data[datasourceGroup];
    newData[datasourceGroup] = exp.trim(self._lastRequest);
  }

  this._data = newData;
};

/**
 * @param {epiviz.measurements.MeasurementSet} computedMs
 * @private
 */
epiviz.data.Cache.prototype._updateComputedMeasurementsData = function(computedMs) {
  var self = this;
  var GenomicRange = epiviz.datatypes.GenomicRange;
  computedMs.foreach(function(cm) {
    // First, see if there is new data for all of the component measurements of m

    /** @type {?epiviz.datatypes.PartialSummarizedExperiment} */
    var storedData = self._data[cm.datasourceGroup()];
    if (!storedData) { return false; } // Continue

    /** @type {epiviz.measurements.MeasurementSet} */
    var componentMeasurements = cm.componentMeasurements();

    /** @type {?number} */
    var globalStartIndex = null;

    /** @type {?number} */
    var size = null;

    /** @type {?epiviz.datatypes.GenomicRange} */
    var  boundaries = null;

    componentMeasurements.foreach(function(m) {
      /** @type {epiviz.datatypes.FeatureValueArray} */
      var values = storedData.values(m);

      if (!values || !values.boundaries()) {
        globalStartIndex = null;
        size = null;
        boundaries = null;
        return true; // break: there is not enough data to compute the measurement
      }

      if (boundaries === null) {
        globalStartIndex = values.globalStartIndex();
        size = values.size();
        boundaries = values.boundaries();

        // if globalStartIndex === null then break:
        //   this means either that there is not enough data loaded to
        //   compute the measurement (if boundaries is also null),
        //   or the current range simply doesn't contain any data.
        // otherwise, continue iteration
        return (globalStartIndex === null);
      }

      if (values.boundaries().seqName() != boundaries.seqName()) {
        // The stored data for the component measurements belongs to different chromosomes,
        // so the computed measurement cannot be computed yet.
        size = 0;
        return true;
      }

      if (globalStartIndex < values.globalStartIndex()) {
        size -= values.globalStartIndex() - globalStartIndex;
        if (size < 0) {
          // This means that the global start index for one of the component measurements begins
          // after the end of another, which means that the computed measurement cannot be computed yet.
          size = 0;
          return true;
        }
        globalStartIndex = values.globalStartIndex();
        var start = values.boundaries().start(), end = boundaries.end();

        if (size > values.size()) {
          size = values.size();
          end = values.boundaries().end();
        }
        boundaries = GenomicRange.fromStartEnd(boundaries.seqName(), start, end);
      } else {
        var newSize = values.size() - globalStartIndex + values.globalStartIndex();
        if (size > newSize) {
          size = newSize;
          if (size <= 0) {
            size = 0;
            return true;
          }
          boundaries = GenomicRange.fromStartEnd(
            boundaries.seqName(), boundaries.start(), values.boundaries().end());
        }
      }

      if (size == 0) { return true; } // break: there is not enough data to compute the measurement

      return false;
    });

    if (boundaries === null) { return false; } // continue

    // Check if the existing stored values already contain the new values
    var existingValues = storedData.values(cm);
    if (existingValues &&
      (globalStartIndex === null ||
      (existingValues.globalStartIndex() < globalStartIndex &&
      existingValues.globalStartIndex() + existingValues.size() > globalStartIndex + size))) {
      return false; // continue
    }

    // Here, compute the actual measurement

    // Values before the currently stored start index

    /** @type {epiviz.measurements.MeasurementHashtable.<Array.<number>>} */
    var compMsVals = new epiviz.measurements.MeasurementHashtable();
    var values = null;

    if (existingValues && existingValues.size()) {
      componentMeasurements.foreach(function(m) {
        var v = storedData.values(m);
        var mVals = [];
        if (globalStartIndex !== null) {
          for (var index = globalStartIndex; index < existingValues.globalStartIndex(); ++index) {
            mVals.push(v.getByGlobalIndex(index));
          }
        }
        compMsVals.put(m, mVals);
      });

      values = new epiviz.datatypes.FeatureValueArray(cm,
        GenomicRange.fromStartEnd(boundaries.seqName(), boundaries.start(), existingValues.boundaries().start()),
        globalStartIndex,
        cm.evaluateArr(compMsVals));


      self._mergeData(cm, values);

      // Values after current global start index + size
      compMsVals = new epiviz.measurements.MeasurementHashtable();
      componentMeasurements.foreach(function(m) {
        var v = storedData.values(m);
        var mVals = [];
        if (globalStartIndex !== null) {
          for (var index = existingValues.globalStartIndex() + existingValues.size(); index < globalStartIndex + size; ++index) {
            mVals.push(v.getByGlobalIndex(index));
          }
        }
        compMsVals.put(m, mVals);
      });

      values = new epiviz.datatypes.FeatureValueArray(cm,
        GenomicRange.fromStartEnd(boundaries.seqName(), existingValues.boundaries().end(), boundaries.end()),
        existingValues.globalStartIndex() + existingValues.size(),
        cm.evaluateArr(compMsVals));

      self._mergeData(cm, values);

      return false;
    }

    compMsVals = new epiviz.measurements.MeasurementHashtable();
    componentMeasurements.foreach(function(m) {
      var v = storedData.values(m);
      var mVals = [];
      if (globalStartIndex !== null) {
        for (var index = globalStartIndex; index < globalStartIndex + size; ++index) {
          mVals.push(v.getByGlobalIndex(index));
        }
      }
      compMsVals.put(m, mVals);
    });

    values = new epiviz.datatypes.FeatureValueArray(cm,
      boundaries,
      globalStartIndex,
      cm.evaluateArr(compMsVals));

    self._mergeData(cm, values);

    return false;
  });
};

/**
 * Clears all data stored in cache
 */
epiviz.data.Cache.prototype.flush = function() {
  this._data = {};

  // Discard all pending requests
  this._measurementRequestStackMap.foreach(function(m, requestStack) { requestStack.clear(); });
  this._measurementPendingRequestsMap.clear();
};

/**
 * @param {string} datasourceGroup
 */
epiviz.data.Cache.prototype.clearDatasourceGroupCache = function(datasourceGroup) {
  delete this._data[datasourceGroup];
  this._measurementRequestStackMap.foreach(function(m, requestStack) {
    if (m.datasourceGroup() == datasourceGroup) { requestStack.clear(); }
  });

  var msToClear = [];
  this._measurementPendingRequestsMap.foreach(function(m, map) {
    if (m.datasourceGroup() == datasourceGroup) { msToClear.push(m); }
  });

  for (var i = 0; i < msToClear.length; ++i) {
    this._measurementPendingRequestsMap.put(msToClear[i], {});
  }
};
