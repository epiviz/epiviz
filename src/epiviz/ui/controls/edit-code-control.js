/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 1/5/2015
 * Time: 5:53 PM
 */

goog.provide('epiviz.ui.controls.EditCodeControl');

/**
 * @param {jQuery} container
 * @param {string} [title]
 * @param {string} [id]
 * @param {Object} [targetObject]
 * @param {string} [defaultMethod]
 * @constructor
 * @extends {epiviz.ui.controls.CodeControl}
 */
epiviz.ui.controls.EditCodeControl = function(container, title, id, targetObject, defaultMethod) {
  // Call superclass constructor
  epiviz.ui.controls.CodeControl.call(this, container, title, id, targetObject);

  /**
   * @type {string}
   * @private
   */
  this._defaultMethod = defaultMethod;

  /**
   * @type {CodeMirror}
   * @private
   */
  this._editor = null;

  /**
   * @type {Object.<string, string>}
   * @private
   */
  this._methodsCode = {};

  /**
   * @type {string}
   * @private
   */
  this._selectedMethod = null;
};

/**
 * Copy methods from upper class
 */
epiviz.ui.controls.EditCodeControl.prototype = epiviz.utils.mapCopy(epiviz.ui.controls.CodeControl.prototype);
epiviz.ui.controls.EditCodeControl.constructor = epiviz.ui.controls.EditCodeControl;

epiviz.ui.controls.EditCodeControl.prototype.initialize = function() {
  if (this._editor) { return; }

  this._container.append(
    '<div><select class="obj-methods" style=""></select></div><br />' +
    '<div style="overflow-y: scroll; max-height: 500px;">' +
    '<textarea autofocus="autofocus" class="code-edit"></textarea>' +
    '</div>');

  this._methodsSelector = this._container.find('.obj-methods');
  var codeEditor = this._container.find('.code-edit');
  var methods = [];
  var obj = this._targetObj;
  for (var m in obj) {
    if ($.isFunction(obj[m])) {
      methods.push(m);
    }
  }
  methods.sort();
  for (var i = 0; i < methods.length; ++i) {
    m = methods[i];
    var selected = ((i == 0 && !this._defaultMethod) || this._defaultMethod == m);
    this._methodsSelector.append(sprintf('<option value="%s"%s>%s</option>',
      m, selected ? ' selected="selected"' : '', m));
    if (selected) {
      this._text = obj[m].toString();
      this._selectedMethod = m;
    }
  }

  var self = this;
  this._methodsSelector.change(function() {
    self._methodsCode[self._selectedMethod] = self._editor.getValue();

    var sel = $(this).val();
    var text = self._methodsCode[sel];
    if (!text) {
      text = self._targetObj[sel].toString();
      self._methodsCode[sel] = text;
    }
    self._text = text;
    if (self._editor) {
      self._editor.getDoc().setValue(self._text);
    } else {
      codeEditor.val(self._text);
    }
    self._selectedMethod = sel;
    //self._dialog.dialog('option', 'position', 'center');// TODO: Trigger an event so that the dialog can re-center
  });

  codeEditor.val(this._text);
  this._methodsSelector.selectmenu({
    style: 'popup',
    width: '150',
    maxHeight: '150',
    menuWidth: '150'
  });

  this._editor = CodeMirror.fromTextArea(this._container.find('.code-edit')[0], {
    lineNumbers: true,
    matchBrackets: true,
    continueComments: "Enter",
    extraKeys: {"Ctrl-Q": "toggleComment"},
    autofocus: true
  });
};

/**
 */
epiviz.ui.controls.EditCodeControl.prototype.save = function() {
  this._methodsCode[this._selectedMethod] = this._editor.getValue();
  this._text = this._editor.getValue();
};

/**
 */
epiviz.ui.controls.EditCodeControl.prototype.revert = function() {
  if (this._editor) {
    this._editor.setOption('value', this._text);
  }
};

/**
 * @returns {Object.<string, string>}
 */
epiviz.ui.controls.EditCodeControl.prototype.modifiedMethods = function() {
  /** @type {Object.<string, string>} */
  var modifiedMethods = {};
  for (var m in this._methodsCode) {
    if (!this._methodsCode.hasOwnProperty(m)) { continue; }
    if (this._methodsCode[m] != this._targetObj[m].toString()) {
      modifiedMethods[m] = this._methodsCode[m];
    }
  }
  return modifiedMethods;
};

/**
 * @returns {*}
 */
epiviz.ui.controls.EditCodeControl.prototype.result = function() { return this.modifiedMethods(); };
