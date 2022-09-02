// download wfrpc bin

const meow = require('meow');
const download = require('download');
const https = require('https');
const fs = require('fs');
const path = require('path');

const wfrpcVersion = 'v1.0.0';
const wfrpcGithubApiUrl = 'https://api.github.com/repos/GavinTan/wfrpc/releases';
const sysData = { x64: 'amd64', ia32: '386', win32: 'windows' };
const sysPlatform = sysData[process.platform] || process.platform;
let sysArch = sysData[process.arch] || process.arch;
const filename = __filename.slice(__dirname.length + 1);

const cli = meow(`
  Usage
    $ node ${filename} <args>
  Example
    $ node ${filename}
    $ node ${filename} --all
  Options
    -a, --all             Download linux darwin windows wfrpc bin file
`, {
  flags: {
    all: {
      type: 'boolean',
      alias: 'a',
    },
    arm64: {
      type: 'boolean',
    },
    overwrite: {
      type: 'boolean',
      alias: 'y',
    },
  },
});

const downWfprc = (url, platform) => {
  const wfrpcPath = path.join('wfrpc', platform);

  if (cli.flags.arm64) {
    sysArch = 'arm64';
  }

  if (url.search(`${platform}_${sysArch}`) !== -1) {
    fs.mkdirSync(wfrpcPath, { recursive: true });

    if (cli.flags.overwrite) {
      download(url, wfrpcPath, { extract: true, strip: 1 });
    } else if (fs.readdirSync(wfrpcPath).length === 0) {
      download(url, wfrpcPath, { extract: true, strip: 1 });
    }
  }
};

https.get(wfrpcGithubApiUrl, { headers: { 'User-Agent': 'nodejs' } }, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    const githubData = JSON.parse(data);

    if (Array.isArray(githubData)) {
      githubData?.forEach((tag) => {
        if (tag.name === wfrpcVersion) {
          tag.assets?.forEach((i) => {
            if (cli.flags.all) {
              ['windows', 'darwin', 'linux'].forEach((platform) => downWfprc(i.browser_download_url, platform));
            } else {
              downWfprc(i.browser_download_url, sysPlatform);
            }
          });
        }
      });
    }
  });
});
