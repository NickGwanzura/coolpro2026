// Pure helpers for the nameplate scanner: per-field OCR confidence and barcode reconciliation.

export interface OcrWord {
    text: string;
    confidence: number;
}

export type FieldKey = 'manufacturer' | 'model' | 'serialNumber' | 'refrigerantCode';
export type FieldConfidence = Partial<Record<FieldKey, number>>;

export const LOW_CONFIDENCE = 70;

const normalize = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, '');

/** Flatten Tesseract's blocks > paragraphs > lines > words tree into a word list. */
export function flattenWords(blocks: unknown): OcrWord[] {
    const words: OcrWord[] = [];
    const walk = (node: unknown) => {
        if (!node || typeof node !== 'object') return;
        const record = node as Record<string, unknown>;
        if (typeof record.text === 'string' && typeof record.confidence === 'number' && !('paragraphs' in record) && !('lines' in record) && !('words' in record)) {
            words.push({ text: record.text, confidence: record.confidence });
            return;
        }
        for (const key of ['paragraphs', 'lines', 'words']) {
            const children = record[key];
            if (Array.isArray(children)) children.forEach(walk);
        }
    };
    if (Array.isArray(blocks)) blocks.forEach(walk);
    return words;
}

/**
 * Confidence (0-100) of a detected value: the lowest confidence among the OCR words that
 * make it up. Undefined when the value cannot be traced to any word, which the UI treats as
 * "check this one".
 */
export function fieldConfidence(value: string | undefined, words: OcrWord[]): number | undefined {
    if (!value) return undefined;
    const target = normalize(value);
    if (!target) return undefined;

    const parts = words
        .map((word) => ({ ...word, key: normalize(word.text) }))
        .filter((word) => word.key.length > 0);

    // Whole value inside a single word.
    const single = parts.find((word) => word.key.includes(target));
    if (single) return single.confidence;

    // Value split across adjacent words (e.g. "QL11" + "4980907").
    for (let start = 0; start < parts.length; start++) {
        let joined = '';
        let min = 100;
        for (let end = start; end < parts.length && joined.length < target.length; end++) {
            joined += parts[end].key;
            min = Math.min(min, parts[end].confidence);
            if (joined.includes(target)) return min;
        }
    }
    return undefined;
}

export function editDistance(a: string, b: string): number {
    const row = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
        let prev = row[0];
        row[0] = i;
        for (let j = 1; j <= b.length; j++) {
            const tmp = row[j];
            row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
            prev = tmp;
        }
    }
    return row[b.length];
}

export interface SerialDecision {
    serial: string | undefined;
    source: 'barcode' | 'ocr' | 'none';
    /** Barcode values that were not used, offered to the user as one-tap suggestions. */
    suggestions: string[];
}

/**
 * Decide the serial from OCR text and decoded barcodes. A barcode is trusted when it is a
 * near match for the OCR serial (the OCR was just slightly off), or when OCR found nothing.
 * Barcodes that equal the model number are excluded, since plates usually barcode both.
 */
export function reconcileSerial(ocrSerial: string | undefined, model: string | undefined, barcodes: string[]): SerialDecision {
    const modelKey = model ? normalize(model) : '';
    const candidates = [...new Set(barcodes.map((value) => value.trim()).filter(Boolean))]
        .filter((value) => normalize(value) !== modelKey);

    if (ocrSerial) {
        const ocrKey = normalize(ocrSerial);
        // Allow for OCR truncating or misreading a few characters of a longer barcode value.
        const near = candidates.find((value) => {
            const key = normalize(value);
            return editDistance(key, ocrKey) <= Math.max(2, Math.floor(key.length * 0.4));
        });
        if (near) {
            return { serial: near, source: 'barcode', suggestions: candidates.filter((value) => value !== near) };
        }
        return { serial: ocrSerial, source: 'ocr', suggestions: candidates };
    }

    if (candidates.length === 1) {
        return { serial: candidates[0], source: 'barcode', suggestions: [] };
    }
    return { serial: undefined, source: 'none', suggestions: candidates };
}
