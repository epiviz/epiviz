/**
 * Created by: Florin Chelaru
 * Date: 10/3/13
 * Time: 12:56 PM
 */

goog.provide('epiviz.ui.ControlManager');

goog.require('epiviz.Config');
goog.require('epiviz.events.Event');
goog.require('epiviz.ui.charts.Chart');
goog.require('epiviz.ui.charts.ChartFactory');
goog.require('epiviz.ui.charts.ChartManager');
goog.require('epiviz.workspaces.WorkspaceManager');
goog.require('epiviz.datatypes.GenomicRange');
goog.require('epiviz.ui.tutorials');

/**
 * @param {epiviz.Config} config
 * @param {epiviz.ui.charts.ChartFactory} chartFactory
 * @param {epiviz.ui.charts.ChartManager} chartManager
 * @param {epiviz.measurements.MeasurementsManager} measurementsManager
 * @param {epiviz.ui.LocationManager} locationManager
 * @constructor
 */
epiviz.ui.ControlManager = function(config, chartFactory, chartManager, measurementsManager, locationManager) {

  /**
   * @type {epiviz.Config}
   * @private
   */
  this._config = config;

  /**
   * @type {epiviz.ui.charts.ChartFactory}
   * @private
   */
  this._chartFactory = chartFactory;

  /**
   * @type {epiviz.ui.charts.ChartManager}
   * @private
   */
  this._chartManager = chartManager;

  /**
   * @type {epiviz.measurements.MeasurementsManager}
   * @private
   */
  this._measurementsManager = measurementsManager;

  /**
   * @type {epiviz.ui.LocationManager}
   * @private
   */
  this._locationManager = locationManager;

  // Events

  /**
   * @type {epiviz.events.Event.<{type: epiviz.ui.charts.ChartType, visConfigSelection: epiviz.ui.controls.VisConfigSelection}>}
   * @private
   */
  this._addChart = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<{oldValue: {id: string, name: string}, newValue: {id: string, name: string}}>}
   * @private
   */
  this._activeWorkspaceChanged = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<{name: string, id: ?string}>}
   * @private
   */
  this._saveWorkspace = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event}
   * @private
   */
  this._deleteActiveWorkspace = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event}
   * @private
   */
  this._revertActiveWorkspace = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event}
   * @private
   */
  this._loginLinkClicked = new epiviz.events.Event();

  /**
   * Fired whenever the user clicks or searches through the workspaces textbox
   *
   * @type {epiviz.events.Event.<{searchTerm: string, callback: function(Array.<epiviz.workspaces.Workspace>)}>}
   * @private
   */
  this._searchWorkspaces = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<{searchTerm: string, callback: function(Array.<{probe: string, gene: string, seqName: string, start: number, end: number}>)}>}
   * @private
   */
  this._search = new epiviz.events.Event();

  // Selection

  /**
   * @type {?{id: string, name: string}}
   * @private
   */
  this._activeWorkspaceInfo = null;

  /**
   * @type {number}
   * @private
   */
  this._stepRatio = config.navigationStepRatio;

  /**
   * @type {number}
   * @private
   */
  this._zoominRatio = config.zoominRatio;

  /**
   * @type {number}
   * @private
   */
  this._zoomoutRatio = config.zoomoutRatio;
};

/**
 * @type {Object.<epiviz.ui.charts.VisualizationType.DisplayType, string>}
 * @const
 */
epiviz.ui.ControlManager.CHART_TYPE_CONTAINERS = {
  'plot': 'feature-view',
  'track': 'location-view',
  'data-structure': 'data-structure-view'
};

/**
 * @type {Object.<epiviz.ui.charts.VisualizationType.DisplayType, string>}
 * @const
 */
epiviz.ui.ControlManager.DISPLAY_TYPE_LABELS = {
  'plot': 'Feature',
  'track': 'Location',
  'data-structure': 'Data Structure'
};

epiviz.ui.ControlManager.prototype.initialize = function() {

  /*
   * Toolbar
   */
  this._initializeChromosomeSelector();
  this._initializeLocationTextbox();
  this._initializeNavigationButtons();
  this._initializeZoomButtons();
  this._initializeLocationSettingsDialog();
  this._initializeChartMenus();
  this._initializeComputedMeasurementsMenu();
  this._initializeHelpButton();
  this._initializeSearchBox();
  this._initializeWorkspaceSaving();
  this._initializeTutorials();
  this._initializeScreenshotMenu();

  /*
   * Log in/out
   */
  this._initializeLoginLink();

  /*
   * Layout
   */
  this._initializeLayout();

  /*
   * Browser compatibility
   */
  this._checkBrowserCompatibility();

  // Register for events

  this._registerLocationChanged();

  this._registerSeqInfosUpdated();

};

