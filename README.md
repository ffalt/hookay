# hookay
listen to webhooks, pull git, call jekyll or hugo, copy the result to a folder (and a little web app to view the state)


## Requirements

[https://nodejs.org/](https://nodejs.org/)

[https://npmjs.com/](https://npmjs.com/)

if you want to build with jekyll: [https://bundler.io/](https://bundler.io/) is needed to install a local jekyll per project


## Installation

Download a release and unzip or clone the release branch

run `git clone https://github.com/ffalt/hookay.git#releases hookay && cd hookay`

run `npm install`

copy `config.json.dist` to `config.json` and fill in your configuration


## Configuration

```typescript

/**
 * Hookay Configuration
 */
interface Config {
	/**
	 * The schema file for the config.json e.g. "config-schema.json"
	 */
	$schema?: string;
	/**
	 * The version of the config file format e.g. 2
	 */
	version?: 1 | 2;
	/**
	 * Server settings
	 */
	server: {
		/**
		 * The address to listen on. e.g. "127.0.0.1" or "0.0.0.0"
		 */
		host: string;
		/**
		 * The port to listen on. e.g. 8181
		 *
		 * @TJS-type integer
		 */
		port: number;
		/**
		 * The url path to listen for hooks on. e.g. "/hooks/*"
		 */
		path: string;
	};
	/**
	 * The secret token to validate a hook call (https://developer.github.com/webhooks/securing/)
	 */
	secret: string;
	/**
	 * List of Hookay Sites
	 */
	sites: Array<ConfigSite>;
}

interface ConfigSite {
	/**
	 * The name and url path to use for the site. e.g. "myawesomesite.org/master"
	 */
	name: string;
	/**
	 * The branch to use for the site. e.g. "master"
	 */
	branch: string;
	/**
	 *  The generator system to use. "jekyll" or "hugo"
	 */
	build: 'jekyll' | 'hugo';
	/**
	 *  The path where the project is build locally e.g. "./data/myawesomesite.org/build"
	 */
	build_path: string;
	/**
	 * The path where the project is published locally e.g. "/var/www/myawesomesite.org/site"
	 */
	publish_path: string;
	/**
	 * The git repository for the site e.g. "https://github.com/ffalt/myawesomesite.git"
	 */
	repository: string;
	/**
	 * If building with hugo you must define a version
	 */
	hugo?: {
		/**
		 * Version of hugo e.g. "0.51"
		 */
		version: string;
		/**
		 * Download extended version of hugo e.g. true
		 */
		extended: boolean;
	};
	/**
	 * Environment settings applied while building the site e.g. {"JEKYLL_ENV": "production"}
	 */
	env?: {
		[name: string]: string;
	};
}
```

Example: 

```json
{
  "$schema": "config-schema.json",
  "version": 2,
  "server": {
    "host": "0.0.0.0",
    "path": "/hooks/*",
    "port": 8181
  },
  "secret": "your token",
  "sites": [
    {
      "name": "some jekyll site",
      "branch": "master",
      "build": "jekyll",
      "build_path": "/var/www/somesite/build",
      "publish_path": "/var/www/somesite/site",
      "repository": "https://github.com/somesiteowner/somesite.git",
      "env": {
        "JEKYLL_ENV": "production"
      }
    },
    {
      "name": "some hugo site",
      "branch": "master",
      "build": "hugo",
      "build_path": "/var/www/somehugosite/build",
      "publish_path": "/var/www/somehugosite/site",
      "hugo": {
        "extended": true,
        "version": "0.51"
      },
      "repository": "https://github.com/somesiteowner/somehugosite.git",
    }
  ]
}
```


## Usage

run `node hookay.js` to start the server

run `node hookay.js -t ` to test your config and exit (can be executed while server is running)


## Running

You can start the server in background with other systems

[forever](https://www.npmjs.com/package/forever)

start in background:

`forever start -a --uid "hookay" hookay.js`

stop: 

`forever stop "hookay"`


[pm2](http://pm2.keymetrics.io/docs/usage/quick-start/)

start in background:

`pm2 start hookay.js --name hookay`

stop: 

`pm2 stop hookay`


## nginx

Have a look at the [example config](https://github.com/ffalt/hookay/blob/master/resource/nginx-site-example)


## References

Favicon & Logo are edited versions of [SVG fishing angling hook](https://svgsilh.com/image/1747990.html)
under [Creative Commons CC0](https://creativecommons.org/publicdomain/zero/1.0/deed.en) 

