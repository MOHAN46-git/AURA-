/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { generateWorkflowFromGoal, editWorkflowWithAI } from './geminiService.ts';

export async function handleApiRequest(req: any, res: any, urlPath: string) {
  // CORS & Content Type
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    if (urlPath === '/api/health' && req.method === 'GET') {
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          status: 'ok',
          service: 'AURA AI Lifestyle & Automation Workflow',
          model: 'gemini-3.7-flash',
          timestamp: new Date().toISOString(),
          hasKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
        })
      );
      return;
    }

    if (urlPath === '/api/generate-workflow' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const prompt = body?.prompt;

      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        res.statusCode = 400;
        res.end(
          JSON.stringify({
            success: false,
            error: 'Goal prompt is required.',
          })
        );
        return;
      }

      const workflow = await generateWorkflowFromGoal(prompt);
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          success: true,
          workflow,
        })
      );
      return;
    }

    if (urlPath === '/api/edit-workflow' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { currentWorkflow, instruction } = body || {};

      if (!currentWorkflow || !instruction) {
        res.statusCode = 400;
        res.end(
          JSON.stringify({
            success: false,
            error: 'currentWorkflow and instruction are required.',
          })
        );
        return;
      }

      const workflow = await editWorkflowWithAI(currentWorkflow, instruction);
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          success: true,
          workflow,
        })
      );
      return;
    }

    // 404 for unknown api routes
    res.statusCode = 404;
    res.end(
      JSON.stringify({
        success: false,
        error: `Endpoint ${urlPath} not found.`,
      })
    );
  } catch (err: any) {
    console.error(`[AURA Server Error] ${urlPath}:`, err);
    res.statusCode = 500;
    res.end(
      JSON.stringify({
        success: false,
        error: err?.message || 'Internal server error while processing workflow.',
      })
    );
  }
}

function parseJsonBody(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object') {
      return resolve(req.body);
    }
    let data = '';
    req.on('data', (chunk: any) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        const parsed = data ? JSON.parse(data) : {};
        resolve(parsed);
      } catch (e) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}
