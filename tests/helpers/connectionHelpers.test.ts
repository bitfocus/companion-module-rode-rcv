import { expect } from 'chai';
import sinon from 'sinon';
import esmock from 'esmock';

describe('connectionHelpers.getRCVInfo', () => {
	type FakeInstance = {
		globalSettings: { oscConnected: boolean };
		setVariableValues: sinon.SinonSpy;
	};

	function makeInstance(oscConnected = true): FakeInstance {
		return {
			globalSettings: { oscConnected },
			setVariableValues: sinon.spy(),
		};
	}

	async function loadModule(overrides: {
		sendUdpPacket?: sinon.SinonStub;
		ConsoleLog?: sinon.SinonSpy;
		UpdateActions?: sinon.SinonSpy;
		UpdateFeedbacks?: sinon.SinonSpy;
		SetPresets?: sinon.SinonSpy;
		controllerVariables?: { model?: any; returnLiveLevels?: boolean; currentAudioLevels?: any };
		enums?: { LogLevel: any; RCVModel: any };
	}) {
		const sendUdpPacket =
			overrides.sendUdpPacket ?? sinon.stub().resolves([]);
		const ConsoleLog = overrides.ConsoleLog ?? sinon.spy();
		const UpdateActions = overrides.UpdateActions ?? sinon.spy();
		const UpdateFeedbacks = overrides.UpdateFeedbacks ?? sinon.spy();
		const SetPresets = overrides.SetPresets ?? sinon.spy();

		// Minimal controllerVariables we can assert against without touching real constants
		const controllerVariables =
			overrides.controllerVariables ?? { model: undefined };

		// Minimal enums to avoid importing real project enums in unit tests
		const LogLevel = overrides.enums?.LogLevel ?? { INFO: 'info' };
		const RCVModel =
			overrides.enums?.RCVModel ??
			({ RCV: 'RCV', RCVS: 'RCVS', RCVC: 'RCVC' } as const);

		const mod = await esmock('../../src/helpers/connectionHelpers.js', {
			'../../src/modules/oscController.js': { sendUdpPacket },
			'../../src/modules/logger.js': { ConsoleLog },
			'../../src/modules/constants.js': { controllerVariables },
			'../../src/modules/enums.js': { LogLevel, RCVModel },
			'../../src/actions/actions.js': { UpdateActions },
			'../../src/feedbacks/feedbacks.js': { UpdateFeedbacks },
			'../../src/presets/presets.js': { SetPresets },

			// Imported but unused in getRCVInfo (safe to stub to empty)
			'../../src/variables/variables.js': { UpdateVariableDefinitions: sinon.spy() },
		});

		return {
			getRCVInfo: mod.getRCVInfo as (instance: any, ip: string) => Promise<void>,
			stubs: {
				sendUdpPacket,
				ConsoleLog,
				UpdateActions,
				UpdateFeedbacks,
				SetPresets,
				controllerVariables,
				LogLevel,
				RCVModel,
			},
		};
	}

	it('returns early if oscConnected is false (does nothing)', async () => {
		const instance = makeInstance(false);

		const sendUdpPacket = sinon.stub().resolves([{ ipAddress: '1.2.3.4' }]);
		const UpdateActions = sinon.spy();
		const UpdateFeedbacks = sinon.spy();
		const SetPresets = sinon.spy();

		const { getRCVInfo, stubs } = await loadModule({
			sendUdpPacket,
			UpdateActions,
			UpdateFeedbacks,
			SetPresets,
		});

		await getRCVInfo(instance as any, '1.2.3.4');

		expect(stubs.sendUdpPacket.called).to.equal(false);
		expect(instance.setVariableValues.called).to.equal(false);
		expect(stubs.UpdateActions.called).to.equal(false);
		expect(stubs.UpdateFeedbacks.called).to.equal(false);
		expect(stubs.SetPresets.called).to.equal(false);
	});

	it('uses manual device defaults when discovery returns no devices', async () => {
		const instance = makeInstance(true);

		const sendUdpPacket = sinon.stub().resolves([]);
		const controllerVariables = { model: undefined as any };

		const { getRCVInfo, stubs } = await loadModule({
			sendUdpPacket,
			controllerVariables,
			enums: {
				LogLevel: { INFO: 'info' },
				RCVModel: { RCV: 'RCV', RCVS: 'RCVS', RCVC: 'RCVC' },
			},
		});

		const ip = '192.168.10.61';
		await getRCVInfo(instance as any, ip);

		expect(stubs.sendUdpPacket.calledOnce).to.equal(true);
		expect(stubs.sendUdpPacket.firstCall.args).to.deep.equal([instance, 'RodeBroadcast', ip]);

		// Model set from manual device
		expect(controllerVariables.model).to.equal('RCV');

		expect(instance.setVariableValues.calledOnce).to.equal(true);
		expect(instance.setVariableValues.firstCall.args[0]).to.deep.equal({
			device_model: 'RodeCaster Video',
			device_name: `RØDECaster Video (${ip})`,
			device_swversion: 'Unknown',
			device_serial: 'manual',
			device_ipaddress: ip,
		});

		expect(stubs.UpdateActions.calledOnce).to.equal(true);
		expect(stubs.UpdateFeedbacks.calledOnce).to.equal(true);
		expect(stubs.SetPresets.calledOnce).to.equal(true);
	});

	it('adopts discovered device when IP matches and logs discovery', async () => {
		const instance = makeInstance(true);

		const ip = '10.0.0.5';
		const discovered = {
			name: 'RØDECaster Video S',
			serialNo: 'ABC123',
			swVersion: '2.0.1',
			ipAddress: ip,
			manual: true,
			model: 'RCVS',
			type: 'RodeCasterVideo',
		};

		const sendUdpPacket = sinon.stub().resolves([discovered]);
		const ConsoleLog = sinon.spy();
		const controllerVariables = { model: undefined as any };

		const { getRCVInfo, stubs } = await loadModule({
			sendUdpPacket,
			ConsoleLog,
			controllerVariables,
			enums: {
				LogLevel: { INFO: 'info' },
				RCVModel: { RCV: 'RCV', RCVS: 'RCVS', RCVC: 'RCVC' },
			},
		});

		await getRCVInfo(instance as any, ip);

		// Original discovered object should not be mutated
		expect(discovered.manual).to.equal(true);

		// Model propagated to controller variables
		expect(controllerVariables.model).to.equal('RCVS');

		// Variables reflect discovered device
		expect(instance.setVariableValues.calledOnce).to.equal(true);
		expect(instance.setVariableValues.firstCall.args[0]).to.deep.equal({
			device_model: 'RodeCasterVideo S',
			device_name: 'RØDECaster Video S',
			device_swversion: '2.0.1',
			device_serial: 'ABC123',
			device_ipaddress: ip,
		});

		// Discovery log emitted
		expect(stubs.ConsoleLog.calledOnce).to.equal(true);
		const logArgs = stubs.ConsoleLog.firstCall.args;
		expect(logArgs[0]).to.equal(instance);
		expect(logArgs[1]).to.include('[Discovery] Found device');
		expect(logArgs[2]).to.equal('info');
		expect(logArgs[3]).to.equal(true);

		// UI refreshes
		expect(stubs.UpdateActions.calledOnce).to.equal(true);
		expect(stubs.UpdateFeedbacks.calledOnce).to.equal(true);
		expect(stubs.SetPresets.calledOnce).to.equal(true);
	});

	it('keeps manual defaults when discovery returns devices but none match the requested IP', async () => {
		const instance = makeInstance(true);

		const ip = '10.0.0.99';
		const sendUdpPacket = sinon.stub().resolves([
			{ ipAddress: '10.0.0.1', name: 'A', serialNo: '1', swVersion: 'x', manual: false, model: 'RCVS', type: 'RodeCasterVideo S' },
			{ ipAddress: '10.0.0.2', name: 'B', serialNo: '2', swVersion: 'y', manual: false, model: 'RCV', type: 'RodeCasterVideo' },
		]);

		const controllerVariables = { model: undefined as any };

		const { getRCVInfo } = await loadModule({
			sendUdpPacket,
			controllerVariables,
			enums: {
				LogLevel: { INFO: 'info' },
				RCVModel: { RCV: 'RCV', RCVS: 'RCVS', RCVC: 'RCVC' },
			},
		});

		await getRCVInfo(instance as any, ip);

		expect(controllerVariables.model).to.equal('RCV');

		expect(instance.setVariableValues.calledOnce).to.equal(true);
		expect(instance.setVariableValues.firstCall.args[0]).to.deep.equal({
			device_model: 'RodeCaster Video',
			device_name: `RØDECaster Video (${ip})`,
			device_swversion: 'Unknown',
			device_serial: 'manual',
			device_ipaddress: ip,
		});
	});
});
