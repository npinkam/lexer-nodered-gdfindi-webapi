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

        this.url = "/req";
        this.method = "get";
        this.urlDel = "/del";

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
            
        }

        this.callbackDel = function (req, res, done) {
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
            new httpIn(RED, node, this.urlDel, this.method, this.callbackDel);
        });
    }
    RED.nodes.registerType("Project: Delete", gdfindiWebapiProjectDeleteNode);
}
