# Content Security Policy (CSP) Configuration

## Overview
This document explains the Content Security Policy configuration for the Transportation Management System client application.

## Current CSP Configuration

The CSP is configured in `next.config.ts` with the following directives:

```
default-src 'self'; 
script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com https://maps.gstatic.com; 
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://maps.googleapis.com; 
connect-src 'self' http://localhost:* ws://localhost:* https://maps.googleapis.com https://maps.gstatic.com; 
img-src 'self' data: https: blob:; 
font-src 'self' https://fonts.gstatic.com; 
frame-src 'self' https://maps.google.com; 
object-src 'none'; 
base-uri 'self';
```

## Directive Explanations

### `default-src 'self'`
- Default policy for all resource types
- Only allows resources from the same origin

### `script-src`
- `'self'`: Scripts from same origin
- `'unsafe-eval'`: Required for Next.js development mode
- `'unsafe-inline'`: Required for inline scripts (Next.js, Google Maps)
- `https://maps.googleapis.com`: Google Maps JavaScript API
- `https://maps.gstatic.com`: Google Maps static resources

### `style-src`
- `'self'`: Stylesheets from same origin
- `'unsafe-inline'`: Required for inline styles (Google Maps controls)
- `https://fonts.googleapis.com`: Google Fonts CSS
- `https://maps.googleapis.com`: Google Maps CSS

### `connect-src`
- `'self'`: API calls to same origin
- `http://localhost:*`: Development server connections
- `ws://localhost:*`: WebSocket connections for development
- `https://maps.googleapis.com`: Google Maps API calls
- `https://maps.gstatic.com`: Google Maps static resources

### `img-src`
- `'self'`: Images from same origin
- `data:`: Data URLs for inline images
- `https:`: HTTPS images from any domain
- `blob:`: Blob URLs for dynamic images

### `font-src`
- `'self'`: Fonts from same origin
- `https://fonts.gstatic.com`: Google Fonts

### `frame-src`
- `'self'`: Frames from same origin
- `https://maps.google.com`: Google Maps embedded frames

### `object-src 'none'`
- Blocks all object, embed, and applet elements

### `base-uri 'self'`
- Restricts base element to same origin

## Google Maps Integration

The CSP is specifically configured to support Google Maps integration:

1. **Scripts**: Allows Google Maps JavaScript API and related scripts
2. **Styles**: Allows inline styles required by Google Maps controls
3. **Connections**: Allows API calls to Google Maps services
4. **Images**: Allows map tiles and marker images
5. **Frames**: Allows embedded Google Maps

## Security Considerations

### Development vs Production

**Development Mode:**
- Uses `'unsafe-eval'` and `'unsafe-inline'` for scripts
- Allows localhost connections
- More permissive for development tools

**Production Mode:**
- Consider removing `'unsafe-eval'` if not needed
- Use nonces or hashes instead of `'unsafe-inline'` where possible
- Restrict localhost connections

### Recommendations

1. **Use Nonces**: For production, consider implementing nonces for inline scripts and styles
2. **Regular Audits**: Regularly review and update CSP directives
3. **Testing**: Test CSP changes thoroughly in development before deploying
4. **Monitoring**: Monitor CSP violations in production

## Troubleshooting

### Common Issues

1. **Inline Style Blocked**: Ensure `style-src` includes `'unsafe-inline'` or specific domains
2. **Google Maps Not Loading**: Verify all Google Maps domains are allowed
3. **Fonts Not Loading**: Check `font-src` includes Google Fonts domains
4. **API Calls Blocked**: Verify `connect-src` includes required API endpoints

### Debugging

1. Check browser console for CSP violation reports
2. Use browser dev tools to inspect CSP headers
3. Test with CSP disabled temporarily to isolate issues

## References

- [MDN Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Google Maps Platform Security](https://developers.google.com/maps/documentation/javascript/security)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
