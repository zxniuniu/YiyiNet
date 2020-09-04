import fs from "fs";
import path from "path";
import store from './../configs/settings';

import {downloadSmall, getPythonFilePath, getPythonFolder, getPythonPipPath, sleep} from "../utils";

export function pythonShellInstallFinishEvent(moduleStr, version) {
    // https://hub.fastgit.org/extrabacon/python-shell#api-reference
    let {PythonShell} = require('python-shell');
    PythonShell.defaultOptions = {
        pythonPath: getPythonFilePath(),
        // scriptPath: getPythonScriptsPath(), // 指定这个后，执行的py文件需要是与这个的相对路径
        // pythonOptions: ['-u'], // get print results in real-time
        // mode: 'text', // 'text', 'json', 'binary'
        // args: ['value1', 'value2', 'value3']
    };

    // 下载Python后需要安装pip模块
    installPip(PythonShell);
}

async function installPip(PythonShell) {
    let pipPath = getPythonPipPath();
    let pipStatus = store.set('INSTALL.PIP_STATUS', false);

    // pip.exe不存在，或者PIP_STATUS为假
    if (!fs.existsSync(pipPath) || !pipStatus) {
        // https://pip.pypa.io/en/stable/installing/#get-pip-py-options
        let savePath = path.join(getPythonFolder(), 'get-pip.py');
        if (!fs.existsSync(savePath)) {
            let getPipUrl = 'https://bootstrap.pypa.io/get-pip.py';
            await downloadSmall(getPipUrl, savePath);
        }

        while (true) {
            try {
                require.resolve("p-fun");
                break;
            } catch (e) {
                await sleep(1000);
            }
        }

        let pFun = require('p-fun');
        let waitInterval = 2000, waitMinutes = 30;
        // 等待python下载安装完成
        pFun.waitFor(() => store.get('TOOLS.PYTHON_STATUS'), {
            interval: waitInterval,
            timeout: waitMinutes * 60 * 1000
        }).then(() => {
            PythonShell.run(savePath, {
                // https://developer.aliyun.com/mirror/pypi
                args: ['-i', 'https://mirrors.aliyun.com/pypi/simple/']
            }, function (err, result) {
                if (err) throw err;
                // console.dir(result);

                // pip安装完成后，修改python路径，以便识别pip
                if (fs.existsSync(pipPath)) {
                    store.get('TOOLS.PYTHON_VER').then(val => {
                        let _pthFile = path.join(getPythonFolder(), 'python' + val.replace('.', '').substr(0, 2) + '._pth');
                        fs.appendFile(_pthFile, '\r\nScripts\r\nLib\\site-packages', function (err) {
                            if (err) throw err;
                            // 新路径添加完成，表示pip安装成功
                            store.set('INSTALL.PIP_STATUS', true);
                            console.log('通过下载get-pip.py文件，安装pip成功，您可以使用pip进行Python模块安装了！');

                            installPythonModules(PythonShell);
                        });
                    })
                } else {
                    console.log('安装Pip完成，未报错，但未安装在Python根目录下的Scripts下？');
                }
            });
        }).catch(e => {
            console.log('拟安装Pip时等待下载安装Python包超时，当前超时时间[' + waitMinutes + ']分钟：' + e);
        });
    }
}

/**
 * 安装Python模块
 */
function installPythonModules(PythonShell) {

}

