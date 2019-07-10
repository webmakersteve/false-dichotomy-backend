pipeline {
  agent any

  stages {
    stage('Build') {
      steps {
        sh 'docker build -t webmakersteve/nottoscale-backend:latest .'
      }
    }
    stage('Publish') {
      steps {
        sh 'docker push webmakersteve/nottoscale-backend:latest'
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
      sh 'docker rmi -f webmakersteve/nottoscale-backend:latest || exit 0'
    }
  }
}
