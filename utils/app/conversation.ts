import { Conversation } from '@/types/chat';
import { getTokenLength } from '@/utils/app/tokens';

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

  console.log("SelectedConversation.characterLength: " + conversation.characterLength);

  localStorage.setItem('selectedConversation', JSON.stringify(conversation));

};

export const saveConversations = (conversations: Conversation[]) => {
  localStorage.setItem('conversationHistory', JSON.stringify(conversations));
};
