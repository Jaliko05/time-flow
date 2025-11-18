// This file is deprecated - Base44 integrations are no longer available
// The new Go API doesn't include Base44 integration features (LLM, Email, File uploads)
// If these features are needed, they must be implemented separately

// For now, export empty stubs to prevent import errors
export const Core = {
  InvokeLLM: () => { throw new Error('Base44 integrations no longer available'); },
  SendEmail: () => { throw new Error('Base44 integrations no longer available'); },
  UploadFile: () => { throw new Error('Base44 integrations no longer available'); },
  GenerateImage: () => { throw new Error('Base44 integrations no longer available'); },
  ExtractDataFromUploadedFile: () => { throw new Error('Base44 integrations no longer available'); },
  CreateFileSignedUrl: () => { throw new Error('Base44 integrations no longer available'); },
  UploadPrivateFile: () => { throw new Error('Base44 integrations no longer available'); },
};

export const InvokeLLM = Core.InvokeLLM;
export const SendEmail = Core.SendEmail;
export const UploadFile = Core.UploadFile;
export const GenerateImage = Core.GenerateImage;
export const ExtractDataFromUploadedFile = Core.ExtractDataFromUploadedFile;
export const CreateFileSignedUrl = Core.CreateFileSignedUrl;
export const UploadPrivateFile = Core.UploadPrivateFile;






