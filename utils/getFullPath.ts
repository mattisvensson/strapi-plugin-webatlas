export default function getFullPath(parentPath: string, slug: string) {

	if (!slug) return null;
	if (!parentPath) return slug;

	const newPath = parentPath.endsWith('/') ? parentPath : `${parentPath}/`;

	return `${newPath}${slug}`;
}