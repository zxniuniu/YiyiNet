//页面右键菜单

const electron = require('electron')
const BrowserWindow = electron.BrowserWindow
const Menu = electron.Menu
const MenuItem = electron.MenuItem
const ipc = electron.ipcMain
const app = electron.app

/*const menu = new Menu()
menu.append(new MenuItem({ label: '刷新' }))
menu.append(new MenuItem({ type: 'separator' }))
menu.append(new MenuItem({ label: '关闭当前选项卡' }))
menu.append(new MenuItem({ label: '关闭所有选项卡' }))
menu.append(new MenuItem({ label: 'Electron', type: 'checkbox', checked: true }))

app.on('browser-window-created', function (event, win) {
  win.webContents.on('context-menu', function (e, params) {
    menu.popup(win, params.x, params.y)
  })
})

ipc.on('show-context-menu', function (event) {
  const win = BrowserWindow.fromWebContents(event.sender)
  menu.popup(win)
})*/

// 右键菜单 https://github.com/sindresorhus/electron-context-menu
const contextMenu = require('electron-context-menu');
contextMenu({
    append: (defaultActions, params, browserWindow) => [{
        //	label: 'Rainbow',
        //	visible: params.mediaType === 'image' // https://www.electronjs.org/docs/api/web-contents#event-context-menu
        //}, {
        label: '张小妞的博客',
        // visible: params.selectionText.trim().length > 0,
        click: () => {
            shell.openExternal(`https://fuyiyi.imdo.co/`);
        }
    }],
    showLookUpSelection: true,

    showCopyImage: false,
    showCopyImageAddress: false,

    showSaveImage: false,
    showSaveImageAs: true,

    // showInspectElement: true,

    showServices: false,
    showSearchWithGoogle: false,

    labels: {
        cut: '剪切',
        copy: '复制',
        paste: '粘贴',
        copyLink: '复制链接',
        saveImageAs: '图片另存为...',
        inspect: '检查元素',
        searchWithGoogle: '使用谷歌搜索'
    }
    // shouldShowMenu: (event, params) => !params.isEditable,
});

