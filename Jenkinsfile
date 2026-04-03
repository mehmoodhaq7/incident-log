pipeline {
    agent any
    tools {
        nodejs 'NodeJS23'
    }
    environment {
        SCANNER_HOME = tool 'sonar-scanner'
        DOCKER_USERNAME = 'mehmoodhaq7'
    }
    stages {
        stage('Git Checkout') {
            steps {
                git branch: 'dev', url: 'https://github.com/mehmoodhaq7/incident-log.git'
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
        stage('Docker Compose Deploy') {
            steps {
                sh 'docker-compose up -d'
            }
        }
        stage('Deploy to EKS Dev') {
            steps {
                withKubeCredentials(kubectlCredentials: [[
                    caCertificate: '',
                    clusterName: 'incident-log-cluster',
                    contextName: '',
                    credentialsId: 'k8s-token',
                    namespace: 'dev',
                    serverUrl: 'https://7728150E2E573A98BFE4F5E145516A4C.gr7.us-east-1.eks.amazonaws.com'
                ]]) {
                    sh 'kubectl apply -f k8s/manifests/sc.yaml'
                    sh 'kubectl apply -f k8s/manifests/mysql.yaml -n dev'
                    sh 'kubectl apply -f k8s/manifests/backend.yaml -n dev'
                    sh 'kubectl apply -f k8s/manifests/frontend.yaml -n dev'
                    sh 'sleep 60'
                }
            }
        }
        stage('Verify EKS Deployment') {
            steps {
                withKubeCredentials(kubectlCredentials: [[
                    caCertificate: '',
                    clusterName: 'incident-log-cluster',
                    contextName: '',
                    credentialsId: 'k8s-token',
                    namespace: 'dev',
                    serverUrl: 'https://7728150E2E573A98BFE4F5E145516A4C.gr7.us-east-1.eks.amazonaws.com'
                ]]) {
                    sh 'kubectl get pods -n dev'
                    sh 'kubectl get svc -n dev'
                }
            }
        }
    }
    post {
        success {
            echo '✅ Pipeline Successful!'
        }
        failure {
            echo '❌ Pipeline Failed!'
        }
    }
}