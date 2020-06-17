FROM node:carbon-alpine
RUN mkdir www/
WORKDIR www/
ARG NPM_TOKEN
ADD .npmrc ./
ADD package.json package-lock.json ./
RUN npm install
ADD . .
CMD [ "npm", "run", "start" ]
