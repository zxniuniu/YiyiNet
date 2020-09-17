import fs from "fs";
import path from "path";

import utils from './../utils';

// If `preserveFormatting` is true, then include comments, blank lines and other non-host entries in the result
let preserveFormatting = true;
let gitrawUrl = 'raw.githubusercontent.com';

/**
 * 平台的Hosts文件保存路径
 * @returns {string}
 */
function getHostsPath() {
    return utils.checkPath(path.join(utils.getUserData(), 'Hosts'));
}

/**
 * 通过ipaddress.com添加raw.githubusercontent.com的访问IP
 * @param hostile
 * @param done
 */
function addGithubRawHosts(hostile, done) {
    let githubRaw = 'https://githubusercontent.com.ipaddress.com/raw.githubusercontent.com';
    let proto = utils.getHttpOrHttps(githubRaw);
    let req = proto.get(githubRaw, res => {
        // res.setEncoding('utf8');
        if (res.statusCode === 200) {
            let body = '';
            res.on('data', function (chunk) {
                body += chunk;
            });
            res.on('end', function () {
                let regExp = />IP Address<\/th><td><ul class="comma-separated"><li>([.\d]+)<\/li>/;
                let mat = body.match(regExp); //没有使用g选项
                if (mat !== null) {
                    let ip = mat[1];
                    hostile.get(false, function (err, lines) {
                        if (err) {
                            console.error(err.message);
                        }

                        let alreadyHas = false;
                        lines.forEach(function (line) {
                            if (line[1] === gitrawUrl) {
                                alreadyHas = true;
                                if (line[0] !== ip) {
                                    hostile.remove(line[0], gitrawUrl, function (err) {
                                        if (err) {
                                            console.error(err)
                                        }
                                        addIpHost(hostile, ip, done, '删除旧IP[' + line[0] + ']，');
                                    })
                                } else {
                                    console.log('为' + gitrawUrl + '添加Hosts访问IP地址，IP存在，且相同[' + ip + ']，无需更改');
                                    done();
                                }
                            }
                        })
                        if (!alreadyHas) {
                            addIpHost(hostile, ip, done, '');
                        }
                    });
                }
            });
        }
    }).on('error', (err) => {
    });
    req.end();
}

function addIpHost(hostile, ip, done, delStr) {
    hostile.set(ip, gitrawUrl, function (err) {
        if (err) {
            console.error(err)
        }
        console.log('为' + gitrawUrl + '添加Hosts访问IP地址，' + delStr + '添加新IP[' + ip + ']');
        done();
    })
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

    utils.downloadFile(hostsUrl, googlehosts).then(() => {
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
                console.log('修改Hosts文件，本来[' + lineNum + ']条，添加[' + lineNum2 + ']条。。。');
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
    // console.log(moduleStr + version);
    let hostile = require('hostile');

    // 备份hosts文件
    let backupHosts = path.join(getHostsPath(), 'hosts-backup');
    if (!fs.existsSync(backupHosts)) {
        fs.copyFileSync(hostile.HOSTS, backupHosts);
    }

    /*let iLock = new AsyncLock({timeout: 60000});
    iLock.acquire("hosts", function (done) {
        addGithubRawHosts(hostile, done);
    }, function (err, ret) {
    }, {});*/

    // Googlehosts已经失效，不再使用
    /*iLock.acquire("hosts", function (done) {
        downloadGooglehosts(hostile, done);
    }, function (err, ret) {
    }, {});*/
}



