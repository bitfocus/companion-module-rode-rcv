import { CompanionPresetDefinitions, combineRgb } from '@companion-module/base';
import { RCVInstance } from '../index.js';
import { filterButtonListByEnum, inputButtonChoices } from '../helpers/commonHelpers.js';
import { buttonList, channelList } from '../modules/constants.js';
import { audioChannels, buttonPressControlType, buttonPressInputsType, buttonPressMediaType, buttonPressOverlayType, buttonPressSceneType, buttonStates, LogLevel, MixerChannels, SubmixChannels } from '../modules/enums.js';
import { ConsoleLog } from '../modules/logger.js';
import { ActionId } from '../actions/actions.js';
import { FeedbackId } from '../feedbacks/feedbacks.js';

const presets: CompanionPresetDefinitions = {};

const Col_Black = combineRgb(0, 0, 0);
const Col_White = combineRgb(255, 255, 255);
const Col_PGM = combineRgb(252, 3, 98);
const Col_PVW = combineRgb(3, 252, 148);
const Col_Standby = combineRgb(79, 79, 79);
const Col_Unavailable = combineRgb(0, 0, 0);
const Col_Recording = combineRgb(252, 3, 98);
const Col_Streaming = combineRgb(252, 3, 98);
const Col_RecordReady = combineRgb(3, 252, 148);
const Col_StreamReady = combineRgb(3, 252, 148);
const Col_Red = combineRgb(255, 0, 0);
const Col_Green = combineRgb(0, 255, 0);
const Col_Yellow = combineRgb(255, 255, 0);
const Col_Orange = combineRgb(255, 165, 0);
const Col_Purple = combineRgb(185, 70, 255);
const Col_LightBlue = combineRgb(0, 255, 255);

