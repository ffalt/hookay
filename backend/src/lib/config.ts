export interface ConfigSite {
	/**
	 * The name and url path to use for the site. e.g. "myawesomesite.org/master"
	 */
	name: string;
	/**
	 * The branch to use for the site. e.g. "master"
	 */
	branch: string;
	/**
	 *  The generator system to use. "jekyll" or "hugo" or "copy"
	 */
	build: 'jekyll' | 'hugo' | 'copy';
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

/**
 * Hookay Configuration
 */
export interface Config {
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
