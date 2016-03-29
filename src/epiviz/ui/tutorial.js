goog.provide('epiviz.ui.tutorials');

epiviz.ui.tutorials = function() {
    this._tutorialList = [
        {
            "name": 'Epiviz Overview',
            "id": 'tut_epiviz_overview',
            "tutorial": [
                {
                    target: 'body',
                    content: "<p class='intro-header'>Welcome to Epiviz Genomic Browser!<br></p>" +
                    "<p class='intro-text'>This tutorial will walk you through the functionality available in Epiviz.</p>",
                    position: 'center'
                }, {
                    target: '#intro-navigation',
                    content: "<p class='intro-text'>The navigation section of Epiviz lets you select a chromosome and explore the genome. Options are available to move left/right and zoom in/out.</p>" +
                    "<p class='intro-text'>The settings icon allows you to control the navigation parameters.</p>",
                    position: 'right',
                    buttons: [AnnoButton.BackButton, AnnoButton.NextButton]
                }, {
                    target: '#search-box',
                    content: "<p class='intro-header'>Use the search input to look for a specific gene or target.</p>" +
                    "<p class='intro-text'>This will navigate Epiviz to the selected gene location and update the workspace with the new data.</p>",
                    position: 'right',
                    buttons: [AnnoButton.BackButton, AnnoButton.NextButton]
                }, {
                    target: '#vis-menu-button',
                    content: '<p class="intro-text">Choose from a list of available data sources, measurements or chart types to add visualizations to the Epiviz Workspace.</p>',
                    position: 'right',
                    buttons: [AnnoButton.BackButton, AnnoButton.NextButton]
                }, {
                    target: '#intro-workspace',
                    content: '<p class="intro-header">managing workspaces.</p>' +
                    '<p class="intro-text">If you are logged in, you will be able to save your Epiviz analysis and workspaces.' +
                    'You will also be able to retrieve them at a later time from your account.</p>',
                    position: 'right',
                    buttons: [AnnoButton.BackButton, AnnoButton.NextButton]
                }, {
                    target: '#login-link',
                    content: '<p class="intro-text">Please login to save and manage Epiviz workspaces.</p>',
                    position: 'left',
                    buttons: [AnnoButton.BackButton, AnnoButton.NextButton]
                }, {
                    target: 'body',
                    content: "<p class='intro-header'>Thank you for using Epiviz!</p>" +
                    '<p class="intro-text">If you would like to give us some feedback or stay informed with updates, Please visit the <a target="_blank" href="http://epiviz.github.io/">Epiviz webpage</a>.</p>',
                    position: 'center'
                }]
        }, {
            "name": 'Data Visualization and Controls',
            "id": 'tut_data_controls',
            "tutorial": [{
                target: 'body',
                content: "<p class='intro-header'>Welcome to Epiviz Genomic Browser!<br><br>" +
                "Data visualization tutorial<br></p>" +
                "<p class='intro-text'>This tutorial will help create/add new data visualizations to the Epiviz workspace " +
                "and controls available for each visualization.</p>",
                position: 'center'
            }, {
                target: '#vis-menu-button',
                content: '<p class="intro-text">The Data Visualizations button helps users add new charts to the workspace.</p>' +
                '<p>Users have the option to choose data sources and measurements to add to the workspace.</p>',
                position: 'right',
                onHide: function(anno, $target, $annoElem, returnFromOnShow) {
                    $('#vis-menu-button').button().trigger("click");
                },
                showOverlay: function(){},
                buttons: [AnnoButton.BackButton, AnnoButton.NextButton]
            }, {
                target: '#vis-menu',
                content: '<p class="intro-text">Choose the type of chart to add to your workspace. We choose scatter plot to continue with the tutorial</p>',
                position: 'right',
                onShow: function(anno, $target, $annoElem) {
                },
                onHide: function(anno, $target, $annoElem, returnFromOnShow) {
                    $('#plot-menu-add-scatter').trigger("click");
                },
                showOverlay: function(){},
                buttons: [AnnoButton.BackButton, AnnoButton.NextButton]
            }, {
                target: function() {
                    var parent = $('#wizardDialog').parent().attr('id');
                    var p_parent = $('#' + parent).parent();
                    return p_parent;
                },
                content: '<p class="intro-text">This window lets you choose form a list of data sources and ' +
                'the measurements available from each data source to add to your Epiviz workspace</p>' +
                '<p>We selected the first data source in the table or choose a data source from the list.</p>',
                showOverlay: function(){},
                onShow: function(anno, $target, $annoElem) {
                    $('#wizardDialog table tbody tr:first').trigger('click');
                },
                onHide: function(anno, $target, $annoElem, returnFromOnShow) {
                    $('.ui-button:contains("Next")').trigger('click');
                },
                position: 'right',
                buttons: [AnnoButton.BackButton, AnnoButton.NextButton]
            }, {
                target: function() {
                    var parent = $('#wizardDialog').parent().attr('id');
                    var p_parent = $('#' + parent).parent();
                    return p_parent;
                },
                content: '<p class="intro-text">After choosing a data source, the next tab lists all the measurements (or features) ' +
                'available from this data source. If you have any computed measurements for this data source, they will be added to this list.</p>' +
                '<p>To add a plot to the workspace, pick a few measurements and select finish on this window. </p>',
                showOverlay: function(){},
                position: 'right',
                onShow: function(anno, $target, $annoElem) {
                    //$('#wizardDialog table tbody tr:first').trigger('click');
                    //$('#wizardDialog table tbody tr:eq(2)').trigger('click');
                },
                onHide: function(anno, $target, $annoElem, returnFromOnShow) {
                    var parent = $('#wizardDialog').parent().attr('id');
                    $('#' + parent).dialog('close');
                    //$('.ui-button:contains("Finish")').trigger('click');
                },
                buttons: [AnnoButton.BackButton, AnnoButton.NextButton]
            }, {
                target: '#feature-view',
                content: '<p class="intro-text">Visualizations are added to the workspace based on the type of chart. </p>' +
                '<p>Brushing is implemented on all the plots. When you hover over a data point, it highlight that region in the gene on all the visualizations.</p>',
                position: {
                    top: '24em',
                    left: '14em'
                },
                showOverlay: function(){},
                onShow: function(anno, $target, $annoElem) {

                    $('button:contains("Remove"):first').css('display', 'block');
                },
                buttons: [AnnoButton.BackButton, AnnoButton.NextButton]
            }, {
                target: function() {
                    return $('button:contains("Remove"):first');
                },
                content: '<p class="intro-text">Removes the plot from the workspace</p>',
                position: 'left',
                showOverlay: function(){},
                className: 'anno-width-175',
                onShow: function(anno, $target, $annoElem) {
                    $('button:contains("Save"):eq(1)').css('display', 'block');
                },
                onHide: function(anno, $target, $annoElem, returnFromOnShow) {
                    $($target).css('display', 'none');
                },
                buttons: [AnnoButton.BackButton, AnnoButton.NextButton]
            }, {
                target: function() { return $('button:contains("Save"):eq(1)'); },
                content: '<p class="intro-text">Save a plot to your local machine (image, pdf)</p>',
                position: 'left',
                showOverlay: function(){},
                className: 'anno-width-175',
                onShow: function(anno, $target, $annoElem) {
                    $('button:contains("Custom settings"):first').css('display', 'inline-block');
                },
                onHide: function(anno, $target, $annoElem, returnFromOnShow) {
                    $($target).css('display', 'none');
                },
                buttons: [AnnoButton.BackButton, AnnoButton.NextButton]
            }, {
                target: function() { return $('button:contains("Custom settings"):first'); },
                content: '<p class="intro-text">Change chart display properties and aggregation methods for grouping.</p>',
                position: 'left',
                showOverlay: function(){},
                className: 'anno-width-175',
                onShow: function(anno, $target, $annoElem) {
                    $('button:contains("Code"):first').css('display', 'inline-block');
                },
                onHide: function(anno, $target, $annoElem, returnFromOnShow) {
                    $($target).css('display', 'none');
                },
                buttons: [AnnoButton.BackButton, AnnoButton.NextButton]
            }, {
                target: function() { return $('button:contains("Code"):first'); },
                content: '<p class="intro-text">Edit code to redraw the chart on the workspace.</p>',
                position: 'left',
                showOverlay: function(){},
                className: 'anno-width-175',
                onShow: function(anno, $target, $annoElem) {
                    $('button:contains("Colors"):first').css('display', 'inline-block');
                },
                onHide: function(anno, $target, $annoElem, returnFromOnShow) {
                    $($target).css('display', 'none');
                },
                buttons: [AnnoButton.BackButton, AnnoButton.NextButton]
            }, {
                target: function() { return $('button:contains("Colors"):first'); },
                content: '<p class="intro-text">Choose colors for data points on the plot</p>',
                position: 'left',
                showOverlay: function(){},
                className: 'anno-width-175',
                onShow: function(anno, $target, $annoElem) {
                    $('label:contains("Toggle tooltip"):first').css('display', 'block');
                },
                onHide: function(anno, $target, $annoElem, returnFromOnShow) {
                    $($target).css('display', 'none');
                },
                buttons: [AnnoButton.BackButton, AnnoButton.NextButton]
            }, {
                target: function() {
                    return $('label:contains("Toggle tooltip"):first');
                },
                content: '<p class="intro-text">Toggle tooltips for data points</p>',
                position: 'right',
                showOverlay: function(){},
                className: 'anno-width-175',
                onHide: function(anno, $target, $annoElem, returnFromOnShow) {
                    $($target).css('display', 'none');
                },
                buttons: [AnnoButton.BackButton, AnnoButton.NextButton]
            }, {
                target: 'body',
                content: "<p class='intro-header'>Thank you for using Epiviz!</p>" +
                '<p class="intro-text">If you would like to give us some feedback or stay informed with updates, Please visit the <a target="_blank" href="http://epiviz.github.io/">Epiviz webpage</a>.</p>',
                position: 'center'
            }]
        }, {
            "name": 'Computed Measurements',
            "id": 'tut_comp_measurements',
            "tutorial": [{
                target: 'body',
                content: "<p class='intro-header'>Welcome to Epiviz Genomic Browser!<br>" +
                "Compute Measurements Tutorial<br></p>" +
                "<p class='intro-text'>This tutorial will help you create new measurements (derived from existing measurements) and generate plots to add " +
                "to the workspace.</p>",
                position: 'center'
            }, {
                target: '#computed-measurements-button',
                content: "<p class='intro-text'>The computed measurements button helps users " +
                "add new measurements to data sources</p>",
                position: 'right',
                onShow: function(anno, $target, $annoElem) {
                    $('#computed-measurements-button').button().trigger("click");
                },
                buttons: [AnnoButton.BackButton, AnnoButton.NextButton]
            }, {
                target: '#computedMeasurementsDialog',
                content: "<p class='intro-text'>This tab lets you " +
                "choose a data source where you will create a new measurement.</p>" +
                "<p>We choose the first data source in the list or choose any data source.</p>",
                position: {
                    top: '20em',
                    left: '1em'
                },
                showOverlay: function(){},
                onShow: function(anno, $target, $annoElem) {
                    $('#computedMeasurementsDialog table tbody tr td:first').trigger('click');
                },
                buttons: [AnnoButton.BackButton, AnnoButton.NextButton]
            }, {
                target: '#computedMeasurementsDialog',
                content: "<p class='intro-text'>The measurements tab lists " +
                "all available measurements from the selected data source (including previously created computed measurements).</p>" +
                "<p>Use the buttons next to each measurement to add to the expression window</p>",
                position: {
                    top: '20em',
                    left: '1em'
                },
                showOverlay: function(){},
                onShow: function(anno, $target, $annoElem) {
                    $('.ui-button:contains("Next")').trigger('click');
                },
                buttons: [AnnoButton.BackButton, AnnoButton.NextButton]
            }, {
                target: '#computedMeasurementsDialog',
                content: "<p class='intro-text'> After choosing measurements, use mathematical operators to evaluate the expression.</p>" +
                "<p><a target='_blank' href='https://silentmatt.com/javascript-expression-evaluator/'>supported operators</a> </p>",
                position: {
                    top: '33em',
                    left: '1em'
                },
                showOverlay: function(){},
                buttons: [AnnoButton.BackButton, AnnoButton.NextButton]
            }, {
                target: '#computedMeasurementsDialog',
                content: "<p class='intro-text'>After adding a computed measurement, " +
                "use the data visualization button to plot the measurement to your workspace.</p>" +
                "<p>To learn how to add new plots to the workspace, please use the Epiviz data visualization tutorial.</p>",
                position: {
                    top: '10em',
                    left: '1em'
                },
                showOverlay: function(){},
                onHide: function(anno, $target, $annoElem, returnFromOnShow) {
                    var parent = $('#computedMeasurementsDialog').parent().attr('id');
                    $('#' + parent).dialog('close');
                },
                buttons: [AnnoButton.BackButton, AnnoButton.NextButton]
            }, {
                target: 'body',
                content: "<p class='intro-header'>Thank you for using Epiviz!</p>" +
                '<p class="intro-text">If you would like to give us some feedback or stay informed with updates, Please visit the <a target="_blank" href="http://epiviz.github.io/">Epiviz webpage</a>.</p>',
                position: 'center'
            }]
        }
    ];
};