module.exports = function (RED) {
    "use strict";
    const tableify = require('tableify');
    const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
    const httpIn = require('./lib/httpIn.js');
    const httpOut = require('./lib/httpOut.js');
    const wrapper = require('./lib/wrapper.js');

    function gdfindiWebapiProjectListNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        //properties field
        this.enableCreate = config.enableCreate;

        this.url = "/req";
        this.method = "get";

        this.msgContent = {};

        //callback function when url is accessed
        this.callback = function (req, res) {
            /** mandatory **/
            var msgid = RED.util.generateId();
            res._msgid = msgid;
            /** mandatory **/
            var projectId = req.query.projectId;
            var msg = { _msgid: msgid, req: req, res: wrapper.createResponseWrapper(node, res), payload: {} };

            // -------- send raw data
            msg.payload = projectId;
            node.send(msg);
        }

        httpIn(RED, node, this.url, this.method, this.callback);

        node.on('input', function (msg, done) {
            // add codeWhenReceivePayload
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "https://precom.gdfindi.pro/api/v1/projects/", false);
            xhr.setRequestHeader('Authorization', msg.req.cookies.authorization);
            xhr.send();
            var response = JSON.parse(xhr.responseText);

            response.forEach(element => {
                var buffer = element.id;
                var link = `/req?projectId=${buffer}`;
                element.id = "<a href=" + link + " target='_self'>" + buffer + "</a>";
            
            });
            
            var html = tableify(response);
            msg.payload = '';
            msg.payload = html;

            /* -------- http out -------- */
            httpOut(RED, node, msg, done);
        });
    }
    RED.nodes.registerType("Project: List", gdfindiWebapiProjectListNode);
}
