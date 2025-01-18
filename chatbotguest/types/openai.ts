export interface OpenAIModel {
  id: string;
  name: string;
  maxLength: number; // maximum length of a message
  tokenLimit: number;
}

export enum OpenAIModelID {
  GPT_3_5 = 'GPTPhat',
  // GPT_4 = 'gpt-4',
}

// in case the `DEFAULT_MODEL` environment variable is not set or set to an unsupported model
export const fallbackModelID = OpenAIModelID.GPT_3_5;

export const OpenAIModels: Record<OpenAIModelID, OpenAIModel> = {
  [OpenAIModelID.GPT_3_5]: {
    id: OpenAIModelID.GPT_3_5,
    name: 'GPTPhat',
    maxLength: 1024,
    tokenLimit: 4096,
  },
  // [OpenAIModelID.GPT_4]: {
  //   id: OpenAIModelID.GPT_4,
  //   name: 'GPT-4',
  //   maxLength: 24000,
  //   tokenLimit: 8000,
  // },
};
