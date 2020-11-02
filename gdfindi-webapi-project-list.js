module.exports = function (RED) {
    function gdfindiWebapiProjectListNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        //properties field

        // add codeBeforeReceivePayload
        node.on('input', function (msg) {

            // add codeWhenReceivePayload
            var authorization = msg.authorization;

            node.send(msg);
        });
    }
    RED.nodes.registerType("gdfindi-webapi-project-list", gdfindiWebapiProjectListNode);
}
