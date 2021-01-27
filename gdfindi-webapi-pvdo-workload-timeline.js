module.exports = function (RED) {
  const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
  const httpOut = require('./lib/httpOut.js');
  const httpIn = require('./lib/httpIn.js');
  const wrapper = require('./lib/wrapper.js');
  const utility = require('./lib/utility.js');

  function gdfindiWebapiPVDOWorkloadTimelineNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.htmlTemplate = config.htmlTemplate;
    var htmlTemplate = config.htmlTemplate;

    // add codeBeforeReceivePayload
    node.on('input', function (msg, done) {
      var MiningID = msg.payload.MiningID;
      var projectId = msg.payload.projectId;
      //specify header
      if (msg.payload.hasOwnProperty('pvdo')) {
        var header = `<a href="/pvdolist">PVDO List</a>`;
      } else {
        var header = `<a href="/projectlist">Project List</a>`;
      }
      var xhr = new XMLHttpRequest();
      xhr.open("GET", utility.gdFindiUrl() + `/api/v1/PVDO/${MiningID}/Results`, false);
      xhr.setRequestHeader('Authorization', msg.req.cookies.authorization);
      xhr.send();
      var response = JSON.parse(xhr.responseText);

      function sleep(milliseconds) {
        const date = Date.now();
        let currentDate = null;
        do {
          currentDate = Date.now();
        } while (currentDate - date < milliseconds);
      }

      while (response.completed == false) {
        xhr = new XMLHttpRequest();
        xhr.open("GET", utility.gdFindiUrl() + `/api/v1/PVDO/${MiningID}/Results`, false);
        xhr.setRequestHeader('Authorization', msg.req.cookies.authorization);
        xhr.send();
        response = JSON.parse(xhr.responseText);
        sleep(1000);
        xhr.abort();
        xhr = null;
      }

      // check if there is result
      if (response.results === undefined || response.results.length == 0) {

        var title = `PVDO Result`;
        var library = ``;
        var style = ``;
        var body = `<p>Data is already retrieved!</p>`;
        var script = ``;

        msg.payload = '';
        msg.payload = utility.htmlTemplate(title, library, style, header, body, script);


        httpOut(RED, node, msg, done);

      } else {
        //workLoadChart
        var result = response.results[0].statisticalResult.workLoadChartOfStation;
        //JSON
        var outputJSON = {};
        outputJSON.stations = [];
        var taskSplit = function (str) {
          str = str.split('@');
          //if there are 4 elements -> have extra work
          //if there are 3 elements -> have normal work
          if (str.length === 4) {
            str = [str[0], str[2], str[3]]
          }
          let middleStr = str[1].split('.');
          let middleLastStr = middleStr[1].split(':')
          var newStr = [str[0], middleStr[0], middleLastStr[0], middleLastStr[1], str[2]]
          return newStr
        }
        var tooltipStr = function (str, duration) {
          str = taskSplit(str);
          return 'task: ' + str[0] + '<br/>productName: ' + str[1] + '<br/>processName: ' + str[2] + '<br/>index: ' + str[3] + '<br/>part: ' + str[4] + '<br/>duration: ' + new Date(duration * 1000).toISOString().substr(11, 8)
        }

        //convert to a proper JSON
        //even array = header
        //odd array = value
        //odd first value = row header
        var arrayToHtml = [];
        var totalRow = result.length;
        for (var i = 0; i < result.length; i += 2) {
          var arrayHeader, timeline, cumTimeline;
          var station = result[i + 1][0];
          arrayHeader = result[i];
          //remove the first empty element
          arrayHeader.shift();
          //var tooltip = tooltipStr(header[j])
          timeline = result[i + 1];
          var sum = 0;
          //remove first str
          timeline.shift();
          cumTimeline = timeline.map(elem => sum = (sum || 0) + parseInt(elem));

          //JSON
          var workArray = [];

          for (var j = 0; j < arrayHeader.length; j++) {
            //remove the idling text
            if (arrayHeader[j] === 'Idling') {
              arrayHeader.splice(j, 1);
              timeline.splice(j, 1);
              cumTimeline.splice(j, 1);
            }
          }
          //console.log(arrayHeader)
          //console.log(timeline)
          //console.log(cumTimeline)
          const setTodaySecond = function (inputSec) {
            const today = new Date();
            const todayDate = new Date(
              today.getFullYear() +
                "-" +
                (today.getMonth() + 1) +
                "-" +
                today.getDate()
            )
              .setSeconds(inputSec)
            return new Date(todayDate).toISOString();
          };
          var endTime = [];
          for (var j = 0; j < arrayHeader.length; j++) {
            let startTime = parseInt(cumTimeline[j]) - parseInt(timeline[j]);
            let array = [station, '', tooltipStr(arrayHeader[j], timeline[j]), startTime, parseInt(cumTimeline[j])]
            //console.log(array);
            arrayToHtml.push(array);

            //JSON
            var str = taskSplit(arrayHeader[j])
            workArray.push({
              "WorkType": str[0],
              "ProductName": str[1],
              "ProductionProcessName": str[2],
              "ProcessIndex": parseInt(str[3]),
              "Count": parseInt(str[4]),
              "StartTime": setTodaySecond(startTime),
              "Duration": parseInt(timeline[j])
            });
          }
          //JSON
          var stationJSON = {
            "name": station,
            "works": workArray
          }
          outputJSON.stations.push(stationJSON);
        }
        var outputJSONStr = JSON.stringify(outputJSON);

        var payload = JSON.stringify(arrayToHtml);
        //google charts
        if (totalRow > 6)
          var chartHeightWithLimit = 240;
        else
          var chartHeightWithLimit = totalRow * 35

        var title = `GD.findi Gantt Chart`
        var library = `
<script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
<link href='https://fonts.googleapis.com/css?family=Roboto' rel='stylesheet'>
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
                  height: 55vh;
                  width: 100%;
                }
                textarea[name="editor"] {
                  display: none;
                }
                
                .as-console-wrapper {
                  display: none !important;
                }
                #chart_div {
                  width:100%;
                }
                `;
        var body = `
                <div id="payload_div"></div>
                <div class="title">Project#${projectId} Workload Chart</div>
                <div id="chart_div"></div>
                <div class="title"><p id="submission_state" style="white-space: pre-line;"></p></div>
                <div id="editor_div">
                <div class="title">Project#${projectId} Workload JSON</div>
                <textarea name="editor">${outputJSONStr}</textarea>
                <div id="editor"></div>
                </div>
                `;
        var script = `
                //JSON
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


                google.charts.load("current", {packages:["timeline"]});
        google.charts.setOnLoadCallback(drawChart);
        
        function drawChart() {
          var today = new Date();
          var todayStr = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
          var timeStr = function (sec) {
              return new Date(todayStr + ' ' + new Date(sec * 1000).toISOString().substr(11, 8))
          };

    var container = document.getElementById('chart_div');
    var chart = new google.visualization.Timeline(container);
    var dataTable = new google.visualization.DataTable();
    dataTable.addColumn({ type: 'string', id: 'Station' });
    dataTable.addColumn({ type: 'string', id: 'dummy bar label' });
    dataTable.addColumn({ type: 'string', role: 'tooltip' });
    dataTable.addColumn({ type: 'date', id: 'Start' });
    dataTable.addColumn({ type: 'date', id: 'End' });

            var data = ${payload};
            //convert the date to an acceptable format
            for (var i = 0; i < data.length; i++) {
                data[i][3] = timeStr(data[i][3]);
                data[i][4] = timeStr(data[i][4]);
            }
            //document.getElementById('payload_div').innerHTML=data;
            dataTable.addRows(data);
            var chartHeight = ${chartHeightWithLimit};
            var options = {
                height: chartHeight,
                timeline: { colorByRowLabel: true },
                labelStyle: {
                        fontSize: 13
                } ,
                colors: ['#111e6c','#1d2951', '#597387', '#003152', 
                '#000080', '#0e4d92', '#1034a6', '#0080ff', '#0f52ba', 
                '#008ecc', '#6593f5', '#4c516d', '#008081', '#73c2fb', 
                '#7285a5', '#4f97a3', '#57a0d3', '#4682b4', '#81d8d0', 
                '#89cff0', '#588bae', '#7ef9ff', '#95c8d8', '#b0dfe5', 
                '#3fe0d0']
            };
          
              chart.draw(dataTable, options);
        }
                `;

        if (htmlTemplate === 'VFK') {
          style = style + `#vfk-body {
            height: 55vh;
            overflow: hidden;
          }
          #editor {
            height:30vh;
          }
          #editor_div {
            visibility: hidden;
          }
          #chart_div {
            width:98.5%;
            padding: 5px 5px;
          }
          .ace_scroller {
            display: none !important;
        }
          `;
          var data = {
            "uuid": "e27275a4-bf01-488e-a878-22e279173113",
            "eventId": "updatedText",
//            "token": "73113",
            "dataObject": outputJSON
          }
          var dataText = JSON.stringify(data);
          //console.log(JSON.stringify(data))

          var additionalScript = `
            $.ajax({
              method: "POST",
              url: "http://10.3.4.30:8083/rest/data",
              contentType: 'application/json',
              data: ${dataText},
              dataType: "json"
            });
            $("#submission_state").text("Successfully transfer JSON to the server!\\nRestart the process in 5 seconds...")
            setTimeout(()=>{
              window.location='/projectlist'
            }, 5000);
          `;
          script = script + additionalScript;
          msg.payload = utility.htmlVFKTemplate(title, library, style, header, body, script, 5);
          //Send outputJSONStr to external server
        } else {
          msg.payload = utility.htmlTemplate(title, library, style, header, body, script);
        }
        httpOut(RED, node, msg, done);
      }

    });
  }
  RED.nodes.registerType("PVDO: Workload Timeline", gdfindiWebapiPVDOWorkloadTimelineNode);
}
