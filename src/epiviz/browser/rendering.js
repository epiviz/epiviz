var globalTable;

function rightAccordion(measurements) {
    // var tempM = _.chunk(measurements[Object.keys(measurements)[0]], 50);
    // var temp = {};
    // temp[Object.keys(measurements)[0]] = tempM;
    _.forEach(measurements, function(value, source) {

        $("#" + source).remove();

        var currAnnos = Object.keys(value[0].annotation);

        var item = document.createElement('div');
        var title = document.createElement('a');
        var titlecheckbox = document.createElement('div');
        var checkboxlabel = document.createElement('label');
        var checkboxcount = document.createElement('span');
        var $count = $(checkboxcount);
        var checkboxinput = document.createElement('input');
        var icon = document.createElement('i');
        var content = document.createElement('div');
        var form = document.createElement('div'); 
        var fields = document.createElement('div');

        item.className = "item";
        item.id = source;
        title.className = "title";
        titlecheckbox.className = "ui checkbox";
        checkboxinput.type = "checkbox";
        checkboxinput.id = "source-" + source;
        //set main checkbox label and selection count
        checkboxlabel.innerHTML = source;
        $count.attr('id', "count-" + source);
        $count.attr('data-selected', "0");
        $count.attr('data-total', value.length);
        $count.html(" (Selected: " + $count.attr("data-selected") + " of " + $count.attr('data-total') + ")");
        checkboxlabel.appendChild(checkboxcount);

        icon.className = "dropdown icon";
        content.className = "content active";
        form.className = "ui form";

        $("#mTable").remove();
        
        var table = document.createElement("table");
        table.id = "mTable";
        table.className = "ui celled table sortable compact";
        var tableBody = document.createElement("tbody");

        var thead = document.createElement("thead");
        var tr = document.createElement("tr");

        var th = document.createElement("th");
        th.innerHTML = "Sample ID";
        tr.appendChild(th);
        _.each(currAnnos, function(ca) {
            var th = document.createElement("th");
            th.innerHTML = ca;
            tr.appendChild(th);
        });

        thead.appendChild(tr);
        table.appendChild(thead);

        item.appendChild(title);
        item.appendChild(content);
        title.appendChild(titlecheckbox);
        title.appendChild(icon);
        titlecheckbox.appendChild(checkboxinput);
        titlecheckbox.appendChild(checkboxlabel);

        $('#rightmenu').append(item);
        $(titlecheckbox).unbind("click");

        table.appendChild(tableBody);
        content.appendChild(table);

        globalTable = $('#mTable').DataTable({
            // "scrollY": "400px",
            // "scrollCollapse": true,
            // "paging": false,
            stateSave: true
        });

        $('#mTable').on('draw.dt', function () {
            attachActions(measurements);
        });

        var chunkValues = _.chunk(value, 1000);

        _.forEach(chunkValues[0], function(point, index) {
            var field = document.createElement('div');
            var checkbox = document.createElement('div');
            var input = document.createElement('input');
            var label = document.createElement('label');
            var span1 = document.createElement('span');
            var sanitized = point.id.replace(/[^a-zA-Z0-9]/g, '');

            fields.className = "grouped fields";
            field.className = "field";
            field.id = sanitized
            field.style = "padding-left: 2.5%";
            checkbox.className = "ui checkbox";
            //point, source, and index to allow for easy indexing in measurements list
            checkbox.id = "item-" + sanitized + "-" + index + "-" + source;
            input.type = "checkbox";
            input.name = "small";
            span1.innerHTML = point.id;

            label.appendChild(span1);
            field.appendChild(checkbox);
            checkbox.appendChild(input);
            checkbox.appendChild(label);

            var tr = document.createElement("tr");
            tr.id = "table-" + sanitized;
            var td = document.createElement("td");
            td.appendChild(field);
            tr.appendChild(td);

            rowItem = []
            rowItem.push(field.outerHTML);

            _.each(currAnnos, function(ca) {
                var td = document.createElement("td");
                td.innerHTML = point.annotation[ca];
                tr.appendChild(td);
                rowItem.push(point.annotation[ca]);
            });
            globalTable.row.add(rowItem);
            // tableBody.appendChild(tr);
        });

        _.forEach(chunkValues, function(tchunk, index) {
            if (index > 0) {
                setTimeout(function() {
                    _.forEach(tchunk, function(point, index) {
                        var field = document.createElement('div');
                        var checkbox = document.createElement('div');
                        var input = document.createElement('input');
                        var label = document.createElement('label');
                        var span1 = document.createElement('span');
                        var sanitized = point.id.replace(/[^a-zA-Z0-9]/g, '');
            
                        fields.className = "grouped fields";
                        field.className = "field";
                        field.id = sanitized
                        field.style = "padding-left: 2.5%";
                        checkbox.className = "ui checkbox";
                        //point, source, and index to allow for easy indexing in measurements list
                        checkbox.id = "item-" + sanitized + "-" + index + "-" + source;
                        input.type = "checkbox";
                        input.name = "small";
                        span1.innerHTML = point.id;
            
                        label.appendChild(span1);
                        field.appendChild(checkbox);
                        checkbox.appendChild(input);
                        checkbox.appendChild(label);
            
                        var tr = document.createElement("tr");
                        tr.id = "table-" + sanitized;
                        var td = document.createElement("td");
                        td.appendChild(field);
                        tr.appendChild(td);
            
                        rowItem = []
                        rowItem.push(field.outerHTML);
            
                        _.each(currAnnos, function(ca) {
                            var td = document.createElement("td");
                            td.innerHTML = point.annotation[ca];
                            tr.appendChild(td);
                            rowItem.push(point.annotation[ca]);
                        });
                        globalTable.row.add(rowItem);
                        // tableBody.appendChild(tr);
                    });
                    
                    globalTable.draw();
                }, 1000);
            }
        });

        globalTable.draw();
            // "pagingType": "first_last_numbers"

        // attachActions(measurements);

        //for some reason this fixes my checkbox issue
        $($(titlecheckbox).children()[0]).click(function() {
        });
    });
    $('#rightmenu').accordion({
        exclusive : false,
        selector : {
            trigger: '.title .ui.checkbox label'
        },
        verbose : true
    });
}

