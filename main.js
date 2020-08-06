// https://github.com/sindresorhus/awesome-electron

/*if (require('electron-squirrel-startup')) return;
if (handleSquirrelEvent()) {
    return;
}*/

// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain, shell, dialog, globalShortcut, Menu, Tray, systemPreferences, nativeImage} = require('electron');
const path = require('path');
const {autoUpdater} = require("electron-updater");
const windowStateKeeper = require('electron-window-state');

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
// app.commandLine.appendSwitch('--ignore-gpu-blacklist');
// app.commandLine.appendSwitch("--disable-http-cache");

// electron如何集成绿色版flash插件 https://newsn.net/say/electron-flash-crossplatform.html
try {
    var pepflashplayer = app.getPath('pepperFlashSystemPlugin');
    if (process.platform === "win32") {
        if (process.arch === 'x64') {
            pepflashplayer = path.join(__dirname, 'dll/pepflashplayer64_32.0.0.403.dll');
        } else {
            pepflashplayer = path.join(__dirname, 'dll/pepflashplayer32_32.0.0.403.dll');
        }
    } else if (process.platform === 'darwin') {
        pepflashplayer = path.join(__dirname, 'dll/PepperFlashPlayer.plugin');
    }
    app.commandLine.appendSwitch('ppapi-flash-path', pepflashplayer);
    console.log("添加Flash Player到启动参数")
} catch (e) {
}

// 是否调试模式
const debug = process.argv.indexOf("--debug") >= 0;
console.log("当前模式[" + (debug ? "调试" : "正常") + "]，可用模式[调试|正常]")

// 下载模块
// const electronDl = require('electron-dl');

// 保持一个对于 window 对象的全局引用，不然，当 JavaScript 被 GC，
// window 会被自动地关闭
var mainWindow = null;
var tray = null;
var forceQuit = false;

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


// 默认参数，渲染线程中使用或修改，需要先在主进程中定义
global.sharedObject = {
    openUrl: ''
};

// https://www.jianshu.com/p/973320203c6a
// 当所有窗口被关闭了，退出。
/*app.on('window-all-closed', function() {
  // 在 OS X 上，通常用户在明确地按下 Cmd + Q 之前应用会保持活动状态
  if (process.platform != 'darwin') {
    app.quit();
  }
});*/

app.on('activate', function () {
    if (mainWindow === null/* || BrowserWindow.getAllWindows().length === 0*/) {
        createWindow();
    }
});

app.on('will-quit', () => {
    // https://newsn.net/say/electron-shortcut.html
    // https://newsn.net/say/electron-globalshortcut.html
    globalShortcut.unregisterAll(); // 清空所有快捷键
    // globalShortcut.unregister('CommandOrControl+X'); // 注销快捷键

    // 关闭chromedriver
    let exec = require('child_process');
    exec('TASKKILL.EXE /F /IM chromedriver.exe', function (err, stdout, stderr) {
    });
});

// electron加入开机启动项 https://newsn.net/say/node-auto-launch.html
// 设置加入开机启动项 https://newsn.net/say/electron-auto-launch.html
if (!app.isPackaged) {
    app.setLoginItemSettings({
        openAtLogin: true,
        openAsHidden: false,
        path: process.execPath,
        args: [path.resolve(process.argv[1])]
    });
} else {
    app.setLoginItemSettings({});
}

// 协议注册 https://newsn.net/say/electron-fake-protocal-debug.html
// 如何通过伪协议唤起本地exe程序 https://newsn.net/say/fake-protocol-win.html

// 如何接收识别协议URL https://newsn.net/say/electron-fake-protocol-url.html
// 获取URL相关系列参数总结 https://newsn.net/say/electron-fake-protocol-args.html
var protocol = 'yiyinet';
if (app.isPackaged) {
    app.setAsDefaultProtocolClient(protocol, process.execPath, ["--"]);
} else {
    app.setAsDefaultProtocolClient(protocol, process.execPath, [path.resolve(process.argv[1]), "--"]);
}

// 自动更新 https://github.com/electron-userland/electron-builder/wiki/Auto-Update#events
autoUpdater.on('checking-for-update', () => {
    sendStatusToWindow('Checking for update...');
})
autoUpdater.on('update-available', (info) => {
    sendStatusToWindow('Update available.');
})
autoUpdater.on('update-not-available', (info) => {
    sendStatusToWindow('Update not available.');
})
autoUpdater.on('error', (err) => {
    sendStatusToWindow('Error in auto-updater. ' + err);
})
autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    sendStatusToWindow(log_message);
})
autoUpdater.on('update-downloaded', (info) => {
    sendStatusToWindow('Update downloaded');
    // autoUpdater.quitAndInstall();
});

