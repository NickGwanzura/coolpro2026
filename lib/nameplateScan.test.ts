import { describe, expect, it } from 'vitest';
import { fieldConfidence, flattenWords, reconcileSerial } from './nameplateScan';
import { extractNameplateData } from './refrigerantIntelligence';

describe('flattenWords', () => {
    it('walks the blocks tree', () => {
        const blocks = [{ paragraphs: [{ lines: [{ words: [{ text: 'SZ185S4CC', confidence: 91 }, { text: 'x', confidence: 10 }] }] }] }];
        expect(flattenWords(blocks)).toEqual([{ text: 'SZ185S4CC', confidence: 91 }, { text: 'x', confidence: 10 }]);
    });
    it('tolerates empty input', () => {
        expect(flattenWords(null)).toEqual([]);
    });
});

describe('fieldConfidence', () => {
    const words = [
        { text: 'MODEL:', confidence: 95 },
        { text: 'SZ185S4CC', confidence: 88 },
        { text: 'QL11', confidence: 80 },
        { text: '4980907', confidence: 55 },
    ];
    it('uses the word confidence', () => {
        expect(fieldConfidence('SZ185S4CC', words)).toBe(88);
    });
    it('takes the lowest confidence across split words', () => {
        expect(fieldConfidence('QL11 4980907', words)).toBe(55);
    });
    it('is undefined for untraceable or empty values', () => {
        expect(fieldConfidence('ZZZ999', words)).toBeUndefined();
        expect(fieldConfidence(undefined, words)).toBeUndefined();
    });
});

describe('reconcileSerial', () => {
    it('prefers a barcode that nearly matches the OCR serial', () => {
        const result = reconcileSerial('QL114S80', 'SZ185S4CC', ['SZ185S4CC', 'QL114980907']);
        expect(result.source).toBe('barcode');
        expect(result.serial).toBe('QL114980907');
    });
    it('keeps the OCR serial when no barcode agrees, and offers the barcodes', () => {
        const result = reconcileSerial('ABC12345', 'M1', ['ZZZ99999']);
        expect(result).toEqual({ serial: 'ABC12345', source: 'ocr', suggestions: ['ZZZ99999'] });
    });
    it('uses a lone non-model barcode when OCR found no serial', () => {
        expect(reconcileSerial(undefined, 'SZ185S4CC', ['SZ185S4CC', 'QL114980907']).serial).toBe('QL114980907');
    });
    it('does not guess when several barcodes remain', () => {
        const result = reconcileSerial(undefined, undefined, ['A1B2C3', 'D4E5F6']);
        expect(result.serial).toBeUndefined();
        expect(result.suggestions).toHaveLength(2);
    });
});

describe('extractNameplateData', () => {
    it('reads a clean plate', async () => {
        const result = await extractNameplateData('Performer\nSCROLL COMPRESSOR\nMODEL: SZ185S4CC\nSERIAL: QL11 4980907\n');
        expect(result.model).toBe('SZ185S4CC');
        expect(result.serialNumber).toBe('QL11 4980907');
        expect(result.manufacturer).toBe('Performer');
    });
    it('falls back to the model shape when the label is garbled', async () => {
        const result = await extractNameplateData('"8 voDEL: sz185s4cc |\n');
        expect(result.model).toBe('SZ185S4CC');
    });
});
