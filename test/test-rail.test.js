const chai = require('chai');
const TestRail = require('../lib/test-rail');

const {
  expect,
} = chai;
const options = {
  domain: '',
  username: '',
  password: '',
  projectId: -1,
  suiteId: -1,
  includeAll: false,
};

describe('Test Rail Functions', () => {
  it('should define a Test Rail Object', () => {
    const testRail = new TestRail(options);
    expect(testRail).to.be.a('object');
  });

  it.skip('should add an empty test plan', () => {
    const testRail = new TestRail(options);
    testRail.addPlan('module test', '', []);
  });

  it.skip('should add a test plan', () => {
    options.suiteId = [1723, 1724];
    const testRail = new TestRail(options);
    testRail.publish('module publish test plan', '', [], done);
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

  it.skip('should add results for a test plan', () => {
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

  it.skip('should update results for a single run', () => {
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

  it.skip('should update results for a single run in a test plan', () => {
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
      )
  });

  after(() => {

  })
});