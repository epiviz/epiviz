/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 2/17/14
 * Time: 12:15 PM
 */

goog.provide('epiviz.ui.controls.ColorPickerDialog');

/**
 * @param {{ok: function(Array.<{name: string, color: string}>), cancel: function(), reset: function()}} handlers
 * @param {Array.<{name: string, color: string}>} colors A map of measurement name and corresponding color
 * @constructor
 * @extends {epiviz.ui.controls.Dialog}
 */
epiviz.ui.controls.ColorPickerDialog = function(handlers, colors) {
  epiviz.ui.controls.Dialog.call(this, 'Pick Colors', handlers);

  this._dialog = $('#' + this._id);

  this._dialog.append(
    '<div class="color-picker-form" action="" style="width: 420px;">' +
      '<div class="chart-picker" style="float: right;"></div>' +
    '</div>');

  /**
   * @type {Array.<{name: string, color: string}>}
   * @private
   */
  this._initialColors = colors;

  /**
   * @type {Array.<{name: string, color: string}>}
   * @private
   */
  this._colors = colors;

  var colorPickerForm = this._dialog.find('.color-picker-form');
  var tableContent = '';
  for (var i = 0; i < this._colors.length; ++i) {
    var inputClass = sprintf('color-%s', i);
    tableContent += sprintf(
      '<tr>' +
        '<td><label>%s:&nbsp;</label></td>' +
        '<td><input type="text" name="%s" class="colorwell %s" value="%s" /></td>' +
      '</tr>',
      colors[i].name, inputClass, inputClass, this._colors[i].color);
  }
  colorPickerForm.append(sprintf('<table class="color-picker-table">%s</table>', tableContent));

  var f = epiviz.utils.farbtastic(sprintf('#%s .chart-picker', this._id));
  var p = $(sprintf('#%s .chart-picker', this._id)).css('opacity', 0.25);
  var selected;
  $(sprintf('#%s .colorwell', this._id))
    .each(function () { f.linkTo(this); $(this).css('opacity', 0.75); })
    .focus(function() {
      if (selected) {
        $(selected).css('opacity', 0.75).removeClass('colorwell-selected');
      }
      f.linkTo(this);
      p.css('opacity', 1);
      $(selected = this).css('opacity', 1).addClass('colorwell-selected');
    });

  var self = this;
  //this._dialog.css('display', 'inline');

  this._dialog.dialog({
    autoOpen: false,
    resizable: false,
    width: '440',
    buttons: {
      Ok: function() {
        var inputs = colorPickerForm.find('.colorwell');

        for (var i = 0; i < inputs.length; ++i) {
          self._colors[i].color = inputs[i].value;
        }

        self._handlers.ok(self._colors);
        $(this).dialog('close');
      },
      Cancel: function() {
        self._handlers.cancel();
        $(this).dialog('close');
      },
      Reset: function() {
        self._colors = self._initialColors;

        for (var i = 0; i < self._colors.length; ++i) {
          var inputClass = sprintf('.color-%s', i);

          // First, connect farbtastic to this input
          f.linkTo($(sprintf('#%s %s', self._id, inputClass)));

          // Use farbtastic to modify this input
          f.setColor(self._colors[i].color);

          ++i;
        }

        // Reconnect farbtastic to the selected input
        // so that it receives focus once again
        if (selected) {f.linkTo(selected); }

        self._handlers.reset();
      }
    },
    modal: true
  });
};

/**
 * Copy methods from upper class
 */
epiviz.ui.controls.ColorPickerDialog.prototype = epiviz.utils.mapCopy(epiviz.ui.controls.Dialog.prototype);
epiviz.ui.controls.ColorPickerDialog.constructor = epiviz.ui.controls.ColorPickerDialog;

/**
 */
epiviz.ui.controls.ColorPickerDialog.prototype.show = function() {
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
      }
    });
  }
};
