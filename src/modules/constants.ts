import { combineRgb } from "@companion-module/base/dist/util.js";
import { commands } from "./commands.js";
import { MonitorChannels, RCVSourceModes, SubmixChannels, audioChannels, buttonPressControlType, buttonPressInputsType, buttonPressMediaType, buttonPressOverlayType, buttonPressSceneType, keyingCol, keyingMode, mediaType, pressMode, recordEncoderDisplay, routingSources, streamEncoderDisplay, transitionType, transtionCategory } from "./enums.js";
import { AudioAudioSourceCh, AudioMixerCh, MeterValues } from "./interfaces.js";

export const timecodes: { streamTime: string, recordTime: string } = { streamTime: "", recordTime: "" };
export const drives: { [key: number]: {name: string, type: string, storageFull: string, storageRemain: string}} = {};
export const streams: { [key: number]: {name: string, bitrate: string, enabled: boolean, opts?: string}} = {};
export const wirelessMic: { [key: number]: {state?: string, type?: string, connected?: boolean, signal_quality?: number, battery_level?: number, charging?: boolean, remote_mute?: boolean, remote_record?: boolean, opts?: string}} = {};
export const monitorChannels: { [key: string]: number } = {};
export const mixerChannels: { [key: string]: AudioMixerCh } = {};
export const submixChannels: { [key: string]: AudioAudioSourceCh } = {};
export const inputMeters: { [key: number]: number } = {};
export const videoSources: { [key: number]: {name: string, source: string, state?: number}} = {};
export const sceneSources: { [key: number]: {name: string, state?: number}} = {};
export const mediaSources: { [key: number]: {name: string, mediaType?: mediaType, state?: number, pressMode?: pressMode, filename?: string}} = {};
export const overlaySources: { [key: number]: {name: string, state?: number}} = {};
export const rcvPhysicalButtons: { [buttonId: number]: number } = {};

export const Col_Black = combineRgb(0, 0, 0);
export const Col_White = combineRgb(255, 255, 255);
export const Col_PGM = combineRgb(252, 3, 98);
export const Col_PVW = combineRgb(3, 252, 148);
export const Col_Standby = combineRgb(79, 79, 79);
export const Col_Unavailable = combineRgb(0, 0, 0);
export const Col_Recording = combineRgb(252, 3, 98);
export const Col_Streaming = combineRgb(252, 3, 98);
export const Col_RecordReady = combineRgb(3, 252, 148);
export const Col_StreamReady = combineRgb(3, 252, 148);
export const Col_Red = combineRgb(255, 0, 0);
export const Col_Green = combineRgb(0, 153, 0);
export const Col_Yellow = combineRgb(255, 255, 0);
export const Col_Orange = combineRgb(255, 165, 0);
export const Col_Purple = combineRgb(138, 0, 230);
export const Col_LightPurple = combineRgb(194, 102, 255);
export const Col_LightBlue = combineRgb(0, 255, 255);
export const Col_Magenta = combineRgb(255, 102, 255);

export const controllerVariables = {
	showName: '',
	deviceTemp: 0,
	fanSpeed: 0,
	frameRate: '25',
	startup: false,
    accelerateDial: false,
	currentRCVSourceMode: RCVSourceModes.UNKNOWN as RCVSourceModes,
	currentTransition: null as transitionType,
	currentTransitionCat: null as transtionCategory,
	studioMode: false,
	currentTransWipe: -1,
	currentTransTime: -1,
	transitionInvert: false,
	selectedMonitor: MonitorChannels.HP1_VOL as MonitorChannels,
	allowRecord: false,
	recording: false,
	allowStream: false,
	streaming: false,
	fetchMeters: true,
	logoEnabled: false,
	autoswitchEnabled: false,
	audioMasterDelayActive: false,
	recordDisplay: recordEncoderDisplay.TIMECODE as recordEncoderDisplay,
	streamDisplay: streamEncoderDisplay.TIMECODE as streamEncoderDisplay,
	mediaMenuColour: 0,
	sceneMenuColour: 0,
	overlayMenuColour: 0,
	keyerMenuColour: 0,
	audioMasterDelay: 0,
	submixesReady: false,
	PgmOverlay: -1,
	PvwOverlay: -1,
	PgmScene: -1,
	PvwScene: -1,
	PgmInput: -1,
	PvwInput: -1,
	PgmMedia: -1,
	PvwMedia: -1,
	currentAudioLevels: null as MeterValues,
	returnLiveLevels: true,
	hdmi_A_output: routingSources.MULTIVIEW,
	hdmi_B_output: routingSources.MULTIVIEW,
	uvc_1_output: routingSources.MULTIVIEW,
	recordEnabled: false,
};

export const allButtonPressTypes = [
	...Object.values(buttonPressControlType),
	...Object.values(buttonPressInputsType),
	...Object.values(buttonPressSceneType),
	...Object.values(buttonPressMediaType)
];

