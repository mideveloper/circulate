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
        notification.setupIOSClient(key,cert,key,cert);
        var apiKey = "AIzaSyDQYDoblHHlcT8p6E6cfsMDlNAOYTX6QY4";
        notification.setupAndroidClient(apiKey);

        notification.onTransmitted = function onTransmitted() {
            console.log("its done android");
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

        notification.send([{push_token : "eg54Hko_H0A:APA91bFESaL7T_wBOrGePKhRm7NGkmpxkyP3SZffOH9HsixhJryEIc8OZpbBY69q0ccU5MW7y0cTX9ghUDJBxK-TV3Ft9ZDcLaK6FJGQAcjr1QCnSMItX-rk4Kp4ig2KI7ixsim6ZLV9",platform : "android"}], { message : "this is new message"});
        setTimeout(function () {
            done();
        }, 5000);

    });

});
