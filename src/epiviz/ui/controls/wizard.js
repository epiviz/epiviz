/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 3/30/14
 * Time: 6:21 PM
 */

goog.provide('epiviz.ui.controls.Wizard');

/**
 * @param {string} title
 * @param {{finish: function(*)=, close: function()=}} handlers
 * @param {Array.<epiviz.ui.controls.Wizard.Step>} steps
 * @param {*} initialData
 * @param {string} [width]
 * @param {string} [height]
 * @param {boolean} [showTabs]
 * @constructor
 * @extends {epiviz.ui.controls.Dialog}
 */
epiviz.ui.controls.Wizard = function(title, handlers, steps, initialData, width, height, showTabs) {
  epiviz.ui.controls.Dialog.call(this, title, handlers);

  /**
   * @type {Array.<epiviz.ui.controls.Wizard.Step>}
   * @private
   */
  this._steps = steps;

  /**
   * @type {*}
   * @private
   */
  this._initialData = initialData;

  /**
   * @type {string=}
   * @private
   */
  this._width = width;

  /**
   * @type {string=}
   * @private
   */
  this._height = height;

  /**
   * @type {boolean}
   * @private
   */
  this._showTabs = showTabs || false;

  /**
   * @type {?jQuery}
   * @private
   */
  this._tabs = null;

  this._initialize();
};

/**
 * Copy methods from upper class
 */
epiviz.ui.controls.Wizard.prototype = epiviz.utils.mapCopy(epiviz.ui.controls.Dialog.prototype);
epiviz.ui.controls.Wizard.constructor = epiviz.ui.controls.Wizard;

/**
 * @private
 */
epiviz.ui.controls.Wizard.prototype._initialize = function() {
  var self = this;
  this._dialog = $('#' + this._id);
  this._dialog.append(
    '<div class="wizard-dialog">' +
      '<div class="wizard-tabs">' +
        '<ul class="wizard-tabs-title-list"></ul>' +
      '</div>' +
    '</div>');

  this._tabs = this._dialog.find('.wizard-tabs');

  /** @type {jQuery} */
  var titleList = this._tabs.find('.wizard-tabs-title-list');

  for (var i = 0; i < this._steps.length; ++i) {
    titleList.append(sprintf('<li><a href="#%s-tab-%s">%s</a></li>', this._id, i, this._steps[i].title()));
    this._tabs.append(sprintf('<div id="%s-tab-%s"></div>', this._id, i));
  }

  if (!this._showTabs) {
    titleList.css('visibility', 'hidden');
    titleList.css('position', 'absolute');
  }

  this._tabs.tabs({
    activate: function(e, ui) { self._tabActivate(ui); },
    disabled: epiviz.utils.range(this._steps.length - 1, 1)
  });

  this._dialog.dialog({
    autoOpen: false,
    resizable: true,
    width: this._width || undefined,
    height: this._height || undefined,
    buttons: {
      Back: function() {
        var selectedTabIndex = self._tabs.tabs('option', 'active');
        if (selectedTabIndex == 0) { return; }

        self._tabs.tabs('option', 'disabled', epiviz.utils.range(self._steps.length - selectedTabIndex, selectedTabIndex));
        self._tabs.tabs('option', 'active', selectedTabIndex - 1);
      },
      Next: function() {
        var selectedTabIndex = self._tabs.tabs('option', 'active');

        /** @type {{data: *=, error: string=}} */
        var result = self._steps[selectedTabIndex].next();

        if (result.error) {
          var errorDialog = new epiviz.ui.controls.MessageDialog('Error', { Ok: function() {} }, result.error, epiviz.ui.controls.MessageDialog.Icon.ERROR);
          errorDialog.show();
          return;
        }

        self._steps[selectedTabIndex+1].initialize($(sprintf('#%s-tab-%s', self._id, selectedTabIndex+1)), result.data);

        self._tabs.tabs('option', 'disabled', epiviz.utils.range(self._steps.length - selectedTabIndex - 2, selectedTabIndex + 2));
        self._tabs.tabs('option', 'active', selectedTabIndex + 1);
      },
      Finish: function() {
        /** @type {{data: *=, error: string=}} */
        var result = self._steps[self._steps.length - 1].next();

        if (result.error) {
          var errorDialog = new epiviz.ui.controls.MessageDialog('Error', { Ok: function() {} }, result.error, epiviz.ui.controls.MessageDialog.Icon.ERROR);
          errorDialog.show();
          return;
        }

        if (self._handlers.finish) {
          self._handlers.finish(result.data);
        }

        $(this).dialog('close');
      },
      Cancel: function() {
        if (self._handlers.close) {
          self._handlers.close();
        }
        $(this).dialog('close');
      }
    },
    modal: true
  });

  if (this._steps.length > 1) {
    this._dialog.parent().find('button:contains("Finish")').button('disable');
    this._dialog.parent().find('button:contains("Next")').button('enable');
  } else {
    this._dialog.parent().find('button:contains("Finish")').button('enable');
    this._dialog.parent().find('button:contains("Next")').button('disable');
  }
  this._steps[0].initialize($(sprintf('#%s-tab-0', self._id)), this._initialData);
};

/**
 * @param ui
 * @private
 */
epiviz.ui.controls.Wizard.prototype._tabActivate = function(ui) {
  var selectedTabIndex = this._tabs.tabs('option', 'active');
  var finishButton = this._dialog.parent().find('button:contains("Finish")');
  var nextButton = this._dialog.parent().find('button:contains("Next")');

  if (selectedTabIndex == this._steps.length - 1) {
    nextButton.button('disable');
    finishButton.button('enable');
  } else {
    nextButton.button('enable');
    finishButton.button('disable');
  }

  this._tabs.tabs('option', 'disabled', epiviz.utils.range(this._steps.length - selectedTabIndex - 1, selectedTabIndex + 1));
};

/**
 */
epiviz.ui.controls.Wizard.prototype.show = function() {
  var self = this;

  this._dialog.dialog('open');
  this._dialog.dialog('option', 'position', 'center');

  // This makes the dialog only able to open once:
  this._dialog.dialog({
    close: function(event, ui) {
      $(this).remove();
      self._dialog = null;
    }
  });
};

goog.provide('epiviz.ui.controls.Wizard.Step');

/**
 * @interface
 * @template I, O
 */
epiviz.ui.controls.Wizard.Step = function() {};

/**
 * @param {jQuery} container
 * @param {I} [data]
 */
epiviz.ui.controls.Wizard.Step.prototype.initialize = function(container, data) {};

/**
 * Gets the data resulted from manipulation of this wizard step, or, if
 * there is an error, error contains the details of the error that occurred.
 * @returns {{data: O=, error: string=}}
 */
epiviz.ui.controls.Wizard.Step.prototype.next = function() {};

/**
 * @returns {string}
 */
epiviz.ui.controls.Wizard.Step.prototype.title = function() {};
