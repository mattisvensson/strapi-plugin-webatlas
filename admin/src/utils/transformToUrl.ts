const transformToUrl = (string: string) => encodeURIComponent(string.replace(/\s/g, '-').toLocaleLowerCase());

export default transformToUrl;
