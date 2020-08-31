import fs from "fs";
import path from "path";
import StreamZip from "node-stream-zip";
import AsyncLock from 'async-lock';

import {
    downloadFile,
    downloadLarge,
    extractZip,
    getChromedriverExeName,
    getChromedriverFilePath,
    getElectronCachePath,
    getPythonExeName,
    getPythonFilePath,
    getPythonFolder,
    getRedirected,
    getV2rayCoreExe,
    getYoutubeDlExe
} from "../utils";
import store from "../configs/settings";

// https://doc.fastgit.org/zh-cn/node.html#%E8%8A%82%E7%82%B9%E5%88%97%E8%A1%A8
let githubUrlLists = ['https://hub.fastgit.org', 'https://github.com.cnpmjs.org', 'https://github.com'];

export function downloadDriverFiles() {
    downloadChromedriver();

    downloadPython();

}

/**
 * 下载Chromedriver
 */
function downloadChromedriver() {
    let chromedriverFilePath = getChromedriverFilePath(); //
    if (fs.existsSync(chromedriverFilePath)) {
        return;
    }

    let chromedriverName = getChromedriverExeName();
    let ver = process.versions.electron, platform = process.platform, arch = process.arch;
    let cachePath = getElectronCachePath();

    // 下载并将chromedriver放到根目录
    let chromedriverFilename = 'chromedriver-v' + ver + '-' + platform + '-' + arch;
    let chromedriverLocalZip = path.join(cachePath, chromedriverFilename + '.zip');
    let chromedriverExe = path.join(cachePath, chromedriverFilename, chromedriverName);

    // 检测是否下载，未下载，则下载
    // let chromedriverUrl = 'https://npm.taobao.org/mirrors/electron/9.1.2/chromedriver-v9.1.2-win32-x64.zip';
    let chromedriverUrl = 'https://cdn.npm.taobao.org/dist/electron/' + ver + '/' + chromedriverFilename + '.zip';
    let iLock = new AsyncLock({timeout: 60000});
    if (!fs.existsSync(chromedriverLocalZip)) {
        iLock.acquire("downloadChromedriver", function (done) {
            console.log('下载Chromedriver：' + chromedriverUrl);
            downloadFile(chromedriverUrl, chromedriverLocalZip).then(() => {
                done();
            })
        }, function (err, ret) {
        }, {});
    }

    // 下载完成后解压
    if (!fs.existsSync(chromedriverExe)) {
        iLock.acquire("downloadChromedriver", function (done) {
            console.log('解压Chromedriver：' + chromedriverLocalZip);
            let folder = path.join(cachePath, chromedriverFilename);
            if (!fs.existsSync(folder)) {
                fs.mkdirSync(folder, {recursive: true});
            }
            /*// 采用JSZip反应太慢
            fs.readFile(chromedriverLocalZip, function(err, data) {
                if (err) throw err;
                loadAsync(data).then(zip => {
                    // console.log(zip.files);
                    zip.files[chromedriverName].nodeStream().pipe(fs.createWriteStream(path.join(folder, chromedriverName)))
                        .on('finish', function () {
                            done();
                        });
                });
            });*/
            const zip = new StreamZip({
                file: chromedriverLocalZip,
                storeEntries: true
            });
            zip.on('error', err => {
                // 如果出错，说明压缩包有问题，将其删除
                fs.unlinkSync(chromedriverLocalZip);
            });
            zip.on('ready', () => {
                zip.extract(null, folder, (err, count) => {
                    zip.close();
                    done();
                });
            });
        }, function (err, ret) {
        }, {});
    }

    // 复制到软件根目录
    iLock.acquire("downloadChromedriver", function (done) {
        if (fs.existsSync(chromedriverExe)) {
            fs.copyFile(chromedriverExe, chromedriverFilePath, (err) => {
                if (err) throw err;
                console.log('复制以下文件到根目录：' + chromedriverExe);
                done();
            });
        }
    }, function (err, ret) {
    }, {});
}

/**
 * 下载Python
 */
