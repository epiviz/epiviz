/**
 * Created with JetBrains PhpStorm.
 * User: florin
 * Date: 5/27/13
 * Time: 12:26 PM
 * To change this template use File | Settings | File Templates.
 */

function DataTypeHandler(args) {
  this._dataType = args.dataType; // for example, 'geneData', 'bpData', etc.
  this._dataTypeName = args.dataTypeName;
  this._measurementsType = args.measurementsType; // for example, 'geneMeasurements', etc. TODO: Later, have just one of _dataType and _measurementsType
  this._measurementsStore = args.measurementsStore;
  this._isNumeric = args.isNumeric;

  this._jAddComputedMeasurementDialog = null;
}

DataTypeHandler.prototype.getDataType = function() {
  return this._dataType;
};

DataTypeHandler.prototype.getDataTypeName = function() {
  return this._dataTypeName;
};

DataTypeHandler.prototype.getMeasurementsType = function() {
  return this._measurementsType;
};

DataTypeHandler.prototype.getMeasurementsStore = function() {
  return this._measurementsStore;
};

DataTypeHandler.prototype.isNumeric = function() {
  return this._isNumeric;
};

/*
 * Used by ChartDataCache
 *
 * data is of the data type corresponding to this chart type
 */
DataTypeHandler.prototype.subsetData = function(data, start, end) {};

/*
 * Used by ChartDataCache
 *
 * d1, d2 are of the data type corresponding to this chart type
 */
DataTypeHandler.prototype.joinDataByLocation = function(d1, d2) {};

/*
 * Used by DataCache. Merges data from two different data sources (for example,
 * server and local controller). The measurements in the two data sources have
 * to be different.
 */
DataTypeHandler.prototype.mergeDataByMeasurements = function(d1, d2, d2Measurements) {};

/*
 * Splits the given measurements into those corresponding to dataSource1, and dataSource2
 * (for example, server and local controller).
 */
DataTypeHandler.prototype.splitMeasurements = function(measurements, dataSources) {
  var i;
  var result = [];
  for (i = 0; i < dataSources.length; ++i) {
    result.push([]);
  }
  for (i = 0; i < measurements.length; ++i) {
    var m = measurements[i];

    for (var j = 0; j < dataSources.length; ++j) {
      if (dataSources[j] && dataSources[j][m]) {
        result[j].push(m);
        break;
      }
    }
  }

  return result;
};

DataTypeHandler.prototype.mergeMeasurements = function(ms) {
  var result = {};
  var measurement;

  for (var i = 0; i < ms.length; ++i) {
    if (ms[i] && !jQuery.isArray(ms[i]) && !jQuery.isEmptyObject(ms[i])) {
      for (measurement in ms[i]) {
        result[measurement] = ms[i][measurement];
      }
    }
  }

  return result;
};

/*
 * Used in DataManager
 */
DataTypeHandler.prototype.buildRequestSubquery = function(measurements) {
  if (!measurements || !measurements.length) {
    return '';
  }

  var subQuery = '';
  for (var i = 0; i < measurements.length; ++i) {
    subQuery += sprintf('&%s[]=%s', this._measurementsType, measurements[i]);
  }

  return subQuery;
};

// Computed columns

DataTypeHandler.prototype.initializeControls = function() {
  this._jAddComputedMeasurementDialog = this.getComputedMeasurementDialog();

  $('#computed-measurement-key-' + this._dataType).watermark('Computed Measurement Key');
  $('#computed-measurement-name-' + this._dataType).watermark('Computed Measurement Name');
  $('#computed-measurement-min-' + this._dataType).watermark('min');
  $('#computed-measurement-max-' + this._dataType).watermark('max');
  $('#computed-measurement-expr-' + this._dataType).watermark('Expression');
};

