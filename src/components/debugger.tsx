'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DebuggerProps {
  data: any;
  title?: string;
}

export default function Debugger({ data, title = 'Debug Data' }: DebuggerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="my-4 border-dashed border-yellow-400 bg-yellow-50">
      <CardHeader className="py-3 bg-yellow-100 border-b border-yellow-200">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium text-yellow-800">{title}</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 px-2 text-xs border-yellow-300 text-yellow-700 hover:bg-yellow-200"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="p-3">
          <pre className="text-xs overflow-auto max-h-96 p-2 bg-yellow-100 rounded">
            {JSON.stringify(data, null, 2)}
          </pre>
        </CardContent>
      )}
    </Card>
  );
} 