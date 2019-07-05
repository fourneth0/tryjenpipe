const util = require('../ci_util');

it(' check for failures', async () => {
    try {
        await util.isThereADeltaToMerge();
        fail()
    } catch(e) {
        expect(e).toBeDefined();
    }
});

it(' check for success', async () => {
        await util.isThereADeltaToMerge({});
});