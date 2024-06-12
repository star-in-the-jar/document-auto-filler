const Docxtemplater = require("docxtemplater");
const fs = require('fs');
const path = require('path');
const PizZip = require("pizzip");
const libre = require('libreoffice-convert');
const pdfMerge = require('easy-pdf-merge');
libre.convertAsync = require('util').promisify(libre.convert);
const removeDiacritics = require('diacritics').remove;
const fsPromises = require('fs').promises;

const saveFiles = (docs, targetType) => {
    const promises = docs.map(({ doc, outputPath }) => {
        return new Promise(async (resolve, reject) => {
            console.log('Saving file: ', outputPath);
            const normalizedOutputPath = removeDiacritics(outputPath)

            const buf = doc.getZip().generate({
                type: "nodebuffer",
                compression: "DEFLATE",
            });

            try {
                await fsPromises.writeFile(path.resolve(__dirname, `${normalizedOutputPath}.docx`), buf);

                if (targetType === 'pdf') {
                    try {
                        await convertToPdf(normalizedOutputPath + '.docx', outputPath + '.pdf');
                        console.log('PDF saved: ', `${outputPath}.pdf`);
                        await fsPromises.unlink(path.resolve(__dirname, `${normalizedOutputPath}.docx`));
                    } catch (err) {
                        console.log(`Error while converting file: ${err}`);
                    }
                } else if (targetType === 'docx') {
                    console.log('DOCX saved: ', `${normalizedOutputPath}.docx`);
                } else {
                    console.log("Unsupported file type. Supported types are: pdf, docx. Specify them in .env file e.g. TARGET_TYPE='pdf'");
                }
                resolve();
            } catch (err) {
                console.log('Error while saving file: ', err);
                reject(err);
            }
        });
    });
    return promises;
}

const mergePdfs = (filePaths) => {
    pdfMerge(filePaths, './certificates/all-certificates.pdf', function (err) {
        if (err)
            return console.log(err);

        console.log('Successfully merged documents into one, easy to print ./certificates/all-certificates.pdf');
    });
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

async function convertToPdf(inputPath, outputPath) {
    const ext = '.pdf'

    const docxBuf = fs.readFileSync(inputPath);

    let pdfBuf = await libre.convertAsync(docxBuf, ext, undefined);

    fs.writeFileSync(outputPath, pdfBuf);
}

const getFilledPages = (inputPath, names) => {
    const originFilaName = inputPath.match(/.*_(.*)\.docx/)[1];

    const content = fs.readFileSync(
        path.resolve(inputPath),
        "binary"
    );

    const filledDocs = names.map((name) => {
        const [firstName, lastName] = name.split(' ');
        const outputPath = `./certificates/${originFilaName}_${firstName}_${lastName}`;

        const zip = new PizZip(content);

        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        doc.render({ firstName, lastName });

        return {
            doc,
            outputPath,
        };
    });

    return filledDocs;
}

module.exports = {
    saveFiles,
    getFilledDocs,
    getFilledPages,
    mergePdfs
};
