import { combineRgb, CompanionFeedbackDefinition, CompanionFeedbackDefinitions, CompanionOptionValues } from '@companion-module/base'
import type { RCVInstance } from '../index.js'
import { buttonList, channelList, controllerVariables, mediaSources, mixerChannels, mixList, overlaySources, sceneSources, videoSources } from '../modules/constants.js';
import { buttonPressControlType, buttonPressInputsType, buttonPressMediaType, buttonPressOverlayType, buttonPressSceneType, buttonStates, keyingCol, keyingMode, LogLevel, routingOutputs, routingSources } from '../modules/enums.js';
import { audioChannelsChoices, audioMixesChoices, controlButtonChoices, evaluateComparison, filterButtonListByEnum, inputButtonChoices, mediaButtonChoices, overlayButtonChoices, sceneButtonChoices } from '../helpers/commonHelpers.js';
import { ConsoleLog } from '../modules/logger.js';
import { floatToDb } from '../helpers/decibelHelper.js';
import { ChannelData } from '../modules/interfaces.js';
import { meterLevelToPercentage } from '../helpers/metersHelper.js';

export enum FeedbackId {
	control_state = 'control_state',
	input_state = 'input_state',
	scenes_state = 'scenes_state',
	media_state = 'media_state',
	overlays_state = 'overlays_state',
	is_streaming = 'is_streaming',
	is_recording = 'is_recording',
	audio_sources = 'audio_sources',
	auto_switching = 'auto_switching',
	logo = 'logo',
	keying = 'keying',
	routing = 'routing'
}


