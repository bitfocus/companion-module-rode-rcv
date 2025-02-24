import { Regex } from '@companion-module/base';
import { commands } from '../modules/commands.js';
import type { RCVInstance } from '../index.js'
import { sendOSCCommand } from '../modules/oscController.js';
import { audioLevelsPercentageTable, buttonList, channelList, controllerVariables, frameRateList, mediaSources, mixerChannels, mixList, monitorChannels, submixList, transitionsList } from '../modules/constants.js';
import { audioChannels, buttonPressControlType, buttonPressInputsType, buttonPressMediaType, buttonPressOverlayType, buttonPressSceneType, keyingCol, keyingMode, LogLevel, mediaType, MonitorChannels, pressMode, routingOutputs, routingSources, transitionType } from '../modules/enums.js';
import { audioChannelsChoices, audioMixesChoices, controlButtonChoices, filterButtonListByEnum, framesToMs, getKeyByValue, inputButtonChoices, keySourceChoices, mediaButtonChoices, msToFrames, overlayButtonChoices, sceneButtonChoices, transitionChoices } from '../helpers/commonHelpers.js';
import { ConsoleLog } from '../modules/logger.js';
import { dbToFloat, floatToDb } from '../helpers/decibelHelper.js';
import { Console } from 'console';

export enum ActionId {
	control_buttons = 'control_buttons',
	inputs = 'inputs',
	scenes = 'scenes',
	media = 'media',
	overlays = 'overlays',
	audio_sources = 'audio_sources',
	audio_delay = 'audio_delay',
	transitions = 'transitions',
	auto_switching = 'auto_switching',
	logo = 'logo',
	set_framerate = 'set_framerate',
	keying = 'keying',
	set_monitors = 'set_monitors',
	routing = 'routing',
	setMedia = 'setMedia',
	setOverlay = 'setOverlay',
}

