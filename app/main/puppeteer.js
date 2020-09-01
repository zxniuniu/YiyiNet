import path from "path";
import store from './../configs/settings';
import fse from 'fs-extra';

import {getChromeFilePath, getRootPath, packageJson} from "../utils";

export function puppeteerCoreInstallFinishEvent(moduleStr, version) {
    downloadChrome();

    // downloadFirefox();
}

function getPlatform() {
    let platform = process.platform, _platform;
    if (platform === 'darwin') {
        _platform = 'mac';
    } else if (platform === 'linux') {
        _platform = 'linux';
    } else if (platform === 'win32') {
        _platform = process.arch === 'x64' ? 'win64' : 'win32';
    }
    return _platform;
}

async function downloadChrome() {
    // 下载Chrome
    let chromeFilePath = getChromeFilePath();
    if (!fse.existsSync(chromeFilePath)) {
        let puppeteer = require('puppeteer-core');
        let platform = getPlatform();
        let browserFetcher = puppeteer.createBrowserFetcher({
            product: 'chrome', // chrome, firefox
            path: getRootPath(),
            host: 'https://npm.taobao.org/mirrors', // https://cnpmjs.org/mirrors/
            platform: platform // darwin, mac, linux, win32
        });
        // 也可以使用代理获取 http://omahaproxy.appspot.com/deps.json?version=85.0.4183.86

        let chromeVerArr = packageJson().chromiumVer[process.versions.electron].split('&');
        let chromeRevisionJson = chromeVerArr[1];
        let chromeRevisionStore = store.get('TOOLS.CHROME_REVISION', 0);
        let chromeRevision = '' + Math.max(chromeRevisionJson, chromeRevisionStore);

        // store.set('TOOLS.CHROME_VER', chromeVer);
        store.set('TOOLS.CHROME_REVISION', chromeRevision);

        // let canDownload = await browserFetcher.canDownload(chromeRevision);
        let startDate = Date.now();
        browserFetcher.download(chromeRevision, (downloadedBytes, totalBytes) => {
            if (Date.now() - startDate >= 10 * 1000) {
                console.log('正在下载Chrome，已完成[' + (100 * downloadedBytes / totalBytes).toFixed(2) + '%]，当前['
                    + (downloadedBytes / 1024 / 1024).toFixed(2) + '/' + (totalBytes / 1024 / 1024).toFixed(2) + 'M]');
                startDate = Date.now();
            }
        }).then(revisionInfo => {
            console.dir(revisionInfo);
            fse.move(path.dirname(revisionInfo.executablePath), path.dirname(chromeFilePath), {overwrite: true}, err => {
                if (err) {
                    return console.error(err);
                } else {
                    store.set('TOOLS.CHROME_STATUS', true);
                    fse.remove(revisionInfo.folderPath);
                }
            })
        }).catch(err => {
            console.error(err);
        })
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

}

