const { getAllValues } = require('./values');
const { getConfirmation } = require('./ui');
const { getFilledDocs, saveFiles } = require('./modifyFile');

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