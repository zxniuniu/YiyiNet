import fs from "fs";
import path from "path";
import StreamZip from "node-stream-zip";
import AsyncLock from 'async-lock';

import {
    downloadFile,
    getChromedriverExeName,
    getChromedriverFilePath,
    getElectronCachePath,
    getPythonExeName,
    getPythonFilePath,
    getPythonFolder
} from "../utils";

export function downloadOtherFiles() {
    downloadChromedriver();

    downloadPython();
}

/**
 * 下载Chromedriver
 */
export function downloadChromedriver() {
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
export function downloadPython() {
    let pythonFilePath = getPythonFilePath(); //
    if (fs.existsSync(pythonFilePath)) {
        return;
    }

    let pythonName = getPythonExeName();
    let ver = '3.8.5', arch = process.arch;
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
                done();
            });
        });
    }, function (err, ret) {
    }, {});

}

