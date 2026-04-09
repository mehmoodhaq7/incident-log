pipeline {
    agent any

    tools {
        nodejs 'NodeJS23'
    }

    environment {
        SCANNER_HOME = tool 'sonar-scanner'
        DOCKER_USERNAME = 'mehmoodhaq7'
        EKS_ENDPOINT = 'https://E59BEA4D111AB32B4225B2FAC81B927B.gr7.us-east-1.eks.amazonaws.com'
    }

    stages {

        stage('Git Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/mehmoodhaq7/incident-log.git'
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

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('sonar') {
                    sh '''
                    $SCANNER_HOME/bin/sonar-scanner \
                        -Dsonar.projectName=incident-log \
                        -Dsonar.projectKey=incident-log \
                        -Dsonar.sources=.
                    '''
                }
            }
        }

        stage('Quality Gate Check') {
            steps {
                timeout(time: 1, unit: 'HOURS') {
                    waitForQualityGate abortPipeline: false, credentialsId: 'sonar-token'
                }
            }
        }

        stage('Trivy FS Scan') {
            steps {
                sh 'trivy fs --format table -o fs-report.html .'
            }
        }

        stage('Build & Tag Backend Image') {
            steps {
                script {
                    withDockerRegistry(credentialsId: 'docker-creds') {
                        dir('api') {
                            sh 'docker build -t $DOCKER_USERNAME/incident-log-backend:latest .'
                        }
                    }
                }
            }
        }

        stage('Trivy Backend Image Scan') {
            steps {
                sh 'trivy image --format table -o backend-image-report.html $DOCKER_USERNAME/incident-log-backend:latest'
            }
        }

        stage('Push Backend Image') {
            steps {
                script {
                    withDockerRegistry(credentialsId: 'docker-creds') {
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
                            sh 'docker build -t $DOCKER_USERNAME/incident-log-frontend:latest .'
                        }
                    }
                }
            }
        }

        stage('Trivy Frontend Image Scan') {
            steps {
                sh 'trivy image --format table -o frontend-image-report.html $DOCKER_USERNAME/incident-log-frontend:latest'
            }
        }

        stage('Push Frontend Image') {
            steps {
                script {
                    withDockerRegistry(credentialsId: 'docker-creds') {
                        sh 'docker push $DOCKER_USERNAME/incident-log-frontend:latest'
                    }
                }
            }
        }

        // Continuous Delivery Approval
        stage('Approval for Production') {
            steps {
                timeout(time: 1, unit: 'HOURS') {
                    input message: 'Deploy to Production?',
                          ok: 'Deploy',
                          submitter: 'admin'
                }
            }
        }

        stage('Deploy to EKS Prod') {
            steps {
                withKubeCredentials(kubectlCredentials: [[
                    caCertificate: '',
                    clusterName: 'incident-log-cluster',
                    contextName: '',
                    credentialsId: 'k8s-prod-token',
                    namespace: 'prod',
                    serverUrl: "${EKS_ENDPOINT}"
                ]]) {

                    sh 'kubectl apply -f k8s/manifests/namespace.yaml'
                    sh 'kubectl apply -f k8s/manifests/sc.yaml'
                    sh 'sleep 10'
                    sh 'kubectl apply -f k8s/manifests/mysql.yaml'
                    sh 'kubectl apply -f k8s/manifests/backend.yaml'
                    sh 'kubectl apply -f k8s/manifests/frontend.yaml'
                    sh 'kubectl apply -f k8s/manifests/ingress.yaml'
                    sh 'kubectl apply -f k8s/manifests/clusterIssuer.yaml'
                    sh 'sleep 30'
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                withKubeCredentials(kubectlCredentials: [[
                    caCertificate: '',
                    clusterName: 'incident-log-cluster',
                    contextName: '',
                    credentialsId: 'k8s-prod-token',
                    namespace: 'prod',
                    serverUrl: "${EKS_ENDPOINT}"
                ]]) {

                    sh 'kubectl get pods -n prod'
                    sh 'kubectl get svc -n prod'
                    sh 'kubectl get ingress -n prod'
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

            echo 'CI/CD Pipeline Successful'
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

            echo 'Pipeline Failed'
        }
    }
}