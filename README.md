# Aries Guardianship Agency

### Setup
For now you need to run the indy ledger and wallets db from the protocol repo
  TODO add a docker-compose here that can spin those up
You will also need to add your .env vars from another repo
  TODO figure out a good way to pass those .env vars in
You will also need to add .npmrc file to pull protocol-common package from kiva npm server.
  TODO eventually we will make the npm package public
Once you have another docker compose running with the ledger and wallet db on kiva-network and .env in place you can run:
```
npm run install
docker-compose up
```
To run tests:
```
npm run test
```

If you run into conflicts with docker images from another file clean things up with: docker rm -f $(docker ps -aq)
