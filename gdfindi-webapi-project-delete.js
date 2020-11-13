module.exports = function (RED) {
    var tableify = require('tableify');
    var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
    const httpIn = require('./lib/httpIn.js');
    const httpOut = require('./lib/httpOut.js');
    const wrapper = require('./lib/wrapper.js');

    function gdfindiWebapiProjectDeleteNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var enableNode = false;

        //properties field
        //this.projectid = config.projectid;

        //properties field

        this.url = "/del";
        this.method = "get";

        //callback function when url is accessed
        this.callback = function (req, res, done) {
            if (enableNode == true) {
                /** mandatory **/
                var msgid = RED.util.generateId();
                res._msgid = msgid;
                /** mandatory **/
                
                var projectId = req.query.projectId;
                var xhr = new XMLHttpRequest();
                xhr.open("DELETE", "https://precom.gdfindi.pro/api/v1/projects/" + projectId, true);
                xhr.setRequestHeader('Authorization', req.cookies.authorization);
                xhr.onreadystatechange = function () {
                    if (this.readyState == 4 && this.status == 204) {
                        var msg = { _msgid: msgid, req: req, res: wrapper.createResponseWrapper(node, res), payload: "" };
                        var html = `<a href="/lexerproject">Back to Project List</a><br/><br/><p>Delete #${projectId} successfully.</p>`
                        msg.payload = html;
    
                        /* -------- http out -------- */
                        httpOut(RED, node, msg, done);
                    }
                };
                xhr.send();
            }
        }

        // call httpInput library
        new httpIn(RED, node, this.url, this.method, this.callback);

        // add codeBeforeReceivePayload
        node.on('input', function (msg) {
            enableNode = true;
        });
    }
    RED.nodes.registerType("Project: Delete", gdfindiWebapiProjectDeleteNode);
}
