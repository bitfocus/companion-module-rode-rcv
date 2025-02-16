import { ChannelData, MeterRequestOptions, MeterValues } from '../modules/interfaces.js';
import { LogLevel, MetersChannel, MetersSubmix } from '../modules/enums.js';
import { sendOSCCommand } from '../modules/oscController.js';
import { commands } from '../modules/commands.js';
import { Buffer } from 'buffer';
import { ConsoleLog } from '../modules/logger.js';
import { RCVInstance } from '../index';
import { controllerVariables, mixerChannels } from '../modules/constants.js';
import { PresetOptionsMeter1 } from 'companion-module-utils/dist/presets.js';
import { bar, stackImage } from 'companion-module-utils/dist/graphics.js';


/**
 * Send a request for meter values.
 * @param options - The options for the meter request.
 * @returns A promise that resolves when the command is sent successfully.
 */
export async function requestMeterValues(options: MeterRequestOptions): Promise<void> {
    const { instance, mix, outputChannels, inputChannels } = options;

    // Step 1: Mix type (1 byte)
    const mixBuffer = Buffer.alloc(1);
    mixBuffer.writeUInt8(mix, 0);  // Mix value written as a single byte (0-255)

    // Step 2: Create bitsets for output and input channels
    let outputMask = BigInt(0);
    let inputMask = BigInt(0);

    // Set bits in the output mask for the requested output channels
    outputChannels.forEach(channel => {
        if (channel !== MetersChannel.None && channel >= 0 && channel < 64) {
            outputMask |= (BigInt(1) << BigInt(channel));
        }
    });

    // Set bits in the input mask for the requested input channels
    inputChannels.forEach(channel => {
        if (channel !== MetersChannel.None && channel >= 0 && channel < 64) {
            inputMask |= (BigInt(1) << BigInt(channel));
        }
    });

    // Step 3: Output channels mask (uint64)
    const outputMaskBuffer = Buffer.alloc(8);
    outputMaskBuffer.writeBigUInt64LE(outputMask, 0);  // Write outputMask in little-endian format

    // Step 4: Input channels mask (uint64)
    const inputMaskBuffer = Buffer.alloc(8);
    inputMaskBuffer.writeBigUInt64LE(inputMask, 0);  // Write inputMask in little-endian format

	const padding = Buffer.alloc(1);
	padding.writeUInt8(0, 0);

    // Step 5: Combine all buffers into a single blob buffer
    const blobBuffer = Buffer.concat([mixBuffer, outputMaskBuffer, inputMaskBuffer]); //, padding, padding, padding

    // Step 6: Send the OSC command - commands.METERS[0] = /meters/masks
    await sendOSCCommand(instance, commands.METERS[0].toString(), blobBuffer);
}