export const buttonList = {
	[buttonPressInputsType.INPUT_1]: { id: 0, title: 'Input 1', optgroup: 'Inputs', path: "/device/buttons/8/colour", state0_image: 'imgs/new/key_images/buttons/Inputs/Active/1_active', state1_image: 'imgs/new/key_images/buttons/Inputs/PGM/1_pgm', state2_image: 'imgs/new/key_images/buttons/Inputs/PVW/1_pvw', state3_image: 'imgs/new/key_images/buttons/Inputs/Inactive/1_inactive', command: commands.INPUT_1, state: 0, name: '', keyingMode: keyingMode.NONE, keyingCol: keyingCol.NONE },
	[buttonPressInputsType.INPUT_2]: { id: 1, title: 'Input 2', optgroup: 'Inputs', path: "/device/buttons/9/colour", state0_image: 'imgs/new/key_images/buttons/Inputs/Active/2_active', state1_image: 'imgs/new/key_images/buttons/Inputs/PGM/2_pgm', state2_image: 'imgs/new/key_images/buttons/Inputs/PVW/2_pvw', state3_image: 'imgs/new/key_images/buttons/Inputs/Inactive/2_inactive', command: commands.INPUT_2, state: 0, name: '', keyingMode: keyingMode.NONE, keyingCol: keyingCol.NONE },
	[buttonPressInputsType.INPUT_3]: { id: 2, title: 'Input 3', optgroup: 'Inputs', path: "/device/buttons/10/colour", state0_image: 'imgs/new/key_images/buttons/Inputs/Active/3_active', state1_image: 'imgs/new/key_images/buttons/Inputs/PGM/3_pgm', state2_image: 'imgs/new/key_images/buttons/Inputs/PVW/3_pvw', state3_image: 'imgs/new/key_images/buttons/Inputs/Inactive/3_inactive', command: commands.INPUT_3, state: 0, name: '', keyingMode: keyingMode.NONE, keyingCol: keyingCol.NONE },
	[buttonPressInputsType.INPUT_4]: { id: 3, title: 'Input 4', optgroup: 'Inputs', path: "/device/buttons/11/colour", state0_image: 'imgs/new/key_images/buttons/Inputs/Active/4_active', state1_image: 'imgs/new/key_images/buttons/Inputs/PGM/4_pgm', state2_image: 'imgs/new/key_images/buttons/Inputs/PVW/4_pvw', state3_image: 'imgs/new/key_images/buttons/Inputs/Inactive/4_inactive', command: commands.INPUT_4, state: 0, name: '', keyingMode: keyingMode.NONE, keyingCol: keyingCol.NONE },
	[buttonPressInputsType.INPUT_5]: { id: 4, title: 'Input 5', optgroup: 'Inputs', path: "/device/buttons/12/colour", state0_image: 'imgs/new/key_images/buttons/Inputs/Active/5_active', state1_image: 'imgs/new/key_images/buttons/Inputs/PGM/5_pgm', state2_image: 'imgs/new/key_images/buttons/Inputs/PVW/5_pvw', state3_image: 'imgs/new/key_images/buttons/Inputs/Inactive/5_inactive', command: commands.INPUT_5, state: 0, name: '', keyingMode: keyingMode.NONE, keyingCol: keyingCol.NONE },
	[buttonPressInputsType.INPUT_6]: { id: 5, title: 'Input 6', optgroup: 'Inputs', path: "/device/buttons/13/colour", state0_image: 'imgs/new/key_images/buttons/Inputs/Active/6_active', state1_image: 'imgs/new/key_images/buttons/Inputs/PGM/6_pgm', state2_image: 'imgs/new/key_images/buttons/Inputs/PVW/6_pvw', state3_image: 'imgs/new/key_images/buttons/Inputs/Inactive/6_inactive', command: commands.INPUT_6, state: 0, name: '', keyingMode: keyingMode.NONE, keyingCol: keyingCol.NONE },
	[buttonPressInputsType.INPUT_FTP]: { id: 6, title: 'FTB', optgroup: 'Inputs', path: "/device/buttons/14/colour", state0_image: 'imgs/new/key_images/buttons/Inputs/Active/FTB_active', state1_image: 'imgs/new/key_images/buttons/Inputs/PGM/FTB_pgm', state2_image: 'imgs/new/key_images/buttons/Inputs/PVW/FTB_pvw', state3_image: 'imgs/new/key_images/buttons/Inputs/Inactive/FTB_inactive', command: commands.INPUT_7, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressControlType.BUTTON_1]: { id: 7, title: 'Button 1', optgroup: 'Buttons', path: "/device/buttons/8/colour", state0_image: 'imgs/new/key_images/buttons/Inputs/Active/1_active', state1_image: 'imgs/new/key_images/buttons/Inputs/PGM/1_pgm', state2_image: 'imgs/new/key_images/buttons/Inputs/PVW/1_pvw', state3_image: 'imgs/new/key_images/buttons/Inputs/Inactive/1_inactive', command: commands.BUTTON_8, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressControlType.BUTTON_2]: { id: 8, title: 'Button 2', optgroup: 'Buttons', path: "/device/buttons/9/colour", state0_image: 'imgs/new/key_images/buttons/Inputs/Active/2_active', state1_image: 'imgs/new/key_images/buttons/Inputs/PGM/2_pgm', state2_image: 'imgs/new/key_images/buttons/Inputs/PVW/2_pvw', state3_image: 'imgs/new/key_images/buttons/Inputs/Inactive/2_inactive', command: commands.BUTTON_9, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressControlType.BUTTON_3]: { id: 9, title: 'Button 3', optgroup: 'Buttons', path: "/device/buttons/10/colour", state0_image: 'imgs/new/key_images/buttons/Inputs/Active/3_active', state1_image: 'imgs/new/key_images/buttons/Inputs/PGM/3_pgm', state2_image: 'imgs/new/key_images/buttons/Inputs/PVW/3_pvw', state3_image: 'imgs/new/key_images/buttons/Inputs/Inactive/3_inactive', command: commands.BUTTON_10, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressControlType.BUTTON_4]: { id: 10, title: 'Button 4', optgroup: 'Buttons', path: "/device/buttons/11/colour", state0_image: 'imgs/new/key_images/buttons/Inputs/Active/4_active', state1_image: 'imgs/new/key_images/buttons/Inputs/PGM/4_pgm', state2_image: 'imgs/new/key_images/buttons/Inputs/PVW/4_pvw', state3_image: 'imgs/new/key_images/buttons/Inputs/Inactive/4_inactive', command: commands.BUTTON_11, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressControlType.BUTTON_5]: { id: 11, title: 'Button 5', optgroup: 'Buttons', path: "/device/buttons/12/colour", state0_image: 'imgs/new/key_images/buttons/Inputs/Active/5_active', state1_image: 'imgs/new/key_images/buttons/Inputs/PGM/5_pgm', state2_image: 'imgs/new/key_images/buttons/Inputs/PVW/5_pvw', state3_image: 'imgs/new/key_images/buttons/Inputs/Inactive/5_inactive', command: commands.BUTTON_12, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressControlType.BUTTON_6]: { id: 12, title: 'Button 6', optgroup: 'Buttons', path: "/device/buttons/13/colour", state0_image: 'imgs/new/key_images/buttons/Inputs/Active/6_active', state1_image: 'imgs/new/key_images/buttons/Inputs/PGM/6_pgm', state2_image: 'imgs/new/key_images/buttons/Inputs/PVW/6_pvw', state3_image: 'imgs/new/key_images/buttons/Inputs/Inactive/6_inactive', command: commands.BUTTON_13, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressControlType.BUTTON_FTB]: { id: 13, title: 'Button FTB', optgroup: 'Buttons', path: "/device/buttons/14/colour", state0_image: 'imgs/new/key_images/buttons/Inputs/Active/FTB_active', state1_image: 'imgs/new/key_images/buttons/Inputs/PGM/FTB_pgm', state2_image: 'imgs/new/key_images/buttons/Inputs/PVW/FTB_pvw', state3_image: 'imgs/new/key_images/buttons/Inputs/Inactive/FTB_inactive', command: commands.BUTTON_14, state: 0, name: '', keyingMode: null, keyingCol: null },
	
	[buttonPressSceneType.SCENE_1]: { id: 0, title: 'Scene A', optgroup: 'Scenes', path: "/device/buttons/1/colour", state0_image: 'imgs/new/key_images/buttons/Scenes/Active/SA_active', state1_image: 'imgs/new/key_images/buttons/Scenes/PGM/SA_pgm', state2_image: 'imgs/new/key_images/buttons/Scenes/PVW/SA_pvw', state3_image: 'imgs/new/key_images/buttons/Scenes/Inactive/SA_inactive', command: commands.SCENE_1, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressSceneType.SCENE_2]: { id: 1, title: 'Scene B', optgroup: 'Scenes', path: "/device/buttons/2/colour", state0_image: 'imgs/new/key_images/buttons/Scenes/Active/SB_active', state1_image: 'imgs/new/key_images/buttons/Scenes/PGM/SB_pgm', state2_image: 'imgs/new/key_images/buttons/Scenes/PVW/SB_pvw', state3_image: 'imgs/new/key_images/buttons/Scenes/Inactive/SB_inactive', command: commands.SCENE_2, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressSceneType.SCENE_3]: { id: 2, title: 'Scene C', optgroup: 'Scenes', path: "/device/buttons/3/colour", state0_image: 'imgs/new/key_images/buttons/Scenes/Active/SC_active', state1_image: 'imgs/new/key_images/buttons/Scenes/PGM/SC_pgm', state2_image: 'imgs/new/key_images/buttons/Scenes/PVW/SC_pvw', state3_image: 'imgs/new/key_images/buttons/Scenes/Inactive/SC_inactive', command: commands.SCENE_3, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressSceneType.SCENE_4]: { id: 3, title: 'Scene D', optgroup: 'Scenes', path: "/device/buttons/4/colour", state0_image: 'imgs/new/key_images/buttons/Scenes/Active/SD_active', state1_image: 'imgs/new/key_images/buttons/Scenes/PGM/SD_pgm', state2_image: 'imgs/new/key_images/buttons/Scenes/PVW/SD_pvw', state3_image: 'imgs/new/key_images/buttons/Scenes/Inactive/SD_inactive', command: commands.SCENE_4, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressSceneType.SCENE_5]: { id: 4, title: 'Scene E', optgroup: 'Scenes', path: "/device/buttons/5/colour", state0_image: 'imgs/new/key_images/buttons/Scenes/Active/SE_active', state1_image: 'imgs/new/key_images/buttons/Scenes/PGM/SE_pgm', state2_image: 'imgs/new/key_images/buttons/Scenes/PVW/SE_pvw', state3_image: 'imgs/new/key_images/buttons/Scenes/Inactive/SE_inactive', command: commands.SCENE_5, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressSceneType.SCENE_6]: { id: 5, title: 'Scene F', optgroup: 'Scenes', path: "/device/buttons/6/colour", state0_image: 'imgs/new/key_images/buttons/Scenes/Active/SF_active', state1_image: 'imgs/new/key_images/buttons/Scenes/PGM/SF_pgm', state2_image: 'imgs/new/key_images/buttons/Scenes/PVW/SF_pvw', state3_image: 'imgs/new/key_images/buttons/Scenes/Inactive/SF_inactive', command: commands.SCENE_6, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressSceneType.SCENE_7]: { id: 6, title: 'Scene G', optgroup: 'Scenes', path: "/device/buttons/7/colour", state0_image: 'imgs/new/key_images/buttons/Scenes/Active/SG_active', state1_image: 'imgs/new/key_images/buttons/Scenes/PGM/SG_pgm', state2_image: 'imgs/new/key_images/buttons/Scenes/PVW/SG_pvw', state3_image: 'imgs/new/key_images/buttons/Scenes/Inactive/SG_inactive', command: commands.SCENE_7, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressControlType.BUTTON_A]: { id: 0, title: 'Button A', optgroup: 'Buttons', path: "/device/buttons/1/colour", state0_image: 'imgs/new/key_images/buttons/Scenes/Active/SA_active', state1_image: 'imgs/new/key_images/buttons/Scenes/PGM/SA_pgm', state2_image: 'imgs/new/key_images/buttons/Scenes/PVW/SA_pvw', state3_image: 'imgs/new/key_images/buttons/Scenes/Inactive/SA_inactive', command: commands.BUTTON_1, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressControlType.BUTTON_B]: { id: 1, title: 'Button B', optgroup: 'Buttons', path: "/device/buttons/2/colour", state0_image: 'imgs/new/key_images/buttons/Scenes/Active/SB_active', state1_image: 'imgs/new/key_images/buttons/Scenes/PGM/SB_pgm', state2_image: 'imgs/new/key_images/buttons/Scenes/PVW/SB_pvw', state3_image: 'imgs/new/key_images/buttons/Scenes/Inactive/SB_inactive', command: commands.BUTTON_2, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressControlType.BUTTON_C]: { id: 2, title: 'Button C', optgroup: 'Buttons', path: "/device/buttons/3/colour", state0_image: 'imgs/new/key_images/buttons/Scenes/Active/SC_active', state1_image: 'imgs/new/key_images/buttons/Scenes/PGM/SC_pgm', state2_image: 'imgs/new/key_images/buttons/Scenes/PVW/SC_pvw', state3_image: 'imgs/new/key_images/buttons/Scenes/Inactive/SC_inactive', command: commands.BUTTON_3, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressControlType.BUTTON_D]: { id: 3, title: 'Button D', optgroup: 'Buttons', path: "/device/buttons/4/colour", state0_image: 'imgs/new/key_images/buttons/Scenes/Active/SD_active', state1_image: 'imgs/new/key_images/buttons/Scenes/PGM/SD_pgm', state2_image: 'imgs/new/key_images/buttons/Scenes/PVW/SD_pvw', state3_image: 'imgs/new/key_images/buttons/Scenes/Inactive/SD_inactive', command: commands.BUTTON_4, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressControlType.BUTTON_E]: { id: 4, title: 'Button E', optgroup: 'Buttons', path: "/device/buttons/5/colour", state0_image: 'imgs/new/key_images/buttons/Scenes/Active/SE_active', state1_image: 'imgs/new/key_images/buttons/Scenes/PGM/SE_pgm', state2_image: 'imgs/new/key_images/buttons/Scenes/PVW/SE_pvw', state3_image: 'imgs/new/key_images/buttons/Scenes/Inactive/SE_inactive', command: commands.BUTTON_5, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressControlType.BUTTON_F]: { id: 5, title: 'Button F', optgroup: 'Buttons', path: "/device/buttons/6/colour", state0_image: 'imgs/new/key_images/buttons/Scenes/Active/SF_active', state1_image: 'imgs/new/key_images/buttons/Scenes/PGM/SF_pgm', state2_image: 'imgs/new/key_images/buttons/Scenes/PVW/SF_pvw', state3_image: 'imgs/new/key_images/buttons/Scenes/Inactive/SF_inactive', command: commands.BUTTON_6, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressControlType.BUTTON_G]: { id: 6, title: 'Button G', optgroup: 'Buttons', path: "/device/buttons/7/colour", state0_image: 'imgs/new/key_images/buttons/Scenes/Active/SG_active', state1_image: 'imgs/new/key_images/buttons/Scenes/PGM/SG_pgm', state2_image: 'imgs/new/key_images/buttons/Scenes/PVW/SG_pvw', state3_image: 'imgs/new/key_images/buttons/Scenes/Inactive/SG_inactive', command: commands.BUTTON_7, state: 0, name: '', keyingMode: null, keyingCol: null },
	
	[buttonPressMediaType.MEDIA_1]: { id: 0, title: 'Media A', optgroup: 'Media', path: "/device/buttons/1/colour", state0_image: 'imgs/new/key_images/buttons/Media/Active/MA_active', state1_image: 'imgs/new/key_images/buttons/Media/PGM/MA_pgm', state2_image: 'imgs/new/key_images/buttons/Media/PVW/MA_pvw', state3_image: 'imgs/new/key_images/buttons/Media/Inactive/MA_inactive', command: commands.MEDIA_1, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressMediaType.MEDIA_2]: { id: 1, title: 'Media B', optgroup: 'Media', path: "/device/buttons/2/colour", state0_image: 'imgs/new/key_images/buttons/Media/Active/MB_active', state1_image: 'imgs/new/key_images/buttons/Media/PGM/MB_pgm', state2_image: 'imgs/new/key_images/buttons/Media/PVW/MB_pvw', state3_image: 'imgs/new/key_images/buttons/Media/Inactive/MB_inactive', command: commands.MEDIA_2, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressMediaType.MEDIA_3]: { id: 2, title: 'Media C', optgroup: 'Media', path: "/device/buttons/3/colour", state0_image: 'imgs/new/key_images/buttons/Media/Active/MC_active', state1_image: 'imgs/new/key_images/buttons/Media/PGM/MC_pgm', state2_image: 'imgs/new/key_images/buttons/Media/PVW/MC_pvw', state3_image: 'imgs/new/key_images/buttons/Media/Inactive/MC_inactive', command: commands.MEDIA_3, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressMediaType.MEDIA_4]: { id: 3, title: 'Media D', optgroup: 'Media', path: "/device/buttons/4/colour", state0_image: 'imgs/new/key_images/buttons/Media/Active/MD_active', state1_image: 'imgs/new/key_images/buttons/Media/PGM/MD_pgm', state2_image: 'imgs/new/key_images/buttons/Media/PVW/MD_pvw', state3_image: 'imgs/new/key_images/buttons/Media/Inactive/MD_inactive', command: commands.MEDIA_4, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressMediaType.MEDIA_5]: { id: 4, title: 'Media E', optgroup: 'Media', path: "/device/buttons/5/colour", state0_image: 'imgs/new/key_images/buttons/Media/Active/ME_active', state1_image: 'imgs/new/key_images/buttons/Media/PGM/ME_pgm', state2_image: 'imgs/new/key_images/buttons/Media/PVW/ME_pvw', state3_image: 'imgs/new/key_images/buttons/Media/Inactive/ME_inactive', command: commands.MEDIA_5, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressMediaType.MEDIA_6]: { id: 5, title: 'Media F', optgroup: 'Media', path: "/device/buttons/6/colour", state0_image: 'imgs/new/key_images/buttons/Media/Active/MF_active', state1_image: 'imgs/new/key_images/buttons/Media/PGM/MF_pgm', state2_image: 'imgs/new/key_images/buttons/Media/PVW/MF_pvw', state3_image: 'imgs/new/key_images/buttons/Media/Inactive/MF_inactive', command: commands.MEDIA_6, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressMediaType.MEDIA_7]: { id: 6, title: 'Media G', optgroup: 'Media', path: "/device/buttons/7/colour", state0_image: 'imgs/new/key_images/buttons/Media/Active/MG_active', state1_image: 'imgs/new/key_images/buttons/Media/PGM/MG_pgm', state2_image: 'imgs/new/key_images/buttons/Media/PVW/MG_pvw', state3_image: 'imgs/new/key_images/buttons/Media/Inactive/MG_inactive', command: commands.MEDIA_7, state: 0, name: '', keyingMode: null, keyingCol: null },
	
	[buttonPressOverlayType.OVERLAY_1]: { id: 0, title: 'Overlay A', optgroup: 'Overlay', path: "/device/buttons/1/colour", state0_image: 'imgs/new/key_images/buttons/Overlays/Active/OA_active', state1_image: 'imgs/new/key_images/buttons/Overlays/PGM/OA_pgm', state2_image: 'imgs/new/key_images/buttons/Overlays/PVW/OA_pvw', state3_image: 'imgs/new/key_images/buttons/Overlays/Inactive/OA_inactive', command: commands.OVERLAY_1, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressOverlayType.OVERLAY_2]: { id: 1, title: 'Overlay B', optgroup: 'Overlay', path: "/device/buttons/2/colour", state0_image: 'imgs/new/key_images/buttons/Overlays/Active/OB_active', state1_image: 'imgs/new/key_images/buttons/Overlays/PGM/OB_pgm', state2_image: 'imgs/new/key_images/buttons/Overlays/PVW/OB_pvw', state3_image: 'imgs/new/key_images/buttons/Overlays/Inactive/OB_inactive', command: commands.OVERLAY_2, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressOverlayType.OVERLAY_3]: { id: 2, title: 'Overlay C', optgroup: 'Overlay', path: "/device/buttons/3/colour", state0_image: 'imgs/new/key_images/buttons/Overlays/Active/OC_active', state1_image: 'imgs/new/key_images/buttons/Overlays/PGM/OC_pgm', state2_image: 'imgs/new/key_images/buttons/Overlays/PVW/OC_pvw', state3_image: 'imgs/new/key_images/buttons/Overlays/Inactive/OC_inactive', command: commands.OVERLAY_3, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressOverlayType.OVERLAY_4]: { id: 3, title: 'Overlay D', optgroup: 'Overlay', path: "/device/buttons/4/colour", state0_image: 'imgs/new/key_images/buttons/Overlays/Active/OD_active', state1_image: 'imgs/new/key_images/buttons/Overlays/PGM/OD_pgm', state2_image: 'imgs/new/key_images/buttons/Overlays/PVW/OD_pvw', state3_image: 'imgs/new/key_images/buttons/Overlays/Inactive/OD_inactive', command: commands.OVERLAY_4, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressOverlayType.OVERLAY_5]: { id: 4, title: 'Overlay E', optgroup: 'Overlay', path: "/device/buttons/5/colour", state0_image: 'imgs/new/key_images/buttons/Overlays/Active/OE_active', state1_image: 'imgs/new/key_images/buttons/Overlays/PGM/OE_pgm', state2_image: 'imgs/new/key_images/buttons/Overlays/PVW/OE_pvw', state3_image: 'imgs/new/key_images/buttons/Overlays/Inactive/OE_inactive', command: commands.OVERLAY_5, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressOverlayType.OVERLAY_6]: { id: 5, title: 'Overlay F', optgroup: 'Overlay', path: "/device/buttons/6/colour", state0_image: 'imgs/new/key_images/buttons/Overlays/Active/OF_active', state1_image: 'imgs/new/key_images/buttons/Overlays/PGM/OF_pgm', state2_image: 'imgs/new/key_images/buttons/Overlays/PVW/OF_pvw', state3_image: 'imgs/new/key_images/buttons/Overlays/Inactive/OF_inactive', command: commands.OVERLAY_6, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressOverlayType.OVERLAY_7]: { id: 6, title: 'Overlay G', optgroup: 'Overlay', path: "/device/buttons/7/colour", state0_image: 'imgs/new/key_images/buttons/Overlays/Active/OG_active', state1_image: 'imgs/new/key_images/buttons/Overlays/PGM/OG_pgm', state2_image: 'imgs/new/key_images/buttons/Overlays/PVW/OG_pvw', state3_image: 'imgs/new/key_images/buttons/Overlays/Inactive/OG_inactive', command: commands.OVERLAY_7, state: 0, name: '', keyingMode: null, keyingCol: null },

	[buttonPressControlType.BUTTON_RECORD]: { id: 14, title: 'Toggle Record', optgroup: 'Controls', path: "", state0_image: 'imgs/new/key_images/record/record_ready', state1_image: 'imgs/new/key_images/record/recording', state2_image: 'imgs/new/key_images/record/record_notready', state3_image: 'imgs/new/key_images/record/record_notready', command: commands.START_RECORD, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressControlType.BUTTON_STREAM]: { id: 15, title: 'Toggle Stream', optgroup: 'Controls', path: "", state0_image: 'imgs/new/key_images/stream/stream_ready', state1_image: 'imgs/new/key_images/stream/streaming', state2_image: 'imgs/new/key_images/stream/stream_notready', state3_image: 'imgs/new/key_images/stream/stream_notready', command: commands.START_STREAM, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressControlType.BUTTON_CUT]: { id: 105, title: 'Button Cut',  optgroup: 'Controls', path: "", state0_image: 'imgs/new/key_images/control/auto_cut/cut', state1_image: 'imgs/new/key_images/control/auto_cut/cut_active', state2_image: 'imgs/new/key_images/control/auto_cut/cut_active', state3_image: 'imgs/new/key_images/control/auto_cut/cut_active', command: commands.CUT_BUTTON_DIRECT, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressControlType.BUTTON_AUTO]: { id: 106, title: 'Button Auto',  optgroup: 'Controls', path: "/device/buttons/106/colour", state0_image: 'imgs/new/key_images/control/auto_cut/auto', state1_image: 'imgs/new/key_images/control/auto_cut/auto_active', state2_image: 'imgs/new/key_images/control/auto_cut/auto_active', state3_image: 'imgs/new/key_images/control/auto_cut/auto_active', command: commands.AUTO_BUTTON_DIRECT, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressControlType.BUTTON_MEDIA]: { id: 101, title: 'Media Menu', optgroup: 'Controls',  path: "", state0_image: 'imgs/new/key_images/control/media/media_inactive', state1_image: 'imgs/new/key_images/control/media/media_active', state2_image: 'imgs/new/key_images/control/media/media_active', state3_image: 'imgs/new/key_images/control/media/media_inactive', command: commands.MEDIA_BUTTON, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressControlType.BUTTON_OVERLAY]: { id: 102, title: 'Overlay Menu', optgroup: 'Controls', path: "", state0_image: 'imgs/new/key_images/control/overlay/overlay_inactive', state1_image: 'imgs/new/key_images/control/overlay/overlay_active', state2_image: 'imgs/new/key_images/control/overlay/overlay_active', state3_image: 'imgs/new/key_images/control/overlay/overlay_inactive', command: commands.OVERLAY_BUTTON, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressControlType.BUTTON_MULTISOURCE]: { id: 103, title: 'MultiSource Menu', optgroup: 'Controls', path: "", state0_image: 'imgs/new/key_images/control/multi/multisource_inactive', state1_image: 'imgs/new/key_images/control/multi/multisource_active', state2_image: 'imgs/new/key_images/control/multi/multisource_active', state3_image: 'imgs/new/key_images/control/multi/multisource_inactive', command: commands.MULTISOURCE_BUTTON, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressControlType.BUTTON_KEY]: { id: 103, title: 'Key Menu', optgroup: 'Controls', path: "", state0_image: 'imgs/new/key_images/control/key/key_inact', state1_image: 'imgs/new/key_images/control/key/key_active', state2_image: 'imgs/new/key_images/control/key/key_active', state3_image: 'imgs/new/key_images/control/key/key_inact', command: commands.KEY_BUTTON, state: 0, name: '', keyingMode: null, keyingCol: null },
	[buttonPressControlType.BUTTON_INSPECT]: { id: 108, title: 'Inspect Menu', optgroup: 'Controls', path: "", state0_image: 'imgs/new/key_images/control/inspect/inspectoff', state1_image: 'imgs/new/key_images/control/inspect/inspecton', state2_image: 'imgs/new/key_images/control/inspect/inspecton', state3_image: 'imgs/new/key_images/control/inspect/inspectoff', command: commands.INSPECT_BUTTON, state: 0, name: '', keyingMode: null, keyingCol: null },

};

