// This uses the UMD server for login and user management
epiviz.Config.SETTINGS.dataServerLocation = 'http://metaviz.cbcb.umd.edu/data/';

// This sets up the UMD data server as the only data provider
epiviz.Config.SETTINGS.dataProviders = [
    [
      // dataprovider Class Name 
      'epiviz.data.EpivizApiDataProvider',
      // datasource name
      'msd16s',
      //dataserver location, where api requests go to.
      'api/',
      // measurement annotations
      [],
      // initial depth of icicle
      3,
      // initial aggregation level
      {3: epiviz.ui.charts.tree.NodeSelectionType.NODE}
    ],
    [
      'epiviz.data.EpivizApiDataProvider',
      'etec16s',
      'api/',
      [],
      3,
      {3: epiviz.ui.charts.tree.NodeSelectionType.NODE}
    ],
    [
      'epiviz.data.EpivizApiDataProvider',
      'tbi_mouse',
      'api/',
      [],
      3,
      {3: epiviz.ui.charts.tree.NodeSelectionType.NODE}
    ],
    [
      'epiviz.data.EpivizApiDataProvider',
      'hmp',
      'api/',
      [],
      3,
      {3: epiviz.ui.charts.tree.NodeSelectionType.NODE}
    ],
    [
      'epiviz.data.EpivizApiDataProvider',
      'igs_test',
      'api/',
      [],
      3,
      {3: epiviz.ui.charts.tree.NodeSelectionType.NODE}
    ],
    [
      'epiviz.data.EpivizApiDataProvider',
      'ihmp_data',
      'api/',
      [],
      3,
      {3: epiviz.ui.charts.tree.NodeSelectionType.NODE}
    ]

];

// This sets up the UMD workspace server 
epiviz.Config.SETTINGS.workspacesDataProvider = sprintf('epiviz.data.WebServerDataProvider,%s,%s',
    'workspaces_provider',
    'http://metaviz.cbcb.umd.edu/data/main.php');
