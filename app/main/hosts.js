import fs from "fs";
import path from "path";
import AsyncLock from 'async-lock';

import {downloadFile, getHttpOrHttps, getUserData} from './../utils';

/**
 * 平台的Hosts文件保存路径
 * @returns {string}
 */
function getHostsPath() {
    return path.join(getUserData(), 'Hosts');
}

/**
 * 通过ipaddress.com添加raw.githubusercontent.com的访问IP
 * @param hostile
 * @param done
 */
function addGithubRawHosts(hostile, done) {
    let githubRaw = 'https://githubusercontent.com.ipaddress.com/raw.githubusercontent.com';
    let proto = getHttpOrHttps(githubRaw);
    let req = proto.get(url, response => {
        response.on('data', (chunk) => {
            if (response.statusCode === 200) {
                console.log(`响应主体: ${chunk}`);
                console.log('为raw.githubusercontent.com添加Hosts访问IP地址');

                // TODO 获取ip地址并添加到Hosts
                done();
            }
        });
    }).on('error', (err) => {
    });
    req.end();
}

/**
 * 下载googlehosts/hosts文件合并到Hosts文件
 * @param hostile
 * @param done
 */
function downloadGooglehosts(hostile, done) {
    // 读取下载的Hosts文件内容
    let hostsUrl = 'https://raw.githubusercontent.com/googlehosts/hosts/master/hosts-files/hosts';
    let googlehosts = path.join(getHostsPath(), 'googlehosts');

    // If `preserveFormatting` is true, then include comments, blank lines and other non-host entries in the result
    let preserveFormatting = true;

    downloadFile(hostsUrl, googlehosts).then(() => {
        hostile.get(preserveFormatting, function (err, linesNew) {
            if (err) {
                console.error(err.message);
            }
            let lineNum = linesNew.length;

            // 读取Hosts文件内容
            hostile.getFile(googlehosts, preserveFormatting, function (err, linesOld) {
                if (err) {
                    console.error(err.message);
                }
                let lineNum2 = linesOld.length;

                // 保存
                linesNew.push(...linesOld);
                /*linesNew.forEach(function (line) {
                    console.log(line) // [IP, Host]
                })*/
                hostile.writeFile(linesNew, preserveFormatting, '');
                console.log('修改Hosts文件，修改前[' + lineNum + ']条，添加[' + lineNum2 + ']条。。。');
                done();
            })
        });
    });
}

/**
 * 备份Hosts后添加raw.githubusercontent.com访问IP，以及添加googlehosts文件到Hosts文件
 * @param moduleStr
 * @param version
 */
export function hostileInstallFinishEvent(moduleStr, version) {
    // 如果hostile安装完成，则修改hosts文件内容
    if (moduleStr === 'hostile') {
        console.log(moduleStr + version);
        let hostile = require('hostile');

        // 备份hosts文件
        let backupHosts = path.join(getHostsPath(), 'hosts-backup');
        if (!fs.existsSync(backupHosts)) {
            fs.copyFileSync(hostile.HOSTS, backupHosts);
        }

        let iLock = new AsyncLock({timeout: 60000});
        iLock.acquire("hosts", function (done) {
            addGithubRawHosts(hostile, done);
        }, function (err, ret) {
        }, {});

        iLock.acquire("hosts", function (done) {
            downloadGooglehosts(hostile, done);
        }, function (err, ret) {
        }, {});
    }
}



