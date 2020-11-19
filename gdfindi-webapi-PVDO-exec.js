module.exports = function (RED) {
  var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
  var tableify = require('tableify');
  const httpIn = require('./lib/httpIn.js');
  const httpOut = require('./lib/httpOut.js');
  const wrapper = require('./lib/wrapper.js');

  function gdfindiWebapiPVDOExecNode(config) {

    RED.nodes.createNode(this, config);

    var node = this;

    this.urlSubmitExec = "/submitexec";
    this.methodSubmitExec = "post";

    //callback function when url is accessed
    this.callbackSubmitExec = function (req, res, done) {
      /** mandatory **/
      var msgid = RED.util.generateId();
      res._msgid = msgid;
      /** mandatory **/

      //POST: structure of req.body: {projectId='', editor='info inside the ace editor textarea'}
      var projectId = req.body.projectId;
      var content = req.body.editor;

      var xhr = new XMLHttpRequest();
      xhr.open("POST", "https://precom.gdfindi.pro/api/v1/PVDO/" + projectId, true);
      xhr.setRequestHeader('Authorization', req.cookies.authorization);
      xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      var msg = { _msgid: msgid, req: req, res: wrapper.createResponseWrapper(node, res), payload: {} };
      xhr.onreadystatechange = function (res) {
         if (this.readyState == 4 && this.status == 200) {
          var response = JSON.parse(this.responseText);
          //send MiningID to pvdo output
          msg.payload.MiningID = response;
          node.send(msg);
        }
        //console.log('readystate: '+ this.readyState+'\n status: '+this.status+'\n'+this.responseText+'\n ----------------------')
      };
      xhr.send(content);
    }

    httpIn(RED, node, this.urlSubmitExec, this.methodSubmitExec, this.callbackSubmitExec);

    // add codeBeforeReceivePayload
    node.on('input', function (msg, done) {
      var daytime = msg.payload.daytime;
      var payload = msg.payload.data;
      var projectId = payload.id;
      // get initplans
      var hasProductionProcesses = payload.hasOwnProperty('productionProcesses');
      var process = [];
      if (hasProductionProcesses === true) {
        payload.productionProcesses.forEach(element => {
          var hasRenderingCondition = payload.hasOwnProperty('renderingCondition');
          var lotsize = null;
          var processName = element.name;
          var a = daytime[element.name].split(':');
          var daytime_sec = (+a[0]) * 60 * 60 + (+a[1]);
          if(hasRenderingCondition == true){
            payload.renderingCondition.productionSchedules[0].orders.forEach(element => {
              if(element.product == processName){
                lotsize = element.lotsize;
              }
            })
          }
          process.push({
            "productid": processName, //name of process
            "lotsize": lotsize, // lot size
            "daytime":daytime_sec, // Math.floor(Math.random() * 86400), //start time
            "islot": false, //  Lot
            "line": null, // Line name
            "processid": null, // First process id
            "stationid": null, // First station id
            "deliveryTime": null // Delivery time (second)
          });
        })
      }else{
        //cant process
        msg.payload = 'Cannot Process. Not enough information.';
        httpOut(RED, node, msg, done);
        return
      }

      var renderingParameter = {
        "iniplans": process, // Initial production order.
        "goals": null, // Production goal. Is not specified, calculated from initial production order.
        "patternCondition": {
          "RenderingType": 0, // Target of pattern. 0: production order
          "Patterns": [ // index of initial production order.
            [...Array(process.length).keys()]
          ]
        },
        "start": 0, // Start time.
        "mode": "Mining" // Rendering output mode. See below.
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
      <a href="javascript:history.back()">Go Back</a>&nbsp;<a href="/lexerproject">Top</a><br/><br/>
        <form id="edit" action=/submitexec method="post">
            <div class="title">Project#${projectId} Parameters for PVDO</div>
            <input type="hidden" id="projectId" name="projectId" value=${projectId}>
            <textarea name="editor">${JSON.stringify(renderingParameter)}</textarea>
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

      //msg.payload = response;
      msg.payload = html;
      httpOut(RED, node, msg, done);
    });

  }

  RED.nodes.registerType("PVDO: Request Rendering", gdfindiWebapiPVDOExecNode);

}