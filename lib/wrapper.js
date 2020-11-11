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

exports.createResponseWrapper = function(node, res) {
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

exports.createRequestWrapper - function(node, req) {
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