/**
 * @returns {epiviz.events.Event.<{type: epiviz.ui.charts.ChartType, visConfigSelection: epiviz.ui.controls.VisConfigSelection}>}
 */
epiviz.ui.ControlManager.prototype.onAddChart = function() { return this._addChart; };

/**
 * @returns {epiviz.events.Event.<{oldValue: {id: string, name: string}, newValue: {id: string, name: string}}>}
 */
epiviz.ui.ControlManager.prototype.onActiveWorkspaceChanged = function() { return this._activeWorkspaceChanged; };

/**
 * @returns {epiviz.events.Event.<{name: string, id: ?string}>}
 */
epiviz.ui.ControlManager.prototype.onSaveWorkspace = function() { return this._saveWorkspace; };

/**
 * @returns {epiviz.events.Event}
 */
epiviz.ui.ControlManager.prototype.onDeleteActiveWorkspace = function() { return this._deleteActiveWorkspace; };

/**
 * @returns {epiviz.events.Event}
 */
epiviz.ui.ControlManager.prototype.onRevertActiveWorkspace = function() { return this._revertActiveWorkspace; };

/**
 * @returns {epiviz.events.Event}
 */
epiviz.ui.ControlManager.prototype.onLoginLinkClicked = function() { return this._loginLinkClicked; };

/**
 * @returns {epiviz.events.Event.<{searchTerm: string, callback: (function(Array))}>}
 */
epiviz.ui.ControlManager.prototype.onSearchWorkspaces = function() { return this._searchWorkspaces; };

/**
 * @returns {epiviz.events.Event.<{searchTerm: string, callback: (function(Array.<{probe: string, gene: string, seqName: string, start: number, end: number}>))}>}
 */
epiviz.ui.ControlManager.prototype.onSearch = function() { return this._search; };

/**
 * @param {Array.<epiviz.datatypes.SeqInfo>} seqInfos
 * @private
 */
epiviz.ui.ControlManager.prototype._updateSeqNames = function(seqInfos) {
  var chromosomeSelector = $('#chromosome-selector');
  var optionFormat = '<option value="%s"%s>%s</option>';
  chromosomeSelector.empty();
  for (var i = 0; i < seqInfos.length; ++i) {
    var option = sprintf(
      optionFormat,
      seqInfos[i].seqName,
      (this._locationManager.currentLocation() && seqInfos[i].seqName == this._locationManager.currentLocation().seqName()) ?
        'selected="selected"' : '', seqInfos[i].seqName);
    chromosomeSelector.append(option);
  }
  chromosomeSelector.selectmenu();
};

/**
 * @param {epiviz.measurements.MeasurementSet} measurements
 */
/*epiviz.ui.ControlManager.prototype.updateMeasurements = function(measurements) {
  this._measurements = measurements;
};*/

/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @private
 */
epiviz.ui.ControlManager.prototype._updateSelectedLocation = function(range) {
  if (!range) { return; }

  this._locationManager.changeCurrentLocation(range);
  range = this._locationManager.currentLocation();

  var locationTextBox = $('#text-location');
  locationTextBox.val(Globalize.format(range.start(), 'n0') + ' - ' + Globalize.format(range.end(), 'n0'));

  var chromosomeSelector = $('#chromosome-selector');
  chromosomeSelector.val(range.seqName());
  chromosomeSelector.selectmenu();
};

/**
 * @param {{id: string, name: string}} workspaceInfo
 */
epiviz.ui.ControlManager.prototype.updateSelectedWorkspace = function(workspaceInfo) {
  var self = this;
  var saveTextBox = $('#save-workspace-text');
  var oldValue = this._activeWorkspaceInfo;
  saveTextBox.val(workspaceInfo.name);
  this._activeWorkspaceInfo = workspaceInfo;
  var args = {oldValue: oldValue, newValue: workspaceInfo, cancel: function() {
    saveTextBox.val(oldValue.name);
    self._activeWorkspaceInfo = oldValue;
  }};
  this._activeWorkspaceChanged.notify(args);
};

