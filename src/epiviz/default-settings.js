/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/9/13
 * Time: 11:13 AM
 */

/**
 * Overrides the default configuration settings for EpiViz
 */
epiviz.Config.SETTINGS = {

  // PHP/MySQL Data

  dataServerLocation: '', // TODO: Fill in

  chartSaverLocation: 'src/chart_saving/save_svg.php',

  // Navigation settings

  zoominRatio: 0.8,
  zoomoutRatio: 1.2,
  navigationStepRatio: 0.2,

  navigationDelay: 0,

  // Plug-ins

  dataProviders: [
    sprintf('epiviz.data.WebServerDataProvider,%s,%s',
      epiviz.Config.DEFAULT_DATA_PROVIDER_ID,
      '') // TODO: Fill in
  ],

  workspacesDataProvider: sprintf('epiviz.data.WebServerDataProvider,%s,%s',
    'workspaces_provider',
    ''), // TODO: Fill in

  cacheUpdateIntervalMilliseconds: 30000,

  maxSearchResults: 12,

  chartTypes: [
    'epiviz.plugins.charts.BlocksTrackType',
    'epiviz.plugins.charts.LineTrackType',
    'epiviz.plugins.charts.StackedLineTrackType',
    'epiviz.plugins.charts.ScatterPlotType',
    'epiviz.plugins.charts.GenesTrackType',
    'epiviz.plugins.charts.HeatmapPlotType',
    'epiviz.plugins.charts.LinePlotType',
    'epiviz.plugins.charts.StackedLinePlotType'
  ],

  // Chart default settings

  chartSettings: {
    default: {
      colors: 'd3-category10',
      decorations: [
        'epiviz.ui.charts.decoration.RemoveChartButton',
        'epiviz.ui.charts.decoration.SaveChartButton',
        'epiviz.ui.charts.decoration.CustomSettingsButton',
        'epiviz.ui.charts.decoration.EditCodeButton',

        'epiviz.ui.charts.decoration.ChartColorsButton',
        'epiviz.ui.charts.decoration.ChartLoaderAnimation',
        'epiviz.ui.charts.decoration.ChartResize'
      ]
    },

    plot: {
      width: 400,
      height: 400,
      margins: new epiviz.ui.charts.Margins(15, 30, 30, 15),
      decorations: [
        'epiviz.ui.charts.decoration.ToggleTooltipButton',

        'epiviz.ui.charts.decoration.ChartTooltip',
        'epiviz.ui.charts.decoration.ChartFilterCodeButton'
      ]
    },

    track: {
      width: '100%',
      height: 90,
      margins: new epiviz.ui.charts.Margins(25, 20, 23, 10),
      decorations: [
        'epiviz.ui.charts.decoration.ToggleTooltipButton',

        'epiviz.ui.charts.decoration.ChartTooltip',
        'epiviz.ui.charts.decoration.ChartFilterCodeButton'
      ]
    },

    'epiviz.plugins.charts.GenesTrack': {
      height: 120,
      colors: 'genes-default'
    },

    'epiviz.plugins.charts.LineTrack': {
      decorations: [
        'epiviz.ui.charts.decoration.ChartGroupByMeasurementsCodeButton',
        'epiviz.ui.charts.decoration.ChartColorByMeasurementsCodeButton'
      ]
    },

    'epiviz.plugins.charts.StackedLineTrack': {
      height: 300
    },

    'epiviz.plugins.charts.ScatterPlot': {
      margins: new epiviz.ui.charts.Margins(15, 50, 50, 15)
    },

    'epiviz.plugins.charts.HeatmapPlot': {
      width: 800,
      height: 400,
      margins: new epiviz.ui.charts.Margins(80, 120, 40, 40),
      decorations: [
        'epiviz.ui.charts.decoration.ChartGroupByMeasurementsCodeButton',
        'epiviz.ui.charts.decoration.ChartOrderByMeasurementsCodeButton',
        'epiviz.ui.charts.decoration.ChartColorByRowCodeButton'
      ],
      colors: 'heatmap-default'
    },

    'epiviz.plugins.charts.LinePlot': {
      width: 800,
      height: 400,
      margins: new epiviz.ui.charts.Margins(30, 30, 50, 15),
      decorations: [
        'epiviz.ui.charts.decoration.ChartGroupByMeasurementsCodeButton',
        'epiviz.ui.charts.decoration.ChartColorByRowCodeButton',
        'epiviz.ui.charts.decoration.ChartOrderByMeasurementsCodeButton'
      ],
      colors: 'd3-category20b'
    },

    'epiviz.plugins.charts.StackedLinePlot': {
      width: 800,
      height: 400,
      margins: new epiviz.ui.charts.Margins(30, 30, 50, 15),
      decorations: [
        'epiviz.ui.charts.decoration.ChartGroupByMeasurementsCodeButton',
        'epiviz.ui.charts.decoration.ChartColorByRowCodeButton',
        'epiviz.ui.charts.decoration.ChartOrderByMeasurementsCodeButton'
      ],
      colors: 'd3-category20b'
    }
  },

  chartCustomSettings: {
    'epiviz.plugins.charts.BlocksTrack': {
      minBlockDistance: 3
    },
    'epiviz.plugins.charts.GenesTrack': {

    },
    'epiviz.plugins.charts.LineTrack': {
      step: 150,
      showPoints: true,
      showLines: true,
      pointRadius: 3,
      lineThickness: 2
    },
    'epiviz.plugins.charts.ScatterPlot': {
      circleRadiusRatio: 0.01
    },
    'epiviz.plugins.charts.HeatmapPlot': {
      maxColumns: 120
    }
  },

  defaultWorkspaceSettings: {
    name: epiviz.Config.DEFAULT_WORKSPACE_NAME,
    content: {
      range: {
        seqName: 'chr11',
        start: 99800000,
        width: 3583180
      },
      measurements: [
        {
          id: 'genes',
          name: 'Genes',
          type: 'range',
          datasourceId: 'genes',
          datasourceGroup: 'genes',
          dataprovider: epiviz.Config.DEFAULT_DATA_PROVIDER_ID,
          formula: null,
          defaultChartType: 'Genes Track',
          annotation: null,
          minValue: null,
          maxValue: null,
          metadata: ['gene', 'entrez', 'exon_starts', 'exon_ends']
        }
      ],
      charts: {
        track: [
          {
            id: 'track-genes-initial',
            type: 'epiviz.plugins.charts.GenesTrack',
            properties: { width: 837, height: 120,
              margins: { top: 25, left: 20, bottom: 23, right: 10 },
              measurements: [0],
              colors: { id: 'genes-default' },
              customSettings: {}
            }
          }
        ],
        plot: []
      }
    }
  },

  clustering: {
    algorithms: [
      'epiviz.ui.charts.transform.clustering.NoneClustering',
      'epiviz.ui.charts.transform.clustering.AgglomerativeClustering'
    ],
    metrics: ['epiviz.ui.charts.transform.clustering.EuclideanMetric'],
    linkages: ['epiviz.ui.charts.transform.clustering.CompleteLinkage']
  },

  colorPalettes: [
    new epiviz.ui.charts.ColorPalette(
      ['#025167', '#e7003e', '#ffcd00', '#057d9f', '#970026', '#ffe373', '#ff8100'],
      'Epiviz v1.0 Colors', 'epiviz-v1'),
    new epiviz.ui.charts.ColorPalette(
      ['#1859a9', '#ed2d2e', '#008c47', '#010101', '#f37d22', '#662c91', '#a11d20', '#b33893'],
      'Epiviz v2.0 Bright', 'epiviz-v2-bright'),
    new epiviz.ui.charts.ColorPalette(
      ['#b8d2eb', '#f2aeac', '#d8e4aa', '#cccccc', '#f2d1b0', '#d4b2d3', '#ddb8a9', '#ebbfd9'],
      'Epiviz v2.0 Light', 'epiviz-v2-light'),
    new epiviz.ui.charts.ColorPalette(
      ['#599ad3', '#f1595f', '#79c36a', '#727272', '#f9a65a', '#9e66ab', '#cd7058', '#d77fb3'],
      'Epiviz v2.0 Medium', 'epiviz-v2-medium'),
    new epiviz.ui.charts.ColorPalette(
      ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"],
      'D3 Category 10', 'd3-category10'),
    new epiviz.ui.charts.ColorPalette(
      ["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5", "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7", "#bcbd22", "#dbdb8d", "#17becf", "#9edae5"],
      'D3 Category 20', 'd3-category20'),
    new epiviz.ui.charts.ColorPalette(
      ["#393b79", "#5254a3", "#6b6ecf", "#9c9ede", "#637939", "#8ca252", "#b5cf6b", "#cedb9c", "#8c6d31", "#bd9e39", "#e7ba52", "#e7cb94", "#843c39", "#ad494a", "#d6616b", "#e7969c", "#7b4173", "#a55194", "#ce6dbd", "#de9ed6"],
      'D3 Category 20b', 'd3-category20b'),
    new epiviz.ui.charts.ColorPalette(
      ["#3182bd", "#6baed6", "#9ecae1", "#c6dbef", "#e6550d", "#fd8d3c", "#fdae6b", "#fdd0a2", "#31a354", "#74c476", "#a1d99b", "#c7e9c0", "#756bb1", "#9e9ac8", "#bcbddc", "#dadaeb", "#636363", "#969696", "#bdbdbd", "#d9d9d9"],
      'D3 Category 20c', 'd3-category20c'),
    new epiviz.ui.charts.ColorPalette(
      ['#f9a65a', '#599ad3', '#79c36a', '#f1595f', '#727272', '#cd7058', '#d77fb3'],
      'Genes Default', 'genes-default'),
    new epiviz.ui.charts.ColorPalette(
      ['#1859a9', '#ed2d2e', '#008c47', '#010101', '#f37d22', '#662c91', '#a11d20', '#b33893'],
      'Heatmap Default', 'heatmap-default')
  ]
};
