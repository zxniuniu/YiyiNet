import settings from 'electron-settings';

// set default persistent settings, do it here because settings are kind of like state!
settings.set({
  'DEFAULT_LANGUAGE': 'cn',

  'SAVED_SESSIONS': [],
  'SERVER_ARGS': null,
  'SESSION_SERVER_PARAMS': null,
  'SESSION_SERVER_TYPE': null,

  'SAVED_FRAMEWORK': 'java',
  'FORCE_QUIT_FLAG': false // 是否是强制退出，如果是则退出，否则隐藏主窗口
});

export default settings;
