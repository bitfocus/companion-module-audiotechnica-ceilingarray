// Audio Technica Digital Mixer

const { InstanceBase, InstanceStatus, Regex, runEntrypoint, TCPHelper } = require('@companion-module/base')
const UpgradeScripts = require('./src/upgrades')

const config = require('./src/config')
const actions = require('./src/actions')
const feedbacks = require('./src/feedbacks')
const variables = require('./src/variables')
const presets = require('./src/presets')

const utils = require('./src/utils')

const models = require('./src/models')
const constants = require('./src/constants')

class moduleInstance extends InstanceBase {
	constructor(internal) {
		super(internal)

		// Assign the methods from the listed files to this class
		Object.assign(this, {
			...config,
			...actions,
			...feedbacks,
			...variables,
			...presets,
			...utils,
			...models,
			...constants
		})

		this.socket = undefined

		this.cmdPipe = [];
		this.lastReturnedCommand = undefined;

		this.pollTimer = undefined

		this.DATA = {}

		this.CONTROL_MODELID= '0000';
		this.CONTROL_UNITNUMBER = '00';
		this.CONTROL_CONTINUESELECT = 'NC';
		this.CONTROL_ACK = 'ACK'
		this.CONTROL_NAK = 'NAK'
		this.CONTROL_END = '\r';

		this.DATA = {}
	}

	async destroy() {
		if (this.socket !== undefined) {
			this.socket.destroy()
		}

		if (this.pollTimer !== undefined) {
			clearInterval(this.pollTimer)
			delete this.pollTimer
		}

		//debug('destroy', this.id)
	}

	async init(config) {
		this.updateStatus(InstanceStatus.Connecting)
		this.configUpdated(config)
	}

	async configUpdated(config) {
		// polling is running and polling has been de-selected by config change
		if (this.pollTimer !== undefined) {
			clearInterval(this.pollTimer)
			delete this.pollTimer
		}
		this.config = config

		this.setUpInternalDataArrays();
		
		this.initActions()
		this.initFeedbacks()
		this.initVariables()
		this.initPresets()

		this.initTCP()
	}

	setUpInternalDataArrays() {
		let model = this.MODELS.find((model) => model.id == this.config.model);

		if (model.data_request.includes('input_gain_level')) {
			this.DATA.input_gain_levels = [];
		}

		if (model.data_request.includes('input_channel_settings')) {
			this.DATA.input_channel_settings = [];
		}
		
		if (model.data_request.includes('smart_mix')) {
			this.DATA.smart_mix = [];
		}

		if (model.data_request.includes('output_level')) {
			this.DATA.output_levels = [];
		}

		if (model.data_request.includes('output_mute')) {
			this.DATA.output_mutes = [];
		}

		if (model.data_request.includes('output_channel_settings')) {
			this.DATA.output_channel_settings = [];
		}		

		this.DATA.open_channels = [];
	}

	initTCP() {
		let pipeline = ''

		if (this.socket !== undefined) {
			this.socket.destroy()
			delete this.socket
		}

		if (this.config.port === undefined) {
			this.config.port = 17300
		}

		if (this.config.host) {
			this.socket = new TCPHelper(this.config.host, this.config.port)

			this.socket.on('status_change', (status, message) => {
				this.updateStatus(status, message)
			})

			this.socket.on('error', (err) => {
				this.log('error', 'Network error: ' + err.message)
				this.updateStatus(InstanceStatus.ConnectionFailure)
				clearInterval(this.pollTimer);
				this.socket.destroy()
				this.socket == null
			})

			this.socket.on('connect', () => {
				this.cmdPipe = [];

				this.initPolling()

				this.updateStatus(InstanceStatus.Ok)
			})

			this.socket.on('data', (receivebuffer) => {
				pipeline += receivebuffer.toString('utf8')

				if (pipeline.includes(this.CONTROL_ACK)) { // ACKs are sent when a command is received, no processing is needed, we should have one command to one ACK
					pipeline = '';
				}
				else if (pipeline.includes(this.CONTROL_END)) { // Every command ends with CR or an ACK if nothing needed
					let pipeline_responses = pipeline.split(this.CONTROL_END);
					for (let i = 0; i < pipeline_responses.length; i++) {
						if (pipeline_responses[i] !== '') {
							if (pipeline_responses[i].includes(this.CONTROL_NAK)) {// NAKs are sent on error, let's see what error we got
								this.processError(pipeline_responses[i])
							}
							else {
								this.processResponse(pipeline_responses[i])
							}
						}
					}
					
					pipeline = '';
				}

				this.lastReturnedCommand = this.cmdPipeNext()
			})
		}
	}