export function parseMeterValues(instance: RCVInstance, blob: Buffer): MeterValues | null {
	let null_result = null;

	if (controllerVariables.currentAudioLevels) {
		null_result = {
			master: controllerVariables.currentAudioLevels.master,
			outputMix: controllerVariables.currentAudioLevels.outputMix,
			outputs: controllerVariables.currentAudioLevels.outputs,
			inputs: controllerVariables.currentAudioLevels.inputs,
		};

	}

    try {

		//Check blob sizes
		if (blob.length === 0) {
			return null_result;
		}

        // Step 1: Parse master meters
        if (blob.length < 16) {
            ConsoleLog(instance, 'Blob is too short to read master meters', LogLevel.DEBUG, false);
			
			return null_result;
        }

		let left_level = blob.readFloatLE(0);
		let left_peak = blob.readFloatLE(4);
		let right_level = blob.readFloatLE(8);
		let right_peak = blob.readFloatLE(12);

		[left_level, left_peak, right_level, right_peak] = clampLevels(left_level, left_peak, right_level, right_peak);

        const master = {
            left: {
                level: left_level,
                peak: left_peak,
            },
            right: {
                level: right_level,
                peak: right_peak,
            },
        };

		// Remove master meters from blob
		blob = blob.subarray(16);

        // Step 2: Parse output mix (uint8)
        if (blob.length <  1) {
            ConsoleLog(instance, 'Blob is too short to read output mix', LogLevel.DEBUG, false);

			return null_result;
        }

        const outputMix = blob.readUInt8(0);


		//Validate outMix
        if (outputMix < 0 || outputMix >= MetersSubmix.NumTypes) {
            ConsoleLog(instance, `Invalid output mix value: ${outputMix}`, LogLevel.DEBUG, false);
			
			return null_result;
        }

		//Remove outMix from blob
        blob = blob.subarray(1);


        // Step 3: Parse outputs mask (uint64)
        if (blob.length < 8) {
            ConsoleLog(instance, 'Blob is too short to read output mask', LogLevel.DEBUG, false);
			
			return null_result;
        }
		
        const outputsMask = blob.readBigUInt64LE(0);

		//Remove outputs mask from blob
        blob = blob.subarray(8);

        // Step 4: Parse output values based on the mask
        const outputs: Partial<Record<MetersChannel, ChannelData>> = {};

        for (let i = 0; i < MetersChannel.NumSources; i++) {
            if ((outputsMask & (BigInt(1) << BigInt(i))) !== BigInt(0)) {
                if (blob.length < 16) {
                    ConsoleLog(instance, `Blob is too short to read output channel at index ${i}. Length: ${blob.length}`, LogLevel.DEBUG, false);
                    continue;
                }

                const channelData = parseStereoChannel(blob);

                if (!channelData) {
                    ConsoleLog(instance, `Invalid output channel data at index ${i}`, LogLevel.DEBUG, false);
					blob = blob.subarray(16);
                    continue;
                }

                outputs[i as MetersChannel] = channelData;
                blob = blob.subarray(16);
            }
        }
		
        // Step 5: Check if there is enough data left to read the inputs mask
        
		// Parse inputs mask (uint64)
		if (blob.length < 8) {
            ConsoleLog(instance, 'Blob is too short to read input mask', LogLevel.DEBUG, false);

			return null_result;
        }
		
        const inputsMask = blob.readBigUInt64LE(0);

		//Remove inputs mask from blob
        blob = blob.subarray(8);

		// Step 6: Parse input values based on the mask
		const inputs: Partial<Record<MetersChannel, ChannelData>> = {};

		for (let i = 0; i < MetersChannel.NumSources; i++) {
			if ((inputsMask & (BigInt(1) << BigInt(i))) !== BigInt(0)) {

				if (blob.length < 16) {
					ConsoleLog(instance, `Blob is too short to read input channel at index ${i}. Length: ${blob.length}`, LogLevel.DEBUG, false);
					continue;
				}

				const channelData = parseStereoChannel(blob);

				if (!channelData) {
					ConsoleLog(instance, `Invalid input channel data at index ${i}`, LogLevel.DEBUG, false);
					blob = blob.subarray(16);
					continue;
				}

				inputs[i as MetersChannel] = channelData;
				blob = blob.subarray(16);
			}
		}

		// Construct the result object with the parsed values
		const result: MeterValues = {
			master,
			outputMix,
			outputs,
			inputs,
		};

		return result;
			
    } catch (error) {
        ConsoleLog(instance, `Error while parsing meter values: ${error.message}`, LogLevel.ERROR, false);
		
        return null_result;
    }
}

/**
 * Parse a stereo channel from the blob data.
 * @param blob - The blob containing the channel data.
 * @returns Parsed stereo channel data or null if validation fails.
 */
function parseStereoChannel(blob: Buffer): ChannelData | null {
    let leftLevel = blob.readFloatLE(0);
    let leftPeak = blob.readFloatLE(4);
    let rightLevel = blob.readFloatLE(8);
    let rightPeak = blob.readFloatLE(12);

    // Validate levels
	[leftLevel, leftPeak, rightLevel, rightPeak] = clampLevels(leftLevel, leftPeak, rightLevel, rightPeak);

    return {
        left: {
            level: leftLevel,
            peak: leftPeak,
        },
        right: {
            level: rightLevel,
            peak: rightPeak,
        },
    };
}

