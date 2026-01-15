export default function cleanRootKeys(obj: any): any {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (value === null || 
          (Array.isArray(value) && value.length === 0) || 
          (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)) {
        delete obj[key];
      }
    }
  }
  return obj;
}