	cmdPipeNext() {
		const return_cmd = this.cmdPipe.shift();

		if(this.cmdPipeNext.length > 0) {
			let command = this.cmdPipe[0];
			this.lastReturnedCommand(command.cmd, command.handshake, command.params);
		}

		return return_cmd;
	}

	sendCommand(cmd, handshake, params) {
		if (cmd !== undefined) {
			this.cmdPipe.push({
				cmd: cmd,
				handshake: handshake,
				params: params
			});

			if(this.cmdPipe.length === 1) {
				this.runCommand(cmd, handshake, params);
			}			
		}
	}

	runCommand(cmd, handshake, params) {
		if (this.socket !== undefined && this.socket.isConnected) {
			console.log('sending: ' + this.buildCommand(cmd, handshake, params));
			this.socket.send(this.buildCommand(cmd, handshake, params))
			.then((result) => {
				//console.log('send result: ' + result);
			})
			.catch((error) => {
				//console.log('send error: ' + error);
			});
		}
		else {
			this.log('error', 'Network error: Connection to Device not opened.')
			clearInterval(this.pollTimer);
		}
	}

	processResponse(response) {
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

		let model = this.MODELS.find((model) => model.id == this.config.model);

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
					mic_gain: this.input_gain_table_mic.find((ROW) => ROW.id == params[1].toString()).id,
					mic_gain_label: this.input_gain_table_mic.find((ROW) => ROW.id == params[1].toString()).label,
					line_gain: this.input_gain_table_line.find((ROW) => ROW.id == params[2].toString()).id,
					line_gain_label: this.input_gain_table_line.find((ROW) => ROW.id == params[2].toString()).label,
					level: this.fader_table.find((ROW) => ROW.id == params[3].toString()).id,
					level_label: this.fader_table.find((ROW) => ROW.id == params[3].toString()).label,
					mute: (params[6].toString() == '1' ? true : false),
				}
				
				found = false;

				for (let i = 0; i < this.DATA.input_gain_levels.length; i++) {
					if (this.DATA.input_gain_levels[i].id == inputChannel) {
						//update in place
						this.DATA.input_gain_levels[i] = inputGainLevelObj;
						found = true;
						break;
					}
				}
				
