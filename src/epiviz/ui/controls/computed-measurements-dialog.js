/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 2/20/14
 * Time: 6:20 PM
 */

goog.provide('epiviz.ui.controls.ComputedMeasurementsDialog');

/**
 * @param {string} title
 * @param {{add: function(epiviz.measurements.Measurement), remove: function(epiviz.measurements.Measurement), close: function()}} handlers
 * @param {epiviz.measurements.MeasurementSet} measurements
 * @param {Object.<string, epiviz.measurements.MeasurementSet>} chartsMeasurements
 * @constructor
 * @extends {epiviz.ui.controls.Dialog}
 */
epiviz.ui.controls.ComputedMeasurementsDialog = function(title, handlers, measurements, chartsMeasurements) {
  epiviz.ui.controls.Dialog.call(this, title, handlers);

  /**
   * @type {epiviz.measurements.MeasurementSet}
   * @private
   */
  this._measurements = measurements;

  /**
   * @type {Object.<string, epiviz.measurements.MeasurementSet>}
   * @private
   */
  this._chartsMeasurements = chartsMeasurements;

  /**
   * @type {?jQuery}
   * @private
   */
  this._expressionTextBox = null;

  /**
   * @type {?jQuery}
   * @private
   */
  this._idTextBox = null;

  /**
   * @type {?jQuery}
   * @private
   */
  this._nameTextBox = null;

  /**
   * @type {?jQuery}
   * @private
   */
  this._minTextBox = null;

  /**
   * @type {?jQuery}
   * @private
   */
  this._maxTextBox = null;

  /**
   * @type {?jQuery}
   * @private
   */
  this._measurementsList = null;

  /**
   * @type {{text: boolean, icons: {primary: string}}}
   * @private
   */
  this._addButtonProperties = {
    text: false,
    icons: {
      primary: 'ui-icon ui-icon-plus'
    }
  };

  /**
   * @type {{text: boolean, icons: {primary: string}}}
   * @private
   */
  this._deleteButtonsProperties = {
    text: false,
    icons: {
      primary: 'ui-icon ui-icon-trash'
    }
  };

  /**
   * @type {?jQuery}
   * @private
   */
  this._tabs = null;

  /**
   * @type {string}
   * @private
   */
  this._selectedDatasourceGroup = null;

  /**
   * @type {Array.<epiviz.measurements.Measurement>}
   * @private
   */
  this._datasourceGroupMeasurements = null;

  this._addTabs();
  this._addDialogContents();
  this._addDatasourceGroupTable(measurements);
};

/**
 * Copy methods from upper class
 */
epiviz.ui.controls.ComputedMeasurementsDialog.prototype = epiviz.utils.mapCopy(epiviz.ui.controls.Dialog.prototype);
epiviz.ui.controls.ComputedMeasurementsDialog.constructor = epiviz.ui.controls.ComputedMeasurementsDialog;

/**
 */
epiviz.ui.controls.ComputedMeasurementsDialog.prototype.show = function() {
  epiviz.ui.controls.Dialog.prototype.show.call(this);

  var self = this;
  if (this._dialog) {
    this._dialog.dialog('open');
    this._dialog.dialog('option', 'position', 'center');

    // This makes the dialog only able to open once:
    this._dialog.dialog({
      close: function(event, ui) {
        $(this).remove();
        self._dialog = null;
        self._handlers.close();
      }
    });
  }
};

/**
 * @param {epiviz.measurements.MeasurementSet} measurements
 * @private
 */
