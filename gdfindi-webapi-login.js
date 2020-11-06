module.exports = function (RED) {
    function gdfindiWebapiLoginNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        //properties field
        var username = this.credentials.username;
        var password = this.credentials.password;

        //web server
        /*
        const host = 'localhost';
        const port = 1880;

        const requestListener = function (req, res){
            res.writeHead(200);
            res.end("Test Login Server");
        }

        const server = http.createServer(requestListener);
        server.listen(port, host, () => {
            console.log(`Server is running on http://${host}:${port}`);
        });
*/
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
