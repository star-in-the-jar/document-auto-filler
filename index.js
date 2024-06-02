require('dotenv').config();
const fs = require('fs');

const libre = require('libreoffice-convert');
libre.convertAsync = require('util').promisify(libre.convert);

const date = new Date();
const currYear = date.getFullYear();
const currMonthIdx = date.getMonth();
const prevMonthNum = currMonthIdx === 0 ? 12 : currMonthIdx;
const targetYear = prevMonthNum === 12 ? currYear - 1 : currYear;

const targetMonth = prevMonthNum < 10 ? '0' + prevMonthNum : prevMonthNum;
const currSchoolYear = currMonthIdx >= 8 ? `${currYear}/${currYear + 1}` : `${currYear - 1}/${currYear}`;

const inputPaths = process.env.INPUT.split(',');
const args = process.argv.slice(2);

const defaultValues = {
    workedHours: process.env.WORKED_HOURS,
    targetMonth: targetMonth,
    targetYear: targetYear,
    rate: process.env.RATE,
    graduationDate: process.env.GRADUATION_DATE,
    university: process.env.UNIVERSITY,
    faculty: process.env.FACULTY,
    address: process.env.ADDRESS,
    name: process.env.NAME,
    schoolYear: currSchoolYear
};

const values = args.reduce((acc, arg) => {
    const [key, value] = arg.split('=');
    return {
        ...acc,
        [key]: value
    };
}, defaultValues);

const [firstName, lastName] = values.name.split(' ')

console.log(`Files ${inputPaths} will be copied and filled with data: `, replacements);
console.log('You can override any value with argument in format: fieldName=value, for example: ');
console.log('node index.js targetMonth=04');

for (inputPathIdx in inputPaths) {
    const inputPath = inputPaths[inputPathIdx];
    const originFilaName = inputPath.match (/.*_(.*)\.docx/)[1];
    const outputPath = `./${targetYear}_${targetMonth}_${originFilaName}_${firstName}_${lastName}.pdf`;

    convertToPdf(inputPath, outputPath)
    .catch(function (err) {
        console.log(`Error while converting file: ${err}`);
    });
}

async function convertToPdf(inputPath, outputPath) {
    const ext = '.pdf'

    const docxBuf = fs.readFileSync(inputPath);

    let pdfBuf = await libre.convertAsync(docxBuf, ext, undefined);

    fs.writeFileSync(outputPath, pdfBuf);
}

