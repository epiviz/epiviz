/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 3/3/14
 * Time: 12:35 PM
 */

goog.provide('epiviz.data.MockDataProvider');

/**
 * @param {?string} [id]
 * @constructor
 * @extends {epiviz.data.DataProvider}
 */
epiviz.data.MockDataProvider = function(id) {
  epiviz.data.DataProvider.call(this, id || epiviz.data.MockDataProvider.DEFAULT_ID);

  /**
   * @type {epiviz.measurements.MeasurementSet}
   * @private
   */
  this._measurements = new epiviz.measurements.MeasurementSet();

  /**
   * @type {epiviz.measurements.Measurement}
   * @private
   */
  this._m1 = null;

  /**
   * @type {epiviz.measurements.Measurement}
   * @private
   */
  this._m2 = null;

  /**
   * @type {epiviz.measurements.MeasurementHashtable}
   * @private
   */
  this._values = new epiviz.measurements.MeasurementHashtable();

  /**
   * @type {epiviz.datatypes.GenomicRange}
   * @private
   */
  this._coveredRegions = [
    epiviz.datatypes.GenomicRange.fromStartEnd('chr6', 103839409, 107422589),
    epiviz.datatypes.GenomicRange.fromStartEnd('myChr', 103839409, 107422589)];

  this._addSeqnamesButton = $('#button-mock-add-seqnames');
  this._removeSeqnamesButton = $('#button-mock-remove-seqnames');
  this._addMeasurementsButton = $('#button-mock-add-measurements');
  this._removeMeasurementsButton = $('#button-mock-remove-measurements');
  this._addChartButton = $('#button-mock-add-chart');
  this._removeChartButton = $('#button-mock-remove-chart');
  this._clearCacheButton = $('#button-mock-clear-cache');
  this._navigateButton = $('#button-mock-navigate');

  this._initialize();

  this._initializeButtonHandlers();
};

/**
 * Copy methods from upper class
 */
epiviz.data.MockDataProvider.prototype = epiviz.utils.mapCopy(epiviz.data.DataProvider.prototype);
epiviz.data.MockDataProvider.constructor = epiviz.data.MockDataProvider;

epiviz.data.MockDataProvider.DEFAULT_ID = 'mock-provider';

/**
 * Helper method; not necessary in real implementations.
 * @private
 */
epiviz.data.MockDataProvider.prototype._initialize = function() {
  var m1 = new epiviz.measurements.Measurement(
    'column_1_feature', // The column in the data source table that contains the values for this feature measurement
    'Mock Feature Measurement 1', // A name not containing any special characters (only alphanumeric and underscores)
    epiviz.measurements.Measurement.Type.FEATURE,
    'mock_gene_expression', // Data source: the table/data frame containing the data
    'affymetrix_probeset', // The same data source group id as one of the measurements coming from the PHP server
    this.id(), // Data provider
    null, // Formula
    'Scatter Plot', // Default chart type filter
    null, // Annotation: example: {tissue_type: string, tissue_subtype: string}
    -5, // Min Value
    25, // Max Value
    ['probe'] // Metadata
  );

  var m2 = new epiviz.measurements.Measurement(
    'table_2_range', // The data source table that contains the ranges for this range measurement. Usually the same as the data source.
    'Mock Range Measurement 2', // A name not containing any special characters (only alphanumeric and underscores)
    epiviz.measurements.Measurement.Type.RANGE,
    'table_2_range', // Data source: the table/data frame containing the data
    'some_datasource_group', // A new data source group
    this.id(), // Data provider
    null, // Formula
    'Blocks Track', // Default chart type filter
    null, // Annotation
    null, null, // Min and max values (does not apply)
    null // No metadata associated with this measurement
  );

  this._m1 = m1;
  this._m2 = m2;

  this._measurements.add(m1);

  this._values.put(m1, {
    chr6: {
      values: [-1.8223838498414,-0.61258676716977,-0.47866833545712,-0.054737753101232,-0.17442192545694,-0.40962816952573,3.1485057281967,3.4216926668387,1.2040975523491,6.1801932225364,6.2102197272821,2.884041505725,4.5749627572691,12.327818860502,2.1696605100473,1.6726685919334,1.3730964627525,2.572793075785,0.66402453937773,0.29669898727439,3.1745684364685,2.0365248658682],
      globalStartIndex: 25879
    }
  });
  this._values.put(m1.datasource(), {
    chr6: {
      values: {
        id: [25879,25880,25881,25882,25883,25884,25885,25886,25887,25888,25889,25890,25891,25892,25893,25894,25895,25896,25897,25898,25899,25900],
        start: [105175968,105404923,105544697,105544697,105585562,105606155,105725440,105725440,106534195,106534195,106632351,106632351,106632351,106959730,107019846,107019846,107077453,107077453,107077453,107077489,107349417,107386386],
        end: [105307794,105531207,105585049,105585049,105617820,105627735,105850959,105850959,106557813,106557813,106773666,106773666,106773666,107018326,107077362,107077362,107116292,107116292,107116292,107101698,107372546,107436473],
        strand: "*",
        metadata: {
          probe: ["227471_at","229349_at","223853_at","228783_at","232492_at","219926_at","204117_at","37950_at","217192_s_at","228964_at","202511_s_at","202512_s_at","210639_s_at","212543_at","1555679_a_at","224509_s_at","218948_at","218949_s_at","241933_at","233089_at","223576_at","227920_at"]
        }
      },
      globalStartIndex: 25879
    }
  });
  this._values.put(m2, {
    chr6: {
      values:{
        id: [10693,10694,10695,10696,10697,10698,10699,10700,10701,10702],
        start: [101857270,105250651,105309133,105411671,105596427,105627861,105856970,105962958,106046989,106105087],
        end: [105211359,105271461,105383016,105571044,105627384,105719343,105932269,105994851,106071935,106148917],
        strand: "*"
      },
      globalStartIndex: 10693
    },
    myChr: {
      values:{
        id: [10703,10704,10705,10706,10707,10708,10709,10710,10711],
        start: [106196924,106299261,106341705,106458601,106568336,106773852,107067335,107303124,107374709],
        end: [106234848,106319337,106416368,106529963,106596204,106803274,107077437,107342199,107384388],
        strand: "*"
      },
      globalStartIndex: 10703
    }
  });
};

