import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

interface DatabaseStackProps extends StackProps {
  vpc: ec2.IVpc;
  useLocal?: boolean;
}

export class DatabaseStack extends Stack {
  public readonly db?: rds.DatabaseInstance;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const { vpc, useLocal } = props;

    if (useLocal) {
      // LocalStack does not emulate RDS, so skip creating DB
      this.db = undefined;
    } else {
      // Real AWS RDS
      const dbSG = new ec2.SecurityGroup(this, 'DBSG', {
        vpc,
        description: 'Database SG',
        allowAllOutbound: true,
      });

      this.db = new rds.DatabaseInstance(this, 'Psql', {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_14,
        }),
        vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        instanceType: new ec2.InstanceType('t3.micro'),
        allocatedStorage: 1,
        multiAz: false,
        publiclyAccessible: false,
        securityGroups: [dbSG],
        databaseName: 'orders',
        credentials: rds.Credentials.fromGeneratedSecret('postgres'),
        deletionProtection: false,
        removalPolicy: RemovalPolicy.DESTROY,
      });
    }
  }
}