export const transitionsList = {
	[transitionType.FADE]: { id: 0, title: 'Fade', icon: 'imgs/new/key_images/transitions/all_transitions/fade_dip/transition_fade', mirror_icon: 'imgs/new/key_images/transitions/all_transitions/fade_dip/transition_fade', command: commands.TRANSITION_FADE, data: '' },
    [transitionType.DIP]: { id: 1, title: 'Dip', icon: 'imgs/new/key_images/transitions/all_transitions/fade_dip/transition_dip', mirror_icon: 'imgs/new/key_images/transitions/all_transitions/fade_dip/transition_dip', command: commands.TRANSITION_DIP, data: commands.TRANSITION_DIP_DATA },
	[transitionType.WIPE_1]: { id: 2, title: 'Diagonal Left', icon: 'imgs/new/key_images/transitions/all_transitions/directional/Diagonal1', mirror_icon: 'imgs/new/key_images/transitions/all_transitions/directional/Diagonal1Reverse', command: commands.TRANSITION_WIPE_1, data: commands.TRANSITION_WIPE_1_DATA },
    [transitionType.WIPE_2]: { id: 3, title: 'Diagonal Right', icon: 'imgs/new/key_images/transitions/all_transitions/directional/Diagonal2', mirror_icon: 'imgs/new/key_images/transitions/all_transitions/directional/Diagonal2Reverse', command: commands.TRANSITION_WIPE_2, data: commands.TRANSITION_WIPE_2_DATA },
    [transitionType.WIPE_3]: { id: 4, title: 'Horizontal', icon: 'imgs/new/key_images/transitions/all_transitions/directional/LeftRight', mirror_icon: 'imgs/new/key_images/transitions/all_transitions/directional/LeftRightReverse', command: commands.TRANSITION_WIPE_3, data: commands.TRANSITION_WIPE_3_DATA },
    [transitionType.WIPE_4]: { id: 5, title: 'Vertical', icon: 'imgs/new/key_images/transitions/all_transitions/directional/TopBottom', mirror_icon: 'imgs/new/key_images/transitions/all_transitions/directional/TopBottomReverse', command: commands.TRANSITION_WIPE_4, data: commands.TRANSITION_WIPE_4_DATA },
    [transitionType.WIPE_5]: { id: 6, title: 'Top Left', icon: 'imgs/new/key_images/transitions/all_transitions/box/BoxTopLeft', mirror_icon: 'imgs/new/key_images/transitions/all_transitions/box/BoxTopLeftReverse', command: commands.TRANSITION_WIPE_5, data: commands.TRANSITION_WIPE_5_DATA },
    [transitionType.WIPE_6]: { id: 7, title: 'Top Right', icon: 'imgs/new/key_images/transitions/all_transitions/box/BoxTopRight', mirror_icon: 'imgs/new/key_images/transitions/all_transitions/box/BoxTopRightReverse', command: commands.TRANSITION_WIPE_6, data: commands.TRANSITION_WIPE_6_DATA },
	[transitionType.WIPE_7]: { id: 8, title: 'Bottom Right', icon: 'imgs/new/key_images/transitions/all_transitions/box/BoxBottomRight', mirror_icon: 'imgs/new/key_images/transitions/all_transitions/box/BoxBottomRightReverse', command: commands.TRANSITION_WIPE_7, data: commands.TRANSITION_WIPE_7_DATA },
	[transitionType.WIPE_8]: { id: 9, title: 'Bottom Left', icon: 'imgs/new/key_images/transitions/all_transitions/box/BoxBottomLeft', mirror_icon: 'imgs/new/key_images/transitions/all_transitions/box/BoxBottomLeftReverse', command: commands.TRANSITION_WIPE_8, data: commands.TRANSITION_WIPE_8_DATA },
	[transitionType.WIPE_9]: { id: 10, title: 'Corners', icon: 'imgs/new/key_images/transitions/all_transitions/box/BoxCorners', mirror_icon: 'imgs/new/key_images/transitions/all_transitions/box/BoxCornersReverse', command: commands.TRANSITION_WIPE_9, data: commands.TRANSITION_WIPE_9_DATA },
    [transitionType.WIPE_10]: { id: 11, title: 'Barndoor Vertical', icon: 'imgs/new/key_images/transitions/all_transitions/barndoor/BarndoorVertical', mirror_icon: 'imgs/new/key_images/transitions/all_transitions/barndoor/BarndoorVerticalReverse', command: commands.TRANSITION_WIPE_10, data: commands.TRANSITION_WIPE_10_DATA },
    [transitionType.WIPE_11]: { id: 12, title: 'Barndoor Horizontal', icon: 'imgs/new/key_images/transitions/all_transitions/barndoor/BarndoorHorizontal', mirror_icon: 'imgs/new/key_images/transitions/all_transitions/barndoor/BarndoorHorizontalReverse', command: commands.TRANSITION_WIPE_11, data: commands.TRANSITION_WIPE_11_DATA }  
};