epiviz.ui.controls.ComputedMeasurementsDialog.prototype._addDatasourceGroupTable = function(measurements) {
  var self = this;
  var container = $(sprintf('#datasource-group-tab-%s', this._id));
  var rawTableCls = 'computed-measurements-dialog-raw-table';

  var table = '<table ' +
    'style="border-spacing:0; ' +
    'border-collapse:collapse; ' +
    '-webkit-touch-callout: none; ' +
    '-webkit-user-select: none; ' +
    '-khtml-user-select: none; ' +
    '-moz-user-select: moz-none; ' +
    '-ms-user-select: none; ' +
    'user-select: none; ' +
    'width: 100%%;" ' +
    'class="' + rawTableCls + '">%s</table>';

  var header = '<thead><tr><th>Data Source Group</th></tr></thead>';
  var footer = '<tfoot><tr><th>Data Source Group</th></tr></tfoot>';
  var body = '';

  /**
   * @type {Object.<string, Array.<epiviz.measurements.Measurement>>}
   */
  var measurementsByDatasourceGroup = {};

  measurements.foreach(function(m) {
    if (m.type() != epiviz.measurements.Measurement.Type.FEATURE) { return; } // continue

    if (!(m.datasourceGroup() in measurementsByDatasourceGroup)) {
      measurementsByDatasourceGroup[m.datasourceGroup()] = [];
    }

    measurementsByDatasourceGroup[m.datasourceGroup()].push(m);
  });

  for (var g in measurementsByDatasourceGroup) {
    if (!measurementsByDatasourceGroup.hasOwnProperty(g)) { continue; }

    body += sprintf('<tr><td class="center">%s</td></tr>', g);
  }

  container.append(sprintf(table, header + body + footer));

  var rawTable = container.find('.' + rawTableCls);
  var oTable = rawTable.dataTable({
    bJQueryUI: true,
    sDom: '<"H"lfr>Tt<"F"ip>',
    'oTableTools': {
      "sRowSelect": "single",
      "aButtons": [],

      "fnPreRowSelect": function(e, nodes, isSelect) {
        return true;
      },
      "fnRowSelected":   function(nodes) {
        var data = oTable.fnGetData(nodes[0]);
        self._selectedDatasourceGroup = data[0];
        self._datasourceGroupMeasurements = measurementsByDatasourceGroup[self._selectedDatasourceGroup];
      },
      "fnRowDeselected": function(nodes) {
        var data = oTable.fnGetData(nodes[0]);
        if (data == self._selectedDatasourceGroup) {
          self._selectedDatasourceGroup = null;
          self._datasourceGroupMeasurements = null;
        }
      }
    }
  });

  // Hack, to position the table at the top
  container.find('.DTTT_container').css('position', 'absolute');
};

/**
 * @private
 */
epiviz.ui.controls.ComputedMeasurementsDialog.prototype._addTabs = function() {
  var self = this;
  this._selectDialog().append(
    '<div class="computed-measurements-dialog">' +
      '<div class="computed-measurements-tabs">' +
        '<ul>' +
          sprintf('<li><a href="#datasource-group-tab-%s">Data Source Group</a></li>', this._id) +
          sprintf('<li><a href="#formula-tab-%s">Expression</a></li>', this._id) +
        '</ul>' +
        sprintf('<div id="datasource-group-tab-%s"></div>', this._id) +
        sprintf('<div id="formula-tab-%s"></div>', this._id) +
      '</div>' +
    '</div>');

  this._tabs = this._selectTabs();
  this._tabs.tabs({
    activate: function(e, ui) { self._tabActivate(ui); }
  });
};

/**
 * @private
 */
