import fs from "fs";
import path from "path";
import StreamZip from "node-stream-zip";
import AsyncLock from 'async-lock';
import {
    downloadFile,
    downloadLarge,
    downloadOneDriver,
    extractTar,
    get7ZipFolder,
    get7ZipPath,
    getChromedriverExeName,
    getChromedriverFilePath,
    getElectronCachePath,
    getJreFolder,
    getJrePath,
    getPythonFilePath,
    getPythonFolder,
    getRedirected,
    getUserData,
    getV2rayCoreExe,
    getYoutubeDlExe,
    moveFolder,
    pastDays,
    removeFolder
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

    // let pythonName = getPythonExeName();
    let storeVer = store.get('TOOLS.PYTHON_VER', '3.8.5');
    store.set('TOOLS.PYTHON_VER', storeVer);

    if (fs.existsSync(pythonFilePath)) {
        store.set('TOOLS.PYTHON_STATUS', true);
        return;
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
 * @returns {Promise<unknown>}
 * @param user
 * @param rep
 * @param fileName
 * @param savePath
 * @param type
 */
export async function downloadGithub(user, rep, tag, fileName, savePath, baseUrl) {
    if (baseUrl === undefined || baseUrl === '' || baseUrl === null) {
        baseUrl = getGithubUrl();
    } else if (!baseUrl.startsWith('http')) {
        baseUrl = getGithubUrl(baseUrl);
    }
    let downloadUrl = baseUrl.replace('hub.fas', 'download.fas') + '/' + user + '/' + rep + '/releases/download/' + tag + '/' + fileName;
    return new Promise((resolve, reject) => {
        downloadLarge(downloadUrl, savePath).then(file => {
            resolve(file);
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
 * @param fileName
 * @param savePath
 * @param type
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
                downloadGithub(user, rep, queryVer, fileName, savePath, baseUrl).then(file => {
                    fs.writeFileSync(cacheCfg, queryVer);
                    resolve(file);
                }).catch(err => {
                    reject(err);
                });

                /*// https://hub.fastgit.org/zxniuniu/YiyiNet/releases/download/v1.6.3/YiyiNet-web-setup-1.6.3.exe
                let downloadUrl = baseUrl.replace('hub.fas', 'download.fas') + '/' + user + '/' + rep
                    + '/releases/download/' + queryVer + '/' + fileName;

                downloadLarge(downloadUrl, saveFile).then(file => {
                    fs.writeFileSync(cacheCfg, queryVer);
                    resolve(saveFile);
                }).catch(err => {
                    reject(err);
                });*/
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
    let youtubeDate = store.get('TOOLS.YOUTUBE_DL_DATE', 0);
    let needDownload = pastDays(youtubeDate) > store.get('TOOLS_DOWNLOAD_INTERVAL_DAYS', 10);
    let youtubeDlExe = getYoutubeDlExe();

    if (!fs.existsSync(youtubeDlExe) || needDownload) {
        downloadLatestRetry('ytdl-org', 'youtube-dl', 'youtube-dl.exe').then(filePath => {
            fs.copyFile(filePath, youtubeDlExe, () => {
                store.set('TOOLS.YOUTUBE_DL', true);
                store.set('TOOLS.YOUTUBE_DL_DATE', Date.now());
            });
            console.log('工具[youtube-dl]下载成功，路径：' + filePath);
        });
    } else {
        store.set('TOOLS.YOUTUBE_DL', true);
    }
}

function downloadV2rayCore() {
    // 下载v2ray代理工具
    let v2rayDate = store.get('TOOLS.V2RAY_DATE', 0);
    let needDownload = pastDays(v2rayDate) > store.get('TOOLS_DOWNLOAD_INTERVAL_DAYS', 10);
    let v2rayExe = getV2rayCoreExe();

    if (!fs.existsSync(v2rayExe) || needDownload) {
        let platform = process.platform === 'win32' ? 'windows' : '';
        let arch = process.arch.replace('x', '');
        let v2rayZip = 'v2ray-' + platform + '-' + arch + '.zip';

        downloadLatestRetry('v2ray', 'v2ray-core', v2rayZip).then(filePath => {
            extractZip(filePath, path.dirname(v2rayExe)).then(() => {
                store.set('TOOLS.V2RAY_CORE', true);
                store.set('TOOLS.V2RAY_DATE', Date.now());
            });
            console.log('工具[v2ray-core]下载成功，路径：' + filePath);
        });
    } else {
        store.set('TOOLS.V2RAY_CORE', true);
    }
}

function downloadJre() {
    let jreExe = getJrePath();
    let jreStatus = store.get('INSTALL.JRE_STATUS', false);
    if (!fs.existsSync(jreExe) || !jreStatus) {
        let version = '8u131', buildNum = '11';
        // https://download.oracle.com/otn-pub/java/jdk/8u131-b11/d54c1d3a095b4ff2b6607d096fa80163/jre-8u131-windows-x64.tar.gz
        let url = getJreDownloadUrl(version, buildNum);

        let fileTar = path.join(getElectronCachePath(), url.substring(url.lastIndexOf('/') + 1, url.length));
        if (!fs.existsSync(fileTar)) {
            downloadLarge(url, fileTar, {
                headers: {
                    connection: 'keep-alive',
                    'Cookie': 'gpw_e24=http://www.oracle.com/; oraclelicense=accept-securebackup-cookie'
                },
                agent: null,
                insecureHTTPParser: true
            }).then(() => {
                console.log('Jre下载成功，使用路径:', url);

                extractFile(fileTar, version);
            })
        }
        extractFile(fileTar, version);

        function extractFile(fileTar, version) {
            //下载完成后解压缩文件
            let jreFolder = getJreFolder(), userData = getUserData();
            extractTar(fileTar, userData).then(() => {
                let subFolder = 'jre1.' + version.replace('u', '.0_');
                moveFolder(path.join(userData, subFolder), jreFolder).then(() => {
                    console.log('Jre解压成功，解压到:', jreFolder);
                    store.set('INSTALL.JRE_STATUS', true);

                    removeFolder(path.join(userData, subFolder)).then(() => {
                    });
                })
            })
        }

        function getJreDownloadUrl(version, buildNum) {
            let hash = 'd54c1d3a095b4ff2b6607d096fa80163';
            let platform = process.platform;
            platform = platform === 'darwin' ? 'macosx' : platform === 'win32' ? 'windows' : platform;
            let arch = process.arch;
            arch = arch === 'ia32' || arch === 'x86' ? 'i586' : arch;

            return 'https://download.oracle.com/otn-pub/java/jdk/' + version + '-b' + buildNum
                + '/' + hash + '/jre-' + version + '-' + platform + '-' + arch + '.tar.gz';
        }
    } else {
        store.set('INSTALL.JRE_STATUS', true);
    }
}

function download7Zip() {
    // https://www.7-zip.org
    let zip7 = get7ZipPath(), zip7Status = store.get('INSTALL.ZIP7_STATUS', false);
    if (!fs.existsSync(zip7) || !zip7Status) {
        let fileName = '7zip-win32' + (process.arch === 'x64' ? '-x64' : '') + '.tar.gz'; // 7zip-win32-x64.tar.gz, // 7zip-win32.tar.gz
        let zip7Path = path.join(getElectronCachePath(), fileName);
        downloadGithub('zxniuniu', 'NoxPlayer', '7zip', '', zip7Path).then(zip7Path => {
            extractTar(zip7Path, get7ZipFolder()).then((folder) => {
                console.log('7-zip下载完成并解压到：' + folder);
                store.set('TOOLS.ZIP7_STATUS', true);
            })
        })
    } else {
        store.set('TOOLS.ZIP7_STATUS', true);
    }
}

async function downloadNox() {
    let fileUrl = 'https://1drv.ms/u/s!AhWOz52LWPzx8RB6abXXw7jMLWqo?e=HpX7MB';
    downloadOneDriver(fileUrle);

}


export function downloadAllTools() {
    downloadYoutubeDl();

    downloadV2rayCore();

    downloadJre();

    download7Zip();
}
