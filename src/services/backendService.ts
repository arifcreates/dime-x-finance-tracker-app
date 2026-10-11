import { supabase, supabaseConfigured } from '../lib/supabase';

export async function callBackend<T>(name: string, body: Record<string,unknown>): Promise<T> {
  if(!supabaseConfigured) throw new Error('The backend has not been configured.');
  const {data:{session}}=await supabase.auth.getSession();
  if(!session) throw new Error('Create an account and sign in to use this feature.');
  const {data,error}=await supabase.functions.invoke(name,{body});
  if(error) {
    const context=(error as {context?:Response}).context;
    let message=error.message;
    if(context) { try { const result=await context.json(); message=result.error || message; } catch { /* Keep transport error. */ } }
    throw new Error(message);
  }
  if(data?.error) throw new Error(data.error);
  return data as T;
}
