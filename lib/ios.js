var _ = require("lodash"),
    Promise = require("bluebird"),
    Apn = require("apn"),
    Epoch = require("./epoch"), //will be replace with oyster-utils
    CacheObj = require("ephemeral").initialize({
        client: "local"
    }),
    client = "ios";

/**
 *
 * Process notification object internally and remove the data from cache object
 * reset the not_payload object in notification object then send back to caller
 *
 * @author Faiz <faizulhaque@tenpearls.com>
 * @param notification
 * @returns {Promise}
 * @version 0.1
 */
function processNotification(notification) {
    return new Promise(function(resolve) {
        if(notification && notification.intl) {
            CacheObj.get(notification.intl).then(function(not_payload) {
                if(not_payload) {
                    CacheObj.remove(notification.intl);
                    notification.not_payload = not_payload;
                    resolve(notification);
                    return;
                }
            });
        }
        else {
            resolve(notification);
            return;
        }
    });
}

/**
 *
 * onTransmitted event
 *
 * @author Faiz <faizulhaque@tenpearls.com>
 * @param ctx
 * @param notification
 * @param recipient
 * @returns {*}
 * @version 0.1
 */
function onTransmitted(ctx, notification, recipient) {
    return processNotification(notification).then(function(notificationObj) {
        ctx.onTransmitted(client, notificationObj, recipient);
    });
}

/**
 *
 * onTransmissionError event
 *
 * @author Faiz <faizulhaque@tenpearls.com>
 * @param ctx
 * @param notification
 * @param recipient
 * @returns {*}
 * @version 0.1
 */
function onTransmissionError(ctx, errorCode, notification, recipient) {
    return processNotification(notification).then(function(notificationObj) {
        ctx.onTransmissionError(client, errorCode, notificationObj, recipient);
    });
}

/**
 *
 * onConnected event
 *
 * @author Faiz <faizulhaque@tenpearls.com>
 * @param ctx
 * @param notification
 * @param recipient
 * @returns {*}
 * @version 0.1
 */
function onConnected(ctx, openSockets) {
    ctx.OnConnected(client, openSockets);
}

/**
 *
 * onError event
 *
 * @author Faiz <faizulhaque@tenpearls.com>
 * @param ctx
 * @param notification
 * @param recipient
 * @returns {*}
 * @version 0.1
 */
function onError(ctx, error) {
    ctx.OnError(client, error);
}

/**
 *
 * onDrain event
 * connection will be re-initilize whenever onDrain event fire from apple push notification server.
 * trick to stay alive always :)
 *
 * @author Faiz <faizulhaque@tenpearls.com>
 * @param ctx
 * @param notification
 * @param recipient
 * @returns {*}
 * @version 0.1
 */
function onDrain(ctx) {
    //Re-initializing,
    ctx.apn_connection = undefined;
    ctx.OnDrain(client);
}

/**
 *
 * onTimeOut event
 *
 * @author Faiz <faizulhaque@tenpearls.com>
 * @param ctx
 * @param notification
 * @param recipient
 * @returns {*}
 * @version 0.1
 */
function onTimeOut(ctx) {
    ctx.OnTimeOut(client);
}

/**
 *
 * onDisconnected event
 * connection will be re-initilize whenever onDrain event fire from apple push notification server.
 * trick to stay alive always :)
 *
 * @author Faiz <faizulhaque@tenpearls.com>
 * @param ctx
 * @param notification
 * @param recipient
 * @returns {*}
 * @version 0.1
 */
function onDisconnected(ctx, openSockets) {
    //Re-initializing,
    ctx.apn_connection = undefined;
    ctx.OnDisconnected(client, openSockets);
}

/**
 *
 * onSocketError event
 * connection will be re-initilize whenever onDrain event fire from apple push notification server.
 * trick to stay alive always :)
 *
 * @author Faiz <faizulhaque@tenpearls.com>
 * @param ctx
 * @param notification
 * @param recipient
 * @returns {*}
 * @version 0.1
 */
function onSocketError(ctx, socketError) {
    //Re-initializing,
    ctx.apn_connection = undefined;
    ctx.OnSocketError(client, socketError);
}

/**
 *
 * onFeedback event
 *
 * @author Faiz <faizulhaque@tenpearls.com>
 * @param ctx
 * @param notification
 * @param recipient
 * @returns {*}
 * @version 0.1
 */
function onFeedback(ctx, devices) {
    ctx.onFeedback(client, devices);
}

/**
 *
 * initialize and attach the apn feedBack event with context (ctx)
 *
 * @author Faiz <faizulhaque@tenpearls.com>
 * @param ctx
 * @param notification
 * @param recipient
 * @returns {*}
 * @version 0.1
 */
var initApnFeedback = function initApnFeedback(ctx, options) {
    ctx.apnFeedback = new Apn.Feedback(options);
    ctx.apnFeedback.on("feedback", function(devices) {
        onFeedback(ctx, devices);
    });
};

/**
 *
 * initialize and attach the apn with context (ctx)
 *
 * @author Faiz <faizulhaque@tenpearls.com>
 * @param ctx
 * @param notification
 * @param recipient
 * @returns {*}
 * @version 0.1
 */
