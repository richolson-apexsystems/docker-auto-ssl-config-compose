# Establish dynamic reverse proxy configurations for `docker-compose` projects using `nginx-proxy` with `nginx-proxy-acme` helper.

For purposes of this example I created a very simple express app that runs on port 3000 and needs a proxy configured to deliver it over ssl port 443 by nginx server.


Run the following steps from a Linux terminal.

# 1. Create a `Dockerfile` file for sample express app.
It should look something like below.

```
FROM node:alpine as base

WORKDIR /app

COPY package.json ./

RUN rm -rf node_modules && npm install

COPY . .

CMD ["node", "./server.js"]
```
# 2. Create an `.env` file with the following contents.

```
PORT=3000

```

# 3. Create a `docker-compose.yml` within your `express-app` directory - this is used once just to build our sample image.
This will build a docker image from our express-app. The app will be available as `express-app` in our local docker image repository. 

```
version: "3.5"

services:
  app:
    container_name: express-app
    image: express-app
    build:
      context: .
      dockerfile: Dockerfile
      target: base      
    ports:
      - "${PORT}:${PORT}"
      
```

# 4. From within the `express-app` directory run the following to build the docker image.

```
docker-compose up --build

```
NOTE: you'll probably have to run `docker-compose down` and then delete the container name it was added to in previous step to make sure image is available in next step.

# 5. Create a main `docker-compose.yml` file that gets our ssl certificate from letsencrypt and configures our nginx server to use it.
This file uses images that we have previously created locally or are pulled from Dockerhub however this is for example purposes. In eSitter all images will have been created on github and pulled from there but outside of those differences this solution should adapt well.

```
version: "3.5"

services:
    # setup nginx proxy server
    nginx-proxy:
        container_name: nginx-proxy
        image: nginxproxy/nginx-proxy
        restart: unless-stopped
        ports:
            - 80:80
            - 443:443
        volumes:
          - /var/run/docker.sock:/tmp/docker.sock:ro
          - certs:/etc/nginx/certs:ro
          - vhostd:/etc/nginx/vhost.d
          - html:/usr/share/nginx/html
          - acme:/etc/acme.sh   
        labels:
          - com.github.jrcs.letsencrypt_nginx_proxy_companion.nginx_proxy  
        environment:
            DEFAULT_EMAIL: rich@zenzig.com
        logging:
            options:
                max-size: "10m"
                max-file: "3"
    # use nginx-proxy helper to generate letsencrypt cert for domain were using
    nginx-proxy-acme:
        container_name: nginx-proxy-acme
        image: nginxproxy/acme-companion
        restart: unless-stopped
        volumes:
          - certs:/etc/nginx/certs:rw
          - vhostd:/etc/nginx/vhost.d
          - html:/usr/share/nginx/html
          - /var/run/docker.sock:/var/run/docker.sock:ro
        environment:
            DEFAULT_EMAIL: rich@zenzig.com
            NGINX_PROXY_CONTAINER: nginx-proxy
    # setup application we want to proxy, in this case image we created for express-app on port 3000 
    express-app:
        container_name: express-app
        image: express-app
        expose:
            - "3000"
        environment:
            VIRTUAL_HOST: docker2.zenzig.com
            LETSENCRYPT_HOST: docker2.zenzig.com
            VIRTUAL_PORT: 3000
            LETSENCRYPT_EMAIL: rich@zenzig.com
        depends_on:
          - nginx-proxy
          - nginx-proxy-acme    
# define volume labels for volumes used above    
volumes:
  certs:
  html:
  vhostd:
  acme:

```  
