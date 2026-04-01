import { CompanionPresetDefinitions, combineRgb } from '@companion-module/base';
import { RCVInstance } from '../index.js';
import { getaudioChannels, getButtons, getkeySourceButtons } from '../helpers/commonHelpers.js';
import {
	buttonList,
	channelList,
	Col_Black,
	Col_LightBlue,
	Col_PGM,
	Col_PVW,
	Col_Recording,
	Col_RecordReady,
	Col_Red,
	Col_Standby,
	Col_Streaming,
	Col_StreamReady,
	Col_Unavailable,
	Col_White,
	controllerVariables,
	DEFAULT_BLACK_PNG64,
} from '../modules/constants.js';
import {
	audioChannels,
	buttonPressControlType,
	buttonPressInputsType,
	buttonPressMediaType,
	buttonPressOverlayType,
	buttonPressSceneType,
	buttonStates,
	LogLevel,
	SubmixChannels,
	transitionType,
} from '../modules/enums.js';
import { ConsoleLog } from '../modules/logger.js';
import { ActionId } from '../actions/actions.js';
import { FeedbackId } from '../feedbacks/feedbacks.js';
import { svgPathToCachedPng64 } from '../helpers/imageHelpers.js';

let presets: CompanionPresetDefinitions = {};
export async function SetPresets(instance: RCVInstance): Promise<void> {
	presets = {};

	//Populate Presets for Inputs
	for (const [currentKey, currentButton] of getkeySourceButtons()) {
		const id = currentButton.id + 1;
		const actionId = ActionId.inputs;
		const feedbackId = FeedbackId.input_state;
		const nameVar = `$(${instance.label}:input_${id}_name)`;

		if (currentButton) {
			presets[currentKey] = {
				type: 'button',
				category: currentButton.optgroup,
				name: currentButton.title,
				style: {
					text: '',
					size: '14',
					color: Col_White,
					bgcolor: Col_Black,
					png64: await svgPathToCachedPng64(instance, currentButton.state0_image),
					pngalignment: 'center:center',
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
							png64: await svgPathToCachedPng64(instance, currentButton.state1_image),
							pngalignment: 'center:center',
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
							png64: await svgPathToCachedPng64(instance, currentButton.state2_image),
							pngalignment: 'center:center',
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
							png64: await svgPathToCachedPng64(instance, currentButton.state0_image),
							pngalignment: 'center:center',
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
							png64: await svgPathToCachedPng64(instance, currentButton.state3_image),
							pngalignment: 'center:center',
						},
					},
				],
			};

			ConsoleLog(instance, `Added preset ${currentKey} to ${currentButton.optgroup} pool.`, LogLevel.INFO);
		}
	}

	//Populate Presets for Scenes
	for (const [currentKey, currentButton] of getButtons(buttonPressSceneType)) {
		const id = currentButton.id + 1;
		const actionId = ActionId.scenes;
		const feedbackId = FeedbackId.scenes_state;
		const nameVar = `$(${instance.label}:scene_${id}_name)`;

		if (currentButton) {
			presets[currentKey] = {
				type: 'button',
				category: currentButton.optgroup,
				name: currentButton.title,
				style: {
					text: '',
					size: '14',
					color: Col_White,
					bgcolor: Col_Black,
					png64: await svgPathToCachedPng64(instance, currentButton.state0_image),
					pngalignment: 'center:center',
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
							png64: await svgPathToCachedPng64(instance, currentButton.state1_image),
							pngalignment: 'center:center',
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
							png64: await svgPathToCachedPng64(instance, currentButton.state2_image),
							pngalignment: 'center:center',
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
							png64: await svgPathToCachedPng64(instance, currentButton.state0_image),
							pngalignment: 'center:center',
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
							png64: await svgPathToCachedPng64(instance, currentButton.state3_image),
							pngalignment: 'center:center',
						},
					},
				],
			};

			ConsoleLog(instance, `Added preset ${currentKey} to ${currentButton.optgroup} pool.`, LogLevel.INFO);
		}
	}

	//Populate Presets for Media
	for (const [currentKey, currentButton] of getButtons(buttonPressMediaType)) {
		const id = currentButton.id + 1;
		const actionId = ActionId.media;
		const feedbackId = FeedbackId.media_state;
		const nameVar = `$(${instance.label}:media_${id}_name)`;

		if (currentButton) {
			presets[currentKey] = {
				type: 'button',
				category: currentButton.optgroup,
				name: currentButton.title,
				style: {
					text: '',
					size: '14',
					color: Col_White,
					bgcolor: Col_Black,
					png64: await svgPathToCachedPng64(instance, currentButton.state0_image),
					pngalignment: 'center:center',
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
							png64: await svgPathToCachedPng64(instance, currentButton.state1_image),
							pngalignment: 'center:center',
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
							png64: await svgPathToCachedPng64(instance, currentButton.state2_image),
							pngalignment: 'center:center',
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
							png64: await svgPathToCachedPng64(instance, currentButton.state0_image),
							pngalignment: 'center:center',
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
							png64: await svgPathToCachedPng64(instance, currentButton.state3_image),
							pngalignment: 'center:center',
						},
					},
				],
			};

			ConsoleLog(instance, `Added preset ${currentKey} to ${currentButton.optgroup} pool.`, LogLevel.INFO);
		}
	}

	//Populate Presets for Overlays
	for (const [currentKey, currentButton] of getButtons(buttonPressOverlayType)) {
		const id = currentButton.id + 1;
		const actionId = ActionId.overlays;
		const feedbackId = FeedbackId.overlays_state;
		const nameVar = `$(${instance.label}:overlay_${id}_name)`;

		if (currentButton) {
			presets[currentKey] = {
				type: 'button',
				category: currentButton.optgroup,
				name: currentButton.title,
				style: {
					text: '',
					size: '14',
					color: Col_White,
					bgcolor: Col_Black,
					png64: await svgPathToCachedPng64(instance, currentButton.state0_image),
					pngalignment: 'center:center',
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
							png64: await svgPathToCachedPng64(instance, currentButton.state1_image),
							pngalignment: 'center:center',
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
							png64: await svgPathToCachedPng64(instance, currentButton.state2_image),
							pngalignment: 'center:center',
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
							png64: await svgPathToCachedPng64(instance, currentButton.state0_image),
							pngalignment: 'center:center',
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
							png64: await svgPathToCachedPng64(instance, currentButton.state3_image),
							pngalignment: 'center:center',
						},
					},
				],
			};

			ConsoleLog(instance, `Added preset ${currentKey} to ${currentButton.optgroup} pool.`, LogLevel.INFO);
		}
	}

	//Add Recording/Streaming
	presets[buttonPressControlType.BUTTON_RECORD] = {
		type: 'button',
		category: buttonList[buttonPressControlType.BUTTON_RECORD].optgroup,
		name: buttonList[buttonPressControlType.BUTTON_RECORD].title,
		style: {
			text: '',
			size: '14',
			color: Col_White,
			bgcolor: Col_Black,
			png64: await svgPathToCachedPng64(instance, buttonList[buttonPressControlType.BUTTON_RECORD].state0_image),
			pngalignment: 'center:center',
		},
		steps: [
			{
				down: [
					{
						// add an action on down press
						actionId: ActionId.control_buttons,
						options: {
							control: buttonPressControlType.BUTTON_RECORD,
							mechanism: 'toggle',
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
					png64: await svgPathToCachedPng64(instance, buttonList[buttonPressControlType.BUTTON_RECORD].state0_image),
					pngalignment: 'center:center',
				},
			},
			{
				feedbackId: FeedbackId.is_recording,
				options: {
					action: 'state',
				},
				style: {
					color: Col_White,
					png64: await svgPathToCachedPng64(instance, buttonList[buttonPressControlType.BUTTON_RECORD].state1_image),
					pngalignment: 'center:center',
				},
			},
		],
	};

	presets[buttonPressControlType.BUTTON_STREAM] = {
		type: 'button',
		category: buttonList[buttonPressControlType.BUTTON_STREAM].optgroup,
		name: buttonList[buttonPressControlType.BUTTON_STREAM].title,
		style: {
			text: '',
			size: '14',
			color: Col_White,
			bgcolor: Col_Black,
			png64: await svgPathToCachedPng64(instance, buttonList[buttonPressControlType.BUTTON_STREAM].state0_image),
			pngalignment: 'center:center',
		},
		steps: [
			{
				down: [
					{
						// add an action on down press
						actionId: ActionId.control_buttons,
						options: {
							control: buttonPressControlType.BUTTON_STREAM,
							mechanism: 'toggle',
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
					png64: await svgPathToCachedPng64(instance, buttonList[buttonPressControlType.BUTTON_STREAM].state0_image),
					pngalignment: 'center:center',
				},
			},
			{
				feedbackId: FeedbackId.is_streaming,
				options: {
					action: 'state',
				},
				style: {
					color: Col_White,
					png64: await svgPathToCachedPng64(instance, buttonList[buttonPressControlType.BUTTON_STREAM].state1_image),
					pngalignment: 'center:center',
				},
			},
		],
	};

	presets[buttonPressControlType.BUTTON_FTB] = {
		type: 'button',
		category: 'Controls',
		name: buttonList[buttonPressControlType.BUTTON_FTB].title,
		style: {
			text: '',
			size: '14',
			color: Col_White,
			bgcolor: Col_Black,
			png64: await svgPathToCachedPng64(instance, buttonList[buttonPressControlType.BUTTON_FTB].state0_image),
			pngalignment: 'center:center',
		},
		steps: [
			{
				down: [
					{
						// add an action on down press
						actionId: ActionId.control_buttons,
						options: {
							control: buttonPressControlType.BUTTON_FTB,
							mechanism: 'toggle',
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
					png64: await svgPathToCachedPng64(instance, buttonList[buttonPressControlType.BUTTON_FTB].state1_image),
					pngalignment: 'center:center',
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
					png64: await svgPathToCachedPng64(instance, buttonList[buttonPressControlType.BUTTON_FTB].state2_image),
					pngalignment: 'center:center',
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
					png64: await svgPathToCachedPng64(instance, buttonList[buttonPressControlType.BUTTON_FTB].state0_image),
					pngalignment: 'center:center',
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
					png64: await svgPathToCachedPng64(instance, buttonList[buttonPressControlType.BUTTON_FTB].state3_image),
					pngalignment: 'center:center',
				},
			},
		],
	};

	presets[buttonPressControlType.BUTTON_CUT] = {
		type: 'button',
		category: 'Controls',
		name: buttonList[buttonPressControlType.BUTTON_CUT].title,
		style: {
			text: '',
			size: '14',
			color: Col_White,
			bgcolor: Col_Black,
			png64: await svgPathToCachedPng64(instance, buttonList[buttonPressControlType.BUTTON_CUT].state0_image),
			pngalignment: 'center:center',
		},
		steps: [
			{
				down: [
					{
						// add an action on down press
						actionId: ActionId.control_buttons,
						options: {
							control: buttonPressControlType.BUTTON_CUT,
							mechanism: 'toggle',
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
			text: '',
			size: '14',
			color: Col_White,
			bgcolor: Col_Black,
			png64: await svgPathToCachedPng64(instance, buttonList[buttonPressControlType.BUTTON_AUTO].state0_image),
			pngalignment: 'center:center',
		},
		steps: [
			{
				down: [
					{
						// add an action on down press
						actionId: ActionId.control_buttons,
						options: {
							control: buttonPressControlType.BUTTON_AUTO,
							mechanism: 'toggle',
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
					png64: await svgPathToCachedPng64(instance, buttonList[buttonPressControlType.BUTTON_AUTO].state1_image),
					pngalignment: 'center:center',
				},
			},
			{
				feedbackId: FeedbackId.auto_switching,
				options: {
					action: 'enabled',
				},
				style: {
					color: Col_White,
					png64: await svgPathToCachedPng64(instance, buttonList[buttonPressControlType.BUTTON_AUTO].state2_image),
					pngalignment: 'center:center',
				},
			},
		],
	};

	presets['AutoSwitching'] = {
		type: 'button',
		category: 'Controls',
		name: 'Auto Switching',
		style: {
			text: '',
			size: '14',
			color: Col_White,
			bgcolor: Col_Black,
			png64: await svgPathToCachedPng64(instance, 'imgs/auto/autoswitch_off'),
			pngalignment: 'center:center',
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
					png64: await svgPathToCachedPng64(instance, 'imgs/auto/autoswitch_on'),
					pngalignment: 'center:center',
				},
			},
		],
	};

	presets['ChangeTransition'] = {
		type: 'button',
		category: 'Controls',
		name: 'Change Transition',
		style: {
			text: '',
			size: '14',
			color: Col_White,
			bgcolor: Col_Black,
			png64: await svgPathToCachedPng64(instance, 'imgs/transitions/all_transitions/fade_dip/transition_fade'),
			pngalignment: 'center:center',
		},
		steps: [
			{
				down: [
					{
						// add an action on down press
						actionId: ActionId.transitions,
						options: {
							action: 'transition',
							transition: transitionType.FADE,
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: FeedbackId.transitions,
				options: {},
			},
		],
	};

	//Audio Source

	for (const [channel, channelEntry] of getaudioChannels()) {
		const actionId = ActionId.audio_sources;

		if (channel) {
			presets[`AudioSource_${channel}`] = {
				type: 'button',
				category: 'Audio',
				name: channelEntry.title,
				style: {
					text: channelEntry.title,
					size: 11,
					alignment: 'center:bottom',
					color: Col_White,
					bgcolor: Col_Black,
					png64: await svgPathToCachedPng64(instance, channelEntry.icon),
					pngalignment: 'center:center',
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
									action_sync: 'mute',
									mechanism: 'set',
									volume_value: 0,
									gain_value: 0,
									fade_time: 0,
									relative_value: 0,
									volume_value_var: '0',
									gain_value_var: '0',
									fade_time_var: '0',
									variable: false,
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
							position: 'br',
						},
					},
					{
						feedbackId: FeedbackId.audio_sources,
						options: {
							channel: channel as audioChannels,
							submix: SubmixChannels.LIVE,
							action: 'mute',
							muted_value: true,
							variable: false,
							comparison: 'equal',
							volume_value: 0,
							gain_value: 0,
							volume_value_var: '0',
							gain_value_var: '0',
							scmuted_value: false,
						},
						style: {
							color: Col_Black,
							png64: await svgPathToCachedPng64(instance, channelEntry.mute_icon),
							pngalignment: 'center:center',
						},
					},
					{
						feedbackId: FeedbackId.audio_sources,
						options: {
							channel: channel as audioChannels,
							submix: SubmixChannels.LIVE,
							action: 'scmute',
							muted_value: true,
							variable: false,
							comparison: 'equal',
							volume_value: 0,
							gain_value: 0,
							volume_value_var: '0',
							gain_value_var: '0',
							scmuted_value: true,
						},
						style: {
							color: Col_Black,
							png64: await svgPathToCachedPng64(instance, channelEntry.scmute_icon),
							pngalignment: 'center:center',
						},
					},
				],
			};

			ConsoleLog(instance, `Added preset ${channelEntry.title} to Audio Sources pool.`, LogLevel.INFO);
		}
	}

	instance.setPresetDefinitions(presets);
}
