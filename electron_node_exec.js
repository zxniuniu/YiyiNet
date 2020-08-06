// https://stackoverflow.com/questions/51730030/how-to-run-an-electron-process-as-plain-node-process
// https://stackoverflow.com/questions/51771754/can-we-launch-a-node-command-on-a-mac-without-node-installed-when-using-electron

function execNode(args) {
    const childProcess = require('child_process');
    // const fixPath = require('fix-path');
    // fixPath();
    const child = childProcess.fork(args, {
        detached: true, // 是否子进程独立其父进程运行
        silent: true, // 为true时直接在运行窗口中输出日志
        env: {
            ELECTRON_RUN_AS_NODE: 1
        }
    });

    child.on('error', (err) => {
        console.log("Fork子进程出错：" + err);
    });
    child.stdout.on('data', (data) => {
        console.log('子进程执行[' + args + ']输出：' + data);
    });
    child.stderr.on('data', (err) => {
        console.error('子进程执行[' + args + ']出错： ' + err);
    });
    child.on('close', (code) => {
        console.log('子进程退出，退出码：' + code);
    });
    child.unref();
}

function startAppium(){
    try {
        let appiumMain = require.resolve('appium'); // "D:\Workspace\Git\YiyiNet\node_modules\appium\build\lib\main.js";
        execNode(appiumMain);
    } catch (e) {
        console.log("未检测到Appium，即将安装模块，请稍候。。。");
        // install('appium');
    }
}

const async = require('async');
async.retry({times: 3, interval: 2000}, startAppium, function(err, result) {
    if (err) {
        throw err; // Error still thrown after retrying N times, so rethrow.
    }
    console.log('result:' + result);
});
// var appium = require('appium');
