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
        MODULE_INSTALL: false, // 模块是否全部安装完成
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
            YOUTUBE_DL: false, // 是否下载
            YOUTUBE_DL_DATE: 0, // YoutubeDl最新下载日期
            V2RAY_CORE: false, // 是否下载
            V2RAY_STATUS: false, // 是否启动
            V2RAY_DATE: 0, // v2ray下载日期
            CHROME_STATUS: false, // 是否下载
            FIREFOX_STATUS: false, // 是否下载
        }
    },
    storeValue: {
        DEFAULT_LANGUAGE: 'cn', // 默认语言，中文
        TOOLS_DOWNLOAD_INTERVAL_DAYS: 10, // 检查软件更新间隔的天数
        ENV: {
            // https://playwright.dev/#version=v1.3.0&path=docs%2Finstallation.md&q=
            PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: 1, // 配置playwright不自动下载浏览器
        },
        INSTALL: {
            PIP_STATUS: false, // Pip是否安装
            ALREADY_INSTALL: false, // 模块是否安装过，未安装过时，安装两次
            JRE_STATUS: false, // JRE是否安装
            ZIP7_STATUS: false, // 7-zip是否安装
            NOXPLAYER_STATUS: false, // NoxPlayer是否安装
        }
    }
};

export default config;