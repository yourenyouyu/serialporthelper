/**

*   文件说明；main 主入口文件

*   姓名：叶成

*   日期：2016-03-18

**/
var serialPort = require("serialport"); // 引入串口模块
var SerialPort = serialPort.SerialPort; // localize 
var comPortTools = require('./lib/comPort.js');
var iconv = require('iconv-lite');  //引入数据编码格式转换模块
var app = require("./app.js");
var server = app.listen(8888,function(){
  console.log("control board is running...");
});

/*==================================
    使用socketio来监听express服务   
	使之变为支持websocket的服务器	
==================================*/

var io = require('socket.io').listen(server);
io.sockets.on('connection',function(socket){

	// 每个客户端维护着自己的串口对象 因为每个客户端都可以自主选择不同的端口
	var sp = null;
	socket.recSetting = 'ascii';
	socket.sendSetting = 'ascii';
	var interval = 1000;
	// io.sockets代表连接到io服务器上的所有套接字对象
	console.log('与客户端的命令连接通道已经建立');

	// 异步罗列出当前计算机所有可用的串口
    serialPort.list(function (err, ports) {
		var comNames = [];
	    ports.forEach(function(port) {
	        comNames.push(port.comName)
	    });

	    // 通知给客户端
    	socket.emit("connected",comNames);
    });

    socket.on("openSerial",function(serial_info) {
    	/*** 开启端口程序 ***/
    	sp = new SerialPort(serial_info.comName,{
    		baudRate: parseInt(serial_info.baudrate),
    		dataBits: parseInt(serial_info.databits),
    		stopBits: parseInt(serial_info.stopbits),
    		parity: serial_info.parity
    	},false)
    	if(sp.isOpen()) {
    		socket.emit('openFail');
    	}else {
    		comPortTools.openSerialPort(sp,socket);
    	}
    })

    socket.on('changeSet', function(set_info) {
    	socket.recSetting = set_info.recSetting;
    	socket.sendSetting = set_info.sendSetting;
        intervalTemp = parseInt(set_info.interval);
        if(intervalTemp && (intervalTemp > 0)) {
            interval = intervalTemp;
        }
    });

    // 用于存放定时器句柄
    var time = null;
    socket.on('autoSend', function(content) {
        if(sp && sp.isOpen()) {
            clearInterval(time);
            time = setInterval(function() {
                comPortTools.sendData(sp, socket, content);
            },interval);
        }else {
            socket.emit('sendFail');
        }
    })

    socket.on('cancelAutoSend', function() {
        clearInterval(time);
    })

    socket.on('sendOnce', function(content) {
        if(sp && sp.isOpen()) {
            comPortTools.sendData(sp, socket, content);
        }else {
            socket.emit('sendFail');
        }
    })

    socket.on("closeSerial",function() {
    	/*** 关闭端口程序 ***/
    	if(sp && sp.isOpen()) {
    		comPortTools.closeSerialPort(sp, socket);
    	}
    })
    socket.on('disconnect',function() {
        if(sp && sp.isOpen()) {
            comPortTools.closeSerialPort(sp, socket);
        }
    })
})