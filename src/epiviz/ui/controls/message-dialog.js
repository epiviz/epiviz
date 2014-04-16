/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 2/16/14
 * Time: 4:22 PM
 */

goog.provide('epiviz.ui.controls.MessageDialog');

/**
 * @param {string} title
 * @param {string} message
 * @param {Object.<string, function>} handlers
 * @param {epiviz.ui.controls.MessageDialog.Icon} [icon]
 * @constructor
 * @extends {epiviz.ui.controls.Dialog}
 */
epiviz.ui.controls.MessageDialog = function(title, handlers, message, icon) {
  epiviz.ui.controls.Dialog.call(this, title, handlers);

  /**
   * @type {string}
   * @private
   */
  this._message = message;

  /**
   * @type {epiviz.ui.controls.MessageDialog.Icon}
   * @private
   */
  this._icon = icon || epiviz.ui.controls.MessageDialog.Icon.INFO;
};

/**
 * Copy methods from upper class
 */
epiviz.ui.controls.MessageDialog.prototype = epiviz.utils.mapCopy(epiviz.ui.controls.Dialog.prototype);
epiviz.ui.controls.MessageDialog.constructor = epiviz.ui.controls.MessageDialog;

/**
 * @enum {string}
 */
epiviz.ui.controls.MessageDialog.Icon = {
  INFO: 'info',
  ERROR: 'error',
  QUESTION: 'question'
};

/**
 */
epiviz.ui.controls.MessageDialog.prototype.show = function() {
  epiviz.ui.controls.Dialog.prototype.show.call(this);

  var Icon = epiviz.ui.controls.MessageDialog.Icon;

  if (!this._dialog) {
    var self = this;
    this._dialog = $('#' + this._id);
    this._dialog.css('display', 'inline');

    var state = this._icon == Icon.ERROR ? 'error' : 'highlight';
    var icon = this._icon == Icon.ERROR ? 'alert' : 'info';
    this._dialog.append(sprintf(
      '<div class="ui-state-%s ui-corner-all" style="margin: 5px; padding: 5px; height: auto;">' +
        '<div class="ui-icon ui-icon-%s" style="float: left; margin-right: 5px;"></div>' +
        '<div class="dialog-text">%s</div>' +
      '</div>', state, icon, this._message));

    var buttons = {};
    for (var buttonName in this._handlers) {
      if (!this._handlers.hasOwnProperty(buttonName)) { continue; }
      (function(buttonName) {
        buttons[buttonName] = function() {
          self._handlers[buttonName]();
          $(this).dialog('close');
        };
      })(buttonName);
    }

    this._dialog.dialog({
      autoOpen: false,
      resizable: false,
      //width: '600',
      buttons: buttons,
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