epiviz.ui.ControlManager.prototype._initializeChromosomeSelector = function() {
  var chromosomeSelector = $('#chromosome-selector');
  chromosomeSelector.selectmenu({
    style:'popup',
    width:'90',
    maxHeight:'100',
    menuWidth:'90'
  });

  var self = this;
  chromosomeSelector.change(function () {
    var currentLocation = self._locationManager.lastUnfilledLocationChangeRequest() || self._locationManager.currentLocation();
    var seqName = $(this).val();
    self._updateSelectedLocation(new epiviz.datatypes.GenomicRange(
      seqName,
      currentLocation.start(),
      currentLocation.width()));
  });
};

epiviz.ui.ControlManager.prototype._initializeLocationTextbox = function() {
  var self = this;
  var locationTextBox = $('#text-location');
  locationTextBox.keypress(function(event) {
    if (event.which != 13) { return true; }

    try {
      var location = $(this).val();
      var startEnd = location.split('-');

      var start = Globalize.parseInt(startEnd[0]);
      var end = Globalize.parseInt(startEnd[1]);

      var currentLocation = self._locationManager.lastUnfilledLocationChangeRequest() || self._locationManager.currentLocation();
      self._updateSelectedLocation(
        epiviz.datatypes.GenomicRange.fromStartEnd(currentLocation.seqName(), start, end));

      return true;
    } catch (error) {
      return false;
    }
  });
};

epiviz.ui.ControlManager.prototype._initializeNavigationButtons = function() {
  var self = this;
  $('#moveright').button({
    icons:{
      primary: 'ui-icon ui-icon-seek-next'
    },
    text:false
  }).click(
    function () {
      var currentLocation = self._locationManager.lastUnfilledLocationChangeRequest() || self._locationManager.currentLocation();
      var start = currentLocation.start() + Math.round(currentLocation.width() * self._stepRatio);
      self._updateSelectedLocation(
        new epiviz.datatypes.GenomicRange(currentLocation.seqName(), start, currentLocation.width()));
    });

  $("#moveleft").button({
    icons:{
      primary: 'ui-icon ui-icon-seek-prev'
    },
    text:false
  }).click(
    function () {
      var currentLocation = self._locationManager.lastUnfilledLocationChangeRequest() || self._locationManager.currentLocation();
      var start = currentLocation.start() - Math.round(currentLocation.width() * self._stepRatio);
      self._updateSelectedLocation(
        new epiviz.datatypes.GenomicRange(currentLocation.seqName(), start, currentLocation.width()));
    });
};

epiviz.ui.ControlManager.prototype._initializeZoomButtons = function() {
  var self = this;
  var zoomin = $('#zoomin');
  zoomin.button({
    icons:{
      primary:'ui-icon ui-icon-zoomin'
    },
    text:false
  });

  var zoomout = $('#zoomout');
  zoomout.button({
    icons:{
      primary:'ui-icon ui-icon-zoomout'
    },
    text:false
  });

  var zoomHandler = function(zoomRatio) {
    var currentLocation = self._locationManager.lastUnfilledLocationChangeRequest() || self._locationManager.currentLocation();
    var mid = currentLocation.start() + currentLocation.width() * 0.5;
    var width = Math.round(currentLocation.width() * zoomRatio);
    var start = Math.round(mid - width * 0.5);
    self._updateSelectedLocation(
      new epiviz.datatypes.GenomicRange(currentLocation.seqName(), start, width));
  };

  zoomin.click(function() { zoomHandler(self._zoominRatio); });
  zoomout.click(function() { zoomHandler(self._zoomoutRatio); });
};

epiviz.ui.ControlManager.prototype._initializeLocationSettingsDialog = function() {
  // TODO: Remove location-settings-dialog div, and create it dynamically
  var self = this;
  $('#location-settings')
    .button({
      text: false,
      icons: {
        primary: 'ui-icon ui-icon-gear'
      }
    })
    .click(function() {
      $('#location-settings-dialog').dialog('open');
    });

  $('#location-settings-dialog').dialog({
    autoOpen: false,
    resizable: false,
    width: '300',
    buttons: {
      'Ok': function() {
        self._zoominRatio = $('#zoomin-ratio-text').val();
        self._zoomoutRatio = $('#zoomout-ratio-text').val();
        self._stepRatio = $('#navigation-step-ratio-text').val();
        $(this).dialog('close');
      },
      'Cancel': function() {
        $('#zoomin-ratio-text').val(Globalize.format(self._zoominRatio, 'n3'));
        $('#zoomout-ratio-text').val(Globalize.format(self._zoomoutRatio, 'n3'));
        $('#navigation-step-ratio-text').val(Globalize.format(self._stepRatio, 'n6'));
        $(this).dialog('close');
      }
    },
    modal:true
  });

  $('#zoomout-ratio-text').spinner({
    min: 1.001,
    max: 1000.000,
    step: 0.001,
    start: 1.200,
    numberFormat: 'n3'
  }).val(self._zoomoutRatio);

  $('#zoomin-ratio-text').spinner({
    min: 0.001,
    max: 0.999,
    step: 0.010,
    start: 0.800,
    numberFormat: 'n3'
  }).val(self._zoominRatio);

  $('#navigation-step-ratio-text').spinner({
    min:   0.000001,
    max:   1.000000,
    step:  0.000001,
    start: 0.200000,
    numberFormat: 'n6'
  }).val(self._stepRatio);
};

