const fs = require('fs')


class Utils {
    /**
     * Search for all applicable test cases
     * @param title
     * @returns {any}
     */

    static getCaseIds(suite) {
        const testCaseIdRegExp = /\bT?C(\d+)\b/g
        const caseIds = []

        const contentText = fs.readFileSync(`.${suite.file}`, 'utf8', (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') console.error('does not exist')
                else console.error(err)
            }
        })

        let lineNumber = parseInt(suite.uid.replace(suite.title, ''), 10)

        const scenerioRegExp = /^(Scenario:|Scenario Outline:)/gm
        const blocks = contentText.split(scenerioRegExp)
        const blockSize = blocks.map(x => (x.match(/\n/gm) || []).length)
        let whichBlock = 0
        while (lineNumber > blockSize[whichBlock]) {
            lineNumber -= blockSize[whichBlock]
            whichBlock += 1
        }

        const docRegExp = /""".*?"""/ms
        const docs = blocks[whichBlock].match(docRegExp)

        let m
        while ((m = testCaseIdRegExp.exec(docs)) !== null) {
            const caseId = parseInt(m[1], 10)
            caseIds.push(caseId)
        }
        return caseIds
    }
}

module.exports = Utils
