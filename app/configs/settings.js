import config from './app.config';
import {ipcMain} from 'electron-better-ipc';

let Store = require('electron-store');

let defaultStore = {
    defaults: config.defaultStoreValue,
    name: config.repo,
    watch: true
};

let store = new Store(defaultStore);

// 条件设置storeValue，如果存在不设置，不存在刚增加
setOther();

/**
 * 合并新值到默认值 中
 * @param storeValue
 * @param val
 * @returns {*}
 */
function mergeJson(storeValue, val) {
    Object.keys(storeValue).forEach(key => {
        let value = storeValue[key];

        if(val[key] !== undefined) {
            if (typeof value === 'object') {
                mergeJson(storeValue[key], val[key]);
            } else {
                storeValue[key] = val[key];
            }
        }
    });
}

function setOther() {
    let val = store.store; // console.dir(store.store);
    let storeValue = config.storeValue;

    mergeJson(storeValue, val);
    store.set(storeValue);
}

export function storeChangeEvent() {
    // console.log('Store的值[changeEvent]：'); console.dir(store.store);
    store.onDidChange('CHROMEDRIVER_PID', (newValue, oldValue) => {
        console.log('CHROMEDRIVER_PID，值由[' + oldValue + ']变更为[' + newValue + ']');
    });

}

/**
 * 重置参数值（启动时重置部分数据为false）
 */
export function resetDefaultObject() {
    // 重置已经存在的值
    store.reset(Object.keys(config.defaultStoreValue));

    // 安装的模块（启动时重置安装的模块的标识）
    resetObjKey('MODULE,CHROMEDRIVER,APPIUM,TOOLS');

    // console.log('Store的值[resetAfter]：'); console.dir(store.store);
}

/**
 * 重置对象的值
 * @param objKey
 */
function resetObjKey(objKeys) {
    objKeys.split(',').forEach(objKey => {
        let modules = store.get(objKey);
        if (null !== modules && typeof modules === 'object') {
            let moduleKeys = Object.keys(modules);
            if (moduleKeys !== null && moduleKeys.length > 0) {
                let modifyFlag = false;
                moduleKeys.forEach(key => {
                    if (modules[key] === true) {
                        modules[key] = false;
                        modifyFlag = true;
                    }
                });
                if (modifyFlag) {
                    store.set(objKey, modules);
                }
            }
        }
    });
}

// https://github.com/sindresorhus/electron-better-ipc
ipcMain.answerRenderer('get-store', (key) => {
    // console.log('get-store - keyValue: ' + key);
    return store.get(key);
});
ipcMain.answerRenderer('set-store', (keyValue) => {
    // console.log('set-store - keyValue: '); // console.dir(keyValue);
    store.set(keyValue);
    return 'ok';
});

/*const {ipcRenderer: ipc} = require('electron-better-ipc');
(async () => {
    const isLoad = await ipc.callMain('get-store', 'ADS_LOAD');
    console.log(isLoad); // => false
})();*/

export default store;
