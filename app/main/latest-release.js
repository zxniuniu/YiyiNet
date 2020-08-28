import {downloadFile, getElectronCachePath, getHttpOrHttps, getToolsPath} from "../utils";

import path from 'path';
import fs from 'fs';

let axios = require('axios').default;

// let baseUrl = 'https://www.github.com';
let baseUrl = 'https://hub.fastgit.org';

// let baseUrl = 'https://github.com.cnpmjs.org';

async function getLatestVersion(user, rep) {
    let latestUrl = baseUrl + '/' + user + '/' + rep + '/releases/latest';
    /*axios.get(latestUrl)
        .then(function (response) {
            // handle success
            console.dir(response);
        })
        .catch(function (error) {
            console.log(error);
        });*/

    let proto = getHttpOrHttps(latestUrl);
    return new Promise((resolve, reject) => {
        let request = proto.get(latestUrl, res => {
            // console.dir(res);
            if (res && res.statusCode === 302) {
                let locationStr = res.headers['location'];
                let queryVer = locationStr.substring(locationStr.lastIndexOf('/') + 1, locationStr.length);
                // console.log('获取到[' + user + '/' + rep + ']的新版本[' + queryVer + ']');
                resolve(queryVer);
            } else {
                return resolve('');
            }
        });
        request.on('error', err => {
            reject(err);
        });
        request.end();
    });
}

/**
 * 下载最新版本文件
 * @param user
 * @param rep
 * @param fileName
 * @param savePath
 * @returns {Promise<void>}
 */
export async function downloadLatest(user, rep, fileName) {
    // savePath = savePath === undefined || savePath === '' || savePath === null ? process.cwd() : savePath;
    let version = await getLatestVersion(user, rep);
    if (version === '') {
        console.log('未检测到[' + user + '/' + rep + ']的新版本');
        return;
    }

    // https://hub.fastgit.org/zxniuniu/YiyiNet/releases/download/v1.6.3/YiyiNet-web-setup-1.6.3.exe
    let downloadUrl = baseUrl + '/' + user + '/' + rep + '/releases/download/' + version + '/' + fileName;

    let newFileName = fileName.substring(0, fileName.lastIndexOf('.')) + '-cache-' + version + fileName.substring(fileName.lastIndexOf('.'));
    let saveFilePath = path.join(getElectronCachePath(), newFileName);
    console.log('下载[' + user + '/' + rep + ']，最新版本[' + version + ']，文件名称[' + fileName + ']，缓存名称[' + newFileName + ']');

    return downloadFile(downloadUrl, saveFilePath);
}

export async function downloadLatest2(user, rep, fileName, savePath) {
    savePath = savePath === undefined || savePath === '' || savePath === null ? process.cwd() : savePath;
    let cacheFolder = getElectronCachePath();
    let saveFilePath = path.join(savePath, fileName);

    let version = await getLatestVersion(user, rep);
    if (version === '') {
        console.log('未检测到[' + user + '/' + rep + ']的新版本');
        return;
    }

    let cacheFilePath = path.join(cacheFolder, fileName.substring(0, fileName.lastIndexOf('.')) + '-' + version + fileName.substring(fileName.lastIndexOf('.')));
    // 检查该版本是否已经下载
    if (fs.existsSync(cacheFilePath)) {

    }

    // https://hub.fastgit.org/zxniuniu/YiyiNet/releases/download/v1.6.3/YiyiNet-web-setup-1.6.3.exe
    let downloadUrl = baseUrl + '/' + user + '/' + rep + '/releases/download/v' + version + '/' + fileName;
    console.log('下载[' + user + '/' + rep + ']，最新版本[' + version + ']，文件名称[' + fileName + ']');

    return downloadFile(downloadUrl, saveFilePath);
}

export function downloadAllTools() {
    let toolsPath = getToolsPath();

    // 下载youtube-dl视频下载工具
    downloadLatest('ytdl-org', 'youtube-dl', 'youtube-dl.exe').then((downloadData) => {
        console.dir(downloadData);
        if (downloadData.download) {

        }

        // store.set('YOUTUBE_DL', true);
        console.log('工具[youtube-dl]下载成功，路径：' + downloadData.filePath);
    });

    // 下载v2ray代理工具
    let platform = process.platform === 'win32' ? 'windows' : '';
    let arch = process.arch.replace('x', '');
    let v2rayZip = 'v2ray-' + platform + '-' + arch + '.zip';
    downloadLatest('v2ray', 'v2ray-core', v2rayZip).then((downloadData) => {
        console.dir(downloadData);
        if (downloadData.download) {

        }

        // store.set('V2RAY_CORE', true);
        console.log('工具[v2ray-core]下载成功，路径：' + downloadData.filePath);
    });
}