epiviz.ui.ControlManager.prototype._initializeChartMenus = function() {
  var self = this;
  var visMenu = $('#vis-menu');

  $('#vis-menu-button')
    .button({
      text: false,
      icons: {
        primary: 'ui-icon ui-icon-scatterplot', // 'ui-icon ui-icon-bookmark',
        secondary: "ui-icon-triangle-1-s"
      }
    })
    .click(function() {
      var menu = visMenu;
      var visible = menu.is(":visible");
      $('.dropdown-menu').find(">:first-child").hide();
      if (!visible) {
        menu.show().position({
          my: "left top",
          at: "left bottom",
          of: this
        });
      }
      else {
        menu.hide();
      }
/*      $( document ).one('click', function() {
        menu.hide();
      });*/
      return false;
    });

  /** @type {Object.<epiviz.ui.charts.VisualizationType.DisplayType, Array.<epiviz.ui.charts.ChartType>>} */
  var chartsByDisplayType = {};

  var displayTypeLabels = epiviz.ui.ControlManager.DISPLAY_TYPE_LABELS;

  this._chartFactory.foreach(
    /**
     * @param {string} typeName
     * @param {epiviz.ui.charts.ChartType} chartType
     */
    function(typeName, chartType) {
      if (!(chartType.chartDisplayType() in chartsByDisplayType)) { chartsByDisplayType[chartType.chartDisplayType()] = []; }
      chartsByDisplayType[chartType.chartDisplayType()].push(chartType);
    });

  for (var displayType in chartsByDisplayType) {
    if (!chartsByDisplayType.hasOwnProperty(displayType)) { continue; }
    $(sprintf('<li class="ui-widget-header">%s</li>', displayTypeLabels[displayType])).appendTo(visMenu);
    chartsByDisplayType[displayType].forEach(function(chartType, i) {
      var id = sprintf('%s-menu-add-%s', chartType.chartDisplayType(), chartType.chartHtmlAttributeName());
      visMenu.append(sprintf('<li><a href="javascript:void(0)" id="%s">Add New %s</a></li>', id, chartType.chartName()));

      $('#' + id).click(function() {
        var wizardSteps = [];
        if (chartType.isRestrictedToSameDatasourceGroup()) {
          wizardSteps.push(new epiviz.ui.controls.DatasourceGroupWizardStep());
        }
        if (chartType.chartDisplayType() != epiviz.ui.charts.VisualizationType.DisplayType.DATA_STRUCTURE) {
          wizardSteps.push(new epiviz.ui.controls.MeaurementsWizardStep());
        }

        if (!wizardSteps.length) {
          self._addChart.notify({
            type: chartType,
            visConfigSelection: new epiviz.ui.controls.VisConfigSelection(
              self._measurementsManager.measurements().subset(chartType.measurementsFilter()))});
          return;
        }

        var wizardMeasurements = self._measurementsManager.measurements().subset(chartType.measurementsFilter());
        wizardMeasurements.addAll(self._measurementsManager.measurements()
          .map(function(m) { return m.datasource(); })
          .subset(chartType.measurementsFilter()));
        var dialog = new epiviz.ui.controls.Wizard(
          sprintf('Add new %s', chartType.chartName()),
          {finish:
            /** @param {epiviz.ui.controls.VisConfigSelection} data */
            function(data) {
              self._addChart.notify({type: chartType, visConfigSelection: data});
            }
          },
          wizardSteps,
          new epiviz.ui.controls.VisConfigSelection(
            wizardMeasurements, // measurements
            undefined, // datasource
            undefined, // datasourceGroup
            undefined, // dataprovider
            undefined, // annotation
            chartType.chartName(), // defaultChartType
            chartType.minSelectedMeasurements()),
          '750', undefined, // size of dialog
          chartType.isRestrictedToSameDatasourceGroup()); // showTabs
        dialog.show();

        visMenu.hide();
      });
    });
  }

  visMenu.hide().menu();
};