export async function SetPresets(instance: RCVInstance): Promise<void> {

	//Populate Presets for Inputs
	for (const [currentKey, currentButton] of Object.entries(filterButtonListByEnum(buttonList, buttonPressInputsType, [buttonPressInputsType.INPUT_FTP]))) {
		const id = currentButton.id + 1;
		const actionId = ActionId.inputs;
		const feedbackId = FeedbackId.input_state;
		const nameVar = `$(${instance.label}:input_${id}_name)`;
		const resolvedVar = await instance.parseVariablesInString(nameVar);

		if (currentButton) {
			
			presets[currentKey] = {
				type: 'button',
				category: currentButton.optgroup,
				name: currentButton.title,
				style: {
					text: currentButton.title,
					size: 'auto',
					color: Col_White,
					bgcolor: Col_Black,
				},
				steps: [
					{
						down: [
							{
								// add an action on down press
								actionId: actionId,
								options: {
									control: currentKey,
									control_var: id,
									variable: false,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: feedbackId,
						options: {
							control: currentKey,
							control_var: id,
							variable: false,
							action: buttonStates.PGM,
						},
						style: {
							color: Col_White,
							bgcolor: Col_PGM,
						},
					},
					{
						feedbackId: feedbackId,
						options: {
							control: currentKey,
							control_var: id,
							variable: false,
							action: buttonStates.PVW,
						},
						style: {
							color: Col_White,
							bgcolor: Col_PVW,
						},
					},
					{
						feedbackId: feedbackId,
						options: {
							control: currentKey,
							control_var: id,
							variable: false,
							action: buttonStates.IDLE,
						},
						style: {
							color: Col_White,
							bgcolor: Col_Standby,
						},
					},
					{
						feedbackId: feedbackId,
						options: {
							control: currentKey,
							control_var: id.toString(),
							variable: false,
							action: buttonStates.UNAVAILABLE,
						},
						style: {
							color: Col_White,
							bgcolor: Col_Unavailable,
						},
					},
				],
			};

			ConsoleLog(instance, `Added preset ${currentKey} to ${currentButton.optgroup} pool.`, LogLevel.INFO);
		}
	};

	//Populate Presets for Scenes
	for (const [currentKey, currentButton] of Object.entries(filterButtonListByEnum(buttonList, buttonPressSceneType))) {
		const id = currentButton.id + 1;
		const actionId = ActionId.scenes;
		const feedbackId = FeedbackId.scenes_state;
		const nameVar = `$(${instance.label}:scene_${id}_name)`;
		const resolvedVar = await instance.parseVariablesInString(nameVar);

		if (currentButton) {
			
			presets[currentKey] = {
				type: 'button',
				category: currentButton.optgroup,
				name: currentButton.title,
				style: {
					text: currentButton.title,
					size: 'auto',
					color: Col_White,
					bgcolor: Col_Black,
				},
				steps: [
					{
						down: [
							{
								// add an action on down press
								actionId: actionId,
								options: {
									control: currentKey,
									control_var: id,
									variable: false,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: feedbackId,
						options: {
							control: currentKey,
							control_var: id,
							variable: false,
							action: buttonStates.PGM,
						},
						style: {
							color: Col_White,
							bgcolor: Col_PGM,
						},
					},
					{
						feedbackId: feedbackId,
						options: {
							control: currentKey,
							control_var: id,
							variable: false,
							action: buttonStates.PVW,
						},
						style: {
							color: Col_White,
							bgcolor: Col_PVW,
						},
					},
					{
						feedbackId: feedbackId,
						options: {
							control: currentKey,
							control_var: id,
							variable: false,
							action: buttonStates.IDLE,
						},
						style: {
							color: Col_White,
							bgcolor: Col_Standby,
						},
					},
					{
						feedbackId: feedbackId,
						options: {
							control: currentKey,
							control_var: id.toString(),
							variable: false,
							action: buttonStates.UNAVAILABLE,
						},
						style: {
							color: Col_White,
							bgcolor: Col_Unavailable,
						},
					},
				],
			};

			ConsoleLog(instance, `Added preset ${currentKey} to ${currentButton.optgroup} pool.`, LogLevel.INFO);
		}
	};

	//Populate Presets for Media
	for (const [currentKey, currentButton] of Object.entries(filterButtonListByEnum(buttonList, buttonPressMediaType))) {
		const id = currentButton.id + 1;
		const actionId = ActionId.media;
		const feedbackId = FeedbackId.media_state;
		const nameVar = `$(${instance.label}:media_${id}_name)`;
		const resolvedVar = await instance.parseVariablesInString(nameVar);

		if (currentButton) {
			
			presets[currentKey] = {
				type: 'button',
				category: currentButton.optgroup,
				name: currentButton.title,
				style: {
					text: currentButton.title,
					size: 'auto',
					color: Col_White,
					bgcolor: Col_Black,
				},
				steps: [
					{
						down: [
							{
								// add an action on down press
								actionId: actionId,
								options: {
									control: currentKey,
									control_var: id,
									variable: false,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: feedbackId,
						options: {
							control: currentKey,
							control_var: id,
							variable: false,
							action: buttonStates.PGM,
						},
						style: {
							color: Col_White,
							bgcolor: Col_PGM,
						},
					},
					{
						feedbackId: feedbackId,
						options: {
							control: currentKey,
							control_var: id,
							variable: false,
							action: buttonStates.PVW,
						},
						style: {
							color: Col_White,
							bgcolor: Col_PVW,
						},
					},
					{
						feedbackId: feedbackId,
						options: {
							control: currentKey,
							control_var: id,
							variable: false,
							action: buttonStates.IDLE,
						},
						style: {
							color: Col_White,
							bgcolor: Col_Standby,
						},
					},
					{
						feedbackId: feedbackId,
						options: {
							control: currentKey,
							control_var: id.toString(),
							variable: false,
							action: buttonStates.UNAVAILABLE,
						},
						style: {
							color: Col_White,
							bgcolor: Col_Unavailable,
						},
					},
				],
			};

			ConsoleLog(instance, `Added preset ${currentKey} to ${currentButton.optgroup} pool.`, LogLevel.INFO);
		}
	};

	//Populate Presets for Overlays
	for (const [currentKey, currentButton] of Object.entries(filterButtonListByEnum(buttonList, buttonPressOverlayType))) {
		const id = currentButton.id + 1;
		const actionId = ActionId.overlays;
		const feedbackId = FeedbackId.overlays_state;
		const nameVar = `$(${instance.label}:overlay_${id}_name)`;
		const resolvedVar = await instance.parseVariablesInString(nameVar);

		if (currentButton) {
			
			presets[currentKey] = {
				type: 'button',
				category: currentButton.optgroup,
				name: currentButton.title,
				style: {
					text: currentButton.title,
					size: 'auto',
					color: Col_White,
					bgcolor: Col_Black,
				},
				steps: [
					{
						down: [
							{
								// add an action on down press
								actionId: actionId,
								options: {
									control: currentKey,
									control_var: id,
									variable: false,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: feedbackId,
						options: {
							control: currentKey,
							control_var: id,
							variable: false,
							action: buttonStates.PGM,
						},
						style: {
							color: Col_White,
							bgcolor: Col_PGM,
						},
					},
					{
						feedbackId: feedbackId,
						options: {
							control: currentKey,
							control_var: id,
							variable: false,
							action: buttonStates.PVW,
						},
						style: {
							color: Col_White,
							bgcolor: Col_PVW,
						},
					},
					{
						feedbackId: feedbackId,
						options: {
							control: currentKey,
							control_var: id,
							variable: false,
							action: buttonStates.IDLE,
						},
						style: {
							color: Col_White,
							bgcolor: Col_Standby,
						},
					},
					{
						feedbackId: feedbackId,
						options: {
							control: currentKey,
							control_var: id.toString(),
							variable: false,
							action: buttonStates.UNAVAILABLE,
						},
						style: {
							color: Col_White,
							bgcolor: Col_Unavailable,
						},
					},
				],
			};

			ConsoleLog(instance, `Added preset ${currentKey} to ${currentButton.optgroup} pool.`, LogLevel.INFO);
		}
	};

	//Add Recording/Streaming
	presets[buttonPressControlType.BUTTON_RECORD] = {
		type: 'button',
		category: buttonList[buttonPressControlType.BUTTON_RECORD].optgroup,
		name: buttonList[buttonPressControlType.BUTTON_RECORD].title,
		style: {
			text: buttonList[buttonPressControlType.BUTTON_RECORD].title,
			size: 'auto',
			color: Col_White,
			bgcolor: Col_Black,
		},
		steps: [
			{
				down: [
					{
						// add an action on down press
						actionId: ActionId.control_buttons,
						options: {
							control: buttonPressControlType.BUTTON_RECORD,
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: FeedbackId.is_recording,
				options: {
					action: 'ready',
				},
				style: {
					color: Col_White,
					bgcolor: Col_RecordReady,
				},
			},
			{
				feedbackId: FeedbackId.is_recording,
				options: {
					action: 'state',
				},
				style: {
					color: Col_White,
					bgcolor: Col_Recording,
				},
			}
		],
	};

	presets[buttonPressControlType.BUTTON_STREAM] = {
		type: 'button',
		category: buttonList[buttonPressControlType.BUTTON_STREAM].optgroup,
		name: buttonList[buttonPressControlType.BUTTON_STREAM].title,
		style: {
			text: buttonList[buttonPressControlType.BUTTON_STREAM].title,
			size: 'auto',
			color: Col_White,
			bgcolor: Col_Black,
		},
		steps: [
			{
				down: [
					{
						// add an action on down press
						actionId: ActionId.control_buttons,
						options: {
							control: buttonPressControlType.BUTTON_STREAM,
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: FeedbackId.is_streaming,
				options: {
					action: 'ready',
				},
				style: {
					color: Col_White,
					bgcolor: Col_StreamReady,
				},
			},
			{
				feedbackId: FeedbackId.is_streaming,
				options: {
					action: 'state',
				},
				style: {
					color: Col_White,
					bgcolor: Col_Streaming,
				},
			}
		],
	};

	presets[buttonPressControlType.BUTTON_FTB] = {
		type: 'button',
		category: 'Controls',
		name: buttonList[buttonPressControlType.BUTTON_FTB].title,
		style: {
			text: buttonList[buttonPressControlType.BUTTON_FTB].title,
			size: 'auto',
			color: Col_White,
			bgcolor: Col_Black,
		},
		steps: [
			{
				down: [
					{
						// add an action on down press
						actionId: ActionId.control_buttons,
						options: {
							control: buttonPressControlType.BUTTON_FTB,
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: FeedbackId.control_state,
				options: {
					control: buttonPressControlType.BUTTON_FTB,
					variable: false,
					action_1: buttonStates.PGM,
				},
				style: {
					color: Col_White,
					bgcolor: Col_PGM,
				},
			},
			{
				feedbackId: FeedbackId.control_state,
				options: {
					control: buttonPressControlType.BUTTON_FTB,
					variable: false,
					action_1: buttonStates.PVW,
				},
				style: {
					color: Col_White,
					bgcolor: Col_PVW,
				},
			},
			{
				feedbackId: FeedbackId.control_state,
				options: {
					control: buttonPressControlType.BUTTON_FTB,
					variable: false,
					action_1: buttonStates.IDLE,
				},
				style: {
					color: Col_White,
					bgcolor: Col_Standby,
				},
			},
			{
				feedbackId: FeedbackId.control_state,
				options: {
					control: buttonPressControlType.BUTTON_FTB,
					variable: false,
					action_1: buttonStates.UNAVAILABLE,
				},
				style: {
					color: Col_White,
					bgcolor: Col_Unavailable,
				},
			},
		],
	};

	//Audio Source

	for (const [channel, channelEntry] of Object.entries(channelList)) {
		const actionId = ActionId.audio_sources;
		const feedbackId = FeedbackId.audio_sources;

		if (channel) {
			presets[`AudioSource_${channel}`] = {
				type: 'button',
				category: 'Audio',
				name: channelEntry.title,
				style: {
					text: channelEntry.title,
					size: 'auto',
					color: Col_White,
					bgcolor: Col_Black,
				},
				steps: [
					{
						down: [
							{
								// add an action on down press
								actionId: actionId,
								options: {
									channel: channel as audioChannels,
									submix: SubmixChannels.LIVE,
									action: 'mute',
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: feedbackId,
						options: {
							channel: channel as audioChannels,
							submix: SubmixChannels.LIVE,
							action: 'live',
							comparison: 'lessthanequal',
							volume_value: '6',
							variable: false
						},
						style: {
							bgcolor: Col_Red,
							color: Col_White,
						},
					},
					{
						feedbackId: feedbackId,
						options: {
							channel: channel as audioChannels,
							submix: SubmixChannels.LIVE,
							action: 'live',
							comparison: 'lessthanequal',
							volume_value: '5',
							variable: false
						},
						style: {
							bgcolor: Col_Yellow,
							color: Col_Black,
						},
					},
					{
						feedbackId: feedbackId,
						options: {
							channel: channel as audioChannels,
							submix: SubmixChannels.LIVE,
							action: 'live',
							comparison: 'lessthan',
							volume_value: '0',
							variable: false
						},
						style: {
							bgcolor: Col_Green,
							color: Col_White,
						},
					},
					{
						feedbackId: feedbackId,
						options: {
							channel: channel as audioChannels,
							submix: SubmixChannels.LIVE,
							action: 'live',
							comparison: 'lessthanequal',
							volume_value: '-59',
							variable: false
						},
						style: {
							bgcolor: Col_Black,
							color: Col_White,
						},
					},
				],
			};

			ConsoleLog(instance, `Added preset ${channelEntry.title} to Audio Sources pool.`, LogLevel.INFO);
		}
	};

	instance.setPresetDefinitions(presets);
}