				if (!found) {
					//add to array
					this.DATA.input_gain_levels.push(inputGainLevelObj);
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

				for (let i = 0; i < this.DATA.input_channel_settings.length; i++) { 
					if (this.DATA.input_channel_settings[i].id == inputChannel) {
						//update in place
						this.DATA.input_channel_settings[i] = inputChannelSettingsObj;
						found = true;
						break;
					}
				}

				if (!found) {
					//add to array
					this.DATA.input_channel_settings.push(inputChannelSettingsObj);
				}

				break;
			case 'g_smart_mix':
				inputChannel = params[0].toString();

				let smartMixObj = {
					id: inputChannel,
					gain_share_weight: this.gainshare_weights.find((ROW) => ROW.id == params[2].toString()).label,
				}

				found = false;

				for (let i = 0; i < this.DATA.smart_mix.length; i++) { 
					if (this.DATA.smart_mix[i].id == inputChannel) {
						//update in place
						this.DATA.smart_mix[i] = smartMixObj;
						found = true;
						break;
					}
				}

				if (!found) {
					//add to array
					this.DATA.smart_mix.push(smartMixObj);
				}

				break;
			case 'g_output_level':
			case 'md_output_level_notice':
				outputChannel = params[0].toString();
				let outputLevelObj = {
					id: outputChannel,
					level: this.fader_table.find((ROW) => ROW.id == params[1].toString()).id,
					level_label: this.fader_table.find((ROW) => ROW.id == params[1].toString()).label,
				}

				found = false;

				for (let i = 0; i < this.DATA.output_levels.length; i++) {
					if (this.DATA.output_levels[i].id == outputChannel) {
						//update in place
						this.DATA.output_levels[i] = outputLevelObj;
						found = true;
						break;
					}
				}

				if (!found) {
					//add to array
					this.DATA.output_levels.push(outputLevelObj);
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

				for (let i = 0; i < this.DATA.output_mutes.length; i++) {
					if (this.DATA.output_mutes[i].id == outputChannel) {
						//update in place
						this.DATA.output_mutes[i] = outputMuteObj;
						found = true;
						break;
					}
				}

				if (!found) {
					//add to array
					this.DATA.output_mutes.push(outputMuteObj);
				}
				break;
			case 'g_output_channel_settings':
				outputChannel = params[0].toString();
				let outputChannelSettingsObj = {
					id: outputChannel,
					unity: this.output_channel_settings_unity.find((ROW) => ROW.id == params[1].toString()).label,
					channelName: params[2].toString()
				}

				found = false;

				for (let i = 0; i < this.DATA.output_channel_settings.length; i++) {
					if (this.DATA.output_channel_settings[i].id == outputChannel) {
						//update in place
						this.DATA.output_channel_settings[i] = outputChannelSettingsObj;
						found = true;
						break;
					}
				}
				
				if (!found) {
					//add to array
					this.DATA.output_channel_settings.push(outputChannelSettingsObj);
				}
				break;
			case 'g_mute':
			case 'md_mute_notice':
				this.DATA.mute = (params[0].toString() == '1' ? true : false);
				break;
			case 'g_preset_number':
			case 'md_recall_preset_notice':
				this.DATA.preset_number = params[0].toString()
				break;
			case 'g_firmware_version':
				this.DATA.firmware_version = params[0].toString()
				break;
			case 'g_header_color':
				this.DATA.header_color = params[0].toString()
				break;
			case 'md_camera_control_notice':
			case 'md_talkerposition_notice':
				this.DATA.camera_control = {};
				inputChannel = params[1].toString();
				model_inputChannelObj = model.input_channels.find((CHANNEL) => CHANNEL.id == inputChannel);
				this.DATA.camera_control.status = (params[0].toString() == '1' ? true : false)
				this.DATA.camera_control.channel = inputChannel
				this.DATA.camera_control.channel_label = model_inputChannelObj.label
				this.DATA.camera_control.elevation_angle = params[2].toString()
				this.DATA.camera_control.rotation_angle = params[3].toString()
				this.DATA.camera_control.camera_number = params[4].toString()
				break;
		}

		this.checkFeedbacks()
		this.checkVariables()
	}

	initPolling() {
		if (this.pollTimer === undefined && this.config.poll_interval > 0) {
			this.pollTimer = setInterval(() => {
				let model = this.MODELS.find((model) => model.id == this.config.model);

				if (model) {
					//grab specific data requests as per model
					if (model.data_request.includes('input_gain_level')) {
						for (let i = 0; i < model.input_channels.length; i++) {
							this.sendCommand('g_input_gain_level', 'O', `${model.input_channels[i].id}`)
						}
					}

					if (model.data_request.includes('input_channel_settings')) {
						for (let i = 0; i < model.input_channels.length; i++) {
							this.sendCommand('g_input_channel_settings', 'O', `${model.input_channels[i].id}`)
						}
					}
					
					if (model.data_request.includes('smart_mix')) {
						for (let i = 0; i < (model.input_channels.length - 1); i++) { //don't get analog input
							this.sendCommand('g_smart_mix', 'O', `${model.input_channels[i].id}`)
						}
					}

					if (model.data_request.includes('output_level')) {
						for (let i = 0; i < model.output_channels.length; i++) {
							this.sendCommand('g_output_level', 'O', `${model.output_channels[i].id}`)
						}
					}

					if (model.data_request.includes('output_mute')) {
						for (let i = 0; i < model.output_channels.length; i++) {
							this.sendCommand('g_output_mute', 'O', `${model.output_channels[i].id}`)
						}
					}

					if (model.data_request.includes('output_channel_settings')) {
						for (let i = 0; i < model.output_channels.length; i++) {
							this.sendCommand('g_output_channel_settings', 'O', `${model.output_channels[i].id}`)
						}
					}

					if (model.data_request.includes('mute')) {
						this.sendCommand('g_mute', 'O');
					}

					if (model.data_request.includes('firmware_version')) {
						this.sendCommand('g_firmware_version', 'O')
					}

					if (model.data_request.includes('header_color')) {
						this.sendCommand('g_header_color', 'O')
					}
				}

			}, this.config.poll_interval)
		}
	}
}

runEntrypoint(moduleInstance, UpgradeScripts)
