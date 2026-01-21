//This is My custom File So Ima see if scram will work for this set up

self.__scramjet$bundle = {
  rewriters: {
    url: {
      encodeUrl: (url) => {
        
        return `/scram/?url=${encodeURIComponent(url)}`;
      },
      decodeUrl: (encodedUrl) => {
  
        try {
          const params = new URL(encodedUrl, location.origin).searchParams;
          return params.get('url');
        } catch {
          return encodedUrl; 
        }
      },
    },
    rewriteHtml: (html) => html, 
    rewriteJs: (js) => js,      
    rewriteCss: (css) => css,    
    rewriteSrcset: (srcset) => srcset,
    rewriteHeaders: (headers) => headers,
  }
};
