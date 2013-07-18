/**
 * Created with JetBrains PhpStorm.
 * User: florin
 * Date: 4/10/13
 * Time: 9:43 AM
 * To change this template use File | Settings | File Templates.
 */

TrackTypeHandler.prototype = new ChartTypeHandler({
  chartDisplayType: ChartDisplayType.TRACK,
  cssClass: 'genome-track',
  defaultHeight: 70,
  defaultWidth: '100%',
  defaultMargin: 25
});

TrackTypeHandler.prototype.constructor = TrackTypeHandler;

function TrackTypeHandler(args) {
  this._dataTypeHandler = args.dataTypeHandler;
  //this._measurementsType = args.measurementsType;
  this._chartType = args.chartType;
  this._chartTypeName = args.chartTypeName;
  //this._measurementsStore = args.measurementsStore;

  this._defaultColors = args.defaultColors || DataSeriesPalette.colors;

  if (args.defaultHeight) { this._defaultHeight = args.defaultHeight; }
  if (args.defaultWidth) { this._defaultWidth = args.defaultWidth; }
  if (args.defaultMargin) { this._defaultMargin = args.defaultMargin; }
}

TrackTypeHandler.prototype.initializeControls = function() {
  ChartTypeHandler.prototype.initializeControls.call(this);

  var trackSelector = $('#' + this._chartType + '-track-selector');

  trackSelector.multiselect({
    sortable:true,
    searchable:true
  });
};

TrackTypeHandler.prototype.getDialogContents = function() {
  return sprintf('<select id="%s-track-selector" class="multiselect" multiple="multiple" style="margin: 10px !important; min-height: 185px"></select>',
    this._chartType);

};

/*
 * Returns an object containing the properties of the dialog as defined in the
 * dialog JQuery UI control.
 */
TrackTypeHandler.prototype.getDialogProperties = function() {
  var self = this;
  var trackSelectorId = '#' + this._chartType + '-track-selector';
  return {
    autoOpen: false,
    width: '450',
    height: '300',
    resizable: false,
    buttons:{
      "Ok":function () {
        var trackSelector = $(trackSelectorId);
        if (trackSelector.val().length > 0) {
          var measurements = trackSelector.multiselect('selectedValues');

          ChartManager.instance.addChart([self._chartType, measurements]);
          EventManager.instance.updateData(UILocation.chr, UILocation.start, UILocation.start + UILocation.width);

          Workspace.instance.update();
          Workspace.instance.changed();

          $(this).dialog("close");
        }
      },
      "Cancel":function () {
        $(this).dialog("close");
      }
    },
    open: function(event, ui) {
      var trackSelector = $(trackSelectorId);
      trackSelector.empty();

      var optionFormat = '<option value="%s">%s</option>';
      var measurements = self.getDataTypeHandler().getMeasurementsStore().getMeasurements();

      if (!measurements) {
        return;
      }

      for (var key in measurements) {
        var option = sprintf(optionFormat, key, measurements[key]);

        trackSelector.append(option);
      }

      trackSelector.multiselect('destroy').multiselect({sortable:true, searchable:true});
    },
    modal:true
  }
};

