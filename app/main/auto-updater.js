/**
 * Auto Updater
 *
 * Similar to https://electronjs.org/docs/api/auto-updater#events
 * See https://electronjs.org/docs/tutorial/updates for documentation
 * See自动更新 https://github.com/electron-userland/electron-builder/wiki/Auto-Update#events
 */
import {app, dialog} from 'electron';
import {autoUpdater} from 'electron-updater'; // https://www.electron.build/auto-update#AppUpdater
import i18n from '../configs/i18next.config';

import store from "./../configs/settings";
import utils from "../utils";
import semver from "semver";
// import _ from 'lodash';

// const runningLocally = config.isDev || process.env.RUNNING_LOCALLY;

let checkNewUpdates = null; // _.noop;
let mainWindow = null;
let menuClick = true; // 如果是菜单点击，则无更新时也提示

let baseFeedUrl = 'https://hub.fastgit.org';
// let baseFeedUrl = 'https://github.com.cnpmjs.org';
// let baseFeedUrl = 'https://github.com';

let releasesUrl = null;

// if (!runningLocally && !process.env.RUNNING_IN_SPECTRON) {
// https://www.electron.build/auto-update#api
autoUpdater.fullChangelog = true;
autoUpdater.logger = require("electron-log");
autoUpdater.logger.transports.console.level = "debug"; // error, warn, info, verbose, debug, silly

/**
 * Check for new updates
 */
checkNewUpdates = async function (mainWin, menuclick) {
    mainWindow = mainWin;
    menuClick = menuclick;

    // autoupdate.checkForUpdates always downloads updates immediately
    // This method (getUpdate) let's us take a peek to see if there is an update available before calling .checkForUpdates
    /*if (process.env.RUNNING_IN_SPECTRON) {
        return;
    }*/
    /*const update = await checkNewVersion(app.getVersion());
    if (update) {
        autoUpdater.setFeedURL(getFeedUrl(update));

        /!*let {name, notes, pub_date: pubDate} = update;
        pubDate = moment(pubDate).format(i18n.t('datetimeFormat'));

        let detail = i18n.t('updateDetails', {pubDate, notes: notes.replace('*', '\n*')});
        if (env.NO_AUTO_UPDATE) {
            detail += `\n\nhttps://www.github.com/appium/appium-desktop/releases/latest`;
        }*!/

        // Ask user if they wish to install now or later
        /!*if (!process.env.RUNNING_IN_SPECTRON) {
            dialog.showMessageBox({
                type: 'info',
                buttons: env.NO_AUTO_UPDATE
                    ? [i18n.t('OK')]
                    : [i18n.t('Install Now'), i18n.t('Install Later')],
                message: i18n.t('appiumIsAvailable', {name}),
                detail,
            }, (response) => {
                if (response === 0) {
                    // If they say yes, get the updates now
                    if (!env.NO_AUTO_UPDATE) {
                        autoUpdater.checkForUpdates();
                    }
                }
            });
        }*!/
        autoUpdater.checkForUpdates();
    } else {
        autoUpdater.emit('update-not-available');

        // If no updates found check for updates every hour
        // await B.delay(60 * 60 * 1000);
        // checkNewUpdates(mainWindow, false);
    }*/
    autoUpdater.checkForUpdates();
};

// Handle error case
autoUpdater.on('error', (message) => {
    mainWindow.setProgressBar(-1); // 出错时不显示进度条
    let isSkipMsg = message.toString().indexOf('no such file or directory') >= 0
        || message.toString().indexOf('ERR_CONNECTION_TIMED_OUT') >= 0;
    if (!isSkipMsg) {
        sendStatusToWindow('更新时出错：' + message);
        dialog.showMessageBox({
            type: 'error',
            message: i18n.t('Could not download update'),
            detail: i18n.t('updateDownloadFailed', {message}),
        });
    }
});

autoUpdater.on('checking-for-update', () => {
    sendStatusToWindow('正在检查更新中，请稍候...');
});

// Inform user when the download is starting and that they'll be notified again when it is complete
autoUpdater.on('update-available', (info) => { // UpdateInfo: version, files, path, sha512, releaseName, releaseNotes, releaseDate, stagingPercentage
    let version = info.version;
    sendStatusToWindow('有更新[' + info.version + ']可用，即将自动开始下载');
    dialog.showMessageBox({
        type: 'info',
        buttons: [i18n.t('OK')],
        message: i18n.t('Update Download Started'),
        detail: i18n.t('updateIsBeingDownloaded', {version}),
    });
});

