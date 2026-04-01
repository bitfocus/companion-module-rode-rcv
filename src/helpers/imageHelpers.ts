import { Subject } from 'rxjs';
import { share } from 'rxjs/operators';
import { GENERATED_IMAGE_PNG64_MAP } from '../generated/imagePng64Map.js';
import { RCVInstance } from '../index.js';
import { LogLevel } from '../modules/enums.js';
import { ConsoleLog } from '../modules/logger.js';

const IMG_MAX_SIZE: readonly [number, number] = [72, 58];

const _cache = new Map<string, string>();
const _cacheUpdated$ = new Subject<string>();

export const cacheUpdated$ = _cacheUpdated$.asObservable().pipe(share());

function setCachedPng64(cacheKey: string, value: string): void {
	_cache.set(cacheKey, value);
	_cacheUpdated$.next(cacheKey);
}

function normalizeImageKey(relativeImagePath: string): string {
	return relativeImagePath.replace(/\\/g, '/').replace(/\.svg$/i, '');
}

function getCacheKey(imageKey: string, maxSize: readonly [number, number]): string {
	return `${imageKey}::${maxSize[0]}x${maxSize[1]}`;
}

export async function svgPathToCachedPng64(
	instance: RCVInstance,
	relativeImagePath: string,
	_baseDir: string = process.cwd(),
	maxSize: readonly [number, number] = IMG_MAX_SIZE,
): Promise<string> {
	const imageKey = normalizeImageKey(relativeImagePath);
	const cacheKey = getCacheKey(imageKey, maxSize);

	const cached = _cache.get(cacheKey);
	if (cached) {
		return cached;
	}

	const generated = GENERATED_IMAGE_PNG64_MAP[imageKey];
	if (generated) {
		setCachedPng64(cacheKey, generated);
		return generated;
	}

	ConsoleLog(instance, `No pre-generated PNG64 found for "${imageKey}"`, LogLevel.ERROR, false);

	return '';
}
