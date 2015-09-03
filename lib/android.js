var _ = require("lodash"),
    Promise = require("bluebird"),
    Gcm = require("node-gcm"),
    Epoch = require("./epoch"), //will be replace with oyster-utils
    CacheObj = require("ephemeral").initialize({
        client: "local"
    }),
    client = "android";

function Android(api_key) {
    this.api_key = api_key;
}

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
                }
                return resolve(notification);
            });
        }
        else {
            return resolve(notification);
        }
    });
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
function onError(ctx, intl, error) {
    return processNotification(intl).then(function(notPayload) {
        ctx.onTransmissionError(client, notPayload, error);
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
function onTransmitted(ctx, intl, notification, recipient) {
    return processNotification(intl).then(function(notPayload) {
        ctx.onTransmitted(client, notification, notPayload, recipient);
    });
}

function buildPayload(data) {
    var message = {};
    message.priority = data.priority || "high"; //default
    message.contentAvailable = data.contentAvailable || true; //default
    message.delayWhileIdle = data.delayWhileIdle || true; //default
    message.timeToLive = data.timeToLive || 3; //default
    if(data.message) {
        message.notification = {
            body: data.message
        };
        if(data.title) {
            message.notification.title = data.title;
        }
        if(data.title) {
            message.notification.title = data.title;
        }
        if(data.icon_file) {
            message.notification.icon = data.icon_file;
        }
    }
    message.data = {};
    if(data.event_type) {
        message.data.event_type = data.event_type;
    }
    if (data.identifier) {
        message.data.identifier = data.identifier;
    }
    if(data.extras && _.size(data.extras) > 0) {
        for(var key in data.extras) {
            message.data[key] = data.extras[key];
        }
    }
    return new Gcm.Message(message);
}

function  initGcmSend(ctx) {
    if(!ctx.gcm_connection) {
        ctx.gcm_connection = new Gcm.Sender(ctx.api_key);
    }
    return ctx.gcm_connection;
}

function push(ctx, tokens, payload, intl) {
    var sender = initGcmSend(ctx);
    sender.send(payload, tokens, function(err, response){
        if(err) {
            onError(ctx, err);
        }
        else {
            if(response && response.success > 0) {
                onTransmitted(ctx, {intl: intl}, response.results, null);
            }
            else {
                onError(ctx, {intl: intl}, response.results);
            }
        }
    });
}

Android.prototype.send = function send(devices, data) {
    var self = this;

    var androidDevices = _.filter(devices, function(device) {
        if (device.platform && device.platform.toLowerCase() === "android" && _.size(device.push_token) > 0) {
            return true;
        }
        else {
            return false;
        }
    });

    // Need to take unique set as push_token persists across install/uninstalled but device ID changes
    var androdTokens = _.unique(_.pluck(androidDevices, "push_token"));

    //we are only to push if there are valid devices
    if (androdTokens.length > 0) {
        //registering one callback per Notification ID
        //not_payload is object which will be return on events.
        var options = {
            intl: Epoch.now()
        };
        if(data.not_payload) {
            CacheObj.set(options.intl, data.not_payload);
        }
        var notificationPayload = buildPayload(data);
        push(self, androdTokens, notificationPayload, options.intl);
        //global.Trace.write(data.to_id, "push sent to user", notificationPayload, null);
        return;
    }
    return;
};

Android.prototype.onTransmitted = function onTransmitted() {}; //for lintFix, in params: notification, recipient
Android.prototype.onTransmissionError = function onTransmissionError() {}; //for lintFix, in params: errorCode, notification, recipient
/************************Exposed function of library************************/

module.exports = Android;