export const submixList = {
	[SubmixChannels.LIVE]: {id: 0, title: 'Live Mix', icon: 'imgs/new/key_images/audio_sources/bluetooth', path: '/submix/stream'},
	[SubmixChannels.PHONES1]: {id: 1, title: 'Headphones 1', icon: 'imgs/new/key_images/audio_sources/bluetooth', path: '/submix/phones1'},
	[SubmixChannels.PHONES2]: {id: 2, title: 'Headphones 2', icon: 'imgs/new/key_images/audio_sources/bluetooth', path: '/submix/phones2'},
	[SubmixChannels.MONITOR]: {id: 3, title: 'Monitor', icon: 'imgs/new/key_images/audio_sources/bluetooth', path: '/submix/monitor'},
	[SubmixChannels.RECORDING]: {id: 4, title: 'Recording', icon: 'imgs/new/key_images/audio_sources/bluetooth', path: '/submix/recording'},
	[SubmixChannels.BLUETOOTH]: {id: 5, title: 'Bluetooth', icon: 'imgs/new/key_images/audio_sources/bluetooth', path: '/submix/bluetooth'},
	[SubmixChannels.USB1]: {id: 6, title: 'USB Main', icon: 'imgs/new/key_images/audio_sources/usb4', path: '/submix/usb1'},
	[SubmixChannels.USB1_CHAT]: {id: 7, title: 'USB Chat', icon: 'imgs/new/key_images/audio_sources/usb1chat', path: '/submix/usb1chat'},
	[SubmixChannels.USB2]: {id: 8, title: 'USB 2', icon: 'imgs/new/key_images/audio_sources/usb4', path: '/submix/usbsecondary'},
	[SubmixChannels.USB4]: {id: 9, title: 'USB 4', icon: 'imgs/new/key_images/audio_sources/usb4', path: '/submix/usb4Hosted'},
	[SubmixChannels.USB5]: {id: 10, title: 'USB 5', icon: 'imgs/new/key_images/audio_sources/usb5', path: '/submix/usb2Hosted'}
}