// 当 Electron 完成了初始化并且准备创建浏览器窗口的时候
// 如何实现单实例？两种方案解决单实例问题 https://newsn.net/say/electron-single-instance-lock.html
var gotTheLock = app.requestSingleInstanceLock()
console.log('requestSingleInstanceLock：' + gotTheLock)
if (!gotTheLock) {
    app.quit();
} else {
    console.log('process.argv：' + process.argv);
    handleArgv(process.argv);

    app.on('second-instance', (event, commandLine, workingDirectory) => {
        handleArgv(commandLine);

        if (mainWindow) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }
            mainWindow.focus();
        }
    })
    // macOS
    app.on('open-url', (event, urlStr) => {
        handleUrl(urlStr);
    });

    app.on('ready', createWindow)
}


// Simple data persistence for your Electron app or module - Save and load user preferences, app state, cache, etc
// const Store = require('electron-store');
// global.store = new Store();
function createWindow() {
    // Load the previous state with fallback to defaults
    let mainWindowState = windowStateKeeper({
        defaultWidth: 1000,
        defaultHeight: 800
    });

    // https://www.electronjs.org/docs/api/browser-window#class-browserwindow
    var windowOptions = {
        'x': mainWindowState.x,
        'y': mainWindowState.y,
        'width': mainWindowState.width,
        'height': mainWindowState.height,
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
    }

    mainWindow = new BrowserWindow(windowOptions);
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
    let mainUrl = 'http://localhost:8070/index';
    mainWindow.loadURL(mainUrl);

    // 打开开发工具 https://newsn.net/say/electron-param-debug.html
    // 隐藏窗体顶部菜单 https://newsn.net/say/electron-no-application-menu.html
    if (debug) {
        mainWindow.webContents.openDevTools();
        mainWindow.maximize();
        //require('devtron').install()
    } else {
        // https://newsn.net/say/electron-no-application-menu.html
        Menu.setApplicationMenu(null);
    }

    // 当 window 被关闭，这个事件会被发出
    mainWindow.on('close', function (e) {
        e.preventDefault();
        if (!forceQuit) {
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
                    forceQuit = true;
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

    mainWindow.on('ready-to-show', function () {
        mainWindow.show();
        checkUpdate();
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
        if (!app.isPackaged) {
            mainWindow.webContents.openDevTools({mode: 'right'}); // right, bottom, left, detach, undocked
        }
    })

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

    // 实现tray托盘图标及上下文菜单 https://newsn.net/say/electron-tray.html
    // https://newsn.net/say/electron-tray-switch.html
    // https://newsn.net/say/electron-tray-template-colorful.html
    const trayIconImage = getIco('app.ico', 0);
    trayIconImage.setTemplateImage(true)
    // let trayPress = path.join(__dirname, "./assets/icon/app-gray.ico");
    if (null == tray) {
        // tray = new Tray(trayIcon);
        tray = new Tray(trayIconImage)
    } else {
        tray.setImage(trayIconImage);
    }
    // tray.setPressedImage(trayPress);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: "友情链接",
            icon: getIco('link.ico'),
            type: 'submenu',
            submenu: [{
                label: "博客地址",
                click: function () {
                    shell.openExternal(new URL(mainUrl).origin + '/blog');
                }
            }, {
                label: "作者博客",
                click: function () {
                    shell.openExternal('https://fuyiyi.imdo.co');
                }
            }, {
                label: "项目地址",
                click: function () {
                    shell.openExternal('https://github.com/zxniuniu/YiyiNet');
                }
            }]
        }, {
            type: "separator",
        }, {
            label: "检查更新",
            icon: getIco('update.ico'),
            click: function () {
                checkUpdate();

                autoUpdater.once("update-not-available", function(info) {
                    sendStatusToWindow('Update not available.');
                    dialog.showMessageBoxSync({
                        "type": 'info',
                        "buttons": ['确定'],
                        "title": '版本更新',
                        "message": '当前版本[' + app.getVersion() + ']为最新版，您不需要更新^_^'
                    });
                });
                autoUpdater.once('update-available', (info) => {
                    sendStatusToWindow('Update available.');
                    dialog.showMessageBoxSync({
                        "type": 'info',
                        "buttons": ['确定'],
                        "title": '版本更新',
                        "message": '检测到新版本[' + info.version + ']，将自动更新当前版本[' + app.getVersion() + ']到最新版^_^'
                    });
                })
            }
        }, {
            type: "separator",
        }, {
            label: "显示/隐藏(F6)",
            icon: getIco('show.ico'),
            click: function () {
                if (mainWindow.isVisible()) {
                    mainWindow.hide();
                } else {
                    mainWindow.show();
                    mainWindow.focus();
                }
            }
        }, {
            label: '强制退出...',
            icon: getIco('app-gray.ico'),
            click: function () {
                // https://discuss.atom.io/t/how-to-catch-the-event-of-clicking-the-app-windows-close-button-in-electron-app/21425
                forceQuit = true;
                // mainWindow = null;
                app.quit();
            }
        }, {
            label: '关于软件...',
            icon: getIco('click.ico'),
            click: function () {
                let json = require('./package.json');
                dialog.showMessageBoxSync({
                    "type": 'info',
                    "buttons": [],
                    "title": '关于' + json.productName,
                    "message": json.about + '\r\n版本：' + json.version + '\r\n\r\n主页：' + json.homepage + '\r\n项目：'
                        + json.repository.url + '\r\n作者：' + json.author
                });
            }
        }
    ]);
    tray.setToolTip('依网(YiyiNet)');
    tray.setContextMenu(contextMenu);

    // 实现改写关闭事件为最小化到托盘 https://newsn.net/say/electron-tray-min.html
    tray.on("click", () => {
        if (mainWindow) {
            /*if (mainWindow.isVisible()) {
                mainWindow.hide()
            } else {
                mainWindow.show()
            }*/
            if (!mainWindow.isVisible()) {
                mainWindow.show();
                mainWindow.focus();
            }
        }
    })

    // 托盘图标像QQ一样闪动 https://newsn.net/say/electron-tray-flash.html
    /* var count = 0;
    var ico_switch = setInterval(function () {
        if (count++ % 2 === 0) {
            tray.setImage(trayIconImage);
        } else {
            tray.setImage(trayPress);
        }
    }, 1000);
    setTimeout(function () {
        clearInterval(ico_switch);
        tray.setImage(trayIconImage);
    }, 100000);*/

    // 快捷键注册方式对比最佳实践总结 https://newsn.net/say/electron-shortcut.html
    // 注册全局快捷键，并执行某个事件 https://newsn.net/say/electron-globalshortcut.html
    let shortcutKey = 'F6';
    const regSucc = globalShortcut.register(shortcutKey, (event, arg) => { // CmdOrCtrl+Shift+A， CommandOrControl+X
        // console.log('打开客户端')
        if (mainWindow !== null) {
            mainWindow.show();
        }
    })
    if (!regSucc) {
        console.log('快捷键 ' + shortcutKey + ' 注册失败！')
    }
    // 检查快捷键是否注册成功
    console.log('快捷键 ' + shortcutKey + ' 是否注册成功：' + globalShortcut.isRegistered(shortcutKey))
}

