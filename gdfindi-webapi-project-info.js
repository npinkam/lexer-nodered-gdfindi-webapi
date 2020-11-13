module.exports = function (RED) {
    var tableify = require('tableify');
    var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
    var httpOut = require('./lib/httpOut.js');
    const httpIn = require('./lib/httpIn.js');
    const wrapper = require('./lib/wrapper.js');

    function gdfindiWebapiProjectInfoNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var enableNode = false;

        //properties field

        this.url = "/req";
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
                xhr.open("GET", "https://precom.gdfindi.pro/api/v1/projects/" + projectId, false);
                xhr.setRequestHeader('Authorization', req.cookies.authorization);
                xhr.send();
                var response = JSON.parse(xhr.responseText);
                var header = `
                <script type="text/javascript" src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
                <a href="javascript:history.back()">Go Back</a>&nbsp;<a href="/">Top</a><br/><br/>
                <a id="deleteProject" href="/del?projectId=${projectId}">Delete Project</a>
                <script type="text/javascript">
                    $('#deleteProject').on('click', function () {
                        return confirm('Do you want to delete Project#${projectId}?');
                    });
                </script>`;
                var html = header + tableify(response);

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
        }

        // call httpInput library
        new httpIn(RED, node, this.url, this.method, this.callback);

        // add codeBeforeReceivePayload
        node.on('input', function (msg) {
            enableNode = true;
        });
    }
    RED.nodes.registerType("Project: Information", gdfindiWebapiProjectInfoNode);
}
