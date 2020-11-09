var tableify = require('tableify');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
module.exports = function (RED) {
    function gdfindiWebapiProjectInfoNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        //properties field
        this.projectid = config.projectid;

        // add codeBeforeReceivePayload
        node.on('input', function (msg) {
            // add codeWhenReceivePayload
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "https://precom.gdfindi.pro/api/v1/projects/" + this.projectid, false);
            xhr.setRequestHeader('Authorization', msg.payload.authorization);
            xhr.send();
            var response = JSON.parse(xhr.responseText);
            var html = tableify(response);
            msg.payload = html;
            node.send(msg);
        });
    }
    RED.nodes.registerType("Project: Information", gdfindiWebapiProjectInfoNode);
}
