var current_measurements = undefined;
var filters = {};
var graph;
var selections = {};
var store = {};
var measurements = {};
var selectionCount = 0;
var selectionType = "Random";
var selectionAuto = false;
var selectionDrag = false;
var selectionDown = false;
var currentSource = null;

function initialize_dropdown(source) {

	$('#select-type').dropdown({
		allowTab : false,
		onChange : function(value, text, $choice) {
			if (text === "Auto") {
				selectionAuto = true;
				$('#sample-type').removeClass("disabled");
				$('#sample-size').removeClass("disabled");
				$('#sample-size-dropdown').removeClass("disabled");
				$('#rightmenu .checkbox').checkbox('set disabled');
				selectSamples();
			} else {
				selectionAuto = false;
				$('#sample-type').addClass("disabled");
				$('#sample-size').addClass("disabled");
				$('#sample-size-dropdown').addClass("disabled");
				$('#rightmenu .checkbox').checkbox('set enabled');
				$('#rightmenu .checkbox').checkbox('set unchecked');
				//fixing click issues
				$($('#source-' + source).parent().children()[1]).unbind("click");
		        $($('#source-' + source).children()[0]).click(function() {});
			}

			selections = {};
			var countUpdate = $('#count-' + currentSource);
			countUpdate.attr("data-selected", 0);
			countUpdate.html(" (Selected: " + countUpdate.attr("data-selected") + " of " + countUpdate.attr('data-total') + ")");
			$("#leftMenuCount span.data-count").text(countUpdate.attr('data-total'));
		}
	});
	$('#sample-type').dropdown({
		allowTab : false,
		onChange: function(value, text, $choice) {
			selectionType = text;
			selectSamples();
		}
	});
	$('#sample-size-dropdown').dropdown({
		allowTab : false,
		action: 'select',
		onHide: function() {
			selectSamples();
		}
	});
	$('#sample-size').range({
		start: selectionCount,
		min: 0,
		max: 100,
		step: 1,
		value: selectionCount,
		onChange: function(min, max) {
			selectionCount = min;
			$('#sampleSizeValue').text(min + "% samples");
			// if((selectionDrag && selectionDown)) {
			// 	// return;
			// 	selectSamples();
			// }
		}
	});

	// $('#sample-size').on("mousemove", function(event) {
	// 	selectionDrag = true;
	// 	event.preventDefault();
	// 	// $(document).off('mousemove');
	// });
	// $('#sample-size').on("mouseup", function(event) {
	// 	selectionDrag = false;
	// 	selectionDown = false;
	// 	// $(document).off('mousemove');
	// 	// $(document).off('mouseup');
	// 	event.preventDefault();
	// });

	// $('#sample-size').on("mousedown", function(event) {
	// 	selectionDown = true;
	// 	event.preventDefault();
	// });
}

