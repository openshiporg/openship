import { streamText, experimental_createMCPClient } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { getBaseUrl } from '@/features/dashboard/lib/getBaseUrl';
import { StreamableHTTPClientTransport, StreamableHTTPClientTransportOptions } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

// Cookie-aware transport that properly handles cookie forwarding
class CookieAwareTransport extends StreamableHTTPClientTransport {
  private cookies: string[] = [];
  private originalFetch: typeof fetch;

  constructor(url: URL, opts?: StreamableHTTPClientTransportOptions, cookies?: string) {
    super(url, opts);
    
    this.originalFetch = global.fetch;
    
    // Set initial cookies if provided
    if (cookies) {
      this.cookies = [cookies];
    }
    
    // Override global fetch to include cookies
    global.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      init = init || {};
      const headers = new Headers(init.headers);
      
      if (this.cookies.length > 0) {
        headers.set('Cookie', this.cookies.join('; '));
      }
      
      init.headers = headers;
      
      const response = await this.originalFetch(input, init);
      
      // Store any new cookies from response
      const setCookieHeader = response.headers.get('set-cookie');
      if (setCookieHeader) {
        const newCookies = setCookieHeader.split(',').map(cookie => cookie.trim());
        this.cookies = [...this.cookies, ...newCookies];
      }
      
      return response;
    };
  }
  
  async close(): Promise<void> {
    // Restore original fetch
    global.fetch = this.originalFetch;
    this.cookies = [];
    await super.close();
  }
}

// OpenRouter configuration - will be set from request body

export async function POST(req: Request) {
  let mcpClient: any = null;
  let dataHasChanged = false;
  
  try {
    const body = await req.json();
    let messages = body.messages || [];
    const prompt = body.prompt || body.messages?.[body.messages.length - 1]?.content || '';
    
    // Trim messages if conversation is too long (keep system context by preserving recent messages)
    const MAX_MESSAGES = 20; // Keep last 20 messages for context
    if (messages.length > MAX_MESSAGES) {
      messages = messages.slice(-MAX_MESSAGES);
    }
    
    
    // Require API key to be provided in request
    if (!body.useLocalKeys || !body.apiKey) {
      return new Response(JSON.stringify({ 
        error: 'API key is required',
        details: 'API key must be provided in request body'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const openrouterConfig = {
      apiKey: body.apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
    };

    // Get dynamic base URL
    const baseUrl = await getBaseUrl();
    const mcpEndpoint = `${baseUrl}/api/mcp-transport/http`;
    
    const cookie = req.headers.get('cookie') || '';

    // Create MCP client
    const transport = new CookieAwareTransport(
      new URL(mcpEndpoint),
      {},
      cookie
    );
    
    mcpClient = await experimental_createMCPClient({
      transport,
    });
    
    const aiTools = await mcpClient.tools();
    
    // Create OpenRouter client with current configuration
    const openrouter = createOpenAI(openrouterConfig);
    
    // Require model to be provided in request
    if (!body.model) {
      return new Response(JSON.stringify({ 
        error: 'Model is required',
        details: 'Model must be provided in request body'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const model = body.model;
    const maxTokens = body.maxTokens ? parseInt(body.maxTokens) : undefined;
    
    // Debug logging
    console.log('Starting completion request:', {
      model,
      maxTokens,
      hasApiKey: !!openrouterConfig.apiKey,
      apiKeyPrefix: openrouterConfig.apiKey?.substring(0, 10) + '...'
    });

    // Test the API key with a simple request first to catch auth errors early
    try {
      const testResponse = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${openrouterConfig.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!testResponse.ok) {
        const errorText = await testResponse.text();
        console.log('API key validation failed:', errorText);
        
        let errorMessage = 'Invalid API key';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson?.error?.message || errorMessage;
        } catch {
          // Failed to parse error, use default message
        }
        
        return new Response(JSON.stringify({ 
          error: 'Authentication Error',
          details: errorMessage
        }), { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (validationError) {
      console.error('API key validation error:', validationError);
      return new Response(JSON.stringify({ 
        error: 'Authentication Error',
        details: 'Failed to validate API key'
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
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

    const streamTextConfig: any = {
      model: openrouter(model),
      tools: aiTools,
      messages: messages.length > 0 ? messages : [{ role: 'user', content: prompt }],
      system: systemInstructions,
      maxSteps: 10,
      onStepFinish: async (step: { toolCalls?: any[]; toolResults?: any[]; finishReason?: string; usage?: any; text?: string; }) => {
        // Track if any CRUD operations were called
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
      onFinish: async (result: { text: string; finishReason: string; usage: any; response: any }) => {
        console.log('Completion finished successfully');
        // Send data change notification through the stream
        if (dataHasChanged) {
          console.log('Sending data change notification');
          // We'll append this as a special message at the end
        }
        await mcpClient.close();
      },
      onError: async (error: unknown) => {
        console.error('Stream error occurred:', error);
        await mcpClient.close();
      },
    };
    
    // Add maxTokens only if specified
    if (maxTokens) {
      streamTextConfig.maxTokens = maxTokens;
    }
    
    const response = streamText(streamTextConfig);
    
    // Create a custom stream that includes our data change notification
    const stream = response.toDataStream();
    const reader = stream.getReader();
    
    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                // Before ending the stream, send data change notification if needed
                if (dataHasChanged) {
                  console.log('Sending data change notification through stream');
                  const dataChangeMessage = `9:{"dataHasChanged":true}\n`;
                  controller.enqueue(new TextEncoder().encode(dataChangeMessage));
                }
                controller.close();
                break;
              }
              
              controller.enqueue(value);
            }
          } catch (error) {
            controller.error(error);
          }
        }
      }),
      {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        }
      }
    );
  } catch (error) {
    // Clean up MCP client if it was created
    if (mcpClient) {
      try {
        await mcpClient.close();
      } catch (closeError) {}
    }
    
    // Log the full error for debugging
    console.error('Completion API Error:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      details: error
    });
    
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : String(error)
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}