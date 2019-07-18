pipeline {

    agent any

    tools {nodejs "node"}
    
    stages {
        stage('setup connectors') {
            script{ 
                pullRequest.setCredentials('username', 'password')
            }
        }
        stage('dep install') {
            steps {
                sh 'npm install'
            }
        }
        stage('lint') {
            steps { sh 'npm run lint' }
        }
        stage('unit-test') {
            steps { sh 'npm run test:unit' }
        }
        stage('super-test') {
            steps { sh 'npm run test:supertest' }
        }
        stage('integration-test') {
            steps { sh 'npm run test:integration:local' }
        }
    }
}