function selectSamples() {
	if(selectionAuto && selectionCount > 0) {
		
		var checkboxes = $('#rightmenu .content .ui.checkbox input[type="checkbox"]').filter(function() {
			return $(this).parent().parent().css("display") != "none";
		}).toArray();
		var count = Math.round((checkboxes.length*selectionCount)/100);

		// clear Selections
		selections = {};
		_.each(checkboxes, function(cb) {
			$(cb).parent().checkbox('set unchecked');
		});

		switch(selectionType) {
			case 'Random':
				var randomSamples = _.sampleSize(checkboxes, count);
				// randomSamples.forEach(function(rs) {
					// console.log(rs);
				// 	if((rs.context != null && rs.context != 'document') || (typeof(rs) != "number") ) {
				// 		if($(rs).parent().prop('id') != undefined) {
				// 			var split = $(rs).parent().prop('id').split('-');
				// 			$(rs).parent().checkbox('set checked');
				// 			selections[split[1] + '-' + split[2] + '-' + split[3]] = 0;
				// 			// $(rs).click();
				// 		}
				// 	}
				// });
				_.each(randomSamples, function(rs) {
					if((rs.context != null && rs.context != 'document') || (typeof(rs) != "number") ) {
						if($(rs).parent().prop('id') != undefined) {
							var split = $(rs).parent().prop('id').split('-');
							$(rs).parent().checkbox('set checked');
							split[3] = _.join(_.slice(split, 3), separator="-");
							selections[split[1] + '-' + split[2] + '-' + split[3]] = 0;
							// $(rs).click();
						}
					}
				});
				break;
			case 'Top':
				// _.slice(checkboxes,0, count).forEach(function(rs) {
				// 	if((rs.context != null && rs.context != 'document') || (typeof(rs) != "number") ) {
				// 		if($(rs).parent().prop('id') != undefined) {
				// 			var split = $(rs).parent().prop('id').split('-');
				// 			$(rs).parent().checkbox('set checked');
				// 			selections[split[1] + '-' + split[2] + '-' + split[3]] = 0;
				// 			// $(rs).click();
				// 		}
				// 	}
				// });
				_.each(_.slice(checkboxes,0, count), function(rs) {
					if((rs.context != null && rs.context != 'document') || (typeof(rs) != "number") ) {
						if($(rs).parent().prop('id') != undefined) {
							var split = $(rs).parent().prop('id').split('-');
							$(rs).parent().checkbox('set checked');
							split[3] = _.join(_.slice(split, 3), separator="-");
							selections[split[1] + '-' + split[2] + '-' + split[3]] = 0;
							// $(rs).click();
						}
					}
				});
				break;
		}

		var countUpdate = $('#count-' + currentSource);
		countUpdate.attr("data-selected", count);
		countUpdate.html(" (Selected: " + countUpdate.attr("data-selected") + " of " + countUpdate.attr('data-total') + ")");
		$("#leftMenuCount span.data-count").text(countUpdate.attr('data-total'));
		toggleParent(currentSource);
	}
}

function showModal(source, input, cb) {
	current_measurements = undefined;
	filters = {};
	graph;
	selections = {};
	store = {};
	measurements = {};
	selectionCount = 0;
	selectionType = "Random";
	selectionAuto = false;
	selectionDrag = false;
	selectionDown = false;
	currentSource = null;

	$('#newmodal').remove();
	$('#resultmodal').remove();

	//measurements placeholder for callback
	var modal = 
	`<div id ="newmodal" class="ui long modal">
		<div class="header">
			Choose measurements:
			<div id="warning-message" class="ui negative message" style="display:none;">
				<i class="close icon"></i>
				<div class="header">
					No measurements selected
				</div>
			</div>
		</div>
		<div class="content m">
			<div class="ui grid">
				<div id="titleRow" class="row">
					<div class="four wide column">
						Filter Samples <div id=\"leftMenuCount\" class=\"ui mini circular horizontal label\"> <span class=\"data-count\">0</span> of ` + input.length + `</div>
					</div>
					<div style="display:none;" class="twelve wide column">
						Sample selection type: 
						<div class="ui compact selection dropdown" id="select-type">
						  	<i class="dropdown icon"></i>
						  	<div class="text">Manual</div>
						  	<div class="menu">
						    	<div class="item" data-value="1">Auto</div>
						    	<div class="item" data-value="default">Manual</div>
						  	</div>
						</div>
						select: 
						<div class="ui disabled compact selection dropdown" id="sample-type">
						  	<i class="dropdown icon"></i>
						  	<span class="text">Random</span>
						  	<div class="menu">
						    	<div class="item" data-value="1">Random</div>
						    	<div class="item" data-value="0">Top</div>
						  	</div>
						</div>
						<div class="ui disabled compact dropdown" id="sample-size-dropdown">
						  	<i class="dropdown icon"></i>
						  	<span class="text" id="sampleSizeValue">0%: samples</span>
						  	<div class="menu">
							  <div class="item">
								<div class="ui range disabled inline" style="width: 75px;"id="sample-size"></div>
								</div>
						  	</div>
						</div>
					</div>
				</div>
				<div id="leftRightRow" class="row">
					<div class="four wide column">
						<div id="leftmenu" class="ui vertical scrolling accordion menu"> 
						</div>
					</div>
					<div class="twelve wide column">
						<div id="rightmenu" class="ui vertical fluid accordion menu">
						</div>
					</div>
				</div>
			</div>
		</div>
		<div class="actions">
			<div class="ui grey button" id="cancel">Cancel</div>
			<div class="ui primary button" id="ok">Ok</div>
		</div>
	</div>
	<div id="resultmodal" class="ui modal">
		<div class="content">
			<div class="bounds">
				<table id="resultTable" class="ui sortable selectable striped table">
				</table>
			</div>
		</div>
		<div class="actions">
			<div class="ui grey back button" id="cancel">Cancel</div>
			<div class="ui primary button" id="ok">Ok</div>
		</div>
	</div>`
	currentSource = source;
	measurements = {};
	_.forEach(input, function(row, index) {
		if(!measurements[row.datasourceId]) {
			measurements[row.datasourceId] = [];
		}
		measurements[row.datasourceId].push(row);
	});
	// measurements[source] = input;
	// measurements[source] = _.sortBy(measurements[source], [function(o) {return o.id}])
	$('body').append(modal);
	initialize_dropdown(source);
	$('#newmodal').modal({
		observeChanges: true,
		closable: false,
		selector:  {
			deny: '.ui.grey.button',
			approve: '.ui.primary.button'
		},
		onDeny: function() {
			// $('#sourcemodal').modal('show');
			$('#leftmenu').empty();
			$('#rightmenu').empty();
			$('#resultmodal').remove();

		},
		onApprove: function() {
			var countValue = $('#count-' + currentSource).attr("data-selected");
			if(countValue ==0) {
				$('#warning-message').show();
				return false;
			}
			else {
				storeMeasurement(measurements, cb);
			}
		},
	});
	$('#newmodal').modal('show');
	// loadMeasurements(source, input);
	loadMeasurements(measurements, input);
}

