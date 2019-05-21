class Utils {
    /**
     * Search for all applicable test cases
     * @param title
     * @returns {any}
     */
    static titleToCaseIds(title) {
        var caseIds = [];
        var testCaseIdRegExp = /\bT?C(\d+)\b/g;
        var m;
        while ((m = testCaseIdRegExp.exec(title)) !== null) {
            var caseId = parseInt(m[1]);
            caseIds.push(caseId);
        }
        return caseIds;
    }
}

module.exports = Utils;