function loadMeasurements(datasource, input) {
    var start = performance.now();

    var values;
    var ranges = {};
    var checkboxIndex = 0;
    var i = 0;
    var measurements = {};
    var fTracker= {};
    var searchList = [];
    measurements[datasource] = input;
    measurements[datasource] = _.sortBy(measurements[datasource], [function(o) {return o.id}])
    annotations = Object.keys(measurements[datasource][i].annotation);
    annotations = annotations.sort(sortAlphaNum);
    annotationMap = {};

    // annotations.forEach(function(text) {
    //     annotationMap[text] = [];
    // });

    // _.forEach(measurements, function(value, data_source) {

    //     annotations.forEach(function(text) {
    //         annotationMap[text] 
    //     });
    //     allValues = _.chain(value).map(function(id) {
    //         if (id.annotation != null && text in id.annotation) {
    //             return id.annotation[text];
    //         }
    //     }).concat(values).value();
    //     fieldCount = allValues.length;
    //     allCounts = _.countBy(allValues);
    //     values = _.uniq(allValues).filter(function (d) {
    //         return d != undefined;
    //     });
    // });

    annotations.forEach(function(text) {
        values = [];
        var allCounts = {};
        var fieldCount = 0;
        var fieldType = null;
        var skip = false;

        _.forEach(measurements, function(value, data_source) {
            
            // allValues = _.chain(value).map(function(id) {
            //     if (id.annotation != null && text in id.annotation) {
            //         return id.annotation[text];
            //     }
            // }).concat(values).value();

            allValues = _.map(value, function(id) {
                    if (id.annotation != null && text in id.annotation) {
                        return id.annotation[text];
                    }
                }
            );

            fieldCount = allValues.length;
            allCounts = _.countBy(allValues);
            values = _.uniq(allValues).filter(function (d) {
                return d != undefined;
            });

            if (fieldCount == values.length) {
                skip = true;
            }
        });

        if (!skip) {
            var item = document.createElement('div');
            var title = document.createElement('a');
            var icon = document.createElement('i');
            var content = document.createElement('div');
            var form = document.createElement('div');
            var fields = document.createElement('div');
            var sanitized = text.replace(/[^a-zA-Z0-9_]/g, '');
            fTracker[sanitized] = text;

            values = values.sort(sortAlphaNum);
            // check if the values are all numbers
            if (parseInt(values[getRandom(0, values.length - 1)]) && values.length > 5) {
                // filter keys should be sanitized because ids are sanitized and used to index into the filter hash
                filters[sanitized] = {values: [], type: "range", hideNa: false};
                var filterUndefined = removeUndefined(values);
    
                var field = document.createElement('div');
                field.className = "ui mini"
                var minInput = document.createElement('input');
                minInput.type = "number";
                minInput.className = "ui minInput";
                minInput.placeholder = "min";
                minInput.id = sanitized + "-min";
                minInput.value = filterUndefined[0];
                minInput.style.width = "60px";
                var maxInput = document.createElement('input');
                maxInput.type = "number";
                maxInput.placeholder = "max";
                maxInput.className = "ui maxInput";
                maxInput.id = sanitized + "-max";
                maxInput.value = filterUndefined[filterUndefined.length-1];
                maxInput.style.width = "60px";
    
                field.appendChild(minInput);
    
                var span = document.createElement("span");
                span.textContent = " - ";
                field.appendChild(span);
                field.appendChild(maxInput);
    
                var button = document.createElement("button");
                button.id = sanitized + "-filter";
                button.textContent = "filter";
                button.className = "mini ui button";
    
                fields.appendChild(field);
                ranges[sanitized] = ["#" + sanitized + "-filter", "#" + sanitized + "-min", "#" + sanitized + "-max"];
                
                if (filterUndefined.length !== values.length) {
                    var checkbox = document.createElement('div');
                    var input = document.createElement('input');
                    var label = document.createElement('label');
    
                    input.type = "checkbox";
                    input.value = sanitized + "-NA";
                    label.innerHTML = "Hide NA values";
    
                    checkbox.className = "ui checkbox";
                    checkbox.id = "checkbox" + checkboxIndex;
                    checkbox.appendChild(input);
                    checkbox.appendChild(label);
                    field.appendChild(checkbox);
                    checkboxIndex++;
                }
            } else {
                // filter keys should be sanitized because ids are sanitized and used to index into the filter hash
                filters[sanitized] = {values: [], type: "normal", hideNa: false};
                fieldType = "category";
                values.forEach(function(anno) {
                    var field = document.createElement('div');
                    var checkbox = document.createElement('div');
                    var input = document.createElement('input');
                    var label = document.createElement('label'); 
                    var s_anno = String(anno).replace(/[^a-zA-Z0-9]/g, ''); 
                    field.className = "field";
                    checkbox.className = "ui checkbox";
                    checkbox.id = "checkbox" + checkboxIndex;
                    input.type = "checkbox"
                    input.name = s_anno;
                    input.value = sanitized + "-" + s_anno;
                    label.innerHTML = anno + "<div class=\"ui mini circular horizontal label\"> " + allCounts[anno] + "</div>"; 
                    fields.appendChild(field);
                    field.appendChild(checkbox);
                    checkbox.appendChild(input);
                    checkbox.appendChild(label);
                    checkboxIndex++;
                });
            }
            item.className = "item";
            item.id = sanitized;
            title.className = "title";
            title.innerHTML = text;
    
            icon.className = "dropdown icon";
            content.className = "active content";
            form.className = "ui form";
            fields.className = "grouped fields";
    
            item.appendChild(title);
            item.appendChild(content);
            title.appendChild(icon);
            content.appendChild(fields);
            $('#leftmenu').append(item);
    
            searchList.push({title: text, selector: item});
        }
    });
    
    $('.ui.search').search({
        minCharacters: 0,
        source: searchList,
        maxResults: searchList.length,
        cache: false,
        onResults: (results) => {searchFilter(results.results, searchList)},
    });

    $('#annoSearchResults').remove();

    for (var i = 0; i < checkboxIndex; i++) {
        $('#checkbox' + i).checkbox({
            onChecked: function() {
                // value, anno, filter, measurements
                filter($(this).val().split("-")[1], $(this).val().split("-")[0], true, measurements);
            },
            onUnchecked: function() {
                filter($(this).val().split("-")[1], $(this).val().split("-")[0], false, measurements);
            }
        });
    }
    $('#leftmenu').accordion({
        exclusive: false
    });

    Object.keys(ranges).forEach(function(ids) {

        $(ranges[ids][1]).change(function() {
            filter([parseInt($(ranges[ids][1]).val()), parseInt($(ranges[ids][2]).val())], 
            fTracker[ids.split('-')[0]], true, measurements);        
        });

        $(ranges[ids][2]).change(function() {
            filter([parseInt($(ranges[ids][1]).val()), parseInt($(ranges[ids][2]).val())], 
            fTracker[ids.split('-')[0]], true, measurements);
        });
    });

    $('.active.content').each(function(index) {
        $('.active.content')[0].className = 'content';
    });
    var end1 = performance.now();
    console.log("until right accordion");
    console.log(end1 - start)
    rightAccordion(measurements);
    var end2 = performance.now();
    console.log("after right accordion");
    console.log(end2 - start)
    // attachActions(measurements);
}

function searchFilter(results, searchList) {
    var diff = _.differenceBy(searchList, results, "title")
    _.forEach(diff, function(anno) {
        $(anno.selector).hide();
    });
    _.forEach(results, function(anno) {
        $(anno.selector).show();
    })
}

