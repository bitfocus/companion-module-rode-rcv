import type { CompanionStaticUpgradeScript } from '@companion-module/base';
import type { ModuleConfig } from './modules/config.js';
import { buttonPressControlType } from './modules/enums.js';
import { isSyncChannel } from './helpers/commonHelpers.js';

/* -----------------------------
 * Generic helpers
 * ----------------------------- */
type Opts = Record<string, any>;

function has(o: Opts, k: string): boolean {
	return Object.prototype.hasOwnProperty.call(o, k);
}

function renameOption(opts: Opts, from: string, to: string): boolean {
	if (!has(opts, from)) return false;
	if (!has(opts, to)) {
		opts[to] = opts[from];
	}
	delete opts[from];
	return true;
}

function ensureDefault(opts: Opts, key: string, value: any): boolean {
	if (opts[key] === undefined) {
		opts[key] = typeof value === 'function' ? value(opts) : value;
		return true;
	}
	return false;
}

function deleteIfPresent(opts: Opts, key: string): boolean {
	if (has(opts, key)) {
		delete opts[key];
		return true;
	}
	return false;
}

function remapValue(opts: Opts, key: string, mapping: Record<string, any>, fallback?: any): boolean {
	if (!has(opts, key)) return false;
	const val = opts[key];
	if (val in mapping) {
		opts[key] = mapping[val];
		return true;
	} else if (fallback !== undefined) {
		opts[key] = fallback;
		return true;
	}
	return false;
}

function shallowClone<T extends object>(obj: T): T {
	return obj ? ({ ...obj } as T) : ({} as T);
}

function migrateActions(
	props: { actions?: any[] },
	actionId: string,
	transform: (opts: Opts) => { opts: Opts; changed: boolean },
) {
	const updated: any[] = [];
	let changedAnything = false;

	for (const a of props.actions ?? []) {
		if (a.actionId !== actionId) continue;
		const { opts, changed } = transform(a.options ?? {});
		if (changed) {
			updated.push({ ...a, options: opts });
			changedAnything = true;
		}
	}
	return { updated, changedAnything };
}

function migrateFeedbacks(
	props: { feedbacks?: any[] },
	feedbackId: string,
	transform: (opts: Opts) => { opts: Opts; changed: boolean },
) {
	const updated: any[] = [];
	let changedAnything = false;

	for (const f of props.feedbacks ?? []) {
		if (f.feedbackId !== feedbackId) continue;
		const { opts, changed } = transform(f.options ?? {});
		if (changed) {
			updated.push({ ...f, options: opts });
			changedAnything = true;
		}
	}
	return { updated, changedAnything };
}

/* --------------------------------------------
 * v1: routing option change (source -> source1/2)
 * -------------------------------------------- */
function migrateRouting_v1(optsIn: Opts): { opts: Opts; changed: boolean } {
	const opts = shallowClone(optsIn);
	let changed = false;

	const output = opts.output as string | undefined;

	// Move legacy `source` into the correct new field
	if (has(opts, 'source')) {
		const old = opts.source;
		delete opts.source;
		if (output === 'outputNDI1') {
			if (!has(opts, 'source2')) opts.source2 = old ?? 'multi';
		} else {
			if (!has(opts, 'source1')) opts.source1 = old ?? 'multi';
		}
		changed = true;
	}

	// Enforce correct shape + defaults, and remove stray field
	if (output === 'outputNDI1') {
		changed = ensureDefault(opts, 'source2', 'multi') || changed;
		changed = deleteIfPresent(opts, 'source1') || changed;
	} else {
		changed = ensureDefault(opts, 'source1', 'multi') || changed;
		changed = deleteIfPresent(opts, 'source2') || changed;
	}

	return { opts, changed };
}

/* --------------------------------------------
 * v1: setOverlay new option (set type default)
 * -------------------------------------------- */
function migrateOverlayBank_v1(optsIn: Opts): { opts: Opts; changed: boolean } {
	const opts = shallowClone(optsIn);
	let changed = false;

	const type = opts.type as string | undefined;

	// Enforce correct shape + defaults, and remove stray field
	if (type === undefined || type === null) {
		changed = ensureDefault(opts, 'type', 'file') || changed;
	}

	return { opts, changed };
}

