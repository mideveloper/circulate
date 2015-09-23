var Ios = require("./lib/ios"),
    Android = require("./lib/android");

function Notification() {
    //initilize the client var
    this.clients = {};
}

function onTransmitted(ctx, client, notificationObj, recipient) {
    ctx.onTransmitted(client, notificationObj, recipient);
}

function onTransmissionError(ctx, client, errorCode, notificationObj, recipient) {
    ctx.onTransmissionError(client, errorCode, notificationObj, recipient);
}

Notification.prototype.setupIOSClient = function setupIOSClient(
    dev_key_path, dev_cert_path, prod_key_path, prod_cert_path, prod_pass_phrase, stg_pass_phrase) {
    var self = this;
    self.clients.ios = new Ios(dev_key_path, dev_cert_path, prod_key_path, prod_cert_path, prod_pass_phrase, stg_pass_phrase);
    self.clients.ios.onTransmitted = function (client, notificationObj, recipient) {
        onTransmitted(self, client, notificationObj, recipient);
    };
    self.clients.ios.onTransmissionError = function (client, errorCode, notificationObj, recipient) {
        onTransmissionError(self, client, errorCode, notificationObj, recipient);
    };
};

Notification.prototype.setupAndroidClient = function setupAndroidClient(api_key) {
    var self = this;
    self.clients.android = new Android(api_key);
    self.clients.android.onTransmitted = function (client, notificationObj, recipient) {
        onTransmitted(self, client, notificationObj, recipient);
    };
    self.clients.android.onTransmissionError = function (client, errorCode, notificationObj, recipient) {
        onTransmissionError(self, client, errorCode, notificationObj, recipient);
    };
};

Notification.prototype.send = function send(devices, data, is_silent) {
    var self = this;
    if(Object.getOwnPropertyNames(self.clients).length === 0){
        throw new Error("clients list is empty.");
    }
    for(var k in self.clients) {
        self.clients[k].send(devices, data, is_silent);
    }
};

/**
 *
 * Generic event for caller to override
 * when transmission is successfully on any client, this event will be fired.
 * client is attached so that caller will know transmission is successfully from which client
 *
 * @author Faiz <faizulhaque@tenpearls.com>
 * @param client
 * @param notificationObj
 * @param recipient
 * @version 0.1
 */
Notification.prototype.onTransmitted = function onTransmitted(client, notificationObj, recipient) {};

/**
 *
 * Generic event for caller to override
 * when transmission error on any client, this event will be fired.
 * client is attached so that caller will know transmission is unsuccessfully from which client
 *
 * @author Faiz <faizulhaque@tenpearls.com>
 * @param client
 * @param notificationObj
 * @param recipient
 * @version 0.1
 */
Notification.prototype.onTransmissionError = function onTransmissionError(client, errorCode, notificationObj, recipient) {};

module.exports = Notification;
