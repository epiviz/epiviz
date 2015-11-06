epiviz.Config.SETTINGS.dataServerLocation = 'http://epiviz.cbcb.umd.edu/data/';
epiviz.Config.SETTINGS.dataProviders = [
    [
        // fully qualified class name for the class
        'epiviz.data.WebServerDataProvider',
        epiviz.Config.DEFAULT_DATA_PROVIDER_ID,
        'http://epiviz.cbcb.umd.edu/data/main.php'

    ]
];
epiviz.Config.SETTINGS.workspacesDataProvider = sprintf('epiviz.data.WebServerDataProvider,%s,%s',
    'workspaces_provider',
    'http://epiviz.cbcb.umd.edu/data/main.php');