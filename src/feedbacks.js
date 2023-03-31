const { combineRgb } = require('@companion-module/base')

module.exports = {
	initFeedbacks() {
		let feedbacks = {}

		let model = this.MODELS.find((model) => model.id == this.config.model);

		if (model) { //push model specific feedbacks
			if (model.feedbacks.includes('phantompower')) {
				feedbacks['phantom_power'] = {
					type: 'boolean',
					name: 'Phantom Power is On',
					description: 'Show feedback for Phantom Power State',
					options: [
						{
							type: 'dropdown',
							label: 'Input Channel',
							id: 'input',
							default: model.input_channels[0].id,
							choices: model.input_channels
						}
					],
					defaultStyle: {
						color: combineRgb(0, 0, 0),
						bgcolor: combineRgb(255, 0, 0)
					},
					callback: (event) => {
						let opt = event.options
						let inputChannelSettingsObj = this.DATA.input_channel_settings.find((CHANNEL) => CHANNEL.id == opt.input);

						if (inputChannelSettingsObj) {
							if (inputChannelSettingsObj.phantomPower == true) {
								return true;
							}
						}
						
						return false
					},
				}
			}

			if (model.feedbacks.includes('lowcut')) {
				feedbacks['lowcut'] = {
					type: 'boolean',
					name: 'Low Cut is On',
					description: 'Show feedback for Low Cut State',
					options: [
						{
							type: 'dropdown',
							label: 'Input Channel',
							id: 'input',
							default: model.input_channels[0].id,
							choices: model.input_channels
						}
					],
					defaultStyle: {
						color: combineRgb(0, 0, 0),
						bgcolor: combineRgb(255, 0, 0)
					},
					callback: (event) => {
						let opt = event.options
						let inputChannelSettingsObj = this.DATA.input_channel_settings.find((CHANNEL) => CHANNEL.id == opt.input);

						if (inputChannelSettingsObj) {
							if (inputChannelSettingsObj.lowCut == true) {
								return true;
							}
						}
						
						return false
					},
				}
			}

			if (model.feedbacks.includes('aec')) {
				feedbacks['aec'] = {
					type: 'boolean',
					name: 'AEC is On',
					description: 'Show feedback for AEC State',
					options: [
						{
							type: 'dropdown',
							label: 'Input Channel',
							id: 'input',
							default: model.input_channels[0].id,
							choices: model.input_channels
						}
					],
					defaultStyle: {
						color: combineRgb(0, 0, 0),
						bgcolor: combineRgb(255, 0, 0)
					},
					callback: (event) => {
						let opt = event.options
						let inputChannelSettingsObj = this.DATA.input_channel_settings.find((CHANNEL) => CHANNEL.id == opt.input);

						if (inputChannelSettingsObj) {
							if (inputChannelSettingsObj.aec == true) {
								return true;
							}
						}
						
						return false
					},
				}
			}

			if (model.feedbacks.includes('smartmix')) {
				feedbacks['smartmix'] = {
					type: 'boolean',
					name: 'Smart Mix is On',
					description: 'Show feedback for Smart Mix State',
					options: [
						{
							type: 'dropdown',
							label: 'Input Channel',
							id: 'input',
							default: model.input_channels[0].id,
							choices: model.input_channels
						}
					],
					defaultStyle: {
						color: combineRgb(0, 0, 0),
						bgcolor: combineRgb(255, 0, 0)
					},
					callback: (event) => {
						let opt = event.options
						let inputChannelSettingsObj = this.DATA.input_channel_settings.find((CHANNEL) => CHANNEL.id == opt.input);

						if (inputChannelSettingsObj) {
							if (inputChannelSettingsObj.smartMix == true) {
								return true;
							}
						}
						
						return false
					},
				}
			}

			if (model.feedbacks.includes('input_mute')) {
				feedbacks['input_mute'] = {
					type: 'boolean',
					name: 'Input Mute is On',
					description: 'Show feedback for Input Mute State',
					options: [
						{
							type: 'dropdown',
							label: 'Input Channel',
							id: 'input',
							default: model.input_channels[0].id,
							choices: model.input_channels
						}
					],
					defaultStyle: {
						color: combineRgb(0, 0, 0),
						bgcolor: combineRgb(255, 0, 0)
					},
					callback: (event) => {
						let opt = event.options
						let inputGainLevelObj = this.DATA.input_gain_levels.find((CHANNEL) => CHANNEL.id == opt.input);

						if (inputGainLevelObj) {
							if (inputGainLevelObj.mute == true) {
								return true;
							}
						}
						
						return false
					},
				}
			}

			if (model.feedbacks.includes('output_mute')) {
				feedbacks['output_mute'] = {
					type: 'boolean',
					name: 'Output Mute is On',
					description: 'Show feedback for Output Mute State',
					options: [
						{
							type: 'dropdown',
							label: 'Output Channel',
							id: 'output',
							default: model.output_channels[0].id,
							choices: model.output_channels
						}
					],
					defaultStyle: {
						color: combineRgb(0, 0, 0),
						bgcolor: combineRgb(255, 0, 0)
					},
					callback: (event) => {
						let opt = event.options
						let outputMuteObj = this.DATA.output_mutes.find((CHANNEL) => CHANNEL.id == opt.output);

						if (outputMuteObj) {
							if (outputMuteObj.mute == true) {
								return true;
							}
						}
						
						return false
					},
				}
			}

			if (model.feedbacks.includes('mute')) {
				feedbacks['mute'] = {
					type: 'boolean',
					name: 'Device Mute is On',
					description: 'Show feedback for Device Mute State',
					options: [
					],
					defaultStyle: {
						color: combineRgb(0, 0, 0),
						bgcolor: combineRgb(255, 0, 0)
					},
					callback: (event) => {
						let opt = event.options

						if (this.DATA.mute == true) {
							return true;
						}
						
						return false
					},
				}
			}
		}

		this.setFeedbackDefinitions(feedbacks)
	}
}