function downloadPython() {
    let pythonFilePath = getPythonFilePath(); //
    if (fs.existsSync(pythonFilePath)) {
        return;
    }

    let pythonName = getPythonExeName();
    let storeVer = store.get('TOOLS.PYTHON_VER'), ver = '3.8.5';
    if (storeVer !== undefined && storeVer !== null && storeVer !== '') {
        ver = storeVer;
    } else {
        store.set('TOOLS.PYTHON_VER', ver);
    }
    let arch = process.arch;
    let cachePath = getElectronCachePath();

    // 下载并将python放到目录
    let pythonFilename = 'python-' + ver + '-embed-' + (arch === 'x64' ? 'amd64' : 'win32');
    let pythonLocalZip = path.join(cachePath, pythonFilename + '.zip');

    // 检测是否下载，未下载，则下载
    // https://npm.taobao.org/mirrors/python/3.8.5/python-3.8.5-embed-amd64.zip https://npm.taobao.org/mirrors/python/3.8.5/python-3.8.5-embed-win32.zip
    let pythonUrl = 'https://npm.taobao.org/mirrors/python/' + ver + '/' + pythonFilename + '.zip';
    let iLock = new AsyncLock({timeout: 60000});
    if (!fs.existsSync(pythonLocalZip)) {
        iLock.acquire("downloadPython", function (done) {
            console.log('下载Python：' + pythonUrl);
            downloadFile(pythonUrl, pythonLocalZip).then(() => {
                done();
            })
        }, function (err, ret) {
        }, {});
    }

    // 下载完成后解压
    iLock.acquire("downloadPython", function (done) {
        console.log('解压Python：' + pythonLocalZip);
        const zip = new StreamZip({
            file: pythonLocalZip,
            storeEntries: true
        });
        zip.on('error', err => {
            // 如果出错，说明压缩包有问题，将其删除
            fs.unlinkSync(pythonLocalZip);
        });
        zip.on('ready', () => {
            zip.extract(null, getPythonFolder(), (err, count) => {
                zip.close();
                store.set('TOOLS.PYTHON_STATUS', true);
                done();
            });
        });
    }, function (err, ret) {
    }, {});

}

export function getGithubUrl(type) {
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
 * @param fileName
 * @param savePath
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
 * @param fileURL
 * @param filePath 文件保存位置，包括文件名
 * @returns {Promise<unknown>}
 */
export async function downloadLatest(user, rep, fileName, savePath, type) {
    let cachePath = getElectronCachePath();
    savePath = savePath === undefined || savePath === '' || savePath === null ? cachePath : savePath;

    return new Promise((resolve, reject) => {
        // https://hub.fastgit.org/zxniuniu/YiyiNet/releases/latest
        let baseUrl = getGithubUrl(type);
        let latestUrl = baseUrl + '/' + user + '/' + rep + '/releases/latest';

        getRedirected(latestUrl).then(newUrl => {
            if (newUrl === null) {
                reject('获取[' + user + '/' + rep + ']版本失败，获取结果为空，跳过下载');
            }
            console.log('获取[' + user + '/' + rep + ']版本新路径[' + newUrl + ']');

            // 获取最新的版本信息
            let queryVer = newUrl.substring(newUrl.lastIndexOf('/') + 1, newUrl.length);

            fileName = fileName.replace('{ver}', queryVer.replace('v', ''));
            let saveFile = path.join(savePath, fileName);

            // 判断当前文件是否已经下载
            let cacheCfgName = fileName.substring(0, fileName.lastIndexOf('.')) + '-' + queryVer + '.cfg';
            let cacheCfg = path.join(cachePath, cacheCfgName);
            if (fs.existsSync(cacheCfg) && fs.existsSync(saveFile)) {
                // TODO 解决是下载的最新，还是本来就是最新的
                resolve(saveFile);
            } else {
                // 获取到版本后进行下载
                // https://hub.fastgit.org/zxniuniu/YiyiNet/releases/download/v1.6.3/YiyiNet-web-setup-1.6.3.exe
                let downloadUrl = baseUrl.replace('hub.fas', 'download.fas') + '/' + user + '/' + rep
                    + '/releases/download/' + queryVer + '/' + fileName;

                downloadLarge(downloadUrl, saveFile).then(file => {
                    fs.writeFileSync(cacheCfg, queryVer);
                    resolve(saveFile);
                }).catch(err => {
                    reject(err);
                });
            }
        }).catch(err => {
            reject(err);
        });
    });
}

/**
 * Youtube-Dl工具下载
 */
function downloadYoutubeDl() {
    // 下载youtube-dl视频下载工具
    downloadLatestRetry('ytdl-org', 'youtube-dl', 'youtube-dl.exe').then(filePath => {
        fs.copyFile(filePath, getYoutubeDlExe(), () => {
            store.set('TOOLS.YOUTUBE_DL', true);
        });
        console.log('工具[youtube-dl]下载成功，路径：' + filePath);
    });
}

/**
 * V2ray-core工具下载
 */
function downloadV2rayCore() {
    // 下载v2ray代理工具
    let platform = process.platform === 'win32' ? 'windows' : '';
    let arch = process.arch.replace('x', '');
    let v2rayZip = 'v2ray-' + platform + '-' + arch + '.zip';
    downloadLatestRetry('v2ray', 'v2ray-core', v2rayZip).then(filePath => {
        extractZip(filePath, path.dirname(getV2rayCoreExe())).then(() => {
            store.set('TOOLS.V2RAY_CORE', true);
        });
        console.log('工具[v2ray-core]下载成功，路径：' + filePath);
    });
}

export function downloadAllTools() {
    downloadYoutubeDl();

    downloadV2rayCore();

}
