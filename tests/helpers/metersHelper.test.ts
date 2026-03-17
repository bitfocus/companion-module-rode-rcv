// tests/helpers/metersHelper.test.ts
import { expect } from 'chai';
import sinon from 'sinon';
import esmock from 'esmock';
import { Buffer } from 'buffer';

// Import real enums (no re-defining)
import { MetersChannel, MetersSubmix } from '../../src/modules/enums.js';

describe('metersHelper', () => {
	type FakeInstance = Record<string, any>;

	function writeStereo(buf: Buffer, offset: number, lLevel: number, lPeak: number, rLevel: number, rPeak: number) {
		buf.writeFloatLE(lLevel, offset + 0);
		buf.writeFloatLE(lPeak, offset + 4);
		buf.writeFloatLE(rLevel, offset + 8);
		buf.writeFloatLE(rPeak, offset + 12);
	}

	function expectStereoCloseTo(
		actual: any,
		expected: { left: { level: number; peak: number }; right: { level: number; peak: number } },
		eps = 1e-6,
	) {
		expect(actual).to.exist;
		expect(actual.left.level).to.be.closeTo(expected.left.level, eps);
		expect(actual.left.peak).to.be.closeTo(expected.left.peak, eps);
		expect(actual.right.level).to.be.closeTo(expected.right.level, eps);
		expect(actual.right.peak).to.be.closeTo(expected.right.peak, eps);
	}

	async function loadMetersHelper(overrides?: {
		sendOSCCommand?: sinon.SinonStub;
		ConsoleLog?: sinon.SinonSpy;
		controllerVariables?: any;
		mixerChannels?: any;
		commands?: any;
	}) {
		const sendOSCCommand = overrides?.sendOSCCommand ?? sinon.stub().resolves();
		const ConsoleLog = overrides?.ConsoleLog ?? sinon.spy();

		const controllerVariables =
			overrides?.controllerVariables ??
			({
				returnLiveLevels: false,
				currentAudioLevels: null,
			} as any);

		const mixerChannels =
			overrides?.mixerChannels ??
			({
				value1: { whatever: true },
				value2: { whatever: true },
			} as any);

		const commands =
			overrides?.commands ??
			({
				METERS: ['/meters/masks'],
			} as const);

		const mod = await esmock('../../src/helpers/metersHelper.js', {
			'../../src/modules/oscController.js': { sendOSCCommand },
			'../../src/modules/commands.js': { commands },
			'../../src/modules/logger.js': { ConsoleLog },
			'../../src/modules/constants.js': { controllerVariables, mixerChannels },

			// DO NOT mock ../modules/enums.js -> use real enums

			// Imported types/graphics: stub so module loads
			'companion-module-utils/dist/presets.js': {},
			'companion-module-utils/dist/graphics.js': {
				bar: sinon.stub().returns(new Uint8Array([1, 2, 3])),
				stackImage: sinon.stub().returns(new Uint8Array([9, 9, 9])),
			},
		});

		return {
			requestMeterValues: mod.requestMeterValues as (opts: any) => Promise<void>,
			parseMeterValues: mod.parseMeterValues as (instance: any, blob: Buffer) => any,
			meterLevelToPercentage: mod.meterLevelToPercentage as (v: number) => number,
			getAllChannels: mod.getAllChannels as () => any[],
			getActiveMixes: mod.getActiveMixes as (instance: any) => Promise<void>,
			stubs: { sendOSCCommand, ConsoleLog, controllerVariables, mixerChannels, commands },
		};
	}

	describe('requestMeterValues', () => {
		it('builds correct mask blob and calls sendOSCCommand', async () => {
			const sendOSCCommand = sinon.stub().resolves();
			const { requestMeterValues, stubs } = await loadMetersHelper({
				sendOSCCommand,
				commands: { METERS: ['/meters/masks'] },
			});

			const instance: FakeInstance = {};
			await requestMeterValues({
				instance,
				mix: MetersSubmix.Live,
				// include junk values to ensure ignored
				outputChannels: [0, 1, 63, MetersChannel.None, 999],
				inputChannels: [2, 5],
			});

			expect(stubs.sendOSCCommand.calledOnce).to.equal(true);

			const [instArg, cmdArg, blobArg] = stubs.sendOSCCommand.firstCall.args;
			expect(instArg).to.equal(instance);
			expect(cmdArg).to.equal('/meters/masks');
			expect(Buffer.isBuffer(blobArg)).to.equal(true);

			const blob = blobArg as Buffer;
			expect(blob.length).to.equal(1 + 8 + 8);

			// mix byte
			expect(blob.readUInt8(0)).to.equal(MetersSubmix.Live);

			// output mask: bits 0,1,63 set
			const outMask = blob.readBigUInt64LE(1);
			const expectedOut = (BigInt(1) << BigInt(0)) | (BigInt(1) << BigInt(1)) | (BigInt(1) << BigInt(63));
			expect(outMask).to.equal(expectedOut);

			// input mask: bits 2,5 set
			const inMask = blob.readBigUInt64LE(1 + 8);
			const expectedIn = (BigInt(1) << BigInt(2)) | (BigInt(1) << BigInt(5));
			expect(inMask).to.equal(expectedIn);
		});
	});

	describe('parseMeterValues', () => {
		it('returns null_result when blob is empty', async () => {
			const controllerVariables = {
				currentAudioLevels: {
					master: { left: { level: 0.1, peak: 0.2 }, right: { level: 0.3, peak: 0.4 } },
					outputMix: 1,
					outputs: {},
					inputs: {},
				},
			};

			const { parseMeterValues } = await loadMetersHelper({ controllerVariables });

			const instance: FakeInstance = {};
			const result = parseMeterValues(instance, Buffer.alloc(0));

			expect(result).to.deep.equal(controllerVariables.currentAudioLevels);
		});

		it('parses a valid blob with one output and one input channel', async () => {
			const { parseMeterValues } = await loadMetersHelper();

			const instance: FakeInstance = {};

			const outputsMask = BigInt(1) << BigInt(1); // output channel index 1
			const inputsMask = BigInt(1) << BigInt(2); // input channel index 2

			const blob = Buffer.alloc(16 + 1 + 8 + 16 + 8 + 16);
			let o = 0;

			// master (include out-of-range to test clamping)
			writeStereo(blob, o, -0.5, 2.0, 0.5, NaN);
			o += 16;

			// outputMix (must be < MetersSubmix.NumTypes)
			blob.writeUInt8(MetersSubmix.Live, o);
			o += 1;

			// outputsMask
			blob.writeBigUInt64LE(outputsMask, o);
			o += 8;

			// output channel 1 stereo data
			writeStereo(blob, o, 0.25, 0.3, 0.4, 0.45);
			o += 16;

			// inputsMask
			blob.writeBigUInt64LE(inputsMask, o);
			o += 8;

			// input channel 2 stereo data
			writeStereo(blob, o, 0.6, 0.7, 0.8, 0.9);

			const result = parseMeterValues(instance, blob);

			expect(result).to.not.equal(null);
			expect(result.outputMix).to.equal(MetersSubmix.Live);

			// clamped master:
			expect(result.master.left.level).to.equal(0.0);
			expect(result.master.left.peak).to.equal(1.0);
			expect(result.master.right.level).to.equal(0.5);
			expect(result.master.right.peak).to.equal(0.0); // NaN -> 0.0

			expectStereoCloseTo(result.outputs[1], {
				left: { level: 0.25, peak: 0.3 },
				right: { level: 0.4, peak: 0.45 },
			});

			expectStereoCloseTo(result.inputs[2], {
				left: { level: 0.6, peak: 0.7 },
				right: { level: 0.8, peak: 0.9 },
			});
		});

		it('returns null_result when outputMix is invalid', async () => {
			const ConsoleLog = sinon.spy();

			const controllerVariables = {
				currentAudioLevels: {
					master: { left: { level: 0.1, peak: 0.2 }, right: { level: 0.3, peak: 0.4 } },
					outputMix: 1,
					outputs: {},
					inputs: {},
				},
			};

			const { parseMeterValues, stubs } = await loadMetersHelper({
				ConsoleLog,
				controllerVariables,
			});

			// master(16) + outputMix(1) minimal
			const blob = Buffer.alloc(16 + 1);
			writeStereo(blob, 0, 0.1, 0.2, 0.3, 0.4);

			// invalid outputMix: >= NumTypes
			const invalid = (MetersSubmix as any).NumTypes ?? 255;
			blob.writeUInt8(invalid, 16);

			const instance: FakeInstance = {};
			const result = parseMeterValues(instance, blob);

			expect(result).to.deep.equal(controllerVariables.currentAudioLevels);

			expect(stubs.ConsoleLog.called).to.equal(true);
			const msg = stubs.ConsoleLog.firstCall.args[1] as string;
			expect(msg).to.include('Invalid output mix value');
		});
	});

	describe('meterLevelToPercentage', () => {
		it('throws for out-of-range', async () => {
			const { meterLevelToPercentage } = await loadMetersHelper();
			expect(() => meterLevelToPercentage(-0.1)).to.throw('Value must be between 0 and 1.');
			expect(() => meterLevelToPercentage(1.1)).to.throw('Value must be between 0 and 1.');
		});

		it('maps endpoints', async () => {
			const { meterLevelToPercentage } = await loadMetersHelper();
			expect(meterLevelToPercentage(0.0)).to.equal(0.0);
			expect(meterLevelToPercentage(1.0)).to.equal(1.0);
		});

		it('is monotonic increasing for typical samples', async () => {
			const { meterLevelToPercentage } = await loadMetersHelper();
			const samples = [0.0, 0.001, 0.01, 0.1, 0.5, 0.9, 1.0];
			let last = -Infinity;

			for (const v of samples) {
				const p = meterLevelToPercentage(v);
				expect(p).to.be.at.least(last);
				last = p;
			}
		});
	});

	describe('getAllChannels', () => {
		it('matches the real enum filter logic', async () => {
			const { getAllChannels } = await loadMetersHelper();

			const expected = Object.values(MetersChannel).filter(
				(v): v is number => typeof v === 'number' && v >= 0 && v < MetersChannel.NumSources,
			);

			expect(getAllChannels()).to.deep.equal(expected);
		});
	});

	describe('getActiveMixes', () => {
		it('returns early when returnLiveLevels is false', async () => {
			const sendOSCCommand = sinon.stub().resolves();
			const controllerVariables = { returnLiveLevels: false };
			const { getActiveMixes, stubs } = await loadMetersHelper({ sendOSCCommand, controllerVariables });

			await getActiveMixes({} as any);

			expect(stubs.sendOSCCommand.called).to.equal(false);
		});

		it('requests meter values for mixerChannels keys valueN -> N', async () => {
			const sendOSCCommand = sinon.stub().resolves();
			const controllerVariables = { returnLiveLevels: true };
			const mixerChannels = {
				value1: {},
				value2: {},
				value20: {},
			};

			const { getActiveMixes, stubs } = await loadMetersHelper({
				sendOSCCommand,
				controllerVariables,
				mixerChannels,
				commands: { METERS: ['/meters/masks'] },
			});

			await getActiveMixes({} as any);

			expect(stubs.sendOSCCommand.calledOnce).to.equal(true);

			const blob = stubs.sendOSCCommand.firstCall.args[2] as Buffer;

			// outputChannels should be [1,2,20] => bits 1,2,20 set
			const outMask = blob.readBigUInt64LE(1);
			const expectedOut =
				(BigInt(1) << BigInt(1)) | (BigInt(1) << BigInt(2)) | (BigInt(1) << BigInt(20));
			expect(outMask).to.equal(expectedOut);

			// input mask should be None only => 0
			const inMask = blob.readBigUInt64LE(1 + 8);
			expect(inMask).to.equal(BigInt(0));

			// mix byte should be Live
			expect(blob.readUInt8(0)).to.equal(MetersSubmix.Live);
		});

		it('logs warning for invalid mixer channel keys', async () => {
			const ConsoleLog = sinon.spy();
			const controllerVariables = { returnLiveLevels: true };
			const mixerChannels = {
				valueX: {}, // invalid, parseInt -> NaN
				value2: {},
			};

			const { getActiveMixes, stubs } = await loadMetersHelper({
				ConsoleLog,
				controllerVariables,
				mixerChannels,
			});

			await getActiveMixes({} as any);

			expect(stubs.ConsoleLog.called).to.equal(true);
			const msg = stubs.ConsoleLog.firstCall.args[1] as string;
			expect(msg).to.include('Invalid mixer channel name');
		});
	});
});
