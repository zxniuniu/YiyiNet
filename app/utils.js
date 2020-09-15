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
import pFun from 'p-fun';
import cp from 'child_process';
import fse from "live-plugin-manager/node_modules/fs-extra";
import tar from 'live-plugin-manager/node_modules/tar';

// https://www.jianshu.com/p/4b58711cb72a
let fetch = require("node-fetch");
// import {DownloaderHelper} from 'node-downloader-helper';

/*
let remote = require('electron').remote; let app = remote.app; let path = require('path'); let fs = require('fs'); let fetch = require("node-fetch");
let http = require('http'); let https = require('https'); let net = require('net');
let StreamZip = require('node-stream-zip'); let fse = require('live-plugin-manager/node_modules/fs-extra'); let tar = require('live-plugin-manager/node_modules/tar');
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
    return checkPath(path.join(getUserData(), 'Tools'));
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
    return checkPath(path.join(getUserData(), 'Python'));
};

/**
 * 获取Python所在路径
 */
export const getPythonFilePath = () => {
    return path.join(getPythonFolder(), getPythonExeName());
};

/**
 * 获取Python Pip所在路径
 */
export const getPythonPipPath = () => {
    return path.join(getPythonFolder(), 'Scripts', 'pip.exe');
};

/**
 * 获取Python的Scripts所在路径
 */
export const getPythonScriptsPath = () => {
    return checkPath(path.join(getUserData(), 'Scripts'));
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
    return checkPath(path.join(getUserData(), 'Chrome'));
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
    return checkPath(path.join(getUserData(), 'Firefox'));
};

/**
 * 获取Python所在路径
 */
export const getFirefoxFilePath = () => {
    return path.join(getFirefoxFolder(), getFirefoxExeName());
};

// =====================================================================================================================
/**
 * 获取Jre所在路径
 */
export const getJreFolder = () => {
    return checkPath(path.join(getUserData(), 'Jre'));
};

/**
 * 获取Jre所在路径（exe路径）
 */
export const getJrePath = () => {
    return path.join(getJreFolder(), 'bin', 'java.exe');
};

// =====================================================================================================================
/**
 * 获取7Zip所在路径
 */
export const get7ZipFolder = () => {
    return checkPath(path.join(getToolsPath(), '7zip'));
};

/**
 * 获取7Zip所在路径（exe路径）
 */
export const get7ZipPath = () => {
    return path.join(get7ZipFolder(), '7za.exe');
};

// =====================================================================================================================
/**
 * 获取Nox所在路径
 */
export const getNoxFolder = () => {
    return checkPath(path.join(getUserData(), 'NoxPlayer'));
};

/**
 * 获取Jre所在路径（exe路径）
 */
