import {app} from 'electron';
import path from 'path';

// electron如何集成绿色版flash插件 https://newsn.net/say/electron-flash-crossplatform.html
export function addPepFlashCommandLine() {
    try {
        let pepflashplayer = app.getPath('pepperFlashSystemPlugin');
        if (process.platform === "win32") {
            if (process.arch === 'x64') {
                pepflashplayer = path.join(__dirname, 'dll/pepflashplayer64_32.0.0.403.dll');
            } else {
                pepflashplayer = path.join(__dirname, 'dll/pepflashplayer32_32.0.0.403.dll');
            }
        } else if (process.platform === 'darwin') {
            pepflashplayer = path.join(__dirname, 'dll/PepperFlashPlayer.plugin');
        }
        app.commandLine.appendSwitch('ppapi-flash-path', pepflashplayer);
        // console.log("添加Flash Player到启动参数")
    } catch (e) {
    }
}