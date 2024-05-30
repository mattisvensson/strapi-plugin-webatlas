export default function transformToUrl(input: string): string {
    const specialCharMap: { [key: string]: string } = {
      'ü': 'ue',
      'ä': 'ae',
      'ö': 'oe',
    };

    input = input.toLowerCase();

    // Remove leading slash
    input = input.startsWith('/') ? input.slice(1) : input;
    input = input.endsWith('/') ? input.slice(0, -1) : input;
  
    // Replace special characters
    for (const char in specialCharMap) {
      const regex = new RegExp(char, 'g');
      input = input.replace(regex, specialCharMap[char]);
    }
  
    // Replace spaces with hyphens
    input = input.replace(/\s+/g, '-');
    
    // Remove leading and trailing spaces
    input = input.trim();

    // Encode special characters
    input = encodeURIComponent(input);
  
    // Decode slashes
    input = input.replace(/%2F/g, '/');
  
    // Remove any characters that are not alphanumeric, hyphens, underscores, or slashes
    input = input.replace(/[^a-zA-Z0-9-_\/]/g, '');
  
    return input;
  }