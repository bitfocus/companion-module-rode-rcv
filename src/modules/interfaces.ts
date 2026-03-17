import { Socket } from 'net';
import { MetersChannel, MetersSubmix, RCVModel, SubmixChannels } from './enums.js';
import { RCVInstance } from '../index.js';
import { PresetBox } from 'companion-module-utils/dist/presets.js';

export interface ClientInfo {
	socket: Socket;
	ipAddress: string;
	port: number;
}

export interface RcvDeviceInfo {
	name: string;
	serialNo: string;
	swVersion: string;
	ipAddress: string;
	model: RCVModel;
	type: string;
	manual?: boolean;
}

export interface AudioMixerCh {
	version?: string;
	position?: number;
	name?: string;
	gain?: number;
	fading?: boolean;
	submixes?: AudioAudioSourceCh[];
}

export interface AudioAudioSourceCh {
	submix?: SubmixChannels;
	level?: number;
	muted?: boolean;
	scene_mute?: boolean;
	disabled?: boolean;
	linked?: boolean;
}

export interface MeterRequestOptions {
	instance: RCVInstance;
	mix: MetersSubmix;
	outputChannels: MetersChannel[];
	inputChannels: MetersChannel[];
}

export interface ChannelData {
	left?: { level: number; peak: number };
	right?: { level: number; peak: number };
}

export interface MeterValues {
	master: ChannelData;
	outputMix: number;
	outputs: Partial<Record<MetersChannel, ChannelData>>;
	inputs: Partial<Record<MetersChannel, ChannelData>>;
}

export interface PresetOptionsBoxes_Custom {
	width: number;
	height: number;
	position: 'top' | 'bottom' | 'left' | 'right' | 'middle';
	boxes: PresetBox[];
}
