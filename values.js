const fs = require('fs');
const path = require('path');
const { getCamelCase } = require('./utils');

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

const getEnvValues = () => {
    const env = fs.readFileSync(path.resolve('.env'), 'utf8').split('\n')
    const envValues = env.reduce((acc, line, idx) => {
        if (line === '' || (line && line[0] === '#')) return acc;
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

module.exports = {
    getAllValues,
    getEnvValues,
    getArgsValues
}