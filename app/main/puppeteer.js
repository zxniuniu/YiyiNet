import path from "path";
import store from './../configs/settings';
import fse from 'fs-extra';

import {getChromeFilePath, getFirefoxFilePath, getRootPath, packageJson} from "../utils";

export function puppeteerCoreInstallFinishEvent(moduleStr, version) {
    downloadChrome();

    downloadFirefox();
}

async function downloadChrome() {
    // 下载Chrome
    let chromeFilePath = getChromeFilePath();
    if (!fse.existsSync(chromeFilePath)) {
        let puppeteer = require('puppeteer-core');
        let browserFetcher = puppeteer.createBrowserFetcher({
            path: getRootPath(),
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

async function downloadFirefox() {
    // 下载Firefox
    let firefoxFilePath = getFirefoxFilePath();
    if (!fse.existsSync(firefoxFilePath)) {
        let puppeteer = require('puppeteer-core');
        let browserFetcher = puppeteer.createBrowserFetcher({
            path: getRootPath(),
            // host: 'https://npm.taobao.org/mirrors', // https://cnpmjs.org/mirrors/
            product: 'firefox' // chrome, firefox
        });

        let firefoxVerJson = packageJson().firefoxVer.version;
        let firefoxVerStore = store.get('TOOLS.FIREFOX_VER', 0);
        let firefoxVer = '' + Math.max(firefoxVerJson, firefoxVerStore);
        store.set('TOOLS.FIREFOX_VER', firefoxVer);

        // let canDownload = await browserFetcher.canDownload(firefoxRevision);
        downloadBrowser(browserFetcher, firefoxVer, firefoxFilePath, 'firefox');
    } else {
        store.set('TOOLS.FIREFOX_STATUS', true);
    }
}

function downloadBrowser(browserFetcher, downloadVer, exePath, type) {
    let logSecondInteval = 10; // 10秒输出一次下载进度
    let startDate = Date.now();
    browserFetcher.download(downloadVer, (downloadedBytes, totalBytes) => {
        if (Date.now() - startDate >= logSecondInteval * 1000) {
            console.log('正在下载' + (type === 'firefox' ? 'Firefox' : 'Chrome') + '，已完成[' + (100 * downloadedBytes / totalBytes).toFixed(2)
                + '%]，当前[' + (downloadedBytes / 1024 / 1024).toFixed(2) + '/' + (totalBytes / 1024 / 1024).toFixed(2) + 'M]');
            startDate = Date.now();
        }
    }).then(revisionInfo => {
        // console.dir(revisionInfo);
        fse.move(path.dirname(revisionInfo.executablePath), path.dirname(exePath), {overwrite: true}, err => {
            if (err) {
                return console.error(err);
            } else {
                store.set('TOOLS.' + (type === 'firefox' ? 'FIREFOX' : 'CHROME') + '_STATUS', true);
                fse.remove(revisionInfo.folderPath);
            }
        })
    }).catch(err => {
        console.error(err);
    });

}

