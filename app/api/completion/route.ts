import { convertToModelMessages, streamText, stepCountIs } from 'ai';
import { createMCPClient } from '@ai-sdk/mcp';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { getBaseUrl } from '@/features/dashboard/lib/getBaseUrl';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { IncomingMessage } from 'node:http';
import { keystoneContext } from '@/features/keystone/context';
import { permissions } from '@/features/keystone/access';
import { PUBLIC_REQUEST_ERROR, safeErrorSummary } from '@/features/dashboard/lib/security';
import { createScopedMcpFetch } from './scopedMcpFetch';

export async function POST(req: Request) {
  let mcpClient: any = null;
  let dataHasChanged = false;

  try {
    const body = await req.json();
    let messages = body.messages || [];
    const prompt = body.prompt || body.messages?.[body.messages.length - 1]?.content || '';

    const MAX_MESSAGES = 20;
    if (messages.length > MAX_MESSAGES) {
      messages = messages.slice(-MAX_MESSAGES);
    }

    let apiKey: string;
    let model: string;
    let maxTokens: number | undefined;
    const baseURL = 'https://openrouter.ai/api/v1';

    if (body.useLocalKeys === true) {
      if (typeof body.apiKey !== 'string' || !body.apiKey || typeof body.model !== 'string' || !body.model) {
        return Response.json({ error: 'Local API key and model are required.' }, { status: 400 });
      }
      apiKey = body.apiKey;
      model = body.model;
      maxTokens = body.maxTokens ? parseInt(String(body.maxTokens), 10) : undefined;
    } else {
      // Reuse Keystone's session and permissions; never accept browser-supplied shared credentials.
      // Forward only the session cookie, not bearer/API-key headers.
      const context = await keystoneContext.withRequest({
        headers: { cookie: req.headers.get('cookie') || '' },
        method: req.method,
        url: '/api/completion',
      } as IncomingMessage);
      if (!context.session?.itemId) {
        return Response.json({ error: 'Please sign in to use shared AI.' }, { status: 401 });
      }
      const dashboardPermission = Reflect.get(permissions, 'canAccessDashboard');
      // Two family members use the same role flag in dashboard middleware but
      // do not export a named helper. Preserve that existing policy there.
      const canAccessDashboard = typeof dashboardPermission === 'function'
        ? await dashboardPermission({ session: context.session })
        : context.session.data?.role?.canAccessDashboard === true;
      if (canAccessDashboard !== true) {
        return Response.json({ error: 'Dashboard access is required.' }, { status: 403 });
      }
      if (!process.env.OPENROUTER_API_KEY || !process.env.OPENROUTER_MODEL) {
        return Response.json({ error: 'Shared AI is not available.' }, { status: 503 });
      }
      apiKey = process.env.OPENROUTER_API_KEY;
      model = process.env.OPENROUTER_MODEL;
      maxTokens = process.env.OPENROUTER_MAX_TOKENS
        ? parseInt(process.env.OPENROUTER_MAX_TOKENS, 10) : 4000;
    }

    try {
      const testResponse = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        redirect: 'error',
      });
      if (!testResponse.ok) {
        console.error('AI key validation failed.');
        return Response.json({ error: 'Unable to validate AI credentials.' }, { status: 401 });
      }
    } catch (error) {
      console.error('AI key validation failed:', safeErrorSummary(error));
      return Response.json({ error: 'Unable to validate AI credentials.' }, { status: 401 });
    }

    const baseUrl = await getBaseUrl();
    const mcpEndpoint = `${baseUrl}/api/mcp-transport/http`;
    const cookie = req.headers.get('cookie') || '';

    const endpoint = new URL(mcpEndpoint);
    const transport = new StreamableHTTPClientTransport(endpoint, {
      fetch: createScopedMcpFetch(endpoint, cookie),
    });
    mcpClient = await createMCPClient({ transport });
    const aiTools = await mcpClient.tools();

    const systemInstructions = `You're an expert at converting natural language to GraphQL queries for our KeystoneJS API.

YOUR EXPERTISE:
You understand how KeystoneJS transforms models into GraphQL CRUD operations. Users will mention model names in natural language ("create a todo", "update the product"), and you need to apply the SAME transformation rules that Keystone uses to convert those user mentions into the correct API calls. When a user says "todo", you transform it the same way Keystone does: "todo" → "Todo" model → "TodoCreateInput" → "createTodo" operation.

HANDLING MODEL IDENTIFICATION:
Generally, users will say the model name directly ("todo", "product", "user"). However, they might use synonyms, typos, or related terms ("task" instead of "todo", "item" instead of "product"). In these cases, use searchModels to find the correct model that matches their intent.

YOUR TOOLS:
You have schema discovery tools (searchModels, lookupInputType, createData, updateData, deleteData) when you need to verify specifics or get exact field requirements.

ENHANCED SEARCH CAPABILITY:
You now have access to a modelSpecificSearch tool that provides intelligent search functionality similar to the dashboard. This tool:
- Automatically finds the correct model and GraphQL operation
- Performs case-insensitive searching across common text fields (name, title, description, etc.)
- Supports ID-based exact matching
- Uses the same search logic as the dashboard for consistent results

YOUR KNOWLEDGE - How Keystone generates the API from models:
- Models become {Model}CreateInput, {Model}UpdateInput, etc.
- Operations become create{Model}, update{Model}, etc.
- You apply these same rules to user's natural language

YOUR APPROACH:
- User says "Create a todo" → You know they mean the "todo" model
- User says "Create a task" → Use searchModels("task") to find it might be "Todo" model
- Apply Keystone transformation: "todo" → "createTodo" operation with "TodoCreateInput"
- Use tools to verify/get exact field structure if needed
- Execute the GraphQL mutation

You're essentially doing the same model-to-API transformation that Keystone does, but starting from the user's natural language that mentions those models.

WORKFLOW for any data request:
1. Use searchModels to find the right model/operation
2. Use getFieldsForType to discover available fields
3. For relationship fields, ALSO use getFieldsForType on the related type to see what fields are available
4. Use queryData with the discovered operation and relevant fields (including sub-selections for relationships)

WORKFLOW for searching specific data:
1. If the user wants to search for specific items (e.g., "find product with name X", "search for users containing Y"), use modelSpecificSearch directly
2. This tool handles model discovery, operation mapping, and intelligent searching automatically
3. It returns actual search results, not just schema information

WORKFLOW for creating any type of data:
1. Identify the model from user's natural language (use searchModels if unclear)
2. Apply Keystone transformation rules to get operation names
3. Use lookupInputType to get exact field structure if needed
4. Use createData to execute the mutation

WORKFLOW for updating any type of data:
1. Identify the model from user's natural language (use searchModels if unclear)
2. Apply Keystone transformation rules to get operation names (update{Model})
3. Use lookupInputType to get exact field structure for {Model}UpdateInput if needed
4. Use updateData to execute the mutation with where clause and data

WORKFLOW for deleting any type of data:
1. Identify the model from user's natural language (use searchModels if unclear)
2. Apply Keystone transformation rules to get operation names (delete{Model})
3. Use deleteData to execute the mutation with where clause

RELATIONSHIP HANDLING:
- If getFieldsForType shows a relationship field (like "productVariants" on Product), also call getFieldsForType("ProductVariant") 
- Include relationships with sub-selections: fields="id title productVariants { id name price }"
- For single relationships: fields="id name user { email name }"
- For list relationships: fields="id title variants { id name price }"

EXAMPLES:
- "List all widgets" → searchModels("widget") → getFieldsForType("Widget") → queryData(operation="widgets", fields="id name")
- "Show all gadgets" → searchModels("gadget") → getFieldsForType("Gadget") → queryData(operation="gadgets", fields="id title")
- "Find products with name Penrose" → modelSpecificSearch(modelName="Product", searchQuery="Penrose", fields="id name description")
- "Search for users with email john" → modelSpecificSearch(modelName="User", searchQuery="john", fields="id name email")
- "Find todos containing meeting" → modelSpecificSearch(modelName="Todo", searchQuery="meeting", fields="id title description status")
- "Create a widget" → searchModels("widget") → lookupInputType("WidgetCreateInput") → createData(operation="createWidget", data='{"name": "New Widget"}', fields="id name")
- "Create a gadget" → searchModels("gadget") → lookupInputType("GadgetCreateInput") → createData(operation="createGadget", data='{"title": "New Gadget"}', fields="id title")
- "Update widget with id 123" → searchModels("widget") → lookupInputType("WidgetUpdateInput") → updateData(operation="updateWidget", where='{"id": "123"}', data='{"name": "Updated Widget"}', fields="id name")
- "Delete the gadget with id 456" → searchModels("gadget") → deleteData(operation="deleteGadget", where='{"id": "456"}', fields="id title")

Always complete the full workflow and return actual data, not just schema discovery. The system works with any model type dynamically.`;

    const openrouter = createOpenRouter({ apiKey, baseURL });

    // Support both the SDK sidebar and the older content-based submission hook.
    const inputMessages = messages.length > 0
      ? messages.map((message: any, index: number) => ({
          ...message,
          id: message.id || `message-${index}`,
          parts: message.parts || [{ type: 'text', text: message.content || '' }],
        }))
      : [{ id: `prompt-${Date.now()}`, role: 'user', parts: [{ type: 'text', text: prompt }] }];

    const streamTextConfig: any = {
      model: openrouter(model),
      tools: aiTools,
      messages: await convertToModelMessages(inputMessages),
      system: systemInstructions,
      stopWhen: stepCountIs(10),
      onStepFinish: async (step: { toolCalls?: any[] }) => {
        if (step.toolCalls && step.toolCalls.length > 0) {
          for (const toolCall of step.toolCalls) {
            if (['createData', 'updateData', 'deleteData'].includes(toolCall.toolName)) {
              dataHasChanged = true;
              console.log(`CRUD operation detected: ${toolCall.toolName}`);
              break;
            }
          }
        }
      },
      onFinish: async () => {
        console.log('Completion finished successfully', { dataHasChanged });
        await mcpClient.close();
      },
      onError: async (error: unknown) => {
        console.error('Stream error occurred:', safeErrorSummary(error));
        await mcpClient.close();
      },
    };

    if (maxTokens) {
      streamTextConfig.maxOutputTokens = maxTokens;
    }

    const result = streamText(streamTextConfig);

    return result.toUIMessageStreamResponse({
      originalMessages: inputMessages,
      onError: () => PUBLIC_REQUEST_ERROR,
    });
  } catch (error) {
    if (mcpClient) {
      try {
        await mcpClient.close();
      } catch {}
    }

    console.error('Completion API Error:', safeErrorSummary(error));

    return new Response(JSON.stringify({
      error: PUBLIC_REQUEST_ERROR
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
