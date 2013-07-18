/**
 * Created with JetBrains PhpStorm.
 * User: florin
 * Date: 10/31/12
 * Time: 10:37 AM
 * To change this template use File | Settings | File Templates.
 */

/*
 * Initializations
 */
$(function() {
  window.onbeforeunload = function() {
    if (!UILocation.user || !Workspace.instance.hasChanged()) { return; }

    return 'If you reload or close the page now, you will lose any workspace changes you have made.';
  };
});

$(function() {
  //LocalController.instance.initialize('ws://localhost:7312');
  LocalController.instance.initialize(Request.controllerHost);
  EventManager.instance.requestMeasurements();
});

/*
 * Accordions: left, bottom
 */
$(function () {
  var leftAccordion = $('#left-accordion');
  leftAccordion.multiAccordion();
  leftAccordion.multiAccordion('option', 'active', 'all');

  var bottomAccordion = $('#bottom-accordion');
  bottomAccordion.multiAccordion();
  bottomAccordion.multiAccordion('option', 'active', 'all');
});

/*
 * Information pane
 */
$(function () {
  InformationDetailsManager.instance.initialize('#information');
});

/*
 * Chart manager
 */
$(function() {
  ChartManager.instance.initialize('#track-container', '#chart-container');
});

/*
 * Selectable; TODO: Move code like this to scatter plot and tracks
 */
$(function () {
  /*
  scatterplot.selectable({
    delay: 100,
    start: function(event, ui) {
      // GeneScatterPlot.instance.selectionStart(event.offsetX, event.offsetY);
      console.log('started');
    },
    stop: function(event, ui) {
      // GeneScatterPlot.instance.selectionStop(event.offsetX, event.offsetY);
      console.log('stopped');
    }
  });
  */
});

/*
 * Toolbar
 */
