module.exports = function (RED) {
    var tableify = require('tableify');
    var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
    var httpOut = require('./lib/httpOut.js');

    function gdfindiWebapiProjectDeleteNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        //properties field
        this.projectid = config.projectid;

        // add codeBeforeReceivePayload
        node.on('input', function (msg, done) {
            // add codeWhenReceivePayload
            var xhr = new XMLHttpRequest();
            xhr.open("DELETE", "https://precom.gdfindi.pro/api/v1/projects/" + this.projectid, true);
            xhr.setRequestHeader('Authorization', msg.cookies.authorization);
            xhr.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 204) {
                    var html = `<p>Delete successfully.</p>`
                    msg.payload = html;

                    /* -------- http out -------- */
                    httpOut(RED, node, msg, done);
                }
            };
            xhr.send();
        });
    }
    RED.nodes.registerType("Project: Delete", gdfindiWebapiProjectDeleteNode);
}
