/**
 * Created by: Florin Chelaru
 * Date: 10/3/13
 * Time: 12:14 PM
 */

goog.provide('epiviz.Config');

/**
 * @param {*} [settingsMap] A map of settings to override the default settings for the config.
 * @constructor
 */
epiviz.Config = function(settingsMap) {

  /**
   * The server storing all the back-end PHP scripts
   * @type {string}
   */
  this.dataServerLocation = null;

  /**
   * The path of the php script that handles chart saving, relative to dataServerLocation
   * @type {string}
   */
  this.chartSaverLocation = null;

  /**
   * A number between 0 and 1
   * @type {number}
   */
  this.zoominRatio = null;

  /**
   * A number greater than 1
   * @type {number}
   */
  this.zoomoutRatio = null;

  /**
   * A number between 0 and 1
   * @type {number}
   */
  this.navigationStepRatio = null;

  /**
   * The delay in milliseconds between a user command and the command being propagated to the data layer
   * @type {number}
   */
  this.navigationDelay = null;

  /**
   * @type {{
   *    name: string,
   *    content: {
   *      range: {seqName: string, start: number, width: number},
   *      measurements: Array.<{
            id: string, name: string, type: string, datasourceId: string,
            datasourceGroup: string, dataprovider: string, formula: null,
            defaultChartType: string, annotation: ?Object.<string, string>,
            minValue: ?number, maxValue: ?number,
            metadata: ?Array.<string>
          }>,
   *      charts: Object.<epiviz.ui.charts.VisualizationType.DisplayType, Array.<{
   *        id: string,
   *        type: string,
   *        properties: {
   *          width: number, height: number, margins: { top: number, left: number, bottom: number, right: number },
   *          measurements: Array.<number>, colors: Array.<string>, customSettings: Object.<string, string>
   *        }
   *      }>>
   *    }
   * }}
   */
  this.defaultWorkspaceSettings = null;

  /**
   * An array of strings in the following format:
   *   [typename],[arguments], where typename is the name of a type that
   *   extends DataProvider, and arguments is a list of arguments used for
   *   constructing the data provider, separated by comma.
   *
   * @type {Array.<string>}
   */
  this.dataProviders = null;

  /**
   * @type {string}
   */
  this.workspacesDataProvider = null;

  /**
   * The time interval used by the cache to clear away unneeded loaded data
   * @type {number}
   */
  this.cacheUpdateIntervalMilliseconds = 30000;

  /**
   * The maximum number of search results to show in the gene search box
   * @type {number}
   */
  this.maxSearchResults = null;

  /**
   * @type {Array.<string>}
   */
  this.chartTypes = null;

  // Default chart properties: these settings map either generic chart display types (plot or track),
  // or specific chart types (for example epiviz.plugins.charts.BlocksTrack) to corresponding
  // configurations.
  //
  // Example:
  // this.chartSettings = {
  //   plot: { width: 400, height: 100 },
  //   'epiviz.plugins.charts.GenesTrack': { height: 150 },
  //   'epiviz.plugins.charts.BlocksTrack': { width: 450, height: 190 }
  // }


  /**
   * @type {Object.<epiviz.ui.charts.VisualizationType.DisplayType|string, Object.<epiviz.Config.VisualizationPropertySettings, *>>}
   */
  this.chartSettings = null;

  /**
   * A map of chart type and settings specific to that particular chart type
   * Example:
   * this.chartCustomSettings = {
   *   'epiviz.plugins.charts.LineTrack': {
   *     maxPoints: 1000
   *   }
   * }
   * @type {Object<string, Object<string, *>>}
   */
  this.chartCustomSettings = null;

  /**
   * @type {{algorithms: Array.<string>, metrics: Array.<string>, linkages: Array.<string>}}
   */
  this.clustering = null;

  /**
   * @type {Array.<epiviz.ui.charts.ColorPalette>}
   */
  this.colorPalettes = null;

  /**
   * @type {Object.<string, epiviz.ui.charts.ColorPalette>}
   */
  this.colorPalettesMap = null;

  // Override settings included in the given object
  if (settingsMap) {
    for (var setting in settingsMap) {
      if (!settingsMap.hasOwnProperty(setting)) { continue; }
      this[setting] = settingsMap[setting];
    }

    var socketHosts = epiviz.ui.WebArgsManager.WEB_ARGS['websocket-host'];
    if (socketHosts && socketHosts.length) {
      for (var i = 0; i < socketHosts.length; ++i) {
        this.dataProviders.push(sprintf('epiviz.data.WebsocketDataProvider,%s,%s',
          epiviz.data.WebsocketDataProvider.DEFAULT_ID + '-' + i,
          socketHosts[i]));
      }
    }
  }

  var colorPalettesMap = {};
  this.colorPalettes.forEach(function(palette) {
    colorPalettesMap[palette.id()] = palette;
  });
  this.colorPalettesMap = colorPalettesMap;
};

