/**
 * Created with JetBrains PhpStorm.
 * User: florin
 * Date: 2/11/13
 * Time: 9:37 PM
 * To change this template use File | Settings | File Templates.
 */

/*
 * measurements: { bpMeasurements: [...], blockMeasurements: [...], etc. }
 */
function ChartDataCache(chartId, measurements, dataProvider) {
  this._chartId = chartId;
  this._measurements = measurements;
  this._data = new Object({
    chr: null,
    start: -1,
    end: -1
  });
  this._currentRequestId = 0;
  this._requestStack = new RequestStack();

  var hasMeasurements = false;
  ChartFactory.foreachDataTypeHandler(function(handler, breakIteration) {
    if (measurements[handler.getMeasurementsType()] && measurements[handler.getMeasurementsType()].length) {
      hasMeasurements = true;
      breakIteration.set = true;
    }
  });
  this._hasMeasurements = hasMeasurements;

  this._dataProvider = dataProvider;
}

ChartDataCache.prototype.getData = function(chr, start, end, sender, callback) {

  if (!this._hasMeasurements) {
    callback.call(sender, this._chartId, {});
    return;
  }

  var measurements = this._measurements;
  var requestId;

  var width = end - start;
  var cStart = Math.max(0, start - 2 * width);
  var cEnd = end + 2 * width;

  var self = this;
  var requests = null;

  if (this._data.chr != chr ||
    this._data.end <= start || this._data.start >= end) {
    // This means we don't have any of the needed data. We have to make two calls:
    // First with the needed data, and then for the cache extra data
    this.clear();

    requests = [{
      chr: chr,
      start: start,
      end: end
    }];

    requestId = this._currentRequestId++;
    this._requestStack.pushRequestId(requestId, this,
      function(data) {
        self._mergeData(data);
        var allData = self._subset(start, end);
        callback.call(sender, self._chartId, allData);
      });

    this._dataProvider.getData(requestId, measurements, requests,
      function(data) {
        self._requestStack.serveData(data['request_id'], data['responses']);
      });

    requests = [];
    requests.push(new Object({
      chr: chr,
      start: cStart,
      end: start
    }));
    requests.push(new Object({
      chr: chr,
      start: end,
      end: cEnd
    }));

    requestId = this._currentRequestId++;
    this._requestStack.pushRequestId(requestId, this,
      function(data) {
        self._mergeData(data);
      });
    this._dataProvider.getData(requestId, measurements, requests,
      function(data) {
        self._requestStack.serveData(data['request_id'], data['responses']);
      });

    return;
  }

  if (this._data.start <= cStart && this._data.end >= cEnd) {
    // This means we already have all data we need. Return the portion requested!
    callback.call(sender, this._chartId, this._subset(start, end));
    return;
  }

  if (this._data.start <= start && this._data.end >= end) {
    // This means we have the data requested, but not the data needed to preserve the
    // consistency of the cache. So first call the callback with the requested data,
    // and then request the new data from the server.
    callback.call(sender, this._chartId, this._subset(start, end));

    requests = [];

    if (cStart < this._data.start) {
      requests.push(new Object({
        chr: chr,
        start: cStart,
        end: this._data.start
      }));
    }
    if (cEnd > this._data.end) {
      requests.push(new Object({
        chr: chr,
        start: this._data.end,
        end: cEnd
      }));
    }

    requestId = this._currentRequestId++;
    this._requestStack.pushRequestId(requestId, this,
      function(data) {
        self._mergeData(data);
        self._trim(cStart, cEnd);
      });
    this._dataProvider.getData(requestId, measurements, requests,
      function(data) {
        self._requestStack.serveData(data['request_id'], data['responses']);
      });

    return;
  }

  // if (this._data.end > start && this._data.start < end) {
  // This means that we have part of the data, and we only need to ask for the rest.
  // Make two requests: first, with the remainder of the needed data,
  // and and then with the extra data for the cache
  requests = [];

  if (start < this._data.start) {
    requests.push(new Object({
      chr: chr,
      start: start,
      end: this._data.start
    }));
  }
  if (end > this._data.end) {
    requests.push(new Object({
      chr: chr,
      start: this._data.end,
      end: end
    }));
  }

  requestId = this._currentRequestId++;
  this._requestStack.pushRequestId(requestId, this,
    function(data) {
      self._mergeData(data);
      callback.call(sender, self._chartId, self._subset(start, end));
    });
  this._dataProvider.getData(requestId, measurements, requests,
    function(data) {
      self._requestStack.serveData(data['request_id'], data['responses']);
    });

  requests = [];
  requests.push(new Object({
    chr: chr,
    start: cStart,
    end: start
  }));
  requests.push(new Object({
    chr: chr,
    start: end,
    end: cEnd
  }));

  requestId = this._currentRequestId++;
  this._requestStack.pushRequestId(requestId, this,
    function(data) {
      self._mergeData(data);
      self._trim(cStart, cEnd);
    });
  this._dataProvider.getData(requestId, measurements, requests,
    function(data) {
      self._requestStack.serveData(data['request_id'], data['responses']);
    });
};

