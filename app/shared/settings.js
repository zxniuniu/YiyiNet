import settings from 'electron-settings';

// set default persistent settings, do it here because settings are kind of like state!
settings.set({
  'presets': {},

  'SAVED_SESSIONS': [],
  'SERVER_ARGS': null,
  'SESSION_SERVER_PARAMS': null,
  'SESSION_SERVER_TYPE': null,

  'SAVED_FRAMEWORK': 'java'
});

export default settings;
