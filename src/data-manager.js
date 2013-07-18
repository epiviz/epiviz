function DataManager() {
  this.phpmain = 'data/main.php';
  this.allMeasurements = null;
}

DataManager.instance = new DataManager();

DataManager.prototype.getServerLocation = function() {
  return Request.proxy ? 'http://epiviz.cbcb.umd.edu/' : '';
};

DataManager.prototype.getServerEndpoint = function() {
  return this.getServerLocation() + this.phpmain;
};

DataManager.prototype.makeRequest = function(query, callback) {
  var request = $.ajax({
    type: "get",
    url: query,
    dataType: "json",
    async: true,
    cache: false,
    processData: true
  });

  // callback handler that will be called on success
  request.done(function (jsonData, textStatus, jqXHR){
    callback(jsonData);
  });

  // callback handler that will be called on failure
  request.fail(function (jqXHR, textStatus, errorThrown){
    console.error("The following error occured: " + textStatus, errorThrown);
  });

  // callback handler that will be called regardless
  // if the request failed or succeeded
  request.always(function () {
  });
};

DataManager.prototype.getMeasurements = function () {
  var query = sprintf("%s?action=getMeasurements", this.getServerEndpoint());
  var self = this;

  self.allMeasurements = {};
  self.allMeasurements.computedData = {};
  var allJsondata = {};

  this.makeRequest(query,
    function (jsondata) {
      self.allMeasurements.serverData = jsondata;

      if (self.allMeasurements.localData) {
        var localJsonData = self.allMeasurements.localData;

        ChartFactory.foreachDataTypeHandler(function(handler) {
          var measurementsType = handler.getMeasurementsType();
          allJsondata[measurementsType] = handler.mergeMeasurements(localJsonData[measurementsType], jsondata[measurementsType]);
        });
      } else {
        // Deep copy
        for (var measurementType in jsondata) {
          allJsondata[measurementType] = jsondata[measurementType];
        }
      }

      ChartFactory.foreachDataTypeHandler(function(handler) {
        handler.getMeasurementsStore().reload(allJsondata[handler.getMeasurementsType()]);
      });

      EventManager.instance.measurementsLoaded(allJsondata);
    }
  );

  if (LocalController.instance.connected()) {
    LocalController.instance.getMeasurements(
      function(localJsonData) {
        self.allMeasurements.localData = localJsonData;

        if (self.allMeasurements.serverData) {
          var jsondata = self.allMeasurements.serverData;

          ChartFactory.foreachDataTypeHandler(function(handler) {
            var measurementsType = handler.getMeasurementsType();
            allJsondata[measurementsType] = handler.mergeMeasurements(localJsonData[measurementsType], jsondata[measurementsType]);
          });
        } else {
          // Deep copy
          for (var measurementType in localJsonData) {
            allJsondata[measurementType] = localJsonData[measurementType];
          }
        }

        ChartFactory.foreachDataTypeHandler(function(handler) {
          handler.getMeasurementsStore().reload(allJsondata[handler.getMeasurementsType()]);
        });

        EventManager.instance.measurementsLoaded(allJsondata);
      });
  }
};

DataManager.prototype.addMeasurements = function(source, measurements) {
  if (!this.allMeasurements[source]) {
    this.allMeasurements[source] = {};
  }

  var key;
  var type;
  for (type in measurements) {
    if (!this.allMeasurements[source][type] ||
      jQuery.isEmptyObject(this.allMeasurements[source][type]) ||
      jQuery.isArray(this.allMeasurements[source][type])) {
      this.allMeasurements[source][type] = {};
    }

    for (key in measurements[type]) {
      this.allMeasurements[source][type][key] = measurements[type][key];
    }
  }

  var self = this;
  var allJsondata = {};
  ChartFactory.foreachDataTypeHandler(function(handler) {
    var measurementsType = handler.getMeasurementsType();
    // when using test_socket.php, serverData has no measurement types defined
    // check that condition here,
    // TODO: initialize serverData better
    if (self.allMeasurements.serverData[measurementsType]) {
      var sources = [];
      for (var s in self.allMeasurements) {
        sources.push(self.allMeasurements[s][measurementsType]);
      }
      allJsondata[measurementsType] = handler.mergeMeasurements(sources);
    } else {
      allJsondata[measurementsType] = self.allMeasurements.localData[measurementsType];
    }
  });

  ChartFactory.foreachDataTypeHandler(function(handler) {
    handler.getMeasurementsStore().reload(allJsondata[handler.getMeasurementsType()]);
  });

  EventManager.instance.measurementsLoaded(allJsondata);
};

