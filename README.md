# Aries Guardianship Agency

### Setup
You will need to add your .env vars from another repo (TODO figure out a good way to pass those .env vars in)  
Note the very first time you run this you need to ensure you have the latest aca py image in your docker cache  

Check /config/env.json for the most up to date version:
```
 docker pull bcgovimages/aries-cloudagent:py36-1.15-0_0.5.2
```
The main docker-compose will spin up the agency, a local indy ledger, and a postgres wallets db to connect to:
```
npm run install
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
npm run install
docker-compose -f docker-compose.kiva-network.yml
```

If you run into conflicts with docker images from another file clean things up with: docker rm -f $(docker ps -aq)
