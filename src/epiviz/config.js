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
  this.dataServerLocation = '';

  /**
   * The path of the php script that handles chart saving, relative to dataServerLocation
   * @type {string}
   */
  this.chartSaverLocation = '';

  /**
   * @type {number}
   */
  this.zoominRatio = 0.8;

  /**
   * @type {number}
   */
  this.zoomoutRatio = 1.2;

  /**
   * @type {number}
   */
  this.navigationStepRatio = 0.2;

  /**
   * @type {number}
   */
  this.navigationDelay = 100;

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
   *      charts: Object.<epiviz.ui.charts.ChartType.DisplayType, Array.<{
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
  this.defaultWorkspaceSettings = {
    name: epiviz.workspaces.Workspace.DEFAULT_WORKSPACE_NAME,
    content: {
      range: {
        seqName: 'chr11',
        start: 99800000,
        width: 3583180
      },
      measurements: [],
      charts: {
        track: [],
        plot: []
      }
    }
  };

  /**
   * An array of strings in the following format:
   *   [typename],[arguments], where typename is the name of a type that
   *   extends DataProvider, and arguments is a list of arguments used for
   *   constructing the data provider, separated by comma.
   *
   * @type {Array.<string>}
   */
  this.dataProviders = [
    sprintf('epiviz.data.WebServerDataProvider,%s,%s',
      epiviz.data.WebServerDataProvider.DEFAULT_ID,
      epiviz.data.WebServerDataProvider.DEFAULT_SERVER_ENDPOINT)
  ];

  /**
   * @type {string}
   */
  this.workspacesDataProvider = sprintf('epiviz.data.WebServerDataProvider,%s,%s',
    'workspaces_provider',
    epiviz.data.WebServerDataProvider.DEFAULT_SERVER_ENDPOINT);

  /**
   * The time interval used by the cache to clear away unneeded loaded data
   * @type {number}
   */
  this.cacheUpdateIntervalMilliseconds = 30000;

  /**
   * The maximum number of search results to show in the gene search box
   * @type {number}
   */
  this.maxSearchResults = 12;

  /**
   * @type {Array.<string>}
   */
  this.chartTypes = [];

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
   * @type {Object.<epiviz.ui.charts.ChartType.DisplayType|string, Object.<epiviz.Config.ChartPropertySettings, *>>}
   */
  this.chartSettings = {
    plot: {
      width: 600,
      height: 400,
      margins: new epiviz.ui.charts.Margins(10, 5, 5, 5),
      colors: new epiviz.ui.charts.ColorPalette(epiviz.Config.COLORS_BRIGHT)
    },

    track: {
      width: '100%',
      height: 120,
      margins: new epiviz.ui.charts.Margins(10, 5, 5, 5),
      colors: new epiviz.ui.charts.ColorPalette(epiviz.Config.COLORS_BRIGHT)
    }
  };

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
  this.chartCustomSettings = {};

  this.clustering = {
    algorithms: [
      'epiviz.ui.charts.transform.clustering.NoneClustering',
      'epiviz.ui.charts.transform.clustering.AgglomerativeClustering'
    ],
    metrics: ['epiviz.ui.charts.transform.clustering.EuclideanMetric'],
    linkages: ['epiviz.ui.charts.transform.clustering.CompleteLinkage']
  };

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
};

/**
 * @type {epiviz.ui.charts.ColorPalette}
 * @const
 */
epiviz.Config.EPIVIZ_V1_COLORS = ['#025167', '#e7003e', '#ffcd00', '#057d9f', '#970026', '#ffe373', '#ff8100'];

/**
 * @type {epiviz.ui.charts.ColorPalette}
 * @const
 */
epiviz.Config.COLORS_BRIGHT = ['#1859a9', '#ed2d2e', '#008c47', '#010101', '#f37d22', '#662c91', '#a11d20', '#b33893'];

/**
 * @type {epiviz.ui.charts.ColorPalette}
 * @const
 */
epiviz.Config.COLORS_LIGHT = ['#b8d2eb', '#f2aeac', '#d8e4aa', '#cccccc', '#f2d1b0', '#d4b2d3', '#ddb8a9', '#ebbfd9'];

/**
 * @type {epiviz.ui.charts.ColorPalette}
 * @const
 */
epiviz.Config.COLORS_MEDIUM = ['#599ad3', '#f1595f', '#79c36a', '#727272', '#f9a65a', '#9e66ab', '#cd7058', '#d77fb3'];

/**
 * @enum {string}
 */
epiviz.Config.ChartPropertySettings = {
  WIDTH: 'width',
  HEIGHT: 'height',
  MARGINS: 'margins',
  COLORS: 'colors'
};
