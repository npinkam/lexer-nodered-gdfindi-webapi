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
        var enableCreate = this.enableCreate;

        this.url = "/req";
        this.method = "get";
        this.urlCreate = "/create";
        this.methodCreate = "get";
        this.urlSubmitCreate = "/submitcreate";
        this.methodSubmitCreate = "post";

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

        this.callbackCreate = function (req, res, done) {
            /** mandatory **/
            var msgid = RED.util.generateId();
            res._msgid = msgid;
            /** mandatory **/

            var content = {
                "name": '',
                "desc": '',
                "extended": '',
                "productionProcesses": '',
                "layouts": '',
                "stationActivities": '',
                "transportationActivities": '',
                "masters": '',
                "assets": '',
                "renderingCondition": '',
                "latitude": '',
                "longitude": ''
            };

            var html = `
            <!DOCTYPE html>
            <html lang="en">
            
            <head>
            <!-- Latest compiled and minified CSS -->
            <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous">
            
            <!-- Optional theme -->
            <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap-theme.min.css" integrity="sha384-rHyoN1iRsVXV4nD0JutlnGaslCJuC7uwjduW9SVrLvRYooPp2bWYgmgJQIXwl/Sp" crossorigin="anonymous">
            
            <!-- Latest compiled and minified JavaScript -->
            <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js" integrity="sha384-Tc5IQib027qvyjSMfHjOMaLkfuWVxZxUPnCJA7l2mCWNIpG9mGCD8wGNIcPD7Txa" crossorigin="anonymous"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.js"></script>
                <style type="text/css" media="screen">
                .title {
                    font-size: 1.67em;
                    font-weight: bold;
                    text-align: center;
                  }
                  #editor {
                    height: 75vh;
                    width: 100%;
                  }
                  textarea[name="editor"] {
                    display: none;
                  }
                  
                  .as-console-wrapper {
                    display: none !important;
                  }
            </style>
            </head>
            
            <body>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.6.8/beautify.js"></script>
            <link href="https://cdnjs.cloudflare.com/ajax/libs/normalize/5.0.0/normalize.min.css" rel="stylesheet"/>
            <a href="javascript:history.back()">Go Back</a>&nbsp;<a href="/">Top</a><br/><br/>
                <form id="edit" action=/submitcreate method="post">
                  <div class="title">Create New Project</div>
                  <textarea name="editor">${JSON.stringify(content)}</textarea>
                  <div id="editor"></div>
                  <button type="submit" class="btn btn-primary">Submit</button>
                </form>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.12/ace.js"></script>
                <script>
                var editor = ace.edit('editor');
                var txtAra = document.querySelector('textarea[name="editor"]');
                var jsbOpts = {
                  indent_size : 2
                };
                
                // Setup
                editor.setTheme("ace/theme/monokai");
                editor.getSession().setMode("ace/mode/json");
                syncEditor();
                
                // Main Logic
                formatCode();
            
                //when hit submit form
                $('#edit').submit(function(event){
                  commitChanges();
                });
                
                // Functions
                function syncEditor() {
                  editor.getSession().setValue(txtAra.value);
                }
                function commitChanges() {
                  txtAra.value = editor.getSession().getValue();
                }
                function formatCode() {
                  var session = editor.getSession();
                  session.setValue(js_beautify(session.getValue(), jsbOpts));
                }
                </script>
            </body>
            
            </html>
            `;

            var msg = { _msgid: msgid, req: req, res: wrapper.createResponseWrapper(node, res), payload: {} };
            //msg.payload = response;
            msg.payload = html;
            httpOut(RED, node, msg, done);
        }

        this.callbackSubmitCreate = function (req, res, done) {
            /** mandatory **/
            var msgid = RED.util.generateId();
            res._msgid = msgid;
            /** mandatory **/
      
            //POST: structure of req.body: {projectId='', editor='info inside the ace editor textarea'}
            var content = req.body.editor;
            
            var xhr = new XMLHttpRequest();
            xhr.open("POST", "https://precom.gdfindi.pro/api/v1/projects/", false);
            xhr.setRequestHeader('Authorization', req.cookies.authorization);
            xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            var msg = { _msgid: msgid, req: req, res: wrapper.createResponseWrapper(node, res), payload: {} };
            xhr.send(content);

            //response
            var response = JSON.parse(xhr.responseText);
            var header = `<a href="javascript:history.back()">Go Back</a>&nbsp;<a href="/lexerproject">Top</a><br/><br/>`;
            msg.payload = header + tableify(response);
            // -------- http out -------- 
            httpOut(RED, node, msg, done);
          }

        httpIn(RED, node, this.url, this.method, this.callback);
        httpIn(RED, node, this.urlCreate, this.methodCreate, this.callbackCreate);
        httpIn(RED, node, this.urlSubmitCreate, this.methodSubmitCreate, this.callbackSubmitCreate);

        node.on('input', function (msg, done) {
            // add codeWhenReceivePayload
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "https://precom.gdfindi.pro/api/v1/projects/", false);
            xhr.setRequestHeader('Authorization', msg.req.cookies.authorization);
            xhr.send();
            var response = JSON.parse(xhr.responseText);

            var enableCreateText = '';
            if (enableCreate == true) {
                enableCreateText = `<a href="/create">Create New Project</a>`;
            }

            var header = `<a href="javascript:history.back()">Go Back</a>&nbsp;<a href="/lexerproject">Top</a><br/><br/>${enableCreateText}`;

            response.forEach(element => {
                var buffer = element.id;
                var link = `/req?projectId=${buffer}`;
                element.id = "<a href=" + link + " target='_self'>" + buffer + "</a>";

            });

            var html = header + tableify(response);
            msg.payload = '';
            msg.payload = html;

            /* -------- http out -------- */
            httpOut(RED, node, msg, done);
        });
    }
    RED.nodes.registerType("Project: List", gdfindiWebapiProjectListNode);
}
