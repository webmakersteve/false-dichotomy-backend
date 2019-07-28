# False Dichotomy Backend

This is the backend for the false dichotomy website. It uses Battle.net authentication through OAuth to validate players.

In order to run this locally with authentication you will need to have it running on the correct host. Provided with this repository are docker images that can help you get up and running in that fashion.

Run

```sh
docker-compose up
```

This will create a full stack environment (Elastic, Nginx [for https], and the current code). If you need to rebuild the code after changes and run it in this environment you can run `docker-compose build` and then `docker-compose start` again.

## Hosts File

The Bnet API depends on the host being set properly. You will need to do this in your hosts file to run locally.

```sh
cat '127.0.0.1       falsedichotomyguild.com' >> /etc/hosts
```

This will make sure that you have the hostname for your local environment. If you do not need authentication you do not need to do it this way.

## Running without Auth

There is a special parameter for use in development only that will allow you to stick the site to your user between restarts so you do not need to worry about passing the token around. Inside your `local.yml` file, add `bnet.access_token` with the value of your access token for the Battle.net API. This will force the site to authenticate as you so you can continue development.

