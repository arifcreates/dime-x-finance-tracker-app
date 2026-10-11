import { HttpError } from './http.ts';

type ProviderOptions = { fetcher?: typeof fetch; timeoutSignal?: (ms: number) => AbortSignal };

// Draft generation is read-only: one transient retry cannot duplicate a saved invoice.
// Keep the combined 90-second provider budget below the hosted function limit.
export async function requestAIDraft(url: URL, apiKey: string, payload: Record<string,unknown>, options: ProviderOptions = {}) {
  const fetcher=options.fetcher || fetch;
  const timeoutSignal=options.timeoutSignal || AbortSignal.timeout;
  const budgets=[30000,60000];
  for(let attempt=0;attempt<budgets.length;attempt++) {
    const started=Date.now();
    try {
      const response=await fetcher(url,{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(payload),signal:timeoutSignal(budgets[attempt])});
      if(response.status===401 || response.status===403) throw new HttpError('The AI provider rejected the credentials. Check the backend API key and model access.',503);
      if(response.status===429) throw new HttpError('The free AI endpoint is rate-limited. Wait a minute before trying again.',429);
      if(!response.ok) {
        console.warn(JSON.stringify({event:'ai_provider_response',model:payload.model,attempt:attempt+1,status:response.status,durationMs:Date.now()-started}));
        await response.body?.cancel();
        if([500,502,503,504].includes(response.status) && attempt===0) continue;
        throw new HttpError('The AI provider is temporarily unavailable. Please try again later.',502);
      }
      const result=await response.json();
      const message=result.choices?.[0];
      if(message?.finish_reason==='length') throw new HttpError('The AI draft was too long. Try a shorter work description with fewer items.',502);
      const content=message?.message?.content;
      if(typeof content!=='string' || content.length>12000) throw new HttpError('The AI provider returned an invalid draft. Please try again.',502);
      console.info(JSON.stringify({event:'ai_provider_complete',model:payload.model,attempt:attempt+1,durationMs:Date.now()-started}));
      return content;
    } catch(error) {
      const timeout=error instanceof Error && ['TimeoutError','AbortError'].includes(error.name);
      const network=error instanceof TypeError;
      if(!timeout && !network) throw error;
      console.warn(JSON.stringify({event:'ai_provider_connection',model:payload.model,attempt:attempt+1,reason:timeout?'timeout':'network',durationMs:Date.now()-started}));
      if(attempt===0) continue;
      throw new HttpError(timeout?'The AI provider did not respond after two attempts. Please wait a minute and try again.':'Could not connect to the AI provider. Please try again later.',timeout?504:502);
    }
  }
  throw new HttpError('The AI provider is unavailable.',502);
}