/**
 * Helper method, used in conjunction with the mock buttons in index.php, that will later on be deleted.
 * @private
 */
epiviz.data.MockDataProvider.prototype._initializeButtonHandlers = function() {
  var self = this;

  this._addSeqnamesButton.button().click(function() {
    var result = new epiviz.events.EventResult();
    self.onRequestAddSeqInfos().notify({seqInfos: [['otherChr', 1, 1000000000], ['andYetAnotherChr', 1, 1000000000]], result: result});
    alert('Adding seqnames was ' + (result.success ? 'successful!' : 'unsuccessful. Error: ' + result.errorMessage));
  });

  this._removeSeqnamesButton.button().click(function() {
    var result = new epiviz.events.EventResult();
    self.onRequestRemoveSeqNames().notify({seqNames: ['chr1', 'andYetAnotherChr'], result: result});
    alert('Removing seqnames was ' + (result.success ? 'successful!' : 'unsuccessful. Error: ' + result.errorMessage));
  });

  this._addMeasurementsButton.button().click(function() {
    var result = new epiviz.events.EventResult();
    var newMs = new epiviz.measurements.MeasurementSet();
    newMs.add(self._m2);
    self._measurements.add(self._m2);
    self.onRequestAddMeasurements().notify({measurements: newMs, result: result});
    alert('Adding measurements was ' + (result.success ? 'successful!' : 'unsuccessful. Error: ' + result.errorMessage));
  });

  this._removeMeasurementsButton.button().click(function() {
    var result = new epiviz.events.EventResult();
    var rmMs = new epiviz.measurements.MeasurementSet();
    rmMs.add(self._m2);
    self._measurements.remove(self._m2);
    self.onRequestRemoveMeasurements().notify({measurements: rmMs, result: result});
    alert('Removing measurements was ' + result.success ? 'successful!' : 'unsuccessful. Error: ' + result.errorMessage);
  });

  var chartIds = [];

  this._addChartButton.button().click(function() {
    /** @type {epiviz.events.EventResult.<{id: string}>} */
    var result = new epiviz.events.EventResult();
    var ms = new epiviz.measurements.MeasurementSet();
    ms.add(self._m2);
    self.onRequestAddChart().notify({
      type: 'epiviz.plugins.charts.BlocksTrack',
      measurements: ms,
      result: result
    });

    alert('Adding chart was ' + (result.success ? 'successful! Chart id is: ' + result.value.id : 'unsuccessful. Error: ' + result.errorMessage));
    if (result.success) {
      chartIds.push(result.value.id);
    }
  });

  this._removeChartButton.button().click(function() {
    if (!chartIds.length) { return; }

    var chartId = chartIds.pop();
    var result = new epiviz.events.EventResult();
    self.onRequestRemoveChart().notify({
      id: chartId,
      result: result
    });

    alert('Removing chart was ' + (result.success ? 'successful!' : 'unsuccessful. Error: ' + result.errorMessage));
  });

  this._clearCacheButton.button().click(function() {
    // TODO
  });

  this._navigateButton.button().click(function() {
    var result = new epiviz.events.EventResult();
    self.onRequestNavigate().notify({
      range: epiviz.datatypes.GenomicRange.fromStartEnd('chr6', 103839409, 107422589),
      result: result
    });

    alert('Navigate was ' + (result.success ? 'successful!' : 'unsuccessful. Error: ' + result.errorMessage));
  });
};

