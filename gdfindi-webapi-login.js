module.exports = function (RED) {
    "use strict";

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

        this.callback = new Promise((resolve, reject) => {
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
        });

        httpInput(RED, node, this.url, this.method, this.callback);
    }
    RED.nodes.registerType("Login", gdfindiWebapiLoginNode, {
        credentials: {
            username: { type: "text" },
            password: { type: "password" }
        }
    });
}
