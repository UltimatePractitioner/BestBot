// Polyfill for DOMMatrix
global.DOMMatrix = class DOMMatrix {
    constructor() {
        this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
    }
};

const fs = require('fs');
const pdfLib = require('pdf-parse');

console.log('Type of pdfLib:', typeof pdfLib);
console.log('Keys:', Object.keys(pdfLib));
if (typeof pdfLib !== 'function') {
    if (pdfLib.default) {
        console.log('Has default export');
        const pdf = pdfLib.default;
        const dataBuffer = fs.readFileSync('sample oneline.pdf');
        pdf(dataBuffer).then(function (data) {
            console.log(data.text);
        }).catch(console.error);
    } else {
        console.log('No default export found');
    }
} else {
    const dataBuffer = fs.readFileSync('sample oneline.pdf');
    pdfLib(dataBuffer).then(function (data) {
        console.log(data.text);
    }).catch(console.error);
}