epiviz.ui.controls.ComputedMeasurementsDialog.prototype._addDialogContents = function() {
  var self = this;
  this._selectDialog().dialog({
    autoOpen: false,
    resizable: true,
    width: '600',
    height: '550',
    buttons: {
      Back: function() {
        var selectedTabIndex = self._tabs.tabs('option', 'active');
        if (selectedTabIndex == 0) { return; }

        self._tabs.tabs('option', 'active', 0);
      },
      Next: function() {
        var selectedTabIndex = self._tabs.tabs('option', 'active');
        if (selectedTabIndex == 1) { return; }

        self._tabs.tabs('option', 'active', 1);
      },
      Add: function() {
        /** @type {epiviz.utils.ExpressionParser.Expression} */
        var expr = epiviz.utils.ExpressionParser.parse(self._selectExpressionTextBox().val().trim());

        var referredMeasurements = {};
        var variables = expr.variables();
        var min = null, max = null;
        var metadata = [];
        var usedMetadata = {};

        for (var i = 0; i < variables.length; ++i) {
          var variable = variables[i];

          if (!epiviz.utils.stringStartsWith(variable, '{') || !epiviz.utils.stringEndsWith(variable, '}')) {
            // This means that the variable is something else than a measurement
            continue;
          }
          var index = parseInt(variable.substring(1, variable.length - 1));

          var m = self._datasourceGroupMeasurements[index];
          referredMeasurements[index] = m;

          if (min === null || min > m.minValue()) {
            min = m.minValue();
          }

          if (max === null || max < m.maxValue()) {
            max = m.maxValue();
          }

          if (m.metadata()) {
            for (var j = 0; j < m.metadata().length; ++j) {
              if (!usedMetadata[m.metadata()[j]]) {
                usedMetadata[m.metadata()[j]] = true;
                metadata.push(m.metadata()[j]);
              }
            }
          }
        }

        var userMin = self._selectMinTextBox().val().trim();
        var userMax = self._selectMaxTextBox().val().trim();

        min = userMin ? parseFloat(userMin) : min;
        max = userMax ? parseFloat(userMax) : max;

        var id = self._selectIdTextBox().val().trim() || epiviz.utils.generatePseudoGUID(5);
        var measurement = new epiviz.measurements.Measurement(
          id,
          self._selectNameTextBox().val().trim() || 'Unnamed [' + id + ']',
          epiviz.measurements.Measurement.Type.FEATURE,
          null, // datasourceId
          self._selectedDatasourceGroup,
          null, // data provider
          {referredMeasurements: referredMeasurements, expression: expr},
          'any',
          null,
          min,
          max,
          metadata
        );

        var nextIndex = self._datasourceGroupMeasurements.length;
        var msList = $(sprintf('#computed-measurement-measurements-%s', self._id));
        var removeButton = '<button id="delete-button-%2$s-%3$s" data-measurement="%2$s">Delete</button>';
        msList.append(sprintf(
          '<div style="min-height: 30px; padding: 2px;">' +
            '<div style="margin: 6px; float: left;">%1$s {<b>%2$s</b>}</div>' +
            '<div style="float: right;">' +
              removeButton +
              '<button style="" id="measurement-button-%2$s-%3$s" data-measurement="%2$s">Insert %2$s</button>' +
            '</div>' +
          '</div>', measurement.name(), nextIndex, self._id));

        $('#measurement-button-' + nextIndex + '-' + self._id)
          .button(self._addButtonProperties)
          .click(function() { self._addButtonClick($(this)); });
        $('#delete-button-' + nextIndex + '-' + self._id)
          .button(self._deleteButtonsProperties)
          .click(function() { self._deleteButtonClick($(this)); });

        self._datasourceGroupMeasurements.push(measurement);

        self._handlers.add(measurement);

      },
      Close: function() {
        self._handlers.close();
        $(this).dialog('close');
      }
    },
    modal: true
  });
};

/**
 * @param {jQuery} button
 * @private
 */
epiviz.ui.controls.ComputedMeasurementsDialog.prototype._addButtonClick = function(button) {
  var measurementIndex = button.data('measurement');

  var exprBox = this._selectExpressionTextBox();
  exprBox.val(exprBox.val().trim() + ' {' + measurementIndex + '}');
};

/**
 * @param {jQuery} button
 * @private
 */
