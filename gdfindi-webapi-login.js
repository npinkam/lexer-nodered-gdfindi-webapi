module.exports = function (RED) {
    "use strict";
    const httpIn = require('./lib/httpIn.js');
    const httpOut = require('./lib/httpOut.js');
    const wrapper = require('./lib/wrapper.js');
    const ClientOAuth2 = require('client-oauth2');

    function gdfindiWebapiLoginNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.url = config.url;
        this.method = "get";

        this.urlAuth = "/auth";
        this.methodAuth = "post";

        //callback function when url is accessed

        this.callback = function (req, res, done) {
            var msgid = RED.util.generateId();
            res._msgid = msgid;

            var html = `
<head>
<style type="text/css">
/**
 01/28/2016
    This pen is years old, and watching at the code after all
    those years made me fall from my chair, so I:
    - changed all IDs to classes
    - converted all units to pixels and em units
    - changed all global elements to classes or children of
    .login
    - cleaned the syntax to be more consistent
    - added a lot of spaces that I so hard tried to avoid
    a few years ago
    (because it's cool to not use them)
    - and probably something else that I can't remember anymore
    
    I sticked to the same philosophy, meaning:
    - the design is almost the same
    - only pure HTML and CSS
    - no frameworks, preprocessors or resets
    /

/ 'Open Sans' font from Google Fonts /
@import url(https://fonts.googleapis.com/css?family=Open+Sans:400,700);

body {
    background: #456;
    font-family: 'Open Sans', sans-serif;
}

.login {
    width: 400px;
    margin: 16px auto;
    font-size: 16px;
}

/ Reset top and bottom margins from certain elements /
.login-header,
.login p {
    margin-top: 0;
    margin-bottom: 0;
}

/ The triangle form is achieved by a CSS hack /
.login-triangle {
    width: 0;
    margin-right: auto;
    margin-left: auto;
    border: 12px solid transparent;
    border-bottom-color: #28d;
}

.login-header {
    background: #28d;
    padding: 20px;
    font-size: 1.4em;
    font-weight: normal;
    text-align: center;
    text-transform: uppercase;
    color: #fff;
}

.login-container {
    background: #ebebeb;
    padding: 12px;
}

/ Every row inside .login-container is defined with p tags /
.login p {
    padding: 12px;
}

.login input {
    box-sizing: border-box;
    display: block;
    width: 100%;
    border-width: 1px;
    border-style: solid;
    padding: 16px;
    outline: 0;
    font-family: inherit;
    font-size: 0.95em;
}

.login input[type="email"],
.login input[type="password"] {
    background: #fff;
    border-color: #bbb;
    color: #555;
}

/ Text fields' focus effect /
.login input[type="email"]:focus,
.login input[type="password"]:focus {
    border-color: #888;
}

.login input[type="submit"] {
    background: #28d;
    border-color: transparent;
    color: #fff;
    cursor: pointer;
}

.login input[type="submit"]:hover {
    background: #17c;
}

/ Buttons' focus effect */
.login input[type="submit"]:focus {
    border-color: #05a;
}
</style>
</head>

<div class="login">
    <div class="login-triangle"></div>
    <h2 class="login-header">Log in</h2>
    <form class="login-container" action="/auth" method="POST">
    <p><input name="username" type="text" placeholder="Username"></p>
    <p><input name="password" type="password" placeholder="Password"></p>
    <p><input type="submit" value="Log in"></p>
    </form>
</div>
`;
            var msg = { _msgid: msgid, req: req, res: wrapper.createResponseWrapper(node, res), payload: html };
            httpOut(RED, node, msg, done)
        }

        this.callbackAuth = function (req, res, done) {
            var msgid = RED.util.generateId();
            res._msgid = msgid;
            var lexerAuth = new ClientOAuth2({
                accessTokenUri: "https://precom.gdfindi.pro/api/token",
            });
            
            var username = req.body.username;
            var password = req.body.password;

            lexerAuth.owner.getToken(username, password)
                .then(function (user) {
                    //user=> { accessToken: '...', tokenType: 'bearer', ... }
                    var authorization = user.tokenType + ' ' + user.accessToken;
                    //msg.payload.authorization => need {}
                    node.send({ _msgid: msgid, req: req, res: wrapper.createResponseWrapper(node, res), payload: true, cookies: { authorization } })
                }).catch(err => {
                    var error = `
                    <a href="javascript:history.back()">Go Back</a></br></br>
                    <p>${JSON.stringify(err)}</p>
                    <script type="text/javascript">
                        window.alert("${err.body.error_description}");
                    </script>
                    `;

                    var msg = { _msgid: msgid, req: req, res: wrapper.createResponseWrapper(node, res), payload: error };
                    httpOut(RED, node, msg, done);
                });
        }

        // call httpInput library
        new httpIn(RED, node, this.url, this.method, this.callback);
        new httpIn(RED, node, this.urlAuth, this.methodAuth, this.callbackAuth);
    }
    RED.nodes.registerType("Login", gdfindiWebapiLoginNode);
}
