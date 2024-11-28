import { InstanceStatus } from '@companion-module/base';
import { Socket } from 'net';
import OSCSend from 'osc-js';
import osc from 'osc';
import { commands } from "./commands.js";
import { ClientInfo } from "./interfaces.js";
import { handleIncomingData } from "../events/recievedDataHandler.js";
import { controllerVariables } from "./constants.js";
import { LogLevel } from './enums.js';
import { ConsoleLog } from './logger.js';
import type { RCVInstance } from '../index.js'

let _Client: ClientInfo | null = null;
let intentionalDisconnect = false;
let reconnecting = false;
let reconnectionAttempts = 0;
let buffer: Buffer = Buffer.alloc(0);

const maxReconnectionAttempts = 5;
const RESPONSE_TIMEOUT = 2000;

let onDataHandler: (data: Buffer) => Promise<void>;
let onErrorHandler: (err: Error) => void;
let onCloseHandler: (hadError: boolean) => Promise<void>;


/**
 * Get the current OSC client instance.
 */
export function oscClient(): ClientInfo | null {
    return _Client;
}

/**
 * Checks if OSC Connected
 */
export function checkOscClient() {
    return _Client !== null;
}

/**
 * Create a new OSC client.
 * @param ipAddress - The IP address of the OSC server.
 * @param port - The port of the OSC server.
 */
export function createClient(instance: RCVInstance, ipAddress: string, port: number = 10024): void {
	instance.updateStatus(InstanceStatus.Connecting);
	
    if (_Client) {
        // Remove only specific listeners you have added
        _Client.socket.off('data', onDataHandler);
        _Client.socket.off('error', onErrorHandler);
        _Client.socket.off('close', onCloseHandler);

        _Client.socket.destroy();
    }

    intentionalDisconnect = false;
    reconnecting = false;
	controllerVariables.startup = false;

	buffer = Buffer.alloc(0);

    const socket = new Socket();

    onDataHandler = async (data) => {
		try {
			// Concatenate the new data to the existing buffer
			buffer = Buffer.concat([buffer, data]);
	
			// Process messages as long as we have enough data in the buffer
			while (buffer.length >= 4) { // Ensure there are at least 4 bytes to read the message size
				// Read the first 4 bytes to get the message size (little-endian int32)
				const messageLength = buffer.readInt32LE(0);
	
				// Validate message length and ensure we have enough data in the buffer
				if (messageLength <= 0) {
					// Remove the invalid prefix and continue processing (to avoid getting stuck in a loop)
					buffer = buffer.subarray(4);
					continue;
				}
	
				// Check if the buffer contains the full message
				if (buffer.length < messageLength + 4) {
					// Wait for more data if the message is incomplete
					break;
				}

				// Extract the complete message (after the 4-byte size prefix)
				const message = buffer.subarray(4, 4 + messageLength);

	
				// Remove the processed message from the buffer
				buffer = buffer.subarray(4 + messageLength);

	
				try {
					// Parse the OSC message using the complete message buffer
					const parsedPacket = osc.readPacket(message, { metadata: true });
	
					if ('address' in parsedPacket && parsedPacket.address.startsWith('/')) {

						
						//Handle blob data more accurately
						if (parsedPacket.args && parsedPacket.args.length === 1 && parsedPacket.args[0].type === 'b') {
							const result = parseOSCBlob(instance, message);

							await handleIncomingData(instance, parsedPacket.address, [result.blobReturn]);

						} else {
							// Extract argument values and handle the message
							const argsValues = parsedPacket.args.map(arg => arg.value);
							await handleIncomingData(instance, parsedPacket.address, argsValues);

						}
	
					} else if ('packets' in parsedPacket && parsedPacket.packets.length > 0) {
						// Handle OSC bundles
						for (const element of parsedPacket.packets) {
							if ('address' in element && element.address.startsWith('/')) {
								const elementValues = element.args.map(arg => arg.value);
								await handleIncomingData(instance, element.address, elementValues);
								ConsoleLog(instance, `Bundle element message: ${element.address}, args: ${JSON.stringify(elementValues)}`, LogLevel.INFO, false);
							}
						}

					} else {
						// Log or handle invalid packets
						ConsoleLog(instance, `Invalid OSC packet. Packet: ${message.toString('hex')}`, LogLevel.WARN, false);
					}
	
				} catch (parseError) {
					// Log parsing errors but do not remove data that has not been processed
					break;
				}
			}
	
		} catch (err) {
			ConsoleLog(instance, `Error handling incoming data: ${err.message}`, LogLevel.ERROR, false);
		}
	};
	

    onErrorHandler = (err) => {
		instance.updateStatus(InstanceStatus.ConnectionFailure);
        ConsoleLog(instance, `OSC Client Error: ${err.message}`, LogLevel.ERROR, false);
    };

    onCloseHandler = async (hadError) => {
        ConsoleLog(instance, `OSC Client Connection Closed (hadError: ${hadError})`, LogLevel.WARN, false);
        instance.globalSettings.oscConnected = false;
        //await saveGlobalSettings();

		instance.updateStatus(InstanceStatus.Disconnected);

        if (!intentionalDisconnect && !reconnecting) {
            reconnecting = true;
            if (reconnectionAttempts < maxReconnectionAttempts) {
                reconnectionAttempts++;
                ConsoleLog(instance, `Attempting to reconnect... (${reconnectionAttempts}/${maxReconnectionAttempts})`, LogLevel.INFO, false);
                setTimeout(() => {
                    if (!intentionalDisconnect) {
                        createClient(instance, ipAddress, port);
                    }
                }, 3000);
            } else {
                ConsoleLog(instance, `Max reconnection attempts reached.`, LogLevel.ERROR, false);
            }
        }
    };

    socket.on('data', onDataHandler);
    socket.on('error', onErrorHandler);
    socket.on('close', onCloseHandler);

    socket.connect(port, ipAddress, async () => {
        instance.globalSettings.oscConnected = true;
        reconnectionAttempts = 0;

        // Remove Offline tag if device was previously offline
        if (instance.globalSettings.selectedDevice && instance.globalSettings.selectedDevice.name.startsWith('[Offline]')) {
            instance.globalSettings.selectedDevice.name = instance.globalSettings.selectedDevice.name.replace('[Offline] ', '');
        }

		//await saveGlobalSettings();

		//updateConnectionState();

        sendOSCCommand(instance, commands.REMOTE[0]);

        ConsoleLog(instance, `Connected to OSC server at ${ipAddress}:${port}`, LogLevel.INFO, false);
		instance.updateStatus(InstanceStatus.Ok, `Connected to ${ipAddress}`);
    });

    _Client = { socket, ipAddress, port };
}

