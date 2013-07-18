/**
 * Created with JetBrains PhpStorm.
 * User: florin
 * Date: 5/13/13
 * Time: 9:10 PM
 * To change this template use File | Settings | File Templates.
 */

function ChartColorPicker() {
  this._chart = null;
}

ChartColorPicker.instance = new ChartColorPicker();

ChartColorPicker.prototype.initializeChartColors = function(chart) {

  var useDefaultColors = false;
  if (chart) {
    this._chart = chart;
  } else {
    chart = this._chart;
    useDefaultColors = true;
  }

  var defaultColors = chart.getChartHandler().getDefaultColors();

  var colorPickerForm = $('#color-picker-form');
  colorPickerForm.find('.color-picker-table').remove();

  var measurementColorMap = chart.getMeasurementColorMap();

  var i = 0;
  var tableContent = '';
  for (var m in measurementColorMap) {
    var inputId = sprintf('color-%s', i);
    tableContent += sprintf(
      '<tr>' +
        '<td><label for="%s">%s:&nbsp;</label></td>' +
        '<td><input type="text" id="%s" name="%s" class="colorwell" value="%s" /></td>' +
      '</div>',
      inputId, m, inputId, inputId, (useDefaultColors) ? defaultColors[i] : measurementColorMap[m]);
    ++i;
  }
  colorPickerForm.append(sprintf('<table class="color-picker-table">%s</table>', tableContent));

  var f = $.farbtastic('#picker');
  var p = $('#picker').css('opacity', 0.25);
  var selected;
  $('.colorwell')
    .each(function () { f.linkTo(this); $(this).css('opacity', 0.75); })
    .focus(function() {
      if (selected) {
        $(selected).css('opacity', 0.75).removeClass('colorwell-selected');
      }
      f.linkTo(this);
      p.css('opacity', 1);
      $(selected = this).css('opacity', 1).addClass('colorwell-selected');
    });
};

ChartColorPicker.prototype.changeChartColors = function() {
  if (!this._chart) { return; }
  var inputs = $('#color-picker-form').find('.colorwell');

  var colors = [];
  for (var i = 0; i < inputs.length; ++i) {
    colors.push(inputs[i].value);
  }

  this._chart.setColors(colors);
  Workspace.instance.changed();
};

