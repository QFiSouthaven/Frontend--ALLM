import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AnythingLLMClient } from '../src/client';
import { AnythingLLMError } from '../src/errors';

// Configuration
// Ensure these point to a valid running instance for actual execution
const BASE_URL = process.env.ANYTHINGLLM_URL || 'http://localhost:3001';
const API_KEY = process.env.ANYTHINGLLM_API_KEY || 'test-admin-key';

describe('AnythingLLM Client v2 Integration Suite', () => {
  let client: AnythingLLMClient;
  const testWorkspaceSlug = `test-ws-${Math.floor(Math.random() * 100000)}`;

  beforeAll(() => {
    console.log(`Targeting AnythingLLM at ${BASE_URL} with workspace ${testWorkspaceSlug}`);
  });

  // 1. Client Initialization & Health
  it('Initializes and verifies authentication', async () => {
    client = new AnythingLLMClient({ baseURL: BASE_URL, apiKey: API_KEY });
    expect(client).toBeDefined();
    
    // Auth Check
    try {
      const auth = await client.verifyAuth();
      expect(auth.authenticated).toBe(true);
    } catch (e) {
      console.warn("Auth check failed - is the server running?");
      throw e;
    }
  });

  // 2. Error Handling
  it('Correctly handles invalid authentication', async () => {
    const badClient = new AnythingLLMClient({ baseURL: BASE_URL, apiKey: 'invalid-key', retries: 0 });
    // Expecting 403 or 401
    await expect(badClient.verifyAuth()).rejects.toThrow(); 
  });

  // 3. Workspace Lifecycle
  it('Creates a new workspace', async () => {
    const ws = await client.workspaces.create({ name: 'Integration Test', slug: testWorkspaceSlug });
    expect(ws.slug).toBe(testWorkspaceSlug);
    expect(ws.name).toBe('Integration Test');
  });

  it('Lists workspaces', async () => {
    const list = await client.workspaces.list();
    expect(list.length).toBeGreaterThan(0);
    const found = list.find(w => w.slug === testWorkspaceSlug);
    expect(found).toBeDefined();
  });

  it('Updates workspace settings', async () => {
    const updated = await client.workspaces.update(testWorkspaceSlug, { 
      settings: { similarityThreshold: 0.85 } 
    } as any);
    expect(updated.settings?.similarityThreshold).toBe(0.85);
  });

  // 4. Document Operations
  it('Uploads a text file correctly', async () => {
    // Requires Node 18+ for global Blob, or jsdom environment
    if (typeof Blob === 'undefined') {
      console.warn('Skipping upload test: Blob not defined in environment');
      return;
    }
    const blob = new Blob(["This is a test document content."], { type: 'text/plain' });
    
    // The client handles FormData boundary automatically now
    const doc = await client.documents.uploadFile(testWorkspaceSlug, blob as any, { title: 'integration-test.txt' });
    expect(doc.title).toBe('integration-test.txt');
    expect(doc.id).toBeDefined();
  });

  // 5. Chat Completions
  it('Sends a chat message', async () => {
    const response = await client.chat.chat(testWorkspaceSlug, [{ role: 'user', content: 'Hello, are you there?' }]);
    if ('textResponse' in response) {
      expect(response.textResponse).toBeDefined();
      expect(typeof response.textResponse).toBe('string');
    }
  });

  // Cleanup
  afterAll(async () => {
    if (client) {
      try {
        console.log(`Cleaning up workspace ${testWorkspaceSlug}...`);
        await client.workspaces.delete(testWorkspaceSlug);
      } catch(e) {
        console.warn('Cleanup failed (workspace might not exist)', e);
      }
    }
  });
});