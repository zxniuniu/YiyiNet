function getMajorVerison() {
    var e = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)
    return e ? parseInt(e[2], 10) : !1
}

function stopWebRtc() {
    if (getMajorVerison() > 47)
        try {
            chrome.privacy.network.webRTCIPHandlingPolicy.set({
                value: "disable_non_proxied_udp"
            })
        } catch (e) {
            console.log("Error: " + e.message)
        }
    else if (getMajorVerison() > 41 && getMajorVerison() < 47)
        try {
            chrome.privacy.network.webRTCMultipleRoutesEnabled.set({
                value: !1,
                scope: "regular"
            })
        } catch (e) {
            console.log("Error: " + e.message)
        }
    else if (47 == getMajorVerison())
        try {
            chrome.privacy.network.webRTCMultipleRoutesEnabled.set({
                value: !1,
                scope: "regular"
            }),
                chrome.privacy.network.webRTCNonProxiedUdpEnabled.set({
                    value: !1,
                    scope: "regular"
                })
        } catch (e) {
            console.log("Error: " + e.message)
        }
}

function startWebRtc() {
    if (getMajorVerison() > 47)
        try {
            chrome.privacy.network.webRTCIPHandlingPolicy.set({
                value: "default_public_and_private_interfaces"
            })
        } catch (e) {
            console.log("Error: " + e.message)
        }
    else if (getMajorVerison() > 41 && getMajorVerison() < 47)
        try {
            chrome.privacy.network.webRTCMultipleRoutesEnabled.set({
                value: !0,
                scope: "regular"
            })
        } catch (e) {
            console.log("Error: " + e.message)
        }
    else if (47 == getMajorVerison())
        try {
            chrome.privacy.network.webRTCMultipleRoutesEnabled.set({
                value: !0,
                scope: "regular"
            }),
                chrome.privacy.network.webRTCNonProxiedUdpEnabled.set({
                    value: !0,
                    scope: "regular"
                })
        } catch (e) {
            console.log("Error: " + e.message)
        }
}

function clientFun() {
    this.init = function (e) {
        $.ajax({
            url: "https://astarvpn.center/astar/NewVPN/getProxyList?" + (new Date).getTime(),
            type: "post",
            dataType: "json",
            data: {
                strP: chrome.runtime.id
            },
            success: function (o) {
                var t = CryptoJS.enc.Utf8.parse(hex_md5(o.s).substring(0, 16))
                    , r = CryptoJS.AES.decrypt(o.d, t, {
                    mode: CryptoJS.mode.ECB,
                    padding: CryptoJS.pad.Pkcs7
                })
                    , n = "" + CryptoJS.enc.Utf8.stringify(r)
                    , c = $.parseJSON(n)
                if (0 != c.nCode)
                    return localStorage.state = "0",
                        localStorage._click = "1",
                        chrome.browserAction.setBadgeBackgroundColor({
                            color: "#FFFFFF"
                        }),
                        chrome.browserAction.setBadgeText({
                            text: ""
                        }),
                        server.req({
                            n: 0
                        }),
                        void console.info("service exception")
                localStorage._sl = JSON.stringify(c.jsonObject),
                    localStorage._s = o.s
                var i = localStorage.state
                return void 0 == i ? void (void 0 != e && null != e && server.req({
                    n: e
                })) : "0" == i ? void (void 0 != e && null != e && server.req({
                    n: e
                })) : (p.exceptionNumber = 0,
                    void client.getProxy())
            },
            error: function () {
                console.info("service net exception")
            }
        })
    }
        ,
        this.getProxy = function () {
            var e = localStorage._s
            if (void 0 != e) {
                var o = localStorage._i
                void 0 != o && $.ajax({
                    url: "https://astarvpn.center/astar/NewVPN/getProxy?" + (new Date).getTime(),
                    type: "post",
                    dataType: "json",
                    data: {
                        strP: chrome.runtime.id,
                        strtoken: e,
                        lid: o
                    },
                    success: function (e) {
                        var t = CryptoJS.enc.Utf8.parse(hex_md5(e.s).substring(0, 16))
                            , r = CryptoJS.AES.decrypt(e.d, t, {
                            mode: CryptoJS.mode.ECB,
                            padding: CryptoJS.pad.Pkcs7
                        })
                            , n = "" + CryptoJS.enc.Utf8.stringify(r)
                            , c = $.parseJSON(n)
                        if (102 != c.nCode)
                            return localStorage.state = "0",
                                localStorage._click = "1",
                                chrome.browserAction.setBadgeBackgroundColor({
                                    color: "#FFFFFF"
                                }),
                                chrome.browserAction.setBadgeText({
                                    text: ""
                                }),
                                server.req({
                                    n: 0
                                }),
                                void console.info("proxy line exception,please select other proxy line.")
                        p.on(c.jsonObject),
                            localStorage._click = "1",
                            server.req({
                                n: 1
                            })
                        var i = localStorage._sl
                        if (void 0 != i) {
                            for (var c = JSON.parse(i), s = 0; s < c.d.length; s++)
                                void 0 == o ? 0 == s && (chrome.browserAction.setBadgeBackgroundColor({
                                    color: [16, 201, 33, 100]
                                }),
                                    chrome.browserAction.setBadgeText({
                                        text: c.d[s].p.replace(".png", "")
                                    })) : c.d[s].i == o && (chrome.browserAction.setBadgeBackgroundColor({
                                    color: [16, 201, 33, 100]
                                }),
                                    chrome.browserAction.setBadgeText({
                                        text: c.d[s].p.replace(".png", "")
                                    }))
                            p.exceptionState = 0
                        }
                    },
                    error: function () {
                        console.info("service net exception")
                    }
                })
            }
        }
        ,
        this.timeSend = function () {
        }
}