DataTypeHandler.prototype.getComputedMeasurementDialog = function() {
  if (this._jAddComputedMeasurementDialog != null) { return this._jAddComputedMeasurementDialog; }

  var id = sprintf('add-computed-measurement-%s-dialog', this._dataType);
  var title = sprintf('Edit %s Computed Measurements', this._dataTypeName);

  $('#dialogs').append(
    sprintf('<div id="%s" title="%s"></div>', id, title)
  );

  this._jAddComputedMeasurementDialog = $('#' + id);
  this._jAddComputedMeasurementDialog.append(this.getComputedMeasurementDialogContents());

  this._jAddComputedMeasurementDialog.dialog(this.getComputedMeasurementDialogProperties());

  return this._jAddComputedMeasurementDialog;
};

DataTypeHandler.prototype.getComputedMeasurementDialogProperties = function() {
  var self = this;

  var minBox = $('#computed-measurement-min-' + self._dataType);
  var maxBox = $('#computed-measurement-max-' + self._dataType);

  var exprBox = $('#computed-measurement-expr-' + self._dataType);

  var keyBox = $('#computed-measurement-key-' + self._dataType);
  var nameBox = $('#computed-measurement-name-' + self._dataType);

  var msList = $('#computed-measurement-measurements-' + self._dataType);

  var editButtonsProperties = {
    text: false,
    icons: {
      primary: 'ui-icon ui-icon-pencil'
    }
  };

  var editButtonsHandler = function(event) {
    var measurement = $(this).data('measurement');

    var m = ComputedMeasurements.instance.get(measurement);

    keyBox.val(measurement);
    nameBox.val(m.name);
    minBox.val(m.min);
    maxBox.val(m.max);
    exprBox.val(m.expr.toString());
  };

  var deleteButtonsProperties = {
    text: false,
    icons: {
      primary: 'ui-icon ui-icon-trash'
    }
  };

  var deleteButtonsHandler = function(event) {
    var measurement = $(this).data('measurement');

    // Check if there are other measurements using this measurement.
    // If there are, display a message and don't delete it.
    var dependentMs = ComputedMeasurements.instance.getDependentMeasurements(measurement);
    if (dependentMs.length > 0) {
      MessageDialogs.instance.error('Cannot delete ' + measurement + ' because ' + dependentMs.join() + ' depend(s) on it.');
      return;
    }

    // Check if there are existing charts using this measurement.
    // If there are, then display a message and don't delete it.
    var charts = ChartManager.instance.getAllCharts();
    for (var i = 0; i < charts.length; ++i) {
      var chartHandler = charts[i].getChartHandler();
      if (chartHandler.getDataTypeHandler().getDataType() != self._dataType) {
        continue;
      }

      var chartMs = chartHandler.workspaceDataToMeasurementsMap(charts[i].getWorkspaceData())[self._measurementsType];
      if (chartMs.indexOf(measurement) >= 0) {
        MessageDialogs.instance.error('Cannot delete ' + measurement + ' because chart ' + charts[i]._id + ' is using it.');
        return;
      }
    }

    ComputedMeasurements.instance.remove(measurement);
    Workspace.instance.changed();

    $(this).parent().parent().remove();

    exprBox.val('');
    minBox.val('');
    maxBox.val('');
    keyBox.val('');
    nameBox.val('');

  };

  var addButtonsProperties = {
    text: false,
    icons: {
      primary: 'ui-icon ui-icon-plus'
    }
  };

  var addButtonsHandler = function(event) {
    var measurement = $(this).data('measurement');

    var text = exprBox.val().trim() + ' ' + measurement;
    exprBox.val(text.trim());
  };

  return {
    autoOpen: false,
    width: '450',
    height: '480',
    resizable: false,
    buttons:{
      "Add":function () {
        try {
          var min = minBox.val();
          var max = maxBox.val();

          var expr = exprBox.val();

          var key = keyBox.val();
          var name = nameBox.val();

          if (!ComputedMeasurements.instance.contains(key)) {
            var editButton = '<button id="edit-button-%2$s-%3$s" data-measurement="%2$s">Edit %2$s</button>';
            var removeButton = '<button id="delete-button-%2$s-%3$s" data-measurement="%2$s">Delete %2$s</button>';
            var content = sprintf(
              '<div style="min-height: 30px; padding: 2px;">' +
                '<div style="margin: 6px; float: left;">%1$s [<b>%2$s</b>]</div>' +
                '<div style="float: right;">' +
                removeButton +
                editButton +
                '<button style="" id="measurement-button-%2$s-%3$s" data-measurement="%2$s">Insert %2$s</button>' +
                '</div>' +
                '</div>', name, key, self._dataType);

            msList.prepend(content);

            $('#edit-button-' + key + '-' + self._dataType).button(editButtonsProperties).click(editButtonsHandler);
            $('#delete-button-' + key + '-' + self._dataType).button(deleteButtonsProperties).click(deleteButtonsHandler);
            $('#measurement-button-' + key + '-' + self._dataType).button(addButtonsProperties).click(addButtonsHandler);
          }

          ComputedMeasurements.instance.add(self._measurementsType, key, name, expr, min, max);
          Workspace.instance.changed();

          exprBox.val('');
          minBox.val('');
          maxBox.val('');
          keyBox.val('');
          nameBox.val('');

        } catch(error) {
          MessageDialogs.instance.error('Error adding computed column: ' + error);
        }
      },
      "Close":function () {
        $(this).dialog("close");
      }
    },
    open: function(event, ui) {

      msList.empty();

      var contents = '';
      var measurements = self._measurementsStore.getMeasurements();
      for (var m in measurements) {
        var editButton = '';
        var removeButton = '';
        if (ComputedMeasurements.instance.contains(m)) {
          editButton = '<button id="edit-button-%2$s-%3$s" data-measurement="%2$s">Edit %2$s</button>';
          removeButton = '<button id="delete-button-%2$s-%3$s" data-measurement="%2$s">Delete %2$s</button>';
        }
        contents += sprintf(
          '<div style="min-height: 30px; padding: 2px;">' +
            '<div style="margin: 6px; float: left;">%1$s [<b>%2$s</b>]</div>' +
            '<div style="float: right;">' +
              removeButton +
              editButton +
              '<button style="" id="measurement-button-%2$s-%3$s" data-measurement="%2$s">Insert %2$s</button>' +
            '</div>' +
          '</div>', measurements[m], m, self._dataType);
      }

      msList.append(contents);

      for (var m in measurements) {
        $('#edit-button-' + m + '-' + self._dataType).button(editButtonsProperties).click(editButtonsHandler);
        $('#delete-button-' + m + '-' + self._dataType).button(deleteButtonsProperties).click(deleteButtonsHandler);
        $('#measurement-button-' + m + '-' + self._dataType).button(addButtonsProperties).click(addButtonsHandler);
      }
    },
    modal:true
  }
};

