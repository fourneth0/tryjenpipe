//
// This code snippet is to create a PR an approve it if build-status is success.
// All the functions are made pure, to improve the readability.
//
// execute this from command line using --> node -e "require('./ci/promote_branch')({ reviewerLoginName: ''})"
//
/* eslint-disable no-console, no-use-before-define, no-await-in-loop */
const assert = require('assert').strict;
const apiKit = require('@octokit/rest'); // eslint-disable-line import/no-extraneous-dependencies
const rq = require('request-promise');
/**
 * Promote the given branch upon build success.
 */
async function promoteBranch(args) {
  validateInputs(args);
  const {
    reviewAccessToken,
    accessToken,
    reviewerLoginName,
    owner,
    repository,
    sourceBranch,
    targetBranch,
    timeout = 30,
    logger = console.log,
  } = args;

  const prName = createPrName({ sourceBranch, targetBranch });

  const api = apiKit({ auth: accessToken });
  const reviewAPI = apiKit({ auth: reviewAccessToken });

  logger(`Starting branch promotion. PR name: ${prName}`);

  const { number: pullNumber, head: { sha: headSha }, url }
    = await createANewPR({ api, logger, owner, prName, repository, sourceBranch, targetBranch });
  await waitTillBuildComplete({ api, headSha, logger, owner, repository, timeout });
  const isBuildSuccess = await isJenkinsBuildSuccess({ api, headSha, logger, owner, repository });

  if (isBuildSuccess) {
    await approveAndMerge({ headSha, logger, owner, pullNumber, repository, reviewAPI, reviewerLoginName, sourceBranch, targetBranch });
  } else {
    logger('Promotion failed. build status is not success');
    throw Error(`${prName} promotion failed: ci build had failed ${url}`);
  }
};

/**
 * returns true if there is a different between given branch
 */
async function isThereADeltaToMerge(args) {
  const {
    accessToken,
    owner,
    repository,
    sourceBranch,
    targetBranch
  } = args;
  validateInputs(args);
  const api = apiKit({ auth: accessToken });
  const response = await api.repos.compareCommits({
    base: sourceBranch,
    head: targetBranch,
    owner: owner,
    repo: repository,
  });
  return response.data.status !== 'identical';
}

/**
 * Check whether the deployment is completed.
 */
async function wasNewBuildDeployed(args) {
  const { deploymentUrl } = args;
  validateInputs()
  const resp = await rq.get(deploymentUrl);
  return resp.timestamp > (Date.now() - (10 * 60 * 1000)); // deployed during last 10 mins
}

//
// private functions
//

async function approveAndMerge({ headSha, logger, owner, pullNumber, repository, reviewAPI, reviewerLoginName, sourceBranch, targetBranch }) {
  logger('Status check success, going to merge the PR');
  await approvePR({ logger, owner, pullNumber, repository, reviewAPI, reviewerLoginName });
  await mergePR({ headSha, logger, owner, pullNumber, repository, reviewAPI, sourceBranch, targetBranch });
}

function validateInputs(args) {
  assert(args);
  assert(typeof args === 'object', 'expect as an object but was ' + JSON.stringify(args));
  Object.keys(args).forEach(k => {
    assert(args[k], `expect ${k}, but was ${args[k]}`)
  })
}

function createPrName({ sourceBranch, targetBranch }) {
  const dateSuffix = new Date().toISOString()
    .replace('T', '_')
    .replace(/-/g, '_')
    .replace(/:/gi, '_')
    .slice(0, 16);
  return `promoting ${sourceBranch} to ${targetBranch} ${dateSuffix}`;
}
async function sleep(seconds) {
  return new Promise((resolve) => { setTimeout(resolve, seconds * 1000); });
}

async function waitTillBuildComplete({
  api,
  headSha,
  logger,
  owner,
  repository,
  timeout
}) {
  let isBuildCompleted = await isJenkinsBuildCompleted({ api, headSha, logger, owner, repository });
  while (!isBuildCompleted) {
    logger(`build is not completed awaiting ${timeout} seconds`);
    await sleep(timeout);
    isBuildCompleted = await isJenkinsBuildCompleted({ api, headSha, logger, owner, repository });
  }
  logger('build status complete for sha', headSha);
}

