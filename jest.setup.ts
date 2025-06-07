// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfills for Node.js environment
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.TextEncoder = TextEncoder as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.TextDecoder = TextDecoder as any;

// Mock Response for Node.js environment
global.Response = class Response {
  body: BodyInit | null;
  status: number;
  statusText: string;
  headers: Headers;
  ok: boolean;
  redirected = false;
  type: ResponseType = 'basic';
  url = '';

  constructor(body?: BodyInit | null, init?: ResponseInit) {
    this.body = body || null;
    this.status = init?.status || 200;
    this.statusText = init?.statusText || 'OK';
    this.headers = new Headers(init?.headers);
    this.ok = this.status >= 200 && this.status < 300;
  }

  async json() {
    return JSON.parse(this.body as string);
  }

  async text() {
    return this.body as string;
  }

  clone() {
    return new Response(this.body, {
      status: this.status,
      statusText: this.statusText,
      headers: this.headers,
    });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

// Mock Request for Node.js environment
global.Request = class Request {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    this.url = typeof input === 'string' ? input : input.toString();
    this.method = init?.method || 'GET';
    this.headers = new Headers(init?.headers);
    this.body = init?.body || null;
  }

  url: string;
  method: string;
  headers: Headers;
  body: BodyInit | null;

  clone() {
    return new Request(this.url, {
      method: this.method,
      headers: this.headers,
      body: this.body,
    });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

// Mock Headers for Node.js environment
global.Headers = class Headers {
  private _headers: Record<string, string> = {};

  constructor(init?: HeadersInit) {
    if (init) {
      if (Array.isArray(init)) {
        init.forEach(([key, value]) => {
          this._headers[key.toLowerCase()] = value;
        });
      } else if (init instanceof Headers) {
        this._headers = { ...init._headers };
      } else {
        Object.entries(init).forEach(([key, value]) => {
          this._headers[key.toLowerCase()] = value;
        });
      }
    }
  }

  get(name: string) {
    return this._headers[name.toLowerCase()] || null;
  }

  set(name: string, value: string) {
    this._headers[name.toLowerCase()] = value;
  }

  has(name: string) {
    return name.toLowerCase() in this._headers;
  }

  delete(name: string) {
    delete this._headers[name.toLowerCase()];
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;
