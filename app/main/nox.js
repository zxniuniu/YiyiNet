import path from "path";
import fs from "fs";
import utils from "../utils";
import store from "../configs/settings";
import pFun from "p-fun";
import ini from './ini';

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
            }).catch(err => {
                console.log('删除NoxPlayer的广告文件夹[' + noxFolder + ']失败：' + err);
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
exports.removeNoxPlayerUpdateNotice = (version = '6.6.1.2201') => {
    let utilConfig = path.join(utils.getNoxConfigPath(), 'util_conf.ini');
    let noxConfig = ini.readSync(utilConfig);
    if (noxConfig.online_update.ignore_version !== version) {
        noxConfig.online_update.ignore_version = version;
        ini.writeSync(utilConfig, noxConfig);
    }

    /*let txtContent = '[online_update]\r\nignore_version=' + version + '\r\n';

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
    }*/
}

/**
 * 设置默认的Nox设置
 */
exports.setNoxPlayerSettings = () => {
    let configPath = path.join(utils.getNoxConfigPath(), 'conf.ini');
    let noxConfig = ini.readSync(configPath);

    // 设置文件共享位置
    noxConfig.setting.share_path = utils.getUserData().replaceAll('\\\\', '/') + '/NoxShare/'

    // 设置默认的参数值
    // ============常用设置============
    noxConfig.setting.boot = false // 开机自动启动
    noxConfig.setting.root = true // 开启Root
    noxConfig.setting.soft_keyboard = false // 开启软键盘
    noxConfig.setting.performance_optiniza = false // 显示性能优化提示
    noxConfig.setting.balloon_tips_notification = false // 气泡消息提示

    // ============高级设置============
    noxConfig.setting.performance_type = 1 // 性能设置 0：低 1：中 2：高
    noxConfig.setting.screen_type = 1 // 分辨率设置 0：平板电脑 （h_dpi=160，h_resolution=960x540）1：手机模式（v_dpi=160，v_resolution=540x960）

    delete noxConfig.setting.h_dpi
    delete noxConfig.setting.h_resolution
    noxConfig.setting.v_dpi = 160 // 添加这个 // 添加这个需要删除 h_dpi
    noxConfig.setting.v_resolution = '540x960' // 添加这个需要删除 h_resolution

    noxConfig.setting.graphic_engine_type = 1 // 显卡渲染模式 0：兼容模式 2：增加兼容模式 1：极速模式
    noxConfig.setting.frames = 20 // 帧数设置
    noxConfig.setting.mouse_accelerate_flag = true // 禁用Windows鼠标加速

    // ============属性设置============

    // ============界面设置============
    noxConfig.setting.forcelandscape = false // 强制模拟器处于竖屏状态
    noxConfig.setting.fixsize = false // 强制模拟器窗口大小固定
    noxConfig.setting.is_save_pos_and_size = true // 保留上次关闭窗口位置和大小
    noxConfig.setting.virtualkey = false // 右侧虚拟按键
    // 底部虚拟按键
    noxConfig.setting.exit_option = 2 // 退出模拟器选项 0:弹出提示 1:直接退出 2:最小化到托盘

    // ===========快捷键设置===========
    noxConfig.setting.bosskey_enabled = false // 老板键
    noxConfig.setting.muteauto_enabled = true // 隐藏时自动静音
    noxConfig.setting.backkey_enabled = false // 返回键
    noxConfig.setting.homekey_enabled = false // 主页键
    noxConfig.setting.menukey_enabled = false // 菜单键
    noxConfig.setting.recent_task_key_enabled = false // 最近任务键
    noxConfig.setting.clip_cursor_key_enabled = false // 鼠标锁定到模拟器窗口

    noxConfig.setting.window_on_top = false // 是否显示在最前面

    // display_toolbar_rom_keys=true
    // toolbar_live_streaming_index=-1

    // 大小
    // noxConfig.setting.last_player_width=197 // 400:197
    noxConfig.setting.last_player_height = 400 // 400:197
    noxConfig.setting.last_player_posx = 50
    noxConfig.setting.last_player_posy = 50

    // 显示工具栏的设置
    // noxConfig.toolbar_setting.display_toolbar_add_apk=true // 默认true
    // noxConfig.toolbar_setting.display_toolbar_clip_cursor=true // 默认true
    // noxConfig.toolbar_setting.display_toolbar_close_all=true // 默认true
    // noxConfig.toolbar_setting.display_toolbar_double_fingers=false // 默认false
    noxConfig.toolbar_setting.display_toolbar_full_screen = false // 默认true
    // noxConfig.toolbar_setting.display_toolbar_keyboard_control=true // 默认true
    // noxConfig.toolbar_setting.display_toolbar_live_streaming=false // 默认false
    // noxConfig.toolbar_setting.display_toolbar_multiplayer=true // 默认true
    // noxConfig.toolbar_setting.display_toolbar_mute=false // 默认false
    noxConfig.toolbar_setting.display_toolbar_reboot = false // 默认true
    // noxConfig.toolbar_setting.display_toolbar_rom_keys=true // 默认true
    // noxConfig.toolbar_setting.display_toolbar_rom_menu=true // 默认true
    // noxConfig.toolbar_setting.display_toolbar_rotate=true // 默认true
    noxConfig.toolbar_setting.display_toolbar_screen_cap = false // 默认true
    noxConfig.toolbar_setting.display_toolbar_script_record = false // 默认true
    // noxConfig.toolbar_setting.display_toolbar_settings_usb=true // 默认true
    noxConfig.toolbar_setting.display_toolbar_shake = false // 默认true
    // noxConfig.toolbar_setting.display_toolbar_share_folder=true // 默认true
    // noxConfig.toolbar_setting.display_toolbar_synchronous_operate=true // 默认true
    noxConfig.toolbar_setting.display_toolbar_video_record = false // 默认true
    // noxConfig.toolbar_setting.display_toolbar_virtual_position=true // 默认true
    noxConfig.toolbar_setting.display_toolbar_volumn_down = false // 默认true
    noxConfig.toolbar_setting.display_toolbar_volumn_up = false // 默认true

    // 写入修改的文件
    ini.writeSync(configPath, noxConfig);
}

/**
 * NoxPlayer启动前去广告，以及去更新
 */
exports.configNoxPlayerBeforeStart = async (version) => {
    exports.removeNoxPlayerStartAds();

    exports.removeNoxPlayerUpdateNotice(version);

    exports.setNoxPlayerSettings();
}

/**
 * 启动NoxPlayer
 * @param index Nox模拟器的索引
 */
exports.startNoxPlayer = async (index = 0) => {
    let existNox = store.get('INSTALL.NOX_PLAYER_STATUS', false);
    if (!existNox) {
        throw new Error('当前NoxPlayer还未完成下载，或未完成初始化！您可以尝试退出客户端（托盘图标右键→视图→强制退出）后重新打开');
    }

    // 启动前去除广告等
    await exports.configNoxPlayerBeforeStart();
    let noxExe = utils.getNoxPath(); // 'C:\\Users\\bluef\\AppData\\Roaming\\YiyiNet\\NoxPlayer\\bin\\Nox.exe';
    let nox = utils.execa(noxExe, ['-clone:Nox_' + index]);
    store.set('INSTALL.NOX_PLAYER_PID', nox.pid);

    await exports.checkEmulatorStatus();
}

/**
 * 获取模拟器ID
 */
exports.getEmulators = async (index = 0) => {
    let deviceLines = await utils.execaLines(utils.getNoxAdb(), ['devices']);
    return deviceLines[index].split(' ')[0];
}

/**
 * 检查模拟器是否已经启动完成
 */
exports.checkEmulatorStatus = async (index = 0) => {
    let noxAdb = utils.getNoxAdb();

    // adb devices                                offline表示刚刚启动；device表示已启动（开始显示启动动画）但仍未完全启动。
    // adb shell getprop dev.bootcompleted        返回1表示已启动但仍未完全启动
    // adb shell getprop sys.boot_completed       返回1表示已完全启动（API Level 9 或更高）
    // adb shell getprop init.svc.bootanim        返回running表示启动动画未结束，返回stopped表示启动动画已结束（完全启动）

    let commands = [/*'devices', */'shell getprop sys.boot_completed', 'shell getprop init.svc.bootanim'];
    let mapper = async (command) => {
        return await utils.execaLines(noxAdb, command.split(' '));
    }

    let tryTime = 0, tryTimes = 60;
    while (tryTime++ <= tryTimes) {
        let results = await pFun.map(commands, mapper, {concurrency: commands.length, stopOnError: false});
        console.log('第[' + tryTime + '/' + tryTimes + ']次：' + results);

        if (results[0] === '1' && results[1] === 'stopped') {
            console.log('获取取已经启动的模拟器，地址：' + results[0].split(' ')[0]);
            break;
        }
        pFun.delay(1000);
    }
}
