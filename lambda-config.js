
module.exports = {
  accessKeyId: process.env.AWS_KEY_ID,
  secretAccessKey: process.env.AWS_KEY_SECRET,
  //sessionToken: <sessionToken for assuming roles>,  // optional
  //profile: <shared credentials profile name>, // optional for loading AWS credientail from custom profile
  region: 'us-east-1',
  handler: 'index.handler',
  role: process.env.AWS_ROLE,
  functionName: "wokiBonnKinoprogramm",
  timeout: 10,
  memorySize: 128,
  publish: true, 
  runtime: 'nodejs4.3', 
  /*
  vpc: { // optional
    SecurityGroupIds: [<security group id>, ...],
    SubnetIds: [<subnet id>, ...]
  }
  */
}
