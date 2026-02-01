export default function removeWaFields(obj: any): any {
  
  delete obj['webatlas_path']
  delete obj['webatlas_override']
  delete obj['webatlas_parent']

  return obj;
}
