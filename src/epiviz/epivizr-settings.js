/**
 * Created by jayaram kancherla (jkanche at umd dot edu)
 * on 4/22/16.
 */

var websocket_path = window.location.pathname.split(',');
websocket_path.pop();
websocket_path = window.location.host + websocket_path.join('/') + "/websocket";

websocket_host = window.location.host;
epiviz.Config.SETTINGS.dataProviders.push(
    sprintf('epiviz.data.WebsocketDataProvider,%s,%s',
        epiviz.data.WebsocketDataProvider.DEFAULT_ID,
        sprintf("ws://%s", websocket_path)));

epiviz.Config.SETTINGS.configType = "epivizr_standalone";