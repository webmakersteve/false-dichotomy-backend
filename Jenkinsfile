@Library('webmakersteve') _

publishedImages = [
  "575393002463.dkr.ecr.us-west-2.amazonaws.com/nottoscale/backend"
]

pipeline {
  agent any

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
      steps {
        withVersion {
          script {
            dockerHelper.publish(this, publishedImages)
          }
        }
      }
    }
    stage('Deploy') {
      when {
        branch 'master'
      }
      steps {
        sh 'cat packaging/manifest.yml | sed "s/{{COMMIT_HASH}}/${GIT_COMMIT:-local}/g" | kubectl apply -f -'
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
