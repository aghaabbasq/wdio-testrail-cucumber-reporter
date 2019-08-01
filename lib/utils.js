class Utils {
    /**
     * Search for all applicable test cases
     * @param title
     * @returns {any}
     */
    static tagToCaseId(title) {
        var caseIds = [];
        var testCaseIdRegExp = /\bT?C(\d+)\b/g;
        var m;
        while ((m = testCaseIdRegExp.exec(title)) !== null) {
            var caseId = parseInt(m[1]);
            caseIds.push(caseId);
        }
        if (caseIds.length > 1) console.warn('only 1st matched case id will be used');
        else if (caseIds.length == 0) return
        return caseIds[0];
    }
}

module.exports = Utils;
