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

	$("#autoClickSelect").click(function() {
		if($("#sample-type").hasClass("disabled")) {
			$("#select-type").dropdown("set selected", "Auto");
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

	$('#sample-size').change(function() {
		selectionCount = parseInt($('#sample-size').val());
		$('#sampleSizeValue').text(selectionCount + "% samples");  
	});
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
	'<div id ="newmodal" class="ui long modal">' +
		'<div class="header">'+
			'Choose measurements from: ' + source +
			'<div id="warning-message" class="ui negative message" style="display:none;">'+
				'<i class="close icon"></i>'+
				'<div class="header">'+
					'No measurements selected'+
				'</div>'+
			'</div>'+
		'</div>'+
		'<div class="content m">'+
			'<div class="ui grid">'+
				'<div id="titleRow" class="row">'+
					'<div class="four wide column">'+
						'Filter Samples <div id=\"leftMenuCount\" class=\"ui mini circular horizontal label\"> <span class=\"data-count\">0</span> of ' + input.length + '</div>'+
					'</div>'+
					'<div id="autoClickSelect" class="twelve wide column">'+
						'Sample selection type: '+
						'<div class="ui compact selection dropdown" id="select-type">'+
						  	'<i class="dropdown icon"></i>'+
						  	'<div class="text">Manual</div>'+
						  	'<div class="menu">'+
						    	'<div class="item" data-value="1">Auto</div>'+
						    	'<div class="item" data-value="default">Manual</div>'+
						  	'</div>'+
						'</div>'+
						'select: '+
						'<div class="ui disabled compact selection dropdown" id="sample-type">'+
						  	'<i class="dropdown icon"></i>'+
						  	'<span class="text">Random</span>'+
						  	'<div class="menu">'+
						    	'<div class="item" data-value="1">Random</div>'+
						    	'<div class="item" data-value="0">Top</div>'+
						  	'</div>'+
						'</div>'+
						'<div class="ui disabled compact dropdown" id="sample-size-dropdown">'+
						  	'<i class="dropdown icon"></i>'+
						  	'<span class="text" id="sampleSizeValue">0%: samples</span>'+
						  	'<div class="menu">'+
							  '<div class="item">'+
							  	'<input class="ui" type="number" id="sample-size" value="0">'+
							  '</div>'+
						  	'</div>'+
						'</div>'+
					'</div>'+
				'</div>'+
				'<div id="leftRightRow" class="row">'+
					'<div id="annoMenu" class="four wide column">'+
						'<div id="leftmenu" class="ui vertical scrolling accordion menu"> '+
						'</div>'+
					'</div>'+
					'<div class="twelve wide column">'+
						'<div id="rightmenu" class="ui vertical fluid accordion menu">'+
						'</div>'+
					'</div>'+
				'</div>'+
			'</div>'+
		'</div>'+
		'<div class="actions">'+
			'<div class="ui grey button" id="cancel">Cancel</div>'+
			'<div class="ui primary button" id="ok">Ok</div>'+
		'</div>'+
	'</div>'+
	'<div id="resultmodal" class="ui modal">'+
		'<div class="content">'+
			'<div class="bounds">'+
				'<table id="resultTable" class="ui sortable selectable striped table">'+
				'</table>'+
			'</div>'+
		'</div>'+
		'<div class="actions">'+
			'<div class="ui grey back button" id="cancel">Cancel</div>'+
			'<div class="ui primary button" id="ok">Ok</div>'+
		'</div>' +
	'</div>';
	currentSource = source;
	measurements[source] = input;
	measurements[source] = _.sortBy(measurements[source], [function(o) {return o.id}])
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
		}
	});
	$('#newmodal').modal('show');
	loadMeasurements(source, input);
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
	'<div class="ui small modal" id="sourcemodal">' +
		'<div class="header">'+
			'<span>Select Data Source</span>'+
			'<div id="warning-message" class="ui negative message" style="display:none;">Please select a Data Source</div>'+
		'</div>'+
		'<div class="content">'+
			'<form class="ui form" id="form">'+
			'</form>'+
		'</div>'+
		'<div class="actions">'+
			'<div class="ui grey button" id="cancel">Cancel</div>'+
			'<div class="ui blue submit button" id="ok">Ok</div>'+
		'</div>'+
	'</div>';
	$('body').append(form);
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

	var th = document.createElement("th");
	th.innerHTML = "Samples";
	tr.appendChild(th);

	var th = document.createElement("th");
	th.innerHTML = "Sequencing Type";
	tr.appendChild(th);

	thead.appendChild(tr);
    table.appendChild(thead);

	table.appendChild(tableBody);
	$('form').append(table);

	var old_ds;

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
		checkbox.style.display = "none";
		
		checkbox.appendChild(input);
		field.appendChild(label);
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
		
		var td = document.createElement("td");
		td.innerHTML = sources[value][2];
		tr.appendChild(td);

		var td = document.createElement("td");
		td.innerHTML = sources[value][3];
		tr.appendChild(td);

		tableBody.appendChild(tr);

		$("#" + value).click(function() {
			$("#"+value).find(".ui.checkbox").checkbox("check");
			$("#"+value).addClass("active");
			if(old_ds) {
				$("#"+old_ds).removeClass("active");
			}
			old_ds = value;
		});
	});
	$('#form').form();
}

