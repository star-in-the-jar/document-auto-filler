const readlineSync = require('readline-sync');

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

module.exports = {
    getConfirmation
}
