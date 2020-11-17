module.exports = function (RED) {
    var tableify = require('tableify');
    var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
    var httpOut = require('./lib/httpOut.js');
    const httpIn = require('./lib/httpIn.js');
    const wrapper = require('./lib/wrapper.js');

    function gdfindiWebapiPVDOResultNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        // add codeBeforeReceivePayload
        node.on('input', function (msg, done) {
            // call httpInput library

            var MiningID = msg.payload.MiningID;
            var xhr = new XMLHttpRequest();
            xhr.open("GET", `https://precom.gdfindi.pro/api/v1/PVDO/${MiningID}/Results`, false);
            xhr.setRequestHeader('Authorization', msg.req.cookies.authorization);
            xhr.send();
            var response = JSON.parse(xhr.responseText);
            var html = tableify(response);
            msg.payload = html;
            httpOut(RED, node, msg, done);
        });
    }
    RED.nodes.registerType("PVDO: Result", gdfindiWebapiPVDOResultNode);
}
