var tableify = require('tableify');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
module.exports = function (RED) {
    function gdfindiWebapiProjectListNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        //properties field

        // add codeBeforeReceivePayload
        node.on('input', function (msg) {
            // add codeWhenReceivePayload
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "https://precom.gdfindi.pro/api/v1/projects/");
            console.log(`Authorization: ${msg.payload.authorization}`)
            xhr.setRequestHeader("content-type: application/json", `Authorization: ${msg.payload.authorization}`);
            xhr.send();
            msg.payload = xhr.responseText;
            //msg.payload = authorization;
            node.send(msg);
        });
    }
    RED.nodes.registerType("gdfindi-webapi-project-list", gdfindiWebapiProjectListNode);
}
