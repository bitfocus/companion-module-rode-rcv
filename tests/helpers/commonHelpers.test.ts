import { expect } from 'chai';
import sinon from 'sinon';

import {
	convertFloatToPercentage,
	interpolate255To100,
	mapRangeToDb,
	debounce,
	formatTransitionCommand,
	convertMillisecondsToSeconds,
	isSubmixProperty,
	isValidIPAddress,
	evaluateComparison,
	msToFrames,
	framesToMs,
	getKeyByValue,
	getMediaType,
} from '../../src/helpers/commonHelpers.js';
import { mediaType } from '../../src/modules/enums.js';


// If you want to test isValidTransition/getButtons/etc later,
// we can add those once we decide how to control imported enums/constants cleanly.

describe('commonHelpers', () => {
	describe('convertFloatToPercentage', () => {
		it('converts 0.0 -> 0', () => {
			expect(convertFloatToPercentage(0.0)).to.equal(0);
		});

		it('converts 1.0 -> 100', () => {
			expect(convertFloatToPercentage(1.0)).to.equal(100);
		});

		it('rounds correctly', () => {
			expect(convertFloatToPercentage(0.234)).to.equal(23);
			expect(convertFloatToPercentage(0.235)).to.equal(24); // Math.round
		});

		it('clamps below 0 to 0', () => {
			expect(convertFloatToPercentage(-1)).to.equal(0);
		});

		it('clamps above 1 to 100', () => {
			expect(convertFloatToPercentage(2)).to.equal(100);
		});
	});

	describe('interpolate255To100', () => {
		it('converts 0 -> 0', () => {
			expect(interpolate255To100(0)).to.equal(0);
		});

		it('converts 255 -> 100', () => {
			expect(interpolate255To100(255)).to.equal(100);
		});

		it('clamps below 0 to 0', () => {
			expect(interpolate255To100(-5)).to.equal(0);
		});

		it('clamps above 255 to 255', () => {
			expect(interpolate255To100(999)).to.equal(100);
		});

		it('rounds appropriately', () => {
			// 128/255*100 = 50.19... -> 50
			expect(interpolate255To100(128)).to.equal(50);
		});
	});

	describe('mapRangeToDb', () => {
		it('maps 0 -> minOut', () => {
			expect(mapRangeToDb(0, -20, 20)).to.equal(-20);
		});

		it('maps 100 -> maxOut', () => {
			expect(mapRangeToDb(100, -20, 20)).to.equal(20);
		});

		it('maps 50 -> midpoint', () => {
			expect(mapRangeToDb(50, -20, 20)).to.equal(0);
		});
	});

	describe('debounce', () => {
		it('calls only once after wait time, with last args', () => {
			const clock = sinon.useFakeTimers();
			try {
				const spy = sinon.spy();
				const debounced = debounce(spy, 200);

				debounced('a');
				debounced('b');
				debounced('c');

				// before wait expires
				clock.tick(199);
				expect(spy.called).to.equal(false);

				clock.tick(1);
				expect(spy.calledOnce).to.equal(true);
				expect(spy.firstCall.args).to.deep.equal(['c']);
			} finally {
				clock.restore();
			}
		});
	});

	describe('formatTransitionCommand', () => {
		it('pads fadeDuration to 8 bytes after the string', () => {
			const cmd = formatTransitionCommand('1234');
			// fadeDuration length = 4 => paddingLength = 4
			expect(cmd).to.include('/show/transition_time');
			expect(cmd).to.include(',s');
			expect(cmd.endsWith('\x00\x00\x00\x00')).to.equal(true);
		});

		it('pads with 0 bytes even for short values', () => {
			const cmd = formatTransitionCommand('1');
			expect(cmd.endsWith('\x00\x00\x00\x00\x00\x00\x00')).to.equal(true); // 7 nulls
		});
	});

	describe('convertMillisecondsToSeconds', () => {
		it('formats to 1 decimal place', () => {
			expect(convertMillisecondsToSeconds(0)).to.equal('0.0');
			expect(convertMillisecondsToSeconds(1500)).to.equal('1.5');
			expect(convertMillisecondsToSeconds(1999)).to.equal('2.0');
		});
	});

	describe('isSubmixProperty', () => {
		it('accepts known keys', () => {
			expect(isSubmixProperty('submix')).to.equal(true);
			expect(isSubmixProperty('level')).to.equal(true);
			expect(isSubmixProperty('muted')).to.equal(true);
			expect(isSubmixProperty('disabled')).to.equal(true);
			expect(isSubmixProperty('linked')).to.equal(true);
		});

		it('rejects unknown keys', () => {
			expect(isSubmixProperty('nope')).to.equal(false);
			expect(isSubmixProperty('')).to.equal(false);
			expect(isSubmixProperty(null)).to.equal(false);
		});
	});

	describe('isValidIPAddress', () => {
		it('accepts valid IPv4', () => {
			expect(isValidIPAddress('192.168.10.61')).to.equal(true);
			expect(isValidIPAddress('255.255.255.255')).to.equal(true);
		});

		it('rejects invalid IPv4', () => {
			expect(isValidIPAddress('256.1.1.1')).to.equal(false);
			expect(isValidIPAddress('1.2.3')).to.equal(false);
		});

		it('accepts full-form IPv6 only (as implemented)', () => {
			expect(isValidIPAddress('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).to.equal(true);
		});

		it('rejects compressed IPv6 (as implemented)', () => {
			// Your regex does NOT accept :: compression
			expect(isValidIPAddress('2001:db8::1')).to.equal(false);
		});
	});

	describe('evaluateComparison', () => {
		it('handles each comparison string', () => {
			expect(evaluateComparison(5, 5, 'equal')).to.equal(true);
			expect(evaluateComparison(6, 5, 'greaterthan')).to.equal(true);
			expect(evaluateComparison(4, 5, 'lessthan')).to.equal(true);
			expect(evaluateComparison(5, 5, 'greaterthanequal')).to.equal(true);
			expect(evaluateComparison(5, 5, 'lessthanequal')).to.equal(true);
			expect(evaluateComparison(5, 6, 'notequal')).to.equal(true);
		});

		it('returns false for unknown comparison', () => {
			expect(evaluateComparison(1, 1, 'wat')).to.equal(false);
		});
	});

	describe('msToFrames / framesToMs', () => {
		it('converts ms to frames by rounding ms/40', () => {
			expect(msToFrames(0)).to.equal(0);
			expect(msToFrames(40)).to.equal(1);
			expect(msToFrames(41)).to.equal(1);
			expect(msToFrames(59)).to.equal(1);
			expect(msToFrames(60)).to.equal(2);
		});

		it('converts frames to ms by frames*40', () => {
			expect(framesToMs(0)).to.equal(0);
			expect(framesToMs(2)).to.equal(80);
		});
	});

	describe('getKeyByValue', () => {
		it('returns key for matching value', () => {
			const obj = { A: 'one', B: 'two' };
			expect(getKeyByValue(obj, 'two')).to.equal('B');
		});

		it('returns undefined if no match', () => {
			const obj = { A: 'one', B: 'two' };
			expect(getKeyByValue(obj, 'three')).to.equal(undefined);
		});
	});

	describe('getMediaType', () => {
		it('detects audio by extension', () => {
			expect(getMediaType('x.mp3')).to.equal(mediaType.AUDIO);
		});

		it('detects video by extension', () => {
			expect(getMediaType('x.MKV')).to.equal(mediaType.VIDEO);
		});

		it('detects image by extension', () => {
			expect(getMediaType('/tmp/a.jpeg')).to.equal(mediaType.IMAGE);
		});

		it('returns OTHER for unknown extension', () => {
			expect(getMediaType('x.whatever')).to.equal(mediaType.OTHER);
			expect(getMediaType('noext')).to.equal(mediaType.OTHER);
		});
	});

});
