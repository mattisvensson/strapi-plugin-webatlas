export default function getFullPath(parentPath: string, slug: string) {

    if (!slug) return null;

    const newSlug = slug.startsWith('/') ? slug : `/${slug}`;

    if (!parentPath) return newSlug;

    let newPath = parentPath.startsWith('/') ? parentPath : `/${parentPath}`;
    newPath = newPath.endsWith('/') ? newPath.slice(0, -1) : newPath;

    return `${newPath}${newSlug}`;
}