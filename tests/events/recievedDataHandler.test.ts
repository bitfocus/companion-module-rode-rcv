import { expect } from 'chai';
import sinon from 'sinon';
import esmock from 'esmock';
import { Buffer } from 'buffer';

describe('recievedDataHandler.handleIncomingData', () => {
	type FakeInstance = {
		variables: Array<{ variableId: string; name: string }>;
		setVariableValues: sinon.SinonSpy;
		setVariableDefinitions: sinon.SinonSpy;
		checkFeedbacks: sinon.SinonSpy;
	};

	function makeInstance(): FakeInstance {
		return {
			variables: [],
			setVariableValues: sinon.spy(),
			setVariableDefinitions: sinon.spy(),
			checkFeedbacks: sinon.spy(),
		};
	}

	async function loadHandler(overrides?: {
		// parser
		xmlParserParse?: (xml: string) => any;

		// constants
		controllerVariables?: any;
		submixList?: any;
		buttonList?: any;
		mixerChannels?: any;
		videoSources?: any;
		mediaSources?: any;
		overlaySources?: any;
		sceneSources?: any;

		// helpers + deps
		ConsoleLog?: sinon.SinonSpy;
		sendOSCCommand?: sinon.SinonStub;
		getActiveMixes?: sinon.SinonStub;
		parseMeterValues?: sinon.SinonStub;
		meterLevelToPercentage?: sinon.SinonStub;
		floatToDb?: sinon.SinonStub;

		msToFrames?: sinon.SinonStub;
		getKeyByValue?: (obj: any, value: any) => string;
		getMediaType?: (path: string) => any;

		commands?: any;
		enums?: any;
		FeedbackId?: any;
	}) {
		const ConsoleLog = overrides?.ConsoleLog ?? sinon.spy();
		const sendOSCCommand = overrides?.sendOSCCommand ?? sinon.stub().resolves();

		const controllerVariables =
			overrides?.controllerVariables ??
			({
				startup: false,
				studioMode: false,
				showName: '',
				logoEnabled: false,
				frameRate: 0,
				currentTransTime: 0,
				currentTransition: '',
				currentTransitionCat: '',
				transitionInvert: false,
				audioMasterDelay: 0,
				audioMasterDelayActive: false,
				submixesReady: false,

				returnLiveLevels: false,
				currentAudioLevels: null,

				PgmOverlay: -1,
				PvwOverlay: -1,
				PgmScene: -1,
				PvwScene: -1,
				PgmInput: -1,
				PvwInput: -1,
				PgmMedia: -1,
				PvwMedia: -1,
			} as any);

		// very small lists/objects for tests
		const submixList =
			overrides?.submixList ??
			({
				LIVE: { id: 1 },
			} as any);

		// buttonList only needs keys used by updateSourceStates/meter logic in these tests (we keep minimal)
		const buttonList =
			overrides?.buttonList ??
			({
				// placeholder
			} as any);

		const mixerChannels =
			overrides?.mixerChannels ??
			({
				// created during /show parse
			} as any);

		const videoSources = overrides?.videoSources ?? ({} as any);
		const mediaSources = overrides?.mediaSources ?? ({} as any);
		const overlaySources = overrides?.overlaySources ?? ({} as any);
		const sceneSources = overrides?.sceneSources ?? ({} as any);

		const getActiveMixes = overrides?.getActiveMixes ?? sinon.stub().resolves();

		const parseMeterValues = overrides?.parseMeterValues ?? sinon.stub().returns(null);
		const meterLevelToPercentage = overrides?.meterLevelToPercentage ?? sinon.stub().callsFake((v: number) => v);
		const floatToDb = overrides?.floatToDb ?? sinon.stub().callsFake((v: number) => v);

		const msToFrames = overrides?.msToFrames ?? sinon.stub().callsFake((ms: number) => Math.round(ms / 10));

		// In your code: getKeyByValue(audioChannels, mix_key).toLocaleLowerCase()
		// We'll use a deterministic mapping for tests:
		const getKeyByValue =
			overrides?.getKeyByValue ??
			((obj: any, value: any) => {
				// special-case audioChannels mapping:
				if (obj && obj.__kind === 'audioChannels') {
					if (value === 'value0') return 'COMBO1';
					if (value === 'value1') return 'COMBO2';
					return `CH_${String(value)}`;
				}
				// fallback
				for (const [k, v] of Object.entries(obj ?? {})) {
					if (v === value) return k;
				}
				return 'UNKNOWN';
			});

		const getMediaType = overrides?.getMediaType ?? ((_path: string) => 'video');

		const commands =
			overrides?.commands ??
			({
				SHOW: ['/show'],
				REMOTE: ['/remote'],
			} as any);

		const enums =
			overrides?.enums ??
			({
				LogLevel: { INFO: 'info', DEBUG: 'debug', WARN: 'warn', ERROR: 'error' },
				SubmixChannels: { LIVE: 'LIVE' },
				RCVSourceModes: { MULTISOURCE: 1, MEDIA: 2, OVERLAY: 3, INSPECT: 4, UNKNOWN: 0 },
				buttonPressControlType: {},
				MetersChannel: { None: -1, NumSources: 64 },
			} as any);

		const FeedbackId =
			overrides?.FeedbackId ??
			({
				logo: 'logo',
				audio_sources: 'audio_sources',
				meters: 'meters',
				control_state: 'control_state',
				overlays_state: 'overlays_state',
				scenes_state: 'scenes_state',
				media_state: 'media_state',
				input_state: 'input_state',
				keying: 'keying',
				visualSwitcher: 'visualSwitcher',
				is_streaming: 'is_streaming',
				is_recording: 'is_recording',
				auto_switching: 'auto_switching',
			} as any);

		// Stub XMLParser class so `xmlParser.parse()` returns what we want.
		class FakeXMLParser {
			parse(xml: string) {
				if (overrides?.xmlParserParse) return overrides.xmlParserParse(xml);
				// default: empty
				return {};
			}
		}

		// Provide minimal audioChannels “enum” object for getKeyByValue mapping
		const audioChannels = { __kind: 'audioChannels' };

		const mod = await esmock('../../src/events/recievedDataHandler.js', {
			'fast-xml-parser': { XMLParser: FakeXMLParser },
			'../../src/modules/commands.js': { commands },
			'../../src/modules/constants.js': {
				submixList,
				buttonList,
				controllerVariables,
				drives: {},
				mixerChannels,
				monitorChannels: {},
				timecodes: {},
				wirelessMic: {},
				videoSources,
				mediaSources,
				overlaySources,
				sceneSources,
				rcvPhysicalButtons: {},
			},
			'../../src/modules/enums.js': {
				...enums,
				audioChannels,
			},
			'../../src/modules/logger.js': { ConsoleLog },
			'../../src/modules/oscController.js': { sendOSCCommand },
			'../../src/helpers/commonHelpers.js': {
				isSubmixProperty: (p: string) => ['level', 'muted', 'disabled', 'linked'].includes(p),
				framesToMs: sinon.stub(),
				msToFrames,
				getKeyByValue,
				getMediaType,
			},
			'../../src/helpers/decibelHelper.js': { floatToDb },
			'../../src/helpers/metersHelper.js': {
				getActiveMixes,
				meterLevelToPercentage,
				parseMeterValues,
			},
			'../../src/feedbacks/feedbacks.js': { FeedbackId },
		});

		return {
			handleIncomingData: mod.handleIncomingData as (instance: any, command: string, args: any) => Promise<void>,
			stubs: {
				ConsoleLog,
				sendOSCCommand,
				getActiveMixes,
				parseMeterValues,
				meterLevelToPercentage,
				floatToDb,
				msToFrames,
				controllerVariables,
				mixerChannels,
				submixList,
				FeedbackId,
				commands,
			},
		};
	}

	describe('/show XML dump', () => {
		it('sets startup, studioMode, show_name, logo feedback, frameRate, audio delay vars, mixer gain var, submix level var, calls getActiveMixes', async () => {
			const instance = makeInstance();

			const { handleIncomingData, stubs } = await loadHandler({
				xmlParserParse: () => ({
					RcvShow: {
						'@_switching_mode': 'studioLeft',
						'@_name': 'My Show',
						'@_logoEnable': true,
						'@_frameRate': 50,
						AudioMixer: {
							masteraudiodelay: { valueMs: 25 },
							audiosources: {
								// mix_key in your code is like "value0", "value1"
								value0: {
									enabled: true,
									version: 1,
									position: 0,
									name: 'Combo 1',
									level: 0.77,
									mixes: {
										// mix is like "value1" where 1 is submix id
										value1: {
											level: '0.5',
											mute: false,
											disabled: 'false',
											link: 'false',
										},
									},
								},
							},
						},
					},
				}),
				// make fns deterministic:
				floatToDb: sinon.stub().callsFake((v: number) => Math.round(v * 100) / 100),
				msToFrames: sinon.stub().callsFake((ms: number) => ms * 2),
			});

			await handleIncomingData(instance as any, '/show', [Buffer.from('<xml/>')]);

			// startup flag
			expect(stubs.controllerVariables.startup).to.equal(true);

			// switching_mode var set
			expect(instance.setVariableValues.called).to.equal(true);
			const allSetCalls = instance.setVariableValues.getCalls().map((c) => c.args[0]);

			// show + switching vars
			expect(allSetCalls.some((o) => o.switching_mode === 'studio')).to.equal(true);
			expect(allSetCalls.some((o) => o.show_name === 'My Show')).to.equal(true);

			// logo feedback
			expect(instance.checkFeedbacks.calledWith(stubs.FeedbackId.logo)).to.equal(true);

			// frame_rate var
			expect(allSetCalls.some((o) => o.frame_rate === '50')).to.equal(true);

			// audio delay vars (msToFrames mocked to ms*2)
			expect(allSetCalls.some((o) => o.audio_delay_ms === '25' && o.audio_delay_frames === '50')).to.equal(true);

			// mixerChannels created
			expect(stubs.mixerChannels.value0).to.exist;
			expect(stubs.mixerChannels.value0.name).to.equal('Combo 1');
			expect(stubs.mixerChannels.value0.gain).to.equal(0.77);

			// creates gain var (combo1_setgain)
			expect(instance.variables.some((v) => v.variableId === 'combo1_setgain')).to.equal(true);
			expect(allSetCalls.some((o) => o.combo1_setgain === '0.77')).to.equal(true);

			// creates submix level var (combo1-LIVE_setlevel) where submix id 1 maps to LIVE
			expect(instance.variables.some((v) => v.variableId === 'combo1-LIVE_setlevel')).to.equal(true);
			expect(allSetCalls.some((o) => o['combo1-LIVE_setlevel'] === '0.5')).to.equal(true);

			// submixesReady triggers getActiveMixes
			expect(stubs.getActiveMixes.calledOnce).to.equal(true);
		});
	});

	describe('/show/switchingMode', () => {
		it('toggles studioMode, sends SHOW+REMOTE, updates switching_mode variable', async () => {
			const instance = makeInstance();

			const sendOSCCommand = sinon.stub().resolves();
			const { handleIncomingData, stubs } = await loadHandler({
				sendOSCCommand,
				commands: { SHOW: ['/show'], REMOTE: ['/remote'] },
			});

			await handleIncomingData(instance as any, '/show/switchingMode', ['studioLeft']);

			expect(stubs.controllerVariables.studioMode).to.equal(true);

			// should request refresh
			expect(sendOSCCommand.callCount).to.equal(2);
			expect(sendOSCCommand.getCall(0).args[1]).to.equal('/show');
			expect(sendOSCCommand.getCall(1).args[1]).to.equal('/remote');

			expect(instance.setVariableValues.calledWithMatch({ switching_mode: 'studio' })).to.equal(true);
		});
	});

	describe('/meters/values', () => {
		it('returns early when returnLiveLevels is false', async () => {
			const instance = makeInstance();

			const { handleIncomingData, stubs } = await loadHandler({
				controllerVariables: { returnLiveLevels: false, currentAudioLevels: null },
				parseMeterValues: sinon.stub().throws(new Error('should not be called')),
			});

			await handleIncomingData(instance as any, '/meters/values', [new Uint8Array([1, 2, 3])]);

			expect(stubs.parseMeterValues.called).to.equal(false);
			expect(instance.setVariableValues.called).to.equal(false);
		});

		it('accepts Uint8Array, parses meter data, creates vars, batches setVariableValues, checks feedbacks', async () => {
			const instance = makeInstance();

			const controllerVariables = { returnLiveLevels: true, currentAudioLevels: null };

			// Meter data with one output channel (channel "0") + master
			const meterData = {
				master: { left: { level: 0.1 }, right: { level: 0.2 } },
				outputMix: 0,
				outputs: {
					0: { left: { level: 0.3 }, right: { level: 0.4 } },
				},
				inputs: {},
			};

			const parseMeterValues = sinon.stub().returns(meterData);

			const meterLevelToPercentage = sinon.stub().callsFake((v: number) => v); // passthrough
			const floatToDb = sinon.stub().callsFake((v: number) => Math.round(v * 10) / 10);

			// must have mixerChannels["value0"].name for var naming
			const mixerChannels = {
				value0: { name: 'Combo 1' },
			};

			const { handleIncomingData, stubs } = await loadHandler({
				controllerVariables,
				mixerChannels,
				parseMeterValues,
				meterLevelToPercentage,
				floatToDb,
			});

			await handleIncomingData(instance as any, '/meters/values', [new Uint8Array([9, 9, 9])]);

			// parse called with Buffer converted from Uint8Array
			expect(stubs.parseMeterValues.calledOnce).to.equal(true);
			expect(Buffer.isBuffer(stubs.parseMeterValues.firstCall.args[1])).to.equal(true);

			// variables created for channel 0 L/R + master L/R
			expect(instance.variables.some((v) => v.variableId === 'combo1_livelevelL')).to.equal(true);
			expect(instance.variables.some((v) => v.variableId === 'combo1_livelevelR')).to.equal(true);
			expect(instance.variables.some((v) => v.variableId === 'master_live_L')).to.equal(true);
			expect(instance.variables.some((v) => v.variableId === 'master_live_R')).to.equal(true);

			// batched update
			expect(instance.setVariableValues.called).to.equal(true);
			const updateObj = instance.setVariableValues.lastCall.args[0] as Record<string, string>;
			expect(updateObj).to.have.keys(['combo1_livelevelL', 'combo1_livelevelR', 'master_live_L', 'master_live_R']);

			// checks feedbacks for audio_sources + meters
			expect(instance.checkFeedbacks.calledWith(stubs.FeedbackId.audio_sources)).to.equal(true);
			expect(instance.checkFeedbacks.calledWith(stubs.FeedbackId.meters)).to.equal(true);

			// controllerVariables.currentAudioLevels updated
			expect(stubs.controllerVariables.currentAudioLevels).to.deep.equal(meterData);
		});
	});
});
