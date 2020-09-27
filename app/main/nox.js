import path from "path";
import fs from "fs";
import utils from "../utils";
import store from "../configs/settings";

/**
 * 去除NoxPlayer启动时广告（主要是通过删除文件夹，以及设置只读属性来解决）
 */
exports.removeNoxplayerStartAds = async () => {
    let noxFolder = path.join(utils.getNoxConfigPath(), 'loading');
    if(fs.existsSync(noxFolder)) {
        let st = fs.statSync(noxFolder);
        // 如果是文件夹，则删除后新建一个同名文件，并设置为只读
        if (st.isDirectory()) {
            await utils.removeFolder(noxFolder);
            fs.writeFileSync(noxFolder, '', function(err){
                if(err){console.log(err);}
            });
            st = fs.statSync(noxFolder);
        }

        // 将文件设置为只读
        if(st.mode !== 33060){ // 只读 33060
            fs.chmodSync(noxFolder, 33060);
        }
    }
}

/**
 * 去除NoxPlayer启动时的更新提示
 * @param version 要忽略的版本
 */
exports.removeNoxplayerUpdateNotice = async (version) => {
    version = version === undefined || version === '' || version === null ? '6.6.1.2201' : version;

    let noxConfig = path.join(utils.getNoxConfigPath(), 'util_conf.ini');
    let txtContent = '[online_update]\r\nignore_version=' + version + '\r\n';

    if(!fs.existsSync(noxConfig)) {
        fs.writeFileSync(noxConfig, txtContent, function(err){
            if(err){console.log(err);}
        });
    }else{
        let content = fs.readFileSync(noxConfig, 'utf8');
        if(content.indexOf('ignore_version=' + version) === -1){
            fs.appendFileSync(noxConfig, txtContent);
        }
    }
}

/**
 * NoxPlayer启动前去广告，以及去更新
 */
exports.configNoxPlayerBeforeStart = async () => {
    await removeNoxplayerStartAds();
    await removeNoxplayerUpdateNotice();
}

/**
 * 启动NoxPlayer
 * @param index Nox模拟器的索引
 */
exports.startNoxplayer = async (index) => {
    index = index === undefined || index === '' || index === null || index < 0 ? 0 : index; // index默认值
    let existNox = store.get('INSTALL.NOX_PLAYER_STATUS', false);
    if(!existNox){
        throw new Error('当前NoxPlayer还未完成下载，或未完成初始化！您可以尝试退出客户端（托盘图标右键→视图→强制退出）后重新打开');
    }

    let noxExe = utils.getNoxPath(); // 'C:\\Users\\bluef\\AppData\\Roaming\\YiyiNet\\NoxPlayer\\bin\\Nox.exe';
    let execa = require('execa');
    let nox = execa(noxPath, ['-clone:Nox_' + index]);

    store.set('INSTALL.NOX_PLAYER_PID', nox.pid);
}
