import config from './../configs/app.config';
import {ipcMain} from 'electron-better-ipc';

let Store = require('electron-store');

let defaultStore = {
    defaults: config.defaultStoreValue,
    name: config.repo,
    watch: true
};

const store = new Store(defaultStore);
store.set(config.storeValue);

// 模块安装完成
/*store.onDidChange('MODULE_INSTALL', (newValue, oldValue) => {
    if(newValue){
        console.log('newValue:' + newValue + ', oldValue:' + oldValue);
    }
});*/

// https://github.com/sindresorhus/electron-better-ipc
ipcMain.answerRenderer('get-store', (key) => {
    return store.get(key);
});
ipcMain.answerRenderer('set-store', (keyValue) => {
    store.set(keyValue);
    return 'ok';
});

/*const {ipcRenderer: ipc} = require('electron-better-ipc');
(async () => {
    const isLoad = await ipc.callMain('get-store', 'ADS_LOAD');
    console.log(isLoad); // => false
})();*/

export default store;
