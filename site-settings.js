// This uses the UMD server for login and user management
epiviz.Config.SETTINGS.dataServerLocation = 'http://metaviz.cbcb.umd.edu/data/';

// This sets up the UMD data server as the only data provider
epiviz.Config.SETTINGS.dataProviders = [
    // [
    //   // fully qualified class name for the class
    //   'epiviz.data.EpivizApiDataProvider',

    //   // the name of the datasource (matching the datasource in the UI add measurements dialog)
    //   'msd16s',

    //   // where the api is located, relative to dataServerLocation (see above)
    //   'http://metaviz.cbcb.umd.edu/api',

    //   // retrieve only this measurement annotation:
    //   [],
    //   // this is the initial depth of icicles:
    //   3,

    //   // aggregate at these levels in the tree:
    //   {3: epiviz.ui.charts.tree.NodeSelectionType.NODE, 4: epiviz.ui.charts.tree.NodeSelectionType.NODE}
    // ],
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
// epiviz.Config.SETTINGS.workspacesDataProvider = sprintf('epiviz.data.WebServerDataProvider,%s,%s',
//     'workspaces_provider',
//     'http://metaviz.cbcb.umd.edu/data/main.php');
