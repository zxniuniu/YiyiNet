import path from "path";
import store from './../configs/settings';
import fse from 'fs-extra';

import {getChromeFilePath, getFirefoxFilePath, getUserData, packageJson} from "../utils";

export function puppeteerCoreInstallFinishEvent(moduleStr, version) {
    downloadChrome();

    downloadFirefox();
}

/**
 * 下载Chrome
 * @returns {Promise<void>}
 */
async function downloadChrome() {
    // 下载Chrome
    let chromeFilePath = getChromeFilePath();
    if (!fse.existsSync(chromeFilePath)) {
        let puppeteer = require('puppeteer-core');
        let browserFetcher = puppeteer.createBrowserFetcher({
            path: getUserData(),
            host: 'https://npm.taobao.org/mirrors', // https://cnpmjs.org/mirrors/
            product: 'chrome' // chrome, firefox
        });

        // 也可以使用代理获取 http://omahaproxy.appspot.com/deps.json?version=85.0.4183.86
        let chromeVerArr = packageJson().chromiumVer.version.split('&');
        let chromeRevisionJson = chromeVerArr[1];
        let chromeRevisionStore = store.get('TOOLS.CHROME_REVISION', 0);
        let chromeRevision = '' + Math.max(chromeRevisionJson, chromeRevisionStore);
        store.set('TOOLS.CHROME_REVISION', chromeRevision);

        // let canDownload = await browserFetcher.canDownload(chromeRevision);
        downloadBrowser(browserFetcher, chromeRevision, chromeFilePath, 'chrome');
    } else {
        store.set('TOOLS.CHROME_STATUS', true);
    }
}

async function testChrome() {
    let puppeteer = require('puppeteer-core');
    let browser = await puppeteer.launch({
        headless: false,
        executablePath: getChromeFilePath(),
        product: 'chrome'
    });
    return browser;
}

/**
 * 解析获取最快的下载Firefox的链接地址
 * @returns {Promise<PCancelable<unknown> | *>}
 */
async function fastMozillaUrl() {
    let mozillaUrls = ['http://archive.mozilla.org', 'https://download-origin.cdn.mozilla.net', 'https://ftp.mozilla.org'];
    let got = require('got');
    let pAny = require('p-any');
    let taskArr = [];
    mozillaUrls.forEach(url => {
        taskArr.push(got.head(url).then(() => url));
    })
    return pAny(taskArr);
}

/**
 * 下载Firefox浏览器
 * @returns {Promise<void>}
 */
async function downloadFirefox() {
    // 下载Firefox
    let firefoxFilePath = getFirefoxFilePath();
    if (!fse.existsSync(firefoxFilePath)) {
        let puppeteer = require('puppeteer-core');
        let browserFetcher = puppeteer.createBrowserFetcher({
            path: getUserData(),
            host: (await fastMozillaUrl()) + '/pub/firefox/nightly/latest-mozilla-central',
            product: 'firefox' // chrome, firefox
        });

        let firefoxVerStore = store.get('TOOLS.FIREFOX_VER', '0');
        let firefoxVer = firefoxVerStore === '0' ? packageJson().firefoxVer.version : firefoxVerStore;
        store.set('TOOLS.FIREFOX_VER', firefoxVer);

        // let canDownload = await browserFetcher.canDownload(firefoxRevision);
        downloadBrowser(browserFetcher, firefoxVer, firefoxFilePath, 'firefox');
    } else {
        store.set('TOOLS.FIREFOX_STATUS', true);
    }
}

/**
 * 采用browserFetcher下载
 * @param browserFetcher
 * @param downloadVer
 * @param exePath
 * @param type
 */
function downloadBrowser(browserFetcher, downloadVer, exePath, type) {
    let logSecondInterval = 10; // 10秒输出一次下载进度
    let startDate = Date.now(), curDate = Date.now();
    type = type.toLowerCase() === 'firefox' ? 'Firefox' : 'Chrome';
    browserFetcher.download(downloadVer, (downloadedBytes, totalBytes) => {
        if (Date.now() - startDate >= logSecondInterval * 1000) {
            let speed = (downloadedBytes / 1024 / (Date.now() - curDate) * 1000).toFixed(2);
            console.log('正在下载' + type + '，已完成[' + (100 * downloadedBytes / totalBytes).toFixed(2) + '%]，当前['
                + (downloadedBytes / 1024 / 1024).toFixed(2) + '/' + (totalBytes / 1024 / 1024).toFixed(2) + ']M，'
                + '速度[' + speed + 'Kb/S]，预计还需要[' + ((totalBytes - downloadedBytes) / 1024 / speed / 60).toFixed(2) + ']分钟');
            startDate = Date.now();
        }
    }).then(revisionInfo => {
        // console.dir(revisionInfo);
        fse.move(path.dirname(revisionInfo.executablePath), path.dirname(exePath), {overwrite: true}, err => {
            if (err) {
                return console.error(err);
            } else {
                store.set('TOOLS.' + type.toUpperCase() + '_STATUS', true);
                fse.remove(revisionInfo.folderPath).then(() => {
                    console.log('浏览器[' + type + ']下载成功，链接：' + revisionInfo.url);
                });
            }
        })
    }).catch(err => {
        console.error(err);
    });

}

