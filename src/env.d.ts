/// <reference types="astro/client" />

declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    SESSION: KVNamespace;
    ENVIRONMENT?: string;
    NL_API_KEY?: string;
    DATA4LIBRARY_API_KEY?: string;
  }
}
