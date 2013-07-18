/**
 * Created with JetBrains PhpStorm.
 * User: florin
 * Date: 3/4/13
 * Time: 9:17 PM
 * To change this template use File | Settings | File Templates.
 */

function InformationDetailsManager() {
  this._parentId = null;
  this._parent = null;
  this._content = null;
}

InformationDetailsManager.instance = new InformationDetailsManager();

InformationDetailsManager.prototype.initialize = function(parentId) {
  this._parentId = parentId;
  this._parent = $(parentId);
  // this._content = this._parent.find('.ui-panel-content-text');
  this._content = this._parent;

  EventManager.instance.addEventListener(EventManager.eventTypes.BLOCK_SELECTED, this);
  EventManager.instance.addEventListener(EventManager.eventTypes.BLOCK_DESELECTED, this);

  EventManager.instance.addEventListener(EventManager.eventTypes.CHART_INFORMATION, this);
};

InformationDetailsManager.prototype.onBlockSelected = function(event) {
  // this._content.empty();
};

InformationDetailsManager.prototype.onBlockDeselected = function(event) {
  this._content.empty();
};

InformationDetailsManager.prototype.onChartInformation = function(event) {
  var chartId = event.detail.chartId;
  var chartHandler = event.detail.chartHandler;
  var title = event.detail.title;
  var information = event.detail.information;

  var chartInfoId = '#info-' + chartId;
  var chartInfo = this._content.find(chartInfoId);
  if (chartInfo.length == 0) {
    this._content.append('<div id="' + chartInfoId.substr(1) + '" class="ui-widget-content ui-corner-all info-panel-content"></div>');
    chartInfo = this._content.find(chartInfoId);
  }

  chartInfo.append('<div class="info-panel-title"><span style="color: #9A9A9A">[' + chartHandler.getChartTypeName() + ']</span><br/>' + title + '</div><hr/>');
  chartInfo.append(information);
};

