/**
 * Created with JetBrains PhpStorm.
 * User: florin
 * Date: 4/9/13
 * Time: 10:21 AM
 * To change this template use File | Settings | File Templates.
 */

function Utils() {}

String.prototype.capitalizeFirstLetter = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

// Returns the version of Internet Explorer or a -1
// (indicating the use of another browser).
function getInternetExplorerVersion() {
  var rv = -1; // Return value assumes failure.
  if (navigator.appName == 'Microsoft Internet Explorer') {
    var ua = navigator.userAgent;
    var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
    if (re.exec(ua) != null)
      rv = parseFloat( RegExp.$1 );
  }
  return rv;
}

// Utils
Utils.fillArray = function(n, value) {
  var result = [];
  for (var i = 0; i < n; ++i) {
    result.push(value);
  }
  return result;
};

Utils.notify = function(self, msg) {
  $( '<div style="z-index: 1100; position: absolute;" >' )
    .appendTo( document.body )
    .text( msg )
    //.addClass( "notification ui-state-default ui-corner-bottom" )
    .addClass( "ui-tooltip ui-widget ui-widget-content" )
    .position({
      my: "left",
      at: "right+10px",
      of: self
    })
    .show({
      //effect: "blind"
    })
    .delay( 1000 )
    .hide({
      effect: "fade",
      duration: "fast"
    }, function() {
      $( this ).remove();
    });
};