/**
 * Validate and clamp all levels to be between 0 and 1.
 * @param levels - A list of float values to validate and clamp.
 * @returns A list of clamped levels where each value is between 0 and 1.
 */
function clampLevels(...levels: number[]): number[] {
    return levels.map(level => {
        if (isNaN(level)) {
            return 0.0;  // You can decide how to handle NaN values, e.g., setting them to 0
        }
        return Math.max(0.0, Math.min(level, 1.0));  // Clamp between 0 and 1
    });
}

const meterLevelsPercentageTable = [
	{ value: 0.0, percentage: 0.0 },
    { value: 0.001, percentage: 0.1 },   // Small values starting from 0.1%
    { value: 0.00169159728102386, percentage: 0.2 },  // Reflecting smaller values to larger percentages
    { value: 0.002, percentage: 0.25 },
    { value: 0.003, percentage: 0.3 },                // Curve reflecting fast growth for smaller values
    { value: 0.004, percentage: 0.35 },
    { value: 0.005, percentage: 0.37 },
    { value: 0.006612560711801052, percentage: 0.4 }, // Mid-range of the quieter zone
    { value: 0.008, percentage: 0.45 },
    { value: 0.01, percentage: 0.5 },                 // Moving towards 0dB
    { value: 0.015, percentage: 0.55 },
    { value: 0.1, percentage: 0.6 },                  // Around 0dB at 60%
    { value: 0.12, percentage: 0.625 },
    { value: 0.15, percentage: 0.64 },
    { value: 0.2, percentage: 0.65 },
    { value: 0.25, percentage: 0.675 },
    { value: 0.3, percentage: 0.7 },
    { value: 0.35, percentage: 0.725 },
    { value: 0.4, percentage: 0.75 },
    { value: 0.45, percentage: 0.775 },
    { value: 0.5, percentage: 0.8 },
    { value: 0.55, percentage: 0.825 },
    { value: 0.6, percentage: 0.85 },
    { value: 0.65, percentage: 0.875 },
    { value: 0.7, percentage: 0.9 },
    { value: 0.75, percentage: 0.925 },
    { value: 0.8, percentage: 0.95 },
    { value: 0.85, percentage: 0.965 },
    { value: 0.9, percentage: 0.98 },
    { value: 0.95, percentage: 0.99 },
    { value: 1.0, percentage: 1.0 }                   // Max level corresponding to 100%
];

/**
 * Convert meter level (normalized value) to percentage based on the meterLevelsPercentageTable.
 *
 * @param {number} value - The normalized meter level (between 0 and 1).
 * @returns {number} - The corresponding percentage (between 0 and 1).
 */
export function meterLevelToPercentage(value: number): number {
    if (value < 0 || value > 1) {
        throw new Error("Value must be between 0 and 1.");
    }

    // Iterate through the table to find the correct range
    for (let i = 0; i < meterLevelsPercentageTable.length - 1; i++) {
        const current = meterLevelsPercentageTable[i];
        const next = meterLevelsPercentageTable[i + 1];

        if (value >= current.value && value < next.value) {
            const deltaValue = next.value - current.value;
            const deltaPercentage = next.percentage - current.percentage;

            // Interpolate between the two points
            return current.percentage + (deltaPercentage * (value - current.value) / deltaValue);
        }
    }

    // If the value is exactly 1, return the last percentage
    return meterLevelsPercentageTable[meterLevelsPercentageTable.length - 1].percentage;
}

/**
 * Get all channel values from the MetersChannel enum except for `None` and `Obsolete` values.
 */
export function getAllChannels(): MetersChannel[] {
    return Object.values(MetersChannel)
        .filter((value): value is number => typeof value === 'number' && value >= 0 && value < MetersChannel.NumSources);
}

