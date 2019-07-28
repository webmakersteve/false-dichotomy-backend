@Library('webmakersteve') _

publishedImages = [
  "575393002463.dkr.ecr.us-west-2.amazonaws.com/nottoscale/backend"
]

pipeline {
  agent any

  triggers {
    githubPush()
  }

  stages {
    stage('Build') {
      steps {
        withVersion {
          script {
            dockerHelper.build(this, publishedImages)
          }
        }
      }
    }

    stage('Publish') {
      when {
        branch 'master'
      }

      steps {
        withVersion {
          script {
            dockerHelper.publish(this, publishedImages)
          }
        }
      }
    }
  }
  post {
    always {
      withVersion {
        script {
          dockerHelper.clean(this, publishedImages)
        }
      }
    }
  }
}
