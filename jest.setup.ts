import '@testing-library/jest-dom'

// Polyfill for Next.js server-side globals (Request, Response) required 
// for testing API routes using NextRequest/NextResponse.
if (typeof global.Request === 'undefined') {
  // Define a minimal class to satisfy the ReferenceError
  global.Request = class Request {} as any;
  global.Response = class Response {} as any;
}