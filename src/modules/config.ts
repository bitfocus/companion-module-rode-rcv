import { Regex, type SomeCompanionConfigField } from '@companion-module/base'

export interface ModuleConfig {
	ipAddress: string
	enableComs: boolean
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'textinput',
			id: 'ipAddress',
			label: 'IP Address',
			width: 6,
			default: '127.0.0.1',
			required: true,
			regex: Regex.IP,
		},
		{
			type: 'checkbox',
			id: 'enableComs',
			label: 'Enable Communications',
			width: 6,
			default: false,
		}
	]
}