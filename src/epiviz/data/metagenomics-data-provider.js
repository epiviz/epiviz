/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/31/2014
 * Time: 11:56 AM
 */

goog.provide('epiviz.data.MetagenomicsDataProvider');

/**
 * @constructor
 * @extends {epiviz.data.DataProvider}
 */
epiviz.data.MetagenomicsDataProvider = function () {
  epiviz.data.DataProvider.call(this);

  /**
   * @type {Array.<Array.<number>>}
   * @private
   */
  this._values = [[2,1,3,4,7,3,3,4,29,10],
    [2,0,1,0,1,1,0,3,11,0],
    [5,9,11,15,42,0,0,15,77,0],
    [4,3,0,4,8,4,2,6,19,10],
    [46,53,0,79,2,13,8,99,8,4],
    [4,5,2,10,10,1,13,9,13,1],
    [1,0,0,0,7,1,0,1,12,0],
    [5,11,0,10,0,1,1,17,6,0],
    [2,2,4,1,3,4,1,1,2,3],
    [2,1,1,0,2,0,0,6,9,3],
    [0,1,0,1,2,0,0,1,3,4],
    [0,0,0,0,0,0,0,0,4,5],
    [5,4,99,3,92,5,8,2,24,1],
    [2,1,1,0,0,2,2,1,0,8],
    [2,0,1,3,1,0,1,1,4,2],
    [1,0,8,1,1,0,1,0,2,10],
    [5,4,5,7,1,3,4,5,41,45],
    [30,36,31,48,25,66,51,59,5,14],
    [15,15,13,13,14,8,16,25,3,0],
    [4,3,2,2,0,3,0,2,74,211],
    [7,6,0,1,2,4,1,13,77,140],
    [0,0,0,0,0,0,0,0,6,2],
    [63,52,26,38,150,75,50,74,16,0],
    [1,0,0,2,0,0,0,1,0,5],
    [0,1,4,3,0,0,2,0,6,1],
    [4,1,4,3,2,2,0,2,7,2],
    [2,3,0,0,0,2,1,2,28,77],
    [4,3,5,0,3,0,4,1,0,3],
    [8,36,0,45,18,30,33,4,12,6],
    [8,4,1,6,18,12,8,14,1,0],
    [51,36,6,39,80,38,26,60,12,0],
    [1,1,2,0,1,1,1,2,4,1],
    [17,2,1,6,1,5,2,56,26,28],
    [0,1,0,0,0,0,0,4,1,11],
    [8,2,0,3,3,2,0,0,1,0],
    [8,0,1,10,4,8,7,9,11,1],
    [14,16,10,42,18,14,10,17,21,10],
    [0,4,0,6,2,0,1,1,6,12],
    [1,2,1,2,3,2,0,0,11,1],
    [6,0,1,2,2,1,5,10,30,4]];

  /**
   * @type {Array.<string>}
   * @private
   */
  this._cols = ['PM1:20080114', 'PM1:20080121', 'PM1:20071217', 'PM1:20080128', 'PM1:20080204', 'PM1:20080211', 'PM1:20080225', 'PM10:20080107', 'PM10:20080108', 'PM10:20080114'];

  /**
   * @type {Array.<string>}
   * @private
   */
  this._rows = ['Ruminococcaceae:80', 'Clostridia:36', 'Coprobacillus:38', 'RuminococcaceaeIncertaeSedis:49', 'Coprobacillus:49', 'Erysipelotrichaceae:43', 'Coprobacillus:67', 'Erysipelotrichaceae:49', 'RuminococcaceaeIncertaeSedis:55', 'Anaerostipes:38', 'Ruminococcaceae:274', 'Firmicutes:278', 'Veillonellaceae:54', 'Lachnospiraceae:1726', 'Ruminococcaceae:357', 'Ruminococcaceae:374', 'LachnospiraceaeIncertaeSedis:506', 'Veillonellaceae:60', 'Firmicutes:340', 'ErysipelotrichaceaeIncertaeSedis:240', 'ErysipelotrichaceaeIncertaeSedis:248', 'Lachnospiraceae:2958', 'Lachnospiraceae:2961', 'Ruminococcaceae:547', 'Lachnospiraceae:3189', 'Lachnospiraceae:3330', 'LachnospiraceaeIncertaeSedis:854', 'Betaproteobacteria:10', 'Lachnospiraceae:3493', 'Lachnospiraceae:3509', 'Lachnospiraceae:3663', 'Lachnospiraceae:3796', 'LachnospiraceaeIncertaeSedis:936', 'Lachnospiraceae:3839', 'Akkermansia:40', 'Lachnospiraceae:3899', 'LachnospiraceaeIncertaeSedis:957', 'LachnospiraceaeIncertaeSedis:967', 'Lachnospiraceae:3992', 'ErysipelotrichaceaeIncertaeSedis:313'];

  var self = this;
  var measurements = [];
  this._cols.forEach(function(col, i) {
    var m = new epiviz.measurements.Measurement(
      col, // id
      col, // name
      epiviz.measurements.Measurement.Type.UNORDERED,
      'metagenomics', // datasource
      'metagenomics', // datasource group
      self.id(), // data provider
      null, // formula
      'heatmap',
      null, // annotation
      0, 20,
      ['bacteria']);
    measurements.push(m);
  });

  /**
   * @type {Array.<epiviz.measurements.Measurement>}
   * @private
   */
  this._measurements = measurements;

  var colsIndices = {};
  this._cols.forEach(function(col, i) {
    colsIndices[col] = i;
  });

  /**
   * @type {Object.<string, number>}
   * @private
   */
  this._colsIndices = colsIndices;
};

