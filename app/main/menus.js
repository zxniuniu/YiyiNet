import {app, dialog, Menu, shell} from 'electron';
// import { createNewSessionWindow, createNewConfigWindow} from './appium';
import {checkNewUpdates} from './auto-updater';
import config from '../configs/app.config';
import i18n from '../configs/i18next.config';
import {getIco, isDebugUrl, packageJson, toggleShowHide} from './../utils';
import store from './../configs/settings';

let menuTemplates = {mac: {}, other: {}};
let mainWindow = null;
let tray = null;

function languageMenu() {
    return config.languages.map((languageCode) => ({
        label: i18n.t(languageCode),
        type: 'radio',
        checked: i18n.language === languageCode,
        click: () => i18n.changeLanguage(languageCode)
    }));
}

function showAppInfoClickAction() {
    let json = packageJson();
    dialog.showMessageBoxSync({
        "type": 'info',
        "buttons": [],
        "title": '关于' + json.productName,
        "message": json.about + '\r\n版本：' + json.version + '\r\n\r\n主页：' + json.homepage + '\r\n项目：'
            + json.repository.url + '\r\n作者：' + json.author
    });
}

function menuSep() {
    return {
        type: "separator"
    }
}
/*function macMenuAppium () {
  return {
    label: 'Appium',
    submenu: [{
      label: i18n.t('About Appium'),
      click: showAppInfoClickAction
    }, {
      label: i18n.t('Check for updates'),
      click () {
        checkNewUpdates(mainWindow, true);
      }
    }, {
      type: 'separator'
    }, {
      label: i18n.t('New Session Window…'),
      accelerator: 'Command+N',
      click () {
        createNewSessionWindow(mainWindow);
      }
    }, {
      label: i18n.t('Configurations…'),
      click () {
        createNewConfigWindow(mainWindow);
      }
    }, {
      type: 'separator'
    }, {
      label: i18n.t('Hide Appium'),
      accelerator: 'Command+H',
      selector: 'hide:'
    }, {
      label: i18n.t('Hide Others'),
      accelerator: 'Command+Shift+H',
      selector: 'hideOtherApplications:'
    }, {
      label: i18n.t('Show All'),
      selector: 'unhideAllApplications:'
    }, {
      type: 'separator'
    }, {
      label: i18n.t('Quit'),
      accelerator: 'Command+Q',
      click () {
        app.quit();
      }
    }]
  };
}
function macMenuEdit () {
  return {
    label: i18n.t('Edit'),
    submenu: [{
      label: i18n.t('Undo'),
      accelerator: 'Command+Z',
      selector: 'undo:'
    }, {
      label: i18n.t('Redo'),
      accelerator: 'Shift+Command+Z',
      selector: 'redo:'
    }, {
      type: 'separator'
    }, {
      label: i18n.t('Cut'),
      accelerator: 'Command+X',
      selector: 'cut:'
    }, {
      label: i18n.t('Copy'),
      accelerator: 'Command+C',
      selector: 'copy:'
    }, {
      label: i18n.t('Paste'),
      accelerator: 'Command+V',
      selector: 'paste:'
    }, {
      label: i18n.t('Select All'),
      accelerator: 'Command+A',
      selector: 'selectAll:'
    }]
  };
}
function macMenuView () {
  const submenu = (process.env.NODE_ENV === 'development') ? [{
    label: i18n.t('Reload'),
    accelerator: 'Command+R',
    click () {
      mainWindow.webContents.reload();
    }
  }, {
    label: i18n.t('Toggle Developer Tools'),
    accelerator: 'Alt+Command+I',
    click () {
      mainWindow.toggleDevTools();
    }
  }] : [];

  submenu.push({
    label: i18n.t('Toggle Full Screen'),
    accelerator: 'Ctrl+Command+F',
    click () {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
  });

  submenu.push({
    label: i18n.t('Languages'),
    submenu: languageMenu(),
  });

  return {
    label: i18n.t('View'),
    submenu,
  };
}
function macMenuWindow () {
  return {
    label: i18n.t('Window'),
    submenu: [{
      label: i18n.t('Minimize'),
      accelerator: 'Command+M',
      selector: 'performMiniaturize:'
    }, {
      label: i18n.t('Close'),
      accelerator: 'Command+W',
      selector: 'performClose:'
    }, {
      type: 'separator'
    }, {
      label: i18n.t('Bring All to Front'),
      selector: 'arrangeInFront:'
    }]
  };
}
function macMenuHelp () {
  return {
    label: i18n.t('Help'),
    submenu: [{
      label: i18n.t('Learn More'),
      click () {
        shell.openExternal('http://appium.io');
      }
    }, {
      label: i18n.t('Documentation'),
      click () {
        shell.openExternal('https://appium.io/documentation.html');
      }
    }, {
      label: i18n.t('Search Issues'),
      click () {
        shell.openExternal('https://github.com/appium/appium-desktop/issues');
      }
    }, {
      label: i18n.t('Add Or Improve Translations'),
      click () {
        shell.openExternal('https://crowdin.com/project/appium-desktop');
      }
    }]
  };
}
menuTemplates.mac = async () => [
  macMenuAppium(),
  macMenuEdit(),
  await macMenuView(),
  macMenuWindow(),
  macMenuHelp(),
];*/

