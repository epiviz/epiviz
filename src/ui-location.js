/**
 * Created with JetBrains PhpStorm.
 * User: florin
 * Date: 2/27/13
 * Time: 9:30 PM
 * To change this template use File | Settings | File Templates.
 */

/*
 * Location controls: chromosome selector, range slider, spinner min, spinner width, zoom in, zoom out
 */
function UILocation() {}

EventManager.instance.addEventListener(EventManager.eventTypes.MEASUREMENTS_LOADED, UILocation);
EventManager.instance.addEventListener(EventManager.eventTypes.WORKSPACE_LOADED, UILocation);

UILocation.changing = false;
UILocation.change = function (workspaceUnchanged) {
  if (UILocation.changing) {
    return;
  }

  UILocation.changing = true;

  if (!UILocation.chr) {
    UILocation.chr = Request.chr;
  }

  if (!UILocation.start) {
    UILocation.start = Request.start;
  }

  if (!UILocation.width) {
    UILocation.width = Request.end - Request.start;
  }

  UILocation.zoominRatio = Globalize.parseFloat($('#zoomin-ratio-text').val());
  UILocation.zoomoutRatio = Globalize.parseFloat($('#zoomout-ratio-text').val());
  UILocation.stepRatio = Globalize.parseFloat($('#navigation-step-ratio-text').val());

  $('#text-location').val(Globalize.format(UILocation.start, 'n0') + ' - ' + Globalize.format(UILocation.start+UILocation.width, 'n0'));

  var chromosomeSelector = $('#chromosome-selector');
  chromosomeSelector.val(UILocation.chr);
  chromosomeSelector.selectmenu();

  if (!workspaceUnchanged) {
    Workspace.instance.update();
    Workspace.instance.changed();
  }

  EventManager.instance.updateData(UILocation.chr, UILocation.start, UILocation.start + UILocation.width);
  UILocation.changing = false;
};

UILocation.onMeasurementsLoaded = function(event) {
  UILocation.change(true);
};

UILocation.onWorkspaceLoaded = function(event) {
  var workspace = Workspace.instance;

  var location = workspace.getLocation();
  if (!Request.chr) {
    Request.chr = location.chr;
  }
  if (!Request.start) {
    Request.start = location.start;
  }
  if (!Request.end) {
    Request.end = location.end;
  }
};

UILocation.updateUrl = function() {
  var url = 'index.php?';
  var requestKeys = d3.keys(Request);

  for (var i=0; i<requestKeys.length; ++i) {
    url = sprintf('%s%s=%s&', url, requestKeys[i], Request[requestKeys[i]]);
  }

  var title = sprintf('EpiViz [%s, %s, %s]', UILocation.chr, UILocation.start, UILocation.start + UILocation.width);

  // IE versions before 10 don't support the history API
  var ie = getInternetExplorerVersion();
  if (ie < 0 || ie >= 10) {
    switch(window.location.protocol) {
      case 'http:':
      case 'https:':
        //remote file over http or https
        history.replaceState(null, title, url);
        break;
      case 'file:':
        //local file
        break;
      default:
      //some other protocol
    }
  }
};

UILocation.login = function() {
  var location = window.location.search;
  if (location.length > 0) {
    location = encodeURIComponent(location.substr(1));
  }

  var pathname = 'login.php';
  var redirect = pathname + '?location=' + location + (Request.debug ? '&debug=true' : '');
  window.location = redirect;
};
