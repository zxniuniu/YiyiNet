import {app, dialog} from 'electron';
import store, {storeChangeEvent} from '../configs/settings';
import path from 'path';
import {initDynamicSplashScreen} from '@trodi/electron-splashscreen';
import config from '../configs/app.config';
import {checkNewUpdates} from './auto-updater';
import {getPythonFolder, getPythonPipPath, isDebugUrl, getJrePath, getJreFolder} from "../utils";
import {installClientModule} from './client-module';
import {downloadAllTools, downloadDriverFiles} from './download-file';
import {saveAstarVpn} from './astarvpn';
import {downloadCommonApk} from './apk';

const windowStateKeeper = require('electron-window-state');
let mainWindow = null;

export function openBrowserWindow(opts) {
    // Load the previous state with fallback to defaults
    let mainWindowState = windowStateKeeper({
        defaultWidth: 1000,
        defaultHeight: 800
    });
    // https://www.electronjs.org/docs/api/browser-window#class-browserwindow
    const windowOptions = {
        'x': mainWindowState.x,
        'y': mainWindowState.y,
        'width': mainWindowState.width,
        'height': mainWindowState.height,
        'fullscreen': mainWindowState.isFullScreen,
        // '': mainWindowState.isMaximized,
        // minWidth: 880,
        // minHeight: 450,
        show: false,
        // title: app.getName(),
        // skipTaskbar: false, // Whether to show the window in taskbar
        // autoHideMenuBar: true, // https://newsn.net/say/electron-no-application-menu.html
        webPreferences: {
            // preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            nodeIntegrationInSubFrames: true,
            nodeIntegrationInWorker: true,
            enableRemoteModule: true,

            webSecurity: false,
            allowRunningInsecureContent: true,
            // contextIsolation: true, // 不能设置为true，否则electron无法使用

            webviewTag: true,
            experimentalFeatures: true,
            plugins: true
        }
    };

    // https://github.com/trodi/electron-splashscreen/blob/master/api-doc/interfaces/config.md
    let splashScreenOptions = {
        windowOpts: {
            ...windowOptions,
            ...opts,
        },
        delay: 0,
        templateUrl: path.join(__dirname, "./../assets/splash/splashscreen.html"),
        splashScreenOpts: {
            width: 533,
            height: 300,
            frame: false,
            center: true,
            // backgroundColor: "white",
            transparent: true,
            resizable: false,
            webPreferences: {
                nodeIntegration: true,
            }
        }
    };

    const dynamicSplashScreen = initDynamicSplashScreen(splashScreenOptions);
    mainWindow = dynamicSplashScreen.main; // dynamicSplashScreen.splashScreen

    // mainWindow = new BrowserWindow(windowOptions);
    mainWindowState.manage(mainWindow);

    /*let getLocalLanguagueSetting = "index.html";
    let _let_language = store.get('languageStore');
    console.log(_let_language);
    switch (_let_language) {
        case "us":
            getLocalLanguagueSetting = "index-us.html"
            break;
        case "cn":
            getLocalLanguagueSetting = "index.html"
            break;
    }*/

    // let mainUrl = 'index.html';
    /*let mainUrl = url.format({
        pathname: path.join(__dirname, getLocalLanguagueSetting),
        protocol: 'file:',
        slashes: true
    });*/
    // mainWindow.loadURL(mainUrl);

    let splashScreenUpdate = function (text) {
        let finish = text === 'finish';
        if (finish) {
            mainWindow.loadURL(config.mainUrl);
        } else {
            dynamicSplashScreen.splashScreen.webContents.send('splashScreenUpdate', text);
            console.log((finish ? '已完成' : '初始化') + "：" + text);

            if (Math.floor(text) === text) {
                if (text > 0) {
                    setTimeout(function () {
                        return splashScreenUpdate(text - 1);
                    }, 1000);
                }
            } else if (finish) {
                // Done sending updates to mock progress while loading window, so go ahead and load the main window.
                mainWindow.loadURL(config.mainUrl);
            }
        }
    };
    // splashScreenUpdate(5);

    // 检查模块是否已经安装，如果未安装，则安装
    splashScreenUpdate('正在启动，检查模块中。。。');
    /*let clientDependencies = {}; // packageJson().clientDependencies;
    if (clientDependencies === undefined) {
        let allModule = Object.keys(clientDependencies);
        let needInstall = allModule.filter(mi => hasModule(mi));
        for (let ii = 0; ii < needInstall.length; ii++) {
            splashScreenUpdate('正在安装模块，当前第 [' + (ii + 1) + '/' + needInstall.length + '] 个，根据您的网络情况，可能需要1-5分钟。。。');

            let curModule = [needInstall[ii] + '#' + allModule[needInstall[ii]]];
            installModule([curModule]).then(result => {
                console.log(curModule + "：" + result);
                splashScreenUpdate('正在安装模块，当前第 [' + (ii + 2) + '/' + needInstall.length + '] 个，根据您的网络情况，可能需要1-5分钟。。。');
            })
        }
    }*/
    splashScreenUpdate('finish');

    // Make 'devTools' available on right click
    /*win.webContents.on('context-menu', (e, props) => {
        const {x, y} = props;

        Menu.buildFromTemplate([{
            label: i18n.t('Inspect element'),
            click() {
                win.inspectElement(x, y);
            }
        }]).popup(win);
    });*/

    /*mainWindow.webContents.on('beforeunload', (event) => {
        console.log('beforeunload：' + require('util').inspect(event));

        event.returnValue = false
        setTimeout(() => {
            let result = dialog.showMessageBox({
                message: 'Quit app?',
                buttons: ['Yes', 'No']
            })
            if (result == 0) {

            }
        }, 10)
        return true;
    })*/

    // 当 window 被关闭，这个事件会被发出
    mainWindow.on('close', function (event) {
        // https://stackoverflow.com/questions/4482950/how-to-show-full-object-in-chrome-console
        // https://stackoverflow.com/questions/957537/how-can-i-display-a-javascript-object
        // console.log('当前关闭事件：' + require('util').inspect(event));

        let quitFlag = store.get("FORCE_QUIT_FLAG");
        // console.log('quitFlag: ' + quitFlag);
        // console.dir(event);
        if (quitFlag !== 'install') {
            event.preventDefault();

            let isShow = mainWindow.isVisible();
            if (quitFlag === false) {
                if (mainWindow !== null) {
                    mainWindow.hide();
                }
            } else {
                dialog.showMessageBox(mainWindow, {
                    type: 'warning',
                    title: 'YiyiNet',
                    defaultId: 0,
                    cancelId: 0, // 解决Esc，以及点击提示窗口右上角X导致软件退出的问题
                    message: '如有后台运行的定时任务，则其会全部停止运行，确定要强制退出YiyiNet吗？',
                    buttons: [(isShow ? '隐藏到托盘' : '保留在托盘'), '强制退出']
                }).then(res => {
                    // console.log('index:' + res.response + ', e:' + e + ', mainWindow:' + mainWindow);
                    if (res && res.response && res.response === 1) {
                        app.exit(); // exit()直接关闭客户端，不会执行quit();
                    } else {
                        if (isShow) {
                            mainWindow.hide();
                        }
                    }
                })
            }
            event.returnValue = false;
        } else {
            event.returnValue = undefined;
        }
    });

    // 当 window 被关闭，这个事件会被发出
    mainWindow.on('closed', function (event) {
        // 取消引用 window 对象，如果你的应用支持多窗口的话，通常会把多个 window 对象存放在一个数组里面，
        mainWindow = null;
    });

    /*mainWindow.on('resize', function () {
        const message = `大小: ${mainWindow.getSize()} - 位置: ${mainWindow.getPosition()}`
        console.log("mainWindow：" + message);
    });*/
    /*mainWindow.webContents.on('unresponsive', () => {
        const options = {
            type: 'info',
            title: 'Yiyi-Plus无响应',
            message: 'Yiyi-Plus当前无响应，是否重新打开？',
            buttons: ['重新打开', '关闭']
        }

        dialog.showMessageBox(options, (index) => {
            if (index === 0) mainWindow.reload()
            else mainWindow.close()
        })
    })*/

    // 显示窗口
    mainWindow.once('ready-to-show', function () {
        closeSplashScreen(dynamicSplashScreen.splashScreen);
        mainWindow.show();
        // console.log('===================================================ready-to-show');
    });

    // DOM READY事件，仅执行一次（否则重载页面等均会触发）
    mainWindow.webContents.once('dom-ready', function () {
        // closeSplashScreen(dynamicSplashScreen.splashScreen);

        // Store变更时事件
        storeChangeEvent();

        // 安装模块
        installClientModule();

        // 下载服务（包括chromedriver，python等）
        downloadDriverFiles();

        // 检查更新
        if (checkNewUpdates !== null) {
            checkNewUpdates(mainWindow, false);
        }

        // 下载工具类软件
        downloadAllTools();

        // 获取VPN
        saveAstarVpn();
        
        // 下载常用Apk
        downloadCommonApk();
        
    });

    // 如何监控文件下载进度，并显示进度条 https://newsn.net/say/electron-download-progress.html
    mainWindow.webContents.session.on('will-download', (event, item, webContents) => {
        const filePath = path.join(app.getPath('downloads'), item.getFilename());
        item.setSavePath(filePath);

        item.on('updated', (event, state) => {
            if (state === 'progressing') {
                if (!item.isPaused()) {
                    console.log(item.getFilename(), item.getReceivedBytes(), item.getTotalBytes(), (item.getReceivedBytes() * 100 / item.getTotalBytes()).toFixed(2) + "%");

                    if (mainWindow.isDestroyed()) {
                        return;
                    }
                    mainWindow.webContents.send('down-process', {
                        name: item.getFilename(),
                        receive: item.getReceivedBytes(),
                        total: item.getTotalBytes(),
                    });
                    mainWindow.setProgressBar(item.getReceivedBytes() / item.getTotalBytes());
                }
            } else if (state === 'interrupted') {
                console.log('Download is interrupted but can be resumed')
            }
        });

        item.once('done', (event, state) => {
            if (state === 'completed') {
                if (process.platform === 'darwin') {
                    app.dock.downloadFinished(item.getSavePath());
                }
                if (!mainWindow.isDestroyed()) {
                    return;
                }
                mainWindow.webContents.send('down-done', {
                    name: item.getFilename(),
                    path: item.getSavePath(),
                    receive: item.getReceivedBytes(),
                    total: item.getTotalBytes(),
                });
                mainWindow.setProgressBar(-1);
            } else if (state === "cancelled") {
                mainWindow.webContents.send('down-cancle', {
                    name: item.getFilename()
                });
            } else {
                //state === 'interrupted'
                // console.log(`Download failed: ${state}`)
                dialog.showErrorBox('下载失败', `文件 ${item.getFilename()} 因为某些原因被中断下载`);
                mainWindow.webContents.send('down-fail', {
                    name: item.getFilename()
                });
            }
        });
    });
    // 也可以静默下载指定的文件
    // mainWindow.webContents.downloadURL("http://searchbox.bj.bcebos.com/miniapp/demo-1.0.1.zip");

    // 打开开发者模式
    openDevTools(mainWindow);

    return mainWindow;
}

