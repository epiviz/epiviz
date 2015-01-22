/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 4/1/14
 * Time: 9:32 AM
 */

goog.provide('epiviz.ui.controls.MeaurementsWizardStep');

/**
 * @constructor
 * @implements {epiviz.ui.controls.Wizard.Step}
 */
epiviz.ui.controls.MeaurementsWizardStep = function() {
  /**
   * @type {?epiviz.ui.controls.DataTable}
   * @private
   */
  this._dataTable = null;

  /**
   * @type {epiviz.ui.controls.VisConfigSelection}
   * @private
   */
  this._data = null;

  /**
   * @type {epiviz.measurements.MeasurementSet}
   * @private
   */
  this._measurements = null;
};

/**
 * @param {jQuery} container
 * @param {epiviz.ui.controls.VisConfigSelection} data
 */
epiviz.ui.controls.MeaurementsWizardStep.prototype.initialize = function(container, data) {
  this._data = data;

  container.find('.epiviz-data-table').remove();

  var ColumnType = epiviz.ui.controls.DataTable.ColumnType;
  var columns = [
    new epiviz.ui.controls.DataTable.Column('id', 'Id', ColumnType.STRING, true),
    new epiviz.ui.controls.DataTable.Column('name', 'Name', ColumnType.STRING, false, true),
    new epiviz.ui.controls.DataTable.Column('defaultChartType', 'Default Chart Type', ColumnType.STRING, false, true),
    new epiviz.ui.controls.DataTable.Column('type', 'Type', ColumnType.STRING, true),
    new epiviz.ui.controls.DataTable.Column('datasourceId', 'Data Source', ColumnType.STRING, true),
    new epiviz.ui.controls.DataTable.Column('datasourceGroup', 'Data Source Group', ColumnType.STRING, true),
    new epiviz.ui.controls.DataTable.Column('dataprovider', 'Data Provider', ColumnType.STRING, true),
    new epiviz.ui.controls.DataTable.Column('formulaStr', 'Formula', ColumnType.STRING, true),
    new epiviz.ui.controls.DataTable.Column('annotation', 'Annotation', ColumnType.STRING)
  ];

  // Filter out measurements that don't match the given restrictions
  this._measurements = data.measurements.subset(
    function(m) {
      if (data.datasource && data.datasource != m.datasourceId()) { return false; }
      if (data.datasourceGroup && data.datasourceGroup != m.datasourceGroup()) { return false; }
      if (data.dataprovider && data.dataprovider != m.dataprovider()) { return false; }
      if (data.annotation) {
        for (var key in data.annotation) {
          if (!data.annotation.hasOwnProperty(key)) { continue; }
          if (!m.annotation() || m.annotation()[key] != data.annotation[key]) { return false; }
        }
      }
      return true;
    });

  this._dataTable = new epiviz.ui.controls.DataTable(container, columns, this._measurements,
    /**
     * @param {epiviz.measurements.Measurement} m
     * @param {epiviz.ui.controls.DataTable.Column} column
     * @returns {string|number}
     */
    function(m, column) {
      var result = null;
      switch (column.id) {
        case 'annotation':
          result = epiviz.utils.mapJoin(m.annotation(), ': ', '<br />');
          break;
        default:
          result = m[column.id](); // Getter with the same name
          break;
      }
      if (result === 0 || result === '' || result) { return result; }

      return '';
    }, true, true);
  this._dataTable.initialize();
};

/**
 * Gets the selected datasource group, or, if
 * there is an error, success is set to false and errorMessage contains
 * the details of the error that occurred.
 *
 * @returns {{
 *   error: string=,
 *   data: epiviz.ui.controls.VisConfigSelection=
 * }}
 */
epiviz.ui.controls.MeaurementsWizardStep.prototype.next = function() {
  var selectedRows = this._dataTable ? this._dataTable.selectedRows() : [];
  if (selectedRows.length < this._data.minSelectedMeasurements) {
    return {
      error: 'Minimum selected rows required is ' + this._data.minSelectedMeasurements
    };
  }

  var selectedMeasurements = new epiviz.measurements.MeasurementSet();
  for (var i = 0; i < selectedRows.length; ++i) {
    selectedMeasurements.add(selectedRows[i]);
  }
  this._data.measurements = selectedMeasurements;

  return {
    data: this._data
  };
};

epiviz.ui.controls.MeaurementsWizardStep.prototype.title = function() {
  return 'Select Measurements';
};

