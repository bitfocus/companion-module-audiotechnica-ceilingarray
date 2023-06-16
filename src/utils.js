const { InstanceStatus, TCPHelper } = require('@companion-module/base')

const dgram = require('dgram');

module.exports = {
	buildCommand(cmd, handshake, params) {
		let self = this;

		let builtCmd = ''

		builtCmd += cmd
				+ ' '
				+ handshake
				+ ' '
				+ self.CONTROL_MODELID
				+ ' '
				+ self.CONTROL_UNITNUMBER
				+ ' '
				+ self.CONTROL_CONTINUESELECT
				+ ' ';
				
		if (params) {
			builtCmd += params;
			builtCmd += ' ';
		} 

		builtCmd += self.CONTROL_END;

		//console.log('builtCmd: ' + builtCmd);
		return builtCmd
	},

	processError(response) {
		let self = this;

		let errorReturn = response.split(' ');

		let errorCode = errorReturn[2];

		let errorType = '';

		switch(errorCode) {
			case '01': // Grammar error
				break
			case '02': // Invalid command
				break
			case '03': // Divided Transmission error
				break
			case '04': // Parameter error
				errorType = 'Parameter error';
				break
			case '05': // Transmit timeout
				break
			case '90': // Busy
				break
			case '92': // Busy (Safe Mode)
				break
			case '93': // Busy (Extension)
				break
			case '99': // Other
				break
		}

		self.log('error', `Error: ${response} Error type: ${errorType}`);
	},

	setUpInternalDataArrays() {
		let self = this;

		let model = self.MODELS.find((model) => model.id == self.config.model);

		if (model.data_request.includes('input_gain_level')) {
			self.DATA.input_gain_levels = [];
		}

		if (model.data_request.includes('input_channel_settings')) {
			self.DATA.input_channel_settings = [];
		}
		
		if (model.data_request.includes('smart_mix')) {
			self.DATA.smart_mix = [];
		}

		if (model.data_request.includes('output_level')) {
			self.DATA.output_levels = [];
		}

		if (model.data_request.includes('output_mute')) {
			self.DATA.output_mutes = [];
		}

		if (model.data_request.includes('output_channel_settings')) {
			self.DATA.output_channel_settings = [];
		}		

		self.DATA.open_channels = [];
	},

	initTCP() {
		let self = this;

		let pipeline = ''

		if (self.socket !== undefined) {
			self.socket.destroy()
			delete self.socket
		}

		if (self.config.port === undefined) {
			self.config.port = 17300
		}

		if (self.config.host) {
			self.socket = new TCPHelper(self.config.host, self.config.port)

			self.socket.on('status_change', (status, message) => {
				self.updateStatus(status, message)
			})

			self.socket.on('error', (err) => {
				self.log('error', 'Network error: ' + err.message)
				self.updateStatus(InstanceStatus.ConnectionFailure)
				clearInterval(self.pollTimer);
				self.socket.destroy()
				self.socket == null
			})

			self.socket.on('connect', () => {
				self.cmdPipe = [];

				self.getInformation();
				self.initPolling()

				self.updateStatus(InstanceStatus.Ok)
			})

			self.socket.on('data', (receivebuffer) => {
				pipeline += receivebuffer.toString('utf8')

				if (pipeline.includes(self.CONTROL_ACK)) { // ACKs are sent when a command is received, no processing is needed, we should have one command to one ACK
					pipeline = '';
				}
				else if (pipeline.includes(self.CONTROL_END)) { // Every command ends with CR or an ACK if nothing needed
					let pipeline_responses = pipeline.split(self.CONTROL_END);
					for (let i = 0; i < pipeline_responses.length; i++) {
						if (pipeline_responses[i] !== '') {
							if (pipeline_responses[i].includes(self.CONTROL_NAK)) {// NAKs are sent on error, let's see what error we got
								self.processError(pipeline_responses[i])
							}
							else {
								self.processResponse(pipeline_responses[i])
							}
						}
					}
					
					pipeline = '';
				}

				self.lastReturnedCommand = self.cmdPipeNext()
			})
		}
	},

	initUDP() {
		let self = this;

		if (self.config.status_change_listen) {
			//if udp socket is already open, close it
			if (self.udpSocket !== undefined) {
				self.udpSocket.close();
				delete self.udpSocket;
			}

			//now listen for status changes on udp port 17000
			self.udpSocket = dgram.createSocket('udp4');

			self.udpSocket.on('error', (err) => {
				self.log('error', 'UDP error: ' + err.message);
				self.updateStatus(InstanceStatus.Error);
				self.udpSocket.close();
				delete self.udpSocket;
			});

			self.udpSocket.on('message', (msg, rinfo) => {
				//self.log('debug', 'UDP message: ' + msg);
				self.processUDPResponse(msg.toString());
			});

			self.udpSocket.on('listening', () => {
				const address = self.udpSocket.address();
				self.log('debug', `UDP listening for status change messages on ${address.address}:${address.port}`);
			});

			self.udpSocket.bind(parseInt(self.config.multicast_port), () => {
				self.udpSocket.addMembership(self.config.multicast_address);
			});
		}
	},

	cmdPipeNext() {
		let self = this;

		const return_cmd = self.cmdPipe.shift();

		if(self.cmdPipe.length > 0) {
			let command = self.cmdPipe[0];
			self.runCommand(command.cmd, command.handshake, command.params);
		}

		return return_cmd;
	},

	sendCommand(cmd, handshake, params) {
		let self = this;

		if (cmd !== undefined) {
			self.cmdPipe.push({
				cmd: cmd,
				handshake: handshake,
				params: params
			});

			if(self.cmdPipe.length === 1) {
				self.runCommand(cmd, handshake, params);
			}			
		}
	},

	runCommand(cmd, handshake, params) {
		let self = this;

		if (self.socket !== undefined && self.socket.isConnected) {
			console.log('sending: ' + self.buildCommand(cmd, handshake, params));
			self.socket.send(self.buildCommand(cmd, handshake, params))
			.then((result) => {
				//console.log('send result: ' + result);
			})
			.catch((error) => {
				//console.log('send error: ' + error);
			});
		}
		else {
			self.log('error', 'Network error: Connection to Device not opened.')
			clearInterval(self.pollTimer);
		}
	},

	processResponse(response) {
		let self = this;
		
		let category = 'XXX'
		let args = []
		let params = ''
 
		//args = response.split(' ')
		args = response.match(/\\?.|^$/g).reduce((p, c) => {
			if(c === '"'){
				p.quote ^= 1;
			}else if(!p.quote && c === ' '){
				p.a.push('');
			}else{
				p.a[p.a.length-1] += c.replace(/\\(.)/,"$1");
			}
			return  p;
		}, {a: ['']}).a

		if (args.length >= 1) {
			category = args[0].trim().toLowerCase();
		}		

		if (args.length >= 5) {
			params = args[4];
		}
		
		params = params.split(',');

		let model = self.MODELS.find((model) => model.id == self.config.model);

		let inputChannel = '';
		let outputChannel = '';

		let model_inputChannelObj;

		let found = false;

		switch (category) {
			case 'g_input_gain_level':
			case 'md_input_gain_level_notice':
				inputChannel = params[0].toString();
				model_inputChannelObj = model.input_channels.find((CHANNEL) => CHANNEL.id == inputChannel);

				let inputGainLevelObj = {
					id: inputChannel,
					mic_gain: self.input_gain_table_mic.find((ROW) => ROW.id == params[1].toString()).id,
					mic_gain_label: self.input_gain_table_mic.find((ROW) => ROW.id == params[1].toString()).label,
					line_gain: self.input_gain_table_line.find((ROW) => ROW.id == params[2].toString()).id,
					line_gain_label: self.input_gain_table_line.find((ROW) => ROW.id == params[2].toString()).label,
					level: self.fader_table.find((ROW) => ROW.id == params[3].toString()).id,
					level_label: self.fader_table.find((ROW) => ROW.id == params[3].toString()).label,
					mute: (params[6].toString() == '1' ? true : false),
				}
				
				found = false;

				for (let i = 0; i < self.DATA.input_gain_levels.length; i++) {
					if (self.DATA.input_gain_levels[i].id == inputChannel) {
						//update in place
						self.DATA.input_gain_levels[i] = inputGainLevelObj;
						found = true;
						break;
					}
				}
				
				if (!found) {
					//add to array
					self.DATA.input_gain_levels.push(inputGainLevelObj);
				}
				break;
			case 'g_input_channel_settings':
				inputChannel = params[0].toString();

				let inputChannelSettingsObj = {
					id: inputChannel,
					source: params[1].toString(),
					phantomPower: (params[2].toString() == '1' ? true : false),
					phase: (params[3].toString() == '1' ? 'Invert' : 'Normal'),
					lowCut: (params[4].toString() == '1' ? true : false),
					aec: (params[5].toString() == ' 1' ? true : false),
					smartMix: (params[6].toString() == '1' ? true : false),
					//8-18 are reserved
					channelName: params[19] || '',
					color: params[20] || '',
				}

				found = false;

				for (let i = 0; i < self.DATA.input_channel_settings.length; i++) { 
					if (self.DATA.input_channel_settings[i].id == inputChannel) {
						//update in place
						self.DATA.input_channel_settings[i] = inputChannelSettingsObj;
						found = true;
						break;
					}
				}

				if (!found) {
					//add to array
					self.DATA.input_channel_settings.push(inputChannelSettingsObj);
				}

				break;
			case 'g_smart_mix':
				inputChannel = params[0].toString();

				let smartMixObj = {
					id: inputChannel,
					gain_share_weight: self.gainshare_weights.find((ROW) => ROW.id == params[2].toString()).label,
				}

				found = false;

				for (let i = 0; i < self.DATA.smart_mix.length; i++) { 
					if (self.DATA.smart_mix[i].id == inputChannel) {
						//update in place
						self.DATA.smart_mix[i] = smartMixObj;
						found = true;
						break;
					}
				}

				if (!found) {
					//add to array
					self.DATA.smart_mix.push(smartMixObj);
				}

				break;
			case 'g_output_level':
			case 'md_output_level_notice':
				outputChannel = params[0].toString();
				let outputLevelObj = {
					id: outputChannel,
					level: self.fader_table.find((ROW) => ROW.id == params[1].toString()).id,
					level_label: self.fader_table.find((ROW) => ROW.id == params[1].toString()).label,
				}

				found = false;

				for (let i = 0; i < self.DATA.output_levels.length; i++) {
					if (self.DATA.output_levels[i].id == outputChannel) {
						//update in place
						self.DATA.output_levels[i] = outputLevelObj;
						found = true;
						break;
					}
				}

				if (!found) {
					//add to array
					self.DATA.output_levels.push(outputLevelObj);
				}
				break;
			case 'g_output_mute':
			case 'md_output_mute_notice':
				outputChannel = params[0].toString();
				let outputMuteObj = {
					id: outputChannel,
					mute: (params[1].toString() == '1' ? true : false)
				}

				found = false;

				for (let i = 0; i < self.DATA.output_mutes.length; i++) {
					if (self.DATA.output_mutes[i].id == outputChannel) {
						//update in place
						self.DATA.output_mutes[i] = outputMuteObj;
						found = true;
						break;
					}
				}

				if (!found) {
					//add to array
					self.DATA.output_mutes.push(outputMuteObj);
				}
				break;
			case 'g_output_channel_settings':
				outputChannel = params[0].toString();
				let unityObj = self.output_channel_settings_unity.find((UNITY) => { UNITY.id == params[1].toString()});
				let unityLabel = ''
				if (unityObj) {
					unityLabel = unityObj.label;
				}
				let outputChannelSettingsObj = {
					id: outputChannel,
					unity: params[1].toString(),
					unity_label: unityLabel,
					channelName: params[2].toString()
				}

				found = false;

				for (let i = 0; i < self.DATA.output_channel_settings.length; i++) {
					if (self.DATA.output_channel_settings[i].id == outputChannel) {
						//update in place
						self.DATA.output_channel_settings[i] = outputChannelSettingsObj;
						found = true;
						break;
					}
				}
				
				if (!found) {
					//add to array
					self.DATA.output_channel_settings.push(outputChannelSettingsObj);
				}
				break;
			case 'g_mute':
			case 'md_mute_notice':
				self.DATA.mute = (params[0].toString() == '1' ? true : false);
				break;
			case 'g_preset_number':
			case 'md_recall_preset_notice':
				self.DATA.preset_number = params[0].toString()
				break;
			case 'g_firmware_version':
				self.DATA.firmware_version = params[0].toString()
				break;
			case 'g_header_color':
				self.DATA.header_color = params[0].toString()
				break;
		}

		self.checkFeedbacks()
		self.checkVariables()
	},

	processUDPResponse(response) {
		let self = this;
		
		let category = 'XXX'
		let args = []
		let params = ''
 
		//args = response.split(' ')
		args = response.match(/\\?.|^$/g).reduce((p, c) => {
			if(c === '"'){
				p.quote ^= 1;
			}else if(!p.quote && c === ' '){
				p.a.push('');
			}else{
				p.a[p.a.length-1] += c.replace(/\\(.)/,"$1");
			}
			return  p;
		}, {a: ['']}).a

		if (args.length >= 2) {
			category = args[1].trim().toLowerCase();
		}		

		if (args.length >= 6) {
			params = args[5];
		}
		
		params = params.split(',');

		let model = self.MODELS.find((model) => model.id == self.config.model);

		let inputChannel = '';
		let outputChannel = '';

		let model_inputChannelObj;

		let found = false;

		switch (category) {
			case 'camera_control_notice':
				self.DATA.camera_control = {};
				inputChannel = params[1].toString();
				
				let inputChannelLabel = '';
				model_inputChannelObj = model.input_channels.find((CHANNEL) => CHANNEL.id == inputChannel);
				if (model_inputChannelObj) {
					inputChannelLabel = model_inputChannelObj.label;
				}

				self.DATA.camera_control.status = (params[0].toString() == '1' ? true : false)
				self.DATA.camera_control.channel = inputChannel
				self.DATA.camera_control.channel_label = inputChannelLabel
				self.DATA.camera_control.elevation_angle = params[2].toString()
				self.DATA.camera_control.rotation_angle = params[3].toString()
				self.DATA.camera_control.camera_number = params[4].toString()
				break;
			default:
				break;
		}

		self.checkFeedbacks()
		self.checkVariables()
	},

	initPolling() {
		let self = this;

		if (self.config.polling == true) {
			//clear existing interval
			if (self.pollTimer !== undefined) {
				clearInterval(self.pollTimer);
			}

			self.pollTimer = setInterval(self.getInformation.bind(self), self.config.poll_interval);
		}
	},

	getInformation() {
		let self = this;

		let model = self.MODELS.find((model) => model.id == self.config.model);

		if (model) {
			//grab specific data requests as per model
			if (model.data_request.includes('input_gain_level')) {
				for (let i = 0; i < model.input_channels.length; i++) {
					self.sendCommand('g_input_gain_level', 'O', `${model.input_channels[i].id}`)
				}
			}

			if (model.data_request.includes('input_channel_settings')) {
				for (let i = 0; i < model.input_channels.length; i++) {
					self.sendCommand('g_input_channel_settings', 'O', `${model.input_channels[i].id}`)
				}
			}
			
			if (model.data_request.includes('smart_mix')) {
				for (let i = 0; i < (model.input_channels.length - 1); i++) { //don't get analog input
					self.sendCommand('g_smart_mix', 'O', `${model.input_channels[i].id}`)
				}
			}

			if (model.data_request.includes('output_level')) {
				for (let i = 0; i < model.output_channels.length; i++) {
					self.sendCommand('g_output_level', 'O', `${model.output_channels[i].id}`)
				}
			}

			if (model.data_request.includes('output_mute')) {
				for (let i = 0; i < model.output_channels.length; i++) {
					self.sendCommand('g_output_mute', 'O', `${model.output_channels[i].id}`)
				}
			}

			if (model.data_request.includes('output_channel_settings')) {
				for (let i = 0; i < model.output_channels.length; i++) {
					self.sendCommand('g_output_channel_settings', 'O', `${model.output_channels[i].id}`)
				}
			}

			if (model.data_request.includes('mute')) {
				self.sendCommand('g_mute', 'O');
			}

			if (model.data_request.includes('firmware_version')) {
				self.sendCommand('g_firmware_version', 'O')
			}

			if (model.data_request.includes('header_color')) {
				self.sendCommand('g_header_color', 'O')
			}
		}
	}
}