var initApnSend = function initApnSend(ctx) {
    //if apn connection is undefined (on the very first connect or may be drain or disconnect
    if (!ctx.apn_connection) {
        var options = {};
        if (global.Environment === "production") {
            options = {
                "key": ctx.apn.prod_key,
                "cert": ctx.apn.prod_cert,
                "interval": 43200,
                "batchFeedback": true,
                "production": true
            };
        }
        else {
            options = {
                "key": ctx.apn.dev_key,
                "cert": ctx.apn.dev_cert,
                "interval": 43200,
                "batchFeedback": true,
                "production": false
            };
        }
        ctx.apn_connection = new Apn.Connection(options);
        ctx.apn_connection.on("transmissionError", function(errorCode, notification, recipient) {
            onTransmissionError(ctx, errorCode, notification, recipient);
        });
        ctx.apn_connection.on("transmitted", function(notification, recipient) {
            onTransmitted(ctx, notification, recipient);
        });
        ctx.apn_connection.on("connected", function(openSockets) {
            onConnected(ctx, openSockets);
        });
        ctx.apn_connection.on("error", function(error) {
            onError(ctx, error);
        });
        ctx.apn_connection.on("drain", function() {
            onDrain(ctx);
        });
        ctx.apn_connection.on("timeout", function() {
            onTimeOut(ctx);
        });
        ctx.apn_connection.on("disconnected", function(openSockets) {
            onDisconnected(ctx, openSockets);
        });
        ctx.apn_connection.on("socketError", function(socketError) {
            onSocketError(ctx, socketError);
        });
        delete options.gateway;
        initApnFeedback(ctx, options);
    }
    return ctx.apn_connection;
};

/**
 *
 * create notification payload based on provided on options
 *
 * @author Faiz <faizulhaque@tenpearls.com>
 * @param ctx
 * @param notification
 * @param recipient
 * @returns {*}
 * @version 0.1
 */
function buildPayload(options) {

    var payload = new Apn.Notification(options.payload);
    payload.expiry = options.expiry || 0;
    if (options.alert) { //
        payload.alert = options.alert;
    }
    else{
        payload.payload = {};
        payload.payload.smsg = options.data.message;
    }
    if (options.badge) {
        payload.badge = options.badge;
    }
    if (options.sound) {
        payload.sound = options.sound;
    }
    if (options.image) {
        payload["launch-image"] = options.image;
    }
    if (options.sqsmessage) {
        payload.sqsmessage = options.sqsmessage;
    }
    if (options.intl) {
        payload.intl = options.intl;
    }
    if (options.data) {
        if(payload.payload) {
            payload.payload.event_type = options.data.event_type;
        }
        else {
            payload.payload = {
                event_type: options.data.event_type
            };
        }
        if (options.data.identifier) {
            payload.payload.identifier = options.data.identifier;
        }
        if(options.data.extras && _.size(options.data.extras) > 0) {
            for(var key in options.data.extras) {
                payload.payload[key] = options.data.extras[key];
            }
        }
    }
    payload["content-available"] = 1;
    payload["contentAvailable"] = 1;
    return payload;
}

/**
 *
 * send the notificaiton payload with token to apn
 *
 * @author Faiz <faizulhaque@tenpearls.com>
 * @param ctx
 * @param notification
 * @param recipient
 * @returns {*}
 * @version 0.1
 */
function push(ctx, tokens, payload) {
    var sender = initApnSend(ctx);
    sender.pushNotification(payload, tokens);
}

/**
 *
 * construction with certificate path
 *
 * @author Faiz <faizulhaque@tenpearls.com>
 * @param ctx
 * @param notification
 * @param recipient
 * @returns {*}
 * @version 0.1
 */
function Ios(dev_key_path, dev_cert_path, prod_key_path, prod_cert_path) {
    this.apn = {
        prod_key: prod_key_path,
        prod_cert: prod_cert_path,
        dev_key: dev_key_path,
        dev_cert: dev_cert_path
    };
}

/************************Exposed function of library************************/
Ios.prototype.send = function(devices, data, is_silent) {
    var self = this;
    var _message = data.message || null,
        _soundFile = data.sound_file || "beep.wav",
        _iconFile = data.icon_file || null,
        _data = data;

    var iosDevices = _.filter(devices, function(device) {
        if (device.platform && (device.platform.toLowerCase() === "iphone" || device.platform.toLowerCase() === "ios" || device.platform.toLowerCase() === "apple") && _.size(device.push_token) > 0) {
            return true;
        }
        else {
            return false;
        }
    });

    // Need to take unique set as push_token persists across install/uninstalled but device ID changes
    var iosTokens = _.unique(_.pluck(iosDevices, "push_token"));

    //we are only to push if there are valid devices
    if (iosTokens.length > 0) {
        //registering one callback per Notification ID
        var options = {
            alert: (!is_silent) ? _message : null,
            sound: (!is_silent) ? _soundFile : null,
            image: _iconFile,
            data: _data
        };
        //not_payload is object which will be return on events.
        if(data.not_payload) {
            options.intl = Epoch.now();
            CacheObj.set(options.intl, data.not_payload);
        }
        var notificationPayload = buildPayload(options);
        push(self, iosTokens, notificationPayload);
        //global.Trace.write(data.to_id, "push sent to user", notificationPayload, null);
        return;
    }
    return;
};
Ios.prototype.onFeedback = function onFeedback() {}; //for lintFix, in params: devices
Ios.prototype.onTransmitted = function onTransmitted() {}; //for lintFix, in params: notification, recipient
Ios.prototype.onTransmissionError = function onTransmissionError() {}; //for lintFix, in params: errorCode, notification, recipient
Ios.prototype.OnConnected = function OnConnected() {}; //for lintFix, in params: openSockets
Ios.prototype.OnError = function OnError() {}; //for lintFix, in params: error
Ios.prototype.OnDrain = function OnDrain() {};
Ios.prototype.OnTimeOut = function OnTimeOut() {};
Ios.prototype.OnDisconnected = function OnDisconnected() {}; //for lintFix, in params: openSockets
Ios.prototype.OnSocketError = function OnSocketError() {}; //for lintFix, in params: socketError
/************************Exposed function of library************************/

module.exports = Ios;