/**
 * Copy methods from upper class
 */
epiviz.data.MetagenomicsDataProvider.prototype = epiviz.utils.mapCopy(epiviz.data.DataProvider.prototype);
epiviz.data.MetagenomicsDataProvider.constructor = epiviz.data.MetagenomicsDataProvider;

epiviz.data.MetagenomicsDataProvider.DEFAULT_ID = 'stocks';

/**
 * @param {epiviz.data.Request} request
 * @param {function(epiviz.data.Response)} callback
 * @override
 */
epiviz.data.MetagenomicsDataProvider.prototype.getData = function (request, callback) {
  var requestId = request.id();
  var action = request.get('action');
  //var seqName = request.get('seqName');
  var datasource = request.get('datasource');
  var measurement = request.get('measurement');

  switch (action) {
    case epiviz.data.Request.Action.GET_ROWS:
      /*if (seqName != 'metagenomics') {
        // Nothing to return
        callback(epiviz.data.Response.fromRawObject({
          data: { values: { metadata: { bacteria: [] } } },
          requestId: requestId
        }));
        return;
      }*/

      callback(epiviz.data.Response.fromRawObject({
        data: { values: { metadata: { bacteria: this._rows } } },
        requestId: requestId
      }));

      return;

    case epiviz.data.Request.Action.GET_VALUES:
      var colIndex = this._colsIndices[measurement];
      /*if (seqName != 'metagenomics' || colIndex == undefined) {
        // Nothing to return
        callback(epiviz.data.Response.fromRawObject({
          data: { values: [] },
          requestId: requestId
        }));
        return;
      }*/

      var values = this._values.map(function(row, i) { return row[colIndex]; });

      callback(epiviz.data.Response.fromRawObject({
        data: { values: values },
        requestId: requestId
      }));

      return;

    case epiviz.data.Request.Action.GET_MEASUREMENTS:
      callback(epiviz.data.Response.fromRawObject({
        requestId: request.id(),
        data: {
          id: this._cols,
          name: this._cols,
          type: this._measurements.map(function(m) { return m.type(); }),
          datasourceId: this._measurements.map(function(m) { return m.datasourceId(); }),
          datasourceGroup: this._measurements.map(function(m) { return m.datasourceGroup(); }),
          defaultChartType: this._measurements.map(function(m) { return m.defaultChartType(); }),
          annotation: this._measurements.map(function(m) { return m.annotation(); }),
          minValue: this._measurements.map(function(m) { return m.minValue(); }),
          maxValue: this._measurements.map(function(m) { return m.maxValue(); }),
          metadata: this._measurements.map(function(m) { return m.metadata(); })
        }
      }));
      return;

    case epiviz.data.Request.Action.GET_SEQINFOS:
      callback(epiviz.data.Response.fromRawObject({
        requestId: request.id(),
        data: []
      }));
      return;

    default:
      epiviz.data.DataProvider.prototype.getData.call(this, request, callback);
      break;
  }
};

