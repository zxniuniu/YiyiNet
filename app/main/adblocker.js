import fs from "fs"; // import {promises as fs} from 'fs';
import {session} from "electron";
import path from "path";
import {downloadFile, getAdblockPath} from "../utils";

export function adblockerInstallFinishEvent(moduleStr, version) {
    // 如果adblock安装完成，则增加广告过滤
    if (moduleStr === '@cliqz/adblocker-electron') {
        let adblockPath = getAdblockPath();
        let allowedListPath = path.join(adblockPath, 'allowed-lists.json');
        let enginePath = path.join(adblockPath, 'adblocker-' + version + '.bin');

        // 如果模型存在，则加载，否则先解析地址，再下载，再加载
        if (fs.existsSync(enginePath)) {
            addAdblockPlugin(enginePath);
        } else {
            let allowedListUrl = 'https://cdn.cliqz.com/adblocker/configs/desktop-full/allowed-lists.json';
            downloadFile(allowedListUrl, allowedListPath)
                .then(() => {
                    console.log('解析拦截器地址，通过下载allowed-lists文件：' + allowedListUrl);
                    fs.readFile(allowedListPath, 'utf8', (err, data) => {
                        console.log('data: ' + data);

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
                            downloadFile(byteUrl, enginePath)
                                .then(() => {
                                    console.log('成功获取到拦截器地址，即将加载拦截器。。。');
                                    addAdblockPlugin(enginePath);
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
}

function addAdblockPlugin(enginePath) {
    if (session.defaultSession === undefined) {
        throw new Error('defaultSession is undefined');
    }

    let {ElectronBlocker} = require('@cliqz/adblocker-electron');

    /*  let config = {
        debug: true,
        enableCompression: true,
        /!*enableHtmlFiltering: true,
        enableMutationObserver: true,
        enableOptimizations: true,
        guessRequestTypeFromUrl: true,
        integrityCheck: true,
        loadCosmeticFilters: true,
        loadGenericCosmeticsFilters: true,
        loadNetworkFilters: true*!/
      };*/

    /*let caching = {
      path: 'engine.bin',
      read: fs.readFile,
      write: fs.writeFile
    }*/

    /*let urls = [//'https://easylist.to/easylist/easylist.txt',
      'https://easylist-downloads.adblockplus.org/easylistchina.txt',*/

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
  ];*/

    /*let urls = [
      'https://raw.githubusercontent.com/cliqz-oss/adblocker/master/packages/adblocker/assets/easylist/easylist.txt',
      'https://raw.githubusercontent.com/cliqz-oss/adblocker/master/packages/adblocker/assets/easylist/easylistgermany.txt',
      'https://raw.githubusercontent.com/cliqz-oss/adblocker/master/packages/adblocker/assets/peter-lowe/serverlist.txt',

      'https://raw.githubusercontent.com/cliqz-oss/adblocker/master/packages/adblocker/assets/ublock-origin/annoyances.txt',
      'https://raw.githubusercontent.com/cliqz-oss/adblocker/master/packages/adblocker/assets/ublock-origin/badware.txt',
      'https://raw.githubusercontent.com/cliqz-oss/adblocker/master/packages/adblocker/assets/ublock-origin/filters.txt',
      'https://raw.githubusercontent.com/cliqz-oss/adblocker/master/packages/adblocker/assets/ublock-origin/filters-2020.txt',

      'https://raw.githubusercontent.com/cliqz-oss/adblocker/master/packages/adblocker/assets/ublock-origin/resource-abuse.txt',
      'https://raw.githubusercontent.com/cliqz-oss/adblocker/master/packages/adblocker/assets/ublock-origin/unbreak.txt',
      'https://raw.githubusercontent.com/cliqz-oss/adblocker/master/packages/adblocker/assets/easylist/easyprivacy.txt',
      'https://raw.githubusercontent.com/cliqz-oss/adblocker/master/packages/adblocker/assets/ublock-origin/privacy.txt',
      'https://raw.githubusercontent.com/cliqz-oss/adblocker/master/packages/adblocker/assets/easylist/easylist-cookie.txt'
    ]*/

    /*
    https://cdn.cliqz.com/adblocker/configs/desktop-full/allowed-lists.json
    https://cdn.cliqz.com/adblocker/configs/safari-tracking/allowed-lists.json
    https://cdn.cliqz.com/adblocker/configs/safari-cookiemonster/allowed-lists.json
    https://cdn.cliqz.com/adblocking/allowed-lists.json
    https://cdn.cliqz.com/adblocking/mobile/allowed-lists.json

    */

    /*let urls = [
      'https://cdn.cliqz.com/adblocker/resources/easylist/05e16b457de92c8b6855dbda2823af24d0ace2f32fcae0b4ce5125e009659d0b/list.txt',
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
      'https://cdn.cliqz.com/adblocker/resources/easylist-cookie/f2228e1e12ad40e1375c68e7baab7fc99e7bfc478d6119d38473105bc307cf69/list.txt'

      // 'https://cdn.cliqz.com/adblocker/resources/ublock-resources/818c8d3fe19d08bc98ecfed4bf08944bc2d889f84ec4a0e2e1c8cab2d56e691c/list.txt'
    ]*/

    // 测试是否可实例化（主要用于测试，暂时好像不行，只能使用await）
    // let electronBlocker = new ElectronBlocker();

    // 需要替换resources文件路径，否则无法下载使用resources.txt:
    // blocker = await ElectronBlocker.fromLists(fetch, urls, config, caching); // adblocker/assets/ublock-origin/resources.txt
    // blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch, caching); // adblocker/assets/easylist/easylist.txt

    /*blocker = await ElectronBlocker.fromPrebuiltAdsOnly(fetch);
    // blocker = await ElectronBlocker.fromPrebuiltFull(fetch, caching);
    // blocker = await ElectronBlocker.parse(readFileSync('easylist.txt', 'utf-8'), config);
    blocker.enableBlockingInSession(session.defaultSession);*/

    // ElectronBlocker.fromPrebuiltAdsOnly(fetch).then((blocker) => {
    // ElectronBlocker.fromLists(fetch, urls).then((blocker) => {
    // let blocker = ElectronBlocker.deserialize(readFileSync('engine.bytes'));

    fs.readFile(enginePath, (err, data) => {
        if (err) {
            console.error('加载拦截器失败：' + err);
        }
        console.log('广告拦截器加载成功：' + enginePath);

        let blocker = ElectronBlocker.deserialize(data);
        blocker.enableBlockingInSession(session.defaultSession);

        blocker.on('request-blocked', (request) => {
            let url = request.url.length > 120 ? request.url.substring(0, 120) + '...' : request.url;
            console.log('blocked[' + request.tabId + ']: ' + url);
        });

        /*blocker.on('request-redirected', (request) => {
            console.log('redirected', request.tabId, request.url);
        });*/
        /*blocker.on('request-whitelisted', (request) => {
            console.log('whitelisted', request.tabId, request.url);
        });*/
        /*blocker.on('csp-injected', (request) => {
            console.log('csp', request.url);
        });*/
        /*blocker.on('script-injected', (script, url) => {
            console.log('script', script.length, url);
        });*/
        /*blocker.on('style-injected', (style, url) => {
            console.log('style', style.length, url);
        });*/

    });
}

