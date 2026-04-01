import { sendUdpPacket } from '../modules/oscController.js';
import { RCVInstance } from '../index';
import { ConsoleLog } from '../modules/logger.js';
import { channelList, controllerVariables } from '../modules/constants.js';
import { audioChannels, LogLevel, RCVModel, RCVSyncDevice } from '../modules/enums.js';
import { RcvDeviceInfo } from '../modules/interfaces.js';
import { UpdateActions } from '../actions/actions.js';
import { UpdateFeedbacks } from '../feedbacks/feedbacks.js';
import { UpdateVariableDefinitions } from '../variables/variables.js';
import { SetPresets } from '../presets/presets.js';

export async function getRCVInfo(instance: RCVInstance, ipAddress: string): Promise<void> {
	if (!instance.globalSettings.oscConnected) return;

	let manualDevice: RcvDeviceInfo = {
		name: `RØDECaster Video (${ipAddress})`,
		serialNo: 'manual',
		swVersion: 'Unknown',
		ipAddress,
		manual: true,
		model: RCVModel.RCV,
		type: 'RodeCasterVideo',
	};

	try {
		const rxDevices = await sendUdpPacket(instance, 'RodeBroadcast', ipAddress);

		// Connection may have dropped while waiting for UDP response
		if (!instance.globalSettings.oscConnected) {
			ConsoleLog(instance, `Skipping RCV info update because OSC is no longer connected`, LogLevel.WARN, false);
			return;
		}

		const matchedDevice = rxDevices.find((device) => device.ipAddress === ipAddress);

		if (matchedDevice) {
			ConsoleLog(
				instance,
				`[Discovery] Found device ${matchedDevice.name} (${matchedDevice.serialNo}) at IP ${matchedDevice.ipAddress}. Model: ${matchedDevice.model}`,
				LogLevel.INFO,
				true,
			);

			manualDevice = {
				...matchedDevice,
				manual: false,
			};
		} else {
			ConsoleLog(
				instance,
				`No UDP discovery response received from ${ipAddress}. Using fallback manual device info.`,
				LogLevel.WARN,
				false,
			);
		}
	} catch (err: any) {
		ConsoleLog(
			instance,
			`Failed to retrieve device info from ${ipAddress} via UDP: ${err?.message ?? String(err)}`,
			LogLevel.ERROR,
			false,
		);
	}

	controllerVariables.model = manualDevice.model;

	instance.setVariableValues({
		device_model: getModelName(manualDevice.model as RCVModel),
		device_name: manualDevice.name || '',
		device_swversion: manualDevice.swVersion || '',
		device_serial: manualDevice.serialNo || '',
		device_ipaddress: manualDevice.ipAddress || '',
	});

	// Refresh UI elements
	UpdateActions(instance);
	UpdateFeedbacks(instance);
	SetPresets(instance);
}

/**
 * Returns the RCV Model Name
 */
function getModelName(model: RCVModel) {
	switch (model) {
		case RCVModel.RCV:
			return 'RodeCaster Video';
		case RCVModel.RCVS:
			return 'RodeCasterVideo S';
		case RCVModel.RCVC:
			return 'RodeCasterVideo Core';
		default:
			return 'Unknown';
	}
}

/**
 * Sets the environment to reflect currently connected SYNC Device
 */
export function setSyncDevice(pid: RCVSyncDevice) {
	let syncDeviceName = 'No Device';

	switch (pid) {
		case RCVSyncDevice.RCPII:
			syncDeviceName = 'RodeCaster Pro II';
			channelList[audioChannels.RCSyncCombo3]!.title = 'SYNC Combo 3';
			channelList[audioChannels.RCSyncCombo3]!.icon = 'imgs/audio_sources/combo3';
			channelList[audioChannels.RCSyncCombo3]!.mute_icon = 'imgs/audio_sources/combo3_mute';
			channelList[audioChannels.RCSyncCombo3]!.scmute_icon = 'imgs/audio_sources/combo3_scmute';
			channelList[audioChannels.RCSyncCombo3]!.layout_icon = 'imgs/audio_sources/combo3_layout';
			channelList[audioChannels.RCSyncCombo3]!.layout_mute_icon = 'imgs/audio_sources/combo3_layout_mute';
			break;
		case RCVSyncDevice.RCPIIDuo:
			syncDeviceName = 'RodeCaster Pro II Duo';
			channelList[audioChannels.RCSyncCombo3]!.title = 'SYNC Headset';
			channelList[audioChannels.RCSyncCombo3]!.icon = 'imgs/audio_sources/headset';
			channelList[audioChannels.RCSyncCombo3]!.mute_icon = 'imgs/audio_sources/headset_mute';
			channelList[audioChannels.RCSyncCombo3]!.scmute_icon = 'imgs/audio_sources/headset_scmute';
			channelList[audioChannels.RCSyncCombo3]!.layout_icon = 'imgs/audio_sources/headset_layout';
			channelList[audioChannels.RCSyncCombo3]!.layout_mute_icon = 'imgs/audio_sources/headset_layout_mute';
			break;
		default:
			syncDeviceName = 'Unknown Device';
	}

	return syncDeviceName;
}
