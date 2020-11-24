module.exports = function (RED) {
    const tableify = require('tableify');
    const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
    const httpOut = require('./lib/httpOut.js');
    const httpIn = require('./lib/httpIn.js');
    const wrapper = require('./lib/wrapper.js');
    const utility = require('./lib/utility.js');

    function gdfindiWebapiPvdoListNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.urlPVDOList = "/pvdolist";
        this.methodPVDOList = "get";
        this.url = "/PVDOreq";
        this.method = "get";
        this.urlAbort = "/PVDOabort"
        this.methodAbort = "get";

        this.callbackPVDOList = function (req, res, done) {
            /** mandatory **/
            var msgid = RED.util.generateId();
            res._msgid = msgid;
            /** mandatory **/

            var msg = { _msgid: msgid, req: req, res: wrapper.createResponseWrapper(node, res), payload: {} };

            var xhr = new XMLHttpRequest();
            xhr.open("GET", "https://precom.gdfindi.pro/api/v1/PVDO", false);
            xhr.setRequestHeader('Authorization', msg.req.cookies.authorization);
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

                if (element.Status != 'Complete' && element.Status != 'Cancel') {
                    var bufferStatus = element.Status;
                    link = `/PVDOabort?MiningID=${buffer}`;
                    element.Status = `<p>${bufferStatus} (</p><a href=${link} target='_self'>ABORT</a><p>)</p>`;
                }
            });

            var title = 'GD.findi PVDO List'
            var library = `
            <link rel="stylesheet" href="https://unpkg.com/bootstrap-table@1.18.0/dist/bootstrap-table.min.css">
            <script src="https://unpkg.com/bootstrap-table@1.18.0/dist/bootstrap-table.min.js"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js"></script>
            `;
            var style = '';
            var header = '<a href="/pvdolist">PVDO List</a>';

            var body = `
            <div class="container">
              <table id="table">
                <thead>
                  <tr>
                    <th data-field="MiningID">Mining ID</th>
                    <th data-field="User">User</th>
                    <th data-field="Total">Total</th>
                    <th data-field="Finished">Finished</th>
                    <th data-field="Status">Status</th>
                    <th data-field="Start">Start</th>
                    <th data-field="Finish">Finish</th>
                  </tr>
                </thead>
              </table>
            </div>
            `;
            var script = `
            var $table = $('#table');
            var mydata = ${JSON.stringify(response.mining_statuses)};
            $(function(){
              $("#table").bootstrapTable({
                data: mydata
              });
            });
            `;

            msg.payload = '';
            msg.payload = utility.htmlTemplate(title, library, style, header, body, script);

            /* -------- http out -------- */
            httpOut(RED, node, msg, done);
        }

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
            msg.payload.pvdo = true;
            node.send(msg);

        }

        //callback function when url is accessed
        this.callbackAbort = function (req, res, done) {
            /** mandatory **/
            var msgid = RED.util.generateId();
            res._msgid = msgid;
            /** mandatory **/

            //GET
            var MiningID = req.query.MiningID;

            var xhr = new XMLHttpRequest();
            xhr.open("PUT", `https://precom.gdfindi.pro/api/v1/PVDO/${MiningID}/Cancel`, true);
            xhr.setRequestHeader('Authorization', req.cookies.authorization);
            xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            var msg = { _msgid: msgid, req: req, res: wrapper.createResponseWrapper(node, res), payload: {} };
            xhr.onreadystatechange = function (res) {
                if (this.readyState == 4 && this.status == 200) {
                    var response = JSON.parse(this.responseText);
                    var header = `<a href="javascript:history.back()">Go Back</a>&nbsp;<a href="/lexerproject">Top</a><br/><br/>`;
                    msg.payload = header + tableify(response);
                    // -------- http out -------- 
                    httpOut(RED, node, msg, done);
                }
                //console.log('state: '+this.readyState+'\n status: '+this.status+'\n'+this.responseText+'\n -----------------------')
            };
            xhr.send();

        }

        httpIn(RED, node, this.urlPVDOList, this.methodPVDOList, this.callbackPVDOList);
        httpIn(RED, node, this.url, this.method, this.callback);
        httpIn(RED, node, this.urlAbort, this.methodAbort, this.callbackAbort);

        // add codeBeforeReceivePayload
        node.on('input', function (msg, done) {
            // add codeWhenReceivePayload
            // redirect to /projectlist
            var html = `<script type="text/javascript">window.location.replace("/pvdolist");</script>`

            msg.payload = '';
            msg.payload = html;

            /* -------- http out -------- */
            httpOut(RED, node, msg, done);
        });
    }
    RED.nodes.registerType("PVDO: List", gdfindiWebapiPvdoListNode);
}