function serverFun() {
    this.req = function (e) {
        var o = chrome.extension.getViews({
            type: "popup"
        })
        o.length > 0 && o[0].popup.backgroundEvent(e)
    }
        ,
        this.init = function () {
            chrome.runtime.onMessage.addListener(function (e, o, t) {
                404 == e.n && (p.off(),
                    localStorage.state = "0",
                    localStorage._click = "1",
                    chrome.browserAction.setBadgeBackgroundColor({
                        color: "#FFFFFF"
                    }),
                    chrome.browserAction.setBadgeText({
                        text: ""
                    }),
                    client.init(4)),
                200 == e.n && (localStorage.state = "1",
                    client.init()),
                202 == e.n && client.init(2),
                    t({
                        caback: "ok"
                    })
            })
        }
        ,
        this.popupEvent = function (e) {
            404 == e && (p.off(),
                localStorage.state = "0",
                localStorage._click = "1",
                chrome.browserAction.setBadgeBackgroundColor({
                    color: "#FFFFFF"
                }),
                chrome.browserAction.setBadgeText({
                    text: ""
                }),
                client.init(4)),
            200 == e && (localStorage.state = "1",
                client.init()),
            202 == e && client.init(2)
        }
}

function pFun() {
    this.exceptionState = 0,
        this.exceptionNumber = 0,
        this.d = {},
        this.on = function (e) {
            try {
                var o = CryptoJS.enc.Utf8.parse(hex_md5(e._p).substring(0, 16))
                    , t = CryptoJS.AES.decrypt(e._s, o, {
                    mode: CryptoJS.mode.ECB,
                    padding: CryptoJS.pad.Pkcs7
                })
                    , r = {
                    mode: "pac_script",
                    pacScript: {
                        data: "" + CryptoJS.enc.Utf8.stringify(t),
                        mandatory: !0
                    }
                }
                chrome.proxy.settings.set({
                    value: r,
                    scope: "regular"
                }, function () {
                })
            } catch (n) {
                console.info(n)
            }
        }
        ,
        this.off = function () {
            var e = {
                mode: "direct"
            }
            chrome.proxy.settings.set({
                value: e
            }, function () {
            })
        }
        ,
        this.init = function () {
            chrome.proxy.settings.get({
                incognito: !1
            }, function (e) {
                "controlled_by_this_extension" == e.levelOfControl ? p.off() : "controllable_by_this_extension" == e.levelOfControl || ("controlled_by_other_extensions" == e.levelOfControl ? console.info("Another proxy is uesing.") : "not_controllable" == e.levelOfControl && console.info("Proxy is not supported.")),
                    client.init()
            }),
                chrome.permissions.contains({
                    permissions: ["privacy"]
                }, function (e) {
                    e ? (stopWebRtc(),
                        localStorage.webRtcState = "1") : localStorage.webRtcState = "2"
                })
        }
}

var client = new clientFun
    , server = new serverFun
    , p = new pFun
p.init()
