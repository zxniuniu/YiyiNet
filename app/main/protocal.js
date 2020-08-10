import {app} from "electron";
import path from "path";
import config from '../configs/app.config';

// electron加入开机启动项 https://newsn.net/say/node-auto-launch.html
// 设置加入开机启动项 https://newsn.net/say/electron-auto-launch.html
export function setProtocol() {
    // 协议注册 https://newsn.net/say/electron-fake-protocal-debug.html
    // 如何通过伪协议唤起本地exe程序 https://newsn.net/say/fake-protocol-win.html

    // 如何接收识别协议URL https://newsn.net/say/electron-fake-protocol-url.html
    // 获取URL相关系列参数总结 https://newsn.net/say/electron-fake-protocol-args.html
    if (app.isPackaged) {
        app.setAsDefaultProtocolClient(config.protocol, process.execPath, ["--"]);
    } else {
        app.setAsDefaultProtocolClient(config.protocol, process.execPath, [path.resolve(process.argv[1]), "--"]);
    }

}