DataManager.prototype.removeMeasurements = function(source, measurements) {

  var key;

  var type;
  for (type in measurements) {
    if (!this.allMeasurements[source][type]) { continue; }

    for (key in measurements[type]) {
      delete this.allMeasurements[source][type][key];
    }
  }

  var self = this;
  var allJsondata = {};
  ChartFactory.foreachDataTypeHandler(function(handler) {
    var measurementsType = handler.getMeasurementsType();

    var sources = [];
    for (var s in self.allMeasurements) {
      sources.push(self.allMeasurements[s][measurementsType]);
    }
    allJsondata[measurementsType] = handler.mergeMeasurements(sources);
  });

  ChartFactory.foreachDataTypeHandler(function(handler) {
    handler.getMeasurementsStore().reload(allJsondata[handler.getMeasurementsType()]);
  });

  EventManager.instance.measurementsLoaded(allJsondata);
};

DataManager.prototype.getData = function(requestId, measurements, requests, callback) {
  var query = sprintf('%s?requestId=%s&action=%s', this.getServerEndpoint(), requestId, 'getAllData');

  for (var i=0; i<requests.length; ++i) {
    query += sprintf('&chr[]=%s&start[]=%s&end[]=%s', requests[i].chr, requests[i].start, requests[i].end);
  }

  var anyDataRequested = false;
  ChartFactory.foreachDataTypeHandler(function(handler) {
    var subQuery = handler.buildRequestSubquery(measurements[handler.getMeasurementsType()]);
    query += subQuery;
    if (subQuery && subQuery.length > 0) {
      anyDataRequested = true;
    }
  });

  if (!anyDataRequested) {
    return;
  }

  this.makeRequest(query, callback);
};

DataManager.prototype.getWorkspaces = function(workspace, callback) {
  var query = sprintf('%s?action=getWorkspaces&q=', this.getServerEndpoint());
  if (workspace) {
    query += '&workspace=' + workspace;
  }
  this.makeRequest(query,
    function (serverJsonData) {
      callback(serverJsonData);
    }
  );
};

DataManager.prototype.saveWorkspace = function(workspace, callback) {
  var request = $.ajax({
    type: "post",
    url: sprintf('%s?action=%s', this.getServerEndpoint(), 'saveWorkspace'),
    data: "data=" + encodeURIComponent(JSON.stringify(workspace)),
    dataType: "json",
    async: true,
    cache: false,
    processData: true
  });

  // callback handler that will be called on success
  request.done(function (response, textStatus, jqXHR){
    callback(response);
  });

  // callback handler that will be called on failure
  request.fail(function (jqXHR, textStatus, errorThrown){
    console.error("The following error occured: " + textStatus, errorThrown);
  });

  // callback handler that will be called regardless
  // if the request failed or succeeded
  request.always(function () {
  });
};

DataManager.prototype.deleteWorkspace = function(workspace, callback) {
  var query = sprintf('%s?action=deleteWorkspace&id=%s', this.getServerEndpoint(), workspace.workspaceId);
  this.makeRequest(query, callback);
};

/*
 * Static method.
 * Performs two binary searches for the start and end indices that match a given
 * [start, end) interval.
 *
 */
DataManager.getStartEndIndices = function(start, end, startCol, endCol) {
  if (!startCol || startCol.length == 0) {
    return new Object({
      startIndex: -1,
      endIndex: -1
    });
  }

  var s = 0;
  var e = startCol.length - 1;
  var endIndex = -1;
  while (s <= e) {
    var m = Math.floor((s + e) * 0.5);
    if (startCol[m] >= end) {
      e = m - 1;
    } else {
      s = m + 1;
      endIndex = m;
    }
  }

  s = 0;
  e = startCol.length - 1;
  var startIndex = -1;
  while (s <= e) {
    var m = Math.floor((s + e) * 0.5);
    if (endCol[m] < start) {
      s = m + 1;
    } else {
      e = m - 1;
      startIndex = m;
    }
  }

  return new Object({
    startIndex: startIndex,
    endIndex: endIndex
  });
};

DataManager.prototype.search = function(request, callback) {
  var query = sprintf('%s?action=search&q=%s&max_results=12', this.getServerEndpoint(), request.term);
  this.makeRequest(query,
    function(data) {
      var r =
        $.map(data.probes, function(item) {
          return {
            label: '',
            metadata: {
              probe: item,
              html: sprintf('<b>%s</b>, %s, %s, %s, %s',
                item[0], item[1], item[2], Globalize.format(item[3], 'n0'), Globalize.format(item[4], 'n0'))
            },
            value: item[0]
          };
        }).concat($.map(data.genes, function(item) {
          return {
            label: '',
            metadata: {
              gene: item,
              html: sprintf('<b>%s</b>, %s, %s, %s',
                item[0], item[1], Globalize.format(item[2], 'n0'), Globalize.format(item[3], 'n0'))
            },
            value: item[0]
          };
        }));
      callback(r);
    });
};
