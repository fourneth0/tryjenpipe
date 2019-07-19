const util = require('../ci_util');

it(' check for failures', async () => {
    try {
        await util.verifyChanges();
        fail()
    } catch(e) {
        expect(e).toBeDefined();
    }
});

it(' check for success', async () => {
        await util.verifyChanges({});
});