module.exports = function (RED) {
    "use strict";
    const httpIn = require('./lib/httpIn.js');
    const httpOut = require('./lib/httpOut.js');
    const wrapper = require('./lib/wrapper.js');
    var ClientOAuth2 = require('client-oauth2');

    function gdfindiWebapiLoginNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        //properties field
        var username = this.credentials.username;
        var password = this.credentials.password;

        this.url = config.url;
        this.method = "get";

        //custom callback function to get authorization token
        /*this.callback = new Promise((resolve, reject) => {
            // call back => get login token from server
            var lexerAuth = new ClientOAuth2({
                accessTokenUri: "https://precom.gdfindi.pro/api/token",
            });
            lexerAuth.owner.getToken(username, password)
                .then(function (user) {
                    //user=> { accessToken: '...', tokenType: 'bearer', ... }
                    var authorization = user.tokenType + ' ' + user.accessToken;
                    //msg.payload.authorization => need {}
                    resolve({ authorization });
                });
        });*/
/*
        this.callback = function (req, res) {
            var msgid = RED.util.generateId();
            res._msgid = msgid;
            console.log(callback)
            if (callback != {}) {
                callback.then((resp) => {
                    node.send({ _msgid: msgid, req: req, res: createResponseWrapper(node, res), payload: resp });
                });
            } else {
                if (node.method.match(/^(post|delete|put|options|patch)$/)) {
                    node.send({ _msgid: msgid, req: req, res: createResponseWrapper(node, res), payload: req.body });
                } else if (node.method == "get") {
                    node.send({ _msgid: msgid, req: req, res: createResponseWrapper(node, res), payload: req.query });
                } else {
                    node.send({ _msgid: msgid, req: req, res: createResponseWrapper(node, res) });
                }
            }
        };*/

        //callback function when url is accessed
        this.callback = function (req, res, done){
            var msgid = RED.util.generateId();
            res._msgid = msgid;
            var lexerAuth = new ClientOAuth2({
                accessTokenUri: "https://precom.gdfindi.pro/api/token",
            });
            lexerAuth.owner.getToken(username, password)
                .then(function (user) {
                    //user=> { accessToken: '...', tokenType: 'bearer', ... }
                    var authorization = user.tokenType + ' ' + user.accessToken;
                    //msg.payload.authorization => need {}
                    node.send({ _msgid: msgid, req: req, res: wrapper.createResponseWrapper(node, res), payload: true, cookies: {authorization} })
                }).catch(err => {
                    var error = `
                    <p>Username or Password ERROR!!!</p>
                    <script type="text/javascript">
                        window.alert("Username or Password ERROR!!!");
                    </script>
                    `;
                    var msg = { _msgid: msgid, req: req, res: wrapper.createResponseWrapper(node, res), payload: error };
                    httpOut(RED, node, msg, done);
                });
        }

        // call httpInput library
        new httpIn(RED, node, this.url, this.method, this.callback);
    }
    RED.nodes.registerType("Login", gdfindiWebapiLoginNode, {
        credentials: {
            username: { type: "text" },
            password: { type: "password" }
        }
    });
}
