import fs from "fs";
import path from "path";
import StreamZip from "node-stream-zip";
import AsyncLock from 'async-lock';
import utils from "../utils";
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
    let chromedriverFilePath = utils.getChromedriverFilePath(); //
    if (fs.existsSync(chromedriverFilePath)) {
        return;
    }

    let chromedriverName = utils.getChromedriverExeName();
    let ver = process.versions.electron, platform = process.platform, arch = process.arch;
    let cachePath = utils.getElectronCachePath();

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
            utils.downloadFile(chromedriverUrl, chromedriverLocalZip).then(() => {
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
    let pythonFilePath = utils.getPythonFilePath(); //

    // let pythonName = getPythonExeName();
    let storeVer = store.get('TOOLS.PYTHON_VER', '3.8.5');
    store.set('TOOLS.PYTHON_VER', storeVer);

    if (fs.existsSync(pythonFilePath)) {
        store.set('TOOLS.PYTHON_STATUS', true);
        return;
    }

    let arch = process.arch;
    let cachePath = utils.getElectronCachePath();

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
            utils.downloadFile(pythonUrl, pythonLocalZip).then(() => {
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
            zip.extract(null, utils.getPythonFolder(), (err, count) => {
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
    let needDownload = utils.pastDays(youtubeDate) > store.get('TOOLS_DOWNLOAD_INTERVAL_DAYS', 10);
    let youtubeDlExe = utils.getYoutubeDlExe();

    if (!fs.existsSync(youtubeDlExe) || needDownload) {
        utils.downloadLatestRetry('ytdl-org', 'youtube-dl', 'youtube-dl.exe').then(filePath => {
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
    let needDownload = utils.pastDays(v2rayDate) > store.get('TOOLS_DOWNLOAD_INTERVAL_DAYS', 10);
    let v2rayExe = utils.getV2rayCoreExe();

    if (!fs.existsSync(v2rayExe) || needDownload) {
        let platform = process.platform === 'win32' ? 'windows' : '';
        let arch = process.arch.replace('x', '');
        let v2rayZip = 'v2ray-' + platform + '-' + arch + '.zip';

        utils.downloadLatestRetry('v2ray', 'v2ray-core', v2rayZip).then(filePath => {
            utils.extractZip(filePath, path.dirname(v2rayExe)).then(() => {
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
    let jreExe = utils.getJrePath();
    let jreStatus = store.get('INSTALL.JRE_STATUS', false);
    console.log('jreStatus=' + jreStatus + ', jreExe=' + jreExe);

    if (!fs.existsSync(jreExe) || !jreStatus) {
        let version = '8u131', buildNum = '11';
        // https://download.oracle.com/otn-pub/java/jdk/8u131-b11/d54c1d3a095b4ff2b6607d096fa80163/jre-8u131-windows-x64.tar.gz
        let url = getJreDownloadUrl(version, buildNum);

        let fileTar = path.join(utils.getElectronCachePath(), url.substring(url.lastIndexOf('/') + 1, url.length));
        if (!fs.existsSync(fileTar)) {
            utils.downloadLarge(url, fileTar, {
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
            let jreFolder = utils.getJreFolder(), userData = utils.getUserData();
            utils.extractTar(fileTar, userData).then(() => {
                let subFolder = 'jre1.' + version.replace('u', '.0_');
                utils.moveFolder(path.join(userData, subFolder), jreFolder).then(() => {
                    console.log('Jre解压成功，解压到:', jreFolder);
                    store.set('INSTALL.JRE_STATUS', true);

                    // reutils.moveFolder(path.join(userData, subFolder)).then(() => {});
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
    let zip7 = utils.get7ZipPath();
    console.log('zip7Status=' + zip7Status + ', zip7=' + zip7);

    if (!fs.existsSync(zip7)/* || !zip7Status*/) {
        let fileName = '7zip-windows-' + (process.arch === 'x64' ? 'x64' : 'ia32') + '-{ver}.zip';
        utils.downloadLatestRetry('zxniuniu', '7-zip', fileName).then(filePath => {
            let toolsPath = utils.getToolsPath(), zip7Folder = utils.get7ZipFolder();
            utils.extractZip(filePath, toolsPath).then(() => {
                utils.moveFolder(path.join(toolsPath, path.basename(filePath, '.zip')), zip7Folder).then(() => {
                    console.log('工具[7-zip]下载完成并解压到：' + zip7Folder);
                    store.set('INSTALL.ZIP7_STATUS', true);
                })
            });
        });
    } else {
        store.set('INSTALL.ZIP7_STATUS', true);
    }

}

function downloadNoxPlayer() {
    // let fileUrl = 'https://1drv.ms/u/s!AhWOz52LWPzx8RB6abXXw7jMLWqo?e=HpX7MB';
    // https://www.bignox.com/en/download/fullPackage 最新版本网址
    // downloadOneDriver(fileUrle);
    let noxPlayerStatus = store.get('INSTALL.NOX_PLAYER_STATUS', false);
    let noxPlayer = utils.getNoxPath();
    console.log('noxPlayerStatus=' + noxPlayerStatus + ', noxPlayer=' + noxPlayer);

    if (!fs.existsSync(noxPlayer) || !noxPlayerStatus) {
        let fileSegNum = 29; // 分卷大小
        let fileNumSize = 3; // 分卷名称位数，如001，002，003等
        let fileNameArray = [];
        for (let i = 1; i <= fileSegNum; i++) {
            fileNameArray.push('NoxPlayer-win-{ver}.7z.' + (Array(fileNumSize).join('0') + i).slice(-fileNumSize));
        }

        utils.downloadLatestMultiFile('zxniuniu', 'NoxPlayer', fileNameArray).then(files => {
            let zip7Path = utils.get7ZipPath();
            let waitMinutes = 30; // 等待分钟数
            pFun.waitFor(() => store.get('INSTALL.ZIP7_STATUS', false), {
                interval: 2000,
                timeout: waitMinutes * 60 * 1000
            }).then(() => {
                // console.log(files);
                let extractCmd = zip7Path + ' x -y -o' + utils.getUserData() + ' ' + files[0];
                utils.exec(extractCmd).then(out => {
                    if (out.indexOf('Everything is Ok') > 0) {
                        store.set('INSTALL.NOX_PLAYER_STATUS', true);
                        console.log('解压NoxPlayer成功，解压到：' + noxPlayer);

                        overrideAndroidSdkAdbByNoxPlayer();
                    } else {
                        console.log('解压NoxPlayer失败：' + out);
                    }
                }).catch(err => {
                    console.error('NoxPlayer下载完成，但执行文件解压操作失败：' + err);
                });
            }).catch(err => {
                console.error('NoxPlayer下载完成，但等待[' + waitMinutes + '分钟]7za解压执行文件超时：' + err);
            });
        }).catch(err => {
            console.error('NoxPlayer下载失败：' + err);
        });
    } else {
        store.set('INSTALL.NOX_PLAYER_STATUS', true);
    }
}

function downloadAndroidSdk() {
    // 【Android Studio安装部署系列】四、Android SDK目录和作用分析 https://www.cnblogs.com/whycxb/p/8184967.html
    // https://www.androiddevtools.cn/ （全部工具均可下载）
    // let fileUrl = 'https://dl.google.com/android/android-sdk_r24.4.1-windows.zip';
    let androidSdkStatus = store.get('INSTALL.ANDROID_SDK_STATUS', false);
    let androidSdk = utils.getAndroidSdkPath();
    console.log('androidSdkStatus=' + androidSdkStatus + ', androidSdk=' + androidSdk);

    if (!fs.existsSync(androidSdk) || !androidSdkStatus) {
        let fileSegNum = 12; // 分卷大小
        let fileNumSize = 3; // 分卷名称位数，如001，002，003等
        let fileNameArray = [];
        for (let i = 1; i <= fileSegNum; i++) {
            fileNameArray.push('AndroidSdk-{ver}.7z.' + (Array(fileNumSize).join('0') + i).slice(-fileNumSize));
        }

        utils.downloadLatestMultiFile('zxniuniu', 'AndroidSdk', fileNameArray).then(files => {
            let zip7Path = utils.get7ZipPath();
            let waitMinutes = 30; // 等待分钟数
            pFun.waitFor(() => store.get('INSTALL.ZIP7_STATUS', false), {
                interval: 2000,
                timeout: waitMinutes * 60 * 1000
            }).then(() => {
                // console.log(files);
                let extractCmd = zip7Path + ' x -y -o' + utils.getUserData() + ' ' + files[0];
                utils.exec(extractCmd).then(out => {
                    if (out.indexOf('Everything is Ok') > 0) {
                        store.set('INSTALL.ANDROID_SDK_STATUS', true);
                        console.log('解压AndroidSdk成功，解压到：' + androidSdk);

                        overrideAndroidSdkAdbByNoxPlayer();
                    } else {
                        console.log('解压AndroidSdk失败：' + out);
                    }
                }).catch(err => {
                    console.error('AndroidSdk下载完成，但执行文件解压操作失败：' + err);

                    // 如果文件损坏，则直接删除
                    handle7zipExtractError(files, err.toString());
                });
            }).catch(err => {
                console.error('AndroidSdk下载完成，但等待[' + waitMinutes + '分钟]7za解压执行文件超时：' + err);
            });
        }).catch(err => {
            console.error('AndroidSdk下载失败：' + err);
        });
    } else {
        store.set('INSTALL.ANDROID_SDK_STATUS', true);
    }
}

function downloadJdk() {
    // https://docs.oracle.com/javase/8/docs/technotes/guides/install/config.html#table_config_file_options
    // https://docs.oracle.com/javase/8/docs/technotes/guides/install/windows_installer_options.html#CJAJGEHA
    let jdkStatus = store.get('INSTALL.JDK_STATUS', false);
    let jdk = utils.getJdkPath();
    console.log('jdkStatus=' + jdkStatus + ', jdk=' + jdk);

    if (!fs.existsSync(jdk) || !jdkStatus) {
        let fileSegNum = 4; // 分卷大小
        let fileNumSize = 3; // 分卷名称位数，如001，002，003等
        let fileNameArray = [];
        for (let i = 1; i <= fileSegNum; i++) {
            fileNameArray.push('jdk-{ver}-' + (process.platform === 'win32' ? 'windows' : '') + '-' + (process.arch === 'x64' ? 'x64' : 'i586')
                + '.7z.' + (Array(fileNumSize).join('0') + i).slice(-fileNumSize));
        }

        utils.downloadLatestMultiFile('zxniuniu', 'OracleJdk', fileNameArray).then(files => {
            let zip7Path = utils.get7ZipPath();
            let waitMinutes = 30; // 等待分钟数
            pFun.waitFor(() => store.get('INSTALL.ZIP7_STATUS', false), {
                interval: 2000,
                timeout: waitMinutes * 60 * 1000
            }).then(() => {
                // console.log(files);
                let extractCmd = zip7Path + ' x -y -o' + utils.getUserData() + ' ' + files[0];
                utils.exec(extractCmd).then(out => {
                    if (out.indexOf('Everything is Ok') > 0) {
                        store.set('INSTALL.JDK_STATUS', true);
                        console.log('解压Jdk成功，解压到：' + jdk);
                    } else {
                        console.log('解压Jdk失败：' + out);
                    }
                }).catch(err => {
                    console.error('Jdk下载完成，但执行文件解压操作失败：' + err);

                    // 如果文件损坏，则直接删除
                    handle7zipExtractError(files, err.toString());
                });
            }).catch(err => {
                console.error('Jdk下载完成，但等待[' + waitMinutes + '分钟]7za解压执行文件超时：' + err);
            });
        }).catch(err => {
            console.error('Jdk下载失败：' + err);
        });
    } else {
        store.set('INSTALL.JDK_STATUS', true);
    }
}

function handle7zipExtractError(files, errMsg) {
    // 如果文件损坏，则直接删除
    let errArr = errMsg.split('\r\n');
    // console.log('errArr:'); console.log(errArr);

    errArr.forEach(err => {
        console.log('err:' + err);
        let errIndex = err.indexOf('ERROR: ');
        if (errIndex > 0) { // ERROR: C:\\Users\\bluef\\AppData\\Local\\electron\\Cache\\AndroidSdk-20200916.7z.001
            let errPath = err.substring(errIndex + 7);
            // console.log('errPath:' + errPath); console.log('files:' + files);

            if (files.includes(errPath)) {
                fs.unlinkSync(errPath);
                // downloadAndroidSdk();
            }
        }
    })

}

/**
 * 解决在NoxPlayer或者AndroidSdk下载完成后的Nox中的adb.exe覆盖Sdk中的adb.exe的问题
 */
function overrideAndroidSdkAdbByNoxPlayer() {
    let sdkAdb = utils.getAndroidSdkPath(), noxAdb = path.join(utils.getNoxFolder(), 'bin', 'adb.exe');

    // 只有在两个均存在，且大小不一样时才覆盖
    if (fs.existsSync(sdkAdb) && fs.existsSync(noxAdb)) {
        let sdkAdbStat = fs.statSync(sdkAdb), noxAdbStat = fs.statSync(noxAdb);
        if(sdkAdbStat.size !== noxAdbStat.size){
            fs.renameSync(sdkAdb, sdkAdb.replace('.exe', '_backup.exe'));

            fs.copyFileSync(noxAdb, sdkAdb);
        }
    }
}

export function downloadAllTools() {
    downloadYoutubeDl();

    downloadV2rayCore();

    download7Zip();

    // Appium需要Jdk，因此取消了Jre的安装，安装的JDK中有Jre
    // downloadJre();
    downloadJdk();

    downloadNoxPlayer();

    downloadAndroidSdk();

    /* pFun.retry(downloadAndroidSdk, {
        retries: 10, // 重试10次，默认是10次
        onFailedAttempt: error => {
            console.log(`下载AndroidSdk过程中失败，当前第 [${error.attemptNumber}] 次失败，剩余尝试次数 [${error.retriesLeft}]`);
        }
    });*/

}
