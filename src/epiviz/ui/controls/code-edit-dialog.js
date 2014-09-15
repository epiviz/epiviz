/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 2/16/14
 * Time: 4:22 PM
 */

goog.provide('epiviz.ui.controls.CodeEditDialog');

/**
 * @param {string} title
 * @param {{save: function(string), cancel: function()}} handlers
 * @constructor
 * @extends {epiviz.ui.controls.Dialog}
 */
epiviz.ui.controls.CodeEditDialog = function(title, handlers) {
  epiviz.ui.controls.Dialog.call(this, title, handlers);

  /** @type {CodeMirror} */
  this._editor = null;
  this._dialog = $('#' + this._id);

  /** @type {string} */
  this._text = '// TODO: Your code here\n' +
    '// Use the variable "self" to refer the current chart\n' +
    'var initialChartDraw = self.draw;\n\n' +
    '/**\n' +
    ' * @param {epiviz.datatypes.GenomicRange} [range]\n' +
    ' * @param {epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>} [data]\n' +
    ' * @returns {Array.<epiviz.ui.charts.UiObject>} The objects drawn\n' +
    ' */\n' +
    'self.draw = function(range, data) {\n' +
    '  // Example:\n' +
    '  // self._svg.selectAll(".my-circle").remove();\n' +
    '  // self._svg.append("circle").attr("class", "my-circle").attr("cx", 200).attr("cy", 30).attr("r", 10).attr("fill", "#feac07");\n' +
    '  var ret = initialChartDraw.call(self, range, data);\n' +
    '  self.draw = initialChartDraw;\n' +
    '  return ret;\n' +
    '}\n';

  var self = this;
  this._dialog.append(sprintf(
    '<div><textarea autofocus="autofocus" class="code-edit">' +
      self._text +
      '</textarea></div>'
  ));

  this._dialog.dialog({
    autoOpen: false,
    resizable: true,
    width: '800',
    buttons: {
      Save: function() {
        var codeText = '';
        if (self._editor) {
          codeText = self._editor.getValue();
          self._text = codeText;
        }
        self._handlers.save(codeText);
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
  }
};
