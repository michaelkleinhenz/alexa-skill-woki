
module.exports = {
  accessKeyId: "AKIAJENPDRJBPFHM22ZA",
  secretAccessKey: "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",
  //sessionToken: <sessionToken for assuming roles>,  // optional
  //profile: <shared credentials profile name>, // optional for loading AWS credientail from custom profile
  region: 'us-east-1',
  handler: 'index.handler',
  role: "arn:aws:iam::813226363903:role/service-role/diceRollerRole",
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