$(function () {

  // Chromosome selector

  var optionFormat = '<option value="%s"%s>%s</option>';
  var chromosomeSelector = $('#chromosome-selector');
  chromosomeSelector.empty();
  for (var i=1; i<=22; ++i) {
    var option = sprintf(optionFormat, 'chr' + i, (i==1) ? 'selected="selected"' : '', 'chr' + i);
    chromosomeSelector.append(option);
  }
  chromosomeSelector.append(sprintf(optionFormat, 'chrX', '', 'chrX'));
  chromosomeSelector.append(sprintf(optionFormat, 'chrY', '', 'chrY'));

  chromosomeSelector.selectmenu({
    style:'popup',
    width:'90',
    maxHeight:'100',
    menuWidth:'90'
  });

  chromosomeSelector.change(function () {
    UILocation.chr = $(this).val();
    UILocation.change();
  });

  // Location text box

  $('#text-location').keypress(function(event) {
    if (event.which != 13) { return; }

    try {
      var location = $(this).val();
      var startEnd = location.split('-');

      UILocation.start = Globalize.parseInt(startEnd[0]);
      UILocation.width = Globalize.parseInt(startEnd[1]) - Globalize.parseInt(startEnd[0]);
      UILocation.change();
    } catch (error) {
      return false;
    }
  });

  // Navigate forward / backward

  $('#moveright').button({
    icons:{
      primary: 'ui-icon ui-icon-seek-next'
    },
    text:false
  }).click(function () {
    var value = UILocation.start + Math.floor(UILocation.width * UILocation.stepRatio);
    UILocation.start = value;
    UILocation.change();
  });

  $("#moveleft").button({
    icons:{
      primary: 'ui-icon ui-icon-seek-prev'
    },
    text:false
  }).click(function () {
    var value = UILocation.start - Math.floor(UILocation.width * UILocation.stepRatio);
    UILocation.start = value;
    UILocation.change();
  });

  // Zoom in / out

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

  zoomin.click(function () {
    var mid = UILocation.start + UILocation.width * 0.5;
    UILocation.width = Math.floor(UILocation.width * UILocation.zoominRatio);
    UILocation.start = mid - UILocation.width * 0.5;
    UILocation.change();
  });

  zoomout.click(function () {
    var mid = UILocation.start + UILocation.width * 0.5;
    UILocation.width = Math.floor(UILocation.width * UILocation.zoomoutRatio);
    UILocation.start = mid - UILocation.width * 0.5;
    UILocation.change();
  });

  // Location settings menu

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
        UILocation.change(true);
        //Workspace.instance.resetChanged();
        $(this).dialog("close");
      },
      'Cancel': function() {
        $('#zoomin-ratio-text').val(Globalize.format(UILocation.zoominRatio, 'n3'));
        $('#zoomout-ratio-text').val(Globalize.format(UILocation.zoomoutRatio, 'n3'));
        $('#navigation-step-ratio-text').val(Globalize.format(UILocation.stepRatio, 'n6'));
        $(this).dialog("close");
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
  }).val('1.200');

  $('#zoomin-ratio-text').spinner({
    min: 0.001,
    max: 0.999,
    step: 0.010,
    start: 0.800,
    numberFormat: 'n3'
  }).val('0.800');

  $('#navigation-step-ratio-text').spinner({
    min:   0.000001,
    max:   1.000000,
    step:  0.000001,
    start: 0.200000,
    numberFormat: 'n6'
  }).val('0.200000');

  // Chart settings menus

  var plotMenu = $('#plot-menu');
  var trackMenu = $('#track-menu');

  $('#plot-button')
    .button({
      text: false,
      icons: {
        primary: 'ui-icon ui-icon-scatterplot', // 'ui-icon ui-icon-bookmark',
        secondary: "ui-icon-triangle-1-s"
      }
    })
    .click(function() {
      var menu = plotMenu;
      var visible = menu.is(":visible");
      $('.dropdown-menu').find(">:first-child").hide();
      if (!visible) {
        menu.show().position({
          my: "left top",
          at: "left bottom",
          of: this
        });
      }
      $( document ).one( "click", function() {
        menu.hide();
      });
      return false;
    });

  $('#track-button').button({
    text: false,
    icons: {
      primary: 'ui-icon ui-icon-track',// 'ui-icon ui-icon-tag',
      secondary: "ui-icon-triangle-1-s"
    }
  }).click(function() {
      var menu = trackMenu;
      var visible = menu.is(":visible");
      $('.dropdown-menu').find(">:first-child").hide();
      if (!visible) {
        menu.show().position({
          my: "left top",
          at: "left bottom",
          of: this
        });
      }
      $( document ).one( "click", function() {
        menu.hide();
      });
      return false;
    });

  ChartFactory.foreachChartTypeHandler(function(handler) {
    var id;
    var menu;
    if (handler.getChartDisplayType() == ChartDisplayType.PLOT) {
      id = sprintf('plot-menu-add-%s', handler.getChartType());
      menu = plotMenu;
    } else {
      id = sprintf('track-menu-add-%s', handler.getChartType());
      menu = trackMenu;
    }

    menu.append(
      sprintf('<li><a href="javascript:void(0)" id="%s">Add New %s</a></li>',
        id, handler.getChartTypeName()));
    $('#' + id).click(function() {
      handler.getAddDialog().dialog('open');
    });
  });

  plotMenu
    .hide()
    .menu();

  trackMenu
    .hide()
    .menu();

  $('#track-menu-edit-tracks')
    .click(function() {
      var dialog = $('#edit-tracks-dialog');
      dialog.dialog('open');
    });

  $('#sortable-track-list').sortable({
    placeholder: "ui-state-highlight",
    start: function(event, ui) { },
    change: function(event, ui) { },
    update: function(event, ui) {
      var chartId = ui.item.data('id');
      var newIndex = ui.item.index();

      ChartManager.instance.moveTrack(chartId, newIndex);

      Workspace.instance.update();
      Workspace.instance.changed();
    }
  });

  $('#edit-tracks-dialog').dialog({
    autoOpen: false,
    width: '300',
    height: '250',
    resizable: true,
    buttons:{
      "Ok":function () {
          $(this).dialog("close");
      }
    },
    modal:true
  });

  // Computed columns

  var computedMeasurementsMenu = $('#computed-measurements-menu');

  $('#computed-measurements-button')
    .button({
      text: false,
      icons: {
        primary: 'ui-icon ui-icon-calculator',
        secondary: "ui-icon-triangle-1-s"
      }
    })
    .click(function() {
      var menu = computedMeasurementsMenu;
      var visible = menu.is(":visible");
      $('.dropdown-menu').find(">:first-child").hide();
      if (!visible) {
        menu.show().position({
          my: "left top",
          at: "left bottom",
          of: this
        });
      }
      $( document ).one( "click", function() {
        menu.hide();
      });
      return false;
    });


  ChartFactory.foreachDataTypeHandler(function(handler) {
    var id = sprintf('computed-measurements-menu-add-%s', handler.getDataType());
    var menu = computedMeasurementsMenu;
    if (!handler.isNumeric()) {
      return;
    }

    menu.append(
      sprintf('<li><a href="javascript:void(0)" id="%s">Edit %s Computed Measurements</a></li>',
        id, handler.getDataTypeName()));
    $('#' + id).click(function() {
      handler.getComputedMeasurementDialog().dialog('open');
    });
  });

  computedMeasurementsMenu
    .hide()
    .menu();

  // Help

  $('#help-button').button({
    text: false,
    icons: {
      primary: 'ui-icon ui-icon-help'
    }
  }).click(
    function() {
      var win=window.open('help/', '_blank');
      win.focus();
    });
});

