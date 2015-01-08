/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 1/7/2015
 * Time: 2:01 PM
 */

goog.provide('epiviz.ui.controls.FilterCodeControl');

/**
 * @param {jQuery} container
 * @param {string} [title]
 * @param {string} [id]
 * @param {Object} [targetObject]
 * @param {string} [preFilterText]
 * @param {string} [filterText]
 * @constructor
 * @extends {epiviz.ui.controls.CodeControl}
 */
epiviz.ui.controls.FilterCodeControl = function(container, title, id, targetObject, preFilterText, filterText) {
  // Call superclass constructor
  epiviz.ui.controls.CodeControl.call(this, container, title, id, targetObject);

  /**
   * @type {CodeMirror}
   * @private
   */
  this._preFilterEditor = null;

  /**
   * @type {CodeMirror}
   * @private
   */
  this._filterEditor = null;

  /**
   * @type {string}
   * @private
   */
  this._preFilterText = preFilterText ||
    '/**\n' +
    ' * This method is called once before every draw, for all data available to the visualization,\n' +
    ' * for initialization. Its result can be used inside the filter method.\n' +
    ' * @param {epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>} [data]\n' +
    ' * @returns {T}\n' +
    ' * @template T\n' +
    ' */\n' +
    'function(data) {\n' +
    '  // TODO: Your code here\n' +
    '  return null;\n' +
    '}\n';

  /**
   * @type {string}
   * @private
   */
  this._filterText = filterText ||
    '/**\n' +
    ' * This method is called for every data object. If it returns false, the object will not be drawn.\n' +
    ' * @param {epiviz.datatypes.GenomicDataMeasurementWrapper.ValueItem} [item]\n' +
    ' * @param {epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>} [data]\n' +
    ' * @param {T} [preMarkResult]\n' +
    ' * @returns {boolean}\n' +
    ' * @template T\n' +
    ' */\n' +
    'function(item, data, preMarkResult) {\n' +
    '  // TODO: Your code here\n' +
    '  return true;\n' +
    '}\n';
};

/**
 * Copy methods from upper class
 */
epiviz.ui.controls.FilterCodeControl.prototype = epiviz.utils.mapCopy(epiviz.ui.controls.CodeControl.prototype);
epiviz.ui.controls.FilterCodeControl.constructor = epiviz.ui.controls.FilterCodeControl;

epiviz.ui.controls.FilterCodeControl.prototype.initialize = function() {
  if (this._preFilterEditor) { return; }

  this._container.append(
    '<div><label><b>Pre-Filter Method</b></label></div><br />' +
    '<div style="overflow-y: scroll; max-height: 250px;">' +
      '<textarea autofocus="autofocus" class="pre-filter-code"></textarea>' +
    '</div><br/>' +
    '<div><label><b>Filter Method</b></label></div><br/>' +
    '<div style="overflow-y: scroll; max-height: 250px;">' +
      '<textarea autofocus="autofocus" class="filter-code"></textarea>' +
    '</div>');

  // TODO: Also a check box to choose whether to apply the filter or not, and disable (?) the code editors

  var preFilterCodeEditor = this._container.find('.pre-filter-code');
  preFilterCodeEditor.val(this._preFilterText);

  var filterCodeEditor = this._container.find('.filter-code');
  filterCodeEditor.val(this._filterText);

  this._preFilterEditor = CodeMirror.fromTextArea(preFilterCodeEditor[0], {
    lineNumbers: true,
    matchBrackets: true,
    continueComments: "Enter",
    extraKeys: {"Ctrl-Q": "toggleComment"},
    autofocus: true
  });

  this._filterEditor = CodeMirror.fromTextArea(filterCodeEditor[0], {
    lineNumbers: true,
    matchBrackets: true,
    continueComments: "Enter",
    extraKeys: {"Ctrl-Q": "toggleComment"},
    autofocus: true
  });
};

/**
 */
epiviz.ui.controls.FilterCodeControl.prototype.save = function() {
  this._preFilterText = this._preFilterEditor.getValue();
  this._filterText = this._filterEditor.getValue();
};

/**
 */
epiviz.ui.controls.FilterCodeControl.prototype.revert = function() {
  if (this._preFilterEditor) {
    this._preFilterEditor.setOption('value', this._preFilterText);
  }

  if (this._filterEditor) {
    this._filterEditor.setOption('value', this._filterText);
  }
};

/**
 * @returns {{preFilter: string, filter: string}}
 */
epiviz.ui.controls.FilterCodeControl.prototype.result = function() {
  return {
    preFilter: this._preFilterText,
    filter: this._filterText
  }
};