async function createANewPR({
  api,
  logger,
  owner,
  prName,
  repository: repo,
  sourceBranch,
  targetBranch
}) {
  logger("create pr with name: ", prName);
  const existingPRs = await api.pulls.list({
    owner,
    repo,
    head: sourceBranch,
    base: targetBranch
  });

  if (existingPRs.data.length > 0) {
    const pr = existingPRs.data[0];
    logger( `Closing existing PR ${ pr.number }, to create a PR with common name pattern`);
    await api.pulls.update({
      owner,
      repo,
      pull_number: pr.number,
      state: 'closed',
    });
  }
  const resp = await api.pulls.create({
    owner,
    repo,
    title: prName,
    head: sourceBranch,
    base: targetBranch
  });
  logger( `PR(${resp.data.id}) ${prName}'s head is at ${resp.data.head.sha}`);
  return resp.data;
}

async function isJenkinsBuildCompleted({
  api,
  headSha,
  logger,
  owner,
  repository,
}) {
  const statuses = await api.repos.listStatusesForRef({ 
    owner, repo: repository, ref: headSha,
  });
  const hasBuildStatusRecorded = statuses.data.length > 0;
  if (!hasBuildStatusRecorded) {
    console.log('Couldnt find build status for sha', headSha)
    return false;
  }
  logger(`build status for sha ${headSha} is`, statuses);
  return statuses.data[0].state !== 'pending';
}

async function isJenkinsBuildSuccess({
  api,
  headSha,
  logger,
  owner,
  repository,
}) {
  const statuses = await api.repos.listStatusesForRef({ 
    owner, repo: repository, ref: headSha,
  });
  logger('Build status is ', statuses.data[0].state);
  return statuses.data[0].state === 'success';
}

async function approvePR({
  logger,
  owner,
  pullNumber,
  repository,
  reviewAPI,
  reviewerLoginName,
}) {
  const existingReview = await findExistingReview({ 
    owner, pullNumber, repository, reviewAPI, reviewerLoginName 
  });
  let reviewId;
  if (!existingReview) {
    // https://developer.github.com/v3/pulls/reviews/#create-a-pull-request-review
    logger('creating a review');
    const review = await reviewAPI.pulls.createReview({ 
      owner, repo: repository, pull_number: pullNumber,
    });
    reviewId = review.data.id;
    logger('a review created with id', reviewId);
  } else {
    logger('There is an existing review', existingReview);
    reviewId = existingReview.id;
    if (existingReview.state === 'APPROVED') {
      logger('PR is already approved');
      return;
    }
  }
  logger(`Approving the PR ${pullNumber}. ReviewId: ${reviewId}`);
  await reviewAPI.pulls.submitReview({ 
    owner, repo: repository, pull_number: pullNumber, review_id: reviewId, event: 'APPROVE',
  });
}

async function findExistingReview({
  owner,
  pullNumber,
  repository,
  reviewAPI,
  reviewerLoginName,
}) {
    try {
      const existingReviews = await reviewAPI.pulls.listReviews({ owner, repo: repository, pull_number: pullNumber });
      const reviews = existingReviews.data.filter(r => r.user.login === reviewerLoginName);
      if (reviews.length !== 0) {
        return reviews[0];
      }
      return undefined;
    } catch(e) {
      if (e.status === 404) {
        return undefined
      }
      throw e;
    }
}

async function mergePR({
  headSha,
  logger,
  owner,
  pullNumber,
  repository,
  reviewAPI,
  sourceBranch,
  targetBranch,
}) {
  await reviewAPI.pulls.merge({
    owner,
    repo: repository,
    pull_number: pullNumber,
    sha: headSha,
    commit_title: `Promoting ${sourceBranch} to ${targetBranch}`,
    commit_message: `Promoting ${sourceBranch} to ${targetBranch}`
  });
  logger('PR merged', pullNumber, headSha);
}



module.exports = {
  isThereADeltaToMerge,
  promoteBranch,
  wasNewBuildDeployed,
};
