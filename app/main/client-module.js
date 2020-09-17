import store from "../configs/settings";
import utils from "../utils";

import {adblockerInstallFinishEvent} from "./adblocker";
import {hostileInstallFinishEvent} from "./hosts";

import path from "path";
import AsyncLock from 'async-lock';
import {puppeteerCoreInstallFinishEvent} from "./puppeteer";
import {pythonShellInstallFinishEvent} from "./python";

/**
 * 安装需在客户端上使用的模块
 */
export function installClientModule() {
    let json = utils.packageJson();
    // console.dir(json);
    let dependenciesKeys = Object.keys(json.dependencies);
    dependenciesKeys.push('cross-env', 'electron', 'electron-builder', 'electron-rebuild', 'npm-run-all', 'parcel-bundler');
    let devDependencies = json.dependenciesContainsOthers;
    dependenciesKeys.forEach(nn => {
        if (devDependencies[nn]) {
            delete devDependencies[nn];
        }
    });
    Object.keys(devDependencies).forEach(key => {
        let val = devDependencies[key];
        if (val.indexOf('&') > 0) {
            devDependencies[key] = val.split('&')[0];
        } else {
            delete devDependencies[key];
        }
    });

    // 获取是否是第一次安装，如果是第一次安装，完成后再安装一次
    let hasInstall = store.get('INSTALL.ALREADY_INSTALL', false);
    installModule(devDependencies, hasInstall);
}

/**
 * 安装模块
 * @param needInstall ｛‘module1': 'version1', ‘module2': 'version2'...｝
 * @param hasInstall 模块是否已经安装过（未安装过时安装两次，第二次确认）
 * @returns {Promise<void>}
 */
export function installModule(needInstall, hasInstall) {
    // module.paths.push(getNpmInstallPath());
    // console.log(module.paths);

    // NPM安装==========================================================================================================
    // https://stackoverflow.com/questions/15957529/can-i-install-a-npm-package-from-javascript-running-in-node-js/15957574#15957574
    // https://stackoverflow.com/questions/20686244/install-programmatically-a-npm-package-providing-its-version
    // https://stackoverflow.com/questions/48717853/electron-js-use-npm-internally-programmatically
    // https://stackoverflow.com/questions/34458417/run-node-js-server-file-automatically-after-launching-electron-app

    if (!hasInstall) {
        console.log('指定的所有模块标记是未安装过，当前为第一次安装，完成后会再进行一次安装，并执行安装完成后的事件');
    }
    const {PluginManager} = require('live-plugin-manager');
    let manager = new PluginManager({
        pluginsPath: getNpmInstallPath(),
        npmRegistryUrl: 'https://registry.npm.taobao.org/'
    });

    let modules = Object.keys(needInstall);
    // 将appium放在最后安装
    modules.sort(function (a, b) {
        if (a === 'appium') {
            return 1
        } else if (b === 'appium') {
            return -1
        } else {
            return a > b
        }
    });

    let lock = new AsyncLock({timeout: 300000});
    let succNum = 0, errNum = 0;
    let moNum = modules.length;
    for (let i = 0; i < moNum; i++) {
        let moduleStr = modules[i];
        let ver = needInstall[moduleStr];
        ver = ver === '' ? 'latest' : ver;

        lock.acquire("installModule", function (done) {
            try {
                let logStr = '[' + (i + 1) + '/' + moNum + ']安装模块[' + moduleStr + ']';
                // console.time(logStr + '安装所耗时间');
                // console.log(logStr + '，版本[' + ver + ']。。。');
                manager.install(moduleStr, ver).then(res => {
                    console.log(logStr + '，版本[' + ver + ']，安装[成功]：name=' + res.name + '[' + res.version + ']，依赖：' + Object.keys(res.dependencies));
                    // console.dir(res);
                    succNum++;

                    store.set('MODULE.' + moduleStr, true);
                    // console.timeEnd(logStr + '安装所耗时间');
                    if (i === moNum - 1) {
                        console.log('模块已完成安装，其中成功[' + succNum + ']个，失败[' + errNum + ']个，模块[' + modules + ']');

                        if (!hasInstall) {
                            store.set('INSTALL.ALREADY_INSTALL', true);
                            installModule(needInstall, true);
                        }
                        store.set('MODULE_INSTALL', errNum === 0);
                    }
                    done();
                    moduleInstallDoneEvent(moduleStr, res.version.replace("^", ""));
                })
            } catch (error) {
                errNum++;
                console.log('[' + (i + 1) + '/' + moNum + ']安装模块[' + moduleStr + ':' + ver + ']出现错误，将跳过: ' + error);
            }
        }, function (err, ret) {
        }, {});
    }
}

