// https://github.com/sindresorhus/awesome-electron

// Modules to control application life and create native browser window
import {app, ipcMain} from 'electron';
import path from 'path';
import shellEnv from 'shell-env';
import fixPath from 'fix-path';
/* const {autoUpdater} = require("electron-updater"); */

import config from '../configs/app.config';
// import {addPepFlashCommandLine} from './main/pepflash';
import {handleArgv, handleUrl, npmConfig} from './utils';
import {setTray} from './main/tray';
import {setShortcut, unSetShortcut} from './main/shortcut';
import {openBrowserWindow, setSavedEnv, windowEvent} from './main/helpers';
import {killChromedriver} from './main/service';
import {setAutoLaunch} from './main/auto-launch';
import {setProtocol} from './main/protocal';

/*// const log = require('electron-log');
//-------------------------------------------------------------------
// Logging
//
// THIS SECTION IS NOT REQUIRED
//
// This logging setup is not required for auto-updates to work,
// but it sure makes debugging easier :)
//-------------------------------------------------------------------
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
console.info('App starting...');*/

/*const url = require('url')

const Store = require('electron-store');
const store = new Store();*/

// 个人保存位置
// app.setPath("userData", __dirname + "/saved_recordings");

// Chrome添加命令行参数
// addPepFlashCommandLine(); // 是否设置Flash位置信息
// app.commandLine.appendSwitch('--ignore-gpu-blacklist');
// app.commandLine.appendSwitch("--disable-http-cache");

// 禁用浏览器缓存（开发时使用，上线后需要关闭）
// app.commandLine.appendSwitch("--disable-http-cache")


// 下载模块
// const electronDl = require('electron-dl');

// 保持一个对于 window 对象的全局引用，不然，当 JavaScript 被 GC，
// window 会被自动地关闭
var mainWindow = null;
var tray = null;
var forceQuit = false;
const mainUrl = config.mainUrl;

// 禁用内置模块
// process.env.ELECTRON_HIDE_INTERNAL_MODULES = 'true';
// require('electron').hideInternalModules();

// const ua = require('universal-analytics');

// https://www.electronjs.org/docs/tutorial/context-isolation
// contextBridge.exposeInMainWorld('myAPI', {
//  doAThing: () => {}
// })

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

// 是否调试模式
console.log("当前模式[" + (config.isDev ? "调试" : "正常") + "]，可用模式[调试|正常]");
if (config.isDev) {
    require('electron-debug')(); // eslint-disable-line global-require
} else {
    // if we're running from the app package, we won't have access to env vars
    // normally loaded in a shell, so work around with the shell-env module
    const decoratedEnv = shellEnv.sync();
    process.env = {...process.env, ...decoratedEnv};

    // and we need to do the same thing with PATH
    fixPath();
}
setSavedEnv();

// 设置app的事件监听
app.on('activate', function () {
    if (mainWindow === null/* || BrowserWindow.getAllWindows().length === 0*/) {
        createWindow();
    }
});
app.on('will-quit', () => {
    unSetShortcut();
    killChromedriver();
});
app.on('second-instance', (event, commandLine, workingDirectory) => {
    handleArgv(commandLine);

    if (mainWindow) {
        if (mainWindow.isMinimized()) {
            mainWindow.restore();
        }
        mainWindow.focus();
    }
});
// macOS
app.on('open-url', (event, urlStr) => {
    handleUrl(urlStr);
});

setAutoLaunch();
setProtocol();

app.on('ready', createWindow)

// 当 Electron 完成了初始化并且准备创建浏览器窗口的时候
// 如何实现单实例？两种方案解决单实例问题 https://newsn.net/say/electron-single-instance-lock.html
const gotTheLock = app.requestSingleInstanceLock();
console.log('requestSingleInstanceLock：' + gotTheLock);
if (!gotTheLock) {
    app.quit();
} else {
    console.log('process.argv：' + process.argv);
    handleArgv(process.argv);
}

// Simple data persistence for your Electron app or module - Save and load user preferences, app state, cache, etc
// const Store = require('electron-store');
// global.store = new Store();
function createWindow() {
    mainWindow = openBrowserWindow({});

    windowEvent();
    setTray(mainWindow);
    setShortcut(mainWindow);
}

function checkUpdate() {
    try {
        // autoUpdater.checkForUpdates();
        // autoUpdater.checkForUpdatesAndNotify();
    } catch (e) {
    }
}

function sendStatusToWindow(text) {
    console.log(text);
    mainWindow.webContents.send('message', text);
}

// 检查Module是否安装，而不加载Module
function hasModule(req_module) {
    try {
        require.resolve(req_module);
        return true;
    } catch (e) {
        return false;
    }
}

ipcMain.on('installModule', (event, needData) => {
    // console.log('needData:' + needData);
    installModule(needData.module, needData.type).then(result => {
        event.reply('installModuleReply', result);
    })
});

async function installModule(needInstall, type) {
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

// 下载按钮进行下载, https://github.com/sindresorhus/electron-dl
/*ipcMain.on('download-button', async (event, {url}) => {
    const win = BrowserWindow.getFocusedWindow();
    console.log(await electronDl(win, url));
});*/

// Require each JS file in the main dir
function loadMainJS() {
    const glob = require('glob');
    var files = glob.sync(path.join(__dirname, 'main/*.js'));
    files.forEach(function (file) {
        require(file);
    })
}
