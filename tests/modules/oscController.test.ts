import { expect } from 'chai';
import sinon from 'sinon';
import esmock from 'esmock';
import { Buffer } from 'buffer';
import { EventEmitter } from 'events';

describe('oscController', () => {
	type FakeInstance = {
		updateStatus: sinon.SinonSpy;
		setVariableValues: sinon.SinonSpy;
		globalSettings: any;
	};

	// ----------------------------
	// Fake TCP Socket (net.Socket)
	// ----------------------------
	class FakeNetSocket extends EventEmitter {
		public destroyed = false;
		public connected = false;
		public connectArgs: any[] = [];
		public writes: Buffer[] = [];

		on(event: string, listener: any): this {
			return super.on(event, listener);
		}

		off(event: string, listener: any): this {
			return super.off(event, listener);
		}

		connect(port: number, host: string, cb?: () => void) {
			this.connected = true;
			this.connectArgs.push({ port, host });
			if (cb) cb();
			return this;
		}

		write(buf: Buffer, cb?: (err?: Error | null) => void) {
			this.writes.push(buf);
			if (cb) cb(null);
			return true;
		}

		destroy(_err?: any) {
			this.destroyed = true;
			this.emit('close', !!_err);
		}
	}

	// ----------------------------
	// Fake UDP Socket (dgram)
	// ----------------------------
	class FakeDgramSocket extends EventEmitter {
		public boundPort: number | null = null;
		public boundAddress: string | null = null;
		public closed = false;
		public sentPackets: Array<{
			message: Buffer;
			port: number;
			ip: string;
		}> = [];

		bind(port: number, address: string, cb?: () => void) {
			this.boundPort = port;
			this.boundAddress = address;
			if (cb) cb();
			return this;
		}

		address() {
			return {
				address: this.boundAddress ?? '0.0.0.0',
				port: this.boundPort ?? 0,
				family: 'IPv4',
			};
		}

		send(
			message: Buffer,
			port: number,
			ip: string,
			cb?: (err?: Error | null) => void,
		) {
			this.sentPackets.push({ message, port, ip });
			if (cb) cb(null);
			return this;
		}

		close() {
			this.closed = true;
			this.emit('close');
		}
	}

	function framed(payload: Buffer) {
		const len = Buffer.alloc(4);
		len.writeInt32LE(payload.length, 0);
		return Buffer.concat([len, payload]);
	}

	async function loadOscController(overrides?: {
		handleIncomingData?: sinon.SinonSpy;
		ConsoleLog?: sinon.SinonSpy;
		getRCVInfo?: sinon.SinonSpy;
		createSocketOverride?: (_type: 'udp4') => any;
		xmlParserResult?: any;
	}) {
		const clock = sinon.useFakeTimers();

		const handleIncomingData = overrides?.handleIncomingData ?? sinon.spy(async () => {});
		const ConsoleLog = overrides?.ConsoleLog ?? sinon.spy();
		const getRCVInfo = overrides?.getRCVInfo ?? sinon.spy(async () => {});

		const createdTcpSockets: FakeNetSocket[] = [];
		const SocketCtor = function () {
			const s = new FakeNetSocket();
			createdTcpSockets.push(s);
			return s as any;
		} as any;

		const createdUdpSockets: FakeDgramSocket[] = [];
		const defaultCreateSocket = function (_type: 'udp4') {
			const s = new FakeDgramSocket();
			createdUdpSockets.push(s);
			return s as any;
		};

		const createSocket = overrides?.createSocketOverride ?? defaultCreateSocket;

		class FakeXMLParser {
			constructor(_opts: any) {}

			parse(_xml: string) {
				return (
					overrides?.xmlParserResult ?? {
						RcvDevice: {
							'@_name': 'RØDECaster Video Test',
							'@_serial_no': 'ABC123',
							'@_sw_version': '1.2.3',
							'@_device_model': '0',
							'@_type': 'RodeCasterVideo',
						},
					}
				);
			}
		}

		const commands = {
			SHOW: ['/show/request'],
			REMOTE: ['/remote/request'],
		};

		const LogLevel = { DEBUG: 'debug', INFO: 'info', WARN: 'warn', ERROR: 'error' };
		const RCVModel = { RCV: 0, RCVS: 1, UNKNOWN: 999 };

		const controllerVariables: any = {
			startup: true,
			returnLiveLevels: false,
			currentAudioLevels: null,
			model: RCVModel.RCV,
		};

		const OSCSend = {
			Message: class {
				private _command: string;
				private _args: any[];

				constructor(command: string, ...args: any[]) {
					this._command = command;
					this._args = args;
				}

				pack() {
					return Buffer.from(`OSC:${this._command}:${this._args.join(',')}`, 'utf8');
				}
			},
		};

		const osc = {
			readPacket: (_buf: Buffer, _opts: any) => {
				return {
					address: '/test/address',
					args: [{ type: 'i', value: 123 }],
				};
			},
		};

		const InstanceStatus = {
			Connecting: 'Connecting',
			ConnectionFailure: 'ConnectionFailure',
			Disconnected: 'Disconnected',
			Ok: 'Ok',
		};

		const mod = await esmock('../../src/modules/oscController.js', {
			'@companion-module/base': { InstanceStatus },
			net: { Socket: SocketCtor },
			'node:net': { Socket: SocketCtor },
			'osc-js': OSCSend,
			osc,
			'../../src/modules/commands.js': { commands },
			'../../src/events/recievedDataHandler.js': { handleIncomingData },
			'../../src/modules/constants.js': { controllerVariables },
			'../../src/modules/enums.js': { LogLevel, RCVModel },
			'../../src/modules/logger.js': { ConsoleLog },
			'fast-xml-parser/src/fxp.js': { XMLParser: FakeXMLParser },
			dgram: { createSocket },
			'../../src/helpers/connectionHelpers.js': { getRCVInfo },
		});

		return {
			mod,
			clock,
			stubs: {
				handleIncomingData,
				ConsoleLog,
				getRCVInfo,
				controllerVariables,
				createdTcpSockets,
				createdUdpSockets,
				commands,
				LogLevel,
				RCVModel,
				InstanceStatus,
			},
			restore: () => clock.restore(),
		};
	}

	function makeInstance(): FakeInstance {
		return {
			updateStatus: sinon.spy(),
			setVariableValues: sinon.spy(),
			globalSettings: {
				oscConnected: false,
				selectedDevice: { name: '[Offline] RØDECaster Video (192.168.1.50)' },
			},
		};
	}

	afterEach(() => {
		sinon.restore();
	});

	describe('oscClient / checkOscClient', () => {
		it('starts disconnected', async () => {
			const { mod, restore } = await loadOscController();
			try {
				expect(mod.oscClient()).to.equal(null);
				expect(mod.checkOscClient()).to.equal(false);
			} finally {
				restore();
			}
		});
	});

	describe('sendOSCCommand', () => {
		it('rejects when not connected and logs', async () => {
			const { mod, stubs, restore } = await loadOscController();
			try {
				const instance = makeInstance();

				let err: any = null;
				try {
					await mod.sendOSCCommand(instance as any, '/x', 1);
				} catch (e) {
					err = e;
				}

				expect(err).to.be.instanceOf(Error);
				expect(String(err.message)).to.include('OSC client is not connected');
				expect(stubs.ConsoleLog.called).to.equal(true);
			} finally {
				restore();
			}
		});

		it('frames payload with 4-byte LE length and writes to socket', async () => {
			const { mod, stubs, restore } = await loadOscController();
			try {
				const instance = makeInstance();

				mod.createClient(instance as any, '192.168.1.50', 10024);

				const client = mod.oscClient();
				expect(client).to.not.equal(null);

				await Promise.resolve();
				await Promise.resolve();

				stubs.createdTcpSockets[0].writes = [];

				await mod.sendOSCCommand(instance as any, '/hello', 7, 'x');

				const sock = stubs.createdTcpSockets[0];
				expect(sock.writes.length).to.equal(1);

				const written = sock.writes[0];
				expect(written.length).to.be.greaterThan(4);

				const payloadLen = written.readInt32LE(0);
				const payload = written.subarray(4);

				expect(payloadLen).to.equal(payload.length);
				expect(payload.toString('utf8')).to.include('OSC:/hello:7,x');
			} finally {
				restore();
			}
		});
	});

	describe('createClient', () => {
		it('connects, marks oscConnected, strips Offline tag, calls getRCVInfo', async () => {
			const { mod, stubs, restore } = await loadOscController();
			try {
				const instance = makeInstance();

				mod.createClient(instance as any, '192.168.1.50', 10024);

				expect(stubs.createdTcpSockets.length).to.equal(1);
				expect(stubs.createdTcpSockets[0].connectArgs[0]).to.deep.equal({
					port: 10024,
					host: '192.168.1.50',
				});

				expect(instance.globalSettings.oscConnected).to.equal(true);
				expect(instance.updateStatus.called).to.equal(true);
				expect(instance.globalSettings.selectedDevice.name.startsWith('[Offline]')).to.equal(false);

				await Promise.resolve();
				await Promise.resolve();

				expect(stubs.getRCVInfo.called).to.equal(true);

				expect(instance.setVariableValues.called).to.equal(true);
				const vars = instance.setVariableValues.lastCall.args[0];
				expect(vars.device_ipaddress).to.equal('192.168.1.50');
			} finally {
				restore();
			}
		});

		it('dispatches handleIncomingData when a framed packet arrives', async () => {
			const handleIncomingData = sinon.spy(async () => {});
			const { mod, stubs, restore } = await loadOscController({ handleIncomingData });
			try {
				const instance = makeInstance();
				mod.createClient(instance as any, '192.168.1.50', 10024);

				const sock = stubs.createdTcpSockets[0];
				const payload = Buffer.from('ignored', 'utf8');

				sock.emit('data', framed(payload));

				await Promise.resolve();

				expect(handleIncomingData.called).to.equal(true);
				const [instArg, addrArg, argsArg] = handleIncomingData.firstCall.args as unknown as any[];
				expect(instArg).to.equal(instance);
				expect(addrArg).to.equal('/test/address');
				expect(argsArg).to.deep.equal([123]);
			} finally {
				restore();
			}
		});
	});

	describe('oscClientClose', () => {
		it('removes listeners, destroys socket, clears client, sets status disconnected', async () => {
			const { mod, stubs, restore } = await loadOscController();
			try {
				const instance = makeInstance();
				mod.createClient(instance as any, '192.168.1.50', 10024);

				expect(mod.checkOscClient()).to.equal(true);

				await mod.oscClientClose(instance as any);

				expect(mod.oscClient()).to.equal(null);
				expect(instance.globalSettings.oscConnected).to.equal(false);

				const sock = stubs.createdTcpSockets[0];
				expect(sock.destroyed).to.equal(true);

				expect(instance.updateStatus.called).to.equal(true);
				expect(String(instance.updateStatus.lastCall.args[0])).to.equal('Disconnected');
			} finally {
				restore();
			}
		});
	});

	describe('sendUdpPacket', () => {
		it('sends a unicast UDP packet to the known device IP and returns parsed device info', async () => {
			const { mod, stubs, clock, restore } = await loadOscController();
			try {
				const instance = makeInstance();

				const promise = mod.sendUdpPacket(instance as any, 'RodeBroadcast', '192.168.1.99');

				expect(stubs.createdUdpSockets.length).to.equal(1);

				const udp = stubs.createdUdpSockets[0];
				expect(udp.boundPort).to.equal(0);
				expect(udp.boundAddress).to.equal('0.0.0.0');

				expect(udp.sentPackets.length).to.equal(1);
				expect(udp.sentPackets[0].message.toString('utf8')).to.equal('RodeBroadcast');
				expect(udp.sentPackets[0].port).to.equal(9999);
				expect(udp.sentPackets[0].ip).to.equal('192.168.1.99');

				const xml = `<RcvDevice name="RØDECaster Video Test" serial_no="ABC123" sw_version="1.2.3" device_model="0" type="RodeCasterVideo" />`;
				udp.emit('message', Buffer.from(xml, 'utf8'), { address: '192.168.1.99' });

				await clock.tickAsync(2001);

				const result = await promise;

				expect(result).to.have.length(1);
				expect(result[0].name).to.equal('RØDECaster Video Test');
				expect(result[0].serialNo).to.equal('ABC123');
				expect(result[0].swVersion).to.equal('1.2.3');
				expect(result[0].ipAddress).to.equal('192.168.1.99');
				expect(result[0].type).to.equal('RodeCasterVideo');
				expect(udp.closed).to.equal(true);
			} finally {
				restore();
			}
		});

		it('resolves with an empty array when UDP send fails instead of crashing', async () => {
			const failingUdp = new FakeDgramSocket();

			sinon.stub(failingUdp, 'send').callsFake((
				message: Buffer,
				port: number,
				ip: string,
				cb?: (err?: Error | null) => void,
			) => {
				failingUdp.sentPackets.push({ message, port, ip });
				if (cb) cb(new Error('send EHOSTUNREACH 192.168.1.99:9999'));
				return failingUdp;
			});

			const { mod, stubs, restore } = await loadOscController({
				createSocketOverride: () => failingUdp as any,
				xmlParserResult: {},
			});

			try {
				const instance = makeInstance();

				const result = await mod.sendUdpPacket(instance as any, 'RodeBroadcast', '192.168.1.99');

				expect(result).to.deep.equal([]);
				expect(stubs.ConsoleLog.called).to.equal(true);
				expect(failingUdp.closed).to.equal(true);
			} finally {
				restore();
			}
		});

		it('resolves with an empty array when the UDP socket emits an error', async () => {
			const { mod, stubs, restore } = await loadOscController();
			try {
				const instance = makeInstance();

				const promise = mod.sendUdpPacket(instance as any, 'RodeBroadcast', '192.168.1.99');

				expect(stubs.createdUdpSockets.length).to.equal(1);
				const udp = stubs.createdUdpSockets[0];

				udp.emit('error', Object.assign(new Error('EHOSTUNREACH'), { code: 'EHOSTUNREACH' }));

				const result = await promise;

				expect(result).to.deep.equal([]);
				expect(udp.closed).to.equal(true);
				expect(stubs.ConsoleLog.called).to.equal(true);
			} finally {
				restore();
			}
		});
	});
});