import settings from 'electron-settings';

// set default persistent settings, do it here because settings are kind of like state!
settings.set({
  'DEFAULT_LANGUAGE': 'cn',

  'SAVED_SESSIONS': [],
  'SERVER_ARGS': null,
  'SESSION_SERVER_PARAMS': null,
  'SESSION_SERVER_TYPE': null,
  'SAVED_FRAMEWORK': 'java',

  'FORCE_QUIT_FLAG': false, // 是否是强制退出，如果是则退出，否则隐藏主窗口

  'MODULE_INSTALL': false, // Module是否安装完成
  'ADS_LOAD': false, // ADS是否加载

});

export function resetObj(){
  // 程序结束时会设置强制退出为true，因此需在启动时重置其值
  settings.reset("FORCE_QUIT_FLAG");

  // 模块在启动后会重新安装
  settings.reset("MODULE_INSTALL");

  // 广告过滤器在打开后也会重新加载
  settings.reset("ADS_LOAD");

}

export function moduleInstallSucc() {
  settings.setSync("MODULE_INSTALL", true);
}

export function adsLoadSucc() {
  settings.setSync("ADS_LOAD", true);
}

export default settings;
