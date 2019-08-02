const fs = require('fs')


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
        return caseIds[0]
    }

    static getCaseIds(suite) {
        var testCaseIdRegExp = /\bT?C(\d+)\b/g;        
        var caseIds = [];

        var contentText = fs.readFileSync(`.${suite.file}`, 'utf8', (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') console.error('does not exist');
                else console.error(err)
                return
            }
        })

        var lineNumber = parseInt(suite.uid.replace(suite.title, ''), 10)

        var scenerioRegExp = /^(Scenario:|Scenario Outline:)/gm
        var blocks = contentText.split(scenerioRegExp)
        var blockSize = blocks.map(x => (x.match(/\n/gm) || []).length)
        var whichBlock = 0
        while (lineNumber > blockSize[whichBlock]) {
            lineNumber -= blockSize[whichBlock]
            whichBlock += 1
        }

        var docRegExp = /""".*?"""/ms
        var docs = blocks[whichBlock].match(docRegExp)

        var m;
        while ((m = testCaseIdRegExp.exec(docs)) !== null) {
            var caseId = parseInt(m[1]);
            caseIds.push(caseId);
        }
        return caseIds
    }

    static updateCaseId(title) {
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
