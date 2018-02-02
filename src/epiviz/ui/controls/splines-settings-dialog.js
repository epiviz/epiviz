/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 3/29/14
 * Time: 4:36 PM
 */

goog.provide('epiviz.ui.controls.SplinesSettingsDialog');

goog.require('epiviz.ui.controls.Dialog');
goog.require('epiviz.utils');
goog.require('epiviz.ui.charts.CustomSetting');
goog.require('epiviz.ui.controls.MessageDialog');

/**
 * @param {string} title
 * @param {{ok: function(Object.<string, *>), cancel: function()}} handlers
 * @constructor
 * @extends {epiviz.ui.controls.Dialog}
 */
epiviz.ui.controls.SplinesSettingsDialog = function(title, handlers) {
  epiviz.ui.controls.Dialog.call(this, title, handlers);
};

/**
 * Copy methods from upper class
 */
epiviz.ui.controls.SplinesSettingsDialog.prototype = epiviz.utils.mapCopy(epiviz.ui.controls.Dialog.prototype);
epiviz.ui.controls.SplinesSettingsDialog.constructor = epiviz.ui.controls.SplinesSettingsDialog;

/**
 */
epiviz.ui.controls.SplinesSettingsDialog.prototype.show = function() {
  epiviz.ui.controls.Dialog.prototype.show.call(this);

  if (!this._dialog) {
    var self = this;
    this._dialog = $('#' + this._id);
    this._dialog.css('display', 'inline');

    var i, inputId, input, value;
    var content = '<div id="splinesSettings" title="metavizr/splines Settings">' +
    '<form id="splinesForm">' + 
    '<label for="alpha">Alpha : </label>' +
    '<input id="alpha" name="alpha" type="number">' +
    '</form>' +
    '</div>';

    content = sprintf('<div style="margin: 5px; padding: 5px; height: auto;"><table style="width: 100%%;">%s</table></div>', content);

    this._dialog.append(content);

    this._dialog.dialog({
      autoOpen: false,
      resizable: false,
      //width: '600',
      buttons: {
        Ok: function() {

          // get form values
          var values = {};
          values["alpha"] = $("#alpha").val();

          self._handlers.ok({ splines: values});
          $(this).dialog('close');
        },
        Cancel: function() {
          self._handlers.cancel();
          $(this).dialog('close');
        }
      },
      modal: true
    });

    // This makes the dialog only able to open once:
    this._dialog.dialog({
      close: function(event, ui) {
        $(this).remove();
        self._dialog = null;
      }
    });
  }

  this._dialog.dialog('open');

  this._dialog.dialog('option', 'position', 'center');
};
