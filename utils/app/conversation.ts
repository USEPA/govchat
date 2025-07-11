import { Conversation, Message } from '@/types/chat';

export const updateConversation = (
  updatedConversation: Conversation,
  allConversations: Conversation[],
) => {
  const updatedConversations = allConversations.map((c) => {
    if (c.id === updatedConversation.id) {
      return updatedConversation;
    }

    return c;
  });

  saveConversation(updatedConversation);
  saveConversations(updatedConversations);

  return {
    single: updatedConversation,
    all: updatedConversations,
  };
};

export const saveConversation = (conversation: Conversation) => {

  var allMessages = '';
  conversation.characterLength = 0;

  for (let i = 0; i < conversation.messages.length; i++) {
    //console.log("SelectedConversation.message[" + i + "]: " + conversation.messages[i].content);
    allMessages += conversation.messages[i].content + ' ';
  }

  conversation.characterLength = allMessages.length;
  localStorage.setItem('selectedConversation', JSON.stringify(conversation));

};

export const saveConversations = (conversations: Conversation[]) => {
  localStorage.setItem('conversationHistory', JSON.stringify(conversations));
};

export const setFileUploadText = (message: Message) => {
  var uploadMessage = "";
  try{ //if there is a file upload, add the file name to the message content
    const fileName = JSON.parse(message.content)
      .filter((part: { type: string; }) => part.type === 'file')
      .map((part: { file: { filename: string, file_data: string; }; }) => part.file.filename);  // [0]

    if (fileName && fileName.length > 0) {
      uploadMessage = `New File Attached: ${fileName}`;
    }
  }
  catch (error) {}    
  
  return uploadMessage;
}

export const filterMessageText = (message: Message) => {
  var newMessage = { ...message };
 
  try{
    newMessage.content = JSON.parse(newMessage.content)
      .filter((part: { type: string; }) => part.type === 'text')[0].text;
  }
  catch (error) {}

  return newMessage;
}