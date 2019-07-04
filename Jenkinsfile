pipeline {
    agent any
    tools {nodejs "node"}
    stages {
        stage('dep install') {
            steps {
                //sh 'export PATH=/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin'
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
