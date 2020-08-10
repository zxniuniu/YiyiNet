/**
 * 停止Chromedriver服务进程
 */
export function killChromedriver() {
    // 关闭chromedriver
    let exec = require('child_process');
    exec('TASKKILL.EXE /F /IM chromedriver.exe', function (err, stdout, stderr) {
    });
}