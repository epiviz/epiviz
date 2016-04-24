// This uses the UMD server for login and user management
epiviz.Config.SETTINGS.dataServerLocation = 'http://epiviz.cbcb.umd.edu/data/';

// This sets up the UMD data server as the only data provider
epiviz.Config.SETTINGS.dataProviders = [
    [
        // fully qualified class name for the class
        'epiviz.data.WebServerDataProvider',
        epiviz.Config.DEFAULT_DATA_PROVIDER_ID,
        'http://epiviz.cbcb.umd.edu/data/main.php'

    ]
];

// This sets up the UMD workspace server 
epiviz.Config.SETTINGS.workspacesDataProvider = sprintf('epiviz.data.WebServerDataProvider,%s,%s',
    'workspaces_provider',
    'http://epiviz.cbcb.umd.edu/data/main.php');
