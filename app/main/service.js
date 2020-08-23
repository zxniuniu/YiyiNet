/**
 * 停止Chromedriver服务进程
 */
export function killChromedriver() {
    // 关闭chromedriver
    let exec = require('child_process');
    exec('TASKKILL.EXE /F /IM chromedriver.exe', function (err, stdout, stderr) {
    });
}

/**
 * 结束Appium服务
 */
export function killAppiumService() {

}

/**
 * 停止客户端启动的所有服务进程
 */
export function killAllServiceByYiyiNet() {
    killChromedriver();

    killAppiumService();
}