/**
 * A map of settings that are used as input for the EpiViz configuration
 * @type {*}
 */
epiviz.Config.SETTINGS = {};

/**
 * @const {string}
 */
epiviz.Config.DEFAULT_DATA_PROVIDER_ID = 'umd';

/**
 * @const {string}
 */
epiviz.Config.DEFAULT_WORKSPACE_NAME = 'Default Workspace';

/**
 * @type {Array.<string>}
 * @const
 */
epiviz.Config.EPIVIZ_V1_COLORS = ['#025167', '#e7003e', '#ffcd00', '#057d9f', '#970026', '#ffe373', '#ff8100'];

/**
 * @type {Array.<string>}
 * @const
 */
epiviz.Config.COLORS_BRIGHT = ['#1859a9', '#ed2d2e', '#008c47', '#010101', '#f37d22', '#662c91', '#a11d20', '#b33893'];

/**
 * @type {Array.<string>}
 * @const
 */
epiviz.Config.COLORS_LIGHT = ['#b8d2eb', '#f2aeac', '#d8e4aa', '#cccccc', '#f2d1b0', '#d4b2d3', '#ddb8a9', '#ebbfd9'];

/**
 * @type {Array.<string>}
 * @const
 */
epiviz.Config.COLORS_MEDIUM = ['#599ad3', '#f1595f', '#79c36a', '#727272', '#f9a65a', '#9e66ab', '#cd7058', '#d77fb3'];

/**
 * @type {Array.<string>}
 * @const
 */
epiviz.Config.COLORS_D3_CAT10 = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"];

/**
 * @type {Array.<string>}
 * @const
 */
epiviz.Config.COLORS_D3_CAT20 = ["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5", "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7", "#bcbd22", "#dbdb8d", "#17becf", "#9edae5"];

/**
 * @type {Array.<string>}
 * @const
 */
epiviz.Config.COLORS_D3_CAT20B = ["#393b79", "#5254a3", "#6b6ecf", "#9c9ede", "#637939", "#8ca252", "#b5cf6b", "#cedb9c", "#8c6d31", "#bd9e39", "#e7ba52", "#e7cb94", "#843c39", "#ad494a", "#d6616b", "#e7969c", "#7b4173", "#a55194", "#ce6dbd", "#de9ed6"];

/**
 * @type {Array.<string>}
 * @const
 */
epiviz.Config.COLORS_D3_CAT20C = ["#3182bd", "#6baed6", "#9ecae1", "#c6dbef", "#e6550d", "#fd8d3c", "#fdae6b", "#fdd0a2", "#31a354", "#74c476", "#a1d99b", "#c7e9c0", "#756bb1", "#9e9ac8", "#bcbddc", "#dadaeb", "#636363", "#969696", "#bdbdbd", "#d9d9d9"];

/**
 * @enum {string}
 */
epiviz.Config.VisualizationPropertySettings = {
  WIDTH: 'width',
  HEIGHT: 'height',
  MARGINS: 'margins',
  COLORS: 'colors',
  DECORATIONS: 'decorations'
};