/*
 * Save SVG
 */
$(function() {
  $('#save-svg-dialog').dialog({
    autoOpen: false,
    width: '150',
    buttons: {
      "Ok": function() {
        var svg = $(SaveSvg.parentId).find('svg').clone();
        svg.attr('xmlns', 'http://www.w3.org/2000/svg');
        svg.attr('version', '1.1');

        var fileFormat = $('#svg-file-format');

        var form = document.forms['svg-save-form'];

        form.action = DataManager.instance.getServerLocation() + 'data/chart_saving/save_svg.php';
        form['svg'].value = $('<div>').append(svg).html();
        form['format'].value = fileFormat.val();
        form.submit();
        $(this).dialog("close");
      },
      "Cancel": function() {
        $(this).dialog("close");
      }
    },
    modal:true
  });

  $('#svg-file-format').selectmenu({
    style:'popup',
    width:'100',
    maxHeight:'100',
    menuWidth:'100'
  });
});

/*
 * Pick colors
 */
$(function() {
  $('#pick-colors-dialog').dialog({
    autoOpen: false,
    width: '440',
    buttons: {
      "Ok": function() {
        ChartColorPicker.instance.changeChartColors();
        $(this).dialog("close");
      },
      "Cancel": function() {
        $(this).dialog("close");
      },
      "Reset": function() {
        ChartColorPicker.instance.initializeChartColors();
      }
    },
    modal:true
  });
});


/*
 * Layout
 */
$(function () {
  var layout = $('body').layout({
    applyDefaultStyles: true,
    east__size:    390,
    east__minSize: 390,
    north__resizable: false,
    north__initHidden: false,
    south__initHidden: true,
    east__initClosed: true,
    center__onresize: function() {
      EventManager.instance.chartContainerResized(null);
    }
  });
  // layout.open('north');
});

/*
 * Search box
 */
$(function() {
  var searchBox = $('#search-box');
  searchBox.autocomplete({
    source: function(request, callback) {
      DataManager.instance.search(request, callback);
    },
    minLength: 2,
    select: function( event, ui ) {
      var probe = ui.item.metadata.probe;
      var gene = ui.item.metadata.gene;
      var start, end, chr;
      var selObj = {};
      if (probe) {
        start = probe[3];
        end = probe[4];
        chr = probe[2];
        selObj.gene = probe[1];
        selObj.probe = probe[0];
      } else if (gene) {
        start = gene[2];
        end = gene[3];
        chr = gene[1];
        selObj.gene = gene[0];
      }
      selObj.start = start;
      selObj.end = end;

      EventManager.instance.blockUnhovered();
      EventManager.instance.blockDeselected();

      var mid = Math.floor((start + end) / 2);
      var wWidth = UILocation.width;
      var wStart = mid - Math.floor(wWidth / 2);

      UILocation.start = wStart;
      UILocation.chr = chr;
      UILocation.change();

      EventManager.instance.blockSelected(selObj);
    },
    open: function() {
      //$( this ).removeClass( "ui-corner-all" ).addClass( "ui-corner-top" );
    },
    close: function() {
      //$( this ).removeClass( "ui-corner-top" ).addClass( "ui-corner-all" );
    }
  }).data('autocomplete')._renderItem = function(ul, item) {
    return $( '<li></li>' )
      .data( 'item.autocomplete', item )
      .append(sprintf('<a>%s</a>', item.metadata.html))
      .appendTo( ul );
  };

  searchBox.watermark('Find Gene/Probe');
});

