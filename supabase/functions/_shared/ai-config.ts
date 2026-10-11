export const DEFAULT_AI_MODEL = 'nvidia/nemotron-3.5-lightning-30b-a3b';
export const DEFAULT_AI_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

export function aiConfiguration(email: string | undefined) {
  const get = (name: string) => Deno.env.get(name)?.trim() || '';
  const approved = get('AI_PRODUCTION_APPROVED') === 'true';
  const mode = get('AI_MODE') || (approved ? 'production' : 'prototype');
  const model = get('AI_MODEL') || DEFAULT_AI_MODEL;
  const url = get('AI_API_URL') || DEFAULT_AI_URL;
  const testers = get('AI_PROTOTYPE_EMAILS').split(',').map(value=>value.trim().toLowerCase()).filter(Boolean);
  const prototype = mode === 'prototype';
  const allowed = prototype ? !!email && testers.includes(email.toLowerCase()) : mode === 'production' && approved;
  const ready = allowed && !!get('AI_API_KEY');
  const message = ready
    ? prototype ? 'Internal prototype: use fictional examples only. Review every draft.' : 'AI drafting is ready. Review every draft.'
    : prototype && !allowed
      ? 'AI testing is limited to configured tester accounts. The platform owner needs to add your sign-in email to the testing list.'
      : !get('AI_API_KEY')
        ? 'The AI provider key has not been configured yet. The platform owner needs to finish connecting NVIDIA.'
        : 'AI drafting has not been activated for this environment.';
  return { ready, mode, prototype, model, url, message };
}
