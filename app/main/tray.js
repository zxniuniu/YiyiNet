import {Tray, webContents} from 'electron';
import {genMenus} from './menus';
import {getIco, packageJson} from './../utils';
import i18n from '../configs/i18next.config';

var tray = null; // 全局变量

/**
 * 设置托盘菜单
 * @param mainWindow
 */
export function setTray(mainWindow) {
    // 实现tray托盘图标及上下文菜单 https://newsn.net/say/electron-tray.html
    // https://newsn.net/say/electron-tray-switch.html
    // https://newsn.net/say/electron-tray-template-colorful.html
    const trayIconImage = getIco('app.ico', 0);
    trayIconImage.setTemplateImage(true);
    // let trayPress = path.join(__dirname, "./assets/icon/app-gray.ico");
    if (null === tray) {
        // tray = new Tray(trayIcon);
        tray = new Tray(trayIconImage)
    } else {
        tray.setImage(trayIconImage);
    }
    // tray.setPressedImage(trayPress);

    tray.setToolTip(packageJson().productName);

    i18n.on('languageChanged', async (languageCode) => {
        genMenus(mainWindow, tray);
        // settings.setSync('DEFAULT_LANGUAGE', languageCode);
        webContents.getAllWebContents().forEach((wc) => {
            wc.send('language-changed', {
                language: languageCode,
            });
        });
    });
    genMenus(mainWindow, tray);

    // 实现改写关闭事件为最小化到托盘 https://newsn.net/say/electron-tray-min.html
    tray.on("click", () => {
        if (mainWindow) {
            /*if (mainWindow.isVisible()) {
                mainWindow.hide()
            } else {
                mainWindow.show()
            }*/
            if (!mainWindow.isVisible()) {
                mainWindow.show();
                mainWindow.focus();
            }
        }
    });

    // 托盘图标像QQ一样闪动 https://newsn.net/say/electron-tray-flash.html
    /* var count = 0;
    var ico_switch = setInterval(function () {
        if (count++ % 2 === 0) {
            tray.setImage(trayIconImage);
        } else {
            tray.setImage(trayPress);
        }
    }, 1000);
    setTimeout(function () {
        clearInterval(ico_switch);
        tray.setImage(trayIconImage);
    }, 100000);*/

}

export function destroyTray() {
    if (tray) {
        tray.destroy();
    }
}

export function checkDarkmode() {
    /*let ico_1 = "";
    let ico_2 = "";
    if (systemPreferences.isDarkMode()) {
        ico_1 = "tray-dark.png";
        ico_2 = "tray-dark-press.png";
    } else {
        ico_1 = "tray-light.png";
        ico_2 = "tray-light-press.png";
    }
    ico_1 = path.join(__dirname, "./img/" + ico_1);
    ico_2 = path.join(__dirname, "./img/" + ico_2);
    if (tray == null) {
        tray = new Tray(ico_1);
    } else {
        tray.setImage(ico_1);
    }
    tray.setPressedImage(ico_2);*/
}