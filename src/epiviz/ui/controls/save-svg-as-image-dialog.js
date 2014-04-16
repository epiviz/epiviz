/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 2/18/14
 * Time: 6:44 PM
 */

goog.provide('epiviz.ui.controls.SaveSvgAsImageDialog');

/**
 * @param {{ok: function(), cancel: function()}} handlers
 * @param {string} chartId The id of the chart being saved
 * @param {string} chartSaverLocation The location of the
 *   PHP server providing the SVG saving functionality
 * @constructor
 * @extends {epiviz.ui.controls.Dialog}
 */
epiviz.ui.controls.SaveSvgAsImageDialog = function(handlers, chartId, chartSaverLocation) {
  epiviz.ui.controls.Dialog.call(this, 'Save Chart SVG as Image', handlers);

  this._dialog = $('#' + this._id);

  this._dialog.append(
    '<div class="save-svg-dialog">' +
    '<label class="dialog-label">Choose file format:</label>' +
    '<br/><br/>' +
    '<div style="position:absolute; right:15px;">' +
      '<select class="svg-file-format">' +
        '<option value="pdf" selected="selected">PDF</option>' +
        '<option value="ps" >PS</option>' +
        '<option value="png" >PNG</option>' +
        '<option value="svg">SVG</option>' +
        '<option value="eps">EPS</option>' +
      '</select>' +
    '</div>' +
    sprintf('<form name="%s-svg-save-form" method="POST">', this._id) +
      '<div>' +
        '<input type="hidden" name="svg" />' +
        '<input type="hidden" name="format" />' +
        '<br/><br/>' +
      '</div>' +
    '</form>' +
  '</div>');

  /**
   * @type {string}
   * @private
   */
  this._chartId = chartId;

  /**
   * @type {string}
   * @private
   */
  this._chartSaverLocation = chartSaverLocation;

  var self = this;
  this._dialog.dialog({
    autoOpen: false,
    resizable: false,
    width: '200',
    buttons: {
      Ok: function() {
        var svg = $('#' + self._chartId).find('svg').clone();
        svg.attr('xmlns', 'http://www.w3.org/2000/svg');
        svg.attr('version', '1.1');

        var fileFormat = self._dialog.find('.svg-file-format');

        var form = document.forms[sprintf('%s-svg-save-form', self._id)];

        form.action = self._chartSaverLocation;
        form['svg'].value = $('<div>').append(svg).html();
        form['format'].value = fileFormat.val();
        form.submit();

        self._handlers.ok();
        $(this).dialog('close');
      },
      Cancel: function() {
        self._handlers.cancel();
        $(this).dialog('close');
      }
    },
    modal: true
  });
};

/**
 * Copy methods from upper class
 */
epiviz.ui.controls.SaveSvgAsImageDialog.prototype = epiviz.utils.mapCopy(epiviz.ui.controls.Dialog.prototype);
epiviz.ui.controls.SaveSvgAsImageDialog.constructor = epiviz.ui.controls.SaveSvgAsImageDialog;

/**
 */
epiviz.ui.controls.SaveSvgAsImageDialog.prototype.show = function() {
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