function checkUpdate(){
    try {
        // autoUpdater.checkForUpdates();
        autoUpdater.checkForUpdatesAndNotify();
    }catch (e) {
    }
}

function getIco(name, size) {
    if (size === undefined) {
        size = 16;
    }
    let img = nativeImage.createFromPath(path.join(__dirname, './assets/icon/' + name));
    if (size > 0) {
        img = img.resize({width:size});
    }
    return img;
}

function sendStatusToWindow(text) {
    console.log(text);
    mainWindow.webContents.send('message', text);
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
        type = 'npm'; // type = 'livepluginmanager';
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
                let configKeys = Object.keys(getNpmConfig());
                console.log('设置NPM参数值，包括以下字段：' + configKeys);
                configKeys.forEach(key => {
                    npm.config.set(key, npmConfig[key]);
                })

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

// NPM设置
function getNpmConfig() {
    return npmConfig = {
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
}

function handleArgv(argv) {
    // 开发阶段，跳过前两个参数（`electron.exe .`），打包后，跳过第一个参数（`myapp.exe`）
    const offset = app.isPackaged ? 2 : 3;
    const urlStr = argv.find((arg, i) => i >= offset && arg.startsWith(protocol + ':'));
    // let urlStr = process.argv.splice(app.isPackaged ? 2 : 3).join("")
    // let urlStr2 = process.argv[process.argv.length - 1]
    if (urlStr) handleUrl(urlStr);
}

function handleUrl(urlStr) {
    /*const urlObj = new URL(urlStr);       // yiyinet://demo-wtf-param/?abc=124&refresh=true
    const { searchParams } = urlObj;      // 参数解析

    console.log(urlObj.protocol);         // yiyinet:
    console.log(urlObj.pathname);         // / ？是不是有问题？不应该是//demo-wtf-param/么
    console.log(urlObj.search);           // ?abc=124&refresh=true
    console.log(searchParams.get('abc')); // 123
    console.log(urlObj.pathname + urlObj.search);*/

    // 渲染进程获取方式：require('electron').remote.getGlobal('sharedObject').openUrl;
    let openUrl = urlStr.startsWith(protocol + "://") ? urlStr.substring(protocol.length + 3) : urlStr;

    console.log('伪协议[' + protocol + ']地址：' + openUrl);
    // 主进程通讯监听渲染进程派发的OPENVIEW事件
    if (mainWindow === null) {
        global.sharedObject.openUrl = openUrl;
    } else {
        mainWindow.webContents.send('protocol-open', openUrl);
        global.sharedObject.openUrl = '';
    }

    /*ipcMain.on(PROTOCOLVIEW, (event)=> {
        // 并发送当前唤起应用的数据
        event.sender.send(PROTOCOLVIEW, reUrl)
    })*/
}

/*
var urlStr = require('electron').remote.getGlobal('sharedObject').args;
console.log(urlStr);
*/


/*document.getElementById('close').addEventListener('click', () => {
  mainWindow.close();
});*/

// 禁用浏览器缓存（开发时使用，上线后需要关闭）
// app.commandLine.appendSwitch("--disable-http-cache")

// 下载按钮进行下载, https://github.com/sindresorhus/electron-dl
/*ipcMain.on('download-button', async (event, {url}) => {
    const win = BrowserWindow.getFocusedWindow();
    console.log(await electronDl(win, url));
});*/

function checkDarkmode() {
    let ico_1 = "";
    let ico_2 = "";
    if (systemPreferences.isDarkMode()) {
        ico_1 = "tray-dark.png";
        ico_2 = "tray-dark-press.png";
    } else {
        ico_1 = "tray-light.png";
        ico_2 = "tray-light-press.png";
    }
    ico_1 = path.join(__dirname, "./img/" + ico_1)
    ico_2 = path.join(__dirname, "./img/" + ico_2)
    if (tray == null) {
        tray = new Tray(ico_1);
    } else {
        tray.setImage(ico_1);
    }
    tray.setPressedImage(ico_2);
}

// Require each JS file in the main dir
function loadMainJS() {
    const glob = require('glob')
    var files = glob.sync(path.join(__dirname, 'main/*.js'))
    files.forEach(function (file) {
        require(file);
    })
    // autoUpdater.updateMenu();
}

function handleSquirrelEvent() {
    if (process.argv.length === 1) {
        return false;
    }

    const ChildProcess = require('child_process');
    const path = require('path');

    const appFolder = path.resolve(process.execPath, '..');
    const rootAtomFolder = path.resolve(appFolder, '..');
    const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
    const exeName = path.basename(process.execPath);

    const spawn = function (command, args) {
        let spawnedProcess, error;

        try {
            spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
        } catch (error) {
        }

        return spawnedProcess;
    };

    const spawnUpdate = function (args) {
        return spawn(updateDotExe, args);
    };

    const squirrelEvent = process.argv[1];
    switch (squirrelEvent) {
        case '--squirrel-install':
        case '--squirrel-updated':
            // Optionally do things such as:
            // - Add your .exe to the PATH
            // - Write to the registry for things like file associations and
            //   explorer context menus

            // Install desktop and start menu shortcuts
            spawnUpdate(['--createShortcut', exeName]);

            setTimeout(app.quit, 1000);
            return true;

        case '--squirrel-uninstall':
            // Undo anything you did in the --squirrel-install and
            // --squirrel-updated handlers

            // Remove desktop and start menu shortcuts
            spawnUpdate(['--removeShortcut', exeName]);

            setTimeout(app.quit, 1000);
            return true;

        case '--squirrel-obsolete':
            // This is called on the outgoing version of your app before
            // we update to the new version - it's the opposite of
            // --squirrel-updated

            app.quit();
            return true;
    }
}
