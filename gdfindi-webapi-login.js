module.exports = function (RED) {
    "use strict";
    var bodyParser = require("body-parser");
    var multer = require("multer");
    var cookieParser = require("cookie-parser");
    var getBody = require('raw-body');
    var cors = require('cors');
    var onHeaders = require('on-headers');
    var typer = require('content-type');
    var mediaTyper = require('media-typer');
    var isUtf8 = require('is-utf8');
    var hashSum = require("hash-sum");

    var ClientOAuth2 = require('client-oauth2');

    function rawBodyParser(req, res, next) {
        if (req.skipRawBodyParser) { next(); } // don't parse this if told to skip
        if (req._body) { return next(); }
        req.body = "";
        req._body = true;

        var isText = true;
        var checkUTF = false;

        if (req.headers['content-type']) {
            var contentType = typer.parse(req.headers['content-type'])
            if (contentType.type) {
                var parsedType = mediaTyper.parse(contentType.type);
                if (parsedType.type === "text") {
                    isText = true;
                } else if (parsedType.subtype === "xml" || parsedType.suffix === "xml") {
                    isText = true;
                } else if (parsedType.type !== "application") {
                    isText = false;
                } else if ((parsedType.subtype !== "octet-stream") && (parsedType.subtype !== "cbor")) {
                    checkUTF = true;
                } else {
                    // application/octet-stream or application/cbor
                    isText = false;
                }

            }
        }

        getBody(req, {
            length: req.headers['content-length'],
            encoding: isText ? "utf8" : null
        }, function (err, buf) {
            if (err) { return next(err); }
            if (!isText && checkUTF && isUtf8(buf)) {
                buf = buf.toString()
            }
            req.body = buf;
            next();
        });
    }

    var corsSetup = false;

    function createRequestWrapper(node, req) {
        // This misses a bunch of properties (eg headers). Before we use this function
        // need to ensure it captures everything documented by Express and HTTP modules.
        var wrapper = {
            _req: req
        };
        var toWrap = [
            "param",
            "get",
            "is",
            "acceptsCharset",
            "acceptsLanguage",
            "app",
            "baseUrl",
            "body",
            "cookies",
            "fresh",
            "hostname",
            "ip",
            "ips",
            "originalUrl",
            "params",
            "path",
            "protocol",
            "query",
            "route",
            "secure",
            "signedCookies",
            "stale",
            "subdomains",
            "xhr",
            "socket" // TODO: tidy this up
        ];
        toWrap.forEach(function (f) {
            if (typeof req[f] === "function") {
                wrapper[f] = function () {
                    node.warn(RED._("httpin.errors.deprecated-call", { method: "msg.req." + f }));
                    var result = req[f].apply(req, arguments);
                    if (result === req) {
                        return wrapper;
                    } else {
                        return result;
                    }
                }
            } else {
                wrapper[f] = req[f];
            }
        });


        return wrapper;
    }
    function createResponseWrapper(node, res) {
        var wrapper = {
            _res: res
        };
        var toWrap = [
            "append",
            "attachment",
            "cookie",
            "clearCookie",
            "download",
            "end",
            "format",
            "get",
            "json",
            "jsonp",
            "links",
            "location",
            "redirect",
            "render",
            "send",
            "sendfile",
            "sendFile",
            "sendStatus",
            "set",
            "status",
            "type",
            "vary"
        ];
        toWrap.forEach(function (f) {
            wrapper[f] = function () {
                node.warn(RED._("httpin.errors.deprecated-call", { method: "msg.res." + f }));
                var result = res[f].apply(res, arguments);
                if (result === res) {
                    return wrapper;
                } else {
                    return result;
                }
            }
        });
        return wrapper;
    }

    var corsHandler = function (req, res, next) { next(); }

    if (RED.settings.httpNodeCors) {
        corsHandler = cors(RED.settings.httpNodeCors);
        RED.httpNode.options("*", corsHandler);
    }

    function gdfindiWebapiLoginNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        //properties field
        var username = this.credentials.username;
        var password = this.credentials.password;

        this.url = config.url;
        if (this.url[0] !== '/') {
            this.url = '/' + this.url;
        }

        this.method = "get";

        this.errorHandler = function (err, req, res, next) {
            node.warn(err);
            res.sendStatus(500);
        };

        this.callback = function (req, res) {
            var msgid = RED.util.generateId();
            res._msgid = msgid;
            if (node.method.match(/^(post|delete|put|options|patch)$/)) {
                node.send({ _msgid: msgid, req: req, res: createResponseWrapper(node, res), payload: req.body });
            } else if (node.method == "get") {
                // call back => get login token from server
                var lexerAuth = new ClientOAuth2({
                    accessTokenUri: "https://precom.gdfindi.pro/api/token",
                })
                lexerAuth.owner.getToken(username, password)
                    .then(function (user) {
                        //user=> { accessToken: '...', tokenType: 'bearer', ... }
                        var authorization = user.tokenType + ' ' + user.accessToken;
                        node.send({ _msgid: msgid, req: req, res: createResponseWrapper(node, res), payload: { authorization } });
                    });
                //node.send({ _msgid: msgid, req: req, res: createResponseWrapper(node, res), payload: req.query });
            } else {
                node.send({ _msgid: msgid, req: req, res: createResponseWrapper(node, res) });
            }
        };

        var httpMiddleware = function (req, res, next) { next(); }

        if (RED.settings.httpNodeMiddleware) {
            if (typeof RED.settings.httpNodeMiddleware === "function") {
                httpMiddleware = RED.settings.httpNodeMiddleware;
            }
        }

        var maxApiRequestSize = RED.settings.apiMaxLength || '5mb';
        var jsonParser = bodyParser.json({ limit: maxApiRequestSize });
        var urlencParser = bodyParser.urlencoded({ limit: maxApiRequestSize, extended: true });

        var metricsHandler = function (req, res, next) { next(); }
        if (this.metric()) {
            metricsHandler = function (req, res, next) {
                var startAt = process.hrtime();
                onHeaders(res, function () {
                    if (res._msgid) {
                        var diff = process.hrtime(startAt);
                        var ms = diff[0] * 1e3 + diff[1] * 1e-6;
                        var metricResponseTime = ms.toFixed(3);
                        var metricContentLength = res.getHeader("content-length");
                        //assuming that _id has been set for res._metrics in HttpOut node!
                        node.metric("response.time.millis", { _msgid: res._msgid }, metricResponseTime);
                        node.metric("response.content-length.bytes", { _msgid: res._msgid }, metricContentLength);
                    }
                });
                next();
            };
        }

        var multipartParser = function (req, res, next) { next(); }
        if (this.upload) {
            var mp = multer({ storage: multer.memoryStorage() }).any();
            multipartParser = function (req, res, next) {
                mp(req, res, function (err) {
                    req._body = true;
                    next(err);
                })
            };
        }

        if (this.method == "get") {
            RED.httpNode.get(this.url, cookieParser(), httpMiddleware, corsHandler, metricsHandler, this.callback, this.errorHandler);
        } else if (this.method == "post") {
            RED.httpNode.post(this.url, cookieParser(), httpMiddleware, corsHandler, metricsHandler, jsonParser, urlencParser, multipartParser, rawBodyParser, this.callback, this.errorHandler);
        } else if (this.method == "put") {
            RED.httpNode.put(this.url, cookieParser(), httpMiddleware, corsHandler, metricsHandler, jsonParser, urlencParser, rawBodyParser, this.callback, this.errorHandler);
        } else if (this.method == "patch") {
            RED.httpNode.patch(this.url, cookieParser(), httpMiddleware, corsHandler, metricsHandler, jsonParser, urlencParser, rawBodyParser, this.callback, this.errorHandler);
        } else if (this.method == "delete") {
            RED.httpNode.delete(this.url, cookieParser(), httpMiddleware, corsHandler, metricsHandler, jsonParser, urlencParser, rawBodyParser, this.callback, this.errorHandler);
        }

        this.on("close", function () {
            var node = this;
            RED.httpNode._router.stack.forEach(function (route, i, routes) {
                if (route.route && route.route.path === node.url && route.route.methods[node.method]) {
                    routes.splice(i, 1);
                }
            });
        });
    }
    RED.nodes.registerType("Login", gdfindiWebapiLoginNode, {
        credentials: {
            username: { type: "text" },
            password: { type: "password" }
        }
    });
}
