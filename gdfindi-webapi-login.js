module.exports = function (RED) {
    "use strict";

    const wrapper = require('./lib/wrapper.js');
    const httpInput = require('./lib/httpInput.js');

    var ClientOAuth2 = require('client-oauth2');

    function gdfindiWebapiLoginNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        //properties field
        var username = this.credentials.username;
        var password = this.credentials.password;

        this.url = config.url;
        this.method = "get";
        
        this.callback = function (req, res) {
            var msgid = RED.util.generateId();
            res._msgid = msgid;
            if (node.method.match(/^(post|delete|put|options|patch)$/)) {
                node.send({ _msgid: msgid, req: req, res: wrapper.createResponseWrapper(node, res), payload: req.body });
            } else if (node.method == "get") {
                // call back => get login token from server
                var lexerAuth = new ClientOAuth2({
                    accessTokenUri: "https://precom.gdfindi.pro/api/token",
                });
                lexerAuth.owner.getToken(username, password)
                    .then(function (user) {
                        //user=> { accessToken: '...', tokenType: 'bearer', ... }
                        var authorization = user.tokenType + ' ' + user.accessToken;
                        node.send({ _msgid: msgid, req: req, res: wrapper.createResponseWrapper(node, res), payload: { authorization } });
                    });
                //node.send({ _msgid: msgid, req: req, res: createResponseWrapper(node, res), payload: req.query });
            } else {
                node.send({ _msgid: msgid, req: req, res: wrapper.createResponseWrapper(node, res) });
            }
        };

        httpInput(RED, node, this.url, this.method, this.callback);
    }
    RED.nodes.registerType("Login", gdfindiWebapiLoginNode, {
        credentials: {
            username: { type: "text" },
            password: { type: "password" }
        }
    });
}
