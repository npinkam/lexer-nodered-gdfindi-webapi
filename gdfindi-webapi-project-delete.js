var tableify = require('tableify');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
module.exports = function (RED) {
    function gdfindiWebapiProjectDeleteNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        //properties field
        this.projectid = config.projectid;

        // add codeBeforeReceivePayload
        node.on('input', function (msg) {
            // add codeWhenReceivePayload
            var xhr = new XMLHttpRequest();
            xhr.open("DELETE", "https://precom.gdfindi.pro/api/v1/projects/" + this.projectid, true);
            xhr.setRequestHeader('Authorization', msg.payload.authorization);
            xhr.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 204) {
                    var html = `<p>Delete successfully.</p>`
                    msg.payload = html;
                    node.send(msg);
                }
            };
            xhr.send();
        });
    }
    RED.nodes.registerType("gdfindi-webapi-project-delete", gdfindiWebapiProjectDeleteNode);
}
