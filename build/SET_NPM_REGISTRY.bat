:: win环境，electron构建时的各种下载错误问题的解决方案
:: https://newsn.net/say/electron-builder-error.html

:: 如何制作俄罗斯套娃一般的 electron 专用 ico 图标
:: https://newsn.net/say/electron-ico.html

:: electron-builder打包时下载文件错误 nsis，nsis-resources，winCodeSign等
:: https://github.com/electron-userland/electron-builder/issues/1859
:: https://newsn.net/say/electron-builder-error.html

:: 正确设置 ELECTRON_MIRROR ，加速下载 electron 预编译文件 https://newsn.net/say/electron-mirror.html
:: https://npm.taobao.org/mirrors

call npm config set registry https://registry.npm.taobao.org/
call npm config set disturl https://npm.taobao.org/dist

call npm config set electron_mirror https://npm.taobao.org/mirrors/electron/
call npm config set chromedriver_cdnurl https://npm.taobao.org/mirrors/chromedriver
call npm config set phantomjs_cdnurl http://npm.taobao.org/mirrors/phantomjs
call npm config set operadriver_cdnurl http://npm.taobao.org/mirrors/operadriver
call npm config set selenium_cdnurl https://npm.taobao.org/mirrors/selenium

call npm config set sass_binary_site https://npm.taobao.org/mirrors/node-sass/
call npm config set node_sqlite3_binary_host_mirror http://npm.taobao.org/mirrors
call npm config set python_mirror http://npm.taobao.org/mirrors/python

call npm config set electron_builder_binaries_mirror http://npm.taobao.org/mirrors/electron-builder-binaries/

call npm config set profiler_binary_host_mirror http://npm.taobao.org/mirrors/node-inspector/
call npm config set npm_config_profiler_binary_host_mirror http://npm.taobao.org/mirrors/node-inspector/
call npm config set node_inspector_cdnurl http://npm.taobao.org/mirrors/node-inspector/

call npm config set puppeteer_download_host https://npm.taobao.org/mirrors
call npm config set npm_config_disturl https://npm.taobao.org/mirrors/atom-shell
