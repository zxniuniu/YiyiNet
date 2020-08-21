// https://github.com/sindresorhus/awesome-electron
import {app, ipcMain} from 'electron';
import shellEnv from 'shell-env';
import fixPath from 'fix-path';
import config from './configs/app.config';
// import {addPepFlashCommandLine} from './main/pepflash';
import {destroyTray, setTray} from './main/tray';
import {setShortcut, unSetShortcut} from './main/shortcut';
import {openBrowserWindow, setSavedEnv} from './main/window-helpers';
import {killAllServiceByYiyiNet} from './main/service';
import {setAutoLaunch} from './main/auto-launch';
import {setProtocol} from './main/protocal';
import {addCommandLine} from './main/add-command-line';
import {initializeIpc} from './main/ipcevent';
import {settings, resetObj} from "./shared/settings";
import log from 'electron-log';

// 设置默认日志
Object.assign(console, log.functions);
addCommandLine();
resetObj();

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

app.on('ready', createWindow);

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
    // 创建Splash窗口及主窗口
    mainWindow = openBrowserWindow({});

    setTray(mainWindow);
    setShortcut(mainWindow);

    initializeIpc(mainWindow);
}

/**
 * 参数处理（伪协议)
 * @param argv
 */
function handleArgv(argv) {
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
function handleUrl(urlStr) {
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

ipcMain.on('installModule', (event, needData) => {
    // console.log('needData:' + needData);
    installModule(needData.module, needData.type).then(result => {
        event.reply('installModuleReply', result);
    })
});

// 下载按钮进行下载, https://github.com/sindresorhus/electron-dl
/*ipcMain.on('download-button', async (event, {url}) => {
    const win = BrowserWindow.getFocusedWindow();
    console.log(await electronDl(win, url));
});*/
