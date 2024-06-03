const Docxtemplater = require("docxtemplater");
const fs = require('fs');
const path = require('path');
const PizZip = require("pizzip");
const libre = require('libreoffice-convert');
libre.convertAsync = require('util').promisify(libre.convert);
const removeDiacritics = require('diacritics').remove;

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

module.exports = {
    saveFiles,
    getFilledDocs
};
