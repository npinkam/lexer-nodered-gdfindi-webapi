module.exports = function (RED) {
    function gdfindiWebapiLoginNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        //properties field
        var username = this.credentials.username;
        var password = this.credentials.password;

        // add codeBeforeReceivePayload

        node.on('input', function (msg) {

            // add codeWhenReceivePayload
            msg.oauth2Request = {
                "access_token_url": "https://precom.gdfindi.pro/api/token",
                "credentials": {
                    "grant_type": "password",
                    "username": username,
                    "password": password
                }
            };
            node.send(msg);
        });
    }
    RED.nodes.registerType("gdfindi-webapi-login", gdfindiWebapiLoginNode, {
        credentials: {
            username: {type:"text"},
            password: {type:"password"}
        }
    });
}
