import {app} from 'electron';

const config = {
  platform: process.platform,
  languages: ['zh-CN', 'en'],
  defaultLanguage: 'zh-CN',
  namespace: 'translation',
  mainUrl: 'http://localhost:8090/index',
  protocol: 'yiyinet',
  isDev: process.env.NODE_ENV === 'development' || process.argv.indexOf("--debug") >= 0 || !app.isPackaged,
  showMenuBar: true,
  devToolsPostion: 'right'
};

export default config;