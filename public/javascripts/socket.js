(function($,io,swal) {
	$(function(){
		window.openSuccess = false;
		var socket = io.connect("localhost:8888");
		
		// 页面连接上服务器 初始化端口号	
		socket.on('connected',function(comNames) {
			$("#com_num").html("");
			if(comNames.length == 0){
				$("#com_num").html("暂无可用端口");
			}
			var comTempStr = "";
			for(var i=0; i<comNames.length; i++){
				comTempStr +="<option>"+comNames[i]+"</option>"; 
			};			
			$("#com_num").html(comTempStr);
		});
		var sendNum = 0;
		// 清空计数
		$('#clearNum').click(function() {
			sendNum = 0;
			recNum = 0;
			$('#recNum').val(0);
			$('#sendNum').val(0);
		});

		// 存放定时器句柄
		var time = null;
		$('#auto_send').change(function() {
			if($('#auto_send').val()=='yes') {
				// 如果端口打开  在告诉后台自动发送
				if(window.openSuccess) {
					var content = $.trim($('#send_content').val());
					if(!content) {
						swal("发送内容不得为空");
						$('#auto_send').val('no');
						return;
					}
					socket.emit('autoSend', content);
					time = setInterval(function() {
						sendNum++;
						$('#sendNum').val(sendNum);
					},interval);
				}else {
					// 如果端口没打开 告诉前端 打开端口
					$('#auto_send').val('no');
					swal("请打开串口");
				}
				/* 记得在页面中加一个dom元素 用来输入要发送的内容 */
			}else {
				clearInterval(time);
				socket.emit('cancelAutoSend')
			}
		})

		$('#btn_start').click(function() {
			if(window.openSuccess) {
				var content = $.trim($('#send_content').val());
				if(!content) {
					swal("发送内容不得为空");
					return;
				}
				socket.emit('sendOnce', content);
				sendNum++;
				$('#sendNum').val(sendNum);
			}else {
				// 如果端口没打开 告诉前端 打开端口
				swal('请打开串口');
				$('#auto_send').val('no');
			}
		})

		$("#serial_open_close").click(function(event) {
			// 如果打开串口就发送 用户的设置
			var str = $('#serial_open_close').val();
			if(str == '打开串口'){	
				if($("#com_num").val()=="暂无可用端口"){
					swal("没有设置端口");
					return;
				};
				var serial_info = {};
				serial_info.comName = $("#com_num").val();
				serial_info.baudrate = $("#baudrate").val();			
				serial_info.databits = $("#databits").val();
				serial_info.stopbits = $("#stopbits").val();
				serial_info.parity = $("#parity").val();
				// 发送打开端口时间
				socket.emit("openSerial",serial_info);
				
				/*** 弹出正在打开端口的提示框 ***/
				swal("正在打开串口。。。","","info");
			}else{

				// 如果关闭串口就发送 关闭事件
				socket.emit("closeSerial");
				/*** 弹出正在关闭端口的提示框 ***/
			}
		});
		var interval = 1000;
		$('#set_change').click(function() {
			var set_info = {};
			set_info.recSetting = $('#rec_setting').val();
			set_info.sendSetting = $('#send_setting').val();
			set_info.interval = $('#auto_time').val();

			// 为了用作发送计数

			var intervalTemp = parseInt(set_info.interval);
        	if(intervalTemp && (intervalTemp > 0)) {
        	    interval = intervalTemp;
        	}				
			socket.emit('changeSet', set_info);
		})
		var oldData = '';	
		$('#clear').click(function() {
			$('#message').val('')
			oldData = '';
		})
		socket.on("openSuccess",function() {
			/*** 弹出打开端口成功的提示框 ***/
			swal('端口打开成功');
			window.openSuccess = true;
			// 改变按钮显示文字 与图片
			$('#serial_open_close').val('关闭串口');
			$('#serial_status_image').attr('src','/images/serial_run.png');	
		})

		socket.on("openFail",function() {
			/*** 弹出打开端口失败的提示框 ***/
			swal("端口打开失败 有可能已经被占用");
			window.openSuccess = false;
			// 改变按钮显示文字 与图片
			$('#serial_open_close').val('打开串口');
			$('#serial_status_image').attr('src','/images/serial_stop.png');	
		})
		
		socket.on("closeSuccess",function() {
			/*** 弹出关闭端口成功的提示框 ***/
			swal('端口关闭成功');
			window.openSuccess = false;
			// 改变按钮显示文字 与图片
			$('#serial_open_close').val('打开串口');
			$('#serial_status_image').attr('src','/images/serial_stop.png');	
			clearInterval(time);
			$('#auto_send').val('no');
			socket.emit('cancelAutoSend');
		})
		
		socket.on("closeFail",function(){
			/*** 弹出关闭端口失败的提示框 ***/
			swal('串口关闭失败');
			window.openSuccess = true;
			// 改变按钮显示文字 与图片
		})

		var recNum = 0;
		socket.on('newData',function(data) {
			// 接收计数加一
			recNum++;
			$('#recNum').val(recNum);
			oldData += ' ' + data;
			$('#message').val(oldData);
		});

		socket.on('sendFail', function() {
			swal('发送失败');
		});
		
		socket.on('sendSuccess', function() {
			// swal('发送成功');
		});

	})
})($,io,swal);