const util = require('./ci_util');

const deploymentUrl = process.env.SERVER_URL;
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

    isThereADeltaToMerge: () => {
        util.isThereADeltaToMerge({
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

util.promoteBranch({
    accessToken: 'fe24a51c533a0666ff00c7342f95089faec84e3b',
            reviewAccessToken: '77f1454fd2460ca5545fead4eca6987309a4c863',
            reviewerLoginName: 'mddhammi',
            repository: 'tryjenpipe',
            owner: 'fourneth0',
            sourceBranch: 'develop',
            targetBranch: 'staging',
})
