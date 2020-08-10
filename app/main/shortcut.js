import {globalShortcut} from 'electron';

/**
 * 设置快捷键
 * @param mainWindow
 */
export function setShortcut(mainWindow) {
    // 快捷键注册方式对比最佳实践总结 https://newsn.net/say/electron-shortcut.html
    // 注册全局快捷键，并执行某个事件 https://newsn.net/say/electron-globalshortcut.html
    let shortcutKey = 'F6';
    const regSucc = globalShortcut.register(shortcutKey, (event, arg) => { // CmdOrCtrl+Shift+A， CommandOrControl+X
        // console.log('打开客户端')
        if (mainWindow !== null) {
            mainWindow.show();
        }
    });
    if (!regSucc) {
        console.log('快捷键 ' + shortcutKey + ' 注册失败！')
    }
    // 检查快捷键是否注册成功
    console.log('快捷键 ' + shortcutKey + ' 是否注册成功：' + globalShortcut.isRegistered(shortcutKey))

}