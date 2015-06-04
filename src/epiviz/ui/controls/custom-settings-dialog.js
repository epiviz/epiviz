/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 3/29/14
 * Time: 4:36 PM
 */

goog.provide('epiviz.ui.controls.CustomSettingsDialog');

/**
 * @param {string} title
 * @param {{ok: function(Object.<string, *>), cancel: function()}} handlers
 * @param {Array.<epiviz.ui.charts.CustomSetting>} customSettingsDefs
 * @param {Object.<string, *>} customSettingsValues
 * @constructor
 * @extends {epiviz.ui.controls.Dialog}
 */
epiviz.ui.controls.CustomSettingsDialog = function(title, handlers, customSettingsDefs, customSettingsValues) {
  epiviz.ui.controls.Dialog.call(this, title, handlers);

  /**
   * @type {Array.<epiviz.ui.charts.CustomSetting>}
   * @private
   */
  this._customSettingsDefs = customSettingsDefs;

  /**
   * @type {Object.<string, *>}
   * @private
   */
  this._customSettingsValues = epiviz.utils.mapCopy(customSettingsValues);
};

/**
 * Copy methods from upper class
 */
epiviz.ui.controls.CustomSettingsDialog.prototype = epiviz.utils.mapCopy(epiviz.ui.controls.Dialog.prototype);
epiviz.ui.controls.CustomSettingsDialog.constructor = epiviz.ui.controls.CustomSettingsDialog;

/**
 */
epiviz.ui.controls.CustomSettingsDialog.prototype.show = function() {
  epiviz.ui.controls.Dialog.prototype.show.call(this);

  var SettingType = epiviz.ui.charts.CustomSetting.Type;

  if (!this._dialog) {
    var self = this;
    this._dialog = $('#' + this._id);
    this._dialog.css('display', 'inline');

    var i, inputId, input, value;
    var content = '';
    for (i = 0; i < this._customSettingsDefs.length; ++i) {
      inputId = sprintf('%s-%s', this._id, this._customSettingsDefs[i].id);
      var row = sprintf(
        '<tr><td><label for="%s">%s</label></td><td style="text-align: right;">%%s</td></tr>',
        inputId, this._customSettingsDefs[i].label);

      input = null;
      value = this._customSettingsValues[this._customSettingsDefs[i].id];
      switch (this._customSettingsDefs[i].type) {
        case SettingType.BOOLEAN:
          row = sprintf(row, sprintf(
            '<div id="%1$s">' +
              '<label for="%1$s-true">On</label>' +
              '<input type="radio" id="%1$s-true" name="%1$s" %2$s />' +
              '<label for="%1$s-false">Off</label>' +
              '<input type="radio" id="%1$s-false" name="%1$s" %3$s />' +
              '</div>', inputId, value ? 'checked="checked"' : '', value ? '' : 'checked="checked"'));
          break;

        case SettingType.ARRAY:
          row = sprintf(row, sprintf(
            '<input id="%s" value="%s" class="ui-widget-content ui-corner-all" style="text-align: right; padding: 5px;" />', inputId, value.join(',')));
          break;
        case SettingType.NUMBER:
        case SettingType.STRING:
          row = sprintf(row, sprintf(
            '<input id="%s" value="%s" class="ui-widget-content ui-corner-all" style="text-align: right; padding: 5px;" />', inputId, value));
          break;
        case SettingType.CATEGORICAL:
        case SettingType.MEASUREMENTS_METADATA:
        case SettingType.MEASUREMENTS_ANNOTATION:
          var optionFormat = '<option value="%1$s"%2$s>%1$s</option>';
          var options = '';
          var def = this._customSettingsDefs[i];
          if (def.possibleValues) {
            for (var j = 0; j < def.possibleValues.length; ++j) {
              options += sprintf(optionFormat, def.possibleValues[j], def.possibleValues[j] == value ? 'selected="selected"' : '');
            }
          }
          var selector = sprintf('<select id="%s">%s</select>', inputId, options);
          row = sprintf(row, selector);
          break;
      }

      content += row;
    }
    content = sprintf('<div style="margin: 5px; padding: 5px; height: auto;"><table style="width: 100%%;">%s</table></div>', content);

    this._dialog.append(content);

    // Add jQuery UI properties to fields
    for (i = 0; i < this._customSettingsDefs.length; ++i) {
      inputId = sprintf('%s-%s', this._id, this._customSettingsDefs[i].id);
      input = $('#' + inputId);
      value = this._customSettingsValues[this._customSettingsDefs[i].id];
      switch (this._customSettingsDefs[i].type) {
        case SettingType.BOOLEAN:
          input.buttonset();
          break;

        case SettingType.NUMBER:
        case SettingType.ARRAY:
        case SettingType.STRING:
          input.watermark(this._customSettingsDefs[i].label);
          break;
        case SettingType.CATEGORICAL:
        case SettingType.MEASUREMENTS_METADATA:
        case SettingType.MEASUREMENTS_ANNOTATION:
          input.selectmenu();
      }
    }


    this._dialog.dialog({
      autoOpen: false,
      resizable: false,
      //width: '600',
      buttons: {
        Ok: function() {
          for (var i = 0; i < self._customSettingsDefs.length; ++i) {
            inputId = sprintf('%s-%s', self._id, self._customSettingsDefs[i].id);
            input = $('#' + inputId);
            var newValue = null;
            if (input.val() == epiviz.ui.charts.CustomSetting.DEFAULT) {
              newValue = self._customSettingsDefs[i].defaultValue;
            } else {
              var errorDialog = null;
              try {
                switch (self._customSettingsDefs[i].type) {
                  case SettingType.BOOLEAN:
                    var checked = $('#' + inputId + ' :radio:checked').attr('id');
                    newValue = checked.substr(checked.lastIndexOf('-')+1) == 'true';
                    break;

                  case SettingType.NUMBER:
                    newValue = (input.val() == epiviz.ui.charts.CustomSetting.DEFAULT) ?
                      self._customSettingsDefs[i].defaultValue :
                      parseFloat(input.val());
                    if (isNaN(newValue)) {
                      errorDialog = new epiviz.ui.controls.MessageDialog(
                        'Invalid property value',
                        { Ok: function() {} },
                        sprintf('Invalid value for setting "%s" (%s)', self._customSettingsDefs[i].label, self._customSettingsDefs[i].id),
                        epiviz.ui.controls.MessageDialog.Icon.ERROR);
                      errorDialog.show();
                      return;
                    }
                    break;
                  case SettingType.ARRAY:
                    newValue = input.val().split(/[\s,]+/g);
                    break;
                  case SettingType.STRING:
                  case SettingType.CATEGORICAL:
                  case SettingType.MEASUREMENTS_METADATA:
                  case SettingType.MEASUREMENTS_ANNOTATION:
                    newValue = input.val();
                    break;
                }
              } catch (error) {
                errorDialog = new epiviz.ui.controls.MessageDialog(
                  'Invalid property value',
                  { Ok: function() {} },
                  sprintf('Invalid value for setting "%s" (%s)', self._customSettingsDefs[i].label, self._customSettingsDefs[i].id),
                  epiviz.ui.controls.MessageDialog.Icon.ERROR);
                errorDialog.show();
                return;
              }
            }

            self._customSettingsValues[self._customSettingsDefs[i].id] = newValue;
          }

          self._handlers.ok(self._customSettingsValues);
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
