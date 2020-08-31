import {app} from 'electron';

const config = {
    platform: process.platform,
    languages: ['cn'], // ['cn', 'en']
    namespace: 'translation',

    mainUrl: 'http://localhost:8070/index', // 测试广告：https://www.cnbeta.com/articles/science/1015999.htm http://localhost:8070/index
    isDev: process.env.NODE_ENV === 'development' || process.argv.indexOf("--debug") >= 0 || !app.isPackaged,

    protocol: 'yiyinet',
    showMenuBar: false,
    devToolsPostion: 'right',

    user: 'zxniuniu',
    repo: 'YiyiNet',

    // Store保存的数据
    defaultStoreValue: {
        FORCE_QUIT_FLAG: false, // 是否是强制退出，如果是则退出，否则隐藏主窗口
        MODULE_INSTALL: false, // 模块是否安装完成
        ADS_LOAD: false, // ADS是否加载
        CHROMEDRIVER: {
            STATUS: false, // chromedriver是否启动
            PORT: 9515, // CHROMEDRIVER端口
            PID: 0 // CHROMEDRIVER的PID，用于结束进程
        },
        APPIUM: {
            STATUS: false, // appium是否启动
            PORT: 4723, // APPIUM端口
            PID: 0 // APPIUM的PID，用于结束进程
        },
        TOOLS: {
            YOUTUBE_DL: false,
            V2RAY_CORE: false
        }
    },

    storeValue: {
        DEFAULT_LANGUAGE: 'cn' // 默认语言，中文

    }
};

export default config;