/**
 * Close the OSC client.
 */
export async function oscClientClose(instance: RCVInstance): Promise<void> {
    intentionalDisconnect = true;
    reconnecting = false;
	controllerVariables.startup = false;

    if (_Client) {
        _Client.socket.off('data', onDataHandler);
        _Client.socket.off('error', onErrorHandler);
        _Client.socket.off('close', onCloseHandler);
        _Client.socket.destroy();
        _Client = null;
        instance.globalSettings.oscConnected = false;
    }

    ConsoleLog(instance, `Closed OSC Client Connection`, LogLevel.WARN, false);
	instance.updateStatus(InstanceStatus.Disconnected);
}

/**
 * Send an OSC command.
 * @param command - The OSC command to send.
 * @param args - The arguments to send with the OSC command.
 * @returns A promise that resolves when the command is sent successfully.
 */
export function sendOSCCommand(instance: RCVInstance, command: string, ...args: any[]): Promise<void> {
    if (!_Client) {
        const errorMessage = 'OSC client is not connected';
        ConsoleLog(instance, errorMessage, LogLevel.ERROR, false);
        return Promise.reject(new Error(errorMessage));
    }

    return new Promise((resolve, reject) => {
        // Create the OSC message
        const message = new OSCSend.Message(command, ...args);
        const binary = message.pack();

        // Get the length of the message
        const messageLength = binary.byteLength;

        // Create a buffer for the byte count (4 bytes) + the message
        const byteCountBuffer = Buffer.alloc(4);
        byteCountBuffer.writeInt32LE(messageLength, 0); // Write byte count in little-endian format

        // Combine the byte count and the message into a single buffer
        const fullMessageBuffer = Buffer.concat([byteCountBuffer, Buffer.from(binary)]);

        // Send the combined buffer
        _Client!.socket.write(fullMessageBuffer, (err) => {
            if (err) {
                const errorMessage = `Error sending OSC command: ${err.message}`;
                ConsoleLog(instance, errorMessage, LogLevel.ERROR, false);
                reject(new Error(errorMessage));
            } else {
				ConsoleLog(instance, `Sent command: ${command} with args: ${args.join(', ')}`, LogLevel.DEBUG, false);

                resolve();
            }
        });

    });
}

// Function to manually parse blob data from an OSC message
function parseOSCBlob(instance, message): { blobSize: number, blobReturn: Uint8Array } {
    let offset = 0;

    // Find the end of the address pattern (null-terminated string)
    const addressEnd = message.indexOf(0, offset);
    offset = addressEnd + 1;
    // Align to 4-byte boundary
    offset = (offset + 3) & ~0x03;

    // Find the end of the type tag string (starts with ',')
    const typeTagEnd = message.indexOf(0, offset);
    const typeTag = message.toString('ascii', offset, typeTagEnd);
    offset = typeTagEnd + 1;
    // Align to 4-byte boundary
    offset = (offset + 3) & ~0x03;

    // Check if the first type tag is 'b' (blob)
    if (typeTag[1] === 'b') {

        const blobSize = message.readUInt32BE(offset);
        offset += 4;

        const blobData = message.slice(offset, offset + blobSize);
		const blobReturn = new Uint8Array(blobData);

        return { blobSize, blobReturn };

    } else {
		ConsoleLog(instance, `First argument is not a blob.`, LogLevel.ERROR, false);
        return null;
    }
}