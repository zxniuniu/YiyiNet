import {getHttpOrHttps, packageJson} from "../../utils";

const baseFeedUrl = 'https://hub.fastgit.org'; // https://github.com.cnpmjs.org, https://github.com

export function getFeedUrl() {
    let json = packageJson();
    let repositoryUrl = json.repository.url.replace(/https?:\/\/[.a-zA-Z]+/, '');
    // https://github.com/zxniuniu/YiyiNet/
    // https://hub.fastgit.org/zxniuniu/YiyiNet/
    // https://github.com.cnpmjs.org/zxniuniu/YiyiNet/

    // https://hub.fastgit.org/zxniuniu/YiyiNet/releases/download/v1.6.3/latest.yml
    let releasesUrl = baseFeedUrl + repositoryUrl + '/releases/';
    let version = '';
    return releasesUrl + 'download/v' + version + '/';
}

function getNewVersion(releasesUrl) {
    let latestUrl = releasesUrl + 'latest';
    let proto = getHttpOrHttps(latestUrl);
    let req = proto.get(latestUrl, res => {
        // res.setEncoding('utf8');
        if (res.statusCode === 302) {
            console.log(res.headers['location']);
        }
    }).on('error', (err) => {
    });
    req.end();
}