function initialize(sources) {

	current_measurements = undefined;
	filters = {};
	graph;
	selections = {};
	store = {};
	measurements = {};
	selectionCount = 0;
	selectionType = "Random";
	selectionAuto = false;
	selectionDrag = false;
	selectionDown = false;
	currentSource = null;

	$('#sourcemodal').remove();
	$('#resultmodal').remove();

	var form =     
	`<div class="ui small modal" id="sourcemodal">
		<div class="header">
			Select Data Source
		</div>
		<div class="content">
			<form class="ui form" id="form">
			</form>
		</div>
		<div class="actions">
			<div class="ui grey button" id="cancel">Cancel</div>
			<div class="ui blue submit button" id="ok">Ok</div>
		</div>
	</div>`
	$('body').append(form);
	// sources = sources.sort(sortAlphaNum);
	var fields = document.createElement('div');
	fields.className = "grouped fields";

    var table = document.createElement("table");
    table.className = "ui selectable celled table compact";
    var tableBody = document.createElement("tbody");

	var thead = document.createElement("thead");
	var tr = document.createElement("tr");

	var th = document.createElement("th");
	th.innerHTML = "Data Source ID";
	tr.appendChild(th);

	var th = document.createElement("th");
	th.innerHTML = "Description";
	tr.appendChild(th);

	thead.appendChild(tr);
    table.appendChild(thead);

	table.appendChild(tableBody);
	$('form').append(table);

	Object.keys(sources).forEach(function(value) {
		var field = document.createElement('div');
		var checkbox = document.createElement('div');
		var input = document.createElement('input');
		var label = document.createElement('label');
		label.innerHTML = value;
		checkbox.className = "ui radio checkbox";
		input.type = "radio";
		input.name = "source";
		input.value = value;
		if(sources[value][1]) {
			input.checked = "checked";
		}
		field.className = "field";
		
		checkbox.appendChild(input);
		checkbox.appendChild(label);
		field.appendChild(checkbox);
		// fields.appendChild(field);

		var tr = document.createElement("tr");
		var td = document.createElement("td");
		td.appendChild(field);
		tr.appendChild(td);
		tr.id = value;

		var td = document.createElement("td");
		td.innerHTML = sources[value][0];
		tr.appendChild(td);
		tableBody.appendChild(tr);

		$("#" + value).click(function() {
			$("#"+value).find(".ui.checkbox").checkbox("check");
		});

	});
	// $('#form').append(fields);
	$('#form').form();
}

