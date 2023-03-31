module.exports = {
	MODELS: 
	[
		{ id: 'atnd-1061', label: 'ATND-1061',
			actions: [
				'input_gain_level',
				'input_channel_settings',
				'smart_mix',
				'output_level',
				'output_mute',
				'output_channel_settings',
				'header_color',
				'call_preset',
				'mute'
			],
			feedbacks: [
				'input_gain_level',
				'led_setting',
				'header_color',
				'mute'
			],
			variables: [
				'input_gain_level',
				'input_channel_settings',
				'smart_mix',
				'output_level',
				'output_mute',
				'output_channel_settings',
				'mute',
				'firmware_version',
				'header_color',
				'camera_control'
			],
			input_channels: [
				{ id: '0', label: 'Beam Channel 1', variableId: 'beamchannel1'},
				{ id: '1', label: 'Beam Channel 2', variableId: 'beamchannel2'},
				{ id: '2', label: 'Beam Channel 3', variableId: 'beamchannel3'},
				{ id: '3', label: 'Beam Channel 4', variableId: 'beamchannel4'},
				{ id: '4', label: 'Beam Channel 5', variableId: 'beamchannel5'},
				{ id: '5', label: 'Beam Channel 6', variableId: 'beamchannel6'},
				{ id: '6', label: 'Analog Input', variableId: 'analoginput'},
			],
			output_channels: [
				{ id: '0', label: 'Analog Out', variableId: 'analogout'},
				{ id: '1', label: 'Auto Mix', variableId: 'automix'},
			],
			data_request: [
				'input_gain_level',
				'input_channel_settings',
				'smart_mix',
				'output_level',
				'output_mute',
				'output_channel_settings',
				'mute',			
				'firmware_version',
				'header_color',
			]
		}
	]
}