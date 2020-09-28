import path from "path";
import fs from "fs";
import utils from "../utils";
import store from "../configs/settings";
import pFun from "p-fun";

/**
 * 去除NoxPlayer启动时广告（主要是通过删除文件夹，以及设置只读属性来解决）
 */
exports.removeNoxPlayerStartAds = () => {
    let noxFolder = path.join(utils.getNoxConfigPath(), 'loading');
    if (fs.existsSync(noxFolder)) {
        let st = fs.statSync(noxFolder);
        // 如果是文件夹，则删除后新建一个同名文件，并设置为只读
        if (st.isDirectory()) {
            utils.removeFolder(noxFolder).then(() => {
                fs.writeFileSync(noxFolder, '', function (err) {
                    if (err) {
                        console.log(err);
                    }
                });
                st = fs.statSync(noxFolder);
            })
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
exports.removeNoxPlayerUpdateNotice = (version) => {
    version = version === undefined || version === '' || version === null ? '6.6.1.2201' : version;

    let noxConfig = path.join(utils.getNoxConfigPath(), 'util_conf.ini');
    let txtContent = '[online_update]\r\nignore_version=' + version + '\r\n';

    if (!fs.existsSync(noxConfig)) {
        fs.writeFileSync(noxConfig, txtContent, function (err) {
            if (err) {
                console.log(err);
            }
        });
    } else {
        let content = fs.readFileSync(noxConfig, 'utf8');
        if(content.indexOf('ignore_version=' + version) === -1){
            fs.appendFileSync(noxConfig, txtContent);
        }
    }
}

/**
 * NoxPlayer启动前去广告，以及去更新
 */
exports.configNoxPlayerBeforeStart = async (version) => {
    exports.removeNoxPlayerStartAds();
    exports.removeNoxPlayerUpdateNotice(version);
}

/**
 * 启动NoxPlayer
 * @param index Nox模拟器的索引
 */
exports.startNoxPlayer = async (index) => {
    index = index === undefined || index === '' || index === null || index < 0 ? 0 : index; // index默认值
    let existNox = store.get('INSTALL.NOX_PLAYER_STATUS', false);
    if (!existNox) {
        throw new Error('当前NoxPlayer还未完成下载，或未完成初始化！您可以尝试退出客户端（托盘图标右键→视图→强制退出）后重新打开');
    }

    // 启动前去除广告等
    await exports.configNoxPlayerBeforeStart();

    let noxExe = utils.getNoxPath(); // 'C:\\Users\\bluef\\AppData\\Roaming\\YiyiNet\\NoxPlayer\\bin\\Nox.exe';
    let nox = utils.execa(noxExe, ['-clone:Nox_' + index]);

    store.set('INSTALL.NOX_PLAYER_PID', nox.pid);

    exports.checkEmulatorStatus();
}

/**
 * 检查模拟器是否已经启动完成
 */
exports.checkEmulatorStatus = (index) => {
    let noxAdb = utils.getNoxAdb();

    // adb devices                                offline表示刚刚启动；device表示已启动（开始显示启动动画）但仍未完全启动。
    // adb shell getprop dev.bootcompleted        返回1表示已启动但仍未完全启动
    // adb shell getprop sys.boot_completed       返回1表示已完全启动（API Level 9 或更高）
    // adb shell getprop init.svc.bootanim        返回running表示启动动画未结束，返回stopped表示启动动画已结束（完全启动）

    let commands = ['devices', 'shell getprop dev.bootcompleted', 'shell getprop sys.boot_completed', 'adb shell getprop init.svc.bootanim'];
    let mapper = async (command) => {
        let res = await utils.execaLines(noxAdb, command.split(' '));
        return res.stdout;
    }

    let tryTime = 0, tryTimes = 600;
    (async () => {
        while (tryTime++ <= tryTimes) {
            let results = await pFun.map(commands, mapper, {concurrency: commands.length, stopOnError: false});
            console.log('第[' + tryTime + '/' + tryTimes + ']次：' + results);
            pFun.delay(2000);
        }
    })();
}
