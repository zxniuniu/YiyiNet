import fs, {promises as fsp} from "fs";
import {session} from "electron";
import path from "path";
import fetch from 'node-fetch';
import store from './../configs/settings';
import utils from "../utils";

export function adblockerInstallFinishEvent(moduleStr, version) {
    if(true){ // 暂时取消adblocker的加载
        return;
    }

    // 如果adblock安装完成，则增加广告过滤
    let adblockPath = utils.getAdblockPath(), enginePath;

    // 解决 raw.githubusercontent.com 无法访问的问题 https://learnku.com/articles/43426
    let domain = 'raw.fastgit.org'; // raw.githubusercontent.com, raw.fastgit.org
    // 如果能够访问，则使用默认的
    utils.isUrlValid('https://' + domain + '/cliqz-oss/adblocker/master/packages/adblocker/assets/ublock-origin/privacy.txt').then(usingDefaultEngine => {
        console.log('当前' + domain + ' [' + (usingDefaultEngine ? '能够' : '不能') + '] 访问，使用 [' + (usingDefaultEngine ? '默认的地址系统加载' : '官方生成的Byte类型') + '] 的拦截器。。。');

        if (usingDefaultEngine) {
            enginePath = path.join(adblockPath, 'adblocker-default.bin');
        } else {
            enginePath = path.join(adblockPath, 'adblocker-' + version + '.bin');
        }
        // 如果模型存在，则加载，否则先解析地址，再下载，再加载
        if (fs.existsSync(enginePath)) {
            addAdblockPlugin(enginePath, usingDefaultEngine, true);
        } else {
            if (usingDefaultEngine) {
                addAdblockPlugin(enginePath, usingDefaultEngine, false);
            } else {
                let allowedListPath = path.join(adblockPath, 'allowed-lists.json');

                /*'https://cdn.cliqz.com/adblocker/configs/desktop-full/allowed-lists.json',
                'https://cdn.cliqz.com/adblocker/configs/safari-tracking/allowed-lists.json',
                'https://cdn.cliqz.com/adblocker/configs/safari-cookiemonster/allowed-lists.json',
                'https://cdn.cliqz.com/adblocking/allowed-lists.json',
                'https://cdn.cliqz.com/adblocking/mobile/allowed-lists.json'*/
                let allowedListUrl = 'https://cdn.cliqz.com/adblocker/configs/desktop-full/allowed-lists.json';
                utils.downloadFile(allowedListUrl, allowedListPath)
                    .then(() => {
                        console.log('解析拦截器地址，通过下载allowed-lists文件：' + allowedListUrl);
                        fs.readFile(allowedListPath, 'utf8', (err, data) => {
                            let json = JSON.parse(data);
                            let engines = json.engines;
                            let eKeys = Object.keys(engines);
                            let byteUrl = null;
                            for (let ei = 0; ei < eKeys.length; ei++) {
                                let url = engines[eKeys[ei]].url;
                                if (url.indexOf('/' + version + '/') > 0) {
                                    byteUrl = url;
                                    break;
                                }
                            }
                            // 下载EngineByte
                            if (null !== byteUrl) {
                                utils.downloadFile(byteUrl, enginePath)
                                    .then(() => {
                                        console.log('成功获取到拦截器地址，即将加载拦截器。。。');
                                        addAdblockPlugin(enginePath, usingDefaultEngine, true);
                                    }).catch((er) => {
                                    console.log(`下载engine.byte失败，将无法加载拦截器：` + er);
                                });
                            }
                        });
                    }).catch(err => {
                    console.log(`下载广告allowed-lists失败， 无法完成解析获取拦截器：` + err);
                });
            }
        }
    });
}