// Handle the unusual case where we checked the updates endpoint, found an update but then after calling 'checkForUpdates', nothing was there
autoUpdater.on('update-not-available', (info) => { // UpdateInfo: version, files, path, sha512, releaseName, releaseNotes, releaseDate, stagingPercentage
    let version = info === undefined ? app.getVersion() : info.version;
    sendStatusToWindow('无可用更新，当前版本已是最新版本：' + version);
    if (menuClick) {
        dialog.showMessageBox({
            type: 'info',
            buttons: [i18n.t('OK')],
            message: i18n.t('No update available'),
            detail: i18n.t('YiyiNet is up-to-date', {version}),
        });
    }
});

autoUpdater.on('download-progress', (progressObj) => {// progress, bytesPerSecond, percent, total, transferred
    let log_message = '已下载[' + progressObj.percent.toFixed(2) + '%](' + (progressObj.transferred / 1024 / 1024).toFixed(2)
        + "/" + (progressObj.total / 1024 / 1024).toFixed(2) + 'M)，速度[' + (progressObj.bytesPerSecond / 1024).toFixed(2)
        + 'KB/S]，预计大约需要[' + ((progressObj.total - progressObj.transferred) / progressObj.bytesPerSecond / 60).toFixed(2) + '分钟]';
    // console.log(log_message);
    mainWindow.setProgressBar(progressObj.percent / 100);
    sendStatusToWindow(log_message);
});

// When it's done, ask if user want to restart now or later
autoUpdater.on('update-downloaded', (info) => { // UpdateInfo: version, files, path, sha512, releaseName, releaseNotes, releaseDate, stagingPercentage
    let version = info.version;
    mainWindow.setProgressBar(-1);
    sendStatusToWindow('新版本[' + version + ']下载成功');
    dialog.showMessageBox({
        type: 'info',
        defaultId: 1,
        cancelId: 1,
        buttons: [i18n.t('Restart Now'), i18n.t('Restart Later')],
        message: i18n.t('Update Downloaded'),
        detail: i18n.t('updateIsDownloaded', {version})
    }).then(res => {
        // console.log('res: '); console.dir(res);
        if (res && res.response && res.response === 0) {
            store.set("FORCE_QUIT_FLAG", 'install');
            autoUpdater.quitAndInstall(false);
        }
    });
});

// }

/**
 * 发送消息
 * @param text
 */
function sendStatusToWindow(text) {
    console.log(text);
    mainWindow.webContents.send('message', text);
}

export function getFeedUrl(newVersion) {
    // https://github.com/zxniuniu/YiyiNet/
    // https://hub.fastgit.org/zxniuniu/YiyiNet/
    // https://github.com.cnpmjs.org/zxniuniu/YiyiNet/
    // https://hub.fastgit.org/zxniuniu/YiyiNet/releases/download/v1.6.3/latest.yml

    // let version = await checkNewVersion(releasesUrl);
    return releasesUrl + 'download/v' + newVersion + '/';
}

export async function checkNewVersion(curVersion) {
    try {
        let json = utils.packageJson();
        let repositoryUrl = json.repository.url.replace(/https?:\/\/[.a-zA-Z]+/, '');
        releasesUrl = baseFeedUrl + repositoryUrl + '/releases/';
        let latestUrl = releasesUrl + 'latest';

        let proto = utils.getHttpOrHttps(latestUrl);
        // Three Ways to Retrieve JSON from the Web using Node.js https://dev.to/isalevine/three-ways-to-retrieve-json-from-the-web-using-node-js-3c88
        const res = await proto.get(latestUrl);
        if (res && res.statusCode === 302) {
            let locationStr = res.headers['Location'];
            let queryVer = locationStr.substring(locationStr.lastIndexOf('/') + 2, locationStr.length());
            if (semver.lt(curVersion, queryVer)) {
                console.log('获取到新版本[' + queryVer + ']，当前版本[' + curVersion + ']');
                return queryVer;
            }else{
                console.log('当前无新版本，在线版本[' + queryVer + ']，当前版本[' + curVersion + ']');
            }
        }
    } catch (ign) {
    }
    return false;
}

export {checkNewUpdates};
