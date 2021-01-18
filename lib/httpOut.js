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

module.exports = function (RED, node, msg, done) {

    node.headers = {};
    node.statusCode = "";

    if (msg.res) {
        var headers = RED.util.cloneMessage(node.headers);
        if (msg.headers) {
            if (msg.headers.hasOwnProperty('x-node-red-request-node')) {
                var headerHash = msg.headers['x-node-red-request-node'];
                delete msg.headers['x-node-red-request-node'];
                var hash = hashSum(msg.headers);
                if (hash === headerHash) {
                    delete msg.headers;
                }
            }
            if (msg.headers) {
                for (var h in msg.headers) {
                    if (msg.headers.hasOwnProperty(h) && !headers.hasOwnProperty(h)) {
                        headers[h] = msg.headers[h];
                    }
                }
            }
        }
        if (Object.keys(headers).length > 0) {
            msg.res._res.set(headers);
        }
        if (msg.cookies) {
            for (var name in msg.cookies) {
                if (msg.cookies.hasOwnProperty(name)) {
                    if (msg.cookies[name] === null || msg.cookies[name].value === null) {
                        if (msg.cookies[name] !== null) {
                            msg.res._res.clearCookie(name, msg.cookies[name]);
                        } else {
                            msg.res._res.clearCookie(name);
                        }
                    } else if (typeof msg.cookies[name] === 'object') {
                        msg.res._res.cookie(name, msg.cookies[name].value, msg.cookies[name]);
                    } else {
                        msg.res._res.cookie(name, msg.cookies[name]);
                    }
                }
            }
        }
        var statusCode = node.statusCode || msg.statusCode || 200;
        if (typeof msg.payload == "object" && !Buffer.isBuffer(msg.payload)) {
            msg.res._res.status(statusCode).jsonp(msg.payload);
        } else {
            if (msg.res._res.get('content-length') == null) {
                var len;
                if (msg.payload == null) {
                    len = 0;
                } else if (Buffer.isBuffer(msg.payload)) {
                    len = msg.payload.length;
                } else if (typeof msg.payload == "number") {
                    len = Buffer.byteLength("" + msg.payload);
                } else {
                    len = Buffer.byteLength(msg.payload);
                }
                msg.res._res.set('content-length', len);
            }

            if (typeof msg.payload === "number") {
                msg.payload = "" + msg.payload;
            }
            msg.res._res.status(statusCode).send(msg.payload);
        }
    } else {
        node.warn(RED._("httpin.errors.no-response"));
    }
    done();
}