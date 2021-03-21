export const getBaseLocation = () => {
	const apipath = location ? location.pathname : '';
	const paths: string[] = apipath.split('/').splice(1, 1);
	return '/' + (paths && paths[0]) || ''; // Default: nothing
};
