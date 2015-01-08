/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 2/16/14
 * Time: 4:22 PM
 */

goog.provide('epiviz.ui.controls.CodeDialog');

/**
 * @param {string} title
 * @param {{save: function(Object.<string, string>), cancel: function()}} handlers
 * @param {Array.<function(jQuery): epiviz.ui.controls.CodeControl>} controlCreators
 * @constructor
 * @extends {epiviz.ui.controls.Dialog}
 */
epiviz.ui.controls.CodeDialog = function(title, handlers, controlCreators) {
  epiviz.ui.controls.Dialog.call(this, title, handlers);

  /**
   * @type {Array.<function(jQuery): epiviz.ui.controls.CodeControl>}
   * @private
   */
  this._controlCreators = controlCreators;

  this._dialog = $('#' + this._id);

  /**
   * @type {Array.<epiviz.ui.controls.CodeControl>}
   * @private
   */
  this._controls = [];

  var self = this;
  this._dialog.append('<div class="code-tabs"><ul></ul></div>');
  var codeTabs = this._dialog.find('.code-tabs');
  var codeTabsList = codeTabs.find('ul');
  this._controlCreators.forEach(function(creator, i) {
    var id = self._id + '-code-tab-' + i;
    codeTabs.append(sprintf('<div id="%s"></div>', id));
    var tab = codeTabs.find('#' + id);
    var control = creator(tab);

    codeTabsList.append(sprintf('<li><a href="#%s">%s</a></li>', id, control.title()))
    self._controls.push(control);
  });



  codeTabs.tabs({
    activate: function(e, ui) { self._tabActivate(codeTabs); }
  });

  this._dialog.dialog({
    autoOpen: false,
    resizable: false,
    width: '800',
    buttons: {
      Save: function() {
        var results = [];
        self._controls.forEach(function(control) {
          control.save();
          results.push(control.result());
        });
        self._handlers.save(results);
        $(this).dialog('close');
      },
      Cancel: function() {
        self._controls.forEach(function(control) {
          control.revert();
        });
        self._handlers.cancel();
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
epiviz.ui.controls.CodeDialog.prototype = epiviz.utils.mapCopy(epiviz.ui.controls.Dialog.prototype);
epiviz.ui.controls.CodeDialog.constructor = epiviz.ui.controls.CodeDialog;

/**
 */
epiviz.ui.controls.CodeDialog.prototype.show = function() {
  epiviz.ui.controls.Dialog.prototype.show.call(this);

  this._dialog.dialog('open');

  this._controls[0].initialize();
  this._dialog.dialog('option', 'position', 'center');
};

/**
 * @param tabs
 * @private
 */
epiviz.ui.controls.CodeDialog.prototype._tabActivate = function(tabs) {
  var selectedTabIndex = tabs.tabs('option', 'active');

  this._controls[selectedTabIndex].initialize();
  this._dialog.dialog('option', 'position', 'center');
};