export function UpdateActions(instance: RCVInstance): void {
	instance.setActionDefinitions({
		[ActionId.control_buttons]: {
            name: 'Control Buttons',
			description: 'Assign based on physical buttons on the device',
            options: [
				{
					id: 'control',
					type: 'dropdown',
					label: 'Control',
					choices: controlButtonChoices,
					default: controlButtonChoices[0]?.id
				},
			],
            callback: async (ev, context) => {

				const value = ev.options.control as buttonPressControlType;

				if (value && buttonList.hasOwnProperty(value)) {
					const button = buttonList[value];
					let command = button.command;

					if (value === buttonPressControlType.BUTTON_RECORD) {
						if (controllerVariables.allowRecord) {
							if (controllerVariables.recording) {
								command = commands.STOP_RECORD;
							} else {
								command = commands.START_RECORD;
							}
						} else {
							ConsoleLog(instance, `Recording not allowed`, LogLevel.ERROR, false);
						}

					} else if (value === buttonPressControlType.BUTTON_STREAM) {
						if (controllerVariables.allowStream) {
							if (controllerVariables.streaming) {
								command = commands.STOP_STREAM;
								controllerVariables.streaming = false;
							} else {
								command = commands.START_STREAM;
								controllerVariables.streaming = true;
							}
						} else {
							ConsoleLog(instance, `Streaming not allowed`, LogLevel.ERROR, false);
						}

					}

					if (button.command?.[2] == undefined) {
						await sendOSCCommand(instance, command[0].toString(), command[1]);
			
					} else {
						await sendOSCCommand(instance, command[0].toString(), command[1], command[2]);
			
					}

				} else {
					ConsoleLog(instance, `Invalid control button: ${value}`, LogLevel.ERROR, false);
				}
            },

			subscribe: (feedback) => {
				if (!instance.actions.hasOwnProperty(feedback.id)) {
					const type = 'control_buttons';

					instance.actions[feedback.id] = type;
					ConsoleLog(instance, `Creating button id ${feedback.id} of type ${type}`);
				}
			},

			unsubscribe: (feedback) => {
				if (instance.actions.hasOwnProperty(feedback.id)) {
					const type = 'control_buttons';
					delete instance.actions[feedback.id];
					ConsoleLog(instance, `Removing button id ${feedback.id} of type ${type}`);
				}
			}
        },
		[ActionId.inputs]: {
            name: 'Input Buttons',
			description: 'Trigger Inputs directly',
            options: [
				{
					id: 'control',
					type: 'dropdown',
					label: 'Input',
					choices: inputButtonChoices,
					default: inputButtonChoices[0]?.id,
					isVisible: (options) => { return options.variable === false; }
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
				}
			],
            callback: async (ev, context) => {
				let value;

				if (ev.options.variable) {
					const varString = await context.parseVariablesInString(ev.options.control_var.toString());
					const _value = Number(varString);

					if (!_value || _value < 1 || _value > 6) {
						ConsoleLog(instance, `Value out of range. Must be between 1 and 6. Actual Value: ${value}`, LogLevel.ERROR, false);
						return;
					}

					value = `input${_value}`;

				} else {
					value = ev.options.control as buttonPressInputsType;
				}

				if (value && buttonList.hasOwnProperty(value)) {
					const button = buttonList[value];

					if (button.command?.[2] == undefined) {
						await sendOSCCommand(instance, button.command[0].toString(), button.command[1]);
			
					} else {
						await sendOSCCommand(instance, button.command[0].toString(), button.command[1], button.command[2]);
			
					}

				} else {
					ConsoleLog(instance, `Invalid input button: ${value}`, LogLevel.ERROR, false);
				}
            },

			subscribe: (feedback) => {
				if (!instance.actions.hasOwnProperty(feedback.id)) {
					const type = 'inputs';

					instance.actions[feedback.id] = type;
					ConsoleLog(instance, `Creating button id ${feedback.id} of type ${type}`);
				}
			},

			unsubscribe: (feedback) => {
				if (instance.actions.hasOwnProperty(feedback.id)) {
					const type = 'inputs';
					delete instance.actions[feedback.id];
					ConsoleLog(instance, `Removing button id ${feedback.id} of type ${type}`);
				}
			}
        },
		[ActionId.scenes]: {
            name: 'Scene Buttons',
			description: 'Trigger Scenes directly',
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
				}
			],
            callback: async (ev, context) => {
				let value;

				if (ev.options.variable) {
					const varString = await context.parseVariablesInString(ev.options.control_var.toString());
					const _value = Number(varString);

					if (!_value || _value < 1 || _value > 7) {
						ConsoleLog(instance, `Value out of range. Must be between 1 and 7. Actual Value: ${value}`, LogLevel.ERROR, false);
						return;
					}

					value = `scene${_value}`;

				} else {
					value = ev.options.control as buttonPressSceneType;
				}

				if (value && buttonList.hasOwnProperty(value)) {
					const button = buttonList[value];

					if (button.command?.[2] == undefined) {
						await sendOSCCommand(instance, button.command[0].toString(), button.command[1]);
			
					} else {
						await sendOSCCommand(instance, button.command[0].toString(), button.command[1], button.command[2]);
			
					}

				} else {
					ConsoleLog(instance, `Invalid scene button: ${value}`, LogLevel.ERROR, false);
				}
            },

			subscribe: (feedback) => {
				if (!instance.actions.hasOwnProperty(feedback.id)) {
					const type = 'scenes';

					instance.actions[feedback.id] = type;
					ConsoleLog(instance, `Creating button id ${feedback.id} of type ${type}`);
				}
			},

			unsubscribe: (feedback) => {
				if (instance.actions.hasOwnProperty(feedback.id)) {
					const type = 'scenes';
					delete instance.actions[feedback.id];
					ConsoleLog(instance, `Removing button id ${feedback.id} of type ${type}`);
				}
			}
        },
		[ActionId.media]: {
            name: 'Media Sources',
			description: 'Trigger Media directly',
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
				}
			],
            callback: async (ev, context) => {
				let value;

				if (ev.options.variable) {
					const varString = await context.parseVariablesInString(ev.options.control_var.toString());
					const _value = Number(varString);

					if (!_value || _value < 1 || _value > 7) {
						ConsoleLog(instance, `Value out of range. Must be between 1 and 7. Actual Value: ${value}`, LogLevel.ERROR, false);
						return;
					}

					value = `media${_value}`;

				} else {
					value = ev.options.control as buttonPressMediaType;
				}

				if (value && buttonList.hasOwnProperty(value)) {
					const button = buttonList[value];

					if (mediaSources.hasOwnProperty(button.id)) {
						const mediaSource = mediaSources[button.id];

						if (mediaSource.mediaType === mediaType.AUDIO) {

							//Trigger the sound regardless of pressMode as Companion can't detect held state
							await sendOSCCommand(instance, button.command[0].toString(), button.command[1], 1);
							await sendOSCCommand(instance, button.command[0].toString(), button.command[1], 0);
							
						} else {

							if (button.command?.[2] == undefined) {
								await sendOSCCommand(instance, button.command[0].toString(), button.command[1]);
					
							} else {
								await sendOSCCommand(instance, button.command[0].toString(), button.command[1], button.command[2]);
					
							}
						}

					}

				} else {
					ConsoleLog(instance, `Invalid media button: ${value}`, LogLevel.ERROR, false);
				}
            },

			subscribe: (feedback) => {
				if (!instance.actions.hasOwnProperty(feedback.id)) {
					const type = 'media';

					instance.actions[feedback.id] = type;
					ConsoleLog(instance, `Creating button id ${feedback.id} of type ${type}`);
				}
			},

			unsubscribe: (feedback) => {
				if (instance.actions.hasOwnProperty(feedback.id)) {
					const type = 'media';
					delete instance.actions[feedback.id];
					ConsoleLog(instance, `Removing button id ${feedback.id} of type ${type}`);
				}
			}
        },
		[ActionId.overlays]: {
            name: 'Overlay Sources',
			description: 'Trigger Overlays directly',
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
				}
			],
            callback: async (ev, context) => {
				let value;

				if (ev.options.variable) {
					const varString = await context.parseVariablesInString(ev.options.control_var.toString());
					const _value = Number(varString);

					if (!_value || _value < 1 || _value > 7) {
						ConsoleLog(instance, `Value out of range. Must be between 1 and 7. Actual Value: ${value}`, LogLevel.ERROR, false);
						return;
					}

					value = `overlay${_value}`;

				} else {
					value = ev.options.control as buttonPressOverlayType;
				}

				if (value && buttonList.hasOwnProperty(value)) {
					const button = buttonList[value];

					if (button.command?.[2] == undefined) {
						await sendOSCCommand(instance, button.command[0].toString(), button.command[1]);
			
					} else {
						await sendOSCCommand(instance, button.command[0].toString(), button.command[1], button.command[2]);
			
					}

				} else {
					ConsoleLog(instance, `Invalid overlay button: ${value}`, LogLevel.ERROR, false);
				}
            },

			subscribe: (feedback) => {
				if (!instance.actions.hasOwnProperty(feedback.id)) {
					const type = 'overlays';

					instance.actions[feedback.id] = type;
					ConsoleLog(instance, `Creating button id ${feedback.id} of type ${type}`);
				}
			},

			unsubscribe: (feedback) => {
				if (instance.actions.hasOwnProperty(feedback.id)) {
					const type = 'overlays';
					delete instance.actions[feedback.id];
					ConsoleLog(instance, `Removing button id ${feedback.id} of type ${type}`);
				}
			}
        },
		[ActionId.audio_sources]: {
            name: 'Audio Sources',
			description: 'Control Audio Sources',
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
						{ id: 'volume', label: 'Change Volume' },
						{ id: 'gain', label: 'Change Gain' },
						{ id: 'setmute', label: 'Set Mute' },
						{ id: 'mute', label: 'Toggle Mute' },
					],
					default: 'volume',
				},
				{
					id: 'mechanism',
					type: 'dropdown',
					label: 'Function',
					choices: [
						{ id: 'set', label: 'Set' },
						{ id: 'fade', label: 'Fade' },
						{ id: 'relative', label: 'Relative' },
					],
					default: 'set',
					isVisible: (options) => { return options.action === 'volume'; }
				},
				{
					id: 'volume_value',
					type: 'number',
					label: 'Value (dB)',
					max: 6,
					min: -60,
					default: 0,
					step: 1,
					range: true,
					required: true,
					isVisible: (options) => { return (options.variable === false && options.action === 'volume' && options.mechanism !== 'relative'); }
				},
				{
					id: 'gain_value',
					type: 'number',
					label: 'Value (dB)',
					max: 76,
					min: -24,
					default: 0,
					step: 1,
					range: true,
					required: true,
					isVisible: (options) => { return options.variable === false && options.action === 'gain'; }
				},
				{
					id: 'fade_time',
					type: 'number',
					label: 'Fade Duration (ms)',
					max: 99999,
					min: 0,
					default: 0,
					step: 1,
					range: false,
					required: true,
					isVisible: (options) => { return options.variable === false && options.mechanism === 'fade'; }
				},
				{
					id: 'relative_value',
					type: 'number',
					label: 'Offset by (dB)',
					max: 20,
					min: -20,
					default: 0,
					step: 1,
					range: true,
					required: true,
					isVisible: (options) => { return options.mechanism === 'relative'; }
				},
				{
					id: 'volume_value_var',
					type: 'textinput',
					label: 'Value (Must be a numeric value in dB between -60 and 6)',
					default: "0",
					required: true,
					useVariables: true,
					isVisible: (options) => { return (options.variable === true && options.action === 'volume' && options.mechanism !== 'relative'); }
				},
				{
					id: 'gain_value_var',
					type: 'textinput',
					label: 'Value (Must be a numeric value in dB between -24 and 76)',
					default: "0",
					required: true,
					useVariables: true,
					isVisible: (options) => { return options.variable === true && options.action === 'gain'; }
				},
				{
					id: 'fade_time_var',
					type: 'textinput',
					label: 'Fade Duration (Must be a numeric value in ms)',
					default: "0",
					required: true,
					useVariables: true,
					isVisible: (options) => { return options.variable === true && options.mechanism === 'fade'; }
				},
				{
					id: 'ismuted',
					type: 'checkbox',
					label: 'Mute State',
					default: false,
					isVisible: (options) => { return options.action === 'setmute' }
				},
				{
					id: 'variable',
					type: 'checkbox',
					label: 'Use Variables',
					default: false,
					isVisible: (options) => { return options.mechanism !== 'relative' && options.action !== 'mute' && options.action !== 'setmute' ; }
				}
			],
			learn: (ev, context) => {
				const action = ev.options.action;
				const _channel = ev.options.channel as string;
				const _submix = ev.options.submix as string;

				if (mixerChannels.hasOwnProperty(_channel)) {
					const mixer = mixerChannels[_channel];
					
					if (action == 'gain') {
						const currentGain = Number(mixer.gain);

						if (currentGain === undefined) {
							return undefined;
						}

						return {
							...ev.options,
							gain_value: currentGain,
						}
					} else if (action == 'volume') {
						const currentLevel = mixer.submixes[mixList[_submix].id].level;
						const outputLevel = floatToDb(currentLevel);

						if (outputLevel === undefined) {
							return undefined;
						}

						return {
							...ev.options,
							volume_value: outputLevel,
						}
					} else if (action == 'setmute') {
						const currentMute = mixer.submixes[mixList[_submix].id].muted;

						if (currentMute === undefined) {
							return undefined;
						}

						return {
							...ev.options,
							ismuted: !currentMute,
						}
					}

				} else {
					ConsoleLog(instance, `Invalid or Inactive/Unassigned Audio Source: ${_channel}/${_submix}`, LogLevel.ERROR, false);
				}

				return undefined;
			
			},
            callback: async (ev, context) => {
				const action = ev.options.action;
				const _channel = ev.options.channel as string;
				const _submix = ev.options.submix as string;

				if (mixerChannels.hasOwnProperty(_channel)) {
					const mixer = mixerChannels[_channel];
					const mixerNo = parseInt(_channel.match(/^value(\d+)$/)[1]) + 1;
					
					if (action == 'gain') {

						let newValue = 0;
						
						if (ev.options.variable === true) {
							let varString = await context.parseVariablesInString(ev.options.gain_value_var.toString());
							let _newValue = Number(varString);

							if (_newValue === undefined) {
								ConsoleLog(instance, `Invalid value ${_newValue}`, LogLevel.ERROR, false);
								return;
							}

							if (_newValue < -24) {
								_newValue = -24;
							} else if (_newValue > 76) {
								_newValue = 76;
							}

							newValue = _newValue;
						} else {
							newValue = ev.options.gain_value as number;
						}


						const currentGain = Number(mixer.gain);
						const minGain = Number(channelList[_channel].minGain);
						const maxGain = Number(channelList[_channel].maxGain);

						let newGain = newValue;
	
						if (newGain < minGain) {
							newGain = minGain;
						}
	
						if (newGain > maxGain) {
							newGain = maxGain;
						}

						mixerChannels[_channel].gain = newGain;
						instance.checkFeedbacks('audio_sources');

						await sendOSCCommand(instance, `/audioSource/${mixerNo}/level`, newGain);

						const varName = `${getKeyByValue(audioChannels, _channel).toLocaleLowerCase()}_setgain`;

						if (instance.variables.some(variable => variable.variableId === varName)) {

							instance.setVariableValues({
								[varName]: newGain.toString(),
							});

							ConsoleLog(instance, `Setting variable ${varName} to value ${newGain}`, LogLevel.DEBUG, false);

						}

					} else if (action == 'volume') {
						const currentLevel = mixer.submixes[mixList[_submix].id].level;
						const mechanism = ev.options.mechanism as string;

						let newValue = 0;
						
						if (ev.options.variable === true) {
							const varString = await context.parseVariablesInString(ev.options.volume_value_var.toString());
							let _newValue = Number(varString);

							if (_newValue === undefined) {
								ConsoleLog(instance, `Invalid value ${_newValue}`, LogLevel.ERROR, false);
								return;
							}

							if (_newValue < -60) {
								_newValue = -60;
							} else if (_newValue > 6) {
								_newValue = 6;
							}

							newValue = _newValue;
						} else {
							newValue = ev.options.volume_value as number;
						}


						if (mixer.fading) {
							return;
						}
	
						//Convert to Float
						let finalLevel = dbToFloat(newValue);

						if (mechanism === 'relative') {
							const relative = ev.options.relative_value;
							let offset = Number(relative);

							if (!isNaN(offset)) {

								const currentDb = floatToDb(currentLevel);
								const target = currentDb + offset;
								const dbClamp = Math.max(-60, Math.min(6, target));
								const preClamp = dbToFloat(dbClamp);
								const targetLevel = Math.max(0, Math.min(0.9999999999, preClamp)); // clamp value between 0 and 1

								const varName = `${getKeyByValue(audioChannels, _channel).toLocaleLowerCase()}-${_submix}_setlevel`;
								if (instance.variables.some(variable => variable.variableId === varName)) {

									instance.setVariableValues({
										[varName]: floatToDb(targetLevel).toString(),
									});

									ConsoleLog(instance, `Setting variable ${varName} to value ${floatToDb(targetLevel)}`, LogLevel.DEBUG, false);

								}

								mixer.submixes[mixList[_submix].id].level = targetLevel;

								sendOSCCommand(instance, `${submixList[_submix].path}/${mixerNo}/level`, targetLevel);
								instance.checkFeedbacks('audio_sources');

							}

						} else if (mechanism === 'fade') {
							let fadeTime = 0;
						
							if (ev.options.variable === true) {
								const varString = await context.parseVariablesInString(ev.options.fade_time_var.toString());
								let _fadeTime = Number(varString);

								if (_fadeTime === undefined) {
									ConsoleLog(instance, `Invalid value ${_fadeTime}`, LogLevel.ERROR, false);
									return;
								}

								if (_fadeTime < 0) {
									_fadeTime = 0;
								}

								fadeTime = _fadeTime;
							} else {
								fadeTime = ev.options.fade_time as number;
							}

							const levelDifference = finalLevel - currentLevel;
							const interval = 100; // update interval in milliseconds
							const steps = Math.ceil(fadeTime / interval); // number of steps
							const step = levelDifference / steps; // amount to change per step
						
							// Mark the channel as fading
							mixer.fading = true;

							//Automatically unmute if muted
							/*
							if (mixer.submixes[mixList[currentMix].id].muted)
							{
								toggleMute(source, currentMix, ev);
							}
							*/
							let currentStep = 0;

							// Backup mechanism to ensure fading flag is reset
							const backupTimeout = setTimeout(() => {
								clearInterval(fadeInterval);
								clearInterval(backupTimeout);
								mixer.fading = false; // Reset fading flag as a backup
							}, fadeTime + interval);
						
							const fadeInterval = setInterval(async () => {
								let newLevel;
						
								if (currentStep >= steps - 1) {  // Corrected to ensure final step
									// Final step: Set the level to the closest value from the reference table
									newLevel = finalLevel;
									clearInterval(fadeInterval);
						
									// Set fading to false when fade process ends
									mixer.fading = false;
								} else {
									newLevel = currentLevel + step * currentStep;
								}
						
								currentStep++;
								newLevel = Math.max(0, Math.min(0.9999999999, newLevel)); // clamp value between 0 and 1

								mixer.submixes[mixList[_submix].id].level = newLevel;

								const varName = `${getKeyByValue(audioChannels, _channel).toLocaleLowerCase()}-${_submix}_setlevel`;
								if (instance.variables.some(variable => variable.variableId === varName)) {

									instance.setVariableValues({
										[varName]: floatToDb(newLevel).toString(),
									});

									ConsoleLog(instance, `Setting variable ${varName} to value ${floatToDb(newLevel)}`, LogLevel.DEBUG, false);
									instance.checkFeedbacks('audio_sources');
								}

								instance.checkFeedbacks('audio_sources');
						
								//sendOSCCommand(`/submix/stream/${mixerNo}/level`, newLevel);
								sendOSCCommand(instance, `${submixList[_submix].path}/${mixerNo}/level`, newLevel);
								
							
							}, interval);
						

						} else {
							if (finalLevel < 0) {
								finalLevel = 0;
							}
		
							if (finalLevel >= 1) {
								finalLevel = 0.9999999999; //This alleviates a glitch which causes the volume to go to 0 if 1 is sent.
							}

							mixer.submixes[mixList[_submix].id].level = finalLevel;

							const varName = `${getKeyByValue(audioChannels, _channel).toLocaleLowerCase()}-${_submix}_setlevel`;
							if (instance.variables.some(variable => variable.variableId === varName)) {

								instance.setVariableValues({
									[varName]: floatToDb(finalLevel).toString(),
								});

								ConsoleLog(instance, `Setting variable ${varName} to value ${floatToDb(finalLevel)}`, LogLevel.DEBUG, false);
								instance.checkFeedbacks('audio_sources');
							}
							
							instance.checkFeedbacks('audio_sources');

							//mixer.submixes[mixList[mix].id].level = outputLevel;
							await sendOSCCommand(instance, `${submixList[_submix].path}/${mixerNo}/level`, finalLevel);
						}

					} else if (action == 'setmute') {
						const isMuted = ev.options.ismuted as boolean;

						let mute = 0;

						if (isMuted) {
							mute = 1;
						}

						mixer.submixes[mixList[_submix].id].muted = isMuted;
						instance.checkFeedbacks('audio_sources');

						//Unset any scene mute
						if (mixer.submixes[mixList[_submix].id].scene_mute) {
							await sendOSCCommand(instance, `/audioSource/${mixerNo}/scene_mute`, 0);
							await sendOSCCommand(instance, `/audioSource/${mixerNo}/scene_mute_ms`, 0);
							mixer.submixes[mixList[_submix].id].scene_mute = false;
						}

						await sendOSCCommand(instance, `${submixList[_submix].path}/${mixerNo}/mute`, mute);
					} else if (action == 'mute') {
						let mute = 0;

						if (mixer.submixes[mixList[_submix].id].muted) {
							mute = 0;
						} else {
							mute = 1;
						}

						//Unset any scene mute
						if (mixer.submixes[mixList[_submix].id].scene_mute) {
							await sendOSCCommand(instance, `/audioSource/${mixerNo}/scene_mute`, 0);
							await sendOSCCommand(instance, `/audioSource/${mixerNo}/scene_mute_ms`, 0);
							mixer.submixes[mixList[_submix].id].scene_mute = false;
							mute = 0;
						}

						mixer.submixes[mixList[_submix].id].muted = mute === 1 ? true : false;
						instance.checkFeedbacks('audio_sources');

						await sendOSCCommand(instance, `${submixList[_submix].path}/${mixerNo}/mute`, mute);
					}

				} else {
					ConsoleLog(instance, `Invalid or Inactive/Unassigned Audio Source: ${_channel}/${_submix}`, LogLevel.ERROR, false);
				}
            },

			subscribe: (feedback) => {
				if (!instance.actions.hasOwnProperty(feedback.id)) {
					const type = 'audio_sources';
					instance.actions[feedback.id] = type;
					ConsoleLog(instance, `Creating button id ${feedback.id} of type ${type}`);
				}
			},

			unsubscribe: (feedback) => {
				if (instance.actions.hasOwnProperty(feedback.id)) {
					const type = 'audio_sources';
					delete instance.actions[feedback.id];
					ConsoleLog(instance, `Removing button id ${feedback.id} of type ${type}`);
				}
			}
        },
		[ActionId.audio_delay]: {
            name: 'Audio Delay',
			description: 'Control Audio Delay',
            options: [
				{
					id: 'metric',
					type: 'dropdown',
					label: 'Metric',
					choices: [
						{ id: 'ms', label: 'Milliseconds' },
						{ id: 'frames', label: 'Frames' },
					],
					default: 'ms',
				},
				{
					id: 'ms_value',
					type: 'number',
					label: 'Value',
					max: 500,
					min: 0,
					default: 0,
					step: 1,
					range: true,
					required: true,
					isVisible: (options) => { return options.variable === false && options.metric === 'ms'; }
				},
				{
					id: 'frames_value',
					type: 'number',
					label: 'Value',
					max: 13,
					min: 0,
					default: 0,
					step: 1,
					range: true,
					required: true,
					isVisible: (options) => { return options.variable === false && options.metric === 'frames'; }
				},
				{
					id: 'ms_value_var',
					type: 'textinput',
					label: 'Value (Must be a numeric value)',
					default: "0",
					required: true,
					useVariables: true,
					isVisible: (options) => { return options.variable === true && options.metric === 'ms'; }
				},
				{
					id: 'frames_value_var',
					type: 'textinput',
					label: 'Value (Must be a numeric value)',
					default: "0",
					required: true,
					useVariables: true,
					isVisible: (options) => { return options.variable === true && options.metric === 'frames'; }
				},
				{
					id: 'variable',
					type: 'checkbox',
					label: 'Use Variables',
					default: false,
				}
			],
			learn: (ev) => {
				const action = ev.options.metric;
				const currentDelay = controllerVariables.audioMasterDelay || 0;

				if (currentDelay === undefined) {
					return undefined;
				}


				if (action === 'ms') {
					return {
						...ev.options,
						ms_value: currentDelay,
						frames_value: msToFrames(currentDelay),
					}

				} else if (action === 'frames') {
					return {
						...ev.options,
						frames_value: msToFrames(currentDelay),
						ms_value: currentDelay,
					}
				}

				return undefined;
			
			},
            callback: async (ev, context) => {
				const metric = ev.options.metric as string;
				const currentDelay = controllerVariables.audioMasterDelay || 0;
				let value = 0;

				if (metric === 'ms') {
					if (ev.options.variable === true) {
						const varString = await context.parseVariablesInString(ev.options.ms_value_var.toString());
						let _valueVar = Number(varString);

						if (_valueVar === undefined) {
							ConsoleLog(instance, `Invalid value ${_valueVar}`, LogLevel.ERROR, false);
							return;
						}

						if (_valueVar < 0) {
							_valueVar = 0;
						}

						value = _valueVar;
					} else {
						value = ev.options.ms_value as number;
					}

				} else if (metric === 'frames') {

					if (ev.options.variable === true) {
						const varString = await context.parseVariablesInString(ev.options.frames_value_var.toString());
						let _valueVar = Number(varString);

						if (_valueVar === undefined) {
							ConsoleLog(instance, `Invalid value ${_valueVar}`, LogLevel.ERROR, false);
							return;
						}

						if (_valueVar < 0) {
							_valueVar = 0;
						}

						value = framesToMs(_valueVar);
					} else {
						value = framesToMs(ev.options.frames_value as number);
					}

				}

				let newFrames = value;

				if (newFrames < 0) {
					newFrames = 0;
				} else if (newFrames > 500) {
					newFrames = 500;
				}
				
				await sendOSCCommand(instance, commands.AUDIO_DELAY[0].toString(), newFrames);
				controllerVariables.audioMasterDelay = newFrames;

				instance.setVariableValues({
					'audio_delay_frames': msToFrames(newFrames).toString(),
					'audio_delay_ms': newFrames.toString()
				});
            },

			subscribe: (feedback) => {
				if (!instance.actions.hasOwnProperty(feedback.id)) {
					const type = 'audio_delay';

					instance.actions[feedback.id] = type;
					ConsoleLog(instance, `Creating button id ${feedback.id} of type ${type}`);
				}
			},

			unsubscribe: (feedback) => {
				if (instance.actions.hasOwnProperty(feedback.id)) {
					const type = 'audio_delay';
					delete instance.actions[feedback.id];
					ConsoleLog(instance, `Removing button id ${feedback.id} of type ${type}`);
				}
			}
        },
		[ActionId.transitions]: {
            name: 'Transitions',
			description: 'Control Transitions',
            options: [
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: 'transition', label: 'Change Transition' },
						{ id: 'time', label: 'Change Time' },
					],
					default: 'transition',
				},
				{
					id: 'transition',
					type: 'dropdown',
					label: 'Transition',
					choices: transitionChoices,
					default: transitionChoices[0]?.id,
					isVisible: (options) => { return options.action === 'transition'; }
				},
				{
					id: 'mirror',
					type: 'checkbox',
					label: 'Mirror Transition',
					default: false,
					isVisible: (options) => { return options.action === 'transition'; }
				},
				{
					id: 'time',
					type: 'textinput',
					label: 'Transition Time (ms)',
					default: "0",
					required: true,
					useVariables: true,
					isVisible: (options) => { return options.action === 'time'; }
				},
			],
			learn: (ev) => {
				const action = ev.options.action;

				if (action === 'time') {
					const currentTransitionTime = controllerVariables.currentTransTime;

					if (currentTransitionTime === undefined) {
						return undefined;
					}
	
					return {
						...ev.options,
						time: currentTransitionTime,
					}

				} else if (action === 'transition') {
					const currentTransition = controllerVariables.currentTransition;
					const mirror = controllerVariables.transitionInvert;

					if (currentTransition === undefined || mirror === undefined) {
						return undefined;
					}

					if (transitionsList.hasOwnProperty(currentTransition)) {
						const transition = transitionsList[currentTransition];
						const transitionKey = Object.keys(transitionsList).find(key => transitionsList[key] === transition);

						return {
							...ev.options,
							transition: transitionKey,
							mirror: mirror,
						}
					}
	
				}

				return undefined;
			
			},
            callback: async (ev, context) => {
				const action = ev.options.action as string;

				if (action === 'transition') {
					const _transition = ev.options.transition as transitionType;
					const mirror = ev.options.mirror as boolean;

					if (transitionsList.hasOwnProperty(_transition)) {
						const transition = transitionsList[_transition];

						await sendOSCCommand(instance, transition.command[0].toString(), transition.command[1].toString());

						if (transition.data !== null) {
							await sendOSCCommand(instance, transition.data[0].toString(), transition.data[1].toString());
						}
					} else {
						ConsoleLog(instance, `Transition ${_transition} not found`, LogLevel.ERROR, false);
					}


					if (mirror) {
						await sendOSCCommand(instance, commands.TRANSITION_MIRROR.toString(), 1);
					} else {
						await sendOSCCommand(instance, commands.TRANSITION_MIRROR.toString(), 0);
					}

				} else if (action === 'time') {
					const varString = await context.parseVariablesInString(ev.options.time.toString());
					const time = Number(varString);

					if (time === undefined || time === null || isNaN(time)) {
						ConsoleLog(instance, 'Invalid time value. Must be a numeric value.', LogLevel.ERROR, false);
						return;
					}

					let currentTransTime = time;

					if (currentTransTime < 0) {
						currentTransTime = 0;
					}
	
					// Ensure currentTransTime does not exceed 60 seconds
					if (currentTransTime > 60000) {
						currentTransTime = 60000;
					}

					controllerVariables.currentTransTime = currentTransTime;
	
					await sendOSCCommand(instance, commands.TRANSITION_TIME.toString(), currentTransTime.toString());

				}

				instance.setVariableValues({
					'transition_time': controllerVariables.currentTransTime.toString(),
				});
            },

			subscribe: (feedback) => {
				if (!instance.actions.hasOwnProperty(feedback.id)) {
					const type = 'transitions';

					instance.actions[feedback.id] = type;
					ConsoleLog(instance, `Creating button id ${feedback.id} of type ${type}`);
				}
			},

			unsubscribe: (feedback) => {
				if (instance.actions.hasOwnProperty(feedback.id)) {
					const type = 'transitions';
					delete instance.actions[feedback.id];
					ConsoleLog(instance, `Removing button id ${feedback.id} of type ${type}`);
				}
			}
        },
		[ActionId.auto_switching]: {
            name: 'Auto Switching',
			description: 'Control Auto Switching',
            options: [
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: 'enable', label: 'Enable' },
						{ id: 'disable', label: 'Disable' },
						{ id: 'toggle', label: 'Toggle' },
					],
					default: 'toggle',
				}
			],
            callback: async (ev, context) => {
				const action = ev.options.action as string;

				if (action === 'enable') {
					await sendOSCCommand(instance, commands.AUTOSWITCH_ENABLE[0].toString(), commands.AUTOSWITCH_ENABLE[1]);
					controllerVariables.autoswitchEnabled = true;

				} else if (action === 'disable') {
					await sendOSCCommand(instance, commands.AUTOSWITCH_DISABLE[0].toString(), commands.AUTOSWITCH_DISABLE[1]);
					controllerVariables.autoswitchEnabled = false;

				} else if (action === 'toggle') {
					if (controllerVariables.autoswitchEnabled) {
						await sendOSCCommand(instance, commands.AUTOSWITCH_DISABLE[0].toString(), commands.AUTOSWITCH_DISABLE[1]);
						controllerVariables.autoswitchEnabled = false;
			
					} else {
						await sendOSCCommand(instance, commands.AUTOSWITCH_ENABLE[0].toString(), commands.AUTOSWITCH_ENABLE[1]);
						controllerVariables.autoswitchEnabled = true;
			
					}
				}

				instance.checkFeedbacks('auto_switching');			
            },

			subscribe: (feedback) => {
				if (!instance.actions.hasOwnProperty(feedback.id)) {
					const type = 'auto_switching';

					instance.actions[feedback.id] = type;
					ConsoleLog(instance, `Creating button id ${feedback.id} of type ${type}`);
				}
			},

			unsubscribe: (feedback) => {
				if (instance.actions.hasOwnProperty(feedback.id)) {
					const type = 'auto_switching';
					delete instance.actions[feedback.id];
					ConsoleLog(instance, `Removing button id ${feedback.id} of type ${type}`);
				}
			}
        },
		[ActionId.logo]: {
            name: 'Logo',
			description: 'Control Logo',
            options: [
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: 'enable', label: 'Enable' },
						{ id: 'disable', label: 'Disable' },
						{ id: 'toggle', label: 'Toggle' },
					],
					default: 'toggle',
				}
			],
            callback: async (ev, context) => {
				const action = ev.options.action as string;

				if (action === 'enable') {
					await sendOSCCommand(instance, commands.SHOW_LOGO_ENABLE[0].toString(), commands.SHOW_LOGO_ENABLE[1]);
					controllerVariables.logoEnabled = true;

				} else if (action === 'disable') {
					await sendOSCCommand(instance, commands.SHOW_LOGO_DISABLE[0].toString(), commands.SHOW_LOGO_DISABLE[1]);
					controllerVariables.logoEnabled = false;

				} else if (action === 'toggle') {
					if (controllerVariables.logoEnabled) {
						await sendOSCCommand(instance, commands.SHOW_LOGO_DISABLE[0].toString(), commands.SHOW_LOGO_DISABLE[1]);
						controllerVariables.logoEnabled = false;
			
					} else {
						await sendOSCCommand(instance, commands.SHOW_LOGO_ENABLE[0].toString(), commands.SHOW_LOGO_ENABLE[1]);
						controllerVariables.logoEnabled = true;
			
					}
				}

				instance.checkFeedbacks('logo');

            },

			subscribe: (feedback) => {
				if (!instance.actions.hasOwnProperty(feedback.id)) {
					const type = 'logo';

					instance.actions[feedback.id] = type;
					ConsoleLog(instance, `Creating button id ${feedback.id} of type ${type}`);
				}
			},

			unsubscribe: (feedback) => {
				if (instance.actions.hasOwnProperty(feedback.id)) {
					const type = 'logo';
					delete instance.actions[feedback.id];
					ConsoleLog(instance, `Removing button id ${feedback.id} of type ${type}`);
				}
			}
        },
		[ActionId.set_framerate]: {
            name: 'Frame Rate',
			description: 'Control the Frame Rate',
            options: [
				{
					id: 'framerate',
					type: 'dropdown',
					label: 'Frame Rate',
					choices: [
						{ id: '23', label: '23.98' },
						{ id: '24', label: '24' },
						{ id: '25', label: '25' },
						{ id: '29', label: '29.97' },
						{ id: '30', label: '30' },
						{ id: '50', label: '50' },
						{ id: '59', label: '59.94' },
						{ id: '60', label: '60' },
					],
					default: '25',
				}
			],
			learn: (ev) => {
				const frameRate = controllerVariables.frameRate;

				if (frameRate === undefined) {
					return undefined;
				}

				return {
					...ev.options,
					framerate: frameRate.toString(),
				}
			
			},
            callback: async (ev, context) => {
				const action = ev.options.framerate as string;

				if (frameRateList.hasOwnProperty(action)) {
					const frameRate = frameRateList[action];

					await sendOSCCommand(instance, frameRate.command[0].toString(), frameRate.command[1]);
				}

				controllerVariables.frameRate = action;

				instance.setVariableValues({
					'frame_rate': controllerVariables.frameRate.toString(),
				});
            },

			subscribe: (feedback) => {
				if (!instance.actions.hasOwnProperty(feedback.id)) {
					const type = 'set_framerate';

					instance.actions[feedback.id] = type;
					ConsoleLog(instance, `Creating button id ${feedback.id} of type ${type}`);
				}
			},

			unsubscribe: (feedback) => {
				if (instance.actions.hasOwnProperty(feedback.id)) {
					const type = 'set_framerate';
					delete instance.actions[feedback.id];
					ConsoleLog(instance, `Removing button id ${feedback.id} of type ${type}`);
				}
			}
        },
		[ActionId.keying]: {
            name: 'Keying',
			description: 'Trigger keying for inputs',
            options: [
				{
					id: 'control',
					type: 'dropdown',
					label: 'Input',
					choices: inputButtonChoices,
					default: inputButtonChoices[0]?.id
				},
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: 'enable', label: 'Enable Key' },
						{ id: 'disable', label: 'Disable Key' },
						{ id: 'toggle', label: 'Toggle Key' },
					],
					default: 'toggle',
				},
				{
					id: 'keying_type',
					type: 'dropdown',
					label: 'Key Source',
					choices: [
						{ id: 'chroma', label: 'Chroma' },
					],
					default: 'chroma',
					isVisible: (options) => { return options.action !== 'disable'; }
				},
				{
					id: 'keying_source',
					type: 'dropdown',
					label: 'Background',
					choices: keySourceChoices,
					default: keySourceChoices[0]?.id,
					isVisible: (options) => { return options.keying_type !== 'none' && options.action !== 'disable'; }
				},
				{
					id: 'keying_col',
					type: 'dropdown',
					label: 'Key Color',
					choices: [
						{ id: 'green', label: 'Green' },
						{ id: 'blue', label: 'Blue' },
					],
					default: 'green',
					isVisible: (options) => { return options.keying_type !== 'none' && options.action !== 'disable'; }
				}
			],
            callback: async (ev, context) => {

				const value = ev.options.control as buttonPressInputsType;
				const keying_type = ev.options.keying_type as string;
				const keying_col = ev.options.keying_col as string;
				const action = ev.options.action as string;
				const keying_source = ev.options.keying_source as buttonPressInputsType | buttonPressMediaType | string;;

				if (value && buttonList.hasOwnProperty(value)) {
					const button = buttonList[value];

					if (action === 'enable' || (action == 'toggle' && button.keyingMode === keyingMode.NONE)) {

						if (keying_type === 'chroma') {
							await sendOSCCommand(instance, `/videoIn/${button.id+1}/key_mode`, keyingMode.CHROMA);
							buttonList[value].keyingMode = keyingMode.CHROMA;
						}
	
						if (keying_col === 'green') {
							await sendOSCCommand(instance, `/videoIn/${button.id+1}/chroma_key_colour`, keyingCol.GREEN);
							buttonList[value].keyingCol = keyingCol.GREEN;
						} if (keying_col === 'blue') {
							await sendOSCCommand(instance, `/videoIn/${button.id+1}/chroma_key_colour`, keyingCol.BLUE);
							buttonList[value].keyingCol = keyingCol.BLUE;
						}

						if (keying_source) {
							if (keying_source === 'transparent') {
								await sendOSCCommand(instance, `/videoIn/${button.id+1}/bkg_source`, '');
								await sendOSCCommand(instance, `/videoIn/${button.id+1}/source_file`, '');

							} else if (buttonList.hasOwnProperty(keying_source)) {
								const source = buttonList[keying_source];

								if (source.optgroup === "Media") {
									await sendOSCCommand(instance, `/videoIn/${button.id+1}/bkg_source`, 'mediaButton');
	
								} else if (source.optgroup === "Inputs") {
									await sendOSCCommand(instance, `/videoIn/${button.id+1}/bkg_source`, 'videoInput');
	
								}
	
								await sendOSCCommand(instance, `/videoIn/${button.id+1}/source_file`, `${source.id+1}`);
							}
						}
						

					} else if (action === 'disable' || (action == 'toggle' && button.keyingMode !== keyingMode.NONE)) {

						await sendOSCCommand(instance, `/videoIn/${button.id+1}/key_mode`, keyingMode.NONE);
						buttonList[value].keyingMode = keyingMode.NONE;
					}

					instance.checkFeedbacks('keying');

				} else {
					ConsoleLog(instance, `Invalid input button: ${value}`, LogLevel.ERROR, false);
				}
            },

			subscribe: (feedback) => {
				if (!instance.actions.hasOwnProperty(feedback.id)) {
					const type = 'keying';

					instance.actions[feedback.id] = type;
					ConsoleLog(instance, `Creating button id ${feedback.id} of type ${type}`);
				}
			},

			unsubscribe: (feedback) => {
				if (instance.actions.hasOwnProperty(feedback.id)) {
					const type = 'keying';
					delete instance.actions[feedback.id];
					ConsoleLog(instance, `Removing button id ${feedback.id} of type ${type}`);
				}
			}
        },
		[ActionId.routing]: {
            name: 'Video Outputs',
			description: 'Control video outputs',
            options: [
				{
					id: 'output',
					type: 'dropdown',
					label: 'Output',
					choices: [
						{ id: 'outputA', label: 'HDMI A' },
						{ id: 'outputB', label: 'HDMI B' },
						{ id: 'outputUVC1', label: 'USB 1' },
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
						{ id: 'camera1', label: 'Camera 1' },
						{ id: 'camera2', label: 'Camera 2' },
						{ id: 'camera3', label: 'Camera 3' },
						{ id: 'camera4', label: 'Camera 4' },
						{ id: 'camera5', label: 'Camera 5' },
						{ id: 'camera6', label: 'Camera 6' },
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
					
				} else if (output === routingOutputs.UVC_1) {
					source = controllerVariables.uvc_1_output;
					
				}

				return {
					...ev.options,
					source: source.toString(),
				}
			
			},
            callback: async (ev, context) => {
				const output = ev.options.output as routingOutputs;
				const source = ev.options.source as routingSources;

				if (output === routingOutputs.HDMI_A) {
					await sendOSCCommand(instance, commands.HDMI_A_OUTPUT[0].toString(), source);

				} else if (output === routingOutputs.HDMI_B) {
					await sendOSCCommand(instance, commands.HDMI_B_OUTPUT[0].toString(), source);

				} else if (output === routingOutputs.UVC_1) {
					await sendOSCCommand(instance, commands.UVC_1_OUTPUT[0].toString(), source);
				}

            },

			subscribe: (feedback) => {
				if (!instance.actions.hasOwnProperty(feedback.id)) {
					const type = 'routing';

					instance.actions[feedback.id] = type;
					ConsoleLog(instance, `Creating button id ${feedback.id} of type ${type}`);
				}
			},

			unsubscribe: (feedback) => {
				if (instance.actions.hasOwnProperty(feedback.id)) {
					const type = 'routing';
					delete instance.actions[feedback.id];
					ConsoleLog(instance, `Removing button id ${feedback.id} of type ${type}`);
				}
			}
        },
		/*
		[ActionId.set_monitors]: {
            name: 'Monitor Levels',
			description: 'Control the monitor levels',
            options: [
				{
					id: 'control',
					type: 'dropdown',
					label: 'Monitor',
					choices: [
						{ id: MonitorChannels.HP1_VOL, label: 'Headphones 1' },
						{ id: MonitorChannels.HP2_VOL, label: 'Headphones 2' },
						{ id: MonitorChannels.MON_VOL, label: 'Monitors' },
					],
					default: MonitorChannels.HP1_VOL,
				},
				{
					id: 'mechanism',
					type: 'dropdown',
					label: 'Function',
					choices: [
						{ id: 'set', label: 'Set' },
						{ id: 'relative', label: 'Relative' },
					],
					default: 'set',
				},
				{
					id: 'relative_value',
					type: 'number',
					label: 'Offset by',
					max: 20,
					min: -20,
					default: 0,
					step: 1,
					range: true,
					required: true,
					isVisible: (options) => { return options.mechanism === 'relative'; }
				},
				{
					id: 'level',
					type: 'number',
					label: 'Level (0 - 255)',
					max: 255,
					min: 0,
					default: 0,
					step: 1,
					range: true,
					required: true,
					isVisible: (options) => { return options.mechanism === 'set'; }
				},
			],
			learn: (ev) => {
				const control = ev.options.control as MonitorChannels;
				const level = ev.options.level;
				const currentMonitor = controllerVariables.selectedMonitor as MonitorChannels;

				if (control === undefined || level === undefined) {
					return undefined;
				}

				const currentLevel = monitorChannels[control];

				return {
					...ev.options,
					control: currentMonitor,
					level: currentLevel,
				}
			
			},
            callback: async (ev, context) => {
				const control = ev.options.control as MonitorChannels;

				let monitor;

				if (control === MonitorChannels.HP1_VOL) {
					monitor = commands.HP1_VOL;

				} else if (control === MonitorChannels.HP2_VOL) {
					monitor = commands.HP2_VOL;

				} else if (control === MonitorChannels.MON_VOL) {
					monitor = commands.MON_VOL;

				}

				if (!monitor) {
					return;
				}

				if (ev.options.mechanism === 'set') {
					let level = Number(ev.options.level);

					if (level < 0) {
						level = 0;
					} else if (level > 255) {
						level = 255;
					}

					//await sendOSCCommand(instance, "/device/monitor_select", "0".toString());
					await sendOSCCommand(instance, monitor[0].toString(), level);

				} else if (ev.options.mechanism === 'relative') {
					const currentLevel = monitorChannels[control];
					let offset = Number(ev.options.relative_value);

					let adjust = currentLevel + offset;

					if (adjust < 0) {
						adjust = 0;
					} else if (adjust > 255) {
						adjust = 255;
					}

					await sendOSCCommand(instance, monitor[0].toString(), adjust);
					
				}
				
            },

			subscribe: (feedback) => {
				if (!instance.actions.hasOwnProperty(feedback.id)) {
					const type = 'set_monitors';

					instance.actions[feedback.id] = type;
					ConsoleLog(instance, `Creating button id ${feedback.id} of type ${type}`);
				}
			},

			unsubscribe: (feedback) => {
				if (instance.actions.hasOwnProperty(feedback.id)) {
					const type = 'set_monitors';
					delete instance.actions[feedback.id];
					ConsoleLog(instance, `Removing button id ${feedback.id} of type ${type}`);
				}
			}
        },
		*/
		[ActionId.setMedia]: {
            name: 'Set Media Bank',
			description: 'Change Media bank settings',
            options: [
				{
					id: 'media',
					type: 'textinput',
					label: 'Filename',
					useVariables: true
				},
				{
					id: 'important-line',
					type: 'static-text',
					label: '',
					value: 'Filename must be an exact match (including extension) from the SD card/Central'
				},
				{
					id: 'bank',
					type: 'dropdown',
					label: 'Bank',
					choices: [
						...mediaButtonChoices
					],  
					default: mediaButtonChoices[0]?.id
				},
				{
					id: 'playback',
					type: 'dropdown',
					label: 'Playback mode',
					choices: [
						{ id: 'once', label: 'Once' },
						{ id: 'loop', label: 'Loop' },
						{ id: 'switch', label: 'Switch To' }
					],
					default: 'once',
				},
				{
					id: 'switchto',
					type: 'dropdown',
					label: 'Switch to',
					choices: [
						...inputButtonChoices,
						...sceneButtonChoices,
						...mediaButtonChoices
					],  
					default: inputButtonChoices[0]?.id,
					isVisible: (options) => { return options.playback === 'switch'; }
				}
			],
            callback: async (ev, context) => {
				const media = await context.parseVariablesInString(ev.options.media.toString()) as string;
				const playback = ev.options.playback as string;
				const _bank = ev.options.bank as buttonPressMediaType;
				const _switchto = ev.options.switchto as buttonPressInputsType | buttonPressSceneType | buttonPressMediaType;
				let bank;
				let switchto;

				if (_bank) {
					switch(_bank) {
						case buttonPressMediaType.MEDIA_1:
							bank = '1';
							break;
						case buttonPressMediaType.MEDIA_2:
							bank = '2';
							break;
						case buttonPressMediaType.MEDIA_3:
							bank = '3';
							break;
						case buttonPressMediaType.MEDIA_4:
							bank = '4';
							break;
						case buttonPressMediaType.MEDIA_5:
							bank = '5';
							break;
						case buttonPressMediaType.MEDIA_6:
							bank = '6';
							break;
						case buttonPressMediaType.MEDIA_7:
							bank = '7';
							break;
						default:
							bank = null;
					}
				}

				if (_switchto) {
					switch(_switchto) {
						case buttonPressInputsType.INPUT_1:
							switchto = 'videoIn@0';
							break;
						case buttonPressInputsType.INPUT_2:
							switchto = 'videoIn@1';
							break;
						case buttonPressInputsType.INPUT_3:
							switchto = 'videoIn@2';
							break;
						case buttonPressInputsType.INPUT_4:
							switchto = 'videoIn@3';
							break;
						case buttonPressInputsType.INPUT_5:
							switchto = 'videoIn@4';
							break;
						case buttonPressInputsType.INPUT_6:
							switchto = 'videoIn@5';
							break;
						case buttonPressSceneType.SCENE_1:
							switchto = 'scene@0';
							break;
						case buttonPressSceneType.SCENE_2:
							switchto = 'scene@1';
							break;
						case buttonPressSceneType.SCENE_3:
							switchto = 'scene@2';
							break;
						case buttonPressSceneType.SCENE_4:
							switchto = 'scene@3';
							break;
						case buttonPressSceneType.SCENE_5:
							switchto = 'scene@4';
							break;
						case buttonPressSceneType.SCENE_6:
							switchto = 'scene@5';
							break;
						case buttonPressSceneType.SCENE_7:
							switchto = 'scene@6';
							break;
						case buttonPressMediaType.MEDIA_1:
							switchto = 'media@0';
							break;
						case buttonPressMediaType.MEDIA_2:
							switchto = 'media@1';
							break;
						case buttonPressMediaType.MEDIA_3:
							switchto = 'media@2';
							break;
						case buttonPressMediaType.MEDIA_4:
							switchto = 'media@3';
							break;
						case buttonPressMediaType.MEDIA_5:
							switchto = 'media@4';
							break;
						case buttonPressMediaType.MEDIA_6:
							switchto = 'media@5';
							break;
						case buttonPressMediaType.MEDIA_7:
							switchto = 'media@6';
							break;
						default:
							switchto = null;
					}
				}

				if (bank) {
					await sendOSCCommand(instance, `/show/MediaFiles/${bank}/name`, media);
					await sendOSCCommand(instance, `/show/MediaFiles/${bank}/file_path`, media);

					if (playback === 'switch' && switchto) {
						await sendOSCCommand(instance, `/show/MediaFiles/${bank}/next_scene_type`, switchto);
					} else if (playback === 'loop') {
						await sendOSCCommand(instance, `/show/MediaFiles/${bank}/next_scene_type`, 'loop');
					} else if (playback === 'once') {
						await sendOSCCommand(instance, `/show/MediaFiles/${bank}/next_scene_type`, 'none');
					}
				} else {
					ConsoleLog(instance, 'Bank not found', LogLevel.ERROR);
				}
            },

			subscribe: (feedback) => {
				if (!instance.actions.hasOwnProperty(feedback.id)) {
					const type = 'setMedia';

					instance.actions[feedback.id] = type;
					ConsoleLog(instance, `Creating button id ${feedback.id} of type ${type}`);
				}
			},

			unsubscribe: (feedback) => {
				if (instance.actions.hasOwnProperty(feedback.id)) {
					const type = 'setMedia';
					delete instance.actions[feedback.id];
					ConsoleLog(instance, `Removing button id ${feedback.id} of type ${type}`);
				}
			}
        },
		[ActionId.setOverlay]: {
            name: 'Set Overlay Bank',
			description: 'Change Overlay bank settings',
            options: [
				{
					id: 'overlay',
					type: 'textinput',
					label: 'Filename',
					useVariables: true
				},
				{
					id: 'important-line',
					type: 'static-text',
					label: '',
					value: 'Filename must be an exact match (including extension) from the SD card/Central'
				},
				{
					id: 'bank',
					type: 'dropdown',
					label: 'Bank',
					choices: [
						...overlayButtonChoices
					],  
					default: overlayButtonChoices[0]?.id
				},
				{
					id: 'transition',
					type: 'dropdown',
					label: 'Transition',
					choices: [
						{ id: 'cut', label: 'Cut' },
						{ id: 'fade', label: 'Fade' },
					],
					default: 'cut',
				},
				{
					id: 'time',
					type: 'textinput',
					label: 'Transition Time (ms)',
					default: "0",
					required: true,
					useVariables: true,
					isVisible: (options) => { return options.transition === 'fade'; }
				},
			],
            callback: async (ev, context) => {
				const overlay = await context.parseVariablesInString(ev.options.overlay.toString()) as string;
				const transition = ev.options.transition as string;
				const varTimeString = await context.parseVariablesInString(ev.options.time.toString());
				const time = Number(varTimeString);

				const _bank = ev.options.bank as buttonPressOverlayType;
				let bank;
				let switchto;

				if (_bank) {
					switch(_bank) {
						case buttonPressOverlayType.OVERLAY_1:
							bank = '1';
							break;
						case buttonPressOverlayType.OVERLAY_2:
							bank = '2';
							break;
						case buttonPressOverlayType.OVERLAY_3:
							bank = '3';
							break;
						case buttonPressOverlayType.OVERLAY_4:
							bank = '4';
							break;
						case buttonPressOverlayType.OVERLAY_5:
							bank = '5';
							break;
						case buttonPressOverlayType.OVERLAY_6:
							bank = '6';
							break;
						case buttonPressOverlayType.OVERLAY_7:
							bank = '7';
							break;
						default:
							bank = null;
					}
				}

				if (bank) {
					await sendOSCCommand(instance, `/show/OverlayFiles/${bank}/name`, overlay);
					await sendOSCCommand(instance, `/show/OverlayFiles/${bank}/file_path`, overlay);

					if (transition === 'fade' && time) {
						await sendOSCCommand(instance, `/show/OverlayFiles/${bank}/transition`, 'fade');
						await sendOSCCommand(instance, `/show/OverlayFiles/${bank}/transition_time`, time.toString());
					} else {
						await sendOSCCommand(instance, `/show/OverlayFiles/${bank}/transition`, 'cut');
					}
				} else {
					ConsoleLog(instance, 'Bank not found', LogLevel.ERROR);
				}
            },

			subscribe: (feedback) => {
				if (!instance.actions.hasOwnProperty(feedback.id)) {
					const type = 'setOverlay';

					instance.actions[feedback.id] = type;
					ConsoleLog(instance, `Creating button id ${feedback.id} of type ${type}`);
				}
			},

			unsubscribe: (feedback) => {
				if (instance.actions.hasOwnProperty(feedback.id)) {
					const type = 'setOverlay';
					delete instance.actions[feedback.id];
					ConsoleLog(instance, `Removing button id ${feedback.id} of type ${type}`);
				}
			}
        },
	})
}