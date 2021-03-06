import path from "path";
import store from './../configs/settings';
import fs from 'fs';
import utils from "../utils";

export function puppeteerCoreInstallFinishEvent(moduleStr, version) {
    downloadChrome();

    downloadFirefox();
}

/**
 * 下载Chrome
 * @returns {Promise<void>}
 */
function downloadChrome() {
    // 下载Chrome
    let chromeFilePath = utils.getChromeFilePath();
    if (!fs.existsSync(chromeFilePath)) {
        downloadBrowser(chromeFilePath, 'chrome');
    } else {
        store.set('TOOLS.CHROME_STATUS', true);
    }
}

/**
 * 下载Firefox浏览器
 * @returns {Promise<void>}
 */
function downloadFirefox() {
    // 下载Firefox
    let firefoxFilePath = utils.getFirefoxFilePath();
    if (!fs.existsSync(firefoxFilePath)) {
        downloadBrowser(firefoxFilePath, 'firefox');
    } else {
        store.set('TOOLS.FIREFOX_STATUS', true);
    }
}

/**
 * 采用browserFetcher下载
 * @param exePath
 * @param type
 */
async function downloadBrowser(exePath, type) {
    let isFirefox = type.toLowerCase() === 'firefox';
    type = isFirefox ? 'Firefox' : 'Chrome';
    let puppeteer = require('puppeteer-core');

    let host = isFirefox ? (await utils.fastMozillaUrl()) + '/pub/firefox/nightly/latest-mozilla-central' : (await utils.fastNpmUrl());
    let browserFetcher = puppeteer.createBrowserFetcher({
        path: utils.getUserData(),
        host: host,
        product: type.toLowerCase() // chrome, firefox
    });

    let storeKey = isFirefox ? 'FIREFOX_VER' : 'CHROME_REVISION';
    let storeVer = store.get('TOOLS.' + storeKey, 0);
    if (isFirefox) {
        storeVer = storeVer === 0 ? utils.packageJson().firefoxVer.version : storeVer;
    } else {
        // 也可以使用代理获取 http://omahaproxy.appspot.com/deps.json?version=85.0.4183.86
        let chromeRevisionJson = utils.packageJson().chromiumVer.version.split('&')[1];
        storeVer = '' + Math.max(chromeRevisionJson, storeVer);
    }
    store.set('TOOLS.' + storeKey, storeVer);

    let logSecondInterval = 10; // 10秒输出一次下载进度
    let startDate = Date.now(), curDate = Date.now();
    // let canDownload = await browserFetcher.canDownload(firefoxRevision);
    browserFetcher.download(storeVer, (downloadedBytes, totalBytes) => {
        if (Date.now() - startDate >= logSecondInterval * 1000) {
            let speed = (downloadedBytes / 1024 / (Date.now() - curDate) * 1000).toFixed(2);
            console.log('正在下载[' + type + ']，完成[' + (100 * downloadedBytes / totalBytes).toFixed(2) + '%]，当前['
                + (downloadedBytes / 1024 / 1024).toFixed(2) + '/' + (totalBytes / 1024 / 1024).toFixed(2) + ']M，'
                + '速度[' + speed + 'Kb/S]，预计还需[' + ((totalBytes - downloadedBytes) / 1024 / speed / 60).toFixed(2) + ']分钟');
            startDate = Date.now();
        }
    }).then(revisionInfo => {
        // console.dir(revisionInfo);
        utils.moveFolder(path.dirname(revisionInfo.executablePath), path.dirname(exePath)).then(err => {
            if (err) {
                return console.error(err);
            } else {
                store.set('TOOLS.' + type.toUpperCase() + '_STATUS', true);
                console.log('浏览器[' + type + ']下载成功，链接：' + revisionInfo.url);

                utils.removeFolder(revisionInfo.folderPath).then(() => {
                });
            }
        })
    }).catch(err => {
        console.error(err);
    });

}

async function testChrome() {
    let puppeteer = require('puppeteer-core');
    let browser = await puppeteer.launch({
        headless: false,
        executablePath: utils.getChromeFilePath(),
        product: 'chrome'
    });
    return browser;
}


