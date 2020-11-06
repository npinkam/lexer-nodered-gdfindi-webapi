var tableify = require('tableify');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
module.exports = function (RED) {
    function gdfindiWebapiProjectListNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        //properties field

        // add codeBeforeReceivePayload
        node.on('input', function (msg) {
            // add codeWhenReceivePayload
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "https://precom.gdfindi.pro/api/v1/projects/", false);
            console.log(msg.payload.authorization)
            xhr.setRequestHeader('Authorization', msg.payload.authorization);
            xhr.send();
            var response = JSON.parse(xhr.responseText);
            response.forEach(element => {
                var buffer = element.id;
                var link = `/req?projectId=${buffer}`;
                element.id = "<a href=" + link + " target='_self'>" + buffer + "</a>";
            
            });
            var html = tableify(response);
            msg.payload = html;
            node.send(msg);
        });
    }
    RED.nodes.registerType("gdfindi-webapi-project-list", gdfindiWebapiProjectListNode);
}
