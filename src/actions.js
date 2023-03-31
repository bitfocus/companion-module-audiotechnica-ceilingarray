const constants = require('./constants')

module.exports = {
	initActions() {
		let actions = {}

		let model = this.MODELS.find((model) => model.id == this.config.model);

		if (model) {
			if (model.actions.includes('input_gain_level')) {
				actions['input_gain_level'] = {
					name: 'Set Input Gain Level',
					options: [
						{
							type: 'dropdown',
							label: 'Input Channel',
							id: 'input',
							default: model.input_channels[0].id,
							choices: model.input_channels
						},
						{
							type: 'dropdown',
							label: 'Gain - Mic',
							id: 'gain_mic',
							default: constants.input_gain_table_mic[0].id,
							choices: constants.input_gain_table_mic
						},
						{
							type: 'dropdown',
							label: 'Level',
							id: 'level',
							default: constants.fader_table[0].id,
							choices: constants.fader_table
						},
						{
							type: 'checkbox',
							label: 'Mute',
							id: 'mute',
							default: false
						},
					],
					callback: async (event) => {
						let params = '';
	
						params += event.options.input + ','
								+ event.options.gain_mic + ','
								+ '40' + ','
								+ event.options.level + ','
								+ ',' //max vol enable
								+ ',' //max vol
								+ (event.options.mute ? '1' : '0') + ','
								+ ',' //virtual gain
								+ ',' //min vol enable
								+ ',' //min vol

						this.sendCommand('s_input_gain_level', 'S', params)
					},
				}

				actions['input_gain_level_increase'] = {
					name: 'Increase Input Mic Gain Level',
					options: [
						{
							type: 'dropdown',
							label: 'Input Channel',
							id: 'input',
							default: model.input_channels[0].id,
							choices: model.input_channels
						},
						{
							type: 'number',
							id: 'steps',							
							label: 'Steps',
							default: 1,
							min: 1,
							max: 10
						}
					],
					callback: async (event) => {
						this.sendCommand('s_input_gain_level', 'S', this.buildInputGainParams(event.options.input, 'mic_gain', 'increase', event.options.steps))
					},
				}

				actions['input_gain_level_decrease'] = {
					name: 'Decrease Input Mic Gain Level',
					options: [
						{
							type: 'dropdown',
							label: 'Input Channel',
							id: 'input',
							default: model.input_channels[0].id,
							choices: model.input_channels
						},
						{
							type: 'number',
							id: 'steps',							
							label: 'Steps',
							default: 1,
							min: 1,
							max: 10
						}
					],
					callback: async (event) => {
						this.sendCommand('s_input_gain_level', 'S', this.buildInputGainParams(event.options.input, 'mic_gain', 'decrease', event.options.steps))
					},
				}

				actions['input_level_increase'] = {
					name: 'Increase Input Level',
					options: [
						{
							type: 'dropdown',
							label: 'Input Channel',
							id: 'input',
							default: model.input_channels[0].id,
							choices: model.input_channels
						},
						{
							type: 'number',
							id: 'steps',							
							label: 'Steps',
							default: 1,
							min: 1,
							max: 10
						}
					],
					callback: async (event) => {
						this.sendCommand('s_input_gain_level', 'S', this.buildInputGainParams(event.options.input, 'level', 'increase', event.options.steps))
					},
				}

				actions['input_level_decrease'] = {
					name: 'Decrease Input Level',
					options: [
						{
							type: 'dropdown',
							label: 'Input Channel',
							id: 'input',
							default: model.input_channels[0].id,
							choices: model.input_channels
						},
						{
							type: 'number',
							id: 'steps',							
							label: 'Steps',
							default: 1,
							min: 1,
							max: 10
						}
					],
					callback: async (event) => {
						this.sendCommand('s_input_gain_level', 'S', this.buildInputGainParams(event.options.input, 'level', 'decrease', event.options.steps))
					},
				}

				actions['input_mute'] = {
					name: 'Mute Input Channel',
					options: [
						{
							type: 'dropdown',
							label: 'Input Channel',
							id: 'input',
							default: model.input_channels[0].id,
							choices: model.input_channels
						},
						{
							type: 'checkbox',
							label: 'Mute/Unmute',
							id: 'mute',
							default: false
						}
					],
					callback: async (event) => {
						this.sendCommand('s_input_gain_level', 'S', this.buildInputGainParams(event.options.input, 'mute', event.options.mute))
					},
				}
			}

			if (model.actions.includes('input_channel_settings')) {
				actions['input_channel_settings'] = {
					name: 'Set Input Channel Settings',
					options: [
						{
							type: 'dropdown',
							label: 'Input Channel',
							id: 'input',
							default: model.input_channels[0].id,
							choices: model.input_channels
						},
						{
							type: 'dropdown',
							label: 'Source',
							id: 'source',
							default: '0',
							choices: [
								{ id: '0', label: 'Mic' },
								{ id: '1', label: 'Line' },
							]
						},
						{
							type: 'checkbox',
							label: 'Phantom Power',
							id: 'phantom',
							default: true
						},
						{
							type: 'checkbox',
							label: 'Low Cut',
							id: 'lowcut',
							default: true
						},
						{
							type: 'checkbox',
							label: 'AEC',
							id: 'aec',
							default: true
						},
						{
							type: 'checkbox',
							label: 'Smart Mix',
							id: 'smartmix',
							default: true
						},
						{
							type: 'textinput',
							label: 'Name',
							id: 'name',
							default: ''
						},
						{
							type: 'dropdown',
							label: 'Color',
							id: 'color',
							default: '0',
							choices: [
								{ id: 0, label: 'Green'},
								{ id: 1, label: 'Yellow'},
								{ id: 2, label: 'Brown'},
								{ id: 3, label: 'Red'},
								{ id: 4, label: 'Pink'},
								{ id: 5, label: 'Blue'},
								{ id: 6, label: 'Gray'},
								{ id: 7, label: 'Dark Gray'},
								//{ id: 8, label: 'Cyan'},
							]
						}
					],
					callback: async (event) => {
						let params = '';
	
						params += event.options.input + ','
								+ event.options.source + ','
								+ (event.options.phantom ? '1' : '0') + ','
								+ ',' //phase
								+ (event.options.lowcut ? '1' : '0') + ','
								+ (event.options.aec ? '1' : '0') + ','
								+ (event.options.smartmix ? '1' : '0') + ','
								+ ',' //link
								+ ',,,,,,,,,,,' //output busses
								+ '"' + event.options.name + '"' + ','
								+ event.options.color + ','
								+ ',,,,' //virtual mic
								+ ',,,' //fader group, smart mix group, mono

						this.sendCommand('s_input_channel_settings', 'S', params)
					},
				}
			}

			if (model.actions.includes('smart_mix')) {
				actions['smart_mix'] = {
					name: 'Set Gain Share Settings',
					options: [
						{
							type: 'dropdown',
							label: 'Input Channel',
							id: 'input',
							default: model.input_channels[0].id,
							choices: model.input_channels
						},
						{
							type: 'dropdown',
							label: 'Gain Share Weight',
							id: 'gainshare',
							default: constants.gainshare_weights[0].id,
							choices: constants.gainshare_weights
						}
					],
					callback: async (event) => {
						let params = '';
	
						params += event.options.input + ','
								+ ',' //smart mix group
								+ event.options.gainshare + ','
								+ ',,,' //gate settings

						this.sendCommand('s_input_gain_level', 'S', params)
					},
				}
			}

			if (model.actions.includes('output_level')) {
				actions['output_level'] = {
					name: 'Set Output Level',
					options: [
						{
							type: 'dropdown',
							label: 'Output Channel',
							id: 'output',
							default: model.output_channels[0].id,
							choices: model.output_channels
						},
						{
							type: 'dropdown',
							label: 'Level',
							id: 'level',
							default: constants.fader_table[0].id,
							choices: constants.fader_table
						}
					],
					callback: async (event) => {
						let params = '';
	
						params += event.options.output + ','
								+ event.options.level + ','
								+ ',' //max vol enable
								+ ',' //max vol
								+ ',' //min vol enable
								+ ',' //min vol
	
						this.sendCommand('s_output_level', 'S', params)
					},
				}

				actions['output_level_increase'] = {
					name: 'Increase Output Level',
					options: [
						{
							type: 'dropdown',
							label: 'Output Channel',
							id: 'output',
							default: model.output_channels[0].id,
							choices: model.output_channels
						},
						{
							type: 'number',
							id: 'steps',							
							label: 'Steps',
							default: 1,
							min: 1,
							max: 10
						}
					],
					callback: async (event) => {
						this.sendCommand('s_output_level', 'S', this.buildOutputLevelParams(event.options.output, 'level', 'increase', event.options.steps))
					},
				}

				actions['output_level_decrease'] = {
					name: 'Decrease Output Level',
					options: [
						{
							type: 'dropdown',
							label: 'Output Channel',
							id: 'output',
							default: model.output_channels[0].id,
							choices: model.output_channels
						},
						{
							type: 'number',
							id: 'steps',							
							label: 'Steps',
							default: 1,
							min: 1,
							max: 10
						}
					],
					callback: async (event) => {
						this.sendCommand('s_output_level', 'S', this.buildOutputLevelParams(event.options.output, 'level', 'decrease', event.options.steps))
					},
				}
			}

			if (model.actions.includes('output_mute')) {
				actions['output_level'] = {
					name: 'Set Output Mute',
					options: [
						{
							type: 'dropdown',
							label: 'Output Channel',
							id: 'output',
							default: model.output_channels[0].id,
							choices: model.output_channels
						},
						{
							type: 'checkbox',
							label: 'Mute/Unmute',
							id: 'mute',
							default: false
						}
					],
					callback: async (event) => {
						let params = '';
	
						params += event.options.output + ','
								+ (event.options.mute ? '1' : '0')
	
						this.sendCommand('s_output_mute', 'S', params)
					},
				}
			}

			if (model.actions.includes('output_channel_settings')) {
				actions['output_channel_settings'] = {
					name: 'Set Output Channel Settings',
					options: [
						{
							type: 'dropdown',
							label: 'Output Channel',
							id: 'output',
							default: model.output_channels[0].id,
							choices: model.output_channels
						},
						{
							type: 'dropdown',
							label: 'Unity',
							id: 'unity',
							default: '3',
							choices: [
								{ id: '0', label: '+4dBu'},
								//{ id: '1', label: '0dBv'},
								{ id: '2', label: '-10dBv'},
								{ id: '3', label: '-33dBv'},
							]
						},
						{
							type: 'textinput',
							label: 'Channel Name',
							id: 'name',
							default: 'OUT 1'
						}
					],
					callback: async (event) => {
						let params = '';
	
						params += event.options.output + ','
								+ event.options.unity + ','
								+ '"' + event.options.name + '"' + ','
								+ ',' //color
								+ ',' //link
								+ ',' //source
								+ ',' //fader group
	
						this.sendCommand('s_output_channel_settings', 'S', params)
					},
				}
			}

			if (model.actions.includes('mute')) {
				actions['mute'] = {
					name: 'Device Mute/Unmute',
					options: [
						{
							type: 'checkbox',
							label: 'Mute/Unmute',
							id: 'mute',
							default: false
						}
					],
					callback: async (event) => {
						this.sendCommand('s_mute', 'S', event.options.mute ? '1' : '0')
					},
				}
			}

			if (model.actions.includes('header_color')) {
				actions['header_color'] = {
					name: 'Set Header Color',
					options: [
						{
							type: 'dropdown',
							label: 'Color',
							id: 'color',
							default: 1,
							choices: [
								{ id: 0, label: 'Green'},
								{ id: 1, label: 'Yellow'},
								//{ id: 2, label: 'Brown'},
								{ id: 3, label: 'Red'},
								{ id: 4, label: 'Pink'},
								{ id: 5, label: 'Blue'},
								//{ id: 6, label: 'Gray'},
								//{ id: 7, label: 'Dark Gray'},
								{ id: 8, label: 'Cyan'},
							]
						},
					],
					callback: async (event) => {
						let params = '';
	
						params += event.options.color;
	
						this.sendCommand('header_color', 'S', params)
					},
				}
			}

			if (model.actions.includes('call_preset')) {
				actions['call_preset'] = {
					name: 'Call Preset',
					options: [
						{
							type: 'dropdown',
							label: 'Bank Number',
							id: 'bank',
							default: 1,
							choices: [
								{ id: 1, label: 'Bank 1'},
								{ id: 2, label: 'Bank 2'},
								{ id: 3, label: 'Bank 3'},
								{ id: 4, label: 'Bank 4'},
								{ id: 5, label: 'Bank 5'},
								{ id: 6, label: 'Bank 6'},
								{ id: 7, label: 'Bank 7'},
								{ id: 8, label: 'Bank 8'},
								{ id: 9, label: 'Bank 9'},
								{ id: 10, label: 'Bank 10'},
								{ id: 11, label: 'Bank 11'},
								{ id: 12, label: 'Bank 12'},
								{ id: 13, label: 'Bank 13'},
								{ id: 14, label: 'Bank 14'},
								{ id: 15, label: 'Bank 15'},
								{ id: 16, label: 'Bank 16'}
							]
						},
					],
					callback: async (event) => {
						let params = '';
	
						params += event.options.bank;
	
						this.sendCommand('call_preset', 'S', params)
					},
				}
			}
		}
			
		this.setActionDefinitions(actions)
	},

	buildInputGainParams(input, choice, direction, steps) {
		let model = this.MODELS.find((model) => model.id == this.config.model);

		let params = '';

		let dataObj = this.DATA.input_gain_levels.find((CHANNEL) => CHANNEL.id == input);

		if (dataObj) {
			let index = 0;

			switch (choice) {
				case 'mic_gain':
					index = constants.input_gain_table_mic.findIndex((GAIN) => GAIN.id == dataObj.mic_gain);

					if (direction == 'increase') {
						if (index < (constants.input_gain_table_mic.length - steps - 1)) {
							index = index + steps;
						}
					}
					else {
						if ((index - steps) >= 0) {
							index = index - steps;
						}
					}

					dataObj.mic_gain = constants.input_gain_table_mic[index].id;

					break;
				case 'level':
					index = constants.fader_table.findIndex((LEVEL) => LEVEL.id == dataObj.level);

					if (direction == 'increase') {
						if (index < (constants.fader_table.length - steps - 1)) {
							index = index + steps;
						}
					}
					else {
						if ((index - steps) >= 0) {
							index = index - steps;
						}
					}
					
					dataObj.level = constants.fader_table[index].id;

					break;
				case 'mute':
					dataObj.mute = direction;
					break;
			}

			params += input + ','
					+ dataObj.mic_gain + ','
					+ '40' + ','
					+ dataObj.level + ','
					+ ',' //max vol enable
					+ ',' //max vol
					+ (dataObj.mute ? '1' : '0') + ','
					+ ',' //virtual gain
					+ ',' //min vol enable
					+ ',' //min vol
		}

		return params;
	},

	buildOutputLevelParams(output, choice, direction) {
		let model = this.MODELS.find((model) => model.id == this.config.model);

		let params = '';

		let dataObj = this.DATA.output_levels.find((CHANNEL) => CHANNEL.id == output);

		if (dataObj) {
			let index = 0;

			switch (choice) {
				case 'level':
					index = constants.fader_table.findIndex((LEVEL) => LEVEL.id == dataObj.level);

					if (direction == 'increase') {
						if (index < (constants.fader_table.length - steps - 1)) {
							index = index + steps;
						}
					}
					else {
						if ((index - steps) >= 0) {
							index = index - steps;
						}
					}
					
					dataObj.level = constants.fader_table[index].id;

					break;
			}

			params += output + ','
				+ dataObj.level + ','
				+ ',' //max vol enable
				+ ',' //max vol
				+ ',' //min vol enable
				+ ',' //min vol
		}

		return params;
	}
}