var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var tableify = require('tableify');
module.exports = function (RED) {

    function gdfindiWebapiProjectEditNode(config) {

        RED.nodes.createNode(this, config);

        var node = this;


        //properties field
        this.projectid = config.projectid;

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


        node.on('input', function (msg) {
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
            xhr.open("PUT", "https://precom.gdfindi.pro/api/v1/projects/" + this.projectid, true);
            xhr.setRequestHeader('Authorization', msg.payload.authorization);
            xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            xhr.onreadystatechange = function(res) {
                console.log(this.readyState)
                console.log(this.status)
                console.log(this.responseText)
                console.log('---------------------')
                if (this.readyState == 4 && this.status == 200) {
                    var response = JSON.parse(this.responseText);
                    msg.payload = tableify(response);
                    node.send(msg);
                }else if(this.readyState == 4 && this.status == 304){
                    var response = `<p>Identical information. Nothing changes.</p>`
                    msg.payload = response;
                    node.send(msg);
                }
            };
            xhr.send(JSON.stringify(content));
        });
    }

    RED.nodes.registerType("Project Edit", gdfindiWebapiProjectEditNode);

}