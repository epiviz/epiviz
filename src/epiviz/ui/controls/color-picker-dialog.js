/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 2/17/14
 * Time: 12:15 PM
 */

goog.provide('epiviz.ui.controls.ColorPickerDialog');

/**
 * @param {{ok: function(epiviz.ui.charts.ColorPalette), cancel: function(), reset: function()}} handlers
 * @param {Array.<string>} names A list of measurement names
 * @param {Array.<epiviz.ui.charts.ColorPalette>} palettes
 * @param {epiviz.ui.charts.ColorPalette} selectedPalette
 * @constructor
 * @extends {epiviz.ui.controls.Dialog}
 */
epiviz.ui.controls.ColorPickerDialog = function(handlers, names, palettes, selectedPalette) {
  epiviz.ui.controls.Dialog.call(this, 'Pick Colors', handlers);

  this._dialog = $('#' + this._id);

  this._dialog.append(
    '<div class="color-picker-form" action="" style="width: 420px;">' +
      '<div class="chart-picker" style="float: right;"></div>' +
    '</div>');

  var colorPickerForm = this._dialog.find('.color-picker-form');
  var tableContent = '';
  for (var i = 0; i < names.length; ++i) {
    var inputClass = sprintf('color-%s', i);
    tableContent += sprintf(
      '<tr>' +
        '<td><label>%s:&nbsp;</label></td>' +
        '<td><input type="text" name="%s" class="colorwell %s" value="%s" /></td>' +
      '</tr>',
      names[i], inputClass, inputClass, selectedPalette.get(i));
  }
  colorPickerForm.append(sprintf('<table class="color-picker-table">%s</table>', tableContent));

  var f = $.farbtastic(sprintf('#%s .chart-picker', this._id));
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

  colorPickerForm.append('<select class="palettes-selector"></select>');
  var palettesSelector = colorPickerForm.find('.palettes-selector');
  var palettesMap = {};
  if (palettes) {
    palettes.forEach(function(palette) {
      palettesSelector.append(sprintf('<option value="%s"%s>%s</option>',
        palette.id(), palette.id() == selectedPalette.id() ? ' selected="selected"' : '', palette.name()));
      palettesMap[palette.id()] = palette;
    });
  }
  if (!(selectedPalette.id() in palettesMap)) {
    palettesSelector.prepend(sprintf('<option value="%s" selected="selected">%s</option>',
      selectedPalette.id(), selectedPalette.name()));
    palettesMap[selectedPalette.id()] = selectedPalette;
  }
  palettesSelector.selectmenu({
    style: 'popup',
    width: '200',
    maxHeight: '150',
    menuWidth: '200'
  });

  var updateColorFields = function() {
    var inputs = colorPickerForm.find('.colorwell');
    for (var i = 0; i < inputs.length; ++i) {
      var input = inputs[i];

      // First, connect farbtastic to this input
      f.linkTo($(input));

      // Use farbtastic to modify this input
      f.setColor(selectedPalette.get(i));
    }

    // Reconnect farbtastic to the selected input
    // so that it receives focus once again
    if (selected) {f.linkTo(selected); }
  };

  palettesSelector.change(function() {
    selectedPalette = palettesMap[$(this).val()];
    updateColorFields();
  });

  var self = this;

  this._dialog.dialog({
    autoOpen: false,
    resizable: false,
    width: '440',
    buttons: {
      Ok: function() {
        var inputs = colorPickerForm.find('.colorwell');

        var paletteChanged = false;
        var colors = [];
        for (var i = 0; i < inputs.length; ++i) {
          colors.push(inputs[i].value);
          if (colors[i] != selectedPalette.get(i)) {
            paletteChanged = true;
          }
        }

        if (paletteChanged) { selectedPalette = new epiviz.ui.charts.ColorPalette(colors); }
        self._handlers.ok(selectedPalette);

        $(this).dialog('close');
      },
      Cancel: function() {
        self._handlers.cancel();
        $(this).dialog('close');
      },
      Reset: function() {
        updateColorFields();

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
