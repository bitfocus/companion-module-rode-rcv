import path from 'path';
import { AudioAudioSourceCh } from '../modules/interfaces.js';
import {
	buttonList,
	buttonList_Models,
	channelList,
	channelList_Models,
	controllerVariables,
	mixList,
	mixList_Models,
	transitionsList,
	mediaSources,
	channelList_Sync,
} from '../modules/constants.js';
import {
	buttonPressControlType,
	buttonPressInputsType,
	buttonPressSceneType,
	buttonPressMediaType,
	buttonPressOverlayType,
	transitionType,
	audioChannels,
	mediaType,
	RCVModel,
	RCVSyncDevice,
} from '../modules/enums.js';

/**
 * Converts a float value from the range 0.0 to 1.0 to a percentage (0 to 100) with no decimals.
 *
 * @param {number} value - The input float value in the range 0.0 to 1.0.
 * @returns {number} - The converted percentage value (0 to 100) with no decimals.
 */
export function convertFloatToPercentage(value: number): number {
	// Ensure the input value is within the expected range
	if (value < 0) value = 0;
	if (value > 1) value = 1;

	// Convert the value to a percentage and round to the nearest integer
	return Math.round(value * 100);
}

/**
 * Interpolates a value from the range 0-255 to the range 0-100, rounding to the nearest integer.
 *
 * @param {number} value - The input value in the range 0-255.
 * @returns {number} - The interpolated value in the range 0-100, rounded to the nearest integer.
 */
export function interpolate255To100(value: number): number {
	// Ensure the input value is within the expected range
	if (value < 0) value = 0;
	if (value > 255) value = 255;

	// Interpolate the value and round to the nearest integer
	return Math.round((value / 255) * 100);
}

/**
 * Converts a linear value (0 to 100) to a decibel value based between points
 *
 * @param {number} value - The input int value in the range 0 to 100.
 * @returns {string} - The corresponding dB value with no decimal place.
 */
export function mapRangeToDb(value: any, minOut = -20, maxOut = 20) {
	const minIn = 0,
		maxIn = 100;

	// Mapping formula
	const mappedValue = minOut + ((value - minIn) / (maxIn - minIn)) * (maxOut - minOut);

	// Rounding to the nearest whole number
	return Math.round(mappedValue);
}

/**
 * Creates a debounced version of the provided function.
 * The debounced function delays invoking the function until after `wait` milliseconds have elapsed
 * since the last time the debounced function was invoked.
 *
 * @param func - The function to debounce.
 * @param wait - The number of milliseconds to delay.
 * @returns A debounced version of the provided function.
 */
export function debounce(func: Function, wait: number) {
	let timeout: NodeJS.Timeout;
	return function (...args: any[]) {
		clearTimeout(timeout);
		timeout = setTimeout(() => func.apply(this, args), wait);
	};
}

/**
 * Formats the command string for setting the transition time.
 * @param fadeDuration The fade duration.
 */
export function formatTransitionCommand(fadeDuration: string): string {
	const command = `/show/transition_time\x00\x00\x00,s\x00${fadeDuration}`;
	const paddingLength = 8 - fadeDuration.length;
	const padding = '\x00'.repeat(paddingLength);
	return `${command}${padding}`;
}

/**
 * Formats milliseconds as seconds to 1 decimal place
 * @param milliseconds Integer for milliseconds
 * */
export function convertMillisecondsToSeconds(milliseconds: number) {
	const seconds = milliseconds / 1000;
	return seconds.toFixed(1); // Returns a string
}

export function decodeMeters(buffer: Buffer) {
	const meterData = [];
	let offset = 0;

	// Constants
	const numChannels = 27;
	const numStereoPairs = 2;
	const numValuesPerPair = 2;
	const floatSize = 4;

	// Calculate the total number of expected float values
	const totalExpectedValues = numChannels * numStereoPairs * numValuesPerPair;

	// Calculate the total expected size in bytes
	const totalExpectedSize = totalExpectedValues * floatSize;

	// Check if the buffer contains enough data
	if (buffer.length < totalExpectedSize) {
		console.warn(`Buffer length (${buffer.length}) is less than expected data size (${totalExpectedSize})`);
		// Handle short data case, perhaps continue or adjust processing logic
	}

	// Parsing loop
	while (offset + floatSize <= buffer.length) {
		const value = buffer.readFloatLE(offset);
		meterData.push(value);
		offset += floatSize;
	}

	console.log('Decoded meter data:', meterData);
	return meterData;
}

