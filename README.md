# AWS CDK + LocalStack Demo 🚀

A hands-on project to learn **AWS application development** using **CDK** and **LocalStack**.  
This project demonstrates how to build a serverless architecture with:

- **AWS Lambda** (business logic in TypeScript)
- **API Gateway** (expose REST endpoints)
- **SQS & SNS** (messaging)
- **Step Functions** (workflow orchestration)
- **IAM Roles & Policies** (permissions)
- **AWS CDK** (infrastructure as code)
- **LocalStack** (local AWS mock for development & testing)

---

## 🏗 Project Structure

aws-order-flow/
├── cdk/ # CDK app (infrastructure as code)
│ ├── bin/ # CDK app entry point
│ ├── lib/ # CDK stacks (API, SQS, Step Functions, etc.)
│ └── tsconfig.json
├── lambdas/ # Lambda functions (TypeScript)
│ ├── health/ # /health check Lambda
│ └── orders/ # /orders API Lambda
├── package.json
├── tsconfig.json
├── cdk.json # CDK app configuration
├── .gitignore
└── README.md


---

## ⚡ Prerequisites

- [Node.js 18+](https://nodejs.org/en/download/)
- [Docker](https://docs.docker.com/get-docker/)
- [LocalStack](https://docs.localstack.cloud/getting-started/)
- [AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html)

Install LocalStack + CDK Local:

```bash
npm install -g aws-cdk-local aws-cdk
pip install localstack awscli-local

## 🚀 Getting Started
1. Start LocalStack
cdklocal bootstrap
2. Bootstrap CDK (LocalStack backend)
cdklocal bootstrap
3. Deploy Infrastructure
cdklocal deploy
4. Test API
awslocal apigateway get-rest-apis
curl http://localhost:4566/restapis/<apiId>/<stage>/_user_request_/health

## 🛠 Development
- Lambdas are written in TypeScript using NodejsFunction (auto-bundled with esbuild).
- Infrastructure is defined in AWS CDK.
- Everything runs on LocalStack locally.