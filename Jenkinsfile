pipeline {
    agent any
    tools { nodejs 'NodeJS23' }
    environment {
        SCANNER_HOME = tool 'sonar-scanner'
        DOCKER_USERNAME = 'mehmoodhaq7'
    }
    stages {
        stage('Git Checkout') {
            steps {
                git branch: 'main',
                url: 'https://github.com/mehmoodhaq7/incident-log.git'
            }
        }
        stage('Frontend Compilation') {
            steps {
                dir('client') {
                    sh 'find . -name "*.js" -not -path "./node_modules/*" -exec node --check {} +'
                }
            }
        }
        stage('Backend Compilation') {
            steps {
                dir('api') {
                    sh 'find . -name "*.js" -not -path "./node_modules/*" -exec node --check {} +'
                }
            }
        }
        stage('GitLeaks Scan') {
            steps {
                sh 'gitleaks detect --source ./client --exit-code 1'
                sh 'gitleaks detect --source ./api --exit-code 1'
            }
        }
        stage('NPM Audit') {
            steps {
                dir('api') { sh 'npm audit --audit-level=high || true' }
                dir('client') { sh 'npm audit --audit-level=high || true' }
            }
        }
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('sonar') {
                    sh '''$SCANNER_HOME/bin/sonar-scanner \
                        -Dsonar.projectName=incident-log \
                        -Dsonar.projectKey=incident-log \
                        -Dsonar.sources=.'''
                }
            }
        }
        stage('Quality Gate Check') {
            steps {
                timeout(time: 1, unit: 'HOURS') {
                    waitForQualityGate abortPipeline: false,
                    credentialsId: 'sonar-token'
                }
            }
        }
        stage('Trivy FS Scan') {
            steps {
                sh 'trivy fs --format table -o fs-report.html .'
            }
        }
        stage('Checkov IaC Scan') {
            steps {
                sh 'sudo checkov -d terraform/ --output cli --soft-fail || true'
                sh 'sudo checkov -d k8s/ --output cli --soft-fail || true'
            }
        }
        stage('Build & Tag Backend Image') {
            steps {
                script {
                    withDockerRegistry(credentialsId: 'docker-creds') {
                        dir('api') {
                            sh 'docker build -t $DOCKER_USERNAME/incident-log-backend:$BUILD_NUMBER .'
                            sh 'docker tag $DOCKER_USERNAME/incident-log-backend:$BUILD_NUMBER $DOCKER_USERNAME/incident-log-backend:latest'
                        }
                    }
                }
            }
        }
        stage('Trivy Backend Image Scan') {
            steps {
                sh 'trivy image --format table -o backend-image-report.html $DOCKER_USERNAME/incident-log-backend:$BUILD_NUMBER'
            }
        }
        stage('Push Backend Image') {
            steps {
                script {
                    withDockerRegistry(credentialsId: 'docker-creds') {
                        sh 'docker push $DOCKER_USERNAME/incident-log-backend:$BUILD_NUMBER'
                        sh 'docker push $DOCKER_USERNAME/incident-log-backend:latest'
                    }
                }
            }
        }
        stage('Build & Tag Frontend Image') {
            steps {
                script {
                    withDockerRegistry(credentialsId: 'docker-creds') {
                        dir('client') {
                            sh 'docker build -t $DOCKER_USERNAME/incident-log-frontend:$BUILD_NUMBER .'
                            sh 'docker tag $DOCKER_USERNAME/incident-log-frontend:$BUILD_NUMBER $DOCKER_USERNAME/incident-log-frontend:latest'
                        }
                    }
                }
            }
        }
        stage('Trivy Frontend Image Scan') {
            steps {
                sh 'trivy image --format table -o frontend-image-report.html $DOCKER_USERNAME/incident-log-frontend:$BUILD_NUMBER'
            }
        }
        stage('Push Frontend Image') {
            steps {
                script {
                    withDockerRegistry(credentialsId: 'docker-creds') {
                        sh 'docker push $DOCKER_USERNAME/incident-log-frontend:$BUILD_NUMBER'
                        sh 'docker push $DOCKER_USERNAME/incident-log-frontend:latest'
                    }
                }
            }
        }
        stage('Approval for Production') {
            steps {
                timeout(time: 1, unit: 'HOURS') {
                    input message: 'Deploy to Production?',
                          ok: 'Deploy',
                          submitter: 'admin'
                }
            }
        }
        stage('Update CD Repo') {
            steps {
                withCredentials([string(credentialsId: 'github-token', variable: 'GH_TOKEN')]) {
                    sh '''
                        rm -rf incident-log-cd
                        git clone https://mehmoodhaq7:${GH_TOKEN}@github.com/mehmoodhaq7/incident-log-cd.git
                        cd incident-log-cd
                        sed -i "s|mehmoodhaq7/incident-log-backend:.*|mehmoodhaq7/incident-log-backend:${BUILD_NUMBER}|g" k8s-prod/backend.yaml
                        sed -i "s|mehmoodhaq7/incident-log-frontend:.*|mehmoodhaq7/incident-log-frontend:${BUILD_NUMBER}|g" k8s-prod/frontend.yaml
                        git config user.email "jenkins@incident-log.com"
                        git config user.name "Jenkins"
                        git add .
                        git commit -m "ci: update image tags to build-${BUILD_NUMBER}" || echo "No changes to commit"
                        git push origin main
                    '''
                }
            }
        }
    }
    post {
        success {
            withCredentials([string(credentialsId: 'slack-webhook', variable: 'SLACK_WEBHOOK')]) {
                sh '''
                curl -X POST -H 'Content-type: application/json' \
                --data '{
                    "attachments": [{
                        "color": "#36a64f",
                        "blocks": [{
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": "*✅ Build Successful!*\\n*Project:* Incident Log\\n*Job:* '"${JOB_NAME}"'\\n*Build:* #'"${BUILD_NUMBER}"'"
                            }
                        },
                        {
                            "type": "actions",
                            "elements": [{
                                "type": "button",
                                "text": {"type": "plain_text", "text": "View Build"},
                                "url": "'"${BUILD_URL}"'"
                            }]
                        }]
                    }]
                }' \
                $SLACK_WEBHOOK
                '''
            }
        }
        failure {
            withCredentials([string(credentialsId: 'slack-webhook', variable: 'SLACK_WEBHOOK')]) {
                sh '''
                curl -X POST -H 'Content-type: application/json' \
                --data '{
                    "attachments": [{
                        "color": "#ff0000",
                        "blocks": [{
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": "*❌ Build Failed!*\\n*Project:* Incident Log\\n*Job:* '"${JOB_NAME}"'\\n*Build:* #'"${BUILD_NUMBER}"'"
                            }
                        },
                        {
                            "type": "actions",
                            "elements": [{
                                "type": "button",
                                "text": {"type": "plain_text", "text": "View Logs"},
                                "url": "'"${BUILD_URL}"'console"
                            }]
                        }]
                    }]
                }' \
                $SLACK_WEBHOOK
                '''
            }
        }
    }
}