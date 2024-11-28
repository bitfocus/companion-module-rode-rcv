import { InstanceBase, runEntrypoint, InstanceStatus, SomeCompanionConfigField, CompanionVariableDefinition } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig } from "./modules/config.js";
import { UpdateActions } from './actions/actions.js'
import { UpdateFeedbacks } from './feedbacks/feedbacks.js'
import { UpdateVariableDefinitions } from './variables/variables.js';
import { UpgradeScripts } from './upgrade.js'
import { checkOscClient, createClient, oscClientClose, sendOSCCommand } from './modules/oscController.js';
import { commands } from './modules/commands.js';
import { isValidIPAddress } from './helpers/commonHelpers.js';
import { SetPresets } from './presets/presets.js';
import { LogLevel, MetersChannel, MetersSubmix } from './modules/enums.js';
import { ConsoleLog } from './modules/logger.js';
import { getAllChannels, requestMeterValues } from './helpers/metersHelper.js';

export class RCVInstance extends InstanceBase<ModuleConfig> {
	config!: ModuleConfig;
	reconnecting!: boolean;
	globalSettings!: any;
	states!: any;
	actions!: any;
	moduleInit!: boolean;
	variables!: CompanionVariableDefinition[];

	constructor(internal: any) {
		super(internal);

		// Store the instance's state and connection info
		this.states = {};
		this.actions = {};
		this.reconnecting = false;
		this.globalSettings = {};
		this.moduleInit = false;
		this.variables = [];
		
	}
 
	// Initialize the instance
	async init(config: ModuleConfig): Promise<void> {
		this.config = config;

		this.globalSettings.oscConnected = false;

		this.updateActions();
		this.updateFeedbacks();
		this.updateVariables();
		this.setPresets();

		this.updateStatus(InstanceStatus.Disconnected);

		this.setupOscClient();

	}

	setupOscClient(): void {
		if (!checkOscClient()) {
			if (this.config.enableComs && this.config.ipAddress && isValidIPAddress(this.config.ipAddress)) {
				this.updateStatus(InstanceStatus.Connecting);
				createClient(this, this.config.ipAddress);

				setTimeout(() => {
					this.sendInitCommands();
				}, 1500);

				if (!this.moduleInit) {
					setInterval(() => {
						this.sendRefresh();
					}, 10000);

					this.moduleInit = true;
				}
				

			} else {
				if (!this.config.ipAddress || !isValidIPAddress(this.config.ipAddress)) {
					this.updateStatus(InstanceStatus.BadConfig);
				}
			}
		}
	}

	async sendInitCommands(): Promise<void> {
		if (this.globalSettings.oscConnected) {
			await sendOSCCommand(this, commands.REFRESH[0]);
			await sendOSCCommand(this, commands.SHOW[0]);
			await sendOSCCommand(this, commands.DEVICE[0]);

			//this.setupMeterRequests();
		}
	}

	
	async setupMeterRequests(): Promise<void> {
		const allChannels = getAllChannels();

		//Monitor all channels
		await requestMeterValues({
			instance: this,
			mix: MetersSubmix.Live,
			outputChannels: [MetersChannel.None],
			inputChannels: [MetersChannel.None]
		}).catch(err => {
			ConsoleLog(this, `Failed to request meter values: ${err}`, LogLevel.ERROR);
		});
	}

	async sendRefresh(): Promise<void> {
		if (this.globalSettings.oscConnected) {
			await sendOSCCommand(this, commands.REFRESH[0]);
			await sendOSCCommand(this, commands.DEVICE[0]);
		}
	}

	updateActions(): void {
		UpdateActions(this);
	}

	updateFeedbacks(): void {
		UpdateFeedbacks(this);
	}

	updateVariables(): void {
		UpdateVariableDefinitions(this);
	}

	setPresets(): void {
		SetPresets(this);
	}

	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields();
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		this.config = config;

		this.globalSettings.ipAddress = config.ipAddress;
		this.globalSettings.enableComs = config.enableComs;

		if (checkOscClient()) {
			oscClientClose(this);
		}

		if (config.enableComs && config.ipAddress) {
			this.setupOscClient();
		} else {
			if (!config.ipAddress) {
				this.updateStatus(InstanceStatus.BadConfig);
			}
		}
	}

	async destroy(): Promise<void> {
		if (checkOscClient()) {
			oscClientClose(this);
		}

		this.log('debug', 'destroy');
	}

}

// Entry point for the module
runEntrypoint(RCVInstance, UpgradeScripts);
