export default function removeWaFields(obj: any): any {

  delete obj['webatlas']

  return obj;
}
