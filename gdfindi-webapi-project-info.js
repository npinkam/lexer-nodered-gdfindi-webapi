module.exports = function (RED) {
    var tableify = require('tableify');
    var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
    var httpOut = require('./lib/httpOut.js');
    const httpIn = require('./lib/httpIn.js');
    const wrapper = require('./lib/wrapper.js');

    function gdfindiWebapiProjectInfoNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        //properties field

        this.url = "/req";
        this.method = "get";

        //callback function when url is accessed
        this.callback = function (req, res, done) {
            /** mandatory **/
            var msgid = RED.util.generateId();
            res._msgid = msgid;
            /** mandatory **/

            var projectId = req.query.projectId;
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "https://precom.gdfindi.pro/api/v1/projects/" + projectId, false);
            xhr.setRequestHeader('Authorization', req.cookies.authorization);
            xhr.send();
            var response = JSON.parse(xhr.responseText);
            var html = tableify(response);

            //node.send structure:
            //get -> payload: req.query
            //other -> payload: req.body
            //node.send({ _msgid: msgid, req: req, res: wrapper.createResponseWrapper(node, res), payload: payload })
            var msg = { _msgid: msgid, req: req, res: wrapper.createResponseWrapper(node, res), payload: "" };
            //node.emit('input', msg);
            msg.payload = html;

            // -------- http out -------- 
            httpOut(RED, node, msg, done);

            // -------- send raw data
            msg.payload = {};
            msg.payload = response;
            node.send(msg);

        }

        // add codeBeforeReceivePayload
        node.on('input', function (msg) {
            //close connection
            var node = this;
            RED.httpNode._router.stack.forEach(function (route, i, routes) {
                if (route.route && route.route.path === node.url && route.route.methods[node.method]) {
                    routes.splice(i, 1);
                }
            });
            // call httpInput library
            new httpIn(RED, node, this.url, this.method, this.callback);
        });
    }
    RED.nodes.registerType("Project: Information", gdfindiWebapiProjectInfoNode);
}
