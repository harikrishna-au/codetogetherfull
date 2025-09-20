import { useEffect, useState } from 'react';

export function useNextQuestionId() {
  const [nextId, setNextId] = useState('');

  useEffect(() => {
    async function fetchNextId() {
      try {
        const res = await fetch('/admin-api/admin/next-question-id');
        const data = await res.json();
        setNextId(data.nextId || 'q1');
      } catch {
        setNextId('q1');
      }
    }
    fetchNextId();
  }, []);

  return nextId;
}
