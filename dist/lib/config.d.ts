export interface ConfigSite {
    name: string;
    branch: string;
    build: 'jekyll' | 'hugo' | 'copy';
    build_path: string;
    publish_path: string;
    repository: string;
    hugo?: {
        version: string;
        extended: boolean;
    };
    env?: {
        [name: string]: string;
    };
}
export interface Config {
    $schema?: string;
    version: 2;
    server: {
        host: string;
        port: number;
        path: string;
    };
    secret: string;
    sites: Array<ConfigSite>;
}
