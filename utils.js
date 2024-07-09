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

const MERGED_DIR = '.\\merged';
const MERGED_SUFFIX = '_merged';

module.exports = {
    getCamelCase,
    MERGED_DIR,
    MERGED_SUFFIX,
}
