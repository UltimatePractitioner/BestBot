// Polyfill for DOMMatrix
global.DOMMatrix = class DOMMatrix {
    constructor() {
        this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
    }
};

const fs = require('fs');
const pdf = require('pdf-parse');

const dataBuffer = fs.readFileSync('sample oneline.pdf');

pdf(dataBuffer).then(function (data) {
    console.log(data.text);
}).catch(err => {
    console.error(err);
});
