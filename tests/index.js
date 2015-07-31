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
        console.log("init");
    });

    after(function() {});

    it("sendNotification", function(done) {
        notification.send([{ push_token : "451ab39906586624fee62cf0546befa904b73306645318687eb4790b5f52ebb1", platform : "iphone"}], { message : "this is new message"});
        setTimeout(function () {
            console.log("its done");
            done();
        }, 5000);
    });

});
