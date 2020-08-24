import store from './../configs/settings';
import {getChromedriverExeName} from './../utils';

/**
 * 停止Chromedriver服务进程
 */
export function killChromedriver() {
    // 关闭chromedriver
    let chromedriverPid = store.get('CHROMEDRIVER_PID');
    if (chromedriverPid !== null) {
        try {
            process.kill(chromedriverPid);
        } catch (e) {
        }
    } else {
        let exec = require('child_process');
        exec('TASKKILL.EXE /F /IM ' + getChromedriverExeName(), (err, stdout, stderr) => {
        });
    }
}

/**
 * 结束Appium服务
 */
export function killAppiumService() {
    let appiumPid = store.get('APPIUM_PID');
    if (appiumPid !== null) {
        try {
            process.kill(appiumPid);
        } catch (e) {
        }
    }
}

/**
 * 停止客户端启动的所有服务进程
 */
export function killAllServiceByYiyiNet() {
    killChromedriver();

    killAppiumService();
}