/**
 * 关闭Splash窗口（某些情况下，主窗口显示了，但Splash窗口还未自动关闭）
 * @param splashScreen
 */
function closeSplashScreen(splashScreen) {
    if (splashScreen) {
        splashScreen.isDestroyed() || splashScreen.close(); // Avoid `Error: Object has been destroyed` (#19)
        splashScreen = null;
    }
}

// Sets the environment variables to a combination of process.env and whatever the user saved
export function setSavedEnv() {
    const savedEnv = store.get('ENV');

    let envPath = [
        getPythonFolder(),
        path.dirname(getPythonPipPath()),
        path.dirname(getJrePath()),
        path.join(getJreFolder(), 'lib'),
    ].join(';');

    process.env = {
        ...process.env,
        ...savedEnv || {},
        Path: process.env.Path + ";" + envPath,
    };

    // console.log("process: "); console.dir(process);
}

function openDevTools(mainWindow) {
    // 打开开发工具 https://newsn.net/say/electron-param-debug.html
    // 隐藏窗体顶部菜单 https://newsn.net/say/electron-no-application-menu.html
    console.log('config.isDev：' + config.isDev + '，isDebugUrl：' + isDebugUrl() + '，devToolsPostion：' + config.devToolsPostion);
    if (config.isDev || isDebugUrl()) {
        // mainWindow.webContents.openDevTools({'mode': config.devToolsPostion});
        mainWindow.webContents.openDevTools({mode: 'right'})
        // mainWindow.toggleDevTools();
    }
}
