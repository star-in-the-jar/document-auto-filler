const { getAllValues } = require('./values');
const { getConfirmation } = require('./ui');
const { getFilledDocs, saveFiles, getFilledPages, mergePdfs } = require('./modifyFile');

const main = () => {
    const values = getAllValues();
    const { templatePaths } = values;
    if (!templatePaths) {
        console.log("Please provide templatePaths in .env file separated by comma e.g. TEMPLATE_PATHS='template_work.docx,template_student.docx");
        return;
    }
    const inputPaths = templatePaths.split(',');
    // const shouldContinue = getConfirmation(inputPaths, values);

    // if (!shouldContinue) {
    //     return;
    // }
    // const filledDocs = getFilledDocs(inputPaths, values);
    // saveFiles(filledDocs, values.targetType);

    // -------------- certs -------------
    const names = values.names.split(',');
    const filledCerts = getFilledPages(values.certTemplatePath, names)
    const promises = saveFiles(filledCerts, values.targetType)

    Promise.all(promises)
        .then(() => {
            const filesToMergePaths = filledCerts.map(({ outputPath }) => outputPath + '.pdf');
            mergePdfs(filesToMergePaths);
        })
        .catch((err) => console.log('err', err));
}

main();