module.exports = function (RED) {
    var tableify = require('tableify');
    var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
    var httpOut = require('./lib/httpOut.js');

    function gdfindiWebapiProjectListNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        //properties field

        // add codeBeforeReceivePayload
        node.on('input', function (msg, _send, done) {
            // add codeWhenReceivePayload
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "https://precom.gdfindi.pro/api/v1/projects/", false);
            xhr.setRequestHeader('Authorization', msg.payload.authorization);
            xhr.send();
            var response = JSON.parse(xhr.responseText);
            /*
            response.forEach(element => {
                var buffer = element.id;
                var link = `/req?projectId=${buffer}`;
                element.id = "<a href=" + link + " target='_self'>" + buffer + "</a>";
            
            });
            */
            var html = tableify(response);
            msg.payload = html;

            /* -------- Test http out -------- */
            httpOut(RED, node, msg, done);
            /* -------- Test http out -------- */
        });
    }
    RED.nodes.registerType("Project: List", gdfindiWebapiProjectListNode);
}