epiviz.ui.controls.ComputedMeasurementsDialog.prototype._deleteButtonClick = function(button) {
  var measurementIndex = button.data('measurement');
  var measurement = this._datasourceGroupMeasurements[measurementIndex];
  var dialog;

  // Check if there are other measurements using this measurement.
  // If there are, display a message and don't delete it.
  for (var i = 0; i < this._datasourceGroupMeasurements.length; ++i) {
    var m = this._datasourceGroupMeasurements[i];
    if (m == null || m === measurement || !m.isComputed()) { continue; }
    if (m.componentMeasurements().contains(measurement)) {
      dialog = new epiviz.ui.controls.MessageDialog(
        'Measurement cannot be deleted',
        {
          Ok: function() {}
        },
        'There are other measurements that depend on the one selected. Please delete those before deleting this.',
        epiviz.ui.controls.MessageDialog.Icon.ERROR);
      dialog.show();
      return;
    }
  }

   // Check if there are existing charts using this measurement.
   // If there are, then display a message and don't delete it.
  for (var chartId in this._chartsMeasurements) {
    if (!this._chartsMeasurements.hasOwnProperty(chartId)) { continue; }
    if (this._chartsMeasurements[chartId].contains(measurement)) {
      dialog = new epiviz.ui.controls.MessageDialog(
        'Measurement cannot be deleted',
        {
          Ok: function() {}
        },
        'There are charts using the selected measurement. Remove them from the workspace and then try again.',
        epiviz.ui.controls.MessageDialog.Icon.ERROR);
      dialog.show();
      return;
    }
  }

  this._datasourceGroupMeasurements[measurementIndex] = null;
  button.parent().parent().remove();
  this._handlers.remove(measurement);
};

/**
 * @param ui
 * @private
 */
epiviz.ui.controls.ComputedMeasurementsDialog.prototype._tabActivate = function(ui) {
  var selectedTabIndex = this._selectTabs().tabs('option', 'active');

  if (selectedTabIndex == 0) { return; }

  ui.newPanel.empty();

  this._idTextBox = null;
  this._nameTextBox = null;
  this._expressionTextBox = null;
  this._minTextBox = null;
  this._maxTextBox = null;
  this._measurementsList = null;

  if (!this._selectedDatasourceGroup) { return; }

  ui.newPanel.append(sprintf(
    '<label for="computed-measurement-key-%1$s"><b>Id:</b></label> ' +
    '<input id="computed-measurement-key-%1$s" class="ui-widget-content ui-corner-all" style="padding: 2px;" type="text"/>&nbsp;' +
    '<label for="computed-measurement-name-%1$s"><b>Name:</b></label> ' +
    '<input id="computed-measurement-name-%1$s" class="ui-widget-content ui-corner-all" style="padding: 2px;" type="text"/>' +
    '<br /><br />' +
    '<div id="computed-measurement-measurements-%1$s" style="overflow: auto; max-height: 200px; border-style: solid; border-width: 1px; border-color: #999999;"></div>' +
    '<br/>' +
    '<label for="computed-measurement-min-%1$s"><b>Min:</b></label> ' +
    '<input id="computed-measurement-min-%1$s" class="ui-widget-content ui-corner-all" style="padding: 2px;" type="text"/>&nbsp;' +
    '<label for="computed-measurement-max-%1$s"><b>Max:</b></label> ' +
    '<input id="computed-measurement-max-%1$s" class="ui-widget-content ui-corner-all" style="padding: 2px;" type="text"/><br/>' +
    '<div style="overflow: hidden; padding: 10px; padding-right: 20px; margin: 0px;">' +
      '<textarea id="computed-measurement-expr-%1$s" class="ui-widget-content ui-corner-all" style="width: 100%%; height: 55px; padding: 5px; margin: 0; resize: none;"></textarea>' +
    '</div>',
    this._id));

  var msList = this._selectMeasurementsList();

  var contents = '';
  for (var i = 0; i < this._datasourceGroupMeasurements.length; ++i) {
    var m = this._datasourceGroupMeasurements[i];
    var removeButton = '';
    if (m.isComputed()) {
      removeButton = '<button id="delete-button-%2$s-%3$s" data-measurement="%2$s">Delete %2$s</button>';
    }
    contents += sprintf(
      '<div style="min-height: 30px; padding: 2px;">' +
        '<div style="margin: 6px; float: left;">%1$s {<b>%2$s</b>}</div>' +
        '<div style="float: right;">' +
          removeButton +
          //editButton +
          '<button style="" id="measurement-button-%2$s-%3$s" data-measurement="%2$s">Insert %2$s</button>' +
        '</div>' +
      '</div>', m.name(), i, this._id);
  }

  msList.append(contents);

  var self = this;
  for (i = 0; i < this._datasourceGroupMeasurements.length; ++i) {
    m = this._datasourceGroupMeasurements[i];
    if (m.isComputed()) {
      $('#delete-button-' + i + '-' + this._id)
        .button(this._deleteButtonsProperties)
        .click(function() { self._deleteButtonClick($(this)); });
    }
    $('#measurement-button-' + i + '-' + this._id)
      .button(this._addButtonProperties)
      .click(function() { self._addButtonClick($(this)); });
  }

  this._selectIdTextBox().watermark('[auto]');
  this._selectNameTextBox().watermark('[auto]');
  this._selectMinTextBox().watermark('[auto]');
  this._selectMaxTextBox().watermark('[auto]');
  this._selectExpressionTextBox().watermark('[expression; for example: {0} - {1}]');
};


