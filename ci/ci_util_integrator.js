const util = require('./ci_util');

const deploymentUrl = process.env.SERVER_URL;
const accessToken = process.env.GIT_TOKEN;
const reviewAccessToken = process.env.GIT_PR_REVIEW_TOKEN;
const owner = process.env.REPO_OWNER;
const repository = process.env.REPO;
const sourceBranch = process.env.SOURCE_BRANCH;
const targetBranch = process.env.TARGET_BRANCH;
const reviewerLoginName = process.env.REVIEWER_LOGIN_NAME;
module.exports = {
    promoteBranch: () => {
        util.promoteBranch({
            accessToken,
            reviewAccessToken,
            logger,
            reviewerLoginName,
            repository,
            owner,
            sourceBranch,
            targetBranch,
            timeout = 30,
        })
    },

    isThereADelta: () => {
        util.isThereADelta({
            accessToken,
            owner,
            repository,
            sourceBranch,
            targetBranch
        })
    },

    wasNewBuildDeployed: () => {
        util.wasNewBuildDeployed({ deploymentUrl})
    }
}