function attachActions(measurements) {

	$('#rightmenu .ui.checkbox input[type="checkbox"]').click(function(e) {
		var split = this.id.split('-');
		split[1] = _.join(_.slice(split, 1), separator="-");
		// console.log('source clicked');
		//this means that you selected the measurement checkbox
		if (split[0] === "source") {
			var checked = $(this).parent().prop('class').indexOf('checked') !== -1;
			var ids = $('.ui.checkbox[id$=' + split[1] + ']');
			var $count = $('#count-' + split[1]);
			var selected = parseInt($count.attr("data-selected"));
			var total = parseInt($count.attr("data-total"));

			$(this).parent().toggleClass('checked');
			$(this).parent().removeClass('hidden');
			$('#rightmenu').accordion('refresh');
			_.each(ids, function(value) {
				var split = value.id.split('-');
				split[3] = _.join(_.slice(split, 3), separator="-");
				if (checked) {
					$(value).checkbox('set unchecked');
					delete selections[split[1] + '-' + split[2] + '-' + split[3]];
				} else if ($(value).parent().css('display') !== "none"){
					$(value).checkbox('set checked');
					$(value).children().removeClass('hidden');
					selections[split[1] + '-' + split[2] + '-' + split[3]] = 0;
				}
			});
			if (checked) {
				$count.attr("data-selected", 0)
				$count.html(" (Selected: " + $count.attr("data-selected") + " of " + $count.attr('data-total') + ")");
				$("#leftMenuCount span.data-count").text($count.attr('data-total'));
			} else {
				$count.attr("data-selected", total);
				$count.html(" (Selected: " + $count.attr("data-selected") + " of " + $count.attr('data-total') + ")");
				$("#leftMenuCount span.data-count").text($count.attr('data-total'));
			}
		} else {
			var checked = $(this).parent().prop('class').indexOf('checked') !== -1;
			var split = $(this).parent().prop('id').split('-');
			split[3] = _.join(_.slice(split, 3), separator="-");
			var $count = $('#count-' + split[3]);
			var selected = parseInt($count.attr("data-selected"));
			var total = parseInt($count.attr('data-total'));

			if (checked) {
				$(this).parent().checkbox('set unchecked');
				delete selections[split[1] + '-' + split[2] + '-' + split[3]];
			} else {
				$(this).parent().checkbox('set checked');
				$(this).removeClass('hidden');
				selections[split[1] + '-' + split[2] + '-' + split[3]] = 0;
			}
			if (checked) {
				selected = selected - 1;
				$count.attr("data-selected", selected)
				$count.html(" (Selected: " + $count.attr("data-selected") + " of " + $count.attr('data-total') + ")");
				$("#leftMenuCount span.data-count").text($count.attr('data-total'));
			} else {
				selected = selected + 1;
				$count.attr("data-selected", selected);
				$count.html(" (Selected: " + $count.attr("data-selected") + " of " + $count.attr('data-total') + ")");
				$("#leftMenuCount span.data-count").text($count.attr('data-total'));
			}
			toggleParent(split[3]);
		}
	});

	// $('#rightmenu .field .checkbox label').mouseenter(function() {
	// 	var parent = $(this).parent();
	// 	var split = parent.attr('id').split('-');
	// 	split[1] = split[1].replace(/[^a-zA-Z0-9]/g,'');
	// 	split[3] = _.join(_.slice(split, 3), separator="-");
	// 	var popup_id = "popup-" + split[1] + "-" + split[3];
	// 	if ($("#" + popup_id).length === 0) {
	// 		var point = measurements[split[3]][split[2]];
	// 		var headers = ['id', 'name', 'datasourcegroup'];
	// 		var contents = [point.id, point.name, point.datasourcegroup];
	// 		if (point.annotation != null) {
	// 			Object.keys(point.annotation).forEach(function(val) {
	// 				headers.push(val);
	// 				contents.push(point.annotation[val]);
	// 			});
	// 		}

	// 		//sanitize id for any periods or pound signs
	// 		point.id = point.id.replace(/[^a-zA-Z0-9]/g,'');

	// 		//creating popup as seperate div to give it columns
	// 		var popup = document.createElement('div');
	// 		var table = document.createElement('table');
	// 		var t_body = document.createElement('tbody');
	// 		popup.className = 'ui popup';
	// 		popup.id = "popup-" + point.id + "-" + split[3];
	// 		table.className = 'ui collapsing table';
	// 		table.appendChild(t_body);
	// 		//add columns to the grid
	// 		for (var j = 0; j < contents.length; j++) {
	// 			var row = document.createElement('tr');
	// 			var col1 = document.createElement('td');
	// 			var col2 = document.createElement('td');
	// 			row.appendChild(col1);
	// 			row.appendChild(col2);
	// 			col1.innerHTML = headers[j];
	// 			col2.innerHTML = contents[j];
	// 			t_body.appendChild(row);
	// 		}
	// 		popup.appendChild(table);
	// 		$('body').append(popup);
	// 		$(this).popup({
	// 			popup: '#' + popup.id,
	// 			position: 'right center',
	// 			lastResort: 'right center', 
	// 			hoverable: true,
	// 			delay: {
	// 				show: 50,
	// 				hide: 100,
	// 			}
	// 		});      
	// 		$(this).popup('show');     
	// 	}   
	// });
}

