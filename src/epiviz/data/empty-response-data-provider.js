/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 4/22/14
 * Time: 12:58 PM
 */

goog.provide('epiviz.data.EmptyResponseDataProvider');

/**
 * @constructor
 * @extends {epiviz.data.DataProvider}
 */
epiviz.data.EmptyResponseDataProvider = function () {
  epiviz.data.DataProvider.call(this, epiviz.data.EmptyResponseDataProvider.DEFAULT_ID);
};

/**
 * Copy methods from upper class
 */
epiviz.data.EmptyResponseDataProvider.prototype = epiviz.utils.mapCopy(epiviz.data.DataProvider.prototype);
epiviz.data.EmptyResponseDataProvider.constructor = epiviz.data.EmptyResponseDataProvider;

epiviz.data.EmptyResponseDataProvider.DEFAULT_ID = 'empty';

/**
 * @param {epiviz.data.Request} request
 * @param {function(epiviz.data.Response)} callback
 * @override
 */
epiviz.data.EmptyResponseDataProvider.prototype.getData = function (request, callback) {
  var requestId = request.id();
  var action = request.get('action');

  switch (action) {
    case epiviz.data.Request.Action.GET_ROWS:
      callback(epiviz.data.Response.fromRawObject({
        data: {
          values: { id: null, start: [], end:[], strand: [], metadata:{my_metadata:[]} },
          globalStartIndex: null,
          useOffset: false
        },
        requestId: requestId
      }));
      return;

    case epiviz.data.Request.Action.GET_VALUES:
      callback(epiviz.data.Response.fromRawObject({
        data: { values: [], globalStartIndex: null },
        requestId: requestId
      }));
      return;

    case epiviz.data.Request.Action.GET_MEASUREMENTS:
      callback(epiviz.data.Response.fromRawObject({
        requestId: request.id(),
        data: { id: [], name: [], type: [], datasourceId: [], datasourceGroup: [], defaultChartType: [], annotation: [], minValue: [], maxValue: [], metadata: [] }
      }));
      return;

    case epiviz.data.Request.Action.GET_SEQINFOS:
      callback(epiviz.data.Response.fromRawObject({
        requestId: request.id(),
        data: []
      }));
      return;

    case epiviz.data.Request.Action.SEARCH:
      callback(epiviz.data.Response.fromRawObject({
        requestId: request.id(),
        data: []
      }));
      return;

    case epiviz.data.Request.Action.SAVE_WORKSPACE:
      callback(epiviz.data.Response.fromRawObject({
	  requestId: request.id(),
	  data: []
    }));
    return;  

    case epiviz.data.Request.Action.DELETE_WORKSPACE:
      callback(epiviz.data.Response.fromRawObject({
	  requestId: request.id(),
	  data: []
    }));
    return;
  
    case epiviz.data.Request.Action.GET_WORKSPACES:
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
