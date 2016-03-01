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

  $(sprintf('<div class="dropdown-menu">' +
      '<ul id="tutorial-list">' +
      '<li class="ui-widget-header">Tutorials</li>' +
      '<li><a href="javascript:void(0);" id="tut-epiviz-overview">EpiViz Overview</a></li>' +
      '<li><a href="javascript:void(0);" id="tut-data-controls">Data Visualization and Controls</a></li>' +
      '<li><a href="javascript:void(0);" id="tut-computed-measurements">Computed Measurements</a></li>' +
      '</ul>' +
      '</div>')).insertAfter(tutorialMenu);

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
    return false;
  });

  var intro = introJs();

  $('#tut-epiviz-overview').click(function() {

    intro.setOptions({
      steps: [
        {
          intro: "<p class='intro-header'>Welcome to Epiviz Genomic Browser!<br></p>" +
          "<p class='intro-text'>This tutorial will walk you through the functionality available in Epiviz.</p>"
        }, {
          element: '#intro-navigation',
          intro: "<p class='intro-text'>The navigation section of Epiviz lets you select a chromosome and explore the genome. Options are available to move left/right and zoom in/out.</p>" +
          "<p class='intro-text'>The settings icon allows you to control the navigation parameters.</p>",
          position: 'right'
        }, {
          element: '#search-box',
          intro: "<p class='intro-header'>Use the search input to look for a specific gene or target.</p>" +
          "<p class='intro-text'>This will navigate Epiviz to the selected gene location and update the workspace with the new data.</p>",
          position: 'right'
        }, {
          element: '#vis-menu-button',
          intro: '<p class="intro-text">Choose from a list of available data sources, measurements or chart types to add visualizations to the Epiviz Workspace.</p>',
          position: 'right'
        }, {
          element: '#intro-workspace',
          intro: '<p class="intro-header">This section lets you manage your workspace.</p>' +
          '<p class="intro-text">If you are logged in, you will be able to save your Epiviz analysis and workspaces.' +
          'You will also be able to retrieve them at a later time from your account and manage your workspaces.</p>',
          position: 'right'
        }, {
          element: '#login-link',
          intro: '<p class="intro-text">Please login to save and manage Epiviz workspaces.</p>',
          position: 'left'
        }, {
          intro: "<p class='intro-header'>Thank you for using Epiviz!</p>" +
          '<p class="intro-text">If you would like to give us some feedback or stay informed with updates, Please visit the <a target="_blank" href="http://epiviz.github.io/">Epiviz webpage</a>.</p>'
        }
      ]
    });
    intro.start();

    tutorialList.hide();
  });

  // TODO: bugs when introjs is used inside modals/dialog box

  $('#tut-data-controls').click(function() {
    intro.setOptions({
      steps: [
        {
          intro: "<p class='intro-header'>Welcome to Epiviz Genomic Browser!<br>" +
          "Data visualization tutorial<br></p>" +
          "<p class='intro-text'>This tutorial will help you with adding new data visualizations to the Epiviz workspace " +
          "and controls available for charts.</p>"
        }, {
          element: '#vis-menu-button',
          intro: '<p class="intro-text">The Data Visualizations button helps users add new charts to the workspace. ' +
          'users have the option to choose data sources and measurements to add to the workspace.</p>',
          position: 'right'
        }, {
          element: '#vis-menu',
          intro: '<p class="intro-text">Choose the type of chart to add to your workspace.</p>',
          position: 'right'
        }, {
          element: '#wizardDialog',
          intro: '<p class="intro-text">This window lets you choose form a list of data sources and ' +
          'the measurements available from each data source to add to your Epiviz workspace</p>'
        }, {
          element: '#feature-view',
          intro: '<p class="intro-text">Visualizations are added to the workspace based on the type of chart. </p>' +
          '<p>Brushing is implemented on all the plots. When you hover over a data point, it highlight the data across all the plots on the workspace</p>' +
          '<p>options are available to remove, save or change colors for the visualization.</p>',
          position: 'right'
        }, {
          element: $('button[title="Remove"]')[0],
          intro: '<p class="intro-text">Removes the plot from the workspace</p>',
          position: 'right',
          disableInteraction: true
        }, {
          element: $('button[title="Save"]')[0],
          intro: '<p class="intro-text">Save a plot to your local machine (image, pdf)</p>',
          position: 'right',
          disableInteraction: true
        }, {
          element: $('button[title="Custom settings"]')[0],
          intro: '<p class="intro-text">Change chart display properties and aggregation methods for grouping.</p>',
          position: 'right',
          disableInteraction: true
        }, {
          element: $('button[title="Code"]')[0],
          intro: '<p class="intro-text">Edit code to redraw the chart on the workspace.</p>',
          position: 'right',
          disableInteraction: true
        }, {
          element: $('button[title="Colors"]')[0],
          intro: '<p class="intro-text">Choose colors for data points on the plot</p>',
          position: 'right',
          disableInteraction: true
        }, {
          intro: "<p class='intro-header'>Thank you for using Epiviz!</p>" +
          '<p class="intro-text">If you would like to give us some feedback or stay informed with updates, Please visit the <a target="_blank" href="http://epiviz.github.io/">Epiviz webpage</a>.</p>'
        }
      ]
    });

    intro.onchange(function(targetElem) {
      var id = targetElem.id;

      if(id === "vis-menu") {
        $('#vis-menu-button').button().trigger("click");
      }
      else if(id === "feature-view") {
        var parent = $('#wizardDialog').parent().attr('id');
        $('#' + parent).dialog('close');
      }

      intro.refresh();
    });

    intro.onbeforechange(function(targetElem) {
      var id = targetElem.id;

      if(id === "vis-menu") {
        $('#plot-menu-add-scatter').trigger("click");
      }

      intro.refresh();
    });

    intro.start();

    tutorialList.hide();
  });

  $('#tut-computed-measurements').click(function() {

    intro.setOptions({
      steps: [
        {
          intro: "<p class='intro-header'>Welcome to Epiviz Genomic Browser!<br>" +
          "Compute Measurements Tutorial<br></p>" +
          "<p class='intro-text'>This tutorial will help you add new measurements (derived from existing measurements) and generate plots to add " +
          "to the workspace.</p>"
        }, {
          element: '#computed-measurements-button',
          intro: "<p class='intro-text'>The computed measurements button helps users " +
          "add new measurements to data sources</p>",
          position: 'right'
        }, {
          element: $('div.ui-dialog.ui-widget.ui-widget-content.ui-corner-all.ui-draggable.ui-resizable.ui-dialog-buttons')[0],
          intro: "<p class='intro-text'>This tab lets you " +
          "choose a data source which you will use to create a new measurements.</p>",
          position: 'right'
        }, {
          element: '#computedMeasurementsDialog table',
          intro: "<p class='intro-text'>The measurements tab lists " +
          "all available measurements from the selected data source. <br>On this screen, users will be able to add measurements " +
          "to the expression window. <br>All mathematical operators can be used in between measurement variables to evaluate.<br>" +
          "For a list of supported operators - please visit <a href='https://github.com/silentmatt/js-expression-eval/tree/master'>Expression Operators</a></p>",
          position: 'right'
        }, {
          element: '#computedMeasurementsDialog table',
          intro: "<p class='intro-text'>After adding a computed measurement, " +
          "you can use the new measurement to plot data on the workspace. To add new plots, please use the Epiviz data visualization tutorial.</p>",
          position: 'right'
        }, {
          intro: "<p class='intro-header'>Thank you for using Epiviz!</p>" +
          '<p class="intro-text">If you would like to give us some feedback or stay informed with updates, Please visit the <a target="_blank" href="http://epiviz.github.io/">Epiviz webpage</a>.</p>'
        }
      ]
    });

    intro.onchange(function(targetElem) {
      var id = targetElem.id;

      if(id === "computed-measurements-button") {

        $('#computed-measurements-button').button().trigger("click");
      }
      else if(id === "computedMeasurementsDialog") {

        //var parent = $('#computedMeasurementsDialog').parent().attr('id');
        $('#computedMeasurementsDialog table tbody tr td:first').trigger('click');
      }
      intro.refresh();
    });

    intro.start();

    tutorialList.hide();
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

          var container = $("body");

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

            // add timestamp to every screenshot!
            var timestamp = Math.floor($.now() / 1000);
            var filename = "epiviz_" + timestamp + "." + format;

            var image = canvas.toDataURL("image/png");

            if(format == "pdf") {
              var jsdoc = new jsPDF('p', 'px', [$("body").width(), $("body").height()]);
              jsdoc.addImage(image, 'PNG', 0, 0);
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