/*
function otherMenuFile() {
    let fileSubmenu = [{
        label: i18n.t('&Open'),
        accelerator: 'Ctrl+O'
    }, {
        label: i18n.t('&About Appium'),
        click: showAppInfoClickAction,
    }, {
        type: 'separator'
    }, /!*{
    label: i18n.t('&New Session Window...'),
    accelerator: 'Ctrl+N',
    click () {
      createNewSessionWindow(mainWindow);
    }
  }, *!/{
        label: i18n.t('&Close'),
        accelerator: 'Ctrl+W',
        click() {
            mainWindow.close();
        }
    }];

    // If it's Windows, add a 'Check for Updates' menu option
    if (process.platform === 'win32') {
        fileSubmenu.splice(1, 0, {
            label: i18n.t('&Check for updates'),
            click() {
                checkNewUpdates(mainWindow, true);
            }
        });
    }

    return {
        label: i18n.t('&File'),
        submenu: fileSubmenu,
    };
}

function otherMenuView() {
    const submenu = [];
    submenu.push({
        label: i18n.t('Toggle &Full Screen'),
        accelerator: 'F11',
        click() {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
        }
    });

    submenu.push({
        label: i18n.t('Languages'),
        submenu: languageMenu(),
    });

    if (process.env.NODE_ENV === 'development') {
        submenu.push({
            label: i18n.t('&Reload'),
            accelerator: 'Ctrl+R',
            click() {
                mainWindow.webContents.reload();
            }
        });
        submenu.push({
            label: i18n.t('Toggle &Developer Tools'),
            accelerator: 'Alt+Ctrl+I',
            click() {
                mainWindow.toggleDevTools();
            }
        });
    }

    return {
        label: i18n.t('&View'),
        submenu,
    };
}

function otherMenuHelp() {
    return {
        label: i18n.t('Help'),
        submenu: [{
            label: i18n.t('Learn More'),
            click() {
                shell.openExternal('http://appium.io');
            }
        }, {
            label: i18n.t('Documentation'),
            click() {
                shell.openExternal('https://appium.io/documentation.html');
            }
        }, {
            label: i18n.t('Search Issues'),
            click() {
                shell.openExternal('https://github.com/appium/appium-desktop/issues');
            }
        }]
    };
}
*/

function otherMenuFriend() {
    let submenu = [{
        label: "站内博客",
        icon: getIco('asana.ico'),
        click: function () {
            shell.openExternal(new URL(config.mainUrl).origin + '/blog');
        }
    }, {
        label: "作者博客",
        icon: getIco('spotify.ico'),
        click: function () {
            shell.openExternal('https://fuyiyi.imdo.co');
        }
    }, menuSep(), {
        label: "小妞图库",
        icon: getIco('solo.ico'),
        click: function () {
            shell.openExternal('http://niuniu.hicp.net');
        }
    }];

    return {
        label: "友链", // "友情链接"
        icon: getIco('link.ico'),
        submenu: submenu
    };
}

function otherMenuSetting() {
    let submenu = [];
    submenu.push({
        label: i18n.t('Languages'),
        icon: getIco('tallyfy.ico'),
        submenu: languageMenu()
    });

    return {
        label: i18n.t('Setting'),
        icon: getIco('edit.ico'),
        submenu: submenu
    };
}

