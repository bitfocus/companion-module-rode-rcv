import { XMLParser } from "fast-xml-parser";
import { commands } from "../modules/commands.js";
import { submixList, buttonList, controllerVariables, drives, mixerChannels, monitorChannels, timecodes, wirelessMic, videoSources, mediaSources, overlaySources, sceneSources, rcvPhysicalButtons } from '../modules/constants.js';
import { MonitorChannels, SubmixChannels, transtionCategory, RCVSourceModes, buttonPressControlType, LogLevel, keyingMode, keyingCol, audioChannels, MetersChannel, mediaType, pressMode } from '../modules/enums.js';
import { AudioAudioSourceCh } from "../modules/interfaces.js";
import { ConsoleLog } from "../modules/logger.js";
import { sendOSCCommand } from "../modules/oscController.js";
import { isSubmixProperty, framesToMs, msToFrames, getKeyByValue, getMediaType } from "../helpers/commonHelpers.js";
import { RCVInstance } from '../index.js';
import { floatToDb } from '../helpers/decibelHelper.js';
import { getActiveMixes, meterLevelToPercentage, parseMeterValues } from "../helpers/metersHelper.js";
import { FeedbackId } from "../feedbacks/feedbacks.js";

const parserOptions = {
	ignoreAttributes: false,
	attributeNamePrefix: "@_",
	parseAttributeValue: true,
};

const xmlParser = new XMLParser(parserOptions);
const debug = true;


/**
 * Handles incoming data and updates plugin states accordingly.
 * @param command The command as a string.
 * @param args The arguments on the packet.
 */
