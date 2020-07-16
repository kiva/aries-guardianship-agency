# Aries Guardianship Agency

### Setup
You will need to following variables in the .env file.  Values are not literal, this just an example:
```
# ENV FILE FOR AGENCY
NODE_ENV=LOCAL

# For Wallet DB
WALLET_DB_HOST=hostname
WALLET_DB_PORT=5432
WALLET_DB_USER=username
WALLET_DB_PASS=password
WALLET_DB_ADMIN_USER=adminusername
WALLET_DB_ADMIN_PASS=password
POSTGRES_PASSWORD=password
```
If you have access to other protocol repos, you can get the values from those repos.

(TODO figure out a good way to pass those .env vars in)  
  
Note the very first time you run this you need to ensure you have the latest aca py image in your docker cache  

Check `src/config/env.json` for the most up to date version:
```
 docker pull bcgovimages/aries-cloudagent:py36-1.15-0_0.5.2
```
The main docker-compose will spin up the agency, a local indy ledger, and a postgres wallets db to connect to:
```
npm install
docker-compose up
```
To run tests:
```
npm run test
```

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
	"controllerUrl": "http://controller:1010",
	"alias": "testAgent2"
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

If you run into conflicts with docker images from another file clean things up with: docker rm -f $(docker ps -aq)
