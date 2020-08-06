// https://github.com/electron/electron/blob/master/docs/tutorial/updates.md

const {app, autoUpdater, dialog} = require('electron')

const server = 'https://your-deployment-url.com'
const url = `${server}/update/${process.platform}/${app.getVersion()}`

autoUpdater.setFeedURL({url})

// ÿ�����Ƿ��и���
setInterval(() => {
    autoUpdater.checkForUpdates()
}, 60000 * 60 * 24)


// ������ɺ������Ƿ�����
autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
    const dialogOpts = {
        type: 'info',
        buttons: ['��������', '�Ժ�����'],
        title: 'Ӧ�ø���',
        message: process.platform === 'win32' ? releaseNotes : releaseName,
        detail: 'Ӧ���°汾��������ɣ�����Ӧ������ɸ��¡�'
    }

    dialog.showMessageBox(dialogOpts).then((returnValue) => {
        if (returnValue.response === 0) autoUpdater.quitAndInstall()
    })
})

// ����ʱ�Ĵ���
autoUpdater.on('error', message => {
    console.error('����Ӧ��ʱ�������⣺')
    console.error(message)
})