function toggleParent(source) {
		var $count = $('#count-' + source);
		var selected = parseInt($count.attr("data-selected"));
		var total = parseInt($count.attr("data-total"));
		if (selected > 0 && selected !== total) {
			// console.log('hi1');
			$('#source-' + source).parent().checkbox('set indeterminate');
			$('#source-' + source).removeClass('hidden');

		} else if (selected === total && total !== 0){
			// console.log('hi2');
			$('#source-' + source).parent().checkbox('set checked');
			$('#source-' + source).removeClass('hidden');
		} else if (selected === 0) {
			// console.log('hi3');
			$('#source-' + source).parent().checkbox('set unchecked');
			$('#source-' + source).removeClass('hidden');
		}
		//fixing click issues
		$('#source-' + source).parent().unbind("click");
        $($('#source-' + source).children()[0]).click(function() {});
}

function filter(value, anno, filter, measurements) {
	var list;
	var recalc;
	var new_list = {};
	if (filter) {
		//recalculate from original list if you are modifying an exisitng filter
		recalc = filters[anno].values.length === 0 ? false : true;
		if (filters[anno].type === "range") {
			recalc = true;
			filters[anno].values = value;
		} else {
			filters[anno].values.push(value);
		}
	} else {
		filters[anno].values.splice(filters[anno].values.indexOf(value),1);
		recalc = true;
	}
	//If filters are all empty, show entire dataset
	_.forEach(filters, function(val, key) {
		if (val.length !== 0) {
			all_empty = false;
		}
	});
	if (recalc || !current_measurements) {
		list = measurements;
		current_measurements = {};
	} else {
		list = current_measurements;
	}
	_.forEach(list, function(val, source) {
		new_list[source] = [];
	});
	_.forEach(list, function(val, source) {
		list[source].forEach(function(data) {
			data.id = data.id.replace(/[^a-zA-Z0-9]/g, '');
			var hide = false;
			if (!(all_empty && $('#' + data['id']).css('display') === 'none')) {
				if (recalc) {
					Object.keys(filters).forEach(function(category) {
						var val = filters[category].values;
						var type = filters[category].type;
						if (val.length !== 0) {
							if (data['annotation'] == null || !(category in data['annotation'])) {
								hide = true;
							}
							else if (type === "range") {
								if (data['annotation'][category] < val[0] || data['annotation'][category] > val[1]) {
									hide = true;
								}
							}
							else if (filters[category].values.indexOf(data['annotation'][category].replace(/[^a-zA-Z0-9]/g,'')) === -1) {
								hide = true;
							}
						}
					});
				} else {
					if (filters[anno].values.length !== 0) {
						var val = filters[anno].values;
						var type = filters[anno].type;
						if (data['annotation'] == null || !(anno in data['annotation'])) {
							hide = true;
						}
						else if (type === "range") {
							if (data['annotation'][anno] < val[0] || data['annotation'][anno] > val[1]) {
								hide = true;
							}
						}
						else if (filters[anno].values.indexOf(data['annotation'][anno].replace(/[^a-zA-Z0-9]/g,'')) === -1) {
							hide = true;
						}
					}
				}
			}
			current_measurements = new_list;
			if (hide) {
				$('#' + data['datasourceId'] + "-" + data['id']).hide();
				$('#table-' + data['datasourceId'] + "-" + data['id']).hide();
				_.pull(new_list[source], data);
				var checkbox = $('#' + data['datasourceId'] + "-" + data['id']).children();
				if (checkbox.attr('class').indexOf('checked') !== -1) {
					var split = checkbox.attr('id').split('-');
					split[3] = _.join(_.slice(split, 3), separator="-");
					checkbox.checkbox('set unchecked');
					$(this).parent().removeClass('hidden');
					delete selections[split[1] + '-' + split[2] + '-' + split[3]];
				}
			} else {
				new_list[source].push(data);
				$('#' + data['datasourceId'] + "-" + data['id']).show();
				$('#table-' + data['datasourceId'] + "-" + data['id']).show();
			}
		});
		var $count = $('#count-' + source);
		$count.attr("data-selected", _.size(selections));
		$count.attr("data-total", new_list[source].length);
		$count.html(" (Selected: " + $count.attr("data-selected") + " of " + $count.attr('data-total') + ")");
		$("#leftMenuCount span.data-count").text($count.attr('data-total'));
		toggleParent(source);
		if ($count.attr('data-total') === "0") {
			$("#" + source).hide();
			var text = '<span style="padding-left: 5%">No More Measurements</span>'
			$('#' + source + ' .content').append(text);
		} else {
			$("#" + source).show();
			if ($('#' + source + ' .content').children('span').length !== 0) {
				$('#' + source + ' .content').children('span')[0].remove();
			}
		}
	});

	selectSamples();
}  

