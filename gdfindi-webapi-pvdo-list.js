var tableify = require('tableify');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
module.exports = function (RED) {
    function gdfindiWebapiPvdoListNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        //properties field

        // add codeBeforeReceivePayload
        node.on('input', function (msg) {
            // add codeWhenReceivePayload
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "https://precom.gdfindi.pro/api/v1/PVDO", false);
            xhr.setRequestHeader('Authorization', msg.payload.authorization);
            xhr.send();
            var response = JSON.parse(xhr.responseText);
            var html = tableify(response);
            msg.payload = html;
            node.send(msg);
        });
    }
    RED.nodes.registerType("gdfindi-webapi-pvdo-list", gdfindiWebapiPvdoListNode);
}
