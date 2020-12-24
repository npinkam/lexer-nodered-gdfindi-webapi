module.exports = function (RED) {
    "use strict";
    const httpIn = require('./lib/httpIn.js');
    const httpOut = require('./lib/httpOut.js');
    const wrapper = require('./lib/wrapper.js');
    //const ClientOAuth2 = require('client-oauth2');
    const utility = require('./lib/utility.js');
    const configOauth2 = {
        client: {
        },
        auth: {
            tokenHost: utility.gdFindiUrl(),
            tokenPath: '/api/token'
        }
    };
    const { ClientCredentials, ResourceOwnerPassword, AuthorizationCode } = require('simple-oauth2');

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

            var title = `Lexer Customer Login`;
            var library = '';
            var style = `
.login-form {
    width: 340px;
    margin: 50px auto;
}
.login-form form {
    margin-bottom: 15px;
    background: #f7f7f7;
    box-shadow: 0px 2px 2px rgba(0, 0, 0, 0.3);
    padding: 30px;
}
.login-form h2 {
    margin: 0 0 15px;
}
.form-control, .btn {
    min-height: 38px;
    border-radius: 2px;
}
.btn {        
    font-size: 15px;
    font-weight: bold;
}`;
            var body = `
<div class="login-form">
<form action="/auth" method="post">
    <h2 class="text-center">Log in</h2>       
    <div class="form-group">
        <input type="text" name="username" class="form-control" placeholder="Username" required="required">
    </div>
    <div class="form-group">
        <input type="password" name="password" class="form-control" placeholder="Password" required="required">
    </div>
    <div class="form-group">
        <button type="submit" class="btn btn-primary btn-block">Log in</button>
    </div>     
</form>
</div>
            `
            var script = '';
            var html = utility.htmlTemplate(title, library, style, false, body, script);
            var msg = { _msgid: msgid, req: req, res: wrapper.createResponseWrapper(node, res), payload: html };
            httpOut(RED, node, msg, done)
        }

        this.callbackAuth = function (req, res, done) {
            var msgid = RED.util.generateId();
            res._msgid = msgid;
            /* var lexerAuth = new ClientOAuth2({
                accessTokenUri: utility.gdFindiUrl()+"/api/token",
            });
            console.log(utility.gdFindiUrl()+"/api/token")
            var username = req.body.username;
            var password = req.body.password;
            lexerAuth.owner.getToken(username, password)
                .then(function (user) {
                    //user=> { accessToken: '...', tokenType: 'bearer', ... }
                    var authorization = user.tokenType + ' ' + user.accessToken;
                    //msg.payload.authorization => need {}
                    node.send({ _msgid: msgid, req: req, res: wrapper.createResponseWrapper(node, res), payload: true, cookies: { authorization } })
                }).catch(err => {
                    //window.alert("${err.body.error_description}");
                    var error = `
                    <script type="text/javascript">
                        window.alert("${err}");
                        window.location.replace('/lexerproject')
                    </script>
                    `;

                    var msg = { _msgid: msgid, req: req, res: wrapper.createResponseWrapper(node, res), payload: error };
                    httpOut(RED, node, msg, done);
                }); */

            //simple-oauth2
            var username = req.body.username;
            var password = req.body.password;
            const client = new ResourceOwnerPassword(configOauth2);
            const tokenParams = {
                username: username,
                password: password,
            };
            async function run() {
                try {
                    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
                    const accessToken = await client.getToken(tokenParams, { json: true })
                    var authorization = accessToken.token.token_type + ' ' + accessToken.token.access_token;
                    console.log(authorization)
                    //msg.payload.authorization => need {}
                    node.send({ _msgid: msgid, req: req, res: wrapper.createResponseWrapper(node, res), payload: true, cookies: { authorization } })
                } catch(err){
                    //window.alert("${err.body.error_description}");
                    var error = `
                <script type="text/javascript">
                    window.alert("${err}");
                    window.location.replace('/lexerproject')
                </script>
                `;

                    var msg = { _msgid: msgid, req: req, res: wrapper.createResponseWrapper(node, res), payload: error };
                    httpOut(RED, node, msg, done);
                }
            }
            run();
        }

        // call httpInput library
        httpIn(RED, node, this.url, this.method, this.callback);
        httpIn(RED, node, this.urlAuth, this.methodAuth, this.callbackAuth);
    }
    RED.nodes.registerType("Login", gdfindiWebapiLoginNode);
}
