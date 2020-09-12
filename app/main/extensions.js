import path from 'path';
import {BrowserWindow, session} from 'electron';
import {changePermissions, removeFolder, downloadFile, getExtensionsPathCache, getExtensionsPathSys} from "../utils";
import fs from "fs";

import unzip from "unzip-crx";
import semver from "semver";

// https://github.com/electron/electron/blob/master/docs/api/extensions.md
// 使用WebView打开扩展设置 https://github.com/electron/electron/issues/19447
// https://github.com/getstation/electron-chrome-extension
// https://github.com/sentialx/electron-extensions
export function installExtensions() {
    // 安装ASTAR VPN扩展
    /*let extensionName = 'astar';
    addExtension(extensionName).then((ext) => {
        console.dir(ext);
        createPopup(ext.id);
    }).catch(e => {
        console.log('加载扩展[' + extensionName + ']出错：' + e);
    })*/

}

/**
 * 获取session
 * @param partition
 * @returns {Electron.Session}
 */
const getSession = (partition) => {
    return partition && partition !== '' ? session.fromPartition(partition) : session.defaultSession;
};

/**
 * 安装扩展
 * @param extensionFolderName
 * @param partition
 */
const addExtension = function (extensionFolderName, partition) {
    const extPath = path.join(getExtensionsPathSys(), extensionFolderName);
    // console.log('extPath:' + extPath);
    return getSession(partition).loadExtension(extPath);
};

/**
 * 删除扩展
 * @param name
 * @param partition
 */
const removeExtension = function (name, partition) {
    let mySession = getSession(partition);
    const extension = mySession.getAllExtensions().find(e => e.name === name);
    if (extension) {
        mySession.removeExtension(extension.id);
    }
};

/**
 * 获取所有扩展
 * @param partition
 * @returns {{}}
 */
const getExtensions = function (partition) {
    let mySession = getSession(partition);
    const extensions = {};
    mySession.getAllExtensions().forEach(e => {
        extensions[e.name] = e
    });
    return extensions;
};

const createPopup = (extensionId, width = 300, height = 350, popupName = 'popup', title = '设置') => {
    let popWin = new BrowserWindow({
        title: title,
        width: width,
        height: height,
        type: 'popup',
        resizable: true
    });
    popWin.on('closed', function (event) {
        popWin = null;
    });
    popWin.loadURL(`chrome-extension://${extensionId}/${popupName}.html`);

    let popWin2 = new BrowserWindow({
        title: title,
        width: width,
        height: height,
        resizable: true
    });
    popWin2.on('closed', function (event) {
        popWin2 = null;
    });
    popWin2.loadURL('https://www.google.com');

    return popWin;
};

/**
 * 根据chromeStoreID下载crx插件
 * @param chromeStoreID
 * @param forceDownload
 * @param attempts
 * @returns {Promise<unknown>}
 */
export const downloadChromeExtension = (chromeStoreID, forceDownload, attempts = 5) => {
    const extensionsStore = getExtensionsPathCache();
    if (!fs.existsSync(extensionsStore)) {
        fs.mkdirSync(extensionsStore, {recursive: true});
    }
    const extensionFolder = path.resolve(`${extensionsStore}/${chromeStoreID}`);
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(extensionFolder) || forceDownload) {
            if (fs.existsSync(extensionFolder)) {
                removeFolder(extensionFolder);
            }
            const fileURL = `https://clients2.google.com/service/update2/crx?response=redirect&acceptformat=crx2,crx3&x=id%3D${chromeStoreID}%26uc&prodversion=32`; // eslint-disable-line
            const filePath = path.resolve(`${extensionFolder}.crx`);
            downloadFile(fileURL, filePath)
                .then(() => {
                    unzip(filePath, extensionFolder)
                        .then(() => {
                            changePermissions(extensionFolder, 755);
                            resolve(extensionFolder);
                        })
                        .catch((err) => {
                            if (!fs.existsSync(path.resolve(extensionFolder, 'manifest.json'))) {
                                return reject(err);
                            }
                        });
                })
                .catch((err) => {
                    console.log(`Failed to fetch extension, trying ${attempts - 1} more times`); // eslint-disable-line
                    if (attempts <= 1) {
                        return reject(err);
                    }
                    setTimeout(() => {
                        downloadChromeExtension(chromeStoreID, forceDownload, attempts - 1)
                            .then(resolve)
                            .catch(reject);
                    }, 500);
                });
        } else {
            resolve(extensionFolder);
        }
    });
};

