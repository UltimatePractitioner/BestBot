import fs from 'fs';
import pdf from 'pdf-parse';

const dataBuffer = fs.readFileSync('sample oneline.pdf');

pdf(dataBuffer).then(function (data) {
    console.log(data.text);
});
