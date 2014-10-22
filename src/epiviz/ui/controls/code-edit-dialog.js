/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 2/16/14
 * Time: 4:22 PM
 */

goog.provide('epiviz.ui.controls.CodeEditDialog');

/**
 * @param {string} title
 * @param {{save: function(Object.<string, string>), cancel: function()}} handlers
 * @param {Object} obj
 * @param {string} [defaultMethod]
 * @constructor
 * @extends {epiviz.ui.controls.Dialog}
 */
epiviz.ui.controls.CodeEditDialog = function(title, handlers, obj, defaultMethod) {
  epiviz.ui.controls.Dialog.call(this, title, handlers);

  /** @type {CodeMirror} */
  this._editor = null;
  this._dialog = $('#' + this._id);

  /** @type {string} */
  this._text = '// TODO: Your code here\n';

  /**
   * @type {Object.<string, string>}
   * @private
   */
  this._methodsCode = {};

  /**
   * @type {Object}
   * @private
   */
  this._targetObj = obj;

  /**
   * @type {string}
   * @private
   */
  this._selectedMethod = null;

  this._dialog.append(
    '<div><select class="obj-methods" style=""></select></div><br />' +
    '<div style="overflow-y: scroll; max-height: 500px;">' +
      '<textarea autofocus="autofocus" class="code-edit"></textarea>' +
    '</div>');

  this._methodsSelector = this._dialog.find('.obj-methods');
  var codeEditor = this._dialog.find('.code-edit');
  var methods = [];
  for (var m in obj) {
    if ($.isFunction(obj[m])) {
      methods.push(m);
    }
  }
  methods.sort();
  for (var i = 0; i < methods.length; ++i) {
    m = methods[i];
    var selected = ((i == 0 && !defaultMethod) || defaultMethod == m);
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
    self._dialog.dialog('option', 'position', 'center');
  });

  codeEditor.val(this._text);
  this._methodsSelector.selectmenu({
    style: 'popup',
    width: '150',
    maxHeight: '150',
    menuWidth: '150'
  });

  this._dialog.dialog({
    autoOpen: false,
    resizable: false,
    width: '800',
    buttons: {
      Save: function() {
        self._methodsCode[self._selectedMethod] = self._editor.getValue();
        self._text = self._editor.getValue();

        /** @type {Object.<string, string>} */
        var modifiedMethods = {};
        for (var m in self._methodsCode) {
          if (!self._methodsCode.hasOwnProperty(m)) { continue; }
          if (self._methodsCode[m] != self._targetObj[m].toString()) {
            modifiedMethods[m] = self._methodsCode[m];
          }
        }

        self._handlers.save(modifiedMethods);
        $(this).dialog('close');
      },
      Cancel: function() {
        if (self._editor) {
          self._editor.setOption('value', self._text);
        }
        $(this).dialog('close');
      }
    },
    modal: true
  });

  this._dialog.dialog('option', 'position', 'center');
};

/**
 * Copy methods from upper class
 */
epiviz.ui.controls.CodeEditDialog.prototype = epiviz.utils.mapCopy(epiviz.ui.controls.Dialog.prototype);
epiviz.ui.controls.CodeEditDialog.constructor = epiviz.ui.controls.CodeEditDialog;

/**
 */
epiviz.ui.controls.CodeEditDialog.prototype.show = function() {
  epiviz.ui.controls.Dialog.prototype.show.call(this);

  this._dialog.dialog('open');

  if (!this._editor) {
    this._editor = CodeMirror.fromTextArea(this._dialog.find('.code-edit')[0], {
      lineNumbers: true,
      matchBrackets: true,
      continueComments: "Enter",
      extraKeys: {"Ctrl-Q": "toggleComment"},
      autofocus: true
    });
    this._dialog.dialog('option', 'position', 'center');
  }
};
