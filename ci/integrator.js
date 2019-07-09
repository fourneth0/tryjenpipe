const util = require('./util');

const serverHealthUrl = process.env.SERVER_HEALTH_URL;
const accessToken = process.env.GIT_TOKEN;
const reviewAccessToken = process.env.GIT_PR_REVIEW_TOKEN;
const owner = process.env.REPO_OWNER;
const repository = process.env.REPO;
const sourceBranch = process.env.SOURCE_BRANCH;
const targetBranch = process.env.TARGET_BRANCH;
const reviewerLoginName = process.env.REVIEWER_LOGIN_NAME;

// crash the process in case of an error
process.on('unhandledRejection', up => { console.error(up); process.exit(1) })

module.exports = {
    promoteBranch: () => {
        util.promoteBranch({
            accessToken,
            reviewAccessToken,
            reviewerLoginName,
            repository,
            owner,
            sourceBranch,
            targetBranch,
        })
    },

    verifyADeltaPresent: () => {
        util.verifyADeltaPresent({
            accessToken,
            owner,
            repository,
            sourceBranch,
            targetBranch
        })
    },

    waitTillBuildIsDeployed: () => {
        util.waitTillBuildIsDeployed({
            accessToken,
            owner,
            repository,
            serverHealthUrl,
            targetBranch,
        })
    }
}