// Function to fetch active submixes
export async function getActiveMixes(instance: RCVInstance): Promise<void> {
	if (!controllerVariables.returnLiveLevels) {
		return;
	}
	
    const mixes = mixerChannels;
    const outputChannels: number[] = [];

    for (const [mixerChName, mixerCh] of Object.entries(mixes)) {
        // Extract numeric ID from 'value1', 'value2', etc.
        const id = parseInt(mixerChName.slice(5), 10);
        if (isNaN(id)) {
            ConsoleLog(instance, `Invalid mixer channel name: ${mixerChName}`, LogLevel.WARN, false);
            continue;
        }

        outputChannels.push(id);
    }

    ConsoleLog(instance, `Outputs: ${outputChannels.join(', ')}`, LogLevel.INFO, false);

    if (outputChannels.length > 0) {
        await requestMeterValues({
            instance: instance,
            mix: MetersSubmix.Live,
            outputChannels: outputChannels,
            inputChannels: [MetersChannel.None]
        }).catch(err => {
            ConsoleLog(instance, `Failed to request meter values: ${err}`, LogLevel.ERROR);
        });
    }
}

export const combineRGB = (r: number, g: number, b: number): number => {
	return ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff)
}

export const companionMeter = (options: PresetOptionsMeter1, orientation: 'horizontal' | 'vertical' = 'vertical', position: 'tl' | 'tr' | 'tm' | 'bl' | 'br' | 'bm' = 'br'): Uint8Array => {
	const muted = options.muted !== undefined ? options.muted : false
	const bars2 = options.meter2 !== undefined

	const colours = [
		{
			size: 65,
			color: muted ? combineRGB(0, 255, 255) : combineRGB(0, 255, 0),
			background: muted ? combineRGB(0, 255, 255) : combineRGB(0, 255, 0),
			backgroundOpacity: 64,
		},
		{
			size: 25,
			color: muted ? combineRGB(0, 192, 192) : combineRGB(255, 234, 0),
			background: muted ? combineRGB(0, 192, 192) : combineRGB(255, 234, 0),
			backgroundOpacity: 64,
		},
		{
			size: 10,
			color: muted ? combineRGB(0, 128, 128) : combineRGB(255, 0, 0),
			background: muted ? combineRGB(0, 128, 128) : combineRGB(255, 0, 0),
			backgroundOpacity: 64,
		}
	];

	let barLength = 25;
	let offsetX = 62;
	let offsetY = 20;

	switch (position) {
		case 'tl':
			offsetX = orientation === 'vertical' ? 12 : 5;
			offsetY = orientation === 'vertical' ? 5 : 12;
			break;
		case 'tr':
			offsetX = orientation === 'vertical' ? 62: 20;
			offsetY = orientation === 'vertical' ? 5 : 12;
			break;
		case 'tm':
			offsetX = orientation === 'vertical' ? 38: 13;
			offsetY = orientation === 'vertical' ? 5 : 12;
			break;
		case 'bl':
			offsetX = orientation === 'vertical' ? 12 : 5;
			offsetY = orientation === 'vertical' ? 20 : 36;
			break;
		case 'br':
			offsetX = orientation === 'vertical' ? 62 : 20;
			offsetY = orientation === 'vertical' ? 20 : 36;
			break;
		case 'bm':
			offsetX = orientation === 'vertical' ? 38 : 13;
			offsetY = orientation === 'vertical' ? 20 : 36;
			break;
	}

	const bar1 = bar({
	  width: options.width,
	  height: options.height,
	  colors: colours,
	  opacity: 255,
	  offsetX: orientation === 'vertical' ? offsetX - 8 : offsetX,
	  offsetY: orientation === 'vertical' ? offsetY : offsetY + 8,
	  barLength: orientation === 'vertical' ? options.height - barLength : options.width - barLength,
	  barWidth: 6,
	  value: options.meter1,
	  type: orientation,
	})
  
	let bar2
  
	if (bars2) {
	  bar2 = bar({
		width: options.width,
		height: options.height,
		colors: colours,
		opacity: 255,
		offsetX: offsetX,
		offsetY: offsetY,
		barLength: orientation === 'vertical' ? options.height - barLength : options.width - barLength,
		barWidth: 6,
		value: options.meter2 as number,
		type: orientation,
	  })
  
	  return stackImage([bar1, bar2])
	}
  
	return bar1
  }