epiviz.ui.ControlManager.prototype._initializeComputedMeasurementsMenu = function() {
  var self = this;
  $('#computed-measurements-button')
    .button({
      text: false,
      icons: {
        primary: 'ui-icon ui-icon-calculator'
      }
    })
    .click(function() {
      var dialog = new epiviz.ui.controls.ComputedMeasurementsDialog(
        'Computed Measurements',
        {
          add: function(measurement) {
            self._measurementsManager.addMeasurement(measurement);
          },
          remove: function(measurement) {
            self._measurementsManager.removeMeasurement(measurement);
          },
          close: function() {}
        },
        self._measurementsManager.measurements(),
        self._chartManager.chartsMeasurements()
      );

      dialog.show();
    });
};

epiviz.ui.ControlManager.prototype._initializeHelpButton = function() {
  $('#help-button').button({
    text: false,
    icons: {
      primary: 'ui-icon ui-icon-help'
    }
  }).click(
    function() {
      var win=window.open('http://epiviz.github.io/', '_blank');
      win.focus();
    });
};

epiviz.ui.ControlManager.prototype._initializeTutorials = function() {
  var self = this;

  var tutorialMenu = $('#help-tutorials');

  var tuts = new epiviz.ui.tutorials();

  var tMenu = '<div class="dropdown-menu">' +
      '<ul id="tutorial-list">' +
      '<li class="ui-widget-header">Tutorials</li>';

  if(tuts._tutorialList.length > 0) {
    tuts._tutorialList.forEach(function(t) {
      tMenu += '<li><a href="javascript:void(0);" id="' + t.id +'">' + t.name + '</a></li>';
    });
  }
  else {
    tMenu += '<li>No Tutorials available</li>';
  }

  tMenu += '</ul>' +
      '</div>';

  $(sprintf(tMenu)).insertAfter(tutorialMenu);

  var tutorialList = $('#tutorial-list');

  tutorialList.hide().menu();

  tutorialMenu.button({
    icons:{
      primary:'ui-icon ui-icon-info',
      secondary: "ui-icon-triangle-1-s"
    },
    text:false
  })
  .click( function() {

    var visible = tutorialList.is(":visible");
    if (!visible) {
      tutorialList.show().position({
        my: "left top",
        at: "left bottom",
        of: this
      });
    }
    else {
      tutorialList.hide()
    }
    return false;
  });

  if(tuts._tutorialList.length > 0) {
    tuts._tutorialList.forEach(function(t) {
      $('#' + t.id).click(function() {
        var anno = new Anno(t.tutorial);
        anno.show();
        tutorialList.hide();
      });
    });
  }
};

