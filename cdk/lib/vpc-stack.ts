import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

interface VpcStackProps extends StackProps {
  useLocal?: boolean;
}

export class VpcStack extends Stack {
  public readonly vpc: ec2.IVpc;

  constructor(scope: Construct, id: string, props?: VpcStackProps) {
    super(scope, id, props);

    const { useLocal } = props || {};

    if (useLocal) {
      // LocalStack does not emulate VPC creation fully, so use a dummy VPC
      this.vpc = ec2.Vpc.fromVpcAttributes(this, 'LocalVpc', {
        vpcId: 'vpc-localstack',
        availabilityZones: ['us-east-1a', 'us-east-1b'],
        publicSubnetIds: ['subnet-local-1', 'subnet-local-2'],
        privateSubnetIds: ['subnet-local-3', 'subnet-local-4'],
        vpcCidrBlock: '10.0.0.0/16', 
      });
    } else {
      // Real AWS deployment
      this.vpc = new ec2.Vpc(this, 'OrderFlowVpc', {
        maxAzs: 2,
        natGateways: 1,
      });
    }
  }
}
