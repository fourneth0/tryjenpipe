
/**
 * Wait till deployed version equals to target branch head.
 * 
 * @param {Object} options 
 */
async function waitTillBuildIsDeployed(args) {
    const { 
      accessToken,
      logger = console.log,
      owner,
      repository,
      serverHealthUrl,
      targetBranch, 
      timeoutInMin = 7,
      checkInterval = 30,
    } = args;
    validateInputs(args);
    const api = apiKit({ auth: accessToken });
    const { data: { object: { sha } } } = await api.git.getRef({ owner, repo: repository, ref: `heads/${targetBranch}` }) 
    const revision = sha.substring(0,7);
    assert(revision);
  
    let healthResp;
    const startTime = Date.now();
    do  {
      if (Date.now() - startTime > timeoutInMin * 60 * 1000) {
        throw Error(`Build was not deployed during the expected window of ${timeoutInMin} min.`)
      }
      logger(`wait till deployment complete with revision ${revision} for ${checkInterval} seconds.`);
      await sleep(checkInterval);
      healthResp = await rq.get(serverHealthUrl);
      assert(healthResp.hash);
      logger(`Current deployed version is ${healthResp.hash}, expected ${revision}`)
    } while(revision !== healthResp.hash)
  }

  module.exports = {
    waitTillBuildIsDeployed,
  };