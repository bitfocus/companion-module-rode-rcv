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
		ipAddress: ipAddress,
		manual: true,
		model: RCVModel.RCV,
		type: 'RodeCasterVideo',
	};

	// Locate the device with the specified IP address and pull info about it
	let rxDevice = await sendUdpPacket(instance, 'RodeBroadcast', ipAddress);

	if (rxDevice.length > 0) {
		rxDevice.forEach((newDevice) => {
			if (newDevice.ipAddress === ipAddress) {
				ConsoleLog(
					instance,
					`[Discovery] Found new device ${newDevice.name} (${newDevice.serialNo}) at IP ${newDevice.ipAddress}. Model: ${newDevice.model}`,
					LogLevel.INFO,
					true,
				);
				newDevice.manual = false;
				manualDevice = newDevice;
			}
		});
	}

	controllerVariables.model = manualDevice.model;

	instance.setVariableValues({
		device_model: getModelName(manualDevice.model as RCVModel),
		device_name: manualDevice.name || '',
		device_swversion: manualDevice.swVersion || '',
		device_serial: manualDevice.serialNo || '',
		device_ipaddress: manualDevice.ipAddress || '',
	});

	//Refresh UI elements
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
			channelList[audioChannels.RCSyncCombo3]!.icon = 'imgs/new/key_images/audio_sources/combo3';
			channelList[audioChannels.RCSyncCombo3]!.mute_icon = 'imgs/new/key_images/audio_sources/combo3_mute';
			channelList[audioChannels.RCSyncCombo3]!.scmute_icon = 'imgs/new/key_images/audio_sources/combo3_scmute';
			channelList[audioChannels.RCSyncCombo3]!.layout_icon = 'imgs/new/key_images/audio_sources/combo3_layout';
			channelList[audioChannels.RCSyncCombo3]!.layout_mute_icon =
				'imgs/new/key_images/audio_sources/combo3_layout_mute';
			break;
		case RCVSyncDevice.RCPIIDuo:
			syncDeviceName = 'RodeCaster Pro II Duo';
			channelList[audioChannels.RCSyncCombo3]!.title = 'SYNC Headset';
			channelList[audioChannels.RCSyncCombo3]!.icon = 'imgs/new/key_images/audio_sources/headset';
			channelList[audioChannels.RCSyncCombo3]!.mute_icon = 'imgs/new/key_images/audio_sources/headset_mute';
			channelList[audioChannels.RCSyncCombo3]!.scmute_icon = 'imgs/new/key_images/audio_sources/headset_scmute';
			channelList[audioChannels.RCSyncCombo3]!.layout_icon = 'imgs/new/key_images/audio_sources/headset_layout';
			channelList[audioChannels.RCSyncCombo3]!.layout_mute_icon =
				'imgs/new/key_images/audio_sources/headset_layout_mute';
			break;
		default:
			syncDeviceName = 'Unknown Device';
	}

	return syncDeviceName;
}
