import {app, dialog} from 'electron';
import settings from '../shared/settings';
import path from 'path';
import {initDynamicSplashScreen} from '@trodi/electron-splashscreen';
import config from '../configs/app.config';
import {checkNewUpdates} from './auto-updater';

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

    return mainWindow;
}

export function windowEvent() {
    // 当 window 被关闭，这个事件会被发出
    mainWindow.on('close', function (e) {
        e.preventDefault();
        if (!settings.getSync("FORCE_QUIT_FLAG")) {
            // console.log('event:'+ e);
            if (mainWindow !== null) {
                mainWindow.hide();
            }
        } else {
            let isShow = mainWindow.isVisible();
            dialog.showMessageBox(mainWindow, {
                type: 'warning',
                title: 'YiyiNet提示（退出后运行的任务将停止）',
                defaultId: 0,
                message: '后台运行的定时任将会全部停止运行，您确定要强制退出YiyiNet吗？',
                buttons: [(isShow ? '隐藏到托盘' : '保留在托盘'), '停止任务并退出']
            }).then(res => {
                // console.log('index:' + res.response + ', e:' + e + ', mainWindow:' + mainWindow);
                if (res && res.response && res.response === 1) {
                    settings.setSync("FORCE_QUIT_FLAG", true);
                    app.exit(0); // exit()直接关闭客户端，不会执行quit();
                } else {
                    if (isShow) {
                        mainWindow.hide();
                    }
                }
            })
        }
    });

    // 当 window 被关闭，这个事件会被发出
    mainWindow.on('closed', function (e) {
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

    // DOM READY事件
    mainWindow.webContents.on('dom-ready', function () {
        mainWindow.show();
        openDevTools();

        checkNewUpdates(mainWindow);
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

}

// Sets the environment variables to a combination of process.env and whatever the user saved
export async function setSavedEnv() {
    const savedEnv = await settings.get('ENV');
    process.env = {
        ...process.env,
        ...savedEnv || {},
    };
}

function openDevTools() {
    // 打开开发工具 https://newsn.net/say/electron-param-debug.html
    // 隐藏窗体顶部菜单 https://newsn.net/say/electron-no-application-menu.html
    if (config.isDev || (app.isPackaged && config.mainUrl.indexOf('localhost') >= 0)) {
        mainWindow.webContents.openDevTools({mode: config.devToolsPostion});
    }
}