ChartDataCache.prototype._subset = function(start, end, data) {
  if (!data) {
    data = this._data;
  }
  var result = {
    chr: this._data.chr,
    start: start,
    end: end
  };

  ChartFactory.foreachDataTypeHandler(function(handler) {
    var dataType = handler.getDataType();
    result[dataType] =  handler.subsetData(data[dataType], start, end);
  });

  return result;
};

/*
 * data: { chr, start, end, genes: {...}, bpData: {...}, blockData: {...}, geneData: {...}, barcodeData: {...} }
 */
ChartDataCache.prototype._mergeData = function(d) {
  // We'll only treat the following cases:
  // 1. We don't have any data stored yet
  // 2. We have only data for a different chromosome
  // 3. The new data starts from the end of the existing data,
  //    or vice-versa.

  var self = this;
  for (var i = 0; i < d.length; ++i) {
    var data = d[i];

    if (!this._data.chr || this._data.chr != data.chr) {
      // console.log(sprintf('Initial data: [%s, %s]', Globalize.format(data.start, 'n0'), Globalize.format(data.end, 'n0')));
      this._data = data;
      continue;
    }

    if (data.end <= this._data.start) {
      // console.log(sprintf('Merging [%s, %s] with [%s, %s]', Globalize.format(data.start, 'n0'), Globalize.format(data.end, 'n0'),
      //   Globalize.format(this._data.start, 'n0'), Globalize.format(this._data.end, 'n0')));
      ChartFactory.foreachDataTypeHandler(function(handler) {
        var dataType = handler.getDataType();
        self._data[dataType] = handler.joinDataByLocation(data[dataType], self._data[dataType]);
      });
      self._data.start = data.start;
      continue;
    }

    if (this._data.end <= data.start) {
      // console.log(sprintf('Merging [%s, %s] with [%s, %s]', Globalize.format(this._data.start, 'n0'), Globalize.format(this._data.end, 'n0'),
      //   Globalize.format(data.start, 'n0'), Globalize.format(data.end, 'n0')));
      ChartFactory.foreachDataTypeHandler(function(handler) {
        var dataType = handler.getDataType();
        self._data[dataType] = handler.joinDataByLocation(self._data[dataType], data[dataType]);
      });
      this._data.end = data.end;
      continue;
    }

    if (this._data.end <= data.end) {
      // console.log(sprintf('Merging [%s, %s] with [%s, %s]', Globalize.format(this._data.start, 'n0'), Globalize.format(this._data.end, 'n0'),
      //   Globalize.format(data.start, 'n0'), Globalize.format(data.end, 'n0')));
      data = this._subset(this._data.end, data.end, data);
      ChartFactory.foreachDataTypeHandler(function(handler) {
        var dataType = handler.getDataType();
        self._data[dataType] = handler.joinDataByLocation(self._data[dataType], data[dataType]);
      });
      this._data.end = data.end;
      continue;
    }

    if (data.start <= this._data.start) {
      // console.log(sprintf('Merging [%s, %s] with [%s, %s]', Globalize.format(data.start, 'n0'), Globalize.format(data.end, 'n0'),
      //   Globalize.format(this._data.start, 'n0'), Globalize.format(this._data.end, 'n0')));
      data = this._subset(data.start, this._data.start, data);
      ChartFactory.foreachDataTypeHandler(function(handler) {
        var dataType = handler.getDataType();
        self._data[dataType] = handler.joinDataByLocation(data[dataType], self._data[dataType]);
      });
      this._data.start = data.start;
      // continue;
    }

    // console.log(sprintf('Tried to merge d[%s, %s] with s[%s, %s]', Globalize.format(data.start, 'n0'), Globalize.format(data.end, 'n0'),
    //   Globalize.format(this._data.start, 'n0'), Globalize.format(this._data.end, 'n0')));
    // We ignore any other case.
  }
};

ChartDataCache.prototype.clear = function() {
  this._data = {
    chr: null,
    start: -1,
    end: -1
  };
  this._requestStack.clear();
};

ChartDataCache.prototype._trim = function(start, end) {
  this._data = this._subset(start, end);
  // console.log('Trim start = ' + Globalize.format(start, 'n0') + ' end = ' + Globalize.format(end, 'n0'));
};

ChartDataCache.prototype.getMeasurements = function() {
  return this._measurements;
};
