import { expect } from 'chai';

import { floatToDb, dbToFloat } from '../../src/helpers/decibelHelper.js';

describe('decibelHelper', () => {
	describe('floatToDb', () => {
		it('throws if normalized < 0', () => {
			expect(() => floatToDb(-0.0001)).to.throw('Normalized value must be between 0.0 and 1.0');
		});

		it('throws if normalized > 1', () => {
			expect(() => floatToDb(1.0001)).to.throw('Normalized value must be between 0.0 and 1.0');
		});

		it('maps endpoints', () => {
			expect(floatToDb(0.0)).to.equal(-60.0);
			expect(floatToDb(1.0)).to.equal(6.0);
		});

		it('rounds to 1 decimal place', () => {
			const v = floatToDb(0.33);
			expect(v * 10).to.equal(Math.round(v * 10));
		});

		it('respects dead-zone around 0 dB', () => {
			// In your anchors, 0dB occurs between 0.66 and 0.74.
			expect(floatToDb(0.66)).to.equal(0.0);
			expect(floatToDb(0.70)).to.equal(0.0);
			expect(floatToDb(0.739999)).to.equal(0.0);

			// Just after the dead-zone should increase above 0
			expect(floatToDb(0.75)).to.be.greaterThan(0.0);
		});
	});

	describe('dbToFloat', () => {
		it('maps low db to low normalized', () => {
			expect(dbToFloat(-60.0)).to.equal(0.0);
		});

		it('maps high db to 1.0', () => {
			expect(dbToFloat(6.0)).to.equal(1.0);
			expect(dbToFloat(100.0)).to.equal(1.0); // above max anchor clamps to max percentage
		});

		it('inverts approximately (dbToFloat(floatToDb(x)) ~= x) for typical values', () => {
			// Because floatToDb rounds to 1dp, inversion won't be perfect.
			const samples = [0.0, 0.1, 0.2, 0.5, 0.65, 0.8, 1.0];

			for (const x of samples) {
				const db = floatToDb(x);
				const back = dbToFloat(db);

				// allow a small tolerance due to rounding and piecewise curve
				expect(back).to.be.closeTo(x, 0.03);
			}
		});
	});
});