function attachActions(measurements) {

	$('#rightmenu .ui.checkbox input[type="checkbox"]').click(function(e) {
		var split = this.id.split('-');
		split[1] = _.join(_.slice(split, 1), separator="-");
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
}

function toggleParent(source) {
		var $count = $('#count-' + source);
		var selected = parseInt($count.attr("data-selected"));
		var total = parseInt($count.attr("data-total"));
		if (selected > 0 && selected !== total) {
			$('#source-' + source).parent().checkbox('set indeterminate');
			$('#source-' + source).removeClass('hidden');

		} else if (selected === total && total !== 0){
			$('#source-' + source).parent().checkbox('set checked');
			$('#source-' + source).removeClass('hidden');
		} else if (selected === 0) {
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
		//recalculate from original list if you are modifying an existing filter
		recalc = filters[anno].values.length === 0 ? false : true;
		if (filters[anno].type === "range") {
			recalc = true;
			// value passed in could be just setting the na field to true or false.
			if (Array.isArray(value)) {
				filters[anno].values = value;
			} else {
				filters[anno].hideNa = !filters[anno].hideNa;
			}
		} else {
			// maybe some stricter checking here incase accidentally passed in value to set na field?
			filters[anno].values.push(value);
		}
	} else {
		if (value === "NA" && filters[anno].type === "range") {
			filters[anno].hideNa = !filters[anno].hideNa;
		} else {
			filters[anno].values.splice(filters[anno].values.indexOf(value),1);	
		}
		recalc = true;
	}
	// if filters are all empty, show entire dataset
	_.forEach(filters, function(val, key) {
		if (val.length !== 0 || val.hideNa) {
			all_empty = false;
		}
	});
	// apply filter to current measurements or from all measurements
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
		// loop through all elements for the given source
		list[source].forEach(function(data) {
			var sanitizedId = data.id.replace(/[^a-zA-Z0-9_]/g, '');
			var hide = false;
			if (!(all_empty && $('#' + sanitizedId).css('display') === 'none')) {
				if (recalc) {
					// loop through all filters and see if the element passes the filters
					Object.keys(filters).forEach(function(category) {
						var val = filters[category].values;
						var type = filters[category].type;
						if (val.length !== 0) {
							if (data['annotation'] == null) {
								hide = true;
							}
							else if (type === "range") {
								if (val[0] == val[1]) {
									// check if it is the value, or if it is "NA" and na flag is set to false
									if (parseInt(data['annotation'][category]) != val[0] &&
										(!(data['annotation'][category].toLowerCase() === "na") || filters[category].hideNa)) {
										hide = true;
									}
								}
								else if (!(parseInt(data['annotation'][category]) <= val[1] && parseInt(data['annotation'][category]) >= val[0]) && 
										 (!(data['annotation'][category].toLowerCase() === "na") || filters[category].hideNa)) {
									hide = true;
								}
							} else if (filters[category].values.indexOf(data['annotation'][category].replace(/[^a-zA-Z0-9_]/g,'')) === -1) {
								hide = true;
							}
						} else if (type === "range" && 
									(data['annotation'][category].toLowerCase() === "na" && filters[category].hideNa)) {
							// case where no range but toggle hideNa checkbox
							hide = true;
						}
					});
				} else if (filters[anno].values.length !== 0) {
					var val = filters[anno].values;
					var type = filters[anno].type;
					if (data['annotation'] == null || !(anno in data['annotation'])) {
						hide = true;
					}
					else if (type === "range") {
						if (parseInt(data['annotation'][anno]) < val[0] || parseInt(data['annotation'][anno]) > val[1] && 
							(!(data['annotation'][category].toLowerCase() === "na") || filters[category].hideNa)) {
							hide = true;
						}
					}
					else if (filters[anno].values.indexOf(data['annotation'][anno].replace(/[^a-zA-Z0-9]/g,'')) === -1) {
						hide = true;
					}
				}
			}
			current_measurements = new_list;
			if (hide) {
				$('#' + sanitizedId).hide();
				$('#table-' + sanitizedId).hide();
				_.pull(new_list[source], data);
				var checkbox = $('#' + sanitizedId).children();
				if (checkbox.attr('class').indexOf('checked') !== -1) {
					var split = checkbox.attr('id').split('-');
					split[3] = _.join(_.slice(split, 3), separator="-");
					checkbox.checkbox('set unchecked');
					$(this).parent().removeClass('hidden');
					delete selections[split[1] + '-' + split[2] + '-' + split[3]];
				}
			} else {
				new_list[source].push(data);
				$('#' + sanitizedId).show();
				$('#table-' + sanitizedId).show();
			}
		});
		var $count = $('#count-' + source);
		$count.attr("data-selected", _.size(selections));
		$count.attr("data-total", new_list[source].length);
		$count.html(" (Selected: " + $count.attr("data-selected") + " of " + $count.attr('data-total') + ")");
		$("#leftMenuCount span.data-count").text($count.attr('data-total'));
		toggleParent(source);
		if ($count.attr('data-total') === "0") {
			var text = '<span style="padding-left: 5%">No More Measurements</span>'
			$('#' + source + ' .content').append(text);
		} else {
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

// returns true false depending on if array is mostly numbers
function isNumbers(arr) {
	var length = arr.length;
	var nums = 0;
	for (var i = 0; i < length; i++) {
		if (parseInt(arr[i])) {
			nums++;
			if (nums >= length / 4) {
				return true;
			}
		}
	}
	return false;
}

// checks to see if there exists elements that are undefined, NULL, or NA in a range array
function removeUndefined(arr) {
	var length = arr.length;
	var res = [];

	for (var i = 0; i < length; i++) {
		if (!isNaN(arr[i])) {
			// remove NA from the list
			res.push(parseInt(arr[i]));
		}
	}
	res.sort((a,b) => {return a - b});
	return res;
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