function otherMenuView() {
    let submenu = [];
    submenu.push({
        label: i18n.t('Toggle Full Screen'),
        icon: getIco('schoolloop.ico'),
        accelerator: 'F11',
        click() {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
        }
    });

    if (config.isDev || isDebugUrl()) {
        submenu.push({
            label: i18n.t('Reload'),
            accelerator: 'Ctrl+R',
            click() {
                mainWindow.webContents.reload();
            }
        });
        submenu.push({
            label: i18n.t('Toggle Developer Tools'),
            accelerator: 'Ctrl+Shift+I',
            click() {
                if (!mainWindow.isVisible()) {
                    mainWindow.show();
                    mainWindow.focus();
                }
                mainWindow.toggleDevTools();
            }
        });
    }

    submenu.push(menuSep());
    submenu.push({
        label: i18n.t('Show / Hide'),
        icon: getIco('codetree.ico'),
        accelerator: 'F6',
        // icon: getIco('show.ico'),
        click: function () {
            toggleShowHide(mainWindow);
        }
    });
    submenu.push({
        label: i18n.t('Force Quit'),
        icon: getIco('unlockicon.ico'),
        click: function () {
            // https://discuss.atom.io/t/how-to-catch-the-event-of-clicking-the-app-windows-close-button-in-electron-app/21425
            store.set("FORCE_QUIT_FLAG", 'force');
            app.quit();
        }
    });

    return {
        label: i18n.t('View'),
        icon: getIco('programming.ico'),
        submenu: submenu
    };
}

function otherMenuAbout() {
    return {
        label: i18n.t('About'),
        icon: getIco('update.ico'),
        submenu: [{
            label: i18n.t('About Software'),
            icon: getIco('app-gray.ico'),
            click: showAppInfoClickAction,
        }, {
            label: i18n.t('Check for updates'),
            icon: getIco('update.ico'),
            click() {
                checkNewUpdates(mainWindow, true);
            }
        }, {
            type: "separator",
        }, {
            label: "项目主页",
            icon: getIco('basecamp.ico'),
            click: function () {
                shell.openExternal('https://github.com/zxniuniu/YiyiNet');
            }
        }, {
            label: "使用文档",
            icon: getIco('feedly.ico'),
            click: function () {
                shell.openExternal('https://fuyiyi.imdo.co/tags/YiyiNet');
            }
        }, {
            label: i18n.t('Search Issues'),
            icon: getIco('devdocs.ico'),
            click() {
                shell.openExternal('https://github.com/zxniuniu/YiyiNet/issues');
            }
        }]
    };
}

function myMenu() {
    return {
        label: 'TEST',// i18n.t('Help'),
        submenu: [{
            label: "检查更新",
            icon: getIco('update.ico'),
            click: function () {
                checkUpdate();

                autoUpdater.once("update-not-available", function (info) {
                    sendStatusToWindow('Update not available.');
                    dialog.showMessageBoxSync({
                        "type": 'info',
                        "buttons": ['确定'],
                            "title": '版本更新',
                            "message": '当前版本[' + app.getVersion() + ']为最新版，您不需要更新^_^'
                        });
                    });
                    autoUpdater.once('update-available', (info) => {
                        sendStatusToWindow('Update available.');
                        dialog.showMessageBoxSync({
                            "type": 'info',
                            "buttons": ['确定'],
                            "title": '版本更新',
                            "message": '检测到新版本[' + info.version + ']，将自动更新当前版本[' + app.getVersion() + ']到最新版^_^'
                        });
                    })
                }
            }, {
                type: "separator",
            }, {
                label: '关于软件...',
                icon: getIco('click.ico'),
                click: function () {
                }
            }
        ]
    };
}

menuTemplates.other = async () => [
    otherMenuFriend(),
    menuSep(),
    otherMenuSetting(),
    await otherMenuView(),
    menuSep(),
    otherMenuAbout()
];

export async function genMenus(mainWin = null, trayIn = null) {
    if (mainWin) {
        mainWindow = mainWin;
    }
    if (!mainWindow) {
        return;
    }
    if (trayIn) {
        tray = trayIn;
    }

    let template;
    if (config.platform === 'darwin') {
        template = await menuTemplates.mac(mainWindow);
        // const menu = Menu.buildFromTemplate(template);
        // Menu.setApplicationMenu(menu);
    } else {
        template = await menuTemplates.other(mainWindow);
        // const menu = Menu.buildFromTemplate(template);
        // mainWindow.setMenu(menu);
    }

    let curMenu = await Menu.buildFromTemplate(template);
    if (config.showMenuBar && !app.isPackaged) {
        if (config.platform === 'darwin') {
            // https://newsn.net/say/electron-no-application-menu.html
            Menu.setApplicationMenu(curMenu);
        } else {
            mainWindow.setMenu(curMenu);
        }
    }

    if (trayIn) {
        tray.setContextMenu(curMenu);
    }
    return curMenu;
}