function moduleInstallDoneEvent(moduleStr, version) {
    // 广告过滤事件
    // console.log('moduleStr：' + moduleStr + "，version：" + version);
    if (moduleStr === '@cliqz/adblocker-electron') {
        adblockerInstallFinishEvent(moduleStr, version);
    } else if (moduleStr === 'hostile') {
        // 修改Hosts解决Github无法访问的问题
        hostileInstallFinishEvent(moduleStr, version);
    } else if (moduleStr === 'puppeteer-core') {
        // puppeteer安装完成后下载chrome及firefox
        puppeteerCoreInstallFinishEvent(moduleStr, version);
    } else if (moduleStr === 'python-shell') {
        // 设置python-shell默认参数值
        pythonShellInstallFinishEvent(moduleStr, version);
    }

}

/*async function installModule2(needInstall, type) {
    var previous = null, project = null;
    if (type === undefined || type === "undefined" || type === '' || type === null) {
        type = 'livepluginmanager'; // type = 'livepluginmanager';
    }
    if (needInstall.includes('npm')) {
        type = 'livepluginmanager';
    }
    if (app.isPackaged) {
        previous = process.execPath.substring(0, process.execPath.lastIndexOf('\\'));
        project = path.join(previous, 'resources');
    } else {
        previous = process.execPath.substring(0, process.execPath.lastIndexOf('node_modules') - 1);
        project = previous;
    }

    if (process.cwd() !== project) {
        console.log('(安装)目录由[' + process.cwd() + ']切换到[' + project + ']');
        process.chdir(project);
    }

    try {
        if (type === "npm") {
            let npm = require('npm');
            await npm.load(function (err) {
                // 设置NPM参数（注意必须放在npm.load函数中）
                let configKeys = Object.keys(npmConfig());
                console.log('设置NPM参数值，包括以下字段：' + configKeys);
                configKeys.forEach(key => {
                    npm.config.set(key, npmConfig[key]);
                });

                console.log('安装模块(NPM)：' + needInstall);
                // 安装模块
                npm.commands.install(needInstall, function (er, data) {
                    console.log(data); // log errors or data
                });
                npm.on('log', function (message) {
                    console.log('安装模块NPM日志：' + message); // log errors or data
                });
            });
        } else {
            const {PluginManager} = require('live-plugin-manager');
            let manager = new PluginManager({
                cwd: project,
                pluginsPath: './node_modules',
                npmRegistryUrl: 'https://registry.npm.taobao.org/'
            });
            for (let dependency of needInstall) {
                console.log('安装模块(LIVE-PLUGIN-MANAGER)：' + dependency);
                await manager.installFromNpm(dependency);
            }
        }
    } catch (error) {
        console.log('安装模块出现错误: ' + error);
    } finally {
        if (process.cwd() !== previous) {
            console.log('(还原)目录由[' + process.cwd() + ']切换到[' + previous + ']');
            process.chdir(previous); // 还原到原目录
        }
    }
    return {'module': needInstall, 'type': type, 'succ': true, 'msg': '安装成功'};
}*/


/**
 * 获取NPM模块安装路径
 * @returns {string}
 */
export const getNpmInstallPath = () => {
    // 保存在getUserData() + 'node_modules'中未解决加载时的路径问题
    const savePath = path.join(utils.getRootPath(), 'resources'); // process.resourcesPath
    return utils.checkPath(path.resolve(`${savePath}/node_modules/`));
};

/**
 * 返回NPM镜像路径 参见：https://github.com/gucong3000/mirror-config-china
 * @returns {{registry: string, phantomjs_cdnurl: string, node_sqlite3_binary_host_mirror: string, electron_mirror: string, puppeteer_download_host: string, selenium_cdnurl: string, disturl: string, operadriver_cdnurl: string, npm_config_disturl: string, profiler_binary_host_mirror: string, node_inspector_cdnurl: string, python_mirror: string, chromedriver_cdnurl: string, electron_builder_binaries_mirror: string, sass_binary_site: string, npm_config_profiler_binary_host_mirror: string}}
 */