/**
 * @returns {boolean}
 * @override
 */
epiviz.data.MockDataProvider.prototype.connected = function() { return true; };

/**
 * @param {epiviz.data.Request} request
 * @param {function(epiviz.data.Response.<*>)} callback
 * @override
 */
epiviz.data.MockDataProvider.prototype.getData = function(request, callback) {
  var requestId = request.id();
  var action = request.get('action');
  var seqName = request.get('chr');
  var start = request.get('start');
  var end = request.get('end');
  var datasource = request.get('datasource');

  /** @type {epiviz.measurements.Measurement} */
  var m, d;
  var data;

  switch (action) {
    case epiviz.data.Request.Action.GET_ROWS:
      m = this._measurements.subset(function(/** @type {epiviz.measurements.Measurement} */ m) {
        return m.datasource().datasourceId() == datasource;
      }).first();

      if (!m) { return; }

      d = m.datasource();
      data = this._values.get(d)[seqName];

      if (!data ||
        (seqName != this._coveredRegions[0].seqName() && seqName != this._coveredRegions[1].seqName()) ||
        start > this._coveredRegions[0].end() || end < this._coveredRegions[0].start()) {
        callback(epiviz.data.Response.fromRawObject({
          data: {
            values:{ id: [],  start: [], end: [], strand: "*", metadata:{ probe: [] }},
            globalStartIndex: null
          },
          requestId: requestId
        }));
        return;
      }

      callback(epiviz.data.Response.fromRawObject({
        requestId: request.id(),
        data: data
      }));
      return;

    case epiviz.data.Request.Action.GET_VALUES:
      m = this._measurements.subset(function(/** @type {epiviz.measurements.Measurement} */ m) {
        return m.datasource().datasourceId() == datasource;
      }).first();

      if (!m) { return; }
      data = this._values.get(m)[seqName];

      if (!data ||
        (seqName != this._coveredRegions[0].seqName() && seqName != this._coveredRegions[1].seqName()) ||
        start > this._coveredRegions[0].end() || end < this._coveredRegions[0].start()) {
        callback(epiviz.data.Response.fromRawObject({
          data: {
            values: [],
            globalStartIndex: null
          },
          requestId: requestId
        }));
        return;
      }

      data['requestId'] = requestId;
      callback(epiviz.data.Response.fromRawObject({
        requestId: request.id(),
        data: data
      }));
      return;

    case epiviz.data.Request.Action.GET_MEASUREMENTS:
      callback(epiviz.data.Response.fromRawObject({
        requestId: request.id(),
        type: epiviz.data.MessageType.RESPONSE,
        data: {
          id: [this._m1.id(), this._m2.id()],
          name: [this._m1.name(), this._m2.name()],
          type: [this._m1.type(), this._m2.type()],
          datasourceId: [this._m1.datasourceId(), this._m2.datasourceId()],
          datasourceGroup: [this._m1.datasourceGroup(), this._m2.datasourceGroup()],
          defaultChartType: [this._m1.defaultChartType(), this._m2.defaultChartType()],
          annotation: [this._m1.annotation(), this._m2.annotation()],
          minValue: [this._m1.minValue(), this._m2.minValue()],
          maxValue: [this._m1.maxValue(), this._m2.maxValue()],
          metadata: [this._m1.metadata(), this._m2.metadata()]
        }
      }));
      return;

    case epiviz.data.Request.Action.GET_SEQINFOS:
      callback(epiviz.data.Response.fromRawObject({
        requestId: request.id(),
        data: [['chr1', 1, 248956422], ['chr11', 1, 135086622], ['myChr', 1, 1000000000]]
      }));
      return;

    default:
      epiviz.data.DataProvider.prototype.getData.call(this, request, callback);
      break;
  }
};
