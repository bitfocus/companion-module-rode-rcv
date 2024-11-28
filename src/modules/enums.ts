export enum coloursList {
	WHITE = '#FFFFFF',
	RED = '#FF0037',
	YELLOW = '#FFC400',
	GREEN = '#00FF84',
	BLUE = '#00C7FF',
	GREY = '#4F4F4F'
}

export enum RCVSourceModes {
	MEDIA = 'mediaMenu',
	OVERLAY = 'overlayMenu',
	MULTISOURCE = 'multiSourceMenu',
	INSPECT = 'inspectMenu',
	KEYFILL = 'keyFillMenu',
	UNKNOWN = 'unknown'
}

export enum buttonStates {
	PGM = 'pgm',
	PVW = 'pvw',
	IDLE = 'idle',
	UNAVAILABLE = 'unavailable',
	ACTIVE = 'active',
	INACTIVE = 'inactive'
}

export enum buttonPressControlType {
	BUTTON_A = 'buttona',
	BUTTON_B = 'buttonb',
	BUTTON_C = 'buttonc',
	BUTTON_D = 'buttond',
	BUTTON_E = 'buttone',
	BUTTON_F = 'buttonf',
	BUTTON_G = 'buttong',
	BUTTON_1 = 'button1',
	BUTTON_2 = 'button2',
	BUTTON_3 = 'button3',
	BUTTON_4 = 'button4',
	BUTTON_5 = 'button5',
	BUTTON_6 = 'button6',
	BUTTON_FTB = 'button7',
	BUTTON_RECORD = 'buttonRecord',
	BUTTON_STREAM = 'buttonStream',
	BUTTON_CUT = 'buttonCut',
	BUTTON_AUTO = 'buttonAuto',
	BUTTON_MEDIA = 'buttonMedia',
	BUTTON_OVERLAY = 'buttonOverlay',
	BUTTON_MULTISOURCE = 'buttonMultiSource',
	BUTTON_KEY = 'buttonKey',
	BUTTON_INSPECT = 'buttonInspect'
}

export enum buttonPressInputsType {
	INPUT_1 = 'input1',
	INPUT_2 = 'input2',
	INPUT_3 = 'input3',
	INPUT_4 = 'input4',
	INPUT_5 = 'input5',
	INPUT_6 = 'input6',
	INPUT_FTP = 'input7',
}

export enum buttonPressSceneType {
	SCENE_1 = 'scene1',
	SCENE_2 = 'scene2',
	SCENE_3 = 'scene3',
	SCENE_4 = 'scene4',
	SCENE_5 = 'scene5',
	SCENE_6 = 'scene6',
	SCENE_7 = 'scene7',
}

export enum buttonPressMediaType {
	MEDIA_1 = 'media1',
	MEDIA_2 = 'media2',
	MEDIA_3 = 'media3',
	MEDIA_4 = 'media4',
	MEDIA_5 = 'media5',
	MEDIA_6 = 'media6',
	MEDIA_7 = 'media7',
}

export enum buttonPressOverlayType {
	OVERLAY_1 = 'overlay1',
	OVERLAY_2 = 'overlay2',
	OVERLAY_3 = 'overlay3',
	OVERLAY_4 = 'overlay4',
	OVERLAY_5 = 'overlay5',
	OVERLAY_6 = 'overlay6',
	OVERLAY_7 = 'overlay7',
}

export enum transtionCategory {
	FADE = 'fade',
	DIP = 'dip',
	WIPE = 'wipe'
}

export enum transitionType {
	NONE = 'none',
	ACCELERATE = 'accelerate',
	CYCLE = 'cycle',
	FADE = 'fade',
	DIP = 'dipBlack',
	WIPE_1 = 'diagonal_1',
	WIPE_2 = 'diagonal_2',
	WIPE_3 = 'leftright',
	WIPE_4 = 'top_bottom',
	WIPE_5 = 'box_tl',
	WIPE_6 = 'box_tr',
	WIPE_7 = 'box_br',
	WIPE_8 = 'box_bl',
	WIPE_9 = 'corners',
	WIPE_10 = 'barndoor-v',
	WIPE_11 = 'barndoor-h',
}

