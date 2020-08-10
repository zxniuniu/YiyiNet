import {app, BrowserWindow, nativeImage, net, session} from 'electron';
import fs from 'fs';
import path from 'path';
import https from 'https';

import rimraf from 'rimraf';
import unzip from 'unzip-crx-3';
import semver from 'semver';

import config from './configs/app.config';
import settings from './shared/settings';

// Use https.get fallback for Electron < 1.4.5
const request = net ? net.request : https.get;

/**
 * 获取UserData路径
 * @returns {*}
 */
export const getUserData = () => {
    return app.getPath('userData');
};

/**
 * 获取扩展路径
 * @returns {Promise<void> | Promise<string>}
 */
export const getExtensionsPath = () => {
    const savePath = getUserData();
    return path.resolve(`${savePath}/extensions`);
};

/**
 * 下载并保存文件
 * @param from
 * @param to
 * @returns {Promise<unknown>}
 */
export const downloadFile = (from, to) => {
    return new Promise((resolve, reject) => {
        const req = request(from);
        req.on('response', (res) => {
            // Shouldn't handle redirect with `electron.net`, this is for https.get fallback
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return downloadFile(res.headers.location, to).then(resolve).catch(reject);
            }
            res.pipe(fs.createWriteStream(to)).on('close', resolve);
            res.on('error', reject);
        });
        req.on('error', reject);
        req.end();
    });
};

/**
 * 修改目录权限
 * @param dir
 * @param mode
 */
export const changePermissions = (dir, mode) => {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
        const filePath = path.join(dir, file);
        fs.chmodSync(filePath, parseInt(mode, 8));
        if (fs.statSync(filePath).isDirectory()) {
            changePermissions(filePath, mode);
        }
    });
};

/**
 * 根据chromeStoreID下载crx插件
 * @param chromeStoreID
 * @param forceDownload
 * @param attempts
 * @returns {Promise<unknown>}
 */
export const downloadChromeExtension = (chromeStoreID, forceDownload, attempts = 5) => {
    const extensionsStore = getExtensionsPath();
    if (!fs.existsSync(extensionsStore)) {
        fs.mkdirSync(extensionsStore, {recursive: true});
    }
    const extensionFolder = path.resolve(`${extensionsStore}/${chromeStoreID}`);
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(extensionFolder) || forceDownload) {
            if (fs.existsSync(extensionFolder)) {
                rimraf.sync(extensionFolder);
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
                    }, 200);
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
    const getIDMapPath = () => path.resolve(getExtensionsPath(), 'IDMap.json');
    if (fs.existsSync(getIDMapPath())) {
        try {
            IDMap = JSON.parse(fs.readFileSync(getIDMapPath(), 'utf8'));
        } catch (err) {
            console.error('electron-devtools-installer: Invalid JSON present in the IDMap file');
        }
    }

    if (process.type !== 'browser') {
        return Promise.reject(
            new Error('electron-devtools-installer can only be used from the main process'),
        );
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

/**
 * 返回NPM镜像路径
 * @returns {{registry: string, phantomjs_cdnurl: string, node_sqlite3_binary_host_mirror: string, electron_mirror: string, puppeteer_download_host: string, selenium_cdnurl: string, disturl: string, operadriver_cdnurl: string, npm_config_disturl: string, profiler_binary_host_mirror: string, node_inspector_cdnurl: string, python_mirror: string, chromedriver_cdnurl: string, electron_builder_binaries_mirror: string, sass_binary_site: string, npm_config_profiler_binary_host_mirror: string}}
 */
export const npmConfig = () => {
    return {
        'registry': 'https://registry.npm.taobao.org/',
        'disturl': 'https://npm.taobao.org/dist',
        'electron_mirror': 'https://npm.taobao.org/mirrors/electron/',
        'chromedriver_cdnurl': 'https://npm.taobao.org/mirrors/chromedriver',
        'phantomjs_cdnurl': 'http://npm.taobao.org/mirrors/phantomjs',
        'operadriver_cdnurl': 'http://npm.taobao.org/mirrors/operadriver',
        'selenium_cdnurl': 'https://npm.taobao.org/mirrors/selenium',
        'sass_binary_site': 'https://npm.taobao.org/mirrors/node-sass/',
        'node_sqlite3_binary_host_mirror': 'http://npm.taobao.org/mirrors',
        'python_mirror': 'http://npm.taobao.org/mirrors/python',
        'electron_builder_binaries_mirror': 'http://npm.taobao.org/mirrors/electron-builder-binaries/',
        'profiler_binary_host_mirror': 'http://npm.taobao.org/mirrors/node-inspector/',
        'npm_config_profiler_binary_host_mirror': 'http://npm.taobao.org/mirrors/node-inspector/',
        'node_inspector_cdnurl': 'http://npm.taobao.org/mirrors/node-inspector/',
        'puppeteer_download_host': 'https://npm.taobao.org/mirrors',
        'npm_config_disturl': 'https://npm.taobao.org/mirrors/atom-shell'
    }
};

/**
 * 根据图标生成指定大小的缩略图，以显示在菜单前
 * @param name
 * @param size
 * @returns {*}
 */
export function getIco(name, size) {
    if (size === undefined) {
        size = 16;
    }
    let img = nativeImage.createFromPath(path.join(__dirname, './assets/icon/' + name));
    if (size > 0) {
        img = img.resize({width: size});
    }
    return img;
}

export function handleArgv(argv) {
    // 开发阶段，跳过前两个参数（`electron.exe .`），打包后，跳过第一个参数（`myapp.exe`）
    const offset = app.isPackaged ? 2 : 3;
    const urlStr = argv.find((arg, i) => i >= offset && arg.startsWith(config.protocol + ':'));
    // let urlStr = process.argv.splice(app.isPackaged ? 2 : 3).join("")
    // let urlStr2 = process.argv[process.argv.length - 1]
    if (urlStr) handleUrl(urlStr);
}

export function handleUrl(urlStr) {
    /*const urlObj = new URL(urlStr);       // yiyinet://demo-wtf-param/?abc=124&refresh=true
    const { searchParams } = urlObj;      // 参数解析

    console.log(urlObj.protocol);         // yiyinet:
    console.log(urlObj.pathname);         // / ？是不是有问题？不应该是//demo-wtf-param/么
    console.log(urlObj.search);           // ?abc=124&refresh=true
    console.log(searchParams.get('abc')); // 123
    console.log(urlObj.pathname + urlObj.search);*/

    // 渲染进程获取方式：require('electron').remote.getGlobal('sharedObject').openUrl;
    let openUrl = urlStr.startsWith(config.protocol + "://") ? urlStr.substring(config.protocol.length + 3) : urlStr;

    console.log('伪协议[' + config.protocol + ']地址：' + openUrl);
    // 主进程通讯监听渲染进程派发的OPENVIEW事件
    if (mainWindow === null) {
        settings.set('openUrl', openUrl);
    } else {
        mainWindow.webContents.send('protocol-open', openUrl);
        settings.set('openUrl', '');
    }

    /*ipcMain.on(PROTOCOLVIEW, (event)=> {
        // 并发送当前唤起应用的数据
        event.sender.send(PROTOCOLVIEW, reUrl)
    })*/
}
