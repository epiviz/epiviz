/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 1/7/2015
 * Time: 2:01 PM
 */

goog.provide('epiviz.ui.controls.MarkerCodeControl');

/**
 * @param {jQuery} container
 * @param {string} [title]
 * @param {string} [id]
 * @param {Object} [targetObject]
 * @param {string} [preFilterText]
 * @param {string} [filterText]
 * @param {boolean} [enabled]
 * @constructor
 * @extends {epiviz.ui.controls.CodeControl}
 */
epiviz.ui.controls.MarkerCodeControl = function(container, title, id, targetObject, preFilterText, filterText, enabled) {
  // Call superclass constructor
  epiviz.ui.controls.CodeControl.call(this, container, title, id, targetObject);

  /**
   * @type {CodeMirror}
   * @private
   */
  this._editor = null;

  /**
   * @type {CodeMirror}
   * @private
   */
  this._markEditor = null;

  /**
   * @type {string}
   * @private
   */
  this._editorText = preFilterText;

  /**
   * @type {string}
   * @private
   */
  this._markText = filterText;

  /**
   * @type {boolean}
   * @private
   */
  this._enabled = enabled || false;
};

/**
 * Copy methods from upper class
 */
epiviz.ui.controls.MarkerCodeControl.prototype = epiviz.utils.mapCopy(epiviz.ui.controls.CodeControl.prototype);
epiviz.ui.controls.MarkerCodeControl.constructor = epiviz.ui.controls.MarkerCodeControl;

epiviz.ui.controls.MarkerCodeControl.prototype.initialize = function() {
  if (this._editor) { return; }

  this._container.append(
    sprintf(
      '<div id="%1$s">' +
      '<label for="%1$s-true">On</label>' +
      '<input type="radio" id="%1$s-true" name="%1$s" %2$s />' +
      '<label for="%1$s-false">Off</label>' +
      '<input type="radio" id="%1$s-false" name="%1$s" %3$s />' +
      '</div>', this.id() + '-switch', this._enabled ? 'checked="checked"' : '',
      this._enabled ? '' : 'checked="checked"') +
    '<br />' +
    '<div><label><b>Pre-mark Method</b></label></div><br />' +
    '<div style="overflow-y: scroll; max-height: 250px;">' +
      '<textarea autofocus="autofocus" class="pre-filter-code"></textarea>' +
    '</div><br/>' +
    '<div><label><b>Mark Method</b></label></div><br/>' +
    '<div style="overflow-y: scroll; max-height: 250px;">' +
      '<textarea autofocus="autofocus" class="filter-code"></textarea>' +
    '</div>');

  var onOffSwitch = this._container.find('#' + this.id() + '-switch');
  onOffSwitch.buttonset();
  var self = this;
  var optionChange = function(e) {
    var optionChecked = $('#' + self.id() + '-switch :radio:checked').attr('id');
    var newValue = optionChecked.substr(optionChecked.lastIndexOf('-')+1) == 'true';
    if (self._editor) { self._editor.setOption('disableInput', !newValue); }
    if (self._markEditor) { self._markEditor.setOption('disableInput', !newValue);}
    self._enabled = newValue;
  };
  onOffSwitch.find('#' + this.id() + '-switch-true').on('change', optionChange);
  onOffSwitch.find('#' + this.id() + '-switch-false').on('change', optionChange);

  var preFilterCodeEditor = this._container.find('.pre-filter-code');
  preFilterCodeEditor.val(this._editorText);

  var filterCodeEditor = this._container.find('.filter-code');
  filterCodeEditor.val(this._markText);

  this._editor = CodeMirror.fromTextArea(preFilterCodeEditor[0], {
    lineNumbers: true,
    matchBrackets: true,
    continueComments: "Enter",
    extraKeys: {"Ctrl-Q": "toggleComment"},
    autofocus: true
  });
  this._editor.setOption('disableInput', !this._enabled);

  this._markEditor = CodeMirror.fromTextArea(filterCodeEditor[0], {
    lineNumbers: true,
    matchBrackets: true,
    continueComments: "Enter",
    extraKeys: {"Ctrl-Q": "toggleComment"},
    autofocus: true
  });
  this._markEditor.setOption('disableInput', !this._enabled);
};

/**
 */
epiviz.ui.controls.MarkerCodeControl.prototype.save = function() {
  if (!this._editor) { return; }
  this._editorText = this._editor.getValue();
  this._markText = this._markEditor.getValue();
};

/**
 */
epiviz.ui.controls.MarkerCodeControl.prototype.revert = function() {
  if (this._editor) {
    this._editor.setOption('value', this._editorText);
  }

  if (this._markEditor) {
    this._markEditor.setOption('value', this._markText);
  }
};

/**
 * @returns {{enabled: boolean, preMark: string, mark: string}}
 */
epiviz.ui.controls.MarkerCodeControl.prototype.result = function() {
  return {
    enabled: this._enabled,
    preMark: this._enabled ? this._editorText : null,
    mark: this._enabled ? this._markText : null
  }
};

