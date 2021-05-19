# Aries Guardianship Agency

### Setup
You will need to setup the `.env` file.  The easiest way to start is by copying
`dummy.env` to `.env`. Other than `NODE_ENV`, the values are not literal and you may need to adjust
those for your environment.

If you have access to other protocol repos, you can get the values from those repos.
  
Note the very first time you run this you need to ensure you have the latest aca py image in your docker cache.  
```
 docker pull bcgovimages/aries-cloudagent:py36-1.15-1_0.6.0
```


## Additional environment settings.
Check `src/config/env.json`.  While it is not common, there are additional environment variable settings in this file and may need to be
adjusted for your environment. 

## Running tests
The main docker-compose will spin up the agency, a local indy ledger, and a postgres wallets db to connect to:
```
npm install
docker-compose up
```
To run tests:
```
npm run test
```
## Additional info
To spin up an agent use a REST client like insomnia and do some like:
```
POST http://localhost:3010/v1/manager
{
	"walletId": "walletId001",
	"walletKey": "walletKey001",
	"adminApiKey": "adminApiKey"
	"walletId": "walletId",
	"walletKey": "walletkey",
	"adminApiKey": "someAdminKey",
	"ttl": -1,
	"seed": "000000000000000000000000ABCDEFG1",
	"agentId": "testAgent2"
}
```
To spin down the agent, use the returned agentId from above and do:
```
DELETE http://localhost:3010/v1/manager
{
	"agentId": "AGENT_ID_RETURNED_ABOVE"
}
```

Note:
If you want to connect to the kiva-network from the protocol-repo you need to update the following env params:
  WALLET_DB_HOST=protocol-identity-wallets-db
  NETWORK_NAME=kiva-network
You can then run
```
npm install
docker-compose -f docker-compose.kiva-network.yml
```

If you run into conflicts with docker images from another file clean things up with: `docker rm -f $(docker ps -aq)`.


## Notes about the Transaction API
The transaction APIs (eg `v2/transaction` namespace) require the TDC controller and agent.  These are 
available in the `protocol-aries` repo.

## Testing with local code base for aries-guardianship-agency
(If this doesn't make sense, ask Matt.  He probably is no help though)
1. Get protocol-aries code.  
   `git clone https://github.com/kiva/protocol-aries`
2. Get environment configured for code downloaded in #1 above.
3. Build/Run docker-compose.yml in aries-guardianship-agency
4. Configure the .env for ncra and tdc controller in `protocol-aries/implementation` to use wallets-db
5. Run protocol-aries/implementation/docker-compose.local.yml
6. Run what you need from scripts/setup.sh in protocol-aries    