export enum MixerChannels {
	LIVE = 'value0',
	PHONES1 = 'value1',
	PHONES2 = 'value2',
	MONITOR = 'value3',
	RECORDING = 'value4',
	BLUETOOTH = 'value5',
	USB1 = 'value6',
	USB1_CHAT = 'value7',
	USB2 = 'value8',
	USB3 = 'value9',
	USB4 = 'value10',
	USB5 = 'value11',
}

export enum SubmixChannels {
	LIVE = 'live',
	PHONES1 = 'phones1',
	PHONES2 = 'phones2',
	MONITOR = 'monitor',
	RECORDING = 'recording',
	BLUETOOTH = 'bluetooth',
	USB1 = 'usb1',
	USB1_CHAT = 'usb1chat',
	USB2 = 'usbsecondary',
	USB3 = 'usb3Hosted',
	USB4 = 'usb4Hosted',
	USB5 = 'usb2Hosted',
}

export enum MetersSubmix {
    Live = 0,
    PHONES1 = 1,
    PHONES2 = 2,
    MONITOR = 3,
    Recording = 4,
    RECORDING = 5,
    USB1 = 6,
    USB1_CHAT =  7,
    USB2 = 8,
    USB3 = 9,
    USB4 = 10,
    USB5 = 11, // Obsolete
    NumTypes = 12
}

export enum audioChannels {
	COMBO1 = 'value0',
	COMBO2 = 'value1',
	COMBO_LINKED = 'value2',
	WIRELESS1 = 'value3',
	WIRELESS2 = 'value4',
	VIDEOCLIPS = 'value5',
	SOUNDS = 'value6',
	HDMI1 = 'value9',
	HDMI2 = 'value12',
	HDMI3 = 'value15',
	HDMI4 = 'value18',
	BLUETOOTH = 'value19',
	USB1 = 'value20',
	USB1CHAT = 'value21',
	USB2 = 'value22',
	USB4 = 'value23',
	USB5 = 'value24',
	//IPHONE = 'value25',
}

export enum MetersChannel {
    COMBO1 = 0,
    COMBO2 = 1,
    COMBO_LINKED = 2,
    WIRELESS1 = 3,
    WIRELESS2 = 4,
    VIDEOCLIPS = 5,
    SOUNDS = 6,
    HDMI1L = 7,
    HDMI1R = 8,
    HDMI1 = 9,
    HDMI2L = 10,
    HDMI2R = 11,
    HDMI2 = 12,
    HDMI3L = 13,
    HDMI3R = 14,
    HDMI3 = 15,
    HDMI4L = 16,
    HDMI4R = 17,
    HDMI4 = 18,
    BLUETOOTH = 19,
    USB1 = 20,
    USB1CHAT = 21,
    USB2 = 22,
    USB4 = 23,
    USB5 = 24,
    IPHONE = 25,
    USB3 = 26, // Obsolete
    NumSources = 27,
    None = -1
}

export enum MonitorChannels {
	HP1_VOL = 'HP1_VOL',
	HP2_VOL = 'HP2_VOL',
	MON_VOL = 'MON_VOL'
}

export enum recordEncoderDisplay {
	TIMECODE = 'displayTimecode',
	STORAGE = 'displayStorage',
	PERCENT = 'displayPercent',
	TIME_REMAIN = 'displayTime'
}

export enum streamEncoderDisplay {
	TIMECODE = 'displayTimecode',
	NAME = 'displayName',
	BITRATE = 'displayBitrate',
	CONNECTION = 'displayConnection'
}

export enum keyingMode {
	NONE = 'none',
	CHROMA = 'chroma',
}

export enum keyingCol {
	NONE = 'none',
	GREEN = 'ff00',
	BLUE = 'ff'
}

export enum keyingColStatic {
	NONE = 'none',
	GREEN = 'green',
	BLUE = 'blue'
}

export enum routingOutputs {
	HDMI_A = 'outputA',
	HDMI_B = 'outputB',
}

export enum routingSources {
	PROGRAM = 'program',
	PREVIEW = 'preview',
	MULTIVIEW = 'multi'
}

export enum pressMode {
	TOGGLE = 'toggle',
	HOLD = 'hold',
	ONESHOT = 'oneshot',
}

export enum mediaType {
	VIDEO = 'video',
	AUDIO = 'audio',
	OTHER = 'other'
}

export enum LogLevel {
	INFO = 'info',
	WARN = 'warn',
	ERROR = 'error',
	DEBUG = 'debug',
	TRACE = 'trace'
}