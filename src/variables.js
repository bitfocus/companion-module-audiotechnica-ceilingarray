const constants = require('./constants')

module.exports = {
	initVariables() {
		let variables = []

		variables.push({ variableId: 'model', name: 'Model' })

		let model = this.MODELS.find((model) => model.id == this.config.model);

		if (model) { //push model specific variables
			if (model.variables.includes('input_gain_level')) {
				for (let i = 0; i < model.input_channels.length; i++) {
					variables.push({ variableId: `${model.input_channels[i].variableId}_mic_gain`, name: `${model.input_channels[i].label} Mic Gain`})
					variables.push({ variableId: `${model.input_channels[i].variableId}_line_gain`, name: `${model.input_channels[i].label} Line Gain`})
					variables.push({ variableId: `${model.input_channels[i].variableId}_level`, name: `${model.input_channels[i].label} Level`})
					variables.push({ variableId: `${model.input_channels[i].variableId}_mute`, name: `${model.input_channels[i].label} Mute`})
				}
			}

			if (model.variables.includes('input_channel_settings')) {
				for (let i = 0; i < model.input_channels.length; i++) {
					variables.push({ variableId: `${model.input_channels[i].variableId}_source`, name: `${model.input_channels[i].label} Source`})
					variables.push({ variableId: `${model.input_channels[i].variableId}_phantompower`, name: `${model.input_channels[i].label} Phantom Power`})
					variables.push({ variableId: `${model.input_channels[i].variableId}_phase`, name: `${model.input_channels[i].label} Phase`})
					variables.push({ variableId: `${model.input_channels[i].variableId}_lowcut`, name: `${model.input_channels[i].label} Low Cut`})
					variables.push({ variableId: `${model.input_channels[i].variableId}_aec`, name: `${model.input_channels[i].label} AEC`})
					variables.push({ variableId: `${model.input_channels[i].variableId}_smartmix`, name: `${model.input_channels[i].label} Smart Mix`})
					variables.push({ variableId: `${model.input_channels[i].variableId}_channelname`, name: `${model.input_channels[i].label} Channel Name`})
					variables.push({ variableId: `${model.input_channels[i].variableId}_color`, name: `${model.input_channels[i].label} Color`})
				}
			}
			
			if (model.variables.includes('output_level')) {
				for (let i = 0; i < model.output_channels.length; i++) {
					variables.push({ variableId: `${model.output_channels[i].variableId}_level`, name: `${model.output_channels[i].label} Level`})
				}
			}

			if (model.variables.includes('output_mute')) {
				for (let i = 0; i < model.output_channels.length; i++) {
					variables.push({ variableId: `${model.output_channels[i].variableId}_mute`, name: `${model.output_channels[i].label} Mute`})
				}
			}

			if (model.variables.includes('output_channel_settings')) {
				for (let i = 0; i < model.output_channels.length; i++) {
					variables.push({ variableId: `${model.output_channels[i].variableId}_unity`, name: `${model.output_channels[i].label} Unity`})
					variables.push({ variableId: `${model.output_channels[i].variableId}_channelname`, name: `${model.output_channels[i].label} Channel Name`})
				}
			}

			if (model.variables.includes('mute')) {
				variables.push({ variableId: `mute`, name: `Device Mute Status`})
			}

			if (model.variables.includes('preset_number')) {
				variables.push({ variableId: `preset_number`, name: `Current Preset Number`})
			}			

			if (model.variables.includes('firmware_version')) {
				variables.push({ variableId: `firmware_version`, name: `Firmware Version`})
			}

			if (model.variables.includes('header_color')) {
				variables.push({ variableId: `header_color`, name: `Header Color`})
			}

			if (model.variables.includes('camera_control')) {
				variables.push({ variableId: `camera_control_status`, name: `Camera Control Status`})
				variables.push({ variableId: `camera_control_channel`, name: `Camera Control Channel`})
				variables.push({ variableId: `camera_control_elevation_angle`, name: `Camera Control Elevation Angle`})
				variables.push({ variableId: `camera_control_rotation_angle`, name: `Camera Control Rotation Angle`})
				variables.push({ variableId: `camera_control_camera_number`, name: `Camera Control Camera Number`})
			}
		}

		this.setVariableDefinitions(variables)

		this.setVariableValues({
			model: model.label,
		})
	},

	checkVariables() {
		try {
			let model = this.MODELS.find((model) => model.id == this.config.model);

			if (model) {
				if (model.variables.includes('input_gain_level')) {
					let variableObj = {};
					
					for (let i = 0; i < this.DATA.input_gain_levels.length; i++) {
						let inputGainLevelObj = this.DATA.input_gain_levels[i];
						let modelChannelObj = model.input_channels.find((CHANNEL) => CHANNEL.id == inputGainLevelObj.id);
	
						variableObj[`${modelChannelObj.variableId}_mic_gain`] = inputGainLevelObj.mic_gain_label;
						variableObj[`${modelChannelObj.variableId}_line_gain`] = inputGainLevelObj.line_gain_label;
						variableObj[`${modelChannelObj.variableId}_level`] = inputGainLevelObj.level_label;
						variableObj[`${modelChannelObj.variableId}_mute`] = (inputGainLevelObj.mute == true ? 'On' : 'Off')
					}
					this.setVariableValues(variableObj);
				}

				if (model.variables.includes('input_channel_settings')) {
					let variableObj = {};
					for (let i = 0; i < this.DATA.input_channel_settings.length; i++) {
					let inputChannelSettingsObj = this.DATA.input_channel_settings[i];
						let modelChannelObj = model.input_channels.find((CHANNEL) => CHANNEL.id == inputChannelSettingsObj.id);
	
						let sourceObj = this.input_channel_settings_sources.find((SOURCE) => { SOURCE.id == inputChannelSettingsObj.source})
						let sourceLabel = '';
						if (sourceObj) {
							sourceLabel = sourceObj.label;
						}
						variableObj[`${modelChannelObj.variableId}_source`] = sourceLabel;
						variableObj[`${modelChannelObj.variableId}_phantompower`] = (inputChannelSettingsObj.phantomPower == true ? 'On' : 'Off')
						variableObj[`${modelChannelObj.variableId}_phase`] = inputChannelSettingsObj.phase;
						variableObj[`${modelChannelObj.variableId}_lowcut`] = (inputChannelSettingsObj.lowCut == true ? 'On' : 'Off');
						variableObj[`${modelChannelObj.variableId}_aec`] = (inputChannelSettingsObj.aec == true ? 'On' : 'Off');
						variableObj[`${modelChannelObj.variableId}_smartmix`] = (inputChannelSettingsObj.smartMix == true ? 'On' : 'Off');
						variableObj[`${modelChannelObj.variableId}_channelname`] = inputChannelSettingsObj.channelName;
						variableObj[`${modelChannelObj.variableId}_color`] = inputChannelSettingsObj.color;
					}
	
					this.setVariableValues(variableObj);
				}

				if (model.variables.includes('smart_mix')) {
					let variableObj = {};

					for (let i = 0; i < this.DATA.smart_mix.length; i++) {
						let smartMixObj = this.DATA.smart_mix[i];
						let modelChannelObj = model.input_channels.find((CHANNEL) => CHANNEL.id == smartMixObj.id);
	
						variableObj[`${modelChannelObj.variableId}_smartmix_gainshareweight`] = smartMixObj.gain_share_weight;
					}
				}

				if (model.variables.includes('output_level')) {
					let variableObj = {};
					for (let i = 0; i < this.DATA.output_levels.length; i++) {
						let outputLevelObj = this.DATA.output_levels[i];
						let modelChannelObj = model.output_channels.find((CHANNEL) => CHANNEL.id == outputLevelObj.id);
	
						variableObj[`${modelChannelObj.variableId}_level`] = outputLevelObj.level_label;
					}
					this.setVariableValues(variableObj);
				}

				if (model.variables.includes('output_mute')) {
					let variableObj = {};
					for (let i = 0; i < this.DATA.output_mutes.length; i++) {
						let outputMuteObj = this.DATA.output_mutes[i];
						let modelChannelObj = model.output_channels.find((CHANNEL) => CHANNEL.id == outputMuteObj.id);
	
						variableObj[`${modelChannelObj.variableId}_mute`] = (outputMuteObj.mute == true ? 'On' : 'Off');
					}
					this.setVariableValues(variableObj);
				}

				if (model.variables.includes('output_channel_settings')) {
					let variableObj = {};
					for (let i = 0; i < this.DATA.output_channel_settings.length; i++) {
						let outputChannelSettingsObj = this.DATA.output_channel_settings[i];
						let modelChannelObj = model.output_channels.find((CHANNEL) => CHANNEL.id == outputChannelSettingsObj.id);
	
						let unityObj = this.output_channel_settings_unity.find((UNITY) => { UNITY.id == outputChannelSettingsObj.unity});
						let unityLabel = ''
						if (unityObj) {
							unityLabel = unityObj.label;
						}
						variableObj[`${modelChannelObj.variableId}_unity`] = unityLabel;
						variableObj[`${modelChannelObj.variableId}_channelname`] = outputChannelSettingsObj.channelName;
					}
					this.setVariableValues(variableObj);
				}

				if (model.variables.includes('mute')) {
					let variableObj = {};
					variableObj[`mute`] = (this.DATA.mute == true ? 'On' : 'Off');
					this.setVariableValues(variableObj);
				}

				if (model.variables.includes('preset_number')) {
					let variableObj = {};
					variableObj[`preset_number`] = this.DATA.preset_number;
					this.setVariableValues(variableObj);
				}				

				if (model.variables.includes('firmware_version')) {
					let variableObj = {};
					variableObj[`firmware_version`] = this.DATA.firmware_version;
					this.setVariableValues(variableObj);
				}

				if (model.variables.includes('header_color')) {
					let variableObj = {};
					let headerColorObj = constants.header_colors.find((COLOR) => COLOR.id == this.DATA.header_color);
					if (headerColorObj) {
						variableObj[`header_color`] = headerColorObj.label;
						this.setVariableValues(variableObj);
					}
				}

				if (model.variables.includes('camera_control')) {
					if (this.DATA.camera_control) {
						let variableObj = {};
						variableObj[`camera_control_status`] = (this.DATA.camera_control.status == true ? 'Speaking' : 'Not Speaking');
						variableObj[`camera_control_channel`] = this.DATA.camera_control.channel_label;
						variableObj[`camera_control_elevation_angle`] = this.DATA.camera_control.elevation_angle;
						variableObj[`camera_control_rotation_angle`] = this.DATA.camera_control.rotation_angle;
						variableObj[`camera_control_camera_number`] = this.DATA.camera_control.camera_number;
						this.setVariableValues(variableObj);
					}
				}
			}
		}
		catch(error) {
			console.log(error);
			this.log('error', `Error checking variables: ${error.toString()}`)
		}
	}
}