import {app, nativeImage} from 'electron';
import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import zlib from 'zlib';

import config from "./configs/app.config";
import store from './configs/settings';
import {ipcMain} from 'electron-better-ipc';
import StreamZip from "node-stream-zip";

// https://www.jianshu.com/p/4b58711cb72a
let fetch = require("node-fetch");
// import {DownloaderHelper} from 'node-downloader-helper';

/*
var remote = require('electron').remote; var app = remote.app;
var path = require('path'); var fs = require('fs'); var fetch = require("node-fetch");
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
 * 获取工具类保存路径
 */
export const getToolsPath = () => {
    return checkPath(path.join(getRootPath(), 'tools'));
};

/**
 * 获取YoutubeDl路径
 */
export const getYoutubeDlExe = () => {
    return path.join(getToolsPath(), 'youtube-dl.exe');
};

/**
 * 获取V2rayCore路径
 */
export const getV2rayCoreExe = () => {
    let v2rayFolder = checkPath(path.join(getToolsPath(), 'v2ray'));
    return path.join(v2rayFolder, 'v2ray.exe');
};

/**
 * 获取chromedriver文件名（平台兼容）
 */
export const getChromedriverExeName = () => {
    return 'chromedriver' + (process.platform === 'win32' ? '.exe' : '');
};

// =====================================================================================================================
/**
 * 获取Python所有Exe
 */
export const getPythonExeName = () => {
    return 'python' + (process.platform === 'win32' ? '.exe' : '');
};

/**
 * 获取Python所在路径
 */
export const getPythonFolder = () => {
    return checkPath(path.join(getRootPath(), 'python'));
};

/**
 * 获取Python所在路径
 */
export const getPythonFilePath = () => {
    return path.join(getPythonFolder(), getPythonExeName());
};


// =====================================================================================================================
/**
 * 获取Chrome所有Exe
 */
export const getChromeExeName = () => {
    return 'chrome' + (process.platform === 'win32' ? '.exe' : '');
};

/**
 * 获取Chrome所在路径
 */
export const getChromeFolder = () => {
    return checkPath(path.join(getRootPath(), 'chrome'));
};

/**
 * 获取Chrome所在路径
 */
export const getChromeFilePath = () => {
    return path.join(getChromeFolder(), getChromeExeName());
};

// =====================================================================================================================
/**
 * 获取Firefox所有Exe
 */
export const getFirefoxExeName = () => {
    return 'firefox' + (process.platform === 'win32' ? '.exe' : '');
};

/**
 * 获取Firefox所在路径
 */
export const getFirefoxFolder = () => {
    return checkPath(path.join(getRootPath(), 'firefox'));
};

/**
 * 获取Python所在路径
 */
export const getFirefoxFilePath = () => {
    return path.join(getFirefoxFolder(), getFirefoxExeName());
};

// =====================================================================================================================
/*
 * 复制目录、子目录，及其中的文件
 * @param src {String} 要复制的目录
 * @param dist {String} 复制到目标目录
 */
