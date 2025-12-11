import fs from 'fs';
import pdf from 'pdf-parse';

const dataBuffer = fs.readFileSync('White Plains_S1_Oneline_107_Official_092525.pdf');

pdf(dataBuffer).then(function (data) {
    console.log('Number of pages:', data.numpages);
    console.log('Info:', data.info);

    fs.writeFileSync('debug_output.txt', data.text);
    console.log('Text extracted to debug_output.txt');
}).catch(err => {
    console.error('Error extracting text:', err);
});
