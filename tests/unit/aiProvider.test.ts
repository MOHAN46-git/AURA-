/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { assertEqual, assertTrue } from '../helpers/testHarness.ts';
import { getAiProviderInfo } from '../../src/server/geminiService.ts';

export function testAiProviderDetection(): void {
  const originalGrok = process.env.GROK_API_KEY;
  const originalXai = process.env.XAI_API_KEY;
  const originalGemini = process.env.GEMINI_API_KEY;

  try {
    // 1. Test Grok API Key detection
    process.env.GROK_API_KEY = 'xai-test-key-12345';
    delete process.env.XAI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    let info = getAiProviderInfo();
    assertEqual(info.provider, 'grok', 'GROK_API_KEY should select grok provider');
    assertEqual(info.model, 'grok-2-latest', 'Default grok model should be grok-2-latest');
    assertTrue(info.hasKey, 'hasKey should be true for GROK_API_KEY');

    // 2. Test XAI_API_KEY detection
    delete process.env.GROK_API_KEY;
    process.env.XAI_API_KEY = 'xai-alternate-key-999';
    info = getAiProviderInfo();
    assertEqual(info.provider, 'grok', 'XAI_API_KEY should select grok provider');
    assertTrue(info.hasKey, 'hasKey should be true for XAI_API_KEY');

    // 3. Test xAI key placed in GEMINI_API_KEY
    delete process.env.GROK_API_KEY;
    delete process.env.XAI_API_KEY;
    process.env.GEMINI_API_KEY = 'xai-auto-detected-key';
    info = getAiProviderInfo();
    assertEqual(info.provider, 'grok', 'xai- prefix in GEMINI_API_KEY should auto-detect grok');

    // 4. Test deterministic fallback when no key is set
    delete process.env.GROK_API_KEY;
    delete process.env.XAI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    info = getAiProviderInfo();
    assertEqual(info.provider, 'deterministic', 'Should fallback to deterministic without key');
    assertEqual(info.hasKey, false, 'hasKey should be false without key');
  } finally {
    // Restore original env
    if (originalGrok !== undefined) process.env.GROK_API_KEY = originalGrok;
    else delete process.env.GROK_API_KEY;

    if (originalXai !== undefined) process.env.XAI_API_KEY = originalXai;
    else delete process.env.XAI_API_KEY;

    if (originalGemini !== undefined) process.env.GEMINI_API_KEY = originalGemini;
    else delete process.env.GEMINI_API_KEY;
  }
}
