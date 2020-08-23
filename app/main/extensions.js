import path from 'path';
import {session} from 'electron';
import {checkPath} from "../utils";

export function installExtensions() {
    // 安装ASTAR VPN扩展
    let extensionName = 'astar';
    addExtension(extensionName).then((ext) => {
        console.dir(ext);
    }).catch(e => {
        console.log('加载扩展[' + extensionName + ']出错：' + e);
    })

}

/**
 * 获取扩展路径
 * @returns {string}
 */
const getExtensionsPath = () => {
    return checkPath(path.join(__dirname, './../assets/plugins/'));
};

/**
 * 获取session
 * @param partition
 * @returns {Electron.Session}
 */
const getSession = (partition) => {
    return partition && partition !== '' ? session.fromPartition(partition) : session.defaultSession;
};

/**
 * 安装扩展
 * @param extensionFolderName
 * @param partition
 */
const addExtension = function (extensionFolderName, partition) {
    const extPath = path.join(getExtensionsPath(), extensionFolderName);
    // console.log('extPath:' + extPath);
    return getSession(partition).loadExtension(extPath);
};

/**
 * 删除扩展
 * @param name
 * @param partition
 */
const removeExtension = function (name, partition) {
    let mySession = getSession(partition);
    const extension = mySession.getAllExtensions().find(e => e.name === name);
    if (extension) {
        mySession.removeExtension(extension.id);
    }
};

/**
 * 获取所有扩展
 * @param partition
 * @returns {{}}
 */
const getExtensions = function (partition) {
    let mySession = getSession(partition);
    const extensions = {};
    mySession.getAllExtensions().forEach(e => {
        extensions[e.name] = e
    });
    return extensions;
};
