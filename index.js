const fs = require('fs');
const path = require('path');
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const readlineSync = require('readline-sync');
const libre = require('libreoffice-convert');
const removeDiacritics = require('diacritics').remove;
libre.convertAsync = require('util').promisify(libre.convert);

const getAllValues = () => {
    const date = new Date();
    const currYear = date.getFullYear();
    const currMonthIdx = date.getMonth();
    const prevMonthNum = currMonthIdx === 0 ? 12 : currMonthIdx;
    const targetYear = prevMonthNum === 12 ? currYear - 1 : currYear;
    const targetMonth = prevMonthNum < 10 ? '0' + prevMonthNum : prevMonthNum;
    const currMonthFirstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const prevMonthLastDay = new Date(currMonthFirstDay - 1).getDate();
    const targetDay = prevMonthLastDay.toString()
    const currSchoolYear = currMonthIdx >= 8 ? `${currYear}/${currYear + 1}` : `${currYear - 1}/${currYear}`;

    const defaultValues = {
        targetDate: `${targetYear}-${targetMonth}-${targetDay}`,
        targetYear: targetYear.toString(),
        targetMonth: targetMonth,
        targetDay: targetDay,
        schoolYear: currSchoolYear,
        ...getEnvValues(),
        ...getArgsValues()
    };

    return defaultValues;
}




const getCamelCase = (text, separator) => {
    if (!text.includes(separator)) return text.toLowerCase();
    const words = text.split(separator).map(word => word.toLowerCase());
    const camelCase = words.reduce((acc, word, idx) => {
        return acc + (
            idx === 0
                ? word
                : word.charAt(0).toUpperCase() + word.slice(1)
        );
    }, '');
    return camelCase;
}

const getEnvValues = () => {
    const env = fs.readFileSync(path.resolve('.env'), 'utf8').split('\n')
    const envValues = env.reduce((acc, line, idx) => {
        const [key, value] = line.split('=')
        const formattedKey = getCamelCase(key, '_');
        const rawValue = value.replace(/['"]/g, '');

        return {
            ...acc,
            [formattedKey]: rawValue
        };
    }, {});

    return envValues;
}

const getArgsValues = (values) => {
    const args = process.argv.slice(2);

    const argsValues = args.reduce((acc, arg) => {
        const [key, value] = arg.split('=');
        return {
            ...acc,
            [key]: value
        };
    }, values);

    return argsValues;
}

const getConfirmation = (inputPaths, values) => {
    console.log(`Files ${inputPaths} will be copied and filled with data: `, values);

    process.stdout.write('');
    const userInput = readlineSync.question('Do you want to proceed? (Y/n): ');
    if (userInput === '' || userInput === 'y' || userInput === 'Y') {
        console.log('Proceeding...')
        return true;
    } else if (userInput === 'n') {
        console.log('Aborting...')
        console.log("⚙️ You can set your own values in .env file:");
        console.log("\tUse the following format: FIELD_NAME='value'");
        console.log("\tFor example: TARGET_MONTH='04'");
        console.log('⚙️ You can override any value with argument:');
        console.log("\tUse the following format: fieldName=value");
        console.log("\tFor example: targetMonth=04");
        return false;
    }

    process.stdout.write('Please type "y" for yes, confirm with Enter or or "n" for no: ');
    getConfirmation(inputPaths, values);
}

const getFilledDocs = (inputPaths, values) => {
    const filledDocs = inputPaths.map((inputPath) => {
        const { targetYear, targetMonth, firstName, lastName } = values;
        const originFilaName = inputPath.match(/.*_(.*)\.docx/)[1];
        const outputPath = `${targetYear}_${targetMonth}_${originFilaName}_${firstName}_${lastName}`;

        const content = fs.readFileSync(
            path.resolve(inputPath),
            "binary"
        );

        const zip = new PizZip(content);

        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        doc.render(values);

        return {
            doc,
            outputPath,
        };
    });

    return filledDocs;
}

const saveFiles = (docs, targetType) => {
    docs.forEach(({ doc, outputPath }) => {
        const normalizedOutputPath = removeDiacritics(outputPath)

        const buf = doc.getZip().generate({
            type: "nodebuffer",
            compression: "DEFLATE",
        });

        fs.writeFileSync(path.resolve(__dirname, `${normalizedOutputPath}.docx`), buf);

        if (targetType === 'pdf') {
            convertToPdf(normalizedOutputPath + '.docx', outputPath + '.pdf')
                .catch(function (err) {
                    console.log(`Error while converting file: ${err}`);
                })
                .then(() => {
                    console.log('PDF saved: ', `${outputPath}.pdf`)
                    fs.unlinkSync(path.resolve(__dirname, `${normalizedOutputPath}.docx`));
                })
        } else if (targetType === 'docx') {
            console.log('DOCX saved: ', `${normalizedOutputPath}.docx`)
        } else {
            console.log("Unsupported file type. Supported types are: pdf, docx. Specyfiy them in .env file e.g. TARGET_TYPE='pdf'")
        }
    });
}

async function convertToPdf(inputPath, outputPath) {
    const ext = '.pdf'

    const docxBuf = fs.readFileSync(inputPath);

    let pdfBuf = await libre.convertAsync(docxBuf, ext, undefined);

    fs.writeFileSync(outputPath, pdfBuf);
}

const main = () => {
    const values = getAllValues();
    const { templatePaths } = values;
    if (!templatePaths) {
        console.log("Please provide templatePaths in .env file separated by comma e.g. TEMPLATE_PATHS='template_work.docx,template_student.docx");
        return;
    }
    const inputPaths = templatePaths.split(',');
    const shouldContinue = getConfirmation(inputPaths, values);

    if (!shouldContinue) {
        return;
    }
    const filledDocs = getFilledDocs(inputPaths, values);
    saveFiles(filledDocs, values.targetType);
}

main();