export const mixList = {
	[SubmixChannels.LIVE]: {id: 0, title: 'Live Mix', icon: 'imgs/new/key_images/audio_sources/bluetooth'},
	[SubmixChannels.PHONES1]: {id: 1, title: 'Headphones 1', icon: 'imgs/new/key_images/audio_sources/bluetooth'},
	[SubmixChannels.PHONES2]: {id: 2, title: 'Headphones 2', icon: 'imgs/new/key_images/audio_sources/bluetooth'},
	[SubmixChannels.MONITOR]: {id: 3, title: 'Monitor', icon: 'imgs/new/key_images/audio_sources/bluetooth'},
	[SubmixChannels.RECORDING]: {id: 4, title: 'Recording', icon: 'imgs/new/key_images/audio_sources/bluetooth'},
	[SubmixChannels.BLUETOOTH]: {id: 5, title: 'Bluetooth', icon: 'imgs/new/key_images/audio_sources/bluetooth'},
	[SubmixChannels.USB1]: {id: 6, title: 'USB Main', icon: 'imgs/new/key_images/audio_sources/usb4'},
	[SubmixChannels.USB1_CHAT]: {id: 7, title: 'USB Chat', icon: 'imgs/new/key_images/audio_sources/usb1chat'},
	[SubmixChannels.USB2]: {id: 8, title: 'USB 2', icon: 'imgs/new/key_images/audio_sources/usb4'},
	[SubmixChannels.USB4]: {id: 9, title: 'USB 4', icon: 'imgs/new/key_images/audio_sources/usb4'},
	[SubmixChannels.USB5]: {id: 10, title: 'USB 5', icon: 'imgs/new/key_images/audio_sources/usb5'}
}

