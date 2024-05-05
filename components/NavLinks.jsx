'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getUserId, getUserThreads, getThreadMessages } from '../utils/rasaapi';
import { isUserAdmin } from '../utils/admin';
import downloadIcon from './material-ui/download-icon.png';

const NavLinks = () => {
  const [userId, setUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [threadLinks, setThreadLinks] = useState([]);
  const [links, setLinks] = useState([
    { href: '/rasa', label: 'chat' },
  ]);
  const [adminLinks, setAdminLinks] = useState([
    { href: '/admin-main', label: '(Admin) Main' },
    { href: '/admin-config', label: '(Admin) Server Config' },
    { href: '/admin-chat-logs', label: '(Admin) Chat Logs' },
    { href: '/admin-event-logs', label: '(Admin) Event Logs' },
    { href: '/admin-session-management', label: '(Admin) Session Management' },
  ]);

  useEffect(() => {
    async function fetchUserData() {
      const fetchedUserId = await getUserId();
      setUserId(fetchedUserId);
      const adminStatus = await isUserAdmin(fetchedUserId);
      setIsAdmin(adminStatus);

      const userThreads = await getUserThreads(fetchedUserId);
      const sortedThreads = userThreads.sort((a, b) => new Date(b.created) - new Date(a.created));
      setThreadLinks(sortedThreads);
    }

    fetchUserData();
  }, []);

  const parseDate = dateString => {
    // Ensure the dateString is valid and in the expected format
    if (!dateString || typeof dateString !== 'string' || !dateString.endsWith('GMT')) {
      console.error('Invalid or unexpected date format:', dateString);
      return null;  // Return null to indicate an unparseable date
    }
  
    // Replace commas and convert GMT to UTC (Z) for consistent parsing across environments
    const formattedDateString = dateString.replace(/,/g, '').replace(/(\d{2}:\d{2}:\d{2}) GMT/, '$1Z');
    return new Date(formattedDateString);
  };
  
  const categorizeThreads = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const last7Days = new Date(today.getTime() - 86400000 * 6); // From 7 days ago including today
  
    return threadLinks.reduce((acc, thread) => {
      const createdDate = parseDate(thread.created);
  
      // Skip threads if the date couldn't be parsed
      if (!createdDate) {
        return acc;
      }
  
      if (createdDate >= today) {
        acc.today.push(thread);
      } else if (createdDate >= yesterday && createdDate < today) {
        acc.yesterday.push(thread);
      } else if (createdDate >= last7Days && createdDate < yesterday) {
        acc.last7Days.push(thread);
      } else {
        acc.older.push(thread);
      }
      return acc;
    }, { today: [], yesterday: [], last7Days: [], older: [] });
  };

  const exportConversation = async (threadId) => {
    try {
      const messages = await getThreadMessages(threadId);
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        const timestamp = new Date(lastMessage.timestamp).toISOString().replace(/[:.]/g, '-');
        const fileName = `conversation_${timestamp}.json`;
        const jsonBlob = new Blob([JSON.stringify(messages, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(jsonBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(link);
      } else {
        console.error("No messages found for threadId:", threadId);
      }
    } catch (error) {
      console.error("Error fetching thread messages:", error);
    }
  };

  const categorizedThreads = categorizeThreads();

  return (
    <ul className="menu text-base-content">
      {links.map((link) => (
        <li key={link.href}>
          <Link href={link.href} className="capitalize text-white hover:bg-orange-500">
            {link.label}
          </Link>
        </li>
      ))}

      {isAdmin && (
        <>
          <br />
          <p>Admin</p>
          {adminLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="capitalize text-white hover:bg-orange-500">
                {link.label}
              </Link>
            </li>
          ))}
        </>
      )}

      <br />
      <p>Threads</p>
      <ul>
        {['today', 'yesterday', 'last7Days', 'older'].map(section => (
          categorizedThreads[section].length > 0 && (
            <li key={section}>
              <p className="capitalize">{section}</p>
              <ul> {/* Ensure this is a nested list */}
                {categorizedThreads[section].map((link) => (
                  <li key={link.thread_id} className="relative"> {/* Adjusted key to use thread_id and fixed nesting */}
                    <Link href={link.href} className="capitalize text-white hover:bg-orange-500">
                      {link.label}
                    </Link>
                    <img
                      src={downloadIcon}
                      alt="Export"
                      className="cursor-pointer hover:opacity-100 opacity-0 transition-opacity"
                      style={{ position: 'absolute', right: '5px' }}
                      onClick={() => exportConversation(link.threadId)}
                    />
                  </li>
                ))}
              </ul>
            </li>
          )
        ))}
      </ul>

    </ul>
  );
};

export default NavLinks;