function copyDir(src, dist, callback) {
    fs.access(dist, function (err) {
        if (err) {
            // 目录不存在时创建目录
            fs.mkdirSync(dist);
        }
        _copy(null, src, dist);
    });

    function _copy(err, src, dist) {
        if (err) {
            callback(err);
        } else {
            fs.readdir(src, function (err, paths) {
                if (err) {
                    callback(err)
                } else {
                    paths.forEach(function (path) {
                        let _src = src + '/' + path;
                        let _dist = dist + '/' + path;
                        fs.stat(_src, function (err, stat) {
                            if (err) {
                                callback(err);
                            } else {
                                // 判断是文件还是目录
                                if (stat.isFile()) {
                                    fs.writeFileSync(_dist, fs.readFileSync(_src));
                                } else if (stat.isDirectory()) {
                                    // 当是目录是，递归复制
                                    copyDir(_src, _dist, callback)
                                }
                            }
                        })
                    })
                }
            })
        }
    }
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
 * 解压文件情况
 * @param zipFile
 * @param folder
 * @returns {Promise<unknown>}
 */
export function extractZip(zipFile, folder) {
    return new Promise((resolve, reject) => {
        const zip = new StreamZip({
            file: zipFile,
            storeEntries: true
        });
        zip.on('error', err => {
            // 如果出错，说明压缩包有问题，将其删除
            fs.unlinkSync(zipFile);
            reject(err);
        });
        zip.on('ready', () => {
            zip.extract(null, folder, (err, count) => {
                zip.close();
                resolve();
            });
        });
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
 * 获取Url对应的HTML
 * @param url
 * @returns {Promise<unknown>}
 */
export async function getHtml(url) {
    return new Promise((resolve, reject) => {
        fetch(url, {
            method: 'GET'
        }).then(res => {
            resolve(res.text());
        }).catch(err => {
            reject(err);
        })
    });
}

/**
 * 获取Url对应的JSON
 * @param url
 * @returns {Promise<unknown>}
 */
export async function getJson(url) {
    return new Promise((resolve, reject) => {
        fetch(url, {
            method: 'GET'
        }).then(res => {
            resolve(res.json());
        }).catch(err => {
            reject(err);
        })
    });
}

/**
 * 获取Url跳转的地址
 * @param url
 * @returns {Promise<unknown>}
 */
export async function getRedirected(url) {
    return new Promise((resolve, reject) => {
        fetch(url, {
            method: 'GET',
            redirect: 'manual',
            follow: 0
        }).then(res => {
            resolve(res.headers.get('location'));
        }).catch(err => {
            reject(err);
        })
    });
}

/**
 * 下载小文件
 * @param url
 * @param filePath 文件保存位置，包括文件名
 * @returns {Promise<unknown>}
 */
export async function downloadSmall(url, filePath) {
    return new Promise((resolve, reject) => {
        fetch(url, {
            method: 'GET',
            headers: {'Content-Type': 'application/octet-stream'},
        }).then(res => res.buffer()).then(_ => {
            fs.writeFile(filePath, _, "binary", function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(filePath);
                }
            });
        }).catch(err => {
            reject(err);
        })
    });
}

/**
 * 下载大文件
 * @param fileURL
 * @param filePath 文件保存位置，包括文件名
 * @returns {Promise<unknown>}
 */
export async function downloadLarge(fileURL, filePath) {
    return new Promise((resolve, reject) => {
        //缓存文件路径
        let tmpFileSavePath = filePath + ".tmp";
        let fsize = 1, inteSecond = 1, startDate = Date.now();

        //创建写入流
        let fileStream = fs.createWriteStream(tmpFileSavePath)
            .on('error', function (e) {
                console.error('error==>', e);
                reject(e);
            }).on('ready', function () {
                console.log("开始下载:", fileURL);
            }).on('finish', function () {
                //下载完成后重命名文件
                fs.renameSync(tmpFileSavePath, filePath);
                console.log('下载完成:', filePath);
                resolve(filePath);
            }).on('drain', function () {
                let curByte = fileStream.bytesWritten;
                if (Date.now() - startDate >= inteSecond * 1000) {
                    startDate = Date.now();
                    console.log('文件下载[' + filePath + ']，当前完成：' + (100 * curByte / fsize).toFixed(2)
                        + '%，大小[' + (curByte / 1024 / 1024).toFixed(2) + '/'
                        + (fsize / 1024 / 1024).toFixed(2) + ']M');
                    // process.stdout.write((curByte / fsize * 100).toFixed(4) + '%  ');
                }
            });

        //请求文件
        fetch(fileURL, {
            method: 'GET',
            headers: {'Content-Type': 'application/octet-stream'},
            // timeout: 60000,
        }).then(res => {
            //获取请求头中的文件大小数据
            fsize = res.headers.get("content-length");
            inteSecond = Math.max(1, Math.round(fsize / 1024 / 1024 / 10));

            /*//创建进度
            let str = progressStream({
                length: fsize,
                time: 100 /!* ms *!/
            });
            // 下载进度
            str.on('progress', function (progressData) {
                //不换行输出
                let percentage = Math.round(progressData.percentage) + '%';
                console.log(percentage);
            });*/
            res.body/*.pipe(str)*/.pipe(fileStream);
        }).catch(e => {
            reject(e);
        });
    });
}

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
};

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
};

/**
 * 是否是调试的地址（用于菜单和打开开发者工具）
 */
export function isDebugUrl() {
    let url = config.mainUrl;
    return !app.isPackaged || (app.isPackaged && (url.indexOf('localhost') >= 0 || url.indexOf('cnbeta.com') >= 0));
};

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
