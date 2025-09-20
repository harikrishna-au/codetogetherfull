import React, { useState, useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';

interface UserProgressProps {
  userId?: string;
  className?: string;
}

interface UserProgressData {
  completionMatrix: boolean[];
  totalCompleted: number;
  totalQuestions: number;
}

const UserProgress: React.FC<UserProgressProps> = ({ userId, className = '' }) => {
  const [progressData, setProgressData] = useState<UserProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const fetchUserProgress = () => {
      socket.emit('getUserProgress', (response: any) => {
        if (response.success) {
          setProgressData({
            completionMatrix: response.completionMatrix,
            totalCompleted: response.totalCompleted,
            totalQuestions: response.totalQuestions
          });
        } else {
          console.error('Failed to fetch user progress:', response.error);
        }
        setLoading(false);
      });
    };

    fetchUserProgress();

    // Listen for question completion updates
    const handleQuestionCompleted = (data: any) => {
      if (data.userId === userId) {
        // Refresh progress data
        fetchUserProgress();
      }
    };

    socket.on('questionCompleted', handleQuestionCompleted);

    return () => {
      socket.off('questionCompleted', handleQuestionCompleted);
    };
  }, [socket, userId]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading progress...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!progressData) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-gray-500">No progress data available</div>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = progressData.totalQuestions > 0 
    ? (progressData.totalCompleted / progressData.totalQuestions) * 100 
    : 0;

  // Group matrix into rows of 10 for better display
  const matrixRows = [];
  for (let i = 0; i < progressData.completionMatrix.length; i += 10) {
    matrixRows.push(progressData.completionMatrix.slice(i, i + 10));
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Progress</span>
          <Badge variant="outline">
            {progressData.totalCompleted}/{progressData.totalQuestions}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Questions Completed</span>
            <span>{progressPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-2">Question Matrix</h4>
          <div className="space-y-1">
            {matrixRows.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-1">
                {row.map((completed, colIndex) => {
                  const questionIndex = rowIndex * 10 + colIndex;
                  return (
                    <div
                      key={questionIndex}
                      className={`w-6 h-6 rounded flex items-center justify-center text-xs ${
                        completed 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-200 text-gray-600 border'
                      }`}
                      title={`Question ${questionIndex + 1}: ${completed ? 'Completed' : 'Not completed'}`}
                    >
                      {completed ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <Circle className="w-3 h-3" />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          {matrixRows.length === 0 && (
            <div className="text-sm text-gray-500">No questions available</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserProgress;