export async function handleIncomingData(instance: RCVInstance, command: string, args: any) {

	if (debug && command !== '/meters/values' && !command.includes('/videoIn') ) {
		ConsoleLog(instance, `Received message: ${command}, args: ${JSON.stringify(args)}`, LogLevel.INFO, false);
	}
	
	// Handle record enabled
	if (command === '/show/recordEnabled') {
		controllerVariables.recordEnabled = !!args[0];
		instance.checkFeedbacks(FeedbackId.is_recording);
		ConsoleLog(instance, `RecordEnabled flag set to ${controllerVariables.recordEnabled}`, LogLevel.DEBUG, false);
		return;
	}
	
	//Handle show dump
	if (command === '/show') {

		let parsed = xmlParser.parse(args[0].toString());

		if (parsed) {

			controllerVariables.startup = true;

			//Get Switching Mode
			if (parsed.RcvShow && parsed.RcvShow['@_switching_mode']) {

				const mode = parsed.RcvShow['@_switching_mode'];

				if (mode === 'studioLeft') {
					controllerVariables.studioMode = true;
				} else {
					controllerVariables.studioMode = false;
				}

				instance.setVariableValues({
					'switching_mode': controllerVariables.studioMode ? 'studio' : 'instant',
				});
			}

			//Handle Show Name
			if (parsed.RcvShow && parsed.RcvShow['@_name']) {
				controllerVariables.showName = parsed.RcvShow['@_name'];

				instance.setVariableValues({
					'show_name': controllerVariables.showName,
				});
			}

			//Handle Logo
			if (parsed.RcvShow && '@_logoEnable' in parsed.RcvShow) {
				const logoEnabled = parsed.RcvShow['@_logoEnable'];

				if (logoEnabled === true) {
					controllerVariables.logoEnabled = true;
					
				} else {
					controllerVariables.logoEnabled = false;
				}

				instance.checkFeedbacks(FeedbackId.logo);
			}

			//Handle HDMI Outputs
			if (parsed.RcvShow && parsed.RcvShow['@_hdmi1_out']) {
				controllerVariables.hdmi_B_output = parsed.RcvShow['@_hdmi1_out'];
				ConsoleLog(instance, `HDMI Output 1 set to ${controllerVariables.hdmi_B_output}`, LogLevel.DEBUG, false);
			}

			if (parsed.RcvShow && parsed.RcvShow['@_hdmi2_out']) {
				controllerVariables.hdmi_A_output = parsed.RcvShow['@_hdmi2_out'];
				ConsoleLog(instance, `HDMI Output 2 set to ${controllerVariables.hdmi_A_output}`, LogLevel.DEBUG, false);
			}

			if (parsed.RcvShow && parsed.RcvShow['@_usb1_uvc_out']) {
				controllerVariables.uvc_1_output = parsed.RcvShow['@_usb1_uvc_out'];
				ConsoleLog(instance, `UVC Output 1 set to ${controllerVariables.uvc_1_output}`, LogLevel.DEBUG, true);
			}

			//Hande Framerate
			if (parsed.RcvShow && parsed.RcvShow['@_frameRate']) {

				controllerVariables.frameRate = parsed.RcvShow['@_frameRate'];

				instance.setVariableValues({
					'frame_rate': controllerVariables.frameRate.toString(),
				});

			}

			//Pull Current Transition
			if (parsed.RcvShow && (parsed.RcvShow['@_transition'] || parsed.RcvShow['@_transition_data']) && parsed.RcvShow['@_transition_time'] !== undefined && parsed.RcvShow['@_transition_time'] !== null) {
				const _currentTransition = parsed.RcvShow['@_transition'];
				const _currentTransitionData = parsed.RcvShow['@_transition_data'];
				const _currentTransitionTime = parseFloat(parsed.RcvShow['@_transition_time']);
				const _transitionWipe = parsed.RcvShow['@_invert_wipe'];

				if (_currentTransitionTime !== null) {
					controllerVariables.currentTransTime = _currentTransitionTime;
				}

				if (_currentTransitionData && _currentTransitionData !== undefined && _currentTransitionData !== null) {
					controllerVariables.currentTransition = _currentTransitionData
					controllerVariables.currentTransitionCat = _currentTransition;
				} else {
					controllerVariables.currentTransition = _currentTransition;	
				}

				if (_transitionWipe !== null) {
					controllerVariables.transitionInvert = _transitionWipe;
				}

				instance.setVariableValues({
					'transition_time': controllerVariables.currentTransTime.toString(),
				});
			}


			//Setup audio channels

			if (parsed.RcvShow && parsed.RcvShow.AudioMixer && parsed.RcvShow.AudioMixer.masteraudiodelay) {
				const delay = parsed.RcvShow.AudioMixer.masteraudiodelay.valueMs;
				controllerVariables.audioMasterDelay = delay;

				if (controllerVariables.audioMasterDelayActive || delay > 0) {
					controllerVariables.audioMasterDelayActive = true;
				} else {
					controllerVariables.audioMasterDelayActive = false;
				}

				instance.setVariableValues({
					'audio_delay_frames': msToFrames(controllerVariables.audioMasterDelay).toString(),
					'audio_delay_ms': controllerVariables.audioMasterDelay.toString()
				});
			}

			if (parsed.RcvShow && parsed.RcvShow.AudioMixer && parsed.RcvShow.AudioMixer.audiosources) {
				const audiosources = parsed.RcvShow.AudioMixer.audiosources;

				const idToSubmixChannel = Object.fromEntries(
					Object.entries(submixList).map(([key, value]) => [value.id, key])
				);

				for (const mix_key in audiosources) {
					if (audiosources[mix_key]['enabled'] === true) {

						if (!mixerChannels.hasOwnProperty(mix_key) || 
							(mixerChannels.hasOwnProperty(mix_key) && 
							(audiosources[mix_key]['level'] !== mixerChannels[mix_key].gain || 
							 audiosources[mix_key]['name'] !== mixerChannels[mix_key].name || 
							 audiosources[mix_key]['position'] !== mixerChannels[mix_key].position))) {
								
							mixerChannels[mix_key] = { 
								version: audiosources[mix_key]['version'], 
								position: audiosources[mix_key]['position'], 
								name: audiosources[mix_key]['name'], 
								gain: audiosources[mix_key]['level'],
								submixes: []
							};

							const varName = `${getKeyByValue(audioChannels, mix_key).toLocaleLowerCase()}_setgain`;
							if (instance.variables.some(variable => variable.variableId === varName)) {

								instance.setVariableValues({
									[varName]: audiosources[mix_key]['level'].toString(),
								});

								ConsoleLog(instance, `Setting variable ${varName} to value ${audiosources[mix_key]['level']}`, LogLevel.DEBUG, false);

							} else {
								instance.variables.push({ variableId: varName, name: `${audiosources[mix_key]['name']} Gain` });
								instance.setVariableDefinitions(instance.variables);

								instance.setVariableValues({
									[varName]: audiosources[mix_key]['level'].toString(),
								});

								ConsoleLog(instance, `Creating variable ${varName} with value ${audiosources[mix_key]['level']}`, LogLevel.DEBUG, false);
							}

							ConsoleLog(instance, `Mixer channel ${audiosources[mix_key]['name']} (${mix_key}) updated with gain value ${audiosources[mix_key]['level']}.`, LogLevel.DEBUG, false);
						}
			
						const mixes = audiosources[mix_key]['mixes'];

						for (const [mix] of Object.entries(mixes)) {
							const match = mix.match(/^value(\d+)$/);
			
							if (match) {
								const submixId = match[1];
								const submix = idToSubmixChannel[submixId] as SubmixChannels;
								const levelString = mixes[mix]['level'];
								const muted = mixes[mix]['mute'];
			
								// Convert level string to float and ensure it is within the correct range
								let level = parseFloat(levelString);
								if (isNaN(level)) {
									ConsoleLog(instance, `Invalid level value: ${levelString}`, LogLevel.ERROR, false);
									level = 0;
								}
								if (level > 1.0) {
									level = 1.0;
								}
								if (level < 0.0) {
									level = 0.0;
								}
			
								const submixData: AudioAudioSourceCh = { 
									submix: submix,
									level: level, 
									muted: muted, 
									disabled: mixes[mix]['disabled'] === "true", 
									linked: mixes[mix]['link'] === "true" 
								};
			
								// Check if submixData with the same submix already exists
								const existingSubmixIndex = mixerChannels[mix_key].submixes!.findIndex(
									(existingSubmix) => existingSubmix.submix === submix
								);

								if (existingSubmixIndex !== -1) {
									// Update the existing submixData properties
									mixerChannels[mix_key].submixes![existingSubmixIndex] = submixData;
								} else {
									// If not found, add it as a new entry
									mixerChannels[mix_key].submixes!.push(submixData);
								}

								const varName = `${getKeyByValue(audioChannels, mix_key).toLocaleLowerCase()}-${submix}_setlevel`;
								if (instance.variables.some(variable => variable.variableId === varName)) {

									instance.setVariableValues({
										[varName]: floatToDb(submixData.level).toString(),
									});

									ConsoleLog(instance, `Setting variable ${varName} to value ${floatToDb(submixData.level)}. Muted: ${submixData.muted}`, LogLevel.DEBUG, false);

								} else {
									if (submix !== undefined) {
										instance.variables.push({ variableId: varName, name: `${mixerChannels[mix_key].name} Set Level` });
										instance.setVariableDefinitions(instance.variables);

										instance.setVariableValues({
											[varName]: floatToDb(submixData.level).toString(),
										});

										ConsoleLog(instance, `Creating variable ${varName} with value ${floatToDb(submixData.level)}`, LogLevel.DEBUG, false);
									}
								}
			
								ConsoleLog(instance, `[2] Submix ${submix} changed ${mixerChannels[mix_key].name} (${mix_key}) LEVEL to ${submixData.level}.`, LogLevel.DEBUG, false);

							}
						}
					} else {
						if (mixerChannels.hasOwnProperty(mix_key)) {

							//Remove reference
							delete mixerChannels[mix_key];
							ConsoleLog(instance, `Removed Mixer channel ${audiosources[mix_key]['name']} (${mix_key}).`, LogLevel.DEBUG, false);
						}
					}
				}

				controllerVariables.submixesReady = true;
				instance.checkFeedbacks(FeedbackId.audio_sources);

				//Refresh metering
				if (controllerVariables.submixesReady) {
					await getActiveMixes(instance);
				}
			}

			//Setup Sources
			if (parsed.RcvShow && parsed.RcvShow.VideoSources) {
				const _videoSources = parsed.RcvShow.VideoSources.VideoSource;
			
				if (Array.isArray(_videoSources)) {
					// Handle as an array
					_videoSources.forEach((source, index) => {
						videoSources[index] = { 
							name: source['@_name'],
							source: source['@_source']
						};
			
						ConsoleLog(instance, `${index} Video source (${source['@_name']}) updated with source type ${source['@_source']}.`, LogLevel.DEBUG, false);
					});
				} else {
					// Handle as an object
					Object.entries(_videoSources).forEach(([index, source]) => {
						videoSources[index] = { 
							name: source['@_name'],
							source: source['@_source']
						};
			
						ConsoleLog(instance, `${index} Video source (${source['@_name']}) updated with source type ${source['@_source']}.`, LogLevel.DEBUG, false);
					});
				}

				instance.setVariableValues({
					'input_1_name': videoSources[0]?.name || 'Unassigned',
					'input_2_name': videoSources[1]?.name || 'Unassigned',
					'input_3_name': videoSources[2]?.name || 'Unassigned',
					'input_4_name': videoSources[3]?.name || 'Unassigned',
					'input_5_name': videoSources[4]?.name || 'Unassigned',
					'input_6_name': videoSources[5]?.name || 'Unassigned',
				});
			
			}
			
			if (parsed.RcvShow && parsed.RcvShow.MediaFiles) {
				const _mediaSources = parsed.RcvShow.MediaFiles.File;
			
				if (Array.isArray(_mediaSources)) {
					// Handle as an array
					_mediaSources.forEach((source, index) => {
						mediaSources[index] = { 
							name: source['@_name'],
							pressMode: source['@_press_mode'] as pressMode,
							mediaType: getMediaType(source['@_file_path']),
							filename: source['@_file_path']
						};
			
						ConsoleLog(instance, `${index} Media source (${source['@_name']}) updated.`, LogLevel.DEBUG, false);
					});
				} else {
					// Handle as an object
					Object.entries(_mediaSources).forEach(([index, source]) => {
						mediaSources[index] = { 
							name: source['@_name']
						};
			
						ConsoleLog(instance, `${index} Media source (${source['@_name']}) updated.`, LogLevel.DEBUG, false);
					});
				}
		
				instance.setVariableValues({
					'media_A_name': mediaSources[0]?.name || 'Unassigned',
					'media_B_name': mediaSources[1]?.name || 'Unassigned',
					'media_C_name': mediaSources[2]?.name || 'Unassigned',
					'media_D_name': mediaSources[3]?.name || 'Unassigned',
					'media_E_name': mediaSources[4]?.name || 'Unassigned',
					'media_F_name': mediaSources[5]?.name || 'Unassigned',
					'media_G_name': mediaSources[6]?.name || 'Unassigned',
				});
			}
			
			if (parsed.RcvShow && parsed.RcvShow.Scenes) {
				const _sceneSources = parsed.RcvShow.Scenes.Scene;
			
				if (Array.isArray(_sceneSources)) {
					// Handle as an array
					_sceneSources.forEach((source, index) => {
						sceneSources[index] = { 
							name: source['@_name']
						};
			
						ConsoleLog(instance, `${index} Scene source (${source['@_name']}) updated.`, LogLevel.DEBUG, false);
					});
				} else {
					// Handle as an object
					Object.entries(_sceneSources).forEach(([index, source]) => {
						sceneSources[index] = { 
							name: source['@_name']
						};
			
						ConsoleLog(instance, `${index} Scene source (${source['@_name']}) updated.`, LogLevel.DEBUG, false);
					});
				}
				
				instance.setVariableValues({
					'scene_A_name': sceneSources[0]?.name || 'Unassigned',
					'scene_B_name': sceneSources[1]?.name || 'Unassigned',
					'scene_C_name': sceneSources[2]?.name || 'Unassigned',
					'scene_D_name': sceneSources[3]?.name || 'Unassigned',
					'scene_E_name': sceneSources[4]?.name || 'Unassigned',
					'scene_F_name': sceneSources[5]?.name || 'Unassigned',
					'scene_G_name': sceneSources[6]?.name || 'Unassigned',
				});
			}			

			if (parsed.RcvShow && parsed.RcvShow.OverlayFiles) {
				const _overlaySources = parsed.RcvShow.OverlayFiles.File;
			
				console.log('Overlay Sources', _overlaySources);
			
				if (Array.isArray(_overlaySources)) {
					// Handle as an array
					_overlaySources.forEach((source, index) => {
						overlaySources[index] = { 
							name: source['@_name']
						};
			
						ConsoleLog(instance, `${index} Overlay source (${source['@_name']}) updated.`, LogLevel.DEBUG, false);
					});
				} else {
					// Handle as an object
					Object.entries(_overlaySources).forEach(([index, source]) => {
						overlaySources[index] = { 
							name: source['@_name']
						};
			
						ConsoleLog(instance, `${index} Overlay source (${source['@_name']}) updated.`, LogLevel.DEBUG, false);
					});
				}

				instance.setVariableValues({
					'overlay_A_name': overlaySources[0]?.name || 'Unassigned',
					'overlay_B_name': overlaySources[1]?.name || 'Unassigned',
					'overlay_C_name': overlaySources[2]?.name || 'Unassigned',
					'overlay_D_name': overlaySources[3]?.name || 'Unassigned',
					'overlay_E_name': overlaySources[4]?.name || 'Unassigned',
					'overlay_F_name': overlaySources[5]?.name || 'Unassigned',
					'overlay_G_name': overlaySources[6]?.name || 'Unassigned',
				});
			}

			if (parsed.RcvShow && parsed.RcvShow['@_PgmOverlay'] !== null && parsed.RcvShow['@_PvwOverlay'] !== null && parsed.RcvShow['@_PgmOverlay'] !== undefined && parsed.RcvShow['@_PvwOverlay'] !== undefined) {
				const _pgmOverlay = parsed.RcvShow['@_PgmOverlay'];
				const _pvwOverlay = parsed.RcvShow['@_PvwOverlay'];

				controllerVariables.PgmOverlay = Number(_pgmOverlay);
				controllerVariables.PvwOverlay = Number(_pvwOverlay);
			
				for (const overlay in overlaySources) {

					if (overlaySources.hasOwnProperty(overlay)) {
						const overlayNumber = Number(overlay);

						if (overlayNumber === _pgmOverlay) {
							overlaySources[overlayNumber].state = 1; // Live/PGM

						} else if (overlayNumber === _pvwOverlay) {
							overlaySources[overlayNumber].state = 2; // PV

						} else {
							if (overlaySources[overlayNumber].name === null || overlaySources[overlayNumber].name === undefined || overlaySources[overlayNumber].name === "") {
								overlaySources[overlayNumber].state = 3; // Not assigned
							} else {
								overlaySources[overlayNumber].state = 0; // Unselected
							}

						}
					}
				}

				instance.checkFeedbacks(FeedbackId.overlays_state);

			}

			if (parsed.RcvShow && parsed.RcvShow['@_PgmScene'] !== null && parsed.RcvShow['@_PvwScene'] !== null && parsed.RcvShow['@_PgmScene'] !== undefined && parsed.RcvShow['@_PvwScene'] !== undefined) {
				const _PgmScene = parsed.RcvShow['@_PgmScene'];
				const _PvwScene = parsed.RcvShow['@_PvwScene'];

				controllerVariables.PgmScene = Number(_PgmScene);
				controllerVariables.PvwScene = Number(_PvwScene);
			
				for (const scene in sceneSources) {

					if (sceneSources.hasOwnProperty(scene)) {
						const sceneNumber = Number(scene);
						
						if (sceneNumber === _PgmScene) {
							sceneSources[sceneNumber].state = 1; // Live/PGM

						} else if (sceneNumber === _PvwScene) {
							sceneSources[sceneNumber].state = 2; // PV

						} else {
							if (sceneSources[sceneNumber].name === null || sceneSources[sceneNumber].name === undefined || sceneSources[sceneNumber].name === "") {
								sceneSources[sceneNumber].state = 3; // Not Assigned

							} else {
								sceneSources[sceneNumber].state = 0; // Unselected
							}

						}
						
					}
				}

				instance.checkFeedbacks(FeedbackId.scenes_state);
			}

			if (debug) {
				console.log(parsed.RcvShow);
			}
		}

		return;
	}

	//Show Name
	if (command.includes('/show/name')) {
		const name = args[0];

		controllerVariables.showName = name;

		instance.setVariableValues({
			'show_name': name,
		});

		return;
	}

	//Frame Rate
	if (command.includes('/show/frameRate')) {
		const frameRate = args[0];

		controllerVariables.frameRate = frameRate;

		instance.setVariableValues({
			'frame_rate': frameRate.toString(),
		});

		return;
	}

	//Handle switching mode
	if (command.includes('/show/switchingMode')) {
		const mode = args[0];

		if (mode === "studioLeft") {
			controllerVariables.studioMode = true;
		} else {
			controllerVariables.studioMode = false;
		}

		instance.setVariableValues({
			'switching_mode': controllerVariables.studioMode ? 'studio' : 'instant',
		});
		return;
	}

	//Logo Enabled
	if (command.includes('/show/logoEnable')) {
		const enabled = args[0];

		if (enabled === 1) {
			controllerVariables.logoEnabled = true;
		} else {
			controllerVariables.logoEnabled = false;
		}

		instance.checkFeedbacks(FeedbackId.logo);
	}

	//Handles sources updates
	if (command.includes('/show/scene')) {
		const key = command.split('/');
		const id = parseInt(key[3]);
		const property = key[4];

		if (property === 'name') {
			sceneSources[id-1] = { 
				name: args[0]
			};

			if (args[0] === '') {
				sceneSources[id-1].state = 3;
			}

			instance.setVariableValues({
				'scene_A_name': sceneSources[0]?.name || 'Unassigned',
				'scene_B_name': sceneSources[1]?.name || 'Unassigned',
				'scene_C_name': sceneSources[2]?.name || 'Unassigned',
				'scene_D_name': sceneSources[3]?.name || 'Unassigned',
				'scene_E_name': sceneSources[4]?.name || 'Unassigned',
				'scene_F_name': sceneSources[5]?.name || 'Unassigned',
				'scene_G_name': sceneSources[6]?.name || 'Unassigned',
			});

			ConsoleLog(instance, `${id} Scene source (${args[0]}) updated.`, LogLevel.DEBUG, false);
		}

		return;
	}

	if (command.includes('/show/PgmOverlay')) {
		const overlayId = parseInt(args[0]);

		controllerVariables.PgmOverlay = overlayId;

		for (const overlay in overlaySources) {
			const overlayNumber = Number(overlay);

			if (overlaySources.hasOwnProperty(overlay)) {
				
				if (overlayNumber === overlayId) {
					overlaySources[overlayNumber].state = 1; // Live/PGM

				} else if (overlayNumber !== controllerVariables.PvwOverlay) {
					if (overlaySources[overlayNumber].name === null || overlaySources[overlayNumber].name === undefined || overlaySources[overlayNumber].name === "") {
						overlaySources[overlayNumber].state = 3; // Not assigned

					} else {
						overlaySources[overlayNumber].state = 0; // Unselected

					}

				}
			}
		}

		instance.checkFeedbacks(FeedbackId.overlays_state);
		return;
	}

	if (command.includes('/show/PvwOverlay')) {
		const overlayId = parseInt(args[0]);

		controllerVariables.PvwOverlay = overlayId;

		for (const overlay in overlaySources) {

			if (overlaySources.hasOwnProperty(overlay)) {
				const overlayNumber = Number(overlay);

				if (overlayNumber === overlayId) {
					overlaySources[overlayNumber].state = 2; // PV

				} else if (overlayNumber !== controllerVariables.PgmOverlay) {
					if (overlaySources[overlayNumber].name === null || overlaySources[overlayNumber].name === undefined || overlaySources[overlayNumber].name === "") {
						overlaySources[overlayNumber].state = 3; // Not assigned

					} else {
						overlaySources[overlayNumber].state = 0; // Unselected

					}

				}
				
			}
		}

		instance.checkFeedbacks(FeedbackId.overlays_state);
		return;
	}

	if (command.includes('/show/OverlayFiles')) {
		const key = command.split('/');
		const id = parseInt(key[3]);
		const property = key[4];

		if (property === 'name') {
			overlaySources[id-1] = { 
				name: args[0]
			};

			if (args[0] === '') {
				overlaySources[id-1].state = 3;
			}

			ConsoleLog(instance, `${id} Overlay source (${args[0]}) updated.`, LogLevel.DEBUG, false);

			instance.setVariableValues({
				'overlay_A_name': overlaySources[0]?.name || 'Unassigned',
				'overlay_B_name': overlaySources[1]?.name || 'Unassigned',
				'overlay_C_name': overlaySources[2]?.name || 'Unassigned',
				'overlay_D_name': overlaySources[3]?.name || 'Unassigned',
				'overlay_E_name': overlaySources[4]?.name || 'Unassigned',
				'overlay_F_name': overlaySources[5]?.name || 'Unassigned',
				'overlay_G_name': overlaySources[6]?.name || 'Unassigned',
			});
		}

		

		return;
	}

	if (command.includes('/show/MediaFiles')) {
		const key = command.split('/');
		const id = parseInt(key[3]);
		const property = key[4];

		if (property === 'name') {
			mediaSources[id-1] = { 
				name: args[0]
			};

		} else if (property === 'file_path') {
			if (!mediaSources.hasOwnProperty(id-1)) {
				return;
			}

			if (args[0] === '') {
				mediaSources[id-1].state = 3;
			} else {
				mediaSources[id-1].mediaType = getMediaType(args[0]);
			}

		} else if (property === 'press_mode') {
			if (!mediaSources.hasOwnProperty(id-1)) {
				return;
			}

			if (args[0] === '') {
				mediaSources[id-1].state = 3;
			} else {
				mediaSources[id-1].pressMode = args[0] as pressMode;
			}
			
		} else {
			return;
		}

		ConsoleLog(instance, `${id} Media source (${args[0]}) updated.`, LogLevel.DEBUG, true);

		instance.setVariableValues({
			'media_A_name': mediaSources[0]?.name || 'Unassigned',
			'media_B_name': mediaSources[1]?.name || 'Unassigned',
			'media_C_name': mediaSources[2]?.name || 'Unassigned',
			'media_D_name': mediaSources[3]?.name || 'Unassigned',
			'media_E_name': mediaSources[4]?.name || 'Unassigned',
			'media_F_name': mediaSources[5]?.name || 'Unassigned',
			'media_G_name': mediaSources[6]?.name || 'Unassigned',
		});

		return;
	}

	//Device Fan
	if (command.includes('/device/fan')) {
		const speed = args[0];

		controllerVariables.fanSpeed = speed;

		instance.setVariableValues({
			'device_fanspeed': speed.toString(),
		});

		return;
	}


	//Handle input/scene buttons

	//Menu button
	if (command.includes('/device/buttons/101/colour')) {

		controllerVariables.mediaMenuColour = args[0];

		return;
	}

	//Overlay button
	if (command.includes('/device/buttons/102/colour')) {

		controllerVariables.overlayMenuColour = args[0];

		return;
	}

	//Keyer button
	if (command.includes('/device/buttons/104/colour')) {

		controllerVariables.keyerMenuColour = args[0];

		switch (args[0]) {
			case 5: //Green
				buttonList[buttonPressControlType.BUTTON_KEY].state = 1;
				break;
			case 9: //Yellow
				buttonList[buttonPressControlType.BUTTON_KEY].state = 1;
				break;
			default:
				buttonList[buttonPressControlType.BUTTON_KEY].state = 0;
				break;
		}

		instance.checkFeedbacks(FeedbackId.control_state);
		return;
	}

	//Cut button
	if (command.includes('/device/buttons/105/colour')) {

		switch (args[0]) {
			case 24:
				//Nominal
				buttonList[buttonPressControlType.BUTTON_CUT].state = 1;
				break;
			case 15:
				//Instant Mode Lit
				buttonList[buttonPressControlType.BUTTON_CUT].state = 2;
				break;
			default:
				break;
		}

		instance.checkFeedbacks(FeedbackId.control_state);
		return;
	}

	// Handle AUTO button
	if (command.includes('/device/buttons/106/colour')) {
		//8 - Autoswitching, 4 - Auto active, 1 - Auto deactivated
		switch (args[0]) {
			case 24:
				//Nominal
				buttonList[buttonPressControlType.BUTTON_AUTO].state = 1;
				break;
			case 15:
				//Instant Mode Lit
				buttonList[buttonPressControlType.BUTTON_AUTO].state = 2;
		
				break;
			case 4:
				buttonList[buttonPressControlType.BUTTON_AUTO].state = 2;
				break;
			case 8:
				buttonList[buttonPressControlType.BUTTON_AUTO].state = 2;
				break;
			case 1:
			default:
				buttonList[buttonPressControlType.BUTTON_AUTO].state = 1;
				break;
		}

		instance.checkFeedbacks(FeedbackId.control_state);
		return;
	}

	// Handle INSPECT button
	if (command.includes('/device/buttons/108/colour')) {
		//8 - Autoswitching, 4 - Auto active, 1 - Auto deactivated
		switch (args[0]) {
			case 11:
				buttonList[buttonPressControlType.BUTTON_INSPECT].state = 1; //Lit
				break;
			default:
				buttonList[buttonPressControlType.BUTTON_INSPECT].state = 0; //Off
				break;
		}

		instance.checkFeedbacks(FeedbackId.control_state);
		return;
	}

	//Input/Media Busses
	async function updateSourceStates(
		inputId: number,
		sources: any,
		updateButtonState: Function,
		sourceType: string,
		activeState: number,
		pvwId: number
	) {
		for (const source in sources) {
			if (sources.hasOwnProperty(source)) {
				const sourceNumber = Number(source);
				const sourceKey = `${sourceType}${sourceNumber + 1}`;
	
				if (sourceNumber === inputId) {
					sources[sourceNumber].state = activeState; // Set active state (1 for PGM, 2 for PVW)
				} else if (controllerVariables.studioMode && sourceNumber !== pvwId) {
					sources[sourceNumber].state = (sources[sourceNumber].name === null || sources[sourceNumber].name === undefined || sources[sourceNumber].name === "")
						? 3 // Not Assigned
						: 0; // Unselected
				} else if (!controllerVariables.studioMode) {
					sources[sourceNumber].state = (sources[sourceNumber].name === null || sources[sourceNumber].name === undefined || sources[sourceNumber].name === "")
						? 3 // Not Assigned
						: 0; // Unselected
				}
			}
		}

		instance.checkFeedbacks(FeedbackId.scenes_state);
		instance.checkFeedbacks(FeedbackId.overlays_state);
		instance.checkFeedbacks(FeedbackId.media_state);
		instance.checkFeedbacks(FeedbackId.input_state);
	}
	
	if (command.includes('/show/pgmcurrent')) {
		const inputType = args[0];
		const inputId = Number(args[1]) - 1;
	
		if (inputType === "media") {
			controllerVariables.PgmMedia = inputId;
			controllerVariables.PgmScene = -1;
			controllerVariables.PgmInput = -1;
	
			await updateSourceStates(inputId, mediaSources, null, 'media', 1, controllerVariables.PvwMedia);
			await updateSourceStates(-1, sceneSources, null, 'scene', 0, controllerVariables.PvwScene);
			await updateSourceStates(-1, videoSources, null, 'input', 0, controllerVariables.PvwInput);
	
		} else if (inputType === "scene") {
			controllerVariables.PgmScene = inputId;
			controllerVariables.PgmInput = -1;
			controllerVariables.PgmMedia = -1;
	
			await updateSourceStates(inputId, sceneSources, null, 'scene', 1, controllerVariables.PvwScene);
			await updateSourceStates(-1, mediaSources, null, 'media', 0, controllerVariables.PvwMedia);
			await updateSourceStates(-1, videoSources, null, 'input', 0, controllerVariables.PvwInput);
	
		} else if (inputType === "videoIn") {
			controllerVariables.PgmInput = inputId;
			controllerVariables.PgmScene = -1;
			controllerVariables.PgmMedia = -1;
	
			await updateSourceStates(inputId, videoSources, null, 'input', 1, controllerVariables.PvwInput);
			await updateSourceStates(-1, sceneSources, null, 'scene', 0, controllerVariables.PvwScene);
			await updateSourceStates(-1, mediaSources, null, 'media', 0, controllerVariables.PvwMedia);
		}
	}
	
	if (command.includes('/show/pvwcurrent') && controllerVariables.studioMode) {
		const inputType = args[0];
		const inputId = Number(args[1]) - 1;
	
		if (inputType === "media") {
			controllerVariables.PvwMedia = inputId;
			controllerVariables.PvwScene = -1;
			controllerVariables.PvwInput = -1;
	
			await updateSourceStates(inputId, mediaSources, null, 'media', 2, controllerVariables.PgmMedia);
			await updateSourceStates(-1, sceneSources, null, 'scene', 0, controllerVariables.PgmScene);
			await updateSourceStates(-1, videoSources, null, 'input', 0, controllerVariables.PgmInput);
	
		} else if (inputType === "scene") {
			controllerVariables.PvwScene = inputId;
			controllerVariables.PvwInput = -1;
			controllerVariables.PvwMedia = -1;
	
			await updateSourceStates(inputId, sceneSources, null, 'scene', 2, controllerVariables.PgmScene);
			await updateSourceStates(-1, mediaSources, null, 'media', 0, controllerVariables.PgmMedia);
			await updateSourceStates(-1, videoSources, null, 'input', 0, controllerVariables.PgmInput);
	
		} else if (inputType === "videoIn") {
			controllerVariables.PvwInput = inputId;
			controllerVariables.PvwScene = -1;
			controllerVariables.PvwMedia = -1;
	
			await updateSourceStates(inputId, videoSources, null, 'input', 2, controllerVariables.PgmInput);
			await updateSourceStates(-1, sceneSources, null, 'scene', 0, controllerVariables.PgmScene);
			await updateSourceStates(-1, mediaSources, null, 'media', 0, controllerVariables.PgmMedia);
		}
	}
	

	//Control Busses
	const sceneButtonsFilter = /\/device\/buttons\/([1-9]|1[0-4])\/colour/;
	if (sceneButtonsFilter.test(command)) {

		const key = command.split('/');
		rcvPhysicalButtons[key[3]] = args[0];
		console.log(`button ${key[3]} set to ${args[0]}`);
		instance.checkFeedbacks(FeedbackId.visualSwitcher);

		const allButtonPressTypes = [
			...Object.values(buttonPressControlType),
		];
		
		for (const button of allButtonPressTypes) {
			const buttonProperties = buttonList[button as keyof typeof buttonList];
		
			// 02 - Unassigned, 03 - Standby, 04 - PGM, 05 - PV, 07 - MediaBus, 10 - Inspect, 8 - Overlay, 13 - Invalid
			//0 - Invalid, 1 - Idle, 2 - Active, 3 - Preview
			if (buttonProperties) {
				if (buttonProperties.path && buttonProperties.path === command) {
					switch (args[0]) {
						case 10:
						case 8:
						case 7:
						case 3:
							buttonProperties.state = 1;
							break;
						case 4:
							buttonProperties.state = 2;
							break;
						case 5:
							buttonProperties.state = 3;
							break;
						case 2:
						default:
							buttonProperties.state = 0;
							break;
					}

					ConsoleLog(instance, `Button ${buttonProperties.title} state set to ${buttonProperties.state}`, LogLevel.DEBUG, false);
				}
			}

		}

		instance.checkFeedbacks(FeedbackId.control_state);
		return;
	}


	// Handle streaming allowed
	if (command.includes('/show/liveEnabled')) {
		if (args[0] === 1) {
			controllerVariables.allowStream = true;
		} else {
			controllerVariables.allowStream = false;
		}

		ConsoleLog(instance, `Stream state set to ${controllerVariables.allowStream}`, LogLevel.DEBUG, false);

		instance.checkFeedbacks(FeedbackId.is_streaming);
		return;
	}

	if (command === '/show/live') {

		if (args[0] === 1) {
			controllerVariables.streaming = true;
		} else {
			controllerVariables.streaming = false;
			
		}

		instance.checkFeedbacks(FeedbackId.is_streaming);

		return;
	}


	// Handle streaming indicator (14 - Streaming, 15 - Not Streaming)
	if (command.includes('/device/leds/121/colour') && controllerVariables.allowStream) {
		if (args[0] === 14) {
			controllerVariables.streaming = true;
		} else {
			controllerVariables.streaming = false;
		}

		instance.checkFeedbacks(FeedbackId.is_streaming);

		return;
	}

	// Handle recording allowed
	if (command.includes('/show/recordEnabled')) {
		if (args[0] === 1) {
			controllerVariables.allowRecord = true;
		} else {
			controllerVariables.allowRecord = false;
		}

		instance.checkFeedbacks(FeedbackId.is_recording);

		ConsoleLog(instance, `Record state set to ${controllerVariables.allowRecord}`, LogLevel.DEBUG, false);
		return;
	}

	if (command === '/show/record') {

		if (args[0] === 1) {
			controllerVariables.recording = true;
		} else {
			controllerVariables.recording = false;
			
		}
		
		instance.checkFeedbacks(FeedbackId.is_recording);
		return;
	}


	// Handle recording indicator (14 - Recording, 15 - Not Recording)
	
	if (command.includes('/device/leds/120/colour') && controllerVariables.allowRecord) {
		if (args[0] === 14) {
			controllerVariables.recording = true;
		} else {
			controllerVariables.recording = false;
			
		}

		instance.checkFeedbacks(FeedbackId.is_recording);
		return;
	}

	//Handle Drives
	if (command.includes('/diskStatus')) {
		const key = command.split('/');
		const property = key[3];

		if (property === 'disk') {
			const driveid = parseInt(key[2]);

			drives[driveid] = { name: args[1], type: args[0], storageFull: args[3], storageRemain: args[2]};

			const totalStorage = Number(args[3]) + Number(args[2]);
			const percentageFull = (args[3] / totalStorage) * 100;

			if (args[0] === 'USB') {
				instance.setVariableValues({
					'storage_usb_data_used': args[3],
					'storage_usb_data_remain': args[2],
					'storage_usb_percent': percentageFull.toFixed(2),
				});
			} else if (args[0] === 'uSD') {
				
				instance.setVariableValues({
					'storage_sd_data_used': args[3],
					'storage_sd_data_remain': args[2],
					'storage_sd_percent': percentageFull.toFixed(2),
				});
			}
		}

		return;
	}

	// Handle timecodes
	if (command === '/show/activeTimes') {

		timecodes.streamTime = args[0];
		timecodes.recordTime = args[1];

		instance.setVariableValues({
			'stream_timecode': timecodes.streamTime || '00:00:00',
			'record_timecode': timecodes.recordTime || '00:00:00'
		});

		return;
	}
	
	//Handle menu soft buttons
	if (command.includes('/uiButtonMode')) {

		switch(args[0]) {
			case 1: //Keyer
				buttonList[buttonPressControlType.BUTTON_MEDIA].state = 1;
				buttonList[buttonPressControlType.BUTTON_MULTISOURCE].state = 1;
				buttonList[buttonPressControlType.BUTTON_OVERLAY].state = 1;
				buttonList[buttonPressControlType.BUTTON_KEY].state = 2;
				buttonList[buttonPressControlType.BUTTON_INSPECT].state = 1;
				
				controllerVariables.currentRCVSourceMode = RCVSourceModes.MULTISOURCE;
				break;
			case 4: //Media
				buttonList[buttonPressControlType.BUTTON_MEDIA].state = 2;
				buttonList[buttonPressControlType.BUTTON_MULTISOURCE].state = 1;
				buttonList[buttonPressControlType.BUTTON_OVERLAY].state = 1;
				buttonList[buttonPressControlType.BUTTON_KEY].state = 1;
				buttonList[buttonPressControlType.BUTTON_INSPECT].state = 1;

				controllerVariables.currentRCVSourceMode = RCVSourceModes.MEDIA;
				break;
			case 5: //Ovelay
				buttonList[buttonPressControlType.BUTTON_MEDIA].state = 1;
				buttonList[buttonPressControlType.BUTTON_MULTISOURCE].state = 1;
				buttonList[buttonPressControlType.BUTTON_OVERLAY].state = 2;
				buttonList[buttonPressControlType.BUTTON_KEY].state = 1;
				buttonList[buttonPressControlType.BUTTON_INSPECT].state = 1;

				controllerVariables.currentRCVSourceMode = RCVSourceModes.OVERLAY;
				break;
			case 6: //MultiSource
				buttonList[buttonPressControlType.BUTTON_MEDIA].state = 1;
				buttonList[buttonPressControlType.BUTTON_MULTISOURCE].state = 2;
				buttonList[buttonPressControlType.BUTTON_OVERLAY].state = 1;
				buttonList[buttonPressControlType.BUTTON_KEY].state = 1;
				buttonList[buttonPressControlType.BUTTON_INSPECT].state = 1;

				controllerVariables.currentRCVSourceMode = RCVSourceModes.MULTISOURCE;
				break;
			case 12: //Inspect
				buttonList[buttonPressControlType.BUTTON_MEDIA].state = 1;
				buttonList[buttonPressControlType.BUTTON_MULTISOURCE].state = 1;
				buttonList[buttonPressControlType.BUTTON_OVERLAY].state = 1;
				buttonList[buttonPressControlType.BUTTON_KEY].state = 1;
				buttonList[buttonPressControlType.BUTTON_INSPECT].state = 2;

				controllerVariables.currentRCVSourceMode = RCVSourceModes.INSPECT;
				break;
			default:
				buttonList[buttonPressControlType.BUTTON_MEDIA].state = 1;
				buttonList[buttonPressControlType.BUTTON_MULTISOURCE].state = 1;
				buttonList[buttonPressControlType.BUTTON_OVERLAY].state = 1;
				buttonList[buttonPressControlType.BUTTON_KEY].state = 1;
				buttonList[buttonPressControlType.BUTTON_INSPECT].state = 1;

				controllerVariables.currentRCVSourceMode = RCVSourceModes.UNKNOWN;
				break;
		}

		instance.checkFeedbacks(FeedbackId.control_state);
		return;
	}

	//Handle Transitions
	if (command === '/show/transition') {
		const _transition = args[0].toString();

		if (_transition !== controllerVariables.currentTransitionCat) {
			controllerVariables.currentTransitionCat = _transition;
			ConsoleLog(instance, `Changed currentTransitionCat to ${_transition}`, LogLevel.DEBUG, false);

			if (_transition === transtionCategory.FADE) {

				controllerVariables.currentTransition = _transition;
				ConsoleLog(instance, `Changed currentTransition to ${_transition}`, LogLevel.DEBUG, false);

			}
		}

		return;
	} 

	if (command === '/show/transition_data') {
		const _transitionData = args[0].toString();

		if (controllerVariables.currentTransitionCat === transtionCategory.WIPE || controllerVariables.currentTransitionCat === transtionCategory.DIP) {

			if (_transitionData !== controllerVariables.currentTransition) {

				controllerVariables.currentTransition = _transitionData;
				ConsoleLog(instance, `Changed currentTransition to ${_transitionData}`, LogLevel.DEBUG, false);

			}
		}

		return;
	}

	if (command === '/auto_switching/enabled') {
		const enabled = args[0];

		if (enabled === 1) {
			controllerVariables.autoswitchEnabled = true;
		} else {
			controllerVariables.autoswitchEnabled = false;
		}

		instance.checkFeedbacks(FeedbackId.auto_switching);
		return;
	}

	if (command === '/show/transition_time') {
		const _time = parseFloat(args[0]);

		if (_time) {
			controllerVariables.currentTransTime = _time;
		}

		instance.setVariableValues({
			'transition_time': _time.toString()
		});

		return;
	}

	if (command === '/show/invert_wipe') {
		const _mirror = args[0];

		if (_mirror !== controllerVariables.currentTransWipe) {
			controllerVariables.currentTransWipe = _mirror;
		}

		if (args[0] === 1) {
			controllerVariables.transitionInvert = true;
		} else {
			controllerVariables.transitionInvert = false;
		}

		return;
	}

	//Handle Monitor Channels
	if (command === '/device/monitor_select') {
		//Switch monitor channels

		switch(args[0]) {
			case "0":
				controllerVariables.selectedMonitor = MonitorChannels.HP1_VOL;
				break;
			case "1":
				controllerVariables.selectedMonitor = MonitorChannels.HP2_VOL;
				break;
			case "2":
				controllerVariables.selectedMonitor = MonitorChannels.MON_VOL;
				break;
		}

		return;
	}

	if (command.includes('/device/HP') || command.includes('/device/MON')) {
    const key = command.split('/');
    const monitorCh = key[2];

		monitorChannels[monitorCh] = args[0];
		ConsoleLog(instance, `Monitor channel ${monitorCh} changed to ${args[0]}.`, LogLevel.DEBUG, false);

		return;
	}

	// Handle Submix Updates
	if (command.includes('/submix')) {

		const key = command.split('/');
		const property = key[4];
		let _submix = key[2];

		const updateSubmixProperty = (mixerChNo: number, property: string, value: any) => {

			if (!isSubmixProperty(property)) {
				ConsoleLog(instance, `Invalid submix property: ${property}`, LogLevel.ERROR, false);
				return;
			}

			if (_submix === 'stream') {
				_submix = SubmixChannels.LIVE;
			}

			if (submixList.hasOwnProperty(_submix)) {
				const mixerCh = mixerChNo - 1;
				const mixerChName = `value${mixerCh}`;

				if (!mixerChannels[mixerChName]) {
					ConsoleLog(instance, `Mixer channel ${mixerChName} not found.`, LogLevel.ERROR, false);
					return;
				}

				const submixIndex = mixerChannels[mixerChName].submixes?.findIndex(submix => submix.submix === _submix);

				if (submixIndex !== undefined && submixIndex >= 0) {
					(mixerChannels[mixerChName].submixes![submixIndex] as any)[property] = value;
				} else {
					const newSubmix: AudioAudioSourceCh = { submix: _submix as SubmixChannels, level: 0, muted: false, disabled: false, linked: false };
					(newSubmix as any)[property] = value;
					mixerChannels[mixerChName].submixes?.push(newSubmix);
				}

				const varName = `${getKeyByValue(audioChannels, `value${mixerCh}`).toLocaleLowerCase()}-${_submix}_setlevel`;
				if (instance.variables.some(variable => variable.variableId === varName)) {

					instance.setVariableValues({
						[varName]: floatToDb(value).toString(),
					});

					ConsoleLog(instance, `Setting variable ${varName} to value ${floatToDb(value)}`, LogLevel.DEBUG, false);

				} else {
					if (_submix !== undefined) {
						instance.variables.push({ variableId: varName, name: `${mixerChannels[mixerChName].name} Set Level` });
						instance.setVariableDefinitions(instance.variables);

						instance.setVariableValues({
							[varName]: floatToDb(value).toString(),
						});

						ConsoleLog(instance, `Creating variable ${varName} with value ${floatToDb(value)}`, LogLevel.DEBUG, false);
					}
				}

				ConsoleLog(instance, `${mixerChannels[mixerChName].name} (value${mixerCh}) changed on Submix ${_submix} ${property.toUpperCase()} to ${value}.`, LogLevel.DEBUG, false);
				
			}
		};

		const mixerChNo = parseInt(key[3]);

		if (property === 'level') {
			updateSubmixProperty(mixerChNo, 'level', parseFloat(args[0]));
		} else if (property === 'mute') {
			updateSubmixProperty(mixerChNo, 'muted', args[0] === 1);
		} else if (property === 'link') {
			updateSubmixProperty(mixerChNo, 'linked', args[0] === 1);
		} else if (property === 'disabled') {
			updateSubmixProperty(mixerChNo, 'disabled', args[0] === 1);
		}

		instance.checkFeedbacks(FeedbackId.audio_sources);
		return;
	}
	
	//Handle Audio Mixer Updates
	if (command.includes('/audioSource')) {
		const key = command.split('/');
		const property = key[3];
		const mixerChNo = parseInt(key[2]);
		const mixerCh = `value${mixerChNo - 1}`;

		if (property === 'level') {

			if (mixerChannels.hasOwnProperty(mixerCh)) {

				mixerChannels[mixerCh].gain = args[0];

				const varName = `${getKeyByValue(audioChannels, mixerCh).toLocaleLowerCase()}_setgain`;
				if (instance.variables.some(variable => variable.variableId === varName)) {

					instance.setVariableValues({
						[varName]: args[0].toString(),
					});

					ConsoleLog(instance, `Setting variable ${varName} to value ${args[0]}`, LogLevel.DEBUG, false);

				} else {

					instance.variables.push({ variableId: varName, name: `${mixerChannels[mixerCh].name} Gain` });
					instance.setVariableDefinitions(instance.variables);

					instance.setVariableValues({
						[varName]: args[0].toString(),
					});

					ConsoleLog(instance, `Creating variable ${varName} with value ${args[0]}`, LogLevel.DEBUG, false);
				}

				ConsoleLog(instance, `Mixer channel ${mixerChannels[mixerCh].name} (${mixerCh}) gain updated with value ${mixerChannels[mixerCh].gain}.`, LogLevel.DEBUG, false);

			}

		} else if (property === 'enable') {

			if (args[0] === 1 && mixerChannels.hasOwnProperty(mixerCh)) {

				const mixer = mixerChannels[mixerCh];	

				for (const submix of mixer.submixes) {
					submix.disabled = false;
				}

			} else if (args[0] === 0 && mixerChannels.hasOwnProperty(mixerCh)) {
				const mixer = mixerChannels[mixerCh];	

				for (const submix of mixer.submixes) {
					submix.disabled = true;
				}
			}

			await sendOSCCommand(instance, commands.SHOW[0]);


		} else if (property === 'position') {

			if (mixerChannels.hasOwnProperty(mixerCh)) {
				mixerChannels[mixerCh].position = args[0];
				ConsoleLog(instance, `Mixer channel ${mixerChannels[mixerCh].name} (${mixerCh}) updated with position ${mixerChannels[mixerCh].position}.`, LogLevel.DEBUG, false);
			}

		} else if (property === 'name') {

			if (mixerChannels.hasOwnProperty(mixerCh)) {

				const oldName = mixerChannels[mixerCh].name;
				mixerChannels[mixerCh].name = args[0];
				ConsoleLog(instance, `Mixer channel ${oldName} (${mixerCh}) updated with name ${mixerChannels[mixerCh].name}.`, LogLevel.DEBUG, false);
			}

		} else if (property === 'scene_mute') {

			if (mixerChannels.hasOwnProperty(mixerCh)) {

				let scene_mute = false;

				if (args[0] === 1) {
					scene_mute = true;
					
				} else if (args[0] === 0) {
					scene_mute = false;

				}

				const mixer = mixerChannels[mixerCh];	
	
				for (const submix of mixer.submixes) {
					submix.scene_mute = scene_mute;
				}

				ConsoleLog(instance, `Mixer channel ${mixerChannels[mixerCh].name} (${mixerCh}) scene mute set to ${scene_mute}.`, LogLevel.DEBUG, true);

			}

		}

		instance.checkFeedbacks(FeedbackId.audio_sources);
		return;
	}

	//Process any wireless microphones
	if (command.includes('/wirelessAudioSource')) {
		const key = command.split('/');

		const micId = parseInt(key[2]);
		const property = key[3];

		if (property === 'state') {
			wirelessMic[micId] = { ...wirelessMic[micId], state: args[0] };
		
		} else if (property === 'type') {
			//type -1 none, 1- Wireless Go Pro, 3 - Wireless Interview
			wirelessMic[micId] = { ...wirelessMic[micId], type: args[0] };
		
		} else if (property === 'connected') {
			wirelessMic[micId] = { ...wirelessMic[micId], connected: args[0] === 1 ? true : false };
		
		} else if (property === 'signal_quality') {
			wirelessMic[micId] = { ...wirelessMic[micId], signal_quality: args[0] };
		
		} else if (property === 'battery_level') {
			wirelessMic[micId] = { ...wirelessMic[micId], battery_level: args[0] };
		
		} else if (property === 'charging') {
			wirelessMic[micId] = { ...wirelessMic[micId], charging: args[0] === 1 ? true : false };

		} else if (property === 'remote_mute') {
			wirelessMic[micId] = { ...wirelessMic[micId], remote_mute: args[0] === 1 ? true : false };

		} else if (property === 'record') {
			wirelessMic[micId] = { ...wirelessMic[micId], remote_record: args[0] === 1 ? true : false };
		}

		instance.setVariableValues({
			'wireless1_connected': wirelessMic[4].connected,
			'wireless1_signal': wirelessMic[4].signal_quality,
			'wireless1_battery': wirelessMic[4].battery_level,
			'wireless1_charging': wirelessMic[4].charging,
			'wireless1_muted': wirelessMic[4].remote_mute,
			'wireless1_record': wirelessMic[4].remote_record,
			'wireless2_connected': wirelessMic[5].connected,
			'wireless2_signal': wirelessMic[5].signal_quality,
			'wireless2_battery': wirelessMic[5].battery_level,
			'wireless2_charging': wirelessMic[5].charging,
			'wireless2_muted': wirelessMic[5].remote_mute,
			'wireless2_record': wirelessMic[5].remote_record,
		});

		return;
	}

	if (command === '/masterAudioProcessing/delay/value_ms') {
		const delay = args[0];

		controllerVariables.audioMasterDelay = delay;

		instance.setVariableValues({
			'audio_delay_frames': msToFrames(controllerVariables.audioMasterDelay).toString(),
			'audio_delay_ms': controllerVariables.audioMasterDelay.toString()
		});

		return;
	}

	if (command.includes('/videoIn')) {
		const key = command.split('/');
		const input = key[2];
		const property = key[3];

		if (property === 'key_mode') {

			const inputKey = `input${input}`;
			if (buttonList.hasOwnProperty(inputKey)) {
				const button = buttonList[inputKey];

				if (args[0] === 'chroma') {
					button.key_mode = keyingMode.CHROMA;
				} else {
					button.key_mode = keyingMode.NONE;
					button.key_mode = keyingCol.NONE;
				}
			}

		} else if (property === 'chroma_key_colour') {

			const inputKey = `input${input}`;
			if (buttonList.hasOwnProperty(inputKey)) {
				const button = buttonList[inputKey];

				if (args[0] === 'ff00') {
					button.key_mode = keyingCol.GREEN;
				} else if (args[0] === 'ff') {
					button.key_mode = keyingCol.BLUE;
				} else {
					button.key_mode = keyingCol.NONE;
				}
			}

		}

		instance.checkFeedbacks(FeedbackId.keying);

		return;
	}

	// Handle HDMI/UVC Outputs 
	if (command.includes('/show/hdmiOut')) {
		const key = command.split('/');
		const output = parseInt(key[3]);

		if (output === 1) {
			controllerVariables.hdmi_B_output = args[0];
		} else if (output === 2) {
			controllerVariables.hdmi_A_output = args[0];
		}

		ConsoleLog(instance, `HDMI Output ${output} set to ${args[0]}`, LogLevel.DEBUG, false);
		return;
	}

	if (command.includes('/show/usbOut')) {
		const key = command.split('/');
		const output = parseInt(key[3]);

		if (output === 1) {
			controllerVariables.uvc_1_output = args[0];
		}

		ConsoleLog(instance, `UVC Output ${output} set to ${args[0]}`, LogLevel.DEBUG, true);
		return;
	}


	// Handle Meters
	if (command === '/meters/values') {

		if (!controllerVariables.returnLiveLevels) {
			return;
		}

		let blobData: Buffer | null = null;
		const arg = args[0];

		if (arg instanceof Uint8Array) {
			blobData = Buffer.from(arg);
		} else if (Buffer.isBuffer(arg)) {
			blobData = arg;
		} else {
			return;
		}
		
		// Now, pass the blobData to parseMeterValues
		const meterData = parseMeterValues(instance, blobData);

		if (meterData) {
			const variableUpdates: Record<string, string> = {};
			controllerVariables.currentAudioLevels = meterData;
			//ConsoleLog(instance, `Meter Data: ${JSON.stringify(meterData)}`, LogLevel.INFO, false);

			for (const channel of Object.keys(meterData.outputs) as unknown as MetersChannel[]) {
				const outputData = meterData.outputs[channel];
				const channelString = `value${channel}`;
			
				if (outputData) {
					const varL = `${getKeyByValue(audioChannels, channelString).toLocaleLowerCase()}_livelevelL`;
					const varR = `${getKeyByValue(audioChannels, channelString).toLocaleLowerCase()}_livelevelR`;
					const levelsL_db = floatToDb(meterLevelToPercentage(outputData.left?.level || 0));
					const levelsR_db = floatToDb(meterLevelToPercentage(outputData.right?.level || 0));
			
					// Left Channel Handling
					if (!instance.variables.some(variable => variable.variableId === varL)) {
						instance.variables.push({ variableId: varL, name: `${mixerChannels[channelString].name} Live Left Level` });
						instance.setVariableDefinitions(instance.variables);
						ConsoleLog(instance, `Creating variable ${varL} with value ${levelsL_db}`, LogLevel.DEBUG, false);
					}
			
					// Right Channel Handling
					if (!instance.variables.some(variable => variable.variableId === varR)) {
						instance.variables.push({ variableId: varR, name: `${mixerChannels[channelString].name} Live Right Level` });
						instance.setVariableDefinitions(instance.variables);
						ConsoleLog(instance, `Creating variable ${varR} with value ${levelsR_db}`, LogLevel.DEBUG, false);
					}
			
					// Collect the updates
					variableUpdates[varL] = levelsL_db.toString();
					variableUpdates[varR] = levelsR_db.toString();
				}
			
			}

			//Masters
			const masterLvar = 'master_live_L';
			const masterRvar = 'master_live_R';
			const masterL = floatToDb(meterLevelToPercentage(meterData.master.left?.level || 0));
			const masterR = floatToDb(meterLevelToPercentage(meterData.master.right?.level || 0));

			if (!instance.variables.some(variable => variable.variableId === masterLvar)) {
				instance.variables.push({ variableId: masterLvar, name: `Master Left Level` });
				instance.setVariableDefinitions(instance.variables);
				ConsoleLog(instance, `Creating variable ${masterLvar} with value ${masterL}`, LogLevel.DEBUG, false);
			}

			if (!instance.variables.some(variable => variable.variableId === masterRvar)) {
				instance.variables.push({ variableId: masterRvar, name: `Master Right Level` });
				instance.setVariableDefinitions(instance.variables);
				ConsoleLog(instance, `Creating variable ${masterRvar} with value ${masterR}`, LogLevel.DEBUG, false);
			}

			// Collect the updates
			variableUpdates[masterLvar] = masterL.toString();
			variableUpdates[masterRvar] = masterR.toString();

			// After processing all channels, update variables in one call
			if (Object.keys(variableUpdates).length > 0) {
				instance.setVariableValues(variableUpdates);
				instance.checkFeedbacks(FeedbackId.audio_sources);
				instance.checkFeedbacks(FeedbackId.meters);
			}
			
		}

		return;
	}


	//DEBUG - Show any other commands
	//ConsoleLog(instance, `Received message: ${command}, args: ${JSON.stringify(args)}`, LogLevel.DEBUG, false);
}

