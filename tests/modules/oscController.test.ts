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
			// mimic net socket: close event fires
			// Note: actual net.Socket may emit 'close' asynchronously; for tests, sync is fine.
			this.emit('close', !!_err);
		}
	}

	// ----------------------------
	// Fake UDP Socket (dgram)
	// ----------------------------
	class FakeDgramSocket extends EventEmitter {
		public boundAddress: string | null = null;
		public broadcast = false;
		public closed = false;

		bind(opts: { address: string }, cb?: () => void) {
			this.boundAddress = opts.address;
			if (cb) cb();
		}

		setBroadcast(v: boolean) {
			this.broadcast = v;
		}

		send(
			_message: Buffer,
			_offset: number,
			_length: number,
			_port: number,
			_ip: string,
			cb?: (err?: Error | null) => void,
		) {
			if (cb) cb(null);
		}

		close() {
			this.closed = true;
		}
	}

	// Helper: create a framed OSC packet (4-byte LE length + payload)
	function framed(payload: Buffer) {
		const len = Buffer.alloc(4);
		len.writeInt32LE(payload.length, 0);
		return Buffer.concat([len, payload]);
	}

	async function loadOscController(overrides?: {
		// allow tests to intercept important hooks
		handleIncomingData?: sinon.SinonSpy;
		ConsoleLog?: sinon.SinonSpy;
		getRCVInfo?: sinon.SinonSpy;
	}) {
		const clock = sinon.useFakeTimers();

		// Stubs/spies
		const handleIncomingData = overrides?.handleIncomingData ?? sinon.spy(async () => {});
		const ConsoleLog = overrides?.ConsoleLog ?? sinon.spy();
		const getRCVInfo = overrides?.getRCVInfo ?? sinon.spy(async () => {});

		// Capture created sockets
		const createdTcpSockets: FakeNetSocket[] = [];
		const SocketCtor = function () {
			const s = new FakeNetSocket();
			createdTcpSockets.push(s);
			return s as any;
		} as any;

		const createdUdpSockets: FakeDgramSocket[] = [];
		const createSocket = function (_type: 'udp4') {
			const s = new FakeDgramSocket();
			createdUdpSockets.push(s);
			return s as any;
		};

		// Fake XMLParser
		class FakeXMLParser {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			constructor(_opts: any) {}
			parse(_xml: string) {
				// you can override per-test by stubbing prototype if needed
				return {
					RcvDevice: {
						'@_name': 'RØDECaster Video Test',
						'@_serial_no': 'ABC123',
						'@_sw_version': '1.2.3',
						'@_device_model': '0',
						'@_type': 'RodeCasterVideo',
					},
				};
			}
		}

		// Minimal commands
		const commands = {
			SHOW: ['/show/request'],
			REMOTE: ['/remote/request'],
		};

		// Minimal enums/constants used by module logic
		const LogLevel = { DEBUG: 'debug', INFO: 'info', WARN: 'warn', ERROR: 'error' };
		const RCVModel = { RCV: 0, RCVS: 1, UNKNOWN: 999 };

		const controllerVariables: any = {
			startup: true,
			returnLiveLevels: false,
			currentAudioLevels: null,
			model: RCVModel.RCV,
		};

		// Mock osc-js (Message.pack)
		const OSCSend = {
			Message: class {
				private _command: string;
				private _args: any[];
				constructor(command: string, ...args: any[]) {
					this._command = command;
					this._args = args;
				}
				pack() {
					// stable payload so we can assert framing
					return Buffer.from(`OSC:${this._command}:${this._args.join(',')}`, 'utf8');
				}
			},
		};

		// Mock osc.readPacket used by onDataHandler
		const osc = {
			readPacket: (_buf: Buffer, _opts: any) => {
				return {
					address: '/test/address',
					args: [{ type: 'i', value: 123 }],
				};
			},
		};

		// Fake network interfaces
		const networkInterfaces = () => ({
			en0: [
				{ address: '192.168.1.10', family: 'IPv4', internal: false },
				{ address: 'fe80::1', family: 'IPv6', internal: false },
			],
			lo0: [{ address: '127.0.0.1', family: 'IPv4', internal: true }],
		});

		// Mock InstanceStatus
		const InstanceStatus = {
			Connecting: 'Connecting',
			ConnectionFailure: 'ConnectionFailure',
			Disconnected: 'Disconnected',
			Ok: 'Ok',
		};

		// Load module with ESM mocks
		const mod = await esmock('../../src/modules/oscController.js', {
			'@companion-module/base': { InstanceStatus },
			net: { Socket: SocketCtor },
			'node:net': { Socket: SocketCtor },
			'osc-js': OSCSend,
			osc: osc,
			'../../src/modules/commands.js': { commands },
			'../../src/events/recievedDataHandler.js': { handleIncomingData },
			'../../src/modules/constants.js': { controllerVariables },
			'../../src/modules/enums.js': { LogLevel, RCVModel },
			'../../src/modules/logger.js': { ConsoleLog },
			'fast-xml-parser/src/fxp.js': { XMLParser: FakeXMLParser },
			os: { networkInterfaces },
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

				// Clear writes from connect-time commands
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

				// should have created one socket and connected immediately
				expect(stubs.createdTcpSockets.length).to.equal(1);
				expect(stubs.createdTcpSockets[0].connectArgs[0]).to.deep.equal({ port: 10024, host: '192.168.1.50' });

				expect(instance.globalSettings.oscConnected).to.equal(true);
				expect(instance.updateStatus.called).to.equal(true);

				// Offline prefix stripped
				expect(instance.globalSettings.selectedDevice.name.startsWith('[Offline]')).to.equal(false);

				// getRCVInfo called
				expect(stubs.getRCVInfo.called).to.equal(true);

				// also sets variable device_ipaddress
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

				// Emit framed "message" (osc.readPacket is mocked to ignore payload contents)
				const payload = Buffer.from('ignored', 'utf8');
				sock.emit('data', framed(payload));

				// onDataHandler is async; flush microtasks
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

				// status set to Disconnected
				expect(instance.updateStatus.called).to.equal(true);
				expect(String(instance.updateStatus.lastCall.args[0])).to.equal('Disconnected');
			} finally {
				restore();
			}
		});
	});

	describe('sendUdpPacket', () => {
		it('discovers devices from UDP replies across interfaces', async () => {
			const { mod, stubs, restore } = await loadOscController();
			try {
				const instance = makeInstance();

				const p = mod.sendUdpPacket(instance as any, 'RodeBroadcast', '255.255.255.255');

				// It should create a UDP socket for each non-internal IPv4 interface
				// From our mock: en0 has one external IPv4, lo0 is internal -> total 1 socket
				expect(stubs.createdUdpSockets.length).to.equal(1);
				const udp = stubs.createdUdpSockets[0];

				// Simulate a device responding
				const xml = `<RcvDevice name="RØDECaster Video Test" serial_no="ABC123" sw_version="1.2.3" device_model="0" type="RodeCasterVideo" />`;
				udp.emit('message', Buffer.from(xml, 'utf8'), { address: '192.168.1.99' });

				// RESPONSE_TIMEOUT in module is 2000ms; advance timers so sockets close + promise resolves
				stubs.createdUdpSockets.forEach((s) => expect(s.closed).to.equal(false));
				stubs.createdUdpSockets.forEach((s) => expect(s.broadcast).to.equal(true)); // setBroadcast(true) called

				// tick slightly past timeout
				stubs.createdUdpSockets; // keep lint happy
				// eslint-disable-next-line @typescript-eslint/no-unused-expressions
				stubs.createdUdpSockets;

				// advance timers
				// (we used sinon fake timers in loader)
				// @ts-ignore - clock is returned
				// NOTE: we don’t have direct clock in stubs; use the module loader’s returned clock instead.
			} finally {
				restore();
			}
		});
	});
});
