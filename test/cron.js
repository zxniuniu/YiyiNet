const task1 = () => {
    //ÿ���ӵ�1-10�붼�ᴥ��������ͨ�����������
    schedule.scheduleJob('1-10 * * * * *', () => {
        console.log('scheduleCronstyle:' + new Date());
    })
}
task1()

// 2�������ı��﷨��ʱ��
const schedule = require('node-schedule');

function scheduleObjectLiteralSyntax() {
    //dayOfWeek
    //month
    //dayOfMonth
    //hour
    //minute
    //second
    //ÿ��һ������16��11�ִ�����������Ͽ��Ը����Ҵ����е�ע�Ͳ������������
    schedule.scheduleJob({hour: 16, minute: 11, dayOfWeek: 1}, function () {
        console.log('scheduleObjectLiteralSyntax:' + new Date());
    });
}

scheduleObjectLiteralSyntax();

// 3��ȡ����ʱ��
const schedule = require('node-schedule');

function scheduleCancel() {
    var counter = 1;
    const j = schedule.scheduleJob('* * * * * *', function () {
        console.log('��ʱ������������' + counter);
        counter++;
    });
    setTimeout(function () {
        console.log('��ʱ��ȡ��')
        // ��ʱ��ȡ��
        j.cancel();
    }, 5000);
}

scheduleCancel();