import store from "../configs/settings";

// 获取说明，首先在Chrome浏览器中加载Astar VPN插件，点击插件图标审查元素，运行代码即可
// 插件地址 https://chrome.google.com/webstore/detail/astar-vpn-free-and-fast-v/jajilbjjinjmgcibalaakngmkilboobh

/*function decrypt(s, d) {
    let CryptoJS = require('crypto-js');
    let t = CryptoJS.enc.Utf8.parse(hex_md5(s).substring(0, 16));
    // let t = CryptoJS.enc.Utf8.parse(CryptoJS.MD5(s).toString().substring(0, 16));
    let r = CryptoJS.AES.decrypt(d, t, {mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7});
    return "" + CryptoJS.enc.Utf8.stringify(r);
}

function getAstarVpn() {
    let extId = 'jajilbjjinjmgcibalaakngmkilboobh'; // 扩展ID，不可变更
    let proxyUrl = 'https://astarvpn.center/astar/NewVPN/';
    $.ajax({
        url: proxyUrl + "getProxyList?" + (new Date).getTime(),
        type: "post",
        dataType: "json",
        data: {
            strP: extId
        },
        success: function (o) {
            // {"s":"891c6bac1df74cf1ad94f9262b237641","d":"YOYBxrhyOELb6bExv8Jhbyo4NblNGpbvGahkKI0zh/mYL0g/gWIPlUVYVFTwsGZEC96HWOOLUqmZ0meDZwUD2S+ojjNeouEaeVgS9dPWvykrEFRWRnHlVCQtkLV20gEivA4JW7+RyA76OWjJrzu4ax/VRCAJEXCsXGMOgeAC70BwCljIYlq4ufWybi5shSLG8Oys3vf8knls6ktwICJcpZPh1lfIx6m6Xdi7JrTdmZ3xSf7kQKnOc/2uRkASRtVrnfKZ86BXiCqU4IoBBWl20FsjkVPa8VV3NWWaKzJ7n4akng1yCpH4woyiMkB+jzn+wLAu78GOvkrtulUHOU/IZkQzF4Mi7H0Iv0+CVXFlrqfQrD9pJTYh90iRYCHDKh8lPH/aDiREF0OJ98Uue1ROT2iC5l8gZ+TToFpKKjl0e1BGMRfQ31pSvWHxajrMKfHG/T7R9KJJmQ30qvvdf9yybw6njNJf3RresgIvkpdQ5+Zjlv28+9EZe4qXWDvKp5RaRHs4IurwqbXd7JIiesma5GVxsuyepaxc4RAY+j7XYkLp1iD3X12DtNlWz10Nd0aagKHkxq87l2NCjPpKGRjgzySH6PYV9d79E/BJ7aENm3QqJZ0fg821hvcRvBb1OQp7Y0QyKd2giy+Nx2vYYTDMFDaPKVWRBRgGa3WCXMcmrImvepBgjt1cCJwDJJC9Kvw+GsWgL+nFaDPNow4fUQ05thei8uTV0pweOJNeDA+Yy28="}
            let c = JSON.parse(decrypt(o.s, o.d));
            if (0 !== c.nCode) {
                console.info("service exception")
            }

            let _sl = c.jsonObject;
            let strtoken = o.s;
            let di = _sl.d.map(d => d.i);

            console.log(JSON.stringify(_sl));

            di.forEach(lid => {
                let country = _sl.d.filter(d => d.i === lid)[0].n;
                // console.log("country: " + country + ", lid: " + lid);

                $.ajax({
                    url: proxyUrl + "getProxy?" + (new Date).getTime(),
                    type: "post",
                    dataType: "json",
                    data: {
                        strP: extId,
                        strtoken: strtoken,
                        lid: lid
                    },
                    success: function (data) {
                        // data = {"s":"891c6bac1df74cf1ad94f9262b237641","d":"YOYBxrhyOELb6bExv8JhbxHgPhO95IgZ9lAXOOVL6/+3q2P15LCe4bKge2nAPeOR0wJY3awELWqoQAsEgX6lJdhYdgM773mIckRwJgF3rT9FX74byJS6fvOn7pIQgf+sdBfrZaT7rUCPzu28B3Ls0hljHAtYWBvnxNMS8JLNMHjAc0zNje2npmSexrkIJLwRtyziEdRCx8WYTxxAyWeWlL+xQYhRXXm2wOivntF5HsEausQlfnnqWYbKTfdhxs8JhjG5lrq7MsmJ0bmXS+CX4EWWjMLQ0RGsnB/aTkqjp01cSrkgRwiEBCXWRo5RHMDa1s+/xJIpb1YC7iQpVNDrmrmbzOKjHnW1rmVCBsKtT/GqmgVxq1q+MEhcky5BkU29q3LDMRol7Jff7CZhrPoeMsWDNnjLxP3VXLX+lYf3oQqh0TPaLxLoF9aJuKmSM8xo7fhK+6/ZfI+cL/HLF3fbTxMGRaExUxLIGfqQY2LDIm6efme+VCTv5H/0+TWx5920QPmSTHfP079WDs1LJMJaamVmRHXGRBI6nUt9wcUC79J4nN6zuRyzjl4LvQy3KTJm7z1ZjOA1NvoIK9HSVTl48tgdd8JHZOGQYQvyRiLOJfs4qYI66l4IFjz2Ngbm0b3S"};
                        let c = JSON.parse(decrypt(data.s, data.d));
                        if (102 != c.nCode) {
                            console.info("proxy line exception,please select other proxy line.")
                        }

                        var obj = c.jsonObject;
                        let fund = decrypt(obj._p, obj._s);
                        // var FindProxyForURL = function(url, host){var blackList = new Array('192.168.*','127.0.0.1','134.209.63.251','astarvpn.center','*.douyu.com');for(var i = 0;i < blackList.length; i++){if(shExpMatch(host,blackList[i])) return 'DIRECT';}return 'HTTPS uk.cn-cloudflare.com:443';}
                        var r = {mode: "pac_script", pacScript: {data: fund, mandatory: !0}};
                        console.log("country: " + country + ", lid: " + lid + ', proxy:' + fund);
                    },
                    error: function (er) {
                        console.info("service net exception: " + er)
                    }
                })
            });
        },
        error: function (err) {
            console.info("service net exception: " + err)
        }
    })
}
getAstarVpn();*/

export function saveAstarVpn() {
    let vpnList = {
        'Los Angeles.US': 'usa.cn-cloudflare.com',
        'Singapore': 'sg1.cn-cloudflare.com',
        'Canada': 'ca.cn-cloudflare.com',
        'France': 'fr.cn-cloudflare.com',
        'Poland': 'pl.cn-cloudflare.com',
        'Japan': 'jp.cn-cloudflare.com',
        'Netherlands': 'nl.cn-cloudflare.com',
        'United Kingdom': 'uk.cn-cloudflare.com',
        'Germany': 'de.cn-cloudflare.com',
        'India': 'in1.cn-cloudflare.com',
        'Australia': 'au2.cn-cloudflare.com'
    };
    store.set('ASTAR', vpnList);
}
