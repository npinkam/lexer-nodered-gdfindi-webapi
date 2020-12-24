module.exports = function (RED) {
  "use strict";
  const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
  const httpIn = require('./lib/httpIn.js');
  const httpOut = require('./lib/httpOut.js');
  const wrapper = require('./lib/wrapper.js');
  const utility = require('./lib/utility.js');

  function gdfindiWebapiProjectListNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    //properties field
    this.enableCreate = config.enableCreate;
    this.htmlTemplate = config.htmlTemplate;
    var enableCreate = this.enableCreate;
    var htmlTemplate = this.htmlTemplate;

    this.urlProjectList = "/projectlist";
    this.methodProjectList = "get";
    this.url = "/req";
    this.method = "get";
    this.urlCreate = "/create";
    this.methodCreate = "get";
    this.urlSubmitCreate = "/submitcreate";
    this.methodSubmitCreate = "post";

    //callback function when url is accessed
    this.callbackProjectList = function (req, res, done) {
      /** mandatory **/
      var msgid = RED.util.generateId();
      res._msgid = msgid;
      /** mandatory **/

      var msg = { _msgid: msgid, req: req, res: wrapper.createResponseWrapper(node, res), payload: {} };


      // add codeWhenReceivePayload
      var xhr = new XMLHttpRequest();
      xhr.open("GET", "https://precom.gdfindi.pro/api/v1/projects/", false);
      xhr.setRequestHeader('Authorization', req.cookies.authorization);
      xhr.send();
      var response = JSON.parse(xhr.responseText);

      var title = 'GD.findi Project List'
      var library = `
      <link rel="stylesheet" href="https://unpkg.com/bootstrap-table@1.18.0/dist/bootstrap-table.min.css">
      <script src="https://unpkg.com/bootstrap-table@1.18.0/dist/bootstrap-table.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js"></script>
      `;
      var style = ``;
      var enableCreateText = '';
      if (enableCreate == true) {
        enableCreateText = `<a href="/create">Create New Project</a>`;
      }
      var header = `<a href="/projectlist">Project List</a>${enableCreateText}`;

      response.forEach(element => {
        var buffer = element.id;
        var link = `/req?projectId=${buffer}`;
        element.id = "<a href=" + link + " target='_self'>" + buffer + "</a>";
        buffer = element.name;
        element.name = "<a href=" + link + " target='_self'>" + buffer + "</a>";

      });

      var body = `
      <div class="container">
        <table id="table">
          <thead>
            <tr>
              <th data-field="id" class="text-center">Project ID</th>
              <th data-field="name" class="text-center">Project Name</th>
              <th data-field="owner" class="text-center">Owner</th>
            </tr>
          </thead>
        </table>
      </div>
      `;
      var script = `
      var $table = $('#table');
      var mydata = ${JSON.stringify(response)};
      $(function(){
        $("#table").bootstrapTable({
          data: mydata
        });
      });
      `;

      msg.payload = '';
      if(htmlTemplate === 'VFK'){
        style = style + `#vfk-body {
          height: 55vh;
        }`;
        msg.payload = utility.htmlVFKTemplate(title, library, style, header, body, script, 1);
      }else{
        msg.payload = utility.htmlTemplate(title, library, style, header, body, script);
      }
      

      /* -------- http out -------- */
      httpOut(RED, node, msg, done);

    }

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

      var title = 'GD.findi Create Project';
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
      <form id="edit" action=/submitcreate method="post">
      <div class="title">Create New Project</div>
      <textarea name="editor">${JSON.stringify(content)}</textarea>
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

    this.callbackSubmitCreate = function (req, res, done) {
      /** mandatory **/
      var msgid = RED.util.generateId();
      res._msgid = msgid;
      /** mandatory **/

      //POST: structure of req.body: {projectId='', editor='info inside the ace editor textarea'}
      var content = req.body.editor;

      var xhr = new XMLHttpRequest();
      xhr.open("POST", utility.gdFindiUrl()+"/api/v1/projects/", false);
      xhr.setRequestHeader('Authorization', req.cookies.authorization);
      xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      var msg = { _msgid: msgid, req: req, res: wrapper.createResponseWrapper(node, res), payload: {} };
      xhr.send(content);

      //response
      var response = JSON.parse(xhr.responseText);
      var arrayResponse = [];
      arrayResponse.push(response);
      response = JSON.stringify(arrayResponse);

      var title = `GD.findi Create Project`
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
    }

    httpIn(RED, node, this.urlProjectList, this.methodProjectList, this.callbackProjectList);
    httpIn(RED, node, this.url, this.method, this.callback);
    httpIn(RED, node, this.urlCreate, this.methodCreate, this.callbackCreate);
    httpIn(RED, node, this.urlSubmitCreate, this.methodSubmitCreate, this.callbackSubmitCreate);

    node.on('input', function (msg, done) {
      // redirect to /projectlist
      var html = `<script type="text/javascript">window.location.replace("/projectlist");</script>`

      msg.payload = '';
      msg.payload = html;

      /* -------- http out -------- */
      httpOut(RED, node, msg, done);
    });
  }
  RED.nodes.registerType("Project: List", gdfindiWebapiProjectListNode);
}
