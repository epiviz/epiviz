/**
 * Created by Jayaram Kancherla ( jkanche [at] umd [dot] edu )
 * Date: 4/6/2016
 */

goog.provide('epiviz.ui.PrintManager');

epiviz.ui.PrintManager = function(ctrId, fName, fType) {

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
};

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
        var lines = $(dom).find('.line-series-index-0 path');
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
        })
    }

    // html2canvas has issues with svg elements on ff and IE.
    // Convert svg elements into canvas objects, temporarily hide the svg elements for html2canvas to work and
    // finally remove all dom changes!
    // TODO: this feature does not work all the time in FF!

    var svgElems = container.find('svg');

    svgElems.each(function () {
        var canvas, xml;

        canvas = document.createElement("canvas");
        canvas.className = "tempCanvas";

        custom_styles(this);

        // Convert SVG into a XML string
        xml = new XMLSerializer().serializeToString(this);

        // Removing the name space as IE throws an error
        //xml = xml.replace(/xmlns=\"http:\/\/www\.w3\.org\/2000\/svg\"/, '');

        //draw the canvas object created from canvg
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
        useCORS: true
    }).then(function (canvas) {

        var ctx = canvas.getContext("2d");
        ctx.mozImageSmoothingEnabled = false;
        ctx.imageSmoothingEnabled = false;

        var filename = self._fName + "." + self._fType;
        var format = self._fType;
        var image = canvas.toDataURL("image/png");

        if(format == "pdf") {

            var dWidth = container.width() > 1200 ? container.width() : 1200;
            var dHeight = container.height() > 780 ? container.height() : 780;

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
            var ws_id = "abcdef";
            var s_url ="http://epiviz.org/?ws=" + ws_id;

            /*      toDataUrl(window.location.href + '/img/epiviz_4_logo_medium.png', function(imgData) {
             jsdoc.addImage(imgData, 'PNG', 20, 20, 100, 21);
             });*/

            jsdoc.addImage("data:image/png;base64,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", 'PNG', 20, 20, 100, 21);
            jsdoc.setFontSize(10);
            jsdoc.text(150, 25, "Chromosome: Location");
            jsdoc.setFontSize(14);
            jsdoc.text(150, 40, $('#chromosome-selector').val() + ' : ' + $('#text-location').val());
            jsdoc.setTextColor(0, 0, 255);
            jsdoc.setFontSize(16);
            //jsdoc.text(550, 40, s_url);
            jsdoc.setTextColor(0, 0, 0);
            jsdoc.setFontSize(10);
            jsdoc.text(350, 25, "Workspace ID");
            jsdoc.setFontSize(14);
            jsdoc.text(350, 40, $('#save-workspace-text').val());
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
        }

        // remove all changes made to the DOM
        container.find('.tempCanvas').remove();
        svgElems.each(function () {
            $(this).show();
        });
    });
};