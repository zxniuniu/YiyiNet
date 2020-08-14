import {app, BrowserWindow, nativeImage, net, session} from 'electron';
import fs from 'fs';
import path from 'path';
import https from 'https';

import rimraf from 'rimraf';
import unzip from 'unzip-crx-3';
import semver from 'semver';
import AsyncLock from 'async-lock';

import config from './configs/app.config';
import settings from './shared/settings';


// Use https.get fallback for Electron < 1.4.5
const request = net ? net.request : https.get;

/*
var remote = require('electron').remote;
var app = remote.app;
var path = require('path');
var fs = require('fs');
*/
/**
 * 获取UserData路径
 * @returns {string}
 */
export const getUserData = () => {
    return app.getPath('userData');
};

/**
 * 获取扩展路径
 * @returns {string}
 */
export const getExtensionsPath = () => {
    const savePath = getUserData();
    return path.resolve(`${savePath}/extensions/`);
};

/**
 * 获取NPM模块安装路径
 * @returns {string}
 */
export const getNpmInstallPath = () => {
    const savePath = getUserData();
    return path.resolve(`${savePath}/node_modules/`);
};

/**
 * 为NPM增加扫描路径
 * @returns {string}
 */
export const addNpmModulePath = () => {
    let path = getNpmInstallPath();
    console.log(path);
    // let module = require('module');
    console.log(module.paths);

    /*if(module.paths.filter(p => p === path).length === 0){
        module.paths.push(path);
    }*/
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
    let img = nativeImage.createFromPath(path.join(__dirname, './../assets/icon/' + name));
    if (size > 0) {
        img = img.resize({width: size});
    }
    return img;
}

/**
 * 参数处理（伪协议)
 * @param argv
 */
export function handleArgv(argv) {
    // 开发阶段，跳过前两个参数（`electron.exe .`），打包后，跳过第一个参数（`myapp.exe`）
    const offset = app.isPackaged ? 2 : 3;
    const urlStr = argv.find((arg, i) => i >= offset && arg.startsWith(config.protocol + ':'));
    // let urlStr = process.argv.splice(app.isPackaged ? 2 : 3).join("")
    // let urlStr2 = process.argv[process.argv.length - 1]
    if (urlStr) handleUrl(urlStr);
}

/**
 * 处理伪协议传输的地址
 * @param urlStr
 */
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

/**
 * 检查Module是否安装，而不加载Module
 * @param req_module
 * @returns {boolean}
 */
function hasModule(req_module) {
    try {
        require.resolve(req_module);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Require each JS file in the main dir
 */
function loadMainJS() {
    const glob = require('glob');
    var files = glob.sync(path.join(__dirname, 'main/*.js'));
    files.forEach(function (file) {
        require(file);
    })
}

function asarPath() {
    // https://newsn.net/say/electron-detect-asar.html
    /*const path = require('path');
    var path_arr=__dirname.split(path.sep);
    var entry_relative = path.sep + ""; //入口文件相对于项目根目录
    var res_relative = path.sep + "res" + path.sep; //资源文件夹相对于入口文件js
    var res_dir=__dirname + res_relative;
    if(path_arr.indexOf("app.asar")>=0){
      res_dir = __dirname + entry_relative + ".." + res_relative;
    }
    var res_path=path.join(res_dir, 'res_name.dll');
    console.log(res_path);

    __dirname.split(path.sep).indexOf("app.asar")&gt;=0*/
}

/**
 * package.json的内容
 * @returns {*}
 */
export function packageJson() {
    let packagePath;
    if (app.isPackaged) {
        packagePath = path.join(__dirname, '..', 'package.json');
    } else {
        packagePath = "./../package.json";
    }
    return require(packagePath);
}

/**
 * 切换显示/隐藏
 */
export function toggleShowHide(mainWindow) {
    if (mainWindow !== null) {
        if (mainWindow.isVisible()) {
            if (mainWindow.isFocused()) {
                mainWindow.hide();
            } else {
                mainWindow.focus();
            }
        } else {
            mainWindow.show();
            mainWindow.focus();
        }
    }
}

/**
 * 获取需要安装的模块列表
 * @returns {*}
 */
function getNeedInstallModule() {
    let json = packageJson();
    return json.clientDependencies;
}

export async function installModule(needInstall) {
    const {PluginManager} = require('live-plugin-manager');
    let manager = new PluginManager({
        pluginsPath: getNpmInstallPath(),
        npmRegistryUrl: 'https://registry.npm.taobao.org/'
    });

    let modules = Object.keys(needInstall);
    let lock = new AsyncLock();
    for (let module of modules) {
        let ver = needInstall[module];
        ver = ver === '' ? 'latest' : ver;
        try {
            lock.acquire("installModule", function (done) {
                console.log('安装模块[' + module + ']，版本[' + ver + ']。。。');
                manager.installFromNpm(module, ver).then(res => {
                    console.log('安装模块[' + module + ']，版本[' + ver + ']，安装[成功]：' + res);
                    done();
                })
            }, function (err, ret) {
            }, {});
        } catch (error) {
            console.log('安装模块[' + module + ':' + ver + ']出现错误，将跳过: ' + error);
        }
    }
}


export async function installModule2(needInstall, type) {
    var previous = null, project = null;
    if (type === undefined || type === "undefined" || type === '' || type === null) {
        type = 'livepluginmanager'; // type = 'livepluginmanager';
    }
    if (needInstall.includes('npm')) {
        type = 'livepluginmanager';
    }
    if (app.isPackaged) {
        previous = process.execPath.substring(0, process.execPath.lastIndexOf('\\'));
        project = path.join(previous, 'resources');
    } else {
        previous = process.execPath.substring(0, process.execPath.lastIndexOf('node_modules') - 1);
        project = previous;
    }

    if (process.cwd() !== project) {
        console.log('(安装)目录由[' + process.cwd() + ']切换到[' + project + ']');
        process.chdir(project);
    }

    try {
        if (type === "npm") {
            let npm = require('npm');
            await npm.load(function (err) {
                // 设置NPM参数（注意必须放在npm.load函数中）
                let configKeys = Object.keys(npmConfig());
                console.log('设置NPM参数值，包括以下字段：' + configKeys);
                configKeys.forEach(key => {
                    npm.config.set(key, npmConfig[key]);
                });

                console.log('安装模块(NPM)：' + needInstall);
                // 安装模块
                npm.commands.install(needInstall, function (er, data) {
                    console.log(data); // log errors or data
                });
                npm.on('log', function (message) {
                    console.log('安装模块NPM日志：' + message); // log errors or data
                });
            });
        } else {
            const {PluginManager} = require('live-plugin-manager');
            let manager = new PluginManager({
                cwd: project,
                pluginsPath: './node_modules',
                npmRegistryUrl: 'https://registry.npm.taobao.org/'
            });
            for (let dependency of needInstall) {
                console.log('安装模块(LIVE-PLUGIN-MANAGER)：' + dependency);
                await manager.installFromNpm(dependency);
            }
        }
    } catch (error) {
        console.log('安装模块出现错误: ' + error);
    } finally {
        if (process.cwd() !== previous) {
            console.log('(还原)目录由[' + process.cwd() + ']切换到[' + previous + ']');
            process.chdir(previous); // 还原到原目录
        }
    }
    return {'module': needInstall, 'type': type, 'succ': true, 'msg': '安装成功'};
}

