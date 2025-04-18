import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AnswerDisplayProps {
  answer: string;
  sources: string[];
}

export default function AnswerDisplay({ answer, sources }: AnswerDisplayProps) {
  // Function to format the answer with proper paragraphs
  const formatAnswer = (text: string) => {
    return text.split('\n').map((paragraph, index) => (
      paragraph.trim() ? <p key={index} className="mb-4">{paragraph}</p> : null
    ));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Answer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose max-w-none">
          {formatAnswer(answer)}
        </div>
        
        {sources && sources.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium mb-2">Sources:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {sources.map((source, index) => (
                <li key={index}>{source}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}