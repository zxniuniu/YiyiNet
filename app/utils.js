import {app, nativeImage} from 'electron';
import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import zlib from 'zlib';

import config from "./configs/app.config";
import store from './configs/settings';
import {ipcMain} from 'electron-better-ipc';

// import {DownloaderHelper} from 'node-downloader-helper';

/*
var remote = require('electron').remote; var app = remote.app;
var path = require('path'); var fs = require('fs');
var http = require('http'); var https = require('https'); var net = require('net');
*/

/**
 * 获取UserData路径
 * @returns {string}
 */
export const getUserData = () => {
    return app.getPath('userData');
};

/**
 * 获取appData路径
 * @returns {string}
 */
export const getAppData = () => {
    return app.getPath('appData');
};

/**
 * 获取Electron Cache路径
 * @returns {string}
 */
export const getElectronCachePath = () => {
    return checkPath(path.join(process.env.LOCALAPPDATA, 'electron', 'Cache'));
};

/**
 * 获取Adblock路径
 * @returns {string}
 */
export const getAdblockPath = () => {
    return checkPath(path.join(getUserData(), 'Adblocker'));
};

/**
 * 获取扩展路径（本地项目数据目录中）
 * @returns {string}
 */
export const getExtensionsPathCache = () => {
    return checkPath(path.join(getUserData(), 'Extensions'));
};

/**
 * 获取扩展路径（客户端自带）
 * @returns {string}
 */
export const getExtensionsPathSys = () => {
    return path.join(__dirname, './../assets/plugins/');
};

/**
 * 获取YiyiNet根目录
 * @returns {string}
 */
export const getRootPath = () => {
    return path.dirname(process.execPath);
};

export function checkPath(filePath) {
    if (!fs.existsSync(filePath)) {
        fs.mkdirSync(filePath, {recursive: true});
    }
    return filePath;
}

/**
 * 获取chromedriver路径
 */
export const getChromedriverFilePath = () => {
    return path.join(getRootPath(), getChromedriverExeName());
};

/**
 * 获取chromedriver文件名（平台兼容）
 */
export const getChromedriverExeName = () => {
    return 'chromedriver' + (process.platform === 'win32' ? '.exe' : '');
};

/**
 * 获取Python所在路径
 */
export const getPythonFolder = () => {
    return checkPath(path.join(getRootPath(), 'python'));
}

/**
 * 获取Python所在路径
 */
export const getPythonFilePath = () => {
    return path.join(getPythonFolder(), getPythonExeName());
}

/**
 * 获取Python所有Exe
 */
export const getPythonExeName = () => {
    return 'python' + (process.platform === 'win32' ? '.exe' : '');
}

/**
 * 根据地址获取http或者https
 * @param url
 * @returns {any}
 */
export function getHttpOrHttps(url) {
    return !url.charAt(4).localeCompare('s') ? https : http;
}

/**
 * 检查链接地址是否可用
 * isUrlValid('https://www.baidu.com', (flag)=>{console.log(flag)});
 */
export function isUrlValid(url) {
    const proto = getHttpOrHttps(url);
    return new Promise((resolve, reject) => {
        let req = proto.get(url, response => {
            return resolve(response.statusCode === 200 || (response.statusCode >= 300 && response.statusCode));
        }).on('error', (err) => {
            return resolve(false);
        });
        req.end();
    });
}

/**
 * 下载并保存文件
 * @param url
 * @param filePath
 * @returns {Promise<unknown>}
 */
export const downloadFile = (url, filePath) => {
    const proto = getHttpOrHttps(url);
    return new Promise((resolve, reject) => {
        let file = fs.createWriteStream(filePath);
        let request = proto.get(url, response => {
            // console.log('response.headers: '); console.dir(response.headers);
            if (response.statusCode !== 200) {
                if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                    return downloadFile(response.headers.location, filePath).then(resolve).catch(reject);
                } else {
                    reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                    return;
                }
            }
            switch (response.headers['content-encoding']) {
                case 'br':
                    response.pipe(zlib.createBrotliDecompress()).pipe(file);
                    break;
                case 'gzip': // 或者, 只是使用 zlib.createUnzip() 方法去处理这两种情况：
                    response.pipe(zlib.createGunzip()).pipe(file);
                    break;
                case 'deflate':
                    response.pipe(zlib.createInflate()).pipe(file);
                    break;
                default:
                    response.pipe(file);
                    break;
            }
        });
        // The destination stream is ended by the time it's called
        file.on('finish', () => resolve());
        request.on('error', err => {
            file.close();
            fs.unlink(filePath, () => reject(err));
        });
        file.on('error', err => {
            file.close();
            fs.unlink(filePath, () => reject(err));
        });
        request.end();
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
 * 删除文件夹
 * @param {string} dir_path
 * @see https://stackoverflow.com/a/42505874/3027390
 */
export function delFolder(dir_path) {
    if (fs.existsSync(dir_path)) {
        fs.readdirSync(dir_path).forEach(function (entry) {
            let entry_path = path.join(dir_path, entry);
            if (fs.lstatSync(entry_path).isDirectory()) {
                delFolder(entry_path);
            } else {
                fs.unlinkSync(entry_path);
            }
        });
        fs.rmdirSync(dir_path);
    }
}

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
 * 检查Module是否安装，而不加载Module
 * @param req_module
 * @returns {boolean}
 */
export function hasModule(req_module) {
    try {
        require.resolve(req_module);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * 是否是调试的地址（用于菜单和打开开发者工具）
 */
export function isDebugUrl() {
    let url = config.mainUrl;
    return !app.isPackaged || (app.isPackaged && (url.indexOf('localhost') >= 0 || url.indexOf('cnbeta.com') >= 0));
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
 * 重置参数值（启动时重置部分数据为false）
 */
export function resetDefaultObject() {
    store.reset(Object.keys(config.defaultStoreValue));

    // 安装的模块（启动时重置安装的模块的标识）
    let modules = store.get('MODULE');
    if (null !== modules && typeof modules === 'object') {
        let moduleKeys = Object.keys(modules);
        if (moduleKeys !== null && moduleKeys.length > 0) {
            store.reset(moduleKeys);
        }
    }
}

/**
 * 获取Appium端口
 */
export function getAppiumPort() {
    return store.get('APPIUM_PORT');
}

/**
 * 获取chromedriver端口
 */
export function getChromedriverPort() {
    return store.get('CHROMEDRIVER_PORT');
}

ipcMain.answerRenderer('utils', (funcName) => {
    let result = ''; // Function Not Found
    if (typeof (eval(funcName)) == "function") {
        result = eval(funcName + "();");
    }
    return result;
});
/*const {ipcRenderer: ipc} = require('electron-better-ipc');
(async () => {
    const cdport = await ipc.callMain('utils', 'getChromedriverPort');
    console.log(cdport);
})();*/
