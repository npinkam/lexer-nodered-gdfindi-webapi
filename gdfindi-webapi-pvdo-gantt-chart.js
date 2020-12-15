module.exports = function (RED) {
    const tableify = require('tableify');
    const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
    const httpOut = require('./lib/httpOut.js');
    const httpIn = require('./lib/httpIn.js');
    const wrapper = require('./lib/wrapper.js');
    const utility = require('./lib/utility.js');

    function gdfindiWebapiPVDOGanttChartNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        // add codeBeforeReceivePayload
        node.on('input', function (msg, done) {
            var MiningID = msg.payload.MiningID;
            //specify header
            if(msg.payload.hasOwnProperty('pvdo')){
                var header = `<a href="/pvdolist">PVDO List</a>`;
            }else{
                var header = `<a href="/projectlist">Project List</a>`;
            }
            var xhr = new XMLHttpRequest();
            xhr.open("GET", `https://precom.gdfindi.pro/api/v1/PVDO/${MiningID}/Results`, false);
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
                xhr.open("GET", `https://precom.gdfindi.pro/api/v1/PVDO/${MiningID}/Results`, false);
                xhr.setRequestHeader('Authorization', msg.req.cookies.authorization);
                xhr.send();
                response = JSON.parse(xhr.responseText);
                sleep(1000);
                xhr.abort();
                xhr = {};
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
                // get gantt chart element
                var result = response.results[0].statisticalResult.process;

                //send response to debug node
                msg.payload = response.results[0];
                node.send(msg)
                //msg.payload = '';
/*
                //convert result from pvdo to a proper json
                var key = result[0];
                result.shift();
                var value = result;
                var today = new Date();
                var arrayToHtml = [];
                var addToArray = [];
                for (var i = 0; i < value.length; i++) {
                    var product = value[i][0];
                    var processName = value[i][1];
                    var processId = value[i][2].substring(2);
                    var production = value[i][3];
                    var startTime = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + ' ' + new Date(value[i][4] * 1000).toISOString().substr(11, 8);
                    var endTime = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + ' ' + new Date(value[i][5] * 1000).toISOString().substr(11, 8);
                    if (i % 4 != 0)
                        addToArray = [processName, product + ': ' + processId, product, startTime, endTime, null, 0, value[i - 1][1]];
                    else
                        addToArray = [processName, product + ': ' + processId, product, startTime, endTime, null, 0, null];
                    arrayToHtml.push(addToArray);
                }
                var payload = JSON.stringify(arrayToHtml);
                //google charts

                var title = `GD.findi Gantt Chart`
                var library = `
<script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
<link href='https://fonts.googleapis.com/css?family=Roboto' rel='stylesheet'>
`;
                var style = `
                
                `;
                var body = `
                <div id="chart_div" style="width:100%;"></div>
                `;
                var script = `
                google.charts.load('current', { 'packages': ['gantt'] });
        google.charts.setOnLoadCallback(drawChart);
        
        function drawChart() {
            var otherData = new google.visualization.DataTable();
            otherData.addColumn('string', 'Task ID');
            otherData.addColumn('string', 'Task Name');
            otherData.addColumn('string', 'Resource');
            otherData.addColumn('date', 'Start');
            otherData.addColumn('date', 'End');
            otherData.addColumn('number', 'Duration');
            otherData.addColumn('number', 'Percent Complete');
            otherData.addColumn('string', 'Dependencies');

            var data = ${payload};
            
            //convert the date to an acceptable format
            for (var i = 0; i < data.length; i++) {
                data[i][3] = new Date(data[i][3]);
                data[i][4] = new Date(data[i][4]);
            }
            //document.getElementById('payload_div').innerHTML = data;

            otherData.addRows(data);

            var options = {
                height: (data.length + 1) * 41,
                gantt: {
                    criticalPathEnabled: false,
                    arrow: {
                        color: '#ffffff00'
                    },
                    labelStyle: {
                        fontSize: 13
                    }
                }
            };

            var chart = new google.visualization.Gantt(document.getElementById('chart_div'));

            chart.draw(otherData, options);
        }
                `;

                msg.payload = utility.htmlTemplate(title, library, style, header, body, script)
                httpOut(RED, node, msg, done);*/
            }

        });
    }
    RED.nodes.registerType("PVDO: Gantt Chart", gdfindiWebapiPVDOGanttChartNode);
}