function getRandom(max, min) {
	return Math.floor(Math.random() * (max - min)) + min;
}

function sortAlphaNum(a,b) {
	var reA = /[^a-zA-Z]/g;
	var reN = /[^0-9]/g;
	var aA = String(a).replace(reA, "");
	var bA = String(b).replace(reA, "");
	if(aA === bA) {
		var aN = parseInt(String(a).replace(reN, ""), 10);
		var bN = parseInt(String(b).replace(reN, ""), 10);
		return aN === bN ? 0 : aN > bN ? 1 : -1;
	} else {
		return aA > bA ? 1 : -1;
	}
}

function storeMeasurement(measurements, cb) {
	var number = _.size(store) + 1;
	var name = "Chart" + number;
	var new_list = []
	_.forEach(selections, function(val, index) {
		var tup = index.split('-');
		tup[2] = _.join(_.slice(tup, 2), separator="-");
		//tup contains [source, index] for easy indexing into measurements 
		new_list.push(measurements[tup[2]][tup[1]]);
	});
	store[name] = new_list;
	$('#leftmenu').empty();
	$('#rightmenu').empty();
	$('#resultTable').empty();
	$('#sourcemodal').remove();
	cb(store[name], filters);
	// resultTable(name, new_list, cb);
}


function resultTable(name, list, cb) {
	$('#resultTable').append()
	var header = document.createElement('thead');
	var body = document.createElement('tbody');
	var headerRow = document.createElement('tr');
	var th1 = document.createElement('th');
	var th2 = document.createElement('th');
	var th3 = document.createElement('th');

	th1.innerHTML = "id";
	th2.innerHTML = "name";
	th3.innerHTML = "group";
	headerRow.appendChild(th1);
	headerRow.appendChild(th2);
	headerRow.appendChild(th3);
	header.appendChild(headerRow);
	$('#resultTable').append(header);
	$('#resultTable').append(body);

	_.forEach(list, function(val, index) {
		var row = document.createElement('tr');
		var d1 = document.createElement('td');
		var d2 = document.createElement('td');
		var d3 = document.createElement('td');
		d1.innerHTML = val.id;
		d2.innerHTML = val.name;
		d3.innerHTML = val.datasourceGroup;
		row.appendChild(d1);
		row.appendChild(d2);
		row.appendChild(d3);
		body.append(row);

	});
	$('#resultTable').tablesort();
	$('#resultmodal').modal({
		closable: false,
		selector:  {
			deny: '.ui.grey.back.button',
			approve: '.ui.primary.button'
		},
		onDeny: function() {
			$('#newmodal').modal('show');
			$('#resultTable').empty();
		},
		onApprove: function() {
			store[name] = list;
			$('#leftmenu').empty();
			$('#rightmenu').empty();
			$('#resultTable').empty();
			$('#sourcemodal').remove();
			cb(store[name]);
		}
	});
	$('#resultmodal').modal('show');
}

