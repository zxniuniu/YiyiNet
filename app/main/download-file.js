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
    getToolsPath,
    moveFolder,
    extractZip,
    pastDays,
    removeFolder,
    getGithubUrl,
    downloadLatestRetry,
    downloadGithub,
    downloadLatest,
    downloadLatestMultiFile,
    getNoxFolder,
    getNoxPath,
    exec
} from "../utils";
import store from "../configs/settings";
import pFun from 'p-fun';

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
    console.log('jreStatus=' + jreStatus + ', jreExe=' + jreExe);

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
        }else {
            extractFile(fileTar, version);
        }

        function extractFile(fileTar, version) {
            //下载完成后解压缩文件
            let jreFolder = getJreFolder(), userData = getUserData();
            extractTar(fileTar, userData).then(() => {
                let subFolder = 'jre1.' + version.replace('u', '.0_');
                moveFolder(path.join(userData, subFolder), jreFolder).then(() => {
                    console.log('Jre解压成功，解压到:', jreFolder);
                    store.set('INSTALL.JRE_STATUS', true);

                    // removeFolder(path.join(userData, subFolder)).then(() => {});
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
    // 7za.exe a -t7z -r -m0=LZMA2 -mx=9 test-7z-0-lzma2 jre
    // 7za.exe a -t7z -r -m0=LZMA2 -mx9 -v90m test-7z-0-lzma2 jre
    // 7za.exe x test-7z-0-lzma2.7z -oabc
    let zip7Status = store.get('INSTALL.ZIP7_STATUS', false);
    let zip7 = get7ZipPath();
    console.log('zip7Status=' + zip7Status + ', zip7=' + zip7);

    if (!fs.existsSync(zip7)/* || !zip7Status*/) {
        let fileName = '7zip-windows-' + (process.arch === 'x64' ? 'x64' : 'ia32') + '-{ver}.zip';
        downloadLatestRetry('zxniuniu', '7-zip', fileName).then(filePath => {
            let toolsPath = getToolsPath(), zip7Folder = get7ZipFolder();
            extractZip(filePath, toolsPath).then(() => {
                moveFolder(path.join(toolsPath, path.basename(filePath, '.zip')), zip7Folder).then(() => {
                    console.log('工具[7-zip]下载完成并解压到：' + zip7Folder);
                    store.set('INSTALL.ZIP7_STATUS', true);
                })
            });
        });
    } else {
        store.set('INSTALL.ZIP7_STATUS', true);
    }

}

async function downloadNoxPlayer() {
    // let fileUrl = 'https://1drv.ms/u/s!AhWOz52LWPzx8RB6abXXw7jMLWqo?e=HpX7MB';
    // downloadOneDriver(fileUrle);
    let noxPlayerStatus = store.get('INSTALL.NOXPLAYER_STATUS', false);
    let noxPlayer = getNoxPath();
    console.log('noxPlayerStatus=' + noxPlayerStatus + ', noxPlayer=' + noxPlayer);

    if (!fs.existsSync(noxPlayer) || !noxPlayerStatus) {
        let fileSegNum = 8; // 分卷大小
        let fileNumSize = 3; // 分卷名称位置，如001，002，003等
        let fileNameArray = [];
        for (let i = 1; i <= fileSegNum; i++) {
            fileNameArray.push('NoxPlayer-win-{ver}.7z.' + (Array(fileNumSize).join('0') + i).slice(-fileNumSize));
        }

        downloadLatestMultiFile('zxniuniu', 'NoxPlayer', fileNameArray).then(files => {
            let zip7Path = get7ZipPath(); let waitMinutes = 30; // 等待分钟数
            pFun.waitFor(() => fs.exists(zip7Path), {interval: 2000, timeout: waitMinutes * 60 * 1000}).then(() => {
                // console.log(files);
                let extractCmd = zip7Path + ' x -o' + getUserData() + ' ' + files[0];
                exec(extractCmd).then(out => {
                    if (out.indexOf('Everything is Ok') > 0) {
                        store.set('INSTALL.NOXPLAYER_STATUS', true);
                        console.log('解压NoxPlayer成功，解压到：' + noxPlayer);
                    } else {
                        console.log('解压NoxPlayer失败，解压过程：' + out);
                    }
                }).catch(err => {
                    console.error('NoxPlayer下载完成，但执行文件解压操作失败：' + err);
                });
            }).catch(err => {
                console.error('NoxPlayer下载完成，但等待[' + waitMinutes + '分钟]7za解压执行文件超时：' + err);
            });
        });
    }else{
        store.set('INSTALL.NOXPLAYER_STATUS', true);
    }
}

export function downloadAllTools() {
    downloadYoutubeDl();

    downloadV2rayCore();

    downloadJre();

    download7Zip();

    downloadNoxPlayer();

}