export const channelList: { [key in audioChannels]?: { title: string, icon: string, mute_icon: string, layout_icon: string, layout_mute_icon: string, minGain: number, maxGain: number } } = {
	[audioChannels.COMBO1]: {
		title: 'Combo 1',
		icon: 'imgs/new/key_images/audio_sources/combo1', 
		mute_icon: 'imgs/new/key_images/audio_sources/combo1_mute',
		layout_icon: 'imgs/new/key_images/audio_sources/combo1_layout',
		layout_mute_icon: 'imgs/new/key_images/audio_sources/combo1_layout_mute',
		minGain: 0,
		maxGain: 76
	},
	[audioChannels.COMBO2]: {
		title: 'Combo 2',
		icon: 'imgs/new/key_images/audio_sources/combo2', 
		mute_icon: 'imgs/new/key_images/audio_sources/combo2_mute',
		layout_icon: 'imgs/new/key_images/audio_sources/combo2_layout',
		layout_mute_icon: 'imgs/new/key_images/audio_sources/combo2_layout_mute',
		minGain: 0,
		maxGain: 76
	},
	[audioChannels.COMBO_LINKED]: {
		title: 'Combo Linked',
		icon: 'imgs/new/key_images/audio_sources/combo1_2', 
		mute_icon: 'imgs/new/key_images/audio_sources/combo1_2_mute',
		layout_icon: 'imgs/new/key_images/audio_sources/combo1_2_layout',
		layout_mute_icon: 'imgs/new/key_images/audio_sources/combo1_2_layout_mute',
		minGain: 0,
		maxGain: 76
	},
	[audioChannels.WIRELESS1]: {
		title: 'Wireless 1',
		icon: 'imgs/new/key_images/audio_sources/wireless1', 
		mute_icon: 'imgs/new/key_images/audio_sources/wireless1_mute',
		layout_icon: 'imgs/new/key_images/audio_sources/wireless1_layout',
		layout_mute_icon: 'imgs/new/key_images/audio_sources/wireless1_layout_mute',
		minGain: -24,
		maxGain: 0
	},
	[audioChannels.WIRELESS2]: {
		title: 'Wireless 2',
		icon: 'imgs/new/key_images/audio_sources/wireless2', 
		mute_icon: 'imgs/new/key_images/audio_sources/wireless2_mute',
		layout_icon: 'imgs/new/key_images/audio_sources/wireless2_layout',
		layout_mute_icon: 'imgs/new/key_images/audio_sources/wireless2_layout_mute',
		minGain: -24,
		maxGain: 0
	},
	[audioChannels.VIDEOCLIPS]: {
		title: 'Video Clips',
		icon: 'imgs/new/key_images/audio_sources/videoclips', 
		mute_icon: 'imgs/new/key_images/audio_sources/videoclips_mute',
		layout_icon: 'imgs/new/key_images/audio_sources/videoclips_layout',
		layout_mute_icon: 'imgs/new/key_images/audio_sources/videoclips_layout_mute',
		minGain: -24,
		maxGain: 0
	},
	[audioChannels.SOUNDS]: {
		title: 'Sounds',
		icon: 'imgs/new/key_images/audio_sources/sounds', 
		mute_icon: 'imgs/new/key_images/audio_sources/sounds_mute',
		layout_icon: 'imgs/new/key_images/audio_sources/sounds_layout',
		layout_mute_icon: 'imgs/new/key_images/audio_sources/sounds_layout_mute',
		minGain: -24,
		maxGain: 0
	},
	[audioChannels.HDMI1]: {
		title: 'HDMI 1',
		icon: 'imgs/new/key_images/audio_sources/HDMI1', 
		mute_icon: 'imgs/new/key_images/audio_sources/HDMI1_mute',
		layout_icon: 'imgs/new/key_images/audio_sources/HDMI1_layout',
		layout_mute_icon: 'imgs/new/key_images/audio_sources/HDMI1_layout_mute',
		minGain: -24,
		maxGain: 0
	},
	[audioChannels.HDMI2]: {
		title: 'HDMI 2',
		icon: 'imgs/new/key_images/audio_sources/HDMI2', 
		mute_icon: 'imgs/new/key_images/audio_sources/HDMI2_mute',
		layout_icon: 'imgs/new/key_images/audio_sources/HDMI2_layout',
		layout_mute_icon: 'imgs/new/key_images/audio_sources/HDMI2_layout_mute',
		minGain: -24,
		maxGain: 0
	},
	[audioChannels.HDMI3]: {
		title: 'HDMI 3',
		icon: 'imgs/new/key_images/audio_sources/HDMI3', 
		mute_icon: 'imgs/new/key_images/audio_sources/HDMI3_mute',
		layout_icon: 'imgs/new/key_images/audio_sources/HDMI3_layout',
		layout_mute_icon: 'imgs/new/key_images/audio_sources/HDMI3_layout_mute',
		minGain: -24,
		maxGain: 0
	},
	[audioChannels.HDMI4]: {
		title: 'HDMI 4',
		icon: 'imgs/new/key_images/audio_sources/HDMI4', 
		mute_icon: 'imgs/new/key_images/audio_sources/HDMI4_mute',
		layout_icon: 'imgs/new/key_images/audio_sources/HDMI4_layout',
		layout_mute_icon: 'imgs/new/key_images/audio_sources/HDMI4_layout_mute',
		minGain: -24,
		maxGain: 0
	},
	[audioChannels.BLUETOOTH]: {
		title: 'Bluetooth',
		icon: 'imgs/new/key_images/audio_sources/bluetooth', 
		mute_icon: 'imgs/new/key_images/audio_sources/bluetooth_mute',
		layout_icon: 'imgs/new/key_images/audio_sources/bluetooth_layout',
		layout_mute_icon: 'imgs/new/key_images/audio_sources/bluetooth_layout_mute',
		minGain: -24,
		maxGain: 0
	},
	[audioChannels.USB1]: {
		title: 'USB Main',
		icon: 'imgs/new/key_images/audio_sources/usb1', 
		mute_icon: 'imgs/new/key_images/audio_sources/usb1_mute',
		layout_icon: 'imgs/new/key_images/audio_sources/usb1_layout',
		layout_mute_icon: 'imgs/new/key_images/audio_sources/usb1_layout_mute',
		minGain: -24,
		maxGain: 0
	},
	[audioChannels.USB1CHAT]: {
		title: 'USB Chat',
		icon: 'imgs/new/key_images/audio_sources/chat1', 
		mute_icon: 'imgs/new/key_images/audio_sources/chat1_mute',
		layout_icon: 'imgs/new/key_images/audio_sources/chat1_layout',
		layout_mute_icon: 'imgs/new/key_images/audio_sources/chat1_layout_mute',
		minGain: -24,
		maxGain: 0
	},
	[audioChannels.USB2]: {
		title: 'USB 2',
		icon: 'imgs/new/key_images/audio_sources/usb2', 
		mute_icon: 'imgs/new/key_images/audio_sources/usb2_mute',
		layout_icon: 'imgs/new/key_images/audio_sources/usb2_layout',
		layout_mute_icon: 'imgs/new/key_images/audio_sources/usb2_layout_mute',
		minGain: -24,
		maxGain: 0
	},
	[audioChannels.USB4]: {
		title: 'USB 4',
		icon: 'imgs/new/key_images/audio_sources/usb4', 
		mute_icon: 'imgs/new/key_images/audio_sources/usb4_mute',
		layout_icon: 'imgs/new/key_images/audio_sources/usb4_layout',
		layout_mute_icon: 'imgs/new/key_images/audio_sources/usb4_layout_mute',
		minGain: -24,
		maxGain: 0
	},
	[audioChannels.USB5]: {
		title: 'USB 5',
		icon: 'imgs/new/key_images/audio_sources/usb5', 
		mute_icon: 'imgs/new/key_images/audio_sources/usb5_mute',
		layout_icon: 'imgs/new/key_images/audio_sources/usb5_layout',
		layout_mute_icon: 'imgs/new/key_images/audio_sources/usb5_layout_mute',
		minGain: -24,
		maxGain: 0
	},
}

