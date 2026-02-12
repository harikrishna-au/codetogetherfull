import { useEffect, useState } from 'react';
import { api } from '../api';

export function useNextQuestionId() {
  const [nextId, setNextId] = useState('');

  useEffect(() => {
    async function fetchNextId() {
      try {
        const nextId = await api.questions.getNextId();
        setNextId(nextId);
      } catch (err) {
        console.error('Failed to fetch next question ID:', err);
        setNextId('q1');
      }
    }
    fetchNextId();
  }, []);

  return nextId;
}
