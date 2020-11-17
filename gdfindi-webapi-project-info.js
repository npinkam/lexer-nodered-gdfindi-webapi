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
        this.enableEdit = config.enableEdit;
        this.enableDelete = config.enableDelete;

        var enableEdit = this.enableEdit;
        var enableDelete = this.enableDelete;

        this.urlEdit = "/edit";
        this.methodEdit = "get";
        this.urlSubmitEdit = "/submitedit";
        this.methodSubmitEdit = "post";
        this.urlDel = "/del";
        this.methodDel = "get";

        this.callbackEdit = function (req, res, done) {
            /** mandatory **/
            var msgid = RED.util.generateId();
            res._msgid = msgid;
            /** mandatory **/

            //load current project to editor
            var projectId = req.query.projectId;
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "https://precom.gdfindi.pro/api/v1/projects/" + projectId, false);
            xhr.setRequestHeader('Authorization', req.cookies.authorization);
            xhr.send();
            var response = xhr.responseText;//JSON.parse(xhr.responseText);
            //send response to ace editor

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
          <form id="edit" action=/submitedit method="post">
            <div class="title">Project#${projectId} Information</div>
            <input type="hidden" id="projectId" name="projectId" value=${projectId}>
            <textarea name="editor">${response}</textarea>
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

        this.callbackSubmitEdit = function (req, res, done) {
            /** mandatory **/
            var msgid = RED.util.generateId();
            res._msgid = msgid;
            /** mandatory **/

            //POST: structure of req.body: {projectId='', editor='info inside the ace editor textarea'}
            var projectId = req.body.projectId;
            var content = req.body.editor;

            var xhr = new XMLHttpRequest();
            xhr.open("PUT", "https://precom.gdfindi.pro/api/v1/projects/" + projectId, true);
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
                } else if (this.readyState == 4 && this.status == 304) {
                    var response = `<a href="javascript:history.back()">Go Back</a>&nbsp;<a href="/lexerproject">Top</a><br/><br/>
                <p>Identical information on Project#${projectId}. Nothing changes.</p>`;
                    msg.payload = response;
                    // -------- http out -------- 
                    httpOut(RED, node, msg, done);
                }
            };
            xhr.send(content);
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
                    var html = `<a href="javascript:history.back()">Go Back</a>&nbsp;<a href="/lexerproject">Top</a><br/><br/><p>Delete #${projectId} successfully.</p>`
                    msg.payload = html;

                    /* -------- http out -------- */
                    httpOut(RED, node, msg, done);
                }
            };
            xhr.send();

        }

        httpIn(RED, node, this.urlEdit, this.methodEdit, this.callbackEdit);
        httpIn(RED, node, this.urlSubmitEdit, this.methodSubmitEdit, this.callbackSubmitEdit);
        httpIn(RED, node, this.urlDel, this.methodDel, this.callbackDel);
        // add codeBeforeReceivePayload
        node.on('input', function (msg, done) {
            var projectId = msg.payload;
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "https://precom.gdfindi.pro/api/v1/projects/" + projectId, false);
            xhr.setRequestHeader('Authorization', msg.req.cookies.authorization);
            xhr.send();
            var response = JSON.parse(xhr.responseText);
            var html = tableify(response);

            var enableEditText = '';
            var enableDeleteText = '';
            if (enableEdit == true) {
                enableEditText = `<a href="/edit?projectId=${projectId}">Edit Project</a><br/>`;
            }
            if (enableDelete == true) {
                enableDeleteText = `
                <a id="deleteProject" href="/del?projectId=${projectId}">Delete Project</a>
                <script type="text/javascript">
                    $('#deleteProject').on('click', function () {
                        return confirm('Do you want to delete Project#${projectId}?');
                    });
                </script>
`;
            }

            var header = `<script type="text/javascript" src="https://code.jquery.com/jquery-3.5.1.min.js"></script><a href="javascript:history.back()">Go Back</a>&nbsp;<a href="/lexerproject">Top</a><br/><br/>${enableEditText}${enableDeleteText}`;

            msg.payload = header + html;

            // -------- http out -------- 
            httpOut(RED, node, msg, done);

            // -------- send raw data
            msg.payload = {};
            msg.payload = response;
            node.send(msg);
        });
    }
    RED.nodes.registerType("Project: Information", gdfindiWebapiProjectInfoNode);
}
