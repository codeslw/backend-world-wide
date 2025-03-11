FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Install python and build dependencies
RUN apk add --no-cache python3 make g++ 

# Install dependencies and rebuild bcrypt
RUN npm install --legacy-peer-deps
RUN npm rebuild bcrypt --build-from-source

COPY . .

RUN npm run build

CMD ["npm", "run", "start:dev"]