// https://github.com/sindresorhus/awesome-electron

// Modules to control application life and create native browser window
import {app, ipcMain} from 'electron';
import path from 'path';
import shellEnv from 'shell-env';
import fixPath from 'fix-path';
import config from './configs/app.config';
// import {addPepFlashCommandLine} from './main/pepflash';
import {handleArgv, handleUrl, npmConfig} from './utils';
import {destroyTray, setTray} from './main/tray';
import {setShortcut, unSetShortcut} from './main/shortcut';
import {openBrowserWindow, setSavedEnv, windowEvent} from './main/window-helpers';
import {killAllServiceByYiyiNet} from './main/service';
import {setAutoLaunch} from './main/auto-launch';
import {setProtocol} from './main/protocal';
import {addCommandLine} from './main/add-command-line';
import {initializeIpc} from './main/ipcevent';

/* const {autoUpdater} = require("electron-updater"); */

addCommandLine();

// 下载模块
// const electronDl = require('electron-dl');

// 保持一个对于 window 对象的全局引用，不然，当JavaScript被GC, window 会被自动地关闭
var mainWindow = null;
// const ua = require('universal-analytics');

// 是否调试模式 // console.log("当前模式[" + (config.isDev ? "调试" : "正常") + "]，可用模式[调试|正常]");
if (!config.isDev) {
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
    killAllServiceByYiyiNet();
    destroyTray();
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

/**
 * 新窗口
 */
function createWindow() {
    mainWindow = openBrowserWindow({});

    windowEvent();
    setTray(mainWindow);
    setShortcut(mainWindow);

    initializeIpc(mainWindow);
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