/**
 * @returns {jQuery}
 * @private
 */
epiviz.ui.controls.ComputedMeasurementsDialog.prototype._selectDialog = function() {
  if (!this._dialog) { this._dialog = $('#' + this._id); }

  return this._dialog;
};

/**
 * @returns {jQuery}
 * @private
 */
epiviz.ui.controls.ComputedMeasurementsDialog.prototype._selectExpressionTextBox = function() {
  if (!this._expressionTextBox) { this._expressionTextBox = $('#computed-measurement-expr-' + this._id); }

  return this._expressionTextBox;
};

/**
 * @returns {jQuery}
 * @private
 */
epiviz.ui.controls.ComputedMeasurementsDialog.prototype._selectIdTextBox = function() {
  if (!this._idTextBox) { this._idTextBox = $('#computed-measurement-key-' + this._id); };

  return this._idTextBox;
};

/**
 * @returns {jQuery}
 * @private
 */
epiviz.ui.controls.ComputedMeasurementsDialog.prototype._selectNameTextBox = function() {
  if (!this._nameTextBox) { this._nameTextBox = $('#computed-measurement-name-' + this._id); };

  return this._nameTextBox;
};

/**
 * @returns {jQuery}
 * @private
 */
epiviz.ui.controls.ComputedMeasurementsDialog.prototype._selectMinTextBox = function() {
  if (!this._minTextBox) { this._minTextBox = $('#computed-measurement-min-' + this._id); };

  return this._minTextBox;
};

/**
 * @returns {jQuery}
 * @private
 */
epiviz.ui.controls.ComputedMeasurementsDialog.prototype._selectMaxTextBox = function() {
  if (!this._maxTextBox) { this._maxTextBox = $('#computed-measurement-max-' + this._id); };

  return this._maxTextBox;
};

/**
 * @returns {jQuery}
 * @private
 */
epiviz.ui.controls.ComputedMeasurementsDialog.prototype._selectTabs = function() {
  if (!this._tabs) { this._tabs = this._dialog.find('.computed-measurements-tabs'); }

  return this._tabs;
};

/**
 * @returns {jQuery}
 * @private
 */
epiviz.ui.controls.ComputedMeasurementsDialog.prototype._selectMeasurementsList = function() {
  if (!this._measurementsList) { this._measurementsList = $('#computed-measurement-measurements-' + this._id); }

  return this._measurementsList;
};