DataTypeHandler.prototype.getComputedMeasurementDialogContents = function() {
  return sprintf(
    '<br/>' +
    '<label for="computed-measurement-key-%1$s"><b>Key:</b></label> ' +
    '<input id="computed-measurement-key-%1$s" class="ui-widget-content ui-corner-all" style="padding: 2px;" type="text"/>&nbsp;' +
    '<label for="computed-measurement-name-%1$s"><b>Name:</b></label> ' +
    '<input id="computed-measurement-name-%1$s" class="ui-widget-content ui-corner-all" style="padding: 2px;" type="text"/>' +
    '<br /><br />' +
    '<div id="computed-measurement-measurements-%1$s" style="overflow: auto; max-height: 200px; border-style: solid; border-width: 1px; border-color: #999999;">' +
    '</div><br/>' +
    '<label for="computed-measurement-min-%1$s"><b>Min:</b></label> ' +
    '<input id="computed-measurement-min-%1$s" class="ui-widget-content ui-corner-all" style="padding: 2px;" type="text"/>&nbsp;' +
    '<label for="computed-measurement-max-%1$s"><b>Max:</b></label> ' +
    '<input id="computed-measurement-max-%1$s" class="ui-widget-content ui-corner-all" style="padding: 2px;" type="text"/><br/>' +
    '<div style="overflow: hidden; padding: 10px; padding-right: 20px; margin: 0px;">' +
      '<textarea id="computed-measurement-expr-%1$s" class="ui-widget-content ui-corner-all" style="width: 100%%; height: 55px; padding: 5px; margin: 0; resize: none;"></textarea>' +
    '</div>',
    this._dataType);
};
