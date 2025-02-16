import { CompanionPresetDefinitions, combineRgb } from '@companion-module/base';
import { RCVInstance } from '../index.js';
import { filterButtonListByEnum } from '../helpers/commonHelpers.js';
import { buttonList, channelList, Col_Black, Col_LightBlue, Col_PGM, Col_PVW, Col_Recording, Col_RecordReady, Col_Red, Col_Standby, Col_Streaming, Col_StreamReady, Col_Unavailable, Col_White } from '../modules/constants.js';
import { audioChannels, buttonPressControlType, buttonPressInputsType, buttonPressMediaType, buttonPressOverlayType, buttonPressSceneType, buttonStates, LogLevel, MixerChannels, SubmixChannels, transitionType } from '../modules/enums.js';
import { ConsoleLog } from '../modules/logger.js';
import { ActionId } from '../actions/actions.js';
import { FeedbackId } from '../feedbacks/feedbacks.js';

const presets: CompanionPresetDefinitions = {};
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
					size: '14',
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
					size: '14',
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
					size: '14',
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
					size: '14',
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
			size: '14',
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
			size: '14',
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
			size: '14',
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

	presets[buttonPressControlType.BUTTON_CUT] = {
		type: 'button',
		category: 'Controls',
		name: buttonList[buttonPressControlType.BUTTON_CUT].title,
		style: {
			text: buttonList[buttonPressControlType.BUTTON_CUT].title,
			size: '14',
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
							control: buttonPressControlType.BUTTON_CUT,
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
		
	};

	presets[buttonPressControlType.BUTTON_AUTO] = {
		type: 'button',
		category: 'Controls',
		name: buttonList[buttonPressControlType.BUTTON_AUTO].title,
		style: {
			text: buttonList[buttonPressControlType.BUTTON_AUTO].title,
			size: '14',
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
							control: buttonPressControlType.BUTTON_AUTO,
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
					control: buttonPressControlType.BUTTON_AUTO,
					variable: false,
					action_2: buttonStates.ACTIVE,
				},
				style: {
					color: Col_White,
					bgcolor: Col_PGM,
				},
			},
			{
				feedbackId: FeedbackId.auto_switching,
				options: {
					action: 'enabled',
				},
				style: {
					color: Col_White,
					bgcolor: Col_LightBlue,
				},
			},
		]
	};

	presets['AutoSwitching'] = {
		type: 'button',
		category: 'Controls',
		name: 'Auto Switching',
		style: {
			text: 'Auto Switching',
			size: '14',
			color: Col_White,
			bgcolor: Col_Black,
		},
		steps: [
			{
				down: [
					{
						// add an action on down press
						actionId: ActionId.auto_switching,
						options: {
							action: 'toggle',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: FeedbackId.auto_switching,
				options: {
					action: 'enabled',
				},
				style: {
					color: Col_White,
					bgcolor: Col_LightBlue,
				},
			},
		],
		
	};

	presets['ChangeTransition'] = {
		type: 'button',
		category: 'Controls',
		name: 'Change Transition',
		style: {
			text: 'Change Transition',
			size: '14',
			color: Col_White,
			bgcolor: Col_Black,
		},
		steps: [
			{
				down: [
					{
						// add an action on down press
						actionId: ActionId.transitions,
						options: {
							action: 'transition',
							transition: transitionType.FADE
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
		
	};
	

	//Audio Source

	for (const [channel, channelEntry] of Object.entries(channelList)) {
		const actionId = ActionId.audio_sources;

		if (channel) {
			presets[`AudioSource_${channel}`] = {
				type: 'button',
				category: 'Audio',
				name: channelEntry.title,
				style: {
					text: channelEntry.title,
					size: '14',
					alignment: 'left:top',
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
						feedbackId: FeedbackId.meters,
						options: {
							channel: channel as audioChannels,
							orientation: 'vertical',
							position: 'br'
						}
					},
					{
						feedbackId: FeedbackId.audio_sources,
						options: {
							channel: channel as audioChannels,
							submix: SubmixChannels.LIVE,
							action: 'mute',
							muted_value: true
						},
						style: {
							bgcolor: Col_Red,
							color: Col_Black,
						},
					},
				],
			};

			ConsoleLog(instance, `Added preset ${channelEntry.title} to Audio Sources pool.`, LogLevel.INFO);
		}
	};

	instance.setPresetDefinitions(presets);
}