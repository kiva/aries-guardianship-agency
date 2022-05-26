FROM node:16.14.2-alpine3.15
RUN mkdir www/
WORKDIR www/
ADD package.json package-lock.json ./
RUN npm install
ADD . .
CMD [ "npm", "run", "start" ]