epiviz.ui.ControlManager.prototype.printWorkspace = function(fName, fType) {
  var container = $("#pagemain");

  function inline_styles(dom) {
    var used = "";
    var sheets = document.styleSheets;
    for (var i = 0; i < sheets.length; i++) {
      var rules = sheets[i].cssRules;
      for (var j = 0; j < rules.length; j++) {
        var rule = rules[j];
        if (typeof(rule.style) != "undefined") {
          var elems = dom.querySelectorAll(rule.selectorText);
          if (elems.length > 0) {
            used += rule.selectorText + " { " + rule.style.cssText + " }\n";
          }
        }
      }
    }

    $(dom).find('style').remove();

    var s = document.createElement('style');
    s.setAttribute('type', 'text/css');
    s.innerHTML = "<![CDATA[\n" + used + "\n]]>";

    //dom.getElementsByTagName("defs")[0].appendChild(s);
    dom.insertBefore(s, dom.firstChild);
  }

  //add inline styles to svg elements
  function custom_styles(dom) {

    // style axes lines
    var axes = $(dom).find('.domain');
    axes.each(function () {
      $(this).css({"fill": "none", "stroke-width": "1px", "stroke": "#000000", "shape-rendering": "crispEdges"});
    });

    //remove gene name labels
    var gLabels = $(dom).find('.gene-name');
    gLabels.each(function () {
      $(this).remove();
    });

    // fill path on single line tracks
    var lines = $(dom).find('.line-series-index-0 path');
    lines.each(function() {
      $(this).css({"fill": "none"});
    });

    //change text size to fit screen
    var texts = $(dom).find('text');
    texts.each(function(){
      $(this).css({"font-size": "11px"});
    });
  }

  // html2canvas has issues with svg elements on ff and IE.
  // Convert svg elements into canvas objects, temporarily hide the svg elements for html2canvas to work and
  // finally remove all dom changes!
  // TODO: this feature does not work all the time in FF!

  var svgElems = container.find('svg');

  svgElems.each(function () {
    var canvas, xml;

    canvas = document.createElement("canvas");
    canvas.className = "tempCanvas";

    custom_styles(this);

    // Convert SVG into a XML string
    xml = new XMLSerializer().serializeToString(this);

    // Removing the name space as IE throws an error
    //xml = xml.replace(/xmlns=\"http:\/\/www\.w3\.org\/2000\/svg\"/, '');

    //draw the canvas object created from canvg
    canvg(canvas, xml, {
      useCORS: true,
      renderCallback: function() {
        $(canvas).insertAfter(this);
        $(this).hide();
      }
    });
  });

  // use html2canvas to take a screenshot of the page!
  html2canvas(container, {
    //allowTaint: true,
    //taintTest: false,
    timeout: 0,
    //logging: true,
    useCORS: true
  }).then(function (canvas) {

    var ctx = canvas.getContext("2d");
    ctx.mozImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;

    var filename = fName + "." + fType;
    var format = fType;
    var image = canvas.toDataURL("image/png");

    if(format == "pdf") {
      var jsdoc = new jsPDF('p', 'px', [container.height(), container.width()]);

      function toDataUrl(url, callback, outputFormat){
        var img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = function(){
          var canvas = document.createElement('CANVAS');
          var ctx = canvas.getContext('2d');
          var dataURL;
          canvas.height = this.height;
          canvas.width = this.width;
          ctx.drawImage(this, 0, 0);
          dataURL = canvas.toDataURL(outputFormat);
          callback(dataURL);
          canvas = null;
        };
        img.src = url;
      }

      //TODO: save workspace if user is not signed in and get workspace id
      var ws_id = "abcdef";
      var s_url ="http://epiviz.org/?ws=" + ws_id;

/*      toDataUrl(window.location.href + '/img/epiviz_4_logo_medium.png', function(imgData) {
        jsdoc.addImage(imgData, 'PNG', 20, 20, 100, 21);
      });*/

      jsdoc.addImage("data:image/png;base64,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", 'PNG', 20, 20, 100, 21);
      jsdoc.setFontSize(10);
      jsdoc.text(150, 25, "Chromosome: Location");
      jsdoc.setFontSize(14);
      jsdoc.text(150, 40, $('#chromosome-selector').val() + ' : ' + $('#text-location').val());
      jsdoc.setTextColor(0, 0, 255);
      jsdoc.setFontSize(16);
      //jsdoc.text(550, 40, s_url);
      jsdoc.setTextColor(0, 0, 0);
      jsdoc.setFontSize(10);
      jsdoc.text(350, 25, "Workspace ID");
      jsdoc.setFontSize(14);
      jsdoc.text(350, 40, $('#save-workspace-text').val());
      jsdoc.addImage(image, 'PNG', 15, 55);
      jsdoc.save(filename);
      
    }
    else {

      if (navigator.msSaveBlob) {
        // IE 10+
        var image_blob = canvas.msToBlob();
        var blob = new Blob([image_blob], {type: "image/png"});
        navigator.msSaveBlob(blob, filename);
      }
      else {
        var blob = new Blob([image], {type: "image/png"});
        var link = document.createElement("a");

        if (link.download !== undefined) {
          // check if browser supports HTML5 download attribute
          var url = URL.createObjectURL(blob);
          link.setAttribute("href", image);
          link.setAttribute("download", filename);
          link.style = "visibility:hidden";
          link.setAttribute("target", "_blank");
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        else {
          var image_octet = image.replace("image/png", "image/octet-stream");
          window.open(image_octet);
        }
      }
    }

    // remove all changes made to the DOM
    container.find('.tempCanvas').remove();
    svgElems.each(function () {
      $(this).show();
    });
  });
};

epiviz.ui.ControlManager.prototype._initializeScreenshotMenu = function() {
  var self = this;

  var savePageButton = $('#save-page');

  savePageButton.button({
    icons:{
      primary:'ui-icon ui-icon-print'
    },
    text:false
  })
  .click( function() {

    savePageButton.append(sprintf('<div id="loading" title="printing workspace">' +
        '<p>Save/Print the existing EpiViz workspace.</p>' +
        '<div style="position:absolute; right:15px;">' +
        '<select class="screenshot-file-format">' +
          '<option value="pdf" selected="selected">PDF</option>' +
          '<option value="png" >PNG</option>' +
        '</select>' +
        '</div>' +
        '</div>'));

    savePageButton.find("#loading").dialog({
      resizable: false,
      modal: true,
      title: "Print workspace as image",
      buttons: {
        "Print": function () {

          // hide the dialog box from the UI so that its not in the screenshot
          $(this).dialog('close');

          var format = $('.screenshot-file-format option:selected').val();

          var timestamp = Math.floor($.now() / 1000);

          self.printWorkspace("epiviz_" + timestamp, format);

          $(this).dialog('destroy').remove();
        },
        "cancel": function () {
          $(this).dialog('destroy').remove();
        }
      }
    }).show();
  });

};

epiviz.ui.ControlManager.prototype._initializeSearchBox = function() {
  var self = this;

  var searchBox = $('#search-box');
  searchBox.watermark('Find Gene/Probe');

  searchBox.autocomplete({
    source: function(request, callback) {
      self._search.notify({ searchTerm: request.term, callback:
        /**
         * @param {Array.<{probe: string, gene: string, seqName: string, start: number, end: number}>} results
         */
        function(results) {
          var items = [];
          for (var i = 0; i < results.length; ++i) {
            items.push({
              value: results[i].probe || results[i].gene,
              label: results[i].probe || results[i].gene,
              html: results[i].probe ?
                sprintf('<b>%s</b>, %s, [%s: %s - %s]',
                  results[i].probe, results[i].gene, results[i].seqName,
                  Globalize.format(results[i].start, 'n0'), Globalize.format(results[i].end, 'n0')) :
                sprintf('<b>%s</b>, [%s: %s - %s]',
                  results[i].gene, results[i].seqName,
                  Globalize.format(results[i].start, 'n0'), Globalize.format(results[i].end, 'n0')),
              range: epiviz.datatypes.GenomicRange.fromStartEnd(results[i].seqName, results[i].start, results[i].end)
            });
          }

          callback(items);
        }});
    },
    minLength: 1,
    select: function(event, ui) {
      var currentLocation = self._locationManager.lastUnfilledLocationChangeRequest() || self._locationManager.currentLocation();
      var seqName = ui.item.range.seqName();
      var start = Math.round(ui.item.range.start() + ui.item.range.width() * 0.5 - currentLocation.width() * 0.5);
      var width = currentLocation.width();
      self._updateSelectedLocation(new epiviz.datatypes.GenomicRange(seqName, start, width));
    },
    focus: function(event) {
      event.preventDefault();
    },
    open: function() {},
    close: function() {}
  }).data('autocomplete')._renderItem = function(ul, item) {
    return $('<li></li>')
      .data( 'item.autocomplete', item )
      .append(sprintf('<a>%s</a>', item.html))
      .appendTo(ul);
  };
};

epiviz.ui.ControlManager.prototype._initializeWorkspaceSaving = function() {
  var self = this;

  var saveTextBox = $('#save-workspace-text');
  var saveWorkspaceButton = $('#save-workspace-button');
  var revertWorkspaceButton = $('#revert-workspace-button');
  var deleteWorkspaceButton = $('#delete-workspace-button');

  saveWorkspaceButton.button({
    text: false,
    icons: {
      primary: 'ui-icon-disk'
    }
  }).click(function() {
    var dialog = null;

    try {
      var name = saveTextBox.val();
      var pattern = /[a-zA-Z0-9_\s]+/g;

      var result = pattern.exec(name);

      if (result == name) { // Name is good.

        if (!epiviz.workspaces.UserManager.USER_STATUS.loggedIn) {
          dialog = new epiviz.ui.controls.MessageDialog(
            'User not logged in',
            {
              Yes: function() { self._loginLinkClicked.notify(); },
              No: function() {}
            },
            'You need to log in in order to save the workspace. Do you wish to log in now?',
            epiviz.ui.controls.MessageDialog.Icon.QUESTION);
          dialog.show();
          return;
        }

        self._saveWorkspace.notify({name: name, id: name == self._activeWorkspaceInfo.name ? self._activeWorkspaceInfo.id : null});
      } else {
        dialog = new epiviz.ui.controls.MessageDialog(
          'Invalid workspace name',
          { Ok: function() { $(this).remove(); } },
          'Invalid workspace name: ' + name,
          epiviz.ui.controls.MessageDialog.Icon.ERROR);
        dialog.show();
      }
    } catch(error) {
      dialog = new epiviz.ui.controls.MessageDialog(
        'Error',
        { ok: function() { $(this).remove(); } },
        'An error occurred while trying to save workspace: ' + error.message,
        epiviz.ui.controls.MessageDialog.Icon.ERROR);
      dialog.show();
    }
  });

  deleteWorkspaceButton.button({
    text: false,
    icons: {
      primary: 'ui-icon-trash'
    }
  }).click(function(e) {
    // Delete the active workspace

    if (!epiviz.workspaces.UserManager.USER_STATUS.loggedIn) {
      // Only a logged in user can delete a workspace
      return;
    }

    var dialog = new epiviz.ui.controls.MessageDialog(
      'Delete active workspace',
      {
        Yes: function() { self._deleteActiveWorkspace.notify(); },
        No: function() {}
      },
      'Are you sure you want to delete the active workspace?',
      epiviz.ui.controls.MessageDialog.Icon.QUESTION);
    dialog.show();
  });

  revertWorkspaceButton.button({
    text: false,
    icons: {
      primary: 'ui-icon-arrowreturnthick-1-w'
    }
  }).click(function(e) {
    var dialog = new epiviz.ui.controls.MessageDialog(
      'Delete active workspace',
      {
        Yes: function() { self._revertActiveWorkspace.notify(); },
        No: function() {}
      },
      'Are you sure you want to revert the changes on the active workspace?',
      epiviz.ui.controls.MessageDialog.Icon.QUESTION);
    dialog.show();
  });

  saveTextBox.watermark('Save Workspace Name');

  saveTextBox.autocomplete({
    source: function(request, callback) {
      self._searchWorkspaces.notify({ searchTerm: request.term, callback: function(workspaces) {
        var items = [];
        for (var i = 0; i < workspaces.length; ++i) {
          items.push({
            value: workspaces[i].id,
            label: workspaces[i].name,
            html: sprintf('<b>%s</b> %s', workspaces[i].name, workspaces[i].id || '')
          });
        }

        callback(items);
      }});
    },
    minLength: 0,
    select: function(event, ui) {
      event.preventDefault();
      self.updateSelectedWorkspace({id: ui.item.value || saveTextBox.val(), name: ui.item.label});
    },
    focus: function(event) {
      event.preventDefault();
    },
    open: function() {},
    close: function() {}
  }).data('autocomplete')._renderItem = function(ul, item) {
    return $('<li></li>')
      .data( 'item.autocomplete', item )
      .append(sprintf('<a>%s</a>', item.html))
      .appendTo(ul);
  };

  saveTextBox.click(function() { saveTextBox.autocomplete('search', ''); });
};

/**
 * @private
 */
epiviz.ui.ControlManager.prototype._initializeLoginLink = function() {
  var self = this;
  $('#login-link').live({ click: function() {
      self._loginLinkClicked.notify();
  }});
};

/**
 * @private
 */
epiviz.ui.ControlManager.prototype._initializeLayout = function() {
  var layout = $('body').layout({
    applyDefaultStyles: true,
    east__size:    390,
    east__minSize: 390,
    east__initHidden: true,
    north__resizable: false,
    north__initHidden: false,
    south__initHidden: true,
    east__initClosed: true
  });
};

/**
 * @private
 */
epiviz.ui.ControlManager.prototype._checkBrowserCompatibility = function() {
  var ie = epiviz.utils.getInternetExplorerVersion();
  if (ie > 0) {
    var dialog = new epiviz.ui.controls.MessageDialog(
      'Browser compatibility warning',
      {
        Ok: function() {}
      },
      'EpiViz works best on Google Chrome, Apple Safari or Mozilla Firefox. Please open it using one of those browsers.',
      epiviz.ui.controls.MessageDialog.Icon.ERROR);
    dialog.show();
  }
};

/**
 * @private
 */
epiviz.ui.ControlManager.prototype._registerLocationChanged = function() {
  var self = this;
  this._locationManager.onCurrentLocationChanged().addListener(new epiviz.events.EventListener(
    /**
     * @param {{oldValue: epiviz.datatypes.GenomicRange, newValue: epiviz.datatypes.GenomicRange}} e
     */
    function(e) {
      self._updateSelectedLocation(e.newValue);
    }));
};

/**
 * @private
 */
epiviz.ui.ControlManager.prototype._registerSeqInfosUpdated = function() {
  var self = this;
  this._locationManager.onSeqInfosUpdated().addListener(new epiviz.events.EventListener(function(seqNames) {
    self._updateSeqNames(seqNames);
  }));
};
