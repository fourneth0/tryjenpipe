pipeline {
	agent any
	environment {
        REPO_URL = 'https://github.com/fourneth0/tryjenpipe.git'
		SERVER_HEALTH_URL = 'https://deployment.com/health'
        GIT_TOKEN = credentials('git-access-token')
        GIT_PR_REVIEW_TOKEN = credentials('git-pr-review-token')
        REPO_OWNER = 'fourneth0'
        REPO  = 'tryjenpipe'
        SOURCE_BRANCH = 'develop'
        TARGET_BRANCH = 'staging'
        REVIEWER_LOGIN_NAME = 'ANTHONY'
	}
    tools { nodejs "node" }
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
                catchError(message: "No Code Changes, skip the build', ", buildResult: 'UNSTABLE') {
                    sh ''' node -e "require('./ci/integrator.js').verifyADeltaPresent()" '''
                }
            }
        }
        stage('Assert target env') {
           steps {
                git url: env.REPO_URL,
                    credentialsId: env.ACCESS_TOKEN,
                    branch: env.TARGET_BRANCH,
                    changelog: true
                sh 'npm install'
                sh 'npm run test:integration:$SOURCE_BRANCH'
           }
        }

        stage('Verify source branch') {
           steps {
                git url: env.REPO_URL,
                    credentialsId: env.ACCESS_TOKEN,
                    branch: env.SOURCE_BRANCH,
                    changelog: true
                sh 'npm install'
                sh 'npm test'
                sh 'npm run test:integration:$TARGET_BRANCH'
           }
        }

        stage('Promote to target environment') {
            steps {
                sh '''node -e "require('./ci/integrator.js').promoteBranch()" '''
            }
        }
        stage('Wait for deployment to complete') {
            steps {
                sh '''node -e "require('./ci/integrator.js').waitTillBuildIsDeployed()" '''
            }
        }
        stage('Verify promoted deployment') {
            steps {
                git url: env.REPO_URL, 
                    credentialsId: env.ACCESS_TOKEN, 
                    branch: env.TARGET_BRANCH, 
                    changelog: true
                sh 'npm install'
                sh 'npm run test:integration:staging'
            }
           // todo revert if integration failed,
        }
    }
    post {
        failure {
            mail to: 'mjin8040@sysco.com',
                subject: "Jenkins Build ${currentBuild.currentResult}: Job ${env.JOB_NAME}",
                body: "${currentBuild.currentResult}: Job ${env.JOB_NAME} build ${env.BUILD_NUMBER}\n More info at: ${env.BUILD_URL}"
        } 
        success {
             mail to: 'mjin8040@sysco.com', 
                  subject: "Jenkins Build ${currentBuild.currentResult}: Job ${env.JOB_NAME}",
                  body: "${currentBuild.currentResult}: Job ${env.JOB_NAME} build ${env.BUILD_NUMBER}\n More info at: ${env.BUILD_URL}"
        }
    }
}
