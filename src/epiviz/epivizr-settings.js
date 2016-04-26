/**
 * Created by jayaram kancherla (jkanche at umd dot edu)
 * on 4/22/16.
 */

epiviz.Config.SETTINGS.dataProviders.push(
    sprintf('epiviz.data.WebsocketDataProvider,%s,%s',
        epiviz.data.WebsocketDataProvider.DEFAULT_ID,
        sprintf("ws://%s", window.location.host)));

epiviz.Config.SETTINGS.configType = "epivizr_standalone";