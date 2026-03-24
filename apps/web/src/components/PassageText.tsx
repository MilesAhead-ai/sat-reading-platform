interface PassageTextProps {
  text: string;
  startLine?: number;
}

export default function PassageText({ text, startLine = 1 }: PassageTextProps) {
  const lines = text.split('\n');
  const totalLines = startLine + lines.length - 1;
  const showLineNumbers = totalLines >= 5;

  return (
    <div className="text-sm leading-7 text-gray-700">
      {lines.map((line, i) => {
        const lineNum = startLine + i;
        const showNumber = showLineNumbers && (lineNum === 1 || lineNum % 5 === 0);
        return (
          <div key={i} className="flex">
            {showLineNumbers && (
              <span className="w-8 shrink-0 text-right pr-3 select-none text-xs leading-7 text-gray-300">
                {showNumber ? lineNum : ''}
              </span>
            )}
            <span className="flex-1 whitespace-pre-wrap">{line || '\u00A0'}</span>
          </div>
        );
      })}
    </div>
  );
}
