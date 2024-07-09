const { getAllValues } = require('./values');
const { getConfirmation } = require('./ui');
const { getFilledDocs, saveFiles, mergePdfs, openDirectory, getMergedPath } = require('./modifyFile');
const { MERGED_DIR } = require('./utils');

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
    const promises = saveFiles(filledDocs, values.targetType);

    Promise.all(promises)
        .then(() => {
            const filesToMergePaths = filledDocs.map(({ outputPath }) => outputPath + '.pdf').concat(values.readyToMergePaths ?? []);

            const mergedPath = getMergedPath(values.outputName ?? inputPaths[0]);
            mergePdfs(filesToMergePaths, mergedPath);
            openDirectory(MERGED_DIR);
        })
        .catch((err) => console.log('err', err));
}

main();