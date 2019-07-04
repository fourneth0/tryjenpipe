JENKINS_URL=http://localhost:49001
JENKINS_CRUMB=`curl "$JENKINS_URL/crumbIssuer/api/xml?xpath=concat(//crumbRequestField,\":\",//crumb)"`
curl -H $JENKINS_CRUMB -F "jenkinsfile=<$1" $JENKINS_URL/pipeline-model-converter/validate