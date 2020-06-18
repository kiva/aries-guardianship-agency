# aries-guardianship-agency

For now you need to run the indy ledger and wallets db from the protocol repo
You will als need to add your .env vars from another repo
If you run into conflicts with docker images from another file run: docker rm -f $(docker ps -aq)
To run the tests use: npm run test