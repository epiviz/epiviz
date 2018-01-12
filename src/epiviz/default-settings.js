/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/9/13
 * Time: 11:13 AM
 */

/**
 * Overrides the default configuration settings for EpiViz
 */
epiviz.Config.SETTINGS = {

  configType: 'default',

  appTitle: location.hostname == "metaviz.cbcb.umd.edu" ? 'UMD Metagenome Browser' : 'Metaviz',

  // Navigation settings

  zoominRatio: 0.8,
  zoomoutRatio: 1.2,
  navigationStepRatio: 0.2,

  navigationDelay: 0,

  // Data retrieval

  dataServerLocation: '', //TODO: Fill in (in site-settings.js)
  chartSaverLocation: 'src/chart_saving/save_svg.php',
  dataProviders: [], //TODO: Fill in (in site-settings.js)

  // This is the data provider that handles workspaces; it can be different from the one getting all the other data:
  workspacesDataProvider: sprintf('epiviz.data.EmptyResponseDataProvider', 'empty', ''), //TODO: Fill in (in site-settings.js)

  // For datasources with hierarchies, the cache must be disabled (Epiviz will crash otherwise)
  useCache: false,

  // Every n milliseconds, the cache will free up any data associated with parts of the genome not recently visited
  cacheUpdateIntervalMilliseconds: 30000,

  // For genes search box:
  maxSearchResults: 12,

  // Epiviz will only be able to show any of the charts in this list; if it's not registered here, you will not see it in the UI
  chartTypes: [
    'epiviz.plugins.charts.ScatterPlotType',
    'epiviz.plugins.charts.HeatmapPlotType',
    'epiviz.plugins.charts.LinePlotType',
    'epiviz.plugins.charts.StackedLinePlotType',
    'epiviz.ui.charts.tree.IcicleType',
    'epiviz.plugins.charts.PCAScatterPlotType',
    'epiviz.plugins.charts.PCoAScatterPlotType',
    'epiviz.plugins.charts.DiversityScatterPlotType',
    'epiviz.plugins.charts.FeatureScatterPlotType',
    'epiviz.ui.charts.tree.SunburstType'
  ],

  // Chart default settings

  // Se decorations for individual charts or for groups of charts here
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

    'data-structure': {
      width: 800,
      height: 350,
      margins: new epiviz.ui.charts.Margins(55, 10, 10, 10),
      colors: 'd3-category20',
      decorations: [
        'epiviz.ui.charts.tree.decoration.TogglePropagateSelectionButton',
        'epiviz.ui.charts.decoration.HierarchyFilterCodeButton'
      ]
    },

    'epiviz.plugins.charts.GenesTrack': {
      height: 120,
      colors: 'genes-default'
    },

    'epiviz.plugins.charts.LineTrack': {
      colors: 'epiviz-v2-bright',
      decorations: [
        'epiviz.ui.charts.decoration.ChartGroupByMeasurementsCodeButton',
        'epiviz.ui.charts.decoration.ChartColorByMeasurementsCodeButton'
      ]
    },

    'epiviz.plugins.charts.StackedLineTrack': {
      height: 300
    },

    'epiviz.plugins.charts.ScatterPlot': {
      margins: new epiviz.ui.charts.Margins(15, 50, 50, 15),
      decorations: [
        'epiviz.ui.charts.decoration.ChartColorByRowCodeButton'
      ]
    },

    'epiviz.plugins.charts.HeatmapPlot': {
      width: 800,
      height: 400,
      margins: new epiviz.ui.charts.Margins(120, 60, 20, 40),
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
    },
    'epiviz.plugins.charts.PCAScatterPlot': {
      margins: new epiviz.ui.charts.Margins(25, 55, 50, 15),
      decorations: [
        'epiviz.ui.charts.decoration.ChartColorByRowCodeButton'
      ]
     },
     'epiviz.plugins.charts.PCoAScatterPlot': {
      margins: new epiviz.ui.charts.Margins(25, 55, 50, 15),
      decorations: [
        'epiviz.ui.charts.decoration.ChartColorByRowCodeButton'
      ]
     },
    'epiviz.plugins.charts.DiversityScatterPlot': {
      margins: new epiviz.ui.charts.Margins(25, 55, 50, 15),
      decorations: [
        'epiviz.ui.charts.decoration.ChartColorByRowCodeButton'
      ]
     },
    'epiviz.plugins.charts.FeatureScatterPlot': {
      margins: new epiviz.ui.charts.Margins(50, 55, 50, 15),
      decorations: [
        'epiviz.ui.charts.decoration.ChartColorByRowCodeButton'
      ]
     }
  },

  chartCustomSettings: {
    'epiviz.plugins.charts.BlocksTrack': {
      minBlockDistance: 3,
      useColorBy: false,
      blockColorBy: 'label'
    },
    'epiviz.plugins.charts.GenesTrack': {

    },
    'epiviz.plugins.charts.LineTrack': {
      step: 1,
      showPoints: false,
      showLines: true,
      pointRadius: 1,
      lineThickness: 2
    },
    'epiviz.plugins.charts.ScatterPlot': {
      circleRadiusRatio: 0.01
    },
    'epiviz.plugins.charts.HeatmapPlot': {
      colLabel: 'label',
      maxColumns: 120,
      clusteringAlg: 'agglomerative'
    },
    'epiviz.plugins.charts.StackedLinePlot': {
      colLabel: 'label'
    },
    'epiviz.plugins.charts.PCAScatterPlot': {
      xMin: -2,
      xMax: 2,
      yMin: -2,
      yMax: 2
    },
    'epiviz.plugins.charts.PoCAScatterPlot': {
      xMin: "default",
      xMax: "default",
      yMin: "default",
      yMax: "default"
    },
    'epiviz.plugins.charts.DiversityScatterPlot': {
      yMin: 'default',
      yMax: 'default'
    },
    'epiviz.plugins.charts.FeatureScatterPlot': {
      yMin: 'default',
      yMax: 'default'
    }
  },

  // When loading Epiviz for the first time, this is what it will show:
  defaultWorkspaceSettings: {
    name: epiviz.Config.DEFAULT_WORKSPACE_NAME,
    content: {
      // This is the selected chromosome, start and end locations
      range: {
        seqName: '',
        start: 0,
        width: 100000
      },

      // The initial measurements loaded in the workspace
      measurements: [],

      // The initial charts on the initial workspace
      charts: {
        track: [],
        plot: []
      }
    }
  },

  // For the heatmap clustering, register algorithms here:
  clustering: {
    algorithms: [
      'epiviz.ui.charts.transform.clustering.NoneClustering',
      'epiviz.ui.charts.transform.clustering.AgglomerativeClustering'
    ],
    metrics: [
      'epiviz.ui.charts.transform.clustering.EuclideanMetric',
      'epiviz.ui.charts.transform.clustering.BrayMetric',
      'epiviz.ui.charts.transform.clustering.BinomialMetric',
      'epiviz.ui.charts.transform.clustering.CanberraMetric',
      'epiviz.ui.charts.transform.clustering.GowerMetric',
      'epiviz.ui.charts.transform.clustering.JaccardMetric',
      'epiviz.ui.charts.transform.clustering.KulzynskiMetric',
      'epiviz.ui.charts.transform.clustering.ManhattanMetric',
      'epiviz.ui.charts.transform.clustering.MorisitaMetric',
      'epiviz.ui.charts.transform.clustering.MorisitaHornMetric'
    ],
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
      //['#1859a9', '#ed2d2e', '#008c47', '#010101', '#f37d22', '#662c91', '#a11d20', '#b33893'],
      ['#1859a9', '#ff7f0e', '#2ca02c', '#010101', '#f37d22', '#662c91', '#a11d20', '#b33893'],
      'Heatmap Default', 'heatmap-default'),
    new epiviz.ui.charts.ColorPalette(
      ["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#253494","#081d58"],
      'Color Brewer YlGnBu', 'colorBrewer-YlGnBu-default'),
    new epiviz.ui.charts.ColorPalette(
      ["#fff7fb","#ece2f0","#d0d1e6","#a6bddb","#67a9cf","#3690c0","#02818a","#016c59","#014636"],
      'Color Brewer PuBuGn', 'colorBrewer-PuBuGn-default'),
    new epiviz.ui.charts.ColorPalette(
      ["#ffffcc","#ffeda0","#fed976","#feb24c","#fd8d3c","#fc4e2a","#e31a1c","#bd0026","#800026"],
      'Color Brewer YlOrRd', 'colorBrewer-YlOrRd-default'),
    new epiviz.ui.charts.ColorPalette(
      ["#ffffe5","#fff7bc","#fee391","#fec44f","#fe9929","#ec7014","#cc4c02","#993404","#662506"],
      'Color Brewer YlOrBr', 'colorBrewer-YlOrBr-default'),
    new epiviz.ui.charts.ColorPalette(
      ["#a50026","#d73027","#f46d43","#fdae61","#fee090","#ffffbf","#e0f3f8","#abd9e9","#74add1","#4575b4","#313695"],
      'Color Brewer RdYlBu', 'colorBrewer-RdYlBu-default'),
    new epiviz.ui.charts.ColorPalette(
      ["#9e0142","#d53e4f","#f46d43","#fdae61","#fee08b","#ffffbf","#e6f598","#abdda4","#66c2a5","#3288bd","#5e4fa2"],
      'Color Brewer Spectral', 'colorBrewer-Spectral-default'),
    new epiviz.ui.charts.ColorPalette(
      ["#a50026","#d73027","#f46d43","#fdae61","#fee08b","#ffffbf","#d9ef8b","#a6d96a","#66bd63","#1a9850","#006837"],
      'Color Brewer RdYlGn', 'colorBrewer-RdYlGn-default'),
    new epiviz.ui.charts.ColorPalette(
      ["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00","#cab2d6","#6a3d9a","#ffff99","#b15928"],
      'Color Brewer Paired', 'colorBrewer-Paired-default'),
    new epiviz.ui.charts.ColorPalette(
      ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9","#bc80bd","#ccebc5","#ffed6f"],
      'Color Brewer Set3', 'colorBrewer-Set3-default'),
    new epiviz.ui.charts.ColorPalette(
      ["#8e0152","#c51b7d","#de77ae","#f1b6da","#fde0ef","#f7f7f7","#e6f5d0","#b8e186","#7fbc41","#4d9221","#276419"],
      'Color Brewer PiYG', 'colorBrewer-PiYG'),
    new epiviz.ui.charts.ColorPalette(
      ["#40004b","#762a83","#9970ab","#c2a5cf","#e7d4e8","#f7f7f7","#d9f0d3","#a6dba0","#5aae61","#1b7837","#00441b"],
      'Color Brewer PRGn', 'colorBrewer-PRGn'),
    new epiviz.ui.charts.ColorPalette(
      ["#ffffe5","#f7fcb9","#d9f0a3","#addd8e","#78c679","#41ab5d","#238443","#006837","#004529"],
      'Color Brewer GnBu', 'colorBrewer-GnBu'),
    new epiviz.ui.charts.ColorPalette(
      ["#f7fcfd","#e5f5f9","#ccece6","#99d8c9","#66c2a4","#41ae76","#238b45","#006d2c","#00441b"],
      'Color Brewer BuGn', 'colorBrewer-BuGn'),
    new epiviz.ui.charts.ColorPalette(
      ["#fff7fb","#ece7f2","#d0d1e6","#a6bddb","#74a9cf","#3690c0","#0570b0","#045a8d","#023858"],
      'Color Brewer PuBu', 'colorBrewer-PuBu'),
    new epiviz.ui.charts.ColorPalette(
     ["#f7fcfd","#e0ecf4","#bfd3e6","#9ebcda","#8c96c6","#8c6bb1","#88419d","#810f7c","#4d004b"],
      'Color Brewer BuPu', 'colorBrewer-BuPu'),
    new epiviz.ui.charts.ColorPalette(
      ["#fff7f3","#fde0dd","#fcc5c0","#fa9fb5","#f768a1","#dd3497","#ae017e","#7a0177","#49006a"],
      'Color Brewer RdPu', 'colorBrewer-RdPu'),
    new epiviz.ui.charts.ColorPalette(
      ["#f7f4f9","#e7e1ef","#d4b9da","#c994c7","#df65b0","#e7298a","#ce1256","#980043","#67001f"],
      'Color Brewer PuRd', 'colorBrewer-PuRd'),
    new epiviz.ui.charts.ColorPalette(
      ["#fff7ec","#fee8c8","#fdd49e","#fdbb84","#fc8d59","#ef6548","#d7301f","#b30000","#7f0000"],
      'Color Brewer OrRd', 'colorBrewer-OrRd'),
    new epiviz.ui.charts.ColorPalette(
      ["#7f3b08","#b35806","#e08214","#fdb863","#fee0b6","#f7f7f7","#d8daeb","#b2abd2","#8073ac","#542788","#2d004b"],
      'Color Brewer PuOr', 'colorBrewer-PuOr'),
    new epiviz.ui.charts.ColorPalette(
      ["#543005","#8c510a","#bf812d","#dfc27d","#f6e8c3","#f5f5f5","#c7eae5","#80cdc1","#35978f","#01665e","#003c30"],
      'Color Brewer BrBG', 'colorBrewer-BrBG'),
    new epiviz.ui.charts.ColorPalette(
      ["#67001f","#b2182b","#d6604d","#f4a582","#fddbc7","#f7f7f7","#d1e5f0","#92c5de","#4393c3","#2166ac","#053061"],
      'Color Brewer RdBu', 'colorBrewer-RdBu'),
    new epiviz.ui.charts.ColorPalette(
      ["#67001f","#b2182b","#d6604d","#f4a582","#fddbc7","#ffffff","#e0e0e0","#bababa","#878787","#4d4d4d","#1a1a1a"],
      'Color Brewer RdGy', 'colorBrewer-RdGy'),
    new epiviz.ui.charts.ColorPalette(
      ["#fff7ec","#fee8c8","#fdd49e","#fdbb84","#fc8d59","#ef6548","#d7301f","#b30000","#7f0000"],
      'Color Brewer OrRd', 'colorBrewer-OrRd')
  ]
};
