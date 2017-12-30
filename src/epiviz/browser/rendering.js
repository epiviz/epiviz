function rightAccordion(measurements) {
    _.forEach(measurements, function(value, source) {

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
        
        var table = document.createElement("table");
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

        _.forEach(value, function(point, index) {
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
            //input.id = "item-" + point.id + "-" + source;
            input.name = "small";
            span1.innerHTML = point.id;

            label.appendChild(span1);
            // fields.appendChild(field);
            field.appendChild(checkbox);
            checkbox.appendChild(input);
            checkbox.appendChild(label);

            var tr = document.createElement("tr");
            tr.id = "table-" + sanitized;
            var td = document.createElement("td");
            td.appendChild(field);
            tr.appendChild(td);

            _.each(currAnnos, function(ca) {
                var td = document.createElement("td");
                td.innerHTML = point.annotation[ca];
                tr.appendChild(td);
            });

            tableBody.appendChild(tr);
        });
        item.appendChild(title);
        item.appendChild(content);
        title.appendChild(titlecheckbox);
        title.appendChild(icon);
        titlecheckbox.appendChild(checkboxinput);
        titlecheckbox.appendChild(checkboxlabel);
        // content.appendChild(fields);

        table.appendChild(tableBody);
        content.appendChild(table);

        // $(table).tablesort();

        $('#rightmenu').append(item);
        $(titlecheckbox).unbind("click");

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
    var values;
    var ranges = {};
    var checkboxIndex = 0;
    var i = 0;
    var measurements = {};
    var fTracker= {};
    measurements[datasource] = input;
    // while(i < input.length && measurements[datasource][i].annotation === null) {
    //     i++;
    // }
    measurements[datasource] = _.sortBy(measurements[datasource], [function(o) {return o.id}])
    annotations = Object.keys(measurements[datasource][i].annotation);
    annotations = annotations.sort(sortAlphaNum);
    annotations.forEach(function(text) {
        var item = document.createElement('div');
        var title = document.createElement('a');
        var icon = document.createElement('i');
        var content = document.createElement('div');
        var form = document.createElement('div');
        var fields = document.createElement('div');
        var sanitized = text.replace(/[^a-zA-Z0-9_]/g, '');
        fTracker[sanitized] = text;
        values = [];
        var allCounts = {};
        var fieldCount = 0;
        var fieldType = null;

        _.forEach(measurements, function(value, data_source) {
            allValues = _.chain(value).map(function(id) {
                if (id.annotation != null && text in id.annotation) {
                    return id.annotation[text];
                }
            }).concat(values).value();
            fieldCount = allValues.length;
            allCounts = _.countBy(allValues);
            values = _.uniq(allValues).filter(function (d) {
                return d != undefined;
            });
        });
        values = values.sort(sortAlphaNum);
        // console.log(parseInt(values[getRandom(0, values.length - 1)]));
        // check if the values are all numbers
        if (parseInt(values[getRandom(0, values.length - 1)]) && values.length > 5) {
            // console.log("values" + values.length);
            // filter keys should be sanitized because ids are sanitized and used to index into the filter hash
            filters[sanitized] = {values: [], type: "range", hideNa: false};
            var field = document.createElement('div');
            var range1 = document.createElement('div');
            var display1 = document.createElement('span');
            var cont1 = document.createElement('p');
            var cont2 = document.createElement('p');
            var filterUndefined = removeUndefined(values);

            field.className = "field";
            field.width = "inherit";
            range1.className = "ui range"
            range1.id = sanitized + "-range";
            display1.id = sanitized + "-display";
            fields.appendChild(field);
            field.appendChild(range1);
            cont1.appendChild(display1);
            field.appendChild(cont1);
            ranges[range1.id] = filterUndefined;
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
        // if(fieldType == "category") {
        //     title.innerHTML = text + "<div class=\"ui mini circular horizontal label\"> filtered: <span class=\"data-count\">0</span> of " + fieldCount + "</div>";
        // }
        // else {
            title.innerHTML = text;

        // }
        icon.className = "dropdown icon";
        content.className = "active content";
        form.className = "ui form";
        fields.className = "grouped fields";

        item.appendChild(title);
        item.appendChild(content);
        title.appendChild(icon);
        content.appendChild(fields);
        $('#leftmenu').append(item);
    });
    for (var i = 0; i < checkboxIndex; i++) {
        $('#checkbox' + i).checkbox({
            onChecked: function() {
                // $($(this).parent().parent().parent().parent().parent().find("span.data-count")).text( parseInt($($(this).parent().parent().parent().parent().parent().find("span.data-count")).text()) + parseInt($(this).parent().find("div.label").text()) );
                // value, anno, filter, measurements
                filter($(this).val().split("-")[1], $(this).val().split("-")[0], true, measurements);
            },
            onUnchecked: function() {
                // $($(this).parent().parent().parent().parent().parent().find("span.data-count")).text( parseInt($($(this).parent().parent().parent().parent().parent().find("span.data-count")).text()) - parseInt($(this).parent().find("div.label").text()) );
                filter($(this).val().split("-")[1], $(this).val().split("-")[0], false, measurements);
            }
        });
    }
    $('#leftmenu').accordion({
        exclusive: false
    });

    Object.keys(ranges).forEach(function(ids) {
        $('#' + ids).range({
            start: ranges[ids][0],
            values: [ranges[ids][0], ranges[ids][ranges[ids].length-1]],
            step: 1,
            onChange: function(min, max) {
                $('#'+ ids.split('-')[0] + "-display").html("Min: " + min + " " + "Max:" + max);
            }
        });
        $('#' + ids + " .thumb").on('mousedown', function() {
            $('#' + ids).on('mouseup', function() {
                $('#' + ids).range('get value', function(val) {filter(val, fTracker[ids.split('-')[0]], true, measurements)});
                $('#' + ids).off('mouseup');
            });
            $('#' + ids).on('mouseleave', function() {
                // helps update the mouse event if you dragged past the end, should have some other method to keep drag of mouseevents though
                $('#' + ids).range('get value', function(val) {filter(val, fTracker[ids.split('-')[0]], true, measurements)});
                $('#' + ids).off('mouseleave');    
            })
        });
    });

    $('.active.content').each(function(index) {
        $('.active.content')[0].className = 'content';
    });
    rightAccordion(measurements);
    attachActions(measurements);
}
