import React from 'react';

interface RichTextRendererProps {
  content: string;
  className?: string;
}

// This function parses inline elements like bold, italics, and links.
const parseInlineText = (text: string): React.ReactNode[] => {
  // Regex to find **bold**, *italic*, [links](url), and raw URLs
  const regex = /(\*\*(.*?)\*\*)|(\*(.*?)\*)|(\[([^\]]+)\]\(([^)]+)\))|((https?:\/\/[^\s]+))/g;
  const parts = text.split(regex);
  const nodes: React.ReactNode[] = [];
  let i = 0;

  for (let part of parts) {
    if (!part) continue;

    // Check against the matched parts from the regex
    if (part.startsWith('**') && part.endsWith('**')) {
      nodes.push(<strong key={i}>{part.slice(2, -2)}</strong>);
    } else if (part.startsWith('*') && part.endsWith('*')) {
      nodes.push(<em key={i}>{part.slice(1, -1)}</em>);
    } else if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
      const match = /\[([^\]]+)\]\(([^)]+)\)/.exec(part);
      if (match) {
        nodes.push(<a href={match[2]} key={i} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">{match[1]}</a>);
      }
    } else if (part.startsWith('http')) {
        nodes.push(<a href={part} key={i} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">{part}</a>);
    } 
    else {
      nodes.push(part);
    }
    i++;
  }
  return nodes;
};


const RichTextRenderer: React.FC<RichTextRendererProps> = ({ content, className = '' }) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(<ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-1 my-2 pl-4">{listItems}</ul>);
      listItems = [];
    }
  };

  lines.forEach((line, index) => {
    if (line.trim().startsWith('# ')) {
      flushList();
      elements.push(<h2 key={index} className="text-xl font-bold mt-4 mb-2">{parseInlineText(line.substring(2))}</h2>);
    } else if (line.trim().startsWith('* ')) {
      listItems.push(<li key={index}>{parseInlineText(line.substring(2))}</li>);
    } else if (line.trim() === '') {
      flushList();
      elements.push(<div key={index} className="h-4" />); // Represents a paragraph break
    } else {
      flushList();
      elements.push(<p key={index}>{parseInlineText(line)}</p>);
    }
  });

  flushList(); // Ensure any trailing list gets rendered

  return (
    <div className={`prose dark:prose-invert max-w-none text-sm text-gray-600 dark:text-gray-400 ${className}`}>
      {elements}
    </div>
  );
};

export default RichTextRenderer;