/**
 * 安装插件
 * 参见 https://github.com/MarshallOfSound/electron-devtools-installer
 * @param extensionReference
 * @param forceDownload
 * @returns {Promise<never>|Promise<unknown>|*}
 * app.whenReady().then(() => {
 *     installExtension({id: 'bmdblncegkenkacieihfhpjfppoconhi', electron: '>=1.2.1'})
 *        .then((name) => console.log(`Added Extension: ${name}`))
 *        .catch((err) => console.log('An error occurred: ', err));
 * });
 */
export const installExtension = (extensionReference, forceDownload = false) => {
    let IDMap = {};
    const getIDMapPath = () => path.resolve(getExtensionsPathCache(), 'IDMap.json');
    if (fs.existsSync(getIDMapPath())) {
        try {
            IDMap = JSON.parse(fs.readFileSync(getIDMapPath(), 'utf8'));
        } catch (err) {
            console.error('electron-devtools-installer: Invalid JSON present in the IDMap file');
        }
    }
    if (Array.isArray(extensionReference)) {
        return extensionReference.reduce(
            (accum, extension) => accum.then(() => install(extension, forceDownload)),
            Promise.resolve(),
        );
    }
    let chromeStoreID;
    if (typeof extensionReference === 'object' && extensionReference.id) {
        chromeStoreID = extensionReference.id;
        const electronVersion = process.versions.electron.split('-')[0];
        if (!semver.satisfies(electronVersion, extensionReference.electron)) {
            return Promise.reject(
                new Error(
                    `Version of Electron: ${electronVersion} does not match required range ${extensionReference.electron} for extension ${chromeStoreID}`,
                ), // eslint-disable-line
            );
        }
    } else if (typeof extensionReference === 'string') {
        chromeStoreID = extensionReference;
    } else {
        return Promise.reject(
            new Error(`Invalid extensionReference passed in: "${extensionReference}"`),
        );
    }
    const extensionName = IDMap[chromeStoreID];
    let extensionInstalled = extensionName;

    // For Electron >=9.
    if (session.defaultSession.getExtension) {
        extensionInstalled =
            extensionInstalled &&
            session.defaultSession.getAllExtensions().find((e) => e.name === extensionName);
    } else {
        extensionInstalled =
            extensionInstalled &&
            BrowserWindow.getDevToolsExtensions &&
            BrowserWindow.getDevToolsExtensions().hasOwnProperty(extensionName);
    }

    if (!forceDownload && extensionInstalled) {
        return Promise.resolve(IDMap[chromeStoreID]);
    }

    return downloadChromeExtension(chromeStoreID, forceDownload).then((extensionFolder) => {
        // Use forceDownload, but already installed
        if (extensionInstalled) {
            // For Electron >=9.
            if (session.defaultSession.removeExtension) {
                const extensionId = session.defaultSession.getAllExtensions().find((e) => e.name).id;
                session.defaultSession.removeExtension(extensionId);
            } else {
                BrowserWindow.removeDevToolsExtension(extensionName);
            }
        }

        // For Electron >=9.
        if (session.defaultSession.loadExtension) {
            return session.defaultSession.loadExtension(extensionFolder).then((ext) => {
                return Promise.resolve(ext.name);
            });
        }

        const name = BrowserWindow.addDevToolsExtension(extensionFolder); // eslint-disable-line
        fs.writeFileSync(
            getIDMapPath(),
            JSON.stringify(
                Object.assign(IDMap, {
                    [chromeStoreID]: name,
                }),
            ),
        );
        return Promise.resolve(name);
    });
};