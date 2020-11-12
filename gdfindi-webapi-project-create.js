module.exports = function (RED) {
    var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
    var tableify = require('tableify');
    var httpOut = require('./lib/httpOut.js');

    function gdfindiWebapiProjectCreateNode(config) {

        RED.nodes.createNode(this, config);

        var node = this;


        //properties field

        this.name = config.name;

        this.desc = config.desc;

        this.extended = config.extended;

        this.productionProcesses = config.productionProcesses;

        this.layouts = config.layouts;

        this.stationActivities = config.stationActivities;

        this.transportActivities = config.transportActivities;

        this.masters = config.masters;

        this.assets = config.assets;

        this.renderingCondition = config.renderingCondition;

        this.latitude = config.latitude;

        this.longitude = config.longitude;


        // add codeBeforeReceivePayload


        node.on('input', function (msg, done) {
            // add codeWhenReceivePayload
            // content to be sent to the server
            var content = {
                "name": this.name,
                "desc": this.desc,
                "extended": this.extended,
                "productionProcesses": this.productionProcesses,
                "layouts": this.layouts,
                "stationActivities": this.stationActivities,
                "transportationActivities": this.transportActivities,
                "masters": this.masters,
                "assets": this.assets,
                "renderingCondition": this.renderingCondition,
                "latitude": this.latitude,
                "longitude": this.longitude
            };

            var xhr = new XMLHttpRequest();
            xhr.open("POST", "https://precom.gdfindi.pro/api/v1/projects/", false);
            xhr.setRequestHeader('Authorization', msg.payload.authorization);
            xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            xhr.send(JSON.stringify(content));
            var response = JSON.parse(xhr.responseText);
            var html = tableify(response);
            msg.payload = html;

            /* -------- http out -------- */
            httpOut(RED, node, msg, done);
        });

    }

    RED.nodes.registerType("Project: Create", gdfindiWebapiProjectCreateNode);

}