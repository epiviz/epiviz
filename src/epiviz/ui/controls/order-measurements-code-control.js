/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 1/11/2015
 * Time: 10:09 PM
 */

goog.provide('epiviz.ui.controls.OrderMeasurementsCodeControl');

/**
 * @param {jQuery} container
 * @param {string} [title]
 * @param {string} [id]
 * @param {Object} [targetObject]
 * @param {string} [orderMethodText]
 * @param {boolean} [enabled]
 * @constructor
 * @extends {epiviz.ui.controls.CodeControl}
 */
epiviz.ui.controls.OrderMeasurementsCodeControl = function(container, title, id, targetObject, orderMethodText, enabled) {
  // Call superclass constructor
  epiviz.ui.controls.CodeControl.call(this, container, title, id, targetObject);

  /**
   * @type {CodeMirror}
   * @private
   */
  this._editor = null;

  /**
   * @type {string}
   * @private
   */
  this._editorText = orderMethodText ||
    '/**\n' +
    ' * @param {epiviz.measurements.Measurement} m1\n' +
    ' * @param {epiviz.measurements.Measurement} m2\n' +
    ' * @returns {number}\n' +
    ' */\n' +
    'function(m1, m2) {\n' +
    '  // TODO: Your code here\n' +
    '  return 0;\n' +
    '}\n';

  /**
   * @type {boolean}
   * @private
   */
  this._enabled = enabled || false;
};

/**
 * Copy methods from upper class
 */
epiviz.ui.controls.OrderMeasurementsCodeControl.prototype = epiviz.utils.mapCopy(epiviz.ui.controls.CodeControl.prototype);
epiviz.ui.controls.OrderMeasurementsCodeControl.constructor = epiviz.ui.controls.OrderMeasurementsCodeControl;

epiviz.ui.controls.OrderMeasurementsCodeControl.prototype.initialize = function() {
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
    '<div><label><b>Order Measurements Method</b></label></div><br />' +
    '<div style="overflow-y: scroll; max-height: 500px;">' +
    '<textarea autofocus="autofocus" class="editor-code"></textarea>' +
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

  var editor = this._container.find('.editor-code');
  editor.val(this._editorText);

  this._editor = CodeMirror.fromTextArea(editor[0], {
    lineNumbers: true,
    matchBrackets: true,
    continueComments: "Enter",
    extraKeys: {"Ctrl-Q": "toggleComment"},
    autofocus: true
  });
  this._editor.setOption('disableInput', !this._enabled);
};

/**
 */
epiviz.ui.controls.OrderMeasurementsCodeControl.prototype.save = function() {
  if (!this._editor) { return; }
  this._editorText = this._editor.getValue();
};

/**
 */
epiviz.ui.controls.OrderMeasurementsCodeControl.prototype.revert = function() {
  if (this._editor) {
    this._editor.setOption('value', this._editorText);
  }
};

/**
 * @returns {{enabled: boolean, orderMethodText: string}}
 */
epiviz.ui.controls.OrderMeasurementsCodeControl.prototype.result = function() {
  return {
    enabled: this._enabled,
    orderMethodText: this._enabled ? this._editorText : null
  }
};
