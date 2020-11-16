module.exports = function (RED) {
  var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
  var tableify = require('tableify');
  const httpIn = require('./lib/httpIn.js');
  const httpOut = require('./lib/httpOut.js');
  const wrapper = require('./lib/wrapper.js');

  function gdfindiWebapiProjectEditNode(config) {

    RED.nodes.createNode(this, config);

    var node = this;


    //properties field
    /*
    this.projectid = config.projectid;

    this.name = config.name;

    this.desc = config.desc;

    this.extended = config.extended;

    this.productionProcesses = config.productionProcesses;

    this.layouts = config.layouts;

    this.stationActivities = config.stationActivities;

    this.transportActivities = config.transportActivities;

    this.masters = config.masters;

    this.assets = config.assets;

    this.renderingCondition = config.renderingCondition;

    this.latitude = config.latitude;

    this.longitude = config.longitude;
*/
    this.url = "/req";
    this.method = "get";
    this.urlEdit = "/edit";
    this.urlSubmitEdit = "/submitedit";
    this.methodSubmitEdit = "post";

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
                <a id="deleteProject" href="/edit?projectId=${projectId}">Edit Project</a>`;
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
    editor.getSession().setMode("ace/mode/java");
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
          var header = `<a href="javascript:history.back()">Go Back</a>&nbsp;<a href="/">Top</a><br/><br/>`;
          msg.payload = header + tableify(response);
          // -------- http out -------- 
          httpOut(RED, node, msg, done);
        } else if (this.readyState == 4 && this.status == 304) {
          var response = `<a href="javascript:history.back()">Go Back</a>&nbsp;<a href="/">Top</a><br/><br/>
          <p>Identical information on Project#${projectId}. Nothing changes.</p>`;
          msg.payload = response;
          // -------- http out -------- 
          httpOut(RED, node, msg, done);
        }
      };
      xhr.send(content);
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
      new httpIn(RED, node, this.urlEdit, this.method, this.callbackEdit);
      new httpIn(RED, node, this.urlSubmitEdit, this.methodSubmitEdit, this.callbackSubmitEdit);
    });

    /** 
    node.on('input', function (msg, done) {
        // add codeWhenReceivePayload
        // content to be sent to the server
        var content = {
            "name": this.name,
            "desc": this.desc,
            "extended": this.extended,
            "productionProcesses": this.productionProcesses,
            "layouts": this.layouts,
            "stationActivities": this.stationActivities,
            "transportationActivities": this.transportActivities,
            "masters": this.masters,
            "assets": this.assets,
            "renderingCondition": this.renderingCondition,
            "latitude": this.latitude,
            "longitude": this.longitude
        };

        var xhr = new XMLHttpRequest();
        xhr.open("PUT", "https://precom.gdfindi.pro/api/v1/projects/" + this.projectid, true);
        xhr.setRequestHeader('Authorization', msg.cookies.authorization);
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhr.onreadystatechange = function (res) {
            if (this.readyState == 4 && this.status == 200) {
                var response = JSON.parse(this.responseText);
                msg.payload = tableify(response);
                // -------- http out -------- 
                httpOut(RED, node, msg, done);
            } else if (this.readyState == 4 && this.status == 304) {
                var response = `<p>Identical information. Nothing changes.</p>`
                msg.payload = response;
                // -------- http out -------- 
                httpOut(RED, node, msg, done);
            }
        };
        xhr.send(JSON.stringify(content));
    });
    */
  }

  RED.nodes.registerType("Project: Edit", gdfindiWebapiProjectEditNode);

}