export const getNoxPath = () => {
    return path.join(getNoxFolder(), 'bin', 'Nox.exe');
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

export function exec(cmd) {
    console.log('执行Cmd命令：' + cmd);
    return new Promise(function(resolve, reject) {
        cp.exec(cmd, {
            maxBuffer: 1024 * 2000
        }, function(err, stdout, stderr) {
            if (err) {
                reject(err);
            } else if (stderr.lenght > 0) {
                reject(new Error(stderr.toString()));
            } else {
                resolve(stdout);
            }
        });
    });
}

/**
 * 检查过去的天数
 * @param startDate
 * @returns {number}
 */
export function pastDays(startDate) {
    return (Date.now() - startDate) / 1000 / 60 / 60 / 24;
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
 * 解析获取最快的链接地址
 * @returns {Promise<PCancelable<unknown> | *>}
 */
export async function fastUrl(urlArr, urlpath) {
    let got = require('got');
    let pFun = require('p-fun');
    let taskArr = [];
    urlpath = urlpath === undefined || urlpath === null ? '' : urlpath;
    urlArr.forEach(url => {
        taskArr.push(got.head(url + urlpath).then(() => url));
    });
    return pFun.any(taskArr);
}

/**
 * 解析获取mozilla最快的链接地址
 * @returns {Promise<PCancelable<unknown> | *>}
 */
export async function fastMozillaUrl(urlpath) {
    let mozillaUrls = ['http://download-origin.cdn.mozilla.net', 'http://archive.mozilla.org', 'http://ftp.mozilla.org',
        'https://archive.mozilla.org', 'https://download-origin.cdn.mozilla.net', 'https://ftp.mozilla.org'];
    return fastUrl(mozillaUrls, urlpath);
}

/**
 * 解析获取NPM最快的链接地址
 * @returns {Promise<PCancelable<unknown> | *>}
 */
export async function fastNpmUrl(urlpath) {
    let npmUrlArr = ['https://npm.taobao.org/mirrors', 'https://mirrors.huaweicloud.com', 'https://cnpmjs.org/mirrors'];
    return fastUrl(npmUrlArr, urlpath);
}

/**
 * 解析获取Github最快的链接地址
 * @returns {Promise<PCancelable<unknown> | *>}
 */
export async function fastGithubUrl(urlpath) {
    // http://element-ui.cn/article/show-101839.aspx
    // https://github.com/FastGitORG/github-accelerator
    // https://doc.fastgit.org/zh-cn/
    let githubUrlArr = ['https://hub.fastgit.org', 'https://github.com.cnpmjs.org', 'https://github.com'
        /*'https://g.ioiox.com/https://github.com', 'https://gh.api.99988866.xyz/https://github.com', 'https://github.wuyanzheshui.workers.dev'*/];
    return fastUrl(githubUrlArr, urlpath);
}

/**
 * 解析获取Github Raw最快的链接地址
 * @returns {Promise<PCancelable<unknown> | *>}
 */
export async function fastGithubRawUrl(urlpath) {
    // http://element-ui.cn/article/show-101839.aspx
    // https://doc.fastgit.org/zh-cn/node.html
    let githubRawUrlArr = ['https://raw.fastgit.org', 'https://raw.githubusercontent.com'];
    return fastUrl(githubRawUrlArr, urlpath);
}

/**
 * 解析获取Python最快的镜像地址
 * @returns {Promise<PCancelable<unknown> | *>}
 */
export async function fastPypiUrl(urlpath) {
    // https://www.cnblogs.com/yuki-nana/p/10898774.html
    let pypiUrls = ['https://mirrors.aliyun.com/pypi/simple/', 'https://pypi.douban.com/simple/', 'https://pypi.tuna.tsinghua.edu.cn/simple',
        'https://pypi.mirrors.ustc.edu.cn/simple/'];
    return fastUrl(pypiUrls, urlpath);
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
 * 解压Zip文件
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
            // fs.unlinkSync(zipFile);
            zip.close();
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
 * 解压Tar文件
 * @param tarFile
 * @param folder
 * @returns {Promise<unknown>}
 */
export function extractTar(tarFile, folder) {
    return new Promise((resolve, reject) => {
        tar.extract({
            cwd: folder,
            file: tarFile
        }).then(() => {
            resolve(folder);
        }).catch((err) => {
            reject(err);
        })
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
            resolve(res.headers.get('location') || res.headers.get('content-location'));
        }).catch(err => {
            reject(err);
        })
    });
}

/**
 * 下载小文件
 * @param url
 * @param filePath 文件保存位置，包括文件名
 * @param options
 * @returns {Promise<unknown>}
 */
export async function downloadSmall(url, filePath, options) {
    return new Promise((resolve, reject) => {
        fetch(url, {
            method: 'GET',
            headers: {'Content-Type': 'application/octet-stream'},
            ...options || {},
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
 * @param fileURL 文件下载路径
 * @param filePath 文件保存位置，包括文件名
 * @param options node-fetch的参数
 * @returns {Promise<unknown>}
 */
export async function downloadLarge(fileURL, filePath, options) {
    return new Promise((resolve, reject) => {
        //缓存文件路径
        let tmpFileSavePath = filePath + ".tmp";
        let totalBytes = 1, logSecondInterval = 1;
        let startDate = Date.now(), curDate = Date.now();
        let fileName = path.basename(filePath);

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
                let downloadedBytes = fileStream.bytesWritten;
                if (Date.now() - startDate >= logSecondInterval * 1000) {
                    let speed = (downloadedBytes / 1024 / (Date.now() - curDate) * 1000).toFixed(2);
                    console.log('正在下载[' + fileName + ']，完成[' + (100 * downloadedBytes / totalBytes).toFixed(2) + '%]，当前['
                        + (downloadedBytes / 1024 / 1024).toFixed(2) + '/' + (totalBytes / 1024 / 1024).toFixed(2) + ']M，'
                        + '速度[' + speed + 'Kb/S]，预计还需[' + ((totalBytes - downloadedBytes) / 1024 / speed / 60).toFixed(2) + ']分钟');
                    startDate = Date.now();
                    // process.stdout.write((downloadedBytes / totalBytes * 100).toFixed(4) + '%  ');
                }
            });

        //请求文件
        fetch(fileURL, {
            method: 'GET',
            headers: {'Content-Type': 'application/octet-stream'},
            ...options || {},
            // timeout: 60000,
        }).then(res => {
            if (res.headers.get('redirected')) {
                let redUrl = res.headers.get('location') || res.headers.get('content-location');
                console.log('跳转链接: ' + redUrl + '，原链接：' + fileURL);
                downloadLarge(redUrl, filePath, options);
            } else {
                //获取请求头中的文件大小数据
                totalBytes = res.headers.get("content-length");
                logSecondInterval = Math.max(1, Math.round(totalBytes / 1024 / 1024 / 10));
                res.body/*.pipe(str)*/.pipe(fileStream);
            }
        }).catch(e => {
            reject(e);
        });
    });
}

/**
 * 下载OneDriver共享文件
 * @param fileURL 文件下载路径
 * @param filePath 文件保存位置，包括文件名
 * @param options node-fetch的参数
 * @returns {Promise<void>}
 */
export async function downloadOneDriver(fileURL, filePath, options) {
    // https://github.com/aploium/OneDrive-Direct-Link
    fileURL = fileURL.replace('1drv.ms', '1drv.ws');
    return downloadLarge(fileURL, filePath, options);
}

/**
 * 获取Github基础地址
 * @param type 类型：github, cnpmjs, fastgit或简写
 * @returns {string}
 */
export function getGithubUrl(type) {
    // https://doc.fastgit.org/zh-cn/node.html#%E8%8A%82%E7%82%B9%E5%88%97%E8%A1%A8
    let githubUrlLists = ['https://hub.fastgit.org', 'https://github.com.cnpmjs.org', 'https://github.com'];

    type = type === undefined || type === '' || type === null ? 'fastgit' : type;
    if (type === 'g' || type === 'git' || type === 'github' || type === 'default') {
        return githubUrlLists[2];
    } else if (type === 'c' || type === 'npm' || type === 'cnpm' || type === 'cnpmjs') {
        return githubUrlLists[1];
    } else {
        return githubUrlLists[0];
    }
}

/**
 * 使用不同的镜像路径下载最新release版本
 * @param user
 * @param rep
 * @param fileName 文件名称
 * @param savePath 保存路径（不含文件名）
 * @returns {Promise<void>}
 */
export async function downloadLatestRetry(user, rep, fileName, savePath) {
    return new Promise((resolve, reject) => {
        downloadLatest(user, rep, fileName, savePath, 'cnpmjs').then(fp => {
            resolve(fp);
        }).catch(err => {
            downloadLatest(user, rep, fileName, savePath, 'fastgit').then(fp => {
                resolve(fp);
            }).catch(err2 => {
                downloadLatest(user, rep, fileName, savePath, 'github').then(fp => {
                    resolve(fp);
                }).catch(err3 => {
                    reject('从cnpmjs, fastgit, github尝试下载均失败:' + err + err2 + err3);
                })
            })
        })
    });
}

/**
 * 下载Github发布的文件
 * @returns {Promise<unknown>}
 * @param user
 * @param rep
 * @param fileName 文件名称
 * @param savePath 保存路径（不含文件名）
 * @param baseUrl_type 类型：github, cnpmjs, fastgit或简写
 */
export async function downloadGithub(user, rep, tag, fileName, savePath, baseUrl_type) {
    if (baseUrl_type === undefined || baseUrl_type === '' || baseUrl_type === null) {
        baseUrl_type = getGithubUrl();
    } else if (!baseUrl_type.startsWith('http')) {
        baseUrl_type = getGithubUrl(baseUrl_type);
    }
    let downloadUrl = baseUrl_type.replace('hub.fas', 'download.fas') + '/' + user + '/'
        + rep + '/releases/download/' + tag + '/' + fileName;
    return new Promise((resolve, reject) => {
        downloadLarge(downloadUrl, path.join(savePath, fileName)).then(file => {
            resolve(file);
        }).catch(err => {
            reject(err);
        });
    });
}

/**
 * 获取Github最新的Tag
 * @returns {Promise<unknown>}
 * @param user
 * @param rep
 * @param baseUrl_type 类型：github, cnpmjs, fastgit或简写
 */
export async function getGithubLatestTag(user, rep, type) {
    return new Promise((resolve, reject) => {
        // https://hub.fastgit.org/zxniuniu/YiyiNet/releases/latest
        let baseUrl = getGithubUrl(type);
        let latestUrl = baseUrl + '/' + user + '/' + rep + '/releases/latest';

        getRedirected(latestUrl).then(newUrl => {
            if (newUrl === null) {
                reject('获取[' + user + '/' + rep + ']版本失败，获取结果为空');
            }else{
                // 获取最新的版本信息
                let queryVer = newUrl.substring(newUrl.lastIndexOf('/') + 1, newUrl.length);

                console.log('获取[' + user + '/' + rep + ']新版本[' + queryVer + ']');
                resolve(queryVer);
            }
        }).catch(err => {
            reject(err);
        });
    });
}

/**
 * 下载Github发布的文件
 * @returns {Promise<unknown>}
 * @param user
 * @param rep
 * @param fileName 文件名称
 * @param savePath 保存路径（不含文件名）
 * @param type 类型：github, cnpmjs, fastgit或简写
 * @param queryVer 指定Tag
 */
export async function downloadLatest(user, rep, fileName, savePath, type, queryVer) {
    let cachePath = getElectronCachePath();
    savePath = savePath === undefined || savePath === '' || savePath === null ? cachePath : savePath;

    if(queryVer === undefined || queryVer === '' || queryVer === null ) {
        queryVer = await getGithubLatestTag(user, rep, type); // .then(queryVer => {
    }
    return new Promise((resolve, reject) => {
        // https://hub.fastgit.org/zxniuniu/YiyiNet/releases/latest
        // let baseUrl = getGithubUrl(type);

        fileName = fileName.replace('{ver}', queryVer.replace('v', ''));
        let saveFile = path.join(savePath, fileName);

        // 判断当前文件是否已经下载
        let cacheCfgName = fileName + '.cfg';
        let cacheCfg = path.join(cachePath, cacheCfgName);
        if (fs.existsSync(cacheCfg) && fs.existsSync(saveFile)) {
            // TODO 解决是下载的最新，还是本来就是最新的
            resolve(saveFile);
        } else {
            // 获取到版本后进行下载
            downloadGithub(user, rep, queryVer, fileName, savePath, type).then(file => {
                fs.writeFileSync(cacheCfg, queryVer);
                resolve(file);
            }).catch(err => {
                reject(err);
            });
            /*// https://hub.fastgit.org/zxniuniu/YiyiNet/releases/download/v1.6.3/YiyiNet-web-setup-1.6.3.exe
            let downloadUrl = baseUrl.replace('hub.fas', 'download.fas') + '/' + user + '/'
                + rep + '/releases/download/' + queryVer + '/' + fileName;

            downloadLarge(downloadUrl, saveFile).then(file => {
                fs.writeFileSync(cacheCfg, queryVer);
                resolve(saveFile);
            }).catch(err => {
                reject(err);
            });*/
        }
        /*}).catch(err => {
            reject(err);
        });*/
    });
}

/**
 * 下载Github发布的多个文件
 * @returns {Promise<unknown>}
 * @param user
 * @param rep
 * @param fileNameArray 文件名称，如['a.zip', 'b.zip']
 * @param savePath 保存路径（不含文件名）
 * @param type 类型：github, cnpmjs, fastgit或简写
 */
export async function downloadLatestMultiFile(user, rep, fileNameArray, savePath, type) {
    let queryVer = await getGithubLatestTag(user, rep, type);

    let mapper = fileName => downloadLatest(user, rep, fileName, savePath, type, queryVer);
    return new Promise((resolve, reject) => {
        pFun.map(fileNameArray, mapper, {concurrency: Math.min(5, fileNameArray.length), stopOnError: false})
            .then(result => {
                if (fileNameArray.length === 1) {
                    resolve(result[0]);
                } else {
                    resolve(result);
                }
            }).catch(err => {
                reject(err);
            });
    });
}

// =====================================================================================================================
/**
 * 睡眠毫秒
 * @param ms 暂停毫秒数
 * @returns {Promise<unknown>}
 */
export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
 * 移动文件夹
 * @param fromFolder
 * @param toFolder
 * @returns {Promise<unknown>}
 */
export function moveFolder(fromFolder, toFolder) {
    return new Promise((resolve, reject) => {
        fse.move(fromFolder, toFolder, {overwrite: true}, err => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        })
    });
}

/**
 * 删除文件夹
 * @param folder
 * @see https://stackoverflow.com/a/42505874/3027390
 * @returns {Promise<unknown>}
 */
export function removeFolder(folder) {
    return new Promise((resolve, reject) => {
        fse.remove(folder, err => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });

    /*if (fs.existsSync(dir_path)) {
        fs.readdirSync(dir_path).forEach(function (entry) {
            let entry_path = path.join(dir_path, entry);
            if (fs.lstatSync(entry_path).isDirectory()) {
                delFolder(entry_path);
            } else {
                fs.unlinkSync(entry_path);
            }
        });
        fs.rmdirSync(dir_path);
    }*/
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