/* --------------------------------------------
 * v1: control_action new option `mechanism` defaults, rename `BUTTON_RECORD` and `BUTTON_STREAM`
 * -------------------------------------------- */
function migratecontrolAction_v1(optsIn: Opts): { opts: Opts; changed: boolean } {
	const opts = shallowClone(optsIn);
	let changed = false;

	changed = ensureDefault(opts, 'mechanism', 'toggle') || changed;

	changed =
		remapValue(
			opts,
			'mechanism',
			{
				toggle: 'toggle',
				start: 'start',
				stop: 'stop',
			},
			'toggle',
		) || changed;

	changed =
		remapValue(
			opts,
			'control',
			{
				record: buttonPressControlType.BUTTON_RECORD,
				stream: buttonPressControlType.BUTTON_STREAM,
			},
			undefined,
		) || changed;

	return { opts, changed };
}

/* --------------------------------------------
 * v1: audio_sources action split for Sync channels
 *
 * Previous versions only stored a single `action` field for all audio channels.
 * This version introduces `action_sync` for Sync-only channels, because Sync
 * channels support a different action set than normal audio channels.
 *
 * -------------------------------------------- */
function migrateAudioSources_v1(optsIn: Opts): { opts: Opts; changed: boolean } {
	const opts = shallowClone(optsIn);
	let changed = false;

	if (isSyncChannel(opts.channel)) {
		if (!has(opts, 'action_sync')) {
			switch (opts.action) {
				case 'gain':
				case 'setmute':
				case 'mute':
					opts.action_sync = opts.action;
					break;
				default:
					opts.action_sync = 'gain';
					break;
			}
			changed = true;
		}
	}

	return { opts, changed };
}

const upgrade_routing_v1: CompanionStaticUpgradeScript<ModuleConfig> = (context, props) => {
	const a = migrateActions(props, 'routing', migrateRouting_v1);
	const f = migrateFeedbacks(props, 'routing', migrateRouting_v1);

	const changedAnything = a.changedAnything || f.changedAnything;

	return changedAnything
		? {
				updatedConfig: null,
				updatedActions: a.updated,
				updatedFeedbacks: f.updated,
			}
		: {
				updatedConfig: null,
				updatedActions: [],
				updatedFeedbacks: [],
			};
};

const upgrade_overlaybank_v1: CompanionStaticUpgradeScript<ModuleConfig> = (context, props) => {
	const a = migrateActions(props, 'setOverlay', migrateOverlayBank_v1);

	const changedAnything = a.changedAnything;

	return changedAnything
		? {
				updatedConfig: null,
				updatedActions: a.updated,
				updatedFeedbacks: [],
			}
		: {
				updatedConfig: null,
				updatedActions: [],
				updatedFeedbacks: [],
			};
};

const upgrade_controlaction_v1: CompanionStaticUpgradeScript<ModuleConfig> = (context, props) => {
	const a = migrateActions(props, 'control_buttons', migratecontrolAction_v1);

	const changedAnything = a.changedAnything;

	return changedAnything
		? {
				updatedConfig: null,
				updatedActions: a.updated,
				updatedFeedbacks: [],
			}
		: {
				updatedConfig: null,
				updatedActions: [],
				updatedFeedbacks: [],
			};
};

const upgrade_audiosources_v1: CompanionStaticUpgradeScript<ModuleConfig> = (context, props) => {
	const a = migrateActions(props, 'audio_sources', migrateAudioSources_v1);

	return a.changedAnything
		? {
				updatedConfig: null,
				updatedActions: a.updated,
				updatedFeedbacks: [],
			}
		: {
				updatedConfig: null,
				updatedActions: [],
				updatedFeedbacks: [],
			};
};

/* ------------------------------------------------
 * Register scripts in order. Append new ones later.
 * ------------------------------------------------ */
export const UpgradeScripts: CompanionStaticUpgradeScript<ModuleConfig>[] = [
	upgrade_routing_v1,
	upgrade_overlaybank_v1,
	upgrade_controlaction_v1,
	upgrade_audiosources_v1,
];
