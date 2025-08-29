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

orderflow/
├── bin/
│   └── orderflow.ts
├── lib/
│   ├── vpc-stack.ts
│   ├── db-stack.ts
│   ├── lambda-stack.ts
│   ├── stepfunction-stack.ts
│   ├── api-stack.ts
│   ├── observability-stack.ts
│   ├── auth-stack.ts
│   ├── pipeline-stack.ts
├── lambda/
│   ├── validateOrder.ts
│   ├── processPayment.ts
│   ├── confirmOrder.ts
│   ├── sqlSender.ts
│   └── dlqHandler.ts
├── test/
│   └── lambda.test.ts
├── package.json
├── tsconfig.json
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