/**
 * Auto Updater
 *
 * Similar to https://electronjs.org/docs/api/auto-updater#events
 * See https://electronjs.org/docs/tutorial/updates for documentation
 * See自动更新 https://github.com/electron-userland/electron-builder/wiki/Auto-Update#events
 */
// import {app, autoUpdater, dialog} from 'electron';
import {dialog} from 'electron';
import {autoUpdater} from 'electron-updater'; // https://www.electron.build/auto-update#AppUpdater
import _ from 'lodash';
import i18n from '../../configs/i18next.config';

const isDev = process.env.NODE_ENV === 'development';
const runningLocally = isDev || process.env.RUNNING_LOCALLY;

let checkNewUpdates = _.noop;
let mainWindow = null;

if (!runningLocally && !process.env.RUNNING_IN_SPECTRON) {
    // autoUpdater.setFeedURL(getFeedUrl(app.getVersion()));

    /**
     * Check for new updates
     */
    checkNewUpdates = async function (mainWin) {
        mainWindow = mainWin;

        // autoupdate.checkForUpdates always downloads updates immediately
        // This method (getUpdate) let's us take a peek to see if there is an update
        // available before calling .checkForUpdates
        /*if (process.env.RUNNING_IN_SPECTRON) {
            return;
        }
        const update = await checkUpdate(app.getVersion());
        console.log('update:' + update);

        if (update) {
            let {name, notes, pub_date: pubDate} = update;
            pubDate = moment(pubDate).format(i18n.t('datetimeFormat'));

            let detail = i18n.t('updateDetails', {pubDate, notes: notes.replace('*', '\n*')});
            if (env.NO_AUTO_UPDATE) {
                detail += `\n\nhttps://www.github.com/appium/appium-desktop/releases/latest`;
            }

            // Ask user if they wish to install now or later
            if (!process.env.RUNNING_IN_SPECTRON) {
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
            }
        } else {
            // autoUpdater.emit('update-not-available');

            // If no updates found check for updates every hour
            await B.delay(60 * 60 * 1000);
            checkNewUpdates();
        }*/
        autoUpdater.checkForUpdates();
    };

    // Handle error case
    autoUpdater.on('error', (message) => {
        sendStatusToWindow('自动更新时出错：' + message);
        dialog.showMessageBox({
            type: 'error',
            message: i18n.t('Could not download update'),
            detail: i18n.t('updateDownloadFailed', {message}),
        });
    });

    autoUpdater.on('checking-for-update', () => {
        sendStatusToWindow('正在检查更新中，请稍候...');
    });

    // Inform user when the download is starting and that they'll be notified again when it is complete
    autoUpdater.on('update-available', (info) => { // UpdateInfo: version, files, path, sha512, releaseName, releaseNotes, releaseDate, stagingPercentage
        let version = info.version;
        sendStatusToWindow('有更新[' + info.version + ']可用，即将自动下载');
        dialog.showMessageBox({
            type: 'info',
            buttons: [i18n.t('OK')],
            message: i18n.t('Update Download Started'),
            detail: i18n.t('updateIsBeingDownloaded', {version}),
        });
    });

    // Handle the unusual case where we checked the updates endpoint, found an update but then after calling 'checkForUpdates', nothing was there
    autoUpdater.on('update-not-available', (info) => { // UpdateInfo: version, files, path, sha512, releaseName, releaseNotes, releaseDate, stagingPercentage
        let version = info.version;
        sendStatusToWindow('无可用更新，当前版本已是最新版本：' + version);
        dialog.showMessageBox({
            type: 'info',
            buttons: [i18n.t('OK')],
            message: i18n.t('No update available'),
            detail: i18n.t('YiyiNet is up-to-date', {version}),
        });
    });

    autoUpdater.on('download-progress', (progressObj) => {// progress, bytesPerSecond, percent, total, transferred
        let log_message = "Download speed: " + progressObj.bytesPerSecond + ', Downloaded: ' + progressObj.percent + '%' + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
        console.log(log_message);
        // mainWindow.setProgressBar(progressObj.transferred / progressObj.total);
        sendStatusToWindow(log_message);
    });

    // When it's done, ask if user want to restart now or later
    autoUpdater.on('update-downloaded', (info) => { // UpdateInfo: version, files, path, sha512, releaseName, releaseNotes, releaseDate, stagingPercentage
        let version = info.version;
        mainWindow.setProgressBar(-1);
        sendStatusToWindow('新版本[' + version + ']下载成功');
        dialog.showMessageBox({
            type: 'info',
            buttons: [i18n.t('Restart Now'), i18n.t('Restart Later')],
            message: i18n.t('Update Downloaded'),
            detail: i18n.t('updateIsDownloaded', {version})
        }, (response) => {
            // If they say yes, restart now
            if (response === 0) {
                autoUpdater.quitAndInstall();
            }
        });
    });

}

/**
 * 发送消息
 * @param text
 */
function sendStatusToWindow(text) {
    console.log(text);
    mainWindow.webContents.send('message', text);
}

export {checkNewUpdates};
