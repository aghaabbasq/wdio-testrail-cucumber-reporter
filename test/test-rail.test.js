const chai = require('chai');
const TestRail = require('../lib/test-rail');
const nock = require('nock');

const {
    expect,
} = chai;


const options = {
    domain: 'test.me',
    username: '',
    password: '',
    projectId: 1,
    suiteId: 1,
    includeAll: false,
};

describe('Test Rail Functions', () => {
    beforeEach(function() {});


    it('should define a Test Rail Object', () => {
        const testRail = new TestRail(options);
        expect(testRail).to.be.a('object');
    });

    it.skip('should add an empty test plan', () => {
        const mock = {
            name: 'System test',
            suite_id: options.suiteId,
        }

        nock(`https://${options.domain}`)
            .post('/index.php?/api/v2/add_plan/1', { name: '', description: "", entries: [] })
            .reply(200, {
                "name": mock.name,
                "entries": []
            });

        const testRail = new TestRail(options);
        resp = testRail.addPlan('', '', []);
        expect(Array.isArray(resp.entries)).to.equal(true);
        expect(resp.name).to.equal(mock.name);
    });

    it.skip('should add a test plan', (done) => {

        const mock = {
            name: 'System test',
            suite_id: [1723, 1724],
        }

        mock.suite_id.forEach(id => {

            nock(`https://${options.domain}`)
                .post('/index.php?/api/v2/add_plan/1', { name: mock.name, description: "", entries: [] })
                .reply(200, {
                    "id": 1,
                    "name": mock.name,
                    "entries": []
                });

            nock(`https://${options.domain}`)
                .get('/index.php?/api/v2/get_plans/1')
                .reply(200, [
                    { "id": 1, "name": "System test 1" }
                ]);

            nock(`https://${options.domain}`)
                .get(`/index.php?/api/v2/get_cases/${options.projectId}&suite_id=${id}`)
                .reply(200, [
                    { "id": id + 1, "title": ".." },
                    { "id": id + 2, "title": ".." }
                ]);

            nock(`https://${options.domain}`)
                .get(`/index.php?/api/v2/get_suite/${id}`, {
                    headers: {
                        "authorization": "Basic Og==",
                        "content-type": "application/json",
                        "accept-encoding": "gzip,deflate"
                    }
                })
                .reply(200, [{
                    "description": "..",
                    "id": id,
                    "name": "Setup & Installation",
                    "project_id": 1,
                    "url": `http://${options.domain}/testrail/index.php?/suites/view/${id}`
                }]);

            nock(`https://${options.domain}`)
                .post(`/index.php?/api/v2/add_plan_entry/1`, {
                    "include_all": options.includeAll,
                    "suite_id": id,
                    "name": "Setup & Installation - undefined - undefined",
                    "description": "",
                    "runs": [],
                    "case_ids": []
                })
                .reply(200, [{
                    "suite_id": 1,
                    "assignedto_id": 1,
                    "include_all": false,
                    "config_ids": [1, 2, 4, 5, 6],
                    "runs": [{
                            "include_all": false,
                            "case_ids": [1, 2, 3],
                            "config_ids": [2, 5]
                        },
                        {
                            "include_all": false,
                            "case_ids": [1, 2, 3, 5, 8],
                            "assignedto_id": 2,
                            "config_ids": [2, 6]
                        }
                    ]
                }]);

        });

        options.suiteId = mock.suite_id;
        const testRail = new TestRail(options);
        testRail.publish(mock.name, '', mock.suite_id, mock.suite_id).then(x => {
            console.log('Done');
            done();

        });
    });

    it.skip('should add results for a test run', () => {
        const testRail = new TestRail(options);
        testRail.publish(
            'module publish test run with 1 result',
            '', [{
                case_id: 273268,
                status_id: 5,
                comment: 'This test failed',
                defects: 'TR-7',
            }],
            done,
        );
    });

    it.skip('should add results for a test plan', (done) => {
        options.suiteId = [1723, 1724]
        const testRail = new TestRail(options);
        testRail.publish(
            'module publish test plan with 2 test runs & 1 result in each run',
            '', [{
                case_id: 273268,
                status_id: 5,
                comment: 'This test failed',
                defects: 'TR-7'

            }, {
                case_id: 272274,
                status_id: 1,
                comment: 'This test passed',
                defects: 'TR-95'

            }],
            done,
        );
    });

    it.skip('should update results for a single run', (done) => {
        options.updateRun = 5149;
        const testRail = new TestRail(options);
        testRail.publish(
            'module publish test run with 1 result',
            '', [{
                "case_id": 272273,
                "status_id": 5,
                "comment": "This test failed",
                "defects": "TR-8",
            }],
            done)
    });

    it.skip('should update results for a single run in a test plan', (done) => {
        options.updatePlan = 5236;
        options.suiteId = [1723, 1724];
        const testRail = new TestRail(options);
        testRail.publish(
            'module publish test run with 1 result',
            '', [{
                "case_id": 272273,
                "status_id": 2,
                "comment": "This test failed",
                "defects": "TR-8",
            }],
            done
        )
    });

    after(() => {

    })
});
