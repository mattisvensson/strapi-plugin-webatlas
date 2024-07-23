export default function transformToUrl(input: string): string {
    const specialCharMap: { [key: string]: string } = {
      'ü': 'ue',
      'ä': 'ae',
      'ö': 'oe',
    };

    if (!input || typeof input !== 'string') return '';

    input = input.toLowerCase();

    // Reduce multiple slashes to a single slash and remove leading/trailing slashes
    input = input.replace(/\/+/g, '/');
    input = input.startsWith('/') ? input.slice(1) : input;
    input = input.endsWith('/') ? input.slice(0, -1) : input;
  
    // Replace special characters
    for (const char in specialCharMap) {
      const regex = new RegExp(char, 'g');
      input = input.replace(regex, specialCharMap[char]);
    }

    // Remove leading and trailing spaces
    input = input.trim();
    
    // Replace spaces with hyphens
    input = input.replace(/\s+/g, '-');

    // Encode special characters
    // input = encodeURIComponent(input);
    
    // Remove any characters that are not alphanumeric, hyphens, underscores, or slashes
    input = input.replace(/[^A-Za-z0-9$\-_.+!*'()/]/g, '');

    // Replace multiple consecutive dashes with a single dash
    input = input.replace(/-+/g, '-');

    return input;
  }