export function UpdateFeedbacks(instance: RCVInstance): void {
	let feedbackList = {
		[FeedbackId.control_state]: {
			name: 'Control State',
            type: 'boolean',
            description: 'Feedback based on control button status',
            defaultStyle: {
                color: combineRgb(255, 255, 255),
                bgcolor: combineRgb(255, 0, 0),
            },
            showInvert: true,
            options: [
				{
					id: 'control',
					type: 'dropdown',
					label: 'Control',
					choices: controlButtonChoices,
					default: controlButtonChoices[0]?.id
				},
				{
					id: 'action_1',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: buttonStates.PGM, label: 'PGM' },
						{ id: buttonStates.PVW, label: 'PVW' },
						{ id: buttonStates.IDLE, label: 'Idle' },
						{ id: buttonStates.UNAVAILABLE, label: 'Unavailable' },
					],
					default: buttonStates.PGM,
					isVisible: (options) => {
						const control = options.control;
						return (
						  control !== 'buttonAuto' &&
						  control !== 'buttonCut' &&
						  control !== 'buttonRecord' &&
						  control !== 'buttonStream' &&
						  control !== 'buttonOverlay' &&
						  control !== 'buttonInspect' &&
						  control !== 'buttonMedia' &&
						  control !== 'buttonMultiSource' &&
						  control !== 'buttonKey'
						);
					}
				},
				{
					id: 'action_2',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: buttonStates.ACTIVE, label: 'Active' },
						{ id: buttonStates.IDLE, label: 'Idle' },
					],
					default: buttonStates.ACTIVE,
					isVisible: (options) => {
						const control = options.control;
						return (
							control === 'buttonAuto' ||
							control === 'buttonCut' ||
							control === 'buttonRecord' ||
							control === 'buttonStream' ||
							control === 'buttonOverlay' ||
							control === 'buttonInspect' ||
							control === 'buttonMedia' ||
							control === 'buttonMultiSource' ||
							control === 'buttonKey'
						);
					}
				}
			],
            callback: async (feedback, context) => {

				const value = feedback.options.control as buttonPressControlType;

				if (value && buttonList.hasOwnProperty(value)) {
					const button = buttonList[value];
					const state = button.state;

					if (value !== buttonPressControlType.BUTTON_AUTO &&
						value !== buttonPressControlType.BUTTON_CUT &&
						value !== buttonPressControlType.BUTTON_RECORD &&
						value !== buttonPressControlType.BUTTON_STREAM &&
						value !== buttonPressControlType.BUTTON_OVERLAY &&
						value !== buttonPressControlType.BUTTON_INSPECT &&
						value !== buttonPressControlType.BUTTON_MEDIA &&
						value !== buttonPressControlType.BUTTON_MULTISOURCE &&
						value !== buttonPressControlType.BUTTON_KEY) {

							const action = feedback.options.action_1;

							//0 - Invalid, 1 - Idle, 2 - Active, 3 - Preview
							switch(state) {
								case 0:
									if (action === buttonStates.UNAVAILABLE) {
										return true;
									} else {
										return false;
									}
								case 1:
									if (action === buttonStates.IDLE) {
										return true;
									} else {
										return false;
									}
								case 2:
									if (action === buttonStates.PGM) {
										return true;
									} else {
										return false;
									}
								case 3:
									if (action === buttonStates.PVW) {
										return true;
									} else {
										return false;
									}

								default:
									return false;
							}
							
					} else {

						const action = feedback.options.action_2;

						//0 - Invalid, 1 - Idle, 2 - Active, 3 - Preview
						switch(state) {
							case 0:
							case 1:
							case 3:
								if (action === buttonStates.IDLE) {
									return true;
								} else {
									return false;
								}
							case 2:
								if (action === buttonStates.ACTIVE) {
									return true;
								} else {
									return false;
								}
							default:
								return false;
						}
					}
					

				}

                return false;
            }
		},
		[FeedbackId.input_state]: {
			name: 'Input State',
            type: 'boolean',
            description: 'Feedback based on Input state',
            defaultStyle: {
                color: combineRgb(255, 255, 255),
                bgcolor: combineRgb(255, 0, 0),
            },
            showInvert: true,
            options: [
				{
					id: 'control',
					type: 'dropdown',
					label: 'Input',
					choices: inputButtonChoices,
					default: inputButtonChoices[0]?.id,
					isVisible: (options) => { return options.variable === false; },
				},
				{
					id: 'control_var',
					type: 'textinput',
					label: 'Input (Must be a numeric value between 1 - 6)',
					default: "1",
					useVariables: true,
					isVisible: (options) => { return options.variable === true; },
				},
				{
					id: 'variable',
					type: 'checkbox',
					label: 'Use Variables',
					default: false,
				},
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: buttonStates.PGM, label: 'PGM' },
						{ id: buttonStates.PVW, label: 'PVW' },
						{ id: buttonStates.IDLE, label: 'Idle' },
						{ id: buttonStates.UNAVAILABLE, label: 'Unavailable' },
					],
					default: buttonStates.PGM,
				}
			],
            callback: async (feedback, context) => {
				let value;

				if (feedback.options.variable) {
					const varString = await context.parseVariablesInString(feedback.options.control_var.toString());
					const _value = Number(varString);

					if (!_value || _value < 1 || _value > 6) {
						ConsoleLog(instance, `Value out of range. Must be between 1 and 6. Actual Value: ${value}`, LogLevel.ERROR, false);
						return;
					}

					value = `input${_value}`;

				} else {
					value = feedback.options.control as buttonPressInputsType;
				}

				const action = feedback.options.action;

				if (value && buttonList.hasOwnProperty(value)) {
					const button = buttonList[value];
					const state = videoSources[button.id]?.state;

					//ConsoleLog(instance, `Input ${button.title} State: ${state} Action: ${action}`, LogLevel.DEBUG, false);

					//0 - Idle, 1 - Active, 2 - Preview, 3 - Invalid
					switch(state) {
						
						case 0:
							if (action === buttonStates.IDLE) {
								return true;
							} else {
								return false;
							}
						case 1:
							if (action === buttonStates.PGM) {
								return true;
							} else {
								return false;
							}
						case 2:
							if (action === buttonStates.PVW) {
								return true;
							} else {
								return false;
							}
						case 3:
							if (action === buttonStates.UNAVAILABLE) {
								return true;
							} else {
								return false;
							}

						default:
							if (action === buttonStates.UNAVAILABLE) {
								return true;
							} else {
								return false;
							}
					}

				}

                if (action === buttonStates.UNAVAILABLE) {
					return true;
				} else {
					return false;
				}
            }
		},
		[FeedbackId.scenes_state]: {
			name: 'Scene State',
            type: 'boolean',
            description: 'Feedback based on Scene state',
            defaultStyle: {
                color: combineRgb(255, 255, 255),
                bgcolor: combineRgb(255, 0, 0),
            },
            showInvert: true,
            options: [
				{
					id: 'control',
					type: 'dropdown',
					label: 'Scene',
					choices: sceneButtonChoices,
					default: sceneButtonChoices[0]?.id,
					isVisible: (options) => { return options.variable === false; },
				},
				{
					id: 'control_var',
					type: 'textinput',
					label: 'Scene (Must be a numeric value between 1 - 7)',
					default: "1",
					useVariables: true,
					isVisible: (options) => { return options.variable === true; },
				},
				{
					id: 'variable',
					type: 'checkbox',
					label: 'Use Variables',
					default: false,
				},
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: buttonStates.PGM, label: 'PGM' },
						{ id: buttonStates.PVW, label: 'PVW' },
						{ id: buttonStates.IDLE, label: 'Idle' },
						{ id: buttonStates.UNAVAILABLE, label: 'Unavailable' },
					],
					default: buttonStates.PGM,
				}
			],
            callback: async (feedback, context) => {
				let value;

				if (feedback.options.variable) {
					const varString = await context.parseVariablesInString(feedback.options.control_var.toString());
					const _value = Number(varString);

					if (!_value || _value < 1 || _value > 7) {
						ConsoleLog(instance, `Value out of range. Must be between 1 and 7. Actual Value: ${value}`, LogLevel.ERROR, false);
						return;
					}

					value = `scene${_value}`;

				} else {
					value = feedback.options.control as buttonPressSceneType;
				}

				const action = feedback.options.action;

				if (value && buttonList.hasOwnProperty(value)) {
					const button = buttonList[value];
					const state = sceneSources[button.id]?.state;

					//0 - Idle, 1 - Active, 2 - Preview, 3 - Invalid
					switch(state) {
						
						case 0:
							if (action === buttonStates.IDLE) {
								return true;
							} else {
								return false;
							}
						case 1:
							if (action === buttonStates.PGM) {
								return true;
							} else {
								return false;
							}
						case 2:
							if (action === buttonStates.PVW) {
								return true;
							} else {
								return false;
							}
						case 3:
							if (action === buttonStates.UNAVAILABLE) {
								return true;
							} else {
								return false;
							}

						default:
							if (action === buttonStates.UNAVAILABLE) {
								return true;
							} else {
								return false;
							}
					}

				}

                if (action === buttonStates.UNAVAILABLE) {
					return true;
				} else {
					return false;
				}
            }
		},
		[FeedbackId.media_state]: {
			name: 'Media State',
            type: 'boolean',
            description: 'Feedback based on Media state',
            defaultStyle: {
                color: combineRgb(255, 255, 255),
                bgcolor: combineRgb(255, 0, 0),
            },
            showInvert: true,
            options: [
				{
					id: 'control',
					type: 'dropdown',
					label: 'Media',
					choices: mediaButtonChoices,
					default: mediaButtonChoices[0]?.id,
					isVisible: (options) => { return options.variable === false; },
				},
				{
					id: 'control_var',
					type: 'textinput',
					label: 'Media (Must be a numeric value between 1 - 7)',
					default: "1",
					useVariables: true,
					isVisible: (options) => { return options.variable === true; },
				},
				{
					id: 'variable',
					type: 'checkbox',
					label: 'Use Variables',
					default: false,
				},
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: buttonStates.PGM, label: 'PGM' },
						{ id: buttonStates.PVW, label: 'PVW' },
						{ id: buttonStates.IDLE, label: 'Idle' },
						{ id: buttonStates.UNAVAILABLE, label: 'Unavailable' },
					],
					default: buttonStates.PGM,
				}
			],
            callback: async (feedback, context) => {
				let value;

				if (feedback.options.variable) {
					const varString = await context.parseVariablesInString(feedback.options.control_var.toString());
					const _value = Number(varString);

					if (!_value || _value < 1 || _value > 7) {
						ConsoleLog(instance, `Value out of range. Must be between 1 and 7. Actual Value: ${value}`, LogLevel.ERROR, false);
						return;
					}

					value = `media${_value}`;

				} else {
					value = feedback.options.control as buttonPressMediaType;
				}

				const action = feedback.options.action;

				if (value && buttonList.hasOwnProperty(value)) {
					const button = buttonList[value];
					const state = mediaSources[button.id]?.state;

					//0 - Idle, 1 - Active, 2 - Preview, 3 - Invalid
					switch(state) {
						
						case 0:
							if (action === buttonStates.IDLE) {
								return true;
							} else {
								return false;
							}
						case 1:
							if (action === buttonStates.PGM) {
								return true;
							} else {
								return false;
							}
						case 2:
							if (action === buttonStates.PVW) {
								return true;
							} else {
								return false;
							}
						case 3:
							if (action === buttonStates.UNAVAILABLE) {
								return true;
							} else {
								return false;
							}

						default:
							if (action === buttonStates.UNAVAILABLE) {
								return true;
							} else {
								return false;
							}
					}

				}

                if (action === buttonStates.UNAVAILABLE) {
					return true;
				} else {
					return false;
				}
            }
		},
		[FeedbackId.overlays_state]: {
			name: 'Overlay State',
            type: 'boolean',
            description: 'Feedback based on Overlay state',
            defaultStyle: {
                color: combineRgb(255, 255, 255),
                bgcolor: combineRgb(255, 0, 0),
            },
            showInvert: true,
            options: [
				{
					id: 'control',
					type: 'dropdown',
					label: 'Overlay',
					choices: overlayButtonChoices,
					default: overlayButtonChoices[0]?.id,
					isVisible: (options) => { return options.variable === false; },
				},
				{
					id: 'control_var',
					type: 'textinput',
					label: 'Overlay (Must be a numeric value between 1 - 7)',
					default: "1",
					useVariables: true,
					isVisible: (options) => { return options.variable === true; },
				},
				{
					id: 'variable',
					type: 'checkbox',
					label: 'Use Variables',
					default: false,
				},
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: buttonStates.PGM, label: 'PGM' },
						{ id: buttonStates.PVW, label: 'PVW' },
						{ id: buttonStates.IDLE, label: 'Idle' },
						{ id: buttonStates.UNAVAILABLE, label: 'Unavailable' },
					],
					default: buttonStates.PGM,
				}
			],
            callback: async (feedback, context) => {
				let value;

				if (feedback.options.variable) {
					const varString = await context.parseVariablesInString(feedback.options.control_var.toString());
					const _value = Number(varString);

					if (!_value || _value < 1 || _value > 7) {
						ConsoleLog(instance, `Value out of range. Must be between 1 and 7. Actual Value: ${value}`, LogLevel.ERROR, false);
						return;
					}

					value = `overlay${_value}`;

				} else {
					value = feedback.options.control as buttonPressOverlayType;
				}

				const action = feedback.options.action;

				if (value && buttonList.hasOwnProperty(value)) {
					const button = buttonList[value];
					const state = overlaySources[button.id]?.state;

					//0 - Idle, 1 - Active, 2 - Preview, 3 - Invalid
					switch(state) {
						
						case 0:
							if (action === buttonStates.IDLE) {
								return true;
							} else {
								return false;
							}
						case 1:
							if (action === buttonStates.PGM) {
								return true;
							} else {
								return false;
							}
						case 2:
							if (action === buttonStates.PVW) {
								return true;
							} else {
								return false;
							}
						case 3:
							if (action === buttonStates.UNAVAILABLE) {
								return true;
							} else {
								return false;
							}

						default:
							if (action === buttonStates.UNAVAILABLE) {
								return true;
							} else {
								return false;
							}
					}

				}

                if (action === buttonStates.UNAVAILABLE) {
					return true;
				} else {
					return false;
				}
            }
		},
		[FeedbackId.is_streaming]: {
            name: 'Streaming State',
            type: 'boolean',
            description: 'Feedback based on Streaming state',
            defaultStyle: {
                color: combineRgb(255, 255, 255),
                bgcolor: combineRgb(255, 0, 0),
            },
            showInvert: true,
            options: [
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: 'state', label: 'Is Streaming' },
						{ id: 'ready', label: 'Stream Available' },
					],
					default: 'state'
				}
			],
            callback: async (feedback, context) => {

				const value = feedback.options.action;

				if (value === 'state') {
					if (controllerVariables.streaming === true) {
						return true;
					} else {
						return false;
					}
				} else if (value === 'ready') {
					if (controllerVariables.allowStream === true) {
						return true;
					} else {
						return false;
					}
				}
                
            }
        },
		[FeedbackId.is_recording]: {
            name: 'Recording State',
            type: 'boolean',
            description: 'Feedback based on Recording state',
            defaultStyle: {
                color: combineRgb(255, 255, 255),
                bgcolor: combineRgb(255, 0, 0),
            },
            showInvert: true,
            options: [
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: 'state', label: 'Is Recording' },
						{ id: 'ready', label: 'Record Available' },
					],
					default: 'state'
				}
			],
            callback: async (feedback, context) => {

				const value = feedback.options.action;

				if (value === 'state') {
					if (controllerVariables.recording === true) {
						return true;
					} else {
						return false;
					}
				} else if (value === 'ready') {
					if (controllerVariables.allowRecord === true) {
						return true;
					} else {
						return false;
					}
				}
                
            }
        },
		[FeedbackId.audio_sources]: {
            name: 'Audio Source Status',
            type: 'boolean',
            description: 'Feedback based on Audio Sources',
            defaultStyle: {
                color: combineRgb(255, 255, 255),
                bgcolor: combineRgb(255, 0, 0),
            },
            showInvert: true,
            options: [
				{
					id: 'channel',
					type: 'dropdown',
					label: 'Channel',
					choices: audioChannelsChoices,
					default: audioChannelsChoices[0]?.id
				},
				{
					id: 'submix',
					type: 'dropdown',
					label: 'Mix',
					choices: audioMixesChoices,
					default: audioMixesChoices[0]?.id
				},
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: 'live', label: 'Current Volume' },
						{ id: 'volume', label: 'Set Volume' },
						{ id: 'gain', label: 'Set Gain' },
						{ id: 'mute', label: 'Mute' },
					],
					default: 'volume'
				},
				{
					id: 'important-line',
					type: 'static-text',
					label: '',
					value: 'Current Volume only reads the Live Mix audio level.',
					isVisible: (options) => { return (options.action === 'live'); }
				},
				{
					id: 'comparison',
					type: 'dropdown',
					label: 'Comparison',
					choices: [
						{ id: 'equal', label: '=' },
						{ id: 'greaterthan', label: '>' },
						{ id: 'lessthan', label: '<' },
						{ id: 'greaterthanequal', label: '>=' },
						{ id: 'lessthanequal', label: '<=' },
						{ id: 'notequal', label: '!=' },
					],
					default: 'equal',
					isVisible: (options) => { return options.action !== 'mute'; }
				},
				{
					id: 'volume_value',
					type: 'number',
					label: 'Volume Value (dB)',
					max: 6,
					min: -60,
					default: 0,
					step: 1,
					range: true,
					required: true,
					isVisible: (options) => { return options.variable === false && (options.action === 'volume' || options.action === 'live'); }
				},
				{
					id: 'gain_value',
					type: 'number',
					label: 'Gain Value (dB)',
					max: 76,
					min: -24,
					default: 0,
					step: 1,
					range: true,
					required: true,
					isVisible: (options) => { return options.variable === false && options.action === 'gain'; }
				},
				{
					id: 'volume_value_var',
					type: 'textinput',
					label: 'Volume Value (Must be a numeric value in dB between -60 and 6)',
					default: "0",
					required: true,
					useVariables: true,
					isVisible: (options) => { return (options.variable === true && (options.action === 'volume' || options.action === 'live')); }
				},
				{
					id: 'gain_value_var',
					type: 'textinput',
					label: 'Gain Value (Must be a numeric value in dB between -24 and 76)',
					default: "0",
					required: true,
					useVariables: true,
					isVisible: (options) => { return options.variable === true && options.action === 'gain'; }
				},
				{
					id: 'muted_value',
					type: 'checkbox',
					label: 'Is Muted',
					default: true,
					isVisible: (options) => { return options.action === 'mute'; }
				},
				{
					id: 'variable',
					type: 'checkbox',
					label: 'Use Variables',
					default: false,
					isVisible: (options) => { return options.action !== 'mute'; }
				}
				
			],
			learn: (ev) => {
				const action = ev.options.action;
				const _channel = ev.options.channel as string;
				const _submix = ev.options.submix as string;

				if (mixerChannels.hasOwnProperty(_channel)) {
					const mixer = mixerChannels[_channel];
					const mixerNo = parseInt(_channel.match(/^value(\d+)$/)[1]);
					
					if (action === 'gain') {
						const currentGain = Number(mixer.gain);

						if (currentGain === undefined) {
							return undefined;
						}

						return {
							...ev.options,
							gain_value: currentGain,
						}
					} else if (action === 'volume') {
						const currentLevel = mixer.submixes[mixList[_submix].id].level;
						const outputLevel = floatToDb(currentLevel);

						if (outputLevel === undefined) {
							return undefined;
						}

						return {
							...ev.options,
							volume_value: outputLevel,
						}
					} else if (action === 'mute') {
						const muted = mixer.submixes[mixList[_submix].id].muted;

						if (muted === undefined) {
							return undefined;
						}

						return {
							...ev.options,
							muted_value: muted,
						}
					} else if (action === 'live') {
						if (!controllerVariables.returnLiveLevels) {
							return false;
						}

						const mixName = `value${mixerNo}`;
						const meterData = controllerVariables.currentAudioLevels;


						if (meterData && meterData.outputs.hasOwnProperty(mixerNo)) {
							const meters = meterData.outputs[mixerNo] as ChannelData;
							
							const levelsL_db = floatToDb(meterLevelToPercentage(meters.left?.level || 0));
							const levelsR_db = floatToDb(meterLevelToPercentage(meters.right?.level || 0));
							const average_db = (levelsL_db + levelsR_db) / 2;

							console.log(`Level L: ${levelsL_db}`);
							console.log(`Avg: ${average_db}`);

							return {
								...ev.options,
								volume_value: average_db,
							}
						}

						return undefined;
					}

				} else {
					ConsoleLog(instance, `Invalid or Inactive/Unassigned Audio Source: ${_channel}/${_submix}`, LogLevel.ERROR, false);
				}

				return undefined;
			
			},
            callback: async (feedback, context) => {
				const _submix = feedback.options.submix as string;
				const action = feedback.options.action;
				const _channel = feedback.options.channel as string;

                
				if (mixerChannels.hasOwnProperty(_channel)) {
					const mixer = mixerChannels[_channel];
					const mixerNo = parseInt(_channel.match(/^value(\d+)$/)[1]);
					
					if (action === 'gain') {
						let checkValue = 0;
						
						if (feedback.options.variable === true) {
							const varString = await context.parseVariablesInString(feedback.options.gain_value_var.toString());
							let _checkValue = Number(varString);

							if (_checkValue === undefined) {
								ConsoleLog(instance, `Invalid value ${_checkValue}`, LogLevel.ERROR, false);
								return;
							}

							if (_checkValue < -24) {
								_checkValue = -24;
							} else if (_checkValue > 76) {
								_checkValue = 76;
							}

							checkValue = _checkValue;
						} else {
							checkValue = feedback.options.gain_value as number;
						}

						const comparison = feedback.options.comparison as string;
						const currentGain = Number(mixer.gain);

						const comparisonResult = evaluateComparison(currentGain, checkValue, comparison);
						return comparisonResult;

					} else if (action === 'volume') {
						let checkValue = 0;
						
						if (feedback.options.variable === true) {
							const varString = await context.parseVariablesInString(feedback.options.volume_value_var.toString());
							let _checkValue = Number(varString);

							if (_checkValue === undefined) {
								ConsoleLog(instance, `Invalid value ${_checkValue}`, LogLevel.ERROR, false);
								return;
							}

							if (_checkValue < -24) {
								_checkValue = -24;
							} else if (_checkValue > 76) {
								_checkValue = 76;
							}

							checkValue = _checkValue;
						} else {
							checkValue = feedback.options.volume_value as number;
						}


						const comparison = feedback.options.comparison as string;
						const currentLevel = mixer.submixes[mixList[_submix].id].level;

						const outputLevel = floatToDb(currentLevel);
						
						const comparisonResult = evaluateComparison(outputLevel, checkValue, comparison);
						return comparisonResult;

					} else if (action === 'mute') {
						const checkValue = feedback.options.muted_value as boolean;
						const muted = mixer.submixes[mixList[_submix].id].muted;

						return checkValue === muted;

					} else if (action === 'live') {
						if (!controllerVariables.returnLiveLevels) {
							return false;
						}

						const mixName = `value${mixerNo}`;
						const meterData = controllerVariables.currentAudioLevels;

						if (meterData && meterData.outputs.hasOwnProperty(mixerNo)) {
							const meters = meterData.outputs[mixerNo] as ChannelData;
							
							const levelsL_db = floatToDb(meterLevelToPercentage(meters.left?.level || 0));
							const levelsR_db = floatToDb(meterLevelToPercentage(meters.right?.level || 0));
							const average_db = (levelsL_db + levelsR_db) / 2;

							let checkValue = 0;
						
							if (feedback.options.variable === true) {
								const varString = await context.parseVariablesInString(feedback.options.volume_value_var.toString());
								let _checkValue = Number(varString);

								if (_checkValue === undefined) {
									ConsoleLog(instance, `Invalid value ${_checkValue}`, LogLevel.ERROR, false);
									return;
								}

								if (_checkValue < -60) {
									_checkValue = -60;
								} else if (_checkValue > 6) {
									_checkValue = 6;
								}

								checkValue = _checkValue;
							} else {
								checkValue = feedback.options.volume_value as number;
							}

							const comparison = feedback.options.comparison as string;
							
							const comparisonResult = evaluateComparison(average_db, checkValue, comparison);
							return comparisonResult;
						}

						return false;
					}

				} else {
					ConsoleLog(instance, `Invalid or Inactive/Unassigned Audio Source: ${_channel}/${_submix}`, LogLevel.ERROR, false);
					return false;
				}
            }
        },
		[FeedbackId.auto_switching]: {
            name: 'Auto Switching State',
            type: 'boolean',
            description: 'Feedback based on Auto Switching state',
            defaultStyle: {
                color: combineRgb(255, 255, 255),
                bgcolor: combineRgb(255, 0, 0),
            },
            showInvert: true,
            options: [
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: 'enabled', label: 'Enabled' },
						{ id: 'disabled', label: 'Disabled' },
					],
					default: 'enabled'
				}
			],
            callback: async (feedback, context) => {

				const value = feedback.options.action;
				return (value === 'enabled' && controllerVariables.autoswitchEnabled) || (value === 'disabled' && !controllerVariables.autoswitchEnabled);
                
            }
        },
		[FeedbackId.logo]: {
            name: 'Logo State',
            type: 'boolean',
            description: 'Feedback based on Logo state',
            defaultStyle: {
                color: combineRgb(255, 255, 255),
                bgcolor: combineRgb(255, 0, 0),
            },
            showInvert: true,
            options: [
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: 'enabled', label: 'Enabled' },
						{ id: 'disabled', label: 'Disabled' },
					],
					default: 'enabled'
				}
			],
            callback: async (feedback, context) => {

				const value = feedback.options.action;
				return (value === 'enabled' && controllerVariables.logoEnabled) || (value === 'disabled' && !controllerVariables.logoEnabled);
                
            }
        },
		[FeedbackId.keying]: {
			name: 'Keying Status',
            type: 'boolean',
            description: 'Feedback based on key status on input',
            defaultStyle: {
                color: combineRgb(255, 255, 255),
                bgcolor: combineRgb(255, 0, 0),
            },
            showInvert: true,
            options: [
				{
					id: 'control',
					type: 'dropdown',
					label: 'Input',
					choices: inputButtonChoices,
					default: inputButtonChoices[0]?.id
				},
				{
					id: 'keying_type',
					type: 'dropdown',
					label: 'Key Source',
					choices: [
						{ id: 'none', label: 'None' },
						{ id: 'chroma', label: 'Chroma' },
					],
					default: 'none',
				},
				{
					id: 'keying_col',
					type: 'dropdown',
					label: 'Key Color',
					choices: [
						{ id: 'any', label: 'Any' },
						{ id: keyingCol.GREEN, label: 'Green' },
						{ id: keyingCol.BLUE, label: 'Blue' },
					],
					default: 'any',
					isVisible: (options) => { return options.keying_type !== 'none'; }
				}
			],
            callback: async (feedback, context) => {

				const value = feedback.options.control as buttonPressInputsType;
				const keying_type = feedback.options.keying_type as string;
				const keying_col = feedback.options.keying_col as string;


				if (value && buttonList.hasOwnProperty(value)) {
					const button = buttonList[value];


					if (button.keyingMode === keying_type && button.keyingCol === keying_col || (button.keyingMode === keying_type && keying_col === 'any')) {
						return true;
					} else {
						return false;
					}

				} else {
					ConsoleLog(instance, `Invalid input button: ${value}`, LogLevel.ERROR, false);
				}

            }
		},
		[FeedbackId.routing]: {
            name: 'Video Outputs',
			type: 'boolean',
            description: 'Feedback based on video output state',
            defaultStyle: {
                color: combineRgb(255, 255, 255),
                bgcolor: combineRgb(255, 0, 0),
            },
            options: [
				{
					id: 'output',
					type: 'dropdown',
					label: 'Output',
					choices: [
						{ id: 'outputA', label: 'HDMI A' },
						{ id: 'outputB', label: 'HDMI B' },
					],
					default: 'outputA',
				},
				{
					id: 'source',
					type: 'dropdown',
					label: 'Source',
					choices: [
						{ id: 'program', label: 'Program' },
						{ id: 'preview', label: 'Preview' },
						{ id: 'multi', label: 'Multiview' },
					],
					default: 'multi',
				}
			],

			learn: (ev) => {
				const output = ev.options.output as routingOutputs;
				let source;

				if (output === undefined) {
					return undefined;
				}

				if (output === routingOutputs.HDMI_A) {
					source = controllerVariables.hdmi_A_output;

				} else if (output === routingOutputs.HDMI_B) {
					source = controllerVariables.hdmi_B_output;
					
				}

				return {
					...ev.options,
					source: source.toString(),
				}
			
			},
            callback: async (feedback, context) => {
				const output = feedback.options.output as routingOutputs;
				const source = feedback.options.source as routingSources;

				if (output === routingOutputs.HDMI_A) {
					if (controllerVariables.hdmi_A_output === source) {
						return true;
					}
				} else if (output === routingOutputs.HDMI_B) {
					if (controllerVariables.hdmi_B_output === source) {
						return true;
					}
				}

				return false;

            }
        },
	};

	instance.setFeedbackDefinitions(feedbackList as CompanionFeedbackDefinitions);
}