/**
 * Created by Jayaram Kancherla ( jkanche [at] umd [dot] edu )
 * Date: 4/6/2016
 */

goog.provide('epiviz.ui.PrintManager');

/**
 * @param {string} ctrId DOM ID to print/save. Can be the whole page or a epiviz.chart id.
 * @param {string} fName File Name to use
 * @param {string} fType File Format (pdf, png)
 * @constructor
 */
epiviz.ui.PrintManager = function(ctrId, fName, fType, workspaceId) {

    /**
     * DOM ID to print
     * @type {string}
     */
    this._containerId = ctrId ? ctrId : 'pagemain';

    /**
     * File Name for the screenshot/chart
     * @type {string}
     */
    this._fName = fName ? fName : "epiviz_" + Math.floor($.now() / 1000);

    /**
     * File Format to save (pdf, png)
     * @type {string}
     */
    this._fType = fType ? fType : "pdf";

    /**
     * workspace id of the current plot
     * @type {string}
     */
    this._workspaceId = workspaceId;
};


/**
 * Prints the chart or the specified DOM ID to a pdf or png.
 */
epiviz.ui.PrintManager.prototype.print = function() {

    var self = this;

    var container = $('#' + self._containerId);

    function inline_styles(dom) {
        var used = "";
        var sheets = document.styleSheets;
        for (var i = 0; i < sheets.length; i++) {
            var rules = sheets[i].cssRules;
            for (var j = 0; j < rules.length; j++) {
                var rule = rules[j];
                if (typeof(rule.style) != "undefined") {
                    var elems = dom.querySelectorAll(rule.selectorText);
                    if (elems.length > 0) {
                        used += rule.selectorText + " { " + rule.style.cssText + " }\n";
                    }
                }
            }
        }

        $(dom).find('style').remove();

        var s = document.createElement('style');
        s.setAttribute('type', 'text/css');
        s.innerHTML = "<![CDATA[\n" + used + "\n]]>";

        //dom.getElementsByTagName("defs")[0].appendChild(s);
        dom.insertBefore(s, dom.firstChild);
    }

    //add inline styles to svg elements
    function custom_styles(dom) {

        // style axes lines
        var axes = $(dom).find('.domain');
        axes.each(function () {
            $(this).css({"fill": "none", "stroke-width": "1px", "stroke": "#000000", "shape-rendering": "crispEdges"});
        });

        //remove gene name labels
        var gLabels = $(dom).find('.gene-name');
        gLabels.each(function () {
            $(this).remove();
        });

        // fill path on single line tracks

            var lines = $(dom).find('.lines path');
            lines.each(function() {
                $(this).css({"fill": "none"});
            });

        //change text size to fit screen
        var texts = $(dom).find('text');
        texts.each(function(){
            $(this).css({"font-size": "11px"});
        });

        var cLegends = $(dom).find('.chart-legend');
        cLegends.each(function() {
            $(this).css({"border": "none", "background": "transparent"});
        });
    }

    var svgElems = container.find('svg');

    svgElems.each(function () {
        var canvas, xml;

        canvas = document.createElement("canvas");
        canvas.className = "tempCanvas";

        custom_styles(this);

        // Convert SVG into a XML string
        xml = new XMLSerializer().serializeToString(this);

        // Removing the name space as IE throws an error
        xml = xml.replace(/xmlns=\"http:\/\/www\.w3\.org\/2000\/svg\"/, '');

        // draw the canvas object created from canvg
        var self = this;
        canvg(canvas, xml, {
            useCORS: true,
            renderCallback: function() {
                $(canvas).insertAfter(this);
                $(this).hide();
            }
        });
    });

    // use html2canvas to take a screenshot of the page!
    html2canvas(container, {
        //allowTaint: true,
        //taintTest: false,
        timeout: 0,
        //logging: true,
        width: container[0].scrollWidth + 200,
        height: container[0].scrollHeight + 200,
        useCORS: true
    }).then(function (canvas) {

        var ctx = canvas.getContext("2d");
        ctx.mozImageSmoothingEnabled = false;
        ctx.imageSmoothingEnabled = false;

        var filename = self._fName + "." + self._fType;
        var format = self._fType;
        var image = canvas.toDataURL("image/png");

        if(format == "pdf") {

            var dWidth = container[0].scrollWidth > 1400 ? container[0].scrollWidth : 1400;
            var dHeight = container[0].scrollHeight > 1000 ? container[0].scrollHeight : 1000;

            var jsdoc = new jsPDF('l', 'px', [dWidth * 0.6, dHeight * 0.65]);

            function toDataUrl(url, callback, outputFormat){
                var img = new Image();
                //img.crossOrigin = 'Anonymous';
                img.onload = function(){
                    var canvas = document.createElement('canvas');
                    var ctx = canvas.getContext('2d');
                    var dataURL;
                    canvas.height = this.height;
                    canvas.width = this.width;
                    ctx.drawImage(this, 0, 0);

                    dataURL = canvas.toDataURL(outputFormat);
                    callback(dataURL);
                    canvas = null;
                };
                img.src = url;
            }

            //TODO: save workspace if user is not signed in and get workspace id
            var s_url ="http://epiviz.cbcb.umd.edu/4/?ws=" + self._workspaceId;

            /*      toDataUrl(window.location.href + '/img/epiviz_4_logo_medium.png', function(imgData) {
             jsdoc.addImage(imgData, 'PNG', 20, 20, 100, 21);
             });*/
            jsdoc.addImage("data:image/png;base64,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", 'PNG', 20, 20, 100, 21);
            //jsdoc.setFontSize(10);
            //jsdoc.text(150, 25, "Chromosome: Location");
            //jsdoc.setFontSize(14);
            //jsdoc.text(150, 40, $('#chromosome-selector').val() + ' : ' + $('#text-location').val());
            jsdoc.setTextColor(0, 0, 0);
            jsdoc.setFontSize(10);

            //if(self._workspaceId != null ) {
            //  jsdoc.text(350, 25, "Workspace ID");
            //  jsdoc.setTextColor(0, 0, 255);
            //  jsdoc.setFontSize(16);
            //  jsdoc.text(350, 45, s_url);
            //}

            //jsdoc.setFontSize(14);
            //jsdoc.text(350, 40, $('#save-workspace-text').val());
            jsdoc.addImage(image, 'PNG', 15, 55);
            jsdoc.save(filename);

        }
        else {

            if (navigator.msSaveBlob) {
                // IE 10+
                var image_blob = canvas.msToBlob();
                var blob = new Blob([image_blob], {type: "image/png"});
                navigator.msSaveBlob(blob, filename);
            }
            else {
                var blob = new Blob([image], {type: "image/png"});
                var link = document.createElement("a");

                if (link.download !== undefined) {
                    // check if browser supports HTML5 download attribute
                    var url = URL.createObjectURL(blob);
                    link.setAttribute("href", image);
                    link.setAttribute("download", filename);
                    link.style = "visibility:hidden";
                    link.setAttribute("target", "_blank");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
                else {
                    var image_octet = image.replace("image/png", "image/octet-stream");
                    window.open(image_octet);
                }
            }

            //$(container).css("overflow", "auto");

            // remove all changes made to the DOM
            container.find('.tempCanvas').remove();
            svgElems.each(function () {
                $(this).show();
            });
        }
    });
};