export const monitorChannelList = {
	[MonitorChannels.HP1_VOL]: {id: 0, title: 'Headphones 1', icon: 'imgs/new/key_images/monitors/hp1'},
	[MonitorChannels.HP2_VOL]: {id: 1, title: 'Headphones 2', icon: 'imgs/new/key_images/monitors/hp2'},
	[MonitorChannels.MON_VOL]: {id: 2, title: 'Studio Monitors', icon: 'imgs/new/key_images/monitors/monitor'},
}

export const audioLevelsPercentageTable = [
	{ value: 0.0, percentage: 0.0 },
	{ value: 0.10000002384185791, percentage: 0.1 },
	{ value: 0.20000001788139343, percentage: 0.2 },
	{ value: 0.30000001192092896, percentage: 0.3 },
	{ value: 0.4000000059604645, percentage: 0.4 },
	{ value: 0.5, percentage: 0.5 },
	{ value: 0.6000000238418579, percentage: 0.6 },
	{ value: 0.6500000953674316, percentage: 0.65 },
	{ value: 0.6999999284744263, percentage: 0.7 },
	{ value: 0.7399998307228088, percentage: 0.74 },
	{ value: 0.7499998211860657, percentage: 0.75 },
	{ value: 0.7599998116493225, percentage: 0.76 },
	{ value: 0.7699999213218689, percentage: 0.77 },
	{ value: 0.7900000810623169, percentage: 0.79 },
	{ value: 0.800000011920929, percentage: 0.8 },
	{ value: 0.8999999761581421, percentage: 0.9 },
	{ value: 0.9998999834060669, percentage: 0.9999 },
	{ value: 1.0, percentage: 1.0 }
];

export const frameRateList = {
	['23']: { title: '23.98 FPS', command: commands.FRAMERATE_23 },
	['24']: { title: '24 FPS', command: commands.FRAMERATE_24 },
	['25']: { title: '25 FPS', command: commands.FRAMERATE_25 },
	['29']: { title: '29.97 FPS', command: commands.FRAMERATE_29 },
	['30']: { title: '30 FPS', command: commands.FRAMERATE_30 },
	['50']: { title: '50 FPS', command: commands.FRAMERATE_50 },
	['59']: { title: '59.94 FPS', command: commands.FRAMERATE_59 },
	['60']: { title: '60 FPS', command: commands.FRAMERATE_60 },
}