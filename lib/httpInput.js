/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function(RED, node, url, method, callback) {

    
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

    var corsHandler = function (req, res, next) { next(); }

    if (RED.settings.httpNodeCors) {
        corsHandler = cors(RED.settings.httpNodeCors);
        RED.httpNode.options("*", corsHandler);
    }

    /** main function **/

    this.url = url;
    this.method = method;
    this.callback = callback;

    if (this.url[0] !== '/') {
        this.url = '/' + this.url;
    }

    this.errorHandler = function (err, req, res, next) {
        node.warn(err);
        res.sendStatus(500);
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
    if (node.metric()) {
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
    if (node.upload) {
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

    node.on("close", function () {
        console.log('on close');
        var node = this;
        RED.httpNode._router.stack.forEach(function (route, i, routes) {
            if (route.route && route.route.path === node.url && route.route.methods[node.method]) {
                routes.splice(i, 1);
            }
        });
    });
}