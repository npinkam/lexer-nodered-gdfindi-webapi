module.exports = function (RED) {
  const tableify = require('tableify');
  const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
  const httpOut = require('./lib/httpOut.js');
  const httpIn = require('./lib/httpIn.js');
  const wrapper = require('./lib/wrapper.js');
  const utility = require('./lib/utility.js');

  function gdfindiWebapiProjectInfoNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    //initiate store data in the node
    var nodeContext = this.context().get('nodeContext') || {};

    //properties field
    this.enableEdit = config.enableEdit;
    this.enableDelete = config.enableDelete;
    this.enableExec = config.enableExec;

    var enableEdit = this.enableEdit;
    var enableDelete = this.enableDelete;
    var enableExec = this.enableExec;

    this.urlEdit = "/edit";
    this.methodEdit = "get";
    this.urlSubmitEdit = "/submitedit";
    this.methodSubmitEdit = "post";
    this.urlDel = "/del";
    this.methodDel = "get";
    this.urlExec = "/exec";
    this.methodExec = "get";

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

      var title = 'GD.findi Edit Project';
      var library = `
      <script src="https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.6.8/beautify.js"></script>
      <link href="https://cdnjs.cloudflare.com/ajax/libs/normalize/5.0.0/normalize.min.css" rel="stylesheet"/>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.12/ace.js"></script>
      `;
      var style = `
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
      `;
      var header = `<a href="/projectlist">Project List</a>`;
      var body = `
      <form id="edit" action=/submitedit method="post">
      <div class="title">Project#${projectId} Information</div>
      <input type="hidden" id="projectId" name="projectId" value=${projectId}>
      <textarea name="editor">${response}</textarea>
      <div id="editor"></div>
      <button type="submit" class="btn btn-primary">Submit</button>
    </form>
      `;
      var script = `
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
      `;
      var msg = { _msgid: msgid, req: req, res: wrapper.createResponseWrapper(node, res), payload: {} };
      //msg.payload = response;
      msg.payload = utility.htmlTemplate(title, library, style, header, body, script);
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
          var response = JSON.parse(xhr.responseText);
          var arrayResponse = [];
          arrayResponse.push(response);
          response = JSON.stringify(arrayResponse);

          var title = `GD.findi Edit Project`
          var library = `
          <link rel="stylesheet" href="https://unpkg.com/bootstrap-table@1.18.0/dist/bootstrap-table.min.css">
          <script src="https://unpkg.com/bootstrap-table@1.18.0/dist/bootstrap-table.min.js"></script>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js"></script>
          `;
          var style = ``;
          var header = `<a href="/projectlist">Project List</a>`;
          var body = `
          <div class="container">
          <table id="table">
            <thead>
              <tr>
                <th data-field="id">Project ID</th>
                <th data-field="name">Project Name</th>
                <th data-field="owner">Owner</th>
                <th data-field="access">Access</th>
                <th data-field="updated">Update</th>
                <th data-field="version">Version</th>
              </tr>
            </thead>
          </table>
        </div>
          `;
          var script = `
          var $table = $('#table');
          var mydata = ${response};
          $(function(){
            $("#table").bootstrapTable({
              data: mydata
            });
          });
          `;

          msg.payload = utility.htmlTemplate(title, library, style, header, body, script)
          // -------- http out -------- 
          httpOut(RED, node, msg, done);
        } else if (this.readyState == 4 && this.status == 304) {

          var title = `GD.findi Edit Project`
          var library = ``;
          var style = ``;
          var header = `<a href="/projectlist">Project List</a>`;
          var body = `<p>Identical information on Project#${projectId}. Nothing changes.</p>`;
          var script = ``;

          msg.payload = utility.htmlTemplate(title, library, style, header, body, script)

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

          var title = `GD.findi Delete Project`
          var library = ``;
          var style = ``;
          var header = `<a href="/projectlist">Project List</a>`;
          var body = `<p>Delete #${projectId} successfully.</p>`;
          var script = ``;

          var msg = { _msgid: msgid, req: req, res: wrapper.createResponseWrapper(node, res), payload: "" };
          msg.payload = utility.htmlTemplate(title, library, style, header, body, script)

          /* -------- http out -------- */
          httpOut(RED, node, msg, done);
        }
      };
      xhr.send();

    }

    this.callbackExec = function (req, res, done) {
      /** mandatory **/
      var msgid = RED.util.generateId();
      res._msgid = msgid;
      /** mandatory **/

      //get project information from context
      nodeContext = node.context().get('nodeContext');
      var msg = { _msgid: msgid, req: req, res: wrapper.createResponseWrapper(node, res), payload: {} };
      msg.payload.daytime = req.query;
      msg.payload.data = nodeContext;
      node.send(msg);
    }

    httpIn(RED, node, this.urlEdit, this.methodEdit, this.callbackEdit);
    httpIn(RED, node, this.urlSubmitEdit, this.methodSubmitEdit, this.callbackSubmitEdit);
    httpIn(RED, node, this.urlDel, this.methodDel, this.callbackDel);
    httpIn(RED, node, this.urlExec, this.methodExec, this.callbackExec);

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
      var enableExecTextHeader = '';
      var enableExecTextBody = '';
      if (enableExec == true) {
        enableExecTextHeader = `<a id="execProject" href="#">Execute Project</a>`

        var execTimeList = '';
        var hasProductionProcesses = response.hasOwnProperty('productionProcesses');
        if (hasProductionProcesses == true) {
          response.productionProcesses.forEach(element => {
            execTimeList += `
            <label for="startProc">${element.name}:&nbsp;</label>
            <input type="time" id="${element.name}" name="${element.name}"><br/>`
          });
          execTimeList += `<button type="submit" class="btn btn-primary">Execute</button>`;
        } else {
          execTimeList = '<p>No Production Process!</p>';
        }



        enableExecTextBody = `<form id="execForm" action="/exec" method="GET">
          ${execTimeList}
        </form>
        <script type="text/javascript">
        $(document).ready(function(){
          $("#execForm").hide();
          $("#execProject").on('click', function(){
            $("#execForm").toggle();
          });
        });
        </script>
        `;
      }
      if (enableEdit == true) {
        enableEditText = `<a href="/edit?projectId=${projectId}">Edit Project</a>`;
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

      var title = `GD.findi Project#${projectId} Information`
      var library = `
      <link rel="stylesheet" href="https://unpkg.com/bootstrap-table@1.18.0/dist/bootstrap-table.min.css">
      <script src="https://unpkg.com/bootstrap-table@1.18.0/dist/bootstrap-table.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js"></script>
      `;
      var style = ``;
      var header = `<a href="/projectlist">Project List</a>${enableExecTextHeader}${enableEditText}${enableDeleteText}`;

      //extract important information from response json
      var table_info = response.productionProcesses;

      var body = `
      ${enableExecTextBody}
      <div class="container">
      <table id="table_desc" class="table">
          <tr>
            <th>ID</th>
            <td>${response.id}</td>
          </tr>
          <tr>
            <th>Name</th>
            <td>${response.name}</td>
          </tr>
          <tr>
            <th>Description</th>
            <td>${response.desc}</td>
          </tr>
          <tr>
            <th>Owner</th>
            <td>${response.owner}</td>
          </tr>
          <tr>
          <th>Access</th>
          <td>${response.access}</td>
        </tr>
        <tr>
        <th>Updated</th>
        <td>${response.updated}</td>
      </tr>
      <tr>
      <th>Version</th>
      <td>${response.version}</td>
    </tr>
      </table>
    </div>

    <div class="container">
    <table id="table">
    <thead>
      <tr>
        <th data-field="id">ID</th>
        <th data-field="name">Product Name</th>
      </tr>
    </thead>
  </table>
    </div>
      `;
      var script = `
      var $table = $('#table');
      var mydata = ${JSON.stringify(table_info)};
      $(function(){
        $("#table").bootstrapTable({
          data: mydata
        });
      });
      `;

      msg.payload = '';
      msg.payload = utility.htmlTemplate(title, library, style, header, body, script)

      // -------- http out -------- 
      httpOut(RED, node, msg, done);

      // store project information in the node
      nodeContext = response;
      this.context().set('nodeContext', nodeContext);
    });
  }
  RED.nodes.registerType("Project: Information", gdfindiWebapiProjectInfoNode);
}
