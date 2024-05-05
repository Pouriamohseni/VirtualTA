'use server';
import fetch from 'node-fetch';

const BASE_URL = 'http://127.0.0.1:37821';

export const generateRasaResponse = async (message, user_id, thread_id) => {
  try {
    const response = await fetch(`${BASE_URL}/webhooks/rest/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        'message': message, 
        'user_id': user_id,
        'sender': thread_id 
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data; // Return the response data
  } catch (error) {
    console.error('Error generating Rasa response:', error);
    throw error; // Rethrow the error to be handled by the caller
  }
};

export const flagMessage = async (messageId) => {
  try {
    const response = await fetch(`${BASE_URL}/api/flag_message/${messageId}`, {
      method: 'PUT'
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data; // Return the response data
  } catch (error) {
    console.error('Error flagging message:', error);
    throw error; // Rethrow the error to be handled by the caller
  }
};

export const unflagMessage = async (messageId) => {
  try {
    const response = await fetch(`${BASE_URL}/api/unflag_message/${messageId}`, {
      method: 'PUT'
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data; // Return the response data
  } catch (error) {
    console.error('Error flagging message:', error);
    throw error; // Rethrow the error to be handled by the caller
  }
};

export const getUserId = async () => {
  return 'new-test';
}

export const getUserThreads = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}/api/threads/get-threads-with-preview/${userId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // Map the response data to the desired format
    const formattedData = data.map(thread => ({
      href: `/rasa?thread=${thread.thread_id}`,
      label: thread.first_message_preview,
      threadId: thread.thread_id,
      created: thread.created
    }));

    return formattedData; // Return the formatted response data
  } catch (error) {
    console.error('Error fetching user threads:', error);
    return []; // Return an empty array in case of an error
  }
};


export const getThreadMessages = async (threadId) => {
  try {
    const response = await fetch(`${BASE_URL}/api/threads/${threadId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data
  } catch (error) {
    console.error('Error fetching thread messages:', error);
    return []; // Return an empty array in case of an error
  }
};