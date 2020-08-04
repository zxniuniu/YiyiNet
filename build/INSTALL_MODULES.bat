:: https://github.com/ArekSredzki/electron-release-server.git
:: https://github.com/atlassian/nucleus.git

call cd %~dp0

:: 需要全局安装的工具
:: cnpm install -g --production windows-build-tools
:: cnpm install -g node-gyp

call cnpm install electron-dl

call cnpm install electron-unhandled

:: https://github.com/sindresorhus/electron-util
call cnpm install electron-util

call cnpm install electron-squirrel-startup

:: call cnpm install electron-store

call cnpm install electron-context-menu

:: Human-friendly and powerful HTTP request library for Node.js

:: https://github.com/sindresorhus/got
call cnpm install got --save

:: https://github.com/axios/axios
call cnpm install axios --save

:: https://github.com/visionmedia/superagent
call cnpm install superagent --save

:: https://github.com/cheeriojs/cheerio
call cnpm install cheerio --save

:: https://github.com/request/request
call cnpm install request --save

:: Using Google Analytics to gather usage statistics in Electron
:: https://www.npmjs.com/package/universal-analytics
:: call cnpm install universal-analytics

:: https://github.com/appium/appium
call cnpm install appium --save

:: webdriverio
call cnpm install webdriverio --save

:: https://github.com/puppeteer/puppeteer
:: call cnpm install puppeteer --save


call cnpm install @wdio/cli --save


:: cnpm install require-from-url
:: cnpm install require-from-web


:: http://browserify.org/index.html
call cnpm install browserify --save-dev

:: https://github.com/electron-userland/spectron
call cnpm install --save-dev spectron

call cnpm install electron-process-manager --save