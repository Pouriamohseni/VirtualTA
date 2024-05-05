'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation'; 
import toast from 'react-hot-toast';
import useSpeechToText from 'react-hook-speech-to-text';

import { generateRasaResponse, flagMessage, unflagMessage, getUserId, getThreadMessages } from '../utils/rasaapi';

const Chat = ({ threadId: initialThreadId }) => {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const [userId, setUserId] = useState(null); // State to store the fetched user ID
  const [threadId, setThreadId] = useState(initialThreadId);  // State to store the current thread ID; Starts as null then gets populated after the first response
  const [lastConcatResult, setLastConcatResult] = useState(''); // State to store the last concatenated result
  const [currentTranscript, setCurrentTranscript] = useState('');  // This will store the ongoing transcript
  const {
    error,
    interimResult,
    isRecording,
    results,
    startSpeechToText,
    stopSpeechToText,
  } = useSpeechToText({ continuous: true, useLegacyResults: false });


  const handleClick = () => {
    console.log('Handling click, isRecording:', isRecording);
    if (isRecording) {
      stopSpeechToText();
      console.log('Stopped speech to text.');
  
      // Capture the entire transcription up to this point
      const fullContent = currentTranscript; // Use currentTranscript that's been updated in real-time
      console.log('Full transcript content:', fullContent);
  
      // Compute the new content that hasn't been added yet
      const newContent = fullContent.substring(lastConcatResult.length);
      console.log('New content to add:', newContent);
  
      setText(newContent); // Set the new content directly into the text input
      setLastConcatResult(fullContent); // Update the lastConcatResult to the latest full content
  
      // Optional: Reset currentTranscript here if you are duplicating full content update
    } else {
      console.log('Starting speech to text.');
      startSpeechToText();
      setLastConcatResult(currentTranscript); // Set lastConcatResult to currentTranscript for a fresh start
      console.log('Last concat result set for new session:', currentTranscript);
    }
  };
  

  useEffect(() => {
    if (isRecording) {
      const ongoingTranscript = results.map((result) => result.transcript).join(' ');
      setCurrentTranscript(ongoingTranscript);
      console.log('Updated ongoing transcript:', ongoingTranscript);
    }
  }, [results, isRecording]);
  
  
  const { mutate, isPending } = useMutation({
    mutationFn: async (query) => {
      const data = await generateRasaResponse(query.content, userId, threadId);
      if (Array.isArray(data) && data.length > 0 && data[0].text) {
        return {
          role: 'bot',
          content: data[0].text,
          responseId: data[0].response_message_id,
          threadId: data[0].thread_id
        };
      } else {
        throw new Error('Invalid response format from Rasa API');
      }
    },
    onSuccess: (data) => {
      if (data) {
        setThreadId(data.threadId);
        setMessages(prev => [...prev, data]);
      } else {
        toast.error('Something went wrong!');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'An error occurred');
    }
  });

  const toggleFlag = async (messageId, isFlagged) => {
    try {
      if (isFlagged) {
        await unflagMessage(messageId);
        toast.success('Message unflagged successfully');
      } else {
        await flagMessage(messageId);
        toast.success('Message flagged successfully');
      }
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.responseId === messageId ? { ...msg, flagged: !isFlagged } : msg
        )
      );
    } catch (error) {
      toast.error('Error toggling flag: ' + error.message);
    }
  };

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const fetchedUserID = await getUserId();
        setUserId(fetchedUserID);
      } catch (error) {
        toast.error('Failed to fetch user ID: ' + error.message);
      }
    };

    fetchUserId();
  }, []);

  useEffect(() => {
    if (initialThreadId) {
      const loadThreadMessages = async () => {
        try {
          const threadMessages = await getThreadMessages(initialThreadId);
          const formattedMessages = threadMessages.map(msg => ({
            role: msg.side === 'user' ? 'user' : 'bot',
            content: msg.message_content,
            responseId: msg.message_id,
            flagged: msg.flagged
          }));
          setMessages(formattedMessages);
          setThreadId(initialThreadId);
        } catch (error) {
          toast.error('Failed to load conversation history: ' + error.message);
        }
      };

      loadThreadMessages();
    }
  }, [initialThreadId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userId) {
      toast.error('User ID not available. Please wait.');
      return;
    }
    const query = { role: 'user', content: text };
    mutate(query);
    setMessages(prev => [...prev, query]);
    setText('');
  };

  const exportConversation = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `conversation_${timestamp}.json`;
    const jsonContent = JSON.stringify(messages, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] grid grid-rows-[1fr,auto]">
      {messages.length > 0 && (
        <button
          className="btn m-4 text-white"
          style={{ backgroundColor: 'rgb(15, 23, 42)' }}
          onClick={exportConversation}
        >
          Export Conversation
        </button>
      )}
      <div>
        {messages.map(({ role, content, responseId, flagged }, index) => {
          const urlRegex = /(https?:\/\/[^\s]+)/g;
          const parts = content.split(urlRegex);
          return (
            <div
              key={index}
              className={`${
                role === 'user' ? 'bg-base-300' : 'bg-base-100'
              } flex items-center py-6 -mx-8 px-8 text-xl leading-loose border-b border-base-300`}
            >
              <span className="mr-4">{role === 'user' ? '🧑‍🎓' : '🤖'}: </span>
              <div className="max-w-3xl flex-grow">
                {parts.map((part, partIndex) => {
                  if (part.match(urlRegex)) {
                    return (
                      <a
                        key={partIndex}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500"
                        style={{
                          transition: 'transform 0.2s',
                          display: 'inline-block',
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.02)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1)';
                        }}
                      >
                        {part}
                      </a>
                    );
                  } else {
                    return <span key={partIndex}>{part}</span>;
                  }
                })}
              </div>
              {role === 'bot' && (
                <div className="flex items-center ml-auto">
                  <button
                    className={`btn text-xs ${
                      flagged ? 'bg-gray-500' : 'bg-red-500'
                    } text-white`}
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => toggleFlag(responseId, flagged)}
                  >
                    {flagged ? 'Unflag Message' : 'Flag Message'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {isPending && <span className="loading text-base-300">Sending...</span>}
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl pt-12">
        <div className="join w-full">
          <input
            type="text"
            placeholder="Message Virtual TA"
            className="input input-bordered join-item w-full text-white focus:outline-none bg-slate-900"
            value={text}
            required
            onChange={(e) => setText(e.target.value)}
            id="message-input"
          />
          <button
            className="btn bg-green-500 join-item text-white"
            type="submit"
            disabled={isPending}
          >
            {isPending ? 'Please wait...' : 'Ask away!'}
          </button>
          <button
            className={`btn join-item text-white ${
              isRecording ? 'bg-gray-500' : 'bg-blue-500'
            }`}
            type="button"
            onClick={handleClick}
            disabled={isPending}
          >
            {isRecording ? 'Stop Recording' : '🎤 Record'}
          </button>
          <ul style={{ display: 'none' }}>
              {results.map((result) => (
                <li key={result.timestamp}>{result.transcript}</li>
              ))}
              {interimResult && <li>{interimResult}</li>}
            </ul>
          {error && (
            <p className="text-white-500">Unsupported Browser for Microphone input</p>
          )}
        </div>
      </form>
    </div>
  );
};

export default Chat;