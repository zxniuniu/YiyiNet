import {downloadFile, getHttpOrHttps} from "../utils";
import path from 'path';

let baseUrl = 'https://hub.fastgit.org';

// let user = 'zxniuniu', rep = 'YiyiNet';

async function getLatestVersion(user, rep) {
    let latestUrl = baseUrl + '/' + user + '/' + rep + '/releases/latest';
    let proto = getHttpOrHttps(latestUrl);

    // Three Ways to Retrieve JSON from the Web using Node.js https://dev.to/isalevine/three-ways-to-retrieve-json-from-the-web-using-node-js-3c88
    const res = await proto.get(latestUrl);
    console.dir(res);
    if (res && res.statusCode === 302) {
        let locationStr = res.headers['location'];
        let queryVer = locationStr.substring(locationStr.lastIndexOf('/') + 2, locationStr.length());

        console.log('获取到版本[' + queryVer + ']');
        return queryVer;
    } else {
        return '';
    }
}

/**
 * 下载最新版本文件
 * @param user
 * @param rep
 * @param fileName
 * @param savePath
 * @returns {Promise<void>}
 */
export async function downloadLatest(user, rep, fileName, savePath) {
    savePath = savePath === undefined || savePath === '' || savePath === null ? process.cwd() : savePath;
    let version = await getLatestVersion(user, rep);
    if (version === '') {
        console.log('未检测到[' + user + '/' + rep + ']的新版本');
        return;
    }
    // https://hub.fastgit.org/zxniuniu/YiyiNet/releases/download/v1.6.3/YiyiNet-web-setup-1.6.3.exe
    let downloadUrl = baseFeedUrl + '/' + user + '/' + rep + '/releases/download/v' + version + '/' + fileName;
    console.log('下载[' + user + '/' + rep + ']，最新版本[' + version + ']，文件名称[' + fileName + ']');

    return downloadFile(downloadUrl, path.join(savePath, fileName));
}