import type { CompanionStaticUpgradeScript } from '@companion-module/base'
import type { ModuleConfig } from './modules/config.js'

/* -----------------------------
 * Generic helpers
 * ----------------------------- */
type Opts = Record<string, any>

function has(o: Opts, k: string): boolean {
	return Object.prototype.hasOwnProperty.call(o, k)
}

function renameOption(opts: Opts, from: string, to: string): boolean {
	if (!has(opts, from)) return false
	if (!has(opts, to)) {
		opts[to] = opts[from]
	}
	delete opts[from]
	return true
}

function ensureDefault(opts: Opts, key: string, value: any): boolean {
	if (opts[key] === undefined) {
		opts[key] = typeof value === 'function' ? value(opts) : value
		return true
	}
	return false
}

function deleteIfPresent(opts: Opts, key: string): boolean {
	if (has(opts, key)) {
		delete opts[key]
		return true
	}
	return false
}

function remapValue(opts: Opts, key: string, mapping: Record<string, any>, fallback?: any): boolean {
	if (!has(opts, key)) return false
	const val = opts[key]
	if (val in mapping) {
		opts[key] = mapping[val]
		return true
	} else if (fallback !== undefined) {
		opts[key] = fallback
		return true
	}
	return false
}

function shallowClone<T extends object>(obj: T): T {
	return obj ? ({ ...obj } as T) : ({} as T)
}

function migrateActions(
	props: { actions?: any[] },
	actionId: string,
	transform: (opts: Opts) => { opts: Opts; changed: boolean }
) {
	const updated: any[] = []
	let changedAnything = false

	for (const a of props.actions ?? []) {
		if (a.actionId !== actionId) continue
		const { opts, changed } = transform(a.options ?? {})
		if (changed) {
			updated.push({ ...a, options: opts })
			changedAnything = true
		}
	}
	return { updated, changedAnything }
}

function migrateFeedbacks(
	props: { feedbacks?: any[] },
	feedbackId: string,
	transform: (opts: Opts) => { opts: Opts; changed: boolean }
) {
	const updated: any[] = []
	let changedAnything = false

	for (const f of props.feedbacks ?? []) {
		if (f.feedbackId !== feedbackId) continue
		const { opts, changed } = transform(f.options ?? {})
		if (changed) {
			updated.push({ ...f, options: opts })
			changedAnything = true
		}
	}
	return { updated, changedAnything }
}

/* --------------------------------------------
 * v1: routing option change (source -> source1/2)
 * -------------------------------------------- */
function migrateRouting_v1(optsIn: Opts): { opts: Opts; changed: boolean } {
	const opts = shallowClone(optsIn)
	let changed = false

	const output = opts.output as string | undefined

	// Move legacy `source` into the correct new field
	if (has(opts, 'source')) {
		const old = opts.source
		delete opts.source
		if (output === 'outputNDI1') {
			if (!has(opts, 'source2')) opts.source2 = old ?? 'multi'
		} else {
			if (!has(opts, 'source1')) opts.source1 = old ?? 'multi'
		}
		changed = true
	}

	// Enforce correct shape + defaults, and remove stray field
	if (output === 'outputNDI1') {
		changed = ensureDefault(opts, 'source2', 'multi') || changed
		changed = deleteIfPresent(opts, 'source1') || changed
	} else {
		changed = ensureDefault(opts, 'source1', 'multi') || changed
		changed = deleteIfPresent(opts, 'source2') || changed
	}

	return { opts, changed }
}

const upgrade_routing_v1: CompanionStaticUpgradeScript<ModuleConfig> = (context, props) => {
	const a = migrateActions(props, 'routing', migrateRouting_v1)
	const f = migrateFeedbacks(props, 'routing', migrateRouting_v1)

	const changedAnything = a.changedAnything || f.changedAnything

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
		  }
}

/* ------------------------------------------------
 * Register scripts in order. Append new ones later.
 * ------------------------------------------------ */
export const UpgradeScripts: CompanionStaticUpgradeScript<ModuleConfig>[] = [
	upgrade_routing_v1,
]