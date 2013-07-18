/**
 * Created with JetBrains PhpStorm.
 * User: florin
 * Date: 3/2/13
 * Time: 11:09 AM
 * To change this template use File | Settings | File Templates.
 */

function SelectableChart() {
  this._selectedBlock = null;
  this._hoveredBlock = null;
}

SelectableChart.prototype.initialize = function() {
  // Deselect whatever is selected
  $(this._parentId).click(function() {
    EventManager.instance.blockDeselected();
  });

  EventManager.instance.addEventListener(EventManager.eventTypes.BLOCK_HOVERED, this);
  EventManager.instance.addEventListener(EventManager.eventTypes.BLOCK_UNHOVERED, this);
  EventManager.instance.addEventListener(EventManager.eventTypes.BLOCK_SELECTED, this);
  EventManager.instance.addEventListener(EventManager.eventTypes.BLOCK_DESELECTED, this);
};

SelectableChart.prototype._filterClassSelection = function(selectionData) {
  return null;
};

SelectableChart.prototype._childrenFilterClass = function() {
  return '> .item';
};

SelectableChart.prototype._findItems = null; // Abstract method

SelectableChart.prototype._changeObjectSelection = function(selectionData, sourceGroup, targetGroup) {
  var selectClasses = this._filterClassSelection(selectionData);
  if (selectClasses == null) {
    selectClasses = '';
    var s = Math.floor(selectionData.start / this._binSize);
    var e = Math.floor(selectionData.end / this._binSize);
    for (var j = s; j <= e; ++j) {
      selectClasses += sprintf('> .bin-%s,', j);
    }
  }

  var objects = sourceGroup.find(selectClasses);

  targetGroup.append(objects);

  return objects;
};

SelectableChart.prototype._addHoverRegion = function(selectionData, itemsGroup) {
  var xScale = d3.scale.linear()
    .domain([this._data.start, this._data.end])
    .range([0, this._width-2*this._margin]);

  var xStart = xScale(Math.floor(selectionData.start / this._binSize) * this._binSize);
  var xEnd = xScale((Math.floor(selectionData.end / this._binSize) + 1) * this._binSize);

  d3.select(itemsGroup[0])
    .insert('rect', ':first-child')
    .attr('class', 'hover-region')
    .attr('x', xStart)
    .attr('y', 0)
    .attr('width', xEnd - xStart)
    .attr('height', this._height)
    .attr('fill', DataSeriesPalette.colors[0])
    .attr('stroke', 'none')
    .attr('opacity', 0.4);
};

SelectableChart.prototype._removeHoverRegion = function(itemsGroup) {
  itemsGroup.find('> .hover-region').remove();
};

SelectableChart.prototype.onBlockHovered = function(event) {
  if (!this._binSize) { return; }
  var o = event.detail.data;
  this._hoveredBlock = o;

  var itemsGroup = this._findItems();
  var unselectedHoveredGroup = itemsGroup.find('> .hovered');
  var selectedGroup = itemsGroup.find('> .selected');
  var selectedHoveredGroup = selectedGroup.find('> .hovered');

  this._changeObjectSelection(o, itemsGroup, unselectedHoveredGroup);
  itemsGroup.css('fill-opacity', 0.4);

  this._changeObjectSelection(o, selectedGroup, selectedHoveredGroup);

  if (this.getChartHandler().getChartDisplayType() == ChartDisplayType.TRACK) {
    this._addHoverRegion(o, itemsGroup);
  }
};

SelectableChart.prototype.onBlockUnhovered = function(event) {
  this._hoveredBlock = null;
  var itemsGroup = this._findItems();
  var unselectedHoveredGroup = itemsGroup.find('> .hovered');
  var selectedGroup = itemsGroup.find('> .selected');
  var selectedHoveredGroup = selectedGroup.find('> .hovered');

  itemsGroup.prepend(unselectedHoveredGroup.children());
  itemsGroup.css('fill-opacity', '');

  selectedGroup.prepend(selectedHoveredGroup.children());

  if (this.getChartHandler().getChartDisplayType() == ChartDisplayType.TRACK) {
    this._removeHoverRegion(itemsGroup);
  }
};

SelectableChart.prototype.onBlockSelected = function(event) {
  if (!this._binSize) { return; }
  var o = event.detail.data;
  this._selectedBlock = o;

  var itemsGroup = this._findItems();
  var unselectedHoveredGroup = itemsGroup.find('> .hovered');
  var selectedGroup = itemsGroup.find('> .selected');
  var selectedHoveredGroup = selectedGroup.find('> .hovered');

  var objects = this._changeObjectSelection(o, itemsGroup, selectedGroup);
  objects = objects.add(this._changeObjectSelection(o, unselectedHoveredGroup, selectedHoveredGroup));

  var displayInfo = this.getDisplayInformation(objects);

  if (displayInfo) {
    EventManager.instance.sendChartInformation(this._id, this._title, this.getChartHandler(), displayInfo);
  }
};

SelectableChart.prototype.onBlockDeselected = function(event) {
  this._selectedBlock = null;
  var itemsGroup = this._findItems();
  var unselectedHoveredGroup = itemsGroup.find('> .hovered');
  var selectedGroup = itemsGroup.find('> .selected');
  var selectedHoveredGroup = selectedGroup.find('> .hovered');

  itemsGroup.prepend(selectedGroup.find(this._childrenFilterClass()));
  unselectedHoveredGroup.prepend(selectedHoveredGroup.children());
};

SelectableChart.prototype.refreshSelection = function() {
  if (this._hoveredBlock) {
    this.onBlockHovered({ detail: { data: this._hoveredBlock } });
  }
  if (this._selectedBlock) {
    this.onBlockSelected({ detail: { data: this._selectedBlock } });
  }
};

SelectableChart.prototype.getDisplayInformation = function(objects) {
  return null;
};