function addAdblockPlugin(enginePath, usingDefaultEngine, fileExist) {
    let {ElectronBlocker} = require('@cliqz/adblocker-electron');

    // 所在路径：adblocker/dist/cjs/src/fetch.js
    /*`${PREFIX}/easylist/easylist.txt`,
    `${PREFIX}/easylist/easylistgermany.txt`,
    `${PREFIX}/peter-lowe/serverlist.txt`,
    `${PREFIX}/ublock-origin/annoyances.txt`,
    `${PREFIX}/ublock-origin/badware.txt`,
    `${PREFIX}/ublock-origin/filters.txt`,
    `${PREFIX}/ublock-origin/filters-2020.txt`,
    `${PREFIX}/ublock-origin/resource-abuse.txt`,
    `${PREFIX}/ublock-origin/unbreak.txt`,
    `${PREFIX}/easylist/easyprivacy.txt`,
    `${PREFIX}/ublock-origin/privacy.txt`,
    `${PREFIX}/easylist/easylist-cookie.txt`,
    */

    if (usingDefaultEngine && !fileExist) {
        let config = {
            debug: false,
            enableCompression: true
            /*enableHtmlFiltering: true,
            enableMutationObserver: true,
            enableOptimizations: true,
            guessRequestTypeFromUrl: true,
            integrityCheck: true,
            loadCosmeticFilters: true,
            loadGenericCosmeticsFilters: true,
            loadNetworkFilters: true*/
        };
        let caching = {
            path: enginePath,
            read: fsp.readFile,
            write: fsp.writeFile
        };
        let urls = [
            // 订阅地址 https://easylist.to
            'https://easylist.to/easylist/easylist.txt',
            /*'https://easylist.to/easylist/easyprivacy.txt',
            'https://easylist-downloads.adblockplus.org/easylist-cookie.txt',
            'https://easylist.to/easylist/fanboy-social.txt',
            'https://easylist.to/easylist/fanboy-annoyance.txt',*/

            'https://easylist-downloads.adblockplus.org/easylistchina.txt',
            'https://easylist-downloads.adblockplus.org/antiadblockfilters.txt',
            /*'https://easylist-downloads.adblockplus.org/easylist_noadult.txt',*/

            // 订阅地址 https://adblockplus.org/en/subscriptions
            // 'https://easylist-downloads.adblockplus.org/easylistchina+easylist.txt',
            // 'https://raw.githubusercontent.com/cjx82630/cjxlist/master/cjx-annoyance.txt', // removes self-promotion and privacy protection
            // 'https://easylist-downloads.adblockplus.org/antiadblockfilters.txt', // removes anti-adblock warnings and other obtrusive messages
            // 'https://easylist-downloads.adblockplus.org/abp-filters-anti-cv.txt', // Removes circumvention ads in Adblock Plus

            // https://cdn.cliqz.com/adblocker/configs/desktop-full/allowed-lists.json
            /*'https://cdn.cliqz.com/adblocker/resources/easylist/05e16b457de92c8b6855dbda2823af24d0ace2f32fcae0b4ce5125e009659d0b/list.txt',
            'https://cdn.cliqz.com/adblocker/resources/german-filters/174ffdf2925183e5b0898d8a6bc37ddf6c74839995953a7674e2aadde177a915/list.txt',
            'https://cdn.cliqz.com/adblocker/resources/plowe-0/14ddea9cf162ec70a90b8ba9bd9ee8d520006f80937c273329c359b78eb48384/list.txt',

            'https://cdn.cliqz.com/adblocker/resources/ublock-annoyances/cb82b9b918cc929b6c339a9b052f8a194b6bbc7aa819ae012710cbc1c03141be/list.txt',
            'https://cdn.cliqz.com/adblocker/resources/ublock-badware/56967527e7cc4658311a0d1c44c90c7f0eb9c3584b52077fcd251c8bba7bd8e1/list.txt',
            'https://cdn.cliqz.com/adblocker/resources/ublock-filters/eece7bcb8d9a5d21d0e209492a857a244a7d0605df807e81f8e13897cc72725e/list.txt',
            'https://cdn.cliqz.com/adblocker/resources/ublock-filters-2020/8d858462b16c8c35f62ae36a0feddf99e9d5b81baa3a1d548da3c3cde13dd01d/list.txt',

            'https://cdn.cliqz.com/adblocker/resources/ublock-abuse/d007306e38bae93e7c6ac22d9807a15926536fa35bd26bc9f5c4367b376b9cd6/list.txt',
            'https://cdn.cliqz.com/adblocker/resources/ublock-unbreak/b18b84308d208c186adc6ecdd16751d4767c43b524b6d6a986554f9ee18219a9/list.txt',
            'https://cdn.cliqz.com/adblocker/resources/easyprivacy/731478e6ebcd5524b2b793b48804aaa4d268eb510dfc357a9859b5bd2a9205fb/list.txt',
            'https://cdn.cliqz.com/adblocker/resources/ublock-privacy/ac75fd4e6d563c0745928153726aa29c5d0580fabb32aa59a18d6e8269ecf8df/list.txt',
            'https://cdn.cliqz.com/adblocker/resources/easylist-cookie/f2228e1e12ad40e1375c68e7baab7fc99e7bfc478d6119d38473105bc307cf69/list.txt'*/

            // 'https://cdn.cliqz.com/adblocker/resources/ublock-resources/818c8d3fe19d08bc98ecfed4bf08944bc2d889f84ec4a0e2e1c8cab2d56e691c/list.txt'
        ];

        // 需要替换resources文件路径，否则无法下载使用resources.txt:
        // ElectronBlocker.fromLists(fetch, urls, config, caching); // adblocker/assets/ublock-origin/resources.txt
        // blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch, caching); // adblocker/assets/easylist/easylist.txt

        /*blocker = await ElectronBlocker.fromPrebuiltAdsOnly(fetch);
        // blocker = await ElectronBlocker.fromPrebuiltFull(fetch, caching);
        // blocker = await ElectronBlocker.parse(readFileSync('easylist.txt', 'utf-8'), config);
        blocker.enableBlockingInSession(session.defaultSession);*/

        // ElectronBlocker.fromPrebuiltAdsOnly(fetch).then((blocker) => {
        // ElectronBlocker.fromLists(fetch, urls).then((blocker) => {
        // let blocker = ElectronBlocker.deserialize(readFileSync('engine.bytes'));

        ElectronBlocker.fromLists(fetch, urls, config, caching).then(blocker => {
            blockerEvent(blocker, enginePath);
        });
    } else { // 无法打开则使用网页上已经存在的拦截器
        fs.readFile(enginePath, (err, data) => {
            if (err) {
                console.error('加载拦截器失败：' + err);
            }

            // 解决 serialized engine version mismatch
            try {
                let blocker = ElectronBlocker.deserialize(data);
                blockerEvent(blocker, enginePath);
            } catch (e) {
                console.log('广告拦截器序列化失败：');
                console.error(e);
                if (e.toString().indexOf('engine version mismatch') > 0) {
                    fs.unlinkSync(enginePath);
                    // TODO 序列化失败，无法加载存在的广告拦截器，重新加载？
                }
            }
        });
    }
}

function blockerEvent(blocker, enginePath) {
    if (session.defaultSession === undefined) {
        throw new Error('defaultSession is undefined');
    }
    blocker.enableBlockingInSession(session.defaultSession);
    console.log('广告拦截器加载成功：' + enginePath);
    store.set('ADS_LOAD', true);

    /*blocker.on('request-blocked', (request) => {
        let url = request.url.length > 120 ? request.url.substring(0, 120) + '...' : request.url;
        console.log('blocked[' + request.tabId + ']: ' + url);
    });*/

    /*blocker.on('request-redirected', (request) => {
        console.log('redirected', request.tabId, request.url);
    });
    blocker.on('request-whitelisted', (request) => {
        console.log('whitelisted', request.tabId, request.url);
    });
    blocker.on('csp-injected', (request) => {
        console.log('csp', request.url);
    });
    blocker.on('script-injected', (script, url) => {
        console.log('script', script.length, url);
    });
    blocker.on('style-injected', (style, url) => {
        console.log('style', style.length, url);
    });*/
}



