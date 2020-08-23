import config from './../configs/app.config';
import {ipcMain} from 'electron';

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

ipcMain.handle('getStore', (event, key) => {
    return store.get(key);
});
ipcMain.handle('setStore', (event, key, value) => {
    return store.set(key, value);
});
// const foo = await ipcRenderer.invoke('getStore', 'APPIUM_PORT');

export default store;

