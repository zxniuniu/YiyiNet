import {app} from "electron";
import path from "path";

// electron加入开机启动项 https://newsn.net/say/node-auto-launch.html
// 设置加入开机启动项 https://newsn.net/say/electron-auto-launch.html
export function setAutoLaunch() {
    if (!app.isPackaged) {
        app.setLoginItemSettings({
            openAtLogin: true,
            openAsHidden: false,
            path: process.execPath,
            args: [path.resolve(process.argv[1])]
        });
    } else {
        app.setLoginItemSettings({});
    }
}