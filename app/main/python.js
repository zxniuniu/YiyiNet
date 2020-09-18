import fs from "fs";
import path from "path";
import store from './../configs/settings';
import utils from "../utils";

export function pythonShellInstallFinishEvent(moduleStr, version) {
    // https://hub.fastgit.org/extrabacon/python-shell#api-reference
    let {PythonShell} = require('python-shell');
    PythonShell.defaultOptions = {
        pythonPath: utils.getPythonFilePath(),
        // scriptPath: getPythonScriptsPath(), // 指定这个后，执行的py文件需要是与这个的相对路径
        pythonOptions: ['-u'], // get print results in real-time
        // mode: 'text', // 'text', 'json', 'binary'
        // args: ['value1', 'value2', 'value3']
    };
    // console.log('TEST_PYTHON');
    // 下载Python后需要安装pip模块
    installPip(PythonShell);
}

async function installPip(PythonShell) {
    let pipPath = utils.getPythonPipPath();
    let pipStatus = store.get('INSTALL.PIP_STATUS', false);

    console.log('pipStatus:' + pipStatus + ", pipPath: " + pipPath);
    // pip.exe不存在，或者PIP_STATUS为假
    if (!fs.existsSync(pipPath) || !pipStatus) {
        // https://pip.pypa.io/en/stable/installing/#get-pip-py-options
        let savePath = path.join(utils.getPythonFolder(), 'get-pip.py');
        if (!fs.existsSync(savePath)) {
            let getPipUrl = 'https://bootstrap.pypa.io/get-pip.py';
            await utils.downloadSmall(getPipUrl, savePath);
        }

        while (true) {
            try {
                require.resolve("p-fun");
                break;
            } catch (e) {
                await utils.sleep(1000);
            }
        }

        let pFun = require('p-fun');
        let waitInterval = 2000, waitMinutes = 30;
        let fastMirror = await utils.fastPypiUrl();
        // 等待python下载安装完成
        pFun.waitFor(() => store.get('TOOLS.PYTHON_STATUS'), {
            interval: waitInterval,
            timeout: waitMinutes * 60 * 1000
        }).then(() => {
            // https://github.com/remoteinterview/zero/blob/4db4a51eb87f74acc9eed080404d58f8b27fa0c5/packages/handler-python/installPip.js
            PythonShell.run(savePath, {
                // https://developer.aliyun.com/mirror/pypi
                args: ['-i', fastMirror]
            }, function (err, result) {
                if (err) throw err;
                // console.dir(result);

                // pip安装完成后，修改python路径，以便识别pip
                if (fs.existsSync(pipPath)) {
                    let pythonVer = store.get('TOOLS.PYTHON_VER');
                    let _pthFile = path.join(utils.getPythonFolder(), 'python' + pythonVer.replace('.', '').substr(0, 2) + '._pth');
                    fs.appendFile(_pthFile, '\r\nScripts\r\nLib\\site-packages', function (err) {
                        if (err) throw err;
                        // 新路径添加完成，表示pip安装成功
                        store.set('INSTALL.PIP_STATUS', true);
                        console.log('通过下载get-pip.py文件，安装pip成功，您可以使用pip进行Python模块安装了！');

                        installPythonModules(PythonShell, fastMirror);
                    });
                } else {
                    console.log('安装Pip完成，未报错，但未安装在Python根目录下的Scripts下？');
                }
            });
        }).catch(e => {
            console.log('拟安装Pip时等待下载安装Python包超时，当前超时时间[' + waitMinutes + ']分钟：' + e);
        });
    } else {
        store.set('INSTALL.PIP_STATUS', true);
    }
}

/**
 * 安装Python模块
 */
function installPythonModules(PythonShell, fastMirror) {
    // scrapy安装失败 星夜回缘 2020-09-07 09:47:31
    /*PythonShell.run(utils.getPythonFilePath(), {
        args: ['-m', 'pip', 'install', 'scrapy', '-i', fastMirror]
    }, function (err, result) {
        if (err) throw err;
        console.dir(result);
    });*/
}

/**
 * 使用Pip安装Python模块
 * @param srcDir
 * @param args
 * @returns {Promise<void>}
 */
async function installByPip(srcDir, ...args) {
    let pipExe = utils.getPythonPipPath();
    console.log(`Running "pip install -t ${srcDir} ${args.join(' ')}"`);
    try {
        let execa = require('execa');
        const ret = await execa(pipExe, ['install', '-t', srcDir, ...args]);
        console.log(ret.stdout);
    } catch (err) {
        console.error(`Failed to run "pip install -t ${srcDir} ${args.join(' ')}": ${err}`);
        throw err;
    }
}
