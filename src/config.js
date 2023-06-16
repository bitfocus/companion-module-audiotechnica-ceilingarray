const { Regex } = require('@companion-module/base')

module.exports = {
	getConfigFields() {
		return [
			{
				type: 'static-text',
				id: 'info',
				width: 12,
				label: 'Information',
				value: 'This module will connect to an Audio-Technica Beamforming Ceiling Array, such as the ATND-1061',
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'IP Address',
				width: 6,
				default: '192.168.0.1',
				regex: Regex.IP,
			},
			{
				type: 'dropdown',
				label: 'Model',
				id: 'model',
				default: 'atnd-1061',
				choices: this.MODELS,
				width: 12
			},
			{
				type: 'checkbox',
				id: 'polling',
				label: 'Enable Polling',
				width: 3,
				default: true,
			},
			{
				type: 'number',
				id: 'poll_interval',
				label: 'Polling Interval (ms)',
				min: 50,
				max: 30000,
				default: 1000,
				width: 3,
				isVisible: (configValues) => configValues.polling == true,
			},
			{
				type: 'checkbox',
				id: 'status_change_listen',
				label: 'Listen for status changes (over UDP)',
				width: 3,
				default: false,
			},
			{
				type: 'textinput',
				id: 'multicast_address',
				label: 'Multicast Address',
				width: 6,
				default: '239.0.0.100',
				isVisible: (configValues) => configValues.status_change_listen == true,
			},
			{
				type: 'textinput',
				id: 'multicast_port',
				label: 'Multicast Port',
				width: 6,
				default: '17000',
				regex: Regex.PORT,
				isVisible: (configValues) => configValues.status_change_listen == true,
			}
		]
	}
}