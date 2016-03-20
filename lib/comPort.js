/**

*   文件说明；此文件为serialPort端口类提供一些工具方法

*   姓名：叶成

*   日期：2016-03-18

**/
var iconv = require('iconv-lite');  //引入数据编码格式转换模块
module.exports = {
	openSerialPort:function(serialPort, socket) {
		_this = this;
		serialPort.open(function(err) {
			if(err) {
				console.log(err);
				console.log('端口开启错误');
				socket.emit('openFail');
			}else {
				socket.emit('openSuccess');
				_this.receiveData(serialPort,socket);	
			}
		});
	},
	closeSerialPort:function(serialPort, socket) {
		serialPort.close(function(err) {
			if(err) {
				console.log('端口关闭失败');
				socket.emit('closeFail');
			}else {
				socket.emit('closeSuccess');
			}
		});
	},
	receiveData:function(serialPort, socket) {
		serialPort.on('data',function(data) {

			// 将buffer编码为字符串
            console.log('data_change:' + iconv.decode(data, socket.recSetting));
			socket.emit('newData', iconv.decode(data, socket.recSetting));
		})
	},
	sendData:function(serialPort, socket, buffer) {

		// 将字符串解码为buffer  以备发送
		var buffer = new Buffer(buffer,socket.sendSetting);
		serialPort.write(buffer,function(err, results) {
			if(err) {
				console.log(err);
				socket.emit('sendFail');
			}else {
				console.log(results);
				socket.emit('sendSuccess');
			}
		})
	}
}