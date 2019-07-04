pipeline {
	agent any
	environment {
        REPO_URL = 'https://github.com/sysco-labs-mobile/shop-mobile-bff'
		SERVER_URL = 'https://shopping-mobile-bff.mysysco.com/health'
        GIT_TOKEN = credentials('git-access-token')
        GIT_PR_REVIEW_TOKEN = credentials('git-pr-review-token')
        REPO_OWNER = 'sysco-labs-mobile'
        REPO  = 'shop-mobile-bff'
        SOURCE_BRANCH = 'develop'
        TARGET_BRANCH = 'staging'
        REVIEWER_LOGIN_NAME = 'ANTHONY'
	}
    triggers {
	   // Execute every day at 9pm
       cron('0 21 * * *')
    }
    options {
        skipStagesAfterUnstable()
    }
    stages {
        stage('Check for changes') {
           steps {
               sh 'npm install'
                    script {
                        env.IS_MERGE_REQUIRED = sh(script: '''
                                node -e "require('./ci/ci_util_integrator.js').isThereADelta()"
                            ''', returnStdout: true).trim()

                        if (env.IS_MERGE_REQUIRED == 'false') {
                            echo 'Branch is upto date, end the build'
                            currentBuild.result = 'ABORTED'
                            error('No SCM changes')
                            return
                        }
                    }
                }
        }
        stage('Assert target env') { // to make sure deployed staging is working as expected
            // assert sta by running regression suit from staging branch to make sure staging is still functioning
           steps {
                git url: env.REPO_URL,
                    credentialsId: env.ACCESS_TOKEN,
                    branch: env.TARGET_BRANCH
                    changelog: true
                sh 'npm install'
                sh 'npm test:integration:staging'
           }
        }

        stage('Verify QA') { // assume develop is already deployed to QA
            // verify QA by run regression suit from develop branch
           steps {
                git url: env.REPO_URL,
                    credentialsId: env.ACCESS_TOKEN,
                    branch: env.SOURCE_BRANCH,
                    changelog: true
                sh 'npm install'
                sh 'npm test'
                sh 'npm test:integration:qa'
           }
        }

        stage('Promote develop to staging') {
            steps {
                sh ''' node -e "require('./ci/ci_util_integrator.js').isThereADelta()" '''
                }
        }

        stage('Verify staging promosion') {
            
            steps {
                git url: env.REPO_URL, 
                    credentialsId: env.ACCESS_TOKEN, 
                    branch: env.TARGET_BRANCH, 
                    changelog: true
                sh 'npm install'
                sh 'npm test:integration:qa'
            }
            // todo revert if integration failed,
            // todo send notifications
        }
    }
    post {
        aborted {
            echo 'Build aborted, no scm changes'
        }
    }
}
