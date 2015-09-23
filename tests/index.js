var chai = require("chai"),
     chaiAsPromised = require("chai-as-promised"),
    path = require("path");

chai.use(chaiAsPromised);

describe("Notification", function() {
    this.timeout(15000);
    var Notification = require("../index"), notification;
    before(function() {

        notification = new Notification();
        global.RootPath = path.resolve("");
        var key = global.RootPath + "/tests/assets/key.pem";
        var cert = global.RootPath + "/tests/assets/cert.pem";
        var prodPassPhrase = "10Pearls";
        var stgPassPhrase = "10Pearls";
        notification.setupIOSClient(key,cert,key,cert,prodPassPhrase,stgPassPhrase);
        var apiKey = "please you api key here";
        notification.setupAndroidClient(apiKey);

        notification.onTransmitted = function onTransmitted() {
            console.log("onTransmitted", JSON.stringify(arguments));
        };

        notification.onTransmissionError = function onTransmissionError() {
            console.log("onTransmissionError", arguments);
        };

        console.log("init");
    });

    after(function() {});

    it("sendNotificationAPN", function(done) {
        notification.send([{ push_token : "451ab39906586624fee62cf0546befa904b73306645318687eb4790b5f52ebb1", platform : "iphone"}], { message : "this is new message"});
        setTimeout(function () {
            done();
        }, 5000);
    });

    it("sendNotificationGCM", function(done) {
        var push_token = "eg54Hko_H0A:APA91bH_OOXXmffIBusKXvIaDKzDIqXEzEQZ-rly_Ujysud-fOSMZ4L1gHteAvam765DDcFv3RMy7ojagNBO5ipkyY-S81KqFUwNrm1BUhhVqxNj13t9LhgVbxpk-cn6e4S1agRtNRbR";
        notification.send([{push_token : push_token,platform : "android"}], { message : "from nodeJS Application 3 with icon/title", title: "nodeJS", icon: "icon", not_payload: {extra: "sdfsdf"}});
        setTimeout(function () {
            done();
        }, 5000);
    });

});