export const npmConfig = () => {
    return {
        'chromedriver-cdnurl': 'https://npm.taobao.org/mirrors/chromedriver',
        'chromedriver_cdnurl': 'https://npm.taobao.org/mirrors/chromedriver',
        'couchbase-binary-host-mirror': 'https://npm.taobao.org/mirrors/couchbase/v{version}',
        'debug-binary-host-mirror': 'https://npm.taobao.org/mirrors/node-inspector',
        'disturl': 'https://npm.taobao.org/dist',
        'electron-mirror': 'https://npm.taobao.org/mirrors/electron/',
        'electron_builder_binaries_mirror': 'http://npm.taobao.org/mirrors/electron-builder-binaries/',
        'electron_mirror': 'https://npm.taobao.org/mirrors/electron/',
        'flow-bin-binary-host-mirror': 'https://npm.taobao.org/mirrors/flow/v',
        'fse-binary-host-mirror': 'https://npm.taobao.org/mirrors/fsevents',
        'fuse-bindings-binary-host-mirror': 'https://npm.taobao.org/mirrors/fuse-bindings/v{version}',
        'git4win-mirror': 'https://npm.taobao.org/mirrors/git-for-windows',
        'gl-binary-host-mirror': 'https://npm.taobao.org/mirrors/gl/v{version}',
        'grpc-node-binary-host-mirror': 'https://npm.taobao.org/mirrors',
        'hackrf-binary-host-mirror': 'https://npm.taobao.org/mirrors/hackrf/v{version}',
        'leveldown-binary-host-mirror': 'https://npm.taobao.org/mirrors/leveldown/v{version}',
        'leveldown-hyper-binary-host-mirror': 'https://npm.taobao.org/mirrors/leveldown-hyper/v{version}',
        'mknod-binary-host-mirror': 'https://npm.taobao.org/mirrors/mknod/v{version}',
        'node-sqlite3-binary-host-mirror': 'https://npm.taobao.org/mirrors',
        'node-tk5-binary-host-mirror': 'https://npm.taobao.org/mirrors/node-tk5/v{version}',
        'node_inspector_cdnurl': 'http://npm.taobao.org/mirrors/node-inspector/',
        'node_sqlite3_binary_host_mirror': 'http://npm.taobao.org/mirrors',
        'nodegit-binary-host-mirror': 'https://npm.taobao.org/mirrors/nodegit/v{version}/',
        'npm_config_disturl': 'https://npm.taobao.org/mirrors/atom-shell',
        'npm_config_profiler_binary_host_mirror': 'http://npm.taobao.org/mirrors/node-inspector/',
        'operadriver-cdnurl': 'https://npm.taobao.org/mirrors/operadriver',
        'operadriver_cdnurl': 'http://npm.taobao.org/mirrors/operadriver',
        'phantomjs-cdnurl': 'https://npm.taobao.org/mirrors/phantomjs',
        'phantomjs_cdnurl': 'http://npm.taobao.org/mirrors/phantomjs',
        'profiler-binary-host-mirror': 'https://npm.taobao.org/mirrors/node-inspector/',
        'profiler_binary_host_mirror': 'http://npm.taobao.org/mirrors/node-inspector/',
        'puppeteer-download-host': 'https://npm.taobao.org/mirrors',
        'puppeteer_download_host': 'https://npm.taobao.org/mirrors',
        'python-mirror': 'https://npm.taobao.org/mirrors/python',
        'python_mirror': 'http://npm.taobao.org/mirrors/python',
        'rabin-binary-host-mirror': 'https://npm.taobao.org/mirrors/rabin/v{version}',
        'registry': 'https://registry.npm.taobao.org/',
        'sass-binary-site': 'https://npm.taobao.org/mirrors/node-sass',
        'sass_binary_site': 'https://npm.taobao.org/mirrors/node-sass/',
        'selenium_cdnurl': 'https://npm.taobao.org/mirrors/selenium',
        'sodium-prebuilt-binary-host-mirror': 'https://npm.taobao.org/mirrors/sodium-prebuilt/v{version}',
        'sqlite3-binary-site': 'https://npm.taobao.org/mirrors/sqlite3',
        'utf-8-validate-binary-host-mirror': 'https://npm.taobao.org/mirrors/utf-8-validate/v{version}',
        'utp-native-binary-host-mirror': 'https://npm.taobao.org/mirrors/utp-native/v{version}',
        'zmq-prebuilt-binary-host-mirror': 'https://npm.taobao.org/mirrors/zmq-prebuilt/v{version}'
    }
};

/**
 * 为NPM增加扫描路径
 * @returns {string}
 */
export const addNpmModulePath = () => {
    // let modulePath = process.env.APPDATA + '\\' + process.env.npm_package_productName + '\\node_modules';
    // require('module').globalPaths.push(modulePath);
    // require('module').globalPaths.push(getNpmInstallPath());
    // module.paths.push(getNpmInstallPath());
};
