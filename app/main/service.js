import store from './../configs/settings';
import utils from './../utils';

/**
 * 停止Chromedriver服务进程
 */
export function killChromedriver() {
    // 关闭chromedriver
    let chromedriverPid = store.get('CHROMEDRIVER.PID');
    if (chromedriverPid !== null) {
        try {
            process.kill(chromedriverPid);
        } catch (e) {
        }
    } else {
        let exec = require('child_process');
        exec('TASKKILL.EXE /F /IM ' + utils.getChromedriverFilePath(), (err, stdout, stderr) => {
        });
    }
}

/**
 * 结束Appium服务
 */
export function killAppiumService() {
    let appiumPid = store.get('APPIUM.PID');
    if (appiumPid !== null) {
        try {
            process.kill(appiumPid);
        } catch (e) {
        }
    }
}

/**
 * 停止Aria2c服务进程
 */
export function killAria2c() {
    // 关闭Aria2c
    let killAria2cPid = store.get('ARIA2.PID');
    if (killAria2cPid !== null) {
        try {
            process.kill(killAria2cPid);
        } catch (e) {
        }
    } else {
        let exec = require('child_process');
        exec('TASKKILL.EXE /F /IM ' + utils.getAria2Exe(), (err, stdout, stderr) => {
        });
    }
}

/**
 * 停止客户端启动的所有服务进程
 */
export function killAllServiceByYiyiNet() {
    killChromedriver();

    killAppiumService();

    killAria2c();
}
