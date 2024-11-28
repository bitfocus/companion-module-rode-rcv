type AnchorPoint = {
    db: number;         // dB value for anchor point
    percentage: number; // percentage for given point (0 to 1)
};

class DBCurve {
    private anchors: AnchorPoint[];

    constructor(anchors: AnchorPoint[]) {
        this.anchors = anchors;
    }

    public toDb(normalized: number): number {
        if (normalized < 0 || normalized > 1) {
            throw new Error("Normalized value must be between 0.0 and 1.0");
        }

        for (let index = 0; index < this.anchors.length - 1; ++index) {
            const currentAnchor = this.anchors[index];
            const nextAnchor = this.anchors[index + 1];
            const deltaDb = nextAnchor.db - currentAnchor.db;
            const deltaPercentage = nextAnchor.percentage - currentAnchor.percentage;

            if (normalized >= currentAnchor.percentage && normalized < nextAnchor.percentage) {
                return currentAnchor.db + deltaDb * (normalized - currentAnchor.percentage) / deltaPercentage;
            }
        }

        // If normalized value is exactly 1, return the highest dB anchor point
        return this.anchors[this.anchors.length - 1].db;
    }

	public toFloat(db: number): number {
        for (let index = 0; index < this.anchors.length - 1; ++index) {
            const currentAnchor = this.anchors[index];
            const nextAnchor = this.anchors[index + 1];
            const deltaDb = nextAnchor.db - currentAnchor.db;
            const deltaPercentage = nextAnchor.percentage - currentAnchor.percentage;

            if (db >= currentAnchor.db && db < nextAnchor.db) {
                return currentAnchor.percentage + deltaPercentage * (db - currentAnchor.db) / deltaDb;
            }
        }

        // If db is above the highest anchor point, return the max percentage (1.0)
        return this.anchors[this.anchors.length - 1].percentage;
    }
}

// Define the anchor points for the fader dB curve
const dbDistributionFader: AnchorPoint[] = [
    { db: -60.0, percentage: 0.0 },
    { db: -48.0, percentage: 1.0 / 10.0 },
    { db: -24.0, percentage: 2.0 / 10.0 },
    { db: -18.0, percentage: 3.0 / 10.0 },
    { db: -12.0, percentage: 4.0 / 10.0 },
    { db: -6.0, percentage: 5.0 / 10.0 },
    { db: -3.0, percentage: 6.0 / 10.0 },
    { db: 0.0, percentage: 6.6 / 10.0 }, // Dead zone around 0 dB
    { db: 0.0, percentage: 7.4 / 10.0 }, // Dead zone around 0 dB
    { db: 1.5, percentage: 8.0 / 10.0 },
    { db: 3.0, percentage: 9.0 / 10.0 },
    { db: 6.0, percentage: 1.0 },
];

// Create the dB curve object
const faderCurve = new DBCurve(dbDistributionFader);

// Function to convert a normalized float to dB using the fader curve and round to 1 decimal place
export function floatToDb(level: number): number {
    const dbValue = faderCurve.toDb(level);
    return Math.round(dbValue * 10) / 10; // Rounds to 1 decimal place
}

// Function to convert a dB value to a normalized float using the fader curve with no rounding.
export function dbToFloat(db: number): number {
    return faderCurve.toFloat(db);
}