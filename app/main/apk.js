import store from "../configs/settings";
import utils from "../utils";
import path from 'path';
import pFun from 'p-fun';
import fs from 'fs';

function getXray() {
    let XRay = require('x-ray');
    return XRay();
}

/**
 * 通过App名字搜索得到App的appId
 * @param searchAppName
 * @returns {Promise<unknown>}
 */
export function searchMiApp(searchAppName) {
    let searchUrl = 'http://app.mi.com/search?keywords=' + encodeURI(searchAppName);

    return new Promise((resolve, reject) => {
        let xray = getXray();
        xray(searchUrl, '.applist a@href')(function(err, href) {
            // http://app.mi.com/details?id=com.oray.peanuthull&ref=search
            if(err){
                reject(err);
            }else{
                let myURL = new URL(href);
                let appId = myURL.searchParams.get('id');
                console.log('查询[' + searchAppName + ']App对应的应用ID为[' + appId + ']');
                resolve(appId);
            }
        })
    });
}

/**
 * 通过appId下载apk
 * @param appId
 * @param appName 指定名称后，保存时会使用
 * @returns {Promise<unknown>}
 */
export function downloadMiApp(appId, appName){
    let detailUrl = 'http://app.mi.com/details?id=' + appId;

    return new Promise((resolve, reject) => {
        let xray = getXray();
        xray(detailUrl, ['ul.cf li'])(function(err, idAndNum) {
            // ["com.oray.peanuthull", "428716"]
            if(err){
                reject(err);
            }else{
                let version = '', numId = '';
                for(let i = 0; i < idAndNum.length; i = i + 2){
                    let key = idAndNum[i], value = idAndNum[i + 1];
                    if(key.startsWith('版本号')){
                        version = value;
                    }else if(key.startsWith('appId')){
                        numId = value;
                    }
                }

                // 下载App resolve(appId);
                let apkUrl = 'http://app.mi.com/download/' + numId + '?id=' + appId;
                appName = appName === undefined || appName == null ? '' : appName;
                let apkPath = utils.getApkFolder(), apkFile = /*appName + */appId + '-' + version + '.apk';
                let apkFilePath = path.join(apkPath, apkFile);

                if(!fs.existsSync(apkFilePath)) {
                    utils.downloadLarge(apkUrl, apkFilePath).then(file => {
                        console.log('Apk[' + appName + ']下载成功，版本[' + version + ']，保存路径:' + file);
                        resolve(file);
                        setStore(appId, appName, apkFile, version);
                    }).catch(err => {
                        reject(err);
                    })
                }else{
                    console.log('Apk已存在，查询版本与本地相同，均为[' + version + ']，无需更新：' + apkFilePath);
                    resolve(apkFilePath);
                    setStore(appId, appName, apkFile, version);
                }
            }
        })
    });
}

function setStore(appId, appName, apkFile, version) {
    store.set('APK.' + appId + '.NAME', appName);
    store.set('APK.' + appId + '.FILE', apkFile);
    store.set('APK.' + appId + ".VER", version);
    store.set('APK.' + appId + ".STATUS", true);
}
/**
 * 通过appId下载apk
 * @param appId
 * @returns {Promise<unknown>}
 */
export function downloadMiAppByName(appName){
    return new Promise((resolve, reject) => {
        searchMiApp(appName).then(appId => {
            downloadMiApp(appId, appName).then(filePath => {
                resolve(filePath);
            }).catch(err => {
                reject(err);
            })
        }).catch(err => {
            reject(err);
        })
    })
}

/**
 * 下载常用Apk
 */
export function downloadCommonApk(){
    let waitInterval = 2000, waitMinutes = 30;
    pFun.waitFor(() => store.get('MODULE.x-ray'), {
        interval: waitInterval,
        timeout: waitMinutes * 60 * 1000
    }).then(() => {
        // downloadMiAppByName('花生壳管理');
        downloadMiApp('com.oray.peanuthull', '花生壳管理');

        // downloadMiAppByName('微信');
        downloadMiApp('com.tencent.mm', '微信');

        // downloadMiAppByName('轻启动');
        downloadMiApp('com.wpengapp.lightstart', '轻启动');

        // WTF?
        // https://boards.4chan.org/hm/thread/2098156/chris-evans-dick-pic

        // 测试蓝奏云文件下载
        /*utils.downloadLanzousApk('https://www.lanzous.com/i8rc3vg', 'com.wpengapp.lightstart', '轻启动', 'test').then((filePath) => {
            setStore('com.wpengapp.lightstart', '轻启动', path.basename(filePath), 'test');
        });*/

    }).catch(e => {
        console.log('拟自动下载Apk文件，但等待x-ray模块安装时超过超时时间[' + waitMinutes + ']分钟：' + e);
    });
}