export function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// Define a type guard to check if a property is a key of AudioSubmixCh
export function isSubmixProperty(prop: any): prop is keyof AudioAudioSourceCh {
	return ['submix', 'level', 'muted', 'disabled', 'linked'].includes(prop);
}

export function isValidIPAddress(ip: string): boolean {
	// Regular expression for validating IPv4
	const ipv4Regex =
		/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

	// Regular expression for validating IPv6
	const ipv6Regex = /^(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}$/;

	// Check if the input is a valid IPv4 or IPv6 address
	return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

type ButtonList = typeof buttonList;
type ButtonEnum =
	| typeof buttonPressControlType
	| typeof buttonPressInputsType
	| typeof buttonPressSceneType
	| typeof buttonPressMediaType
	| typeof buttonPressOverlayType;

export function filterButtonListByEnum(
	buttonList: Partial<ButtonList>,
	buttonEnum: ButtonEnum,
	filterOut: (keyof ButtonList)[] = [],
): Partial<ButtonList> {
	// Extract the values from the provided enum
	const enumValues = Object.values(buttonEnum);

	// Filter buttonList to include only entries with keys in enumValues
	const filteredButtons = Object.keys(buttonList)
		.filter((key) => enumValues.includes(key as keyof ButtonEnum))
		// Further filter out the keys that are in the filterOut array
		.filter((key) => !filterOut.includes(key as keyof ButtonList))
		.reduce((obj, key) => {
			obj[key as keyof ButtonList] = buttonList[key as keyof ButtonList];
			return obj;
		}, {} as Partial<ButtonList>);

	return filteredButtons;
}

export function filterButtonsListByEnum(
	buttonList: ButtonList,
	buttonEnum: ButtonEnum,
	filterOut: (keyof ButtonList)[] = [],
): [string, ButtonList[keyof ButtonList]][] {
	// Extract the values from the provided enum
	const enumValues = Object.values(buttonEnum);

	// Filter buttonList to include only entries with keys in enumValues
	return (
		Object.keys(buttonList)
			.filter((key) => enumValues.includes(key as keyof ButtonEnum))
			// Further filter out the keys that are in the filterOut array
			.filter((key) => !filterOut.includes(key as keyof ButtonList))
			.map((key) => [key, buttonList[key as keyof ButtonList]] as [string, ButtonList[keyof ButtonList]])
	);
}

export function evaluateComparison(receivedValue: number, targetValue: number, comparison: string) {
	switch (comparison) {
		case 'equal':
			return receivedValue === targetValue;
		case 'greaterthan':
			return receivedValue > targetValue;
		case 'lessthan':
			return receivedValue < targetValue;
		case 'greaterthanequal':
			return receivedValue >= targetValue;
		case 'lessthanequal':
			return receivedValue <= targetValue;
		case 'notequal':
			return receivedValue !== targetValue;
		default:
			return false;
	}
}

export function msToFrames(ms: number): number {
	const frames = Math.round(ms / 40);
	return frames;
}

export function framesToMs(frames: number): number {
	const ms = frames * 40;
	return ms;
}

export function getKeyByValue<T>(enumObj: T, value: string): string | undefined {
	for (const [key, val] of Object.entries(enumObj)) {
		if (val === value) {
			return key;
		}
	}
	return undefined; // Or handle it as needed
}

/**
 * Type guard to check if a given transition is a valid transitionType.
 * @param {any} transition - The transition to check.
 * @returns {boolean} - True if the transition is a valid transitionType, false otherwise.
 */
export function isValidTransition(transition: any): transition is transitionType {
	return Object.values(transitionType).includes(transition);
}

export function getButtons(buttonEnum: ButtonEnum) {
	const buttonListFilter = new Set(buttonList_Models[controllerVariables.model] ?? []);
	const _buttonList: Partial<ButtonList> = Object.fromEntries(
		Object.entries(buttonList).filter(([key]) => !buttonListFilter.has(key)),
	);

	return Object.entries(filterButtonListByEnum(_buttonList, buttonEnum));
}

export function getButtonChoices(buttonEnum: ButtonEnum) {
	return getButtons(buttonEnum).map(([key, button]) => ({
		id: key,
		label: button.title,
	}));
}

export function getkeySourceButtons() {
	const buttonListFilter = new Set(buttonList_Models[controllerVariables.model] ?? []);
	const _buttonList: Partial<ButtonList> = Object.fromEntries(
		Object.entries(buttonList).filter(([key]) => !buttonListFilter.has(key)),
	);

	return Object.entries(filterButtonListByEnum(_buttonList, buttonPressInputsType, [buttonPressInputsType.INPUT_FTP]));
}

export function getkeySourceChoices() {
	return getkeySourceButtons().map(([key, button]) => ({
		id: key,
		label: button.title,
	}));
}

export function getaudioMixesChoices() {
	const mixListFilter = new Set(mixList_Models[controllerVariables.model] ?? []);
	const _mixList: Partial<ButtonList> = Object.fromEntries(
		Object.entries(mixList).filter(([key]) => !mixListFilter.has(key)),
	);

	return Object.entries(_mixList).map(([key, button]) => ({
		id: key,
		label: button.title,
	}));
}

export function getaudioChannels() {
	const modelBlacklist = channelList_Models[controllerVariables.model] ?? [];
	const syncBlacklist = channelList_Sync[controllerVariables.sync_device] ?? [];

	const blacklist = new Set<audioChannels>([...modelBlacklist, ...syncBlacklist]);

	const filteredChannelList = Object.entries(channelList).filter(([key]) => !blacklist.has(key as audioChannels));

	return filteredChannelList as Array<[audioChannels, (typeof channelList)[audioChannels]]>;
}

export function getaudioChannelsChoices() {
	return getaudioChannels().map(([key, button]) => ({
		id: key,
		label: button.title,
	}));
}

export function isSyncChannel(channel: unknown): channel is audioChannels {
	return channelList_Sync[RCVSyncDevice.NoDevice].includes(channel as audioChannels);
}

export const allSyncChannelsExpr = JSON.stringify(channelList_Sync[RCVSyncDevice.NoDevice]);

export const transitionChoices = Object.entries(transitionsList).map(([key, transition]) => ({
	id: key,
	label: transition.title,
}));

export const getMediaSourcesChoices = (...filterTypes: mediaType[]) => {
	return Object.entries(mediaSources)
		.filter(([_, source]) => {
			// No filters → include everything
			if (filterTypes.length === 0) return true;

			// Include if source.mediaType matches any provided type
			return source.mediaType !== undefined && filterTypes.includes(source.mediaType);
		})
		.map(([_, source]) => ({
			id: source.filename,
			label: source.name,
		}));
};

export function getroutingOutputChoices() {
	switch (controllerVariables.model) {
		case RCVModel.RCVS: // RCVS
			return [
				{ id: 'outputA', label: 'HDMI A' },
				{ id: 'outputUVC1', label: 'USB 1' },
				{ id: 'outputNDI1', label: 'NDI' },
			];
		case RCVModel.RCVC: // RCVC
			return [
				{ id: 'outputA', label: 'HDMI A' },
				{ id: 'outputUVC1', label: 'USB 1' },
				{ id: 'outputNDI1', label: 'NDI' },
			];
		case RCVModel.RCV: // RCV
		default:
			return [
				{ id: 'outputA', label: 'HDMI A' },
				{ id: 'outputB', label: 'HDMI B' },
				{ id: 'outputUVC1', label: 'USB 1' },
				{ id: 'outputNDI1', label: 'NDI' },
			];
	}
}

export function getroutingInputChoices() {
	switch (controllerVariables.model) {
		case RCVModel.RCVS: // RCVS
			return [
				{ id: 'program', label: 'Program' },
				{ id: 'preview', label: 'Preview' },
				{ id: 'multi', label: 'Multiview' },
				{ id: 'camera1', label: 'Camera 1' },
				{ id: 'camera2', label: 'Camera 2' },
				{ id: 'camera3', label: 'Camera 3' },
				{ id: 'camera4', label: 'Camera 4' },
			];
		case RCVModel.RCVC: // RCVC
			return [
				{ id: 'program', label: 'Program' },
				{ id: 'preview', label: 'Preview' },
				{ id: 'multi', label: 'Multiview' },
				{ id: 'camera1', label: 'Camera 1' },
				{ id: 'camera2', label: 'Camera 2' },
				{ id: 'camera3', label: 'Camera 3' },
				{ id: 'camera4', label: 'Camera 4' },
			];
		case RCVModel.RCV: // RCV
		default:
			return [
				{ id: 'program', label: 'Program' },
				{ id: 'preview', label: 'Preview' },
				{ id: 'multi', label: 'Multiview' },
				{ id: 'camera1', label: 'Camera 1' },
				{ id: 'camera2', label: 'Camera 2' },
				{ id: 'camera3', label: 'Camera 3' },
				{ id: 'camera4', label: 'Camera 4' },
				{ id: 'camera5', label: 'Camera 5' },
				{ id: 'camera6', label: 'Camera 6' },
			];
	}
}

export function getsourceInputChoices() {
	switch (controllerVariables.model) {
		case RCVModel.RCVS: // RCVS
			return [
				{ id: 'none', label: 'None' },
				{ id: 'hdmi1', label: 'HDMI 1' },
				{ id: 'hdmi2', label: 'HDMI 2' },
				{ id: 'hdmi3', label: 'HDMI 3' },
				{ id: 'uvc', label: 'USB 4' },
				{ id: 'network1', label: 'Network 1' },
				{ id: 'network2', label: 'Network 2' },
				{ id: 'network3', label: 'Network 3' },
				{ id: 'network4', label: 'Network 4' },
			];
		case RCVModel.RCVC: // RCVC
			return [
				{ id: 'none', label: 'None' },
				{ id: 'hdmi1', label: 'HDMI 1' },
				{ id: 'hdmi2', label: 'HDMI 2' },
				{ id: 'hdmi3', label: 'HDMI 3' },
				{ id: 'uvc', label: 'USB 4' },
				{ id: 'network1', label: 'Network 1' },
				{ id: 'network2', label: 'Network 2' },
				{ id: 'network3', label: 'Network 3' },
				{ id: 'network4', label: 'Network 4' },
			];
		case RCVModel.RCV: // RCV
		default:
			return [
				{ id: 'none', label: 'None' },
				{ id: 'hdmi1', label: 'HDMI 1' },
				{ id: 'hdmi2', label: 'HDMI 2' },
				{ id: 'hdmi3', label: 'HDMI 3' },
				{ id: 'hdmi4', label: 'HDMI 4' },
				{ id: 'usb4', label: 'USB 4' },
				{ id: 'usb5', label: 'USB 5' },
				{ id: 'network1', label: 'Network 1' },
				{ id: 'network2', label: 'Network 2' },
				{ id: 'network3', label: 'Network 3' },
				{ id: 'network4', label: 'Network 4' },
			];
	}
}

/**
 * Determines if a given filename represents an audio or video file
 * based on its file extension.
 *
 * @param filename - The filename or path as a string.
 * @returns A string indicating the file type: "audio", "video", "image", or "unknown".
 */
export function getMediaType(filename: string): mediaType.AUDIO | mediaType.VIDEO | mediaType.IMAGE | mediaType.OTHER {
	// Extract the file extension from the filename
	const extension = filename.split('.').pop()?.toLowerCase();

	// Define supported audio and video extensions
	const audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'];
	const videoExtensions = ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'];
	const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'svg', 'heic', 'psd'];

	// Check if the extension matches any audio or video type
	if (audioExtensions.includes(extension ?? '')) {
		return mediaType.AUDIO;
	} else if (videoExtensions.includes(extension ?? '')) {
		return mediaType.VIDEO;
	} else if (imageExtensions.includes(extension ?? '')) {
		return mediaType.IMAGE;
	} else {
		return mediaType.OTHER;
	}
}