/*
 * Workspaces
 */
$(function() {
  var saveTextBox = $('#save-workspace-text');
  var saveWorkspaceButton = $('#save-workspace-button');
  var deleteWorkspaceButton = $('#delete-workspace-button');

  saveWorkspaceButton.button({
    text: false,
    icons: {
      primary: 'ui-icon-disk'
    }
  }).click(function(e) {
      try {
        var name = saveTextBox.val();
        var pattern = /[a-zA-Z0-9_\s]+/g;

        var result = pattern.exec(name);

        if (result == name) {
          // Name is good. Now check if there is a user logged in.

          if (UILocation.user) {
            Workspace.save(name);
          } else {
            MessageDialogs.instance.question(
              'You need to log in in order to save the workspace. Do you wish to log in now?',

              // Action for yes
              function() {
                UILocation.login();
                return true; // Close dialog
              },

              // Action for no
              function() {
                return true; // Close dialog
              }
            );
          }

          return;
        }

        Utils.notify(saveTextBox, 'Accepted characters are a-z, A-Z, 0-9, _ and whitespace');

      } catch (error) {
        Utils.notify(saveTextBox, error);
      }
  });

  deleteWorkspaceButton.button({
    text: false,
    icons: {
      primary: 'ui-icon-trash'
    }
  }).click(function(e) {
      if (saveTextBox.val() == Workspace.DEFAULT_NAME) { return; }

      MessageDialogs.instance.question(
        'Are you sure you want to delete the current workspace?',

        // Action if yes
        function() {
          Workspace.delete();
          return true; // Close dialog
        },

        // Action if no
        function() {
          return true; // Close dialog
        }
      )
    });

  saveTextBox.watermark('Save Workspace Name');

  saveTextBox.autocomplete({
    source: function(request, callback) {

      var ws = Workspace.workspacesData;
      var r =
        $.map(ws, function(item) {
          return {
            label: '',
            metadata: {
              id: item[0],
              name: item[1],
              html: sprintf('<b>%s</b>, %s, %s, %s',
                item[1], item[2], Globalize.format(item[3], 'n0'), Globalize.format(item[4], 'n0'))
            },
            value: item[1]
          };
        });
      callback(r);
    },
    minLength: 0,
    select: function( event, ui ) {
      if (!Workspace.instance.hasChanged()) {
        Workspace.switch(ui.item.metadata.id);
        return;
      }

      MessageDialogs.instance.question(
        'If you reload or close the page now, you will lose any workspace changes you have made. Do you want to continue?',

        // Action for yes
        function() {
          Workspace.switch(ui.item.metadata.id);
          return true; // Close dialog
        },

        // Action for no
        function() {
          saveTextBox.val(Workspace.instance.name);
          return true; // Close dialog
        }
      );
    },
    open: function() {},
    close: function() {}
  }).data('autocomplete')._renderItem = function(ul, item) {
    return $( '<li></li>' )
      .data( 'item.autocomplete', item )
      .append(sprintf('<a>%s</a>', item.metadata.html))
      .appendTo( ul );
  };

  saveTextBox.click(function() { saveTextBox.autocomplete('search', ''); });
});

/*
 * Browser compatibility
 */
$(function() {
  var ie = getInternetExplorerVersion();
  if (ie > 0) {
    MessageDialogs.instance.error('EpiViz works best on Google Chrome, Apple Safari or Mozilla Firefox. Please open it using one of those browsers.');
  }
});

/*
 * D3 Additions
 */
d3.endAll = function (transition, callback) {
  var n = 0;
  transition
  .each(function () {
    ++n;
  })
  .each('end', function () {
    if (!--n) callback.apply(this, arguments);
  });
};

