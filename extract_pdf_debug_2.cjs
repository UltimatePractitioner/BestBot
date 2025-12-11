// Polyfill for DOMMatrix
global.DOMMatrix = class DOMMatrix {
    constructor() {
        this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
    }
};

const fs = require('fs');
const pdfLib = require('pdf-parse');

console.log('Type of PDFParse:', typeof pdfLib.PDFParse);
if (typeof pdfLib.PDFParse === 'function') {
    console.log('Trying PDFParse function...');
    const dataBuffer = fs.readFileSync('sample oneline.pdf');
    try {
        // It might be a class or a function
        const result = pdfLib.PDFParse(dataBuffer);
        if (result && result.then) {
            result.then(data => console.log(data.text));
        } else {
            console.log('Result:', result);
        }
    } catch (e) {
        console.error('Error calling PDFParse:', e);
    }
}
