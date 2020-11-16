module.exports = function (RED) {
    const tableify = require('tableify');
    const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
    const httpOut = require('./lib/httpOut.js');
    const httpIn = require('./lib/httpIn.js');
    const wrapper = require('./lib/wrapper.js');
    

    function gdfindiWebapiPvdoListNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.url = "/PVDOreq";
        this.method = "get";

        //callback function when url is accessed
        this.callback = function (req, res, done) {
            /** mandatory **/
            var msgid = RED.util.generateId();
            res._msgid = msgid;
            /** mandatory **/

            //node.send structure:
            //get -> payload: req.query
            //other -> payload: req.body
            //node.send({ _msgid: msgid, req: req, res: wrapper.createResponseWrapper(node, res), payload: payload })
            var msg = { _msgid: msgid, req: req, res: wrapper.createResponseWrapper(node, res), payload: req.query };
            node.send(msg);

        }

        httpIn(RED, node, this.url, this.method, this.callback);

        // add codeBeforeReceivePayload
        node.on('input', function (msg, done) {
            // add codeWhenReceivePayload
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "https://precom.gdfindi.pro/api/v1/PVDO", false);
            xhr.setRequestHeader('Authorization', msg.cookies.authorization);
            xhr.send();
            var response = JSON.parse(xhr.responseText);

            //current mining
            var buffer = response.miningmanager_status.CurrentMiningID;
            var link = `/PVDOreq?MiningID=${buffer}`;
            response.miningmanager_status.CurrentMiningID = "<a href=" + link + " target='_self'>" + buffer + "</a>"; 
            
            response.mining_statuses.forEach(element => {
                var buffer = element.MiningID;
                var link = `/PVDOreq?MiningID=${buffer}`;
                element.MiningID = "<a href=" + link + " target='_self'>" + buffer + "</a>";
            });

            var html = tableify(response);
            msg.payload = html;

           // -------- http out -------- 
            httpOut(RED, node, msg, done);
        });
    }
    RED.nodes.registerType("PVDO: List", gdfindiWebapiPvdoListNode);
}
