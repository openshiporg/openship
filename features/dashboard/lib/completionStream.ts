export type CompletionEvent =
  | { type: 'text'; text: string }
  | { type: 'changed' }
  | { type: 'error' };

/** Decode both AI SDK UI-message SSE and the legacy data stream incrementally. */
export async function* readCompletionEvents(
  stream: ReadableStream<Uint8Array>
): AsyncGenerator<CompletionEvent> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  const mutationCalls = new Set<string>();
  let pending = '';

  function parse(line: string): CompletionEvent | undefined {
    if (!line.trim() || line.startsWith(':')) return;
    if (line.startsWith('data:')) {
      const payload = line.slice(5).trim();
      if (payload === '[DONE]') return;
      const data = JSON.parse(payload);
      if (data.type === 'text-delta' && typeof data.delta === 'string') return { type: 'text', text: data.delta };
      if (data.type === 'error') return { type: 'error' };
      if (data.type === 'tool-input-available' && ['createData', 'updateData', 'deleteData'].includes(data.toolName)) {
        mutationCalls.add(data.toolCallId);
      }
      if (data.type === 'tool-output-available' && mutationCalls.has(data.toolCallId)) return { type: 'changed' };
    } else if (line.startsWith('0:')) {
      const text = JSON.parse(line.slice(2));
      if (typeof text === 'string') return { type: 'text', text };
    } else if (line.startsWith('3:')) {
      return { type: 'error' };
    } else if (line.startsWith('9:') && JSON.parse(line.slice(2)).dataHasChanged) {
      return { type: 'changed' };
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      pending += done ? decoder.decode() : decoder.decode(value, { stream: true });
      const lines = pending.split('\n');
      pending = lines.pop() || '';
      for (const line of lines) {
        const event = parse(line.replace(/\r$/, ''));
        if (event) yield event;
      }
      if (done) {
        if (pending) {
          const event = parse(pending);
          if (event) yield event;
        }
        break;
      }
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
